
-- Health check results table
CREATE TABLE public.health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'degraded', 'down')),
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_health_checks_name_time ON public.health_checks (check_name, checked_at DESC);

-- Cleanup old entries (keep 7 days)
CREATE INDEX idx_health_checks_checked_at ON public.health_checks (checked_at);

-- Health incidents table for tracking outages
CREATE TABLE public.health_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  error_message TEXT,
  notified BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_health_incidents_open ON public.health_incidents (check_name, status) WHERE status = 'open';

-- RLS: admin read, service role write
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view health checks"
  ON public.health_checks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can view health incidents"
  ON public.health_incidents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to record health check and create/resolve incidents + alert
CREATE OR REPLACE FUNCTION public.record_health_check(
  p_name TEXT, p_status TEXT, p_response_ms INTEGER DEFAULT NULL, p_error TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_incident_id UUID;
BEGIN
  -- Record the check
  INSERT INTO public.health_checks (check_name, status, response_time_ms, error_message)
  VALUES (p_name, p_status, p_response_ms, p_error);

  IF p_status IN ('degraded', 'down') THEN
    -- Check if there's already an open incident
    SELECT id INTO v_incident_id FROM public.health_incidents
    WHERE check_name = p_name AND status = 'open' LIMIT 1;

    IF v_incident_id IS NULL THEN
      -- New incident: create and alert
      INSERT INTO public.health_incidents (check_name, error_message, notified)
      VALUES (p_name, p_error, true)
      RETURNING id INTO v_incident_id;

      -- Create admin notification
      INSERT INTO public.admin_notifications (type, title, message, link)
      VALUES (
        'system',
        '⚠️ Incident: ' || p_name || ' — ' || upper(p_status),
        COALESCE(p_error, 'Verificare eșuată'),
        '/admin/monitoring'
      );
    END IF;
  ELSE
    -- Resolve open incidents for this check
    UPDATE public.health_incidents
    SET status = 'resolved', resolved_at = now()
    WHERE check_name = p_name AND status = 'open';
  END IF;

  -- Cleanup old check records (keep 7 days)
  DELETE FROM public.health_checks WHERE checked_at < now() - INTERVAL '7 days';
END;
$$;

-- pg_cron job: call health endpoint every 5 minutes
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'health-check-monitor',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mamalucica-ro.lovable.app/api/public/health',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"run_checks": true}'::jsonb
  ) as request_id;
  $$
);
