import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface RatingInput {
  questionId: string;
  rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S';
  ratingCategory: string; // Required for multiple ratings per event
  confidence?: number;
  sparkline?: number[];
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
    const { ratings } = req.body as { ratings: RatingInput[] };

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({ error: 'Invalid ratings array' });
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const rating of ratings) {
      try {
        // Validate required fields
        if (!rating.questionId || !rating.rating || !rating.ratingCategory) {
          failed++;
          errors.push(`Missing required fields for event ${rating.questionId}`);
          continue;
        }

        const now = new Date().toISOString();

        // Check if rating exists for this event AND category
        const { data: existing } = await supabase
          .from('nova_ratings')
          .select('id')
          .eq('event_id', rating.questionId)
          .eq('rating_category', rating.ratingCategory)
          .maybeSingle(); // Use maybeSingle instead of single to avoid error when not found

        if (existing) {
          // Update existing rating
          const { error } = await supabase
            .from('nova_ratings')
            .update({
              rating: rating.rating,
              confidence: rating.confidence,
              sparkline: rating.sparkline || [],
              updated_at: now,
            })
            .eq('event_id', rating.questionId)
            .eq('rating_category', rating.ratingCategory);

          if (error) {
            failed++;
            errors.push(`Error updating rating for ${rating.questionId}: ${error.message}`);
          } else {
            success++;
          }
        } else {
          // Create new rating
          const { error } = await supabase
            .from('nova_ratings')
            .insert({
              event_id: rating.questionId,
              rating: rating.rating,
              rating_category: rating.ratingCategory,
              confidence: rating.confidence,
              sparkline: rating.sparkline || [],
              created_at: now,
              updated_at: now,
            });

          if (error) {
            failed++;
            errors.push(`Error creating rating for ${rating.questionId}: ${error.message}`);
          } else {
            success++;
          }
        }
      } catch (error) {
        failed++;
        errors.push(`Exception processing ${rating.questionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return res.status(200).json({
      success,
      failed,
      total: ratings.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error saving ratings:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
