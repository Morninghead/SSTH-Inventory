-- Backorder Verification Script
-- Run this to verify backorder functionality and create test data

-- 1. Check if backorders table exists and structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'backorders'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check existing backorders
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
    b.created_at,
    b.updated_at
FROM backorders b
JOIN items i ON b.item_id = i.item_id
JOIN departments d ON b.department_id = d.dept_id
ORDER BY b.created_at DESC;

-- 3. Create test backorder data (if needed)
-- Uncomment and run this if you want to create test backorders

-- INSERT INTO backorders (
--     backorder_id,
--     item_id,
--     department_id,
--     quantity,
--     status,
--     notes,
--     created_at,
--     updated_at
-- )
-- SELECT
--     gen_random_uuid() as backorder_id,
--     item_id,
--     'd3a8c8d8-9e4a-4d6a-9b2c-8e7d6f1a2b3c' as department_id, -- Replace with actual department_id
--     50 as quantity,
--     'PENDING' as status,
--     'Test backorder created from manual script' as notes,
--     NOW() as created_at,
--     NOW() as updated_at
-- FROM items
-- WHERE item_code = 'CL-RG-001'
-- LIMIT 1;

-- 4. Check items with low stock that might need backorders
SELECT
    i.item_code,
    i.description,
    COALESCE(SUM(inv.quantity), 0) as current_stock,
    i.reorder_level,
    CASE
        WHEN COALESCE(SUM(inv.quantity), 0) < COALESCE(i.reorder_level, 0) THEN 'Below Reorder Level'
        WHEN COALESCE(SUM(inv.quantity), 0) = 0 THEN 'Out of Stock'
        ELSE 'Sufficient Stock'
    END as stock_status
FROM items i
LEFT JOIN inventory_status inv ON i.item_id = inv.item_id
GROUP BY i.item_id, i.description, i.reorder_level
HAVING COALESCE(SUM(inv.quantity), 0) <= COALESCE(i.reorder_level, 0)
ORDER BY current_stock ASC;

-- 5. Recent transactions that might have created backorders
SELECT
    t.transaction_id,
    t.transaction_type,
    t.reference_number,
    t.department_id,
    d.dept_name,
    t.created_at,
    COUNT(tl.item_id) as item_count,
    SUM(tl.quantity) as total_quantity
FROM transactions t
JOIN transaction_lines tl ON t.transaction_id = tl.transaction_id
JOIN departments d ON t.department_id = d.dept_id
WHERE t.transaction_type = 'ISSUE'
    AND t.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY t.transaction_id, t.transaction_type, t.reference_number, t.department_id, d.dept_name, t.created_at
ORDER BY t.created_at DESC;

-- 6. Check planning integration points
-- This shows how backorders could be used in planning calculations

SELECT
    'Total Pending Backorders' as metric,
    COUNT(*)::text as value,
    'items' as unit
FROM backorders
WHERE status = 'PENDING'

UNION ALL

SELECT
    'Total Backorder Quantity' as metric,
    SUM(quantity)::text as value,
    'units' as unit
FROM backorders
WHERE status = 'PENDING'

UNION ALL

SELECT
    'Departments with Backorders' as metric,
    COUNT(DISTINCT department_id)::text as value,
    'departments' as unit
FROM backorders
WHERE status = 'PENDING'

UNION ALL

SELECT
    'Backorders by Department: ' || dept_name as metric,
    COUNT(*)::text as value,
    'backorders' as unit
FROM backorders b
JOIN departments d ON b.department_id = d.dept_id
WHERE b.status = 'PENDING'
GROUP BY dept_name;