
-- 1. Update: new GDPR request notification
CREATE OR REPLACE FUNCTION public.notify_gdpr_new_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_short_id text;
  v_type_label text;
  v_user_name text;
  v_user_short text;
BEGIN
  v_short_id := upper(left(NEW.id::text, 8));
  v_type_label := CASE NEW.request_type
    WHEN 'export' THEN 'Export date'
    WHEN 'delete' THEN 'Ștergere cont'
    WHEN 'rectify' THEN 'Rectificare date'
    ELSE NEW.request_type
  END;

  IF NEW.user_id IS NOT NULL THEN
    SELECT full_name INTO v_user_name FROM public.profiles WHERE user_id = NEW.user_id;
    v_user_short := upper(left(NEW.user_id::text, 8));
  END IF;

  INSERT INTO public.admin_notifications (type, title, message, link)
  VALUES (
    'system',
    '🆕 Cerere GDPR: ' || v_type_label || ' [GDPR-' || v_short_id || ']',
    'ID: GDPR-' || v_short_id
      || E'\nEmail: ' || NEW.email
      || COALESCE(E'\nUtilizator: ' || v_user_name || ' (ID: ' || v_user_short || ')', E'\nUtilizator: anonim')
      || E'\nTip: ' || v_type_label
      || COALESCE(E'\nDetalii: ' || left(NEW.details, 200), ''),
    '/admin/gdpr/' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

-- 2. Update: GDPR status change notification
CREATE OR REPLACE FUNCTION public.notify_gdpr_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_short_id text;
  v_type_label text;
  v_status_label text;
  v_user_name text;
  v_user_short text;
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

    IF NEW.user_id IS NOT NULL THEN
      SELECT full_name INTO v_user_name FROM public.profiles WHERE user_id = NEW.user_id;
      v_user_short := upper(left(NEW.user_id::text, 8));
    END IF;

    INSERT INTO public.admin_notifications (type, title, message, link)
    VALUES (
      'system',
      'GDPR ' || v_type_label || ': ' || v_status_label || ' [GDPR-' || v_short_id || ']',
      'ID: GDPR-' || v_short_id
        || E'\nEmail: ' || NEW.email
        || COALESCE(E'\nUtilizator: ' || v_user_name || ' (ID: ' || v_user_short || ')', E'\nUtilizator: anonim')
        || E'\nTip: ' || v_type_label
        || E'\nStatus: ' || COALESCE(OLD.status, '–') || ' → ' || NEW.status,
      '/admin/gdpr/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Update: GDPR internal note notification
CREATE OR REPLACE FUNCTION public.notify_gdpr_internal_note()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_type text;
  v_req_user_id uuid;
  v_short_id text;
  v_type_label text;
  v_user_name text;
  v_user_short text;
BEGIN
  IF NEW.old_status IS DISTINCT FROM NEW.new_status OR NEW.note IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT email, request_type, user_id INTO v_email, v_type, v_req_user_id
  FROM public.gdpr_requests WHERE id = NEW.request_id;

  v_short_id := upper(left(NEW.request_id::text, 8));
  v_type_label := CASE v_type
    WHEN 'export' THEN 'Export date'
    WHEN 'delete' THEN 'Ștergere cont'
    WHEN 'rectify' THEN 'Rectificare date'
    ELSE COALESCE(v_type, '–')
  END;

  IF v_req_user_id IS NOT NULL THEN
    SELECT full_name INTO v_user_name FROM public.profiles WHERE user_id = v_req_user_id;
    v_user_short := upper(left(v_req_user_id::text, 8));
  END IF;

  INSERT INTO public.admin_notifications (type, title, message, link)
  VALUES (
    'system',
    '📝 Notă internă GDPR [GDPR-' || v_short_id || ']',
    'ID: GDPR-' || v_short_id
      || E'\nEmail: ' || COALESCE(v_email, '–')
      || COALESCE(E'\nUtilizator: ' || v_user_name || ' (ID: ' || v_user_short || ')', E'\nUtilizator: anonim')
      || E'\nTip: ' || v_type_label
      || E'\nNotă: ' || left(NEW.note, 300),
    '/admin/gdpr/' || NEW.request_id::text
  );

  RETURN NEW;
END;
$$;
