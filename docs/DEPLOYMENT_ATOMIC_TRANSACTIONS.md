# 🚀 Atomic Transactions - Deployment Guide

## Quick Start (5 minutes)

### Step 1: Deploy the Migration

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of:
   ```
   supabase/migrations/20260216_atomic_transaction_functions.sql
   ```
4. Click **Run** (or press `Ctrl+Enter`)
5. Wait for confirmation: "Success. No rows returned"

### Step 2: Verify Deployment

Run this query to check if functions exist:

```sql
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname LIKE 'create_%_transaction'
   OR proname LIKE 'get_%stock%'
ORDER BY proname;
```

**Expected output:** 6 functions listed:
- `create_adjustment_transaction`
- `create_backorder_transaction`
- `create_issue_transaction`
- `create_receive_transaction`
- `get_available_stock`
- `get_item_stock_summary`

### Step 3: Run Tests

1. In the same SQL Editor, paste contents of:
   ```
   supabase/migrations/20260216_atomic_transaction_tests.sql
   ```
2. Click **Run**
3. Check the **Messages** tab for test results

**Expected output:**
```
=== TEST 1: Basic FIFO Issue Transaction ===
✅ Transaction succeeded: ...
✅ TEST 1 PASSED

=== TEST 2: Insufficient Stock Validation ===
✅ Transaction correctly failed: ...
✅ TEST 2 PASSED

... (all 6 tests)

✅ ALL TESTS PASSED!
```

### Step 4: Test from Application

The TypeScript code is already updated! Just test a transaction:

1. Go to **Transactions** page
2. Create an **Issue** transaction
3. Check the browser console for:
   ```
   Issue transaction succeeded: { transaction_id: "..." }
   ```

---

## Rollback Plan (if needed)

If something goes wrong, you can rollback:

```sql
-- Drop all new functions
DROP FUNCTION IF EXISTS create_issue_transaction CASCADE;
DROP FUNCTION IF EXISTS create_receive_transaction CASCADE;
DROP FUNCTION IF EXISTS create_backorder_transaction CASCADE;
DROP FUNCTION IF EXISTS create_adjustment_transaction CASCADE;
DROP FUNCTION IF EXISTS get_available_stock CASCADE;
DROP FUNCTION IF EXISTS get_item_stock_summary CASCADE;

-- The old client-side code will still work (but without race condition protection)
```

Then restore the old `transactionHelpers.ts` from git:
```bash
git checkout HEAD~1 src/utils/transactionHelpers.ts
```

---

## Monitoring After Deployment

### Check Transaction Performance

```sql
-- Average execution time (requires pg_stat_statements extension)
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%create_%_transaction%'
ORDER BY mean_exec_time DESC;
```

**Target:** Mean execution time < 200ms

### Check for Stock Errors

```sql
-- Transactions that failed due to insufficient stock (last 7 days)
SELECT 
  created_at,
  notes,
  reference_number
FROM transactions
WHERE notes LIKE '%Insufficient stock%'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Check for Lock Waits

```sql
-- Currently waiting transactions
SELECT 
  pid,
  usename,
  wait_event_type,
  wait_event,
  state,
  query_start,
  NOW() - query_start as wait_duration
FROM pg_stat_activity
WHERE wait_event_type = 'Lock'
  AND query LIKE '%transaction%';
```

**Alert if:** Wait duration > 5 seconds

---

## Troubleshooting

### Issue: "Function does not exist"

**Cause:** Migration not deployed or typo in function name

**Fix:**
1. Re-run the migration SQL
2. Check function names match exactly (case-sensitive)

### Issue: "Permission denied"

**Cause:** Missing GRANT statements

**Fix:**
```sql
GRANT EXECUTE ON FUNCTION create_issue_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION create_receive_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION create_backorder_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION create_adjustment_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_stock TO authenticated;
GRANT EXECUTE ON FUNCTION get_item_stock_summary TO authenticated;
```

### Issue: Tests fail with "Insufficient stock"

**Cause:** Test data from previous run not cleaned up

**Fix:**
```sql
-- Clean up test data
DELETE FROM transaction_lines WHERE transaction_id IN (
  SELECT transaction_id FROM transactions WHERE notes LIKE '%TEST:%'
);
DELETE FROM transactions WHERE notes LIKE '%TEST:%';
DELETE FROM inventory_lots WHERE lot_number LIKE 'TEST-%';
DELETE FROM items WHERE item_code LIKE 'TEST-%';
DELETE FROM departments WHERE dept_code = 'TEST-DEPT';

-- Re-run tests
```

### Issue: "Negative stock still appearing"

**Cause:** Old client-side code still being used

**Fix:**
1. Hard refresh browser (`Ctrl+Shift+R`)
2. Check `transactionHelpers.ts` uses `.rpc()` calls
3. Verify migration deployed successfully

---

## Success Criteria

✅ All 6 tests pass  
✅ Issue transaction completes in < 200ms  
✅ No negative stock in `inventory_lots` table  
✅ FIFO order verified (oldest lots consumed first)  
✅ Concurrent transactions handled gracefully  

---

## Next Steps After Deployment

1. **Monitor for 24 hours** - Check error logs and performance
2. **Notify team** - Inform users of the upgrade
3. **Document learnings** - Note any issues encountered
4. **Plan next optimization** - Consider adding indexes if needed

---

**Deployed by:** _____________  
**Date:** _____________  
**Verified by:** _____________  
**Sign-off:** _____________
