import { db, VideoItem } from './db.js';
import { generateFullScript } from './gemini.js';
import { synthesizeVoice } from './voiceEngine.js';
import { obtainSceneVisuals } from './visualsEngine.js';
import { renderShortVideo } from './videoRenderer.js';
import { uploadVideoToYouTube } from './youtubeService.js';

let isWorkerRunning = false;
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Full Pipeline for a single video job:
 * TOPIC -> GEMINI SCRIPT -> SCENE PLAN -> ADAM VOICE NARRATION -> VISUALS -> FFMPEG RENDERING -> MP4 -> (OPTIONAL AUTO UPLOAD)
 */
export async function processVideoJob(videoId: string): Promise<void> {
  const video = db.getVideo(videoId);
  if (!video) return;

  try {
    db.addLog('info', 'generation', `[Job ${videoId}] Starting automated production for: "${video.title || video.topic}"`);
    db.updateVideo(videoId, {
      status: 'Generating',
      progress: 10,
      statusMessage: 'Gemini AI researching facts, hook, and scene structure...',
    });

    // Step 1: Script generation if not already planned
    if (!video.scenes || video.scenes.length === 0) {
      const existingTopics = db.getVideos().map((v) => v.topic).filter(Boolean);
      const employee = video.assignedEmployeeId ? db.getEmployee(video.assignedEmployeeId) : undefined;

      const pkg = await generateFullScript({
        niche: video.niche,
        topic: video.topic,
        durationSeconds: video.durationTarget,
        voiceStyle: video.voiceStyle,
        existingTopics,
        employeeName: employee?.name || video.assignedEmployeeName,
        employeeSystemPrompt: employee?.systemPrompt,
      });

      if (employee) {
        db.updateEmployee(employee.id, {
          videosProduced: (employee.videosProduced || 0) + 1,
        });
      }

      db.updateVideo(videoId, {
        title: pkg.title,
        topic: pkg.topic,
        hook: pkg.hook,
        script: pkg.script,
        scenes: pkg.scenes,
        description: pkg.description,
        hashtags: pkg.hashtags,
        progress: 30,
        statusMessage: 'Script crafted with high-retention hook and verified facts.',
      });
    }

    const currentVideo = db.getVideo(videoId)!;

    // Step 2: Adam Voice narration synthesis
    db.updateVideo(videoId, {
      progress: 45,
      statusMessage: `Synthesizing authorized ${currentVideo.voiceName} narration audio...`,
    });

    const voiceRes = await synthesizeVoice(currentVideo.script, {
      speed: currentVideo.voiceSpeed,
      voiceStyle: currentVideo.voiceStyle as any,
    });

    db.updateVideo(videoId, {
      audioPath: voiceRes.audioPath,
      audioUrl: voiceRes.audioUrl,
      actualDurationSeconds: voiceRes.durationSeconds,
      progress: 60,
      statusMessage: 'Acquiring copyright-safe stock footage and cinematic visual assets...',
    });

    // Step 3: Copyright-safe Visuals
    const visuals = await obtainSceneVisuals(videoId, currentVideo.scenes, currentVideo.niche);

    // Step 4: FFmpeg Video Rendering & Subtitle burning
    db.updateVideo(videoId, {
      status: 'Rendering',
      progress: 75,
      statusMessage: 'FFmpeg assembling 1080x1920 9:16 vertical MP4, animated captions, and audio mix...',
    });

    const renderRes = await renderShortVideo(
      currentVideo,
      visuals,
      voiceRes.audioPath,
      voiceRes.durationSeconds
    );

    db.updateVideo(videoId, {
      status: 'Ready',
      progress: 100,
      statusMessage: 'Video rendering complete. MP4 file ready for streaming & download.',
      videoFilePath: renderRes.videoFilePath,
      videoUrl: renderRes.videoUrl,
      thumbnailPath: renderRes.thumbnailPath,
      thumbnailUrl: renderRes.thumbnailUrl,
      actualDurationSeconds: renderRes.actualDurationSeconds,
    });

    // Update settings counter
    const settings = db.getSettings();
    db.updateSettings({
      automation: {
        ...settings.automation,
        todayGeneratedCount: (settings.automation.todayGeneratedCount || 0) + 1,
      },
    });

    db.addLog('success', 'rendering', `[Job ${videoId}] Rendered 1080x1920 MP4 successfully: "${currentVideo.title}"`);

    // Step 5: Check if auto-publish is scheduled
    if (
      settings.automation.enabled &&
      settings.automation.status === 'running' &&
      !settings.automation.requireApprovalBeforeUpload
    ) {
      if (currentVideo.isDailyAutomated || currentVideo.scheduledTime) {
        try {
          db.updateVideo(videoId, {
            statusMessage: 'Scheduling upload to connected YouTube Channel...',
          });
          const uploadRes = await uploadVideoToYouTube(db.getVideo(videoId)!);
          db.updateVideo(videoId, {
            status: uploadRes.status === 'Scheduled' ? 'Scheduled' : 'Published',
            youtubeVideoId: uploadRes.videoId,
            youtubeUrl: uploadRes.youtubeUrl,
            youtubeStatus: uploadRes.status,
            publishedAt: uploadRes.publishedAt,
            statusMessage: `Successfully registered on YouTube: ${uploadRes.youtubeUrl}`,
          });

          db.updateSettings({
            automation: {
              ...db.getSettings().automation,
              todayPublishedCount: (db.getSettings().automation.todayPublishedCount || 0) + 1,
            },
          });
          db.addLog('success', 'youtube', `[Job ${videoId}] YouTube Short scheduled/published: ${uploadRes.youtubeUrl}`);
        } catch (uploadErr: any) {
          db.updateVideo(videoId, {
            youtubeStatus: 'Failed',
            youtubeError: uploadErr.message,
            statusMessage: `YouTube upload pending/warning: ${uploadErr.message}`,
          });
          db.addLog('warn', 'youtube', `[Job ${videoId}] YouTube auto-upload warning: ${uploadErr.message}`);
        }
      }
    }
  } catch (error: any) {
    console.error(`[Scheduler] Video job ${videoId} failed:`, error);
    const v = db.getVideo(videoId);
    const retryCount = (v?.retryCount || 0) + 1;

    // Retry once if transient
    if (retryCount <= 2) {
      db.updateVideo(videoId, {
        status: 'Waiting',
        retryCount,
        progress: 0,
        statusMessage: `Temporary failure, retrying (${retryCount}/2): ${error.message}`,
      });
      db.addLog('warn', 'generation', `[Job ${videoId}] Retrying after error: ${error.message}`);
    } else {
      db.updateVideo(videoId, {
        status: 'Failed',
        error: error.message,
        progress: 0,
        statusMessage: `Job failed: ${error.message}`,
      });
      db.addLog('error', 'generation', `[Job ${videoId}] Fatal job failure: ${error.message}`);
    }
  }
}

/**
 * Continuous Background Queue Worker
 */
async function processQueueTick(): Promise<void> {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    const settings = db.getSettings();
    if (settings.automation.status === 'paused') {
      return;
    }

    const concurrency = settings.automation.concurrencyLimit || 2;
    const allVideos = db.getVideos();

    const inProgressCount = allVideos.filter(
      (v) => v.status === 'Generating' || v.status === 'Rendering'
    ).length;

    const availableSlots = Math.max(0, concurrency - inProgressCount);
    if (availableSlots <= 0) return;

    const waitingJobs = allVideos.filter((v) => v.status === 'Waiting').slice(0, availableSlots);

    for (const job of waitingJobs) {
      // Process asynchronously without blocking the loop
      processVideoJob(job.id).catch((err) => {
        console.error(`[Worker] Unhandled error in job ${job.id}:`, err);
      });
    }
  } catch (loopErr) {
    console.error('[Worker] Loop tick error:', loopErr);
  } finally {
    isWorkerRunning = false;
  }
}

/**
 * 2 YouTube Shorts Every Day Scheduler
 * Checks daily target (defaults: 12:00 PM and 7:00 PM) in configured timezone
 */
async function checkDailyPublishingSchedule(): Promise<void> {
  const settings = db.getSettings().automation;
  if (!settings.enabled || settings.status !== 'running') return;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Reset daily counts if new day
  if (settings.lastRunDate !== todayStr) {
    db.updateSettings({
      automation: {
        ...settings,
        lastRunDate: todayStr,
        todayGeneratedCount: 0,
        todayPublishedCount: 0,
      },
    });
  }

  // Check upload times (e.g. ["12:00", "19:00"])
  const uploadTimes = settings.uploadTimes || ['12:00', '19:00'];
  const currentHours = now.getHours().toString().padStart(2, '0');
  const currentMins = now.getMinutes().toString().padStart(2, '0');
  const currentTimeFormatted = `${currentHours}:${currentMins}`;

  // Check if current minute matches one of the scheduled times
  // To avoid duplicate generation, verify how many automated shorts were created today
  const existingAutomatedToday = db.getVideos().filter(
    (v) => v.isDailyAutomated && v.createdAt.slice(0, 10) === todayStr
  );

  if (existingAutomatedToday.length < (settings.dailyTarget || 2)) {
    // Generate the next automated short ahead of time so it is ready
    const videoSlot = existingAutomatedToday.length + 1; // 1 or 2
    const targetScheduledTime = uploadTimes[videoSlot - 1] || '12:00';

    const [schedH, schedM] = targetScheduledTime.split(':').map(Number);
    const scheduledDate = new Date(now);
    scheduledDate.setHours(schedH, schedM, 0, 0);
    if (scheduledDate < now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const nicheList = [
      'Mystery',
      'History',
      'Science',
      'Space',
      'Technology',
      'Interesting Facts',
      'Business',
      'Psychology',
    ];
    // Video 1 and Video 2 must not be duplicates: pick distinct niches
    const niche = videoSlot === 1 ? settings.defaultNiche : nicheList[(nicheList.indexOf(settings.defaultNiche) + 3) % nicheList.length];

    const newVideoId = `short_auto_${Date.now()}_slot${videoSlot}`;
    const newVideo: VideoItem = {
      id: newVideoId,
      title: `Daily Short #${videoSlot}: ${niche} Revelation`,
      topic: `Top intriguing discovery in ${niche} - Part ${videoSlot}`,
      niche,
      durationTarget: settings.defaultVideoLength || 60,
      hook: '',
      script: '',
      scenes: [],
      hashtags: ['#Shorts', `#${niche.replace(/\s+/g, '')}`, '#DailyDiscovery'],
      description: `Daily YouTube Short produced automatically by ShortForge AI.`,
      status: 'Waiting',
      progress: 0,
      statusMessage: `Queued automatically by Daily 2-Video Cloud Scheduler for ${targetScheduledTime}`,
      voiceName: 'Adam Voice',
      voiceStyle: videoSlot === 1 ? 'deep_storyteller' : 'dramatic',
      voiceSpeed: 1.0,
      scheduledTime: scheduledDate.toISOString(),
      retryCount: 0,
      isDailyAutomated: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addVideo(newVideo);
    db.addLog(
      'info',
      'automation',
      `[Daily 2-Video Engine] Queued Video #${videoSlot} for ${targetScheduledTime} in ${niche} niche.`
    );
  }
}

/**
 * Start the Cloud Automation background service
 */
export function startBackgroundAutomation(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  // Recover any jobs that were interrupted in Generating or Rendering during restart
  const allVideos = db.getVideos();
  for (const v of allVideos) {
    if (v.status === 'Generating' || v.status === 'Rendering') {
      db.updateVideo(v.id, {
        status: 'Waiting',
        progress: 0,
        statusMessage: 'Recovered from restart, queued for processing...',
      });
    }
  }

  // Trigger immediate tick
  processQueueTick().catch((e) => console.error(e));

  // Tick every 10 seconds for persistent queue, and check daily schedule
  schedulerInterval = setInterval(async () => {
    try {
      await processQueueTick();
      await checkDailyPublishingSchedule();
    } catch (err) {
      console.error('[Scheduler Interval Error]', err);
    }
  }, 10000);

  db.addLog('info', 'automation', 'ShortForge Cloud Automation worker active (independent of browser).');
}

export function stopBackgroundAutomation(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
