-- Test Query: Verify get_users_with_email() function is working
-- Run this in Supabase SQL Editor to see if it returns your users

-- 1. Check if function exists
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_users_with_email';

-- Expected: Should return 1 row showing the function exists

-- 2. Test the function - should return all users
SELECT * FROM get_users_with_email();

-- Expected results should include:
-- - admin@ssth-inventory.com (the missing user)
-- - nopanat.aplus@gmail.com (your user)
-- - Any other users in your auth.users table

-- 3. Count total users
SELECT COUNT(*) as total_users FROM get_users_with_email();

-- 4. Check specific user exists
SELECT
  email,
  full_name,
  role,
  is_active
FROM get_users_with_email()
WHERE email = 'admin@ssth-inventory.com';

-- Expected: Should return 1 row with admin@ssth-inventory.com

-- 5. Group by role to see distribution
SELECT
  role,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as users
FROM get_users_with_email()
GROUP BY role
ORDER BY role;

-- Expected: Shows how many users per role and their emails
