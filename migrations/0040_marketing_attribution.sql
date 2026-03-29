-- Migration: 0040_marketing_attribution.sql
-- Version: 1.1.0
-- Description: Course reviews, referral program, CallerN ratings, UTM attribution
-- Safe to re-run: all statements use IF NOT EXISTS / IF NOT EXISTS guards

-- ─── Course Reviews ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_reviews (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  user_id INTEGER REFERENCES users(id),       -- legacy column, kept for compatibility
  student_id INTEGER REFERENCES users(id),    -- primary reference used by application
  enrollment_id INTEGER,                      -- optional link to enrollment record
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  body TEXT,                                  -- legacy text column
  review_text TEXT,                           -- application text column
  review_text_fa TEXT,
  review_text_ar TEXT,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending | approved | rejected
  rejection_reason TEXT,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(course_id, student_id)
);

-- ─── Referral Program ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  code VARCHAR(20) NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_credits_earned INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS referral_events (
  id SERIAL PRIMARY KEY,
  referral_code_id INTEGER NOT NULL REFERENCES referral_codes(id),
  referrer_id INTEGER NOT NULL REFERENCES users(id),
  referred_user_id INTEGER REFERENCES users(id),
  event_type VARCHAR(30) NOT NULL,
  course_payment_id INTEGER,
  referrer_credit_awarded INTEGER DEFAULT 0,
  referred_credit_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ─── CallerN Session Ratings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_ratings (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  teacher_rating INTEGER CHECK (teacher_rating BETWEEN 1 AND 5),
  student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
  teacher_comment TEXT,
  student_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ─── UTM Attribution — users table ───────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS callern_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS callern_session_count INTEGER DEFAULT 0;

-- ─── UTM Attribution — course_payments table ─────────────────────────────────
ALTER TABLE course_payments ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE course_payments ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE course_payments ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);

-- ─── UTM Attribution — enrollments table ─────────────────────────────────────
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
