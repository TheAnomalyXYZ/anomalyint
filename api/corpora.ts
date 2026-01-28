import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

  // GET /api/corpora - List all corpora
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('corpora')
        .select(`
          *,
          drive_source:drive_sources(
            id,
            display_name,
            google_account_email,
            status
          ),
          brand_profile:brand_profiles(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ corpora: data || [] });
    } catch (error) {
      console.error('Error fetching corpora:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /api/corpora - Create a new corpus
  if (req.method === 'POST') {
    try {
      const {
        name,
        description,
        drive_source_id,
        google_drive_folder_id,
        owner_user_id,
        sync_config,
      } = req.body;

      // Validate required fields
      if (!name || !drive_source_id || !google_drive_folder_id) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'name, drive_source_id, and google_drive_folder_id are required',
        });
      }

      // Verify drive source exists
      const { data: driveSource, error: driveError } = await supabase
        .from('drive_sources')
        .select('id')
        .eq('id', drive_source_id)
        .single();

      if (driveError || !driveSource) {
        return res.status(404).json({
          error: 'Drive source not found',
          message: `Drive source with ID ${drive_source_id} does not exist`,
        });
      }

      const now = new Date().toISOString();
      const corpusId = crypto.randomUUID();

      const { data, error } = await supabase
        .from('corpora')
        .insert({
          id: corpusId,
          owner_user_id,
          drive_source_id,
          name,
          description: description || null,
          google_drive_folder_id,
          sync_status: 'idle',
          sync_config: sync_config || { recursive: true },
          created_at: now,
          updated_at: now,
        })
        .select(`
          *,
          drive_source:drive_sources(
            id,
            display_name,
            google_account_email
          )
        `)
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ corpus: data });
    } catch (error) {
      console.error('Error creating corpus:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // DELETE /api/corpora?id={id} - Delete a corpus
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          error: 'Missing corpus ID',
          message: 'Corpus ID is required as a query parameter',
        });
      }

      // Check if corpus exists
      const { data: corpus, error: fetchError } = await supabase
        .from('corpora')
        .select('id, sync_status')
        .eq('id', id)
        .single();

      if (fetchError || !corpus) {
        return res.status(404).json({
          error: 'Corpus not found',
          message: `Corpus with ID ${id} does not exist`,
        });
      }

      // Check if sync is running
      if (corpus.sync_status === 'running') {
        return res.status(409).json({
          error: 'Cannot delete corpus',
          message: 'Cannot delete corpus while sync is in progress',
        });
      }

      // Delete corpus (cascading will delete related documents, chunks, jobs)
      const { error } = await supabase
        .from('corpora')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: 'Corpus deleted successfully' });
    } catch (error) {
      console.error('Error deleting corpus:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
