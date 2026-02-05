import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;

  // Check environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables: VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET'
    });
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, drive_source_id, redirect_uri } = req.body;

    // Validate required fields
    if (!code || !drive_source_id || !redirect_uri) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'code, drive_source_id, and redirect_uri are required',
      });
    }

    // Exchange authorization code for tokens
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect_uri);

    console.log('Exchanging authorization code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google');
    }

    console.log('Tokens received successfully');

    // Calculate token expiry (Google tokens typically expire in 1 hour)
    const expiresIn = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600000); // 1 hour from now

    // Update oauth_credentials for the drive source
    const { data: driveSource, error: driveError } = await supabase
      .from('drive_sources')
      .select('oauth_credential_id')
      .eq('id', drive_source_id)
      .single();

    if (driveError || !driveSource) {
      return res.status(404).json({
        error: 'Drive source not found',
        message: `Drive source with ID ${drive_source_id} does not exist`,
      });
    }

    // Update the OAuth credentials
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('oauth_credentials')
      .update({
        encrypted_access_token: tokens.access_token,
        encrypted_refresh_token: tokens.refresh_token,
        token_expires_at: expiresIn.toISOString(),
        updated_at: now,
      })
      .eq('id', driveSource.oauth_credential_id);

    if (updateError) {
      console.error('Failed to update OAuth credentials:', updateError);
      return res.status(500).json({
        error: 'Failed to update credentials',
        message: updateError.message,
      });
    }

    console.log('OAuth credentials updated successfully');

    return res.status(200).json({
      message: 'OAuth tokens updated successfully',
      expires_at: expiresIn.toISOString(),
    });
  } catch (error: any) {
    console.error('Error exchanging OAuth code:', error);

    // Check if it's a Google OAuth error
    if (error.response?.data) {
      return res.status(400).json({
        error: 'OAuth exchange failed',
        message: error.response.data.error_description || error.response.data.error || 'Failed to exchange authorization code',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
