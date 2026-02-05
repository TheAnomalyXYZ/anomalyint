import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // Check environment variables
  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_API_KEY'
    });
  }

  // Initialize clients
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, corpus_id, match_count = 5, match_threshold = 0.7 } = req.body;

    if (!query || !corpus_id) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'query and corpus_id are required in request body',
      });
    }

    // Generate embedding for the query using OpenAI
    console.log(`[retrieve-chunks] Generating embedding for query: ${query.substring(0, 50)}...`);
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Call the match_chunks function in the database
    console.log(`[retrieve-chunks] Searching for similar chunks in corpus: ${corpus_id}`);
    const { data: chunks, error: matchError } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      filter_corpus_id: corpus_id,
      match_threshold: match_threshold,
      match_count: match_count,
    });

    if (matchError) {
      console.error('[retrieve-chunks] Error matching chunks:', matchError);
      return res.status(500).json({
        error: 'Failed to retrieve chunks',
        message: matchError.message,
      });
    }

    console.log(`[retrieve-chunks] Found ${chunks?.length || 0} relevant chunks`);

    return res.status(200).json({
      success: true,
      chunks: chunks || [],
      count: chunks?.length || 0,
    });
  } catch (error) {
    console.error('[retrieve-chunks] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
