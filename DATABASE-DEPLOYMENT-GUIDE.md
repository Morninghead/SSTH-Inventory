# 🚀 DATABASE DEPLOYMENT GUIDE
## SSTH Inventory System - Phase 1 Critical Fixes

**Status:** ✅ Code fixes completed
**Build Status:** ✅ Passing (0 errors)
**Date:** November 5, 2025

---

## ⚠️ IMPORTANT: Complete These Steps BEFORE Using the Application

The application requires several database functions to be deployed to Supabase. Without these functions, the following features will **NOT WORK**:

- ❌ Creating transactions (Issue/Receive/Adjustment)
- ❌ Viewing transaction history
- ❌ Creating purchase orders
- ❌ Managing settings

---

## 📋 DEPLOYMENT CHECKLIST

### Step 1: Access Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"** to open a blank editor

---

### Step 2: Deploy Transaction Functions (REQUIRED)

**File:** `database-functions-transactions.sql`

1. Open the file `database-functions-transactions.sql` in this repository
2. Copy the ENTIRE contents (all 260 lines)
3. Paste into Supabase SQL Editor
4. Click **"Run"** button
5. Wait for success message: ✅ "Success. No rows returned"

**What this creates:**
- `check_stock_availability()` - Validates item stock levels
- `update_inventory_quantity()` - Updates stock with transaction safety
- `process_transaction()` - Creates transactions and updates inventory atomically
- `get_transaction_history()` - Retrieves transaction history with details

---

### Step 3: Deploy Purchase Order Functions (REQUIRED)

**File:** `database-functions-purchase-orders.sql`

1. Open the file `database-functions-purchase-orders.sql`
2. Copy the ENTIRE contents (all 401 lines)
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Wait for success message: ✅ "Success. No rows returned"

**What this creates:**
- `create_purchase_order()` - Creates PO with line items
- `update_po_status()` - Updates PO status with validation
- `get_purchase_order_details()` - Retrieves PO with full details
- `get_purchase_orders()` - Lists POs with filters
- `cancel_purchase_order()` - Cancels PO with reason tracking
- `update_po_line_items()` - Updates existing PO line items

---

### Step 4: Deploy User Management Functions (REQUIRED)

**File:** `database-functions-users.sql`

1. Open the file `database-functions-users.sql`
2. Copy the ENTIRE contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Wait for success message: ✅ "Success. No rows returned"

**What this creates:**
- User CRUD operations
- Activity logging
- Role management functions

---

### Step 5: Deploy Settings Functions (REQUIRED)

**File:** Choose ONE of these files:
- `database-functions-settings-UPDATED.sql` (recommended) OR
- `database-functions-settings.sql`

1. Open the chosen file
2. Copy the ENTIRE contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Wait for success message: ✅ "Success. No rows returned"

**What this creates:**
- `get_system_settings()` - Retrieves all system settings
- `update_system_setting()` - Updates individual settings
- `bulk_update_settings()` - Updates multiple settings at once
- Default settings initialization

---

## ✅ VERIFICATION STEPS

After deploying all functions, verify they were created successfully:

### Check Functions Exist

Run this query in Supabase SQL Editor:

```sql
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'process_transaction',
    'get_transaction_history',
    'create_purchase_order',
    'get_purchase_orders',
    'get_system_settings',
    'bulk_update_settings'
  )
ORDER BY routine_name;
```

**Expected Result:** Should return 6+ rows showing all deployed functions.

---

## 🐛 FIXES APPLIED IN THIS DEPLOYMENT

### 1. Storage Bucket Name Fixed ✅
- **Changed:** `inventory-items` → `inventory-images`
- **Location:** `src/components/inventory/ItemFormModal.tsx`
- **Impact:** Image uploads now work correctly

### 2. Type Safety Improved ✅
- **Removed:** All `as any` casts from TransactionList.tsx
- **Impact:** Better type safety, fewer runtime errors

### 3. Database Field Alignment ✅
- **Fixed:** SQL functions now use `reference_no` (not `reference_number`)
- **Impact:** Matches actual database schema, no field mismatch errors

---

## 🧪 TESTING AFTER DEPLOYMENT

### Test Transaction Creation

1. Login to app: https://ssth-inventory.netlify.app/
2. Navigate to **Transactions** page
3. Click **"New Issue"** or **"New Receipt"**
4. Fill out form and submit
5. **Expected:** Success message, transaction appears in history

### Test Purchase Order Creation

1. Navigate to **Purchase Orders** page
2. Click **"Create PO"** tab
3. Select supplier, add items
4. Click **"Create Purchase Order"**
5. **Expected:** PO created successfully, appears in list

### Test Settings

1. Navigate to **Settings** page (Admin only)
2. Click **"Company"** tab
3. Update company name
4. Click **"Save Changes"**
5. **Expected:** Settings saved successfully

---

## ⚠️ TROUBLESHOOTING

### Error: "function process_transaction does not exist"

**Cause:** Transaction functions not deployed
**Solution:** Run Step 2 again

### Error: "Bucket not found"

**Cause:** Storage bucket `inventory-images` doesn't exist
**Solution:** Create bucket in Supabase Storage:
1. Go to Storage section
2. Create new bucket named `inventory-images`
3. Make it **public**

### Error: "column reference_number does not exist"

**Cause:** Old SQL scripts were run
**Solution:**
1. Check column name in database: `SELECT * FROM transactions LIMIT 1;`
2. If it shows `reference_number`, rename it:
```sql
ALTER TABLE transactions
RENAME COLUMN reference_number TO reference_no;
```

---

## 📊 DEPLOYMENT STATUS

| Component | Status | Required |
|-----------|--------|----------|
| Transaction Functions | ⏳ Pending | ✅ Yes |
| Purchase Order Functions | ⏳ Pending | ✅ Yes |
| User Management Functions | ⏳ Pending | ✅ Yes |
| Settings Functions | ⏳ Pending | ✅ Yes |
| Storage Bucket | ⏳ Verify Exists | ✅ Yes |
| Code Fixes | ✅ Complete | ✅ Yes |
| Build Status | ✅ Passing | ✅ Yes |

---

## 🎯 NEXT STEPS

After completing this deployment:

1. ✅ All critical bugs are fixed
2. ✅ Application is production-ready
3. ✅ Users can create transactions
4. ✅ Users can create purchase orders
5. ✅ Settings can be configured

**Estimated Time:** 15-20 minutes total

---

## 📞 SUPPORT

If you encounter any issues during deployment:

1. Check the error message in Supabase SQL Editor
2. Verify you're running the latest SQL files
3. Ensure you have proper permissions in Supabase
4. Review the CLAUDE.md file for additional context

---

**Last Updated:** November 5, 2025
**Phase:** 1 - Critical Fixes
**Status:** ✅ Ready for Deployment
