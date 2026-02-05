import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleDriveService } from './lib/google-drive.js';
import { IngestionPipeline } from './lib/ingestion-pipeline.js';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.VITE_OPENAI_API_KEY;

  // Check environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  // Check OpenAI API key
  if (!openaiApiKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variable: VITE_OPENAI_API_KEY'
    });
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { corpus_id } = req.body;

    if (!corpus_id) {
      return res.status(400).json({
        error: 'Missing corpus_id',
        message: 'corpus_id is required in request body',
      });
    }

    // Fetch corpus with drive source credentials
    const { data: corpus, error: corpusError } = await supabase
      .from('corpora')
      .select(`
        *,
        drive_source:drive_sources(
          id,
          oauth_credential:oauth_credentials(
            encrypted_access_token,
            encrypted_refresh_token,
            token_expires_at
          )
        )
      `)
      .eq('id', corpus_id)
      .single();

    if (corpusError || !corpus) {
      return res.status(404).json({
        error: 'Corpus not found',
        message: `Corpus with ID ${corpus_id} does not exist`,
      });
    }

    // Check if there's an active job running (not just corpus status)
    // This allows auto-loop to trigger the next batch even when corpus sync_status is 'running'
    const { data: activeJob } = await supabase
      .from('ingestion_jobs')
      .select('id, status')
      .eq('corpus_id', corpus_id)
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (activeJob) {
      return res.status(409).json({
        error: 'Sync already in progress',
        message: `An active ingestion job (${activeJob.id}) is already running for this corpus`,
      });
    }

    // Check if OAuth credentials exist
    const driveSource = corpus.drive_source as any;
    if (!driveSource?.oauth_credential?.encrypted_access_token) {
      return res.status(400).json({
        error: 'Missing OAuth credentials',
        message: 'Drive source does not have valid OAuth credentials',
      });
    }

    // Create ingestion job
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error: jobError } = await supabase
      .from('ingestion_jobs')
      .insert({
        id: jobId,
        corpus_id,
        status: 'pending',
        progress: {
          stage: 'initializing',
          current: 0,
          total: 0,
        },
        created_at: now,
        updated_at: now,
      });

    if (jobError) {
      return res.status(500).json({
        error: 'Failed to create ingestion job',
        message: jobError.message,
      });
    }

    // Update corpus status
    await supabase
      .from('corpora')
      .update({
        sync_status: 'running',
        updated_at: now,
      })
      .eq('id', corpus_id);

    // Initialize services and run sync asynchronously
    // Note: We use the encrypted token directly (in production, you'd decrypt it)
    const accessToken = driveSource.oauth_credential.encrypted_access_token;
    const refreshToken = driveSource.oauth_credential.encrypted_refresh_token;
    const driveService = new GoogleDriveService(accessToken, refreshToken);

    const pipeline = new IngestionPipeline(driveService, {
      openaiApiKey,
      supabaseUrl,
      supabaseServiceKey,
    });

    // Run sync synchronously (await completion)
    // With small batches (1-3 files), this should complete within Vercel's 60s timeout
    try {
      await pipeline.runSync(corpus_id, corpus.google_drive_folder_id, jobId, 1);

      return res.status(200).json({
        message: 'Sync completed successfully',
        job_id: jobId,
        corpus_id,
      });
    } catch (syncError) {
      console.error(`Sync failed for corpus ${corpus_id}:`, syncError);
      return res.status(500).json({
        error: 'Sync failed',
        message: syncError instanceof Error ? syncError.message : 'Unknown sync error',
        job_id: jobId,
      });
    }
  } catch (error) {
    console.error('Error starting sync:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
