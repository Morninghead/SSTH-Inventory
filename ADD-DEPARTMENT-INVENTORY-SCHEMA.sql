-- Migration to split inventory_status by department

-- 1. Create a temporary table to store existing inventory data
CREATE TEMP TABLE temp_inventory AS SELECT * FROM inventory_status;

-- 2. Drop the existing inventory_status table (since we need to change PK constraints)
DROP TABLE inventory_status;

-- 3. Re-create inventory_status table with department_id and composite PK
CREATE TABLE inventory_status (
    item_id UUID NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    dept_id UUID NOT NULL REFERENCES departments(dept_id) ON DELETE CASCADE,
    quantity NUMERIC(10,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (item_id, dept_id)
);

-- 4. Re-enable RLS
ALTER TABLE inventory_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access on inventory_status for all authenticated users"
    ON inventory_status FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow write/modify access on inventory_status for all authenticated users"
    ON inventory_status FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 5. Restore existing data to a default department (Material department)
DO $$
DECLARE
    default_dept_id UUID;
BEGIN
    -- Try to find 'Material' department
    SELECT dept_id INTO default_dept_id FROM departments WHERE dept_code = 'MATERIAL' LIMIT 1;
    
    -- Fallback to any department if 'MATERIAL' not found
    IF default_dept_id IS NULL THEN
        SELECT dept_id INTO default_dept_id FROM departments WHERE is_active = true LIMIT 1;
    END IF;

    -- If there's still no department, create one
    IF default_dept_id IS NULL THEN
        INSERT INTO departments (dept_code, dept_name)
        VALUES ('MATERIAL', 'Material Department')
        RETURNING dept_id INTO default_dept_id;
    END IF;

    -- Insert existing inventory mapping to this default department
    INSERT INTO inventory_status (item_id, dept_id, quantity, updated_at)
    SELECT item_id, default_dept_id, quantity, updated_at FROM temp_inventory;
END $$;

-- 6. Deploy updated database functions (with department support)
CREATE OR REPLACE FUNCTION update_inventory_quantity(
  p_item_id UUID,
  p_department_id UUID,
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
  -- Validate department
  IF p_department_id IS NULL THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 'Department ID is required';
    RETURN;
  END IF;

  -- Get current quantity
  SELECT COALESCE(quantity, 0) INTO v_current_quantity
  FROM inventory_status
  WHERE item_id = p_item_id AND dept_id = p_department_id;

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
  INSERT INTO inventory_status (item_id, dept_id, quantity, updated_at)
  VALUES (p_item_id, p_department_id, v_new_quantity, now())
  ON CONFLICT (item_id, dept_id)
  DO UPDATE SET
    quantity = v_new_quantity,
    updated_at = now();

  RETURN QUERY SELECT true, v_new_quantity, 'Quantity updated successfully';
END;
$$;

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
      p_department_id,
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
