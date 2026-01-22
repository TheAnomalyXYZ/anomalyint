-- Migration: 003_add_base_model_to_agents
-- Description: Add base_model field to agents table for AI model selection
-- Date: 2025-10-31

-- Enable foreign key checks
SET foreign_key_checks = 1;

-- Add base_model column to agents table
ALTER TABLE agents
ADD COLUMN base_model VARCHAR(100) NOT NULL DEFAULT 'chatgpt-4o-latest'
AFTER resolution_prompt;
