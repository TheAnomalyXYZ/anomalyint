import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    return res.redirect(`/knowledge-corpus?error=oauth_failed&message=${error}`);
  }

  if (!code || !state) {
    return res.redirect('/knowledge-corpus?error=missing_params');
  }

  try {
    // Parse state to get profile_id and folder_id
    const { profile_id, folder_id } = JSON.parse(state as string);

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;
    const redirectUri = `${req.headers.origin || 'http://localhost:3000'}/api/oauth/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange authorization code for tokens
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const { tokens } = await oauth2Client.getToken(code as string);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain tokens from Google');
    }

    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Save to database
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date().toISOString();

    // Create OAuth credentials
    const oauthId = crypto.randomUUID();
    const { error: oauthError } = await supabase
      .from('oauth_credentials')
      .insert({
        id: oauthId,
        provider: 'google',
        encrypted_access_token: tokens.access_token,
        encrypted_refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : new Date(Date.now() + 3600000).toISOString(), // Default 1 hour
        scope: ['https://www.googleapis.com/auth/drive.readonly'],
        created_at: now,
        updated_at: now,
      });

    if (oauthError) {
      throw new Error(`Failed to save OAuth credentials: ${oauthError.message}`);
    }

    // Create drive source
    const driveSourceId = crypto.randomUUID();
    const { error: driveSourceError } = await supabase
      .from('drive_sources')
      .insert({
        id: driveSourceId,
        oauth_credential_id: oauthId,
        displayName: userInfo.name || 'My Google Drive',
        googleAccountEmail: userInfo.email,
        status: 'active',
        created_at: now,
        updated_at: now,
      });

    if (driveSourceError) {
      throw new Error(`Failed to create drive source: ${driveSourceError.message}`);
    }

    // Create corpus
    const corpusId = crypto.randomUUID();

    // Get profile name for corpus name
    const { data: profile } = await supabase
      .from('brand_profiles')
      .select('name')
      .eq('id', profile_id)
      .single();

    const { error: corpusError } = await supabase
      .from('corpora')
      .insert({
        id: corpusId,
        drive_source_id: driveSourceId,
        brand_profile_id: profile_id,
        name: `${profile?.name || 'Knowledge'} Base`,
        description: 'Documents for RAG retrieval',
        google_drive_folder_id: folder_id,
        sync_status: 'idle',
        sync_config: { recursive: true },
        created_at: now,
        updated_at: now,
      });

    if (corpusError) {
      throw new Error(`Failed to create corpus: ${corpusError.message}`);
    }

    // Redirect back to knowledge corpus page with success
    res.redirect(`/knowledge-corpus?success=true&corpus_id=${corpusId}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.redirect(`/knowledge-corpus?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`);
  }
}
