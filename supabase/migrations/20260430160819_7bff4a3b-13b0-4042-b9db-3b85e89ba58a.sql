-- Helper: dispatch webhook prin pg_net către edge function
CREATE OR REPLACE FUNCTION public.dispatch_webhook_event(p_event text, p_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url text;
  v_anon text;
BEGIN
  -- URL edge function dispatch-webhook
  v_url := 'https://bdaruamlzueuojivflud.supabase.co/functions/v1/dispatch-webhook';
  v_anon := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkYXJ1YW1senVldW9qaXZmbHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjE2ODUsImV4cCI6MjA5MjI5NzY4NX0.zXKwmThhpl9G3Tb2XsJ9F58aB39YT5UnCkxsGWK29_A';

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
  -- swallow errors to nu blocăm tranzacția principală
  NULL;
END;
$$;

-- Trigger pentru orders
CREATE OR REPLACE FUNCTION public.trg_orders_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'order.created';
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_event := CASE NEW.status
      WHEN 'shipped' THEN 'order.shipped'
      WHEN 'cancelled' THEN 'order.cancelled'
      WHEN 'completed' THEN 'order.paid'
      ELSE NULL
    END;
  ELSIF TG_OP = 'UPDATE' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status AND NEW.payment_status = 'paid' THEN
    v_event := 'order.paid';
  END IF;

  IF v_event IS NULL THEN RETURN NEW; END IF;

  v_payload := jsonb_build_object(
    'order_id', NEW.id,
    'order_number', NEW.order_number,
    'status', NEW.status,
    'payment_status', NEW.payment_status,
    'total', NEW.total,
    'customer_email', NEW.customer_email,
    'customer_name', NEW.customer_name
  );

  PERFORM public.dispatch_webhook_event(v_event, v_payload);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_webhook_dispatch ON public.orders;
CREATE TRIGGER orders_webhook_dispatch
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trg_orders_webhook();

-- Trigger pentru products (update preț/stoc/activare)
CREATE OR REPLACE FUNCTION public.trg_products_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    OLD.price IS DISTINCT FROM NEW.price
    OR OLD.stock IS DISTINCT FROM NEW.stock
    OR OLD.is_active IS DISTINCT FROM NEW.is_active
  ) THEN
    PERFORM public.dispatch_webhook_event('product.updated', jsonb_build_object(
      'product_id', NEW.id,
      'name', NEW.name,
      'price', NEW.price,
      'stock', NEW.stock,
      'is_active', NEW.is_active
    ));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_webhook_dispatch ON public.products;
CREATE TRIGGER products_webhook_dispatch
AFTER UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.trg_products_webhook();

-- Procesor back-in-stock: marchează notificările trimise
CREATE OR REPLACE FUNCTION public.process_back_in_stock_notifications()
RETURNS TABLE(notified int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
BEGIN
  WITH to_notify AS (
    SELECT sn.id, sn.email, sn.product_id, p.name AS product_name
    FROM public.stock_notifications sn
    JOIN public.products p ON p.id = sn.product_id
    WHERE sn.notified_at IS NULL
      AND p.stock > 0
      AND p.is_active = true
    LIMIT 100
  ),
  upd AS (
    UPDATE public.stock_notifications sn
    SET notified_at = now()
    WHERE sn.id IN (SELECT id FROM to_notify)
    RETURNING sn.id
  )
  SELECT count(*) INTO v_count FROM upd;

  IF v_count > 0 THEN
    INSERT INTO public.admin_notifications (type, title, message, link)
    VALUES ('stock', 'Back-in-stock procesat', v_count || ' clienți marcați pentru notificare', '/admin/back-in-stock');
  END IF;

  RETURN QUERY SELECT v_count;
END;
$$;

-- Procesor price alerts
CREATE OR REPLACE FUNCTION public.process_price_alerts()
RETURNS TABLE(notified int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
BEGIN
  WITH to_notify AS (
    SELECT pa.id
    FROM public.price_alerts pa
    JOIN public.products p ON p.id = pa.product_id
    WHERE pa.notified_at IS NULL
      AND p.is_active = true
      AND p.price <= pa.target_price
    LIMIT 100
  ),
  upd AS (
    UPDATE public.price_alerts pa
    SET notified_at = now()
    WHERE pa.id IN (SELECT id FROM to_notify)
    RETURNING pa.id
  )
  SELECT count(*) INTO v_count FROM upd;

  RETURN QUERY SELECT v_count;
END;
$$;

-- Cron la fiecare 10 minute pentru ambele
SELECT cron.unschedule('process-back-in-stock') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-back-in-stock');
SELECT cron.unschedule('process-price-alerts') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-price-alerts');

SELECT cron.schedule(
  'process-back-in-stock',
  '*/10 * * * *',
  $$ SELECT public.process_back_in_stock_notifications(); $$
);

SELECT cron.schedule(
  'process-price-alerts',
  '*/10 * * * *',
  $$ SELECT public.process_price_alerts(); $$
);