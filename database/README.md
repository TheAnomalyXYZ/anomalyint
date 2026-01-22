# Database Schema for Predictive Markets Dashboard

This directory contains the complete database schema and migration scripts for migrating from TypeScript mock data to PlanetScale MySQL database.

## Schema Overview

### Core Tables

#### `questions`
Main table for prediction market questions with states: draft, awaiting_review, published, answering_closed, awaiting_resolution, resolved, invalid, paused.

Key fields:
- `id` - UUID primary key
- `title` - Question title (up to 1000 chars)
- `state` - Current question state
- `live_date` - When question goes live
- `answer_end_at` - Deadline for answers
- `settlement_at` - When question will be resolved
- `pool_*` - Betting pool information

#### `proposed_questions`
AI-generated questions awaiting review.

Key fields:
- `ai_score` - AI confidence score (0.00-1.00)
- `type` - binary or multi-option
- All date fields for proposed schedule

#### `users`
User accounts for the platform.

#### `sources`
Information sources for questions (Twitter, news, memes).

Key fields:
- `type` - twitter, news, meme
- `trust_level` - high, medium, low
- `is_pinned` - Featured sources

#### `agents`
AI agents that generate questions automatically.

Key fields:
- `question_prompt` - Prompt for question generation
- `frequency` - daily, on_update, weekly
- `status` - active, paused, error
- `is_template` - Whether this is a template agent

### Junction Tables

- `question_categories` - Many-to-many: questions ↔ categories
- `question_tags` - Many-to-many: questions ↔ tags
- `question_sources` - Many-to-many: questions ↔ sources
- `proposed_question_*` - Similar junctions for proposed questions
- `agent_sources` - Agent source configurations

### Analytics Tables

#### `answers`
User predictions/bets on questions.

Key fields:
- `choice` - YES or NO
- `confidence` - Confidence level (0.00-1.00)
- `channel` - web, mobile, api

#### `kpi_stats`
Dashboard metrics and KPI tracking.

#### `audit_events`
Complete audit log of all system changes.

#### `connector_health`
Status monitoring for external data connectors.

## Migration Strategy

### Phase 1: Core Schema (`001_initial_schema.sql`)
- Create core tables: users, sources, categories, tags, risk_flags
- Create question and proposed_question tables
- Set up junction tables for many-to-many relationships
- Insert initial reference data

### Phase 2: Agents & Analytics (`002_agents_and_analytics.sql`)
- Add AI agent management tables
- Add analytics and reporting tables
- Add audit logging infrastructure
- Add connector health monitoring

## PlanetScale Considerations

### Vitess Compatibility
- Uses VARCHAR(36) for UUIDs (compatible with Vitess)
- Avoids foreign key constraints in favor of application-level integrity where needed
- Optimized indexes for query patterns

### Performance Optimizations
- Strategic indexing on commonly queried fields
- Normalized categories/tags to reduce storage
- JSON column for flexible audit event data
- Proper timestamp indexing for time-series queries

### Scaling Features
- Read replicas friendly (no complex joins in critical paths)
- Partitioning ready (by date fields)
- Connection pooling compatible

## Data Migration

### From Mock Data
The TypeScript interfaces in `src/lib/types.ts` map to these tables:

```typescript
Question → questions table
ProposedQuestion → proposed_questions table
Answer → answers table
Agent → agents table + agent_sources table
Source → sources table
AuditEvent → audit_events table
```

### Sample Migration Script
```sql
-- Migrate mock questions
INSERT INTO questions (
  id, title, description, state, answer_end_at,
  settlement_at, resolution_criteria, created_at
) SELECT
  id, title, description, 'published',
  answer_end_at, settlement_at, resolution_criteria,
  created_at
FROM mock_questions;

-- Migrate categories (normalized)
INSERT IGNORE INTO categories (name)
SELECT DISTINCT category FROM mock_question_categories;

INSERT INTO question_categories (question_id, category_id)
SELECT q.id, c.id
FROM mock_questions q
JOIN mock_question_categories mqc ON q.id = mqc.question_id
JOIN categories c ON mqc.category = c.name;
```

## Environment Setup

### Local Development
```bash
# Install PlanetScale CLI
pscale auth login

# Create development database
pscale database create predictive-markets-dev

# Apply migrations
pscale shell predictive-markets-dev < database/schema.sql
```

### Production Setup
```bash
# Create production database
pscale database create predictive-markets

# Create deploy request
pscale deploy-request create predictive-markets initial-schema

# Apply migrations via deploy request
pscale deploy-request apply predictive-markets 1
```

## API Integration

### Connection String Format
```
mysql://user:password@host:port/database?sslaccept=strict
```

### Recommended ORM
- **Prisma** - Excellent PlanetScale support with connection pooling
- **Drizzle** - Lightweight, great TypeScript integration
- **TypeORM** - Full-featured, good for complex queries

### Connection Pooling
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

## Backup Strategy

- **PlanetScale Backups** - Automatic daily backups
- **Point-in-time Recovery** - Available for paid plans
- **Export Scripts** - Regular data exports for critical tables

## Monitoring

### Key Metrics to Track
- Question creation rate
- Answer submission rate
- Agent execution frequency
- Database connection pool usage
- Query performance metrics

### Alerting
- Failed agent executions
- Database connection issues
- Unusual spike in question creation
- High query latency

---

**Next Steps:**
1. Review schema with team
2. Set up PlanetScale database
3. Create Prisma schema file
4. Build migration scripts for existing data
5. Set up monitoring and alerting