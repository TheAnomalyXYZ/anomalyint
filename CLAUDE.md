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

- **Schema Location**: `prisma/schema.prisma`
- **ORM**: Prisma Client (PostgreSQL via Supabase)
- **Migrations**: Use `npm run db:push` to apply schema changes to the database
- **DO NOT** manually write SQL migrations - always update the Prisma schema and use `npm run db:push`
- **DO NOT** use Supabase SQL Editor for schema changes - use Prisma
- After schema changes, Prisma will automatically regenerate the client

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