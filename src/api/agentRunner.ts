import { Agent } from '../lib/types';

/**
 * Agent Runner Service
 *
 * This service handles executing AI agents to trigger question generation.
 * It can be used by:
 * - Frontend UI (Run Now button)
 * - Backend cron jobs
 * - Scheduled agent execution
 *
 * Note: The API endpoint returns 200 on success, and questions are saved
 * to the database by an external workflow (n8n). This service does not
 * parse or save questions directly.
 */

interface AgentRunResult {
  success: boolean;
  questions: never[]; // Always empty - questions are saved by external workflow
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
      // Find API, Reddit, or X source
      const apiSource = agent.sources.find(source => source.type === 'api');
      const redditSource = agent.sources.find(source => source.type === 'reddit');
      const xSource = agent.sources.find(source => source.type === 'x');

      let apiEndpoint: string;
      let queryParams: Record<string, string> = {};
      let configUrl: string | undefined;

      if (redditSource?.config?.apiEndpoint && redditSource?.config?.subreddit) {
        // Reddit source: use the API endpoint with subreddit as query param
        apiEndpoint = redditSource.config.apiEndpoint;
        queryParams['subreddit'] = redditSource.config.subreddit;
        configUrl = redditSource.config.url;
      } else if (xSource?.config?.url) {
        // X source: use the API endpoint with URL as config_url
        // Use stored endpoint or fallback to default
        apiEndpoint = xSource.config.apiEndpoint || 'https://theanomaly.app.n8n.cloud/webhook/get-user-tweet-filter';
        configUrl = xSource.config.url;
      } else if (apiSource?.config?.apiEndpoint) {
        // Regular API source
        apiEndpoint = apiSource.config.apiEndpoint;
        configUrl = apiSource.config.url;
      } else {
        return {
          success: false,
          questions: [],
          error: 'No API endpoint or Reddit subreddit configured for this agent'
        };
      }

      // Prepare request body
      const requestBody: any = {
        Question: agent.questionPrompt,
        AgentId: agent.id,
        AgentName: agent.name
      };

      // Add config_url if available
      if (configUrl) {
        requestBody.config_url = configUrl;
      }

      console.log(`[AgentRunner] Running agent "${agent.name}" (${agent.id})`);
      console.log(`[AgentRunner] API Endpoint: ${apiEndpoint}`);
      if (configUrl) {
        console.log(`[AgentRunner] Config URL: ${configUrl}`);
      }
      if (Object.keys(queryParams).length > 0) {
        console.log(`[AgentRunner] Query Params:`, queryParams);
      }

      // Build URL with query parameters
      const url = new URL(apiEndpoint);
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      console.log(`[AgentRunner] Request body:`, JSON.stringify(requestBody, null, 2));

      // Call the API
      let response;
      try {
        response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
      } catch (fetchError) {
        console.error(`[AgentRunner] Fetch error:`, fetchError);
        return {
          success: false,
          questions: [],
          error: `Failed to fetch: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
        };
      }

      console.log(`[AgentRunner] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AgentRunner] API error response:`, errorText);
        return {
          success: false,
          questions: [],
          error: `API request failed with status ${response.status}: ${response.statusText}`
        };
      }

      // API returned 200 success - questions will be saved to database by external workflow
      console.log(`[AgentRunner] Agent executed successfully. Questions will be saved by external workflow.`);

      return {
        success: true,
        questions: [] // Questions are saved by external workflow, not returned here
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
