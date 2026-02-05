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

  // GET /api/ingestion-jobs?job_id={id} - Get specific job status
  // GET /api/ingestion-jobs?corpus_id={id} - Get all jobs for a corpus
  if (req.method === 'GET') {
    try {
      const { job_id, corpus_id } = req.query;

      // Get specific job by ID
      if (job_id && typeof job_id === 'string') {
        const { data, error } = await supabase
          .from('ingestion_jobs')
          .select('*')
          .eq('id', job_id)
          .single();

        if (error || !data) {
          return res.status(404).json({
            error: 'Job not found',
            message: `Ingestion job with ID ${job_id} does not exist`,
          });
        }

        return res.status(200).json({ job: data });
      }

      // Get all jobs for a corpus
      if (corpus_id && typeof corpus_id === 'string') {
        const { data, error } = await supabase
          .from('ingestion_jobs')
          .select('*')
          .eq('corpus_id', corpus_id)
          .order('created_at', { ascending: false });

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ jobs: data || [] });
      }

      return res.status(400).json({
        error: 'Missing parameter',
        message: 'Either job_id or corpus_id is required',
      });
    } catch (error) {
      console.error('Error fetching ingestion job:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
