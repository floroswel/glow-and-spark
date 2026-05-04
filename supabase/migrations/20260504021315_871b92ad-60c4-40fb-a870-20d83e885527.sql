CREATE OR REPLACE FUNCTION public.notify_gdpr_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.admin_notifications (type, title, message, link)
    VALUES (
      'system',
      'GDPR ' || CASE NEW.request_type
        WHEN 'export' THEN 'Export date'
        WHEN 'delete' THEN 'Ștergere cont'
        WHEN 'rectify' THEN 'Rectificare'
        ELSE NEW.request_type
      END || ': ' || CASE NEW.status
        WHEN 'pending' THEN 'revenită la pending'
        WHEN 'processing' THEN 'în procesare'
        WHEN 'completed' THEN 'finalizată'
        WHEN 'rejected' THEN 'respinsă'
        ELSE NEW.status
      END,
      'De la ' || NEW.email || ' (anterior: ' || COALESCE(OLD.status, 'necunoscut') || ')',
      '/admin/gdpr'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gdpr_status_change
  AFTER UPDATE ON public.gdpr_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_gdpr_status_change();