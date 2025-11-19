-- AI Automation Functions for SSTH Inventory System
-- These functions will automatically detect when items need to be issued to departments
-- Run this script after running the AI-AUTOMATION-SCHEMA.sql

-- Function to analyze department usage patterns
CREATE OR REPLACE FUNCTION analyze_department_usage_patterns()
RETURNS void AS $$
DECLARE
    dept_record RECORD;
    item_record RECORD;
    usage_data RECORD;
    pattern_exists BOOLEAN;
BEGIN
    -- Clear existing patterns and recalculate from scratch
    DELETE FROM department_usage_patterns;

    -- Calculate usage patterns for each department-item combination
    FOR dept_record IN
        SELECT department_id FROM departments WHERE is_active = true
    LOOP
        FOR item_record IN
            SELECT item_id FROM items WHERE is_active = true
        LOOP
            -- Get historical usage data for this department-item combination
            SELECT
                COUNT(*) as data_points,
                AVG(tl.quantity) as avg_monthly_usage,
                -- Calculate trend (compare recent vs older usage)
                CASE
                    WHEN COUNT(*) >= 6 THEN (
                        SELECT AVG(tl2.quantity)
                        FROM transaction_lines tl2
                        JOIN transactions t2 ON tl2.transaction_id = t2.transaction_id
                        WHERE t2.department_id = dept_record.department_id
                        AND tl2.item_id = item_record.item_id
                        AND t2.transaction_date >= CURRENT_DATE - INTERVAL '3 months'
                    ) - (
                        SELECT AVG(tl3.quantity)
                        FROM transaction_lines tl3
                        JOIN transactions t3 ON tl3.transaction_id = t3.transaction_id
                        WHERE t3.department_id = dept_record.department_id
                        AND tl3.item_id = item_record.item_id
                        AND t3.transaction_date >= CURRENT_DATE - INTERVAL '6 months'
                        AND t3.transaction_date < CURRENT_DATE - INTERVAL '3 months'
                    )
                    ELSE 0
                END as trend_difference
            INTO usage_data
            FROM transaction_lines tl
            JOIN transactions t ON tl.transaction_id = t.transaction_id
            WHERE t.department_id = dept_record.department_id
            AND tl.item_id = item_record.item_id
            AND t.transaction_type = 'ISSUE'
            AND t.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY t.department_id, tl.item_id;

            -- Only create pattern if we have enough data
            IF usage_data.data_points >= 3 THEN
                INSERT INTO department_usage_patterns (
                    department_id,
                    item_id,
                    avg_monthly_usage,
                    seasonal_multiplier,
                    trend_direction,
                    trend_strength,
                    last_updated,
                    data_points_count,
                    confidence_level
                ) VALUES (
                    dept_record.department_id,
                    item_record.item_id,
                    COALESCE(usage_data.avg_monthly_usage, 0),
                    -- Simple seasonal multiplier (can be enhanced with more sophisticated analysis)
                    CASE
                        WHEN EXTRACT(MONTH FROM CURRENT_DATE) IN (11, 12, 1) THEN 1.2 -- Higher usage in winter
                        WHEN EXTRACT(MONTH FROM CURRENT_DATE) IN (6, 7, 8) THEN 0.9 -- Lower usage in summer
                        ELSE 1.0
                    END,
                    CASE
                        WHEN usage_data.trend_difference > 0.5 THEN 'INCREASING'
                        WHEN usage_data.trend_difference < -0.5 THEN 'DECREASING'
                        ELSE 'STABLE'
                    END,
                    LEAST(ABS(usage_data.trend_difference) / 10, 1.0), -- Normalize trend strength
                    CURRENT_DATE,
                    usage_data.data_points,
                    CASE
                        WHEN usage_data.data_points >= 12 THEN 0.9
                        WHEN usage_data.data_points >= 6 THEN 0.7
                        ELSE 0.5
                    END
                );
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Department usage patterns analyzed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to generate AI predictions based on usage patterns
CREATE OR REPLACE FUNCTION generate_ai_predictions()
RETURNS void AS $$
DECLARE
    pattern_record RECORD;
    stock_level RECORD;
    prediction_exists BOOLEAN;
    predicted_need_date DATE;
    days_until_stockout INTEGER;
    monthly_usage DECIMAL;
BEGIN
    -- Generate predictions for items with usage patterns
    FOR pattern_record IN
        SELECT dup.*, i.item_code, i.description, i.unit_cost,
               COALESCE(inv.quantity, 0) as current_stock,
               COALESCE(i.reorder_level, 0) as reorder_level
        FROM department_usage_patterns dup
        JOIN items i ON dup.item_id = i.item_id
        LEFT JOIN inventory_status inv ON dup.item_id = inv.item_id
        WHERE dup.confidence_level >= 0.5 -- Only use patterns with decent confidence
    LOOP
        -- Calculate when this item might run out based on usage pattern
        monthly_usage := pattern_record.avg_monthly_usage * pattern_record.seasonal_multiplier;

        IF monthly_usage > 0 AND pattern_record.current_stock > 0 THEN
            days_until_stockout := FLOOR((pattern_record.current_stock::DECIMAL / monthly_usage) * 30);
            predicted_need_date := CURRENT_DATE + days_until_stockout * INTERVAL '1 day';

            -- Check if we already have a recent prediction for this item/department
            SELECT EXISTS(
                SELECT 1 FROM ai_predictions
                WHERE item_id = pattern_record.item_id
                AND department_id = pattern_record.department_id
                AND predicted_date >= CURRENT_DATE - INTERVAL '7 days'
            ) INTO prediction_exists;

            -- Only create new prediction if we don't have a recent one
            IF NOT prediction_exists THEN
                INSERT INTO ai_predictions (
                    item_id,
                    department_id,
                    prediction_type,
                    predicted_value,
                    predicted_date,
                    confidence_score,
                    factors_used,
                    status
                ) VALUES (
                    pattern_record.item_id,
                    pattern_record.department_id,
                    'DEMAND_FORECAST',
                    monthly_usage,
                    predicted_need_date,
                    pattern_record.confidence_level,
                    jsonb_build_object(
                        'avg_monthly_usage', pattern_record.avg_monthly_usage,
                        'seasonal_multiplier', pattern_record.seasonal_multiplier,
                        'trend_direction', pattern_record.trend_direction,
                        'current_stock', pattern_record.current_stock,
                        'data_points', pattern_record.data_points_count
                    ),
                    'ACTIVE'
                );

                -- Also create stockout risk prediction if needed soon
                IF days_until_stockout <= 30 THEN -- Stockout risk within 30 days
                    INSERT INTO ai_predictions (
                        item_id,
                        department_id,
                        prediction_type,
                        predicted_value,
                        predicted_date,
                        confidence_score,
                        factors_used,
                        status
                    ) VALUES (
                        pattern_record.item_id,
                        pattern_record.department_id,
                        'STOCKOUT_RISK',
                        days_until_stockout::DECIMAL,
                        predicted_need_date,
                        GREATEST(pattern_record.confidence_level - 0.2, 0.3), -- Lower confidence for risk predictions
                        jsonb_build_object(
                            'days_until_stockout', days_until_stockout,
                            'current_stock', pattern_record.current_stock,
                            'monthly_usage', monthly_usage,
                            'urgency', CASE
                                WHEN days_until_stockout <= 7 THEN 'CRITICAL'
                                WHEN days_until_stockout <= 14 THEN 'HIGH'
                                WHEN days_until_stockout <= 30 THEN 'MEDIUM'
                                ELSE 'LOW'
                            END
                        ),
                        'ACTIVE'
                    );
                END IF;
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE 'AI predictions generated successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to generate automated issues based on predictions
CREATE OR REPLACE FUNCTION generate_automated_issues()
RETURNS void AS $$
DECLARE
    prediction_record RECORD;
    item_info RECORD;
    urgency_level VARCHAR(20);
    recommended_quantity INTEGER;
    issue_exists BOOLEAN;
BEGIN
    -- Generate automated issues for high-priority predictions
    FOR prediction_record IN
        SELECT
            ap.*,
            dup.avg_monthly_usage,
            dup.seasonal_multiplier
        FROM ai_predictions ap
        LEFT JOIN department_usage_patterns dup ON ap.item_id = dup.item_id AND ap.department_id = dup.department_id
        WHERE ap.prediction_type = 'STOCKOUT_RISK'
        AND ap.status = 'ACTIVE'
        AND ap.predicted_date <= CURRENT_DATE + INTERVAL '14 days' -- Only create issues for near-term needs
        AND ap.confidence_score >= 0.4
    LOOP
        -- Get item information
        SELECT i.item_code, i.description, i.unit_cost, i.standard_uom,
               COALESCE(inv.quantity, 0) as current_stock,
               COALESCE(i.reorder_level, 0) as reorder_level
        INTO item_info
        FROM items i
        LEFT JOIN inventory_status inv ON i.item_id = inv.item_id
        WHERE i.item_id = prediction_record.item_id;

        -- Determine urgency based on days until stockout
        IF prediction_record.predicted_value::INTEGER <= 7 THEN
            urgency_level := 'CRITICAL';
        ELSIF prediction_record.predicted_value::INTEGER <= 14 THEN
            urgency_level := 'HIGH';
        ELSE
            urgency_level := 'MEDIUM';
        END IF;

        -- Calculate recommended quantity
        recommended_quantity := CEIL(
            COALESCE(prediction_record.avg_monthly_usage, item_info.reorder_level * 2) *
            prediction_record.seasonal_multiplier
        );

        -- Ensure minimum quantity
        recommended_quantity := GREATEST(recommended_quantity, item_info.reorder_level);

        -- Check if we already have a pending issue for this item/department
        SELECT EXISTS(
            SELECT 1 FROM automated_issues
            WHERE item_id = prediction_record.item_id
            AND department_id = prediction_record.department_id
            AND status IN ('PENDING_APPROVAL', 'UNDER_REVIEW', 'APPROVED')
            AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        ) INTO issue_exists;

        -- Only create new issue if we don't have a recent one
        IF NOT issue_exists THEN
            INSERT INTO automated_issues (
                department_id,
                item_id,
                predicted_need_id,
                quantity,
                urgency_level,
                reason,
                ai_generated,
                status,
                auto_generated_score,
                cost_impact,
                approval_chain
            ) VALUES (
                prediction_record.department_id,
                prediction_record.item_id,
                prediction_record.prediction_id,
                recommended_quantity,
                urgency_level,
                format('AI predicts stockout in %s days. Current stock: %s. Recommended: %s %s',
                       prediction_record.predicted_value::INTEGER,
                       item_info.current_stock,
                       recommended_quantity,
                       item_info.standard_uom),
                true,
                'PENDING_APPROVAL',
                prediction_record.confidence_score,
                recommended_quantity * item_info.unit_cost,
                jsonb_build_array(
                    jsonb_build_object(
                        'step', 1,
                        'action', 'AI_GENERATED',
                        'timestamp', NOW(),
                        'confidence', prediction_record.confidence_score,
                        'prediction_id', prediction_record.prediction_id
                    )
                )
            );
        END IF;
    END LOOP;

    RAISE NOTICE 'Automated issues generated successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to generate AI insights and recommendations
CREATE OR REPLACE FUNCTION generate_ai_insights()
RETURNS void AS $$
DECLARE
    insight_record RECORD;
    total_savings DECIMAL;
BEGIN
    -- Generate cost optimization insights for slow-moving items
    FOR insight_record IN
        WITH slow_moving_items AS (
            SELECT
                i.item_id,
                i.item_code,
                i.description,
                i.unit_cost,
                COALESCE(inv.quantity, 0) as current_stock,
                COALESCE(dup.avg_monthly_usage, 0) as avg_monthly_usage,
                COALESCE(inv.quantity, 0) * i.unit_cost as total_value
            FROM items i
            LEFT JOIN inventory_status inv ON i.item_id = inv.item_id
            LEFT JOIN (
                SELECT item_id, AVG(avg_monthly_usage) as avg_monthly_usage
                FROM department_usage_patterns
                WHERE avg_monthly_usage > 0
                GROUP BY item_id
            ) dup ON i.item_id = dup.item_id
            WHERE i.is_active = true
            AND COALESCE(inv.quantity, 0) > 0
            AND (dup.avg_monthly_usage IS NULL OR dup.avg_monthly_usage = 0 OR
                 (COALESCE(inv.quantity, 0) / NULLIF(dup.avg_monthly_usage, 0)) > 12) -- More than 12 months supply
            AND COALESCE(inv.quantity, 0) * i.unit_cost > 1000 -- Only significant values
        )
        SELECT
            smi.item_id,
            smi.item_code,
            smi.description,
            smi.total_value,
            smi.current_stock,
            smi.avg_monthly_usage
        FROM slow_moving_items smi
        WHERE NOT EXISTS (
            SELECT 1 FROM ai_insights
            WHERE insight_type = 'COST_SAVINGS'
            AND smi.item_id = ANY(affected_items)
            AND status = 'NEW'
            AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        )
        LIMIT 5 -- Limit to top 5 insights
    LOOP
        -- Calculate potential savings from reducing stock
        IF insight_record.avg_monthly_usage > 0 THEN
            total_savings := (insight_record.current_stock - (insight_record.avg_monthly_usage * 3)) * insight_record.unit_cost;
            total_savings := GREATEST(total_savings, 0); -- Ensure positive savings
        ELSE
            total_savings := insight_record.total_value * 0.5; -- Estimate 50% can be saved
        END IF;

        INSERT INTO ai_insights (
            insight_type,
            title,
            description,
            impact_level,
            potential_savings,
            affected_items,
            recommendation,
            action_required,
            status,
            metadata,
            expires_at
        ) VALUES (
            'COST_SAVINGS',
            format('Reduce stock for slow-moving item: %s', insight_record.item_code),
            format('Item %s (%s) has %s units in stock but average monthly usage is only %s units. This represents overstocked inventory tying up capital.',
                   insight_record.item_code,
                   insight_record.description,
                   insight_record.current_stock,
                   insight_record.avg_monthly_usage),
            CASE
                WHEN total_savings > 10000 THEN 'HIGH'
                WHEN total_savings > 5000 THEN 'MEDIUM'
                ELSE 'LOW'
            END,
            total_savings,
            ARRAY[insight_record.item_id],
            format('Consider reducing stock to %s units (3-month supply) to free up %s in working capital.',
                   CEIL(insight_record.avg_monthly_usage * 3),
                   total_savings),
            true,
            'NEW',
            jsonb_build_object(
                'current_stock', insight_record.current_stock,
                'avg_monthly_usage', insight_record.avg_monthly_usage,
                'months_supply', CASE WHEN insight_record.avg_monthly_usage > 0 THEN
                    insight_record.current_stock::DECIMAL / insight_record.avg_monthly_usage ELSE 999 END,
                'recommended_stock', CEIL(insight_record.avg_monthly_usage * 3)
            ),
            CURRENT_DATE + INTERVAL '30 days' -- Expire in 30 days
        );
    END LOOP;

    -- Generate stockout risk insights
    FOR insight_record IN
        SELECT DISTINCT
            ap.item_id,
            i.item_code,
            i.description,
            COUNT(*) as risk_count,
            MIN(ap.predicted_date) as earliest_risk
        FROM ai_predictions ap
        JOIN items i ON ap.item_id = i.item_id
        WHERE ap.prediction_type = 'STOCKOUT_RISK'
        AND ap.status = 'ACTIVE'
        AND ap.predicted_date <= CURRENT_DATE + INTERVAL '30 days'
        AND NOT EXISTS (
            SELECT 1 FROM ai_insights
            WHERE insight_type = 'STOCKOUT_RISK'
            AND ap.item_id = ANY(affected_items)
            AND status = 'NEW'
            AND created_at >= CURRENT_DATE - INTERVAL '3 days'
        )
        GROUP BY ap.item_id, i.item_code, i.description
        ORDER BY earliest_risk
        LIMIT 3
    LOOP
        INSERT INTO ai_insights (
            insight_type,
            title,
            description,
            impact_level,
            potential_savings,
            affected_items,
            recommendation,
            action_required,
            status,
            metadata,
            expires_at
        ) VALUES (
            'STOCKOUT_RISK',
            format('Stockout risk for item: %s', insight_record.item_code),
            format('Item %s (%s) has %s departments facing stockout risks, with earliest risk on %s.',
                   insight_record.item_code,
                   insight_record.description,
                   insight_record.risk_count,
                   insight_record.earliest_risk),
            'HIGH',
            NULL, -- Cost avoidance rather than savings
            ARRAY[insight_record.item_id],
            'Immediate action required: Review pending automated issues and approve stock replenishment.',
            true,
            'NEW',
            jsonb_build_object(
                'risk_count', insight_record.risk_count,
                'earliest_risk', insight_record.earliest_risk,
                'departments_affected', insight_record.risk_count
            ),
            CURRENT_DATE + INTERVAL '7 days' -- Expire in 7 days (urgent)
        );
    END LOOP;

    RAISE NOTICE 'AI insights generated successfully';
END;
$$ LANGUAGE plpgsql;

-- Main function to run all AI automation processes
CREATE OR REPLACE FUNCTION run_ai_automation()
RETURNS void AS $$
BEGIN
    -- Run all AI automation functions in order
    PERFORM analyze_department_usage_patterns();
    PERFORM generate_ai_predictions();
    PERFORM generate_automated_issues();
    PERFORM generate_ai_insights();

    RAISE NOTICE 'AI automation completed successfully at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to approve or reject automated issues
CREATE OR REPLACE FUNCTION update_automated_issue_status(
    p_issue_id UUID,
    p_new_status VARCHAR,
    p_approver_id UUID,
    p_approval_notes TEXT DEFAULT NULL,
    p_adjusted_quantity INTEGER DEFAULT NULL,
    p_adjusted_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message VARCHAR
) AS $$
DECLARE
    current_issue RECORD;
    current_status VARCHAR;
BEGIN
    -- Get current issue details
    SELECT * INTO current_issue
    FROM automated_issues
    WHERE issue_id = p_issue_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Issue not found'::VARCHAR;
        RETURN;
    END IF;

    -- Validate status transition
    current_status := current_issue.status;

    IF p_new_status = 'APPROVED' AND current_status IN ('PENDING_APPROVAL', 'UNDER_REVIEW') THEN
        -- Issue is being approved
        UPDATE automated_issues
        SET
            status = p_new_status,
            approver_id = p_approver_id,
            approval_notes = p_approval_notes,
            adjusted_quantity = COALESCE(p_adjusted_quantity, quantity),
            adjusted_reason = p_adjusted_reason,
            approval_chain = approval_chain || jsonb_build_array(
                jsonb_build_object(
                    'step', jsonb_array_length(approval_chain) + 1,
                    'action', 'APPROVED',
                    'user_id', p_approver_id,
                    'timestamp', NOW(),
                    'notes', p_approval_notes,
                    'adjusted_quantity', p_adjusted_quantity
                )
            )
        WHERE issue_id = p_issue_id;

        RETURN QUERY SELECT true, 'Issue approved successfully'::VARCHAR;

    ELSIF p_new_status = 'REJECTED' AND current_status IN ('PENDING_APPROVAL', 'UNDER_REVIEW') THEN
        -- Issue is being rejected
        UPDATE automated_issues
        SET
            status = p_new_status,
            approver_id = p_approver_id,
            approval_notes = p_approval_notes,
            approval_chain = approval_chain || jsonb_build_array(
                jsonb_build_object(
                    'step', jsonb_array_length(approval_chain) + 1,
                    'action', 'REJECTED',
                    'user_id', p_approver_id,
                    'timestamp', NOW(),
                    'notes', p_approval_notes,
                    'reason', p_adjusted_reason
                )
            )
        WHERE issue_id = p_issue_id;

        RETURN QUERY SELECT true, 'Issue rejected successfully'::VARCHAR;

    ELSIF p_new_status = 'ADJUSTED' AND current_status IN ('PENDING_APPROVAL', 'UNDER_REVIEW') THEN
        -- Issue is being adjusted
        UPDATE automated_issues
        SET
            status = p_new_status,
            approver_id = p_approver_id,
            approval_notes = p_approval_notes,
            adjusted_quantity = p_adjusted_quantity,
            adjusted_reason = p_adjusted_reason,
            approval_chain = approval_chain || jsonb_build_array(
                jsonb_build_object(
                    'step', jsonb_array_length(approval_chain) + 1,
                    'action', 'ADJUSTED',
                    'user_id', p_approver_id,
                    'timestamp', NOW(),
                    'notes', p_approval_notes,
                    'adjusted_quantity', p_adjusted_quantity,
                    'adjusted_reason', p_adjusted_reason
                )
            )
        WHERE issue_id = p_issue_id;

        RETURN QUERY SELECT true, 'Issue adjusted successfully'::VARCHAR;

    ELSIF p_new_status = 'ISSUED' AND current_status = 'APPROVED' THEN
        -- Issue is being marked as issued (creates actual transaction)
        -- This would typically be called after creating the actual transaction
        UPDATE automated_issues
        SET
            status = p_new_status,
            approval_chain = approval_chain || jsonb_build_array(
                jsonb_build_object(
                    'step', jsonb_array_length(approval_chain) + 1,
                    'action', 'ISSUED',
                    'user_id', p_approver_id,
                    'timestamp', NOW(),
                    'notes', 'Transaction created and issued'
                )
            )
        WHERE issue_id = p_issue_id;

        RETURN QUERY SELECT true, 'Issue marked as issued successfully'::VARCHAR;

    ELSE
        RETURN QUERY SELECT false, 'Invalid status transition'::VARCHAR;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job function (for manual execution or scheduling)
-- This can be called via Supabase Edge Functions or external scheduler
CREATE OR REPLACE FUNCTION schedule_ai_automation()
RETURNS void AS $$
BEGIN
    -- Run AI automation every 6 hours
    -- In production, this would be called by a cron job or scheduler
    PERFORM run_ai_automation();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION run_ai_automation() TO authenticated;
GRANT EXECUTE ON FUNCTION update_automated_issue_status(UUID, VARCHAR, UUID, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_ai_automation() TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type_status_date ON ai_predictions(prediction_type, status, predicted_date);
CREATE INDEX IF NOT EXISTS idx_automated_issues_status_created ON automated_issues(status, created_at);
CREATE INDEX IF NOT EXISTS idx_department_usage_patterns_confidence ON department_usage_patterns(confidence_level);

-- Add helpful comments
COMMENT ON FUNCTION run_ai_automation() IS 'Main function to run all AI automation processes';
COMMENT ON FUNCTION update_automated_issue_status() IS 'Update automated issue status with approval workflow';
COMMENT ON FUNCTION analyze_department_usage_patterns() IS 'Analyze historical usage patterns for each department';
COMMENT ON FUNCTION generate_ai_predictions() IS 'Generate AI predictions based on usage patterns';
COMMENT ON FUNCTION generate_automated_issues() IS 'Create automated issues requiring department approval';
COMMENT ON FUNCTION generate_ai_insights() IS 'Generate AI insights and recommendations';