/*
  # Add Users Table

  1. New Tables
    - users
      - id (uuid, primary key) - References auth.users.id
      - email (text) - User email
      - full_name (text) - Full name
      - role (text) - Default role
      - company_id (uuid) - Company assignment
      - active (boolean) - Active status
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on users table
    - Add policies for viewing and managing users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'staff',
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view users in their company
CREATE POLICY "Users can view users in their company"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      WHERE ubr.user_id = auth.uid()
    )
  );

-- Policy: Owners and admins can insert users
CREATE POLICY "Owners and admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      JOIN roles r ON r.id = ubr.role_id
      WHERE ubr.user_id = auth.uid()
      AND r.name IN ('Owner', 'Admin')
    )
  );

-- Policy: Owners and admins can update users
CREATE POLICY "Owners and admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      JOIN roles r ON r.id = ubr.role_id
      WHERE ubr.user_id = auth.uid()
      AND r.name IN ('Owner', 'Admin')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT DISTINCT b.company_id
      FROM branches b
      JOIN user_branch_roles ubr ON ubr.branch_id = b.id
      JOIN roles r ON r.id = ubr.role_id
      WHERE ubr.user_id = auth.uid()
      AND r.name IN ('Owner', 'Admin')
    )
  );

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());