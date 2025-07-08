import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function addSessionPackagesTable() {
  try {
    console.log("🔧 Adding session packages table...");
    
    // Create session_packages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS session_packages (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) NOT NULL,
        package_name VARCHAR(255) NOT NULL,
        total_sessions INTEGER NOT NULL,
        session_duration INTEGER NOT NULL,
        used_sessions INTEGER DEFAULT 0 NOT NULL,
        remaining_sessions INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        purchased_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log("✅ Session packages table created successfully");
    
    // Add indexes for better performance
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_session_packages_student ON session_packages(student_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_session_packages_status ON session_packages(status);`);
    
    console.log("✅ Indexes created successfully");
    
  } catch (error) {
    console.error("❌ Error adding session packages table:", error);
    throw error;
  }
}

// Run the migration
addSessionPackagesTable()
  .then(() => {
    console.log("✅ Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });