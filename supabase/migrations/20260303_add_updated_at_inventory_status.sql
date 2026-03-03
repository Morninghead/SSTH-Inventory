-- Fix for `inventory_status` being an aggregate view, not a table.
-- This script does the following:
-- 1. Drops the obsolete trigger that tries to INSERT into the view when a new item is created.
-- 2. Re-creates the `inventory_status` view using a LEFT JOIN to ensure ALL items always appear logically with 0 stock (meaning NO manual insertion is needed for new items!).
-- 3. Adds `updated_at` to the view calculation.

-- 1. Drop obsolete triggers preventing item creation
DROP TRIGGER IF EXISTS trg_auto_create_inventory_status ON items;
DROP FUNCTION IF EXISTS fn_auto_create_inventory_status();

-- 2. Ensure updated_at exists on inventory_lots (since we need it for the view)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'inventory_lots'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE inventory_lots ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Re-create the view to automatically include new items and 'updated_at'
CREATE OR REPLACE VIEW inventory_status AS
SELECT
    i.item_id,
    COALESCE(SUM(l.quantity), 0) as quantity,
    CASE 
        WHEN SUM(l.quantity) > 0 THEN SUM(l.quantity * l.unit_cost) / SUM(l.quantity)
        ELSE 0
    END as average_unit_cost,
    MAX(l.updated_at) as updated_at
FROM items i
LEFT JOIN inventory_lots l ON i.item_id = l.item_id
GROUP BY i.item_id;
