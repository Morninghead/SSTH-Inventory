-- ========================================
-- CREATE AI-RELATED DATABASE TABLES
-- ========================================
-- This script creates the missing AI tables for the SSTH Inventory System
-- Run this script in Supabase SQL Editor: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

-- ========================================
-- 1. AI PREDICTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS ai_predictions (
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
    approval_chain JSONB NULL,

    -- Status and timestamps
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IMPLEMENTED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. AI INSIGHTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS ai_insights (
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
CREATE TABLE IF NOT EXISTS automated_issues (
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
    predicted_need_id UUID NULL,

    -- Resolution info
    adjusted_quantity DECIMAL(15,4) NULL,
    adjusted_reason TEXT NULL,
    original_transaction_id UUID NULL,

    -- Approval workflow
    approval_chain JSONB NULL,
    approval_notes TEXT NULL,
    approver_id UUID NULL,

    -- Impact metrics
    cost_impact DECIMAL(15,2) NULL,

    -- Status and timestamps
    status VARCHAR(30) DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'RESOLVED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- AI Predictions indexes
CREATE INDEX IF NOT EXISTS idx_ai_predictions_item_id ON ai_predictions(item_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_department_id ON ai_predictions(department_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type_status ON ai_predictions(prediction_type, status);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_date ON ai_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions(created_at);

-- AI Insights indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_type_status ON ai_insights(insight_type, status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_impact_level ON ai_insights(impact_level);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires_at ON ai_insights(expires_at);

-- Automated Issues indexes
CREATE INDEX IF NOT EXISTS idx_automated_issues_item_id ON automated_issues(item_id);
CREATE INDEX IF NOT EXISTS idx_automated_issues_department_id ON automated_issues(department_id);
CREATE INDEX IF NOT EXISTS idx_automated_issues_status_urgency ON automated_issues(status, urgency_level);
CREATE INDEX IF NOT EXISTS idx_automated_issues_created_at ON automated_issues(created_at);
CREATE INDEX IF NOT EXISTS idx_automated_issues_ai_generated ON automated_issues(ai_generated);

-- ========================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all AI tables
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_issues ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. CREATE RLS POLICIES
-- ========================================

-- AI Predictions policies
-- All authenticated users can view predictions (simplified for initial setup)
CREATE POLICY "Authenticated users can view AI predictions" ON ai_predictions
    FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create predictions (AI service)
CREATE POLICY "AI service can create predictions" ON ai_predictions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update predictions (for now - can be restricted later)
CREATE POLICY "Authenticated users can update AI predictions" ON ai_predictions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- AI Insights policies
-- All authenticated users can view insights
CREATE POLICY "Authenticated users can view AI insights" ON ai_insights
    FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create insights
CREATE POLICY "AI service can create insights" ON ai_insights
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update insights (for now - can be restricted later)
CREATE POLICY "Authenticated users can update AI insights" ON ai_insights
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Automated Issues policies
-- All authenticated users can view issues (simplified for initial setup)
CREATE POLICY "Authenticated users can view automated issues" ON automated_issues
    FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create issues
CREATE POLICY "AI service can create automated issues" ON automated_issues
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update issues (for now - can be restricted later)
CREATE POLICY "Authenticated users can update automated issues" ON automated_issues
    FOR UPDATE USING (auth.role() = 'authenticated');

-- ========================================
-- 7. CREATE TRIGGERS FOR UPDATED_AT
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for each table
CREATE TRIGGER update_ai_predictions_updated_at
    BEFORE UPDATE ON ai_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automated_issues_updated_at
    BEFORE UPDATE ON automated_issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. INSERT SAMPLE DATA (Optional)
-- ========================================

-- Sample AI Predictions
-- Insert sample data only if items exist
DO $$
DECLARE
    sample_item_id UUID;
BEGIN
    -- Get any item from the items table
    SELECT item_id INTO sample_item_id FROM items WHERE is_active = true LIMIT 1;

    IF sample_item_id IS NOT NULL THEN
        INSERT INTO ai_predictions (item_id, prediction_type, predicted_value, confidence_score, prediction_date, model_version, factors_used) VALUES
        (sample_item_id, 'DEMAND_FORECAST', 50.00, 0.85, NOW() + INTERVAL '7 days', 'v1.0', '{"historical_usage": 45, "seasonality": 1.1, "trend": 1.05}'),
        (sample_item_id, 'STOCKOUT_RISK', 10.00, 0.92, NOW() + INTERVAL '3 days', 'v1.0', '{"current_stock": 15, "daily_usage": 5, "lead_time": 7}'),
        (sample_item_id, 'REORDER_POINT', 25.00, 0.78, NOW() + INTERVAL '14 days', 'v1.0', '{"usage_pattern": "steady", "supplier_reliability": 0.95}');
    END IF;
END $$;

-- Sample AI Insights
INSERT INTO ai_insights (title, description, insight_type, impact_level, action_required, recommendation, potential_savings, metadata) VALUES
    ('Office Supplies Cost Optimization', 'Analysis reveals 15% overspending on premium paper brands. Standard grade paper would meet requirements.', 'COST_OPTIMIZATION', 'HIGH', true, 'Switch to standard grade A4 paper for non-critical documents. Estimated 15% cost savings.', 2500.00, '{"current_spend": 16667, "projected_spend": 14167, "affected_items": 5}'),
    ('Seasonal Demand Increase', 'Historical data shows 30% increase in cleaning supplies during Q4 due to year-end cleaning.', 'SEASONAL_TREND', 'MEDIUM', true, 'Increase inventory levels for cleaning supplies by 30% starting November.', 0.00, '{"confidence": 0.88, "historical_years": 3, "affected_categories": ["Cleaning"]}' ),
    ('Supplier Performance Alert', 'Office Supplies Supplier has 5% late delivery rate in past 30 days, above 2% threshold.', 'SUPPLIER_ISSUE', 'MEDIUM', true, 'Review supplier performance and consider backup supplier for critical items.', 0.00, '{"late_deliveries": 3, "total_deliveries": 60, "threshold_violation": true}');

-- Sample Automated Issues
-- Insert sample data only if items and departments exist
DO $$
DECLARE
    sample_item_id UUID;
    sample_department_id UUID;
BEGIN
    -- Get any item and department from the tables
    SELECT item_id INTO sample_item_id FROM items WHERE is_active = true LIMIT 1;
    SELECT dept_id INTO sample_department_id FROM departments LIMIT 1;

    IF sample_item_id IS NOT NULL AND sample_department_id IS NOT NULL THEN
        INSERT INTO automated_issues (item_id, department_id, issue_type, quantity, reason, urgency_level, ai_generated, auto_generated_score) VALUES
        (sample_item_id, sample_department_id, 'LOW_STOCK', 5, 'Current stock below minimum threshold', 'HIGH', true, 0.94),
        (sample_item_id, sample_department_id, 'USAGE_ANOMALY', 200, 'Unusual spike in usage detected - 300% increase over average', 'MEDIUM', true, 0.87),
        (sample_item_id, sample_department_id, 'OVERSTOCK', 500, 'Inventory exceeds maximum threshold by 200%', 'LOW', true, 0.92);
    END IF;
END $$;

-- ========================================
-- 9. VERIFICATION QUERIES
-- ========================================

-- Verify tables were created
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN ('ai_predictions', 'ai_insights', 'automated_issues')
ORDER BY tablename;

-- Verify sample data
SELECT
    'ai_predictions' as table_name, COUNT(*) as record_count
FROM ai_predictions
UNION ALL
SELECT
    'ai_insights' as table_name, COUNT(*) as record_count
FROM ai_insights
UNION ALL
SELECT
    'automated_issues' as table_name, COUNT(*) as record_count
FROM automated_issues;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
-- AI tables have been successfully created!
--
-- Created Tables:
-- ✅ ai_predictions (for AI predictions and forecasts)
-- ✅ ai_insights (for AI-generated insights and recommendations)
-- ✅ automated_issues (for AI-detected inventory issues)
--
-- Features Enabled:
-- ✅ Row Level Security (RLS) policies
-- ✅ Performance indexes
-- ✅ Automatic timestamp updates
-- ✅ Sample data for testing
--
-- Next Steps:
-- 1. Configure OpenAI API key in environment variables
-- 2. Test AI features in the application
-- 3. Review sample data and adjust as needed