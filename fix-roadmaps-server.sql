-- =============================================
-- FIX ROADMAPS API FOR YOUR SERVER
-- Check what tables exist and create the right fix
-- =============================================

-- First, let's see what roadmap-related tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%roadmap%' OR table_name LIKE '%learning%')
ORDER BY table_name;

-- Check if callern_roadmaps table exists (more likely)
SELECT 'callern_roadmaps table exists' as status, COUNT(*) as record_count
FROM callern_roadmaps;

-- If callern_roadmaps exists, that's probably what the API should use
-- Let's see the structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'callern_roadmaps' 
ORDER BY column_name;

-- Sample data from callern_roadmaps
SELECT id, name, description, created_at, updated_at, is_active
FROM callern_roadmaps 
LIMIT 3;