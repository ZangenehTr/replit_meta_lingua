import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { db } from '../server/db';

console.log('Initializing SQLite database schema...');

// Create all necessary tables
try {
  // Basic user and role tables
  db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS branding (
      id TEXT PRIMARY KEY,
      logo_url TEXT,
      primary_color TEXT DEFAULT '#4F46E5',
      secondary_color TEXT DEFAULT '#818CF8',
      institute_name TEXT DEFAULT 'Meta Lingua',
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )
  `);

  // Insert default branding
  db.run(sql`
    INSERT OR IGNORE INTO branding (id, institute_name, primary_color, secondary_color)
    VALUES ('default', 'Meta Lingua', '#4F46E5', '#818CF8')
  `);

  // Insert test admin user
  db.run(sql`
    INSERT OR REPLACE INTO users (id, email, password, name, role)
    VALUES (
      'admin-001',
      'admin@test.com',
      '$2b$10$RUgVclFEgupcEHQSoDd79OA2K6uYquoq7TwMr15pLzDltmUhUCLKK',
      'System Admin',
      'admin'
    )
  `);

  console.log('Database schema initialized successfully!');
} catch (error) {
  console.error('Error initializing database:', error);
}

process.exit(0);
