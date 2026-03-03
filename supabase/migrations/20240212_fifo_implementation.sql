-- FIFO Cost Implementation
-- Drop and recreate the inventory_status view/table to support lot tracking

-- 1. Backup existing data
-- (Assuming inventory_status is currently just quantity, we might lose detailed lot history if we don't handle it, but for a fresh start, we can clear it)
-- TRUNCATE inventory_status; -- CAREFUL: This deletes all stock!

-- 2. Modify inventory_status structure (if it's a table)
-- If it's a view, drop it first. Assuming it's a table based on usage.
DROP TABLE IF EXISTS inventory_status CASCADE;

CREATE TABLE inventory_status (
    inventory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Cost of this specific lot
    lot_number VARCHAR(100), -- Optional
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Critical for FIFO
    location_id UUID REFERENCES locations(location_id), -- Optional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for FIFO lookup (search by item and date)
CREATE INDEX idx_inventory_fifo ON inventory_status (item_id, received_date ASC);

-- 3. Create a View for "Total Stock" (for simple queries)
CREATE OR REPLACE VIEW item_stock_view AS
SELECT item_id, SUM(quantity) as total_quantity
FROM inventory_status
GROUP BY item_id;

-- 4. Update transactions table to link to specific inventory lots (Optional but recommended for strict audit trail)
-- ALTER TABLE transaction_lines ADD COLUMN inventory_id UUID REFERENCES inventory_status(inventory_id);
