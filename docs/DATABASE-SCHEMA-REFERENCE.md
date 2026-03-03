# 📊 **DATABASE SCHEMA REFERENCE - MUST READ**

**⚠️ IMPORTANT: This file contains the ACTUAL current database schema. Always read this before making any database-related changes.**

**Last Updated:** November 18, 2025
**Source:** `current_schemas.json` (actual database export)

---

## 🎯 **WHY THIS FILE EXISTS**

The TypeScript types in `src/types/database.types.ts` may be **OUTDATED** and **INCORRECT**. Always reference this file for the actual database schema before:

- ✅ Writing SQL queries
- ✅ Creating database functions
- ✅ Building React components that use database data
- ✅ Making any database schema changes
- ✅ Debugging database errors

---

## 📋 **COMPLETE TABLE STRUCTURES**

### **1. Purchase Orders (`purchase_order`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `po_id` | UUID | NOT NULL | uuid_generate_v4() | PRIMARY KEY |
| `po_number` | TEXT | NOT NULL | | UNIQUE |
| `supplier_id` | UUID | NOT NULL | | FOREIGN KEY → suppliers |
| `po_date` | TIMESTAMPTZ | YES | now() | |
| `expected_date` | TIMESTAMPTZ | YES | | **Delivery Date** (NOT delivery_date!) |
| `status` | TEXT | YES | 'DRAFT' | DRAFT/SUBMITTED/APPROVED/RECEIVED/CANCELLED |
| `total_amount` | NUMERIC(10,2) | YES | 0 | |
| `notes` | TEXT | YES | | |
| `created_by` | UUID | NOT NULL | | FOREIGN KEY → user_profiles |
| `approved_by` | UUID | YES | | FOREIGN KEY → user_profiles |
| `approved_at` | TIMESTAMPTZ | YES | | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

### **2. Purchase Order Lines (`purchase_order_line`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `po_line_id` | UUID | NOT NULL | uuid_generate_v4() | PRIMARY KEY |
| `po_id` | UUID | NOT NULL | | FOREIGN KEY → purchase_order |
| `item_id` | UUID | NOT NULL | | FOREIGN KEY → items |
| `quantity` | NUMERIC(10,2) | NOT NULL | | **NOT qty_ordered** |
| `unit_cost` | NUMERIC(10,2) | NOT NULL | | **NOT unit_price** |
| `line_total` | NUMERIC(10,2) | YES | | Computed: quantity × unit_cost |
| `quantity_received` | NUMERIC(10,2) | YES | 0 | **NOT qty_received** |
| `notes` | TEXT | YES | | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

### **3. Items (`items`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `item_id` | UUID | NOT NULL | uuid_generate_v4() | PRIMARY KEY |
| `item_code` | TEXT | NOT NULL | | UNIQUE |
| `description` | TEXT | NOT NULL | | |
| `category_id` | UUID | YES | | FOREIGN KEY → categories |
| `base_uom` | TEXT | NOT NULL | | Unit of measure |
| `unit_cost` | NUMERIC(10,2) | YES | | |
| `reorder_level` | NUMERIC(10,2) | YES | | |
| `image_path` | TEXT | YES | | |
| `image_url` | TEXT | YES | | |
| `is_active` | BOOLEAN | YES | true | |
| `created_by` | UUID | NOT NULL | | FOREIGN KEY → user_profiles |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

### **4. Inventory Status (`inventory_status`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `item_id` | UUID | NOT NULL | | PRIMARY KEY → items |
| `quantity` | NUMERIC(10,2) | YES | 0 | Current stock level |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

### **5. Categories (`categories`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `category_id` | UUID | NOT NULL | uuid_generate_v4() | PRIMARY KEY |
| `category_code` | TEXT | NOT NULL | | UNIQUE |
| `category_name` | TEXT | NOT NULL | | UNIQUE |
| `description` | TEXT | YES | | |
| `is_active` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMPTZ | YES | now() | |

### **6. Suppliers (`suppliers`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `supplier_id` | UUID | NOT NULL | uuid_generate_v4() | PRIMARY KEY |
| `supplier_code` | TEXT | NOT NULL | | UNIQUE |
| `supplier_name` | TEXT | NOT NULL | | |
| `contact_name` | TEXT | YES | | |
| `phone` | TEXT | YES | | |
| `email` | TEXT | YES | | |
| `address` | TEXT | YES | | |
| `is_active` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

### **7. Departments (`departments`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `dept_id` | UUID | NOT NULL | uuid_generate_v4() | PRIMARY KEY |
| `dept_code` | TEXT | NOT NULL | | UNIQUE |
| `dept_name` | TEXT | NOT NULL | | |
| `is_active` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

### **8. Transactions (`transactions`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `transaction_id` | UUID | NOT NULL | uuid_generate_v4() | PRIMARY KEY |
| `transaction_type` | TEXT | NOT NULL | | ISSUE/RECEIVE/ADJUSTMENT |
| `transaction_date` | TIMESTAMPTZ | YES | now() | |
| `department_id` | UUID | YES | | FOREIGN KEY → departments |
| `supplier_id` | UUID | YES | | FOREIGN KEY → suppliers |
| `reference_number` | TEXT | YES | | |
| `notes` | TEXT | YES | | |
| `status` | TEXT | YES | 'COMPLETED' | |
| `created_by` | UUID | NOT NULL | | FOREIGN KEY → user_profiles |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

### **9. Transaction Lines (`transaction_lines`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `line_id` | UUID | NOT NULL | uuid_generate_v4() | PRIMARY KEY |
| `transaction_id` | UUID | NOT NULL | | FOREIGN KEY → transactions |
| `item_id` | UUID | NOT NULL | | FOREIGN KEY → items |
| `quantity` | NUMERIC(10,2) | NOT NULL | | |
| `unit_cost` | NUMERIC(10,2) | YES | | |
| `line_total` | NUMERIC(10,2) | YES | | |
| `notes` | TEXT | YES | | |
| `created_at` | TIMESTAMPTZ | YES | now() | |

### **10. User Profiles (`user_profiles`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | | PRIMARY KEY → auth.users |
| `full_name` | TEXT | YES | | |
| `role` | TEXT | YES | | developer/admin/manager/user/viewer |
| `department_id` | UUID | YES | | FOREIGN KEY → departments |
| `is_active` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

### **11. Locations (`locations`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `location_id` | UUID | NOT NULL | uuid_generate_v4() | PRIMARY KEY |
| `location_code` | TEXT | NOT NULL | | UNIQUE |
| `location_name` | TEXT | NOT NULL | | |
| `address` | TEXT | YES | | |
| `is_active` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

### **12. Audit Logs (`audit_logs`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `log_id` | UUID | NOT NULL | uuid_generate_v4() | PRIMARY KEY |
| `table_name` | TEXT | YES | | |
| `record_id` | TEXT | YES | | |
| `action` | TEXT | NOT NULL | | INSERT/UPDATE/DELETE |
| `old_values` | JSONB | YES | | |
| `new_values` | JSONB | YES | | |
| `user_id` | UUID | YES | | FOREIGN KEY → auth.users |
| `ip_address` | INET | YES | | |
| `user_agent` | TEXT | YES | | |
| `created_at` | TIMESTAMPTZ | YES | now() | |

### **13. System Settings (`system_settings`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `setting_id` | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY |
| `setting_key` | TEXT | NOT NULL | | UNIQUE |
| `setting_value` | TEXT | YES | | |
| `category` | TEXT | NOT NULL | | |
| `description` | TEXT | YES | | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |
| `updated_by` | UUID | YES | | FOREIGN KEY → user_profiles |

### **14. User Preferences (`user_preferences`)**

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `preference_id` | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY |
| `user_id` | UUID | NOT NULL | | FOREIGN KEY → user_profiles |
| `preference_key` | TEXT | NOT NULL | | UNIQUE |
| `preference_value` | TEXT | YES | | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

---

## 🚨 **COMMON MISTAKES TO AVOID**

### **WRONG Column Names (from outdated types)**:
- ❌ `delivery_date` → ✅ `expected_date`
- ❌ `qty_ordered` → ✅ `quantity`
- ❌ `unit_price` → ✅ `unit_cost`
- ❌ `qty_received` → ✅ `quantity_received`

### **WRONG Assumptions**:
- ❌ Assuming TypeScript types are correct
- ❌ Assuming column names follow naming conventions
- ❌ Assuming computed columns don't exist (`line_total` exists!)

---

## ✅ **CORRECT QUERY EXAMPLES**

### **Get Purchase Orders with Lines**:
```sql
SELECT
  po.po_id,
  po.po_number,
  po.expected_date,  -- NOT delivery_date
  po.status,
  pol.quantity,      -- NOT qty_ordered
  pol.unit_cost,     -- NOT unit_price
  pol.line_total     -- This exists!
FROM purchase_order po
LEFT JOIN purchase_order_line pol ON po.po_id = pol.po_id
WHERE po.status = 'DRAFT'
ORDER BY po.po_date DESC;
```

### **Calculate PO Total**:
```sql
SELECT
  po.po_id,
  po.po_number,
  COALESCE(SUM(pol.line_total), 0) as total_amount
FROM purchase_order po
LEFT JOIN purchase_order_line pol ON po.po_id = pol.po_id
GROUP BY po.po_id, po.po_number;
```

---

## 🔧 **TYPE UPDATES NEEDED**

The TypeScript types in `src/types/database.types.ts` need to be regenerated to match this actual schema:

```bash
# Regenerate types from actual database
npx supabase gen types typescript --project-id viabjxdggrdarcveaxam > src/types/database.types.ts
```

---

## 📝 **HOW TO UPDATE THIS FILE**

1. When database schema changes, export new schema:
   ```sql
   SELECT
     table_schema,
     table_name,
     column_name,
     ordinal_position,
     column_default,
     is_nullable,
     data_type,
     character_maximum_length,
     numeric_precision,
     udt_name,
     constraint_type
   FROM information_schema.columns
   LEFT JOIN information_schema.key_column_usage
     ON columns.table_name = key_column_usage.table_name
     AND columns.column_name = key_column_usage.column_name
   WHERE table_schema = 'public'
   ORDER BY table_name, ordinal_position;
   ```

2. Save as `current_schemas.json`

3. Update this documentation file accordingly

---

**⚠️ REMEMBER**: Always check this file first! The TypeScript types may lie, but this file contains the TRUTH! 🎯