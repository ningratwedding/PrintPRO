/*
  # Fix Users RLS Policy for Initial Setup

  ## Problem
  During initial setup, new users cannot insert themselves into the users table
  because the existing policy only allows Owners/Admins to insert users.
  This creates a chicken-and-egg problem for the first user.

  ## Solution
  Add a policy that allows authenticated users to insert their own user record
  (where id = auth.uid()) during initial setup.

  ## Security
  - Users can only insert their own record (id must match auth.uid())
  - Existing policy still controls adding other users
  - Safe for initial setup flow
*/

-- Allow authenticated users to insert their own user record
CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));
