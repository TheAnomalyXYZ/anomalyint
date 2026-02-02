import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { profile_id, folder_id } = req.query;

  if (!profile_id || !folder_id) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'profile_id and folder_id are required'
    });
  }

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = `${req.headers.origin || 'http://localhost:3000'}/api/oauth/google/callback`;

  if (!clientId) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Google OAuth client ID not configured'
    });
  }

  // Build OAuth URL
  const scopes = ['https://www.googleapis.com/auth/drive.readonly'];
  const state = JSON.stringify({ profile_id, folder_id });

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
