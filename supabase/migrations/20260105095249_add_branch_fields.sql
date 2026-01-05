/*
  # Add Additional Branch Fields

  1. Changes
    - Add `timezone` column to branches table (optional, defaults to Asia/Jakarta)
    - Add `printer_config` column to branches table (optional, for printer configuration JSON)
  
  2. Notes
    - These fields enable better branch management with timezone support and printer configuration
    - Existing branches will have null timezone (will default to Asia/Jakarta in app)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE branches ADD COLUMN timezone text DEFAULT 'Asia/Jakarta';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'printer_config'
  ) THEN
    ALTER TABLE branches ADD COLUMN printer_config text;
  END IF;
END $$;