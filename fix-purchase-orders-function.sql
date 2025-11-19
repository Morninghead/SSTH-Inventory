-- =====================================================
-- FIX GET_PURCHASE_ORDERS FUNCTION
-- Removes reference to non-existent delivery_date column
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_purchase_orders;

-- Create corrected function with expected_date
CREATE OR REPLACE FUNCTION get_purchase_orders(
  p_status TEXT DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  po_id UUID,
  po_number TEXT,
  supplier_id UUID,
  supplier_name TEXT,
  po_date TIMESTAMPTZ,
  expected_date TIMESTAMPTZ,
  status TEXT,
  total_amount NUMERIC,
  line_count INT,
  created_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    po.po_id,
    po.po_number,
    po.supplier_id,
    s.supplier_name,
    po.po_date,
    po.expected_date,
    po.status,
    COALESCE(SUM(pol.line_total), 0) as total_amount,
    COUNT(pol.po_line_id)::INT as line_count,
    up.full_name as created_by_name
  FROM purchase_order po
  LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
  LEFT JOIN purchase_order_line pol ON po.po_id = pol.po_id
  LEFT JOIN user_profiles up ON po.created_by = up.id
  WHERE
    (p_status IS NULL OR po.status = p_status)
    AND (p_supplier_id IS NULL OR po.supplier_id = p_supplier_id)
    AND (p_date_from IS NULL OR po.po_date >= p_date_from)
    AND (p_date_to IS NULL OR po.po_date <= p_date_to)
  GROUP BY po.po_id, s.supplier_name, up.full_name
  ORDER BY po.po_date DESC
  LIMIT p_limit;
END;
$$;

-- Alternative simpler version using direct table joins
CREATE OR REPLACE FUNCTION get_purchase_orders_simple(
  p_status TEXT DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  po_id UUID,
  po_number TEXT,
  supplier_id UUID,
  supplier_name TEXT,
  po_date TIMESTAMPTZ,
  expected_date TIMESTAMPTZ,
  status TEXT,
  total_amount NUMERIC,
  line_count INT,
  created_by_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    po.po_id,
    po.po_number,
    po.supplier_id,
    COALESCE(s.supplier_name, 'Unknown') as supplier_name,
    po.po_date,
    po.expected_date,
    po.status,
    COALESCE(
      (SELECT SUM(line_total)
       FROM purchase_order_line
       WHERE po_id = po.po_id), 0
    ) as total_amount,
    COALESCE(
      (SELECT COUNT(*)
       FROM purchase_order_line
       WHERE po_id = po.po_id), 0
    )::INT as line_count,
    COALESCE(up.full_name, 'Unknown') as created_by_name
  FROM purchase_order po
  LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
  LEFT JOIN user_profiles up ON po.created_by = up.id
  WHERE
    (p_status IS NULL OR po.status = p_status)
    AND (p_supplier_id IS NULL OR po.supplier_id = p_supplier_id)
    AND (p_date_from IS NULL OR po.po_date >= p_date_from)
    AND (p_date_to IS NULL OR po.po_date <= p_date_to)
  ORDER BY po.po_date DESC
  LIMIT p_limit;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_purchase_orders TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_orders_simple TO authenticated;

-- Test the function
SELECT 'Testing get_purchase_orders_simple function...' as status;
SELECT * FROM get_purchase_orders_simple LIMIT 5;

SELECT 'Purchase order functions fixed successfully!' as completion_message;