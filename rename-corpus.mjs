#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.local') });
config({ path: join(__dirname, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('✏️ Renaming corpus to match profile...\n');

// Find the Anomaly Games corpus
const { data: corpus } = await supabase
  .from('corpora')
  .select('id, name')
  .eq('name', 'Anomaly Games Inc. Knowledge Base')
  .single();

if (corpus) {
  console.log(`Current name: "${corpus.name}"`);
  console.log(`New name: "Anomaly Games Inc. Legal Knowledge Base"`);

  const { error } = await supabase
    .from('corpora')
    .update({
      name: 'Anomaly Games Inc. Legal Knowledge Base',
      updated_at: new Date().toISOString()
    })
    .eq('id', corpus.id);

  if (error) {
    console.error(`❌ Error: ${error.message}`);
  } else {
    console.log(`✅ Renamed successfully!`);
  }
} else {
  console.log('Corpus not found or already renamed');
}
