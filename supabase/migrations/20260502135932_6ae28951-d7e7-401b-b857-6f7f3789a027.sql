
-- Vendor DPA inventory
CREATE TABLE public.compliance_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL DEFAULT 'other',
  privacy_url TEXT,
  dpa_signed BOOLEAN NOT NULL DEFAULT false,
  dpa_notes TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage compliance_vendors"
  ON public.compliance_vendors FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_compliance_vendors_updated_at
  BEFORE UPDATE ON public.compliance_vendors
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
