-- =====================================================
-- TELEGRAM NOTIFICATIONS SCHEMA FOR SSTH INVENTORY
-- =====================================================
-- This script creates the tables needed for Telegram bot notifications
-- and provides real-time alerts for inventory events

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    low_stock_alerts BOOLEAN DEFAULT false,
    transaction_notifications BOOLEAN DEFAULT false,
    daily_summary BOOLEAN DEFAULT false,
    bot_token TEXT, -- Encrypted bot token from Telegram BotFather
    chat_id TEXT, -- Telegram chat ID to send notifications to
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policy - only authenticated users can access settings
CREATE POLICY "Authenticated users can manage notification settings"
ON notification_settings
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings if table is empty
INSERT INTO notification_settings (id, low_stock_alerts, transaction_notifications, daily_summary, enabled)
VALUES ('default', false, false, false, false)
ON CONFLICT (id) DO NOTHING;

-- Create notification_logs table to track sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL CHECK (notification_type IN ('low_stock', 'transaction', 'system', 'daily_summary')),
    message_content TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb -- Store additional context
);

-- Enable RLS for notification logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Policy - only authenticated users can view logs
CREATE POLICY "Authenticated users can view notification logs"
ON notification_logs
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- Policy - Only system and authenticated users can insert logs
CREATE POLICY "System and authenticated users can insert notification logs"
ON notification_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_type_sent_at
ON notification_logs (notification_type, sent_at DESC);

-- Create index for failed notifications
CREATE INDEX IF NOT EXISTS idx_notification_logs_success
ON notification_logs (success, sent_at DESC) WHERE success = false;

-- =====================================================
-- TELEGRAM BOT SETUP INSTRUCTIONS
-- =====================================================

/*
HOW TO SET UP TELEGRAM BOT:

1. CREATE A TELEGRAM BOT:
   - Open Telegram and search for @BotFather
   - Send /newbot command
   - Follow instructions to create your bot
   - Save the bot token (looks like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)

2. GET YOUR CHAT ID:
   - Start a chat with your bot
   - Send any message to the bot
   - Visit: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   - Look for "chat": {"id": 123456789} in the response
   - The number is your chat ID

3. CONFIGURE IN SSTH INVENTORY:
   - Go to Settings → Notifications in the web app
   - Enter your bot token and chat ID
   - Enable desired notification types
   - Test connection

4. NOTIFICATION TYPES:
   - Low Stock Alerts: Get notified when items fall below reorder level
   - Transaction Notifications: Receive alerts for all inventory transactions
   - Daily Summary: Get daily inventory activity reports
   - System Notifications: Important system events and errors

5. SECURITY NOTES:
   - Bot token should be kept secure
   - Only share bot with trusted team members
   - Consider creating a private group chat for notifications
   - Regular users cannot access notification settings (admin only)

6. ADVANCED SETUP:
   - You can add bot to group chats for team notifications
   - Use group chat ID for group notifications
   - Configure bot permissions as needed
   - Set up custom message formatting

TESTING:
- Use the "Test Connection" button in settings
- Check browser console for any errors
- Verify bot receives messages correctly
- Test different notification types
*/