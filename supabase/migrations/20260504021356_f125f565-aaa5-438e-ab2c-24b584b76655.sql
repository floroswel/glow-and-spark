CREATE OR REPLACE FUNCTION public.notify_new_gdpr_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_short_id text;
  v_type_label text;
BEGIN
  v_short_id := upper(left(NEW.id::text, 8));
  v_type_label := CASE NEW.request_type
    WHEN 'export' THEN 'Export date'
    WHEN 'delete' THEN 'Ștergere cont'
    WHEN 'rectify' THEN 'Rectificare date'
    ELSE NEW.request_type
  END;

  INSERT INTO public.admin_notifications (type, title, message, link)
  VALUES (
    'system',
    '🆕 Cerere GDPR: ' || v_type_label || ' [GDPR-' || v_short_id || ']',
    'Email: ' || NEW.email || E'\nTip: ' || v_type_label || E'\nID: GDPR-' || v_short_id || COALESCE(E'\nDetalii: ' || left(NEW.details, 200), ''),
    '/admin/gdpr'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_gdpr_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_short_id text;
  v_type_label text;
  v_status_label text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_short_id := upper(left(NEW.id::text, 8));
    v_type_label := CASE NEW.request_type
      WHEN 'export' THEN 'Export date'
      WHEN 'delete' THEN 'Ștergere cont'
      WHEN 'rectify' THEN 'Rectificare date'
      ELSE NEW.request_type
    END;
    v_status_label := CASE NEW.status
      WHEN 'pending' THEN 'revenită la pending'
      WHEN 'processing' THEN 'în procesare'
      WHEN 'completed' THEN 'finalizată ✓'
      WHEN 'rejected' THEN 'respinsă ✗'
      ELSE NEW.status
    END;

    INSERT INTO public.admin_notifications (type, title, message, link)
    VALUES (
      'system',
      'GDPR ' || v_type_label || ': ' || v_status_label || ' [GDPR-' || v_short_id || ']',
      'Email: ' || NEW.email || E'\nTip: ' || v_type_label || E'\nStatus: ' || COALESCE(OLD.status, '–') || ' → ' || NEW.status || E'\nID: GDPR-' || v_short_id,
      '/admin/gdpr'
    );
  END IF;
  RETURN NEW;
END;
$$;