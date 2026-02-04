#!/usr/bin/env node
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.local') });
config({ path: join(__dirname, '.env') });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_NAME = process.env.VERCEL_PROJECT_NAME || 'anomalyint';

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN not found');
  process.exit(1);
}

async function getLatestDeployment() {
  const response = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${PROJECT_NAME}&limit=1`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  );
  const data = await response.json();
  return data.deployments[0];
}

async function getDeploymentLogs(deploymentId) {
  const response = await fetch(
    `https://api.vercel.com/v2/deployments/${deploymentId}/events?follow=1&limit=100`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  );
  return response.text();
}

const deployment = await getLatestDeployment();
console.log(`📋 Fetching logs for deployment: ${deployment.uid}\n`);

const logs = await getDeploymentLogs(deployment.uid);
const lines = logs.split('\n').filter(line => line.trim());

// Parse and display logs
lines.forEach(line => {
  try {
    const log = JSON.parse(line);
    if (log.type === 'stdout' || log.type === 'stderr') {
      console.log(`[${log.date}] ${log.payload.text || log.payload}`);
    }
  } catch (e) {
    // Skip invalid JSON
  }
});
