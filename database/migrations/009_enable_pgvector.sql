-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pgcrypto for OAuth token encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

COMMENT ON EXTENSION vector IS 'Vector similarity search for RAG (Retrieval-Augmented Generation)';
COMMENT ON EXTENSION pgcrypto IS 'Cryptographic functions for secure token storage';
