-- =============================================
-- FIX MISSING ROADMAP ID 1 FOR YOUR SERVER
-- This fixes the "/api/roadmaps/1 500 error" issue
-- =============================================

-- Create the missing roadmap ID 1
INSERT INTO callern_roadmaps (
    id, roadmap_name, description, total_steps, 
    estimated_hours, is_active, created_by, created_at, updated_at
) VALUES (
    1, 'Learn to Speak English', 
    'Comprehensive English conversation course for beginners to intermediate learners',
    10, 20, true, 1, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    roadmap_name = EXCLUDED.roadmap_name,
    description = EXCLUDED.description;

-- Add roadmap steps for roadmap ID 1 (the missing steps)
INSERT INTO callern_roadmap_steps (
    roadmap_id, step_number, title, description, objectives, 
    estimated_minutes, skill_focus, created_at, updated_at
) VALUES 
(1, 1, 'Introduction to English Conversation', 'Basic greetings and introductions', 'Learn common greetings and how to introduce yourself', 30, 'speaking', NOW(), NOW()),
(1, 2, 'Daily Routine Conversations', 'Talking about daily activities', 'Practice describing daily routines and activities', 30, 'vocabulary', NOW(), NOW()),
(1, 3, 'Asking for Directions', 'Navigating and giving directions', 'Learn to ask for and give directions confidently', 30, 'listening', NOW(), NOW()),
(1, 4, 'Shopping and Purchases', 'Making purchases and asking about products', 'Practice shopping vocabulary and asking questions', 30, 'speaking', NOW(), NOW()),
(1, 5, 'Restaurant Conversations', 'Ordering food and restaurant interactions', 'Learn restaurant vocabulary and ordering skills', 30, 'listening', NOW(), NOW())
ON CONFLICT (roadmap_id, step_number) DO NOTHING;

-- Test the API query that was failing
SELECT 'Testing the fixed query:' as info;
SELECT id, roadmap_id, step_number, title, description, objectives 
FROM callern_roadmap_steps 
WHERE roadmap_id = 1 
ORDER BY step_number;

SELECT '✅ Roadmap ID 1 created - /api/roadmaps/1 should work now!' as "STATUS";