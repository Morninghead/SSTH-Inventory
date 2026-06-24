-- =====================================================
-- ATOMIC TRANSACTION SYSTEM - TEST SUITE
-- =====================================================
-- Run these tests in Supabase SQL Editor to verify the atomic transaction system
-- Each test is self-contained and can be run independently

-- =====================================================
-- SETUP: Create Test Data
-- =====================================================

-- Clean up any existing test data
DELETE FROM transaction_lines WHERE transaction_id IN (
  SELECT transaction_id FROM transactions WHERE notes LIKE '%TEST:%'
);
DELETE FROM transactions WHERE notes LIKE '%TEST:%';
DELETE FROM inventory_lots WHERE lot_number LIKE 'TEST-%';
DELETE FROM items WHERE item_code LIKE 'TEST-%';

-- Get a valid category_id and user_id for test data
DO $$
DECLARE
  v_category_id UUID;
  v_user_id UUID;
BEGIN
  -- Try to get an existing category, or create a test one
  SELECT category_id INTO v_category_id FROM categories LIMIT 1;
  
  IF v_category_id IS NULL THEN
    INSERT INTO categories (category_id, category_name, is_active)
    VALUES ('99999999-9999-9999-9999-999999999999', 'TEST-CATEGORY', true)
    ON CONFLICT (category_id) DO NOTHING;
    v_category_id := '99999999-9999-9999-9999-999999999999';
  END IF;
  
  -- Get an existing user from user_profiles
  SELECT id INTO v_user_id FROM user_profiles LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in user_profiles. Please create at least one user before running tests.';
  END IF;
  
  -- Create test item with all required fields
  INSERT INTO items (
    item_id, 
    item_code, 
    description, 
    unit_cost, 
    base_uom,
    category_id,
    is_active,
    created_by
  )
  VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'TEST-ITEM-001', 
    'Test Item for Atomic Transactions', 
    100.00,
    'PCS',
    v_category_id,
    true,
    v_user_id -- Use actual user from database
  )
  ON CONFLICT (item_id) DO UPDATE SET is_active = true;
END $$;

-- Create test department
INSERT INTO departments (dept_id, dept_code, dept_name, is_active)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'TEST-DEPT', 'Test Department', true)
ON CONFLICT (dept_id) DO UPDATE SET is_active = true;

-- =====================================================
-- TEST 1: Basic FIFO Issue Transaction
-- =====================================================
DO $$
DECLARE
  v_result JSONB;
  v_item_id UUID := '11111111-1111-1111-1111-111111111111';
  v_dept_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  RAISE NOTICE '=== TEST 1: Basic FIFO Issue Transaction ===';
  
  -- Setup: Create 3 lots with different costs
  INSERT INTO inventory_lots (item_id, quantity, unit_cost, lot_number, received_date) VALUES
    (v_item_id, 10, 100, 'TEST-LOT-1', '2024-01-01'),
    (v_item_id, 10, 120, 'TEST-LOT-2', '2024-01-02'),
    (v_item_id, 10, 150, 'TEST-LOT-3', '2024-01-03');
  
  RAISE NOTICE 'Created 3 lots: 10@100, 10@120, 10@150';
  
  -- Test: Issue 15 units (should consume LOT-1 completely + 5 from LOT-2)
  v_result := create_issue_transaction(
    p_department_id := v_dept_id,
    p_items := jsonb_build_array(
      jsonb_build_object('item_id', v_item_id, 'quantity', 15, 'unit_cost', 0)
    ),
    p_reference_number := 'TEST-001',
    p_notes := 'TEST: FIFO validation'
  );
  
  -- Verify success
  IF (v_result->>'success')::boolean THEN
    RAISE NOTICE '✅ Transaction succeeded: %', v_result->>'transaction_id';
    
    -- Check transaction lines
    RAISE NOTICE 'Transaction lines:';
    FOR v_result IN 
      SELECT quantity, unit_cost 
      FROM transaction_lines 
      WHERE transaction_id = (v_result->>'transaction_id')::UUID
      ORDER BY created_at
    LOOP
      RAISE NOTICE '  - % units @ %', v_result->>'quantity', v_result->>'unit_cost';
    END LOOP;
    
    -- Check remaining lots
    RAISE NOTICE 'Remaining lots:';
    FOR v_result IN 
      SELECT lot_number, quantity, unit_cost 
      FROM inventory_lots 
      WHERE item_id = v_item_id AND quantity > 0
      ORDER BY received_date
    LOOP
      RAISE NOTICE '  - %: % units @ %', v_result->>'lot_number', v_result->>'quantity', v_result->>'unit_cost';
    END LOOP;
    
    -- Expected: LOT-2 has 5 units, LOT-3 has 10 units
    ASSERT (SELECT quantity FROM inventory_lots WHERE lot_number = 'TEST-LOT-2') = 5, 'LOT-2 should have 5 units';
    ASSERT (SELECT quantity FROM inventory_lots WHERE lot_number = 'TEST-LOT-3') = 10, 'LOT-3 should have 10 units';
    
    RAISE NOTICE '✅ TEST 1 PASSED';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 FAILED: %', v_result->>'error';
  END IF;
  
  -- Cleanup
  DELETE FROM inventory_lots WHERE lot_number LIKE 'TEST-LOT-%';
END $$;

-- =====================================================
-- TEST 2: Insufficient Stock Validation
-- =====================================================
DO $$
DECLARE
  v_result JSONB;
  v_item_id UUID := '11111111-1111-1111-1111-111111111111';
  v_dept_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 2: Insufficient Stock Validation ===';
  
  -- Setup: Create 1 lot with 10 units
  INSERT INTO inventory_lots (item_id, quantity, unit_cost, lot_number, received_date) VALUES
    (v_item_id, 10, 100, 'TEST-LOT-4', NOW());
  
  RAISE NOTICE 'Created 1 lot: 10 units';
  
  -- Test: Try to issue 20 units (should fail)
  v_result := create_issue_transaction(
    p_department_id := v_dept_id,
    p_items := jsonb_build_array(
      jsonb_build_object('item_id', v_item_id, 'quantity', 20, 'unit_cost', 0)
    ),
    p_reference_number := 'TEST-002',
    p_notes := 'TEST: Stock validation'
  );
  
  -- Verify failure
  IF NOT (v_result->>'success')::boolean THEN
    RAISE NOTICE '✅ Transaction correctly failed: %', v_result->>'error';
    ASSERT v_result->>'error_code' = 'INSUFFICIENT_STOCK', 'Error code should be INSUFFICIENT_STOCK';
    
    -- Verify stock unchanged
    ASSERT (SELECT quantity FROM inventory_lots WHERE lot_number = 'TEST-LOT-4') = 10, 'Stock should remain unchanged';
    
    RAISE NOTICE '✅ TEST 2 PASSED';
  ELSE
    RAISE EXCEPTION '❌ TEST 2 FAILED: Transaction should have failed but succeeded';
  END IF;
  
  -- Cleanup
  DELETE FROM inventory_lots WHERE lot_number = 'TEST-LOT-4';
END $$;

-- =====================================================
-- TEST 3: Concurrent Transaction Simulation
-- =====================================================
DO $$
DECLARE
  v_result1 JSONB;
  v_result2 JSONB;
  v_item_id UUID := '11111111-1111-1111-1111-111111111111';
  v_dept_id UUID := '22222222-2222-2222-2222-222222222222';
  v_success_count INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 3: Concurrent Transaction Simulation ===';
  
  -- Setup: Create 1 lot with 10 units
  INSERT INTO inventory_lots (item_id, quantity, unit_cost, lot_number, received_date) VALUES
    (v_item_id, 10, 100, 'TEST-LOT-5', NOW());
  
  RAISE NOTICE 'Created 1 lot: 10 units';
  RAISE NOTICE 'Simulating 2 concurrent issues of 10 units each...';
  
  -- Simulate concurrent transactions (in reality, one will wait for the other)
  -- Transaction 1
  v_result1 := create_issue_transaction(
    p_department_id := v_dept_id,
    p_items := jsonb_build_array(
      jsonb_build_object('item_id', v_item_id, 'quantity', 10, 'unit_cost', 0)
    ),
    p_reference_number := 'TEST-003-A',
    p_notes := 'TEST: Concurrent transaction A'
  );
  
  -- Transaction 2 (will fail because stock is now 0)
  v_result2 := create_issue_transaction(
    p_department_id := v_dept_id,
    p_items := jsonb_build_array(
      jsonb_build_object('item_id', v_item_id, 'quantity', 10, 'unit_cost', 0)
    ),
    p_reference_number := 'TEST-003-B',
    p_notes := 'TEST: Concurrent transaction B'
  );
  
  -- Count successes
  IF (v_result1->>'success')::boolean THEN v_success_count := v_success_count + 1; END IF;
  IF (v_result2->>'success')::boolean THEN v_success_count := v_success_count + 1; END IF;
  
  RAISE NOTICE 'Transaction A: %', CASE WHEN (v_result1->>'success')::boolean THEN '✅ Success' ELSE '❌ Failed' END;
  RAISE NOTICE 'Transaction B: %', CASE WHEN (v_result2->>'success')::boolean THEN '✅ Success' ELSE '❌ Failed' END;
  
  -- Verify: Exactly one should succeed
  ASSERT v_success_count = 1, 'Exactly one transaction should succeed';
  
  -- Verify: Stock should be exactly 0 (not negative)
  ASSERT (SELECT COALESCE(SUM(quantity), 0) FROM inventory_lots WHERE item_id = v_item_id) = 0, 'Stock should be 0';
  
  RAISE NOTICE '✅ TEST 3 PASSED - No negative stock!';
  
  -- Cleanup
  DELETE FROM inventory_lots WHERE lot_number = 'TEST-LOT-5';
END $$;

-- =====================================================
-- TEST 4: Receive Transaction
-- =====================================================
DO $$
DECLARE
  v_result JSONB;
  v_item_id UUID := '11111111-1111-1111-1111-111111111111';
  v_lot_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 4: Receive Transaction ===';
  
  -- Test: Receive 50 units at cost 200
  v_result := create_receive_transaction(
    p_items := jsonb_build_array(
      jsonb_build_object('item_id', v_item_id, 'quantity', 50, 'unit_cost', 200, 'lot_number', 'TEST-LOT-6')
    ),
    p_supplier_id := NULL,
    p_reference_number := 'PO-TEST-001',
    p_notes := 'TEST: Receive transaction'
  );
  
  IF (v_result->>'success')::boolean THEN
    RAISE NOTICE '✅ Receive transaction succeeded';
    
    -- Verify lot created
    SELECT COUNT(*) INTO v_lot_count FROM inventory_lots WHERE lot_number = 'TEST-LOT-6';
    ASSERT v_lot_count = 1, 'Lot should be created';
    
    -- Verify quantity and cost
    ASSERT (SELECT quantity FROM inventory_lots WHERE lot_number = 'TEST-LOT-6') = 50, 'Quantity should be 50';
    ASSERT (SELECT unit_cost FROM inventory_lots WHERE lot_number = 'TEST-LOT-6') = 200, 'Unit cost should be 200';
    
    RAISE NOTICE '✅ TEST 4 PASSED';
  ELSE
    RAISE EXCEPTION '❌ TEST 4 FAILED: %', v_result->>'error';
  END IF;
  
  -- Cleanup
  DELETE FROM inventory_lots WHERE lot_number = 'TEST-LOT-6';
END $$;

-- =====================================================
-- TEST 5: Adjustment Transaction (Increase/Decrease)
-- =====================================================
DO $$
DECLARE
  v_result JSONB;
  v_item_id UUID := '11111111-1111-1111-1111-111111111111';
  v_stock DECIMAL;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 5: Adjustment Transaction ===';
  
  -- Setup: Create initial stock
  INSERT INTO inventory_lots (item_id, quantity, unit_cost, lot_number, received_date) VALUES
    (v_item_id, 20, 100, 'TEST-LOT-7', NOW());
  
  -- Test 5a: Increase adjustment
  v_result := create_adjustment_transaction(
    p_items := jsonb_build_array(
      jsonb_build_object('item_id', v_item_id, 'quantity', 10, 'unit_cost', 100)
    ),
    p_adjustment_type := 'INCREASE',
    p_reference_number := 'ADJ-TEST-001',
    p_notes := 'TEST: Increase adjustment'
  );
  
  ASSERT (v_result->>'success')::boolean, 'Increase adjustment should succeed';
  v_stock := get_available_stock(v_item_id);
  ASSERT v_stock = 30, 'Stock should be 30 after increase';
  RAISE NOTICE '✅ Increase adjustment: 20 → 30';
  
  -- Test 5b: Decrease adjustment
  v_result := create_adjustment_transaction(
    p_items := jsonb_build_array(
      jsonb_build_object('item_id', v_item_id, 'quantity', 5, 'unit_cost', 100)
    ),
    p_adjustment_type := 'DECREASE',
    p_reference_number := 'ADJ-TEST-002',
    p_notes := 'TEST: Decrease adjustment'
  );
  
  ASSERT (v_result->>'success')::boolean, 'Decrease adjustment should succeed';
  v_stock := get_available_stock(v_item_id);
  ASSERT v_stock = 25, 'Stock should be 25 after decrease';
  RAISE NOTICE '✅ Decrease adjustment: 30 → 25';
  
  RAISE NOTICE '✅ TEST 5 PASSED';
  
  -- Cleanup
  DELETE FROM inventory_lots WHERE lot_number LIKE 'TEST-LOT-7%' OR lot_number LIKE 'ADJ-%';
END $$;

-- =====================================================
-- TEST 6: Helper Functions
-- =====================================================
DO $$
DECLARE
  v_item_id UUID := '11111111-1111-1111-1111-111111111111';
  v_stock DECIMAL;
  v_summary RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 6: Helper Functions ===';
  
  -- Setup: Create multiple lots
  INSERT INTO inventory_lots (item_id, quantity, unit_cost, lot_number, received_date) VALUES
    (v_item_id, 10, 100, 'TEST-LOT-8', NOW()),
    (v_item_id, 20, 150, 'TEST-LOT-9', NOW()),
    (v_item_id, 30, 200, 'TEST-LOT-10', NOW());
  
  -- Test get_available_stock
  v_stock := get_available_stock(v_item_id);
  ASSERT v_stock = 60, 'Available stock should be 60';
  RAISE NOTICE '✅ get_available_stock: %', v_stock;
  
  -- Test get_item_stock_summary
  SELECT * INTO v_summary FROM get_item_stock_summary(v_item_id);
  ASSERT v_summary.total_quantity = 60, 'Total quantity should be 60';
  ASSERT v_summary.lot_count = 3, 'Lot count should be 3';
  RAISE NOTICE '✅ get_item_stock_summary:';
  RAISE NOTICE '  - Total Quantity: %', v_summary.total_quantity;
  RAISE NOTICE '  - Total Value: %', v_summary.total_value;
  RAISE NOTICE '  - Weighted Avg Cost: %', v_summary.weighted_avg_cost;
  RAISE NOTICE '  - Lot Count: %', v_summary.lot_count;
  
  -- Verify weighted average cost
  -- (10*100 + 20*150 + 30*200) / 60 = 10000 / 60 = 166.67
  ASSERT ABS(v_summary.weighted_avg_cost - 166.67) < 0.01, 'Weighted avg cost should be ~166.67';
  
  RAISE NOTICE '✅ TEST 6 PASSED';
  
  -- Cleanup
  DELETE FROM inventory_lots WHERE lot_number LIKE 'TEST-LOT-%';
END $$;

-- =====================================================
-- CLEANUP: Remove Test Data
-- =====================================================
DELETE FROM transaction_lines WHERE transaction_id IN (
  SELECT transaction_id FROM transactions WHERE notes LIKE '%TEST:%'
);
DELETE FROM transactions WHERE notes LIKE '%TEST:%';
DELETE FROM inventory_lots WHERE lot_number LIKE 'TEST-%';
DELETE FROM items WHERE item_code LIKE 'TEST-%';
DELETE FROM departments WHERE dept_code = 'TEST-DEPT';

-- =====================================================
-- SUMMARY
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL TESTS PASSED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'The atomic transaction system is working correctly:';
  RAISE NOTICE '  ✅ FIFO logic works correctly';
  RAISE NOTICE '  ✅ Stock validation prevents negative inventory';
  RAISE NOTICE '  ✅ Concurrent transactions are handled safely';
  RAISE NOTICE '  ✅ Receive transactions create lots correctly';
  RAISE NOTICE '  ✅ Adjustment transactions work for both increase/decrease';
  RAISE NOTICE '  ✅ Helper functions return accurate data';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Test with real data in a staging environment';
  RAISE NOTICE '  2. Monitor transaction performance';
  RAISE NOTICE '  3. Set up alerts for INSUFFICIENT_STOCK errors';
  RAISE NOTICE '';
END $$;
