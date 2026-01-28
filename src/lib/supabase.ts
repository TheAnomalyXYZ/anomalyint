import { createClient } from '@supabase/supabase-js';
import { Agent, Question, BrandProfile } from './types';

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

// Helper function to convert database profile to our BrandProfile type
function convertDbProfile(dbProfile: any): BrandProfile {
  return {
    id: dbProfile.id,
    name: dbProfile.name,
    brandDescription: dbProfile.brand_description || '',
    website: dbProfile.website || '',
    industry: dbProfile.industry || '',
    targetAudience: dbProfile.target_audience || '',
    brandVoice: dbProfile.brand_voice || '',
    keyValues: dbProfile.key_values || [],
    logoUrl: dbProfile.logo_url || '',
    primaryColor: dbProfile.primary_color || '#6366f1',
    secondaryColor: dbProfile.secondary_color || '#8b5cf6',
    socialLinks: dbProfile.social_links || {
      twitter: '',
      linkedin: '',
      facebook: '',
      instagram: '',
    },
    metaContent: dbProfile.meta_content || [],
    googleDriveFolderIds: dbProfile.google_drive_folder_ids || [],
    createdAt: new Date(dbProfile.created_at),
    updatedAt: new Date(dbProfile.updated_at),
  };
}

// Helper function to convert database corpus to our Corpus type
function convertDbCorpus(dbCorpus: any): any {
  return {
    id: dbCorpus.id,
    name: dbCorpus.name,
    description: dbCorpus.description,
    brandProfileId: dbCorpus.brand_profile_id,
    driveSourceId: dbCorpus.drive_source_id,
    googleDriveFolderId: dbCorpus.google_drive_folder_id,
    syncStatus: dbCorpus.sync_status,
    lastSyncAt: dbCorpus.last_sync_at ? new Date(dbCorpus.last_sync_at) : undefined,
    lastSyncStats: dbCorpus.last_sync_stats,
    syncConfig: dbCorpus.sync_config,
    createdAt: new Date(dbCorpus.created_at),
    updatedAt: new Date(dbCorpus.updated_at),
    drive_source: dbCorpus.drive_source ? {
      id: dbCorpus.drive_source.id,
      displayName: dbCorpus.drive_source.displayName,
      googleAccountEmail: dbCorpus.drive_source.googleAccountEmail,
      oauth_credential: dbCorpus.drive_source.oauth_credential,
    } : undefined,
    brand_profile: dbCorpus.brand_profile,
  };
}

export const corporaApi = {
  async getCorpora() {
    try {
      const { data, error} = await supabase
        .from('corpora')
        .select(`
          *,
          drive_source:drive_sources(
            id,
            displayName,
            googleAccountEmail,
            oauth_credential:oauth_credentials(
              token_expires_at
            )
          ),
          brand_profile:brand_profiles(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching corpora:', error);
        return [];
      }

      console.log('Fetched corpora:', data);
      return (data || []).map(convertDbCorpus);
    } catch (error) {
      console.error('Error fetching corpora:', error);
      return [];
    }
  },

  async setupCorpus(params: {
    access_token: string;
    refresh_token: string;
    google_drive_folder_id: string;
    corpus_name: string;
    corpus_description: string;
    google_account_email: string;
    brand_profile_id?: string;
  }) {
    try {
      const now = new Date().toISOString();

      // 1. Create OAuth credentials
      const oauthId = crypto.randomUUID();
      const { error: oauthError } = await supabase
        .from('oauth_credentials')
        .insert({
          id: oauthId,
          provider: 'google',
          encrypted_access_token: params.access_token,
          encrypted_refresh_token: params.refresh_token,
          token_expires_at: new Date(Date.now() + 3600000).toISOString(),
          scope: ['https://www.googleapis.com/auth/drive.readonly'],
          created_at: now,
          updated_at: now,
        });

      if (oauthError) {
        throw new Error(`Failed to create OAuth credentials: ${oauthError.message}`);
      }

      // 2. Create drive source
      const driveSourceId = crypto.randomUUID();
      const { error: driveSourceError } = await supabase
        .from('drive_sources')
        .insert({
          id: driveSourceId,
          oauth_credential_id: oauthId,
          displayName: 'My Google Drive',
          googleAccountEmail: params.google_account_email || null,
          status: 'active',
          created_at: now,
          updated_at: now,
        });

      if (driveSourceError) {
        throw new Error(`Failed to create drive source: ${driveSourceError.message}`);
      }

      // 3. Create corpus
      const corpusId = crypto.randomUUID();
      const { error: corpusError } = await supabase
        .from('corpora')
        .insert({
          id: corpusId,
          drive_source_id: driveSourceId,
          brand_profile_id: params.brand_profile_id || null,
          name: params.corpus_name,
          description: params.corpus_description,
          google_drive_folder_id: params.google_drive_folder_id,
          sync_status: 'idle',
          sync_config: { recursive: true },
          created_at: now,
          updated_at: now,
        });

      if (corpusError) {
        throw new Error(`Failed to create corpus: ${corpusError.message}`);
      }

      // Fetch the created corpus with relations
      const { data: corpus, error: fetchError } = await supabase
        .from('corpora')
        .select(`
          *,
          drive_source:drive_sources(
            id,
            displayName,
            googleAccountEmail
          ),
          brand_profile:brand_profiles(
            id,
            name
          )
        `)
        .eq('id', corpusId)
        .single();

      if (fetchError || !corpus) {
        throw new Error(`Failed to fetch created corpus: ${fetchError?.message || 'Unknown error'}`);
      }

      return convertDbCorpus(corpus);
    } catch (error) {
      console.error('Error setting up corpus:', error);
      throw error;
    }
  },

  async syncCorpus(corpusId: string) {
    try {
      // Check if corpus exists and get its details
      const { data: corpus, error: corpusError } = await supabase
        .from('corpora')
        .select('id, sync_status')
        .eq('id', corpusId)
        .single();

      if (corpusError || !corpus) {
        throw new Error('Corpus not found');
      }

      if (corpus.sync_status === 'running') {
        throw new Error('Sync already in progress');
      }

      // Create an ingestion job
      const jobId = crypto.randomUUID();
      const now = new Date().toISOString();

      const { error: jobError } = await supabase
        .from('ingestion_jobs')
        .insert({
          id: jobId,
          corpus_id: corpusId,
          status: 'pending',
          progress: { stage: 'initializing', current: 0, total: 0 },
          created_at: now,
          updated_at: now,
        });

      if (jobError) {
        throw new Error(`Failed to create job: ${jobError.message}`);
      }

      // Update corpus status to running
      const { error: updateError } = await supabase
        .from('corpora')
        .update({ sync_status: 'running', updated_at: now })
        .eq('id', corpusId);

      if (updateError) {
        throw new Error(`Failed to update corpus status: ${updateError.message}`);
      }

      return { job_id: jobId };
    } catch (error) {
      console.error('Error starting sync:', error);
      throw error;
    }
  },

  async getIngestionJob(jobId: string) {
    try {
      const { data, error } = await supabase
        .from('ingestion_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !data) {
        throw new Error('Job not found');
      }

      return data;
    } catch (error) {
      console.error('Error fetching job:', error);
      throw error;
    }
  },
};

export const profilesApi = {
  async getProfiles(): Promise<BrandProfile[]> {
    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }

      return (data || []).map(convertDbProfile);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
  },

  async getProfile(id: string): Promise<BrandProfile | null> {
    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data ? convertDbProfile(data) : null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  async createProfile(profile: Partial<BrandProfile>): Promise<BrandProfile | null> {
    try {
      const profileId = profile.id || crypto.randomUUID();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('brand_profiles')
        .insert({
          id: profileId,
          name: profile.name || '',
          brand_description: profile.brandDescription || '',
          website: profile.website || '',
          industry: profile.industry || '',
          target_audience: profile.targetAudience || '',
          brand_voice: profile.brandVoice || '',
          key_values: profile.keyValues || [],
          logo_url: profile.logoUrl || '',
          primary_color: profile.primaryColor || '#6366f1',
          secondary_color: profile.secondaryColor || '#8b5cf6',
          social_links: profile.socialLinks || {
            twitter: '',
            linkedin: '',
            facebook: '',
            instagram: '',
          },
          meta_content: profile.metaContent || [],
          google_drive_folder_ids: profile.googleDriveFolderIds || [],
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      return data ? convertDbProfile(data) : null;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  },

  async updateProfile(id: string, profile: Partial<BrandProfile>): Promise<BrandProfile | null> {
    try {
      const now = new Date().toISOString();

      const dbUpdates: any = {
        updated_at: now,
      };

      if (profile.name !== undefined) dbUpdates.name = profile.name;
      if (profile.brandDescription !== undefined) dbUpdates.brand_description = profile.brandDescription;
      if (profile.website !== undefined) dbUpdates.website = profile.website;
      if (profile.industry !== undefined) dbUpdates.industry = profile.industry;
      if (profile.targetAudience !== undefined) dbUpdates.target_audience = profile.targetAudience;
      if (profile.brandVoice !== undefined) dbUpdates.brand_voice = profile.brandVoice;
      if (profile.keyValues !== undefined) dbUpdates.key_values = profile.keyValues;
      if (profile.logoUrl !== undefined) dbUpdates.logo_url = profile.logoUrl;
      if (profile.primaryColor !== undefined) dbUpdates.primary_color = profile.primaryColor;
      if (profile.secondaryColor !== undefined) dbUpdates.secondary_color = profile.secondaryColor;
      if (profile.socialLinks !== undefined) dbUpdates.social_links = profile.socialLinks;
      if (profile.metaContent !== undefined) dbUpdates.meta_content = profile.metaContent;
      if (profile.googleDriveFolderIds !== undefined) dbUpdates.google_drive_folder_ids = profile.googleDriveFolderIds;

      const { data, error } = await supabase
        .from('brand_profiles')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      return data ? convertDbProfile(data) : null;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  },

  async deleteProfile(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_profiles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  },
};
