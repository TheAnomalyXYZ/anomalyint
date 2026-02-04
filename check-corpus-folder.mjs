import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('corpora')
  .select('id, name, google_drive_folder_id, brand_profile_id')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('📂 Corpus Folder IDs:\n');
data.forEach(corpus => {
  console.log(`Name: ${corpus.name}`);
  console.log(`Folder ID: ${corpus.google_drive_folder_id}`);
  console.log(`Profile ID: ${corpus.brand_profile_id}`);
  console.log('---');
});
