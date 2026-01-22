-- Migration: Add support for multiple categories per agent
-- Change agent category from single string to array of strings

-- Step 1: Add new categories column as text array
ALTER TABLE agents ADD COLUMN categories TEXT[] DEFAULT '{}';

-- Step 2: Migrate existing category data to categories array
UPDATE agents
SET categories = ARRAY[category]::TEXT[]
WHERE category IS NOT NULL;

-- Step 3: Drop the old category column
ALTER TABLE agents DROP COLUMN category;
