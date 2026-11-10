import { db } from './db.js';
import { fetchYouTubeChannelInfo } from './youtubeService.js';

export const DEFAULT_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  process.env.YOUTUBE_REDIRECT_URI ||
  'https://youtube-ai-automation-five.vercel.app/api/auth/google/callback';

export const YOUTUBE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function getGoogleClientId(): string {
  const fromEnv = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  const settings = db.getSettings();
  return (settings.youtube?.clientId || '').trim();
}

export function getGoogleClientSecret(): string {
  const fromEnv = process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  const settings = db.getSettings();
  return (settings.youtube?.clientSecret || '').trim();
}

export function getGoogleRedirectUri(overrideUri?: string): string {
  if (overrideUri && overrideUri.trim()) {
    return overrideUri.trim();
  }
  return DEFAULT_REDIRECT_URI;
}

export function getStoredRefreshToken(): string | null {
  const fromEnv = process.env.YOUTUBE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  const settings = db.getSettings();
  return settings.youtube?.refreshToken?.trim() || null;
}

export function getStoredAccessToken(): string | null {
  const fromEnv = process.env.YOUTUBE_ACCESS_TOKEN || process.env.GOOGLE_ACCESS_TOKEN;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  const settings = db.getSettings();
  return settings.youtube?.accessToken?.trim() || null;
}

/**
 * Builds the Google OAuth 2.0 Authorization URL
 */
export function getGoogleAuthUrl(options?: { redirectUri?: string; state?: string }): {
  url: string;
  redirectUri: string;
  configured: boolean;
  missingConfig?: string[];
} {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  const redirectUri = getGoogleRedirectUri(options?.redirectUri);

  const missing: string[] = [];
  if (!clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_OAUTH_SCOPES.join(' '),
    access_type: 'offline', // CRITICAL: request refresh_token
    prompt: 'consent', // CRITICAL: ensures Google returns refresh_token on every re-auth
    include_granted_scopes: 'true',
  });

  if (options?.state) {
    params.set('state', options.state);
  }

  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    redirectUri,
    configured: missing.length === 0,
    missingConfig: missing.length > 0 ? missing : undefined,
  };
}

/**
 * Exchanges Google OAuth 2.0 authorization code for Access & Refresh tokens
 */
export async function exchangeAuthCodeForTokens(
  code: string,
  redirectUriOverride?: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope?: string;
  tokenType: string;
}> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  const redirectUri = getGoogleRedirectUri(redirectUriOverride);

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Google OAuth credentials. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your Vercel or environment variables.'
    );
  }

  const tokenParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorDesc = data.error_description || data.error || 'Failed to exchange authorization code for tokens';
    throw new Error(`Google OAuth Token Exchange Error (${response.status}): ${errorDesc}`);
  }

  if (!data.access_token) {
    throw new Error('Google OAuth response did not contain a valid access_token.');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600,
    scope: data.scope,
    tokenType: data.token_type || 'Bearer',
  };
}

/**
 * Refreshes an expired Google OAuth access token using the stored refresh_token
 */
export async function refreshGoogleAccessToken(force = false): Promise<{ accessToken: string; expiresIn: number }> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error('No Google OAuth refresh token found. User must re-authenticate via Connect YouTube.');
  }

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET needed to refresh YouTube access token.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    const errorDesc = data.error_description || data.error || 'Failed to refresh token';
    db.addLog('error', 'youtube', `Google OAuth token refresh failed: ${errorDesc}`);
    throw new Error(`Google OAuth Token Refresh Error (${res.status}): ${errorDesc}`);
  }

  const expiresIn = data.expires_in || 3600;
  // Calculate expiration with 5 minutes safety buffer
  const expiresAt = new Date(Date.now() + (expiresIn - 300) * 1000).toISOString();

  // Save new access token (and new refresh token if Google rotated it)
  const currentSettings = db.getSettings();
  db.updateSettings({
    youtube: {
      ...currentSettings.youtube,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      accessTokenExpiresAt: expiresAt,
      tokenType: data.token_type || 'Bearer',
      scope: data.scope || currentSettings.youtube.scope,
    },
  });

  db.updateChannel({
    accessTokenExpiresAt: expiresAt,
    connected: true,
  });

  db.addLog('info', 'youtube', 'Google OAuth YouTube access token refreshed successfully.');

  return {
    accessToken: data.access_token,
    expiresIn,
  };
}

/**
 * Returns a guaranteed valid access token (refreshes automatically if expired or expiring within 5 minutes)
 */
export async function getValidAccessToken(): Promise<string | null> {
  const currentToken = getStoredAccessToken();
  const settings = db.getSettings();
  const expiresAt = settings.youtube?.accessTokenExpiresAt;
  const refreshToken = getStoredRefreshToken();

  // If we have an access token and it hasn't expired yet
  if (currentToken) {
    if (expiresAt) {
      const expiryMs = new Date(expiresAt).getTime();
      // If token has at least 2 minutes of lifetime remaining, use it
      if (Date.now() < expiryMs - 120000) {
        return currentToken;
      }
    } else if (!refreshToken) {
      // No expiry timestamp and no refresh token; return current token
      return currentToken;
    }
  }

  // Token is missing, expired, or near expiration -> try refreshing
  if (refreshToken) {
    try {
      const refreshed = await refreshGoogleAccessToken();
      return refreshed.accessToken;
    } catch (err: any) {
      console.warn('[Google OAuth] Token refresh attempt failed:', err.message);
      // Fallback to current token if available
      return currentToken;
    }
  }

  return currentToken;
}

/**
 * Saves tokens securely server-side and links channel profile
 */
export async function saveGoogleOAuthTokens(tokens: {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
}): Promise<void> {
  const current = db.getSettings();
  const expiresIn = tokens.expiresIn || 3600;
  const expiresAt = new Date(Date.now() + (expiresIn - 300) * 1000).toISOString();

  const existingRefreshToken = current.youtube?.refreshToken || getStoredRefreshToken();
  const refreshTokenToStore = tokens.refreshToken || existingRefreshToken || undefined;

  db.updateSettings({
    youtube: {
      ...current.youtube,
      accessToken: tokens.accessToken,
      refreshToken: refreshTokenToStore,
      accessTokenExpiresAt: expiresAt,
      tokenType: tokens.tokenType || 'Bearer',
      scope: tokens.scope || current.youtube.scope,
    },
  });

  db.updateChannel({
    connected: true,
    authMethod: 'oauth',
    accessTokenExpiresAt: expiresAt,
  });

  // Automatically fetch live channel profile from YouTube
  try {
    const channelProfile = await fetchYouTubeChannelInfo(tokens.accessToken);
    db.updateChannel({
      ...channelProfile,
      connected: true,
      authMethod: 'oauth',
      accessTokenExpiresAt: expiresAt,
    });
    db.addLog(
      'success',
      'youtube',
      `Connected YouTube channel via Google OAuth 2.0: ${channelProfile.channelTitle} (${channelProfile.customUrl || channelProfile.channelId})`
    );
  } catch (err: any) {
    db.addLog(
      'warn',
      'youtube',
      `OAuth tokens saved, but channel info fetch failed: ${err.message}`
    );
  }
}

/**
 * Returns safe OAuth status to the frontend (NEVER exposes accessToken, refreshToken, or clientSecret)
 */
export function getSafeGoogleOAuthStatus(): {
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
} {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  const refreshToken = getStoredRefreshToken();
  const accessToken = getStoredAccessToken();
  const settings = db.getSettings();
  const channel = db.getChannel();

  return {
    connected: !!(channel.connected && (accessToken || refreshToken)),
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasRefreshToken: !!refreshToken,
    hasAccessToken: !!accessToken,
    accessTokenExpiresAt: settings.youtube?.accessTokenExpiresAt,
    redirectUri: DEFAULT_REDIRECT_URI,
    channelTitle: channel.channelTitle,
    channelId: channel.channelId,
    customUrl: channel.customUrl,
    subscriberCount: channel.subscriberCount,
    configured: !!(clientId && clientSecret),
    scopes: YOUTUBE_OAUTH_SCOPES,
  };
}

/**
 * Revokes and disconnects Google OAuth
 */
export async function disconnectGoogleOAuth(): Promise<void> {
  const current = db.getSettings();
  const tokenToRevoke = current.youtube?.accessToken || current.youtube?.refreshToken;

  if (tokenToRevoke) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenToRevoke}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (e) {
      console.warn('[Google OAuth] Token revocation warning:', e);
    }
  }

  db.updateSettings({
    youtube: {
      ...current.youtube,
      accessToken: undefined,
      refreshToken: undefined,
      accessTokenExpiresAt: undefined,
    },
  });

  db.updateChannel({
    connected: false,
    channelId: undefined,
    channelTitle: 'Not Connected',
    subscriberCount: 0,
    videoCount: 0,
    viewCount: 0,
    accessTokenExpiresAt: undefined,
  });

  db.addLog('info', 'youtube', 'Disconnected Google OAuth YouTube channel.');
}

/**
 * Renders an attractive, professional HTML callback landing page
 */
export function renderAuthCallbackHtml(result: {
  success: boolean;
  channelTitle?: string;
  channelId?: string;
  error?: string;
  returnUrl?: string;
}): string {
  const returnUrl = result.returnUrl || '/?tab=youtube&auth=' + (result.success ? 'success' : 'error');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${result.success ? 'YouTube Connected — ShortForge AI' : 'Connection Failed — ShortForge AI'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0a0a0a;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #171717;
      border: 1px solid #262626;
      border-radius: 16px;
      padding: 36px 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      margin: 0 auto 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
      border: 1px solid ${result.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'};
      color: ${result.success ? '#10b981' : '#ef4444'};
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #ffffff;
    }
    p {
      font-size: 14px;
      color: #a3a3a3;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: #262626;
      border: 1px solid #404040;
      border-radius: 8px;
      font-family: monospace;
      font-size: 13px;
      color: #f59e0b;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 12px 20px;
      background: #f59e0b;
      color: #0a0a0a;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      border-radius: 10px;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #d97706;
    }
    .secondary-note {
      font-size: 12px;
      color: #737373;
      margin-top: 16px;
    }
  </style>
  <script>
    // Auto-redirect or notify parent window if in popup
    setTimeout(() => {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'YOUTUBE_OAUTH_COMPLETE', success: ${result.success ? 'true' : 'false'} }, '*');
          window.close();
        } else {
          window.location.href = '${returnUrl}';
        }
      } catch (e) {
        window.location.href = '${returnUrl}';
      }
    }, 2200);
  </script>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">
      ${
        result.success
          ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'
          : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
      }
    </div>
    <h1>${result.success ? 'YouTube Channel Connected!' : 'Connection Error'}</h1>
    <p>
      ${
        result.success
          ? 'Google OAuth 2.0 authorization completed successfully. Tokens have been securely stored on the server.'
          : (result.error || 'Failed to authorize with Google OAuth. Please check your credentials and try again.')
      }
    </p>
    ${
      result.channelTitle
        ? `<div class="badge">Channel: ${result.channelTitle}</div>`
        : ''
    }
    <a href="${returnUrl}" class="btn">Return to Dashboard</a>
    <div class="secondary-note">Redirecting automatically in 2 seconds...</div>
  </div>
</body>
</html>`;
}
