/*
  # Add Users Metadata Table

  ## Changes
  
  1. Create users_metadata table
     - Stores user email and display information
     - Linked to auth.users via user_id
  
  2. Security
     - Enable RLS
     - Add policies for viewing user metadata in same company

  ## Notes
  - This table stores user information that needs to be queried from client
  - Email is stored here since auth.admin is not accessible from client
*/

-- =====================================================
-- Users Metadata Table
-- =====================================================

CREATE TABLE IF NOT EXISTS users_metadata (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_metadata_user_id ON users_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_users_metadata_email ON users_metadata(email);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE users_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metadata for users in their company"
  ON users_metadata FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT DISTINCT ubr.user_id
      FROM user_branch_roles ubr
      WHERE ubr.branch_id IN (
        SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own metadata"
  ON users_metadata FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own metadata"
  ON users_metadata FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
