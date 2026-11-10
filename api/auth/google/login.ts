import { getGoogleAuthUrl } from '../../../server/googleOAuth.js';

export default async function handler(req: any, res: any) {
  let redirectUri = req.query?.redirect_uri;
  let state = req.query?.state;

  if (!redirectUri && req.url) {
    try {
      const parsed = new URL(req.url, 'https://youtube-ai-automation-five.vercel.app');
      redirectUri = parsed.searchParams.get('redirect_uri') || undefined;
      state = parsed.searchParams.get('state') || undefined;
    } catch (e) {}
  }

  const authInfo = getGoogleAuthUrl({ redirectUri, state });

  if (!authInfo.configured) {
    const errorHtml = `
      <!DOCTYPE html>
      <html><head><title>Google OAuth Setup Required</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#0a0a0a;color:#fafafa;padding:40px 20px;text-align:center;">
        <div style="max-width:540px;margin:0 auto;background:#171717;border:1px solid #262626;border-radius:16px;padding:32px;">
          <h2 style="color:#ef4444;margin-bottom:12px;">Google OAuth Setup Required</h2>
          <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin-bottom:20px;">
            To connect YouTube, please configure <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in your Vercel Project Settings.
          </p>
          <div style="background:#0a0a0a;border:1px solid #333;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#f59e0b;word-break:break-all;margin-bottom:24px;">
            Authorized Redirect URI: ${authInfo.redirectUri}
          </div>
          <a href="/?tab=youtube" style="display:inline-block;padding:10px 20px;background:#f59e0b;color:#0a0a0a;text-decoration:none;font-weight:600;border-radius:8px;">Return to ShortForge AI</a>
        </div>
      </body></html>
    `;
    res.setHeader?.('Content-Type', 'text/html; charset=utf-8');
    if (res.status) {
      return res.status(400).send(errorHtml);
    }
    res.statusCode = 400;
    return res.end(errorHtml);
  }

  if (res.redirect) {
    return res.redirect(authInfo.url);
  }
  res.writeHead?.(302, { Location: authInfo.url });
  return res.end?.();
}
