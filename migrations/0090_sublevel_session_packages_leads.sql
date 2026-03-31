-- Migration 0090: Add sub-level prerequisite columns to session_packages and leads
-- These columns were added to support the smart course discovery feature
-- (Task #11 Sub-level System), extending eligibility filtering to session packages.

BEGIN;

-- Add sub-level range + exam tag columns to session_packages
ALTER TABLE session_packages
  ADD COLUMN IF NOT EXISTS min_sub_level_id   INTEGER,
  ADD COLUMN IF NOT EXISTS max_sub_level_id   INTEGER,
  ADD COLUMN IF NOT EXISTS exam_tag_ids       INTEGER[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skill_scope        VARCHAR(50);

-- Add sub-level result columns to leads (persisted from MST results)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS sub_level_code     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sub_level_id       INTEGER;

-- Indexes for efficient range queries on session_packages
CREATE INDEX IF NOT EXISTS idx_session_packages_min_sub_level ON session_packages(min_sub_level_id);
CREATE INDEX IF NOT EXISTS idx_session_packages_max_sub_level ON session_packages(max_sub_level_id);

-- Index for lead sub-level lookups
CREATE INDEX IF NOT EXISTS idx_leads_sub_level_code ON leads(sub_level_code);

COMMIT;
