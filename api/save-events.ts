import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface EventInput {
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
    const { events } = req.body as { events: EventInput[] };

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Invalid events array' });
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    const createdEvents: any[] = [];

    for (const event of events) {
      try {
        // Validate required fields
        if (!event.agentId || !event.title || !event.resolutionCriteria ||
            !event.answerEndAt || !event.settlementAt) {
          failed++;
          errors.push(`Missing required fields for event: ${event.title || 'unknown'}`);
          continue;
        }

        // Verify agent exists and get its categories
        const { data: agent } = await supabase
          .from('agents')
          .select('id, categories')
          .eq('id', event.agentId)
          .maybeSingle();

        if (!agent) {
          failed++;
          errors.push(`Agent not found: ${event.agentId}`);
          continue;
        }

        const now = new Date().toISOString();

        // Generate a custom event ID (format: gq + timestamp + random)
        const eventId = `gq${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Use agent's categories if not provided in the request
        const agentCategories = (agent as any)?.categories || [];
        const categories = event.categories || agentCategories;

        // Create the event
        const { data: newEvent, error } = await supabase
          .from('events')
          .insert({
            id: eventId,
            agent_id: event.agentId,
            title: event.title,
            description: event.description || '',
            resolution_criteria: event.resolutionCriteria,
            answer_end_at: event.answerEndAt,
            settlement_at: event.settlementAt,
            live_date: event.liveDate || null,
            state: event.state || 'pending',
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
          errors.push(`Error creating event "${event.title}": ${error.message}`);
        } else {
          success++;
          createdEvents.push({
            id: (newEvent as any)?.id || eventId,
            title: event.title
          });
        }
      } catch (error) {
        failed++;
        errors.push(`Exception processing "${event.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return res.status(200).json({
      success,
      failed,
      total: events.length,
      events: createdEvents,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error saving events:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
