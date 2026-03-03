-- ========================================
-- QUICK AI TABLES DIAGNOSTIC
-- ========================================
-- Run this first to understand what's happening
-- Execute in: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

-- Check if AI tables exist
SELECT 'AI TABLES STATUS' as info,
       CASE
         WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_predictions' AND table_schema = 'public') THEN '✅ EXISTS'
         ELSE '❌ MISSING'
       END as ai_predictions_status,
       CASE
         WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_insights' AND table_schema = 'public') THEN '✅ EXISTS'
         ELSE '❌ MISSING'
       END as ai_insights_status,
       CASE
         WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automated_issues' AND table_schema = 'public') THEN '✅ EXISTS'
         ELSE '❌ MISSING'
       END as automated_issues_status;

-- Show record counts if tables exist
SELECT 'RECORD COUNTS' as info,
       (SELECT COUNT(*) FROM ai_predictions) as predictions_count,
       (SELECT COUNT(*) FROM ai_insights) as insights_count,
       (SELECT COUNT(*) FROM automated_issues) as issues_count;

-- Check RLS status
SELECT 'RLS STATUS' as info,
       (SELECT rowsecurity FROM pg_tables WHERE tablename = 'ai_predictions') as ai_predictions_rls,
       (SELECT rowsecurity FROM pg_tables WHERE tablename = 'ai_insights') as ai_insights_rls,
       (SELECT rowsecurity FROM pg_tables WHERE tablename = 'automated_issues') as automated_issues_rls;

-- Test a simple query
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_predictions' AND table_schema = 'public') THEN
        BEGIN
            -- Test the exact query from your application
            RAISE NOTICE 'Testing the exact application query...';

            DECLARE
                test_result RECORD;
            BEGIN
                SELECT COUNT(*) INTO test_result
                FROM ai_predictions p
                LEFT JOIN items i ON p.item_id = i.item_id
                LEFT JOIN departments d ON p.department_id = d.dept_id
                WHERE p.status = 'ACTIVE'
                AND p.prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST');

                RAISE NOTICE '✅ Query executed successfully. Found % records', test_result.count;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '❌ Query failed: %', SQLERRM;
                RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
            END;
        END;
    ELSE
        RAISE NOTICE '❌ ai_predictions table does not exist - need to run CREATE-AI-TABLES-SIMPLE.sql';
    END IF;
END $$;