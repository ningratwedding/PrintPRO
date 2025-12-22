/*
  # Optimize RLS Policies for Performance

  ## Performance Improvements
  Replace `auth.uid()` with `(select auth.uid())` in all RLS policies.
  This prevents re-evaluation of auth.uid() for each row, significantly improving query performance at scale.

  ## Changes
  1. Drop and recreate all policies that use auth.uid()
  2. Use the optimized `(select auth.uid())` pattern throughout
  3. Maintain the same security logic, just with better performance

  ## Security
  - No changes to security model
  - Same access control logic, just optimized for performance
  - All policies remain restrictive and secure
*/

-- =====================================================
-- COMPANIES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view companies they belong to" ON companies;
CREATE POLICY "Users can view companies they belong to"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their companies" ON companies;
CREATE POLICY "Users can update their companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- BRANCHES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view branches they belong to" ON branches;
CREATE POLICY "Users can view branches they belong to"
  ON branches FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update branches they belong to" ON branches;
CREATE POLICY "Users can update branches they belong to"
  ON branches FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- USER BRANCH ROLES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own role assignments" ON user_branch_roles;
CREATE POLICY "Users can view their own role assignments"
  ON user_branch_roles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update role assignments in their branches" ON user_branch_roles;
CREATE POLICY "Users can update role assignments in their branches"
  ON user_branch_roles FOR UPDATE
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

DROP POLICY IF EXISTS "Users can delete role assignments in their branches" ON user_branch_roles;
CREATE POLICY "Users can delete role assignments in their branches"
  ON user_branch_roles FOR DELETE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PRODUCT TEMPLATES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view product templates in their company" ON product_templates;
CREATE POLICY "Users can view product templates in their company"
  ON product_templates FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert product templates in their company" ON product_templates;
CREATE POLICY "Users can insert product templates in their company"
  ON product_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update product templates in their company" ON product_templates;
CREATE POLICY "Users can update product templates in their company"
  ON product_templates FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete product templates in their company" ON product_templates;
CREATE POLICY "Users can delete product templates in their company"
  ON product_templates FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PRODUCT ATTRIBUTES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view product attributes in their company" ON product_attributes;
CREATE POLICY "Users can view product attributes in their company"
  ON product_attributes FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert product attributes in their company" ON product_attributes;
CREATE POLICY "Users can insert product attributes in their company"
  ON product_attributes FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update product attributes in their company" ON product_attributes;
CREATE POLICY "Users can update product attributes in their company"
  ON product_attributes FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PRODUCT ATTRIBUTE VALUES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view attribute values" ON product_attribute_values;
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
        WHERE ubr.user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert attribute values" ON product_attribute_values;
CREATE POLICY "Users can insert attribute values"
  ON product_attribute_values FOR INSERT
  TO authenticated
  WITH CHECK (
    attribute_id IN (
      SELECT pa.id FROM product_attributes pa
      WHERE pa.company_id IN (
        SELECT DISTINCT b.company_id
        FROM branches b
        JOIN user_branch_roles ubr ON ubr.branch_id = b.id
        WHERE ubr.user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can update attribute values" ON product_attribute_values;
CREATE POLICY "Users can update attribute values"
  ON product_attribute_values FOR UPDATE
  TO authenticated
  USING (
    attribute_id IN (
      SELECT pa.id FROM product_attributes pa
      WHERE pa.company_id IN (
        SELECT DISTINCT b.company_id
        FROM branches b
        JOIN user_branch_roles ubr ON ubr.branch_id = b.id
        WHERE ubr.user_id = (select auth.uid())
      )
    )
  )
  WITH CHECK (
    attribute_id IN (
      SELECT pa.id FROM product_attributes pa
      WHERE pa.company_id IN (
        SELECT DISTINCT b.company_id
        FROM branches b
        JOIN user_branch_roles ubr ON ubr.branch_id = b.id
        WHERE ubr.user_id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- FINISHING OPTIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view finishing options in their company" ON finishing_options;
CREATE POLICY "Users can view finishing options in their company"
  ON finishing_options FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert finishing options in their company" ON finishing_options;
CREATE POLICY "Users can insert finishing options in their company"
  ON finishing_options FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update finishing options in their company" ON finishing_options;
CREATE POLICY "Users can update finishing options in their company"
  ON finishing_options FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- MATERIALS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view materials in their company" ON materials;
CREATE POLICY "Users can view materials in their company"
  ON materials FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert materials in their company" ON materials;
CREATE POLICY "Users can insert materials in their company"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update materials in their company" ON materials;
CREATE POLICY "Users can update materials in their company"
  ON materials FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- INVENTORY LOTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view inventory lots in their branches" ON inventory_lots;
CREATE POLICY "Users can view inventory lots in their branches"
  ON inventory_lots FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert inventory lots in their branches" ON inventory_lots;
CREATE POLICY "Users can insert inventory lots in their branches"
  ON inventory_lots FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update inventory lots in their branches" ON inventory_lots;
CREATE POLICY "Users can update inventory lots in their branches"
  ON inventory_lots FOR UPDATE
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

-- =====================================================
-- INVENTORY MOVEMENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view inventory movements in their branches" ON inventory_movements;
CREATE POLICY "Users can view inventory movements in their branches"
  ON inventory_movements FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert inventory movements in their branches" ON inventory_movements;
CREATE POLICY "Users can insert inventory movements in their branches"
  ON inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- INVENTORY RESERVATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view inventory reservations in their branches" ON inventory_reservations;
CREATE POLICY "Users can view inventory reservations in their branches"
  ON inventory_reservations FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- STOCK OPNAMES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view stock opnames in their branches" ON stock_opnames;
CREATE POLICY "Users can view stock opnames in their branches"
  ON stock_opnames FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- MACHINES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view machines in their company" ON machines;
CREATE POLICY "Users can view machines in their company"
  ON machines FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert machines in their company" ON machines;
CREATE POLICY "Users can insert machines in their company"
  ON machines FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update machines in their company" ON machines;
CREATE POLICY "Users can update machines in their company"
  ON machines FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PROCESS STEPS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view process steps in their company" ON process_steps;
CREATE POLICY "Users can view process steps in their company"
  ON process_steps FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert process steps in their company" ON process_steps;
CREATE POLICY "Users can insert process steps in their company"
  ON process_steps FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update process steps in their company" ON process_steps;
CREATE POLICY "Users can update process steps in their company"
  ON process_steps FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PRICING RULES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view pricing rules in their company" ON pricing_rules;
CREATE POLICY "Users can view pricing rules in their company"
  ON pricing_rules FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert pricing rules in their company" ON pricing_rules;
CREATE POLICY "Users can insert pricing rules in their company"
  ON pricing_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update pricing rules in their company" ON pricing_rules;
CREATE POLICY "Users can update pricing rules in their company"
  ON pricing_rules FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- COST CENTERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view cost centers in their company" ON cost_centers;
CREATE POLICY "Users can view cost centers in their company"
  ON cost_centers FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- CUSTOMERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view customers in their company" ON customers;
CREATE POLICY "Users can view customers in their company"
  ON customers FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert customers in their company" ON customers;
CREATE POLICY "Users can insert customers in their company"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update customers in their company" ON customers;
CREATE POLICY "Users can update customers in their company"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = (select auth.uid())
    )
  );
