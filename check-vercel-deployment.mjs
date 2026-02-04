#!/usr/bin/env node
/**
 * Check Vercel deployment status and logs
 * Usage: node check-vercel-deployment.mjs [deployment-url-or-id]
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local first, then .env
config({ path: join(__dirname, '.env.local') });
config({ path: join(__dirname, '.env') });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_NAME = process.env.VERCEL_PROJECT_NAME || 'anomalyint';

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN not found in environment variables');
  console.error('Get a token from: https://vercel.com/account/tokens');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${VERCEL_TOKEN}`,
  'Content-Type': 'application/json',
};

async function getLatestDeployment() {
  const response = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${PROJECT_NAME}&limit=1`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch deployments: ${response.statusText}`);
  }

  const data = await response.json();
  return data.deployments[0];
}

async function getDeploymentDetails(deploymentId) {
  const response = await fetch(
    `https://api.vercel.com/v13/deployments/${deploymentId}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch deployment details: ${response.statusText}`);
  }

  return response.json();
}

async function getDeploymentLogs(deploymentId) {
  const response = await fetch(
    `https://api.vercel.com/v2/deployments/${deploymentId}/events`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch deployment logs: ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  try {
    console.log('🔍 Checking latest Vercel deployment...\n');

    const deployment = await getLatestDeployment();

    if (!deployment) {
      console.log('❌ No deployments found');
      return;
    }

    console.log(`📦 Deployment: ${deployment.name}`);
    console.log(`🔗 URL: https://${deployment.url}`);
    console.log(`🆔 ID: ${deployment.uid}`);
    console.log(`📅 Created: ${new Date(deployment.createdAt).toLocaleString()}`);
    console.log(`⏱️  Build time: ${deployment.buildingAt ? Math.round((deployment.ready - deployment.buildingAt) / 1000) + 's' : 'N/A'}`);

    // State with emoji
    const stateEmoji = {
      BUILDING: '🔨',
      READY: '✅',
      ERROR: '❌',
      QUEUED: '⏳',
      CANCELED: '🚫',
    };
    console.log(`${stateEmoji[deployment.state] || '❓'} State: ${deployment.state}`);

    // Get detailed info
    if (deployment.state === 'BUILDING' || deployment.state === 'QUEUED') {
      console.log('\n📝 Fetching build logs...\n');
      const logs = await getDeploymentLogs(deployment.uid);

      // Show recent log entries
      if (logs && logs.length > 0) {
        const recentLogs = logs.slice(-10); // Last 10 entries
        recentLogs.forEach(log => {
          const timestamp = new Date(log.createdAt).toLocaleTimeString();
          console.log(`[${timestamp}] ${log.payload.text || log.type}`);
        });
      }
    } else if (deployment.state === 'ERROR') {
      const details = await getDeploymentDetails(deployment.uid);
      if (details.error) {
        console.log(`\n❌ Error: ${details.error.message}`);
      }
    }

    console.log(`\n✨ Deployment is ${deployment.state.toLowerCase()}`);

    if (deployment.state === 'READY') {
      console.log(`🚀 Live at: https://${deployment.url}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
