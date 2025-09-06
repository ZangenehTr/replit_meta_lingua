-- =============================================
-- FIX MISSING OBJECTIVES COLUMN IN ROADMAP STEPS
-- Add the missing column that the code expects
-- =============================================

-- Add missing columns to callern_roadmap_steps table
ALTER TABLE callern_roadmap_steps 
ADD COLUMN IF NOT EXISTS objectives TEXT;

ALTER TABLE callern_roadmap_steps 
ADD COLUMN IF NOT EXISTS skill_focus VARCHAR(100);

ALTER TABLE callern_roadmap_steps 
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]';

ALTER TABLE callern_roadmap_steps 
ADD COLUMN IF NOT EXISTS assessment_criteria JSONB DEFAULT '{}';

-- Update existing rows with default values
UPDATE callern_roadmap_steps 
SET 
    objectives = 'Practice English conversation skills and build fluency',
    skill_focus = 'conversation',
    materials = '["Audio files", "Conversation prompts"]'::jsonb,
    assessment_criteria = '{"fluency": "Good", "vocabulary": "Intermediate", "pronunciation": "Clear"}'::jsonb
WHERE objectives IS NULL;

-- Test the query that was failing
SELECT id, roadmap_id, step_number, title, description, objectives, skill_focus
FROM callern_roadmap_steps 
LIMIT 3;

SELECT '✅ Roadmap steps table fixed - API should work now!' as "STATUS";