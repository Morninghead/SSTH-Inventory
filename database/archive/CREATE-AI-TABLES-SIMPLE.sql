-- ========================================
-- SIMPLE AI TABLES CREATION SCRIPT
-- ========================================
-- Use this if the main script has issues
-- Execute in: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS automated_issues CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS ai_predictions CASCADE;

-- ========================================
-- 1. AI PREDICTIONS TABLE
-- ========================================
CREATE TABLE ai_predictions (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    department_id UUID NULL REFERENCES departments(dept_id) ON DELETE SET NULL,

    -- Prediction details
    prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN ('STOCKOUT_RISK', 'DEMAND_FORECAST', 'PRICE_PREDICTION', 'REORDER_POINT')),
    predicted_value DECIMAL(15,4) NOT NULL,
    confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    prediction_date TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Metadata
    model_version VARCHAR(20) NULL,
    factors_used JSONB NULL,

    -- Status and timestamps
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IMPLEMENTED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. AI INSIGHTS TABLE
-- ========================================
CREATE TABLE ai_insights (
    insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Insight details
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('COST_OPTIMIZATION', 'STOCK_LEVEL', 'SUPPLIER_ISSUE', 'USAGE_PATTERN', 'SEASONAL_TREND')),
    impact_level VARCHAR(20) DEFAULT 'MEDIUM' CHECK (impact_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    -- Action and recommendations
    action_required BOOLEAN DEFAULT false,
    recommendation TEXT NULL,

    -- Impact metrics
    potential_savings DECIMAL(15,2) NULL,
    affected_items UUID[] NULL,
    affected_departments UUID[] NULL,

    -- Metadata
    metadata JSONB NULL,
    reviewed_by UUID NULL,
    implemented_at TIMESTAMP WITH TIME ZONE NULL,
    expires_at TIMESTAMP WITH TIME ZONE NULL,

    -- Status and timestamps
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWING', 'APPROVED', 'IMPLEMENTED', 'EXPIRED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. AUTOMATED ISSUES TABLE
-- ========================================
CREATE TABLE automated_issues (
    issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(dept_id) ON DELETE CASCADE,

    -- Issue details
    issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('LOW_STOCK', 'OVERSTOCK', 'QUALITY_ISSUE', 'USAGE_ANOMALY')),
    quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    urgency_level VARCHAR(20) DEFAULT 'MEDIUM' CHECK (urgency_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    -- AI generation info
    ai_generated BOOLEAN DEFAULT true,
    auto_generated_score DECIMAL(5,4) CHECK (auto_generated_score >= 0 AND auto_generated_score <= 1),

    -- Resolution info
    adjusted_quantity DECIMAL(15,4) NULL,
    adjusted_reason TEXT NULL,

    -- Impact metrics
    cost_impact DECIMAL(15,2) NULL,

    -- Status and timestamps
    status VARCHAR(30) DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'RESOLVED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. BASIC INDEXES
-- ========================================
CREATE INDEX idx_ai_predictions_item_id ON ai_predictions(item_id);
CREATE INDEX idx_ai_predictions_created_at ON ai_predictions(created_at);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at);
CREATE INDEX idx_automated_issues_item_id ON automated_issues(item_id);
CREATE INDEX idx_automated_issues_created_at ON automated_issues(created_at);

-- ========================================
-- 5. ENABLE RLS
-- ========================================
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_issues ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. SIMPLE RLS POLICIES
-- ========================================
-- All authenticated users can access AI tables
CREATE POLICY "Enable read access for authenticated users on ai_predictions" ON ai_predictions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on ai_predictions" ON ai_predictions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on ai_predictions" ON ai_predictions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users on ai_insights" ON ai_insights
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on ai_insights" ON ai_insights
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on ai_insights" ON ai_insights
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users on automated_issues" ON automated_issues
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on automated_issues" ON automated_issues
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on automated_issues" ON automated_issues
    FOR UPDATE USING (auth.role() = 'authenticated');

-- ========================================
-- 7. SAMPLE DATA (Optional)
-- ========================================
-- Insert sample AI insights (these don't depend on existing data)
INSERT INTO ai_insights (title, description, insight_type, impact_level, action_required, recommendation, potential_savings, metadata) VALUES
    ('Office Supplies Cost Optimization', 'Analysis reveals potential savings in office supplies procurement. Consider bulk purchasing and alternative suppliers.', 'COST_OPTIMIZATION', 'HIGH', true, 'Review office supply vendors and negotiate bulk pricing discounts', 5000.00, '{"category": "procurement", "priority": "high"}'),
    ('Inventory Turnover Analysis', 'Some items showing slow movement patterns. Consider stock optimization strategies.', 'STOCK_LEVEL', 'MEDIUM', true, 'Review slow-moving inventory and implement just-in-time ordering', 2500.00, '{"affected_items": 15, "analysis_period": "Q3 2025"}'),
    ('Seasonal Demand Planning', 'Historical data indicates seasonal patterns in cleaning supplies usage.', 'SEASONAL_TREND', 'MEDIUM', true, 'Increase stock levels of cleaning supplies before year-end cleaning period', 0.00, '{"season": "Q4", "confidence": 0.85}');

-- ========================================
-- 8. VERIFICATION
-- ========================================
-- Verify tables were created
SELECT
    'AI TABLES CREATION COMPLETE' as status,
    (SELECT COUNT(*) FROM ai_predictions) as predictions_count,
    (SELECT COUNT(*) FROM ai_insights) as insights_count,
    (SELECT COUNT(*) FROM automated_issues) as issues_count;

-- Show sample data
SELECT
    'Sample AI Insights Created' as info,
    title,
    insight_type,
    impact_level
FROM ai_insights
LIMIT 3;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '✅ AI TABLES CREATED SUCCESSFULLY!';
    RAISE NOTICE '✅ ai_predictions: % records', (SELECT COUNT(*) FROM ai_predictions);
    RAISE NOTICE '✅ ai_insights: % records', (SELECT COUNT(*) FROM ai_insights);
    RAISE NOTICE '✅ automated_issues: % records', (SELECT COUNT(*) FROM automated_issues);
    RAISE NOTICE '✅ RLS policies enabled for authenticated users';
    RAISE NOTICE '✅ Basic indexes created';
    RAISE NOTICE '';
    RAISE NOTICE 'Your AI features should now work without 400 errors!';
END $$;