# Database Migration Guide

## Running the Latest Migration

To add the `pushedTo` column for platform selection:

```bash
# Make sure you have your DATABASE_URL environment variable set
npm run db:migrate
```

Or run manually with psql:

```bash
psql $DATABASE_URL -f database/migrations/006_add_pushed_to_questions.sql
```

## What This Migration Does

The migration adds a `pushedTo` column to the `questions` table:
- **Type**: TEXT[] (array of strings)
- **Default**: Empty array `{}`
- **Purpose**: Stores which platforms the question should be pushed to (e.g., "Synapse Markets", "Vectra Markets")

## Verifying the Migration

After running the migration, you can verify it worked:

```sql
-- Check if the column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'questions' AND column_name = 'pushedTo';

-- Check existing questions (should all have empty arrays)
SELECT id, title, "pushedTo" FROM questions LIMIT 5;
```

## Using the Feature

1. Navigate to the Markets page
2. Click the checkbox to approve a question from the "AI Suggestions" tab
3. A dialog will appear asking you to select target platforms:
   - Synapse Markets
   - Vectra Markets
4. Select at least one platform and click "Approve & Queue"
5. The question will move to the "Queued" tab with the selected platforms shown in the Platform column
