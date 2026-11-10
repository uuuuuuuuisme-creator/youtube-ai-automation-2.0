import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Youtube,
  HardDrive,
  Cpu,
  ArrowRight,
  TrendingUp,
  Sliders,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { AppStatus, VideoItem } from '../types';
import { api } from '../api';

interface DashboardPageProps {
  status: AppStatus | null;
  recentVideos: VideoItem[];
  onSelectTab: (tab: string) => void;
  onOpenVideo: (video: VideoItem) => void;
  onRefresh: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  status,
  recentVideos,
  onSelectTab,
  onOpenVideo,
  onRefresh,
}) => {
  const [triggering, setTriggering] = useState<string | null>(null);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get('auth');
      const msg = params.get('message');
      if (auth === 'success') {
        // Clean up URL parameters
        window.history.replaceState({}, '', window.location.pathname);
        return {
          type: 'success',
          message: 'YouTube Channel connected successfully via Google OAuth 2.0! Permissions granted.',
        };
      } else if (auth === 'error') {
        window.history.replaceState({}, '', window.location.pathname);
        return {
          type: 'error',
          message: msg ? decodeURIComponent(msg) : 'Failed to authorize YouTube channel. Please check Google Cloud settings.',
        };
      }
    }
    return null;
  });

  const handleConnectYouTube = async () => {
    try {
      setConnectingOAuth(true);
      const authInfo = await api.getGoogleAuthUrl();
      if (!authInfo.configured) {
        alert(
          `Google OAuth Setup Required:\n\nPlease configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your Vercel or environment variables.\n\nAuthorized Callback URL:\n${authInfo.redirectUri}`
        );
        onSelectTab('youtube');
        return;
      }
      // Redirect to Google OAuth consent screen
      window.location.href = authInfo.url;
    } catch (e: any) {
      alert(`OAuth initialization error: ${e.message}`);
    } finally {
      setConnectingOAuth(false);
    }
  };

  const handleAutomationAction = async (action: 'enable' | 'pause' | 'resume' | 'stop') => {
    try {
      setTriggering(action);
      await api.controlAutomation(action);
      onRefresh();
    } catch (e: any) {
      alert(`Automation error: ${e.message}`);
    } finally {
      setTriggering(null);
    }
  };

  const handleQuickGenerate = async (type: 'generate_now' | 'generate_2_now') => {
    try {
      setTriggering(type);
      await api.controlAutomation(type);
      onRefresh();
      onSelectTab('queue');
    } catch (e: any) {
      alert(`Generation error: ${e.message}`);
    } finally {
      setTriggering(null);
    }
  };

  const channel = status?.channel;
  const counts = status?.counts;
  const automation = status?.automation;

  return (
    <div className="space-y-6 pb-12">
      {/* OAuth Callback Success / Error Feedback Alert */}
      {authFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            authFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {authFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{authFeedback.message}</span>
          </div>
          <button
            onClick={() => setAuthFeedback(null)}
            className="text-neutral-400 hover:text-white text-xs ml-4 font-mono underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Welcome & Automation Status Strip */}
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 font-mono">
              24/7 CLOUD AUTOMATION
            </span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-xs text-neutral-400 font-mono">
              Target: {automation?.dailyTarget || 2} Shorts/Day
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            ShortForge <span className="text-amber-400">AI</span> Studio
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl">
            Autonomous Faceless YouTube Shorts pipeline. Continuous research, Adam Voice narration, 1080×1920 MP4 rendering, and scheduled publishing.
          </p>
        </div>

        {/* Automation State & Quick Control */}
        <div className="flex flex-col sm:flex-row lg:flex-col justify-center gap-2.5 shrink-0 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800/80">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-neutral-400">Cloud Worker:</span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded font-mono ${
                automation?.status === 'running'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : automation?.status === 'paused'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {automation?.status === 'running'
                ? 'ACTIVE'
                : automation?.status === 'paused'
                ? 'PAUSED'
                : 'STOPPED'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {automation?.status === 'running' ? (
              <button
                onClick={() => handleAutomationAction('pause')}
                disabled={!!triggering}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
              >
                Pause Worker
              </button>
            ) : (
              <button
                onClick={() => handleAutomationAction('enable')}
                disabled={!!triggering}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors shadow-sm"
              >
                Start Worker
              </button>
            )}

            <button
              onClick={() => handleQuickGenerate('generate_2_now')}
              disabled={!!triggering}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-400/20 transition-colors"
            >
              Generate 2 Now
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Videos Generated */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Total Generated</span>
            <Layers className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
            {counts?.totalVideos || 0}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>Ready in library</span>
            <span className="font-mono text-emerald-400">{counts?.ready || 0}</span>
          </div>
        </div>

        {/* Videos Published */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Published / Scheduled</span>
            <Youtube className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
            {counts?.published || 0}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>On YouTube</span>
            <span className="font-mono text-red-400">{counts?.todayPublished || 0} today</span>
          </div>
        </div>

        {/* Video Queue Waiting */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Waiting in Queue</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
            {counts?.waiting || 0}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>In production</span>
            <span className="font-mono text-neutral-300">{counts?.inProgress || 0} active</span>
          </div>
        </div>

        {/* Today's Target Progress */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Today's Target</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
            {counts?.todayPublished || 0} <span className="text-sm font-normal text-neutral-500">/ {counts?.dailyTarget || 2}</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  (((counts?.todayPublished || 0) / (counts?.dailyTarget || 2)) * 100)
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Connected Channel & Next Upload Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Connected YouTube Channel Card with Prominent Connect Button */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 shadow-sm">
                <Youtube className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-display">
                    {channel?.connected ? channel.channelTitle : 'YouTube Channel'}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      channel?.connected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {channel?.connected ? 'CONNECTED (OAuth 2.0)' : 'DISCONNECTED'}
                  </span>
                </div>
                <div className="text-xs text-neutral-400 mt-0.5 font-mono">
                  {channel?.connected
                    ? `${channel.customUrl || '@channel'} · Channel ID: ${channel.channelId || 'Configured'}`
                    : 'Connect YouTube Data API v3 to automate Shorts publishing'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {channel?.connected ? (
                <button
                  onClick={handleConnectYouTube}
                  disabled={connectingOAuth}
                  className="text-xs px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
                  title="Switch or re-authorize YouTube account"
                >
                  Reconnect
                </button>
              ) : null}
              <button
                onClick={() => onSelectTab('youtube')}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-medium"
              >
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {channel?.connected ? (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-800/80 text-center">
              <div>
                <span className="text-[11px] text-neutral-500 block">Subscribers</span>
                <span className="text-sm font-bold text-white font-mono tabular-nums">
                  {(channel?.subscriberCount || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-500 block">Total Views</span>
                <span className="text-sm font-bold text-white font-mono tabular-nums">
                  {(channel?.viewCount || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-500 block">API Permissions</span>
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  v3 Upload Active
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-neutral-800/80">
              <div className="text-xs text-neutral-400">
                Grant permission for video upload, playlist management, and channel metrics.
              </div>
              <button
                onClick={handleConnectYouTube}
                disabled={connectingOAuth}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white transition-all shadow-md shadow-red-600/25 flex items-center justify-center gap-2 shrink-0 font-display"
              >
                <Youtube className="w-4 h-4 fill-current" />
                <span>{connectingOAuth ? 'Starting OAuth...' : 'Connect YouTube'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Next Scheduled Upload & Pipeline Status */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span>Next Scheduled Upload</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {status?.nextScheduledUpload ? (
                new Date(status.nextScheduledUpload).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              ) : (
                <span className="text-neutral-400 text-sm font-normal">
                  Standard Daily: 12:00 PM / 7:00 PM ({automation?.timezone || 'America/New_York'})
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Cloud scheduler will automatically research fresh topics, synthesize Adam Voice, render the MP4, and upload.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-neutral-800/80">
            <button
              onClick={() => onSelectTab('generate')}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Create Custom Short</span>
            </button>
            <button
              onClick={() => onSelectTab('queue')}
              className="py-2 px-3 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              View Queue
            </button>
          </div>
        </div>
      </div>

      {/* Recent Videos Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-display">Recent Videos</h2>
            <p className="text-xs text-neutral-400">
              Vertical 1080×1920 MP4 Shorts ready for review, download, and publishing
            </p>
          </div>
          <button
            onClick={() => onSelectTab('library')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
          >
            <span>View Full Library ({counts?.totalVideos || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentVideos.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-amber-400/40 mx-auto" />
            <div className="text-sm font-medium text-white">No videos generated yet</div>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Start by generating your first AI YouTube Short or enable Cloud Automation to produce 2 videos daily.
            </p>
            <button
              onClick={() => onSelectTab('generate')}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-sm"
            >
              Generate First Short
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {recentVideos.slice(0, 5).map((v) => (
              <div
                key={v.id}
                onClick={() => onOpenVideo(v)}
                className="group relative rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
              >
                {/* 9:16 Aspect Thumbnail Container */}
                <div className="relative aspect-[9/16] bg-neutral-950 overflow-hidden">
                  {v.thumbnailUrl ? (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-neutral-950 text-neutral-500">
                      <Sparkles className="w-6 h-6 text-amber-400/40 mb-1" />
                      <span className="text-[10px] font-mono text-neutral-400">{v.status}</span>
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Duration Tag */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white font-medium">
                    {v.durationTarget}s
                  </span>

                  {/* Status Tag */}
                  <span
                    className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium backdrop-blur-md ${
                      v.status === 'Ready' || v.status === 'Published'
                        ? 'bg-emerald-500/80 text-white'
                        : v.status === 'Failed'
                        ? 'bg-red-500/80 text-white'
                        : 'bg-amber-500/80 text-neutral-950'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                {/* Card Info */}
                <div className="p-2.5">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                    {v.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1">
                    <span>{v.niche}</span>
                    <span className="font-mono text-neutral-400">{v.voiceName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Engine & Pipeline Health Bar */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-neutral-400">Gemini 3.8 Flash Brain:</span>
            <span className="text-white font-mono">Active</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-neutral-400">Adam Voice:</span>
            <span className="text-white font-mono">Authorized ({automation?.defaultNiche})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-neutral-400">FFmpeg 1080×1920:</span>
            <span className="text-white font-mono">Native /usr/bin/ffmpeg</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Storage Used:</span>
            <span className="text-white font-mono">{status?.storageUsage?.formatted || '0 MB'}</span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-neutral-400 hover:text-white"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh State</span>
        </button>
      </div>
    </div>
  );
};
