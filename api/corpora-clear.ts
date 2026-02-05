import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  // Check environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY'
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

    // First, get all document IDs for this corpus
    const { data: documents, error: fetchDocsError } = await supabase
      .from('documents')
      .select('id')
      .eq('corpus_id', corpus_id);

    if (fetchDocsError) {
      console.error('Failed to fetch documents:', fetchDocsError);
      return res.status(500).json({
        error: 'Failed to fetch documents',
        message: fetchDocsError.message,
      });
    }

    // Delete all chunks for these documents
    if (documents && documents.length > 0) {
      const documentIds = documents.map(doc => doc.id);

      const { error: deleteChunksError } = await supabase
        .from('chunks')
        .delete()
        .in('document_id', documentIds);

      if (deleteChunksError) {
        console.error('Failed to delete chunks:', deleteChunksError);
        return res.status(500).json({
          error: 'Failed to clear chunks',
          message: deleteChunksError.message,
        });
      }
    }

    // Now delete all documents for this corpus
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
