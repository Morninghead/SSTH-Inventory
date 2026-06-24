-- UPDATE ALL INVENTORY QUANTITIES TO 200 EACH
-- Run this script in Supabase SQL Editor to set all item quantities to 200

-- First, let's see how many items we have
SELECT COUNT(*) as total_items FROM items WHERE is_active = true;

-- Update existing inventory_status records to quantity = 200
UPDATE inventory_status
SET quantity = 200, updated_at = NOW()
WHERE item_id IN (
  SELECT item_id FROM items WHERE is_active = true
);

-- Create inventory_status records for any items that don't have one yet
INSERT INTO inventory_status (item_id, quantity, updated_at)
SELECT
  i.item_id,
  200 as quantity,
  NOW() as updated_at
FROM items i
LEFT JOIN inventory_status inv ON i.item_id = inv.item_id
WHERE i.is_active = true
  AND inv.item_id IS NULL;

-- Verify the results
SELECT
  i.item_code,
  i.description,
  COALESCE(inv.quantity, 0) as quantity,
  i.is_active
FROM items i
LEFT JOIN inventory_status inv ON i.item_id = inv.item_id
WHERE i.is_active = true
ORDER BY i.item_code
LIMIT 20; -- Show first 20 items as verification

-- Show summary statistics
SELECT
  COUNT(*) as total_active_items,
  COUNT(inv.item_id) as items_with_inventory,
  SUM(COALESCE(inv.quantity, 0)) as total_quantity
FROM items i
LEFT JOIN inventory_status inv ON i.item_id = inv.item_id
WHERE i.is_active = true;