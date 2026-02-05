-- Upgrade embedding model from text-embedding-3-small (1536) to text-embedding-3-large (3072)
-- IMPORTANT: Run this AFTER updating the code to use text-embedding-3-large
-- IMPORTANT: This will DELETE ALL EXISTING CHUNKS - you will need to re-ingest all documents

-- Step 1: Drop the existing HNSW index (it's tied to the vector dimension)
DROP INDEX IF EXISTS idx_chunks_embedding;

-- Step 2: Delete all existing chunks (they're 1536-dimensional and incompatible)
DELETE FROM chunks;

-- Step 3: Alter the embedding column to use the new vector dimension
ALTER TABLE chunks
  ALTER COLUMN embedding TYPE vector(3072);

-- Step 4: Recreate the HNSW index with the new dimension
CREATE INDEX idx_chunks_embedding ON chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Step 5: Update the match_chunks function to use vector(3072)
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(3072),
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
  file_name VARCHAR(500),
  file_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.document_id,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    c.metadata,
    d.file_name,
    d.file_path
  FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE d.corpus_id = filter_corpus_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION match_chunks IS 'Vector similarity search for RAG retrieval with cosine distance (text-embedding-3-large, 3072 dimensions)';

-- Note: All existing embeddings are now invalid and must be regenerated
-- Go to Knowledge Corpus page and click "Sync" to re-ingest documents with new embeddings
