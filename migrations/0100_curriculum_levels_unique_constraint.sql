-- Migration 0100: Add unique constraint on curriculum_levels(curriculum_id, code)
-- Prevents duplicate sub-level entries for the same curriculum when seeding is re-run.
-- ON CONFLICT (curriculum_id, code) DO NOTHING can now be used safely.

BEGIN;

ALTER TABLE curriculum_levels
  ADD CONSTRAINT curriculum_levels_curriculum_id_code_unique
  UNIQUE (curriculum_id, code);

COMMIT;
