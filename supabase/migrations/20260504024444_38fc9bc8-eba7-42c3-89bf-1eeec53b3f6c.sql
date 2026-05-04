
-- Partner applications table
CREATE TABLE public.partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  city TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit partner application"
ON public.partner_applications FOR INSERT
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view partner applications"
ON public.partner_applications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update partner applications"
ON public.partner_applications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete partner applications"
ON public.partner_applications FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_partner_applications_updated_at
BEFORE UPDATE ON public.partner_applications
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Admin notification on new application
CREATE OR REPLACE FUNCTION public.notify_new_partner_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, link)
  VALUES (
    'system',
    '🤝 Cerere parteneriat: ' || NEW.name,
    'Email: ' || NEW.email || E'\nTelefon: ' || COALESCE(NEW.phone, '–') || E'\nFirmă: ' || COALESCE(NEW.company_name, '–') || E'\nOraș: ' || COALESCE(NEW.city, '–'),
    '/admin/partners'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_partner_application
AFTER INSERT ON public.partner_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_new_partner_application();

-- Site setting for toggle
INSERT INTO public.site_settings (key, value) VALUES ('partner_page_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
