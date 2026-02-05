-- Upgrade embedding model from text-embedding-3-small to text-embedding-3-large (both 1536 dimensions)
-- IMPORTANT: This will DELETE ALL EXISTING CHUNKS - you will need to re-ingest all documents
--
-- We use text-embedding-3-large with dimensions=1536 instead of the full 3072 dimensions
-- because pgvector's HNSW index has a 2000 dimension limit. The dimensionality reduction
-- retains most of the quality improvement while staying within HNSW limits.

-- Delete all existing chunks (they use text-embedding-3-small embeddings)
DELETE FROM chunks;

-- Note: Vector dimensions remain at 1536, so no schema changes needed
-- The existing HNSW index and match_chunks function work as-is

-- All existing embeddings are now deleted and must be regenerated
-- Go to Knowledge Corpus page and click "Sync" to re-ingest documents with new embeddings
