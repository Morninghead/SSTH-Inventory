# Atomic Transaction System - Implementation Guide

## 🎯 Overview

This document describes the **atomic transaction system** implemented to prevent race conditions in concurrent inventory operations. The system uses **Postgres stored procedures with row-level locking** (`SELECT ... FOR UPDATE`) to ensure data integrity.

## 🔒 Problem Solved

### Before: Race Condition Vulnerability

```typescript
// ❌ UNSAFE: Client-side FIFO logic
1. Client A reads: "10 units available"
2. Client B reads: "10 units available" (same time)
3. Client A issues 10 units → Stock = 0 ✅
4. Client B issues 10 units → Stock = -10 ❌ NEGATIVE STOCK!
```

### After: Atomic Operations

```sql
-- ✅ SAFE: Database-level locking
BEGIN;
  SELECT ... FROM inventory_lots WHERE ... FOR UPDATE; -- Lock rows
  -- Only one transaction can proceed at a time
  UPDATE inventory_lots SET quantity = ...;
COMMIT;
```

## 📁 Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260216_atomic_transaction_functions.sql` | Postgres RPC functions with locking |
| `src/utils/transactionHelpers.ts` | TypeScript wrappers for RPC calls |
| `docs/ATOMIC_TRANSACTIONS.md` | This documentation |

## 🔧 Implementation Details

### 1. Issue Transaction (FIFO)

**Function:** `create_issue_transaction()`

**Flow:**
1. Create transaction header
2. For each item:
   - Lock all available lots (`SELECT ... FOR UPDATE`)
   - Validate sufficient stock
   - Consume lots in FIFO order (oldest first)
   - Create transaction lines with actual lot costs
3. Return success or error

**Key Features:**
- ✅ Atomic operation (all-or-nothing)
- ✅ Row-level locking prevents concurrent modifications
- ✅ Accurate COGS (Cost of Goods Sold) using actual lot costs
- ✅ Detailed error messages with item codes

**Error Handling:**
```typescript
{
  success: false,
  error: "Insufficient stock for item ABC-123. Available: 5, Requested: 10",
  error_code: "INSUFFICIENT_STOCK"
}
```

### 2. Receive Transaction

**Function:** `create_receive_transaction()`

**Flow:**
1. Create transaction header
2. For each item:
   - Create new inventory lot with received cost
   - Auto-generate lot number if not provided
3. Return success

**Lot Number Format:** `LOT-YYYYMMDD-HHMMSS` (if not provided)

### 3. Backorder Transaction

**Function:** `create_backorder_transaction()`

**Flow:**
1. Create transaction header with `status = 'PENDING'`
2. Create transaction lines (no inventory changes)
3. Return success

**Note:** Backorders don't affect inventory until fulfilled.

### 4. Adjustment Transaction

**Function:** `create_adjustment_transaction()`

**Flow:**
1. Validate adjustment type (`INCREASE` or `DECREASE`)
2. For `INCREASE`: Create new lot
3. For `DECREASE`: Use FIFO to consume stock (with validation)
4. Return success

## 🚀 Usage Examples

### TypeScript (Client-Side)

```typescript
import { 
  createIssueTransaction,
  createReceiveTransaction,
  getAvailableStock 
} from '@/utils/transactionHelpers'

// Issue items to a department
const result = await createIssueTransaction(
  'dept-uuid-123',
  [
    { item_id: 'item-uuid-456', quantity: 10, unit_cost: 100 },
    { item_id: 'item-uuid-789', quantity: 5, unit_cost: 50 }
  ],
  'REQ-2024-001', // Reference number
  'Monthly supplies' // Notes
)

// Receive items (note: items parameter comes first)
const receiveResult = await createReceiveTransaction(
  [
    { item_id: 'item-uuid-456', quantity: 100, unit_cost: 95, lot_number: 'LOT-001' }
  ],
  'supplier-uuid-123', // Optional supplier ID
  'PO-2024-001', // Reference number
  'Bulk order' // Notes
)

if (result.success) {
  console.log('Transaction ID:', result.transaction_id)
} else {
  console.error('Error:', result.error)
  // Handle specific error codes
  if (result.error_code === 'INSUFFICIENT_STOCK') {
    // Show user-friendly message
  }
}

// Check available stock before issuing
const available = await getAvailableStock('item-uuid-456')
console.log(`Available: ${available} units`)
```

### SQL (Direct Call)

```sql
-- Issue transaction
SELECT create_issue_transaction(
  p_department_id := 'dept-uuid-123',
  p_items := '[
    {"item_id": "item-uuid-456", "quantity": 10, "unit_cost": 100}
  ]'::jsonb,
  p_reference_number := 'REQ-2024-001',
  p_notes := 'Monthly supplies'
);

-- Check available stock
SELECT get_available_stock('item-uuid-456');

-- Get stock summary
SELECT * FROM get_item_stock_summary('item-uuid-456');
```

## 🧪 Testing

### Unit Test Example

```typescript
describe('Atomic Transactions', () => {
  it('should prevent negative stock in concurrent issues', async () => {
    // Setup: Create item with 10 units
    const itemId = await createTestItem(10)
    
    // Attempt: Two concurrent issues of 10 units each
    const [result1, result2] = await Promise.all([
      createIssueTransaction(deptId, [{ item_id: itemId, quantity: 10, unit_cost: 100 }]),
      createIssueTransaction(deptId, [{ item_id: itemId, quantity: 10, unit_cost: 100 }])
    ])
    
    // Assert: One succeeds, one fails
    const succeeded = [result1, result2].filter(r => r.success).length
    const failed = [result1, result2].filter(r => !r.success).length
    
    expect(succeeded).toBe(1)
    expect(failed).toBe(1)
    expect(failed[0].error_code).toBe('INSUFFICIENT_STOCK')
    
    // Verify: Stock is exactly 0 (not negative)
    const stock = await getAvailableStock(itemId)
    expect(stock).toBe(0)
  })
})
```

### Manual Testing Steps

1. **Deploy Migration:**
   ```bash
   # In Supabase dashboard SQL editor
   # Run: supabase/migrations/20260216_atomic_transaction_functions.sql
   ```

2. **Test Concurrent Issues:**
   ```sql
   -- Terminal 1
   BEGIN;
   SELECT create_issue_transaction(...);
   -- Wait 5 seconds before COMMIT
   
   -- Terminal 2 (while Terminal 1 is waiting)
   SELECT create_issue_transaction(...);
   -- This will wait for Terminal 1's lock to release
   ```

3. **Verify FIFO:**
   ```sql
   -- Create 3 lots with different costs
   INSERT INTO inventory_lots (item_id, quantity, unit_cost, received_date) VALUES
     ('item-1', 10, 100, '2024-01-01'),
     ('item-1', 10, 120, '2024-01-02'),
     ('item-1', 10, 150, '2024-01-03');
   
   -- Issue 15 units
   SELECT create_issue_transaction(..., quantity := 15);
   
   -- Check transaction_lines
   SELECT * FROM transaction_lines WHERE transaction_id = ...;
   -- Should show: 10 units @ 100, 5 units @ 120 (FIFO order)
   ```

## 📊 Performance Considerations

### Row-Level Locking

- **Lock Scope:** Only locks rows being modified (not entire table)
- **Lock Duration:** Held only during transaction execution (~50-200ms)
- **Concurrency:** Multiple transactions can proceed if they touch different items

### Optimization Tips

1. **Keep transactions small:** Issue 1-10 items per transaction
2. **Batch operations:** Use single transaction for related items
3. **Monitor lock waits:** Check `pg_stat_activity` for blocked queries

```sql
-- Check for lock waits
SELECT 
  pid,
  usename,
  wait_event_type,
  wait_event,
  state,
  query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';
```

## 🔄 Migration from Old System

### Step 1: Deploy Migration

Run `20260216_atomic_transaction_functions.sql` in Supabase SQL editor.

### Step 2: Update Client Code

The TypeScript helpers are **backward compatible** (same function signatures), so no client code changes needed!

### Step 3: Verify

1. Test issue transactions
2. Check transaction_lines have correct costs
3. Verify no negative stock

### Step 4: Monitor

Watch for:
- Error logs with `error_code: 'INSUFFICIENT_STOCK'`
- Transaction performance (should be <200ms)
- Lock wait times (should be <100ms)

## 🐛 Troubleshooting

### Error: "Function does not exist"

**Cause:** Migration not deployed

**Fix:**
```sql
-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname LIKE 'create_%_transaction';

-- If empty, run migration
```

### Error: "Permission denied for function"

**Cause:** Missing GRANT statements

**Fix:**
```sql
GRANT EXECUTE ON FUNCTION create_issue_transaction TO authenticated;
-- Repeat for all functions
```

### Error: "Insufficient stock" (unexpected)

**Cause:** Inventory data mismatch

**Fix:**
```sql
-- Audit inventory
SELECT 
  i.item_code,
  get_available_stock(i.item_id) as available,
  (SELECT SUM(quantity) FROM inventory_lots WHERE item_id = i.item_id) as lots_total
FROM items i
WHERE get_available_stock(i.item_id) != 
      (SELECT COALESCE(SUM(quantity), 0) FROM inventory_lots WHERE item_id = i.item_id);
```

## 📈 Monitoring Queries

### Transaction Success Rate

```sql
SELECT 
  DATE(created_at) as date,
  transaction_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed
FROM transactions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), transaction_type
ORDER BY date DESC;
```

### Average Transaction Time

```sql
-- Requires pg_stat_statements extension
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%create_%_transaction%'
ORDER BY mean_exec_time DESC;
```

## 🎓 Best Practices

1. ✅ **Always check `result.success`** before proceeding
2. ✅ **Handle `INSUFFICIENT_STOCK` error** with user-friendly messages
3. ✅ **Use `getAvailableStock()`** for real-time stock checks
4. ✅ **Include reference numbers** for audit trails
5. ✅ **Add descriptive notes** to transactions
6. ❌ **Don't retry failed transactions** automatically (may cause duplicates)
7. ❌ **Don't bypass RPC functions** with direct table updates

## 📚 Additional Resources

- [Postgres Row-Level Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [FIFO Inventory Costing](https://www.investopedia.com/terms/f/fifo.asp)

---

**Last Updated:** 2026-02-16  
**Version:** 1.0  
**Author:** SSTH Inventory Development Team
