-- =====================================================
-- DEBUG ADMIN PASSWORD RESET PERMISSIONS
-- =====================================================
-- This script helps diagnose why admin permissions are returning false

-- Step 1: Check current auth user
SELECT
  auth.uid() as current_auth_uid,
  auth.jwt() ->> 'email' as current_email,
  auth.jwt() ->> 'role' as auth_role;

-- Step 2: Check if user profile exists for current user
SELECT
  up.id,
  up.full_name,
  up.role,
  up.is_active,
  up.department_id,
  up.created_at,
  up.updated_at
FROM user_profiles up
WHERE up.id = auth.uid();

-- Step 3: Check all user profiles to see current roles
SELECT
  up.id,
  up.full_name,
  up.email,
  up.role,
  up.is_active,
  CASE
    WHEN up.id = auth.uid() THEN 'CURRENT USER'
    ELSE 'Other'
  END as status
FROM user_profiles up
ORDER BY up.role, up.full_name;

-- Step 4: Test the permission function directly
SELECT
  verify_admin_password_reset_permission() as can_reset_passwords,
  CASE
    WHEN verify_admin_password_reset_permission() THEN '✅ CAN RESET PASSWORDS'
    ELSE '❌ CANNOT RESET PASSWORDS'
  END as permission_status;

-- Step 5: Check if the current user role is in allowed roles
SELECT
  up.role,
  up.is_active,
  up.role IN ('admin', 'developer') as is_allowed_role,
  up.is_active = true as is_active_user,
  (up.role IN ('admin', 'developer') AND up.is_active = true) as has_full_permission
FROM user_profiles up
WHERE up.id = auth.uid();

-- Step 6: Check if the verification function exists
SELECT
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'verify_admin_password_reset_permission';

-- Step 7: Manually check what the function should return
-- This simulates the logic inside verify_admin_password_reset_permission()
SELECT
  CASE
    WHEN up.id IS NULL THEN 'USER_PROFILE_NOT_FOUND'
    WHEN up.role NOT IN ('admin', 'developer') THEN 'ROLE_NOT_ALLOWED: ' || COALESCE(up.role, 'NULL')
    WHEN up.is_active IS NOT TRUE THEN 'USER_NOT_ACTIVE'
    ELSE 'PERMISSION_GRANTED'
  END as diagnostic_result,
  up.id,
  up.role,
  up.is_active
FROM user_profiles up
WHERE up.id = auth.uid();

-- Step 8: If no user profile exists, show how to create one
-- (This is just for reference, don't run unless needed)
/*
-- Example: Create admin profile for current user
INSERT INTO user_profiles (id, full_name, role, is_active, created_at, updated_at)
SELECT
  auth.uid() as id,
  auth.jwt() ->> 'email' as full_name,
  'admin' as role,
  true as is_active,
  now() as created_at,
  now() as updated_at
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE id = auth.uid()
);
*/

-- =====================================================
-- COMMON ISSUES AND SOLUTIONS
-- =====================================================
/*
If can_reset_passwords returns false, check these:

1. USER_PROFILE_NOT_FOUND:
   - Run the INSERT query above to create a profile
   - Or use the Users page to create a profile for this user

2. ROLE_NOT_ALLOWED:
   - Update the user's role to 'admin' or 'developer'
   - UPDATE user_profiles SET role = 'admin' WHERE id = auth.uid();

3. USER_NOT_ACTIVE:
   - Activate the user profile
   - UPDATE user_profiles SET is_active = true WHERE id = auth.uid();

4. FUNCTION_NOT_FOUND:
   - Make sure the RLS policy SQL script was executed
   - Check that verify_admin_password_reset_permission() exists
*/