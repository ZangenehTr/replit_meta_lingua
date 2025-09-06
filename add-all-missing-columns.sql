-- =============================================
-- ADD ALL MISSING COLUMNS TO ROADMAP STEPS TABLE
-- This fixes all column errors at once
-- =============================================

-- Add ALL missing columns that the code expects
ALTER TABLE callern_roadmap_steps 
ADD COLUMN IF NOT EXISTS objectives TEXT,
ADD COLUMN IF NOT EXISTS teacher_ai_tips TEXT,
ADD COLUMN IF NOT EXISTS skill_focus VARCHAR(100) DEFAULT 'conversation',
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS assessment_criteria JSONB DEFAULT '{}';

-- Update existing records with default values for new columns
UPDATE callern_roadmap_steps SET 
    objectives = COALESCE(objectives, 'Practice English conversation skills and build fluency'),
    teacher_ai_tips = COALESCE(teacher_ai_tips, 'Encourage student participation and provide supportive feedback'),
    skill_focus = COALESCE(skill_focus, 'conversation'),
    materials = COALESCE(materials, '["Audio files", "Conversation prompts", "Visual aids"]'::jsonb),
    assessment_criteria = COALESCE(assessment_criteria, '{"fluency": "Good", "vocabulary": "Intermediate", "pronunciation": "Clear"}'::jsonb)
WHERE objectives IS NULL OR teacher_ai_tips IS NULL OR skill_focus IS NULL OR materials IS NULL OR assessment_criteria IS NULL;

-- Now insert roadmap steps for roadmap ID 1 with all columns
INSERT INTO callern_roadmap_steps (
    roadmap_id, step_number, title, description, objectives, teacher_ai_tips,
    estimated_minutes, skill_focus, materials, assessment_criteria, created_at, updated_at
) VALUES 
(1, 1, 'Introduction to English Conversation', 
 'Basic greetings and introductions', 
 'Learn common greetings and how to introduce yourself',
 'Focus on natural pronunciation and encourage repetition',
 30, 'speaking', 
 '["Greeting cards", "Audio examples", "Role-play scenarios"]'::jsonb,
 '{"pronunciation": "Clear", "confidence": "Good", "vocabulary_use": "Basic"}'::jsonb,
 NOW(), NOW()),
(1, 2, 'Daily Routine Conversations', 
 'Talking about daily activities', 
 'Practice describing daily routines and activities',
 'Use visual aids and encourage detailed descriptions',
 30, 'vocabulary', 
 '["Daily routine pictures", "Time expressions chart"]'::jsonb,
 '{"vocabulary_range": "Good", "sentence_structure": "Correct", "fluency": "Natural"}'::jsonb,
 NOW(), NOW()),
(1, 3, 'Asking for Directions', 
 'Navigating and giving directions', 
 'Learn to ask for and give directions confidently',
 'Practice with maps and real-world scenarios',
 30, 'listening', 
 '["City map", "Direction audio clips", "Compass"]'::jsonb,
 '{"listening_comprehension": "Good", "response_accuracy": "High", "confidence": "Strong"}'::jsonb,
 NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Test that all columns exist and work
SELECT 'Testing complete roadmap steps query:' as info;
SELECT id, roadmap_id, step_number, title, objectives, teacher_ai_tips, skill_focus
FROM callern_roadmap_steps 
WHERE roadmap_id IN (1, 2) 
ORDER BY roadmap_id, step_number;

SELECT '✅ All missing columns added - roadmap APIs should work completely!' as "STATUS";