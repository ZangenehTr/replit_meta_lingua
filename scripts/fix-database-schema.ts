#!/usr/bin/env tsx
/**
 * Database Schema Fix Script
 * This script ensures all database tables have the required columns from the schema
 * Run this to prevent recurring database column errors
 */

import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function fixDatabaseSchema() {
  console.log("🔧 Starting comprehensive database schema fix...");

  try {
    // Add all missing columns to prevent crashes
    const fixes = [
      // Courses table fixes
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS first_session_date date",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS last_session_date date", 
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS time_zone text DEFAULT 'Asia/Tehran'",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS calendar_type text DEFAULT 'gregorian'",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_code varchar",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS weekdays text[]",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_time text",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS end_time text",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_language text",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_level text[]",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS auto_record boolean DEFAULT false",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS recording_available boolean DEFAULT false",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS session_duration integer",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS delivery_mode text",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS class_format text",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS max_students integer",

      // Payments table fixes
      "ALTER TABLE payments ADD COLUMN IF NOT EXISTS merchant_transaction_id text",
      "ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_transaction_id text", 
      "ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_number text",
      "ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_number text",
      "ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason text",
      "ALTER TABLE payments ADD COLUMN IF NOT EXISTS shetab_response jsonb",
      "ALTER TABLE payments ADD COLUMN IF NOT EXISTS ip_address text",
      "ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_agent text",
      "ALTER TABLE payments ADD COLUMN IF NOT EXISTS credits_awarded integer DEFAULT 0",
      "ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider text DEFAULT 'shetab'",
      "ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id text",

      // Users table fixes
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS credits integer DEFAULT 0",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS member_tier text DEFAULT 'bronze'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS total_lessons integer DEFAULT 0",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance integer DEFAULT 0",

      // Create missing tables if they don't exist
      `CREATE TABLE IF NOT EXISTS wallet_transactions (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id) NOT NULL,
        type text NOT NULL,
        amount integer NOT NULL,
        description text,
        status text NOT NULL DEFAULT 'pending',
        merchant_transaction_id text,
        shetab_transaction_id text,
        shetab_reference_number text,
        card_number text,
        gateway_response jsonb,
        created_at timestamp DEFAULT now(),
        completed_at timestamp
      )`,

      `CREATE TABLE IF NOT EXISTS course_payments (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id) NOT NULL,
        course_id integer REFERENCES courses(id) NOT NULL,
        original_price integer NOT NULL,
        discount_percentage integer DEFAULT 0,
        final_price integer NOT NULL,
        credits_awarded integer DEFAULT 0,
        payment_method text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        merchant_transaction_id text,
        shetab_transaction_id text,
        shetab_reference_number text,
        card_number text,
        gateway_response jsonb,
        created_at timestamp DEFAULT now(),
        completed_at timestamp
      )`,

      `CREATE TABLE IF NOT EXISTS ai_training_data (
        id serial PRIMARY KEY,
        model_name text NOT NULL,
        file_name text NOT NULL,
        content text NOT NULL,
        user_id integer NOT NULL,
        file_type text NOT NULL,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )`
    ];

    console.log(`📝 Executing ${fixes.length} schema fixes...`);

    for (const fix of fixes) {
      try {
        await db.execute(sql.raw(fix));
        console.log(`✅ ${fix.substring(0, 50)}...`);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.log(`⚠️  ${fix.substring(0, 50)}... - ${error.message}`);
        }
      }
    }

    console.log("🎉 Database schema fix completed successfully!");
    console.log("🚀 Application should now run without column errors.");

  } catch (error) {
    console.error("❌ Error fixing database schema:", error);
    process.exit(1);
  }
}

// Run the fix
fixDatabaseSchema().then(() => {
  console.log("✨ Schema fix completed. You can now start the application.");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Schema fix failed:", error);
  process.exit(1);
});