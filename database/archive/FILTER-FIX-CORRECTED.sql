-- ========================================
-- CORRECTED FILTER DIAGNOSIS SCRIPT
-- ========================================
-- This script identifies and fixes the filter issue without aggregation errors
-- Execute in: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

-- Step 1: Check what data we actually have
SELECT 'CURRENT DATA STATUS' as info,
       (SELECT COUNT(*) FROM ai_predictions) as total_predictions,
       (SELECT COUNT(*) FROM ai_predictions WHERE status = 'ACTIVE') as active_predictions,
       (SELECT COUNT(*) FROM ai_predictions WHERE prediction_type = 'STOCKOUT_RISK') as stockout_risk_predictions,
       (SELECT COUNT(*) FROM ai_predictions WHERE prediction_type = 'DEMAND_FORECAST') as demand_forecast_predictions;

-- Step 2: Test the filters individually (no ORDER BY to avoid aggregation issue)
SELECT 'TESTING FILTERS INDIVIDUALLY' as info;

-- Test status filter
SELECT 'status=ACTIVE filter' as test,
       COUNT(*) as result_count
FROM ai_predictions
WHERE status = 'ACTIVE';

-- Test prediction_type filter with IN clause
SELECT 'prediction_type IN filter' as test,
       COUNT(*) as result_count
FROM ai_predictions
WHERE prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST');

-- Test both filters together (no ORDER BY)
SELECT 'both filters together' as test,
       COUNT(*) as result_count
FROM ai_predictions
WHERE status = 'ACTIVE'
AND prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST');

-- Step 3: Test with joins (no ORDER BY to avoid aggregation issue)
SELECT 'with joins and filters' as test,
       COUNT(*) as result_count
FROM ai_predictions p
LEFT JOIN items i ON p.item_id = i.item_id
LEFT JOIN departments d ON p.department_id = d.dept_id
WHERE p.status = 'ACTIVE'
AND p.prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST');

-- Step 4: Check the exact data values
SELECT 'EXACT DATA VALUES' as info,
       prediction_type,
       status,
       COUNT(*) as count
FROM ai_predictions
GROUP BY prediction_type, status
ORDER BY prediction_type, status;

-- Step 5: Test the exact application query (without ORDER BY first)
SELECT 'APPLICATION QUERY TEST (without ORDER BY)' as test,
       COUNT(*) as matching_records
FROM ai_predictions p
LEFT JOIN items i ON p.item_id = i.item_id
LEFT JOIN departments d ON p.department_id = d.dept_id
WHERE p.status = 'ACTIVE'
AND p.prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST');

-- Step 6: Test the exact application query (with ORDER BY - the problematic one)
SELECT 'APPLICATION QUERY TEST (with ORDER BY)' as test,
       COUNT(*) as matching_records
FROM ai_predictions p
LEFT JOIN items i ON p.item_id = i.item_id
LEFT JOIN departments d ON p.department_id = d.dept_id
WHERE p.status = 'ACTIVE'
AND p.prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST')
ORDER BY p.prediction_date ASC
LIMIT 5;

-- Step 7: Test the exact application query (with subquery wrapper to avoid aggregation issue)
SELECT 'APPLICATION QUERY TEST (with subquery wrapper)' as test,
       *
FROM (
    SELECT p.*, i.item_code, i.description, i.unit_cost, d.dept_name
    FROM ai_predictions p
    LEFT JOIN items i ON p.item_id = i.item_id
    LEFT JOIN departments d ON p.department_id = d.dept_id
    WHERE p.status = 'ACTIVE'
    AND p.prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST')
    ORDER BY p.prediction_date ASC
    LIMIT 5
) AS limited_results;

SELECT 'DIAGNOSIS COMPLETE' as status;