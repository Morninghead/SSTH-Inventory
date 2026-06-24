-- =====================================================
-- ADD TRANSLATION FIELDS TO ITEMS TABLE
-- =====================================================
-- This script adds separate fields for English and Thai item names/descriptions

-- Add new columns to items table
ALTER TABLE items
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS name_th TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_th TEXT;

-- Create index for faster searching by name
CREATE INDEX IF NOT EXISTS idx_items_name_en ON items(name_en);
CREATE INDEX IF NOT EXISTS idx_items_name_th ON items(name_th);

-- Copy existing description to both language fields initially
UPDATE items
SET
    name_en = description,
    name_th = description,
    description_en = description,
    description_th = description
WHERE name_en IS NULL OR name_th IS NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN items.name_en IS 'Item name in English';
COMMENT ON COLUMN items.name_th IS 'Item name in Thai';
COMMENT ON COLUMN items.description_en IS 'Item description in English';
COMMENT ON COLUMN items.description_th IS 'Item description in Thai';

-- Display results
SELECT
    'Translation fields added successfully' as status,
    COUNT(*) as total_items_updated
FROM items
WHERE name_en IS NOT NULL AND name_th IS NOT NULL;