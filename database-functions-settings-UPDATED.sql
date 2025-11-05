-- ============================================
-- SETTINGS MANAGEMENT DATABASE FUNCTIONS (UPDATED)
-- ============================================
-- Phase 7: Settings & Configuration
-- IMPORTANT: Run CREATE-SETTINGS-TABLES.sql FIRST before running this file
-- These functions work with the existing alert_rules table structure
-- ============================================

-- 1. Get or Create System Settings
-- Returns current system settings or creates default settings if none exist
CREATE OR REPLACE FUNCTION get_system_settings()
RETURNS TABLE (
  setting_key TEXT,
  setting_value TEXT,
  category TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return all system settings
  RETURN QUERY
  SELECT
    s.setting_key,
    s.setting_value,
    s.category,
    s.description,
    s.updated_at
  FROM system_settings s
  ORDER BY s.category, s.setting_key;
END;
$$;

-- 2. Update System Setting
-- Updates a single system setting value
CREATE OR REPLACE FUNCTION update_system_setting(
  p_setting_key TEXT,
  p_setting_value TEXT,
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Check if user has admin or developer role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = p_updated_by
    AND role IN ('developer', 'admin')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Permission denied. Only admins can update system settings.'
    );
  END IF;

  -- Update the setting
  UPDATE system_settings
  SET
    setting_value = p_setting_value,
    updated_at = now(),
    updated_by = p_updated_by
  WHERE setting_key = p_setting_key;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Setting key not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Setting updated successfully'
  );
END;
$$;

-- 3. Bulk Update System Settings
-- Updates multiple system settings at once
CREATE OR REPLACE FUNCTION bulk_update_settings(
  p_settings JSONB,
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_setting JSONB;
  v_count INT := 0;
BEGIN
  -- Check if user has admin or developer role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = p_updated_by
    AND role IN ('developer', 'admin')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Permission denied. Only admins can update system settings.'
    );
  END IF;

  -- Loop through settings and update each one
  FOR v_setting IN SELECT * FROM jsonb_array_elements(p_settings)
  LOOP
    UPDATE system_settings
    SET
      setting_value = v_setting->>'value',
      updated_at = now(),
      updated_by = p_updated_by
    WHERE setting_key = v_setting->>'key';

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Updated %s settings successfully', v_count),
    'count', v_count
  );
END;
$$;

-- 4. Get User Preferences
-- Returns user-specific preferences
CREATE OR REPLACE FUNCTION get_user_preferences(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  preference_key TEXT,
  preference_value TEXT,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.preference_key,
    up.preference_value,
    up.updated_at
  FROM user_preferences up
  WHERE up.user_id = p_user_id
  ORDER BY up.preference_key;
END;
$$;

-- 5. Update User Preference
-- Updates a single user preference
CREATE OR REPLACE FUNCTION update_user_preference(
  p_preference_key TEXT,
  p_preference_value TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update preference
  INSERT INTO user_preferences (user_id, preference_key, preference_value, updated_at)
  VALUES (p_user_id, p_preference_key, p_preference_value, now())
  ON CONFLICT (user_id, preference_key)
  DO UPDATE SET
    preference_value = EXCLUDED.preference_value,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Preference updated successfully'
  );
END;
$$;

-- 6. Get Alert Rules (works with existing table structure)
-- Returns all active alert rules
CREATE OR REPLACE FUNCTION get_alert_rules()
RETURNS TABLE (
  rule_id UUID,
  rule_name TEXT,
  rule_type TEXT,
  conditions JSONB,
  notification_channels JSONB,
  recipients JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.rule_id,
    ar.rule_name,
    ar.rule_type,
    ar.conditions::jsonb,
    ar.notification_channels::jsonb,
    ar.recipients::jsonb,
    ar.is_active,
    ar.created_at,
    ar.updated_at
  FROM alert_rules ar
  ORDER BY ar.rule_name;
END;
$$;

-- 7. Create Alert Rule (simplified version)
-- Creates a new alert rule with the existing table structure
CREATE OR REPLACE FUNCTION create_alert_rule(
  p_rule_name TEXT,
  p_rule_type TEXT,
  p_conditions JSONB,
  p_notification_channels JSONB,
  p_recipients JSONB,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_rule_id UUID;
BEGIN
  -- Check if user has manager, admin, or developer role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = p_created_by
    AND role IN ('developer', 'admin', 'manager')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Permission denied. Only managers and admins can create alert rules.'
    );
  END IF;

  -- Insert new alert rule
  INSERT INTO alert_rules (
    rule_name, rule_type, conditions, notification_channels,
    recipients, is_active, created_by
  )
  VALUES (
    p_rule_name, p_rule_type, p_conditions, p_notification_channels,
    p_recipients, true, p_created_by
  )
  RETURNING rule_id INTO v_rule_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Alert rule created successfully',
    'rule_id', v_rule_id
  );
END;
$$;

-- 8. Update Alert Rule (simplified version)
-- Updates an existing alert rule
CREATE OR REPLACE FUNCTION update_alert_rule(
  p_rule_id UUID,
  p_rule_name TEXT,
  p_rule_type TEXT,
  p_conditions JSONB,
  p_notification_channels JSONB,
  p_recipients JSONB,
  p_is_active BOOLEAN,
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user has manager, admin, or developer role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = p_updated_by
    AND role IN ('developer', 'admin', 'manager')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Permission denied. Only managers and admins can update alert rules.'
    );
  END IF;

  -- Update alert rule
  UPDATE alert_rules
  SET
    rule_name = p_rule_name,
    rule_type = p_rule_type,
    conditions = p_conditions,
    notification_channels = p_notification_channels,
    recipients = p_recipients,
    is_active = p_is_active,
    updated_at = now()
  WHERE rule_id = p_rule_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Alert rule not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Alert rule updated successfully'
  );
END;
$$;

-- 9. Delete Alert Rule
-- Deletes an alert rule
CREATE OR REPLACE FUNCTION delete_alert_rule(
  p_rule_id UUID,
  p_deleted_by UUID DEFAULT auth.uid()
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user has manager, admin, or developer role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = p_deleted_by
    AND role IN ('developer', 'admin', 'manager')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Permission denied. Only managers and admins can delete alert rules.'
    );
  END IF;

  -- Delete alert rule
  DELETE FROM alert_rules WHERE rule_id = p_rule_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Alert rule not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Alert rule deleted successfully'
  );
END;
$$;

-- 10. Get Audit Logs (with filters)
-- Returns filtered audit logs for system monitoring
CREATE OR REPLACE FUNCTION get_audit_logs(
  p_table_name TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  log_id UUID,
  table_name TEXT,
  record_id UUID,
  action TEXT,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  user_name TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.log_id,
    al.table_name,
    al.record_id::uuid,
    al.action,
    al.old_values::jsonb,
    al.new_values::jsonb,
    al.user_id::uuid,
    up.full_name as user_name,
    al.created_at
  FROM audit_logs al
  LEFT JOIN user_profiles up ON al.user_id::text = up.id::text
  WHERE
    (p_table_name IS NULL OR al.table_name = p_table_name)
    AND (p_action IS NULL OR al.action = p_action)
    AND (p_user_id IS NULL OR al.user_id::text = p_user_id::text)
    AND (p_start_date IS NULL OR al.created_at >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at <= p_end_date)
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_system_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION update_system_setting(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_settings(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_preference(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_alert_rules() TO authenticated;
GRANT EXECUTE ON FUNCTION create_alert_rule(TEXT, TEXT, JSONB, JSONB, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_alert_rule(UUID, TEXT, TEXT, JSONB, JSONB, JSONB, BOOLEAN, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_alert_rule(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_logs(TEXT, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Settings database functions created successfully!';
  RAISE NOTICE 'All 10 functions are now available';
END $$;
