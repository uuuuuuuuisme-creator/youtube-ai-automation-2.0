import type { IncomingMessage, ServerResponse } from 'http';
import {
  exchangeAuthCodeForTokens,
  saveGoogleOAuthTokens,
  renderAuthCallbackHtml,
} from '../../../server/googleOAuth.js';
import { db } from '../../../server/db.js';

export default async function handler(req: any, res: any) {
  // Support both express-like (req.query) and Node IncomingMessage URL query parsing
  let code = req.query?.code;
  let error = req.query?.error;

  if (!code && req.url) {
    try {
      const parsedUrl = new URL(req.url, 'https://youtube-ai-automation-five.vercel.app');
      code = parsedUrl.searchParams.get('code') || undefined;
      error = parsedUrl.searchParams.get('error') || undefined;
    } catch (e) {}
  }

  if (error) {
    const errorHtml = renderAuthCallbackHtml({
      success: false,
      error: `Google authorization was canceled or denied: ${error}`,
    });
    res.setHeader?.('Content-Type', 'text/html; charset=utf-8');
    return res.status ? res.status(400).send(errorHtml) : res.end(errorHtml);
  }

  if (!code || typeof code !== 'string') {
    const errorHtml = renderAuthCallbackHtml({
      success: false,
      error: 'No authorization code was received from Google OAuth.',
    });
    res.setHeader?.('Content-Type', 'text/html; charset=utf-8');
    return res.status ? res.status(400).send(errorHtml) : res.end(errorHtml);
  }

  try {
    // 1. Exchange authorization code for access and refresh tokens
    const tokens = await exchangeAuthCodeForTokens(code);

    // 2. Securely store tokens on the server
    await saveGoogleOAuthTokens(tokens);

    const channel = db.getChannel();
    const successHtml = renderAuthCallbackHtml({
      success: true,
      channelTitle: channel.channelTitle,
      channelId: channel.channelId,
    });

    res.setHeader?.('Content-Type', 'text/html; charset=utf-8');
    if (res.status) {
      return res.status(200).send(successHtml);
    }
    res.statusCode = 200;
    return res.end(successHtml);
  } catch (err: any) {
    console.error('[Vercel Serverless OAuth Callback Error]', err);
    db.addLog('error', 'youtube', `Vercel OAuth callback error: ${err.message}`);
    const errorHtml = renderAuthCallbackHtml({
      success: false,
      error: err.message,
    });
    res.setHeader?.('Content-Type', 'text/html; charset=utf-8');
    if (res.status) {
      return res.status(500).send(errorHtml);
    }
    res.statusCode = 500;
    return res.end(errorHtml);
  }
}
