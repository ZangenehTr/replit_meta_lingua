-- =============================================
-- ADD MISSING OBJECTIVES COLUMN FIRST
-- Then insert roadmap steps
-- =============================================

-- Step 1: Add the missing objectives column
ALTER TABLE callern_roadmap_steps 
ADD COLUMN IF NOT EXISTS objectives TEXT;

-- Step 2: Add other missing columns that might be needed
ALTER TABLE callern_roadmap_steps 
ADD COLUMN IF NOT EXISTS skill_focus VARCHAR(100) DEFAULT 'conversation';

-- Step 3: Now insert roadmap steps for ID 1 (without objectives in the INSERT for now)
INSERT INTO callern_roadmap_steps (
    roadmap_id, step_number, title, description, 
    estimated_minutes, created_at, updated_at
) VALUES 
(1, 1, 'Introduction to English Conversation', 'Basic greetings and introductions', 30, NOW(), NOW()),
(1, 2, 'Daily Routine Conversations', 'Talking about daily activities', 30, NOW(), NOW()),
(1, 3, 'Asking for Directions', 'Navigating and giving directions', 30, NOW(), NOW()),
(1, 4, 'Shopping and Purchases', 'Making purchases and asking about products', 30, NOW(), NOW()),
(1, 5, 'Restaurant Conversations', 'Ordering food and restaurant interactions', 30, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Step 4: Now update the objectives column with values
UPDATE callern_roadmap_steps 
SET objectives = CASE 
    WHEN step_number = 1 THEN 'Learn common greetings and how to introduce yourself'
    WHEN step_number = 2 THEN 'Practice describing daily routines and activities'  
    WHEN step_number = 3 THEN 'Learn to ask for and give directions confidently'
    WHEN step_number = 4 THEN 'Practice shopping vocabulary and asking questions'
    WHEN step_number = 5 THEN 'Learn restaurant vocabulary and ordering skills'
    ELSE 'Practice English conversation skills'
END
WHERE roadmap_id = 1;

-- Step 5: Test that everything works now
SELECT 'Testing the fixed query with objectives:' as info;
SELECT id, roadmap_id, step_number, title, objectives 
FROM callern_roadmap_steps 
WHERE roadmap_id = 1 
ORDER BY step_number;

SELECT '✅ Column added and roadmap steps created successfully!' as "STATUS";