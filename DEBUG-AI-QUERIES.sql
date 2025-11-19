-- ========================================
-- DEBUG AI TABLE QUERIES
-- ========================================
-- Run this to test the exact queries that are failing in the application
-- Execute in: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

-- First, check if our tables exist and have sample data
SELECT
    'Table Status' as info,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_name IN ('ai_predictions', 'ai_insights', 'automated_issues')
AND table_schema = 'public';

-- Test sample data
SELECT 'Sample Data Count' as info, table_name,
       CASE
         WHEN table_name = 'ai_predictions' THEN (SELECT COUNT(*) FROM ai_predictions)
         WHEN table_name = 'ai_insights' THEN (SELECT COUNT(*) FROM ai_insights)
         WHEN table_name = 'automated_issues' THEN (SELECT COUNT(*) FROM automated_issues)
         ELSE 0
       END as record_count
FROM information_schema.tables
WHERE table_name IN ('ai_predictions', 'ai_insights', 'automated_issues')
AND table_schema = 'public';

-- Test the exact query that's failing (simplified version first)
SELECT 'Testing simple ai_predictions query' as info;
SELECT * FROM ai_predictions LIMIT 1;

-- Test ai_insights
SELECT 'Testing simple ai_insights query' as info;
SELECT * FROM ai_insights LIMIT 1;

-- Test automated_issues
SELECT 'Testing simple automated_issues query' as info;
SELECT * FROM automated_issues LIMIT 1;

-- Test the problematic query from the application (step by step)

-- Test 1: Simple join to items table
SELECT 'Testing ai_predictions + items join' as info;
SELECT
    p.*,
    i.item_code,
    i.description
FROM ai_predictions p
LEFT JOIN items i ON p.item_id = i.item_id
LIMIT 1;

-- Test 2: Check if departments table has the expected structure
SELECT 'Testing departments table structure' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'departments'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 3: Simple join to departments (using correct column names)
SELECT 'Testing ai_predictions + departments join' as info;
SELECT
    p.*,
    d.dept_name,
    d.dept_code
FROM ai_predictions p
LEFT JOIN departments d ON p.department_id = d.dept_id
WHERE p.department_id IS NOT NULL
LIMIT 1;

-- Test 4: The complex query from the application (fixed version)
SELECT 'Testing full application query (fixed)' as info;
SELECT
    p.*,
    i.item_code,
    i.description,
    i.unit_cost,
    d.dept_name as department_name
FROM ai_predictions p
LEFT JOIN items i ON p.item_id = i.item_id
LEFT JOIN departments d ON p.department_id = d.dept_id
WHERE p.status = 'ACTIVE'
AND p.prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST')
ORDER BY p.prediction_date ASC
LIMIT 5;

-- Test 5: Automated issues query (fixed version)
SELECT 'Testing automated_issues query (fixed)' as info;
SELECT
    a.*,
    i.item_code,
    i.description,
    d.dept_name as department_name
FROM automated_issues a
LEFT JOIN items i ON a.item_id = i.item_id
LEFT JOIN departments d ON a.department_id = d.dept_id
WHERE a.urgency_level = 'CRITICAL'
AND a.status = 'PENDING_APPROVAL'
ORDER BY a.created_at DESC
LIMIT 3;

-- Test 6: AI insights query (simple version - no joins needed)
SELECT 'Testing ai_insights query' as info;
SELECT
    insight_id,
    title,
    description,
    insight_type,
    impact_level,
    action_required,
    recommendation,
    potential_savings,
    status,
    created_at
FROM ai_insights
WHERE impact_level IN ('CRITICAL', 'HIGH')
AND status = 'NEW'
ORDER BY created_at DESC
LIMIT 3;

-- Test if auth works (this might fail in SQL editor but works in app)
SELECT 'Testing RLS policies' as info;
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('ai_predictions', 'ai_insights', 'automated_issues')
ORDER BY tablename, policyname;

-- Final diagnostic
DO $$
BEGIN
    RAISE NOTICE '=== AI TABLES DIAGNOSTIC COMPLETE ===';
    RAISE NOTICE '✅ Tables exist and are accessible';
    RAISE NOTICE '✅ Foreign key relationships working';
    RAISE NOTICE '✅ Sample queries execute successfully';
    RAISE NOTICE '';
    RAISE NOTICE 'If you see this message, the SQL structure is correct!';
    RAISE NOTICE 'The 400 errors might be related to:';
    RAISE NOTICE '1. RLS policies blocking access';
    RAISE NOTICE '2. JWT token issues in the application';
    RAISE NOTICE '3. Application-side query formatting';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps: Check browser console for detailed error messages';
END $$;