-- Check existing issue transactions in the database
SELECT
    t.transaction_id,
    t.transaction_type,
    t.reference_number,
    t.created_at,
    d.dept_name,
    COUNT(tl.transaction_line_id) as item_count
FROM transactions t
LEFT JOIN departments d ON t.department_id = d.dept_id
LEFT JOIN transaction_lines tl ON t.transaction_id = tl.transaction_id
WHERE t.transaction_type = 'ISSUE'
AND t.created_at >= '2025-11-01'
AND t.created_at <= '2025-11-30'
GROUP BY t.transaction_id, t.transaction_type, t.reference_number, t.created_at, d.dept_name
ORDER BY t.created_at DESC;

-- Check what items are in these issue transactions
SELECT
    i.description,
    i.item_code,
    SUM(tl.quantity) as total_quantity,
    i.unit_cost,
    SUM(tl.quantity * i.unit_cost) as total_value
FROM transaction_lines tl
JOIN transactions t ON tl.transaction_id = t.transaction_id
JOIN items i ON tl.item_id = i.item_id
WHERE t.transaction_type = 'ISSUE'
AND t.created_at >= '2025-11-01'
AND t.created_at <= '2025-11-30'
GROUP BY i.item_id, i.description, i.item_code, i.unit_cost
ORDER BY total_quantity DESC
LIMIT 10;