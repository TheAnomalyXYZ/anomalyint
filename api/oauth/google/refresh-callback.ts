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
    // Parse state to get corpus_id
    const { corpus_id } = JSON.parse(state as string);

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;
    const redirectUri = `${req.headers.origin || 'http://localhost:3000'}/api/oauth/google/refresh-callback`;

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

    // Update database
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date().toISOString();

    // Get corpus to find oauth_credential_id and drive_source_id
    const { data: corpus, error: corpusError } = await supabase
      .from('corpora')
      .select(`
        id,
        drive_source_id,
        drive_source:drive_sources(
          id,
          oauth_credential_id
        )
      `)
      .eq('id', corpus_id)
      .single();

    if (corpusError || !corpus) {
      throw new Error(`Corpus not found: ${corpusError?.message}`);
    }

    const oauthCredentialId = (corpus.drive_source as any)?.oauth_credential_id;

    if (!oauthCredentialId) {
      throw new Error('OAuth credential ID not found for this corpus');
    }

    // Update OAuth credentials with new tokens
    const { error: updateError } = await supabase
      .from('oauth_credentials')
      .update({
        encrypted_access_token: tokens.access_token,
        encrypted_refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : new Date(Date.now() + 3600000).toISOString(), // Default 1 hour
        updated_at: now,
      })
      .eq('id', oauthCredentialId);

    if (updateError) {
      throw new Error(`Failed to update OAuth credentials: ${updateError.message}`);
    }

    // Update drive source with new user info if needed
    const { error: driveSourceError } = await supabase
      .from('drive_sources')
      .update({
        displayName: userInfo.name || 'My Google Drive',
        googleAccountEmail: userInfo.email,
        status: 'active',
        updated_at: now,
      })
      .eq('id', corpus.drive_source_id);

    if (driveSourceError) {
      console.error('Failed to update drive source:', driveSourceError);
      // Non-fatal, continue
    }

    // Redirect back to knowledge corpus page with success
    res.redirect(`/knowledge-corpus?success=true&refreshed=true&corpus_id=${corpus_id}`);

  } catch (error) {
    console.error('OAuth refresh callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.redirect(`/knowledge-corpus?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`);
  }
}
