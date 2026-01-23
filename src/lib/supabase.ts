import { createClient } from '@supabase/supabase-js';
import { Agent, Question } from './types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to convert database agent to our Agent type
function convertDbAgent(dbAgent: any): Agent {
  return {
    id: dbAgent.id,
    name: dbAgent.name,
    description: dbAgent.description || '',
    categories: dbAgent.categories || [],
    sources: dbAgent.agent_sources?.map((source: any) => ({
      type: source.type,
      config: {
        url: source.config_url,
        subreddit: source.config_subreddit,
        apiEndpoint: source.config_api_endpoint,
        feedUrl: source.config_feed_url,
      },
    })) || [],
    questionPrompt: dbAgent.question_prompt,
    resolutionPrompt: dbAgent.resolution_prompt,
    baseModel: dbAgent.base_model,
    frequency: dbAgent.frequency,
    status: dbAgent.status,
    questionsCreated: dbAgent.questions_created,
    lastRun: dbAgent.last_run ? new Date(dbAgent.last_run) : undefined,
    nextRun: dbAgent.next_run ? new Date(dbAgent.next_run) : undefined,
    createdAt: new Date(dbAgent.created_at),
    updatedAt: new Date(dbAgent.updated_at),
  };
}

// Helper function to convert database question to our Question type
function convertDbQuestion(dbQuestion: any): Question {
  // Convert nova_ratings to array - handle both array and single object
  let ratingsArray: any[] = [];
  if (dbQuestion.nova_ratings) {
    ratingsArray = Array.isArray(dbQuestion.nova_ratings)
      ? dbQuestion.nova_ratings
      : [dbQuestion.nova_ratings];
  }

  const novaRatings = ratingsArray.map((r: any) => ({
    rating: r.rating as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S',
    ratingCategory: r.rating_category,
    confidence: r.confidence,
    sparkline: r.sparkline || []
  }));

  // For backward compatibility, use the first rating as the primary rating
  const firstRating = novaRatings[0];

  return {
    id: dbQuestion.id,
    title: dbQuestion.title,
    description: dbQuestion.description || '',
    state: dbQuestion.state,
    liveDate: dbQuestion.live_date ? new Date(dbQuestion.live_date) : undefined,
    answerEndAt: new Date(dbQuestion.answer_end_at),
    settlementAt: new Date(dbQuestion.settlement_at),
    resolutionCriteria: dbQuestion.resolution_criteria,
    agentId: dbQuestion.agent_id,
    pushedTo: dbQuestion.pushed_to || [],
    reviewStatus: dbQuestion.review_status,
    outcome: dbQuestion.outcome,
    // Legacy single rating fields (for backward compatibility)
    rating: firstRating?.rating,
    ratingCategory: firstRating?.ratingCategory,
    ratingConfidence: firstRating?.confidence,
    ratingSparkline: firstRating?.sparkline,
    // New multiple ratings array
    novaRatings: novaRatings.length > 0 ? novaRatings : undefined,
    riskFlags: [],
    categories: dbQuestion.categories || [],
    type: dbQuestion.type || 'binary',
    poolTotal: dbQuestion.pool_total ? parseFloat(dbQuestion.pool_total) : 0,
    poolYes: dbQuestion.pool_yes ? parseFloat(dbQuestion.pool_yes) : 0,
    poolNo: dbQuestion.pool_no ? parseFloat(dbQuestion.pool_no) : 0,
    answerCount: dbQuestion.answer_count || 0,
    createdAt: new Date(dbQuestion.created_at),
    updatedAt: new Date(dbQuestion.updated_at),
  };
}

export const agentsApi = {
  async getAgents(): Promise<Agent[]> {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select(`
          *,
          agent_sources (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agents:', error);
        return [];
      }

      return (data || []).map(convertDbAgent);
    } catch (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
  },

  async getAgent(id: string): Promise<Agent | null> {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select(`
          *,
          agent_sources (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching agent:', error);
        return null;
      }

      return data ? convertDbAgent(data) : null;
    } catch (error) {
      console.error('Error fetching agent:', error);
      return null;
    }
  },

  async createAgent(agent: Partial<Agent>): Promise<Agent | null> {
    try {
      const agentId = agent.id || crypto.randomUUID();
      const now = new Date().toISOString();

      // Insert agent
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .insert({
          id: agentId,
          name: agent.name,
          description: agent.description || '',
          categories: agent.categories || [],
          question_prompt: agent.questionPrompt,
          resolution_prompt: agent.resolutionPrompt,
          base_model: agent.baseModel || 'chatgpt-4o-latest',
          frequency: agent.frequency || 'on_update',
          status: agent.status || 'active',
          questions_created: 0,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (agentError) {
        console.error('Error creating agent:', agentError);
        return null;
      }

      // Insert agent sources
      if (agent.sources && agent.sources.length > 0) {
        const sourcesData = agent.sources.map(source => ({
          agent_id: agentId,
          type: source.type,
          config_url: source.config.url,
          config_subreddit: source.config.subreddit,
          config_api_endpoint: source.config.apiEndpoint,
          config_feed_url: source.config.feedUrl,
          created_at: now,
        }));

        const { error: sourcesError } = await supabase
          .from('agent_sources')
          .insert(sourcesData);

        if (sourcesError) {
          console.error('Error creating agent sources:', sourcesError);
          // Don't return null here - agent was created successfully
        }
      }

      // Fetch the complete agent with sources
      return await this.getAgent(agentId);
    } catch (error) {
      console.error('Error creating agent:', error);
      return null;
    }
  },

  async updateAgent(id: string, agent: Partial<Agent>): Promise<Agent | null> {
    try {
      const now = new Date().toISOString();

      // Update agent
      const { error: agentError } = await supabase
        .from('agents')
        .update({
          name: agent.name,
          description: agent.description,
          categories: agent.categories,
          question_prompt: agent.questionPrompt,
          resolution_prompt: agent.resolutionPrompt,
          base_model: agent.baseModel,
          frequency: agent.frequency,
          status: agent.status,
          updated_at: now,
        })
        .eq('id', id);

      if (agentError) {
        console.error('Error updating agent:', agentError);
        return null;
      }

      // Delete existing sources
      await supabase
        .from('agent_sources')
        .delete()
        .eq('agent_id', id);

      // Insert new sources
      if (agent.sources && agent.sources.length > 0) {
        const sourcesData = agent.sources.map(source => ({
          agent_id: id,
          type: source.type,
          config_url: source.config.url,
          config_subreddit: source.config.subreddit,
          config_api_endpoint: source.config.apiEndpoint,
          config_feed_url: source.config.feedUrl,
          created_at: now,
        }));

        const { error: sourcesError } = await supabase
          .from('agent_sources')
          .insert(sourcesData);

        if (sourcesError) {
          console.error('Error updating agent sources:', sourcesError);
        }
      }

      // Fetch the complete agent with sources
      return await this.getAgent(id);
    } catch (error) {
      console.error('Error updating agent:', error);
      return null;
    }
  },

  async deleteAgent(id: string): Promise<boolean> {
    try {
      // Delete agent sources first (foreign key constraint)
      await supabase
        .from('agent_sources')
        .delete()
        .eq('agent_id', id);

      // Delete agent
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting agent:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      return false;
    }
  },
};

export const questionsApi = {
  async createQuestion(question: Partial<Question>): Promise<Question | null> {
    try {
      // Generate a unique ID for the question
      const questionId = question.id || crypto.randomUUID();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('questions')
        .insert({
          id: questionId,
          title: question.title,
          description: question.description,
          state: question.state || 'pending',
          live_date: question.liveDate?.toISOString(),
          answer_end_at: question.answerEndAt?.toISOString(),
          settlement_at: question.settlementAt?.toISOString(),
          resolution_criteria: question.resolutionCriteria,
          agent_id: question.agentId,
          type: question.type || 'binary',
          categories: question.categories || [],
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating question:', error);
        return null;
      }

      return data ? convertDbQuestion(data) : null;
    } catch (error) {
      console.error('Error creating question:', error);
      return null;
    }
  },

  async getQuestions(): Promise<Question[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          nova_ratings(rating, rating_category, confidence, sparkline)
        `)
        .order('created_at', { ascending: false});

      if (error) {
        console.error('Error fetching questions:', error);
        return [];
      }

      return (data || []).map(convertDbQuestion);
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  },

  async getQuestionsByAgent(agentId: string): Promise<Question[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching questions by agent:', error);
        return [];
      }

      return (data || []).map(convertDbQuestion);
    } catch (error) {
      console.error('Error fetching questions by agent:', error);
      return [];
    }
  },

  async getQuestion(id: string): Promise<Question | null> {
    try {
      const { data, error} = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching question:', error);
        return null;
      }

      return data ? convertDbQuestion(data) : null;
    } catch (error) {
      console.error('Error fetching question:', error);
      return null;
    }
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question | null> {
    try {
      const now = new Date().toISOString();

      const dbUpdates: any = {
        updated_at: now,
      };

      if (updates.state !== undefined) dbUpdates.state = updates.state;
      if (updates.pushedTo !== undefined) dbUpdates.pushed_to = updates.pushedTo;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.resolutionCriteria !== undefined) dbUpdates.resolution_criteria = updates.resolutionCriteria;
      if (updates.categories !== undefined) dbUpdates.categories = updates.categories;

      const { data, error } = await supabase
        .from('questions')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating question:', error);
        return null;
      }

      return data ? convertDbQuestion(data) : null;
    } catch (error) {
      console.error('Error updating question:', error);
      return null;
    }
  },

  async updateQuestionState(id: string, state: string): Promise<Question | null> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('questions')
        .update({
          state: state,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating question state:', error);
        return null;
      }

      return data ? convertDbQuestion(data) : null;
    } catch (error) {
      console.error('Error updating question state:', error);
      return null;
    }
  },

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting question:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  },
};

export const novaRatingsApi = {
  async createOrUpdateRating(questionId: string, rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S', ratingCategory?: string, confidence?: number, sparkline?: number[]): Promise<boolean> {
    try {
      const now = new Date().toISOString();

      // Check if rating exists
      const { data: existing } = await supabase
        .from('nova_ratings')
        .select('id')
        .eq('question_id', questionId)
        .single();

      if (existing) {
        // Update existing rating
        const { error } = await supabase
          .from('nova_ratings')
          .update({
            rating,
            rating_category: ratingCategory,
            confidence,
            sparkline,
            updated_at: now,
          })
          .eq('question_id', questionId);

        if (error) {
          console.error('Error updating nova rating:', error);
          return false;
        }
      } else {
        // Create new rating
        const { error } = await supabase
          .from('nova_ratings')
          .insert({
            question_id: questionId,
            rating,
            rating_category: ratingCategory,
            confidence,
            sparkline: sparkline || [],
            created_at: now,
            updated_at: now,
          });

        if (error) {
          console.error('Error creating nova rating:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving nova rating:', error);
      return false;
    }
  },

  async batchCreateOrUpdateRatings(ratings: Array<{ questionId: string; rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S'; ratingCategory?: string; confidence?: number; sparkline?: number[] }>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const rating of ratings) {
      const result = await this.createOrUpdateRating(rating.questionId, rating.rating, rating.ratingCategory, rating.confidence, rating.sparkline);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  },

  async deleteRating(questionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('nova_ratings')
        .delete()
        .eq('question_id', questionId);

      if (error) {
        console.error('Error deleting nova rating:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting nova rating:', error);
      return false;
    }
  },
};
