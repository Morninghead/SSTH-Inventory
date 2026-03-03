-- Migration to ensure updated_at exists on inventory_status table

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'inventory_status'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE inventory_status ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
