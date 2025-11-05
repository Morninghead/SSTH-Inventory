-- =====================================================
-- SSTH INVENTORY - REAL INVENTORY DATA (218 ITEMS)
-- Run this AFTER creating the schema
-- =====================================================

-- First, truncate existing items
TRUNCATE TABLE inventory_status CASCADE;
TRUNCATE TABLE items CASCADE;

-- =====================================================
-- INSERT ALL 218 REAL ITEMS
-- =====================================================

WITH
-- Get category IDs
office_cat AS (SELECT category_id FROM categories WHERE category_code = 'OFFICE' LIMIT 1),
clean_cat AS (SELECT category_id FROM categories WHERE category_code = 'CLEAN' LIMIT 1),
safety_cat AS (SELECT category_id FROM categories WHERE category_code = 'SAFETY' LIMIT 1),
elec_cat AS (SELECT category_id FROM categories WHERE category_code = 'ELEC' LIMIT 1),
uniform_cat AS (SELECT category_id FROM categories WHERE category_code = 'UNIFORM' LIMIT 1),
medical_cat AS (SELECT category_id FROM categories WHERE category_code = 'MEDICAL' LIMIT 1),
-- Get admin user ID
admin_user AS (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1)

INSERT INTO items (item_id, item_code, description, category_id, base_uom, unit_cost, reorder_level, is_active, created_at, created_by)
SELECT
  uuid_generate_v4(),
  item_code,
  description,
  CASE
    WHEN category = 'Office' THEN (SELECT category_id FROM office_cat)
    WHEN category = 'Cleaning' THEN (SELECT category_id FROM clean_cat)
    WHEN category = 'Safety' THEN (SELECT category_id FROM safety_cat)
    WHEN category = 'Electronics' THEN (SELECT category_id FROM elec_cat)
    WHEN category = 'Uniforms' THEN (SELECT category_id FROM uniform_cat)
    WHEN category = 'Medical' THEN (SELECT category_id FROM medical_cat)
  END,
  uom,
  unit_cost,
  reorder_level,
  true,
  now(),
  (SELECT id FROM admin_user)
FROM (VALUES
  -- WRITING INSTRUMENTS (Office - 29 items)
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
  ('OF-CD-001', 'CD Marker', 'Office', 'PCS', 18.00, 20),
  ('OF-UP-001', 'Uni-Paint Marker (White)', 'Office', 'PCS', 25.00, 20),
  ('OF-UP-002', 'Uni-Paint Marker (Blue)', 'Office', 'PCS', 25.00, 20),
  ('OF-UP-003', 'Uni-Paint Marker (Pink)', 'Office', 'PCS', 25.00, 20),
  ('OF-UP-004', 'Uni-Paint Marker (Green)', 'Office', 'PCS', 25.00, 20),
  ('OF-UP-005', 'Uni-Paint Marker (Red)', 'Office', 'PCS', 25.00, 20),
  ('OF-UP-006', 'Uni-Paint Marker (Black)', 'Office', 'PCS', 25.00, 20),
  ('OF-UP-007', 'Uni-Paint Marker (Orange)', 'Office', 'PCS', 25.00, 20),
  ('OF-UP-008', 'Uni-Paint Marker (Yellow)', 'Office', 'PCS', 25.00, 20),
  ('OF-PC-001', 'Pencil', 'Office', 'PCS', 5.00, 50),
  ('OF-DP-001', 'Dermatograph Pencil - red', 'Office', 'PCS', 15.00, 25),
  ('OF-DP-002', 'Dermatograph Pencil - white', 'Office', 'PCS', 15.00, 25),
  ('OF-DP-003', 'Dermatograph Pencil - blue', 'Office', 'PCS', 15.00, 25),
  ('OF-DP-004', 'Dermatograph Pencil - black', 'Office', 'PCS', 15.00, 25),
  ('OF-ML-001', 'Mechanical pencil lead', 'Office', 'BOX', 25.00, 20),
  ('OF-ER-001', 'Eraser', 'Office', 'PCS', 8.00, 40),
  ('OF-LP-001', 'Liquid Paper & Liquid Tape', 'Office', 'PCS', 30.00, 25),

  -- FASTENERS & ADHESIVES (Office - 11 items)
  ('OF-FA-001', 'Fastenner', 'Office', 'BOX', 20.00, 30),
  ('OF-GS-001', 'Glue Stick', 'Office', 'PCS', 15.00, 35),
  ('OF-SH-001', 'Sharpener', 'Office', 'PCS', 10.00, 30),
  ('OF-RU-001', 'Ruler', 'Office', 'PCS', 15.00, 25),
  ('OF-DT-001', 'Double Sided Tissue Tape', 'Office', 'ROLL', 45.00, 20),
  ('OF-DF-001', 'Double Sided Foam Tape', 'Office', 'ROLL', 55.00, 20),
  ('OF-TT-001', 'Transparent Tape - Small Roll', 'Office', 'ROLL', 25.00, 40),
  ('OF-TT-002', 'Transparent Tape - Big Roll', 'Office', 'ROLL', 45.00, 30),
  ('OF-LT-001', 'Loytape Cellulose Tape', 'Office', 'ROLL', 30.00, 25),
  ('OF-BT-001', 'Barricade Tape (Red Tape)', 'Office', 'ROLL', 50.00, 20),
  ('OF-AS-001', 'Anti Slip Tape', 'Office', 'ROLL', 75.00, 15),

  -- CUTTING TOOLS (Office - 5 items)
  ('OF-CB-001', 'Cutter Spare Blade A-150', 'Office', 'PKG', 30.00, 25),
  ('OF-CB-002', 'Cutter Spare Blade A-100', 'Office', 'PKG', 25.00, 25),
  ('OF-CT-001', 'Cutter (BIG)', 'Office', 'PCS', 50.00, 15),
  ('OF-CT-002', 'Cutter (Small)', 'Office', 'PCS', 30.00, 20),
  ('OF-SC-001', 'Scissors', 'Office', 'PCS', 45.00, 25),

  -- STAMPS & INK (Office - 8 items)
  ('OF-SP-001', 'Stamp Pad - blue', 'Office', 'PCS', 40.00, 20),
  ('OF-SP-002', 'Stamp Pad - red', 'Office', 'PCS', 40.00, 20),
  ('OF-SI-001', 'Stamp Pad Ink - blue', 'Office', 'BTL', 35.00, 20),
  ('OF-SI-002', 'Stamp Pad Ink - red', 'Office', 'BTL', 35.00, 20),
  ('OF-RI-001', 'Refill Ink - blue', 'Office', 'BTL', 30.00, 25),
  ('OF-RI-002', 'Refill Ink - red', 'Office', 'BTL', 30.00, 25),
  ('OF-DS-001', 'Date Stamp (แบบยาง)', 'Office', 'PCS', 80.00, 10),
  ('OF-DS-002', 'Date Stamp', 'Office', 'PCS', 120.00, 10),

  -- STICKERS & LABELS (Office - 7 items)
  ('OF-LS-001', 'Line Sticker - red', 'Office', 'ROLL', 20.00, 30),
  ('OF-LS-002', 'Line Sticker - blue', 'Office', 'ROLL', 20.00, 30),
  ('OF-LS-003', 'Line Sticker - black', 'Office', 'ROLL', 20.00, 30),
  ('OF-LS-004', 'Line Sticker - pink', 'Office', 'ROLL', 20.00, 30),
  ('OF-LB-001', 'Label Sticker - small', 'Office', 'PKG', 25.00, 30),
  ('OF-LB-002', 'Label Sticker - big', 'Office', 'PKG', 35.00, 25),
  ('OF-LT-002', 'Label Tag', 'Office', 'PKG', 30.00, 25),

  -- BATTERIES (Electronics - 8 items)
  ('EL-BT-001', 'AA Battery', 'Electronics', 'PKG', 45.00, 40),
  ('EL-BT-002', 'AAA Battery', 'Electronics', 'PKG', 40.00, 40),
  ('EL-BT-003', 'Panasonic 23A', 'Electronics', 'PCS', 30.00, 30),
  ('EL-BT-004', 'LRV08 Battery', 'Electronics', 'PCS', 35.00, 25),
  ('EL-BT-005', 'Microphone Battery (9V)', 'Electronics', 'PCS', 45.00, 25),
  ('EL-BT-006', 'Lithium Battery (1.5V) LR41', 'Electronics', 'PCS', 20.00, 30),
  ('EL-BT-007', 'Lithium Battery (1.5V) LR44', 'Electronics', 'PCS', 20.00, 30),
  ('EL-BT-008', 'Lithium Battery (3V) CR2032', 'Electronics', 'PCS', 25.00, 35),

  -- CLIPS & STAPLES (Office - 14 items)
  ('OF-PC-002', 'Paper Clip', 'Office', 'BOX', 20.00, 35),
  ('OF-BC-001', 'Binder Clip No.112 (Small)', 'Office', 'BOX', 30.00, 25),
  ('OF-BC-002', 'Binder Clip No.110 (Middle)', 'Office', 'BOX', 35.00, 25),
  ('OF-BC-003', 'Binder Clip No.109 (Big)', 'Office', 'BOX', 40.00, 20),
  ('OF-ST-001', 'Staples no.10', 'Office', 'BOX', 25.00, 40),
  ('OF-ST-002', 'Staples no.B8', 'Office', 'BOX', 28.00, 30),
  ('OF-ST-003', 'Staples no.M8-1M', 'Office', 'BOX', 30.00, 25),
  ('OF-ST-004', 'Staples no.3(24/6)', 'Office', 'BOX', 25.00, 35),
  ('OF-ST-005', 'Staples no.23/13-H', 'Office', 'BOX', 32.00, 25),
  ('OF-ST-006', 'Staples no.10-1M', 'Office', 'BOX', 30.00, 30),
  ('OF-ST-007', 'Staples no.23/10-M', 'Office', 'BOX', 30.00, 30),
  ('OF-SP-003', 'Stapler', 'Office', 'PCS', 80.00, 20),
  ('OF-SP-004', 'Big Stapler', 'Office', 'PCS', 150.00, 10),
  ('OF-SR-001', 'Staple Remover', 'Office', 'PCS', 25.00, 25),

  -- PAPER PRODUCTS (Office - 16 items)
  ('OF-A4-001', 'A4 - red', 'Office', 'PKG', 120.00, 15),
  ('OF-A4-002', 'A4 - green', 'Office', 'PKG', 120.00, 15),
  ('OF-A4-003', 'A4 - pink', 'Office', 'PKG', 120.00, 15),
  ('OF-A4-004', 'A4 - blue', 'Office', 'PKG', 120.00, 15),
  ('OF-A4-005', 'A4 - yellow', 'Office', 'PKG', 120.00, 15),
  ('OF-A4-006', 'A4 Copy Paper', 'Office', 'PKG', 150.00, 25),
  ('OF-A3-001', 'A3 Copy Paper', 'Office', 'PKG', 180.00, 15),
  ('OF-ID-001', 'Plastic Index Tap Divider', 'Office', 'SET', 40.00, 20),
  ('OF-LH-001', 'L-Holder', 'Office', 'PCS', 8.00, 50),
  ('OF-SP-005', 'Sheet Protector - 11 holes', 'Office', 'PKG', 85.00, 25),
  ('OF-SA-001', 'Sticker Paper A4', 'Office', 'PKG', 95.00, 20),
  ('OF-CP-001', 'Carbon Paper', 'Office', 'PKG', 65.00, 20),
  ('OF-SF-001', 'Seminar File A4', 'Office', 'PCS', 15.00, 30),
  ('OF-TS-001', 'Transparency Sheet', 'Office', 'PKG', 120.00, 15),
  ('OF-MS-001', 'Magnetic Sheet (A4)', 'Office', 'PCS', 45.00, 20),
  ('OF-PI-001', 'Post-it 3*3', 'Office', 'PKG', 45.00, 30),
  ('OF-PI-002', 'Post-it Small', 'Office', 'PKG', 35.00, 30),
  ('OF-LF-001', 'Laminating Pouch Film - A3', 'Office', 'PKG', 150.00, 15),
  ('OF-LF-002', 'Laminating Pouch Film - A4', 'Office', 'PKG', 120.00, 20),

  -- CLEANING SUPPLIES - TISSUES (Cleaning - 3 items)
  ('CL-TI-001', 'Tissue - Toilet', 'Cleaning', 'PKG', 85.00, 30),
  ('CL-TI-002', 'Tissue - Face', 'Cleaning', 'BOX', 45.00, 40),
  ('CL-TI-003', 'Tissue - mouth', 'Cleaning', 'BOX', 40.00, 40),

  -- CLEANING SUPPLIES - CLEANERS (Cleaning - 9 items)
  ('CL-TC-001', 'Toilet Cleaner (Ped Pro)', 'Cleaning', 'BTL', 75.00, 25),
  ('CL-TC-002', 'Toilet Cleaner (Abel Plus)', 'Cleaning', 'BTL', 80.00, 25),
  ('CL-DM-001', 'Dust Mop Liquid', 'Cleaning', 'BTL', 65.00, 25),
  ('CL-FC-001', 'Floor Cleaner', 'Cleaning', 'BTL', 90.00, 25),
  ('CL-DC-001', 'Dishwashing Cleaner', 'Cleaning', 'BTL', 55.00, 30),
  ('CL-HC-001', 'Handwashing Cleaner', 'Cleaning', 'BTL', 75.00, 30),
  ('CL-BC-001', 'Bacteria Cleanner', 'Cleaning', 'BTL', 85.00, 25),
  ('CL-MC-001', 'Mirror Cleaner', 'Cleaning', 'BTL', 65.00, 25),
  ('CL-WP-001', 'Washing Powder', 'Cleaning', 'BOX', 95.00, 20),

  -- CLEANING SUPPLIES - BROOMS & MOPS (Cleaning - 9 items)
  ('CL-BR-001', 'Soft Broom', 'Cleaning', 'PCS', 120.00, 15),
  ('CL-BR-002', 'Coconut Broom', 'Cleaning', 'PCS', 85.00, 15),
  ('CL-BR-003', 'Cobweb broom', 'Cleaning', 'PCS', 95.00, 12),
  ('CL-MO-001', 'Mop', 'Cleaning', 'PCS', 150.00, 15),
  ('CL-MO-002', 'Mop 10"', 'Cleaning', 'PCS', 130.00, 15),
  ('CL-MO-003', 'Dust Mop', 'Cleaning', 'PCS', 140.00, 12),
  ('CL-MO-004', 'Spare Dust Mop', 'Cleaning', 'PCS', 80.00, 20),
  ('CL-MO-005', 'tatter(Mop)', 'Cleaning', 'PCS', 60.00, 20),
  ('CL-DP-001', 'Dustpan', 'Cleaning', 'PCS', 50.00, 20),

  -- CLEANING SUPPLIES - TOOLS (Cleaning - 13 items)
  ('CL-TB-001', 'Toilet brush', 'Cleaning', 'PCS', 45.00, 20),
  ('CL-TV-001', 'Toilet Vacuum Pump', 'Cleaning', 'PCS', 250.00, 8),
  ('CL-DU-001', 'Duster', 'Cleaning', 'PCS', 35.00, 25),
  ('CL-SB-001', 'Scotch Brite', 'Cleaning', 'PKG', 40.00, 30),
  ('CL-BY-001', 'Baygon', 'Cleaning', 'BTL', 120.00, 20),
  ('CL-SP-001', 'Sponge for washing dishes', 'Cleaning', 'PKG', 35.00, 35),
  ('CL-MB-001', 'Mirror brush', 'Cleaning', 'PCS', 65.00, 15),
  ('CL-WB-001', 'Water broom 24"', 'Cleaning', 'PCS', 180.00, 10),
  ('CL-FB-001', 'Long handle floor brush', 'Cleaning', 'PCS', 150.00, 12),
  ('CL-RG-001', 'Rubber Glove', 'Cleaning', 'PAIR', 35.00, 30),

  -- CLEANING SUPPLIES - GARBAGE BAGS (Cleaning - 5 items)
  ('CL-GB-001', 'Garbage bag 18*20', 'Cleaning', 'PKG', 60.00, 25),
  ('CL-GB-002', 'Garbage bag 24*28', 'Cleaning', 'PKG', 75.00, 25),
  ('CL-GB-003', 'Garbage bag 30*40', 'Cleaning', 'PKG', 95.00, 20),
  ('CL-GB-004', 'Garbage bag 36*45', 'Cleaning', 'PKG', 120.00, 20),
  ('CL-GB-005', 'Red garbage bags', 'Cleaning', 'PKG', 130.00, 15),

  -- ELECTRONICS & OFFICE EQUIPMENT (Electronics - 11 items)
  ('EL-CP-001', 'MDC CAP', 'Electronics', 'PCS', 150.00, 15),
  ('EL-LB-001', 'LED Blub - Long', 'Electronics', 'PCS', 85.00, 20),
  ('EL-LB-002', 'LED Blub - Short 9W', 'Electronics', 'PCS', 75.00, 25),
  ('EL-AR-001', 'Self Adhesive Rings', 'Electronics', 'PKG', 45.00, 20),
  ('EL-BE-001', 'Board Eraser', 'Electronics', 'PCS', 30.00, 25),
  ('EL-FM-001', 'Fingertip Moistener', 'Electronics', 'PCS', 40.00, 20),
  ('EL-VA-001', 'Vaseline', 'Electronics', 'JAR', 50.00, 20),
  ('EL-MS-001', 'Computer Mouse', 'Electronics', 'PCS', 180.00, 15),
  ('EL-KB-001', 'Keyboard', 'Electronics', 'PCS', 350.00, 10),
  ('EL-BP-001', 'Board Pin', 'Electronics', 'BOX', 25.00, 30),
  ('EL-CT-001', 'Cable Tile 4"', 'Electronics', 'PCS', 15.00, 40),

  -- SAFETY EQUIPMENT - EAR PROTECTION (Safety - 2 items)
  ('SF-EP-001', 'Ear Plug - wire', 'Safety', 'PAIR', 25.00, 50),
  ('SF-EP-002', 'Ear Plug - wireless(refill)', 'Safety', 'PKG', 120.00, 25),

  -- SAFETY EQUIPMENT - GLOVES (Safety - 6 items)
  ('SF-GL-001', 'Cotton Glove', 'Safety', 'PAIR', 20.00, 100),
  ('SF-GL-002', 'Microtex Glove', 'Safety', 'PAIR', 45.00, 60),
  ('SF-GL-003', 'PU Glove - orange', 'Safety', 'PAIR', 65.00, 40),
  ('SF-GL-004', 'PU Glove - Black', 'Safety', 'PAIR', 65.00, 40),
  ('SF-GL-005', 'PU Glove - White', 'Safety', 'PAIR', 65.00, 40),

  -- SAFETY EQUIPMENT - SHOES (Safety - 6 items)
  ('SF-SH-001', 'Safety Shoes NO.39', 'Safety', 'PAIR', 450.00, 10),
  ('SF-SH-002', 'Safety Shoes NO.40', 'Safety', 'PAIR', 450.00, 15),
  ('SF-SH-003', 'Safety Shoes NO.41', 'Safety', 'PAIR', 450.00, 15),
  ('SF-SH-004', 'Safety Shoes NO.42', 'Safety', 'PAIR', 450.00, 15),
  ('SF-SH-005', 'Safety Shoes NO.43', 'Safety', 'PAIR', 450.00, 12),
  ('SF-SH-006', 'Safety Shoes NO.44', 'Safety', 'PAIR', 450.00, 10),

  -- SAFETY EQUIPMENT - PPE (Safety - 11 items)
  ('SF-HT-001', 'HMT-AYL Safety helmet', 'Safety', 'PCS', 250.00, 25),
  ('SF-GL-006', 'Cut Resistant gloves level 5', 'Safety', 'PAIR', 150.00, 30),
  ('SF-GL-007', 'Cut Resistant gloves level 5 (Dot)', 'Safety', 'PAIR', 160.00, 25),
  ('SF-GL-008', 'Welding leather gloves', 'Safety', 'PAIR', 180.00, 20),
  ('SF-WS-001', 'KN-WEL - Welding sleeve protection', 'Safety', 'PCS', 220.00, 15),
  ('SF-AP-001', 'APN-AP04 - Apron Leather', 'Safety', 'PCS', 350.00, 12),
  ('SF-HP-001', 'ARM-GN - Hand Protection', 'Safety', 'PAIR', 120.00, 25),
  ('SF-FS-001', 'Face Sheild', 'Safety', 'PCS', 85.00, 30),
  ('SF-VB-001', 'Visor Bracket', 'Safety', 'PCS', 45.00, 25),
  ('SF-MS-001', 'Mask Carbon 5 layer', 'Safety', 'BOX', 150.00, 30),

  -- SAFETY EQUIPMENT - MATERIALS (Safety - 8 items)
  ('SF-CH-001', 'CHAIN-6MM-25M', 'Safety', 'PCS', 850.00, 8),
  ('SF-TP-001', 'Consumables -Traffic pole refueling', 'Safety', 'PCS', 120.00, 15),
  ('SF-CN-001', 'Consumables', 'Safety', 'PKG', 95.00, 20),
  ('SF-RT-001', 'Reflective tape Yellow/Black', 'Safety', 'ROLL', 120.00, 20),
  ('SF-RT-002', 'Reflective tape White/Red', 'Safety', 'ROLL', 120.00, 20),
  ('SF-SG-001', 'safety glasses', 'Safety', 'PCS', 65.00, 40),

  -- SAFETY EQUIPMENT - RECYCLE BINS (Safety - 4 items)
  ('SF-RB-001', 'Recycle bin yellow', 'Safety', 'PCS', 350.00, 10),
  ('SF-RB-002', 'Recycle bin blue', 'Safety', 'PCS', 350.00, 10),
  ('SF-RB-003', 'Recycle bin green', 'Safety', 'PCS', 350.00, 10),
  ('SF-RB-004', 'Recycle bin red', 'Safety', 'PCS', 350.00, 10),

  -- MEDICAL SUPPLIES - MASKS (Medical - 5 items)
  ('MD-MS-001', 'Surgical Mask', 'Medical', 'BOX', 180.00, 30),
  ('MD-MS-002', 'KF94', 'Medical', 'BOX', 250.00, 25),
  ('MD-MS-003', '3M Mask', 'Medical', 'BOX', 350.00, 20),
  ('MD-MS-004', 'Cotton Mask', 'Medical', 'PCS', 35.00, 50),

  -- MEDICAL SUPPLIES - TESTING & PROTECTION (Medical - 6 items)
  ('MD-AG-001', 'AG-Test Kit', 'Medical', 'BOX', 450.00, 15),
  ('MD-AL-001', 'Alcohol Gel 3.8 L.', 'Medical', 'BTL', 450.00, 15),
  ('MD-AL-002', 'Alcohol Water 5 L.', 'Medical', 'BTL', 350.00, 15),
  ('MD-AL-003', 'Alcohol Gel 1 L.', 'Medical', 'BTL', 150.00, 25),
  ('MD-AL-004', 'Alcohol Gel 500 ml.', 'Medical', 'BTL', 95.00, 30),
  ('MD-GL-001', 'Surgical Glove', 'Medical', 'BOX', 150.00, 30),

  -- UNIFORMS - MALE (Uniforms - 13 items - includes duplicates from list)
  ('UN-ML-001', 'Male Uniform 4XL', 'Uniforms', 'PCS', 450.00, 8),
  ('UN-ML-002', 'Male Uniform 3XL', 'Uniforms', 'PCS', 450.00, 12),
  ('UN-ML-003', 'Male Uniform 2XL', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-ML-004', 'Male Uniform XL', 'Uniforms', 'PCS', 450.00, 18),
  ('UN-ML-005', 'Male Uniform L', 'Uniforms', 'PCS', 450.00, 20),
  ('UN-ML-006', 'Male Uniform M', 'Uniforms', 'PCS', 450.00, 20),
  ('UN-ML-007', 'Male Uniform S', 'Uniforms', 'PCS', 450.00, 15),

  -- UNIFORMS - FEMALE (Uniforms - 12 items - includes duplicates from list)
  ('UN-FM-001', 'Female Uniform 3XL', 'Uniforms', 'PCS', 450.00, 8),
  ('UN-FM-002', 'Female Uniform 2XL', 'Uniforms', 'PCS', 450.00, 12),
  ('UN-FM-003', 'Female Uniform XL', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-FM-004', 'Female Uniform L', 'Uniforms', 'PCS', 450.00, 18),
  ('UN-FM-005', 'Female Uniform M', 'Uniforms', 'PCS', 450.00, 18),
  ('UN-FM-006', 'Female Uniform S', 'Uniforms', 'PCS', 450.00, 12),

  -- UNIFORMS - MATERNITY (Uniforms - 1 item)
  ('UN-MT-001', 'Maternity Dress', 'Uniforms', 'PCS', 550.00, 10)

) AS t(item_code, description, category, uom, unit_cost, reorder_level);

SELECT 'Items inserted' as status, COUNT(*) as count FROM items;

-- =====================================================
-- CREATE INVENTORY STATUS FOR ALL ITEMS
-- =====================================================

INSERT INTO inventory_status (item_id, quantity, updated_at)
SELECT item_id, 0, now()
FROM items;

SELECT 'Inventory status created' as status, COUNT(*) as count FROM inventory_status;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

SELECT 'REAL DATA INSERT COMPLETE!' as status;
SELECT '=====================================' as separator;
SELECT 'Item count by category:' as info;
SELECT
  c.category_name,
  COUNT(i.item_id) as item_count
FROM categories c
LEFT JOIN items i ON c.category_id = i.category_id
GROUP BY c.category_name
ORDER BY c.category_name;
