-- Add is_enabled field to purchase_order table for simplified workflow
-- This replaces the complex approval/submitted/canceled workflow with simple enable/disable toggle

ALTER TABLE purchase_order
ADD COLUMN is_enabled BOOLEAN DEFAULT true;

-- Add comment to explain the new field
COMMENT ON COLUMN purchase_order.is_enabled IS 'Controls whether PO is active/enabled. Admin-only toggle replaces complex approval workflow.';

-- Update existing purchase orders to be enabled by default
UPDATE purchase_order
SET is_enabled = true
WHERE is_enabled IS NULL;

-- Add index for better performance on queries filtering by enabled status
CREATE INDEX idx_purchase_order_is_enabled ON purchase_order(is_enabled);

-- Optional: If you want to remove the old status-related columns (run after confirming migration works)
-- Note: This will remove data - backup if needed
-- ALTER TABLE purchase_order DROP COLUMN IF EXISTS approved_at;
-- ALTER TABLE purchase_order DROP COLUMN IF EXISTS approved_by;
-- ALTER TABLE purchase_order DROP COLUMN IF EXISTS delivery_status;
-- ALTER TABLE purchase_order DROP COLUMN IF EXISTS payment_status;
-- ALTER TABLE purchase_order DROP COLUMN IF EXISTS status;