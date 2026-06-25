-- Fix missing RLS policies for suppliers table

-- Drop policies if they exist to avoid duplicate errors
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON suppliers;
    DROP POLICY IF EXISTS "Suppliers can be managed by admins and managers" ON suppliers;
    DROP POLICY IF EXISTS "Vendors can be managed by admins and managers" ON vendors;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Allow read access for all authenticated users
CREATE POLICY "Authenticated users can view suppliers" 
    ON suppliers FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow insert/update/delete for admin, developer, and manager roles only
-- (Uses auth.uid() strictly to prevent IDOR/Auth bypass)
CREATE POLICY "Suppliers can be managed by admins and managers" 
    ON suppliers 
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('admin', 'developer', 'manager')
        )
    );

-- Apply the same secure management policy to the vendors table 
CREATE POLICY "Vendors can be managed by admins and managers" 
    ON vendors 
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('admin', 'developer', 'manager')
        )
    );
