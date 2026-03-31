-- Migration 0110: Add FK constraints for session_packages sub-level range references
-- session_packages.min_sub_level_id and max_sub_level_id reference curriculum_levels(id)
-- ON DELETE SET NULL to preserve package integrity if a curriculum level is removed

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_session_packages_min_sub_level'
      AND table_name = 'session_packages'
  ) THEN
    ALTER TABLE session_packages
      ADD CONSTRAINT fk_session_packages_min_sub_level
        FOREIGN KEY (min_sub_level_id) REFERENCES curriculum_levels(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_session_packages_max_sub_level'
      AND table_name = 'session_packages'
  ) THEN
    ALTER TABLE session_packages
      ADD CONSTRAINT fk_session_packages_max_sub_level
        FOREIGN KEY (max_sub_level_id) REFERENCES curriculum_levels(id) ON DELETE SET NULL;
  END IF;
END $$;
