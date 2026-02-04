#!/usr/bin/env node
// Check which Railway deployment is active and which commit it's running

import { execSync } from 'child_process';

function runCommand(cmd) {
  try {
    return execSync(cmd, { cwd: 'python-service', encoding: 'utf8' }).trim();
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

console.log('🔍 Railway Deployment Status Check\n');

// Get Railway status
console.log('📊 Railway Status:');
const status = runCommand('railway status');
console.log(status);
console.log();

// Get latest local commits
console.log('📝 Latest Local Commits:');
const commits = runCommand('git log --oneline -5');
console.log(commits);
console.log();

// Try to get current deployment logs to find deployment ID
console.log('🚀 Checking Latest Deployment:');
const logs = runCommand('railway logs --latest 2>&1 | head -100');

// Look for build information
const buildMatch = logs.match(/Build time: ([\d.]+) seconds/);
if (buildMatch) {
  console.log(`✅ Latest build completed in ${buildMatch[1]} seconds`);
}

// Check for specific markers in the build
const hasStartScript = logs.includes('chmod +x start.sh');
const hasSed = logs.includes("sed -i 's/\\r$//'");
const hasSevenSteps = logs.includes('[7/7]');

console.log('\n🔧 Build Configuration Detected:');
console.log(`  - Has start.sh: ${hasStartScript ? '✅' : '❌'}`);
console.log(`  - Has sed (CRLF fix): ${hasSed ? '✅' : '❌'}`);
console.log(`  - Build steps: ${hasSevenSteps ? '7/7 (latest)' : '6/6 or less (older)'}`);

// Check deployment logs for startup
console.log('\n📋 Latest Deployment Logs:');
const deployLogs = runCommand('railway logs --deployment 2>&1 | tail -20');
console.log(deployLogs);

// Check if service is responding
console.log('\n🌐 Service Health Check:');
try {
  const healthCheck = execSync('curl -s https://anomalyint-production.up.railway.app/health', { timeout: 5000, encoding: 'utf8' });
  const health = JSON.parse(healthCheck);
  if (health.status === 'healthy') {
    console.log('✅ Service is HEALTHY');
  } else {
    console.log('⚠️  Service returned:', health);
  }
} catch (error) {
  console.log('❌ Service is DOWN or not responding');
  console.log('   Error:', error.message);
}
