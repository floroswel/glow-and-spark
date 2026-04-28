-- Persistent rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.rate_limits(reset_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write; nothing for anon/authenticated
CREATE POLICY "Admins can view rate_limits"
  ON public.rate_limits FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Atomic check-and-increment function (SECURITY DEFINER so service role / edge calls bypass RLS cleanly)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_reset TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  -- Cleanup expired entries opportunistically (cheap)
  DELETE FROM public.rate_limits WHERE reset_at < v_now;

  -- Upsert
  INSERT INTO public.rate_limits (key, count, reset_at)
  VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::interval)
  ON CONFLICT (key) DO UPDATE
    SET count = rate_limits.count + 1
  RETURNING rate_limits.count, rate_limits.reset_at INTO v_count, v_reset;

  RETURN QUERY SELECT (v_count <= p_limit), v_count, v_reset;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role, authenticated;