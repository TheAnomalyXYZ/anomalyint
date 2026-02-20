# Database Migration Guide

This guide explains how to make database schema changes using Prisma, the project's ORM.

## Overview

This project uses **Prisma** as the primary tool for all database schema management with **Supabase PostgreSQL** as the database provider.

**⚠️ IMPORTANT**: Always use Prisma unless you have a specific reason not to (see "Special Cases" below).

## Standard Workflow: Using Prisma

For most schema changes (adding/modifying tables, columns, relationships), use Prisma:

### 1. Update the Prisma Schema

Edit the schema file:
```bash
prisma/schema.prisma
```

Example - adding a new column:
```prisma
model Question {
  id          String   @id @default(cuid())
  title       String
  description String?
  pushedTo    String[] @default([])  // New column
  createdAt   DateTime @default(now())
  // ... other fields
}
```

### 2. Push Schema to Database

Push your schema changes to the Supabase database:
```bash
npm run db:push
```

This command:
- Creates new tables/columns
- Updates existing schema
- Does NOT generate migration files (prototyping-friendly)
- **IMPORTANT**: Always run this after schema changes

### 3. Generate Prisma Client

Regenerate the Prisma Client to reflect schema changes:
```bash
npm run db:generate
```

This command:
- Updates TypeScript types
- Generates query methods for your models
- Required for code to recognize schema changes

### 4. Verify Changes

Check that changes were applied:
```bash
# Open Prisma Studio to inspect the database
npm run db:studio

# Or test database connection
npm run db:test
```

## Complete Example

Adding a new `status` column to the `agents` table:

```bash
# 1. Edit prisma/schema.prisma
# Add: status String @default("active")

# 2. Push to database
npm run db:push

# 3. Regenerate Prisma Client
npm run db:generate

# 4. Verify in Prisma Studio
npm run db:studio
```

## Special Cases: When NOT to Use Prisma

**99% of the time, use Prisma.** Only use manual SQL for these rare exceptions:

### pgvector Tables (Vector Embeddings)

Prisma doesn't support PostgreSQL's `pgvector` extension. This is currently the ONLY reason to use manual SQL.

### Creating a pgvector Table

**⚠️ Note**: You'll rarely need to do this. Most database work should use Prisma.

1. **Write SQL migration file**:
```sql
-- database/migrations/chunks-table.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops);
```

2. **Run in Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/poxtygumdxfuxjohfsqh/sql/new
   - Paste and execute the SQL
   - Manual execution required (Prisma can't handle pgvector)

## Decision Tree: Prisma or Manual SQL?

```
Are you working with vector embeddings (pgvector)?
├─ YES → Use manual SQL (Supabase Console)
└─ NO → Use Prisma ✅
    ├─ Adding/modifying tables? → Prisma
    ├─ Adding/modifying columns? → Prisma
    ├─ Adding relationships? → Prisma
    ├─ Adding indexes? → Prisma
    ├─ Adding constraints? → Prisma
    └─ Everything else? → Prisma
```

**Summary**: If it's not pgvector, use Prisma.

## Common Commands Reference

```bash
# Push schema changes to database
npm run db:push

# Generate Prisma Client
npm run db:generate

# Open Prisma Studio (visual database browser)
npm run db:studio

# Test database connection
npm run db:test
```

## When Claude Makes Schema Changes

**Default workflow (use this 99% of the time):**

1. ✅ Update `prisma/schema.prisma`
2. ✅ Run `npm run db:push` (Claude runs this directly)
3. ✅ Run `npm run db:generate` (Claude runs this directly)
4. ✅ Verify success by checking command output
5. ❌ **DO NOT** tell user to run these commands manually (Claude does it)

**RARE exception for pgvector only:**
- Claude provides SQL file
- Claude tells user to run in Supabase SQL Editor
- Includes direct link to SQL Editor
- This should happen VERY rarely (only for vector embeddings)

## Troubleshooting

### Error: "Prisma Client not generated"
```bash
npm run db:generate
```

### Error: "Database connection failed"
```bash
# Check environment variables
cat .env | grep DATABASE_URL

# Test connection
npm run db:test
```

### Schema out of sync with database
```bash
# Force push schema (⚠️ can lose data)
npm run db:push -- --force-reset

# Or pull schema from database
npx prisma db pull
```

### Want to see schema without pushing
```bash
# Validate schema syntax
npx prisma validate

# Format schema file
npx prisma format
```

## Important Notes

- ⚠️ `db:push` is for development - it does NOT create migration history
- ⚠️ Always run `db:generate` after `db:push` to update TypeScript types
- ⚠️ For production, consider using `prisma migrate` for tracked migrations
- ✅ Use Prisma Studio (`npm run db:studio`) to visually inspect data
- ✅ Supabase handles connection pooling and SSL automatically

## Resources

- **Prisma Schema Docs**: https://www.prisma.io/docs/concepts/components/prisma-schema
- **Supabase Dashboard**: https://supabase.com/dashboard/project/poxtygumdxfuxjohfsqh
- **Database README**: `database/README.md`
- **CLAUDE.md**: Project instructions for Claude Code
