-- Complete Callern Test Setup Script
-- This creates users, Callern package, enrollments, and teacher authorizations
-- Uses correct column names from the actual schema

-- =============================================
-- 1. CREATE PRODUCTION USERS
-- =============================================

-- Hash for "password" using bcrypt with 10 rounds
-- $2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6

-- Admin User
INSERT INTO users (
    email, 
    password,  -- Correct column name (not password_hash)
    "firstName",  -- Correct column name with quotes for camelCase
    "lastName", 
    role, 
    status,
    "phoneNumber",
    "walletBalance",
    "createdAt",
    "updatedAt"
) VALUES (
    'admin@test.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'Admin',
    'User',
    'Admin',
    'active',
    '+989123456789',
    0,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Student: Sara Ahmadi (with 30M IRR wallet)
INSERT INTO users (
    email, 
    password, 
    "firstName", 
    "lastName", 
    role, 
    status,
    "phoneNumber",
    "walletBalance",  -- 30 million IRR
    "createdAt",
    "updatedAt"
) VALUES (
    'sara.ahmadi@gmail.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'سارا',
    'احمدی',
    'Student',
    'active',
    '+989121234567',
    30000000,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Student: Mohammad Rezaei (with 30M IRR wallet)
INSERT INTO users (
    email, 
    password, 
    "firstName", 
    "lastName", 
    role, 
    status,
    "phoneNumber",
    "walletBalance",  -- 30 million IRR
    "createdAt",
    "updatedAt"
) VALUES (
    'mohammad.rezaei@gmail.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'محمد',
    'رضایی',
    'Student',
    'active',
    '+989121234568',
    30000000,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Teacher: Dr. Sarah Smith
INSERT INTO users (
    email, 
    password, 
    "firstName", 
    "lastName", 
    role, 
    status,
    "phoneNumber",
    "createdAt",
    "updatedAt"
) VALUES (
    'dr.smith@institute.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'Dr. Sarah',
    'Smith',
    'Teacher',
    'active',
    '+989121234569',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Teacher: Ali Hosseini
INSERT INTO users (
    email, 
    password, 
    "firstName", 
    "lastName", 
    role, 
    status,
    "phoneNumber",
    "createdAt",
    "updatedAt"
) VALUES (
    'ali.hosseini@institute.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'علی',
    'حسینی',
    'Teacher',
    'active',
    '+989121234570',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Supervisor: Nazanin Mohammadi
INSERT INTO users (
    email, 
    password, 
    "firstName", 
    "lastName", 
    role, 
    status,
    "phoneNumber",
    "createdAt",
    "updatedAt"
) VALUES (
    'supervisor@metalingua.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'نازنین',
    'محمدی',
    'Supervisor',
    'active',
    '+989121234571',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 2. CREATE CALLERN PACKAGE
-- =============================================

-- Insert the "Learn to Speak English" Callern package
INSERT INTO "callernPackages" (
    "packageName",
    "totalHours",
    price,
    description,
    "packageType",
    "targetLevel",
    features,
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    'Learn to Speak English',
    10,  -- 10 hours total
    5000000.00,  -- 5 million IRR
    'Comprehensive English speaking practice with native and bilingual teachers. Focus on conversation, pronunciation, and fluency building through AI-assisted sessions.',
    'general_conversation',
    'intermediate',
    '["AI-powered vocabulary suggestions", "Real-time pronunciation feedback", "Grammar correction", "Progress tracking", "Session recordings"]'::jsonb,
    true,
    NOW(),
    NOW()
) ON CONFLICT ("packageName") DO NOTHING;

-- =============================================
-- 3. CREATE STUDENT CALLERN ENROLLMENTS
-- =============================================

-- Enroll Sara Ahmadi in the package
INSERT INTO "callernEnrollments" (
    "studentId",
    "packageId",
    "hoursUsed",
    "hoursRemaining",
    "enrollmentDate",
    status,
    "paymentStatus",
    "createdAt",
    "updatedAt"
) VALUES (
    (SELECT id FROM users WHERE email = 'sara.ahmadi@gmail.com'),
    (SELECT id FROM "callernPackages" WHERE "packageName" = 'Learn to Speak English'),
    0,  -- No hours used yet
    10, -- 10 hours remaining
    NOW(),
    'active',
    'paid',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Enroll Mohammad Rezaei in the package  
INSERT INTO "callernEnrollments" (
    "studentId",
    "packageId",
    "hoursUsed",
    "hoursRemaining",
    "enrollmentDate",
    status,
    "paymentStatus",
    "createdAt",
    "updatedAt"
) VALUES (
    (SELECT id FROM users WHERE email = 'mohammad.rezaei@gmail.com'),
    (SELECT id FROM "callernPackages" WHERE "packageName" = 'Learn to Speak English'),
    0,  -- No hours used yet
    10, -- 10 hours remaining
    NOW(),
    'active',
    'paid',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- =============================================
-- 4. AUTHORIZE TEACHERS FOR CALLERN
-- =============================================

-- Authorize Dr. Sarah Smith for Callern teaching
INSERT INTO "callernTeacherAuth" (
    "teacherId",
    "hourlyRate",
    "languages",
    "specializations",
    "maxHoursPerWeek",
    "isAuthorized",
    "authorizationDate",
    "qualifications",
    "createdAt",
    "updatedAt"
) VALUES (
    (SELECT id FROM users WHERE email = 'dr.smith@institute.com'),
    600000.00,  -- 600,000 IRR per hour
    '["English", "Persian"]'::jsonb,
    '["General Conversation", "IELTS Speaking", "Business English"]'::jsonb,
    40,  -- Max 40 hours per week
    true,
    NOW(),
    'Native English speaker with TESOL certification and 5+ years experience'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT ("teacherId") DO NOTHING;

-- Authorize Ali Hosseini for Callern teaching
INSERT INTO "callernTeacherAuth" (
    "teacherId",
    "hourlyRate",
    "languages",
    "specializations",
    "maxHoursPerWeek",
    "isAuthorized",
    "authorizationDate",
    "qualifications",
    "createdAt",
    "updatedAt"
) VALUES (
    (SELECT id FROM users WHERE email = 'ali.hosseini@institute.com'),
    600000.00,  -- 600,000 IRR per hour
    '["Persian", "English"]'::jsonb,
    '["Conversation Practice", "Pronunciation", "Grammar"]'::jsonb,
    35,  -- Max 35 hours per week
    true,
    NOW(),
    'Bilingual English teacher with university degree and teaching certificate'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT ("teacherId") DO NOTHING;

-- =============================================
-- 5. CREATE BRANDING ENTRY
-- =============================================

-- Create institute branding (correct table name)
INSERT INTO "instituteBranding" (
    name, 
    logo, 
    "primaryColor", 
    "secondaryColor",
    "updatedAt"  -- Correct column name (camelCase)
) VALUES (
    'Meta Lingua Academy', 
    '', 
    '#3B82F6', 
    '#10B981',
    NOW()
) ON CONFLICT DO NOTHING;

-- =============================================
-- 6. VERIFICATION QUERIES
-- =============================================

-- Show created users with wallet balances
SELECT 
    email, 
    role, 
    "firstName", 
    "lastName",
    "walletBalance",
    CASE 
        WHEN email IN ('sara.ahmadi@gmail.com', 'mohammad.rezaei@gmail.com') 
        THEN '✅ 30M IRR wallet' 
        ELSE '💰 Standard wallet' 
    END as wallet_status
FROM users 
WHERE email IN (
    'admin@test.com',
    'sara.ahmadi@gmail.com', 
    'mohammad.rezaei@gmail.com',
    'dr.smith@institute.com',
    'ali.hosseini@institute.com',
    'supervisor@metalingua.com'
)
ORDER BY 
    CASE 
        WHEN role = 'Admin' THEN 1
        WHEN role = 'Teacher' THEN 2  
        WHEN role = 'Student' THEN 3
        WHEN role = 'Supervisor' THEN 4
        ELSE 5
    END;

-- Show Callern package details
SELECT 
    "packageName",
    "totalHours",
    price,
    "packageType",
    "isActive"
FROM "callernPackages" 
WHERE "packageName" = 'Learn to Speak English';

-- Show student enrollments
SELECT 
    u.email,
    u."firstName" || ' ' || u."lastName" as student_name,
    cp."packageName",
    ce."hoursRemaining",
    ce.status,
    ce."paymentStatus"
FROM "callernEnrollments" ce
JOIN users u ON ce."studentId" = u.id
JOIN "callernPackages" cp ON ce."packageId" = cp.id;

-- Show authorized teachers
SELECT 
    u.email,
    u."firstName" || ' ' || u."lastName" as teacher_name,
    cta."hourlyRate",
    cta."maxHoursPerWeek",
    cta."isAuthorized"
FROM "callernTeacherAuth" cta
JOIN users u ON cta."teacherId" = u.id;

-- =============================================
-- LOGIN CREDENTIALS SUMMARY
-- =============================================

SELECT '=====================================' AS info
UNION ALL
SELECT '🎯 CALLERN TEST SETUP COMPLETE!' AS info
UNION ALL
SELECT '=====================================' AS info
UNION ALL
SELECT 'Admin: admin@test.com / password' AS info
UNION ALL
SELECT '👨‍🎓 Students (Enrolled in "Learn to Speak English"):' AS info
UNION ALL
SELECT '  📚 sara.ahmadi@gmail.com / password (30M IRR)' AS info
UNION ALL
SELECT '  📚 mohammad.rezaei@gmail.com / password (30M IRR)' AS info
UNION ALL
SELECT '👩‍🏫 Authorized Callern Teachers (600K IRR/hour):' AS info
UNION ALL
SELECT '  🎓 dr.smith@institute.com / password' AS info
UNION ALL
SELECT '  🎓 ali.hosseini@institute.com / password' AS info
UNION ALL
SELECT 'Supervisor: supervisor@metalingua.com / password' AS info
UNION ALL
SELECT '=====================================' AS info
UNION ALL
SELECT '✅ Package: "Learn to Speak English" created' AS info
UNION ALL
SELECT '✅ Students enrolled with 10 hours each' AS info
UNION ALL
SELECT '✅ Teachers authorized for Callern sessions' AS info
UNION ALL
SELECT '🚀 Ready for AI-powered video sessions!' AS info;