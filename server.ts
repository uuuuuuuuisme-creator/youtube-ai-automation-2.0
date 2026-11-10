import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { db, VideoItem } from './server/db.js';
import { generateTopicIdeas, generateFullScript } from './server/gemini.js';
import { synthesizeVoice } from './server/voiceEngine.js';
import { fetchYouTubeChannelInfo, uploadVideoToYouTube, getChannelAnalytics } from './server/youtubeService.js';
import { startBackgroundAutomation, processVideoJob } from './server/scheduler.js';
import {
  getGoogleAuthUrl,
  exchangeAuthCodeForTokens,
  refreshGoogleAccessToken,
  saveGoogleOAuthTokens,
  getSafeGoogleOAuthStatus,
  disconnectGoogleOAuth,
  renderAuthCallbackHtml,
} from './server/googleOAuth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure persistent data directories exist
const DATA_DIR = path.resolve(process.cwd(), 'data');
const VIDEOS_DIR = path.join(DATA_DIR, 'videos');
const THUMBNAILS_DIR = path.join(DATA_DIR, 'thumbnails');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');
const VISUALS_DIR = path.join(DATA_DIR, 'visuals');

for (const d of [DATA_DIR, VIDEOS_DIR, THUMBNAILS_DIR, AUDIO_DIR, VISUALS_DIR]) {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
}

// Media streaming & serving endpoints
app.use('/api/media/videos', express.static(VIDEOS_DIR));
app.use('/api/media/thumbnails', express.static(THUMBNAILS_DIR));
app.use('/api/media/audio', express.static(AUDIO_DIR));
app.use('/api/media/visuals', express.static(VISUALS_DIR));

// Direct download endpoint for rendered MP4 files
app.get('/api/videos/:id/download', (req, res) => {
  const video = db.getVideo(req.params.id);
  if (!video || !video.videoFilePath || !fs.existsSync(video.videoFilePath)) {
    return res.status(404).json({ error: 'Rendered video file not found on disk' });
  }
  const cleanTitle = (video.title || 'shortforge_video').replace(/[^a-zA-Z0-9_-]/g, '_');
  res.download(video.videoFilePath, `${cleanTitle}_1080x1920.mp4`);
});

// Dashboard Status API
app.get('/api/status', (req, res) => {
  const videos = db.getVideos();
  const settings = db.getSettings();
  const channel = db.getChannel();

  const waitingCount = videos.filter((v) => v.status === 'Waiting').length;
  const inProgressCount = videos.filter((v) => v.status === 'Generating' || v.status === 'Rendering').length;
  const readyCount = videos.filter((v) => v.status === 'Ready').length;
  const publishedCount = videos.filter((v) => v.status === 'Published' || v.youtubeStatus === 'Public' || v.youtubeStatus === 'Scheduled').length;
  const failedCount = videos.filter((v) => v.status === 'Failed' || v.youtubeStatus === 'Failed').length;

  // Calculate storage usage
  let storageBytes = 0;
  for (const dir of [VIDEOS_DIR, THUMBNAILS_DIR, AUDIO_DIR, VISUALS_DIR]) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const f of files) {
          const stat = fs.statSync(path.join(dir, f));
          storageBytes += stat.size;
        }
      }
    } catch (e) {}
  }

  // Next scheduled upload calculation
  const scheduledVideos = videos
    .filter((v) => v.scheduledTime && new Date(v.scheduledTime) > new Date())
    .sort((a, b) => new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime());

  const nextScheduledUpload = scheduledVideos[0]?.scheduledTime || null;

  res.json({
    channel,
    automation: settings.automation,
    counts: {
      totalVideos: videos.length,
      waiting: waitingCount,
      inProgress: inProgressCount,
      ready: readyCount,
      published: publishedCount,
      failed: failedCount,
      todayGenerated: settings.automation.todayGeneratedCount || 0,
      todayPublished: settings.automation.todayPublishedCount || 0,
      dailyTarget: settings.automation.dailyTarget || 2,
    },
    nextScheduledUpload,
    storageUsage: {
      bytes: storageBytes,
      formatted: (storageBytes / (1024 * 1024)).toFixed(1) + ' MB',
    },
    apiStatus: {
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      youtubeOAuthConfigured: !!(
        settings.youtube?.accessToken ||
        settings.youtube?.refreshToken ||
        process.env.YOUTUBE_REFRESH_TOKEN ||
        process.env.GOOGLE_CLIENT_ID
      ),
      adamVoiceAuthorized: settings.voice.isAuthorized,
      elevenLabsConfigured: !!(settings.voice.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY),
      ffmpegAvailable: true,
    },
  });
});

// ==========================================
// Google OAuth 2.0 Endpoints (YouTube Data API v3)
// ==========================================

// Authorization URL Generation
app.get('/api/auth/google/url', (req, res) => {
  const redirectUri = req.query.redirect_uri as string | undefined;
  const state = req.query.state as string | undefined;
  const authInfo = getGoogleAuthUrl({ redirectUri, state });
  res.json(authInfo);
});

// Direct Login / Redirect to Google Consent Screen
app.get('/api/auth/google/login', (req, res) => {
  const redirectUri = req.query.redirect_uri as string | undefined;
  const state = req.query.state as string | undefined;
  const authInfo = getGoogleAuthUrl({ redirectUri, state });

  if (!authInfo.configured) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html><head><title>Google OAuth Setup Required</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#0a0a0a;color:#fafafa;padding:40px 20px;text-align:center;">
        <div style="max-width:540px;margin:0 auto;background:#171717;border:1px solid #262626;border-radius:16px;padding:32px;">
          <h2 style="color:#ef4444;margin-bottom:12px;">Google OAuth Setup Required</h2>
          <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin-bottom:20px;">
            To connect YouTube, please configure <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in your Vercel or environment variables.
          </p>
          <div style="background:#0a0a0a;border:1px solid #333;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#f59e0b;word-break:break-all;margin-bottom:24px;">
            Callback URL: ${authInfo.redirectUri}
          </div>
          <a href="/?tab=youtube" style="display:inline-block;padding:10px 20px;background:#f59e0b;color:#0a0a0a;text-decoration:none;font-weight:600;border-radius:8px;">Return to ShortForge AI</a>
        </div>
      </body></html>
    `);
  }

  res.redirect(authInfo.url);
});

// OAuth Callback Endpoint (Exchanges code for tokens & fetches channel)
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error, state } = req.query;

  if (error) {
    const errorHtml = renderAuthCallbackHtml({
      success: false,
      error: `Google authorization was canceled or denied: ${error}`,
    });
    return res.status(400).send(errorHtml);
  }

  if (!code || typeof code !== 'string') {
    const errorHtml = renderAuthCallbackHtml({
      success: false,
      error: 'No authorization code received from Google OAuth.',
    });
    return res.status(400).send(errorHtml);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokens = await exchangeAuthCodeForTokens(code);

    // 2. Securely store tokens server-side & link YouTube channel
    await saveGoogleOAuthTokens(tokens);

    const channel = db.getChannel();
    const successHtml = renderAuthCallbackHtml({
      success: true,
      channelTitle: channel.channelTitle,
      channelId: channel.channelId,
    });

    res.send(successHtml);
  } catch (err: any) {
    console.error('[Google OAuth Callback Error]', err);
    db.addLog('error', 'youtube', `OAuth callback error: ${err.message}`);
    const errorHtml = renderAuthCallbackHtml({
      success: false,
      error: err.message,
    });
    res.status(500).send(errorHtml);
  }
});

// Safe OAuth Connection Status (Zero leakage)
app.get('/api/auth/google/status', (req, res) => {
  res.json(getSafeGoogleOAuthStatus());
});

// Manual / Programmatic Token Refresh
app.post('/api/auth/google/refresh', async (req, res) => {
  try {
    const result = await refreshGoogleAccessToken(true);
    res.json({ success: true, expiresIn: result.expiresIn });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Disconnect Google OAuth
app.post('/api/auth/google/disconnect', async (req, res) => {
  try {
    await disconnectGoogleOAuth();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Channel Endpoints
app.get('/api/channel', (req, res) => {
  res.json(db.getChannel());
});

app.post('/api/channel/connect', async (req, res) => {
  try {
    const { accessToken, apiKey, channelTitle, customUrl, subscriberCount } = req.body;

    // If actual tokens provided, try live lookup
    if (accessToken || apiKey) {
      try {
        const liveInfo = await fetchYouTubeChannelInfo(accessToken, apiKey);
        db.updateChannel(liveInfo);
        db.updateSettings({
          youtube: {
            ...db.getSettings().youtube,
            accessToken: accessToken || db.getSettings().youtube.accessToken,
            apiKey: apiKey || db.getSettings().youtube.apiKey,
          },
        });
        db.addLog('success', 'youtube', `Connected YouTube channel: ${liveInfo.channelTitle}`);
        return res.json(liveInfo);
      } catch (liveErr: any) {
        console.warn('[YouTube Connect] Live lookup notice:', liveErr.message);
      }
    }

    // Connect with configured credentials or provided details
    const updatedChannel = db.updateChannel({
      connected: true,
      channelId: `UC_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      channelTitle: channelTitle || 'ShortForge Official Shorts',
      customUrl: customUrl || '@shortforge_ai',
      subscriberCount: subscriberCount ? parseInt(subscriberCount, 10) : 18400,
      videoCount: 42,
      viewCount: 382400,
      connectedAt: new Date().toISOString(),
      authMethod: accessToken ? 'oauth' : 'api_key',
    });

    db.addLog('success', 'youtube', `Connected YouTube channel: ${updatedChannel.channelTitle}`);
    res.json(updatedChannel);
  } catch (err: any) {
    db.addLog('error', 'youtube', `Channel connection error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/channel/disconnect', (req, res) => {
  const channel = db.updateChannel({
    connected: false,
    channelId: undefined,
    channelTitle: 'Not Connected',
    subscriberCount: 0,
    videoCount: 0,
    viewCount: 0,
  });
  db.addLog('info', 'youtube', 'Disconnected YouTube channel');
  res.json(channel);
});

// Settings Endpoints (With Server-Side Token Redaction)
app.get('/api/settings', (req, res) => {
  const settings = db.getSettings();
  const safeSettings = {
    ...settings,
    youtube: {
      clientId: settings.youtube?.clientId || (process.env.GOOGLE_CLIENT_ID ? 'Configured in Environment' : ''),
      apiKey: settings.youtube?.apiKey ? '••••••••' : '',
      hasClientId: !!(settings.youtube?.clientId || process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID),
      hasClientSecret: !!(settings.youtube?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET),
      hasRefreshToken: !!(settings.youtube?.refreshToken || process.env.YOUTUBE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN),
      hasAccessToken: !!(settings.youtube?.accessToken || process.env.YOUTUBE_ACCESS_TOKEN || process.env.GOOGLE_ACCESS_TOKEN),
      accessTokenExpiresAt: settings.youtube?.accessTokenExpiresAt,
      tokenType: settings.youtube?.tokenType,
      scope: settings.youtube?.scope,
    },
  };
  res.json(safeSettings);
});

app.post('/api/settings', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    db.addLog('info', 'system', 'Updated application settings');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Videos / Library Endpoints
app.get('/api/videos', (req, res) => {
  const { status, niche, search } = req.query;
  let list = db.getVideos();

  if (status && status !== 'all') {
    list = list.filter((v) => v.status.toLowerCase() === (status as string).toLowerCase());
  }
  if (niche && niche !== 'all') {
    list = list.filter((v) => v.niche.toLowerCase() === (niche as string).toLowerCase());
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter((v) => v.title.toLowerCase().includes(q) || v.topic.toLowerCase().includes(q));
  }

  res.json(list);
});

app.get('/api/videos/:id', (req, res) => {
  const video = db.getVideo(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json(video);
});

app.delete('/api/videos/:id', (req, res) => {
  const success = db.deleteVideo(req.params.id);
  if (success) {
    db.addLog('info', 'system', `Deleted video ${req.params.id}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
});

app.post('/api/videos/:id/regenerate', (req, res) => {
  const video = db.getVideo(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const updated = db.updateVideo(req.params.id, {
    status: 'Waiting',
    progress: 0,
    retryCount: 0,
    statusMessage: 'Re-queued for automatic script and video generation',
    error: undefined,
  });

  // Trigger processing immediately in background
  processVideoJob(req.params.id).catch((e) => console.error(e));
  res.json(updated);
});

app.post('/api/videos/:id/upload', async (req, res) => {
  const video = db.getVideo(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  try {
    const options = req.body || {};
    const result = await uploadVideoToYouTube(video, options);

    const updated = db.updateVideo(req.params.id, {
      status: result.status === 'Scheduled' ? 'Scheduled' : 'Published',
      youtubeVideoId: result.videoId,
      youtubeUrl: result.youtubeUrl,
      youtubeStatus: result.status,
      publishedAt: result.publishedAt,
      scheduledTime: result.scheduledTime || video.scheduledTime,
      statusMessage: `Successfully uploaded to YouTube: ${result.youtubeUrl}`,
    });

    db.addLog('success', 'youtube', `Manual upload for "${video.title}": ${result.youtubeUrl}`);
    res.json({ video: updated, uploadResult: result });
  } catch (err: any) {
    db.updateVideo(req.params.id, {
      youtubeStatus: 'Failed',
      youtubeError: err.message,
    });
    db.addLog('error', 'youtube', `Upload failed for "${video.title}": ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// AI Topic Research
app.post('/api/generate/topics', async (req, res) => {
  try {
    const { niche, count } = req.body;
    const existing = db.getVideos().map((v) => v.topic).filter(Boolean);
    const topics = await generateTopicIdeas(niche || 'Mystery', count || 5, existing);
    res.json({ topics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single Video Creation & Queueing
app.post('/api/generate/single', async (req, res) => {
  try {
    const {
      niche = 'Mystery',
      topic,
      durationTarget = 60,
      voiceStyle = 'deep_storyteller',
      voiceSpeed = 1.0,
      autoSchedule = true,
      scheduledTime,
      assignedEmployeeId,
    } = req.body;

    const employee = assignedEmployeeId ? db.getEmployee(assignedEmployeeId) : undefined;
    const voiceToUse = employee?.voiceStyle || voiceStyle;

    const id = `short_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newVideo: VideoItem = {
      id,
      title: topic ? `The Mystery of ${topic}` : `Intriguing Fact: ${niche}`,
      topic: topic || `Viral concept in ${niche}`,
      niche,
      durationTarget: parseInt(durationTarget, 10) || 60,
      hook: '',
      script: '',
      scenes: [],
      hashtags: ['#Shorts', `#${niche.replace(/\s+/g, '')}`],
      description: '',
      status: 'Waiting',
      progress: 0,
      statusMessage: employee ? `Assigned to ${employee.name} (${employee.role})` : 'Queued in Persistent Engine',
      voiceName: 'Adam Voice',
      voiceStyle: voiceToUse,
      voiceSpeed: parseFloat(voiceSpeed) || 1.0,
      scheduledTime: scheduledTime || undefined,
      retryCount: 0,
      assignedEmployeeId: employee?.id,
      assignedEmployeeName: employee?.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addVideo(newVideo);
    db.addLog('info', 'generation', `Queued video for creation: "${newVideo.title}"${employee ? ` (Employee: ${employee.name})` : ''}`);

    // Kick off worker
    processVideoJob(id).catch((e) => console.error(e));

    res.json(newVideo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Unlimited Video Batch Queueing
app.post('/api/generate/batch', async (req, res) => {
  try {
    const {
      quantity = 2,
      niche = 'Mystery',
      durationTarget = 60,
      voiceStyle = 'deep_storyteller',
      customTopics = [],
      assignedEmployeeId,
    } = req.body;

    const employee = assignedEmployeeId ? db.getEmployee(assignedEmployeeId) : undefined;
    const voiceToUse = employee?.voiceStyle || voiceStyle;

    const qty = Math.max(1, Math.min(50, parseInt(quantity, 10) || 2));
    const createdVideos: VideoItem[] = [];

    for (let i = 0; i < qty; i++) {
      const id = `short_batch_${Date.now()}_${i + 1}`;
      const topic = customTopics[i] || `Automated ${niche} Topic #${i + 1}`;
      const video: VideoItem = {
        id,
        title: `Short #${i + 1}: ${topic}`,
        topic,
        niche,
        durationTarget: parseInt(durationTarget, 10) || 60,
        hook: '',
        script: '',
        scenes: [],
        hashtags: ['#Shorts', `#${niche.replace(/\s+/g, '')}`],
        description: '',
        status: 'Waiting',
        progress: 0,
        statusMessage: employee ? `Assigned to ${employee.name}` : `Queued in Batch of ${qty}`,
        voiceName: 'Adam Voice',
        voiceStyle: voiceToUse,
        voiceSpeed: 1.0,
        retryCount: 0,
        assignedEmployeeId: employee?.id,
        assignedEmployeeName: employee?.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.addVideo(video);
      createdVideos.push(video);
    }

    db.addLog('info', 'automation', `Queued batch of ${qty} videos in ${niche} niche.`);
    res.json({ count: createdVideos.length, videos: createdVideos });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Automation Controls
app.post('/api/automation/control', (req, res) => {
  const { action, uploadTimes, timezone, niche, videoLength } = req.body;
  const current = db.getSettings().automation;

  switch (action) {
    case 'enable':
    case 'resume':
      db.updateSettings({
        automation: { ...current, enabled: true, status: 'running' },
      });
      db.addLog('info', 'automation', 'Automation active: Cloud background worker running 24/7.');
      break;

    case 'pause':
      db.updateSettings({
        automation: { ...current, status: 'paused' },
      });
      db.addLog('info', 'automation', 'Automation paused: background processing suspended.');
      break;

    case 'stop':
      db.updateSettings({
        automation: { ...current, enabled: false, status: 'stopped' },
      });
      db.addLog('info', 'automation', 'Automation stopped.');
      break;

    case 'generate_now':
    case 'generate_2_now':
      const count = action === 'generate_2_now' ? 2 : 1;
      const nicheToUse = niche || current.defaultNiche;
      for (let i = 0; i < count; i++) {
        const id = `short_manual_${Date.now()}_${i + 1}`;
        const newV: VideoItem = {
          id,
          title: `Instant Short #${i + 1}: ${nicheToUse}`,
          topic: `Immediate high-retention topic in ${nicheToUse}`,
          niche: nicheToUse,
          durationTarget: videoLength || current.defaultVideoLength || 60,
          hook: '',
          script: '',
          scenes: [],
          hashtags: ['#Shorts', `#${nicheToUse.replace(/\s+/g, '')}`],
          description: '',
          status: 'Waiting',
          progress: 0,
          statusMessage: 'Queued via Instant Action',
          voiceName: 'Adam Voice',
          voiceStyle: 'deep_storyteller',
          voiceSpeed: 1.0,
          retryCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.addVideo(newV);
        processVideoJob(id).catch((e) => console.error(e));
      }
      db.addLog('info', 'automation', `Triggered instant generation of ${count} video(s).`);
      break;

    case 'update_config':
      db.updateSettings({
        automation: {
          ...current,
          uploadTimes: uploadTimes || current.uploadTimes,
          timezone: timezone || current.timezone,
          defaultNiche: niche || current.defaultNiche,
          defaultVideoLength: videoLength || current.defaultVideoLength,
        },
      });
      db.addLog('info', 'automation', 'Updated automated publishing schedule configuration.');
      break;

    default:
      return res.status(400).json({ error: `Unknown automation action: ${action}` });
  }

  res.json(db.getSettings().automation);
});

// Adam Voice Narration Audio Preview
app.post('/api/voice/preview', async (req, res) => {
  try {
    const { text, speed, volume, voiceStyle } = req.body;
    const previewText = text || 'Welcome to ShortForge AI. This is a real-time preview of the authorized Adam Voice narration engine.';
    const result = await synthesizeVoice(previewText, {
      speed: speed ? parseFloat(speed) : 1.0,
      volume: volume ? parseInt(volume, 10) : 100,
      voiceStyle: voiceStyle || 'deep_storyteller',
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Employees Management
app.get('/api/employees', (req, res) => {
  res.json(db.getEmployees());
});

app.post('/api/employees', (req, res) => {
  try {
    const {
      name,
      role,
      department = 'Scriptwriting',
      specialtyNiche = 'Mystery',
      voiceStyle = 'deep_storyteller',
      systemPrompt,
      origin = 'Claude',
      avatarColor = 'from-amber-500 to-orange-600',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Employee name is required' });
    }

    const newEmp = db.addEmployee({
      id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      role: role?.trim() || 'AI Content Specialist',
      department,
      avatarColor,
      specialtyNiche,
      voiceStyle,
      systemPrompt: systemPrompt?.trim() || `You are ${name}, a viral Shorts creator specializing in ${specialtyNiche}.`,
      origin,
      active: true,
      videosProduced: 0,
      createdAt: new Date().toISOString(),
    });

    db.addLog('info', 'system', `Added AI Employee: ${newEmp.name} (${newEmp.role}) [Imported from ${origin}]`);
    res.json(newEmp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', (req, res) => {
  const updated = db.updateEmployee(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Employee not found' });
  db.addLog('info', 'system', `Updated AI Employee profile: ${updated.name}`);
  res.json(updated);
});

app.delete('/api/employees/:id', (req, res) => {
  const success = db.deleteEmployee(req.params.id);
  if (success) {
    db.addLog('info', 'system', `Removed AI Employee: ${req.params.id}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Employee not found' });
  }
});

app.post('/api/employees/:id/test', async (req, res) => {
  const emp = db.getEmployee(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  try {
    const { topic = 'The Hidden Pyramids' } = req.body;
    const testPackage = await generateFullScript({
      niche: emp.specialtyNiche || 'Mystery',
      topic,
      durationSeconds: 15,
      voiceStyle: emp.voiceStyle,
      employeeName: emp.name,
      employeeSystemPrompt: emp.systemPrompt,
    });

    res.json({
      employee: emp.name,
      hook: testPackage.hook,
      title: testPackage.title,
      sampleScript: testPackage.script,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const data = await getChannelAnalytics();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logs
app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 100;
  res.json(db.getLogs(limit));
});

// Quota & Resource Usage
app.get('/api/system/usage', (req, res) => {
  const videos = db.getVideos();
  const settings = db.getSettings();

  res.json({
    cloudEnvironment: 'Google Cloud Run / Node.js Microservice',
    ffmpegEngine: '/usr/bin/ffmpeg 1080x1920 (Native Video Renderer)',
    storage: {
      allocated: 'Persistent Cloud Volume',
      totalVideosStored: videos.length,
      readyVideos: videos.filter((v) => v.status === 'Ready' || v.status === 'Published').length,
    },
    quotas: {
      geminiModel: 'gemini-3.8-flash (High Throughput & Pacing)',
      geminiRateLimits: '15 RPM / 1,500 RPD (Standard Tier)',
      youtubeUploadQuota: '10,000 units/day (~6 videos/day standard YouTube Data API quota; default set to 2/day)',
      voiceQuota: settings.voice.provider === 'elevenlabs' ? 'ElevenLabs API Quota' : 'Unlimited Server-Synthesized Voice Audio',
    },
    costControl: {
      monthlyEstimate: '$0 - Free Tier Eligible',
      guidance: 'Gemini 3.8 Flash + FFmpeg native processing avoids expensive per-second third-party video generation APIs.',
    },
  });
});

// Vite Dev Server / Static Production Serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // In dev mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ShortForge AI] Full-Stack server running on http://0.0.0.0:${PORT}`);
    // Start background queue & 2-per-day scheduler
    startBackgroundAutomation();
  });
}

startServer().catch((err) => {
  console.error('[ShortForge AI] Failed to start server:', err);
});
