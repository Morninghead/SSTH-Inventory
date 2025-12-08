-- Test script to check backorder functionality
-- Run this to see if backorders are being created correctly

-- 1. Check current backorders
SELECT
    b.backorder_id,
    b.item_id,
    i.item_code,
    i.description,
    b.department_id,
    d.dept_name,
    b.quantity,
    b.status,
    b.notes,
    b.created_at
FROM backorders b
JOIN items i ON b.item_id = i.item_id
JOIN departments d ON b.department_id = d.dept_id
ORDER BY b.created_at DESC;

-- 2. Check current inventory status for items that might have backorders
SELECT
    i.item_code,
    i.description,
    COALESCE(SUM(inv.quantity), 0) as total_stock
FROM items i
LEFT JOIN inventory_status inv ON i.item_id = inv.item_id
WHERE i.is_active = true
GROUP BY i.item_id, i.description
HAVING COALESCE(SUM(inv.quantity), 0) = 0 OR COALESCE(SUM(inv.quantity), 0) < 100
ORDER BY i.item_code;

-- 3. Check recent transactions that might have created backorders
SELECT
    t.transaction_id,
    t.transaction_type,
    t.department_id,
    d.dept_name,
    t.reference_no,
    t.created_at,
    tl.item_id,
    i.item_code,
    i.description,
    tl.quantity
FROM transactions t
JOIN transaction_lines tl ON t.transaction_id = tl.transaction_id
JOIN items i ON tl.item_id = i.item_id
JOIN departments d ON t.department_id = d.dept_id
WHERE t.transaction_type = 'ISSUE'
    AND t.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY t.created_at DESC;