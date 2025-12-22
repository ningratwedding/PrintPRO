/*
  # Optimize RLS Policies for Performance - Part 2 Fixed

  ## Continuation
  This is part 2 of the RLS optimization migration, covering:
  - Orders and related tables
  - Work orders and logs
  - Deliveries
  - Invoices
  - Payments and POS
  - Users and metadata

  ## Performance
  Same optimization: replace `auth.uid()` with `(select auth.uid())`
*/

-- =====================================================
-- ORDERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view orders in their branches" ON orders;
CREATE POLICY "Users can view orders in their branches"
  ON orders FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage orders in their branches" ON orders;
CREATE POLICY "Users can manage orders in their branches"
  ON orders FOR ALL
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- ORDER ITEMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view order items through orders" ON order_items;
CREATE POLICY "Users can view order items through orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage order items through orders" ON order_items;
CREATE POLICY "Users can manage order items through orders"
  ON order_items FOR ALL
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- ITEM BOM MATERIALS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view BOM materials through order items" ON item_bom_materials;
CREATE POLICY "Users can view BOM materials through order items"
  ON item_bom_materials FOR SELECT
  TO authenticated
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- ITEM BOM PROCESS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view BOM process through order items" ON item_bom_process;
CREATE POLICY "Users can view BOM process through order items"
  ON item_bom_process FOR SELECT
  TO authenticated
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- ITEM FINISHING POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view item finishing through order items" ON item_finishing;
CREATE POLICY "Users can view item finishing through order items"
  ON item_finishing FOR SELECT
  TO authenticated
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- ITEM COSTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view item costs through order items" ON item_costs;
CREATE POLICY "Users can view item costs through order items"
  ON item_costs FOR SELECT
  TO authenticated
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- WORK ORDERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view work orders in their branches" ON work_orders;
CREATE POLICY "Users can view work orders in their branches"
  ON work_orders FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage work orders in their branches" ON work_orders;
CREATE POLICY "Users can manage work orders in their branches"
  ON work_orders FOR ALL
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- WORK LOGS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view work logs through work orders" ON work_logs;
CREATE POLICY "Users can view work logs through work orders"
  ON work_logs FOR SELECT
  TO authenticated
  USING (
    work_order_id IN (
      SELECT wo.id FROM work_orders wo
      WHERE wo.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage work logs through work orders" ON work_logs;
CREATE POLICY "Users can manage work logs through work orders"
  ON work_logs FOR ALL
  TO authenticated
  USING (
    work_order_id IN (
      SELECT wo.id FROM work_orders wo
      WHERE wo.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- DELIVERIES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view deliveries in their branches" ON deliveries;
CREATE POLICY "Users can view deliveries in their branches"
  ON deliveries FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage deliveries in their branches" ON deliveries;
CREATE POLICY "Users can manage deliveries in their branches"
  ON deliveries FOR ALL
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- INVOICES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view invoices in their branches" ON invoices;
CREATE POLICY "Users can view invoices in their branches"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage invoices in their branches" ON invoices;
CREATE POLICY "Users can manage invoices in their branches"
  ON invoices FOR ALL
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- POS SESSIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view POS sessions in their branches" ON pos_sessions;
CREATE POLICY "Users can view POS sessions in their branches"
  ON pos_sessions FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage their own POS sessions" ON pos_sessions;
CREATE POLICY "Users can manage their own POS sessions"
  ON pos_sessions FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view payments in their branches" ON payments;
CREATE POLICY "Users can view payments in their branches"
  ON payments FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage payments in their branches" ON payments;
CREATE POLICY "Users can manage payments in their branches"
  ON payments FOR ALL
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- USERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view users in their company" ON users;
CREATE POLICY "Users can view users in their company"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Owners and admins can insert users" ON users;
CREATE POLICY "Owners and admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      JOIN roles r ON r.id = ubr.role_id
      WHERE ubr.user_id = (select auth.uid())
      AND r.name IN ('Owner', 'Admin')
    )
  );

DROP POLICY IF EXISTS "Owners and admins can update users" ON users;
CREATE POLICY "Owners and admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      JOIN roles r ON r.id = ubr.role_id
      WHERE ubr.user_id = (select auth.uid())
      AND r.name IN ('Owner', 'Admin')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      JOIN roles r ON r.id = ubr.role_id
      WHERE ubr.user_id = (select auth.uid())
      AND r.name IN ('Owner', 'Admin')
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- USERS METADATA POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view metadata for users in their company" ON users_metadata;
CREATE POLICY "Users can view metadata for users in their company"
  ON users_metadata FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT u.id FROM users u
      WHERE u.company_id IN (
        SELECT DISTINCT b.company_id
        FROM branches b
        JOIN user_branch_roles ubr ON ubr.branch_id = b.id
        WHERE ubr.user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert their own metadata" ON users_metadata;
CREATE POLICY "Users can insert their own metadata"
  ON users_metadata FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own metadata" ON users_metadata;
CREATE POLICY "Users can update their own metadata"
  ON users_metadata FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
