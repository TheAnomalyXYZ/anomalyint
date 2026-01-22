import 'dotenv/config';
import pkg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const { Pool } = pkg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', '004_agent_multiple_categories.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Running migration...');
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('Agents now support multiple categories.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
