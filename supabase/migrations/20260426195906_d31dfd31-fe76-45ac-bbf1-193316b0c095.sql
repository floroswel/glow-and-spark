-- Enable required extensions for scheduled jobs.
-- pg_cron: schedules SQL/HTTP jobs inside Postgres.
-- pg_net: allows Postgres to make HTTP calls to edge functions.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule existing jobs (idempotent re-run safety)
DO $$
BEGIN
  PERFORM cron.unschedule('cart-recovery-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('stock-alerts-6h');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Cart recovery: every hour at minute 0
SELECT cron.schedule(
  'cart-recovery-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bdaruamlzueuojivflud.supabase.co/functions/v1/cart-recovery',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkYXJ1YW1senVldW9qaXZmbHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjE2ODUsImV4cCI6MjA5MjI5NzY4NX0.zXKwmThhpl9G3Tb2XsJ9F58aB39YT5UnCkxsGWK29_A'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Stock alerts: every 6 hours
SELECT cron.schedule(
  'stock-alerts-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bdaruamlzueuojivflud.supabase.co/functions/v1/stock-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkYXJ1YW1senVldW9qaXZmbHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjE2ODUsImV4cCI6MjA5MjI5NzY4NX0.zXKwmThhpl9G3Tb2XsJ9F58aB39YT5UnCkxsGWK29_A'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);