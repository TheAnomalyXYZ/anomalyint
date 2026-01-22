import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client (will be null if env vars missing)
let supabase: ReturnType<typeof createClient> | null = null;

try {
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

interface QuestionInput {
  agentId: string;
  title: string;
  description?: string;
  categories?: string[];
  resolutionCriteria: string;
  answerEndAt: string; // ISO date string
  settlementAt: string; // ISO date string
  liveDate?: string; // ISO date string
  state?: 'pending' | 'approved' | 'published';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check if Supabase client is initialized
  if (!supabase) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { questions } = req.body as { questions: QuestionInput[] };

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid questions array' });
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    const createdQuestions: any[] = [];

    for (const question of questions) {
      try {
        // Validate required fields
        if (!question.agentId || !question.title || !question.resolutionCriteria ||
            !question.answerEndAt || !question.settlementAt) {
          failed++;
          errors.push(`Missing required fields for question: ${question.title || 'unknown'}`);
          continue;
        }

        // Verify agent exists and get its categories
        const { data: agent } = await supabase
          .from('agents')
          .select('id, categories')
          .eq('id', question.agentId)
          .maybeSingle();

        if (!agent) {
          failed++;
          errors.push(`Agent not found: ${question.agentId}`);
          continue;
        }

        const now = new Date().toISOString();

        // Generate a custom question ID (format: gq + timestamp + random)
        const questionId = `gq${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Use agent's categories if not provided in the request
        const agentCategories = (agent as any)?.categories || [];
        const categories = question.categories || agentCategories;

        // Create the question
        const { data: newQuestion, error } = await supabase
          .from('questions')
          .insert({
            id: questionId,
            agent_id: question.agentId,
            title: question.title,
            description: question.description || '',
            resolution_criteria: question.resolutionCriteria,
            answer_end_at: question.answerEndAt,
            settlement_at: question.settlementAt,
            live_date: question.liveDate || null,
            state: question.state || 'pending',
            categories: categories,
            answer_count: 0,
            pool_total: 0,
            pool_yes: 0,
            pool_no: 0,
            created_at: now,
            updated_at: now,
          } as any)
          .select()
          .single();

        if (error) {
          failed++;
          errors.push(`Error creating question "${question.title}": ${error.message}`);
        } else {
          success++;
          createdQuestions.push({
            id: (newQuestion as any)?.id || questionId,
            title: question.title
          });
        }
      } catch (error) {
        failed++;
        errors.push(`Exception processing "${question.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return res.status(200).json({
      success,
      failed,
      total: questions.length,
      questions: createdQuestions,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error saving questions:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
