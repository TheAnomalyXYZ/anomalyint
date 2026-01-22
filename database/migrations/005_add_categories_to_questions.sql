-- Migration: 005_add_categories_to_questions
-- Description: Add categories column to questions table for simple array storage
-- Date: 2025-11-04

-- Add categories column to questions table (TEXT type for JSON array storage)
-- Supabase/PostgreSQL: use TEXT[] or JSONB
-- MySQL: use JSON type
ALTER TABLE questions ADD COLUMN IF NOT EXISTS categories TEXT[];

-- For MySQL databases, use this instead:
-- ALTER TABLE questions ADD COLUMN categories JSON;

-- Update existing questions to have empty array
UPDATE questions SET categories = '{}' WHERE categories IS NULL;
