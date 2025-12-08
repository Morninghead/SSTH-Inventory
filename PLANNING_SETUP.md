# Planning & Backorder Setup Instructions

## Current Status
✅ Planning page is accessible in the sidebar
✅ Database migration SQL file created
✅ TypeScript types regenerated
❌ **The new tables don't appear in the database yet**

## Issue
The migration file `supabase/migrations/20251121_add_planning_features.sql` was created but hasn't been applied to your Supabase database yet.

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# Link your project
npx supabase link --project-ref viabjxdggrdarcveaxam

# Push the migration
npx supabase db push
```

### Option 2: Manual SQL Execution
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/20251121_add_planning_features.sql`
4. Copy all the SQL code
5. Paste it into the SQL Editor
6. Click **Run**

### Option 3: Use Supabase Studio
1. Go to https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/editor
2. Click "New Query"
3. Paste the contents of `supabase/migrations/20251121_add_planning_features.sql`
4. Execute the query

## After Running the Migration

Once the migration is applied, run this command again to regenerate types:
```bash
npx supabase gen types typescript --project-id viabjxdggrdarcveaxam > src/types/database.types.ts
```

Then I can restore the full planning components with all features!

## What the Migration Creates

The migration adds 3 new tables:
1. **`department_plans`** - Monthly forecast plans by department
2. **`department_plan_items`** - Individual items in each plan
3. **`backorders`** - Items that couldn't be fulfilled due to insufficient stock

## Migration File Location
`e:\ssth-inventory-v2\SSTH-Inventory\supabase\migrations\20251121_add_planning_features.sql`
