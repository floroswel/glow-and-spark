
CREATE OR REPLACE FUNCTION public.notify_gdpr_internal_note()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_type text;
  v_short_id text;
  v_type_label text;
BEGIN
  -- Only fire for internal notes (old_status = new_status AND note is not null)
  IF NEW.old_status IS DISTINCT FROM NEW.new_status OR NEW.note IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT email, request_type INTO v_email, v_type
  FROM public.gdpr_requests WHERE id = NEW.request_id;

  v_short_id := upper(left(NEW.request_id::text, 8));
  v_type_label := CASE v_type
    WHEN 'export' THEN 'Export date'
    WHEN 'delete' THEN 'Ștergere cont'
    WHEN 'rectify' THEN 'Rectificare date'
    ELSE COALESCE(v_type, '–')
  END;

  INSERT INTO public.admin_notifications (type, title, message, link)
  VALUES (
    'system',
    '📝 Notă internă GDPR [GDPR-' || v_short_id || ']',
    'Email: ' || COALESCE(v_email, '–') || E'\nTip: ' || v_type_label || E'\nNotă: ' || left(NEW.note, 300) || E'\nID: GDPR-' || v_short_id,
    '/admin/gdpr/' || NEW.request_id::text
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_gdpr_internal_note
AFTER INSERT ON public.gdpr_request_history
FOR EACH ROW
EXECUTE FUNCTION public.notify_gdpr_internal_note();
