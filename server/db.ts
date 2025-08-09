import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Create data directory if it doesn't exist
const dbPath = process.env.DATABASE_PATH || './data/metalingua.db';
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database
const sqlite = new Database(dbPath);

// Enable foreign keys and WAL mode for better performance
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

console.log(`SQLite database initialized at: ${dbPath}`);

// Add graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Gracefully shutting down database...');
  sqlite.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Gracefully shutting down database...');
  sqlite.close();
  process.exit(0);
});
