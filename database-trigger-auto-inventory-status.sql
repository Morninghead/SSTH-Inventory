-- =====================================================
-- AUTO-CREATE INVENTORY STATUS TRIGGER
-- Fixes race condition in item creation
-- =====================================================

-- This trigger automatically creates an inventory_status record
-- whenever a new item is inserted, eliminating the race condition
-- where an item could exist without an inventory_status record.

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_auto_create_inventory_status ON items;
DROP FUNCTION IF EXISTS fn_auto_create_inventory_status();

-- Create trigger function
CREATE OR REPLACE FUNCTION fn_auto_create_inventory_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert inventory_status record for new item
  -- Use INSERT ... ON CONFLICT DO NOTHING to handle edge cases
  INSERT INTO inventory_status (
    item_id,
    quantity,
    location_id,
    updated_at
  )
  VALUES (
    NEW.item_id,
    0,  -- Start with zero quantity
    NULL,  -- No specific location initially
    now()
  )
  ON CONFLICT (item_id) DO NOTHING;  -- Skip if somehow already exists

  RETURN NEW;
END;
$$;

-- Create trigger on items table
CREATE TRIGGER trg_auto_create_inventory_status
  AFTER INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_create_inventory_status();

-- Add comment for documentation
COMMENT ON FUNCTION fn_auto_create_inventory_status() IS
  'Automatically creates inventory_status record when new item is inserted. Prevents race conditions.';

COMMENT ON TRIGGER trg_auto_create_inventory_status ON items IS
  'Auto-creates inventory_status for new items to prevent orphaned records.';

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Trigger created successfully! New items will automatically get inventory_status records.' as status;

-- Test the trigger (optional - uncomment to test)
-- DO $$
-- DECLARE
--   test_item_id UUID;
--   test_status_exists BOOLEAN;
-- BEGIN
--   -- Create a test item
--   INSERT INTO items (item_code, description, base_uom, is_active)
--   VALUES ('TEST-TRIGGER-001', 'Test Item for Trigger', 'PCS', true)
--   RETURNING item_id INTO test_item_id;
--
--   -- Check if inventory_status was auto-created
--   SELECT EXISTS(SELECT 1 FROM inventory_status WHERE item_id = test_item_id)
--   INTO test_status_exists;
--
--   IF test_status_exists THEN
--     RAISE NOTICE 'SUCCESS: Trigger created inventory_status automatically';
--   ELSE
--     RAISE EXCEPTION 'FAILED: Trigger did not create inventory_status';
--   END IF;
--
--   -- Clean up test data
--   DELETE FROM inventory_status WHERE item_id = test_item_id;
--   DELETE FROM items WHERE item_id = test_item_id;
-- END $$;
