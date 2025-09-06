-- =============================================
-- FIX ROADMAP STEP API TO HANDLE PLAIN TEXT AS JSON
-- Change materials and assessment_criteria to TEXT instead of JSONB
-- This allows the API to accept plain text without JSON validation errors
-- =============================================

-- Option 1: Change the columns to TEXT to accept any format
ALTER TABLE callern_roadmap_steps 
ALTER COLUMN materials TYPE TEXT,
ALTER COLUMN assessment_criteria TYPE TEXT;

-- Drop the JSON constraints we added before since we're using TEXT now
ALTER TABLE callern_roadmap_steps 
DROP CONSTRAINT IF EXISTS materials_is_json,
DROP CONSTRAINT IF EXISTS assessment_criteria_is_json;

-- Update existing data to be plain text
UPDATE callern_roadmap_steps 
SET 
    materials = CASE 
        WHEN materials IS NULL THEN 'Basic learning materials'
        WHEN materials LIKE '[%' OR materials LIKE '{%' THEN materials::text
        ELSE materials::text
    END,
    assessment_criteria = CASE 
        WHEN assessment_criteria IS NULL THEN 'Standard assessment criteria'  
        WHEN assessment_criteria LIKE '[%' OR assessment_criteria LIKE '{%' THEN assessment_criteria::text
        ELSE assessment_criteria::text
    END;

-- Test inserting a roadmap step with plain text (what the form sends)
INSERT INTO callern_roadmap_steps (
    roadmap_id, step_number, title, description, objectives, 
    teacher_ai_tips, estimated_minutes, skill_focus, 
    materials, assessment_criteria, created_at, updated_at
) VALUES (
    2, 999, 'Test Plain Text Step', 
    'Testing plain text format', 
    'Test plain text validation',
    'This should work with plain text now',
    30, 'testing',
    'Learner workbook and audio materials',  -- Plain text, not JSON
    'Basic to intermediate level assessment', -- Plain text, not JSON
    NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Show that it worked
SELECT 'Test record with plain text:' as info;
SELECT id, step_number, title, materials, assessment_criteria 
FROM callern_roadmap_steps 
WHERE step_number = 999;

-- Clean up test record
DELETE FROM callern_roadmap_steps WHERE step_number = 999;

SELECT '✅ Roadmap steps now accept plain text - API should work!' as "STATUS";