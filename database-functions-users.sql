-- =====================================================
-- USER MANAGEMENT DATABASE FUNCTIONS
-- Run these in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- FUNCTION 1: Create New User
-- Creates user in auth.users and user_profiles
-- =====================================================

CREATE OR REPLACE FUNCTION create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_department_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  user_id UUID,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Validate role
  IF p_role NOT IN ('developer', 'admin', 'manager', 'user', 'viewer') THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Invalid role. Must be: developer, admin, manager, user, or viewer';
    RETURN;
  END IF;

  -- Create user in auth.users (Supabase Auth)
  -- Note: This requires admin privileges
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  )
  VALUES (
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now()
  )
  RETURNING id INTO v_user_id;

  -- Create user profile
  INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    department_id,
    is_active,
    created_at
  )
  VALUES (
    v_user_id,
    p_email,
    p_full_name,
    p_role,
    p_department_id,
    true,
    now()
  );

  RETURN QUERY SELECT v_user_id, true, 'User created successfully';

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::UUID, false, SQLERRM;
END;
$$;

-- =====================================================
-- FUNCTION 2: Update User Profile
-- Updates user information (not email/password)
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_role TEXT,
  p_department_id UUID DEFAULT NULL,
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate role
  IF p_role NOT IN ('developer', 'admin', 'manager', 'user', 'viewer') THEN
    RETURN QUERY SELECT false, 'Invalid role';
    RETURN;
  END IF;

  -- Update user profile
  UPDATE user_profiles
  SET
    full_name = p_full_name,
    role = p_role,
    department_id = p_department_id,
    updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'User not found';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'User profile updated successfully';

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$;

-- =====================================================
-- FUNCTION 3: Toggle User Active Status
-- Activate or deactivate a user
-- =====================================================

CREATE OR REPLACE FUNCTION toggle_user_status(
  p_user_id UUID,
  p_is_active BOOLEAN,
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET
    is_active = p_is_active,
    updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'User not found';
    RETURN;
  END IF;

  RETURN QUERY SELECT true,
    CASE
      WHEN p_is_active THEN 'User activated successfully'
      ELSE 'User deactivated successfully'
    END;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$;

-- =====================================================
-- FUNCTION 4: Get Users List with Filters
-- Returns list of users with optional filters
-- =====================================================

CREATE OR REPLACE FUNCTION get_users_list(
  p_role TEXT DEFAULT NULL,
  p_department_id UUID DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  department_id UUID,
  department_name TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id as user_id,
    up.email,
    up.full_name,
    up.role,
    up.department_id,
    d.dept_name as department_name,
    up.is_active,
    up.created_at,
    up.last_login
  FROM user_profiles up
  LEFT JOIN departments d ON up.department_id = d.dept_id
  WHERE
    (p_role IS NULL OR up.role = p_role)
    AND (p_department_id IS NULL OR up.department_id = p_department_id)
    AND (p_is_active IS NULL OR up.is_active = p_is_active)
    AND (p_search IS NULL OR
         up.full_name ILIKE '%' || p_search || '%' OR
         up.email ILIKE '%' || p_search || '%')
  ORDER BY up.created_at DESC;
END;
$$;

-- =====================================================
-- FUNCTION 5: Get User Activity Log
-- Returns recent activity for a user
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_activity(
  p_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  log_id UUID,
  user_id UUID,
  user_name TEXT,
  action TEXT,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.log_id,
    al.user_id,
    up.full_name as user_name,
    al.action,
    al.table_name,
    al.record_id,
    al.old_values,
    al.new_values,
    al.created_at
  FROM audit_logs al
  LEFT JOIN user_profiles up ON al.user_id = up.id
  WHERE
    (p_user_id IS NULL OR al.user_id = p_user_id)
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- FUNCTION 6: Delete User (Soft Delete)
-- Marks user as inactive and removes from auth
-- =====================================================

CREATE OR REPLACE FUNCTION delete_user(
  p_user_id UUID,
  p_deleted_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_id) THEN
    RETURN QUERY SELECT false, 'User not found';
    RETURN;
  END IF;

  -- Soft delete: deactivate user
  UPDATE user_profiles
  SET
    is_active = false,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN QUERY SELECT true, 'User deleted successfully';

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$;

-- =====================================================
-- FUNCTION 7: Reset User Password (Admin)
-- Allows admin to reset user password
-- =====================================================

CREATE OR REPLACE FUNCTION admin_reset_password(
  p_user_id UUID,
  p_new_password TEXT,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  -- Check if requestor is admin
  SELECT role INTO v_admin_role
  FROM user_profiles
  WHERE id = p_admin_id;

  IF v_admin_role NOT IN ('developer', 'admin') THEN
    RETURN QUERY SELECT false, 'Only admins can reset passwords';
    RETURN;
  END IF;

  -- Update password in auth.users
  UPDATE auth.users
  SET
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'User not found';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Password reset successfully';

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$;

-- =====================================================
-- FUNCTION 8: Get User Statistics
-- Returns summary statistics for users
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
  total_users INT,
  active_users INT,
  inactive_users INT,
  users_by_role JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT as total_users,
    COUNT(*) FILTER (WHERE is_active = true)::INT as active_users,
    COUNT(*) FILTER (WHERE is_active = false)::INT as inactive_users,
    jsonb_object_agg(role, role_count) as users_by_role
  FROM (
    SELECT
      role,
      COUNT(*)::INT as role_count
    FROM user_profiles
    GROUP BY role
  ) role_counts,
  user_profiles;
END;
$$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'User management functions created successfully!' as status;
SELECT 'Functions created: create_user, update_user_profile, toggle_user_status, get_users_list, get_user_activity, delete_user, admin_reset_password, get_user_statistics' as info;
