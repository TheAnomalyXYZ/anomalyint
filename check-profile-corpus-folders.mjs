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

console.log('🔍 Checking Brand Profiles folder IDs...\n');

// Get brand profiles
const { data: profiles } = await supabase
  .from('brand_profiles')
  .select('id, name, google_drive_folder_ids');

console.log('📋 Brand Profiles:');
profiles?.forEach(profile => {
  console.log(`\n  Profile: ${profile.name} (${profile.id})`);
  console.log(`  Folder IDs (array): ${JSON.stringify(profile.google_drive_folder_ids)}`);
});

console.log('\n\n🗄️ Checking Corpora folder IDs...\n');

// Get corpora
const { data: corpora } = await supabase
  .from('corpora')
  .select('id, name, google_drive_folder_id, brand_profile_id');

console.log('📦 Corpora:');
corpora?.forEach(corpus => {
  console.log(`\n  Corpus: ${corpus.name} (${corpus.id})`);
  console.log(`  Folder ID (single): ${corpus.google_drive_folder_id}`);
  console.log(`  Brand Profile ID: ${corpus.brand_profile_id}`);
});

console.log('\n\n📝 Summary:');
console.log('- brand_profiles.google_drive_folder_ids = ARRAY of reference folders');
console.log('- corpora.google_drive_folder_id = SINGLE folder to sync from');
console.log('- These are independent fields and don\'t auto-sync');
