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

  // GET /api/clerk-documents - List all documents
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('clerk_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ documents: data || [] });
    } catch (error) {
      console.error('Error fetching clerk documents:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /api/clerk-documents - Create or update a document
  if (req.method === 'POST') {
    try {
      const documentData = req.body;

      if (!documentData.id) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'id is required',
        });
      }

      // Upsert the document
      const { data, error } = await supabase
        .from('clerk_documents')
        .upsert({
          ...documentData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to upsert clerk document:', error);
        return res.status(500).json({
          error: 'Failed to save document',
          message: error.message,
        });
      }

      return res.status(200).json({ document: data });
    } catch (error) {
      console.error('Error saving clerk document:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // DELETE /api/clerk-documents?id={id} - Delete a document
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          error: 'Missing required parameter',
          message: 'id is required',
        });
      }

      const { error } = await supabase
        .from('clerk_documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete clerk document:', error);
        return res.status(500).json({
          error: 'Failed to delete document',
          message: error.message,
        });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting clerk document:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
