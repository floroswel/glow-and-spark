
CREATE OR REPLACE FUNCTION public.notify_new_gdpr_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'ID: GDPR-' || v_short_id || E'\nEmail: ' || NEW.email || E'\nTip: ' || v_type_label || COALESCE(E'\nDetalii: ' || left(NEW.details, 200), ''),
    '/admin/gdpr/' || NEW.id::text
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_gdpr_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      'ID: GDPR-' || v_short_id || E'\nEmail: ' || NEW.email || E'\nTip: ' || v_type_label || E'\nStatus: ' || COALESCE(OLD.status, '–') || ' → ' || NEW.status,
      '/admin/gdpr/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_gdpr_internal_note()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_type text;
  v_short_id text;
  v_type_label text;
BEGIN
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
    'ID: GDPR-' || v_short_id || E'\nEmail: ' || COALESCE(v_email, '–') || E'\nTip: ' || v_type_label || E'\nNotă: ' || left(NEW.note, 300),
    '/admin/gdpr/' || NEW.request_id::text
  );

  RETURN NEW;
END;
$function$;
