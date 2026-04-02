-- Migration: IRT/MST Reliability & Correctness Fixes
-- Task #15: Add missing tables for adaptive session content, MST telemetry, and IRT ability

-- 1. student_irt_ability — persists IRT ability estimates across restarts
CREATE TABLE IF NOT EXISTS student_irt_ability (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  theta DECIMAL(8,4) NOT NULL DEFAULT 0,
  standard_error DECIMAL(8,4) NOT NULL DEFAULT 1,
  total_responses INTEGER NOT NULL DEFAULT 0,
  source VARCHAR(20) DEFAULT 'irt',
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. irt_responses — stores individual IRT item responses
CREATE TABLE IF NOT EXISTS irt_responses (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  session_id INTEGER,
  item_id VARCHAR(100) NOT NULL,
  correct BOOLEAN NOT NULL,
  response_time INTEGER,
  theta DECIMAL(8,4),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. adaptive_session_content — persists generated adaptive content drafts
CREATE TABLE IF NOT EXISTS adaptive_session_content (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  content_data JSONB NOT NULL,
  job_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ready',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_adaptive_session_content_session_type UNIQUE (session_id, content_type)
);

-- 4. mst_telemetry — persists MST response telemetry (previously in-memory only)
CREATE TABLE IF NOT EXISTS mst_telemetry (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  skill VARCHAR(20) NOT NULL,
  stage VARCHAR(20) NOT NULL,
  item_id VARCHAR(100),
  p DECIMAL(5,4) NOT NULL,
  route VARCHAR(10) NOT NULL,
  time_spent_ms INTEGER,
  features JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_student_irt_ability_student_id ON student_irt_ability(student_id);
CREATE INDEX IF NOT EXISTS idx_irt_responses_student_id ON irt_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_irt_responses_session_id ON irt_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_session_content_session_id ON adaptive_session_content(session_id);
CREATE INDEX IF NOT EXISTS idx_mst_telemetry_session_id ON mst_telemetry(session_id);
CREATE INDEX IF NOT EXISTS idx_mst_telemetry_user_id ON mst_telemetry(user_id);
CREATE INDEX IF NOT EXISTS idx_mst_telemetry_created_at ON mst_telemetry(created_at);
CREATE INDEX IF NOT EXISTS idx_mst_telemetry_skill ON mst_telemetry(skill);
