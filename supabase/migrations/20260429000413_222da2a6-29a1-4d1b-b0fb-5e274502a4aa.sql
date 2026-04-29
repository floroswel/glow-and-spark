
-- Push notifications subscriptions (Web Push API)
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert push subs" ON public.push_subscriptions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users read own push subs" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own push subs" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage push_subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Recurring product subscriptions (e.g. monthly delivery)
CREATE TABLE public.product_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  variant_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  frequency_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active',
  next_delivery_date DATE NOT NULL DEFAULT (now() + interval '30 days'),
  shipping_address JSONB,
  discount_percent NUMERIC NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);
ALTER TABLE public.product_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON public.product_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage product_subscriptions" ON public.product_subscriptions
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TRIGGER touch_product_subscriptions BEFORE UPDATE ON public.product_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_product_subscriptions_user ON public.product_subscriptions(user_id);
CREATE INDEX idx_product_subscriptions_next ON public.product_subscriptions(next_delivery_date) WHERE status = 'active';
