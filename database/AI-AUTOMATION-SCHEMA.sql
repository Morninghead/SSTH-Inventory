-- AI Automation Schema for SSTH Inventory System
-- Add these tables to your existing Supabase database
-- Run this script in: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

-- AI Predictions Table
CREATE TABLE IF NOT EXISTS ai_predictions (
    prediction_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN ('DEMAND_FORECAST', 'STOCKOUT_RISK', 'REORDER_POINT', 'COST_OPTIMIZATION')),
    predicted_value DECIMAL(15,2) NOT NULL,
    predicted_date DATE NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    model_version VARCHAR(20) DEFAULT 'v1.0',
    factors_used JSONB, -- Store the factors that influenced the prediction
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'EXECUTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automated Issues Table
CREATE TABLE IF NOT EXISTS automated_issues (
    issue_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID NOT NULL REFERENCES departments(department_id),
    item_id UUID NOT NULL REFERENCES items(item_id),
    predicted_need_id UUID REFERENCES ai_predictions(prediction_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    urgency_level VARCHAR(20) DEFAULT 'MEDIUM' CHECK (urgency_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    reason TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) DEFAULT 'PENDING_APPROVAL' CHECK (
        status IN ('PENDING_APPROVAL', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ADJUSTED', 'ISSUED', 'CANCELLED')
    ),
    approver_id UUID REFERENCES user_profiles(user_id),
    approval_notes TEXT,
    adjusted_quantity INTEGER, -- If department adjusts the quantity
    adjusted_reason TEXT,
    original_transaction_id UUID REFERENCES transactions(transaction_id), -- Links to actual transaction when issued
    approval_chain JSONB, -- Store approval workflow history
    auto_generated_score DECIMAL(3,2), -- AI confidence score for this issue
    cost_impact DECIMAL(15,2), -- Estimated cost impact
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Department Usage Patterns Table
CREATE TABLE IF NOT EXISTS department_usage_patterns (
    pattern_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID NOT NULL REFERENCES departments(department_id),
    item_id UUID NOT NULL REFERENCES items(item_id),
    avg_monthly_usage DECIMAL(10,2) NOT NULL,
    seasonal_multiplier DECIMAL(3,2) DEFAULT 1.0, -- Seasonal variation factor
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('INCREASING', 'DECREASING', 'STABLE')),
    trend_strength DECIMAL(3,2), -- How strong the trend is (0-1)
    last_updated DATE,
    data_points_count INTEGER DEFAULT 0, -- How many data points this is based on
    confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
    insight_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_type VARCHAR(50) NOT NULL CHECK (
        insight_type IN (
            'COST_SAVINGS',
            'STOCKOUT_RISK',
            'OVERSTOCK_ALERT',
            'SUPPLIER_ISSUE',
            'USAGE_ANOMALY',
            'SEASONAL_TREND',
            'OPTIMIZATION_OPPORTUNITY'
        )
    ),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    impact_level VARCHAR(20) DEFAULT 'MEDIUM' CHECK (impact_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    potential_savings DECIMAL(15,2), -- Estimated cost savings if action taken
    affected_items UUID[], -- Array of item IDs affected
    affected_departments UUID[], -- Array of department IDs affected
    recommendation TEXT NOT NULL,
    action_required BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED')),
    reviewed_by UUID REFERENCES user_profiles(user_id),
    implemented_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- When this insight is no longer relevant
    metadata JSONB, -- Additional insight-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Model Performance Tracking
CREATE TABLE IF NOT EXISTS ai_model_performance (
    performance_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    accuracy_score DECIMAL(3,2),
    precision_score DECIMAL(3,2),
    recall_score DECIMAL(3,2),
    mean_absolute_error DECIMAL(10,2),
    last_trained_at TIMESTAMP WITH TIME ZONE,
    training_data_points INTEGER,
    validation_data_points INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_predictions_item_date ON ai_predictions(item_id, predicted_date);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_department_type ON ai_predictions(department_id, prediction_type);
CREATE INDEX IF NOT EXISTS idx_automated_issues_department_status ON automated_issues(department_id, status);
CREATE INDEX IF NOT EXISTS idx_automated_issues_urgency ON automated_issues(urgency_level, created_at);
CREATE INDEX IF NOT EXISTS idx_department_usage_patterns_department_item ON department_usage_patterns(department_id, item_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type_status ON ai_insights(insight_type, status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_impact ON ai_insights(impact_level, created_at);

-- Row Level Security Policies
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_usage_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_predictions
CREATE POLICY "Users can view AI predictions for their items"
    ON ai_predictions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM items
            WHERE items.item_id = ai_predictions.item_id
        )
    );

CREATE POLICY "Admins and managers can insert AI predictions"
    ON ai_predictions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin', 'manager', 'developer')
        )
    );

-- RLS Policies for automated_issues
CREATE POLICY "Users can view automated issues for their department"
    ON automated_issues FOR SELECT
    USING (
        department_id IN (
            SELECT department_id FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Department heads can update automated issues"
    ON automated_issues FOR UPDATE
    USING (
        department_id IN (
            SELECT department_id FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin', 'manager')
        )
    );

-- RLS Policies for department_usage_patterns
CREATE POLICY "All authenticated users can view usage patterns"
    ON department_usage_patterns FOR SELECT
    USING (auth.role() = 'authenticated');

-- RLS Policies for ai_insights
CREATE POLICY "Users can view AI insights"
    ON ai_insights FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can update AI insights"
    ON ai_insights FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin', 'manager', 'developer')
        )
    );

-- RLS Policies for ai_model_performance
CREATE POLICY "Only admins and developers can view model performance"
    ON ai_model_performance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin', 'developer')
        )
    );

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_ai_predictions_updated_at BEFORE UPDATE ON ai_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automated_issues_updated_at BEFORE UPDATE ON automated_issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_department_usage_patterns_updated_at BEFORE UPDATE ON department_usage_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial model performance record
INSERT INTO ai_model_performance (
    model_name,
    model_version,
    accuracy_score,
    last_trained_at,
    notes
) VALUES (
    'Basic Demand Forecasting',
    'v1.0',
    0.75, -- Start with 75% estimated accuracy
    NOW(),
    'Initial model for basic demand forecasting based on historical usage patterns'
) ON CONFLICT DO NOTHING;

-- Create a view for department managers to see their pending issues
CREATE OR REPLACE VIEW department_pending_issues AS
SELECT
    ai.issue_id,
    ai.department_id,
    d.name as department_name,
    ai.item_id,
    i.item_code,
    i.description,
    ai.quantity,
    ai.urgency_level,
    ai.reason,
    ai.status,
    ai.created_at,
    ai.auto_generated_score,
    ai.cost_impact,
    CASE
        WHEN ai.urgency_level = 'CRITICAL' THEN 1
        WHEN ai.urgency_level = 'HIGH' THEN 2
        WHEN ai.urgency_level = 'MEDIUM' THEN 3
        WHEN ai.urgency_level = 'LOW' THEN 4
    END as priority_order
FROM automated_issues ai
JOIN departments d ON ai.department_id = d.department_id
JOIN items i ON ai.item_id = i.item_id
WHERE ai.status IN ('PENDING_APPROVAL', 'UNDER_REVIEW')
ORDER BY priority_order, ai.created_at DESC;

-- Create a view for AI insights dashboard
CREATE OR REPLACE VIEW ai_insights_dashboard AS
SELECT
    ai.insight_id,
    ai.insight_type,
    ai.title,
    ai.description,
    ai.impact_level,
    ai.potential_savings,
    ai.recommendation,
    ai.action_required,
    ai.status,
    ai.created_at,
    CASE
        WHEN ai.impact_level = 'CRITICAL' THEN 1
        WHEN ai.impact_level = 'HIGH' THEN 2
        WHEN ai.impact_level = 'MEDIUM' THEN 3
        WHEN ai.impact_level = 'LOW' THEN 4
    END as impact_order
FROM ai_insights ai
WHERE ai.expires_at IS NULL OR ai.expires_at > NOW()
ORDER BY impact_order, ai.created_at DESC;

-- Grant permissions for views
GRANT SELECT ON department_pending_issues TO authenticated;
GRANT SELECT ON ai_insights_dashboard TO authenticated;

-- Comments for documentation
COMMENT ON TABLE ai_predictions IS 'AI-generated predictions for demand forecasting, stockout risks, and optimization opportunities';
COMMENT ON TABLE automated_issues IS 'Automatically generated inventory issues requiring department approval';
COMMENT ON TABLE department_usage_patterns IS 'Historical usage patterns analyzed by AI for each department-item combination';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations for inventory optimization';
COMMENT ON TABLE ai_model_performance IS 'Performance metrics tracking for AI models to ensure accuracy and improvement';