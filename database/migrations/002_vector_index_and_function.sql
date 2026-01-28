-- Create vector index and search function for chunks table
-- Run this AFTER running `npm run db:push`
-- Supabase SQL Editor: https://supabase.com/dashboard/project/poxtygumdxfuxjohfsqh/sql/new

-- Create HNSW index for fast vector similarity search
-- This index type is specific to pgvector and cannot be created by Prisma
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

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

-- Add helpful comments
COMMENT ON INDEX idx_chunks_embedding IS 'HNSW index for fast approximate nearest neighbor search';
COMMENT ON FUNCTION match_chunks IS 'Vector similarity search function for RAG retrieval';

-- Verify setup
SELECT 'Setup complete!' AS status;
