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
    // Parse state to determine action type
    const stateData = JSON.parse(state as string);
    const action = stateData.action || 'create'; // 'create' or 'refresh'

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;

    // Construct redirect URI properly for production
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || process.env.VERCEL_URL || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/oauth/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange authorization code for tokens
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const { tokens } = await oauth2Client.getToken(code as string);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain tokens from Google');
    }

    // Get user info directly using the access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error(`Failed to get user info: ${userInfoResponse.statusText}`);
    }

    const userInfo = await userInfoResponse.json();

    // Save to database
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date().toISOString();

    // Handle refresh action (update existing tokens)
    if (action === 'refresh') {
      const corpusId = stateData.corpus_id;

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
        .eq('id', corpusId)
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
            : new Date(Date.now() + 3600000).toISOString(),
          updated_at: now,
        })
        .eq('id', oauthCredentialId);

      if (updateError) {
        throw new Error(`Failed to update OAuth credentials: ${updateError.message}`);
      }

      // Update drive source with new user info
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

      // Clear any errors on the corpus and set status to idle
      const { error: corpusUpdateError } = await supabase
        .from('corpora')
        .update({
          sync_status: 'idle',
          last_error: null,
          updated_at: now,
        })
        .eq('id', corpusId);

      if (corpusUpdateError) {
        console.error('Failed to update corpus status:', corpusUpdateError);
        // Non-fatal, continue
      }

      // Redirect back with refresh success
      return res.redirect(`/knowledge-corpus?success=true&refreshed=true&corpus_id=${corpusId}`);
    }

    // Handle create action (new corpus setup)
    const { profile_id, folder_id } = stateData;

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
          : new Date(Date.now() + 3600000).toISOString(),
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
