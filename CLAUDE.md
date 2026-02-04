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

## MCP Chrome DevTools Integration

**IMPORTANT: Claude Code has Chrome DevTools access through MCP (Model Context Protocol) to debug the frontend in real-time.**

### What is MCP Chrome DevTools?

MCP Chrome DevTools is a Model Context Protocol server that allows Claude Code to control and inspect a live Chrome browser. This enables Claude to:
- Navigate to the running application
- Take screenshots of the UI
- View browser console logs and errors
- Interact with page elements (click, type, etc.)
- Execute JavaScript in the browser context
- Debug React components and state

### Configuration

The MCP server is configured in `C:\Users\dolon\.claude\config.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "env": {}
    }
  }
}
```

**No Chrome extension is required.** The MCP server connects directly to Chrome via the Chrome DevTools Protocol.

### Available Tools

When Chrome DevTools MCP is connected, Claude has access to these tools:

1. **navigate** - Open URLs in Chrome
   - Example: Navigate to `http://localhost:3000` to view the running dashboard

2. **screenshot** - Capture browser screenshots
   - Take full page or viewport screenshots
   - See exactly what the user sees

3. **console_logs** - View browser console output
   - See console.log, console.error, console.warn messages
   - Catch React errors, network failures, etc.

4. **click** - Interact with page elements
   - Click buttons, links, or any clickable element
   - Test user interactions

5. **evaluate** - Execute JavaScript in the browser
   - Query React component state
   - Inspect DOM elements
   - Run diagnostic scripts

6. **type** - Enter text into input fields
   - Test forms and search functionality

7. **network** - Monitor network requests
   - See API calls to Supabase
   - Debug failed requests

### How Claude Should Use Chrome DevTools

**When debugging frontend issues, Claude should:**

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Navigate to the application**:
   Use the `navigate` tool to open `http://localhost:3000`

3. **Take a screenshot**:
   See what's currently rendered on the page

4. **Check console logs**:
   View any JavaScript errors, React warnings, or console output

5. **Evaluate JavaScript**:
   Query component state, inspect variables, or run diagnostics

6. **Test interactions**:
   Click buttons, fill forms, and verify behavior

### Example Debugging Workflow

**User reports: "The dashboard isn't loading data"**

Claude should:
1. Navigate to `http://localhost:3000`
2. Take a screenshot to see the current state
3. Check console logs for errors
4. Evaluate JavaScript to check Supabase connection:
   ```javascript
   console.log(window.supabase)
   ```
5. Inspect network requests to see if API calls are failing
6. Identify the issue and fix the code

**User reports: "Button click doesn't work"**

Claude should:
1. Navigate to the page with the button
2. Take a screenshot to locate the button
3. Use the `click` tool to test the interaction
4. Check console logs for event handler errors
5. Fix the onClick handler or event logic

### Troubleshooting MCP Connection

**If Chrome DevTools tools are not available:**

1. Check that the MCP server is configured in `C:\Users\dolon\.claude\config.json`
2. Restart Claude Code to reload MCP servers
3. Verify Node.js v20.19+ is installed
4. Ensure Chrome is installed (stable, beta, or canary)

**Configuration file location:**
- Windows: `C:\Users\dolon\.claude\config.json`
- Must include the `mcpServers` section with `chrome-devtools` configuration

### When to Use Chrome DevTools

Claude should proactively use Chrome DevTools when:
- User reports UI bugs or visual issues
- Console errors are mentioned
- User asks about frontend behavior
- Debugging React components or state
- Testing user interactions
- Verifying API integration with Supabase
- Inspecting responsive design

### Resources

- Official Documentation: https://developer.chrome.com/blog/chrome-devtools-mcp
- GitHub Repository: https://github.com/ChromeDevTools/chrome-devtools-mcp
- NPM Package: https://www.npmjs.com/package/chrome-devtools-mcp

### Quick Start Command for Claude

When the user asks Claude to debug the frontend, Claude should immediately:

```bash
# Ensure dev server is running
npm run dev

# Then use Chrome DevTools MCP tools to navigate, screenshot, and inspect
```

## Railway Python Service Deployment Monitoring

**IMPORTANT: The Python service (python-service/) is deployed to Railway. When making changes to this service, follow this monitoring workflow.**

### Deployment Monitoring Workflow

**Always monitor deployments actively** - do not rely on background scripts that don't re-engage Claude automatically.

#### 1. Check Deployment Status

After pushing changes or triggering a deployment, wait and check status:

```bash
cd python-service && railway deployment list | head -5
```

This shows recent deployments with their IDs and statuses (DEPLOYING, SUCCESS, FAILED).

#### 2. Check Build Logs

To see if the build completed and what was built:

```bash
cd python-service && railway logs "<deployment-id>" 2>&1 | grep -E "Build time|chmod|RUN" | head -20
```

Look for:
- Build completion: `Build time: X.XX seconds`
- Dockerfile steps being executed
- Any build errors

#### 3. Check Deployment Logs for Specific Deployment

Use the deployment ID from step 1 to check logs for a specific deployment:

```bash
cd python-service && railway logs "<deployment-id>" 2>&1 | tail -50
```

Example:
```bash
cd python-service && railway logs 5e4b58a5-dc4a-4887-a3a1-405e6297923e 2>&1 | tail -50
```

This shows:
- Container startup
- Application logs
- Any runtime errors
- Port binding status

#### 4. Active Monitoring Pattern

**Do NOT run background monitoring scripts.** Instead:

1. Check deployment status every 30-60 seconds
2. Report status to user
3. When deployment completes (SUCCESS or FAILED), check its logs
4. Analyze the results and take next action

Example monitoring loop:
```bash
# Check status
cd python-service && railway deployment list | head -5

# Wait
sleep 60

# Check again and report changes
cd python-service && railway deployment list | head -5

# Once FAILED or SUCCESS, check that deployment's logs
cd python-service && railway logs <deployment-id> 2>&1 | tail -50
```

### Common Deployment Issues

1. **Port Configuration Errors**
   - Look for: `Error: Invalid value for '--port'`
   - Cause: Environment variable not expanding properly in Docker CMD
   - Fix: Use start script or proper shell form

2. **Healthcheck Failures**
   - Look for: `Healthcheck failed!` or container shutting down immediately after start
   - Cause: `/health` endpoint not responding
   - Debug: Check if uvicorn is actually binding to the port

3. **Build Failures**
   - Look for errors during pip install or Docker build steps
   - Common: Missing dependencies, Docker syntax errors

### Python Service Structure

- **Location**: `python-service/`
- **Main file**: `main.py` - FastAPI application
- **Dockerfile**: Docker configuration
- **start.sh**: Startup script that handles PORT environment variable
- **requirements.txt**: Python dependencies including CV libraries

### Triggering Manual Deployment

If Railway doesn't auto-deploy after git push:

```bash
cd python-service && railway up
```

## Vercel Frontend Deployment Monitoring

**IMPORTANT: The React frontend is deployed to Vercel. When making changes to the frontend, follow this monitoring workflow.**

### Deployment Monitoring Workflow

**Always monitor deployments actively** - Vercel auto-deploys on git push to main branch.

#### 1. Check Deployment Status

After pushing changes to trigger a deployment:

```bash
npx vercel list --status BUILDING,READY | head -8
```

This shows recent deployments with their status:
- **● Building** - Deployment is currently building
- **● Ready** - Deployment completed successfully (Production)
- **● Error** - Build failed

#### 2. Monitor Specific Deployment

To check a specific deployment's progress:

```bash
# List deployments to find the URL
npx vercel list | head -5

# View logs for a specific deployment
npx vercel logs <deployment-url>
```

Example:
```bash
npx vercel logs https://anomalyint-qovqre23s-anomalygames.vercel.app
```

#### 3. Active Monitoring Pattern

**Example workflow from a recent deployment:**

```bash
# Push changes
git add . && git commit -m "feat: add feature" && git push

# Check for new deployment (should appear within seconds)
npx vercel list --status BUILDING,READY | head -8
# Output shows: ● Building status for newest deployment

# Wait 60 seconds and check again
sleep 60 && npx vercel list --status BUILDING,READY | head -8
# May still be building (typical build time: 1-2 minutes)

# Wait another 60 seconds
sleep 60 && npx vercel list --status BUILDING,READY,ERROR | head -8
# Output shows: ● Ready status (deployment complete!)
```

#### 4. Vercel CLI Commands Reference

```bash
# List all deployments
npx vercel list
# or shorthand
npx vercel ls

# Filter by status
npx vercel list --status READY
npx vercel list --status BUILDING,ERROR

# Get deployment details
npx vercel inspect <deployment-url>

# View deployment logs
npx vercel logs <deployment-url>

# Pagination
npx vercel ls --next <timestamp>

# JSON format for scripting
npx vercel list --format json
```

### Deployment Timeline

Typical Vercel deployment timeline:
1. **0s** - Git push triggers deployment
2. **0-10s** - Deployment appears with **● Building** status
3. **1-2m** - Build completes, status changes to **● Ready**
4. **Total**: ~2 minutes from push to production

### Common Deployment Statuses

- **● Building** - Currently building (1-2 minutes typical)
- **● Ready** - Successfully deployed to production
- **● Error** - Build failed, check logs
- **● Canceled** - Deployment was canceled

### Vercel vs Railway Comparison

| Feature | Vercel | Railway |
|---------|--------|---------|
| Status | Building → Ready/Error | Queued → Building → Deploying → Success/Failed |
| Identifier | Deployment URL | Deployment ID |
| Typical Build | 1-2 minutes | 1-2 minutes |
| Auto-deploy | On git push | On git push |
| CLI Tool | `npx vercel` | `railway` |