#!/usr/bin/env node
/**
 * Agent Execution Cron Job
 *
 * This script can be run by a cron scheduler to automatically execute agents
 * at their scheduled frequencies.
 *
 * Usage:
 *   node runAgentsCron.js [frequency]
 *
 * Examples:
 *   node runAgentsCron.js daily     # Run all agents with daily frequency
 *   node runAgentsCron.js weekly    # Run all agents with weekly frequency
 *   node runAgentsCron.js           # Run all active agents
 *
 * Cron Schedule Examples:
 *   # Run daily agents every day at 9 AM
 *   0 9 * * * node /path/to/runAgentsCron.js daily
 *
 *   # Run weekly agents every Monday at 10 AM
 *   0 10 * * 1 node /path/to/runAgentsCron.js weekly
 *
 *   # Run all agents every 6 hours
 *   0 */6 * * * node /path/to/runAgentsCron.js
 */

import { AgentRunner } from '../api/agentRunner';
import { agentsApi } from '../api/questions';
import { Agent } from '../lib/types';

async function main() {
  const frequency = process.argv[2] as 'daily' | 'weekly' | 'on_update' | undefined;

  console.log('=================================');
  console.log('Agent Execution Cron Job Started');
  console.log('=================================');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Frequency filter: ${frequency || 'all'}`);
  console.log('');

  try {
    // Fetch all agents from the database
    console.log('Fetching agents from database...');
    const agents = await agentsApi.getAgents();
    console.log(`Found ${agents.length} total agents`);

    // Run agents based on frequency
    let results;
    if (frequency) {
      console.log(`Running agents with frequency: ${frequency}`);
      results = await AgentRunner.runAgentsByFrequency(agents, frequency);
    } else {
      console.log('Running all active agents');
      results = await AgentRunner.runAgents(agents);
    }

    // Summary
    console.log('');
    console.log('=================================');
    console.log('Execution Summary');
    console.log('=================================');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Total executed: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);

    // Log details of failed executions
    if (failed > 0) {
      console.log('');
      console.log('Failed Executions:');
      results.forEach((result, index) => {
        if (!result.success) {
          console.log(`  ${index + 1}. Error: ${result.error}`);
        }
      });
    }

    // Log details of successful executions
    if (successful > 0) {
      console.log('');
      console.log('Successful Executions:');
      results.forEach((result, index) => {
        if (result.success && result.question) {
          console.log(`  ${index + 1}. Question: "${result.question.title.substring(0, 60)}..."`);
          console.log(`     ID: ${result.question.id}`);
          console.log(`     Categories: ${result.question.categories.join(', ') || 'none'}`);
          console.log(`     AI Score: ${(result.question.aiScore * 100).toFixed(0)}%`);
        }
      });
    }

    console.log('');
    console.log('=================================');
    console.log('Cron Job Completed Successfully');
    console.log('=================================');

    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('=================================');
    console.error('Cron Job Failed');
    console.error('=================================');
    console.error('Error:', error);
    console.error('');

    process.exit(1);
  }
}

// Run the cron job
main();
