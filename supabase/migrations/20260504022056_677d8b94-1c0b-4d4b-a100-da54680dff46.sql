
ALTER TABLE public.gdpr_requests ADD COLUMN admin_notes TEXT;

-- Allow admins to update gdpr_requests
CREATE POLICY "Admins can update GDPR requests"
  ON public.gdpr_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
