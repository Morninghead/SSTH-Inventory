-- Deploy Stock Count Schema
-- This migration adds support for stock counting functionality

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