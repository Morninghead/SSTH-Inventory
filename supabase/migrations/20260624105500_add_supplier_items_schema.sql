-- Migration to add supplier_items table for Vendor-Item relationships

-- 1. Create the table
CREATE TABLE IF NOT EXISTS supplier_items (
    supplier_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    supplier_sku TEXT,
    supplier_price NUMERIC(10,2),
    lead_time_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(supplier_id, item_id)
);

-- 3. Enable RLS
ALTER TABLE supplier_items ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Allow anyone to read
CREATE POLICY "Allow read access on supplier_items for all authenticated users" 
    ON supplier_items FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert
CREATE POLICY "Allow insert access on supplier_items for all authenticated users" 
    ON supplier_items FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Allow update access on supplier_items for all authenticated users" 
    ON supplier_items FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Allow delete access on supplier_items for all authenticated users" 
    ON supplier_items FOR DELETE 
    USING (auth.role() = 'authenticated');
