import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { corpus_id } = req.query;

  if (!corpus_id) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'corpus_id is required'
    });
  }

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;

  // Construct redirect URI properly for production
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || process.env.VERCEL_URL || 'localhost:3000';
  const redirectUri = `${protocol}://${host}/oauth/callback`;

  if (!clientId) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Google OAuth client ID not configured'
    });
  }

  // Build OAuth URL for refresh - use same callback, distinguish with state
  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];
  const state = JSON.stringify({ corpus_id, action: 'refresh' });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline', // Request refresh token
    prompt: 'consent', // Force consent screen to get refresh token every time
    state: state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // Redirect to Google OAuth
  res.redirect(authUrl);
}
