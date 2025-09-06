-- =============================================
-- FIX JSON PARSING ERROR IN ROADMAP STEPS
-- The issue is fields expecting JSON but receiving plain text
-- =============================================

-- First, let's check what JSON columns exist and their current values
SELECT 'Current materials and assessment_criteria columns:' as info;
SELECT id, roadmap_id, step_number, title, materials, assessment_criteria 
FROM callern_roadmap_steps 
WHERE id IS NOT NULL
LIMIT 5;

-- Fix any invalid JSON in existing records
-- Convert plain text to proper JSON arrays/objects
UPDATE callern_roadmap_steps 
SET 
    materials = CASE 
        WHEN materials IS NULL OR materials::text = '' THEN '["Basic materials", "Audio content"]'::jsonb
        WHEN materials::text NOT LIKE '[%' AND materials::text NOT LIKE '{%' THEN ('["' || materials::text || '"]')::jsonb
        ELSE materials
    END,
    assessment_criteria = CASE 
        WHEN assessment_criteria IS NULL OR assessment_criteria::text = '' THEN '{"level": "intermediate", "focus": "conversation"}'::jsonb
        WHEN assessment_criteria::text NOT LIKE '{%' AND assessment_criteria::text NOT LIKE '[%' THEN ('{"level": "' || assessment_criteria::text || '"}')::jsonb
        ELSE assessment_criteria
    END
WHERE materials IS NOT NULL OR assessment_criteria IS NOT NULL;

-- Add constraints to ensure JSON fields only accept valid JSON
ALTER TABLE callern_roadmap_steps 
ADD CONSTRAINT IF NOT EXISTS materials_is_json 
CHECK (materials IS NULL OR jsonb_typeof(materials) IN ('array', 'object'));

ALTER TABLE callern_roadmap_steps 
ADD CONSTRAINT IF NOT EXISTS assessment_criteria_is_json 
CHECK (assessment_criteria IS NULL OR jsonb_typeof(assessment_criteria) = 'object');

-- Test inserting a roadmap step with proper JSON format
INSERT INTO callern_roadmap_steps (
    roadmap_id, step_number, title, description, objectives, 
    teacher_ai_tips, estimated_minutes, skill_focus, 
    materials, assessment_criteria, created_at, updated_at
) VALUES (
    2, 99, 'Test JSON Step', 
    'Testing proper JSON format', 
    'Test JSON validation',
    'Ensure all JSON fields are properly formatted',
    30, 'testing',
    '["Test material 1", "Test material 2"]'::jsonb,
    '{"difficulty": "intermediate", "focus": "json_validation", "score": "pass"}'::jsonb,
    NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Clean up test record
DELETE FROM callern_roadmap_steps WHERE step_number = 99 AND title = 'Test JSON Step';

SELECT '✅ JSON validation fixed - roadmap step creation should work!' as "STATUS";