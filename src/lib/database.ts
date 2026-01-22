import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection configuration for Supabase PostgreSQL
const dbConfig: any = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'postgres',
  max: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_TIMEOUT || '60000'),
  connectionTimeoutMillis: 10000,
};

// Create connection pool
let pool: pkg.Pool | null = null;

export const getPool = (): pkg.Pool => {
  if (!pool) {
    pool = new Pool(dbConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await getPool().connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Query helper function
export const query = async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
  try {
    const result = await getPool().query(sql, params);
    return result.rows as T[];
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// Transaction helper
export const transaction = async <T>(
  callback: (client: pkg.PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};