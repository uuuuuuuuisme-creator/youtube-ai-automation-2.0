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
  durationTarget: number;
  actualDurationSeconds?: number;
  hook: string;
  script: string;
  scenes: Scene[];
  hashtags: string[];
  description: string;
  status: 'Waiting' | 'Generating' | 'Rendering' | 'Ready' | 'Scheduled' | 'Published' | 'Failed';
  progress: number;
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
  scheduledTime?: string;
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

export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  department: 'Scriptwriting' | 'Research' | 'Visuals' | 'Audio & Voice' | 'SEO & Growth';
  avatarColor: string;
  specialtyNiche: string;
  voiceStyle: 'deep_storyteller' | 'dramatic' | 'documentary' | 'energetic';
  systemPrompt: string;
  origin: 'Claude' | 'Custom' | 'Built-in';
  active: boolean;
  videosProduced: number;
  createdAt: string;
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
  dailyTarget: number;
  uploadTimes: string[];
  timezone: string;
  defaultNiche: string;
  defaultVideoLength: number;
  autoPublishMode: 'scheduled' | 'private' | 'unlisted' | 'public';
  requireApprovalBeforeUpload: boolean;
  lastRunDate?: string;
  todayGeneratedCount: number;
  todayPublishedCount: number;
  concurrencyLimit: number;
}

export interface VoiceSettings {
  provider: 'adam_voice_authorized' | 'elevenlabs' | 'gemini_tts' | 'system';
  voiceName: string;
  voiceId?: string;
  voiceStyle: 'dramatic' | 'energetic' | 'documentary' | 'suspenseful' | 'deep_storyteller';
  speed: number;
  volume: number;
  pitch: number;
  isAuthorized: boolean;
  authorizationNotes?: string;
  elevenLabsApiKey?: string;
}

export interface GoogleOAuthStatus {
  connected: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
  hasAccessToken: boolean;
  accessTokenExpiresAt?: string;
  redirectUri: string;
  channelTitle?: string;
  channelId?: string;
  customUrl?: string;
  subscriberCount?: number;
  configured: boolean;
  scopes: string[];
}

export interface AppSettings {
  youtube: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    refreshToken?: string;
    accessToken?: string;
    hasClientId?: boolean;
    hasClientSecret?: boolean;
    hasRefreshToken?: boolean;
    hasAccessToken?: boolean;
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

export interface AppStatus {
  channel: ConnectedChannel;
  automation: AutomationSettings;
  counts: {
    totalVideos: number;
    waiting: number;
    inProgress: number;
    ready: number;
    published: number;
    failed: number;
    todayGenerated: number;
    todayPublished: number;
    dailyTarget: number;
  };
  nextScheduledUpload: string | null;
  storageUsage: {
    bytes: number;
    formatted: string;
  };
  apiStatus: {
    geminiConfigured: boolean;
    youtubeOAuthConfigured: boolean;
    adamVoiceAuthorized: boolean;
    elevenLabsConfigured: boolean;
    ffmpegAvailable: boolean;
  };
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  category: 'generation' | 'rendering' | 'youtube' | 'automation' | 'system';
  message: string;
  details?: any;
}

export interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  subscribersGained: number;
  averageViewPercentage: number;
  estimatedMinutesWatched: number;
  dailyData: Array<{ date: string; views: number; likes: number; subscribers: number }>;
  topVideos: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    retention: number;
    thumbnailUrl: string;
  }>;
}
