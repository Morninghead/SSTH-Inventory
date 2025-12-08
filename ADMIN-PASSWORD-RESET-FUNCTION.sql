-- =====================================================
-- ADMIN PASSWORD RESET FUNCTION
-- =====================================================
-- This function allows admins and developers to reset user passwords
-- directly from the web interface using service role privileges

-- Create the admin password reset function
CREATE OR REPLACE FUNCTION admin_reset_user_password(
  target_user_email TEXT,
  new_password TEXT DEFAULT NULL,
  send_email BOOLEAN DEFAULT TRUE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Use service role privileges
AS $$
DECLARE
  target_user_id UUID;
  current_user_role TEXT;
  reset_token TEXT;
  reset_result JSON;
BEGIN
  -- Get the current user's role
  SELECT role INTO current_user_role
  FROM user_profiles
  WHERE id = auth.uid()
  AND is_active = true;

  -- Check if the current user has permission (admin or developer)
  IF current_user_role NOT IN ('admin', 'developer') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INSUFFICIENT_PERMISSIONS',
      'message', 'Only admins and developers can reset user passwords'
    );
  END IF;

  -- Get the target user's ID from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_user_email
  AND NOT email_confirmed_at IS NULL;

  -- Check if target user exists
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'User with this email not found or not confirmed'
    );
  END IF;

  -- Additional security: Prevent self-reset (admins should use regular password reset for themselves)
  IF target_user_id = auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'SELF_RESET_NOT_ALLOWED',
      'message', 'Cannot reset your own password through admin function'
    );
  END IF;

  -- Method 1: Direct password reset (if new_password is provided)
  IF new_password IS NOT NULL AND length(new_password) >= 6 THEN
    -- Update the user's password directly
    UPDATE auth.users
    SET
      encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
    WHERE id = target_user_id;

    -- Return success for direct password reset
    RETURN json_build_object(
      'success', true,
      'method', 'direct_reset',
      'message', 'Password has been reset successfully',
      'target_email', target_user_email,
      'reset_by', current_user_role
    );
  END IF;

  -- Method 2: Send password reset email (default behavior)
  IF send_email THEN
    -- Generate a password reset token
    SELECT recovery_token INTO reset_token
    FROM auth.users
    WHERE id = target_user_id;

    -- Since we can't send emails directly via RPC, we'll return instructions
    -- for the frontend to use the Supabase auth.resetPasswordForEmail() function
    RETURN json_build_object(
      'success', true,
      'method', 'email_reset',
      'message', 'Password reset email will be sent',
      'target_email', target_user_email,
      'reset_by', current_user_role,
      'frontend_action', 'send_email_reset'
    );
  END IF;

  -- Fallback
  RETURN json_build_object(
    'success', false,
    'error', 'INVALID_PARAMETERS',
    'message', 'Invalid parameters provided'
  );
END;
$$;

-- Create helper function to check if current user can reset passwords
CREATE OR REPLACE FUNCTION can_reset_user_passwords()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the current user's role
  SELECT role INTO current_user_role
  FROM user_profiles
  WHERE id = auth.uid()
  AND is_active = true;

  -- Return true if user is admin or developer
  RETURN current_user_role IN ('admin', 'developer');
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_reset_user_password TO authenticated;
GRANT EXECUTE ON FUNCTION can_reset_user_passwords TO authenticated;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================
-- This function provides two methods for password reset:
--
-- 1. Direct Password Reset:
--    SELECT admin_reset_user_password('user@example.com', 'newSecurePassword123', false);
--
-- 2. Email Password Reset (Recommended):
--    SELECT admin_reset_user_password('user@example.com', NULL, true);
--    Then use supabase.auth.resetPasswordForEmail() in frontend
--
-- Security Features:
-- - Only admins and developers can use this function
-- - Cannot reset your own password
-- - Validates target user exists
-- - Minimum 6 characters for direct password reset
-- - Uses SECURITY DEFINER for elevated privileges
-- =====================================================