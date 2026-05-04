
-- Audit log table
CREATE TABLE public.gdpr_notification_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.gdpr_requests(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  actor_id uuid,
  notification_id uuid REFERENCES public.admin_notifications(id) ON DELETE SET NULL,
  content text,
  delivery_status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gdpr_notification_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gdpr_notification_audit"
  ON public.gdpr_notification_audit
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_gdpr_notif_audit_request ON public.gdpr_notification_audit(request_id);
CREATE INDEX idx_gdpr_notif_audit_created ON public.gdpr_notification_audit(created_at DESC);

-- Update internal note trigger to also write audit log
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
BEGIN
  -- Determine which record to use
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

  BEGIN
    INSERT INTO public.admin_notifications (type, title, message, link)
    VALUES (
      'system',
      v_event_label || ' [GDPR-' || v_short_id || ']',
      v_message,
      '/admin/gdpr/' || v_request_id::text
    )
    RETURNING id INTO v_notif_id;

    -- Write audit log
    INSERT INTO public.gdpr_notification_audit (request_id, event_type, actor_id, notification_id, content, delivery_status)
    VALUES (v_request_id, v_event_type, v_actor_id, v_notif_id, v_message, 'sent');
  EXCEPTION WHEN OTHERS THEN
    -- Notification failed — log as failed
    INSERT INTO public.gdpr_notification_audit (request_id, event_type, actor_id, notification_id, content, delivery_status)
    VALUES (v_request_id, v_event_type, v_actor_id, NULL, v_message, 'failed');
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
