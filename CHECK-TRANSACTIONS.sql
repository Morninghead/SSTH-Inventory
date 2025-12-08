-- Check existing transactions and departments
-- Run this in Supabase SQL Editor to see what data exists

-- Check departments
SELECT
    dept_code,
    dept_name,
    is_active,
    created_at
FROM departments
ORDER BY dept_name;

-- Check if there are any transactions
SELECT
    COUNT(*) as total_transactions,
    transaction_type,
    MIN(transaction_date) as earliest_date,
    MAX(transaction_date) as latest_date
FROM transactions
GROUP BY transaction_type;

-- Check recent ISSUE transactions with department details
SELECT
    t.transaction_id,
    t.transaction_date,
    t.transaction_type,
    d.dept_code,
    d.dept_name,
    COUNT(tl.line_id) as line_count,
    SUM(tl.quantity) as total_quantity,
    SUM(tl.line_total) as total_value
FROM transactions t
LEFT JOIN departments d ON t.department_id = d.dept_id
LEFT JOIN transaction_lines tl ON t.transaction_id = tl.transaction_id
WHERE t.transaction_type = 'ISSUE'
    AND t.transaction_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY t.transaction_id, t.transaction_date, t.transaction_type, d.dept_code, d.dept_name
ORDER BY t.transaction_date DESC
LIMIT 10;

-- Check departments with no transactions
SELECT
    d.dept_code,
    d.dept_name,
    d.is_active,
    COUNT(t.transaction_id) as transaction_count
FROM departments d
LEFT JOIN transactions t ON d.dept_id = t.department_id
WHERE d.is_active = true
GROUP BY d.dept_id, d.dept_code, d.dept_name, d.is_active
ORDER BY transaction_count DESC;