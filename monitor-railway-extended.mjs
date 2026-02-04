// Extended monitoring for Railway CV deployment
const RAILWAY_URL = 'https://anomalyint-production.up.railway.app';
const MAX_CHECKS = 60; // 10 minutes
const CHECK_INTERVAL = 10000; // 10 seconds

async function checkDeployment() {
  try {
    const response = await fetch(`${RAILWAY_URL}/`);
    const data = await response.json();
    return {
      healthy: response.ok,
      hasNewEndpoint: data.endpoints?.detectFillableAreas === '/detect-fillable-areas'
    };
  } catch (error) {
    return { healthy: false, hasNewEndpoint: false };
  }
}

async function monitor() {
  console.log('🔍 Monitoring Railway CV deployment (extended)...\n');
  let lastStatus = null;

  for (let i = 1; i <= MAX_CHECKS; i++) {
    const { healthy, hasNewEndpoint } = await checkDeployment();
    const status = hasNewEndpoint ? 'DEPLOYED' : (healthy ? 'OLD_VERSION' : 'DOWN');

    // Only log when status changes or every 5 checks
    if (status !== lastStatus || i % 5 === 0) {
      console.log(`[Check ${i}/${MAX_CHECKS}] ${new Date().toLocaleTimeString()}`);
      console.log(`  Status: ${status}`);
      console.log(`  Health: ${healthy ? '✓' : '✗'}`);
      console.log(`  New endpoint: ${hasNewEndpoint ? '✓' : '✗'}\n`);
      lastStatus = status;
    }

    if (hasNewEndpoint) {
      console.log('✅ SUCCESS! CV endpoint is live and ready.');
      console.log(`   Took ${i * (CHECK_INTERVAL / 1000)} seconds\n`);
      process.exit(0);
    }

    if (i < MAX_CHECKS) {
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }

  console.log('⏱️  Extended timeout reached (10 minutes).');
  console.log('   The build may still be in progress. Check Railway dashboard.');
  process.exit(1);
}

monitor();
