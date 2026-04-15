import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function runClassCancellationMigration() {
  console.log('[Migration] Running class cancellation schema migration...');

  await db.execute(sql`
    ALTER TABLE live_class_sessions
      ADD COLUMN IF NOT EXISTS cancellation_status VARCHAR(30) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS cancelled_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS cancelled_reason VARCHAR(50),
      ADD COLUMN IF NOT EXISTS cancelled_reason_text TEXT,
      ADD COLUMN IF NOT EXISTS is_chatroom_read_only BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP
  `);
  console.log('[Migration] live_class_sessions cancellation columns added');

  await db.execute(sql`
    ALTER TABLE support_tickets
      ADD COLUMN IF NOT EXISTS class_session_id INTEGER REFERENCES live_class_sessions(id)
  `);
  console.log('[Migration] support_tickets class_session_id column added');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS class_cancellation_requests (
      id SERIAL PRIMARY KEY,
      class_session_id INTEGER NOT NULL REFERENCES live_class_sessions(id),
      requested_by_user_id INTEGER NOT NULL REFERENCES users(id),
      requester_role VARCHAR(20) NOT NULL,
      reason_category VARCHAR(30) NOT NULL,
      reason_text TEXT,
      student_request_count INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      reviewed_by_user_id INTEGER REFERENCES users(id),
      reviewed_at TIMESTAMP,
      makeup_session_id INTEGER REFERENCES live_class_sessions(id),
      sms_delivery_count INTEGER DEFAULT 0,
      chatroom_message_status VARCHAR(20) DEFAULT 'not_sent',
      support_ticket_id INTEGER REFERENCES support_tickets(id),
      is_less_than_30_min BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log('[Migration] class_cancellation_requests table created');

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_ccr_class_session ON class_cancellation_requests(class_session_id);
    CREATE INDEX IF NOT EXISTS idx_ccr_status ON class_cancellation_requests(status);
    CREATE INDEX IF NOT EXISTS idx_ccr_requester ON class_cancellation_requests(requested_by_user_id);
  `);
  console.log('[Migration] class_cancellation_requests indexes created');

  console.log('[Migration] Class cancellation migration complete');
}
