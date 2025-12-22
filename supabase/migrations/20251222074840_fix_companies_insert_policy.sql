/*
  # Fix Companies INSERT Policy for Setup Wizard

  ## Problem
  New users cannot create companies during setup because of missing or incorrect INSERT policy.

  ## Changes
  1. Drop existing INSERT policy if it exists
  2. Create new INSERT policy that allows authenticated users to create companies
  3. Ensure the policy is properly applied

  ## Security
  - Only authenticated users can create companies
  - Users can still only view/update companies they belong to via existing SELECT/UPDATE policies
*/

-- Drop existing policy if it exists (using DO block to avoid error if it doesn't exist)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create INSERT policy for companies
CREATE POLICY "Allow authenticated users to create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);
