
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
 RETURNS TABLE(allowed boolean, current_count integer, reset_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_reset TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  -- Cleanup expired entries opportunistically
  DELETE FROM public.rate_limits rl WHERE rl.reset_at < v_now;

  -- Upsert
  INSERT INTO public.rate_limits AS rl (key, count, reset_at)
  VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::interval)
  ON CONFLICT (key) DO UPDATE
    SET count = rl.count + 1
  RETURNING rl.count, rl.reset_at INTO v_count, v_reset;

  RETURN QUERY SELECT (v_count <= p_limit), v_count, v_reset;
END;
$function$;
