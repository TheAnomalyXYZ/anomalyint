# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript application for an AI Automation Dashboard UI focused on predictive markets. The application provides a comprehensive dashboard for managing AI agents, market questions, sources monitoring, and analytics.

## Development Commands

- `npm i` - Install dependencies
- `npm run dev` - Start development server (runs on port 3000, opens browser automatically)
- `npm run build` - Build the production application

### Database Commands (Prisma)
- `npm run db:push` - Push Prisma schema changes to database (use this for migrations)
- `npm run db:generate` - Generate Prisma Client
- `npm run db:studio` - Open Prisma Studio GUI
- `npm run db:test` - Test database connection

## Architecture

### Core Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 6.3.5
- **UI Library**: Extensive Radix UI components with shadcn/ui
- **Styling**: Tailwind CSS with custom gradients and utilities
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend Integration**: Supabase (database and server functions)
- **Form Handling**: React Hook Form
- **State Management**: React useState (client-side routing via state)
- **Date Handling**: react-day-picker

### Project Structure

```
src/
├── components/
│   ├── figma/           # Figma-related components
│   ├── layout/          # Layout components (AppShell)
│   ├── shared/          # Reusable business components
│   └── ui/              # shadcn/ui components (40+ components)
├── pages/               # Page components (Overview, Markets, Settings, etc.)
├── lib/                 # Core utilities and types
├── styles/              # Global CSS
├── supabase/           # Supabase functions and utilities
└── utils/              # Additional utilities
```

### Navigation & Routing
The app uses client-side routing via React state managed in `App.tsx`. The main navigation structure includes:
- **Main**: Overview, Pulse, Profiles, Tracked Content, AI Agents
- **Admin**: Reports, Settings
- **Source Settings**: Twitter, News, Telegram, Discord, Reddit

### Key Components

- **AppShell** (`components/layout/AppShell.tsx`): Main layout with sidebar navigation, header with search, and user dropdown
- **Pages**: Each page is a separate component that receives `onNavigate` props for navigation
- **UI Components**: Comprehensive set of Radix UI components in `components/ui/`

### Data Types

The application works with several core types defined in `lib/types.ts`:
- **Question**: Market questions with states, resolution criteria, sources
- **Agent**: AI agents with various source types and execution frequencies
- **Source**: Data sources (Twitter, news, etc.) with trust levels
- **Answer**: User responses to questions
- **ConnectorHealth**: Status monitoring for data connectors

### Theming & Styling

- Uses Tailwind CSS with custom gradient utilities
- Custom CSS classes like `gradient-primary` for consistent styling
- Responsive design with mobile support via `use-mobile.ts` hook
- Toronto timezone formatting for dates

### Database Management

**IMPORTANT: This project uses Prisma for database schema management and migrations.**

#### Schema Management Workflow

- **Schema Location**: `prisma/schema.prisma`
- **ORM**: Prisma Client (PostgreSQL via Supabase)
- **Database Provider**: Supabase PostgreSQL

#### Claude's Responsibilities for Database Changes

**When making schema changes, Claude MUST:**

1. **Update the Prisma schema file** (`prisma/schema.prisma`) with the required changes
2. **Run `npm run db:push`** to push schema changes to the Supabase database
   - This command creates/updates tables, indexes, and relationships
   - This is the PRIMARY way to modify database schema
3. **Run `npm run db:generate`** to regenerate Prisma Client after schema changes
4. **Verify the changes** by checking the command output for success

**DO NOT:**
- Manually write SQL migrations in `database/migrations/` for standard schema changes
- Tell the user to run these commands - Claude should run them directly
- Use Supabase SQL Editor for schema changes that can be handled by Prisma

#### Exception: pgvector and Special SQL

**For pgvector tables (like `chunks`) and PostgreSQL-specific features:**

Prisma doesn't support pgvector natively, so these require manual SQL:

1. **Claude should provide the SQL** in a file (e.g., `database/migrations/chunks-table.sql`)
2. **Claude should inform the user** that this specific SQL needs to be run in Supabase SQL Editor
3. **Include the Supabase SQL Editor link** in the message: https://supabase.com/dashboard/project/poxtygumdxfuxjohfsqh/sql/new

**Example Message:**
```
I've created the chunks table SQL in database/migrations/chunks-table.sql.
Since this uses pgvector (not supported by Prisma), you'll need to run it in Supabase:
https://supabase.com/dashboard/project/poxtygumdxfuxjohfsqh/sql/new
```

#### Quick Reference Commands

```bash
# Push schema to database (Claude runs this)
npm run db:push

# Generate Prisma client (Claude runs this after schema changes)
npm run db:generate

# Open Prisma Studio to view data (useful for debugging)
npm run db:studio

# Test database connection
npm run db:test
```

#### Database Documentation

See `database/README.md` for:
- Full setup instructions
- Architecture overview
- Troubleshooting guide
- Table relationships

#### Database Inspection and Debugging

**When the user reports issues with database state or asks questions about data:**

Claude should proactively verify the database state using one of these methods:

1. **Prisma Studio (Recommended for visual inspection)**
   ```bash
   npm run db:studio &  # Opens GUI in browser
   ```
   - Use this to visually inspect tables, relationships, and data
   - Particularly useful for questions like "why do I only see X records?" or "where is my data?"

2. **Custom verification scripts**
   Create a temporary Node.js script to query Supabase directly:
   ```javascript
   // check-data.mjs
   import { createClient } from '@supabase/supabase-js';
   import 'dotenv/config';

   const supabase = createClient(
     process.env.VITE_SUPABASE_URL,
     process.env.VITE_SUPABASE_ANON_KEY
   );

   const { data, error } = await supabase
     .from('table_name')
     .select('*');

   console.log(`Found ${data?.length || 0} records`);
   console.log(data);
   ```
   Then run: `node check-data.mjs`

3. **Supabase SQL Editor** (for complex queries)
   - Direct SQL queries at: https://supabase.com/dashboard/project/poxtygumdxfuxjohfsqh/sql/new
   - Use for JOIN queries, aggregations, or debugging vector operations

**Example scenarios:**
- User: "I only see 1 profile" → Check `brand_profiles` table count and list all records
- User: "Why isn't my data showing?" → Query the relevant table and related tables
- User: "Are embeddings stored?" → Verify `chunks` table has non-null `embedding` column values

### Supabase Integration

- Database hosted on Supabase PostgreSQL
- Client-side queries via `@supabase/supabase-js` in `src/lib/supabase.ts`
- Server functions in `supabase/functions/`
- Environment variables must be prefixed with `VITE_` for client-side access

## Development Notes

- Components follow shadcn/ui patterns with Radix UI primitives
- State management is primarily handled through React useState
- The app uses Vite's path aliasing with `@/` pointing to `src/`
- Date formatting defaults to America/Toronto timezone
- No test suite is currently configured
- Development server runs on port 3000 with auto-opening browser