#!/usr/bin/env node
import { readFileSync } from 'fs';
import pg from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: join(__dirname, '.env.local') });
config({ path: join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🔄 Running database migration: Rename Question to Event...\n');

// Read and execute the SQL migration
const client = new Client({ connectionString: DATABASE_URL });

try {
  await client.connect();
  console.log('✅ Connected to database\n');

  const sql = readFileSync('database/migrations/003_rename_question_to_event.sql', 'utf8');

  await client.query(sql);

  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  await client.end();
}
