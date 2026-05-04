
-- Table for GDPR request documents
CREATE TABLE public.gdpr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.gdpr_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gdpr_documents ENABLE ROW LEVEL SECURITY;

-- Users can view documents on their own GDPR requests
CREATE POLICY "Users can view own GDPR documents"
  ON public.gdpr_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gdpr_requests gr
      WHERE gr.id = request_id AND gr.user_id = auth.uid()
    )
  );

-- Users can upload documents to their own GDPR requests
CREATE POLICY "Users can insert own GDPR documents"
  ON public.gdpr_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.gdpr_requests gr
      WHERE gr.id = request_id AND gr.user_id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all GDPR documents"
  ON public.gdpr_documents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert
CREATE POLICY "Admins can insert GDPR documents"
  ON public.gdpr_documents FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete
CREATE POLICY "Admins can delete GDPR documents"
  ON public.gdpr_documents FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for GDPR documents
INSERT INTO storage.buckets (id, name, public) VALUES ('gdpr-documents', 'gdpr-documents', false);

-- Storage policies
CREATE POLICY "Users upload own GDPR docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gdpr-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own GDPR docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'gdpr-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins access all GDPR docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'gdpr-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload GDPR docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gdpr-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete GDPR docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'gdpr-documents' AND public.has_role(auth.uid(), 'admin'));
