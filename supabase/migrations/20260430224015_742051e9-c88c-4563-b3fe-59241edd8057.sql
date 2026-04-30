
-- 1. EMAIL OUTBOX
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_outbox_pending ON public.email_outbox(status, scheduled_for) WHERE status = 'pending';
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin manages email_outbox" ON public.email_outbox;
CREATE POLICY "Admin manages email_outbox" ON public.email_outbox FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. PROCESSORS - put în outbox
CREATE OR REPLACE FUNCTION public.process_back_in_stock_notifications()
RETURNS TABLE(notified integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count int := 0;
BEGIN
  WITH to_notify AS (
    SELECT sn.id, sn.email, sn.product_id, p.name AS product_name, p.slug, p.price
    FROM public.stock_notifications sn
    JOIN public.products p ON p.id = sn.product_id
    WHERE sn.notified_at IS NULL AND p.stock > 0 AND p.is_active = true
    LIMIT 100
  ),
  ins AS (
    INSERT INTO public.email_outbox (to_email, template, payload)
    SELECT email, 'back_in_stock', jsonb_build_object('product_name', product_name, 'slug', slug, 'price', price)
    FROM to_notify RETURNING 1
  ),
  upd AS (
    UPDATE public.stock_notifications sn SET notified_at = now()
    WHERE sn.id IN (SELECT id FROM to_notify) RETURNING 1
  )
  SELECT count(*) INTO v_count FROM upd;
  RETURN QUERY SELECT v_count;
END; $$;

CREATE OR REPLACE FUNCTION public.process_price_alerts()
RETURNS TABLE(notified integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count int := 0;
BEGIN
  WITH to_notify AS (
    SELECT pa.id, pa.email, pa.target_price, p.name AS product_name, p.slug, p.price
    FROM public.price_alerts pa
    JOIN public.products p ON p.id = pa.product_id
    WHERE pa.notified_at IS NULL AND p.is_active = true AND p.price <= pa.target_price
    LIMIT 100
  ),
  ins AS (
    INSERT INTO public.email_outbox (to_email, template, payload)
    SELECT email, 'price_alert', jsonb_build_object('product_name', product_name, 'slug', slug, 'price', price, 'target_price', target_price)
    FROM to_notify RETURNING 1
  ),
  upd AS (
    UPDATE public.price_alerts pa SET notified_at = now()
    WHERE pa.id IN (SELECT id FROM to_notify) RETURNING 1
  )
  SELECT count(*) INTO v_count FROM upd;
  RETURN QUERY SELECT v_count;
END; $$;

-- 3. AFFILIATE attribution
CREATE OR REPLACE FUNCTION public.attribute_affiliate_conversion(p_order_id UUID, p_ref_code TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_aff RECORD; v_order RECORD; v_commission NUMERIC;
BEGIN
  IF p_ref_code IS NULL OR length(p_ref_code) = 0 THEN RETURN; END IF;
  SELECT * INTO v_aff FROM public.affiliates WHERE code = p_ref_code AND status = 'active';
  IF NOT FOUND THEN RETURN; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN; END IF;
  v_commission := ROUND((COALESCE(v_order.total,0) * COALESCE(v_aff.commission_percent, 10) / 100)::numeric, 2);
  INSERT INTO public.affiliate_conversions (affiliate_id, order_id, order_total, commission_amount, status)
  VALUES (v_aff.id, p_order_id, v_order.total, v_commission, 'pending')
  ON CONFLICT DO NOTHING;
END; $$;

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can track affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Public can track affiliate clicks" ON public.affiliate_clicks 
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Affiliates view their clicks" ON public.affiliate_clicks;
CREATE POLICY "Affiliates view their clicks" ON public.affiliate_clicks 
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'admin') OR 
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- 4. LOYALTY redeem
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(p_user_id UUID, p_points INT, p_order_id UUID DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, message TEXT, discount NUMERIC, new_balance INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_balance INT; v_discount NUMERIC;
BEGIN
  SELECT balance INTO v_balance FROM public.user_points WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_points THEN
    RETURN QUERY SELECT false, 'Puncte insuficiente'::text, 0::numeric, COALESCE(v_balance,0); RETURN;
  END IF;
  IF p_points <= 0 THEN
    RETURN QUERY SELECT false, 'Sumă invalidă'::text, 0::numeric, v_balance; RETURN;
  END IF;
  v_discount := (p_points / 100.0)::numeric;
  UPDATE public.user_points SET balance = balance - p_points, updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO public.points_transactions (user_id, type, amount, reason)
  VALUES (p_user_id, 'redeem', -p_points, COALESCE('Folosit la comanda ' || p_order_id::text, 'Folosit la checkout'));
  RETURN QUERY SELECT true, 'Puncte folosite'::text, v_discount, v_balance - p_points;
END; $$;

-- 5. WALLET charge
CREATE OR REPLACE FUNCTION public.charge_wallet(p_user_id UUID, p_amount NUMERIC, p_order_id UUID DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, message TEXT, new_balance NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_balance NUMERIC; v_wallet_id UUID;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_balance FROM public.customer_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.customer_wallets (user_id, balance) VALUES (p_user_id, 0) RETURNING id, balance INTO v_wallet_id, v_balance;
  END IF;
  IF v_balance < p_amount OR p_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Fonduri insuficiente'::text, v_balance; RETURN;
  END IF;
  UPDATE public.customer_wallets SET balance = balance - p_amount, updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, reason, order_id)
  VALUES (v_wallet_id, 'debit', p_amount, v_balance - p_amount, 'Plată comandă', p_order_id);
  RETURN QUERY SELECT true, 'Plătit din portofel'::text, v_balance - p_amount;
END; $$;

-- 6. CUSTOMER GROUP discount
CREATE OR REPLACE FUNCTION public.get_user_group_discount(p_user_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(MAX(cg.discount_percent), 0)
  FROM public.customer_group_members cgm
  JOIN public.customer_groups cg ON cg.id = cgm.group_id
  WHERE cgm.user_id = p_user_id;
$$;

-- 7. AB TESTING assignments
CREATE TABLE IF NOT EXISTS public.ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.ab_test_variants(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  user_id UUID,
  converted BOOLEAN NOT NULL DEFAULT false,
  conversion_value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ,
  UNIQUE(test_id, visitor_id)
);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_test ON public.ab_test_assignments(test_id);
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can record AB assignment" ON public.ab_test_assignments;
CREATE POLICY "Anyone can record AB assignment" ON public.ab_test_assignments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update own assignment" ON public.ab_test_assignments;
CREATE POLICY "Anyone can update own assignment" ON public.ab_test_assignments FOR UPDATE TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin views AB assignments" ON public.ab_test_assignments;
CREATE POLICY "Admin views AB assignments" ON public.ab_test_assignments FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 8. PUSH SUBSCRIPTIONS RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe to push" ON public.push_subscriptions;
CREATE POLICY "Anyone can subscribe to push" ON public.push_subscriptions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users manage own push subs" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subs" ON public.push_subscriptions FOR ALL TO authenticated 
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- 9. CHATBOT RLS
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create chatbot session" ON public.chatbot_sessions;
CREATE POLICY "Anyone can create chatbot session" ON public.chatbot_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update own session" ON public.chatbot_sessions;
CREATE POLICY "Anyone can update own session" ON public.chatbot_sessions FOR UPDATE TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin views all sessions" ON public.chatbot_sessions;
CREATE POLICY "Admin views all sessions" ON public.chatbot_sessions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert chatbot message" ON public.chatbot_messages;
CREATE POLICY "Anyone can insert chatbot message" ON public.chatbot_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admin views all messages" ON public.chatbot_messages;
CREATE POLICY "Admin views all messages" ON public.chatbot_messages FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 10. CRON pentru process_email_outbox
DO $$
DECLARE existing_jobid INT;
BEGIN
  SELECT jobid INTO existing_jobid FROM cron.job WHERE jobname = 'process-email-outbox';
  IF existing_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(existing_jobid);
  END IF;
END $$;

SELECT cron.schedule(
  'process-email-outbox',
  '*/2 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://bdaruamlzueuojivflud.supabase.co/functions/v1/process-email-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkYXJ1YW1senVldW9qaXZmbHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjE2ODUsImV4cCI6MjA5MjI5NzY4NX0.zXKwmThhpl9G3Tb2XsJ9F58aB39YT5UnCkxsGWK29_A',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkYXJ1YW1senVldW9qaXZmbHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjE2ODUsImV4cCI6MjA5MjI5NzY4NX0.zXKwmThhpl9G3Tb2XsJ9F58aB39YT5UnCkxsGWK29_A'
    ),
    body := '{}'::jsonb
  );
  $cron$
);
