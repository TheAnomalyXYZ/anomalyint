# Database Setup Guide

This guide will help you set up and configure the database for the AI Automation Dashboard.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (recommended) or local PostgreSQL database

## Recommended Database Options

### Option 1: Supabase (Recommended)

**Why Supabase?**
- Free tier with generous limits (500MB database, 50MB file storage)
- PostgreSQL database with full SQL support
- Built-in authentication and real-time subscriptions
- REST and GraphQL APIs auto-generated
- Dashboard for database management
- Global edge network for low latency

**Setup Steps:**

1. **Create a Supabase account** at https://supabase.com

2. **Create a new project**
   - Click "New project"
   - Choose a name (e.g., "predmarketai")
   - Set a strong database password
   - Select a region close to your users

3. **Get your connection credentials**
   - Go to Project Settings → Database
   - Copy the connection string (Connection pooling mode recommended)
   - Go to Project Settings → API
   - Copy your `URL` and `anon` key

4. **Important Supabase Notes:**
   - SSL is required and already configured in our code
   - Use connection pooling for better performance
   - Row Level Security (RLS) is available but not required for this app

### Option 2: Local PostgreSQL (For Development)

**Setup Steps:**

1. **Install PostgreSQL**
   - Download from https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15`

2. **Create database**
   ```sql
   CREATE DATABASE predmarketai;
   CREATE USER predmarket_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE predmarketai TO predmarket_user;
   ```

3. **Connection details for .env:**
   ```
   DATABASE_URL=postgresql://predmarket_user:your_secure_password@localhost:5432/predmarketai
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=predmarket_user
   DB_PASSWORD=your_secure_password
   DB_NAME=predmarketai
   ```

### Option 3: Other Cloud Providers

- **AWS RDS**: Full-featured PostgreSQL in AWS
- **Google Cloud SQL**: PostgreSQL in Google Cloud
- **Azure Database for PostgreSQL**: PostgreSQL in Azure
- **Railway**: Simple deployment platform with PostgreSQL
- **Render**: Managed PostgreSQL with free tier

## Configuration

### 1. Create .env file

Copy the example file:

```bash
cp .env.example .env
```

### 2. Edit .env with your credentials

Open `.env` and fill in your database credentials:

```env
# For Supabase (Recommended)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DB_HOST=db.[YOUR-PROJECT-REF].supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=[YOUR-PASSWORD]
DB_NAME=postgres

# Supabase API Keys
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# For Local PostgreSQL
DATABASE_URL=postgresql://predmarket_user:your_secure_password@localhost:5432/predmarketai
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=predmarket_user
DB_PASSWORD=your_secure_password
DB_NAME=predmarketai

# Optional settings
DB_CONNECTION_LIMIT=10
DB_TIMEOUT=60000
```

### 3. Install dependencies

```bash
npm install
```

## Initialize Database

### Option A: Using Prisma (Recommended)

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (for development)
npx prisma db push

# Or run migrations (for production)
npx prisma migrate deploy
```

### Option B: Using SQL Scripts Directly

```bash
# Initialize database with base schema (if you have a custom init script)
npm run db:init

# Or manually run the SQL files with psql (PostgreSQL command-line tool)
psql -U your_username -d your_database_name -f database/schema.sql
psql -U your_username -d your_database_name -f database/migrations/001_initial_schema.sql
psql -U your_username -d your_database_name -f database/migrations/002_ai_resolution_proposals.sql
psql -U your_username -d your_database_name -f database/migrations/003_add_base_model_to_agents.sql
psql -U your_username -d your_database_name -f database/migrations/004_add_category_to_agents.sql
```

## Verify Connection

You can test your database connection:

```bash
node -e "require('./src/lib/database').testConnection().then(r => console.log('Connected:', r))"
```

Or create a test script:

```javascript
// test-db.js
import { testConnection } from './src/lib/database.js';

testConnection()
  .then(connected => {
    console.log('Database connection:', connected ? '✅ SUCCESS' : '❌ FAILED');
    process.exit(connected ? 0 : 1);
  });
```

## Keeping Database in Sync

### Using Prisma Migrations (Recommended)

1. **Create a new migration** after changing the schema:
   ```bash
   npx prisma migrate dev --name describe_your_changes
   ```

2. **Apply migrations to production:**
   ```bash
   npx prisma migrate deploy
   ```

3. **View migration status:**
   ```bash
   npx prisma migrate status
   ```

### Manual SQL Migrations

1. Create a new migration file in `database/migrations/`:
   ```
   005_your_migration_name.sql
   ```

2. Write your SQL changes

3. Apply manually or create a script to run all pending migrations

## Prisma Studio (Database GUI)

Prisma includes a visual database browser:

```bash
npx prisma studio
```

This will open a web interface at http://localhost:5555 where you can:
- Browse all tables
- View and edit data
- Run queries
- Great for development and debugging

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Recommended | - | Full PostgreSQL connection string |
| `DB_HOST` | Yes (if not using DATABASE_URL) | - | Database server hostname |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_USERNAME` | Yes (if not using DATABASE_URL) | `postgres` | Database username |
| `DB_PASSWORD` | Yes | - | Database password |
| `DB_NAME` | Yes (if not using DATABASE_URL) | `postgres` | Database name |
| `SUPABASE_URL` | No | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | No | - | Supabase anonymous key |
| `DB_CONNECTION_LIMIT` | No | `10` | Max connections in pool |
| `DB_TIMEOUT` | No | `60000` | Connection timeout in ms |

## Security Best Practices

1. **Never commit .env file** - It's already in .gitignore
2. **Use strong passwords** - Generate with a password manager
3. **Rotate credentials regularly** - Especially after team changes
4. **Use read-only credentials** where possible - For reporting, analytics
5. **Enable SSL** - Always use SSL in production (already configured)
6. **Limit connection IPs** - Whitelist only your application servers

## Troubleshooting

### Connection Refused
- Check if database server is running
- Verify host and port are correct
- Check firewall rules

### Authentication Failed
- Verify username and password
- Check user has proper permissions
- Ensure user can connect from your IP

### SSL Errors
- For PlanetScale, SSL is required
- For local development, you might need to disable SSL verification

### Too Many Connections
- Increase `DB_CONNECTION_LIMIT`
- Check for connection leaks in your code
- Consider connection pooling

## Migration History

| Migration | Description | Date |
|-----------|-------------|------|
| 001 | Initial schema | - |
| 002 | AI resolution proposals | - |
| 003 | Add base_model to agents | - |
| 004 | Add category to agents | 2024 |

## Backup and Recovery

### Automated Backups (Supabase)
- Supabase automatically backs up your database daily on paid plans
- Free tier: Point-in-time recovery available for 24 hours
- Paid plans: Can restore to any point in time within retention period

### Manual Backups

```bash
# Export database (PostgreSQL)
pg_dump -U username -d database_name > backup.sql

# Or using connection string
pg_dump postgresql://username:password@host:5432/database_name > backup.sql

# Import database
psql -U username -d database_name < backup.sql

# Or using connection string
psql postgresql://username:password@host:5432/database_name < backup.sql
```

### Using Prisma

```bash
# Export schema
npx prisma db pull

# The schema will be in prisma/schema.prisma
```

## Support

If you encounter issues:
1. Check this documentation
2. Review error messages carefully
3. Check database logs
4. Verify .env configuration
5. Test connection with a simple script

## Next Steps

After setting up the database:
1. Run the application: `npm run dev`
2. Test agent execution: Click "Run Now" on an agent
3. Check the Markets page to see generated questions
4. Set up cron jobs for automated agent execution
