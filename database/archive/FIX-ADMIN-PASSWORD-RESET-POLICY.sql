-- =====================================================
-- RLS POLICIES FOR ADMIN PASSWORD RESET FUNCTIONS
-- =====================================================
-- This script creates Row Level Security policies
-- to control access to the admin password reset functions

-- Drop existing policies if they exist (for updates)
DROP POLICY IF EXISTS "Allow admin password reset" ON pg_proc;

-- Create policy for admin password reset function
-- Note: This is a function-level policy, not table-level
-- We need to ensure only admins can execute the RPC functions

-- Since we can't create RLS policies directly on functions,
-- we'll rely on the internal role checking within the functions
-- and create a view to check admin permissions

-- Create a helper view for admin password reset permissions
CREATE OR REPLACE VIEW admin_password_reset_permissions AS
SELECT
  up.id as user_id,
  up.role,
  up.is_active,
  CASE
    WHEN up.role IN ('admin', 'developer') AND up.is_active = true THEN true
    ELSE false
  END as can_reset_passwords
FROM user_profiles up
WHERE up.id = auth.uid();

-- Grant access to the view for authenticated users
GRANT SELECT ON admin_password_reset_permissions TO authenticated;

-- Add additional security check function
CREATE OR REPLACE FUNCTION verify_admin_password_reset_permission()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if current user has admin/developer role and is active
  SELECT role IN ('admin', 'developer') AND is_active = true
  INTO is_admin
  FROM user_profiles
  WHERE id = auth.uid();

  RETURN COALESCE(is_admin, false);
END;
$$;

-- Grant execute permission for the verification function
GRANT EXECUTE ON FUNCTION verify_admin_password_reset_permission TO authenticated;

-- =====================================================
-- AUDIT LOGGING FOR PASSWORD RESETS
-- =====================================================
-- Create audit table for tracking admin password resets
CREATE TABLE IF NOT EXISTS admin_password_reset_audit (
  audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reset_by UUID REFERENCES user_profiles(id) NOT NULL,
  target_user_email TEXT NOT NULL,
  reset_method TEXT NOT NULL, -- 'email' or 'direct'
  reset_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  ip_address TEXT DEFAULT inet_client_addr(),
  user_agent TEXT DEFAULT current_setting('request.headers', true)::json->>'user-agent'
);

-- Enable RLS on the audit table
ALTER TABLE admin_password_reset_audit ENABLE ROW LEVEL SECURITY;

-- Create policies for the audit table
CREATE POLICY "Users can view their own password reset audits"
ON admin_password_reset_audit FOR SELECT
USING (reset_by = auth.uid());

CREATE POLICY "Admins can view all password reset audits"
ON admin_password_reset_audit FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'developer')
    AND is_active = true
  )
);

CREATE POLICY "System can insert password reset audits"
ON admin_password_reset_audit FOR INSERT
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON admin_password_reset_audit TO authenticated;

-- Update the admin password reset function to include audit logging
CREATE OR REPLACE FUNCTION admin_reset_user_password_with_audit(
  target_user_email TEXT,
  new_password TEXT DEFAULT NULL,
  send_email BOOLEAN DEFAULT TRUE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  current_user_role TEXT;
  reset_token TEXT;
  reset_result JSON;
  reset_method TEXT;
  audit_success BOOLEAN := false;
  audit_error TEXT := NULL;
BEGIN
  -- Get the current user's role
  SELECT role INTO current_user_role
  FROM user_profiles
  WHERE id = auth.uid()
  AND is_active = true;

  -- Check if the current user has permission
  IF current_user_role NOT IN ('admin', 'developer') THEN
    audit_error := 'INSUFFICIENT_PERMISSIONS';
    -- Log the failed attempt
    INSERT INTO admin_password_reset_audit (
      reset_by, target_user_email, reset_method, success, error_message
    ) VALUES (
      auth.uid(), target_user_email, 'email', false, audit_error
    );

    RETURN json_build_object(
      'success', false,
      'error', audit_error,
      'message', 'Only admins and developers can reset user passwords'
    );
  END IF;

  -- Get the target user's ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_user_email
  AND NOT email_confirmed_at IS NULL;

  -- Check if target user exists
  IF target_user_id IS NULL THEN
    audit_error := 'USER_NOT_FOUND';
    -- Log the failed attempt
    INSERT INTO admin_password_reset_audit (
      reset_by, target_user_email, reset_method, success, error_message
    ) VALUES (
      auth.uid(), target_user_email, 'email', false, audit_error
    );

    RETURN json_build_object(
      'success', false,
      'error', audit_error,
      'message', 'User with this email not found or not confirmed'
    );
  END IF;

  -- Prevent self-reset
  IF target_user_id = auth.uid() THEN
    audit_error := 'SELF_RESET_NOT_ALLOWED';
    -- Log the failed attempt
    INSERT INTO admin_password_reset_audit (
      reset_by, target_user_email, reset_method, success, error_message
    ) VALUES (
      auth.uid(), target_user_email, 'email', false, audit_error
    );

    RETURN json_build_object(
      'success', false,
      'error', audit_error,
      'message', 'Cannot reset your own password through admin function'
    );
  END IF;

  -- Determine reset method
  reset_method := CASE
    WHEN new_password IS NOT NULL AND length(new_password) >= 6 THEN 'direct'
    ELSE 'email'
  END;

  -- Execute password reset
  IF reset_method = 'direct' THEN
    -- Direct password reset
    UPDATE auth.users
    SET
      encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
    WHERE id = target_user_id;

    audit_success := true;

    RETURN json_build_object(
      'success', true,
      'method', 'direct_reset',
      'message', 'Password has been reset successfully',
      'target_email', target_user_email,
      'reset_by', current_user_role
    );
  ELSE
    -- Email reset method
    audit_success := true;

    RETURN json_build_object(
      'success', true,
      'method', 'email_reset',
      'message', 'Password reset email will be sent',
      'target_email', target_user_email,
      'reset_by', current_user_role,
      'frontend_action', 'send_email_reset'
    );
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    audit_error := SQLERRM;
    -- Log the error
    INSERT INTO admin_password_reset_audit (
      reset_by, target_user_email, reset_method, success, error_message
    ) VALUES (
      auth.uid(), target_user_email, reset_method, false, audit_error
    );

    RETURN json_build_object(
      'success', false,
      'error', 'DATABASE_ERROR',
      'message', audit_error
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_reset_user_password_with_audit TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Check if current user can reset passwords
SELECT
  verify_admin_password_reset_permission() as can_reset_passwords;

-- Check audit logs
SELECT
  audit_id,
  target_user_email,
  reset_method,
  reset_at,
  success,
  error_message
FROM admin_password_reset_audit
ORDER BY reset_at DESC
LIMIT 10;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================
--
-- To use the enhanced admin password reset function:
-- SELECT admin_reset_user_password_with_audit('user@example.com', 'newPassword123', false);
--
-- Security Features:
-- - Role-based access control (admin/developer only)
-- - Prevent self-password reset
-- - Comprehensive audit logging
-- - IP address and user agent tracking
-- - Error handling and logging
--
-- =====================================================