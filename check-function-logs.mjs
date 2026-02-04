#!/usr/bin/env node
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.local') });
config({ path: join(__dirname, '.env') });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN not found');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${VERCEL_TOKEN}`,
};

console.log('🔍 Fetching Vercel runtime logs...\n');

// Get the project details to find team ID
const projectResponse = await fetch(
  'https://api.vercel.com/v9/projects/anomalyint',
  { headers }
);

if (!projectResponse.ok) {
  console.error('Failed to get project:', await projectResponse.text());
  process.exit(1);
}

const project = await projectResponse.json();
const teamId = project.accountId;

console.log(`📦 Project: ${project.name}`);
console.log(`👥 Team ID: ${teamId}\n`);

// Try to get logs using the correct endpoint
// Vercel logs are available through the deployment or through log streaming
const since = Date.now() - (30 * 60 * 1000); // Last 30 minutes

try {
  // Method 1: Try getting recent deployment and its function logs
  const deploymentsResponse = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=anomalyint&limit=1`,
    { headers }
  );

  const deployments = await deploymentsResponse.json();
  const latestDeployment = deployments.deployments[0];

  console.log(`🚀 Latest deployment: ${latestDeployment.url}\n`);

  // Get deployment events which include function logs
  const eventsResponse = await fetch(
    `https://api.vercel.com/v2/deployments/${latestDeployment.uid}/events?since=${since}`,
    { headers }
  );

  if (eventsResponse.ok) {
    const eventsText = await eventsResponse.text();
    const events = eventsText.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    console.log(`📝 Found ${events.length} events\n`);
    console.log('Recent function logs:\n');

    // Filter for stdout/stderr which contain function logs
    const functionLogs = events.filter(e =>
      (e.type === 'stdout' || e.type === 'stderr') &&
      e.payload?.text
    );

    if (functionLogs.length === 0) {
      console.log('No function logs found in recent events.');
      console.log('\nTry invoking the OAuth function and run this script again.');
    } else {
      functionLogs.slice(-20).forEach(log => {
        const timestamp = new Date(log.date).toLocaleTimeString();
        const text = log.payload.text || log.payload;
        console.log(`[${timestamp}] ${text}`);
      });
    }
  } else {
    console.error('Failed to get events:', await eventsResponse.text());
  }
} catch (error) {
  console.error('Error fetching logs:', error.message);
}
