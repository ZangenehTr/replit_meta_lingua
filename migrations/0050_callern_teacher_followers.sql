-- Migration: callern_teacher_followers
-- Supports CallerN Notify-Me follow/unfollow feature (Task #7)
-- Students can follow teachers to get notified when they come online

CREATE TABLE IF NOT EXISTS callern_teacher_followers (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_callern_followers_teacher_id ON callern_teacher_followers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_callern_followers_student_id ON callern_teacher_followers(student_id);
