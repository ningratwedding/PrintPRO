/*
  # Add Product Images Support

  1. Schema Changes
    - Add `image_url` column to `product_templates` table to store product image URLs

  2. Storage
    - Creates storage bucket `product-images` for storing product photos
    - Sets up public access policies for product images
    - Allows authenticated users to upload images
*/

-- Add image_url column to product_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_templates' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE product_templates ADD COLUMN image_url text;
  END IF;
END $$;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access to product images" ON storage.objects;
  
  -- Allow authenticated users to upload product images
  CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

  -- Allow authenticated users to update product images
  CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

  -- Allow authenticated users to delete product images
  CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

  -- Allow public read access to product images
  CREATE POLICY "Public read access to product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');
END $$;