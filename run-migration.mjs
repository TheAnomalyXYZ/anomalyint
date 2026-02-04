#!/usr/bin/env node
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.local') });
config({ path: join(__dirname, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔄 Running database migration: Rename Question to Event...\n');

// Read the SQL migration file
const sql = readFileSync('database/migrations/003_rename_question_to_event.sql', 'utf8');

// Split by semicolons and execute each statement
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && !s.startsWith('/*') && !s.startsWith('DO $$'));

for (const statement of statements) {
  if (!statement) continue;

  console.log(`Executing: ${statement.substring(0, 80)}...`);

  const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

  if (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(`Statement: ${statement}`);
  } else {
    console.log('✅ Success');
  }
}

console.log('\n✨ Migration completed!');
