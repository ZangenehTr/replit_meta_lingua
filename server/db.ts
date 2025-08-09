import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Check if the DATABASE_URL is pointing to a disabled Neon endpoint
const isNeonDisabled = process.env.DATABASE_URL?.includes('neon.tech');

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (isNeonDisabled) {
  console.log('Note: Neon database disabled, using local SQLite database as fallback');
}

// Use SQLite as fallback database
const sqlite = new Database(path.join(dataDir, 'metalingua.db'));

// Enable foreign key constraints in SQLite
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Export pool as null for compatibility (SQLite doesn't use connection pools)
export const pool = null as any;

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
