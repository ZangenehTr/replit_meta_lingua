-- Migration 0070: MST Question Bank — indexes for placement_test_questions
-- Applied manually via psql in Replit dev; included here for production deploy repeatability.

-- Add MST-specific columns (idempotent — IF NOT EXISTS guards)
ALTER TABLE placement_test_questions
  ADD COLUMN IF NOT EXISTS stage             VARCHAR(20),
  ADD COLUMN IF NOT EXISTS difficulty        DECIMAL(5,3),
  ADD COLUMN IF NOT EXISTS discrimination    DECIMAL(5,3),
  ADD COLUMN IF NOT EXISTS mst_item_id       VARCHAR(50);

-- Unique partial index on mst_item_id (non-null rows only) — prevents duplicate seeds
CREATE UNIQUE INDEX IF NOT EXISTS uidx_ptq_mst_item_id
  ON placement_test_questions (mst_item_id)
  WHERE mst_item_id IS NOT NULL;

-- Composite lookup index for adaptive placement queries (skill + cefr + stage)
CREATE INDEX IF NOT EXISTS idx_ptq_skill_cefr_stage
  ON placement_test_questions (skill, cefr_level, stage, is_active);
