// Monitor Railway deployment for CV endpoint
const RAILWAY_URL = 'https://anomalyint-production.up.railway.app';
const MAX_CHECKS = 30;
const CHECK_INTERVAL = 10000; // 10 seconds

async function checkHealth() {
  try {
    const response = await fetch(`${RAILWAY_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function checkNewEndpoint() {
  try {
    const response = await fetch(`${RAILWAY_URL}/`);
    const data = await response.json();
    return data.endpoints?.detectFillableAreas === '/detect-fillable-areas';
  } catch (error) {
    return false;
  }
}

async function monitor() {
  console.log('Monitoring Railway deployment for CV endpoint...\n');

  for (let i = 1; i <= MAX_CHECKS; i++) {
    console.log(`Check #${i} at ${new Date().toLocaleTimeString()}`);

    const healthy = await checkHealth();
    const hasNewEndpoint = await checkNewEndpoint();

    console.log(`  Health: ${healthy ? '✓' : '✗'}`);
    console.log(`  New endpoint: ${hasNewEndpoint ? '✓' : '✗'}`);

    if (healthy && hasNewEndpoint) {
      console.log('\n✅ Deployment successful! CV endpoint is live.');
      process.exit(0);
    }

    if (i < MAX_CHECKS) {
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }

  console.log('\n⏱️  Timeout reached. Check Railway logs for details.');
  process.exit(1);
}

monitor();
