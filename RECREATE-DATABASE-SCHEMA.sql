-- =====================================================
-- SSTH INVENTORY - COMPLETE DATABASE SCHEMA
-- Recreate all tables from scratch
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

-- user_profiles (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT,
  department_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert profiles"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- MASTER DATA TABLES
-- =====================================================

-- departments
CREATE TABLE departments (
  dept_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dept_code TEXT UNIQUE NOT NULL,
  dept_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key to user_profiles after departments exists
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_department_id_fkey
FOREIGN KEY (department_id) REFERENCES departments(dept_id);

-- categories
CREATE TABLE categories (
  category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_code TEXT UNIQUE NOT NULL,
  category_name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- locations
CREATE TABLE locations (
  location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_code TEXT UNIQUE NOT NULL,
  location_name TEXT NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- suppliers
CREATE TABLE suppliers (
  supplier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_code TEXT UNIQUE NOT NULL,
  supplier_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INVENTORY TABLES
-- =====================================================

-- items
CREATE TABLE items (
  item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(category_id),
  base_uom TEXT NOT NULL,
  unit_cost NUMERIC(10,2),
  reorder_level NUMERIC(10,2),
  image_path TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- inventory_status
CREATE TABLE inventory_status (
  item_id UUID PRIMARY KEY REFERENCES items(item_id) ON DELETE CASCADE,
  quantity NUMERIC(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TRANSACTION TABLES
-- =====================================================

-- transactions
CREATE TABLE transactions (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('ISSUE', 'RECEIVE', 'ADJUSTMENT')),
  transaction_date TIMESTAMPTZ DEFAULT now(),
  department_id UUID REFERENCES departments(dept_id),
  supplier_id UUID REFERENCES suppliers(supplier_id),
  reference_number TEXT,
  notes TEXT,
  status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('DRAFT', 'COMPLETED', 'CANCELLED')),
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- transaction_lines
CREATE TABLE transaction_lines (
  line_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(item_id),
  quantity NUMERIC(10,2) NOT NULL,
  unit_cost NUMERIC(10,2),
  line_total NUMERIC(10,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PURCHASING TABLES
-- =====================================================

-- purchase_order (renamed from purchase_orders in types)
CREATE TABLE purchase_order (
  po_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number TEXT UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(supplier_id),
  po_date TIMESTAMPTZ DEFAULT now(),
  expected_date TIMESTAMPTZ,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'RECEIVED', 'CANCELLED')),
  total_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- purchase_order_line
CREATE TABLE purchase_order_line (
  po_line_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID NOT NULL REFERENCES purchase_order(po_id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(item_id),
  quantity NUMERIC(10,2) NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL,
  line_total NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  quantity_received NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- AUDIT AND LOGGING TABLES
-- =====================================================

-- audit_logs
CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT,
  record_id TEXT,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES user_profiles(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Items indexes
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_item_code ON items(item_code);
CREATE INDEX idx_items_is_active ON items(is_active);
CREATE INDEX idx_items_created_by ON items(created_by);

-- Transactions indexes
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_department ON transactions(department_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Transaction lines indexes
CREATE INDEX idx_transaction_lines_transaction_id ON transaction_lines(transaction_id);
CREATE INDEX idx_transaction_lines_item_id ON transaction_lines(item_id);

-- Purchase order indexes
CREATE INDEX idx_po_supplier_id ON purchase_order(supplier_id);
CREATE INDEX idx_po_status ON purchase_order(status);
CREATE INDEX idx_po_date ON purchase_order(po_date);

-- Purchase order line indexes
CREATE INDEX idx_po_line_po_id ON purchase_order_line(po_id);
CREATE INDEX idx_po_line_item_id ON purchase_order_line(item_id);

-- User profiles indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_department ON user_profiles(department_id);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- RLS POLICIES FOR DATA ACCESS
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (allow authenticated users)
CREATE POLICY "Authenticated users can view departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view locations" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view items" ON items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view inventory" ON inventory_status FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view transactions" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view transaction lines" ON transaction_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view POs" ON purchase_order FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view PO lines" ON purchase_order_line FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view audit logs" ON audit_logs FOR SELECT TO authenticated USING (true);

-- Insert/Update/Delete policies (allow authenticated users - refine later based on roles)
CREATE POLICY "Authenticated users can insert departments" ON departments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update departments" ON departments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update categories" ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert items" ON items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update items" ON items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert inventory" ON inventory_status FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update inventory" ON inventory_status FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update transactions" ON transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transaction lines" ON transaction_lines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert POs" ON purchase_order FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update POs" ON purchase_order FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert PO lines" ON purchase_order_line FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update PO lines" ON purchase_order_line FOR UPDATE TO authenticated USING (true);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Database schema created successfully!' as status;
SELECT 'Total tables created: 13' as info;
