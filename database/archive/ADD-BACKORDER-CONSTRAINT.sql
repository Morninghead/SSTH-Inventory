-- Add BACKORDER to transactions transaction_type check constraint
-- This allows BACKORDER as a valid transaction type alongside ISSUE, RECEIVE, ADJUSTMENT

-- First, drop the existing check constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

-- Then add the new check constraint that includes BACKORDER
ALTER TABLE transactions
ADD CONSTRAINT transactions_transaction_type_check
CHECK (transaction_type IN ('ISSUE', 'RECEIVE', 'ADJUSTMENT', 'BACKORDER'));

-- Verify the constraint was added correctly
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.transactions'::regclass
  AND contype = 'c'
  AND conname = 'transactions_transaction_type_check';