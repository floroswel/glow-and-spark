
-- Add photo_urls column to product_reviews
ALTER TABLE public.product_reviews
ADD COLUMN photo_urls text[] DEFAULT '{}';

-- Create review-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true);

-- Public read access
CREATE POLICY "Public read review photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-photos');

-- Authenticated users can upload review photos
CREATE POLICY "Authenticated users upload review photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-photos');
