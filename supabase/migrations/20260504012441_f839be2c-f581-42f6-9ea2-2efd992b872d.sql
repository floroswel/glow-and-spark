INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-documents',
  'company-documents',
  true,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for company documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-documents');

CREATE POLICY "Authenticated users can upload company documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-documents');

CREATE POLICY "Authenticated users can update company documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-documents');

CREATE POLICY "Authenticated users can delete company documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-documents');