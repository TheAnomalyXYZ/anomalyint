-- Enable required PostgreSQL extensions
-- Run this FIRST before running `npm run db:push`
-- Supabase SQL Editor: https://supabase.com/dashboard/project/poxtygumdxfuxjohfsqh/sql/new

-- Enable pgvector for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify extensions are enabled
SELECT
  extname,
  extversion
FROM pg_extension
WHERE extname IN ('vector', 'pgcrypto');

-- Expected output:
-- extname   | extversion
-- ----------+-----------
-- vector    | 0.5.1 (or higher)
-- pgcrypto  | 1.3 (or higher)
