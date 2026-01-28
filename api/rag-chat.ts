import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { EmbeddingService } from './lib/embeddings.js';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.VITE_OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables',
    });
  }

  try {
    const { corpus_id, message, conversation_history = [] } = req.body;

    if (!corpus_id || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'corpus_id and message are required',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const embedder = new EmbeddingService(openaiApiKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Generate embedding for the user's message
    console.log('[RAG Chat] Generating embedding for query:', message.substring(0, 100));
    const queryEmbedding = await embedder.generateEmbeddings([message]);

    // Search for relevant chunks using vector similarity
    console.log('[RAG Chat] Searching for relevant chunks in corpus:', corpus_id);
    const { data: chunks, error: searchError } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding[0], // Pass array directly, not JSON string
      filter_corpus_id: corpus_id,
      match_threshold: 0.6, // Lower threshold for better recall
      match_count: 5,
    });

    if (searchError) {
      console.error('[RAG Chat] Vector search error:', searchError);
      return res.status(500).json({
        error: 'Vector search failed',
        message: searchError.message,
      });
    }

    console.log('[RAG Chat] Found', chunks?.length || 0, 'relevant chunks');

    // Build context from retrieved chunks
    const context = chunks && chunks.length > 0
      ? chunks
          .map((chunk: any, idx: number) =>
            `[Source ${idx + 1} - ${chunk.file_name}]\n${chunk.content}\n(Relevance: ${(chunk.similarity * 100).toFixed(1)}%)`
          )
          .join('\n\n---\n\n')
      : null;

    // Build system prompt with RAG context
    const systemPrompt = context
      ? `You are a helpful AI assistant with access to a knowledge base. Use the following context from the knowledge base to answer the user's question. If the context doesn't contain relevant information, say so and provide a general response.

KNOWLEDGE BASE CONTEXT:
${context}

Instructions:
- Answer based on the provided context when relevant
- Cite sources by mentioning the file name
- If the context doesn't help, acknowledge it and provide general assistance
- Be conversational and helpful`
      : `You are a helpful AI assistant. The knowledge base search didn't return relevant results, so provide a general response and let the user know they might want to rephrase their question.`;

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    console.log('[RAG Chat] Calling OpenAI with', messages.length, 'messages');

    // Call OpenAI for response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const aiResponse = completion.choices[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response.";

    console.log('[RAG Chat] Generated response:', aiResponse.substring(0, 100));

    // Log the interaction (optional - for analytics)
    await supabase.from('retrieval_audit').insert({
      id: crypto.randomUUID(),
      corpus_id,
      query_text: message,
      top_k: 5,
      results: chunks || [],
      latency_ms: Date.now() - Date.now(), // Approximate
    });

    return res.status(200).json({
      response: aiResponse,
      sources: chunks?.map((c: any) => ({
        file_name: c.file_name,
        similarity: c.similarity,
      })) || [],
      has_context: !!context,
    });

  } catch (error) {
    console.error('[RAG Chat] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
