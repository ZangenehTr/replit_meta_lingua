import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// For self-hosting: Use local PostgreSQL or provided DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/metalingua';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set, using default local PostgreSQL connection');
  console.log('For production self-hosting, set DATABASE_URL to your PostgreSQL instance');
}

// Configure connection pool with better settings
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });

// Add graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Gracefully shutting down database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Gracefully shutting down database connections...');
  await pool.end();
  process.exit(0);
});
