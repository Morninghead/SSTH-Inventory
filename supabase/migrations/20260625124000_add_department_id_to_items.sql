-- Migration to add department_id to items for specific vs shared scope

-- 1. Add department_id column
ALTER TABLE items ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(dept_id) ON DELETE SET NULL;

-- 2. Drop existing RLS policies on items (to recreate them with department logic)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can view items" ON items;
    DROP POLICY IF EXISTS "Authenticated users can insert items" ON items;
    DROP POLICY IF EXISTS "Authenticated users can update items" ON items;
    DROP POLICY IF EXISTS "Admins and managers can manage all items" ON items;
    DROP POLICY IF EXISTS "Users can view shared or department items" ON items;
    DROP POLICY IF EXISTS "Users can insert shared or department items" ON items;
    DROP POLICY IF EXISTS "Users can update shared or department items" ON items;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- 3. Recreate RLS policies

-- Admins, developers, and managers can view and manage ALL items
CREATE POLICY "Admins and managers can manage all items"
    ON items FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('admin', 'developer', 'manager')
        )
    );

-- Regular users can view shared items OR items in their own department
CREATE POLICY "Users can view shared or department items"
    ON items FOR SELECT TO authenticated
    USING (
        department_id IS NULL 
        OR 
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.department_id = items.department_id
        )
    );

-- Regular users can only insert shared items OR items for their own department
CREATE POLICY "Users can insert shared or department items"
    ON items FOR INSERT TO authenticated
    WITH CHECK (
        department_id IS NULL 
        OR 
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.department_id = items.department_id
        )
    );

-- Regular users can only update shared items OR items for their own department
CREATE POLICY "Users can update shared or department items"
    ON items FOR UPDATE TO authenticated
    USING (
        department_id IS NULL 
        OR 
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.department_id = items.department_id
        )
    );
