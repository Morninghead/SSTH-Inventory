# Settings Module Setup Guide

## Issue
The Settings module (Phase 7) requires database tables and functions that don't exist yet in your Supabase database.

**Error:** `Could not find the function public.get_system_settings without parameters in the schema cache`

## Root Cause
1. `system_settings` table doesn't exist
2. `user_preferences` table doesn't exist
3. Settings database functions haven't been created
4. `alert_rules` table exists but has different structure than expected

## Solution: Run These SQL Scripts in Order

### Step 1: Create Missing Tables
**File:** `CREATE-SETTINGS-TABLES.sql`

1. Go to: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new
2. Open the file: `CREATE-SETTINGS-TABLES.sql`
3. Copy and paste the entire script
4. Click "Run"

**This creates:**
- ✅ `system_settings` table with 19 default settings
- ✅ `user_preferences` table for per-user settings
- ✅ RLS policies for security
- ✅ Indexes for performance

### Step 2: Create Database Functions
**File:** `database-functions-settings-UPDATED.sql`

1. Go to same SQL editor
2. Open the file: `database-functions-settings-UPDATED.sql`
3. Copy and paste the entire script
4. Click "Run"

**This creates 10 functions:**
- ✅ `get_system_settings()` - Retrieve all settings
- ✅ `update_system_setting()` - Update single setting
- ✅ `bulk_update_settings()` - Update multiple settings
- ✅ `get_user_preferences()` - Get user preferences
- ✅ `update_user_preference()` - Update user preference
- ✅ `get_alert_rules()` - Get alert rules (works with existing table)
- ✅ `create_alert_rule()` - Create new alert rule
- ✅ `update_alert_rule()` - Update alert rule
- ✅ `delete_alert_rule()` - Delete alert rule
- ✅ `get_audit_logs()` - Get filtered audit logs

### Step 3: Verify Setup

Run this query to verify tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('system_settings', 'user_preferences', 'alert_rules')
ORDER BY table_name;
```

You should see all 3 tables.

Run this query to verify functions exist:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%settings%' OR routine_name LIKE '%preference%' OR routine_name LIKE '%alert_rule%'
ORDER BY routine_name;
```

You should see all 10 functions.

### Step 4: Test in Application

1. Go to: https://ssth-inventory.netlify.app/
2. Login with your credentials
3. Navigate to **Settings** page
4. Test each tab:
   - **Company** - Update company info
   - **System** - Update system config
   - **Preferences** - Update your preferences
   - **Alert Rules** - Currently simplified (see note below)

## Known Limitations

### Alert Rules Module
The Alert Rules module has been simplified because the existing `alert_rules` table structure uses JSONB fields:
- `conditions: JSONB` (instead of individual fields)
- `notification_channels: JSONB` (instead of notification_method)
- `recipients: JSONB` (instead of TEXT[])

**Current Status:** The database functions are ready, but the React component (`AlertRules.tsx`) needs updates to work with the JSONB structure.

**Workaround Options:**

**Option A:** Disable Alert Rules tab temporarily
In `src/pages/SettingsPage.tsx`, comment out the Alert Rules tab:

```typescript
const tabs = [
  { id: 'company', label: 'Company', icon: <Building2 className="w-5 h-5" /> },
  { id: 'system', label: 'System', icon: <Settings className="w-5 h-5" /> },
  { id: 'preferences', label: 'Preferences', icon: <User className="w-5 h-5" /> },
  // { id: 'alerts', label: 'Alert Rules', icon: <Bell className="w-5 h-5" /> } // Temporarily disabled
]
```

**Option B:** Manage alert rules directly in database
You can create alert rules manually using SQL:

```sql
INSERT INTO alert_rules (
  rule_name,
  rule_type,
  conditions,
  notification_channels,
  recipients,
  is_active
)
VALUES (
  'Low Stock Alert',
  'low_stock',
  '{"field": "quantity", "operator": "<=", "value": 10}'::jsonb,
  '["email"]'::jsonb,
  '["admin@ssth.com"]'::jsonb,
  true
);
```

## What Works Now

After running the SQL scripts, these features will work:

✅ **Company Settings**
- Update company name, address, phone, email, website
- Bulk save all company settings

✅ **System Configuration**
- General settings (currency, timezone)
- Inventory settings (thresholds, reorder levels)
- Number prefixes (transaction, PO)
- SMTP email configuration
- Notification toggles

✅ **User Preferences**
- Theme selection (light/dark/auto)
- Language selection (en/th)
- Display settings (items per page)
- Date/time format
- Notification preferences

❌ **Alert Rules** (needs component update)
- Functions work, but UI needs adjustment for JSONB structure

## Default Settings Created

When you run `CREATE-SETTINGS-TABLES.sql`, these default settings are created:

### Company
- company_name: "Software Solutions Thailand"
- company_email: "info@ssth.com"
- company_website: "https://ssth.com"

### System
- default_currency: "THB"
- default_timezone: "Asia/Bangkok"
- low_stock_threshold: "10"
- reorder_level: "20"
- transaction_prefix: "TXN"
- po_prefix: "PO"

### Email
- smtp_port: "587"
- smtp_from_name: "SSTH Inventory"
- smtp_from_email: "noreply@ssth.com"

### Notifications
- enable_low_stock_alerts: "true"
- enable_po_alerts: "true"
- enable_transaction_alerts: "false"

You can modify these through the Settings page after setup.

## Security

All functions use `SECURITY DEFINER` for proper access control:

- **System Settings:** Only admins and developers can update
- **User Preferences:** Users can only access their own preferences
- **Alert Rules:** Only managers, admins, and developers can manage

RLS policies enforce these permissions at the database level.

## Troubleshooting

### "Function not found" errors
- Make sure you ran `database-functions-settings-UPDATED.sql` (not the old `database-functions-settings.sql`)
- Verify functions exist with the SQL query in Step 3

### "Table does not exist" errors
- Make sure you ran `CREATE-SETTINGS-TABLES.sql` first
- Verify tables exist with the SQL query in Step 3

### "Permission denied" errors
- Make sure your user has the correct role in `user_profiles` table
- Check that you're logged in with the correct account

### Settings don't save
- Check browser console for errors
- Verify you have admin/developer role for system settings
- Check Supabase logs for database errors

## Summary

1. ✅ Run `CREATE-SETTINGS-TABLES.sql` to create tables
2. ✅ Run `database-functions-settings-UPDATED.sql` to create functions
3. ✅ Test Company, System, and Preferences tabs
4. ⚠️ Alert Rules tab needs component updates (can be disabled temporarily)

After these steps, 3 out of 4 settings tabs will be fully functional!
