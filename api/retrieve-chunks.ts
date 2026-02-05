import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.VITE_OPENAI_API_KEY;

  // Check environment variables
  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY, and VITE_OPENAI_API_KEY'
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

    // First, check if there are any chunks in this corpus at all
    const { data: allChunks, error: checkError } = await supabase
      .from('chunks')
      .select('id, document_id, documents!inner(corpus_id)')
      .eq('documents.corpus_id', corpus_id)
      .limit(1);

    if (checkError) {
      console.error('[retrieve-chunks] Error checking for chunks:', checkError);
    }

    console.log(`[retrieve-chunks] Corpus ${corpus_id} has chunks: ${allChunks && allChunks.length > 0 ? 'YES' : 'NO'}`);

    // Call the match_chunks function in the database
    console.log(`[retrieve-chunks] Searching for similar chunks in corpus: ${corpus_id}`);
    console.log(`[retrieve-chunks] Query embedding first 5 values: [${queryEmbedding.slice(0, 5).join(', ')}...]`);
    console.log(`[retrieve-chunks] Match threshold: ${match_threshold}, Match count: ${match_count}`);

    const { data: chunks, error: matchError } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      filter_corpus_id: corpus_id,
      match_threshold: match_threshold,
      match_count: match_count,
    });

    if (matchError) {
      console.error('[retrieve-chunks] Error matching chunks:', matchError);
      console.error('[retrieve-chunks] Error details:', JSON.stringify(matchError, null, 2));
      return res.status(500).json({
        error: 'Failed to retrieve chunks',
        message: matchError.message,
        details: matchError,
      });
    }

    console.log(`[retrieve-chunks] Found ${chunks?.length || 0} relevant chunks`);
    if (chunks && chunks.length > 0) {
      console.log(`[retrieve-chunks] Top match similarity: ${chunks[0].similarity}`);
      console.log(`[retrieve-chunks] File names: ${chunks.map((c: any) => c.file_name).join(', ')}`);
    }

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
