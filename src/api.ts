import {
  AppStatus,
  ConnectedChannel,
  AppSettings,
  VideoItem,
  SystemLog,
  AnalyticsData,
  AIEmployee,
  GoogleOAuthStatus,
} from './types';

export const api = {
  getStatus: async (): Promise<AppStatus> => {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  getChannel: async (): Promise<ConnectedChannel> => {
    const res = await fetch('/api/channel');
    if (!res.ok) throw new Error('Failed to fetch channel');
    return res.json();
  },

  connectChannel: async (data: Partial<ConnectedChannel & { accessToken?: string; apiKey?: string }>): Promise<ConnectedChannel> => {
    const res = await fetch('/api/channel/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to connect channel');
    }
    return res.json();
  },

  disconnectChannel: async (): Promise<ConnectedChannel> => {
    const res = await fetch('/api/channel/disconnect', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to disconnect channel');
    return res.json();
  },

  getSettings: async (): Promise<AppSettings> => {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update settings');
    }
    return res.json();
  },

  getVideos: async (params?: { status?: string; niche?: string; search?: string }): Promise<VideoItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.niche) searchParams.set('niche', params.niche);
    if (params?.search) searchParams.set('search', params.search);

    const res = await fetch(`/api/videos?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch videos');
    return res.json();
  },

  getVideo: async (id: string): Promise<VideoItem> => {
    const res = await fetch(`/api/videos/${id}`);
    if (!res.ok) throw new Error('Failed to fetch video');
    return res.json();
  },

  deleteVideo: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete video');
    return res.json();
  },

  regenerateVideo: async (id: string): Promise<VideoItem> => {
    const res = await fetch(`/api/videos/${id}/regenerate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to regenerate video');
    return res.json();
  },

  uploadVideo: async (
    id: string,
    options?: { privacyStatus?: string; scheduledTime?: string; madeForKids?: boolean }
  ): Promise<{ video: VideoItem; uploadResult: any }> => {
    const res = await fetch(`/api/videos/${id}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload video to YouTube');
    }
    return res.json();
  },

  generateTopics: async (niche: string, count = 5): Promise<Array<{ title: string; hook: string; angle: string }>> => {
    const res = await fetch('/api/generate/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche, count }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate topics');
    }
    const data = await res.json();
    return data.topics || [];
  },

  queueSingleVideo: async (params: {
    niche: string;
    topic?: string;
    durationTarget?: number;
    voiceStyle?: string;
    voiceSpeed?: number;
    scheduledTime?: string;
    assignedEmployeeId?: string;
  }): Promise<VideoItem> => {
    const res = await fetch('/api/generate/single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to queue video');
    }
    return res.json();
  },

  queueBatchVideos: async (params: {
    quantity: number;
    niche: string;
    durationTarget?: number;
    voiceStyle?: string;
    customTopics?: string[];
    assignedEmployeeId?: string;
  }): Promise<{ count: number; videos: VideoItem[] }> => {
    const res = await fetch('/api/generate/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to queue batch');
    }
    return res.json();
  },

  controlAutomation: async (
    action: 'enable' | 'pause' | 'resume' | 'stop' | 'generate_now' | 'generate_2_now' | 'update_config',
    payload?: any
  ): Promise<any> => {
    const res = await fetch('/api/automation/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...(payload || {}) }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to execute automation control');
    }
    return res.json();
  },

  previewVoice: async (params: {
    text?: string;
    speed?: number;
    volume?: number;
    voiceStyle?: string;
  }): Promise<{ audioUrl: string; durationSeconds: number; voiceUsed: string }> => {
    const res = await fetch('/api/voice/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to preview voice');
    }
    return res.json();
  },

  getAnalytics: async (): Promise<AnalyticsData> => {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  getLogs: async (limit = 100): Promise<SystemLog[]> => {
    const res = await fetch(`/api/logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },

  getSystemUsage: async (): Promise<any> => {
    const res = await fetch('/api/system/usage');
    if (!res.ok) throw new Error('Failed to fetch system usage');
    return res.json();
  },

  getEmployees: async (): Promise<AIEmployee[]> => {
    const res = await fetch('/api/employees');
    if (!res.ok) throw new Error('Failed to fetch AI employees');
    return res.json();
  },

  createEmployee: async (data: Partial<AIEmployee>): Promise<AIEmployee> => {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create AI employee');
    }
    return res.json();
  },

  updateEmployee: async (id: string, data: Partial<AIEmployee>): Promise<AIEmployee> => {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update AI employee');
    }
    return res.json();
  },

  deleteEmployee: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete AI employee');
    return res.json();
  },

  testEmployee: async (id: string, topic?: string): Promise<{ hook: string; script: string; title: string }> => {
    const res = await fetch(`/api/employees/${id}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to run test generation');
    }
    return res.json();
  },

  getGoogleAuthUrl: async (params?: {
    redirectUri?: string;
    state?: string;
  }): Promise<{ url: string; redirectUri: string; configured: boolean; missingConfig?: string[] }> => {
    const sp = new URLSearchParams();
    if (params?.redirectUri) sp.set('redirect_uri', params.redirectUri);
    if (params?.state) sp.set('state', params.state);
    const res = await fetch(`/api/auth/google/url?${sp.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch Google OAuth URL');
    return res.json();
  },

  getGoogleOAuthStatus: async (): Promise<GoogleOAuthStatus> => {
    const res = await fetch('/api/auth/google/status');
    if (!res.ok) throw new Error('Failed to fetch Google OAuth status');
    return res.json();
  },

  refreshGoogleToken: async (): Promise<{ success: boolean; expiresIn: number }> => {
    const res = await fetch('/api/auth/google/refresh', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to refresh token');
    }
    return res.json();
  },

  disconnectGoogleOAuth: async (): Promise<{ success: boolean }> => {
    const res = await fetch('/api/auth/google/disconnect', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to disconnect Google OAuth');
    }
    return res.json();
  },
};

