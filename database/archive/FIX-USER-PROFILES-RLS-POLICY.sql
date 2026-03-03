-- =====================================================
-- FIX USER PROFILES RLS POLICY FOR ADMIN UPDATES
-- =====================================================
-- This script adds the missing RLS policy to allow
-- admins and developers to update user profiles
-- (needed for activate/deactivate functionality)

-- Add missing policy for Admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON user_profiles FOR UPDATE
TO authenticated
USING (
  -- Allow users to update their own profile
  auth.uid() = id
  -- Allow admins and developers to update any profile
  OR (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'developer')
    )
  )
);

-- Also add policy for admins to delete profiles (soft delete)
CREATE POLICY "Admins can delete profiles"
ON user_profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'developer')
  )
);

-- Verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- =====================================================
-- TEST THE FIX
-- =====================================================

-- Test query to check if current user can update user_profiles
-- This should return the current user's role if they have admin privileges
SELECT
  p.role as current_user_role,
  COUNT(up.id) as total_user_profiles,
  COUNT(*) FILTER (WHERE up.is_active = true) as active_users,
  COUNT(*) FILTER (WHERE up.is_active = false) as inactive_users
FROM user_profiles p
LEFT JOIN user_profiles up ON true
WHERE p.id = auth.uid()
GROUP BY p.role;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Run this script in Supabase SQL Editor
-- 2. The activate/deactivate buttons should now work for admin and developer users
-- 3. Regular users can still only update their own profile
-- =====================================================