-- Generate sample transaction data for testing department withdrawal reports
-- This script creates sample ISSUE transactions over the past 6 months

-- First, let's check if we have departments and items
-- (Run in Supabase SQL Editor)

-- Generate sample ISSUE transactions for the last 6 months
WITH sample_dates AS (
  SELECT
    generate_series(
      DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
      CURRENT_DATE,
      INTERVAL '1 day'
    )::date as transaction_date
),
departments AS (
  SELECT dept_id, dept_name FROM departments WHERE is_active = true LIMIT 5
),
items AS (
  SELECT item_id, item_code, description, unit_cost FROM items WHERE is_active = true LIMIT 20
),
sample_transactions AS (
  SELECT
    row_number() OVER (ORDER BY random()) as transaction_id,
    (SELECT dept_id FROM departments ORDER BY random() LIMIT 1) as department_id,
    sd.transaction_date,
    'ISSUE' as transaction_type,
    (SELECT auth.users.id FROM auth.users WHERE email = 'nopanat.aplus@gmail.com' LIMIT 1) as created_by
  FROM sample_dates sd
  CROSS JOIN (SELECT generate_series(1, 3) as dummy) t -- 3 transactions per day on average
  WHERE random() > 0.3 -- 70% chance of transaction on any given day
  LIMIT 300 -- Generate 300 sample transactions
),
sample_transaction_lines AS (
  SELECT
    st.transaction_id,
    (SELECT item_id FROM items ORDER BY random() LIMIT 1) as item_id,
    floor(random() * 10 + 1) as quantity, -- Random quantity between 1-10
    (SELECT unit_cost FROM items WHERE item_id = (SELECT item_id FROM items ORDER BY random() LIMIT 1) LIMIT 1) as unit_cost
  FROM sample_transactions st
  CROSS JOIN (SELECT generate_series(1, floor(random() * 3 + 1)) as line_num) t -- 1-3 line items per transaction
)

-- Insert transactions
INSERT INTO transactions (
  transaction_id,
  transaction_type,
  transaction_date,
  department_id,
  created_by,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as transaction_id,
  transaction_type,
  transaction_date,
  department_id,
  created_by,
  NOW() as created_at,
  NOW() as updated_at
FROM sample_transactions
ON CONFLICT DO NOTHING;

-- Get the inserted transaction IDs and insert transaction lines
INSERT INTO transaction_lines (
  line_id,
  transaction_id,
  item_id,
  quantity,
  unit_cost,
  line_total,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as line_id,
  (SELECT transaction_id FROM transactions ORDER BY created_at DESC LIMIT 1 OFFSET (row_number() OVER (ORDER BY random()) - 1)) as transaction_id,
  item_id,
  quantity,
  unit_cost,
  quantity * unit_cost as line_total,
  NOW() as created_at,
  NOW() as updated_at
FROM sample_transaction_lines
ON CONFLICT DO NOTHING;

-- Update the created_at timestamps for transactions to match their transaction_date
UPDATE transactions
SET created_at = transaction_date
WHERE transaction_type = 'ISSUE' AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months';

-- Verify the data was inserted
SELECT
  COUNT(*) as total_transactions,
  COUNT(DISTINCT department_id) as departments_used,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM transactions
WHERE transaction_type = 'ISSUE' AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months';