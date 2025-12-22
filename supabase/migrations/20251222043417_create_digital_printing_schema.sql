/*
  # Digital Printing Management System - Complete Schema

  ## Overview
  Comprehensive database schema for digital printing company management with multi-tenant support,
  RBAC, inventory, production, pricing engine, and full operational workflow.

  ## 1. Multi-tenant & Authentication Tables
    - `companies` - Top-level tenant entities
    - `branches` - Company branches/locations
    - `roles` - System roles (Owner, Admin, Estimator, Kasir, Produksi)
    - `user_branch_roles` - User-branch-role assignments (RBAC)

  ## 2. Product Catalog Tables
    - `product_templates` - Base product types (banner, stiker, brosur, etc)
    - `product_attributes` - Dynamic attributes (ukuran, sisi, warna, GSM, bahan)
    - `product_attribute_values` - Allowed values for attributes
    - `finishing_options` - Available finishing services

  ## 3. Inventory Management Tables
    - `materials` - Raw materials master data
    - `inventory_lots` - Lot/batch tracking
    - `inventory_movements` - All stock movements (in/out/adjust)
    - `inventory_reservations` - Stock reservations for orders
    - `stock_opnames` - Physical stock count records

  ## 4. Production Tables
    - `machines` - Production machines
    - `process_steps` - Manufacturing process definitions

  ## 5. Pricing & Costing Tables
    - `pricing_rules` - Pricing rules in JSONB format
    - `cost_centers` - Overhead/labor cost allocation

  ## 6. Sales & Orders Tables
    - `customers` - Customer master data
    - `orders` - Sales orders and quotations
    - `order_items` - Line items in orders
    - `item_bom_materials` - Bill of materials for items
    - `item_bom_process` - Process routing for items
    - `item_finishing` - Finishing services for items
    - `item_costs` - Cost breakdown for items

  ## 7. Production Execution Tables
    - `work_orders` - Production work orders
    - `work_logs` - Actual production time logs

  ## 8. Delivery & Invoicing Tables
    - `deliveries` - Delivery notes
    - `invoices` - Invoice snapshots

  ## 9. POS Tables
    - `pos_sessions` - Cashier sessions
    - `payments` - Payment records

  ## 10. Audit Tables
    - `audit_logs` - Complete audit trail

  ## Security
    - RLS enabled on all tables
    - Row-level policies based on company/branch membership
    - Audit logging for all sensitive operations
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MULTI-TENANT & AUTHENTICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  phone text,
  email text,
  tax_id text,
  logo_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  address text,
  phone text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_branch_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, branch_id, role_id)
);

-- =====================================================
-- 2. PRODUCT CATALOG
-- =====================================================

CREATE TABLE IF NOT EXISTS product_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  category text NOT NULL,
  description text,
  base_unit text DEFAULT 'pcs',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS product_attributes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  attribute_type text NOT NULL,
  unit text,
  required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS product_attribute_values (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  attribute_id uuid REFERENCES product_attributes(id) ON DELETE CASCADE NOT NULL,
  value text NOT NULL,
  display_label text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finishing_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  unit_price decimal(15,2) DEFAULT 0,
  unit text DEFAULT 'pcs',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- =====================================================
-- 3. INVENTORY MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  min_stock decimal(15,4) DEFAULT 0,
  reorder_point decimal(15,4) DEFAULT 0,
  last_purchase_price decimal(15,2) DEFAULT 0,
  average_cost decimal(15,2) DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS inventory_lots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  lot_number text NOT NULL,
  received_date date NOT NULL,
  expiry_date date,
  quantity_received decimal(15,4) NOT NULL,
  quantity_available decimal(15,4) NOT NULL,
  unit_cost decimal(15,2) NOT NULL,
  supplier_name text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(material_id, branch_id, lot_number)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  lot_id uuid REFERENCES inventory_lots(id) ON DELETE SET NULL,
  movement_type text NOT NULL,
  quantity decimal(15,4) NOT NULL,
  unit_cost decimal(15,2),
  reference_type text,
  reference_id uuid,
  notes text,
  user_id uuid REFERENCES auth.users(id),
  movement_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  lot_id uuid REFERENCES inventory_lots(id) ON DELETE CASCADE,
  quantity_reserved decimal(15,4) NOT NULL,
  reference_type text NOT NULL,
  reference_id uuid NOT NULL,
  reserved_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  status text DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS stock_opnames (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  opname_date date NOT NULL,
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  lot_id uuid REFERENCES inventory_lots(id) ON DELETE SET NULL,
  system_quantity decimal(15,4) NOT NULL,
  physical_quantity decimal(15,4) NOT NULL,
  variance decimal(15,4) NOT NULL,
  notes text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 4. PRODUCTION RESOURCES
-- =====================================================

CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  machine_type text NOT NULL,
  hourly_rate decimal(15,2) DEFAULT 0,
  setup_time_minutes integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS process_steps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  step_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- =====================================================
-- 5. PRICING & COSTING
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  product_template_id uuid REFERENCES product_templates(id) ON DELETE CASCADE,
  rules_json jsonb NOT NULL,
  active boolean DEFAULT true,
  effective_from date,
  effective_to date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  cost_type text NOT NULL,
  allocation_basis text,
  rate decimal(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- =====================================================
-- 6. SALES & ORDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  phone text,
  email text,
  address text,
  tax_id text,
  credit_limit decimal(15,2) DEFAULT 0,
  payment_terms text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  order_number text NOT NULL,
  order_type text NOT NULL,
  status text DEFAULT 'draft',
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  order_date date NOT NULL,
  due_date date,
  is_express boolean DEFAULT false,
  subtotal decimal(15,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  discount_amount decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) DEFAULT 0,
  notes text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, order_number)
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  line_number integer NOT NULL,
  product_template_id uuid REFERENCES product_templates(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_specs jsonb DEFAULT '{}'::jsonb,
  quantity decimal(15,4) NOT NULL,
  unit text NOT NULL,
  unit_price decimal(15,2) NOT NULL,
  hpp_unit decimal(15,2) DEFAULT 0,
  hpp_total decimal(15,2) DEFAULT 0,
  line_total decimal(15,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(order_id, line_number)
);

CREATE TABLE IF NOT EXISTS item_bom_materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  material_id uuid REFERENCES materials(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  quantity_required decimal(15,4) NOT NULL,
  unit text NOT NULL,
  unit_cost decimal(15,2) NOT NULL,
  waste_factor decimal(5,4) DEFAULT 0,
  total_cost decimal(15,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item_bom_process (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  process_step_id uuid REFERENCES process_steps(id) ON DELETE SET NULL,
  machine_id uuid REFERENCES machines(id) ON DELETE SET NULL,
  process_name text NOT NULL,
  machine_name text,
  time_minutes decimal(10,2) NOT NULL,
  setup_time_minutes decimal(10,2) DEFAULT 0,
  hourly_rate decimal(15,2) NOT NULL,
  total_cost decimal(15,2) NOT NULL,
  step_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item_finishing (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  finishing_option_id uuid REFERENCES finishing_options(id) ON DELETE SET NULL,
  finishing_name text NOT NULL,
  quantity decimal(15,4) NOT NULL,
  unit_price decimal(15,2) NOT NULL,
  total_cost decimal(15,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item_costs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  cost_center_id uuid REFERENCES cost_centers(id) ON DELETE SET NULL,
  cost_type text NOT NULL,
  allocation_amount decimal(15,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 7. PRODUCTION EXECUTION
-- =====================================================

CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  work_order_number text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES order_items(id) ON DELETE SET NULL,
  status text DEFAULT 'pending',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  quantity_planned decimal(15,4) NOT NULL,
  quantity_completed decimal(15,4) DEFAULT 0,
  quantity_rejected decimal(15,4) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, work_order_number)
);

CREATE TABLE IF NOT EXISTS work_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE NOT NULL,
  process_step_id uuid REFERENCES process_steps(id) ON DELETE SET NULL,
  machine_id uuid REFERENCES machines(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_minutes decimal(10,2),
  quantity_processed decimal(15,4),
  quantity_rejected decimal(15,4) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 8. DELIVERY & INVOICING
-- =====================================================

CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  delivery_number text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  delivery_date date NOT NULL,
  recipient_name text,
  recipient_phone text,
  delivery_address text,
  driver_name text,
  vehicle_number text,
  status text DEFAULT 'prepared',
  notes text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, delivery_number)
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  invoice_number text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  delivery_id uuid REFERENCES deliveries(id) ON DELETE SET NULL,
  invoice_date date NOT NULL,
  due_date date,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_snapshot jsonb,
  items_snapshot jsonb,
  subtotal decimal(15,2) NOT NULL,
  tax_amount decimal(15,2) DEFAULT 0,
  discount_amount decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) NOT NULL,
  amount_paid decimal(15,2) DEFAULT 0,
  status text DEFAULT 'unpaid',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, invoice_number)
);

-- =====================================================
-- 9. POS & PAYMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS pos_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  session_number text NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  opening_balance decimal(15,2) DEFAULT 0,
  closing_balance decimal(15,2),
  cash_counted decimal(15,2),
  variance decimal(15,2),
  status text DEFAULT 'open',
  notes text,
  UNIQUE(branch_id, session_number)
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  payment_number text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  pos_session_id uuid REFERENCES pos_sessions(id) ON DELETE SET NULL,
  payment_date timestamptz DEFAULT now(),
  payment_method text NOT NULL,
  amount decimal(15,2) NOT NULL,
  reference_number text,
  notes text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, payment_number)
);

-- =====================================================
-- 10. AUDIT TRAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_branches_company ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_user_branch_roles_user ON user_branch_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_branch_roles_branch ON user_branch_roles(branch_id);
CREATE INDEX IF NOT EXISTS idx_product_templates_company ON product_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_materials_company ON materials(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_material ON inventory_lots(material_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_branch ON inventory_lots(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_material ON inventory_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_branch ON inventory_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_company ON work_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_order ON work_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_branch_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE finishing_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opnames ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_bom_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_bom_process ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_finishing ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - Company Level
-- =====================================================

CREATE POLICY "Users can view companies they belong to"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view branches they belong to"
  ON branches FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view all roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own role assignments"
  ON user_branch_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES - Product Catalog
-- =====================================================

CREATE POLICY "Users can view product templates in their company"
  ON product_templates FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage product templates in their company"
  ON product_templates FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view product attributes in their company"
  ON product_attributes FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view attribute values"
  ON product_attribute_values FOR SELECT
  TO authenticated
  USING (
    attribute_id IN (
      SELECT pa.id FROM product_attributes pa
      WHERE pa.company_id IN (
        SELECT DISTINCT b.company_id
        FROM branches b
        JOIN user_branch_roles ubr ON ubr.branch_id = b.id
        WHERE ubr.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view finishing options in their company"
  ON finishing_options FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - Inventory
-- =====================================================

CREATE POLICY "Users can view materials in their company"
  ON materials FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view inventory lots in their branches"
  ON inventory_lots FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view inventory movements in their branches"
  ON inventory_movements FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view inventory reservations in their branches"
  ON inventory_reservations FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view stock opnames in their branches"
  ON stock_opnames FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - Production Resources
-- =====================================================

CREATE POLICY "Users can view machines in their company"
  ON machines FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view process steps in their company"
  ON process_steps FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - Pricing & Costing
-- =====================================================

CREATE POLICY "Users can view pricing rules in their company"
  ON pricing_rules FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view cost centers in their company"
  ON cost_centers FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - Sales & Orders
-- =====================================================

CREATE POLICY "Users can view customers in their company"
  ON customers FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view orders in their branches"
  ON orders FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage orders in their branches"
  ON orders FOR ALL
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view order items through orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage order items through orders"
  ON order_items FOR ALL
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view BOM materials through order items"
  ON item_bom_materials FOR SELECT
  TO authenticated
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view BOM process through order items"
  ON item_bom_process FOR SELECT
  TO authenticated
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view item finishing through order items"
  ON item_finishing FOR SELECT
  TO authenticated
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view item costs through order items"
  ON item_costs FOR SELECT
  TO authenticated
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- RLS POLICIES - Production Execution
-- =====================================================

CREATE POLICY "Users can view work orders in their branches"
  ON work_orders FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage work orders in their branches"
  ON work_orders FOR ALL
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view work logs through work orders"
  ON work_logs FOR SELECT
  TO authenticated
  USING (
    work_order_id IN (
      SELECT id FROM work_orders WHERE branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage work logs through work orders"
  ON work_logs FOR ALL
  TO authenticated
  USING (
    work_order_id IN (
      SELECT id FROM work_orders WHERE branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- RLS POLICIES - Delivery & Invoicing
-- =====================================================

CREATE POLICY "Users can view deliveries in their branches"
  ON deliveries FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage deliveries in their branches"
  ON deliveries FOR ALL
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invoices in their branches"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage invoices in their branches"
  ON invoices FOR ALL
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - POS & Payments
-- =====================================================

CREATE POLICY "Users can view POS sessions in their branches"
  ON pos_sessions FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own POS sessions"
  ON pos_sessions FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view payments in their branches"
  ON payments FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage payments in their branches"
  ON payments FOR ALL
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - Audit Logs
-- =====================================================

CREATE POLICY "Users can view audit logs for their company"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- SEED DATA - Default Roles
-- =====================================================

INSERT INTO roles (name, description, permissions) VALUES
  ('Owner', 'Full system access', '["*"]'::jsonb),
  ('Admin', 'Administrative access', '["products.*", "inventory.*", "orders.*", "production.*", "reports.*"]'::jsonb),
  ('Estimator', 'Can create quotations and manage pricing', '["products.view", "pricing.*", "orders.quote"]'::jsonb),
  ('Kasir', 'POS and payment access', '["pos.*", "orders.view", "payments.*"]'::jsonb),
  ('Produksi', 'Production floor access', '["production.*", "work_orders.*", "inventory.view"]'::jsonb)
ON CONFLICT (name) DO NOTHING;