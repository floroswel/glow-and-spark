CREATE OR REPLACE FUNCTION public.notify_new_gdpr_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, link)
  VALUES (
    'system',
    'Cerere GDPR: ' || CASE NEW.request_type
      WHEN 'export' THEN 'Export date'
      WHEN 'delete' THEN 'Ștergere cont'
      WHEN 'rectify' THEN 'Rectificare date'
      ELSE NEW.request_type
    END,
    'De la ' || NEW.email,
    '/admin/gdpr'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gdpr_admin_notify
  AFTER INSERT ON public.gdpr_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_gdpr_request();