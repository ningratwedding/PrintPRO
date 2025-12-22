/*
  # Remove Duplicate Permissive Policies

  ## Problem
  Multiple tables have overlapping permissive policies (e.g., both "FOR ALL" and separate SELECT/INSERT/UPDATE/DELETE policies).
  This can cause confusion and potential security issues.

  ## Solution
  Remove the "FOR ALL" policies and rely on specific, granular policies for each operation.
  This provides better clarity and more explicit control.

  ## Changes
  Drop "FOR ALL" policies from:
  - product_templates (already has separate INSERT, UPDATE, DELETE policies)
  - orders (keep separate view/manage, but remove FOR ALL)
  - order_items (same)
  - work_orders (same)
  - work_logs (same)
  - deliveries (same)
  - invoices (same)
  - pos_sessions (keep view in branches + manage own)
  - payments (same)

  ## Notes
  - This resolves the "Multiple Permissive Policies" warnings
  - Security logic remains the same, just more explicit
  - Better maintainability and clarity
*/

-- =====================================================
-- PRODUCT TEMPLATES
-- =====================================================
-- Has separate INSERT, UPDATE, DELETE + a FOR ALL policy
-- Remove the FOR ALL policy

DROP POLICY IF EXISTS "Users can manage product templates in their company" ON product_templates;

-- =====================================================
-- ORDERS
-- =====================================================
-- Has both view (SELECT) and manage (ALL) policies
-- Keep the view policy, convert ALL to specific INSERT/UPDATE/DELETE

DROP POLICY IF EXISTS "Users can manage orders in their branches" ON orders;

CREATE POLICY "Users can insert orders in their branches"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update orders in their branches"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete orders in their branches"
  ON orders FOR DELETE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- ORDER ITEMS
-- =====================================================

DROP POLICY IF EXISTS "Users can manage order items through orders" ON order_items;

CREATE POLICY "Users can insert order items through orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Users can update order items through orders"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Users can delete order items through orders"
  ON order_items FOR DELETE
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
-- WORK ORDERS
-- =====================================================

DROP POLICY IF EXISTS "Users can manage work orders in their branches" ON work_orders;

CREATE POLICY "Users can insert work orders in their branches"
  ON work_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update work orders in their branches"
  ON work_orders FOR UPDATE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete work orders in their branches"
  ON work_orders FOR DELETE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- WORK LOGS
-- =====================================================

DROP POLICY IF EXISTS "Users can manage work logs through work orders" ON work_logs;

CREATE POLICY "Users can insert work logs through work orders"
  ON work_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    work_order_id IN (
      SELECT wo.id FROM work_orders wo
      WHERE wo.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Users can update work logs through work orders"
  ON work_logs FOR UPDATE
  TO authenticated
  USING (
    work_order_id IN (
      SELECT wo.id FROM work_orders wo
      WHERE wo.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  )
  WITH CHECK (
    work_order_id IN (
      SELECT wo.id FROM work_orders wo
      WHERE wo.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Users can delete work logs through work orders"
  ON work_logs FOR DELETE
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
-- DELIVERIES
-- =====================================================

DROP POLICY IF EXISTS "Users can manage deliveries in their branches" ON deliveries;

CREATE POLICY "Users can insert deliveries in their branches"
  ON deliveries FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update deliveries in their branches"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete deliveries in their branches"
  ON deliveries FOR DELETE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- INVOICES
-- =====================================================

DROP POLICY IF EXISTS "Users can manage invoices in their branches" ON invoices;

CREATE POLICY "Users can insert invoices in their branches"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update invoices in their branches"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete invoices in their branches"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- POS SESSIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can manage their own POS sessions" ON pos_sessions;

CREATE POLICY "Users can insert their own POS sessions"
  ON pos_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own POS sessions"
  ON pos_sessions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own POS sessions"
  ON pos_sessions FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PAYMENTS
-- =====================================================

DROP POLICY IF EXISTS "Users can manage payments in their branches" ON payments;

CREATE POLICY "Users can insert payments in their branches"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update payments in their branches"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete payments in their branches"
  ON payments FOR DELETE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );
