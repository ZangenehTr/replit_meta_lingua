import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createAvailabilityPeriodsTable() {
  console.log('Creating teacher availability periods table...');
  
  try {
    // Create teacher_availability_periods table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS teacher_availability_periods (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL REFERENCES users(id),
        period_start_date TIMESTAMP NOT NULL,
        period_end_date TIMESTAMP NOT NULL,
        day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
        time_division TEXT NOT NULL CHECK (time_division IN ('morning', 'afternoon', 'evening', 'full-day')),
        class_format TEXT NOT NULL CHECK (class_format IN ('online', 'in-person', 'hybrid')),
        specific_hours TEXT,
        is_active BOOLEAN DEFAULT true,
        supervisor_notified BOOLEAN DEFAULT false,
        admin_notified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✓ Created teacher_availability_periods table');

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_teacher_availability_periods_teacher_id ON teacher_availability_periods(teacher_id);
    `);
    console.log('✓ Created index on teacher_id');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_teacher_availability_periods_dates ON teacher_availability_periods(period_start_date, period_end_date);
    `);
    console.log('✓ Created index on period dates');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_teacher_availability_periods_active ON teacher_availability_periods(is_active);
    `);
    console.log('✓ Created index on is_active');

    console.log('✅ Teacher availability periods table created successfully!');
  } catch (error) {
    console.error('❌ Error creating teacher availability periods table:', error);
    throw error;
  }
}

// Run the migration
createAvailabilityPeriodsTable()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });