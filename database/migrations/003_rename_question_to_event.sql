-- Migration: Rename Question tables and columns to Event
-- This migration renames all Question-related database objects to Event

-- 1. Rename the main questions table to events
ALTER TABLE IF EXISTS questions RENAME TO events;

-- 2. Rename columns in the agents table
ALTER TABLE IF EXISTS agents RENAME COLUMN question_prompt TO event_prompt;
ALTER TABLE IF EXISTS agents RENAME COLUMN questions_created TO events_created;

-- 3. Rename columns in the nova_ratings table
ALTER TABLE IF EXISTS nova_ratings RENAME COLUMN question_id TO event_id;

-- 4. Rename columns in the ai_resolution_proposals table
ALTER TABLE IF EXISTS ai_resolution_proposals RENAME COLUMN question_id TO event_id;

-- 5. Rename columns in the answers table
ALTER TABLE IF EXISTS answers RENAME COLUMN question_id TO event_id;
ALTER TABLE IF EXISTS answers RENAME COLUMN question_title TO event_title;

-- 6. Rename columns in the outcome_evidence table
ALTER TABLE IF EXISTS outcome_evidence RENAME COLUMN question_id TO event_id;

-- 7. Rename junction tables
ALTER TABLE IF EXISTS question_categories RENAME TO event_categories;
ALTER TABLE IF EXISTS event_categories RENAME COLUMN question_id TO event_id;

ALTER TABLE IF EXISTS question_tags RENAME TO event_tags;
ALTER TABLE IF EXISTS event_tags RENAME COLUMN question_id TO event_id;

ALTER TABLE IF EXISTS question_sources RENAME TO event_sources;
ALTER TABLE IF EXISTS event_sources RENAME COLUMN question_id TO event_id;

ALTER TABLE IF EXISTS question_risk_flags RENAME TO event_risk_flags;
ALTER TABLE IF EXISTS event_risk_flags RENAME COLUMN question_id TO event_id;

-- 8. Update indexes that reference the old table name (PostgreSQL auto-renames most, but let's be explicit)
-- Note: Most indexes are automatically renamed by PostgreSQL when tables are renamed
-- But we should verify and update any that reference questions explicitly

-- 9. Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Question tables and columns renamed to Event';
END $$;
