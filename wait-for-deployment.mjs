#!/usr/bin/env node
// Wait for Railway deployment to complete before proceeding

import { execSync } from 'child_process';

function getLogs() {
  try {
    return execSync('railway logs --latest', {
      cwd: 'python-service',
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (error) {
    return '';
  }
}

function checkBuildStatus() {
  const logs = getLogs();

  // Check for build completion
  const hasBuildTime = /Build time: ([\d.]+) seconds/.test(logs);
  const hasHealthcheck = /Starting Healthcheck/.test(logs);
  const hasContainer = /Starting Container/.test(logs);
  const hasError = /Error:|failed|Healthcheck failed/.test(logs);

  return {
    building: !hasBuildTime && !hasError,
    buildComplete: hasBuildTime,
    deploying: hasBuildTime && !hasContainer,
    deployComplete: hasContainer,
    healthchecking: hasHealthcheck,
    error: hasError,
    logs
  };
}

console.log('⏳ Waiting for Railway deployment to complete...\n');

let lastStatus = '';
const maxWait = 300000; // 5 minutes
const checkInterval = 10000; // 10 seconds
const startTime = Date.now();

const interval = setInterval(() => {
  const status = checkBuildStatus();
  const elapsed = Math.floor((Date.now() - startTime) / 1000);

  let statusText = '';
  if (status.building) statusText = 'Building...';
  else if (status.deploying) statusText = 'Build complete, deploying...';
  else if (status.healthchecking) statusText = 'Running healthchecks...';
  else if (status.deployComplete) statusText = 'Container started';
  else if (status.error) statusText = 'Error detected';

  if (statusText !== lastStatus) {
    console.log(`[${elapsed}s] ${statusText}`);
    lastStatus = statusText;
  }

  // Stop conditions
  if (status.deployComplete || status.error) {
    clearInterval(interval);
    console.log('\n✅ Deployment process completed or error detected');
    console.log('\n📋 Latest logs:');
    const deployLogs = status.logs.split('\n').slice(-20).join('\n');
    console.log(deployLogs);
    process.exit(0);
  }

  if (Date.now() - startTime > maxWait) {
    clearInterval(interval);
    console.log('\n⏱️  Timeout reached (5 minutes)');
    process.exit(1);
  }
}, checkInterval);
