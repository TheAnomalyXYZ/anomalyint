# Database Setup Guide

This guide covers setting up the Supabase PostgreSQL database with pgvector for the Knowledge Corpus RAG feature.

## Prerequisites

- Supabase project created
- `DATABASE_URL` environment variable set in `.env`
- Node.js and npm installed

## Quick Start

```bash
# 1. Enable extensions (run in Supabase SQL Editor)
# See step 1 below

# 2. Push Prisma schema to database
npm run db:push

# 3. Create chunks table with pgvector (run in Supabase SQL Editor)
# See step 3 below

# 4. Generate Prisma client
npm run db:generate

# 5. Verify setup
npm run db:test
```

---

## Detailed Setup Steps

### 1. Enable Required Extensions

Enable pgvector and pgcrypto extensions in Supabase.

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/database/extensions
2. Search for "vector" and enable it
3. Search for "pgcrypto" and enable it

**Via SQL Editor:**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
2. Run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 2. Push Prisma Schema to Database

Run this command from your project root:

```bash
npm run db:push
```

This creates all tables defined in `prisma/schema.prisma`:
- ✅ `oauth_credentials` - OAuth tokens for Google Drive
- ✅ `drive_sources` - Google Drive connections
- ✅ `corpora` - Knowledge corpus definitions
- ✅ `documents` - Indexed files from Drive
- ✅ `ingestion_jobs` - Sync job tracking
- ✅ `retrieval_audit` - RAG query logs
- ✅ All existing tables (questions, agents, users, etc.)

**Note:** The `chunks` table is NOT created by Prisma because it uses pgvector, which isn't natively supported.

### 3. Create chunks Table with pgvector

Run this SQL in Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new):

```sql
-- Text chunks with vector embeddings
CREATE TABLE IF NOT EXISTS chunks (
  id VARCHAR(36) PRIMARY KEY,
  document_id VARCHAR(36) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  token_count INT,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_index ON chunks(document_id, chunk_index);

-- Vector similarity index (HNSW for fast ANN search)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Enable Row Level Security
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE chunks IS 'Text chunks with vector embeddings for semantic search';
COMMENT ON COLUMN chunks.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';
```

### 4. Create Vector Search Function

Run this SQL to create the `match_chunks` function for RAG retrieval:

```sql
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  filter_corpus_id VARCHAR(36),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  chunk_id VARCHAR(36),
  document_id VARCHAR(36),
  content TEXT,
  similarity FLOAT,
  metadata JSONB,
  file_name VARCHAR(500)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.document_id,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    c.metadata,
    d.file_name
  FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE d.corpus_id = filter_corpus_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

### 5. Generate Prisma Client

Generate the Prisma client with the latest schema:

```bash
npm run db:generate
```

### 6. Verify Setup

Run this query in Supabase SQL Editor to verify all tables exist:

```sql
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'oauth_credentials',
    'drive_sources',
    'corpora',
    'documents',
    'chunks',
    'ingestion_jobs',
    'retrieval_audit'
  )
ORDER BY table_name;
```

**Expected result:** 7 rows (all tables listed above)

You can also test the database connection:

```bash
npm run db:test
```

---

## Common Commands

### Development Workflow

```bash
# Push schema changes to Supabase
npm run db:push

# Generate Prisma client after schema changes
npm run db:generate

# Open Prisma Studio to view/edit data
npm run db:studio

# Test database connection
npm run db:test
```

### Making Schema Changes

When updating the database schema:

1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` to sync with Supabase
3. Run `npm run db:generate` to update Prisma client
4. If changes involve pgvector, manually update chunks table SQL

---

## Troubleshooting

### Error: "Could not find table 'public.chunks'"

**Cause:** The chunks table hasn't been created yet.

**Solution:** Run step 3 above (create chunks table with pgvector).

### Error: "Extension 'vector' does not exist"

**Cause:** pgvector extension not enabled.

**Solution:** Run step 1 above (enable pgvector extension).

### Error: "Prisma schema and database are out of sync"

**Cause:** Schema changes haven't been pushed to database.

**Solution:** Run `npm run db:push`

### Error: "Cannot generate embeddings" or chunking type errors

**Cause:** Missing dependencies.

**Solution:**
```bash
npm install tiktoken openai
```

### Error: "BigInt serialization error"

**Cause:** Trying to JSON.stringify a BigInt value.

**Solution:** Use `parseInt()` instead of `BigInt()` for file sizes.

---

## Architecture

### Data Flow

1. **OAuth Setup**: User provides Google OAuth tokens → `oauth_credentials`
2. **Drive Connection**: Link Google Drive account → `drive_sources`
3. **Corpus Creation**: Define folder boundaries → `corpora`
4. **Sync Process**:
   - List files from Google Drive
   - Download and extract text (PDF, Google Docs, txt)
   - Chunk text into ~800 token segments with 200 token overlap
   - Generate embeddings via OpenAI API (text-embedding-3-small)
   - Store metadata in `documents` table
   - Store chunks with embeddings in `chunks` table
   - Track progress in `ingestion_jobs` table
5. **RAG Retrieval**:
   - User query → OpenAI embedding
   - Vector similarity search via `match_chunks()`
   - Return top-k relevant chunks

### Table Relationships

```
oauth_credentials
  └── drive_sources
       └── corpora
            ├── documents
            │    └── chunks (pgvector)
            ├── ingestion_jobs
            └── retrieval_audit

brand_profiles
  └── corpora (optional relationship)
```

### Vector Search Performance

The HNSW index parameters:
- `m = 16`: Number of connections per layer (higher = better recall, slower build)
- `ef_construction = 64`: Size of dynamic candidate list (higher = better quality, slower build)

For queries, you can adjust:
- `match_threshold`: Minimum similarity score (0-1, default 0.7)
- `match_count`: Number of results to return (default 5)

---

## Security Notes

- ✅ All tables have RLS (Row Level Security) enabled
- ⚠️ OAuth tokens should be encrypted with pgcrypto (TODO)
- ✅ API keys stored in environment variables only
- ✅ Never commit `.env` files to git
- ✅ Vercel Functions have 60s timeout (batch processing accordingly)

---

## File Reference

- `prisma/schema.prisma` - Main database schema (Prisma ORM)
- `database/migrations/` - SQL migration files
- `database/run-all-migrations.sql` - Consolidated migration (includes chunks table)
- `api/lib/ingestion-pipeline.ts` - Sync orchestration
- `api/lib/chunking.ts` - Text chunking with tiktoken
- `api/lib/embeddings.ts` - OpenAI embeddings generation
- `api/lib/google-drive.ts` - Google Drive API integration

---

## Next Steps

After setup:

1. ✅ Verify all tables created
2. Set up Google OAuth credentials
3. Create first corpus via UI
4. Run initial sync
5. Test RAG retrieval via API

For questions or issues, check the main project README or open an issue.
