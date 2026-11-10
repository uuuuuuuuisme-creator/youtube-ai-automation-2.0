import { disconnectGoogleOAuth } from '../../../server/googleOAuth.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  try {
    await disconnectGoogleOAuth();
    res.setHeader?.('Content-Type', 'application/json');
    if (res.json) {
      return res.json({ success: true });
    }
    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true }));
  } catch (err: any) {
    res.setHeader?.('Content-Type', 'application/json');
    if (res.status) {
      return res.status(500).json({ error: err.message });
    }
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: err.message }));
  }
}
