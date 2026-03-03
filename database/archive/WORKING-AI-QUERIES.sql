-- ========================================
-- WORKING AI QUERIES WITHOUT AGGREGATION ERRORS
-- ========================================
-- This script demonstrates the exact queries that work without PostgreSQL aggregation issues
-- Execute in: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

-- Step 1: Check current data
SELECT 'CURRENT AI DATA STATUS' as info,
       (SELECT COUNT(*) FROM ai_predictions) as total_predictions,
       (SELECT COUNT(*) FROM ai_predictions WHERE status = 'ACTIVE') as active_predictions,
       (SELECT COUNT(*) FROM ai_insights WHERE status = 'NEW') as new_insights;

-- Step 2: Show exact data values
SELECT 'PREDICTION DATA BREAKDOWN' as info,
       prediction_type,
       status,
       COUNT(*) as count
FROM ai_predictions
GROUP BY prediction_type, status
ORDER BY prediction_type, status;

-- Step 3: Test simple queries (no complex joins)
SELECT 'SIMPLE QUERIES TEST' as test;

-- Test 1: Basic ai_predictions query
SELECT COUNT(*) as result
FROM ai_predictions
WHERE status = 'ACTIVE';

-- Test 2: ai_predictions with just prediction_type filter
SELECT COUNT(*) as result
FROM ai_predictions
WHERE prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST');

-- Test 3: ai_predictions with both filters
SELECT COUNT(*) as result
FROM ai_predictions
WHERE status = 'ACTIVE'
AND prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST');

-- Step 4: Test ai_insights query
SELECT COUNT(*) as result
FROM ai_insights
WHERE status = 'NEW'
AND impact_level IN ('CRITICAL', 'HIGH');

-- Step 5: Test queries with single joins (no ORDER BY to avoid aggregation)
SELECT 'SINGLE JOIN TESTS' as test;

-- Test 5: ai_predictions + items join
SELECT COUNT(*) as result
FROM ai_predictions p
LEFT JOIN items i ON p.item_id = i.item_id
WHERE p.status = 'ACTIVE';

-- Test 6: ai_predictions + departments join
SELECT COUNT(*) as result
FROM ai_predictions p
LEFT JOIN departments d ON p.department_id = d.dept_id
WHERE p.status = 'ACTIVE';

-- Test 7: ai_predictions + both joins (no filters, no ORDER BY)
SELECT COUNT(*) as result
FROM ai_predictions p
LEFT JOIN items i ON p.item_id = i.item_id
LEFT JOIN departments d ON p.department_id = d.dept_id
WHERE p.status = 'ACTIVE'
AND p.prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST');

-- Step 6: Sample query to get actual data (what the application should return)
-- This uses a subquery to avoid the aggregation issue
SELECT 'SAMPLE DATA RETURN TEST' as test,
       *
FROM (
        SELECT
            p.*,
            i.item_code,
            i.description,
            i.unit_cost,
            d.dept_name
        FROM ai_predictions p
        LEFT JOIN items i ON p.item_id = i.item_id
        LEFT JOIN departments d ON p.department_id = d.dept_id
        WHERE p.status = 'ACTIVE'
        AND p.prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST')
        ORDER BY p.prediction_date ASC
        LIMIT 5
    ) AS sample_data;

-- Step 7: Test insights with joins
SELECT 'INSIGHTS WITH JOINS TEST' as test,
       COUNT(*) as result
FROM ai_insights i
WHERE i.status = 'NEW'
AND i.impact_level IN ('CRITICAL', 'HIGH');

-- Step 8: Complete working query for application
SELECT 'COMPLETE WORKING QUERY' as status,
       *
FROM (
        SELECT
            p.*,
            i.item_code,
            i.description,
            i.unit_cost,
            d.dept_name
        FROM ai_predictions p
        LEFT JOIN items i ON p.item_id = i.item_id
        LEFT JOIN departments d ON p.department_id = d.dept_id
        WHERE p.status = 'ACTIVE'
        AND p.prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST')
        ORDER BY p.prediction_date ASC
        LIMIT 5
    ) AS final_results;

-- Step 9: Sample insights query
SELECT 'SAMPLE INSIGHTS QUERY' as status,
       *
FROM ai_insights
WHERE status = 'NEW'
AND impact_level IN ('CRITICAL', 'HIGH')
ORDER BY created_at DESC
LIMIT 3;

SELECT 'SUCCESS: ALL WORKING QUERIES TESTED' as final_status;