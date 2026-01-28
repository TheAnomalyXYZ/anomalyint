-- Check sync status in Supabase SQL Editor
-- This shows you the current status of all ingestion jobs and corpora

-- 1. Check ingestion jobs
SELECT
  id,
  corpus_id,
  status,
  progress,
  stats,
  error_message,
  started_at,
  completed_at,
  created_at
FROM ingestion_jobs
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check corpora sync status
SELECT
  c.id,
  c.name,
  c.sync_status,
  c.last_sync_at,
  c.last_sync_stats,
  bp.name as profile_name
FROM corpora c
LEFT JOIN brand_profiles bp ON c.brand_profile_id = bp.id
ORDER BY c.created_at DESC;

-- 3. Check documents created
SELECT
  d.id,
  d.file_name,
  d.indexing_status,
  d.chunk_count,
  c.name as corpus_name
FROM documents d
JOIN corpora c ON d.corpus_id = c.id
ORDER BY d.created_at DESC
LIMIT 20;

-- 4. Count chunks created
SELECT
  c.name as corpus_name,
  COUNT(ch.id) as total_chunks
FROM corpora c
LEFT JOIN documents d ON d.corpus_id = c.id
LEFT JOIN chunks ch ON ch.document_id = d.id
GROUP BY c.id, c.name;
