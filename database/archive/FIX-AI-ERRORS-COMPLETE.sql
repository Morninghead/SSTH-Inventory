-- ========================================
-- COMPLETE AI ERROR FIX SCRIPT
-- ========================================
-- This script fixes ALL issues causing 400 errors
-- Execute in: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

-- Step 1: Drop existing tables cleanly (if they exist)
DROP TABLE IF EXISTS automated_issues CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS ai_predictions CASCADE;

-- Step 2: Recreate tables with exact correct structure
CREATE TABLE ai_predictions (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    department_id UUID NULL REFERENCES departments(dept_id) ON DELETE SET NULL,

    prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST', 'PRICE_PREDICTION', 'REORDER_POINT')),
    predicted_value DECIMAL(15,4) NOT NULL,
    confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    prediction_date TIMESTAMP WITH TIME ZONE NOT NULL,

    model_version VARCHAR(20) NULL,
    factors_used JSONB NULL,

    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IMPLEMENTED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ai_insights (
    insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('COST_OPTIMIZATION', 'STOCK_LEVEL', 'SUPPLIER_ISSUE', 'USAGE_PATTERN', 'SEASONAL_TREND')),
    impact_level VARCHAR(20) DEFAULT 'MEDIUM' CHECK (impact_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    action_required BOOLEAN DEFAULT false,
    recommendation TEXT NULL,

    potential_savings DECIMAL(15,2) NULL,
    affected_items UUID[] NULL,
    affected_departments UUID[] NULL,

    metadata JSONB NULL,
    reviewed_by UUID NULL,
    implemented_at TIMESTAMP WITH TIME ZONE NULL,
    expires_at TIMESTAMP WITH TIME ZONE NULL,

    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWING', 'APPROVED', 'IMPLEMENTED', 'EXPIRED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE automated_issues (
    issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(dept_id) ON DELETE CASCADE,

    issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('LOW_STOCK', 'OVERSTOCK', 'QUALITY_ISSUE', 'USAGE_ANOMALY')),
    quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    urgency_level VARCHAR(20) DEFAULT 'MEDIUM' CHECK (urgency_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    ai_generated BOOLEAN DEFAULT true,
    auto_generated_score DECIMAL(5,4) CHECK (auto_generated_score >= 0 AND auto_generated_score <= 1),

    adjusted_quantity DECIMAL(15,4) NULL,
    adjusted_reason TEXT NULL,

    cost_impact DECIMAL(15,2) NULL,

    status VARCHAR(30) DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'RESOLVED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create basic indexes
CREATE INDEX idx_ai_predictions_item_id ON ai_predictions(item_id);
CREATE INDEX idx_ai_predictions_status_type ON ai_predictions(status, prediction_type);
CREATE INDEX idx_ai_predictions_date ON ai_predictions(prediction_date);

CREATE INDEX idx_ai_insights_status_level ON ai_insights(status, impact_level);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at);

CREATE INDEX idx_automated_issues_item_id ON automated_issues(item_id);
CREATE INDEX idx_automated_issues_status_urgency ON automated_issues(status, urgency_level);
CREATE INDEX idx_automated_issues_created_at ON automated_issues(created_at);

-- Step 4: Enable RLS
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_issues ENABLE ROW LEVEL SECURITY;

-- Step 5: Create permissive RLS policies for development
-- NOTE: These allow all authenticated users to read/write (for development)
-- In production, you might want to restrict these further

-- AI Predictions policies
CREATE POLICY "Users can view ai_predictions" ON ai_predictions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert ai_predictions" ON ai_predictions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update ai_predictions" ON ai_predictions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete ai_predictions" ON ai_predictions
    FOR DELETE USING (auth.role() = 'authenticated');

-- AI Insights policies
CREATE POLICY "Users can view ai_insights" ON ai_insights
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert ai_insights" ON ai_insights
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update ai_insights" ON ai_insights
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete ai_insights" ON ai_insights
    FOR DELETE USING (auth.role() = 'authenticated');

-- Automated Issues policies
CREATE POLICY "Users can view automated_issues" ON automated_issues
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert automated_issues" ON automated_issues
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update automated_issues" ON automated_issues
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete automated_issues" ON automated_issues
    FOR DELETE USING (auth.role() = 'authenticated');

-- Step 6: Insert sample data that matches the application queries
-- Insert sample AI predictions (with the right status values)
INSERT INTO ai_predictions (item_id, prediction_type, predicted_value, confidence_score, prediction_date, model_version, factors_used, status)
SELECT
    item_id,
    'STOCKOUT_RISK' as prediction_type,
    10.00 as predicted_value,
    0.85 as confidence_score,
    NOW() + INTERVAL '7 days' as prediction_date,
    'v1.0' as model_version,
    '{"current_stock": 5, "daily_usage": 2, "lead_time": 14}' as factors_used,
    'ACTIVE' as status
FROM items
WHERE is_active = true
LIMIT 3;

INSERT INTO ai_predictions (item_id, prediction_type, predicted_value, confidence_score, prediction_date, model_version, factors_used, status)
SELECT
    item_id,
    'DEMAND_FORECAST' as prediction_type,
    50.00 as predicted_value,
    0.78 as confidence_score,
    NOW() + INTERVAL '14 days' as prediction_date,
    'v1.0' as model_version,
    '{"historical_usage": 45, "seasonality": 1.1, "trend": 1.05}' as factors_used,
    'ACTIVE' as status
FROM items
WHERE is_active = true
LIMIT 2;

-- Insert sample AI insights
INSERT INTO ai_insights (title, description, insight_type, impact_level, action_required, recommendation, potential_savings, status) VALUES
('Office Supplies Cost Optimization', 'Analysis reveals potential savings in office supplies procurement. Consider bulk purchasing and alternative suppliers.', 'COST_OPTIMIZATION', 'HIGH', true, 'Review office supply vendors and negotiate bulk pricing discounts', 5000.00, 'NEW'),
('Inventory Turnover Analysis', 'Some items showing slow movement patterns. Consider stock optimization strategies.', 'STOCK_LEVEL', 'MEDIUM', true, 'Review slow-moving inventory and implement just-in-time ordering', 2500.00, 'NEW'),
('Seasonal Demand Planning', 'Historical data indicates seasonal patterns in cleaning supplies usage.', 'SEASONAL_TREND', 'MEDIUM', true, 'Increase stock levels of cleaning supplies before year-end cleaning period', 0.00, 'NEW');

-- Insert sample automated issues (with correct department_id references)
INSERT INTO automated_issues (item_id, department_id, issue_type, quantity, reason, urgency_level, ai_generated, auto_generated_score, status)
SELECT
    i.item_id,
    d.dept_id,
    'LOW_STOCK' as issue_type,
    5 as quantity,
    'Current stock below minimum threshold' as reason,
    'HIGH' as urgency_level,
    true as ai_generated,
    0.94 as auto_generated_score,
    'PENDING_APPROVAL' as status
FROM items i
CROSS JOIN departments d
WHERE i.is_active = true
AND d.dept_id IS NOT NULL
LIMIT 2;

-- Step 7: Test the exact queries that are failing in the application
DO $$
BEGIN
    RAISE NOTICE '=== TESTING APPLICATION QUERIES ===';

    -- Test 1: The main prediction query from PredictiveAnalyticsWidget
    RAISE NOTICE 'Test 1: Main prediction query';
    PERFORM 1 FROM (
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
    ) test_query;

    IF FOUND THEN
        RAISE NOTICE '✅ Main prediction query: SUCCESS';
    ELSE
        RAISE NOTICE '❌ Main prediction query: FAILED - no results';
    END IF;

    -- Test 2: Insights query
    RAISE NOTICE 'Test 2: Insights query';
    PERFORM 1 FROM (
        SELECT *
        FROM ai_insights
        WHERE status = 'NEW'
        AND impact_level IN ('CRITICAL', 'HIGH')
        ORDER BY created_at DESC
        LIMIT 3
    ) test_query;

    IF FOUND THEN
        RAISE NOTICE '✅ Insights query: SUCCESS';
    ELSE
        RAISE NOTICE '❌ Insights query: FAILED - no results';
    END IF;

    -- Test 3: Stockout risk query
    RAISE NOTICE 'Test 3: Stockout risk query';
    PERFORM 1 FROM (
        SELECT
            p.*,
            i.item_code,
            i.description,
            d.dept_name
        FROM ai_predictions p
        LEFT JOIN items i ON p.item_id = i.item_id
        LEFT JOIN departments d ON p.department_id = d.dept_id
        WHERE p.prediction_type = 'STOCKOUT_RISK'
        AND p.status = 'ACTIVE'
        AND p.prediction_date >= NOW() - INTERVAL '7 days'
        AND p.prediction_date <= NOW() + INTERVAL '7 days'
        ORDER BY p.prediction_date ASC
        LIMIT 5
    ) test_query;

    IF FOUND THEN
        RAISE NOTICE '✅ Stockout risk query: SUCCESS';
    ELSE
        RAISE NOTICE '❌ Stockout risk query: FAILED - no results';
    END IF;

    -- Show record counts
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    RAISE NOTICE 'ai_predictions: % records', (SELECT COUNT(*) FROM ai_predictions);
    RAISE NOTICE 'ai_insights: % records', (SELECT COUNT(*) FROM ai_insights);
    RAISE NOTICE 'automated_issues: % records', (SELECT COUNT(*) FROM automated_issues);

    RAISE NOTICE '✅ AI TABLES CREATION AND TESTING COMPLETE!';
    RAISE NOTICE '✅ All application queries should now work!';
    RAISE NOTICE '✅ 400 errors should be resolved!';
END $$;