-- =====================================================
-- ATOMIC TRANSACTION FUNCTIONS WITH ROW-LEVEL LOCKING
-- =====================================================
-- Created: 2026-02-16
-- Purpose: Prevent race conditions in concurrent transactions
-- Uses: SELECT ... FOR UPDATE to lock rows during transactions

-- =====================================================
-- 1. ISSUE TRANSACTION (FIFO with Stock Validation)
-- =====================================================
CREATE OR REPLACE FUNCTION create_issue_transaction(
  p_department_id UUID,
  p_items JSONB, -- Array of {item_id, quantity, notes}
  p_reference_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_item JSONB;
  v_item_id UUID;
  v_requested_qty DECIMAL(10, 2);
  v_remaining_qty DECIMAL(10, 2);
  v_lot RECORD;
  v_qty_to_take DECIMAL(10, 2);
  v_total_available DECIMAL(10, 2);
  v_item_code TEXT;
  v_result JSONB;
BEGIN
  -- Create transaction header
  INSERT INTO transactions (
    transaction_type,
    transaction_date,
    department_id,
    reference_number,
    notes,
    status,
    created_by
  ) VALUES (
    'ISSUE',
    NOW(),
    p_department_id,
    p_reference_number,
    p_notes,
    'COMPLETED',
    COALESCE(p_created_by, auth.uid(), (SELECT id FROM user_profiles LIMIT 1))
  )
  RETURNING transaction_id INTO v_transaction_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (v_item->>'item_id')::UUID;
    v_requested_qty := (v_item->>'quantity')::DECIMAL(10, 2);
    v_remaining_qty := v_requested_qty;

    -- Get item code for error messages
    SELECT item_code INTO v_item_code FROM items WHERE item_id = v_item_id;

    SELECT COALESCE(SUM(quantity), 0) INTO v_total_available
    FROM (
      SELECT quantity FROM inventory_lots
      WHERE item_id = v_item_id AND quantity > 0
      FOR UPDATE
    ) locked_lots; -- CRITICAL: Lock these rows first

    -- Validate sufficient stock
    IF v_total_available < v_requested_qty THEN
      RAISE EXCEPTION 'Insufficient stock for item %. Available: %, Requested: %',
        v_item_code, v_total_available, v_requested_qty
        USING ERRCODE = 'P0001'; -- Custom error code for stock shortage
    END IF;

    -- Consume lots in FIFO order (oldest first)
    FOR v_lot IN
      SELECT lot_id, quantity, unit_cost, lot_number
      FROM inventory_lots
      WHERE item_id = v_item_id AND quantity > 0
      ORDER BY received_date ASC, lot_id ASC -- FIFO: Oldest first
      FOR UPDATE -- Lock each lot as we process it
    LOOP
      EXIT WHEN v_remaining_qty <= 0;

      -- Calculate how much to take from this lot
      v_qty_to_take := LEAST(v_lot.quantity, v_remaining_qty);

      -- Update lot quantity
      UPDATE inventory_lots
      SET 
        quantity = quantity - v_qty_to_take,
        updated_at = NOW()
      WHERE lot_id = v_lot.lot_id;

      -- Create transaction line with actual lot cost
      INSERT INTO transaction_lines (
        transaction_id,
        item_id,
        quantity,
        unit_cost,
        notes
      ) VALUES (
        v_transaction_id,
        v_item_id,
        v_qty_to_take,
        v_lot.unit_cost, -- Use actual lot cost for accurate COGS
        COALESCE(v_item->>'notes', 'Lot: ' || COALESCE(v_lot.lot_number, 'N/A'))
      );

      v_remaining_qty := v_remaining_qty - v_qty_to_take;
    END LOOP;

    -- Safety check: ensure all quantity was consumed
    IF v_remaining_qty > 0.001 THEN -- Allow tiny floating point errors
      RAISE EXCEPTION 'Failed to consume all quantity for item %. Remaining: %',
        v_item_code, v_remaining_qty;
    END IF;
  END LOOP;

  -- Return success with transaction ID
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'message', 'Issue transaction completed successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN SQLSTATE 'P0001' THEN
    -- Stock shortage error
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', 'INSUFFICIENT_STOCK'
    );
  WHEN OTHERS THEN
    -- Other errors
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- =====================================================
-- 2. RECEIVE TRANSACTION (Creates New Lots)
-- =====================================================
CREATE OR REPLACE FUNCTION create_receive_transaction(
  p_items JSONB, -- Array of {item_id, quantity, unit_cost, lot_number, notes}
  p_supplier_id UUID DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_item JSONB;
  v_item_id UUID;
  v_quantity DECIMAL(10, 2);
  v_unit_cost DECIMAL(10, 2);
  v_lot_number TEXT;
  v_result JSONB;
BEGIN
  -- Create transaction header
  INSERT INTO transactions (
    transaction_type,
    transaction_date,
    department_id,
    supplier_id,
    reference_number,
    notes,
    status,
    created_by
  ) VALUES (
    'RECEIVE',
    NOW(),
    NULL, -- Receiving doesn't need a department
    p_supplier_id,
    p_reference_number,
    p_notes,
    'COMPLETED',
    COALESCE(p_created_by, auth.uid(), (SELECT id FROM user_profiles LIMIT 1))
  )
  RETURNING transaction_id INTO v_transaction_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (v_item->>'item_id')::UUID;
    v_quantity := (v_item->>'quantity')::DECIMAL(10, 2);
    v_unit_cost := (v_item->>'unit_cost')::DECIMAL(10, 2);
    v_lot_number := v_item->>'lot_number';

    -- Create new inventory lot
    INSERT INTO inventory_lots (
      item_id,
      quantity,
      unit_cost,
      lot_number,
      received_date
    ) VALUES (
      v_item_id,
      v_quantity,
      v_unit_cost,
      COALESCE(v_lot_number, 'LOT-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS')),
      NOW()
    );

    -- Create transaction line
    INSERT INTO transaction_lines (
      transaction_id,
      item_id,
      quantity,
      unit_cost,
      notes
    ) VALUES (
      v_transaction_id,
      v_item_id,
      v_quantity,
      v_unit_cost,
      v_item->>'notes'
    );
  END LOOP;

  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'message', 'Receive transaction completed successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- =====================================================
-- 3. BACKORDER TRANSACTION (No Stock Changes)
-- =====================================================
CREATE OR REPLACE FUNCTION create_backorder_transaction(
  p_department_id UUID,
  p_items JSONB, -- Array of {item_id, quantity, unit_cost, notes}
  p_reference_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_item JSONB;
  v_result JSONB;
BEGIN
  -- Create transaction header
  INSERT INTO transactions (
    transaction_type,
    transaction_date,
    department_id,
    reference_number,
    notes,
    status,
    created_by
  ) VALUES (
    'BACKORDER',
    NOW(),
    p_department_id,
    p_reference_number,
    p_notes,
    'PENDING', -- Backorders start as pending
    COALESCE(p_created_by, auth.uid(), (SELECT id FROM user_profiles LIMIT 1))
  )
  RETURNING transaction_id INTO v_transaction_id;

  -- Process each item (no inventory changes)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO transaction_lines (
      transaction_id,
      item_id,
      quantity,
      unit_cost,
      notes
    ) VALUES (
      v_transaction_id,
      (v_item->>'item_id')::UUID,
      (v_item->>'quantity')::DECIMAL(10, 2),
      (v_item->>'unit_cost')::DECIMAL(10, 2),
      v_item->>'notes'
    );
  END LOOP;

  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'message', 'Backorder created successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- =====================================================
-- 4. ADJUSTMENT TRANSACTION (Increase/Decrease Stock)
-- =====================================================
CREATE OR REPLACE FUNCTION create_adjustment_transaction(
  p_items JSONB, -- Array of {item_id, quantity, unit_cost, notes}
  p_adjustment_type TEXT, -- 'INCREASE' or 'DECREASE'
  p_reference_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_item JSONB;
  v_item_id UUID;
  v_quantity DECIMAL(10, 2);
  v_unit_cost DECIMAL(10, 2);
  v_total_available DECIMAL(10, 2);
  v_item_code TEXT;
  v_result JSONB;
BEGIN
  -- Validate adjustment type
  IF p_adjustment_type NOT IN ('INCREASE', 'DECREASE') THEN
    RAISE EXCEPTION 'Invalid adjustment type: %. Must be INCREASE or DECREASE', p_adjustment_type;
  END IF;

  -- Create transaction header
  INSERT INTO transactions (
    transaction_type,
    transaction_date,
    reference_number,
    notes,
    status,
    created_by
  ) VALUES (
    'ADJUSTMENT',
    NOW(),
    p_reference_number,
    p_adjustment_type || ': ' || COALESCE(p_notes, ''),
    'COMPLETED',
    COALESCE(p_created_by, auth.uid(), (SELECT id FROM user_profiles LIMIT 1))
  )
  RETURNING transaction_id INTO v_transaction_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (v_item->>'item_id')::UUID;
    v_quantity := (v_item->>'quantity')::DECIMAL(10, 2);
    v_unit_cost := (v_item->>'unit_cost')::DECIMAL(10, 2);

    IF p_adjustment_type = 'INCREASE' THEN
      -- Create new lot for increase
      INSERT INTO inventory_lots (
        item_id,
        quantity,
        unit_cost,
        lot_number,
        received_date
      ) VALUES (
        v_item_id,
        v_quantity,
        v_unit_cost,
        'ADJ-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
        NOW()
      );
    ELSE
      -- DECREASE: Use FIFO to consume stock
      SELECT item_code INTO v_item_code FROM items WHERE item_id = v_item_id;
      
      -- Check available stock
      SELECT COALESCE(SUM(quantity), 0) INTO v_total_available
      FROM (
        SELECT quantity FROM inventory_lots
        WHERE item_id = v_item_id AND quantity > 0
        FOR UPDATE
      ) locked_lots;

      IF v_total_available < v_quantity THEN
        RAISE EXCEPTION 'Cannot decrease %. Available: %, Requested: %',
          v_item_code, v_total_available, v_quantity
          USING ERRCODE = 'P0001';
      END IF;

      -- Consume lots (similar to ISSUE logic)
      DECLARE
        v_remaining_qty DECIMAL(10, 2) := v_quantity;
        v_lot RECORD;
        v_qty_to_take DECIMAL(10, 2);
      BEGIN
        FOR v_lot IN
          SELECT lot_id, quantity, unit_cost
          FROM inventory_lots
          WHERE item_id = v_item_id AND quantity > 0
          ORDER BY received_date ASC
          FOR UPDATE
        LOOP
          EXIT WHEN v_remaining_qty <= 0;

          v_qty_to_take := LEAST(v_lot.quantity, v_remaining_qty);

          UPDATE inventory_lots
          SET quantity = quantity - v_qty_to_take, updated_at = NOW()
          WHERE lot_id = v_lot.lot_id;

          v_remaining_qty := v_remaining_qty - v_qty_to_take;
        END LOOP;
      END;
    END IF;

    -- Create transaction line
    INSERT INTO transaction_lines (
      transaction_id,
      item_id,
      quantity,
      unit_cost,
      notes
    ) VALUES (
      v_transaction_id,
      v_item_id,
      v_quantity,
      v_unit_cost,
      v_item->>'notes'
    );
  END LOOP;

  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'message', 'Adjustment completed successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN SQLSTATE 'P0001' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', 'INSUFFICIENT_STOCK'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- =====================================================
-- 5. HELPER FUNCTION: Get Available Stock (Real-time)
-- =====================================================
CREATE OR REPLACE FUNCTION get_available_stock(p_item_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(quantity), 0)
  FROM inventory_lots
  WHERE item_id = p_item_id AND quantity > 0;
$$;

-- =====================================================
-- 6. HELPER FUNCTION: Get Item Stock Summary
-- =====================================================
CREATE OR REPLACE FUNCTION get_item_stock_summary(p_item_id UUID)
RETURNS TABLE(
  total_quantity DECIMAL(10, 2),
  total_value DECIMAL(10, 2),
  weighted_avg_cost DECIMAL(10, 2),
  lot_count INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COALESCE(SUM(quantity), 0) as total_quantity,
    COALESCE(SUM(quantity * unit_cost), 0) as total_value,
    CASE 
      WHEN SUM(quantity) > 0 THEN SUM(quantity * unit_cost) / SUM(quantity)
      ELSE 0
    END as weighted_avg_cost,
    COUNT(*)::INTEGER as lot_count
  FROM inventory_lots
  WHERE item_id = p_item_id AND quantity > 0;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Allow authenticated users to execute these functions
GRANT EXECUTE ON FUNCTION create_issue_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION create_receive_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION create_backorder_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION create_adjustment_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_stock TO authenticated;
GRANT EXECUTE ON FUNCTION get_item_stock_summary TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION create_issue_transaction IS 'Atomically creates an issue transaction with FIFO stock consumption and row-level locking to prevent race conditions';
COMMENT ON FUNCTION create_receive_transaction IS 'Atomically creates a receive transaction and adds new inventory lots';
COMMENT ON FUNCTION create_backorder_transaction IS 'Creates a backorder transaction without affecting inventory';
COMMENT ON FUNCTION create_adjustment_transaction IS 'Atomically adjusts inventory levels (increase or decrease) with FIFO for decreases';
COMMENT ON FUNCTION get_available_stock IS 'Returns real-time available stock for an item';
COMMENT ON FUNCTION get_item_stock_summary IS 'Returns comprehensive stock summary including weighted average cost';
