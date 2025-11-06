-- =====================================================
-- TRANSACTION MANAGEMENT DATABASE FUNCTIONS
-- Run these in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- FUNCTION 1: Check Stock Availability
-- Returns current quantity for items
-- =====================================================

CREATE OR REPLACE FUNCTION check_stock_availability(
  item_ids UUID[]
)
RETURNS TABLE (
  item_id UUID,
  item_code TEXT,
  description TEXT,
  current_quantity NUMERIC,
  reorder_level NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.item_id,
    i.item_code,
    i.description,
    COALESCE(inv.quantity, 0) as current_quantity,
    i.reorder_level
  FROM items i
  LEFT JOIN inventory_status inv ON i.item_id = inv.item_id
  WHERE i.item_id = ANY(item_ids)
  AND i.is_active = true;
END;
$$;

-- =====================================================
-- FUNCTION 2: Update Inventory Quantity
-- Atomic update with transaction safety
-- =====================================================

CREATE OR REPLACE FUNCTION update_inventory_quantity(
  p_item_id UUID,
  p_quantity_change NUMERIC,
  p_transaction_type TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  new_quantity NUMERIC,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_quantity NUMERIC;
  v_new_quantity NUMERIC;
BEGIN
  -- Get current quantity
  SELECT COALESCE(quantity, 0) INTO v_current_quantity
  FROM inventory_status
  WHERE item_id = p_item_id;

  -- Calculate new quantity based on transaction type
  IF p_transaction_type = 'ISSUE' THEN
    v_new_quantity := v_current_quantity - p_quantity_change;
  ELSIF p_transaction_type = 'RECEIVE' THEN
    v_new_quantity := v_current_quantity + p_quantity_change;
  ELSIF p_transaction_type = 'ADJUSTMENT' THEN
    v_new_quantity := p_quantity_change; -- Direct set
  ELSE
    RETURN QUERY SELECT false, v_current_quantity, 'Invalid transaction type';
    RETURN;
  END IF;

  -- Check for negative quantity (only for ISSUE)
  IF p_transaction_type = 'ISSUE' AND v_new_quantity < 0 THEN
    RETURN QUERY SELECT false, v_current_quantity, 'Insufficient stock available';
    RETURN;
  END IF;

  -- Upsert inventory_status
  INSERT INTO inventory_status (item_id, quantity, updated_at)
  VALUES (p_item_id, v_new_quantity, now())
  ON CONFLICT (item_id)
  DO UPDATE SET
    quantity = v_new_quantity,
    updated_at = now();

  RETURN QUERY SELECT true, v_new_quantity, 'Quantity updated successfully';
END;
$$;

-- =====================================================
-- FUNCTION 3: Process Complete Transaction
-- Handles transaction + line items + inventory updates
-- =====================================================

CREATE OR REPLACE FUNCTION process_transaction(
  p_transaction_type TEXT,
  p_department_id UUID DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  transaction_id UUID,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_item JSONB;
  v_update_result RECORD;
BEGIN
  -- Create transaction header
  INSERT INTO transactions (
    transaction_type,
    transaction_date,
    department_id,
    supplier_id,
    reference_no,
    notes,
    status,
    created_by
  )
  VALUES (
    p_transaction_type,
    now(),
    p_department_id,
    p_supplier_id,
    p_reference_number,
    p_notes,
    'COMPLETED',
    p_created_by
  )
  RETURNING transactions.transaction_id INTO v_transaction_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert transaction line
    INSERT INTO transaction_lines (
      transaction_id,
      item_id,
      quantity,
      unit_cost,
      notes
    )
    VALUES (
      v_transaction_id,
      (v_item->>'item_id')::UUID,
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'unit_cost')::NUMERIC,
      v_item->>'notes'
    );

    -- Update inventory
    SELECT * INTO v_update_result
    FROM update_inventory_quantity(
      (v_item->>'item_id')::UUID,
      (v_item->>'quantity')::NUMERIC,
      p_transaction_type
    );

    -- Check if inventory update failed
    IF NOT v_update_result.success THEN
      RAISE EXCEPTION 'Inventory update failed: %', v_update_result.message;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_transaction_id, true, 'Transaction processed successfully';

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::UUID, false, SQLERRM;
END;
$$;

-- =====================================================
-- FUNCTION 4: Get Transaction History with Details
-- Returns transactions with line items and item details
-- =====================================================

CREATE OR REPLACE FUNCTION get_transaction_history(
  p_transaction_type TEXT DEFAULT NULL,
  p_department_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  transaction_id UUID,
  transaction_type TEXT,
  transaction_date TIMESTAMPTZ,
  department_name TEXT,
  supplier_name TEXT,
  reference_no TEXT,
  notes TEXT,
  status TEXT,
  created_by_name TEXT,
  line_items JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.transaction_id,
    t.transaction_type,
    t.transaction_date,
    d.dept_name,
    s.supplier_name,
    t.reference_no,
    t.notes,
    t.status,
    up.full_name as created_by_name,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'item_code', i.item_code,
          'description', i.description,
          'quantity', tl.quantity,
          'unit_cost', tl.unit_cost,
          'line_total', tl.line_total,
          'notes', tl.notes
        )
      )
      FROM transaction_lines tl
      JOIN items i ON tl.item_id = i.item_id
      WHERE tl.transaction_id = t.transaction_id
    ) as line_items
  FROM transactions t
  LEFT JOIN departments d ON t.department_id = d.dept_id
  LEFT JOIN suppliers s ON t.supplier_id = s.supplier_id
  LEFT JOIN user_profiles up ON t.created_by = up.id
  WHERE
    (p_transaction_type IS NULL OR t.transaction_type = p_transaction_type)
    AND (p_department_id IS NULL OR t.department_id = p_department_id)
    AND (p_date_from IS NULL OR t.transaction_date >= p_date_from)
    AND (p_date_to IS NULL OR t.transaction_date <= p_date_to)
  ORDER BY t.transaction_date DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Transaction management functions created successfully!' as status;
SELECT 'Functions created: check_stock_availability, update_inventory_quantity, process_transaction, get_transaction_history' as info;
