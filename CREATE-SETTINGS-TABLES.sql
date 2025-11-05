-- ============================================
-- CREATE MISSING TABLES FOR SETTINGS MODULE
-- ============================================
-- Run this script in Supabase SQL Editor to create missing tables
-- ============================================

-- 1. Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  category TEXT NOT NULL, -- company, system, email, notifications
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index on setting_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone authenticated can read settings
CREATE POLICY "Anyone authenticated can read system settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only admins and developers can update settings
CREATE POLICY "Admins can update system settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'developer')
    )
  );

-- 2. Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, preference_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own preferences
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, category, description)
VALUES
  -- Company Settings
  ('company_name', 'Software Solutions Thailand', 'company', 'Company name'),
  ('company_address', '', 'company', 'Company address'),
  ('company_phone', '', 'company', 'Company phone number'),
  ('company_email', 'info@ssth.com', 'company', 'Company email'),
  ('company_website', 'https://ssth.com', 'company', 'Company website'),

  -- System Configuration
  ('default_currency', 'THB', 'system', 'Default currency code'),
  ('default_timezone', 'Asia/Bangkok', 'system', 'Default timezone'),
  ('low_stock_threshold', '10', 'system', 'Default low stock threshold'),
  ('reorder_level', '20', 'system', 'Default reorder level'),
  ('transaction_prefix', 'TXN', 'system', 'Transaction number prefix'),
  ('po_prefix', 'PO', 'system', 'Purchase order number prefix'),

  -- Email Settings
  ('smtp_host', '', 'email', 'SMTP server host'),
  ('smtp_port', '587', 'email', 'SMTP server port'),
  ('smtp_user', '', 'email', 'SMTP username'),
  ('smtp_from_name', 'SSTH Inventory', 'email', 'Email from name'),
  ('smtp_from_email', 'noreply@ssth.com', 'email', 'Email from address'),

  -- Notification Settings
  ('enable_low_stock_alerts', 'true', 'notifications', 'Enable low stock alerts'),
  ('enable_po_alerts', 'true', 'notifications', 'Enable purchase order alerts'),
  ('enable_transaction_alerts', 'false', 'notifications', 'Enable transaction alerts')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Settings tables created successfully!';
  RAISE NOTICE '- system_settings table created with % default settings', (SELECT COUNT(*) FROM public.system_settings);
  RAISE NOTICE '- user_preferences table created';
  RAISE NOTICE 'You can now run the database-functions-settings.sql file';
END $$;
