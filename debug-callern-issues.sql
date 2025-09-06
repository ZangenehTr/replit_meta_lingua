-- =============================================
-- DEBUG CALLERN ISSUES ON PRODUCTION
-- Run these queries to diagnose the problems
-- =============================================

-- 1. Check if student has Callern package (should show on dashboard)
SELECT 'Sara Ahmadi Callern Packages (Dashboard):' as info;
SELECT 
    u.first_name, u.email, u.wallet_balance,
    scp.id, scp.total_hours, scp.remaining_minutes, scp.status,
    cp.package_name
FROM users u
LEFT JOIN student_callern_packages scp ON u.id = scp.student_id
LEFT JOIN callern_packages cp ON scp.package_id = cp.id
WHERE u.email = 'sara.ahmadi@gmail.com';

-- 2. Check why packages don't show on Callern page (missing JOIN)
SELECT 'Student Packages WITHOUT package details (this is the bug):' as info;
SELECT scp.*
FROM student_callern_packages scp
JOIN users u ON scp.student_id = u.id
WHERE u.email = 'sara.ahmadi@gmail.com';

-- 3. Check authorized teachers (should show in UI)
SELECT 'Authorized Callern Teachers:' as info;
SELECT 
    u.first_name, u.email,
    tca.is_authorized, tca.authorized_at,
    tcav.is_online, tcav.morning_slot, tcav.afternoon_slot
FROM teacher_callern_authorization tca
JOIN users u ON tca.teacher_id = u.id
LEFT JOIN teacher_callern_availability tcav ON tca.teacher_id = tcav.teacher_id
WHERE tca.is_authorized = true;

-- 4. Check ALL teacher availability records
SELECT 'All Teacher Availability Records:' as info;
SELECT 
    tcav.id, tcav.teacher_id,
    u.first_name, u.email,
    tcav.is_online, tcav.morning_slot, tcav.afternoon_slot, tcav.evening_slot
FROM teacher_callern_availability tcav
JOIN users u ON tcav.teacher_id = u.id;

-- 5. Show the missing column issue
SELECT 'Checking for night_slot column:' as info;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'teacher_callern_availability' 
  AND column_name = 'night_slot';

-- If the above returns empty, night_slot column is missing!