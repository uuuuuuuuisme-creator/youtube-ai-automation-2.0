import { getSafeGoogleOAuthStatus } from '../../../server/googleOAuth.js';

export default async function handler(req: any, res: any) {
  const status = getSafeGoogleOAuthStatus();
  res.setHeader?.('Content-Type', 'application/json');
  if (res.json) {
    return res.json(status);
  }
  res.statusCode = 200;
  return res.end(JSON.stringify(status));
}
