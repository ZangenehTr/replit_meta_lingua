import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Class Lateness Detection & Check-in Schema Migration
 *
 * Creates the four tables introduced for Task #41 (Class Lateness Detection),
 * plus the `pending_at` and `is_late` column additions.
 * All statements are idempotent (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
 */
export async function runClassLatenessSchema() {
  console.log('[Migration] Running class lateness schema migration...');

  // class_sessions: one row per physical occurrence of a recurring class
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS class_sessions (
      id                    SERIAL PRIMARY KEY,
      class_id              INTEGER NOT NULL REFERENCES classes(id),
      scheduled_start       TIMESTAMP NOT NULL,
      actual_start_time     TIMESTAMP,
      started_by_student_id INTEGER REFERENCES users(id),
      start_method          VARCHAR(20),
      status                VARCHAR(20) DEFAULT 'scheduled',
      sms_sent_at           TIMESTAMP,
      created_at            TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at            TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  console.log('[Migration] class_sessions table ensured');

  // class_start_confirmations: student SMS tokens for check-in
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS class_start_confirmations (
      id               SERIAL PRIMARY KEY,
      class_session_id INTEGER NOT NULL REFERENCES class_sessions(id),
      student_id       INTEGER NOT NULL REFERENCES users(id),
      sms_token        VARCHAR(64) NOT NULL UNIQUE,
      is_active        BOOLEAN DEFAULT TRUE,
      is_late          BOOLEAN DEFAULT FALSE,
      confirmed_at     TIMESTAMP,
      method           VARCHAR(20),
      created_at       TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  console.log('[Migration] class_start_confirmations table ensured');

  // lateness_records: all detected lateness events
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lateness_records (
      id               SERIAL PRIMARY KEY,
      class_session_id INTEGER REFERENCES class_sessions(id),
      teacher_id       INTEGER NOT NULL REFERENCES users(id),
      scheduled_start  TIMESTAMP NOT NULL,
      actual_start     TIMESTAMP,
      delay_minutes    INTEGER NOT NULL,
      class_type       VARCHAR(20) NOT NULL,
      detection_method VARCHAR(30) NOT NULL,
      call_session_id  INTEGER,
      created_at       TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  console.log('[Migration] lateness_records table ensured');

  // call_sessions.pending_at column (for CallerN lateness detection)
  await db.execute(sql`
    ALTER TABLE call_sessions
      ADD COLUMN IF NOT EXISTS pending_at TIMESTAMP
  `);
  console.log('[Migration] call_sessions.pending_at column ensured');

  // call_sessions.room_id column (deterministic room identifier for lifecycle binding)
  await db.execute(sql`
    ALTER TABLE call_sessions
      ADD COLUMN IF NOT EXISTS room_id VARCHAR(255)
  `);
  console.log('[Migration] call_sessions.room_id column ensured');

  // users.is_on_duty column (marks supervisor currently on duty for lateness alerts)
  await db.execute(sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_on_duty BOOLEAN DEFAULT FALSE
  `);
  console.log('[Migration] users.is_on_duty column ensured');

  console.log('[Migration] Class lateness schema migration completed');
}
