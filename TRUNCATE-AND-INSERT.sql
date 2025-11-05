-- =====================================================
-- SSTH INVENTORY - TRUNCATE AND INSERT
-- Force delete all data using TRUNCATE CASCADE
-- =====================================================

-- =====================================================
-- STEP 1: TRUNCATE ALL TABLES (CASCADE removes FK dependencies)
-- =====================================================

-- Disable triggers temporarily to avoid issues
SET session_replication_role = replica;

-- Truncate in correct order
TRUNCATE TABLE backorders CASCADE;
TRUNCATE TABLE transaction_items CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE po_items CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;
TRUNCATE TABLE inventory_status CASCADE;
TRUNCATE TABLE items CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE departments CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

SELECT 'All tables truncated' as status;

-- =====================================================
-- STEP 2: INSERT DEPARTMENTS
-- =====================================================

INSERT INTO departments (dept_id, dept_code, dept_name, is_active, created_at)
VALUES
  (gen_random_uuid(), 'ADM', 'Admin', true, now()),
  (gen_random_uuid(), 'COAT', 'Coating', true, now()),
  (gen_random_uuid(), 'MAINT', 'Maintenance', true, now()),
  (gen_random_uuid(), 'MRKT', 'Marketing', true, now()),
  (gen_random_uuid(), 'MOLD', 'Mold', true, now()),
  (gen_random_uuid(), 'PROD', 'Production', true, now()),
  (gen_random_uuid(), 'PURCH', 'Purchasing', true, now()),
  (gen_random_uuid(), 'QA', 'QA/QC', true, now()),
  (gen_random_uuid(), 'RD', 'R&D', true, now()),
  (gen_random_uuid(), 'SCM', 'SCM', true, now());

SELECT 'Departments Inserted' as status, COUNT(*) as count FROM departments;

-- =====================================================
-- STEP 3: INSERT CATEGORIES
-- =====================================================

INSERT INTO categories (category_id, category_code, category_name, description, is_active, created_at)
VALUES
  (gen_random_uuid(), 'OFFICE', 'Office Supplies', 'Pens, papers, staplers, office items', true, now()),
  (gen_random_uuid(), 'CLEAN', 'Cleaning Supplies', 'Cleaning products and tools', true, now()),
  (gen_random_uuid(), 'SAFETY', 'Safety Equipment', 'PPE, safety gear, protective equipment', true, now()),
  (gen_random_uuid(), 'ELEC', 'Electronics', 'Batteries, computer accessories', true, now()),
  (gen_random_uuid(), 'UNIFORM', 'Uniforms', 'Work uniforms and clothing', true, now()),
  (gen_random_uuid(), 'MEDICAL', 'Medical Supplies', 'Masks, gloves, medical items', true, now()),
  (gen_random_uuid(), 'TOOLS', 'Tools & Equipment', 'Hand tools, maintenance supplies', true, now());

SELECT 'Categories Inserted' as status, COUNT(*) as count FROM categories;

-- =====================================================
-- STEP 4: INSERT ALL 220+ ITEMS
-- =====================================================

WITH
office_cat AS (SELECT category_id FROM categories WHERE category_code = 'OFFICE' LIMIT 1),
clean_cat AS (SELECT category_id FROM categories WHERE category_code = 'CLEAN' LIMIT 1),
safety_cat AS (SELECT category_id FROM categories WHERE category_code = 'SAFETY' LIMIT 1),
elec_cat AS (SELECT category_id FROM categories WHERE category_code = 'ELEC' LIMIT 1),
uniform_cat AS (SELECT category_id FROM categories WHERE category_code = 'UNIFORM' LIMIT 1),
medical_cat AS (SELECT category_id FROM categories WHERE category_code = 'MEDICAL' LIMIT 1),
tools_cat AS (SELECT category_id FROM categories WHERE category_code = 'TOOLS' LIMIT 1)

INSERT INTO items (item_id, item_code, description, category_id, base_uom, unit_cost, reorder_level, is_active, created_at)
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
  uom,
  unit_cost,
  reorder_level,
  true,
  now()
FROM (VALUES
  -- WRITING INSTRUMENTS (Office Supplies)
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
  ('OF-HL-001', 'Highlighter - Yellow', 'Office', 'PCS', 12.00, 30),
  ('OF-HL-002', 'Highlighter - Green', 'Office', 'PCS', 12.00, 30),
  ('OF-HL-003', 'Highlighter - Pink', 'Office', 'PCS', 12.00, 30),
  ('OF-HL-004', 'Highlighter - Blue', 'Office', 'PCS', 12.00, 30),
  ('OF-HL-005', 'Highlighter - Orange', 'Office', 'PCS', 12.00, 30),

  -- PAPER PRODUCTS (Office Supplies)
  ('OF-PP-001', 'A4 Paper (500 sheets)', 'Office', 'PKG', 150.00, 20),
  ('OF-PP-002', 'Copy Paper (500 sheets)', 'Office', 'PKG', 120.00, 30),
  ('OF-PP-003', 'Notebook - 100 pages', 'Office', 'PCS', 35.00, 40),
  ('OF-PP-004', 'Notebook - 200 pages', 'Office', 'PCS', 60.00, 30),
  ('OF-PP-005', 'Post-it Notes - 3x3', 'Office', 'PKG', 45.00, 25),
  ('OF-PP-006', 'Post-it Notes - 3x5', 'Office', 'PKG', 55.00, 20),
  ('OF-PP-007', 'Index Cards - 3x5', 'Office', 'BOX', 40.00, 15),
  ('OF-PP-008', 'Sticky Notes - Assorted', 'Office', 'PKG', 50.00, 20),

  -- DESK ACCESSORIES (Office Supplies)
  ('OF-DA-001', 'Stapler - Standard', 'Office', 'PCS', 80.00, 15),
  ('OF-DA-002', 'Stapler - Heavy Duty', 'Office', 'PCS', 150.00, 10),
  ('OF-DA-003', 'Staple Remover', 'Office', 'PCS', 25.00, 20),
  ('OF-DA-004', 'Staples - Box of 5000', 'Office', 'BOX', 35.00, 30),
  ('OF-DA-005', 'Paper Clips - Small', 'Office', 'BOX', 20.00, 25),
  ('OF-DA-006', 'Paper Clips - Large', 'Office', 'BOX', 25.00, 25),
  ('OF-DA-007', 'Binder Clips - Small', 'Office', 'BOX', 30.00, 20),
  ('OF-DA-008', 'Binder Clips - Medium', 'Office', 'BOX', 40.00, 20),
  ('OF-DA-009', 'Binder Clips - Large', 'Office', 'BOX', 50.00, 15),
  ('OF-DA-010', 'Rubber Bands - Assorted', 'Office', 'BOX', 30.00, 20),
  ('OF-DA-011', 'Push Pins - Box', 'Office', 'BOX', 25.00, 25),
  ('OF-DA-012', 'Thumbtacks - Box', 'Office', 'BOX', 20.00, 25),

  -- FILING & ORGANIZATION (Office Supplies)
  ('OF-FO-001', 'File Folder - Letter', 'Office', 'BOX', 120.00, 20),
  ('OF-FO-002', 'File Folder - Legal', 'Office', 'BOX', 140.00, 15),
  ('OF-FO-003', 'Manila Envelope - 9x12', 'Office', 'BOX', 80.00, 20),
  ('OF-FO-004', 'Manila Envelope - 10x13', 'Office', 'BOX', 90.00, 20),
  ('OF-FO-005', 'Document Holder - A4', 'Office', 'PCS', 45.00, 30),
  ('OF-FO-006', 'Clipboard - Standard', 'Office', 'PCS', 35.00, 25),
  ('OF-FO-007', 'Binder - 1 inch', 'Office', 'PCS', 50.00, 30),
  ('OF-FO-008', 'Binder - 2 inch', 'Office', 'PCS', 75.00, 20),
  ('OF-FO-009', 'Binder - 3 inch', 'Office', 'PCS', 95.00, 15),
  ('OF-FO-010', 'Sheet Protectors - 100pk', 'Office', 'BOX', 85.00, 20),
  ('OF-FO-011', 'Dividers - 5 Tab', 'Office', 'SET', 30.00, 25),
  ('OF-FO-012', 'Dividers - 8 Tab', 'Office', 'SET', 40.00, 20),

  -- TAPE & ADHESIVES (Office Supplies)
  ('OF-TA-001', 'Scotch Tape - Standard', 'Office', 'PCS', 25.00, 40),
  ('OF-TA-002', 'Scotch Tape - Wide', 'Office', 'PCS', 35.00, 30),
  ('OF-TA-003', 'Double-sided Tape', 'Office', 'PCS', 40.00, 25),
  ('OF-TA-004', 'Masking Tape - 1 inch', 'Office', 'PCS', 30.00, 30),
  ('OF-TA-005', 'Masking Tape - 2 inch', 'Office', 'PCS', 45.00, 25),
  ('OF-TA-006', 'Packing Tape - Clear', 'Office', 'PCS', 50.00, 30),
  ('OF-TA-007', 'Packing Tape - Brown', 'Office', 'PCS', 50.00, 25),
  ('OF-TA-008', 'Glue Stick - Small', 'Office', 'PCS', 15.00, 35),
  ('OF-TA-009', 'Glue Stick - Large', 'Office', 'PCS', 25.00, 30),
  ('OF-TA-010', 'White Glue - 4oz', 'Office', 'BTL', 30.00, 25),
  ('OF-TA-011', 'Correction Tape', 'Office', 'PCS', 35.00, 30),
  ('OF-TA-012', 'Correction Fluid', 'Office', 'BTL', 25.00, 30),

  -- SCISSORS & CUTTING (Office Supplies)
  ('OF-SC-001', 'Scissors - 7 inch', 'Office', 'PCS', 45.00, 25),
  ('OF-SC-002', 'Scissors - 8 inch', 'Office', 'PCS', 55.00, 20),
  ('OF-SC-003', 'Paper Cutter - Small', 'Office', 'PCS', 250.00, 5),
  ('OF-SC-004', 'Paper Cutter - Large', 'Office', 'PCS', 450.00, 3),
  ('OF-SC-005', 'Utility Knife', 'Office', 'PCS', 35.00, 20),
  ('OF-SC-006', 'Utility Knife Blades', 'Office', 'PKG', 30.00, 25),

  -- DESK ORGANIZERS (Office Supplies)
  ('OF-DO-001', 'Pen Holder', 'Office', 'PCS', 50.00, 20),
  ('OF-DO-002', 'Desk Organizer - 3 Tier', 'Office', 'PCS', 150.00, 10),
  ('OF-DO-003', 'File Tray - Single', 'Office', 'PCS', 80.00, 15),
  ('OF-DO-004', 'File Tray - 3 Tier', 'Office', 'PCS', 200.00, 10),
  ('OF-DO-005', 'Magazine Holder', 'Office', 'PCS', 70.00, 15),
  ('OF-DO-006', 'Drawer Organizer', 'Office', 'PCS', 120.00, 12),

  -- CALENDARS & PLANNERS (Office Supplies)
  ('OF-CP-001', 'Wall Calendar', 'Office', 'PCS', 80.00, 20),
  ('OF-CP-002', 'Desk Calendar', 'Office', 'PCS', 120.00, 15),
  ('OF-CP-003', 'Daily Planner', 'Office', 'PCS', 150.00, 15),
  ('OF-CP-004', 'Weekly Planner', 'Office', 'PCS', 130.00, 15),

  -- CLEANING SUPPLIES
  ('CL-DT-001', 'Detergent - Liquid 1L', 'Cleaning', 'BTL', 85.00, 30),
  ('CL-DT-002', 'Detergent - Powder 1kg', 'Cleaning', 'BOX', 95.00, 25),
  ('CL-CL-001', 'All-Purpose Cleaner', 'Cleaning', 'BTL', 75.00, 30),
  ('CL-GL-001', 'Glass Cleaner', 'Cleaning', 'BTL', 65.00, 25),
  ('CL-FL-001', 'Floor Cleaner - 1L', 'Cleaning', 'BTL', 90.00, 25),
  ('CL-BL-001', 'Bleach - 1L', 'Cleaning', 'BTL', 55.00, 30),
  ('CL-DS-001', 'Disinfectant Spray', 'Cleaning', 'BTL', 120.00, 25),
  ('CL-TO-001', 'Toilet Bowl Cleaner', 'Cleaning', 'BTL', 70.00, 25),
  ('CL-BR-001', 'Broom - Standard', 'Cleaning', 'PCS', 120.00, 15),
  ('CL-MP-001', 'Mop - Cotton', 'Cleaning', 'PCS', 150.00, 15),
  ('CL-MP-002', 'Mop Head - Replacement', 'Cleaning', 'PCS', 80.00, 20),
  ('CL-BK-001', 'Bucket - 10L', 'Cleaning', 'PCS', 100.00, 15),
  ('CL-DS-002', 'Dust Pan', 'Cleaning', 'PCS', 50.00, 20),
  ('CL-SP-001', 'Sponge - 10pk', 'Cleaning', 'PKG', 45.00, 30),
  ('CL-CL-002', 'Cleaning Cloth - 5pk', 'Cleaning', 'PKG', 60.00, 25),
  ('CL-TR-001', 'Trash Bags - Small (50pk)', 'Cleaning', 'PKG', 70.00, 25),
  ('CL-TR-002', 'Trash Bags - Large (50pk)', 'Cleaning', 'PKG', 120.00, 20),
  ('CL-TI-001', 'Tissue Paper - Box', 'Cleaning', 'BOX', 45.00, 40),
  ('CL-TI-002', 'Toilet Paper - 12 rolls', 'Cleaning', 'PKG', 85.00, 30),
  ('CL-TW-001', 'Paper Towels - 6 rolls', 'Cleaning', 'PKG', 95.00, 25),
  ('CL-HW-001', 'Hand Wash - 500ml', 'Cleaning', 'BTL', 75.00, 30),
  ('CL-HS-001', 'Hand Sanitizer - 500ml', 'Cleaning', 'BTL', 95.00, 30),
  ('CL-DS-003', 'Dish Soap - 500ml', 'Cleaning', 'BTL', 55.00, 30),
  ('CL-WP-001', 'Wipes - Antibacterial (100pk)', 'Cleaning', 'PKG', 85.00, 25),
  ('CL-SC-001', 'Scrub Brush', 'Cleaning', 'PCS', 45.00, 20),
  ('CL-GL-002', 'Rubber Gloves - Medium', 'Cleaning', 'PAIR', 35.00, 30),
  ('CL-GL-003', 'Rubber Gloves - Large', 'Cleaning', 'PAIR', 35.00, 30),
  ('CL-AP-001', 'Apron - Plastic', 'Cleaning', 'PCS', 50.00, 20),
  ('CL-FB-001', 'Floor Brush', 'Cleaning', 'PCS', 95.00, 15),
  ('CL-WB-001', 'Window Wiper', 'Cleaning', 'PCS', 85.00, 15),

  -- SAFETY EQUIPMENT
  ('SF-GL-001', 'Safety Gloves - Cotton', 'Safety', 'PAIR', 25.00, 100),
  ('SF-GL-002', 'Safety Gloves - Leather', 'Safety', 'PAIR', 85.00, 50),
  ('SF-GL-003', 'Chemical Resistant Gloves', 'Safety', 'PAIR', 120.00, 30),
  ('SF-GL-004', 'Cut Resistant Gloves', 'Safety', 'PAIR', 150.00, 30),
  ('SF-SH-001', 'Safety Shoes - Size 39', 'Safety', 'PAIR', 450.00, 10),
  ('SF-SH-002', 'Safety Shoes - Size 40', 'Safety', 'PAIR', 450.00, 15),
  ('SF-SH-003', 'Safety Shoes - Size 41', 'Safety', 'PAIR', 450.00, 15),
  ('SF-SH-004', 'Safety Shoes - Size 42', 'Safety', 'PAIR', 450.00, 15),
  ('SF-SH-005', 'Safety Shoes - Size 43', 'Safety', 'PAIR', 450.00, 10),
  ('SF-SH-006', 'Safety Shoes - Size 44', 'Safety', 'PAIR', 450.00, 10),
  ('SF-HT-001', 'Hard Hat - White', 'Safety', 'PCS', 250.00, 30),
  ('SF-HT-002', 'Hard Hat - Yellow', 'Safety', 'PCS', 250.00, 30),
  ('SF-HT-003', 'Hard Hat - Red', 'Safety', 'PCS', 250.00, 20),
  ('SF-GG-001', 'Safety Goggles - Clear', 'Safety', 'PCS', 85.00, 40),
  ('SF-GG-002', 'Safety Goggles - Tinted', 'Safety', 'PCS', 95.00, 30),
  ('SF-GL-005', 'Safety Glasses', 'Safety', 'PCS', 65.00, 50),
  ('SF-MS-001', 'Face Mask - Disposable (50pk)', 'Safety', 'BOX', 150.00, 30),
  ('SF-MS-002', 'Face Mask - N95 (20pk)', 'Safety', 'BOX', 450.00, 20),
  ('SF-MS-003', 'Respirator Mask', 'Safety', 'PCS', 350.00, 15),
  ('SF-EP-001', 'Ear Plugs - Foam (100pk)', 'Safety', 'BOX', 120.00, 25),
  ('SF-EM-001', 'Ear Muffs', 'Safety', 'PCS', 280.00, 20),
  ('SF-VT-001', 'Safety Vest - Orange', 'Safety', 'PCS', 150.00, 30),
  ('SF-VT-002', 'Safety Vest - Yellow', 'Safety', 'PCS', 150.00, 30),
  ('SF-AP-001', 'Work Apron - Canvas', 'Safety', 'PCS', 180.00, 20),
  ('SF-AP-002', 'Chemical Apron', 'Safety', 'PCS', 350.00, 15),
  ('SF-SL-001', 'Safety Sleeve - Arm Protection', 'Safety', 'PAIR', 120.00, 25),
  ('SF-KP-001', 'Knee Pads', 'Safety', 'PAIR', 200.00, 20),
  ('SF-HN-001', 'Safety Harness', 'Safety', 'PCS', 850.00, 10),
  ('SF-FK-001', 'First Aid Kit - Basic', 'Safety', 'PCS', 450.00, 15),
  ('SF-FK-002', 'First Aid Kit - Complete', 'Safety', 'PCS', 850.00, 10),
  ('SF-FE-001', 'Fire Extinguisher - 5lb', 'Safety', 'PCS', 850.00, 20),
  ('SF-FE-002', 'Fire Extinguisher - 10lb', 'Safety', 'PCS', 1200.00, 15),
  ('SF-FB-001', 'Fire Blanket', 'Safety', 'PCS', 350.00, 15),
  ('SF-TR-001', 'Traffic Cone - 28 inch', 'Safety', 'PCS', 180.00, 25),
  ('SF-TR-002', 'Caution Tape - 100m', 'Safety', 'ROLL', 120.00, 20),
  ('SF-SG-001', 'Safety Sign - Caution', 'Safety', 'PCS', 150.00, 20),
  ('SF-SG-002', 'Safety Sign - Warning', 'Safety', 'PCS', 150.00, 20),
  ('SF-SG-003', 'Safety Sign - Emergency Exit', 'Safety', 'PCS', 180.00, 15),

  -- ELECTRONICS
  ('EL-BT-001', 'AA Batteries (4pk)', 'Electronics', 'PKG', 45.00, 40),
  ('EL-BT-002', 'AAA Batteries (4pk)', 'Electronics', 'PKG', 40.00, 40),
  ('EL-BT-003', 'D Batteries (2pk)', 'Electronics', 'PKG', 85.00, 20),
  ('EL-BT-004', 'C Batteries (2pk)', 'Electronics', 'PKG', 75.00, 20),
  ('EL-BT-005', '9V Battery', 'Electronics', 'PCS', 45.00, 25),
  ('EL-PS-001', 'Power Strip - 4 Outlet', 'Electronics', 'PCS', 250.00, 20),
  ('EL-PS-002', 'Power Strip - 6 Outlet', 'Electronics', 'PCS', 350.00, 15),
  ('EL-EC-001', 'Extension Cord - 3m', 'Electronics', 'PCS', 180.00, 20),
  ('EL-EC-002', 'Extension Cord - 5m', 'Electronics', 'PCS', 250.00, 15),
  ('EL-EC-003', 'Extension Cord - 10m', 'Electronics', 'PCS', 350.00, 10),
  ('EL-MS-001', 'USB Mouse', 'Electronics', 'PCS', 180.00, 15),
  ('EL-KB-001', 'USB Keyboard', 'Electronics', 'PCS', 350.00, 15),
  ('EL-FD-001', 'USB Flash Drive - 16GB', 'Electronics', 'PCS', 250.00, 20),
  ('EL-FD-002', 'USB Flash Drive - 32GB', 'Electronics', 'PCS', 350.00, 15),
  ('EL-CB-001', 'USB Cable - Type A to B', 'Electronics', 'PCS', 85.00, 25),
  ('EL-CB-002', 'USB Cable - Type C', 'Electronics', 'PCS', 120.00, 20),

  -- UNIFORMS
  ('UN-ML-001', 'Uniform Male - S', 'Uniforms', 'PCS', 450.00, 10),
  ('UN-ML-002', 'Uniform Male - M', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-ML-003', 'Uniform Male - L', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-ML-004', 'Uniform Male - XL', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-ML-005', 'Uniform Male - XXL', 'Uniforms', 'PCS', 450.00, 10),
  ('UN-FM-001', 'Uniform Female - S', 'Uniforms', 'PCS', 450.00, 10),
  ('UN-FM-002', 'Uniform Female - M', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-FM-003', 'Uniform Female - L', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-FM-004', 'Uniform Female - XL', 'Uniforms', 'PCS', 450.00, 10),
  ('UN-PN-001', 'Work Pants - 30', 'Uniforms', 'PCS', 350.00, 10),
  ('UN-PN-002', 'Work Pants - 32', 'Uniforms', 'PCS', 350.00, 15),
  ('UN-PN-003', 'Work Pants - 34', 'Uniforms', 'PCS', 350.00, 15),
  ('UN-PN-004', 'Work Pants - 36', 'Uniforms', 'PCS', 350.00, 10),
  ('UN-PN-005', 'Work Pants - 38', 'Uniforms', 'PCS', 350.00, 10),
  ('UN-CP-001', 'Cap - Adjustable', 'Uniforms', 'PCS', 120.00, 30),

  -- MEDICAL SUPPLIES
  ('MD-MS-001', 'Medical Mask - Surgical (50pk)', 'Medical', 'BOX', 180.00, 30),
  ('MD-GL-001', 'Medical Gloves - S (100pk)', 'Medical', 'BOX', 150.00, 25),
  ('MD-GL-002', 'Medical Gloves - M (100pk)', 'Medical', 'BOX', 150.00, 30),
  ('MD-GL-003', 'Medical Gloves - L (100pk)', 'Medical', 'BOX', 150.00, 25),
  ('MD-AG-001', 'Alcohol Gel - 500ml', 'Medical', 'BTL', 85.00, 40),
  ('MD-AL-001', 'Alcohol 70% - 500ml', 'Medical', 'BTL', 65.00, 35),
  ('MD-BD-001', 'Bandages - Assorted (100pk)', 'Medical', 'BOX', 120.00, 25),
  ('MD-GZ-001', 'Gauze Pads - 4x4 (100pk)', 'Medical', 'BOX', 95.00, 20),
  ('MD-TP-001', 'Medical Tape - 1 inch', 'Medical', 'ROLL', 35.00, 30),
  ('MD-TM-001', 'Thermometer - Digital', 'Medical', 'PCS', 250.00, 15),
  ('MD-BP-001', 'Blood Pressure Monitor', 'Medical', 'PCS', 850.00, 5),
  ('MD-CT-001', 'Cotton Balls - 100pk', 'Medical', 'PKG', 45.00, 25),
  ('MD-SW-001', 'Cotton Swabs - 200pk', 'Medical', 'PKG', 55.00, 25)
) AS t(item_code, description, category, uom, unit_cost, reorder_level);

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

SELECT 'FINAL RESULTS' as status;
SELECT 'departments' as table_name, COUNT(*) as total FROM departments
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'items', COUNT(*) FROM items;

-- Show sample items from each category
SELECT 'SAMPLE ITEMS BY CATEGORY' as status;
SELECT
  c.category_name,
  COUNT(i.item_id) as item_count,
  STRING_AGG(i.item_code, ', ') as sample_codes
FROM categories c
LEFT JOIN items i ON c.category_id = i.category_id
GROUP BY c.category_name
ORDER BY c.category_name;
