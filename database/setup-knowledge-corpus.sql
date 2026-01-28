-- Setup Knowledge Corpus with Google Drive OAuth
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/poxtygumdxfuxjohfsqh/sql/new

-- 1. Create OAuth credentials entry
-- IMPORTANT: Replace [YOUR-ACCESS-TOKEN] and [YOUR-REFRESH-TOKEN] with actual values from Google OAuth
INSERT INTO oauth_credentials (
  id,
  provider,
  encrypted_access_token,
  encrypted_refresh_token,
  token_expires_at,
  scope,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'google',
  '[YOUR-ACCESS-TOKEN]', -- Get from Google OAuth Playground or OAuth flow
  '[YOUR-REFRESH-TOKEN]', -- Get from Google OAuth Playground or OAuth flow
  NOW() + INTERVAL '1 hour', -- Access tokens typically expire in 1 hour
  ARRAY['https://www.googleapis.com/auth/drive.readonly'],
  NOW(),
  NOW()
);

-- 2. Create drive source (linked to oauth credentials)
INSERT INTO drive_sources (
  id,
  oauth_credential_id,
  display_name,
  google_account_email,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM oauth_credentials WHERE provider = 'google' ORDER BY created_at DESC LIMIT 1),
  'My Google Drive',
  'long@theanomaly.xyz', -- Replace with your actual email if different
  'active',
  NOW(),
  NOW()
);

-- 3. Create corpus pointing to a Google Drive folder
INSERT INTO corpora (
  id,
  drive_source_id,
  name,
  description,
  google_drive_folder_id,
  sync_status,
  sync_config,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM drive_sources ORDER BY created_at DESC LIMIT 1),
  'Test Knowledge Base',
  'Documents for RAG retrieval',
  '1HGPypvQFyCdC8wXYdCTGjCRpLcUK5bz9',
  'idle',
  '{"recursive": true}'::jsonb,
  NOW(),
  NOW()
);

-- Verify the setup
SELECT
  c.name AS corpus_name,
  c.google_drive_folder_id,
  c.sync_status,
  ds.display_name AS drive_source,
  ds.google_account_email,
  oc.provider
FROM corpora c
JOIN drive_sources ds ON c.drive_source_id = ds.id
JOIN oauth_credentials oc ON ds.oauth_credential_id = oc.id
ORDER BY c.created_at DESC;
