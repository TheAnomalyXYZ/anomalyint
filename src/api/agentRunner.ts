import { Agent, ProposedQuestion } from '../lib/types';
import { questionsApi } from '../lib/supabase';

/**
 * Agent Runner Service
 *
 * This service handles executing AI agents to generate questions.
 * It can be used by:
 * - Frontend UI (Run Now button)
 * - Backend cron jobs
 * - Scheduled agent execution
 */

interface AgentRunResponse {
  question: string;
  description?: string;
  liveDate?: string | Date;
  answerEndAt?: string | Date;
  settlementAt?: string | Date;
  resolutionCriteria?: string;
  aiScore?: number;
  type?: 'binary' | 'multi-option';
  categories?: string[];
  riskFlags?: string[];
}

// Response can be a single question or an array of questions
type AgentApiResponse = AgentRunResponse | AgentRunResponse[];

interface AgentRunResult {
  success: boolean;
  questions: ProposedQuestion[];
  error?: string;
}

export class AgentRunner {
  /**
   * Execute an agent to generate new questions (1 to many)
   * @param agent The agent to run
   * @returns Result of the agent execution with array of questions
   */
  static async runAgent(agent: Agent): Promise<AgentRunResult> {
    try {
      // Find API or Reddit source
      const apiSource = agent.sources.find(source => source.type === 'api');
      const redditSource = agent.sources.find(source => source.type === 'reddit');

      let apiEndpoint: string;
      let queryParams: Record<string, string> = {};

      if (redditSource?.config?.apiEndpoint && redditSource?.config?.subreddit) {
        // Reddit source: use the API endpoint with subreddit as query param
        apiEndpoint = redditSource.config.apiEndpoint;
        queryParams['subreddit'] = redditSource.config.subreddit;
      } else if (apiSource?.config?.apiEndpoint) {
        // Regular API source
        apiEndpoint = apiSource.config.apiEndpoint;
      } else {
        return {
          success: false,
          questions: [],
          error: 'No API endpoint or Reddit subreddit configured for this agent'
        };
      }

      // Prepare request body
      const requestBody = {
        Question: agent.questionPrompt,
        AgentId: agent.id,
        AgentName: agent.name
      };

      console.log(`[AgentRunner] Running agent "${agent.name}" (${agent.id})`);
      console.log(`[AgentRunner] API Endpoint: ${apiEndpoint}`);
      if (Object.keys(queryParams).length > 0) {
        console.log(`[AgentRunner] Query Params:`, queryParams);
      }

      // Build URL with query parameters
      const url = new URL(apiEndpoint);
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      // Call the API
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        return {
          success: false,
          questions: [],
          error: `API request failed with status ${response.status}: ${response.statusText}`
        };
      }

      const responseText = await response.text();

      if (!responseText || responseText.length === 0) {
        return {
          success: false,
          questions: [],
          error: 'API returned empty response'
        };
      }

      // Parse API response
      let data: AgentApiResponse;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        return {
          success: false,
          questions: [],
          error: `API returned invalid JSON: ${responseText.substring(0, 100)}...`
        };
      }

      // Normalize to array - handle both single object and array responses
      const questionResponses: AgentRunResponse[] = Array.isArray(data) ? data : [data];

      // Validate at least one question
      if (questionResponses.length === 0) {
        return {
          success: false,
          questions: [],
          error: 'API returned empty array'
        };
      }

      console.log(`[AgentRunner] Successfully received ${questionResponses.length} question(s)`);

      // Process each question response
      const savedQuestions: ProposedQuestion[] = [];
      const now = new Date();

      for (let i = 0; i < questionResponses.length; i++) {
        const questionData = questionResponses[i];

        // Validate required fields
        if (!questionData.question) {
          console.warn(`[AgentRunner] Skipping question ${i + 1}: missing "question" field`);
          continue;
        }

        console.log(`[AgentRunner] Processing question ${i + 1}: "${questionData.question.substring(0, 50)}..."`);

        // Parse dates from API response or use defaults
        const liveDate = questionData.liveDate
          ? new Date(questionData.liveDate)
          : new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

        const answerEndAt = questionData.answerEndAt
          ? new Date(questionData.answerEndAt)
          : new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

        const settlementAt = questionData.settlementAt
          ? new Date(questionData.settlementAt)
          : new Date(answerEndAt.getTime() + 60 * 60 * 1000); // 1 hour after answer end

        // Build the proposed question
        const proposedQuestion: ProposedQuestion = {
          id: `gq${Date.now()}_${i}`,
          title: questionData.question,
          description: questionData.description || `Generated by ${agent.name}`,
          liveDate: liveDate,
          answerEndAt: answerEndAt,
          settlementAt: settlementAt,
          resolutionCriteria: questionData.resolutionCriteria || agent.resolutionPrompt,
          agentId: agent.id,
          aiScore: questionData.aiScore !== undefined ? questionData.aiScore : 1.0,
          riskFlags: questionData.riskFlags || [],
          createdAt: now,
          updatedAt: now,
          state: 'pending',
          // Use categories from API response (if non-empty), or fall back to agent categories
          categories: (questionData.categories && questionData.categories.length > 0)
            ? questionData.categories
            : (agent.categories || []),
          type: questionData.type || 'binary',
        };

        // Save question to database
        const savedQuestion = await questionsApi.createQuestion(proposedQuestion);

        if (savedQuestion) {
          savedQuestions.push(savedQuestion);
          console.log(`[AgentRunner] Successfully saved question ${i + 1} with ID: ${savedQuestion.id}`);
        } else {
          console.warn(`[AgentRunner] Failed to save question ${i + 1} to database`);
        }

        // Small delay between saves to avoid race conditions
        if (i < questionResponses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (savedQuestions.length === 0) {
        return {
          success: false,
          questions: [],
          error: 'Failed to save any questions to database'
        };
      }

      console.log(`[AgentRunner] Successfully saved ${savedQuestions.length} question(s)`);

      return {
        success: true,
        questions: savedQuestions
      };

    } catch (error) {
      console.error(`[AgentRunner] Error running agent "${agent.name}":`, error);
      return {
        success: false,
        questions: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Run multiple agents in sequence
   * Useful for cron jobs that need to execute all active agents
   * @param agents Array of agents to run
   * @returns Results for each agent execution
   */
  static async runAgents(agents: Agent[]): Promise<AgentRunResult[]> {
    const results: AgentRunResult[] = [];

    for (const agent of agents) {
      // Only run active agents
      if (agent.status === 'active') {
        console.log(`[AgentRunner] Running agent: ${agent.name}`);
        const result = await this.runAgent(agent);
        results.push(result);

        // Add a small delay between agents to avoid overwhelming APIs
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`[AgentRunner] Skipping inactive agent: ${agent.name} (status: ${agent.status})`);
      }
    }

    return results;
  }

  /**
   * Run agents that match a specific frequency
   * Useful for cron jobs scheduled at different intervals
   * @param agents Array of agents to filter and run
   * @param frequency The frequency to match (daily, weekly, on_update)
   * @returns Results for each agent execution
   */
  static async runAgentsByFrequency(
    agents: Agent[],
    frequency: 'daily' | 'weekly' | 'on_update'
  ): Promise<AgentRunResult[]> {
    const filteredAgents = agents.filter(
      agent => agent.frequency === frequency && agent.status === 'active'
    );

    console.log(`[AgentRunner] Found ${filteredAgents.length} agents with frequency "${frequency}"`);

    return this.runAgents(filteredAgents);
  }
}

// Export a default instance for convenience
export const agentRunner = AgentRunner;
