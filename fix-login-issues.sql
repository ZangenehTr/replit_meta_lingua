-- =============================================
-- FIX LOGIN ISSUES ON IRANIAN SERVER
-- Run this SQL file on your server to fix authentication
-- =============================================

-- Working password hash for "password": $2b$10$JpPgbg.FefeKHblW7x1DKOstWCg2mIVTANEeDxogCG3gzzgcyYqoW

-- Fix all production user passwords
UPDATE users SET 
    password = '$2b$10$JpPgbg.FefeKHblW7x1DKOstWCg2mIVTANEeDxogCG3gzzgcyYqoW',
    updated_at = NOW()
WHERE email IN (
    'sara.ahmadi@gmail.com',
    'mohammad.rezaei@gmail.com', 
    'admin@test.com',
    'dr.smith@institute.com',
    'ali.hosseini@institute.com',
    'supervisor@metalingua.com'
);

-- Clean up any problematic sessions
DELETE FROM user_sessions WHERE created_at < NOW() - INTERVAL '1 hour';

-- Verify the password updates worked
SELECT 
    email, 
    role, 
    first_name || ' ' || last_name as full_name,
    wallet_balance,
    CASE 
        WHEN password = '$2b$10$JpPgbg.FefeKHblW7x1DKOstWCg2mIVTANEeDxogCG3gzzgcyYqoW' 
        THEN '✅ Password Fixed' 
        ELSE '❌ Password Not Updated' 
    END as password_status
FROM users 
WHERE email IN (
    'sara.ahmadi@gmail.com',
    'mohammad.rezaei@gmail.com', 
    'admin@test.com',
    'dr.smith@institute.com',
    'ali.hosseini@institute.com',
    'supervisor@metalingua.com'
)
ORDER BY email;

-- Show login credentials
SELECT '🎯 LOGIN CREDENTIALS FIXED - USE PASSWORD: password' as "STATUS"
UNION ALL
SELECT '👤 Admin: admin@test.com / password'
UNION ALL  
SELECT '🎓 Student: sara.ahmadi@gmail.com / password (30M IRR)'
UNION ALL
SELECT '🎓 Student: mohammad.rezaei@gmail.com / password (30M IRR)'
UNION ALL
SELECT '👨‍🏫 Teacher: dr.smith@institute.com / password (Callern)'
UNION ALL
SELECT '👨‍🏫 Teacher: ali.hosseini@institute.com / password (Callern)'
UNION ALL
SELECT '👩‍💼 Supervisor: supervisor@metalingua.com / password';