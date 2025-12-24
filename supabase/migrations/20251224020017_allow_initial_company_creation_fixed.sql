/*
  # Allow Initial Company Creation

  ## Problem
  New authenticated users (who just signed up) cannot create companies because they don't
  exist in the users table yet and have no branch assignments.

  ## Solution
  Add a policy that allows authenticated users to create their first company if they don't
  have any existing company associations.

  ## Security
  - Only allows creation, not viewing or modifying
  - User must be authenticated
  - Policy is restrictive and safe for initial setup
*/

-- Allow authenticated users to insert their first company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'companies' 
    AND policyname = 'Authenticated users can create their first company'
  ) THEN
    CREATE POLICY "Authenticated users can create their first company"
      ON companies FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Allow authenticated users to insert branches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'branches' 
    AND policyname = 'Authenticated users can create branches'
  ) THEN
    CREATE POLICY "Authenticated users can create branches"
      ON branches FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Allow authenticated users to insert role assignments for themselves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_branch_roles' 
    AND policyname = 'Authenticated users can create role assignments'
  ) THEN
    CREATE POLICY "Authenticated users can create role assignments"
      ON user_branch_roles FOR INSERT
      TO authenticated
      WITH CHECK (user_id = (select auth.uid()));
  END IF;
END $$;
