-- Stock Counting Module Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

-- 1. Stock Count Header Table
CREATE TABLE IF NOT EXISTS stock_counts (
  count_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_type VARCHAR(20) NOT NULL CHECK (count_type IN ('EOM', 'CYCLE', 'ADHOC')),
  count_date DATE NOT NULL,
  period_month VARCHAR(10) NOT NULL, -- Format: '2025-11'
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'POSTED')),
  notes TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  completed_by UUID REFERENCES auth.users,
  posted_by UUID REFERENCES auth.users,
  posted_at TIMESTAMPTZ,
  total_items INTEGER DEFAULT 0,
  total_discrepancies DECIMAL(15,2) DEFAULT 0,
  total_variance_value DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stock Count Lines Table
CREATE TABLE IF NOT EXISTS stock_count_lines (
  line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID REFERENCES stock_counts(count_id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(item_id) NOT NULL,
  system_quantity DECIMAL(15,3) NOT NULL, -- From inventory_status
  counted_quantity DECIMAL(15,3),
  discrepancy DECIMAL(15,3) GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'MATCHED', 'DIFFERENCE', 'ADJUSTED')),
  row_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(count_id, item_id)
);

-- 3. Stock Count Adjustments Table
CREATE TABLE IF NOT EXISTS stock_count_adjustments (
  adjustment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID REFERENCES stock_counts(count_id) NOT NULL,
  item_id UUID REFERENCES items(item_id) NOT NULL,
  adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('WRITE_OFF', 'ADJUSTMENT')),
  system_quantity DECIMAL(15,3) NOT NULL,
  adjustment_quantity DECIMAL(15,3) NOT NULL,
  new_quantity DECIMAL(15,3) NOT NULL,
  reason TEXT NOT NULL,
  reference_no VARCHAR(50),
  transaction_id UUID REFERENCES transactions(transaction_id),
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_counts_period_month ON stock_counts(period_month);
CREATE INDEX IF NOT EXISTS idx_stock_counts_status ON stock_counts(status);
CREATE INDEX IF NOT EXISTS idx_stock_count_lines_count_id ON stock_count_lines(count_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_lines_item_id ON stock_count_lines(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_adjustments_count_id ON stock_count_adjustments(count_id);

-- Function to create stock count with all items
CREATE OR REPLACE FUNCTION create_stock_count(
  p_count_type VARCHAR(20),
  p_count_date DATE,
  p_period_month VARCHAR(10),
  p_created_by UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_count_id UUID;
BEGIN
  -- Check if EOM count already exists for this period
  IF p_count_type = 'EOM' THEN
    IF EXISTS (SELECT 1 FROM stock_counts WHERE count_type = 'EOM' AND period_month = p_period_month AND status != 'DRAFT') THEN
      RAISE EXCEPTION 'EOM stock count already exists for period %', p_period_month;
    END IF;
  END IF;

  -- Create stock count header
  INSERT INTO stock_counts (count_type, count_date, period_month, notes, created_by)
  VALUES (p_count_type, p_count_date, p_period_month, p_notes, p_created_by)
  RETURNING count_id INTO v_count_id;

  -- Create lines for all active items
  INSERT INTO stock_count_lines (count_id, item_id, system_quantity, row_number)
  SELECT
    v_count_id,
    i.item_id,
    COALESCE(isf.quantity, 0),
    ROW_NUMBER() OVER (ORDER BY i.item_code)
  FROM items i
  LEFT JOIN inventory_status isf ON i.item_id = isf.item_id
  WHERE i.is_active = true;

  -- Update total items count
  UPDATE stock_counts
  SET total_items = (SELECT COUNT(*) FROM stock_count_lines WHERE count_id = v_count_id)
  WHERE count_id = v_count_id;

  RETURN v_count_id;
END;
$$ LANGUAGE plpgsql;

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
  p_write_off_threshold DECIMAL(15,2) DEFAULT 5,
  p_posted_by UUID
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

-- Function to get stock counts with details
CREATE OR REPLACE FUNCTION get_stock_counts_paginated(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_search_term TEXT DEFAULT '',
  p_count_type TEXT DEFAULT '',
  p_status TEXT DEFAULT '',
  p_period_month TEXT DEFAULT ''
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'data', json_agg(
      json_build_object(
        'count_id', sc.count_id,
        'count_type', sc.count_type,
        'count_date', sc.count_date,
        'period_month', sc.period_month,
        'status', sc.status,
        'notes', sc.notes,
        'total_items', sc.total_items,
        'total_discrepancies', sc.total_discrepancies,
        'total_variance_value', sc.total_variance_value,
        'created_by', sc.created_by,
        'created_by_name', up.full_name,
        'completed_by', sc.completed_by,
        'completed_by_name', up_complete.full_name,
        'created_at', sc.created_at,
        'updated_at', sc.updated_at,
        'posted_at', sc.posted_at
      )
    ),
    'count', (SELECT COUNT(*) FROM stock_counts sc
              LEFT JOIN user_profiles up ON sc.created_by = up.id
              WHERE (p_search_term = '' OR sc.notes ILIKE '%' || p_search_term || '%')
                AND (p_count_type = '' OR sc.count_type = p_count_type)
                AND (p_status = '' OR sc.status = p_status)
                AND (p_period_month = '' OR sc.period_month = p_period_month))
  ) INTO v_result
  FROM stock_counts sc
  LEFT JOIN user_profiles up ON sc.created_by = up.id
  LEFT JOIN user_profiles up_complete ON sc.completed_by = up_complete.id
  WHERE (p_search_term = '' OR sc.notes ILIKE '%' || p_search_term || '%')
    AND (p_count_type = '' OR sc.count_type = p_count_type)
    AND (p_status = '' OR sc.status = p_status)
    AND (p_period_month = '' OR sc.period_month = p_period_month)
  ORDER BY sc.created_at DESC
  LIMIT p_limit OFFSET p_offset;

  RETURN COALESCE(v_result, json_build_object('data', json_build_array(), 'count', 0));
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security)
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_counts
CREATE POLICY "Users can view stock counts" ON stock_counts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert stock counts" ON stock_counts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

CREATE POLICY "Users can update stock counts" ON stock_counts
  FOR UPDATE USING (auth.role() = 'authenticated' AND created_by = auth.uid());

-- RLS Policies for stock_count_lines
CREATE POLICY "Users can view stock count lines" ON stock_count_lines
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update stock count lines" ON stock_count_lines
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    count_id IN (SELECT count_id FROM stock_counts WHERE created_by = auth.uid())
  );

-- RLS Policies for stock_count_adjustments
CREATE POLICY "Users can view stock count adjustments" ON stock_count_adjustments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert stock count adjustments" ON stock_count_adjustments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

COMMIT;