
-- Update function to handle INSERT, UPDATE, DELETE
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
  v_message text;
BEGIN
  -- Determine which record to use
  IF TG_OP = 'DELETE' THEN
    -- Only notify if it was a note (old_status = new_status and note not null)
    IF OLD.old_status IS DISTINCT FROM OLD.new_status OR OLD.note IS NULL THEN
      RETURN OLD;
    END IF;
    v_request_id := OLD.request_id;
    v_note_text := OLD.note;
    v_event_label := '🗑️ Notă internă ȘTEARSĂ';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only notify if note changed
    IF OLD.note IS NOT DISTINCT FROM NEW.note THEN
      RETURN NEW;
    END IF;
    -- Must be a note entry (old_status = new_status)
    IF NEW.old_status IS DISTINCT FROM NEW.new_status THEN
      RETURN NEW;
    END IF;
    v_request_id := NEW.request_id;
    v_note_text := NEW.note;
    v_event_label := '✏️ Notă internă EDITATĂ';
  ELSE
    -- INSERT: original behavior
    IF NEW.old_status IS DISTINCT FROM NEW.new_status OR NEW.note IS NULL THEN
      RETURN NEW;
    END IF;
    v_request_id := NEW.request_id;
    v_note_text := NEW.note;
    v_event_label := '📝 Notă internă GDPR';
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

  INSERT INTO public.admin_notifications (type, title, message, link)
  VALUES (
    'system',
    v_event_label || ' [GDPR-' || v_short_id || ']',
    v_message,
    '/admin/gdpr/' || v_request_id::text
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger for INSERT, UPDATE, DELETE
DROP TRIGGER IF EXISTS trg_notify_gdpr_internal_note ON public.gdpr_request_history;
CREATE TRIGGER trg_notify_gdpr_internal_note
  AFTER INSERT OR UPDATE OR DELETE ON public.gdpr_request_history
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_gdpr_internal_note();
