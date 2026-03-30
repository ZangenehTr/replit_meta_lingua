-- Migration: Private Class Operational Stack (Task #9)
-- Creates tables for session bundle packages, teacher-student assignments,
-- private session logging, and adjusts nullable constraints for compatibility.
-- All statements are idempotent and safe to run against existing databases.

-- 1. Session bundle templates (admin-managed pricing/session configs)
CREATE TABLE IF NOT EXISTS session_packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  package_type VARCHAR(50) DEFAULT 'private',
  session_count INTEGER NOT NULL,
  session_duration INTEGER DEFAULT 60,
  validity_days INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'IRR',
  discount_percentage NUMERIC(5,2),
  is_active BOOLEAN DEFAULT true,
  target_audience VARCHAR(100),
  skill_level VARCHAR(50),
  features TEXT[] DEFAULT '{}',
  terms TEXT,
  low_session_alert_threshold INTEGER DEFAULT 2,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ensure low_session_alert_threshold column exists (for older table instances)
ALTER TABLE session_packages ADD COLUMN IF NOT EXISTS low_session_alert_threshold INTEGER DEFAULT 2;

-- 2. Student session packages (purchased instances per student)
CREATE TABLE IF NOT EXISTS student_session_packages (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  package_id INTEGER NOT NULL REFERENCES session_packages(id),
  lead_id INTEGER REFERENCES leads(id),
  total_sessions INTEGER NOT NULL,
  remaining_sessions INTEGER NOT NULL,
  session_duration INTEGER NOT NULL,
  low_session_alert_threshold INTEGER NOT NULL DEFAULT 2,
  alert_fired_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  start_date TIMESTAMP DEFAULT NOW(),
  expiry_date TIMESTAMP,
  notes TEXT,
  next_scheduled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Teacher-student assignments (tracks active pairs)
CREATE TABLE IF NOT EXISTS teacher_student_assignments (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  student_session_package_id INTEGER REFERENCES student_session_packages(id),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ensure notes column exists on teacher_student_assignments (for older table instances)
ALTER TABLE teacher_student_assignments ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Private session log (individual session records)
CREATE TABLE IF NOT EXISTS private_sessions (
  id SERIAL PRIMARY KEY,
  student_session_package_id INTEGER NOT NULL REFERENCES student_session_packages(id),
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  session_date TIMESTAMP NOT NULL,
  actual_duration INTEGER,
  topics_covered TEXT,
  teacher_notes TEXT,
  attendance_status VARCHAR(20) DEFAULT 'attended',
  sessions_deducted INTEGER DEFAULT 1,
  remaining_after INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. Make live_class_sessions.class_id nullable (safe idempotent guard)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_class_sessions'
      AND column_name = 'class_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE live_class_sessions ALTER COLUMN class_id DROP NOT NULL;
  END IF;
END $$;

-- 6. Make course_payments.course_id nullable (safe idempotent guard)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_payments'
      AND column_name = 'course_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE course_payments ALTER COLUMN course_id DROP NOT NULL;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ssp_student_id ON student_session_packages(student_id);
CREATE INDEX IF NOT EXISTS idx_ssp_teacher_id ON student_session_packages(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ssp_status ON student_session_packages(status);
CREATE INDEX IF NOT EXISTS idx_private_sessions_package_id ON private_sessions(student_session_package_id);
CREATE INDEX IF NOT EXISTS idx_private_sessions_student_id ON private_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_private_sessions_teacher_id ON private_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tsa_teacher_id ON teacher_student_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tsa_student_id ON teacher_student_assignments(student_id);
