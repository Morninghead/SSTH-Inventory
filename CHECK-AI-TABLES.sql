-- ========================================
-- AI TABLES DIAGNOSTIC SCRIPT
-- ========================================
-- Run this script first to check if AI tables exist
-- Execute in: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

-- Check if AI tables exist
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ai_predictions', 'ai_insights', 'automated_issues')
ORDER BY table_name;

-- If tables exist, show their structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('ai_predictions', 'ai_insights', 'automated_issues')
ORDER BY table_name, ordinal_position;

-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('ai_predictions', 'ai_insights', 'automated_issues')
ORDER BY tablename;

-- Show RLS policies if they exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('ai_predictions', 'ai_insights', 'automated_issues')
ORDER BY tablename, policyname;

-- Check foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('ai_predictions', 'ai_insights', 'automated_issues');

-- Test simple query to ai_predictions (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_predictions') THEN
        RAISE NOTICE '✅ ai_predictions table exists. Sample query:';
        PERFORM 1 FROM ai_predictions LIMIT 1;
        RAISE NOTICE '✅ ai_predictions is accessible';
    ELSE
        RAISE NOTICE '❌ ai_predictions table does NOT exist';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_insights') THEN
        RAISE NOTICE '✅ ai_insights table exists. Sample query:';
        PERFORM 1 FROM ai_insights LIMIT 1;
        RAISE NOTICE '✅ ai_insights is accessible';
    ELSE
        RAISE NOTICE '❌ ai_insights table does NOT exist';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automated_issues') THEN
        RAISE NOTICE '✅ automated_issues table exists. Sample query:';
        PERFORM 1 FROM automated_issues LIMIT 1;
        RAISE NOTICE '✅ automated_issues is accessible';
    ELSE
        RAISE NOTICE '❌ automated_issues table does NOT exist';
    END IF;
END $$;