
-- Helper function to check if a GDPR notification should be sent
CREATE OR REPLACE FUNCTION public.gdpr_notif_allowed(p_event text, p_request_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings jsonb;
  v_channel_enabled boolean;
  v_event_enabled boolean;
  v_type_enabled boolean;
BEGIN
  SELECT value::jsonb INTO v_settings
  FROM public.site_settings WHERE key = 'gdpr_notification_settings';

  IF v_settings IS NULL THEN
    RETURN true; -- default: allow all
  END IF;

  -- Check global in_app channel
  v_channel_enabled := COALESCE((v_settings->'channels'->>'in_app')::boolean, true);
  IF NOT v_channel_enabled THEN
    RETURN false;
  END IF;

  -- Check per-event
  v_event_enabled := COALESCE((v_settings->'events'->p_event->>'in_app')::boolean, true);
  IF NOT v_event_enabled THEN
    RETURN false;
  END IF;

  -- Check per request type
  v_type_enabled := COALESCE((v_settings->'request_types'->p_request_type->>'in_app')::boolean, true);
  IF NOT v_type_enabled THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

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

  IF NOT public.gdpr_notif_allowed('new_request', NEW.request_type) THEN
    RETURN NEW;
  END IF;

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

    IF NOT public.gdpr_notif_allowed('status_change', NEW.request_type) THEN
      RETURN NEW;
    END IF;

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

-- 3. Update: GDPR internal note notification (with audit log)
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
  v_request_id uuid;
  v_note_text text;
  v_event_label text;
  v_event_type text;
  v_message text;
  v_notif_id uuid;
  v_actor_id uuid;
  v_allowed boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.old_status IS DISTINCT FROM OLD.new_status OR OLD.note IS NULL THEN
      RETURN OLD;
    END IF;
    v_request_id := OLD.request_id;
    v_note_text := OLD.note;
    v_event_label := '🗑️ Notă internă ȘTEARSĂ';
    v_event_type := 'note_deleted';
    v_actor_id := OLD.changed_by;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.note IS NOT DISTINCT FROM NEW.note THEN
      RETURN NEW;
    END IF;
    IF NEW.old_status IS DISTINCT FROM NEW.new_status THEN
      RETURN NEW;
    END IF;
    v_request_id := NEW.request_id;
    v_note_text := NEW.note;
    v_event_label := '✏️ Notă internă EDITATĂ';
    v_event_type := 'note_edited';
    v_actor_id := NEW.changed_by;
  ELSE
    IF NEW.old_status IS DISTINCT FROM NEW.new_status OR NEW.note IS NULL THEN
      RETURN NEW;
    END IF;
    v_request_id := NEW.request_id;
    v_note_text := NEW.note;
    v_event_label := '📝 Notă internă GDPR';
    v_event_type := 'note_created';
    v_actor_id := NEW.changed_by;
  END IF;

  SELECT email, request_type, user_id INTO v_email, v_type, v_req_user_id
  FROM public.gdpr_requests WHERE id = v_request_id;

  v_short_id := upper(left(v_request_id::text, 8));
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

  v_message := 'ID: GDPR-' || v_short_id
    || E'\nEmail: ' || COALESCE(v_email, '–')
    || COALESCE(E'\nUtilizator: ' || v_user_name || ' (ID: ' || v_user_short || ')', E'\nUtilizator: anonim')
    || E'\nTip: ' || v_type_label;

  IF TG_OP = 'UPDATE' THEN
    v_message := v_message
      || E'\nNotă anterioară: ' || left(COALESCE(OLD.note, '–'), 200)
      || E'\nNotă nouă: ' || left(COALESCE(v_note_text, '–'), 300);
  ELSIF TG_OP = 'DELETE' THEN
    v_message := v_message
      || E'\nNotă ștearsă: ' || left(v_note_text, 300);
  ELSE
    v_message := v_message
      || E'\nNotă: ' || left(v_note_text, 300);
  END IF;

  -- Check settings
  v_allowed := public.gdpr_notif_allowed('internal_note', COALESCE(v_type, 'export'));

  IF v_allowed THEN
    BEGIN
      INSERT INTO public.admin_notifications (type, title, message, link)
      VALUES (
        'system',
        v_event_label || ' [GDPR-' || v_short_id || ']',
        v_message,
        '/admin/gdpr/' || v_request_id::text
      )
      RETURNING id INTO v_notif_id;

      INSERT INTO public.gdpr_notification_audit (request_id, event_type, actor_id, notification_id, content, delivery_status)
      VALUES (v_request_id, v_event_type, v_actor_id, v_notif_id, v_message, 'sent');
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.gdpr_notification_audit (request_id, event_type, actor_id, notification_id, content, delivery_status)
      VALUES (v_request_id, v_event_type, v_actor_id, NULL, v_message, 'failed');
    END;
  ELSE
    -- Skipped by settings
    INSERT INTO public.gdpr_notification_audit (request_id, event_type, actor_id, notification_id, content, delivery_status)
    VALUES (v_request_id, v_event_type, v_actor_id, NULL, v_message, 'skipped');
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
