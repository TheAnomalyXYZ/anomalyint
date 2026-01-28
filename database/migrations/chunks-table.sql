-- Create chunks table with pgvector support
-- This table cannot be created by Prisma because it uses the pgvector extension
-- Run this SQL in Supabase SQL Editor after running `npm run db:push`

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

-- Vector similarity index (HNSW for fast approximate nearest neighbor search)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Enable Row Level Security
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

-- Table and column comments
COMMENT ON TABLE chunks IS 'Text chunks with vector embeddings for semantic search';
COMMENT ON COLUMN chunks.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';

-- Create match_chunks function for RAG retrieval
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

-- Verify table created
SELECT 'chunks table created successfully' AS status,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'chunks';
