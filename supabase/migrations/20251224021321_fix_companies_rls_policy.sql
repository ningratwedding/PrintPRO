/*
  # Fix Companies RLS Policy for Initial Setup

  ## Problem
  User getting "new row violates row-level security policy" when trying to create company.
  There are duplicate INSERT policies that might be causing issues.

  ## Solution
  1. Drop existing INSERT policies
  2. Create a single, clear INSERT policy for authenticated users
  3. Ensure the policy allows any authenticated user to insert

  ## Security
  - Policy is permissive for INSERT to allow initial setup
  - Users can only view/update companies they belong to (existing policies)
*/

-- Drop duplicate INSERT policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to create companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can create their first company" ON companies;

-- Create a single, clear INSERT policy
CREATE POLICY "Authenticated users can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
