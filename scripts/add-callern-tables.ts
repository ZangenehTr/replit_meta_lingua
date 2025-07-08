import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function addCallernTables() {
  try {
    console.log('Adding Callern video call system tables...');
    
    // Create Callern packages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS callern_packages (
        id SERIAL PRIMARY KEY,
        package_name VARCHAR(100) NOT NULL,
        total_hours INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✓ Created callern_packages table');

    // Create student Callern packages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS student_callern_packages (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES users(id),
        package_id INTEGER NOT NULL REFERENCES callern_packages(id),
        total_hours INTEGER NOT NULL,
        used_minutes INTEGER DEFAULT 0 NOT NULL,
        remaining_minutes INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active' NOT NULL,
        purchased_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✓ Created student_callern_packages table');

    // Create teacher Callern availability table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS teacher_callern_availability (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL REFERENCES users(id),
        is_online BOOLEAN DEFAULT false NOT NULL,
        last_active_at TIMESTAMP,
        hourly_rate DECIMAL(10, 2),
        available_hours TEXT[],
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✓ Created teacher_callern_availability table');

    // Create Callern call history table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS callern_call_history (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES users(id),
        teacher_id INTEGER NOT NULL REFERENCES users(id),
        package_id INTEGER NOT NULL REFERENCES student_callern_packages(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_minutes INTEGER,
        status VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✓ Created callern_call_history table');

    // Create Callern syllabus topics table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS callern_syllabus_topics (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        level VARCHAR(20) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        "order" INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✓ Created callern_syllabus_topics table');

    // Create student Callern progress table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS student_callern_progress (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES users(id),
        topic_id INTEGER NOT NULL REFERENCES callern_syllabus_topics(id),
        teacher_id INTEGER NOT NULL REFERENCES users(id),
        call_id INTEGER REFERENCES callern_call_history(id),
        completed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✓ Created student_callern_progress table');

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_student_callern_packages_student_id ON student_callern_packages(student_id);
      CREATE INDEX IF NOT EXISTS idx_student_callern_packages_status ON student_callern_packages(status);
      CREATE INDEX IF NOT EXISTS idx_teacher_callern_availability_teacher_id ON teacher_callern_availability(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_teacher_callern_availability_is_online ON teacher_callern_availability(is_online);
      CREATE INDEX IF NOT EXISTS idx_callern_call_history_student_id ON callern_call_history(student_id);
      CREATE INDEX IF NOT EXISTS idx_callern_call_history_teacher_id ON callern_call_history(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_callern_call_history_status ON callern_call_history(status);
      CREATE INDEX IF NOT EXISTS idx_callern_syllabus_topics_category ON callern_syllabus_topics(category);
      CREATE INDEX IF NOT EXISTS idx_callern_syllabus_topics_level ON callern_syllabus_topics(level);
      CREATE INDEX IF NOT EXISTS idx_student_callern_progress_student_id ON student_callern_progress(student_id);
      CREATE INDEX IF NOT EXISTS idx_student_callern_progress_topic_id ON student_callern_progress(topic_id);
      CREATE INDEX IF NOT EXISTS idx_student_callern_progress_student_topic ON student_callern_progress(student_id, topic_id);
    `);
    console.log('✓ Created indexes for Callern tables');

    // Insert sample Callern packages
    await db.execute(sql`
      INSERT INTO callern_packages (package_name, total_hours, price, description)
      VALUES 
        ('Starter Pack', 5, 2500000, 'Perfect for beginners - 5 hours of video calls'),
        ('Regular Pack', 10, 4500000, 'Most popular - 10 hours of video calls'),
        ('Intensive Pack', 20, 8000000, 'For serious learners - 20 hours of video calls'),
        ('Professional Pack', 40, 14000000, 'Complete immersion - 40 hours of video calls')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Inserted sample Callern packages');

    // Insert sample syllabus topics
    await db.execute(sql`
      INSERT INTO callern_syllabus_topics (category, level, title, description, "order")
      VALUES 
        -- Grammar topics
        ('grammar', 'beginner', 'Present Simple Tense', 'Basic present tense usage and forms', 1),
        ('grammar', 'beginner', 'Present Continuous Tense', 'Actions happening now', 2),
        ('grammar', 'beginner', 'Past Simple Tense', 'Completed past actions', 3),
        ('grammar', 'intermediate', 'Present Perfect Tense', 'Past actions with present relevance', 4),
        ('grammar', 'intermediate', 'Past Continuous Tense', 'Ongoing past actions', 5),
        ('grammar', 'intermediate', 'Future Forms', 'Will, going to, present continuous for future', 6),
        ('grammar', 'advanced', 'Past Perfect Tense', 'Actions completed before past point', 7),
        ('grammar', 'advanced', 'Conditionals', 'If clauses and hypothetical situations', 8),
        ('grammar', 'advanced', 'Passive Voice', 'Focus on action rather than subject', 9),
        
        -- Vocabulary topics
        ('vocabulary', 'beginner', 'Daily Routines', 'Common daily activities vocabulary', 1),
        ('vocabulary', 'beginner', 'Family & Relationships', 'Family members and relationships', 2),
        ('vocabulary', 'beginner', 'Food & Drinks', 'Common foods and beverages', 3),
        ('vocabulary', 'intermediate', 'Work & Career', 'Professional vocabulary', 4),
        ('vocabulary', 'intermediate', 'Travel & Tourism', 'Travel-related vocabulary', 5),
        ('vocabulary', 'intermediate', 'Health & Medicine', 'Medical and health vocabulary', 6),
        ('vocabulary', 'advanced', 'Business English', 'Advanced business terminology', 7),
        ('vocabulary', 'advanced', 'Academic English', 'Academic and formal vocabulary', 8),
        ('vocabulary', 'advanced', 'Idioms & Expressions', 'Common English idioms', 9)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Inserted sample syllabus topics');

    console.log('\n✅ Callern video call system tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating Callern tables:', error);
    process.exit(1);
  }
}

addCallernTables();