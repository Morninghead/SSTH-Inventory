-- =====================================================
-- SUPABASE DATABASE SCHEMA INSPECTOR (SIMPLE VERSION)
-- Get complete database structure
-- =====================================================

-- =====================================================
-- 1. LIST ALL TABLES
-- =====================================================
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 2. GET ALL COLUMNS WITH DATA TYPES AND CONSTRAINTS
-- =====================================================
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    CASE
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY → ' || fk.foreign_table_name || '(' || fk.foreign_column_name || ')'
        WHEN uq.column_name IS NOT NULL THEN 'UNIQUE'
        ELSE ''
    END as constraint_type
FROM information_schema.columns c
LEFT JOIN (
    SELECT kcu.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
    SELECT
        kcu.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
LEFT JOIN (
    SELECT kcu.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
) uq ON c.table_name = uq.table_name AND c.column_name = uq.column_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- =====================================================
-- 3. CHECK SPECIFIC IMPORTANT TABLES
-- =====================================================

-- Departments table
SELECT 'DEPARTMENTS TABLE' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'departments'
ORDER BY ordinal_position;

-- Categories table
SELECT 'CATEGORIES TABLE' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'categories'
ORDER BY ordinal_position;

-- Items table
SELECT 'ITEMS TABLE' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'items'
ORDER BY ordinal_position;

-- =====================================================
-- 4. CHECK EXISTING DATA
-- =====================================================

SELECT 'EXISTING DATA COUNTS' as info;

SELECT 'departments' as table_name, COUNT(*) as row_count FROM departments
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'items', COUNT(*) FROM items
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles;

-- =====================================================
-- 5. VIEW EXISTING DEPARTMENTS
-- =====================================================
SELECT 'EXISTING DEPARTMENTS' as info;
SELECT dept_code, dept_name FROM departments ORDER BY dept_code;

-- =====================================================
-- 6. VIEW EXISTING CATEGORIES
-- =====================================================
SELECT 'EXISTING CATEGORIES' as info;
SELECT category_code, category_name FROM categories ORDER BY category_code;

-- =====================================================
-- 7. VIEW SAMPLE ITEMS (First 10)
-- =====================================================
SELECT 'SAMPLE ITEMS' as info;
SELECT item_code, description, base_uom FROM items ORDER BY item_code LIMIT 10;
