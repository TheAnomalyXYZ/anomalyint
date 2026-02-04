import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.local') });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

// Get team/project info first
const projectResponse = await fetch(
  'https://api.vercel.com/v9/projects/anomalyint',
  { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
);
const project = await projectResponse.json();

console.log('🔍 Fetching runtime logs...\n');

// Get runtime logs - last 100 entries
const logsResponse = await fetch(
  `https://api.vercel.com/v2/projects/${project.id}/logs?limit=100`,
  { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
);

const logsText = await logsResponse.text();
console.log(logsText);
