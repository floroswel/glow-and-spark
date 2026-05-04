CREATE TABLE public.gdpr_request_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.gdpr_requests(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gdpr_request_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gdpr_request_history"
  ON public.gdpr_request_history FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-log every status change
CREATE OR REPLACE FUNCTION public.log_gdpr_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.gdpr_request_history (request_id, old_status, new_status)
    VALUES (NEW.id, NULL, NEW.status);
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.gdpr_request_history (request_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gdpr_history
  AFTER INSERT OR UPDATE ON public.gdpr_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_gdpr_status_history();