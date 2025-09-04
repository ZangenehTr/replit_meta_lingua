import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Database configuration for self-hosting
// Development: Uses Replit/Neon for temporary development
// Production: Will use self-hosted PostgreSQL in Iran
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  console.error('For production self-hosting in Iran, set DATABASE_URL to your local PostgreSQL');
  process.exit(1);
}

// Log connection info (hide password)
const dbInfo = DATABASE_URL.includes('@') 
  ? DATABASE_URL.split('@')[1]?.split('/')[0] 
  : 'local database';
console.log(`Connecting to database: ${dbInfo}`);

// Configure connection pool with better settings
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false, // Disable SSL for local self-hosted database
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
