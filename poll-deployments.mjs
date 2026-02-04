#!/usr/bin/env node
// Poll specific Railway deployments until they complete

import { execSync } from 'child_process';

const TARGET_DEPLOYMENTS = ['5e4b58a5', 'c03fb18d'];

function getDeploymentStatus() {
  try {
    const output = execSync('railway deployment list', {
      cwd: 'python-service',
      encoding: 'utf8'
    });

    const deployments = {};
    for (const line of output.split('\n')) {
      for (const id of TARGET_DEPLOYMENTS) {
        if (line.includes(id)) {
          const match = line.match(/\|\s+(\w+)\s+\|/);
          if (match) {
            deployments[id] = match[1];
          }
        }
      }
    }
    return deployments;
  } catch (error) {
    return null;
  }
}

console.log('📊 Monitoring deployments:', TARGET_DEPLOYMENTS.join(', '));
console.log();

const startTime = Date.now();
let lastStatus = {};

const interval = setInterval(() => {
  const statuses = getDeploymentStatus();
  const elapsed = Math.floor((Date.now() - startTime) / 1000);

  if (!statuses) {
    console.log('[Error getting status]');
    return;
  }

  let changed = false;
  for (const [id, status] of Object.entries(statuses)) {
    if (lastStatus[id] !== status) {
      console.log(`[${elapsed}s] ${id}: ${lastStatus[id] || '?'} → ${status}`);
      changed = true;
    }
  }

  if (!changed && elapsed % 30 === 0) {
    console.log(`[${elapsed}s] Still waiting...`, statuses);
  }

  lastStatus = statuses;

  // Check if all are done
  const allDone = Object.values(statuses).every(s =>
    s !== 'DEPLOYING' && s !== 'BUILDING'
  );

  if (allDone) {
    console.log('\n✅ All deployments completed!');
    console.log('Final statuses:', statuses);
    clearInterval(interval);
    process.exit(0);
  }
}, 10000); // Check every 10 seconds
