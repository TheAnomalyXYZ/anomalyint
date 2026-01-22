# Quick Start: Database Setup

Get your database up and running in 5 minutes!

## Step 1: Copy Environment File

```bash
cp .env.example .env
```

## Step 2: Add Your Database Credentials

Edit `.env` and add your Supabase credentials:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DB_HOST=db.[YOUR-PROJECT-REF].supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=[YOUR-PASSWORD]
DB_NAME=postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### Where to Get Credentials?

**Using Supabase (Recommended):**
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Project Settings → Database
4. Copy the connection string and credentials
5. Go to Project Settings → API to get your API keys
6. Paste all credentials into your `.env` file

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Initialize Database

**Using Prisma (Recommended):**
```bash
npm run db:push
```

This will create all tables in your Supabase PostgreSQL database.

## Step 5: Test Connection

```bash
npm run db:test
```

You should see: `Connected: ✅`

## Step 6: Start Development

```bash
npm run dev
```

Visit http://localhost:3000 and test the "Run Now" button on an agent!

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:test` | Test database connection |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open visual database browser |
| `npm run db:generate` | Generate Prisma client |
| `npm run agent:run-all` | Run all active agents |
| `npm run agent:run-daily` | Run daily agents |

## Need Help?

See the full [DATABASE_SETUP.md](./DATABASE_SETUP.md) guide for:
- Detailed setup instructions
- Troubleshooting tips
- Security best practices
- Migration management

## What's Next?

1. ✅ Database connected
2. Create your first agent in the UI
3. Click "Run Now" to generate a question
4. Set up cron jobs for automated execution (see DATABASE_SETUP.md)

---

**Security Reminder:** Never commit your `.env` file! It's already in `.gitignore`.
