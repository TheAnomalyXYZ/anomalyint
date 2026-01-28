import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

try {
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check if Supabase client is initialized
  if (!supabase) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      access_token,
      refresh_token,
      google_drive_folder_id,
      corpus_name = 'Test Knowledge Base',
      corpus_description = 'Documents for RAG retrieval',
      google_account_email,
      brand_profile_id,
    } = req.body;

    // Validate required fields
    if (!access_token || !refresh_token || !google_drive_folder_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'access_token, refresh_token, and google_drive_folder_id are required',
      });
    }

    const now = new Date().toISOString();

    // 1. Create OAuth credentials
    const oauthId = crypto.randomUUID();
    const { error: oauthError } = await supabase
      .from('oauth_credentials')
      .insert({
        id: oauthId,
        provider: 'google',
        encrypted_access_token: access_token,
        encrypted_refresh_token: refresh_token,
        token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        scope: ['https://www.googleapis.com/auth/drive.readonly'],
        created_at: now,
        updated_at: now,
      });

    if (oauthError) {
      return res.status(500).json({
        error: 'Failed to create OAuth credentials',
        message: oauthError.message,
      });
    }

    // 2. Create drive source
    const driveSourceId = crypto.randomUUID();
    const { error: driveSourceError } = await supabase
      .from('drive_sources')
      .insert({
        id: driveSourceId,
        oauth_credential_id: oauthId,
        display_name: 'My Google Drive',
        google_account_email: google_account_email || null,
        status: 'active',
        created_at: now,
        updated_at: now,
      });

    if (driveSourceError) {
      return res.status(500).json({
        error: 'Failed to create drive source',
        message: driveSourceError.message,
      });
    }

    // 3. Create corpus
    const corpusId = crypto.randomUUID();
    const { error: corpusError } = await supabase
      .from('corpora')
      .insert({
        id: corpusId,
        drive_source_id: driveSourceId,
        brand_profile_id: brand_profile_id || null,
        name: corpus_name,
        description: corpus_description,
        google_drive_folder_id,
        sync_status: 'idle',
        sync_config: { recursive: true },
        created_at: now,
        updated_at: now,
      });

    if (corpusError) {
      return res.status(500).json({
        error: 'Failed to create corpus',
        message: corpusError.message,
      });
    }

    // Fetch the created corpus with relations
    const { data: corpus, error: fetchError } = await supabase
      .from('corpora')
      .select(`
        *,
        drive_source:drive_sources(
          id,
          display_name,
          google_account_email
        ),
        brand_profile:brand_profiles(
          id,
          name
        )
      `)
      .eq('id', corpusId)
      .single();

    if (fetchError || !corpus) {
      return res.status(500).json({
        error: 'Failed to fetch created corpus',
        message: fetchError?.message || 'Unknown error',
      });
    }

    return res.status(201).json({
      message: 'Knowledge Corpus setup completed successfully',
      corpus,
    });
  } catch (error) {
    console.error('Error setting up corpus:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
