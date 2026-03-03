-- Function to update count line with physical count
CREATE OR REPLACE FUNCTION update_stock_count_line(
  p_line_id UUID,
  p_counted_quantity DECIMAL(15,3),
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_discrepancy DECIMAL(15,3);
  v_system_quantity DECIMAL(15,3);
BEGIN
  -- Get current system quantity
  SELECT system_quantity INTO v_system_quantity
  FROM stock_count_lines
  WHERE line_id = p_line_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock count line not found';
  END IF;

  -- Calculate discrepancy
  v_discrepancy := p_counted_quantity - v_system_quantity;

  -- Update the line
  UPDATE stock_count_lines
  SET counted_quantity = p_counted_quantity,
      notes = p_notes,
      status = CASE
        WHEN p_counted_quantity = v_system_quantity THEN 'MATCHED'
        WHEN ABS(v_discrepancy) > 0 THEN 'DIFFERENCE'
        ELSE 'MATCHED'
      END,
      updated_at = NOW()
  WHERE line_id = p_line_id;

  -- Update parent count statistics
  UPDATE stock_counts sc
  SET
    total_discrepancies = (
      SELECT COUNT(*)
      FROM stock_count_lines scl
      WHERE scl.count_id = sc.count_id
        AND scl.status = 'DIFFERENCE'
    ),
    total_variance_value = (
      SELECT SUM(ABS(scl.discrepancy) * i.unit_cost)
      FROM stock_count_lines scl
      JOIN items i ON scl.item_id = i.item_id
      WHERE scl.count_id = sc.count_id
        AND scl.discrepancy IS NOT NULL
    )
  WHERE sc.count_id = (SELECT count_id FROM stock_count_lines WHERE line_id = p_line_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to post stock count and create adjustments
CREATE OR REPLACE FUNCTION post_stock_count(
  p_count_id UUID,
  p_posted_by UUID,
  p_write_off_threshold DECIMAL(15,2) DEFAULT 5
) RETURNS VOID AS $$
DECLARE
  v_count_date DATE;
  v_period_month VARCHAR(10);
  v_reference_no VARCHAR(50);
  v_transaction_id UUID;
  v_adjustment_count INTEGER := 0;
BEGIN
  -- Get stock count info
  SELECT count_date, period_month INTO v_count_date, v_period_month
  FROM stock_counts
  WHERE count_id = p_count_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock count not found';
  END IF;

  -- Generate reference number
  v_reference_no := 'ADJ-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MI');

  -- Create adjustment transaction header
  INSERT INTO transactions (
    transaction_type,
    transaction_date,
    reference_number,
    status,
    notes,
    created_by
  ) VALUES (
    'ADJUSTMENT',
    NOW(),
    v_reference_no,
    'COMPLETED',
    'Stock count adjustments for period ' || v_period_month,
    p_posted_by
  ) RETURNING transaction_id INTO v_transaction_id;

  -- Process small discrepancies (write-offs)
  INSERT INTO stock_count_adjustments (count_id, item_id, adjustment_type, system_quantity, adjustment_quantity, new_quantity, reason, reference_no, transaction_id, created_by)
  SELECT
    p_count_id,
    item_id,
    'WRITE_OFF',
    system_quantity,
    discrepancy,
    counted_quantity,
    'Auto write-off - small difference (<=' || p_write_off_threshold || ')',
    v_reference_no,
    v_transaction_id,
    p_posted_by
  FROM stock_count_lines
  WHERE count_id = p_count_id
    AND discrepancy IS NOT NULL
    AND ABS(discrepancy) <= p_write_off_threshold
    AND discrepancy != 0;

  -- Get count of write-offs
  SELECT COUNT(*) INTO v_adjustment_count
  FROM stock_count_adjustments
  WHERE count_id = p_count_id AND adjustment_type = 'WRITE_OFF';

  -- Create transaction lines for write-offs
  INSERT INTO transaction_lines (transaction_id, item_id, quantity, unit_cost, notes)
  SELECT
    v_transaction_id,
    item_id,
    discrepancy,
    (SELECT unit_cost FROM items WHERE item_id = scl.item_id),
    'Write-off from stock count ' || p_count_id
  FROM stock_count_lines scl
  WHERE scl.count_id = p_count_id
    AND scl.discrepancy IS NOT NULL
    AND ABS(scl.discrepancy) <= p_write_off_threshold
    AND scl.discrepancy != 0;

  -- Update inventory_status for write-offs
  UPDATE inventory_status
  SET quantity = scl.counted_quantity
  FROM stock_count_lines scl
  WHERE inventory_status.item_id = scl.item_id
    AND scl.count_id = p_count_id
    AND scl.discrepancy IS NOT NULL
    AND ABS(scl.discrepancy) <= p_write_off_threshold;

  -- Update line statuses
  UPDATE stock_count_lines
  SET status = CASE
    WHEN discrepancy IS NULL OR discrepancy = 0 THEN 'MATCHED'
    WHEN ABS(discrepancy) <= p_write_off_threshold THEN 'ADJUSTED'
    ELSE 'DIFFERENCE'
  END
  WHERE count_id = p_count_id;

  -- Update stock count status
  UPDATE stock_counts
  SET status = 'POSTED',
      completed_by = p_posted_by,
      posted_by = p_posted_by,
      posted_at = NOW()
  WHERE count_id = p_count_id;

  -- Log to audit
  INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id)
  SELECT
    'POST',
    'stock_counts',
    p_count_id,
    json_build_object('status', 'COMPLETED'),
    json_build_object('status', 'POSTED', 'adjustments_created', v_adjustment_count),
    p_posted_by;
END;
$$ LANGUAGE plpgsql;
