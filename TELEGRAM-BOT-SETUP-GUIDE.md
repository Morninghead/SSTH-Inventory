# 🤖 Telegram Bot Setup Guide for SSTH Inventory System

This guide will help you set up a Telegram bot to receive real-time inventory notifications.

## 📋 Prerequisites

- Admin access to SSTH Inventory System
- Telegram account
- Supabase database access

## 🚀 Quick Setup (5 Minutes)

### 1. Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow the instructions:
   - Bot name: `SSTH Inventory Bot` (or your preferred name)
   - Bot username: Must be unique and end in `bot`
4. **Copy the bot token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Your Chat ID

1. Start a chat with your new bot
2. Send any message to the bot
3. Visit this URL in your browser:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
4. Look for `"chat": {"id": 123456789}` in the response
5. **Copy the chat ID** (just the numbers)

### 3. Configure in SSTH Inventory

1. Log in to SSTH Inventory as admin
2. Go to **Settings** → **Notifications**
3. Enter your **Bot Token** and **Chat ID**
4. Click **"Test Connection"** to verify setup
5. Enable desired notification types:
   - ✅ **Low Stock Alerts** - When items fall below reorder level
   - ✅ **Transaction Notifications** - For all inventory transactions
   - ✅ **Daily Summary** - Daily inventory activity reports
6. Click **"Save Settings"**

## 🔧 Advanced Configuration

### Group Chat Setup

For team notifications:
1. Create a Telegram group
2. Add your bot to the group
3. Send a message to the group
4. Use the same getUpdates URL to find the group chat ID
5. Use group chat ID in settings (usually negative numbers like `-123456789`)

### Multiple Notification Channels

You can have multiple notification channels:
- Personal chat (for urgent alerts)
- Group chat (for team notifications)
- Channel (for public announcements)

## 📊 Notification Types

### Low Stock Alerts 🚨
```
🚨 Low Stock Alert

5 items need attention
Total inventory value at risk: ฿15,230.50

1. Office Paper A4
   • Code: OFF-001
   • Stock: 15 (Reorder: 50)
   • Value: ฿750.00
   • Department: General Office

Please check inventory and place purchase orders as needed.
```

### Transaction Notifications 📤📥
```
📤 Transaction ISSUE

Transaction ID: ISU-20241201001
Department: IT Department
Items: 3
Total Value: ฿1,250.00
Processed by: John Doe
Time: 12/1/2024, 2:30:45 PM
```

### Daily Summary 📊
```
📊 Daily Inventory Summary

Date: 12/1/2024
Transactions: 15
Items Issued: 45
Items Received: 120
Low Stock Items: 3

SSTH Inventory System - Daily Report
```

## 🛠️ Troubleshooting

### Bot Not Responding
1. Verify bot token is correct
2. Check chat ID is correct
3. Ensure bot is not blocked
4. Try sending a message directly to the bot first

### Connection Test Failed
1. Check internet connection
2. Verify bot token hasn't expired
3. Ensure bot is started (send `/start` command)
4. Check if you're using the correct chat ID

### Not Receiving Notifications
1. Verify notifications are enabled in settings
2. Check specific notification types are enabled
3. Ensure browser has internet connection
4. Check browser console for errors

### Error Messages

**"Bad Request: chat not found"**
- Chat ID is incorrect
- Bot hasn't been added to the chat/group

**"Unauthorized"**
- Bot token is incorrect or has been revoked

**"Too Many Requests"**
- Telegram rate limit (wait a few minutes)

## 🔒 Security Considerations

### Bot Token Security
- Never share bot token publicly
- Store securely in database
- Regenerate if compromised

### Chat Privacy
- Only share with trusted team members
- Consider using private groups
- Regular users cannot access notification settings

### Best Practices
- Use unique bot username
- Set up bot commands for control
- Monitor notification logs
- Test regularly

## 📱 Mobile Setup

### Telegram Mobile App
1. Install Telegram from app store
2. Search for your bot by username
3. Start chat and send `/start`
4. You'll receive notifications instantly

### Desktop Setup
1. Install Telegram Desktop
2. Log in with same account
3. Enable desktop notifications in Telegram settings

## 🎯 Use Cases

### For Inventory Managers
- Low stock alerts for timely reordering
- Transaction monitoring
- Daily summaries for planning

### For Department Heads
- Usage notifications for budget tracking
- Department-specific alerts
- Team coordination

### For System Administrators
- Error notifications
- System health alerts
- Backup notifications

## 📈 Monitoring and Analytics

### Notification Logs
Check notification history in database:
```sql
SELECT * FROM notification_logs
ORDER BY sent_at DESC
LIMIT 100;
```

### Success Rate
```sql
SELECT
  notification_type,
  COUNT(*) as total,
  COUNT(CASE WHEN success = true THEN 1 END) as successful,
  COUNT(CASE WHEN success = false THEN 1 END) as failed
FROM notification_logs
GROUP BY notification_type;
```

## 🔄 Automated Setup (Optional)

For automated deployment:
```bash
# Set bot token and chat ID as environment variables
TELEGRAM_BOT_TOKEN="your_bot_token_here"
TELEGRAM_CHAT_ID="your_chat_id_here"

# Test connection
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"
```

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review Telegram Bot API documentation
3. Contact system administrator
4. Check browser console for JavaScript errors

## 🎉 Success!

Once configured, you'll receive instant notifications about:
- Low inventory levels
- Transaction activities
- Daily inventory summaries
- System alerts

This helps you stay informed and make timely inventory decisions!