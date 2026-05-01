CREATE OR REPLACE FUNCTION public.dispatch_webhook_event(p_event text, p_payload jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_url text;
  v_anon text;
BEGIN
  v_url := 'https://bdaruamlzueuojivflud.supabase.co/functions/v1/dispatch-webhook';
  
  -- Read anon key from vault instead of hardcoding
  SELECT decrypted_secret INTO v_anon
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_ANON_KEY'
  LIMIT 1;
  
  IF v_anon IS NULL THEN
    RAISE WARNING 'dispatch_webhook_event: SUPABASE_ANON_KEY not found in vault';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon,
      'apikey', v_anon
    ),
    body := jsonb_build_object('event_type', p_event, 'payload', p_payload)
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$function$;