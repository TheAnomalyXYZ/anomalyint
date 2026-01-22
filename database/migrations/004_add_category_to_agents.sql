-- Migration: Add category field to agents table
-- This allows agents to have a category (e.g., "cryptocurrency", "technology", etc.)
-- When an agent creates a question, the category will be propagated to the question

ALTER TABLE agents ADD COLUMN category VARCHAR(100);
ALTER TABLE agents ADD INDEX idx_category (category);
