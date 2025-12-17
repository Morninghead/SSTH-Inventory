-- Multi-Level UOM Schema for SSTH Inventory System
-- This script adds support for hierarchical units of measure
-- Example: 1 BOX = 10 PACKS, 1 PACK = 12 EA (Each)

-- 1. Create UOM Master Table
CREATE TABLE IF NOT EXISTS uom (
    uom_code VARCHAR(10) PRIMARY KEY,
    description VARCHAR(100) NOT NULL,
    is_base_uom BOOLEAN DEFAULT FALSE,  -- TRUE for the smallest unit (EA, PCS)
    category VARCHAR(50) DEFAULT 'GENERAL',  -- WEIGHT, VOLUME, LENGTH, GENERAL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create UOM Conversion Table
CREATE TABLE IF NOT EXISTS uom_conversions (
    conversion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(item_id) ON DELETE CASCADE,  -- NULL for global conversions
    from_uom VARCHAR(10) NOT NULL REFERENCES uom(uom_code),
    to_uom VARCHAR(10) NOT NULL REFERENCES uom(uom_code),
    conversion_factor NUMERIC(15,6) NOT NULL,  -- How many 'to_uom' = 1 'from_uom'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure no duplicate conversions for same item
    UNIQUE(item_id, from_uom, to_uom)
);

-- 3. Add columns to items table for enhanced UOM support
ALTER TABLE items
ADD COLUMN IF NOT EXISTS ordering_uom VARCHAR(10) REFERENCES uom(uom_code),
ADD COLUMN IF NOT EXISTS pricing_uom VARCHAR(10) REFERENCES uom(uom_code),
ADD COLUMN IF NOT EXISTS uom_length INTEGER DEFAULT 1,  -- Number of UOM levels for this item
ADD COLUMN IF NOT EXISTS outermost_uom VARCHAR(10) REFERENCES uom(uom_code);  -- Largest UOM (e.g., PALLET)

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_uom_conversions_item_id ON uom_conversions(item_id);
CREATE INDEX IF NOT EXISTS idx_uom_conversions_from_to ON uom_conversions(from_uom, to_uom);
CREATE INDEX IF NOT EXISTS idx_uom_category ON uom(category);

-- 5. Insert common UOMs
INSERT INTO uom (uom_code, description, is_base_uom, category) VALUES
-- General Units
('EA', 'Each', TRUE, 'GENERAL'),
('PCS', 'Pieces', TRUE, 'GENERAL'),
('SET', 'Set', FALSE, 'GENERAL'),
('KIT', 'Kit', FALSE, 'GENERAL'),
('BOX', 'Box', FALSE, 'GENERAL'),
('CASE', 'Case', FALSE, 'GENERAL'),
('PACK', 'Pack', FALSE, 'GENERAL'),
('CTN', 'Carton', FALSE, 'GENERAL'),
('PALLET', 'Pallet', FALSE, 'GENERAL'),
('ROLL', 'Roll', FALSE, 'GENERAL'),
('BAG', 'Bag', FALSE, 'GENERAL'),
('BOTTLE', 'Bottle', FALSE, 'GENERAL'),
('TUBE', 'Tube', FALSE, 'GENERAL'),
('CARTRIDGE', 'Cartridge', FALSE, 'GENERAL'),
('REEL', 'Reel', FALSE, 'GENERAL'),
('SPOOL', 'Spool', FALSE, 'GENERAL'),

-- Weight Units
('G', 'Gram', TRUE, 'WEIGHT'),
('KG', 'Kilogram', FALSE, 'WEIGHT'),
('TON', 'Metric Ton', FALSE, 'WEIGHT'),
('LB', 'Pound', FALSE, 'WEIGHT'),
('OZ', 'Ounce', FALSE, 'WEIGHT'),

-- Volume Units
('ML', 'Milliliter', TRUE, 'VOLUME'),
('L', 'Liter', FALSE, 'VOLUME'),
('GAL', 'Gallon', FALSE, 'VOLUME'),
('QT', 'Quart', FALSE, 'VOLUME'),

-- Length Units
('MM', 'Millimeter', TRUE, 'LENGTH'),
('CM', 'Centimeter', FALSE, 'LENGTH'),
('M', 'Meter', FALSE, 'LENGTH'),
('INCH', 'Inch', FALSE, 'LENGTH'),
('FT', 'Foot', FALSE, 'LENGTH')
ON CONFLICT (uom_code) DO NOTHING;

-- 6. Insert common global conversions (item_id = NULL)
INSERT INTO uom_conversions (item_id, from_uom, to_uom, conversion_factor) VALUES
-- General conversions
(NULL, 'PACK', 'EA', 12),        -- 1 Pack = 12 Each
(NULL, 'BOX', 'PACK', 10),       -- 1 Box = 10 Packs
(NULL, 'BOX', 'EA', 120),        -- 1 Box = 120 Each (direct)
(NULL, 'CASE', 'BOX', 12),       -- 1 Case = 12 Boxes
(NULL, 'PALLET', 'CASE', 20),    -- 1 Pallet = 20 Cases

-- Weight conversions
(NULL, 'KG', 'G', 1000),         -- 1 KG = 1000 G
(NULL, 'TON', 'KG', 1000),       -- 1 Ton = 1000 KG
(NULL, 'LB', 'OZ', 16),          -- 1 LB = 16 OZ
(NULL, 'KG', 'LB', 2.20462),     -- 1 KG = 2.20462 LB

-- Volume conversions
(NULL, 'L', 'ML', 1000),         -- 1 Liter = 1000 ML
(NULL, 'GAL', 'L', 3.78541),     -- 1 Gallon = 3.78541 Liters
(NULL, 'GAL', 'QT', 4),          -- 1 Gallon = 4 Quarts

-- Length conversions
(NULL, 'CM', 'MM', 10),          -- 1 CM = 10 MM
(NULL, 'M', 'CM', 100),          -- 1 M = 100 CM
(NULL, 'INCH', 'MM', 25.4),      -- 1 Inch = 25.4 MM
(NULL, 'FT', 'INCH', 12)         -- 1 Foot = 12 Inches
ON CONFLICT (item_id, from_uom, to_uom) DO NOTHING;

-- 7. Create function to get conversion factor between any two UOMs
CREATE OR REPLACE FUNCTION get_uom_conversion(
    p_item_id UUID,
    p_from_uom VARCHAR(10),
    p_to_uom VARCHAR(10)
)
RETURNS NUMERIC AS $$
DECLARE
    conversion_factor NUMERIC;
    -- Use a temporary table to find conversion path
    RECURSIVE conversion_path AS (
        -- Base case: direct conversion
        SELECT
            item_id,
            from_uom,
            to_uom,
            conversion_factor,
            1 as depth,
            ARRAY[from_uom, to_uom] as path
        FROM uom_conversions
        WHERE from_uom = p_from_uom
          AND to_uom = p_to_uom
          AND (item_id = p_item_id OR item_id IS NULL)
          AND is_active = TRUE

        UNION ALL

        -- Recursive step: build conversion chain
        SELECT
            uc.item_id,
            uc.from_uom,
            cp.to_uom,
            uc.conversion_factor * cp.conversion_factor,
            cp.depth + 1,
            cp.path || uc.to_uom
        FROM uom_conversions uc
        JOIN conversion_path cp ON uc.from_uom = cp.to_uom
        WHERE uc.from_uom = cp.to_uom
          AND uc.to_uom != ANY(cp.path)  -- Avoid cycles
          AND (uc.item_id = p_item_id OR uc.item_id IS NULL)
          AND uc.is_active = TRUE
          AND cp.depth < 5  -- Limit recursion depth
    )
    SELECT conversion_factor INTO conversion_factor
    FROM conversion_path
    ORDER BY depth ASC  -- Prefer direct conversions
    LIMIT 1;

    RETURN COALESCE(conversion_factor, 1);
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to convert quantity between UOMs
CREATE OR REPLACE FUNCTION convert_uom_quantity(
    p_item_id UUID,
    p_quantity NUMERIC,
    p_from_uom VARCHAR(10),
    p_to_uom VARCHAR(10)
)
RETURNS NUMERIC AS $$
BEGIN
    RETURN p_quantity * get_uom_conversion(p_item_id, p_from_uom, p_to_uom);
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to get all UOMs for an item with conversions
CREATE OR REPLACE FUNCTION get_item_uom_hierarchy(p_item_id UUID)
RETURNS TABLE(
    uom_code VARCHAR(10),
    description VARCHAR(100),
    is_base_uom BOOLEAN,
    conversion_to_base NUMERIC,
    level INTEGER
) AS $$
WITH RECURSIVE uom_tree AS (
    -- Start with base UOMs
    SELECT
        u.uom_code,
        u.description,
        u.is_base_uom,
        1::NUMERIC as conversion_to_base,
        0 as level
    FROM uom u
    WHERE u.is_base_uom = TRUE

    UNION ALL

    -- Add higher level UOMs
    SELECT
        u.uom_code,
        u.description,
        u.is_base_uom,
        uc.conversion_factor * ut.conversion_to_base,
        ut.level + 1
    FROM uom u
    JOIN uom_conversions uc ON u.uom_code = uc.from_uom
    JOIN uom_tree ut ON uc.to_uom = ut.uom_code
    WHERE (uc.item_id = p_item_id OR uc.item_id IS NULL)
      AND uc.is_active = TRUE
      AND NOT EXISTS (
          SELECT 1 FROM uom_tree ut2
          WHERE ut2.uom_code = u.uom_code
      )
)
SELECT * FROM uom_tree
ORDER BY level;
$$ LANGUAGE plpgsql;

-- 10. Update RLS policies for UOM tables
ALTER TABLE uom ENABLE ROW LEVEL SECURITY;
ALTER TABLE uom_conversions ENABLE ROW LEVEL SECURITY;

-- Policy for uom table - everyone can read, only admins can write
CREATE POLICY "Everyone can view UOMs" ON uom
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert UOMs" ON uom
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('admin', 'developer')
        )
    );

CREATE POLICY "Only admins can update UOMs" ON uom
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('admin', 'developer')
        )
    );

-- Policy for uom_conversions table
CREATE POLICY "Everyone can view UOM conversions" ON uom_conversions
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage UOM conversions" ON uom_conversions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('admin', 'developer')
        )
    );

-- 11. Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_uom_updated_at
    BEFORE UPDATE ON uom
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uom_conversions_updated_at
    BEFORE UPDATE ON uom_conversions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();