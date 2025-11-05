-- =====================================================
-- SSTH INVENTORY - BULK INSERT SCRIPT
-- Company Departments + All Inventory Items
-- =====================================================

-- =====================================================
-- PART 1: INSERT DEPARTMENTS
-- =====================================================

INSERT INTO departments (dept_id, dept_name, is_active, created_at)
VALUES
  (gen_random_uuid(), 'Admin', true, now()),
  (gen_random_uuid(), 'Coating', true, now()),
  (gen_random_uuid(), 'Maintenance', true, now()),
  (gen_random_uuid(), 'Marketing', true, now()),
  (gen_random_uuid(), 'Mold', true, now()),
  (gen_random_uuid(), 'Production', true, now()),
  (gen_random_uuid(), 'Purchasing', true, now()),
  (gen_random_uuid(), 'QA/QC', true, now()),
  (gen_random_uuid(), 'R&D', true, now()),
  (gen_random_uuid(), 'SCM', true, now())
ON CONFLICT (dept_name) DO NOTHING;

-- =====================================================
-- PART 2: INSERT CATEGORIES
-- =====================================================

INSERT INTO categories (category_id, category_name, description, is_active, created_at)
VALUES
  (gen_random_uuid(), 'Office Supplies', 'Pens, papers, staplers, office items', true, now()),
  (gen_random_uuid(), 'Cleaning Supplies', 'Cleaning products and tools', true, now()),
  (gen_random_uuid(), 'Safety Equipment', 'PPE, safety gear, protective equipment', true, now()),
  (gen_random_uuid(), 'Electronics', 'Batteries, computer accessories', true, now()),
  (gen_random_uuid(), 'Uniforms', 'Work uniforms and clothing', true, now()),
  (gen_random_uuid(), 'Medical Supplies', 'Masks, gloves, medical items', true, now()),
  (gen_random_uuid(), 'Tools & Equipment', 'Hand tools, maintenance supplies', true, now())
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 3: INSERT UNIT OF MEASURE
-- =====================================================

INSERT INTO uom (uom_id, uom_code, uom_name, is_active, created_at)
VALUES
  (gen_random_uuid(), 'PCS', 'Pieces', true, now()),
  (gen_random_uuid(), 'BOX', 'Box', true, now()),
  (gen_random_uuid(), 'PKG', 'Package', true, now()),
  (gen_random_uuid(), 'PAIR', 'Pair', true, now()),
  (gen_random_uuid(), 'SET', 'Set', true, now()),
  (gen_random_uuid(), 'ROLL', 'Roll', true, now()),
  (gen_random_uuid(), 'BTL', 'Bottle', true, now()),
  (gen_random_uuid(), 'LTR', 'Liter', true, now()),
  (gen_random_uuid(), 'PKT', 'Packet', true, now()),
  (gen_random_uuid(), 'EA', 'Each', true, now())
ON CONFLICT (uom_code) DO NOTHING;

-- =====================================================
-- PART 4: BULK INSERT ALL ITEMS
-- =====================================================

WITH
office_cat AS (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
clean_cat AS (SELECT category_id FROM categories WHERE category_name = 'Cleaning Supplies' LIMIT 1),
safety_cat AS (SELECT category_id FROM categories WHERE category_name = 'Safety Equipment' LIMIT 1),
elec_cat AS (SELECT category_id FROM categories WHERE category_name = 'Electronics' LIMIT 1),
uniform_cat AS (SELECT category_id FROM categories WHERE category_name = 'Uniforms' LIMIT 1),
medical_cat AS (SELECT category_id FROM categories WHERE category_name = 'Medical Supplies' LIMIT 1),
tools_cat AS (SELECT category_id FROM categories WHERE category_name = 'Tools & Equipment' LIMIT 1),
pcs_uom AS (SELECT uom_id FROM uom WHERE uom_code = 'PCS' LIMIT 1),
box_uom AS (SELECT uom_id FROM uom WHERE uom_code = 'BOX' LIMIT 1),
pkg_uom AS (SELECT uom_id FROM uom WHERE uom_code = 'PKG' LIMIT 1),
pair_uom AS (SELECT uom_id FROM uom WHERE uom_code = 'PAIR' LIMIT 1),
roll_uom AS (SELECT uom_id FROM uom WHERE uom_code = 'ROLL' LIMIT 1),
btl_uom AS (SELECT uom_id FROM uom WHERE uom_code = 'BTL' LIMIT 1),
ltr_uom AS (SELECT uom_id FROM uom WHERE uom_code = 'LTR' LIMIT 1)

INSERT INTO items (item_id, item_code, description, category_id, uom_id, unit_cost, reorder_level, is_active, created_at)
SELECT
  gen_random_uuid(),
  item_code,
  description,
  CASE
    WHEN category = 'Office' THEN (SELECT category_id FROM office_cat)
    WHEN category = 'Cleaning' THEN (SELECT category_id FROM clean_cat)
    WHEN category = 'Safety' THEN (SELECT category_id FROM safety_cat)
    WHEN category = 'Electronics' THEN (SELECT category_id FROM elec_cat)
    WHEN category = 'Uniforms' THEN (SELECT category_id FROM uniform_cat)
    WHEN category = 'Medical' THEN (SELECT category_id FROM medical_cat)
    WHEN category = 'Tools' THEN (SELECT category_id FROM tools_cat)
  END,
  CASE
    WHEN uom = 'PCS' THEN (SELECT uom_id FROM pcs_uom)
    WHEN uom = 'BOX' THEN (SELECT uom_id FROM box_uom)
    WHEN uom = 'PKG' THEN (SELECT uom_id FROM pkg_uom)
    WHEN uom = 'PAIR' THEN (SELECT uom_id FROM pair_uom)
    WHEN uom = 'ROLL' THEN (SELECT uom_id FROM roll_uom)
    WHEN uom = 'BTL' THEN (SELECT uom_id FROM btl_uom)
    WHEN uom = 'LTR' THEN (SELECT uom_id FROM ltr_uom)
  END,
  unit_cost,
  reorder_level,
  true,
  now()
FROM (VALUES
  -- WRITING INSTRUMENTS
  ('OF-BP-001', 'Ballpen - blue', 'Office', 'PCS', 5.00, 50),
  ('OF-BP-002', 'Ballpen - red', 'Office', 'PCS', 5.00, 50),
  ('OF-MK-001', 'Marker - blue', 'Office', 'PCS', 15.00, 30),
  ('OF-MK-002', 'Marker - red', 'Office', 'PCS', 15.00, 30),
  ('OF-MK-003', 'Marker - black', 'Office', 'PCS', 15.00, 30),
  ('OF-WB-001', 'Whiteboard - blue', 'Office', 'PCS', 20.00, 20),
  ('OF-WB-002', 'Whiteboard - red', 'Office', 'PCS', 20.00, 20),
  ('OF-WB-003', 'Whiteboard - black', 'Office', 'PCS', 20.00, 20),
  ('OF-PM-001', 'Permanent - Blue', 'Office', 'PCS', 18.00, 25),
  ('OF-PM-002', 'Permanent - Red', 'Office', 'PCS', 18.00, 25),
  ('OF-PM-003', 'Permanent - Black', 'Office', 'PCS', 18.00, 25),
  ('OF-HL-001', 'Highlighter', 'Office', 'PCS', 12.00, 30),
  ('OF-CDMK-001', 'CD Marker', 'Office', 'PCS', 25.00, 15),
  ('OF-UP-001', 'Uni-Paint Marker (White)', 'Office', 'PCS', 35.00, 10),
  ('OF-UP-002', 'Uni-Paint Marker (Blue)', 'Office', 'PCS', 35.00, 10),
  ('OF-UP-003', 'Uni-Paint Marker (Pink)', 'Office', 'PCS', 35.00, 10),
  ('OF-UP-004', 'Uni-Paint Marker (Green)', 'Office', 'PCS', 35.00, 10),
  ('OF-UP-005', 'Uni-Paint Marker (Red)', 'Office', 'PCS', 35.00, 10),
  ('OF-UP-006', 'Uni-Paint Marker (Black)', 'Office', 'PCS', 35.00, 10),
  ('OF-UP-007', 'Uni-Paint Marker (Orange)', 'Office', 'PCS', 35.00, 10),
  ('OF-UP-008', 'Uni-Paint Marker (Yellow)', 'Office', 'PCS', 35.00, 10),
  ('OF-PEN-001', 'Pencil', 'Office', 'PCS', 3.00, 100),
  ('OF-DP-001', 'Dermatograph Pencil - red', 'Office', 'PCS', 15.00, 20),
  ('OF-DP-002', 'Dermatograph Pencil - white', 'Office', 'PCS', 15.00, 20),
  ('OF-DP-003', 'Dermatograph Pencil - blue', 'Office', 'PCS', 15.00, 20),
  ('OF-DP-004', 'Dermatograph Pencil - black', 'Office', 'PCS', 15.00, 20),
  ('OF-MPL-001', 'Mechanical pencil lead', 'Office', 'BOX', 25.00, 30),
  ('OF-ER-001', 'Eraser', 'Office', 'PCS', 5.00, 50),
  ('OF-LP-001', 'Liquid Paper& Liquid Tape', 'Office', 'PCS', 25.00, 20),

  -- OFFICE ACCESSORIES
  ('OF-FST-001', 'Fastenner', 'Office', 'BOX', 15.00, 20),
  ('OF-GLU-001', 'Glue Stick', 'Office', 'PCS', 12.00, 30),
  ('OF-SHP-001', 'Sharpener', 'Office', 'PCS', 8.00, 25),
  ('OF-RUL-001', 'Ruler', 'Office', 'PCS', 10.00, 30),

  -- TAPES
  ('OF-TPE-001', 'Double Sided Tissue Tape', 'Office', 'ROLL', 35.00, 20),
  ('OF-TPE-002', 'Double Sided Foam Tape', 'Office', 'ROLL', 45.00, 15),
  ('OF-TPE-003', 'Transparent Tape - Small Roll', 'Office', 'ROLL', 15.00, 40),
  ('OF-TPE-004', 'Transparent Tape - Big Roll', 'Office', 'ROLL', 25.00, 30),
  ('OF-TPE-005', 'Loytape Cellulose Tape', 'Office', 'ROLL', 20.00, 25),
  ('OF-TPE-006', 'Barricade Tape (Red Tape)', 'Office', 'ROLL', 50.00, 10),
  ('OF-TPE-007', 'Anti Slip Tape', 'Office', 'ROLL', 80.00, 10),

  -- CUTTING TOOLS
  ('OF-CUT-001', 'Cutter Spare Blade A-150', 'Office', 'PKG', 30.00, 15),
  ('OF-CUT-002', 'Cutter Spare Blade A-100', 'Office', 'PKG', 25.00, 15),
  ('OF-CUT-003', 'Cutter (BIG)', 'Office', 'PCS', 45.00, 10),
  ('OF-CUT-004', 'Cutter (Small)', 'Office', 'PCS', 25.00, 15),
  ('OF-SCR-001', 'Scissors', 'Office', 'PCS', 35.00, 15),

  -- STAMPS & INKS
  ('OF-STP-001', 'Stamp Pad - blue', 'Office', 'PCS', 45.00, 10),
  ('OF-STP-002', 'Stamp Pad - red', 'Office', 'PCS', 45.00, 10),
  ('OF-INK-001', 'Stamp Pad Ink - blue', 'Office', 'BTL', 30.00, 15),
  ('OF-INK-002', 'Stamp Pad Ink - red', 'Office', 'BTL', 30.00, 15),
  ('OF-INK-003', 'Refill Ink - blue', 'Office', 'BTL', 35.00, 15),
  ('OF-INK-004', 'Refill Ink - red', 'Office', 'BTL', 35.00, 15),
  ('OF-DST-001', 'Date Stamp (แบบยาง)', 'Office', 'PCS', 150.00, 5),
  ('OF-DST-002', 'Date Stamp', 'Office', 'PCS', 200.00, 5),

  -- STICKERS & LABELS
  ('OF-STK-001', 'Line Sticker - red', 'Office', 'ROLL', 25.00, 15),
  ('OF-STK-002', 'Line Sticker - blue', 'Office', 'ROLL', 25.00, 15),
  ('OF-STK-003', 'Line Sticker - black', 'Office', 'ROLL', 25.00, 15),
  ('OF-STK-004', 'Line Sticker - pink', 'Office', 'ROLL', 25.00, 15),
  ('OF-LBL-001', 'Label Sticker - small', 'Office', 'PKG', 20.00, 20),
  ('OF-LBL-002', 'Label Sticker - big', 'Office', 'PKG', 30.00, 15),
  ('OF-LBL-003', 'Label Tag', 'Office', 'PKG', 25.00, 15),

  -- BATTERIES (Electronics category)
  ('EL-BAT-001', 'AA Battery', 'Electronics', 'PCS', 15.00, 50),
  ('EL-BAT-002', 'AAA Battery', 'Electronics', 'PCS', 15.00, 50),
  ('EL-BAT-003', 'Panasonic 23A', 'Electronics', 'PCS', 25.00, 20),
  ('EL-BAT-004', 'LRV08 Battery', 'Electronics', 'PCS', 30.00, 15),
  ('EL-BAT-005', 'Microphone Battery (9V)', 'Electronics', 'PCS', 40.00, 15),
  ('EL-BAT-006', 'Lithium Battery (1.5V) LR41', 'Electronics', 'PCS', 20.00, 25),
  ('EL-BAT-007', 'Lithium Battery (1.5V) LR44', 'Electronics', 'PCS', 20.00, 25),
  ('EL-BAT-008', 'Lithium Battery (3V) CR2032', 'Electronics', 'PCS', 25.00, 30),

  -- CLIPS & FASTENERS
  ('OF-CLP-001', 'Paper Clip', 'Office', 'BOX', 20.00, 15),
  ('OF-BND-001', 'Binder Clip No.112 (Small)', 'Office', 'BOX', 25.00, 15),
  ('OF-BND-002', 'Binder Clip No.110 (Middle)', 'Office', 'BOX', 30.00, 15),
  ('OF-BND-003', 'Binder Clip No.109 (Big)', 'Office', 'BOX', 35.00, 10),

  -- STAPLES & STAPLERS
  ('OF-STA-001', 'Staples no.10', 'Office', 'BOX', 15.00, 30),
  ('OF-STA-002', 'Staples no.B8', 'Office', 'BOX', 15.00, 20),
  ('OF-STA-003', 'Staples no.M8-1M', 'Office', 'BOX', 20.00, 15),
  ('OF-STA-004', 'Staples no.3(24/6)', 'Office', 'BOX', 15.00, 30),
  ('OF-STA-005', 'Staples no.23/13-H', 'Office', 'BOX', 20.00, 15),
  ('OF-STA-006', 'Staples no.10-1M', 'Office', 'BOX', 18.00, 20),
  ('OF-STA-007', 'Staples no.23/10-M', 'Office', 'BOX', 18.00, 20),
  ('OF-STR-001', 'Stapler', 'Office', 'PCS', 80.00, 10),
  ('OF-STR-002', 'Big Stapler', 'Office', 'PCS', 250.00, 5),
  ('OF-STR-003', 'Staple Remover', 'Office', 'PCS', 25.00, 15),

  -- PAPER & FILES
  ('OF-A4-001', 'A4 - red', 'Office', 'PKG', 45.00, 10),
  ('OF-A4-002', 'A4 - green', 'Office', 'PKG', 45.00, 10),
  ('OF-A4-003', 'A4 - pink', 'Office', 'PKG', 45.00, 10),
  ('OF-A4-004', 'A4 - blue', 'Office', 'PKG', 45.00, 10),
  ('OF-A4-005', 'A4 - yellow', 'Office', 'PKG', 45.00, 10),
  ('OF-PPR-001', 'A4 Copy Paper', 'Office', 'PKG', 120.00, 20),
  ('OF-PPR-002', 'A3 Copy Paper', 'Office', 'PKG', 200.00, 15),
  ('OF-FLD-001', 'Plastic Index Tap Divider', 'Office', 'PCS', 35.00, 15),
  ('OF-FLD-002', 'L-Holder', 'Office', 'PCS', 8.00, 50),
  ('OF-FLD-003', 'Sheet Protector - 11 holes', 'Office', 'PKG', 40.00, 15),
  ('OF-STK-005', 'Sticker Paper A4', 'Office', 'PKG', 80.00, 10),
  ('OF-CPR-001', 'Carbon Paper', 'Office', 'PKG', 60.00, 10),
  ('OF-SEM-001', 'Seminar File A4', 'Office', 'PCS', 15.00, 20),
  ('OF-TRS-001', 'Transparency Sheet', 'Office', 'PKG', 100.00, 10),
  ('OF-MAG-001', 'Magnetic Sheet (A4)', 'Office', 'PCS', 50.00, 10),
  ('OF-PST-001', 'Post-it 3*3', 'Office', 'PKG', 35.00, 20),
  ('OF-PST-002', 'Post-it Small', 'Office', 'PKG', 25.00, 25),
  ('OF-LAM-001', 'Laminating Pouch Film - A3', 'Office', 'PKG', 150.00, 10),
  ('OF-LAM-002', 'Laminating Pouch Film - A4', 'Office', 'PKG', 100.00, 15),

  -- TISSUES (Cleaning category)
  ('CL-TIS-001', 'Tissue - Toilet', 'Cleaning', 'PKG', 80.00, 20),
  ('CL-TIS-002', 'Tissue - Face', 'Cleaning', 'BOX', 35.00, 15),
  ('CL-TIS-003', 'Tissue - mouth', 'Cleaning', 'PKG', 25.00, 20),

  -- CLEANING CHEMICALS
  ('CL-CLE-001', 'Toilet Cleaner (Ped Pro)', 'Cleaning', 'BTL', 45.00, 15),
  ('CL-CLE-002', 'Toilet Cleaner (Abel Plus)', 'Cleaning', 'BTL', 50.00, 15),
  ('CL-CLE-003', 'Dust Mop Liquid', 'Cleaning', 'BTL', 60.00, 10),
  ('CL-CLE-004', 'Floor Cleaner', 'Cleaning', 'BTL', 55.00, 15),
  ('CL-CLE-005', 'Dishwashing Cleaner', 'Cleaning', 'BTL', 35.00, 20),
  ('CL-CLE-006', 'Handwashing Cleaner', 'Cleaning', 'BTL', 40.00, 15),
  ('CL-CLE-007', 'Bacteria Cleanner', 'Cleaning', 'BTL', 70.00, 10),
  ('CL-CLE-008', 'Mirror Cleaner', 'Cleaning', 'BTL', 45.00, 10),
  ('CL-CLE-009', 'Washing Powder', 'Cleaning', 'PKG', 120.00, 10),

  -- CLEANING TOOLS
  ('CL-BRM-001', 'Soft Broom', 'Cleaning', 'PCS', 80.00, 10),
  ('CL-BRM-002', 'Coconut Broom', 'Cleaning', 'PCS', 60.00, 10),
  ('CL-BRM-003', 'Cobweb broom', 'Cleaning', 'PCS', 70.00, 8),
  ('CL-MOP-001', 'Mop', 'Cleaning', 'PCS', 90.00, 10),
  ('CL-MOP-002', 'Mop 10"', 'Cleaning', 'PCS', 100.00, 8),
  ('CL-MOP-003', 'Dust Mop', 'Cleaning', 'PCS', 120.00, 8),
  ('CL-MOP-004', 'Spare Dust Mop', 'Cleaning', 'PCS', 60.00, 15),
  ('CL-DSP-001', 'Dustpan', 'Cleaning', 'PCS', 45.00, 10),
  ('CL-TOI-001', 'Toilet brush', 'Cleaning', 'PCS', 55.00, 10),
  ('CL-TOI-002', 'Toilet Vacuum Pump', 'Cleaning', 'PCS', 250.00, 5),
  ('CL-DST-001', 'Duster', 'Cleaning', 'PCS', 25.00, 15),
  ('CL-SCO-001', 'Scotch Brite', 'Cleaning', 'PCS', 15.00, 30),
  ('CL-BAY-001', 'Baygon', 'Cleaning', 'BTL', 85.00, 10),
  ('CL-SPG-001', 'Sponge for washing dishes', 'Cleaning', 'PCS', 12.00, 25),
  ('CL-MIR-001', 'Mirror brush', 'Cleaning', 'PCS', 35.00, 10),
  ('CL-BRM-004', 'Water broom 24"', 'Cleaning', 'PCS', 150.00, 5),
  ('CL-BRM-005', 'Long handle floor brush', 'Cleaning', 'PCS', 120.00, 5),
  ('CL-GLV-001', 'Rubber Glove', 'Cleaning', 'PAIR', 25.00, 20),
  ('CL-MOP-005', 'tatter(Mop)', 'Cleaning', 'PCS', 40.00, 15),

  -- ELECTRONICS & COMPUTER
  ('EL-MDCCAP-001', 'MDC CAP', 'Electronics', 'PCS', 150.00, 10),
  ('EL-LED-001', 'LED Blub - Long', 'Electronics', 'PCS', 120.00, 15),
  ('EL-LED-002', 'LED Blub - Short 9W', 'Electronics', 'PCS', 80.00, 20),
  ('EL-SAR-001', 'Self Adhesive Rings', 'Electronics', 'PKG', 35.00, 10),
  ('OF-BRD-001', 'Board Eraser', 'Office', 'PCS', 25.00, 15),
  ('OF-FTM-001', 'Fingertip Moistener', 'Office', 'PCS', 30.00, 10),
  ('OF-VAS-001', 'Vaseline', 'Office', 'PCS', 35.00, 10),
  ('EL-MOU-001', 'Computer Mouse', 'Electronics', 'PCS', 250.00, 10),
  ('EL-KEY-001', 'Keyboard', 'Electronics', 'PCS', 350.00, 10),
  ('OF-PIN-001', 'Board Pin', 'Office', 'BOX', 20.00, 15),
  ('EL-CBL-001', 'Cable Tile 4"', 'Electronics', 'PKG', 40.00, 10),

  -- SAFETY EQUIPMENT - EAR PROTECTION
  ('SF-EAR-001', 'Ear Plug - wire', 'Safety', 'PAIR', 15.00, 50),
  ('SF-EAR-002', 'Ear Plug - wireless(refill)', 'Safety', 'PCS', 8.00, 100),

  -- SAFETY EQUIPMENT - GLOVES
  ('SF-GLV-001', 'Cotton Glove', 'Safety', 'PAIR', 12.00, 100),
  ('SF-GLV-002', 'Microtex Glove', 'Safety', 'PAIR', 35.00, 50),
  ('SF-GLV-003', 'PU Glove - orange', 'Safety', 'PAIR', 25.00, 50),
  ('SF-GLV-004', 'PU Glove - Black', 'Safety', 'PAIR', 25.00, 50),
  ('SF-GLV-005', 'PU Glove - White', 'Safety', 'PAIR', 25.00, 50),
  ('SF-GLV-006', 'Cut Resistant gloves level 5', 'Safety', 'PAIR', 180.00, 20),
  ('SF-GLV-007', 'Cut Resistant gloves level 5 (Dot)', 'Safety', 'PAIR', 200.00, 20),
  ('SF-GLV-008', 'Welding leather gloves', 'Safety', 'PAIR', 150.00, 15),

  -- SAFETY EQUIPMENT - BAGS
  ('SF-BAG-001', 'Garbage bag 18*20', 'Safety', 'PKG', 45.00, 20),
  ('SF-BAG-002', 'Garbage bag 24*28', 'Safety', 'PKG', 60.00, 20),
  ('SF-BAG-003', 'Garbage bag 30*40', 'Safety', 'PKG', 80.00, 15),
  ('SF-BAG-004', 'Garbage bag 36*45', 'Safety', 'PKG', 100.00, 15),
  ('SF-BAG-005', 'Red garbage bags', 'Safety', 'PKG', 90.00, 10),

  -- SAFETY EQUIPMENT - SHOES & HELMETS
  ('SF-SHO-001', 'Safety Shoes NO.39', 'Safety', 'PAIR', 650.00, 5),
  ('SF-SHO-002', 'Safety Shoes NO.40', 'Safety', 'PAIR', 650.00, 5),
  ('SF-SHO-003', 'Safety Shoes NO.41', 'Safety', 'PAIR', 650.00, 5),
  ('SF-SHO-004', 'Safety Shoes NO.42', 'Safety', 'PAIR', 650.00, 5),
  ('SF-SHO-005', 'Safety Shoes NO.43', 'Safety', 'PAIR', 650.00, 5),
  ('SF-SHO-006', 'Safety Shoes NO.44', 'Safety', 'PAIR', 650.00, 5),
  ('SF-HLM-001', 'HMT-AYL Safety helmet', 'Safety', 'PCS', 250.00, 10),

  -- SAFETY EQUIPMENT - PROTECTIVE WEAR
  ('SF-WEL-001', 'KN-WEL - Welding sleeve protection', 'Safety', 'PAIR', 280.00, 10),
  ('SF-APR-001', 'APN-AP04 - Apron Leather', 'Safety', 'PCS', 450.00, 8),
  ('SF-ARM-001', 'ARM-GN - Hand Protection', 'Safety', 'PAIR', 120.00, 15),
  ('SF-FSH-001', 'Face Sheild', 'Safety', 'PCS', 180.00, 15),
  ('SF-VIS-001', 'Visor Bracket', 'Safety', 'PCS', 80.00, 15),
  ('SF-MSK-001', 'Mask Carbon 5 layer', 'Safety', 'BOX', 250.00, 10),

  -- SAFETY EQUIPMENT - CHAINS & CONSUMABLES
  ('SF-CHN-001', 'CHAIN-6MM-25M', 'Safety', 'PCS', 850.00, 5),
  ('SF-CON-001', 'Consumables -Traffic pole refueling', 'Safety', 'PCS', 120.00, 10),
  ('SF-CON-002', 'Consumables', 'Safety', 'PCS', 50.00, 20),
  ('SF-TPE-001', 'Reflective tape Yellow/Black', 'Safety', 'ROLL', 180.00, 10),
  ('SF-TPE-002', 'Reflective tape White/Red', 'Safety', 'ROLL', 180.00, 10),
  ('SF-GLS-001', 'safety glasses', 'Safety', 'PCS', 85.00, 25),

  -- SAFETY EQUIPMENT - RECYCLE BINS
  ('SF-BIN-001', 'Recycle bin yellow', 'Safety', 'PCS', 450.00, 5),
  ('SF-BIN-002', 'Recycle bin blue', 'Safety', 'PCS', 450.00, 5),
  ('SF-BIN-003', 'Recycle bin green', 'Safety', 'PCS', 450.00, 5),
  ('SF-BIN-004', 'Recycle bin red', 'Safety', 'PCS', 450.00, 5),

  -- MEDICAL SUPPLIES - MASKS
  ('MD-MSK-001', 'Surgical Mask', 'Medical', 'BOX', 150.00, 20),
  ('MD-MSK-002', 'KF94', 'Medical', 'BOX', 250.00, 15),
  ('MD-MSK-003', '3M Mask', 'Medical', 'PCS', 45.00, 30),
  ('MD-FSH-001', 'Face Sheild', 'Medical', 'PCS', 180.00, 15),
  ('MD-MSK-004', 'Cotton Mask', 'Medical', 'PCS', 25.00, 50),
  ('MD-TST-001', 'AG-Test Kit', 'Medical', 'PCS', 120.00, 20),

  -- MEDICAL SUPPLIES - SANITIZERS
  ('MD-ALC-001', 'Alcohol Gel 3.8 L.', 'Medical', 'BTL', 280.00, 10),
  ('MD-ALC-002', 'Alcohol Water 5 L.', 'Medical', 'BTL', 250.00, 10),
  ('MD-ALC-003', 'Alcohol Gel 1 L.', 'Medical', 'BTL', 85.00, 15),
  ('MD-ALC-004', 'Alcohol Gel 500 ml.', 'Medical', 'BTL', 50.00, 20),
  ('MD-GLV-001', 'Surgical Glove', 'Medical', 'BOX', 180.00, 15),

  -- UNIFORMS - MALE
  ('UN-MAL-001', 'Male Uniform 4XL', 'Uniforms', 'PCS', 450.00, 3),
  ('UN-MAL-002', 'Male Uniform 3XL', 'Uniforms', 'PCS', 450.00, 5),
  ('UN-MAL-003', 'Male Uniform 2XL', 'Uniforms', 'PCS', 450.00, 8),
  ('UN-MAL-004', 'Male Uniform XL', 'Uniforms', 'PCS', 450.00, 10),
  ('UN-MAL-005', 'Male Uniform L', 'Uniforms', 'PCS', 450.00, 12),
  ('UN-MAL-006', 'Male Uniform M', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-MAL-007', 'Male Uniform S', 'Uniforms', 'PCS', 450.00, 10),

  -- UNIFORMS - FEMALE
  ('UN-FEM-001', 'Female Uniform 2XL', 'Uniforms', 'PCS', 450.00, 5),
  ('UN-FEM-002', 'Female Uniform XL', 'Uniforms', 'PCS', 450.00, 8),
  ('UN-FEM-003', 'Female Uniform L', 'Uniforms', 'PCS', 450.00, 10),
  ('UN-FEM-004', 'Female Uniform M', 'Uniforms', 'PCS', 450.00, 12),
  ('UN-FEM-005', 'Female Uniform S', 'Uniforms', 'PCS', 450.00, 10),
  ('UN-FEM-006', 'Female Uniform 3XL', 'Uniforms', 'PCS', 450.00, 3),
  ('UN-MTN-001', 'Maternity Dress', 'Uniforms', 'PCS', 550.00, 5)
) AS t(item_code, description, category, uom, unit_cost, reorder_level)
WHERE NOT EXISTS (
  SELECT 1 FROM items WHERE items.item_code = t.item_code
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Count departments
SELECT 'Departments' as table_name, COUNT(*) as total_records FROM departments;

-- Count categories
SELECT 'Categories' as table_name, COUNT(*) as total_records FROM categories;

-- Count UOM
SELECT 'UOM' as table_name, COUNT(*) as total_records FROM uom;

-- Count items by category
SELECT
  c.category_name,
  COUNT(i.item_id) as item_count
FROM categories c
LEFT JOIN items i ON c.category_id = i.category_id
GROUP BY c.category_name
ORDER BY item_count DESC;

-- Show sample items
SELECT
  item_code,
  description,
  c.category_name,
  u.uom_code,
  unit_cost,
  reorder_level
FROM items i
JOIN categories c ON i.category_id = c.category_id
JOIN uom u ON i.uom_id = u.uom_id
LIMIT 20;
