-- Migration: Advanced Costing Support (FIFO Default, LIFO, AVGW)
-- This script transforms the inventory system to support multiple costing methods with FIFO as the default.

-- 1. Enable Enum for Costing Methods
DO $$ BEGIN
    CREATE TYPE costing_method_type AS ENUM ('FIFO', 'LIFO', 'AVGW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update Items Table (Add Costing Method and Average Cost)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS costing_method costing_method_type DEFAULT 'FIFO',
ADD COLUMN IF NOT EXISTS average_cost DECIMAL(10, 2) DEFAULT 0;

-- 3. Create Inventory Lots Table (The source of truth for quantity and cost)
CREATE TABLE IF NOT EXISTS inventory_lots (
    lot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    original_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0, -- To track history of the lot
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Cost at receipt
    lot_number VARCHAR(100), -- Optional supplier lot no.
    po_number VARCHAR(100), -- Purchase Order reference (primary FIFO key if lot_number is missing)
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.1 Index for FIFO/LIFO performance
CREATE INDEX IF NOT EXISTS idx_inventory_lots_item_date ON inventory_lots (item_id, received_date ASC);

-- 4. Replace 'inventory_status' Table with a View (Aggregate)
-- This ensures existing Frontend "Read" queries still work without changes.

-- First, back up data if needed (Skipping for this scenario)
-- Handle both View and Table scenarios
DROP VIEW IF EXISTS inventory_status CASCADE;
DROP TABLE IF EXISTS inventory_status CASCADE;

-- Create the view that mimics the old table structure
CREATE OR REPLACE VIEW inventory_status AS
SELECT
    item_id,
    SUM(quantity) as quantity,
    -- Calculate a weighted average cost dynamically for the view
    CASE 
        WHEN SUM(quantity) > 0 THEN SUM(quantity * unit_cost) / SUM(quantity)
        ELSE 0
    END as average_unit_cost
FROM inventory_lots
GROUP BY item_id;

-- 5. Create Helper Function to Update Calculations
CREATE OR REPLACE FUNCTION update_item_average_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the average_cost in items table whenever a lot is added/updated
    UPDATE items
    SET average_cost = COALESCE((
        SELECT SUM(quantity * unit_cost) / NULLIF(SUM(quantity), 0)
        FROM inventory_lots
        WHERE item_id = NEW.item_id AND quantity > 0
    ), 0)
    WHERE item_id = NEW.item_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_avg_cost ON inventory_lots;

CREATE TRIGGER trigger_update_avg_cost
AFTER INSERT OR UPDATE ON inventory_lots
FOR EACH ROW EXECUTE FUNCTION update_item_average_cost();
