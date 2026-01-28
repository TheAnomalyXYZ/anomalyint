import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
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

    // Verify corpus exists
    const { data: corpus, error: corpusError } = await supabase
      .from('corpora')
      .select('id')
      .eq('id', corpus_id)
      .single();

    if (corpusError || !corpus) {
      return res.status(404).json({
        error: 'Corpus not found',
        message: `Corpus with ID ${corpus_id} does not exist`,
      });
    }

    const now = new Date().toISOString();

    // Delete all ingestion jobs for this corpus
    const { error: deleteJobsError } = await supabase
      .from('ingestion_jobs')
      .delete()
      .eq('corpus_id', corpus_id);

    if (deleteJobsError) {
      console.error('Failed to delete ingestion jobs:', deleteJobsError);
      return res.status(500).json({
        error: 'Failed to clear ingestion jobs',
        message: deleteJobsError.message,
      });
    }

    // Delete all chunks and documents for this corpus
    const { error: deleteDocsError } = await supabase
      .from('documents')
      .delete()
      .eq('corpus_id', corpus_id);

    if (deleteDocsError) {
      console.error('Failed to delete documents:', deleteDocsError);
      return res.status(500).json({
        error: 'Failed to clear documents',
        message: deleteDocsError.message,
      });
    }

    // Reset corpus state to idle
    const { error: updateError } = await supabase
      .from('corpora')
      .update({
        sync_status: 'idle',
        last_sync_at: null,
        last_sync_stats: null,
        updated_at: now,
      })
      .eq('id', corpus_id);

    if (updateError) {
      console.error('Failed to reset corpus state:', updateError);
      return res.status(500).json({
        error: 'Failed to reset corpus state',
        message: updateError.message,
      });
    }

    return res.status(200).json({
      message: 'Corpus cleared successfully',
      corpus_id,
    });
  } catch (error) {
    console.error('Error clearing corpus:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
