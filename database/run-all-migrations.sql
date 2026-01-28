-- Run all Knowledge Corpus migrations in one go
-- Copy and paste this entire file into Supabase SQL Editor
-- https://supabase.com/dashboard/project/poxtygumdxfuxjohfsqh/sql/new

-- ============================================================
-- Migration 009: Enable pgvector extension
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

COMMENT ON EXTENSION vector IS 'Vector similarity search for RAG (Retrieval-Augmented Generation)';
COMMENT ON EXTENSION pgcrypto IS 'Cryptographic functions for secure token storage';

-- ============================================================
-- Migration 010: Create corpus tables
-- ============================================================

-- OAuth credentials with encryption
CREATE TABLE IF NOT EXISTS oauth_credentials (
  id VARCHAR(36) PRIMARY KEY,
  owner_user_id VARCHAR(36),
  provider VARCHAR(50) NOT NULL,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT[],
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oauth_owner ON oauth_credentials(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON oauth_credentials(provider);

-- Drive OAuth connections
CREATE TABLE IF NOT EXISTS drive_sources (
  id VARCHAR(36) PRIMARY KEY,
  owner_user_id VARCHAR(36),
  oauth_credential_id VARCHAR(36) NOT NULL REFERENCES oauth_credentials(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  google_account_email VARCHAR(255),
  last_verified_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drive_sources_owner ON drive_sources(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_drive_sources_oauth ON drive_sources(oauth_credential_id);

-- Corpus definitions (folder boundaries for knowledge bases)
CREATE TABLE IF NOT EXISTS corpora (
  id VARCHAR(36) PRIMARY KEY,
  owner_user_id VARCHAR(36),
  drive_source_id VARCHAR(36) NOT NULL REFERENCES drive_sources(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  google_drive_folder_id VARCHAR(255) NOT NULL,
  sync_status VARCHAR(50) DEFAULT 'idle',
  last_sync_at TIMESTAMPTZ,
  last_sync_stats JSONB,
  sync_config JSONB DEFAULT '{"recursive": true}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_corpora_owner ON corpora(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_corpora_drive_source ON corpora(drive_source_id);
CREATE INDEX IF NOT EXISTS idx_corpora_sync_status ON corpora(sync_status);

-- Indexed documents from Google Drive
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) PRIMARY KEY,
  corpus_id VARCHAR(36) NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  google_drive_file_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  file_path TEXT,
  file_size_bytes BIGINT,
  drive_modified_at TIMESTAMPTZ,
  content_hash VARCHAR(64),
  indexing_status VARCHAR(50) DEFAULT 'pending',
  indexing_error TEXT,
  chunk_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (corpus_id, google_drive_file_id)
);

CREATE INDEX IF NOT EXISTS idx_documents_corpus ON documents(corpus_id);
CREATE INDEX IF NOT EXISTS idx_documents_drive_file ON documents(google_drive_file_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(indexing_status);
CREATE INDEX IF NOT EXISTS idx_documents_modified ON documents(drive_modified_at);

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

-- Vector similarity index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Sync job tracking
CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id VARCHAR(36) PRIMARY KEY,
  corpus_id VARCHAR(36) NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress JSONB DEFAULT '{"stage": "initializing", "current": 0, "total": 0}',
  stats JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_corpus ON ingestion_jobs(corpus_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_created ON ingestion_jobs(created_at DESC);

-- RAG query logging for analytics
CREATE TABLE IF NOT EXISTS retrieval_audit (
  id VARCHAR(36) PRIMARY KEY,
  corpus_id VARCHAR(36) NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  top_k INT DEFAULT 5,
  results JSONB,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_retrieval_audit_corpus ON retrieval_audit(corpus_id);
CREATE INDEX IF NOT EXISTS idx_retrieval_audit_created ON retrieval_audit(created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE corpora ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrieval_audit ENABLE ROW LEVEL SECURITY;

-- Table comments for documentation
COMMENT ON TABLE oauth_credentials IS 'Encrypted OAuth tokens for external services (Google Drive, etc.)';
COMMENT ON TABLE drive_sources IS 'Google Drive OAuth connections linked to user accounts';
COMMENT ON TABLE corpora IS 'Knowledge corpus definitions - folder boundaries for RAG retrieval';
COMMENT ON TABLE documents IS 'Indexed files from Google Drive with metadata';
COMMENT ON TABLE chunks IS 'Text chunks with vector embeddings for semantic search';
COMMENT ON TABLE ingestion_jobs IS 'Tracks sync job progress and history';
COMMENT ON TABLE retrieval_audit IS 'Logs RAG retrieval queries for analytics and monitoring';

-- Column comments for key fields
COMMENT ON COLUMN corpora.google_drive_folder_id IS 'Google Drive folder ID (from URL or API)';
COMMENT ON COLUMN documents.content_hash IS 'SHA-256 hash of file content for change detection';
COMMENT ON COLUMN chunks.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';

-- ============================================================
-- Migration 011: Create match_chunks function
-- ============================================================

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

-- Verification query
SELECT
  'Tables created successfully!' as status,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('oauth_credentials', 'drive_sources', 'corpora', 'documents', 'chunks', 'ingestion_jobs', 'retrieval_audit');
