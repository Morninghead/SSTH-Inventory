-- SQL Function to get all users with their email addresses from auth.users
-- This function joins auth.users with user_profiles to show ALL users

CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  department_id UUID,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.email::TEXT,
    COALESCE(up.full_name, 'No Name')::TEXT as full_name,
    COALESCE(up.role, 'user')::TEXT as role,
    up.department_id,
    COALESCE(up.is_active, true) as is_active,
    COALESCE(up.created_at, au.created_at) as created_at,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.id
  WHERE au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_with_email() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_users_with_email() IS 'Returns all users from auth.users with their profile information including real email addresses';
