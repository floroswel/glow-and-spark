
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Allow authenticated admins to upload
CREATE POLICY "Admins upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update/delete
CREATE POLICY "Admins manage product images"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Public read
CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images');
