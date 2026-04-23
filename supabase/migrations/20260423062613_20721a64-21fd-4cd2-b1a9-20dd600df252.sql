INSERT INTO storage.buckets (id, name, public) VALUES ('company-documents', 'company-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read company docs" ON storage.objects FOR SELECT USING (bucket_id = 'company-documents');
CREATE POLICY "Admins upload company docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update company docs" ON storage.objects FOR UPDATE USING (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete company docs" ON storage.objects FOR DELETE USING (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'));