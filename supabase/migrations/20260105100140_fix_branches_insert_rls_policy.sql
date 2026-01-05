/*
  # Fix Branches INSERT RLS Policy

  ## Problem
  Current INSERT policy uses `WITH CHECK (true)` which:
  1. Is too permissive (allows inserting branches for ANY company)
  2. Creates a conflict where user can INSERT but cannot SELECT the new branch
  3. Causes RLS violation when trying to return inserted row via `.select()`

  ## Solution
  Restrict INSERT policy to only allow users to create branches for companies they already belong to.
  This ensures:
  - Users can only create branches within their own company
  - After INSERT, they can immediately SELECT the branch (since they have user_branch_roles)
  - Maintains security by checking company membership

  ## Security
  - Users can only create branches for companies where they have existing branch access
  - Prevents users from creating branches in other companies
  - Maintains referential integrity with user_branch_roles
*/

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create branches" ON branches;

-- Create a secure INSERT policy that checks company membership
CREATE POLICY "Users can create branches in their company"
  ON branches FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id 
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- Verify RLS is enabled
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
