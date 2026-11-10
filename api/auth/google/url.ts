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
  res.setHeader?.('Content-Type', 'application/json');
  if (res.json) {
    return res.json(authInfo);
  }
  res.statusCode = 200;
  return res.end(JSON.stringify(authInfo));
}
