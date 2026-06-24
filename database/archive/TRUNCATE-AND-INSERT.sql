-- =====================================================
-- SSTH INVENTORY - TRUNCATE AND INSERT
-- Force delete all data using TRUNCATE CASCADE
-- =====================================================

-- =====================================================
-- STEP 1: TRUNCATE ALL TABLES (CASCADE removes FK dependencies)
-- =====================================================

-- Truncate in correct order (only tables that exist)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN ('transaction_items', 'transactions', 'po_items', 'purchase_orders', 'items', 'categories', 'departments')
    LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(t) || ' CASCADE';
    END LOOP;
END $$;

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
-- STEP 3.5: ENSURE USER PROFILE EXISTS FOR SEEDING
-- =====================================================

-- When running from SQL Editor, auth.uid() is null.
-- We need a valid user_profiles.id for created_by.
-- This ensures at least one user_profiles row exists.
DO $$
DECLARE
    target_email TEXT := 'nopanat.aplus@gmail.com';
    user_id UUID;
BEGIN
    -- Try to find specific dev user first
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;

    IF user_id IS NOT NULL THEN
        -- Insert/Update Nopanat as Developer
        INSERT INTO user_profiles (id, full_name, role, is_active, created_at)
        VALUES (user_id, 'Nopanat', 'developer', true, now())
        ON CONFLICT (id) DO UPDATE
        SET role = 'developer', is_active = true;
    ELSE
        -- Fallback: Pick the first created user as Admin if no profiles exist
        IF NOT EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN
            INSERT INTO user_profiles (id, full_name, role, is_active, created_at)
            SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), 'admin', true, now()
            FROM auth.users
            ORDER BY created_at ASC
            LIMIT 1
            ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;
END $$;

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

INSERT INTO items (item_id, item_code, description, description_th, category_id, base_uom, unit_cost, reorder_level, is_active, created_at, created_by)
SELECT
  gen_random_uuid(),
  item_code,
  description,
  description_th,
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
  now(),
  COALESCE(auth.uid(), (SELECT id FROM user_profiles ORDER BY created_at ASC LIMIT 1))
FROM (VALUES
  -- WRITING INSTRUMENTS (Office Supplies)
  ('OF-001', 'Ballpen - blue', 'ปากกาลูกลื่น - สีน้ำเงิน', 'Office', 'PCS', 5.00, 50),
  ('OF-002', 'Ballpen - red', 'ปากกาลูกลื่น - สีแดง', 'Office', 'PCS', 5.00, 50),
  ('OF-003', 'Marker - blue', 'ปากกาเคมี - สีน้ำเงิน', 'Office', 'PCS', 15.00, 30),
  ('OF-004', 'Marker - red', 'ปากกาเคมี - สีแดง', 'Office', 'PCS', 15.00, 30),
  ('OF-005', 'Marker - black', 'ปากกาเคมี - สีดำ', 'Office', 'PCS', 15.00, 30),
  ('OF-006', 'Whiteboard - blue', 'ปากกาไวท์บอร์ด - สีน้ำเงิน', 'Office', 'PCS', 20.00, 20),
  ('OF-007', 'Whiteboard - red', 'ปากกาไวท์บอร์ด - สีแดง', 'Office', 'PCS', 20.00, 20),
  ('OF-008', 'Whiteboard - black', 'ปากกาไวท์บอร์ด - สีดำ', 'Office', 'PCS', 20.00, 20),
  ('OF-009', 'Permanent - Blue', 'ปากกาเคมีถาวร - สีน้ำเงิน', 'Office', 'PCS', 18.00, 25),
  ('OF-010', 'Permanent - Red', 'ปากกาเคมีถาวร - สีแดง', 'Office', 'PCS', 18.00, 25),
  ('OF-011', 'Permanent - Black', 'ปากกาเคมีถาวร - สีดำ', 'Office', 'PCS', 18.00, 25),
  ('OF-012', 'Highlighter - Yellow', 'ปากกาเน้นข้อความ - สีเหลือง', 'Office', 'PCS', 12.00, 30),
  ('OF-013', 'Highlighter - Green', 'ปากกาเน้นข้อความ - สีเขียว', 'Office', 'PCS', 12.00, 30),
  ('OF-014', 'Highlighter - Pink', 'ปากกาเน้นข้อความ - สีชมพู', 'Office', 'PCS', 12.00, 30),
  ('OF-015', 'Highlighter - Blue', 'ปากกาเน้นข้อความ - สีฟ้า', 'Office', 'PCS', 12.00, 30),
  ('OF-016', 'Highlighter - Orange', 'ปากกาเน้นข้อความ - สีส้ม', 'Office', 'PCS', 12.00, 30),
  ('OF-017', 'A4 Paper (500 sheets)', 'กระดาษ A4 (500 แผ่น)', 'Office', 'REAM', 150.00, 20),
  ('OF-018', 'Copy Paper (500 sheets)', 'กระดาษถ่ายเอกสาร (500 แผ่น)', 'Office', 'REAM', 120.00, 30),
  ('OF-019', 'Notebook - 100 pages', 'สมุดโน้ต (100 หน้า)', 'Office', 'PCS', 35.00, 40),
  ('OF-020', 'Notebook - 200 pages', 'สมุดโน้ต (200 หน้า)', 'Office', 'PCS', 60.00, 30),
  ('OF-021', 'Post-it Notes - 3x3', 'โพสต์อิท (3x3 นิ้ว)', 'Office', 'PKG', 45.00, 25),
  ('OF-022', 'Post-it Notes - 3x5', 'โพสต์อิท (3x5 นิ้ว)', 'Office', 'PKG', 55.00, 20),
  ('OF-023', 'Index Cards - 3x5', 'บัตรคำ (3x5 นิ้ว)', 'Office', 'BOX', 40.00, 15),
  ('OF-024', 'Sticky Notes - Assorted', 'สติ๊กเกอร์โน้ต คละสี', 'Office', 'PKG', 50.00, 20),
  ('OF-025', 'Stapler - Standard', 'ที่เย็บกระดาษ - มาตรฐาน', 'Office', 'PCS', 80.00, 15),
  ('OF-026', 'Stapler - Heavy Duty', 'ที่เย็บกระดาษ - งานหนัก', 'Office', 'PCS', 150.00, 10),
  ('OF-027', 'Staple Remover', 'ที่ถอนลวดเย็บกระดาษ', 'Office', 'PCS', 25.00, 20),
  ('OF-028', 'Staples - Box of 5000', 'ลวดเย็บกระดาษ (กล่อง 5000 ตัว)', 'Office', 'BOX', 35.00, 30),
  ('OF-029', 'Paper Clips - Small', 'คลิปหนีบกระดาษ - เล็ก', 'Office', 'BOX', 20.00, 25),
  ('OF-030', 'Paper Clips - Large', 'คลิปหนีบกระดาษ - ใหญ่', 'Office', 'BOX', 25.00, 25),
  ('OF-031', 'Binder Clips - Small', 'คลิปดำ - เล็ก', 'Office', 'BOX', 30.00, 20),
  ('OF-032', 'Binder Clips - Medium', 'คลิปดำ - กลาง', 'Office', 'BOX', 40.00, 20),
  ('OF-033', 'Binder Clips - Large', 'คลิปดำ - ใหญ่', 'Office', 'BOX', 50.00, 15),
  ('OF-034', 'Rubber Bands - Assorted', 'หนังยาง - คละแบบ', 'Office', 'BOX', 30.00, 20),
  ('OF-035', 'Push Pins - Box', 'หมุดปัก - กล่อง', 'Office', 'BOX', 25.00, 25),
  ('OF-036', 'Thumbtacks - Box', 'เป๊กกด - กล่อง', 'Office', 'BOX', 20.00, 25),
  ('OF-037', 'File Folder - Letter', 'แฟ้มเอกสาร - Letter', 'Office', 'BOX', 120.00, 20),
  ('OF-038', 'File Folder - Legal', 'แฟ้มเอกสาร - Legal', 'Office', 'BOX', 140.00, 15),
  ('OF-039', 'Manila Envelope - 9x12', 'ซองเอกสารสีน้ำตาล - 9x12', 'Office', 'BOX', 80.00, 20),
  ('OF-040', 'Manila Envelope - 10x13', 'ซองเอกสารสีน้ำตาล - 10x13', 'Office', 'BOX', 90.00, 20),
  ('OF-041', 'Document Holder - A4', 'กล่องใส่เอกสาร - A4', 'Office', 'PCS', 45.00, 30),
  ('OF-042', 'Clipboard - Standard', 'คลิปบอร์ด - มาตรฐาน', 'Office', 'PCS', 35.00, 25),
  ('OF-043', 'Binder - 1 inch', 'แฟ้มห่วง - 1 นิ้ว', 'Office', 'PCS', 50.00, 30),
  ('OF-044', 'Binder - 2 inch', 'แฟ้มห่วง - 2 นิ้ว', 'Office', 'PCS', 75.00, 20),
  ('OF-045', 'Binder - 3 inch', 'แฟ้มห่วง - 3 นิ้ว', 'Office', 'PCS', 95.00, 15),
  ('OF-046', 'Sheet Protectors - 100pk', 'ไส้แฟ้ม - แพ็ค 100 แผ่น', 'Office', 'BOX', 85.00, 20),
  ('OF-047', 'Dividers - 5 Tab', 'อินเด็กซ์ - 5 หยัก', 'Office', 'SET', 30.00, 25),
  ('OF-048', 'Dividers - 8 Tab', 'อินเด็กซ์ - 8 หยัก', 'Office', 'SET', 40.00, 20),
  ('OF-049', 'Scotch Tape - Standard', 'สก๊อตเทป - มาตรฐาน', 'Office', 'PCS', 25.00, 40),
  ('OF-050', 'Scotch Tape - Wide', 'สก๊อตเทป - หน้ากว้าง', 'Office', 'PCS', 35.00, 30),
  ('OF-051', 'Double-sided Tape', 'เทปกาวสองหน้า', 'Office', 'PCS', 40.00, 25),
  ('OF-052', 'Masking Tape - 1 inch', 'เทปย่น - 1 นิ้ว', 'Office', 'PCS', 30.00, 30),
  ('OF-053', 'Masking Tape - 2 inch', 'เทปย่น - 2 นิ้ว', 'Office', 'PCS', 45.00, 25),
  ('OF-054', 'Packing Tape - Clear', 'เทปใสปิดกล่อง', 'Office', 'PCS', 50.00, 30),
  ('OF-055', 'Packing Tape - Brown', 'เทปน้ำตาลปิดกล่อง', 'Office', 'PCS', 50.00, 25),
  ('OF-056', 'Glue Stick - Small', 'กาวแท่ง - เล็ก', 'Office', 'PCS', 15.00, 35),
  ('OF-057', 'Glue Stick - Large', 'กาวแท่ง - ใหญ่', 'Office', 'PCS', 25.00, 30),
  ('OF-058', 'White Glue - 4oz', 'กาวลาเท็กซ์ - 4oz', 'Office', 'BTL', 30.00, 25),
  ('OF-059', 'Correction Tape', 'เทปลบคำผิด', 'Office', 'PCS', 35.00, 30),
  ('OF-060', 'Correction Fluid', 'น้ำยาลบคำผิด', 'Office', 'BTL', 25.00, 30),
  ('OF-061', 'Scissors - 7 inch', 'กรรไกร - 7 นิ้ว', 'Office', 'PCS', 45.00, 25),
  ('OF-062', 'Scissors - 8 inch', 'กรรไกร - 8 นิ้ว', 'Office', 'PCS', 55.00, 20),
  ('OF-063', 'Paper Cutter - Small', 'แท่นตัดกระดาษ - เล็ก', 'Office', 'PCS', 250.00, 5),
  ('OF-064', 'Paper Cutter - Large', 'แท่นตัดกระดาษ - ใหญ่', 'Office', 'PCS', 450.00, 3),
  ('OF-065', 'Utility Knife', 'คัตเตอร์', 'Office', 'PCS', 35.00, 20),
  ('OF-066', 'Utility Knife Blades', 'ใบมีดคัตเตอร์', 'Office', 'PKG', 30.00, 25),
  ('OF-067', 'Pen Holder', 'กล่องใส่ปากกา', 'Office', 'PCS', 50.00, 20),
  ('OF-068', 'Desk Organizer - 3 Tier', 'ชั้นวางเอกสาร - 3 ชั้น', 'Office', 'PCS', 150.00, 10),
  ('OF-069', 'File Tray - Single', 'ถาดใส่เอกสาร - เดี่ยว', 'Office', 'PCS', 80.00, 15),
  ('OF-070', 'File Tray - 3 Tier', 'ถาดใส่เอกสาร - 3 ชั้น', 'Office', 'PCS', 200.00, 10),
  ('OF-071', 'Magazine Holder', 'กล่องใส่แฟ้ม/นิตยสาร', 'Office', 'PCS', 70.00, 15),
  ('OF-072', 'Drawer Organizer', 'ถาดจัดระเบียบลิ้นชัก', 'Office', 'PCS', 120.00, 12),
  ('OF-073', 'Wall Calendar', 'ปฏิทินแขวน', 'Office', 'PCS', 80.00, 20),
  ('OF-074', 'Desk Calendar', 'ปฏิทินตั้งโต๊ะ', 'Office', 'PCS', 120.00, 15),
  ('OF-075', 'Daily Planner', 'สมุดแพลนเนอร์รายวัน', 'Office', 'PCS', 150.00, 15),
  ('OF-076', 'Weekly Planner', 'สมุดแพลนเนอร์รายสัปดาห์', 'Office', 'PCS', 130.00, 15),
  ('CL-001', 'Detergent - Liquid 1L', 'น้ำยาซักผ้า (น้ำ 1 ลิตร)', 'Cleaning', 'BTL', 85.00, 30),
  ('CL-002', 'Detergent - Powder 1kg', 'ผงซักฟอก (1 กก.)', 'Cleaning', 'BOX', 95.00, 25),
  ('CL-003', 'All-Purpose Cleaner', 'น้ำยาทำความสะอาดอเนกประสงค์', 'Cleaning', 'BTL', 75.00, 30),
  ('CL-004', 'Glass Cleaner', 'น้ำยาเช็ดกระจก', 'Cleaning', 'BTL', 65.00, 25),
  ('CL-005', 'Floor Cleaner - 1L', 'น้ำยาถูพื้น (1 ลิตร)', 'Cleaning', 'BTL', 90.00, 25),
  ('CL-006', 'Bleach - 1L', 'น้ำยาฟอกขาว (1 ลิตร)', 'Cleaning', 'BTL', 55.00, 30),
  ('CL-007', 'Disinfectant Spray', 'สเปรย์ฆ่าเชื้อ', 'Cleaning', 'BTL', 120.00, 25),
  ('CL-008', 'Toilet Bowl Cleaner', 'น้ำยาล้างห้องน้ำ', 'Cleaning', 'BTL', 70.00, 25),
  ('CL-009', 'Broom - Standard', 'ไม้กวาด - มาตรฐาน', 'Cleaning', 'PCS', 120.00, 15),
  ('CL-010', 'Mop - Cotton', 'ไม้ถูพื้น - ผ้าฝ้าย', 'Cleaning', 'PCS', 150.00, 15),
  ('CL-011', 'Mop Head - Replacement', 'อะไหล่ผ้าม็อบ', 'Cleaning', 'PCS', 80.00, 20),
  ('CL-012', 'Bucket - 10L', 'ถังน้ำ - 10 ลิตร', 'Cleaning', 'PCS', 100.00, 15),
  ('CL-013', 'Dust Pan', 'ที่ตักผง', 'Cleaning', 'PCS', 50.00, 20),
  ('CL-014', 'Sponge - 10pk', 'ฟองน้ำ - แพ็ค 10 ชิ้น', 'Cleaning', 'PKG', 45.00, 30),
  ('CL-015', 'Cleaning Cloth - 5pk', 'ผ้าเช็ดทำความสะอาด - แพ็ค 5 ชิ้น', 'Cleaning', 'PKG', 60.00, 25),
  ('CL-016', 'Trash Bags - Small (50pk)', 'ถุงขยะ - เล็ก (แพ็ค 50 ใบ)', 'Cleaning', 'PKG', 70.00, 25),
  ('CL-017', 'Trash Bags - Large (50pk)', 'ถุงขยะ - ใหญ่ (แพ็ค 50 ใบ)', 'Cleaning', 'PKG', 120.00, 20),
  ('CL-018', 'Tissue Paper - Box', 'กระดาษทิชชู่ - กล่อง', 'Cleaning', 'BOX', 45.00, 40),
  ('CL-019', 'Toilet Paper - 12 rolls', 'กระดาษชำระ - 12 ม้วน', 'Cleaning', 'PKG', 85.00, 30),
  ('CL-020', 'Paper Towels - 6 rolls', 'กระดาษเอนกประสงค์ - 6 ม้วน', 'Cleaning', 'PKG', 95.00, 25),
  ('CL-021', 'Hand Wash - 500ml', 'สบู่เหลวล้างมือ - 500 มล.', 'Cleaning', 'BTL', 75.00, 30),
  ('CL-022', 'Hand Sanitizer - 500ml', 'เจลล้างมือ - 500 มล.', 'Cleaning', 'BTL', 95.00, 30),
  ('CL-023', 'Dish Soap - 500ml', 'น้ำยาล้างจาน - 500 มล.', 'Cleaning', 'BTL', 55.00, 30),
  ('CL-024', 'Wipes - Antibacterial (100pk)', 'ทิชชู่เปียกฆ่าเชื้อ (100 แผ่น)', 'Cleaning', 'PKG', 85.00, 25),
  ('CL-025', 'Scrub Brush', 'แปรงขัด', 'Cleaning', 'PCS', 45.00, 20),
  ('CL-026', 'Rubber Gloves - Medium', 'ถุงมือยาง - ไซส์ M', 'Cleaning', 'PAIR', 35.00, 30),
  ('CL-027', 'Rubber Gloves - Large', 'ถุงมือยาง - ไซส์ L', 'Cleaning', 'PAIR', 35.00, 30),
  ('CL-028', 'Apron - Plastic', 'ผ้ากันเปื้อน - พลาสติก', 'Cleaning', 'PCS', 50.00, 20),
  ('CL-029', 'Floor Brush', 'แปรงขัดพื้น', 'Cleaning', 'PCS', 95.00, 15),
  ('CL-030', 'Window Wiper', 'ไม้เช็ดกระจก', 'Cleaning', 'PCS', 85.00, 15),
  ('SF-001', 'Safety Gloves - Cotton', 'ถุงมือผ้า', 'Safety', 'PAIR', 25.00, 100),
  ('SF-002', 'Safety Gloves - Leather', 'ถุงมือหนัง', 'Safety', 'PAIR', 85.00, 50),
  ('SF-003', 'Chemical Resistant Gloves', 'ถุงมือกันสารเคมี', 'Safety', 'PAIR', 120.00, 30),
  ('SF-004', 'Cut Resistant Gloves', 'ถุงมือกันบาด', 'Safety', 'PAIR', 150.00, 30),
  ('SF-005', 'Safety Shoes - Size 39', 'รองเท้านิรภัย - เบอร์ 39', 'Safety', 'PAIR', 450.00, 10),
  ('SF-006', 'Safety Shoes - Size 40', 'รองเท้านิรภัย - เบอร์ 40', 'Safety', 'PAIR', 450.00, 15),
  ('SF-007', 'Safety Shoes - Size 41', 'รองเท้านิรภัย - เบอร์ 41', 'Safety', 'PAIR', 450.00, 15),
  ('SF-008', 'Safety Shoes - Size 42', 'รองเท้านิรภัย - เบอร์ 42', 'Safety', 'PAIR', 450.00, 15),
  ('SF-009', 'Safety Shoes - Size 43', 'รองเท้านิรภัย - เบอร์ 43', 'Safety', 'PAIR', 450.00, 10),
  ('SF-010', 'Safety Shoes - Size 44', 'รองเท้านิรภัย - เบอร์ 44', 'Safety', 'PAIR', 450.00, 10),
  ('SF-011', 'Hard Hat - White', 'หมวกนิรภัย - สีขาว', 'Safety', 'PCS', 250.00, 30),
  ('SF-012', 'Hard Hat - Yellow', 'หมวกนิรภัย - สีเหลือง', 'Safety', 'PCS', 250.00, 30),
  ('SF-013', 'Hard Hat - Red', 'หมวกนิรภัย - สีแดง', 'Safety', 'PCS', 250.00, 20),
  ('SF-014', 'Safety Goggles - Clear', 'แว่นตานิรภัย - ใส', 'Safety', 'PCS', 85.00, 40),
  ('SF-015', 'Safety Goggles - Tinted', 'แว่นตานิรภัย - สีชา', 'Safety', 'PCS', 95.00, 30),
  ('SF-016', 'Safety Glasses', 'แว่นตาเซฟตี้', 'Safety', 'PCS', 65.00, 50),
  ('SF-017', 'Face Mask - Disposable (50pk)', 'หน้ากากอนามัย (แพ็ค 50 ชิ้น)', 'Safety', 'BOX', 150.00, 30),
  ('SF-018', 'Face Mask - N95 (20pk)', 'หน้ากาก N95 (แพ็ค 20 ชิ้น)', 'Safety', 'BOX', 450.00, 20),
  ('SF-019', 'Respirator Mask', 'หน้ากากกันสารเคมี', 'Safety', 'PCS', 350.00, 15),
  ('SF-020', 'Ear Plugs - Foam (100pk)', 'ที่อุดหูโฟม (แพ็ค 100 คู่)', 'Safety', 'BOX', 120.00, 25),
  ('SF-021', 'Ear Muffs', 'ที่ครอบหูลดเสียง', 'Safety', 'PCS', 280.00, 20),
  ('SF-022', 'Safety Vest - Orange', 'เสื้อสะท้อนแสง - สีส้ม', 'Safety', 'PCS', 150.00, 30),
  ('SF-023', 'Safety Vest - Yellow', 'เสื้อสะท้อนแสง - สีเหลือง', 'Safety', 'PCS', 150.00, 30),
  ('SF-024', 'Work Apron - Canvas', 'ผ้ากันเปื้อน - ผ้าใบ', 'Safety', 'PCS', 180.00, 20),
  ('SF-025', 'Chemical Apron', 'ผ้ากันเปื้อนกันสารเคมี', 'Safety', 'PCS', 350.00, 15),
  ('SF-026', 'Safety Sleeve - Arm Protection', 'ปลอกแขนกันบาด', 'Safety', 'PAIR', 120.00, 25),
  ('SF-027', 'Knee Pads', 'สนับเข่า', 'Safety', 'PAIR', 200.00, 20),
  ('SF-028', 'Safety Harness', 'เข็มขัดนิรภัยกันตก', 'Safety', 'PCS', 850.00, 10),
  ('SF-029', 'First Aid Kit - Basic', 'ชุดปฐมพยาบาล - เบื้องต้น', 'Safety', 'PCS', 450.00, 15),
  ('SF-030', 'First Aid Kit - Complete', 'ชุดปฐมพยาบาล - ครบชุด', 'Safety', 'PCS', 850.00, 10),
  ('SF-031', 'Fire Extinguisher - 5lb', 'ถังดับเพลิง - 5 ปอนด์', 'Safety', 'PCS', 850.00, 20),
  ('SF-032', 'Fire Extinguisher - 10lb', 'ถังดับเพลิง - 10 ปอนด์', 'Safety', 'PCS', 1200.00, 15),
  ('SF-033', 'Fire Blanket', 'ผ้าห่มกันไฟ', 'Safety', 'PCS', 350.00, 15),
  ('SF-034', 'Traffic Cone - 28 inch', 'กรวยจราจร - 28 นิ้ว', 'Safety', 'PCS', 180.00, 25),
  ('SF-035', 'Caution Tape - 100m', 'เทปกั้นเขต - 100 เมตร', 'Safety', 'ROLL', 120.00, 20),
  ('SF-036', 'Safety Sign - Caution', 'ป้ายเตือน - ระวัง', 'Safety', 'PCS', 150.00, 20),
  ('SF-037', 'Safety Sign - Warning', 'ป้ายเตือน - อันตราย', 'Safety', 'PCS', 150.00, 20),
  ('SF-038', 'Safety Sign - Emergency Exit', 'ป้ายเตือน - ทางหนีไฟ', 'Safety', 'PCS', 180.00, 15),
  ('EL-001', 'AA Batteries (4pk)', 'ถ่าน AA (แพ็ค 4 ก้อน)', 'Electronics', 'PKG', 45.00, 40),
  ('EL-002', 'AAA Batteries (4pk)', 'ถ่าน AAA (แพ็ค 4 ก้อน)', 'Electronics', 'PKG', 40.00, 40),
  ('EL-003', 'D Batteries (2pk)', 'ถ่าน D (แพ็ค 2 ก้อน)', 'Electronics', 'PKG', 85.00, 20),
  ('EL-004', 'C Batteries (2pk)', 'ถ่าน C (แพ็ค 2 ก้อน)', 'Electronics', 'PKG', 75.00, 20),
  ('EL-005', '9V Battery', 'ถ่าน 9V', 'Electronics', 'PCS', 45.00, 25),
  ('EL-006', 'Power Strip - 4 Outlet', 'ปลั๊กพ่วง - 4 ช่อง', 'Electronics', 'PCS', 250.00, 20),
  ('EL-007', 'Power Strip - 6 Outlet', 'ปลั๊กพ่วง - 6 ช่อง', 'Electronics', 'PCS', 350.00, 15),
  ('EL-008', 'Extension Cord - 3m', 'สายต่อพ่วง - 3 เมตร', 'Electronics', 'PCS', 180.00, 20),
  ('EL-009', 'Extension Cord - 5m', 'สายต่อพ่วง - 5 เมตร', 'Electronics', 'PCS', 250.00, 15),
  ('EL-010', 'Extension Cord - 10m', 'สายต่อพ่วง - 10 เมตร', 'Electronics', 'PCS', 350.00, 10),
  ('EL-011', 'USB Mouse', 'เมาส์ USB', 'Electronics', 'PCS', 180.00, 15),
  ('EL-012', 'USB Keyboard', 'คีย์บอร์ด USB', 'Electronics', 'PCS', 350.00, 15),
  ('EL-013', 'USB Flash Drive - 16GB', 'แฟลชไดร์ฟ - 16GB', 'Electronics', 'PCS', 250.00, 20),
  ('EL-014', 'USB Flash Drive - 32GB', 'แฟลชไดร์ฟ - 32GB', 'Electronics', 'PCS', 350.00, 15),
  ('EL-015', 'USB Cable - Type A to B', 'สาย USB - Type A to B', 'Electronics', 'PCS', 85.00, 25),
  ('EL-016', 'USB Cable - Type C', 'สาย USB - Type C', 'Electronics', 'PCS', 120.00, 20),
  ('UN-001', 'Uniform Male - S', 'ชุดพนักงานชาย - S', 'Uniforms', 'PCS', 450.00, 10),
  ('UN-002', 'Uniform Male - M', 'ชุดพนักงานชาย - M', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-003', 'Uniform Male - L', 'ชุดพนักงานชาย - L', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-004', 'Uniform Male - XL', 'ชุดพนักงานชาย - XL', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-005', 'Uniform Male - XXL', 'ชุดพนักงานชาย - XXL', 'Uniforms', 'PCS', 450.00, 10),
  ('UN-006', 'Uniform Female - S', 'ชุดพนักงานหญิง - S', 'Uniforms', 'PCS', 450.00, 10),
  ('UN-007', 'Uniform Female - M', 'ชุดพนักงานหญิง - M', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-008', 'Uniform Female - L', 'ชุดพนักงานหญิง - L', 'Uniforms', 'PCS', 450.00, 15),
  ('UN-009', 'Uniform Female - XL', 'ชุดพนักงานหญิง - XL', 'Uniforms', 'PCS', 450.00, 10),
  ('UN-010', 'Work Pants - 30', 'กางเกงทำงาน - เอว 30', 'Uniforms', 'PCS', 350.00, 10),
  ('UN-011', 'Work Pants - 32', 'กางเกงทำงาน - เอว 32', 'Uniforms', 'PCS', 350.00, 15),
  ('UN-012', 'Work Pants - 34', 'กางเกงทำงาน - เอว 34', 'Uniforms', 'PCS', 350.00, 15),
  ('UN-013', 'Work Pants - 36', 'กางเกงทำงาน - เอว 36', 'Uniforms', 'PCS', 350.00, 10),
  ('UN-014', 'Work Pants - 38', 'กางเกงทำงาน - เอว 38', 'Uniforms', 'PCS', 350.00, 10),
  ('UN-015', 'Cap - Adjustable', 'หมวกแก๊ป', 'Uniforms', 'PCS', 120.00, 30),
  ('MD-001', 'Medical Mask - Surgical (50pk)', 'หน้ากากอนามัยทางการแพทย์ (แพ็ค 50 ชิ้น)', 'Medical', 'BOX', 180.00, 30),
  ('MD-002', 'Medical Gloves - S (100pk)', 'ถุงมือยางทางการแพทย์ - S (แพ็ค 100 ชิ้น)', 'Medical', 'BOX', 150.00, 25),
  ('MD-003', 'Medical Gloves - M (100pk)', 'ถุงมือยางทางการแพทย์ - M (แพ็ค 100 ชิ้น)', 'Medical', 'BOX', 150.00, 30),
  ('MD-004', 'Medical Gloves - L (100pk)', 'ถุงมือยางทางการแพทย์ - L (แพ็ค 100 ชิ้น)', 'Medical', 'BOX', 150.00, 25),
  ('MD-005', 'Alcohol Gel - 500ml', 'เจลแอลกอฮอล์ - 500 มล.', 'Medical', 'BTL', 85.00, 40),
  ('MD-006', 'Alcohol 70% - 500ml', 'แอลกอฮอล์ 70% - 500 มล.', 'Medical', 'BTL', 65.00, 35),
  ('MD-007', 'Bandages - Assorted (100pk)', 'พลาสเตอร์ปิดแผล (แพ็ค 100 ชิ้น)', 'Medical', 'BOX', 120.00, 25),
  ('MD-008', 'Gauze Pads - 4x4 (100pk)', 'ผ้าก๊อซ 4x4 นิ้ว (แพ็ค 100 ชิ้น)', 'Medical', 'BOX', 95.00, 20),
  ('MD-009', 'Medical Tape - 1 inch', 'เทปปิดแผล - 1 นิ้ว', 'Medical', 'ROLL', 35.00, 30),
  ('MD-010', 'Thermometer - Digital', 'ปรอทวัดไข้ดิจิตอล', 'Medical', 'PCS', 250.00, 15),
  ('MD-011', 'Blood Pressure Monitor', 'เครื่องวัดความดันโลหิต', 'Medical', 'PCS', 850.00, 5),
  ('MD-012', 'Cotton Balls - 100pk', 'สำลีก้อน (แพ็ค 100 ก้อน)', 'Medical', 'PKG', 45.00, 25),
  ('MD-013', 'Cotton Swabs - 200pk', 'สำลีก้าน (แพ็ค 200 ก้าน)', 'Medical', 'PKG', 55.00, 25)
) AS t(item_code, description, description_th, category, uom, unit_cost, reorder_level);

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
