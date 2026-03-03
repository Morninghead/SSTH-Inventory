# Deploy Transaction Functions to Supabase

**Required to complete transaction functionality**

## 🚨 Current Issue

Your React app is trying to call `process_transaction` function in Supabase, but this function hasn't been deployed to your database yet.

## ⚡ Quick Fix (2 minutes)

### 1. Go to Supabase SQL Editor
1. Visit: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new
2. This opens the SQL editor for your database

### 2. Copy and Run the Transaction Functions SQL
Copy the entire contents of: `database-functions-transactions.sql`

```bash
# File location:
E:\ssth-inventory-v2\SSTH-Inventory\database-functions-transactions.sql
```

### 3. Execute the Script
1. Paste the entire SQL script into the editor
2. Click "Run" button
3. You should see: `Functions created: check_stock_availability, update_inventory_quantity, process_transaction, get_transaction_history`

### 4. Test in Your App
1. Go to http://localhost:5174
2. Navigate to Transactions → Issue
3. Try creating a transaction
4. It should now work! 🎉

## 📋 What These Functions Do

### 1. `process_transaction`
- **Purpose:** Creates transactions and updates inventory atomically
- **Usage:** Called by Issue/Receive/Adjustment forms
- **Features:**
  - Creates transaction header
  - Inserts transaction lines
  - Updates inventory quantities
  - Full transaction safety (rolls back on errors)

### 2. `check_stock_availability`
- **Purpose:** Returns current stock levels for items
- **Usage:** Stock validation before issuing items
- **Returns:** item_id, item_code, description, current_quantity, reorder_level

### 3. `update_inventory_quantity`
- **Purpose:** Atomic inventory quantity updates
- **Usage:** Internal function called by process_transaction
- **Features:** Prevents negative stock, maintains audit trail

### 4. `get_transaction_history`
- **Purpose:** Retrieves transaction history with filters
- **Usage:** Transaction history page
- **Features:** Date filtering, department filtering, pagination

## 🧪 Verification Steps

After running the SQL, verify the functions exist:

```sql
-- Test function exists
SELECT proname FROM pg_proc WHERE proname = 'process_transaction';

-- Should return:
-- process_transaction
```

## 🔧 If You Encounter Issues

### "Function does not exist" error
1. Make sure you ran the entire SQL script
2. Check for any error messages in the SQL editor
3. Refresh the page and try again

### Permission errors
1. Ensure you're logged into the correct Supabase project
2. Check you have owner permissions on the database

### Invalid UUID errors
1. This usually means an item lookup failed
2. Check that your items have valid UUIDs in the database

## 🎯 Next Steps After Deployment

Once the functions are deployed:

1. **Test Issue Transactions**
   - Create a test issue transaction
   - Verify stock quantities update
   - Check transaction history

2. **Test Receive Transactions**
   - Create a test receive transaction
   - Verify stock quantities increase
   - Check transaction history

3. **Test Stock Adjustments**
   - Create a stock adjustment
   - Verify quantities update correctly

## 🚀 Full Transaction Workflow

### Issue Transaction Flow:
```
User selects items → Stock validation → Create transaction → Update inventory → Success
```

### Receive Transaction Flow:
```
User selects items → Create transaction → Update inventory → Success
```

### Adjustment Flow:
```
User selects items → Create transaction → Update inventory → Success
```

## 📊 Database Tables Updated

These functions will modify:
- `transactions` - Transaction headers
- `transaction_lines` - Transaction line items
- `inventory_status` - Stock quantities
- `audit_logs` - Activity tracking

All changes are atomic (all succeed or all rollback).

## ✅ Success Checklist

- [ ] Functions deployed to Supabase
- [ ] Issue transaction works in app
- [ ] Stock quantities update correctly
- [ ] Transaction history shows entries
- [ ] No errors in browser console

---

**Time required:** 2-5 minutes
**Risk level:** Low (database functions only)
**Rollback:** Drop functions if needed

Deploy now and your transactions will be fully functional! 🚀