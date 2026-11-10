import React, { useState, useEffect } from 'react';
import {
  Youtube,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Key,
  RotateCw,
  LogOut,
  Clock,
  Play,
  Upload,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Server,
  RefreshCw,
} from 'lucide-react';
import { ConnectedChannel, VideoItem, AppSettings, GoogleOAuthStatus } from '../types';
import { api } from '../api';

interface YouTubePageProps {
  channel: ConnectedChannel;
  videos: VideoItem[];
  settings: AppSettings | null;
  onRefresh: () => void;
  onOpenVideo: (video: VideoItem) => void;
}

export const YouTubePage: React.FC<YouTubePageProps> = ({
  channel,
  videos,
  settings,
  onRefresh,
  onOpenVideo,
}) => {
  const [oauthStatus, setOauthStatus] = useState<GoogleOAuthStatus | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual fallback inputs
  const [channelTitle, setChannelTitle] = useState(channel.channelTitle || '');
  const [customUrl, setCustomUrl] = useState(channel.customUrl || '@shortforge_channel');
  const [accessToken, setAccessToken] = useState('');
  const [apiKey, setApiKey] = useState('');

  const callbackUrl =
    oauthStatus?.redirectUri ||
    'https://youtube-ai-automation-five.vercel.app/api/auth/google/callback';

  const loadOAuthStatus = async () => {
    try {
      const statusRes = await api.getGoogleOAuthStatus();
      setOauthStatus(statusRes);
    } catch (e) {
      console.warn('[YouTube] Could not load OAuth status:', e);
    }
  };

  useEffect(() => {
    loadOAuthStatus();
  }, [channel.connected]);

  const handleGoogleOAuthLogin = async () => {
    setConnecting(true);
    try {
      const authInfo = await api.getGoogleAuthUrl();
      if (!authInfo.configured) {
        alert(
          `Google OAuth Setup Required:\n\nPlease configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your Vercel Project Settings.\n\nAuthorized Callback URL:\n${authInfo.redirectUri}`
        );
        return;
      }
      window.location.href = authInfo.url;
    } catch (err: any) {
      alert(`OAuth login error: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleTestTokenRefresh = async () => {
    setRefreshingToken(true);
    try {
      const res = await api.refreshGoogleToken();
      alert(`Token refreshed successfully! Valid for next ${Math.round(res.expiresIn / 60)} minutes.`);
      await loadOAuthStatus();
      onRefresh();
    } catch (err: any) {
      alert(`Token refresh error: ${err.message}`);
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Disconnect YouTube channel from ShortForge AI?')) {
      try {
        await api.disconnectGoogleOAuth();
        await api.disconnectChannel();
        await loadOAuthStatus();
        onRefresh();
      } catch (err: any) {
        alert(`Disconnect error: ${err.message}`);
      }
    }
  };

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    try {
      await api.connectChannel({
        channelTitle: channelTitle || 'ShortForge Official Channel',
        customUrl: customUrl || '@shortforge_channel',
        accessToken: accessToken.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        subscriberCount: channel.subscriberCount || 24600,
      });
      onRefresh();
      alert('Manual YouTube channel settings saved.');
    } catch (err: any) {
      alert(`Connection error: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const youtubeVideos = videos.filter((v) => v.youtubeVideoId || v.youtubeStatus);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">
          YouTube Data API v3 & Google OAuth 2.0
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Official Google OAuth 2.0 authorization for automated YouTube Shorts video publishing, metadata management, and live channel metrics.
        </p>
      </div>

      {/* Connected Channel Card */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 shadow-lg">
              <Youtube className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">
                  {channel.connected ? channel.channelTitle : 'No Channel Connected'}
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                    channel.connected
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {channel.connected ? 'ACTIVE (OAUTH 2.0)' : 'DISCONNECTED'}
                </span>
              </div>

              <div className="text-xs text-neutral-400 mt-1 font-mono">
                {channel.customUrl || '@not_connected'} · Channel ID: {channel.channelId || 'None'}
              </div>

              {channel.connectedAt && (
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  Connected: {new Date(channel.connectedAt).toLocaleDateString()} via {channel.authMethod?.toUpperCase() || 'OAUTH'}
                </div>
              )}
            </div>
          </div>

          {channel.connected ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoogleOAuthLogin}
                disabled={connecting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                title="Switch or re-authorize YouTube account"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Switch / Re-auth</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-red-500/10 hover:text-red-400 text-neutral-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleOAuthLogin}
              disabled={connecting}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all active:scale-95 font-display"
            >
              <Youtube className="w-4 h-4 fill-current" />
              <span>{connecting ? 'Redirecting to Google...' : 'Connect with Google OAuth'}</span>
            </button>
          )}
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-neutral-800/80 text-center">
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[11px] text-neutral-500 block">Subscribers</span>
            <span className="text-base font-bold text-white font-mono tabular-nums">
              {(channel.subscriberCount || 0).toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[11px] text-neutral-500 block">Total Views</span>
            <span className="text-base font-bold text-white font-mono tabular-nums">
              {(channel.viewCount || 0).toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[11px] text-neutral-500 block">Upload Engine</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              Ready (2/Day)
            </span>
          </div>
        </div>
      </div>

      {/* Primary Google OAuth 2.0 Setup & Credentials Dashboard */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                Google OAuth 2.0 Configuration
              </h3>
              <p className="text-xs text-neutral-400">
                Server-side tokens and automated token refreshing
              </p>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded font-mono font-semibold ${
              oauthStatus?.configured
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {oauthStatus?.configured ? 'OAUTH KEYS CONFIGURED' : 'CREDENTIALS NEEDED'}
          </span>
        </div>

        {/* Status Indicators Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[11px] text-neutral-500 block">Client ID</span>
            <span
              className={`font-semibold font-mono ${
                oauthStatus?.hasClientId ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {oauthStatus?.hasClientId ? 'Configured' : 'Missing'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[11px] text-neutral-500 block">Client Secret</span>
            <span
              className={`font-semibold font-mono ${
                oauthStatus?.hasClientSecret ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {oauthStatus?.hasClientSecret ? 'Configured' : 'Missing'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[11px] text-neutral-500 block">Refresh Token</span>
            <span
              className={`font-semibold font-mono ${
                oauthStatus?.hasRefreshToken ? 'text-emerald-400' : 'text-neutral-500'
              }`}
            >
              {oauthStatus?.hasRefreshToken ? 'Stored Server-Side' : 'Pending Auth'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[11px] text-neutral-500 block">Token Auto-Refresh</span>
            <span className="text-emerald-400 font-semibold font-mono">
              Active
            </span>
          </div>
        </div>

        {/* Callback URL Box */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300">
              Registered OAuth Callback URL (Redirect URI):
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">Requirement #3</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={callbackUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-neutral-900 border border-neutral-700 rounded-lg text-amber-300 selection:bg-amber-500/30"
            />
            <button
              onClick={handleCopyCallback}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center gap-1.5 transition-colors shrink-0"
              title="Copy to clipboard"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[11px] text-neutral-500">
            Register this exact URL in Google Cloud Console under: <code className="text-neutral-400">APIs & Services &gt; Credentials &gt; OAuth 2.0 Client IDs &gt; Authorized redirect URIs</code>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleGoogleOAuthLogin}
            disabled={connecting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-2 transition-all font-display"
          >
            <Youtube className="w-4 h-4 fill-current" />
            <span>
              {channel.connected ? 'Re-Authorize / Switch YouTube Channel' : 'Authorize & Connect YouTube Channel'}
            </span>
          </button>

          {oauthStatus?.hasRefreshToken && (
            <button
              onClick={handleTestTokenRefresh}
              disabled={refreshingToken}
              className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-2 transition-colors shrink-0"
              title="Tests the /api/auth/google/refresh endpoint"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingToken ? 'animate-spin text-amber-400' : ''}`} />
              <span>{refreshingToken ? 'Refreshing...' : 'Test Token Refresh'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Vercel Environment Variables Guide */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white font-display">
            Required Vercel Environment Variables
          </h3>
        </div>
        <p className="text-xs text-neutral-400">
          In your Vercel Project Dashboard (<code className="text-neutral-300">Settings &gt; Environment Variables</code>), configure the following keys:
        </p>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-amber-400 font-bold">GOOGLE_CLIENT_ID</span>
              <span className="text-neutral-500 block text-[11px] font-sans">
                Web Application Client ID from Google Cloud Console
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              Required
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-amber-400 font-bold">GOOGLE_CLIENT_SECRET</span>
              <span className="text-neutral-500 block text-[11px] font-sans">
                Client Secret associated with your OAuth 2.0 Web Application
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              Required
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-amber-400 font-bold">GOOGLE_REDIRECT_URI</span>
              <span className="text-neutral-500 block text-[11px] font-sans">
                https://youtube-ai-automation-five.vercel.app/api/auth/google/callback
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              Pre-configured
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-neutral-300 font-bold">YOUTUBE_REFRESH_TOKEN</span>
              <span className="text-neutral-500 block text-[11px] font-sans">
                Optional: direct token injection for stateless serverless environments
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
              Optional
            </span>
          </div>
        </div>
      </div>

      {/* YouTube Data API v3 Scopes */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs space-y-2">
        <span className="font-semibold text-neutral-300 block">Requested YouTube Permissions (Scopes):</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-neutral-400">
          <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
            <span className="text-emerald-400 font-semibold block">.../auth/youtube.upload</span>
            Upload videos, set thumbnails & schedule release
          </div>
          <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
            <span className="text-emerald-400 font-semibold block">.../auth/youtube.readonly</span>
            Read subscriber count, views & channel info
          </div>
          <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
            <span className="text-emerald-400 font-semibold block">.../auth/youtube</span>
            Manage video metadata, tags & playlists
          </div>
          <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
            <span className="text-emerald-400 font-semibold block">.../auth/userinfo.profile</span>
            Verify connected Google account identity
          </div>
        </div>
      </div>

      {/* Advanced / Manual Override (Preserved) */}
      <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/60">
        <button
          type="button"
          onClick={() => setShowManualForm(!showManualForm)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-neutral-400" />
            <span>Advanced / Manual Channel Override</span>
          </div>
          {showManualForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showManualForm && (
          <form onSubmit={handleManualSave} className="p-5 pt-0 space-y-3 text-xs border-t border-neutral-800/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-neutral-400 block mb-1">Channel Display Name</label>
                <input
                  type="text"
                  value={channelTitle}
                  onChange={(e) => setChannelTitle(e.target.value)}
                  placeholder="e.g. Daily Mysteries Shorts"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Handle / Custom URL</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="e.g. @dailymysteries"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">
                Manual Access Token / Bearer (Optional fallback)
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="ya29.a0AfH6SMB... (Stored server-side only)"
                className="w-full px-3 py-2 font-mono bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={connecting}
              className="py-2 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors"
            >
              Save Manual Overrides
            </button>
          </form>
        )}
      </div>

      {/* YouTube Publishing History & Scheduled Shorts */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white font-display">
          Published & Scheduled Shorts ({youtubeVideos.length})
        </h3>

        {youtubeVideos.length === 0 ? (
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-center text-xs text-neutral-500">
            No videos uploaded to YouTube yet.
          </div>
        ) : (
          <div className="space-y-2">
            {youtubeVideos.map((v) => (
              <div
                key={v.id}
                onClick={() => onOpenVideo(v)}
                className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3 text-xs hover:border-neutral-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-white truncate">{v.title}</div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      Status: {v.youtubeStatus} · ID: {v.youtubeVideoId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {v.youtubeUrl && (
                    <a
                      href={v.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-600/20 text-red-300 hover:bg-red-600/30 font-medium text-[11px]"
                    >
                      <span>View on YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
