-- =====================================================
-- PURCHASE ORDER MANAGEMENT DATABASE FUNCTIONS
-- Run these in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- FUNCTION 1: Create Purchase Order with Line Items
-- Creates PO header and line items in one transaction
-- =====================================================

CREATE OR REPLACE FUNCTION create_purchase_order(
  p_supplier_id UUID,
  p_po_date TIMESTAMPTZ,
  p_delivery_date TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  po_id UUID,
  po_number TEXT,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
  v_po_number TEXT;
  v_item JSONB;
  v_line_number INT := 1;
BEGIN
  -- Generate PO number (format: PO-YYYYMMDD-XXX)
  SELECT 'PO-' || TO_CHAR(p_po_date, 'YYYYMMDD') || '-' ||
         LPAD((COUNT(*) + 1)::TEXT, 3, '0')
  INTO v_po_number
  FROM purchase_order
  WHERE DATE(po_date) = DATE(p_po_date);

  -- Create PO header
  INSERT INTO purchase_order (
    po_number,
    supplier_id,
    po_date,
    delivery_date,
    notes,
    status,
    created_by,
    created_at
  )
  VALUES (
    v_po_number,
    p_supplier_id,
    p_po_date,
    p_delivery_date,
    p_notes,
    'DRAFT',
    p_created_by,
    now()
  )
  RETURNING purchase_order.po_id INTO v_po_id;

  -- Create PO line items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO purchase_order_line (
      po_id,
      line_number,
      item_id,
      quantity,
      unit_cost,
      notes
    )
    VALUES (
      v_po_id,
      v_line_number,
      (v_item->>'item_id')::UUID,
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'unit_cost')::NUMERIC,
      v_item->>'notes'
    );

    v_line_number := v_line_number + 1;
  END LOOP;

  RETURN QUERY SELECT v_po_id, v_po_number, true, 'Purchase order created successfully';

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, SQLERRM;
END;
$$;

-- =====================================================
-- FUNCTION 2: Update Purchase Order Status
-- Updates PO status with validation
-- =====================================================

CREATE OR REPLACE FUNCTION update_po_status(
  p_po_id UUID,
  p_new_status TEXT,
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status
  FROM purchase_order
  WHERE po_id = p_po_id;

  IF v_current_status IS NULL THEN
    RETURN QUERY SELECT false, 'Purchase order not found';
    RETURN;
  END IF;

  -- Validate status transitions
  IF v_current_status = 'CANCELLED' THEN
    RETURN QUERY SELECT false, 'Cannot update cancelled purchase order';
    RETURN;
  END IF;

  IF v_current_status = 'RECEIVED' AND p_new_status != 'CANCELLED' THEN
    RETURN QUERY SELECT false, 'Cannot update received purchase order';
    RETURN;
  END IF;

  -- Update status
  UPDATE purchase_order
  SET
    status = p_new_status,
    updated_at = now()
  WHERE po_id = p_po_id;

  RETURN QUERY SELECT true, 'Status updated successfully';

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$;

-- =====================================================
-- FUNCTION 3: Get Purchase Order with Details
-- Returns PO with line items, supplier, and item details
-- =====================================================

CREATE OR REPLACE FUNCTION get_purchase_order_details(
  p_po_id UUID
)
RETURNS TABLE (
  po_id UUID,
  po_number TEXT,
  supplier_id UUID,
  supplier_name TEXT,
  po_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  notes TEXT,
  status TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ,
  line_items JSONB
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
    po.delivery_date,
    po.notes,
    po.status,
    po.created_by,
    up.full_name as created_by_name,
    po.created_at,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'line_number', pol.line_number,
          'item_id', pol.item_id,
          'item_code', i.item_code,
          'description', i.description,
          'quantity', pol.quantity,
          'unit_cost', pol.unit_cost,
          'line_total', pol.line_total,
          'notes', pol.notes
        )
        ORDER BY pol.line_number
      )
      FROM purchase_order_line pol
      JOIN items i ON pol.item_id = i.item_id
      WHERE pol.po_id = po.po_id
    ) as line_items
  FROM purchase_order po
  LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
  LEFT JOIN user_profiles up ON po.created_by = up.id
  WHERE po.po_id = p_po_id;
END;
$$;

-- =====================================================
-- FUNCTION 4: Get Purchase Order List with Filters
-- Returns filtered list of purchase orders
-- =====================================================

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
  delivery_date TIMESTAMPTZ,
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
    po.delivery_date,
    po.status,
    COALESCE(SUM(pol.line_total), 0) as total_amount,
    COUNT(pol.pol_id)::INT as line_count,
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

-- =====================================================
-- FUNCTION 5: Delete/Cancel Purchase Order
-- Soft delete by setting status to CANCELLED
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_purchase_order(
  p_po_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_cancelled_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status
  FROM purchase_order
  WHERE po_id = p_po_id;

  IF v_current_status IS NULL THEN
    RETURN QUERY SELECT false, 'Purchase order not found';
    RETURN;
  END IF;

  -- Cannot cancel received orders
  IF v_current_status = 'RECEIVED' THEN
    RETURN QUERY SELECT false, 'Cannot cancel received purchase order';
    RETURN;
  END IF;

  -- Update to cancelled
  UPDATE purchase_order
  SET
    status = 'CANCELLED',
    notes = COALESCE(notes || E'\n\n', '') ||
            'CANCELLED: ' || COALESCE(p_reason, 'No reason provided'),
    updated_at = now()
  WHERE po_id = p_po_id;

  RETURN QUERY SELECT true, 'Purchase order cancelled successfully';

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$;

-- =====================================================
-- FUNCTION 6: Update Purchase Order Line Items
-- Updates existing PO line items
-- =====================================================

CREATE OR REPLACE FUNCTION update_po_line_items(
  p_po_id UUID,
  p_items JSONB,
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
  v_item JSONB;
  v_line_number INT := 1;
BEGIN
  -- Check if PO can be edited
  SELECT status INTO v_status
  FROM purchase_order
  WHERE po_id = p_po_id;

  IF v_status IS NULL THEN
    RETURN QUERY SELECT false, 'Purchase order not found';
    RETURN;
  END IF;

  IF v_status NOT IN ('DRAFT', 'SUBMITTED') THEN
    RETURN QUERY SELECT false, 'Cannot edit purchase order in ' || v_status || ' status';
    RETURN;
  END IF;

  -- Delete existing line items
  DELETE FROM purchase_order_line WHERE po_id = p_po_id;

  -- Insert new line items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO purchase_order_line (
      po_id,
      line_number,
      item_id,
      quantity,
      unit_cost,
      notes
    )
    VALUES (
      p_po_id,
      v_line_number,
      (v_item->>'item_id')::UUID,
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'unit_cost')::NUMERIC,
      v_item->>'notes'
    );

    v_line_number := v_line_number + 1;
  END LOOP;

  -- Update PO timestamp
  UPDATE purchase_order
  SET updated_at = now()
  WHERE po_id = p_po_id;

  RETURN QUERY SELECT true, 'Line items updated successfully';

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Purchase order management functions created successfully!' as status;
SELECT 'Functions created: create_purchase_order, update_po_status, get_purchase_order_details, get_purchase_orders, cancel_purchase_order, update_po_line_items' as info;
