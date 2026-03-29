-- Migration: Promo Codes & Digital Certificates
-- Task #5: Adds promo_codes, promo_code_usages, certificates, video_progress tables
-- and adds certificate_template column to admin_settings.
-- All DDL uses IF NOT EXISTS / EXCEPTION WHEN duplicate handling for idempotency.

-- ─── 1. promo_codes table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  discount_value INTEGER NOT NULL,
  min_amount INTEGER,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  single_use_per_user BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP,
  applicable_course_ids INTEGER[],
  created_by INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add single_use_per_user if table already existed without it
DO $$ BEGIN
  BEGIN ALTER TABLE promo_codes ADD COLUMN single_use_per_user BOOLEAN NOT NULL DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes (code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes (is_active);

-- ─── 2. promo_code_usages table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_code_usages (
  id SERIAL PRIMARY KEY,
  promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  discount_amount INTEGER,
  original_amount INTEGER,
  final_amount INTEGER,
  used_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_code_usages_promo_id ON promo_code_usages (promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usages_user_id ON promo_code_usages (user_id);

-- Add promo_code_id to course_payments for linking promo to confirmed payments
DO $$ BEGIN
  BEGIN ALTER TABLE course_payments ADD COLUMN promo_code_id INTEGER REFERENCES promo_codes(id);
  EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- ─── 3. certificates table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  certificate_number VARCHAR(50) NOT NULL UNIQUE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_by INTEGER REFERENCES users(id),
  issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  revoked_at TIMESTAMP,
  revoke_reason TEXT,
  pdf_path TEXT,
  metadata JSONB
);

-- Add columns that may be missing on existing certificate tables
DO $$ BEGIN
  BEGIN ALTER TABLE certificates ADD COLUMN pdf_path TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;
DO $$ BEGIN
  BEGIN ALTER TABLE certificates ADD COLUMN revoke_reason TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;
DO $$ BEGIN
  BEGIN ALTER TABLE certificates ADD COLUMN revoked_at TIMESTAMP;
  EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;
DO $$ BEGIN
  BEGIN ALTER TABLE certificates ADD COLUMN expires_at TIMESTAMP;
  EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;
DO $$ BEGIN
  BEGIN ALTER TABLE certificates ADD COLUMN metadata JSONB;
  EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;
DO $$ BEGIN
  BEGIN ALTER TABLE certificates ADD COLUMN issued_by INTEGER REFERENCES users(id);
  EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates (student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates (course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates (certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates (status);

-- ─── 4. video_progress table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  watch_percent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_video_progress_user_course ON video_progress (user_id, course_id);

-- ─── 5. admin_settings.certificate_template ─────────────────────────────────
-- JSON string containing institute name, logo URL, signature title, footer note, etc.
DO $$ BEGIN
  BEGIN ALTER TABLE admin_settings ADD COLUMN certificate_template TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;
