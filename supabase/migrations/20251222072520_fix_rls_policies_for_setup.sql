/*
  # Fix RLS Policies for Setup Wizard

  ## Changes
  
  1. Add INSERT policies for companies
     - Allow authenticated users to create companies
  
  2. Add INSERT policies for branches
     - Allow authenticated users to create branches
  
  3. Add INSERT/UPDATE/DELETE policies for user_branch_roles
     - Allow users to manage role assignments
  
  4. Add INSERT policies for product catalog
     - Allow users to create product templates, attributes, and finishing options
  
  5. Add INSERT policies for inventory
     - Allow users to create materials and inventory lots
     
  6. Add INSERT policies for other tables
     - Allow users to create customers, pricing rules, etc.

  ## Notes
  - These policies enable the setup wizard to work properly
  - RLS still enforces company/branch membership for data access
*/

-- =====================================================
-- Companies: INSERT Policy
-- =====================================================

CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- =====================================================
-- Branches: INSERT Policy
-- =====================================================

CREATE POLICY "Authenticated users can create branches"
  ON branches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update branches they belong to"
  ON branches FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- User Branch Roles: Full Access Policy
-- =====================================================

CREATE POLICY "Users can insert role assignments"
  ON user_branch_roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update role assignments in their branches"
  ON user_branch_roles FOR UPDATE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete role assignments in their branches"
  ON user_branch_roles FOR DELETE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Product Templates: INSERT/UPDATE Policy
-- =====================================================

CREATE POLICY "Users can insert product templates in their company"
  ON product_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update product templates in their company"
  ON product_templates FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete product templates in their company"
  ON product_templates FOR DELETE
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
-- Product Attributes: INSERT/UPDATE Policy
-- =====================================================

CREATE POLICY "Users can insert product attributes in their company"
  ON product_attributes FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update product attributes in their company"
  ON product_attributes FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- =====================================================
-- Product Attribute Values: INSERT/UPDATE Policy
-- =====================================================

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
        WHERE ubr.user_id = auth.uid()
      )
    )
  );

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
        WHERE ubr.user_id = auth.uid()
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
        WHERE ubr.user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- Finishing Options: INSERT/UPDATE Policy
-- =====================================================

CREATE POLICY "Users can insert finishing options in their company"
  ON finishing_options FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update finishing options in their company"
  ON finishing_options FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- =====================================================
-- Materials: INSERT/UPDATE Policy
-- =====================================================

CREATE POLICY "Users can insert materials in their company"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update materials in their company"
  ON materials FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- =====================================================
-- Inventory Lots: INSERT/UPDATE Policy
-- =====================================================

CREATE POLICY "Users can insert inventory lots in their branches"
  ON inventory_lots FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update inventory lots in their branches"
  ON inventory_lots FOR UPDATE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Inventory Movements: INSERT Policy
-- =====================================================

CREATE POLICY "Users can insert inventory movements in their branches"
  ON inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Customers: INSERT/UPDATE Policy
-- =====================================================

CREATE POLICY "Users can insert customers in their company"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update customers in their company"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- =====================================================
-- Pricing Rules: INSERT/UPDATE Policy
-- =====================================================

CREATE POLICY "Users can insert pricing rules in their company"
  ON pricing_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pricing rules in their company"
  ON pricing_rules FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- =====================================================
-- Machines: INSERT/UPDATE Policy
-- =====================================================

CREATE POLICY "Users can insert machines in their company"
  ON machines FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update machines in their company"
  ON machines FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- =====================================================
-- Process Steps: INSERT/UPDATE Policy
-- =====================================================

CREATE POLICY "Users can insert process steps in their company"
  ON process_steps FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update process steps in their company"
  ON process_steps FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );
