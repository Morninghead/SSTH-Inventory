-- =====================================================
-- SSTH Inventory Database Updates
-- Add Company Departments and Inventory Items
-- =====================================================

-- =====================================================
-- 1. INSERT DEPARTMENTS
-- =====================================================

INSERT INTO departments (dept_id, dept_name, is_active) VALUES
(gen_random_uuid(), 'Admin', true),
(gen_random_uuid(), 'Coating', true),
(gen_random_uuid(), 'Maintenance', true),
(gen_random_uuid(), 'Marketing', true),
(gen_random_uuid(), 'Mold', true),
(gen_random_uuid(), 'Production', true),
(gen_random_uuid(), 'Purchasing', true),
(gen_random_uuid(), 'QA/QC', true),
(gen_random_uuid(), 'R&D', true),
(gen_random_uuid(), 'SCM', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. CREATE CATEGORIES (if not exist)
-- =====================================================

INSERT INTO categories (category_id, category_name, description, is_active) VALUES
(gen_random_uuid(), 'Office Supplies', 'Pens, papers, staplers, etc.', true),
(gen_random_uuid(), 'Cleaning Supplies', 'Cleaning products and tools', true),
(gen_random_uuid(), 'Safety Equipment', 'PPE, safety gear, protective equipment', true),
(gen_random_uuid(), 'Electronics', 'Batteries, computer accessories', true),
(gen_random_uuid(), 'Uniforms', 'Work uniforms and clothing', true),
(gen_random_uuid(), 'Medical Supplies', 'Masks, gloves, first aid', true),
(gen_random_uuid(), 'Tools & Equipment', 'Hand tools, maintenance supplies', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. CREATE UNIT OF MEASURE (if not exist)
-- =====================================================

INSERT INTO uom (uom_id, uom_code, uom_name, is_active) VALUES
(gen_random_uuid(), 'PCS', 'Pieces', true),
(gen_random_uuid(), 'BOX', 'Box', true),
(gen_random_uuid(), 'PKG', 'Package', true),
(gen_random_uuid(), 'PAIR', 'Pair', true),
(gen_random_uuid(), 'SET', 'Set', true),
(gen_random_uuid(), 'ROLL', 'Roll', true),
(gen_random_uuid(), 'BTL', 'Bottle', true),
(gen_random_uuid(), 'LTR', 'Liter', true),
(gen_random_uuid(), 'PKT', 'Packet', true),
(gen_random_uuid(), 'EA', 'Each', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. INSERT INVENTORY ITEMS
-- =====================================================

-- Get category and UOM IDs (we'll use these in subsequent inserts)
WITH cats AS (
  SELECT category_id, category_name FROM categories
),
uoms AS (
  SELECT uom_id, uom_code FROM uom
)

-- OFFICE SUPPLIES - Writing Instruments
INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-BP-BLU',
  'Ballpen - blue',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  5.00,
  50,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-BP-BLU');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-BP-RED',
  'Ballpen - red',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  5.00,
  50,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-BP-RED');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-MK-BLU',
  'Marker - blue',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  15.00,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-MK-BLU');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-MK-RED',
  'Marker - red',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  15.00,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-MK-RED');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-MK-BLK',
  'Marker - black',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  15.00,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-MK-BLK');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-WB-BLU',
  'Whiteboard - blue',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  20.00,
  20,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-WB-BLU');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-WB-RED',
  'Whiteboard - red',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  20.00,
  20,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-WB-RED');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-WB-BLK',
  'Whiteboard - black',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  20.00,
  20,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-WB-BLK');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-PM-BLU',
  'Permanent - Blue',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  18.00,
  25,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-PM-BLU');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-PM-RED',
  'Permanent - Red',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  18.00,
  25,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-PM-RED');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-PM-BLK',
  'Permanent - Black',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  18.00,
  25,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-PM-BLK');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-HL',
  'Highlighter',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  12.00,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-HL');

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  'WI-CDMK',
  'CD Marker',
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  25.00,
  15,
  true
WHERE NOT EXISTS (SELECT 1 FROM items WHERE item_code = 'WI-CDMK');

-- Uni-Paint Markers
INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  item_code,
  description,
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  35.00,
  10,
  true
FROM (VALUES
  ('WI-UP-WHT', 'Uni-Paint Marker (White)'),
  ('WI-UP-BLU', 'Uni-Paint Marker (Blue)'),
  ('WI-UP-PNK', 'Uni-Paint Marker (Pink)'),
  ('WI-UP-GRN', 'Uni-Paint Marker (Green)'),
  ('WI-UP-RED', 'Uni-Paint Marker (Red)'),
  ('WI-UP-BLK', 'Uni-Paint Marker (Black)'),
  ('WI-UP-ORG', 'Uni-Paint Marker (Orange)'),
  ('WI-UP-YEL', 'Uni-Paint Marker (Yellow)')
) AS t(item_code, description)
WHERE NOT EXISTS (SELECT 1 FROM items WHERE items.item_code = t.item_code);

-- Pencils and erasers
INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active)
SELECT
  gen_random_uuid(),
  item_code,
  description,
  (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
  (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
  unit_cost,
  reorder_level,
  true
FROM (VALUES
  ('WI-PENCIL', 'Pencil', 3.00, 100),
  ('WI-DP-RED', 'Dermatograph Pencil - red', 15.00, 20),
  ('WI-DP-WHT', 'Dermatograph Pencil - white', 15.00, 20),
  ('WI-DP-BLU', 'Dermatograph Pencil - blue', 15.00, 20),
  ('WI-DP-BLK', 'Dermatograph Pencil - black', 15.00, 20),
  ('WI-MPLEAD', 'Mechanical pencil lead', 25.00, 30),
  ('WI-ERASER', 'Eraser', 5.00, 50)
) AS t(item_code, description, unit_cost, reorder_level)
WHERE NOT EXISTS (SELECT 1 FROM items WHERE items.item_code = t.item_code);

-- Continue with more items...
-- This SQL file is getting long. I'll create a comprehensive version.
