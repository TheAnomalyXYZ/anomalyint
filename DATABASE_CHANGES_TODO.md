# Database Schema Changes TODO

## Overview
The application is transitioning from a question-based model to an event-based model. Events no longer need Queued, Live, or Paused states, and Answer End/Settlement dates are no longer relevant.

## Changes Required

### 1. Remove Event States from `events` table
**Fields that are no longer needed:**
- States to deprecate: `'approved'`, `'published'`, `'paused'`, `'answering_closed'`
- Keep only: `'pending'` (for AI suggestions), `'rejected'` (for deleted)

**Reasoning:**
- Events are not questions with lifecycle states
- We're tracking events, not managing question lifecycles

### 2. Remove Date Fields from `events` table
**Fields to remove:**
- `answerEndAt` - No longer applicable (events don't have answer deadlines)
- `settlementAt` - No longer applicable (events don't need settlement)
- `liveDate` - May be kept for tracking when event was created/published

**Note:** `liveDate` might be useful for tracking event timeline, but `answerEndAt` and `settlementAt` are specific to question-based systems.

### 3. Remove Type Field from `events` table
**Field to remove:**
- `type` (binary/multi-option) - Events don't need question types

**Reasoning:**
- Events are not questions, so they don't have answer types

### 4. Update State Enum
**Current states:**
```sql
CREATE TYPE event_state AS ENUM (
  'pending',           -- AI suggestion awaiting review
  'approved',          -- Approved and queued for publishing (REMOVE)
  'rejected',          -- Rejected suggestion
  'draft',             -- Manual draft (REMOVE or merge with pending)
  'awaiting_review',   -- Awaiting manual review (REMOVE or merge with pending)
  'published',         -- Live market (REMOVE)
  'answering_closed',  -- Market closed for answers (REMOVE)
  'awaiting_resolution', -- Awaiting resolution (REMOVE)
  'resolved',          -- Market resolved (REMOVE)
  'invalid',           -- Invalid market (keep or REMOVE)
  'paused'             -- Paused market (REMOVE)
);
```

**Proposed new states:**
```sql
CREATE TYPE event_state AS ENUM (
  'pending',    -- AI suggestion awaiting review
  'rejected'    -- Rejected/deleted suggestion
);
```

### 5. Related Schema Changes

#### Remove from `events` table:
```sql
ALTER TABLE events DROP COLUMN answerEndAt;
ALTER TABLE events DROP COLUMN settlementAt;
ALTER TABLE events DROP COLUMN type;
ALTER TABLE events DROP COLUMN reviewStatus;  -- Question-specific
ALTER TABLE events DROP COLUMN outcome;       -- Question-specific
ALTER TABLE events DROP COLUMN outcomeEvidence; -- Question-specific
ALTER TABLE events DROP COLUMN answerCount;   -- Question-specific
ALTER TABLE events DROP COLUMN poolSize;      -- Question-specific
```

#### Update state enum:
```sql
-- Create new enum
CREATE TYPE event_state_new AS ENUM ('pending', 'rejected');

-- Update column to use new enum
ALTER TABLE events
  ALTER COLUMN state TYPE event_state_new
  USING (CASE
    WHEN state IN ('pending', 'draft', 'awaiting_review') THEN 'pending'::event_state_new
    WHEN state IN ('rejected', 'invalid') THEN 'rejected'::event_state_new
    ELSE 'rejected'::event_state_new
  END);

-- Drop old enum
DROP TYPE event_state;

-- Rename new enum
ALTER TYPE event_state_new RENAME TO event_state;
```

### 6. Migration Strategy

**Option A: Clean Break (Recommended for MVP)**
1. Backup existing data
2. Drop and recreate `events` table with simplified schema
3. Migrate only `pending` and `rejected` events

**Option B: Gradual Migration**
1. Add new columns alongside old ones
2. Migrate data gradually
3. Deprecate old columns
4. Drop old columns after verification

## Data Migration Notes

**What to keep:**
- All events in `'pending'` state (AI suggestions)
- All events in `'rejected'` state (deleted items)

**What to archive or delete:**
- Events in `'approved'`, `'published'`, `'paused'` states
- Consider archiving these to a separate table if historical data is needed

## TypeScript Type Updates

After database changes, update [types.ts](src/lib/types.ts:3-67):

```typescript
export type EventState = 'pending' | 'rejected';

export interface Event {
  id: string;
  title: string;
  description: string;
  state: EventState;
  resolutionCriteria: string;
  categories: string[];
  topic?: string;
  agentId: string;
  pushedTo?: string[]; // Platforms where event is tracked

  // Nova rating fields
  rating?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S';
  ratingCategory?: string;
  ratingConfidence?: number;
  ratingSparkline?: number[];
  novaRatings?: NovaRating[];
  riskFlags?: string[];

  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
}
```

**Fields removed:**
- `answerEndAt`
- `settlementAt`
- `liveDate`
- `type`
- `reviewStatus`
- `outcome`
- `outcomeEvidence`
- `answerCount`
- `poolSize`

## Testing Checklist

After database migration:
- [ ] Verify event creation works
- [ ] Verify AI suggestions flow
- [ ] Verify event approval/rejection
- [ ] Verify Nova ratings display
- [ ] Test event filtering
- [ ] Verify no references to removed fields
- [ ] Test Overview page
- [ ] Test Pulse page

## Rollback Plan

If issues arise:
1. Restore database from backup
2. Revert code changes
3. Redeploy previous version

## Timeline

**Phase 1: Code Changes** (Current)
- Update UI to remove references to removed fields
- Update types to mark fields as optional

**Phase 2: Database Migration** (After code is stable)
- Run migration scripts
- Update Prisma schema
- Run `npm run db:push`
- Verify data integrity

**Phase 3: Cleanup** (After verification)
- Remove deprecated code
- Update documentation
- Remove old migration files
