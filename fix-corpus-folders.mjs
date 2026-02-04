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

console.log('🔧 Fixing corpus folder IDs to match profiles...\n');

// Get all corpora with their profiles
const { data: corpora } = await supabase
  .from('corpora')
  .select(`
    id,
    name,
    google_drive_folder_id,
    brand_profile_id,
    brand_profiles!inner(
      id,
      name,
      google_drive_folder_ids
    )
  `);

console.log('📋 Current state:\n');
for (const corpus of corpora) {
  const profile = corpus.brand_profiles;
  const profileFolderId = profile.google_drive_folder_ids?.[0] || 'none';
  const match = corpus.google_drive_folder_id === profileFolderId ? '✅' : '❌';

  console.log(`${match} Corpus: ${corpus.name}`);
  console.log(`   Profile: ${profile.name}`);
  console.log(`   Corpus folder: ${corpus.google_drive_folder_id}`);
  console.log(`   Profile folder: ${profileFolderId}`);
  console.log();
}

// Fix mismatched folders
console.log('🔄 Updating mismatched folders...\n');

for (const corpus of corpora) {
  const profile = corpus.brand_profiles;
  const profileFolderId = profile.google_drive_folder_ids?.[0];

  if (profileFolderId && corpus.google_drive_folder_id !== profileFolderId) {
    console.log(`Updating "${corpus.name}"...`);
    console.log(`  From: ${corpus.google_drive_folder_id}`);
    console.log(`  To:   ${profileFolderId}`);

    const { error } = await supabase
      .from('corpora')
      .update({
        google_drive_folder_id: profileFolderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', corpus.id);

    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Updated successfully!`);
    }
    console.log();
  }
}

// Verify final state
console.log('✨ Final state:\n');

const { data: finalCorpora } = await supabase
  .from('corpora')
  .select(`
    id,
    name,
    google_drive_folder_id,
    brand_profiles!inner(
      name,
      google_drive_folder_ids
    )
  `);

for (const corpus of finalCorpora) {
  const profile = corpus.brand_profiles;
  const profileFolderId = profile.google_drive_folder_ids?.[0];
  const match = corpus.google_drive_folder_id === profileFolderId ? '✅' : '❌';

  console.log(`${match} ${corpus.name} → ${profile.name}`);
  console.log(`   Folder: ${corpus.google_drive_folder_id}`);
  console.log();
}

console.log('Done! All corpora now match their profile folder IDs.');
