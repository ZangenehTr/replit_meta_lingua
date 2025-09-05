-- =============================================
-- FIX CALLERN ROADMAPS TABLE COLUMNS
-- Add the exact columns the code expects
-- =============================================

-- First, drop and recreate callern_roadmaps with correct columns
DROP TABLE IF EXISTS callern_roadmaps CASCADE;

-- Create callern_roadmaps with the exact columns the code expects
CREATE TABLE callern_roadmaps (
    id SERIAL PRIMARY KEY,
    "packageId" INTEGER REFERENCES callern_packages(id),
    "roadmapName" VARCHAR(255) NOT NULL,
    description TEXT,
    "totalSteps" INTEGER DEFAULT 10,
    "estimatedHours" INTEGER DEFAULT 20,
    "createdBy" INTEGER,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Get the first callern package to link to
SELECT id as package_id, package_name FROM callern_packages LIMIT 1;

-- Insert sample roadmaps linked to the existing Callern package
INSERT INTO callern_roadmaps (
    "packageId", "roadmapName", description, "totalSteps", 
    "estimatedHours", "createdBy", "isActive"
) 
SELECT 
    cp.id,
    'English Conversation Skills',
    'Build fluency through structured conversation practice with AI assistance and real teachers.',
    12, 20, 1, true
FROM callern_packages cp
WHERE cp.package_name = 'Learn to Speak English'
LIMIT 1;

INSERT INTO callern_roadmaps (
    "packageId", "roadmapName", description, "totalSteps", 
    "estimatedHours", "createdBy", "isActive"
) 
SELECT 
    cp.id,
    'Advanced Speaking Techniques',
    'Master advanced speaking techniques including presentations, debates, and professional communication.',
    15, 25, 1, true
FROM callern_packages cp
WHERE cp.package_name = 'Learn to Speak English'
LIMIT 1;

-- Test the exact query from the code
SELECT 
    cr.id,
    cr."packageId",
    cr."roadmapName",
    cr.description,
    cr."totalSteps",
    cr."estimatedHours",
    cr."createdBy",
    cr."isActive",
    cp.package_name as "packageName"
FROM callern_roadmaps cr
LEFT JOIN callern_packages cp ON cr."packageId" = cp.id
WHERE cr."isActive" = true;

SELECT '✅ Callern roadmaps table fixed - API should work now!' as "STATUS";