import fs from 'fs';
import path from 'path';

export interface Scene {
  sceneNumber: number;
  durationSeconds: number;
  visualPrompt: string;
  visualKeywords: string[];
  narrationText: string;
  captionText: string;
  cameraMovement: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'static';
  mediaUrl?: string;
  mediaType?: 'video' | 'image';
}

export interface VideoItem {
  id: string;
  title: string;
  topic: string;
  niche: string;
  durationTarget: number; // 15, 30, 45, 60, 90
  actualDurationSeconds?: number;
  hook: string;
  script: string;
  scenes: Scene[];
  hashtags: string[];
  description: string;
  status: 'Waiting' | 'Generating' | 'Rendering' | 'Ready' | 'Scheduled' | 'Published' | 'Failed';
  progress: number; // 0 to 100
  statusMessage?: string;
  videoFilePath?: string;
  videoUrl?: string;
  thumbnailPath?: string;
  thumbnailUrl?: string;
  audioPath?: string;
  audioUrl?: string;
  voiceName: string;
  voiceStyle: string;
  voiceSpeed: number;
  scheduledTime?: string; // ISO string
  publishedAt?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  youtubeStatus?: 'None' | 'Scheduled' | 'Private' | 'Unlisted' | 'Public' | 'Failed';
  youtubeError?: string;
  error?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  isDailyAutomated?: boolean;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
}

export interface ConnectedChannel {
  connected: boolean;
  channelId?: string;
  channelTitle?: string;
  customUrl?: string;
  description?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  connectedAt?: string;
  authMethod?: 'oauth' | 'api_key';
  accessTokenExpiresAt?: string;
}

export interface AutomationSettings {
  enabled: boolean;
  status: 'running' | 'paused' | 'stopped';
  dailyTarget: number; // default 2
  uploadTimes: string[]; // e.g. ["12:00", "19:00"]
  timezone: string; // e.g. "America/New_York"
  defaultNiche: string;
  defaultVideoLength: number; // 15, 30, 45, 60, 90
  autoPublishMode: 'scheduled' | 'private' | 'unlisted' | 'public';
  requireApprovalBeforeUpload: boolean;
  lastRunDate?: string; // YYYY-MM-DD
  todayGeneratedCount: number;
  todayPublishedCount: number;
  concurrencyLimit: number;
}

export interface VoiceSettings {
  provider: 'adam_voice_authorized' | 'elevenlabs' | 'gemini_tts' | 'system';
  voiceName: string; // 'Adam Voice'
  voiceId?: string; // Elevenlabs voice ID
  voiceStyle: 'dramatic' | 'energetic' | 'documentary' | 'suspenseful' | 'deep_storyteller';
  speed: number; // 0.75 to 1.5
  volume: number; // 0 to 100
  pitch: number;
  isAuthorized: boolean;
  authorizationNotes?: string;
  elevenLabsApiKey?: string;
}

export interface AppSettings {
  youtube: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    refreshToken?: string;
    accessToken?: string;
    accessTokenExpiresAt?: string;
    tokenType?: string;
    scope?: string;
  };
  pexelsApiKey?: string;
  pixabayApiKey?: string;
  automation: AutomationSettings;
  voice: VoiceSettings;
  firstTimeSetupCompleted: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  category: 'generation' | 'rendering' | 'youtube' | 'automation' | 'system';
  message: string;
  details?: any;
}

export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  department: 'Scriptwriting' | 'Research' | 'Visuals' | 'Audio & Voice' | 'SEO & Growth';
  avatarColor: string;
  specialtyNiche: string;
  voiceStyle: 'deep_storyteller' | 'dramatic' | 'documentary' | 'energetic';
  systemPrompt: string; // Instructions imported from Claude or custom persona
  origin: 'Claude' | 'Custom' | 'Built-in';
  active: boolean;
  videosProduced: number;
  createdAt: string;
}

interface DBData {
  channel: ConnectedChannel;
  settings: AppSettings;
  videos: VideoItem[];
  logs: SystemLog[];
  employees: AIEmployee[];
}

const DB_FILE =
  process.env.DB_FILE ||
  (process.env.VERCEL
    ? path.join('/tmp', 'shortforge-db.json')
    : path.resolve(process.cwd(), 'data', 'shortforge-db.json'));

const initialEmployees: AIEmployee[] = [
  {
    id: 'emp_claude_marcus',
    name: 'Marcus Sterling',
    role: 'Lead Viral Hook & Pacing Specialist',
    department: 'Scriptwriting',
    avatarColor: 'from-amber-500 to-orange-600',
    specialtyNiche: 'Mystery',
    voiceStyle: 'deep_storyteller',
    systemPrompt: 'You are Marcus Sterling, a master of psychological tension and 3-second viral curiosity hooks. You write punchy, fast-paced YouTube Shorts scripts designed to stop the scroll immediately. Every sentence must propel the viewer to the next second.',
    origin: 'Built-in',
    active: true,
    videosProduced: 14,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp_claude_elena',
    name: 'Dr. Elena Vance',
    role: 'Declassified Archives & Facts Researcher',
    department: 'Research',
    avatarColor: 'from-blue-500 to-cyan-600',
    specialtyNiche: 'History',
    voiceStyle: 'documentary',
    systemPrompt: 'You are Dr. Elena Vance, an investigative historian uncovering buried declassified government files, bizarre archaeological findings, and verified cosmic anomalies. Your scripts balance authoritative credibility with thrilling revelation.',
    origin: 'Built-in',
    active: true,
    videosProduced: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp_claude_silas',
    name: 'Silas Dark',
    role: 'Horror & Paranormal Storyteller',
    department: 'Scriptwriting',
    avatarColor: 'from-purple-600 to-indigo-900',
    specialtyNiche: 'Unsolved Mysteries',
    voiceStyle: 'dramatic',
    systemPrompt: 'You are Silas Dark, specialized in spine-chilling urban legends, unexplained disappearances, and eerie historical encounters. You craft lingering atmosphere, dramatic pauses, and unexpected dark twists.',
    origin: 'Built-in',
    active: true,
    videosProduced: 19,
    createdAt: new Date().toISOString(),
  },
];

const defaultData: DBData = {
  channel: {
    connected: false,
    channelTitle: 'Not Connected',
    subscriberCount: 0,
    videoCount: 0,
    viewCount: 0,
  },
  settings: {
    youtube: {},
    automation: {
      enabled: false,
      status: 'stopped',
      dailyTarget: 2,
      uploadTimes: ['12:00', '19:00'],
      timezone: 'America/New_York',
      defaultNiche: 'Mystery',
      defaultVideoLength: 60,
      autoPublishMode: 'scheduled',
      requireApprovalBeforeUpload: false,
      todayGeneratedCount: 0,
      todayPublishedCount: 0,
      concurrencyLimit: 2,
    },
    voice: {
      provider: 'adam_voice_authorized',
      voiceName: 'Adam Voice',
      voiceStyle: 'deep_storyteller',
      speed: 1.0,
      volume: 100,
      pitch: 1.0,
      isAuthorized: true,
      authorizationNotes: 'Authorized owner license for Adam Voice narration model on ShortForge AI',
    },
    firstTimeSetupCompleted: false,
  },
  videos: [],
  logs: [],
  employees: initialEmployees,
};

class Database {
  private data: DBData;

  constructor() {
    this.data = this.load();
  }

  private load(): DBData {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...defaultData,
          ...parsed,
          settings: {
            ...defaultData.settings,
            ...(parsed.settings || {}),
            automation: {
              ...defaultData.settings.automation,
              ...(parsed.settings?.automation || {}),
            },
            voice: {
              ...defaultData.settings.voice,
              ...(parsed.settings?.voice || {}),
            },
          },
          videos: parsed.videos || [],
          logs: parsed.logs || [],
          employees: Array.isArray(parsed.employees) && parsed.employees.length > 0 ? parsed.employees : initialEmployees,
        };
      }
    } catch (err) {
      console.error('[DB] Failed to load database file, using defaults:', err);
    }
    return JSON.parse(JSON.stringify(defaultData));
  }

  public save(): void {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to save database:', err);
    }
  }

  public getChannel(): ConnectedChannel {
    return this.data.channel;
  }

  public updateChannel(channel: Partial<ConnectedChannel>): ConnectedChannel {
    this.data.channel = { ...this.data.channel, ...channel };
    this.save();
    return this.data.channel;
  }

  public getSettings(): AppSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<AppSettings>): AppSettings {
    this.data.settings = {
      ...this.data.settings,
      ...settings,
      automation: {
        ...this.data.settings.automation,
        ...(settings.automation || {}),
      },
      voice: {
        ...this.data.settings.voice,
        ...(settings.voice || {}),
      },
    };
    this.save();
    return this.data.settings;
  }

  public getVideos(): VideoItem[] {
    return this.data.videos;
  }

  public getVideo(id: string): VideoItem | undefined {
    return this.data.videos.find((v) => v.id === id);
  }

  public addVideo(video: VideoItem): VideoItem {
    this.data.videos.unshift(video);
    this.save();
    return video;
  }

  public updateVideo(id: string, updates: Partial<VideoItem>): VideoItem | undefined {
    const idx = this.data.videos.findIndex((v) => v.id === id);
    if (idx !== -1) {
      this.data.videos[idx] = {
        ...this.data.videos[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.videos[idx];
    }
    return undefined;
  }

  public deleteVideo(id: string): boolean {
    const initialLen = this.data.videos.length;
    this.data.videos = this.data.videos.filter((v) => v.id !== id);
    if (this.data.videos.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addLog(
    level: SystemLog['level'],
    category: SystemLog['category'],
    message: string,
    details?: any
  ): SystemLog {
    const logItem: SystemLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
    };
    this.data.logs.unshift(logItem);
    // Keep last 500 logs
    if (this.data.logs.length > 500) {
      this.data.logs = this.data.logs.slice(0, 500);
    }
    this.save();
    return logItem;
  }

  public getLogs(limit = 100): SystemLog[] {
    return this.data.logs.slice(0, limit);
  }

  public getEmployees(): AIEmployee[] {
    return this.data.employees || [];
  }

  public getEmployee(id: string): AIEmployee | undefined {
    return (this.data.employees || []).find((e) => e.id === id);
  }

  public addEmployee(emp: AIEmployee): AIEmployee {
    if (!this.data.employees) this.data.employees = [];
    this.data.employees.unshift(emp);
    this.save();
    return emp;
  }

  public updateEmployee(id: string, updates: Partial<AIEmployee>): AIEmployee | undefined {
    const idx = (this.data.employees || []).findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.data.employees[idx] = { ...this.data.employees[idx], ...updates };
      this.save();
      return this.data.employees[idx];
    }
    return undefined;
  }

  public deleteEmployee(id: string): boolean {
    const initialLen = (this.data.employees || []).length;
    this.data.employees = (this.data.employees || []).filter((e) => e.id !== id);
    if (this.data.employees.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new Database();
