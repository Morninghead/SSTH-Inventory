# Generate Database Types for Supabase

Since the database types need to match your actual Supabase schema, please follow these steps:

## 1. Install Supabase CLI (if not already installed)

```bash
# Using npm
npm install -g supabase

# Or using yarn
yarn global add supabase
```

## 2. Login to Supabase

```bash
supabase login
```

## 3. Link to your project

```bash
supabase link --project-ref viabjxdggrdarcveaxam
```

## 4. Generate the types

```bash
# Generate TypeScript types
supabase gen types typescript --local > src/types/database.types.ts
```

## 5. Verify the generated file

Check that `src/types/database.types.ts` includes all your tables:
- ✅ user_profiles
- ✅ departments
- ✅ categories
- ✅ items
- ✅ inventory_status
- ✅ locations
- ✅ suppliers
- ✅ transactions
- ✅ transaction_items (or transaction_lines)
- ✅ purchase_order
- ✅ po_items (or purchase_order_line)
- ✅ backorders
- ✅ department_plans
- ✅ department_plan_items
- ✅ stock_counts
- ✅ stock_count_lines
- ✅ stock_count_adjustments
- ✅ audit_logs

## 6. If any tables are missing

After generating the types, if any tables are missing, you may need to:
1. Check if the tables exist in your Supabase project
2. Create missing tables using the SQL scripts in your project
3. Ensure foreign key relationships are properly defined

## 7. Common Issues and Solutions

### Issue: "could not find the relation between X and Y"
**Solution:** Add foreign key constraints in Supabase SQL Editor

Example for po_items and items:
```sql
ALTER TABLE po_items
ADD CONSTRAINT fk_po_items_items
FOREIGN KEY (item_id) REFERENCES items(item_id);
```

### Issue: Missing RPC functions
**Solution:** Create the functions in Supabase SQL Editor

Example for get_stock_counts_paginated:
```sql
CREATE OR REPLACE FUNCTION get_stock_counts_paginated(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_search_term TEXT DEFAULT '',
  p_count_type TEXT DEFAULT '',
  p_status TEXT DEFAULT '',
  p_period_month TEXT DEFAULT ''
)
RETURNS TABLE (
  data JSONB,
  count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Function implementation
END;
$$;
```

### Issue: Column does not exist
**Solution:** Check if the column exists in the table structure. If not, add it:

```sql
ALTER TABLE table_name
ADD COLUMN column_name data_type;
```

## Next Steps

After generating the correct types:
1. Run `npm run build` to check for remaining errors
2. Fix any remaining type mismatches
3. Test the application functionality