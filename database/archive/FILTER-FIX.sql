-- ========================================
-- FILTER ISSUE DIAGNOSIS AND FIX
-- ========================================
-- This script identifies and fixes the filter issue in the complex query
-- Execute in: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

-- Step 1: Check what data we actually have
SELECT 'CURRENT DATA STATUS' as info,
       (SELECT COUNT(*) FROM ai_predictions) as total_predictions,
       (SELECT COUNT(*) FROM ai_predictions WHERE status = 'ACTIVE') as active_predictions,
       (SELECT COUNT(*) FROM ai_predictions WHERE prediction_type = 'STOCKOUT_RISK') as stockout_risk_predictions,
       (SELECT COUNT(*) FROM ai_predictions WHERE prediction_type = 'DEMAND_FORECAST') as demand_forecast_predictions;

-- Step 2: Test the filters individually
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

-- Test both filters together
SELECT 'both filters together' as test,
       COUNT(*) as result_count
FROM ai_predictions
WHERE status = 'ACTIVE'
AND prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST');

-- Step 3: Test with joins
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

-- Step 5: Check if there's any data that matches the application query
SELECT 'APPLICATION QUERY MATCH TEST' as info,
       COUNT(*) as matching_records
FROM ai_predictions p
LEFT JOIN items i ON p.item_id = i.item_id
LEFT JOIN departments d ON p.department_id = d.dept_id
WHERE p.status = 'ACTIVE'
AND p.prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST')
ORDER BY p.prediction_date ASC
LIMIT 5;

SELECT 'DIAGNOSIS COMPLETE' as status;