-- Migration: Update pushedTo values to lowercase
-- Description: Updates existing pushedTo array values from "Synapse Markets" and "Vectra Markets"
--              to lowercase "synapse" and "vectra" for consistency with client parameter

-- Update "Synapse Markets" to "synapse"
UPDATE questions
SET pushed_to = array_replace(pushed_to, 'Synapse Markets', 'synapse')
WHERE 'Synapse Markets' = ANY(pushed_to);

-- Update "Vectra Markets" to "vectra"
UPDATE questions
SET pushed_to = array_replace(pushed_to, 'Vectra Markets', 'vectra')
WHERE 'Vectra Markets' = ANY(pushed_to);

COMMENT ON COLUMN questions.pushed_to IS 'Array of platforms where the question is pushed (e.g., "synapse", "vectra")';
