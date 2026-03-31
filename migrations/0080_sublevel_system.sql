-- Migration 0080: Sub-level System & Smart Course Discovery
-- Subtask 1: Seed the General English curriculum + 17 CEFR sub-levels
-- Subtask 2: Create course_exam_tags table
-- Subtask 3: Add prerequisite columns to courses
-- Subtask 4: Add sub-level tracking to users

BEGIN;

-- ─── 1. Seed curriculum row for "General English" ────────────────────────────
INSERT INTO curriculums (name, key, language, description, is_active, order_index)
VALUES ('General English', 'general_english', 'en', 'Standard CEFR-aligned General English curriculum', true, 1)
ON CONFLICT (key) DO NOTHING;

-- ─── 2. Seed 17 sub-levels into curriculum_levels ────────────────────────────
-- We use a DO block so we can reference the curriculum id dynamically
DO $$
DECLARE
  curr_id INTEGER;
BEGIN
  SELECT id INTO curr_id FROM curriculums WHERE key = 'general_english';

  INSERT INTO curriculum_levels (curriculum_id, code, name, order_index, cefr_band, difficulty_level, description, is_active)
  VALUES
    (curr_id, 'A1.1', 'A1 – Level 1 (Starter)',          1,  'A1', 'beginner',       'Absolute beginner — basic greetings, numbers, colours',                                    true),
    (curr_id, 'A1.2', 'A1 – Level 2 (False Beginner)',    2,  'A1', 'beginner',       'False beginner — daily routines, simple present tense',                                    true),
    (curr_id, 'A2.1', 'A2 – Level 1 (Elementary)',        3,  'A2', 'elementary',     'Elementary — past simple, common vocabulary, short descriptions',                          true),
    (curr_id, 'A2.2', 'A2 – Level 2 (Pre-Intermediate)',  4,  'A2', 'elementary',     'Pre-intermediate — future plans, comparatives, practical dialogues',                       true),
    (curr_id, 'B1.1', 'B1 – Level 1 (Lower-Intermediate)',5,  'B1', 'intermediate',   'Lower-Intermediate — present perfect, travel, opinions',                                   true),
    (curr_id, 'B1.2', 'B1 – Level 2 (Intermediate)',      6,  'B1', 'intermediate',   'Intermediate — conditionals, passive voice, news topics',                                  true),
    (curr_id, 'B1.3', 'B1 – Level 3 (Mid-Intermediate)',  7,  'B1', 'intermediate',   'Mid-Intermediate — modals, collocations, extended writing',                                true),
    (curr_id, 'B1.4', 'B1 – Level 4 (High-Intermediate)', 8,  'B1', 'intermediate',   'High-Intermediate — discourse markers, academic reading',                                  true),
    (curr_id, 'B1.5', 'B1 – Level 5 (Upper-Intermediate Prep)', 9, 'B1', 'intermediate', 'Upper-Int Prep — linking language, structured argument',                               true),
    (curr_id, 'B2.1', 'B2 – Level 1 (Upper-Intermediate)',10, 'B2', 'upper_intermediate', 'Upper-Intermediate — complex grammar, professional topics',                             true),
    (curr_id, 'B2.2', 'B2 – Level 2 (Strong Upper-Int)', 11,  'B2', 'upper_intermediate', 'Strong Upper-Int — idiomatic language, critical thinking',                              true),
    (curr_id, 'B2.3', 'B2 – Level 3 (Advanced Prep)',     12, 'B2', 'upper_intermediate', 'Advanced Prep — formal/informal register, essay writing',                               true),
    (curr_id, 'B2.4', 'B2 – Level 4 (High Upper-Int)',    13, 'B2', 'upper_intermediate', 'High Upper-Int — nuanced vocabulary, debate skills',                                    true),
    (curr_id, 'B2.5', 'B2 – Level 5 (Pre-Advanced)',      14, 'B2', 'upper_intermediate', 'Pre-Advanced — paraphrase, inference, complex sentences',                               true),
    (curr_id, 'C1.1', 'C1 – Level 1 (Advanced)',          15, 'C1', 'advanced',       'Advanced — abstract topics, sophisticated lexis, extended discourse',                      true),
    (curr_id, 'C1.2', 'C1 – Level 2 (High Advanced)',     16, 'C1', 'advanced',       'High Advanced — academic/professional fluency, implicit meaning',                          true),
    (curr_id, 'C2',   'C2 – Proficiency',                 17, 'C2', 'proficiency',    'Proficiency — near-native precision, mastery of all registers',                            true)
  ON CONFLICT DO NOTHING;
END $$;

-- ─── 3. Create course_exam_tags table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_exam_tags (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  order_index INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT now()
);

INSERT INTO course_exam_tags (name, code, description, order_index) VALUES
  ('General English',  'general_english',  'General conversational and academic English',          1),
  ('IELTS',            'ielts',            'International English Language Testing System',        2),
  ('TOEFL',            'toefl',            'Test of English as a Foreign Language',                3),
  ('GRE',              'gre',              'Graduate Record Examinations (verbal reasoning)',       4),
  ('GMAT',             'gmat',             'Graduate Management Admission Test',                   5),
  ('PTE',              'pte',              'Pearson Test of English',                              6),
  ('Vocabulary',       'vocabulary',       'Vocabulary building and word power',                   7)
ON CONFLICT (code) DO NOTHING;

-- ─── 4. Add prerequisite columns to courses ───────────────────────────────────
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS min_sub_level_id INTEGER REFERENCES curriculum_levels(id),
  ADD COLUMN IF NOT EXISTS max_sub_level_id INTEGER REFERENCES curriculum_levels(id),
  ADD COLUMN IF NOT EXISTS exam_tag_ids     INTEGER[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skill_scope      VARCHAR(50);

-- ─── 5. Add sub-level tracking columns to users ───────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS sub_level_id   INTEGER REFERENCES curriculum_levels(id),
  ADD COLUMN IF NOT EXISTS sub_level_code VARCHAR(10);

-- ─── 6. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_courses_min_sub_level ON courses(min_sub_level_id);
CREATE INDEX IF NOT EXISTS idx_courses_max_sub_level ON courses(max_sub_level_id);
CREATE INDEX IF NOT EXISTS idx_users_sub_level       ON users(sub_level_id);

COMMIT;
