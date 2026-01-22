-- Migration: Add pushedTo column to questions table
-- This tracks which platforms/markets the question should be pushed to

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS "pushedTo" TEXT[] DEFAULT '{}';

-- Add comment explaining the column
COMMENT ON COLUMN questions."pushedTo" IS 'Array of platforms where the question is pushed (e.g., Synapse Markets, Vectra Markets)';
