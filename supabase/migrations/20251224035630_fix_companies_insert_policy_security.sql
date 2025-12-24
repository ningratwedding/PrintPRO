/*
  # Fix Companies INSERT Policy Security
  
  ## Problem
  Current INSERT policy allows ANY authenticated user to create companies without restrictions.
  This is a security risk after initial setup is complete.
  
  ## Solution
  Restrict INSERT policy to only allow users who don't have any company yet (initial setup).
  This prevents users from creating multiple companies without proper authorization.
  
  ## Security
  - Users can only create a company if they don't belong to any company yet
  - After setup, users cannot create additional companies
  - Existing SELECT and UPDATE policies remain secure
*/

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON companies;

-- Create a restrictive INSERT policy for initial setup only
CREATE POLICY "Users can create first company during setup"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM users WHERE id = (select auth.uid())
    )
  );

-- Verify RLS is enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;