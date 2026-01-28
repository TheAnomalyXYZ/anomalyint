import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { EmbeddingService } from '../src/lib/embeddings';
import crypto from 'crypto';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;

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

  // Check OpenAI API key
  if (!openaiApiKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variable: VITE_OPENAI_API_KEY'
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      corpus_id,
      query,
      top_k = 5,
      match_threshold = 0.7,
    } = req.body;

    // Validate required fields
    if (!corpus_id || !query) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'corpus_id and query are required',
      });
    }

    // Verify corpus exists
    const { data: corpus, error: corpusError } = await supabase
      .from('corpora')
      .select('id, name')
      .eq('id', corpus_id)
      .single();

    if (corpusError || !corpus) {
      return res.status(404).json({
        error: 'Corpus not found',
        message: `Corpus with ID ${corpus_id} does not exist`,
      });
    }

    const startTime = Date.now();

    // Generate query embedding
    const embedder = new EmbeddingService(openaiApiKey);
    const queryEmbedding = await embedder.generateEmbedding(query);

    // Perform vector similarity search using the match_chunks function
    const { data: results, error: searchError } = await supabase.rpc('match_chunks', {
      query_embedding: JSON.stringify(queryEmbedding),
      filter_corpus_id: corpus_id,
      match_threshold,
      match_count: top_k,
    });

    if (searchError) {
      console.error('Vector search error:', searchError);
      return res.status(500).json({
        error: 'Search failed',
        message: searchError.message,
      });
    }

    const latency = Date.now() - startTime;

    // Log retrieval audit
    try {
      await supabase.from('retrieval_audit').insert({
        id: crypto.randomUUID(),
        corpus_id,
        query_text: query,
        top_k,
        results: results || [],
        latency_ms: latency,
        created_at: new Date().toISOString(),
      });
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      console.error('Failed to log retrieval audit:', auditError);
    }

    return res.status(200).json({
      query,
      corpus_name: corpus.name,
      results: results || [],
      count: results?.length || 0,
      latency_ms: latency,
    });
  } catch (error) {
    console.error('Error searching corpus:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
