-- Vendor and VAT System Database Schema (FIXED VERSION)
-- Run this script in Supabase SQL Editor to add vendor management and VAT functionality

-- 1. Create Vendor Categories Table
CREATE TABLE IF NOT EXISTS vendor_categories (
    vendor_category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code VARCHAR(20) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Enhanced Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_code VARCHAR(20) UNIQUE NOT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    business_registration_no VARCHAR(50),
    tax_id VARCHAR(50),
    vendor_category_id UUID REFERENCES vendor_categories(vendor_category_id),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Thailand',
    payment_terms VARCHAR(50) DEFAULT 'NET 30',
    default_vat_rate DECIMAL(5,2) DEFAULT 7.00,
    is_vat_registered BOOLEAN DEFAULT true,
    bank_account_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    website VARCHAR(200),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Vendor Items table for vendor-specific pricing
CREATE TABLE IF NOT EXISTS vendor_items (
    vendor_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(vendor_id),
    item_id UUID NOT NULL REFERENCES items(item_id),
    vendor_sku VARCHAR(100),
    unit_price DECIMAL(15,2),
    lead_time_days INTEGER DEFAULT 7,
    min_order_quantity INTEGER DEFAULT 1,
    is_preferred_supplier BOOLEAN DEFAULT false,
    last_purchase_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id, item_id)
);

-- 4. Add VAT columns to existing items table (safe version)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='items' AND column_name='vat_rate'
    ) THEN
        ALTER TABLE items ADD COLUMN vat_rate DECIMAL(5,2) DEFAULT 7.00;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='items' AND column_name='is_vat_applicable'
    ) THEN
        ALTER TABLE items ADD COLUMN is_vat_applicable BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='items' AND column_name='preferred_vendor_id'
    ) THEN
        ALTER TABLE items ADD COLUMN preferred_vendor_id UUID REFERENCES vendors(vendor_id);
    END IF;
END $$;

-- 5. Add vendor and VAT columns to existing purchase_order table (safe version)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='purchase_order' AND column_name='vendor_id'
    ) THEN
        ALTER TABLE purchase_order ADD COLUMN vendor_id UUID REFERENCES vendors(vendor_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='purchase_order' AND column_name='vat_rate'
    ) THEN
        ALTER TABLE purchase_order ADD COLUMN vat_rate DECIMAL(5,2) DEFAULT 7.00;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='purchase_order' AND column_name='subtotal_amount'
    ) THEN
        ALTER TABLE purchase_order ADD COLUMN subtotal_amount DECIMAL(15,2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='purchase_order' AND column_name='vat_amount'
    ) THEN
        ALTER TABLE purchase_order ADD COLUMN vat_amount DECIMAL(15,2);
    END IF;
END $$;

-- 6. Add pricing and VAT columns to existing purchase_order_line table (safe version)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='purchase_order_line' AND column_name='unit_price'
    ) THEN
        ALTER TABLE purchase_order_line ADD COLUMN unit_price DECIMAL(15,2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='purchase_order_line' AND column_name='vat_rate'
    ) THEN
        ALTER TABLE purchase_order_line ADD COLUMN vat_rate DECIMAL(5,2) DEFAULT 7.00;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='purchase_order_line' AND column_name='line_total'
    ) THEN
        ALTER TABLE purchase_order_line ADD COLUMN line_total DECIMAL(15,2);
    END IF;
END $$;

-- 7. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_code ON vendors(vendor_code);
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_name ON vendors(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_categories_is_active ON vendor_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_items_vendor_id ON vendor_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_items_item_id ON vendor_items(item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_vendor_id ON purchase_order(vendor_id);
CREATE INDEX IF NOT EXISTS idx_items_preferred_vendor_id ON items(preferred_vendor_id);

-- 8. Insert default vendor categories (safe version)
INSERT INTO vendor_categories (category_code, category_name, description) VALUES
('OFFICE', 'Office Supplies', 'Stationery, office equipment, and supplies'),
('CLEAN', 'Cleaning Supplies', 'Cleaning chemicals, equipment, and supplies'),
('SAFETY', 'Safety Equipment', 'Personal protective equipment and safety gear'),
('ELECT', 'Electronics', 'Electronic devices and components'),
('MEDICAL', 'Medical Supplies', 'Medical equipment and consumables'),
('UNIFORM', 'Uniforms', 'Work uniforms and apparel'),
('FURNITURE', 'Furniture', 'Office and facility furniture'),
('FOOD', 'Food & Beverages', 'Catering and refreshment supplies'),
('MAINTENANCE', 'Maintenance', 'Facility maintenance and repair services'),
('TRANSPORT', 'Transportation', 'Logistics and transportation services'),
('OTHER', 'Other', 'Miscellaneous vendors and suppliers')
ON CONFLICT (category_code) DO NOTHING;

-- 9. Insert sample vendors (safe version)
INSERT INTO vendors (
    vendor_code, vendor_name, contact_person, contact_phone, contact_email,
    vendor_category_id, payment_terms, default_vat_rate, is_vat_registered
) VALUES
('VEN001', 'Office Supply Plus', 'John Smith', '02-123-4567', 'john@officesupply.plus',
 (SELECT vendor_category_id FROM vendor_categories WHERE category_code = 'OFFICE'), 'NET 30', 7.00, true),
('VEN002', 'CleanPro Thailand', 'Maria Garcia', '02-987-6543', 'maria@cleanpro.co.th',
 (SELECT vendor_category_id FROM vendor_categories WHERE category_code = 'CLEAN'), 'COD', 7.00, true),
('VEN003', 'Safety First Equipment', 'Ahmed Hassan', '02-555-1234', 'ahmed@safetyfirst.com',
 (SELECT vendor_category_id FROM vendor_categories WHERE category_code = 'SAFETY'), 'NET 15', 0.00, false),
('VEN004', 'TechWorld Solutions', 'Chen Wei', '02-777-8888', 'chen@techworld.asia',
 (SELECT vendor_category_id FROM vendor_categories WHERE category_code = 'ELECT'), 'NET 45', 7.00, true),
('VEN005', 'Uniform Hub', 'Sarah Johnson', '02-333-4444', 'sarah@uniformhub.com',
 (SELECT vendor_category_id FROM vendor_categories WHERE category_code = 'UNIFORM'), 'NET 30', 7.00, true)
ON CONFLICT (vendor_code) DO NOTHING;

-- 10. Enable Row Level Security (RLS)
ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_items ENABLE ROW LEVEL SECURITY;

-- 11. Create Simple RLS Policies
CREATE POLICY IF NOT EXISTS "Vendor categories view policy" ON vendor_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Vendors view policy" ON vendors
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Vendor items view policy" ON vendor_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- 12. Create Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_vendor_categories_updated_at ON vendor_categories;
CREATE TRIGGER update_vendor_categories_updated_at BEFORE UPDATE ON vendor_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_items_updated_at ON vendor_items;
CREATE TRIGGER update_vendor_items_updated_at BEFORE UPDATE ON vendor_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Create helpful views for reporting
CREATE OR REPLACE VIEW vendor_summary AS
SELECT
    v.vendor_id,
    v.vendor_code,
    v.vendor_name,
    vc.category_name,
    v.contact_person,
    v.contact_email,
    v.payment_terms,
    v.default_vat_rate,
    v.rating,
    v.is_active,
    COUNT(vi.vendor_item_id) as item_count
FROM vendors v
LEFT JOIN vendor_categories vc ON v.vendor_category_id = vc.vendor_category_id
LEFT JOIN vendor_items vi ON v.vendor_id = vi.vendor_id
GROUP BY v.vendor_id, v.vendor_code, v.vendor_name, vc.category_name,
         v.contact_person, v.contact_email, v.payment_terms, v.default_vat_rate,
         v.rating, v.is_active;

COMMIT;