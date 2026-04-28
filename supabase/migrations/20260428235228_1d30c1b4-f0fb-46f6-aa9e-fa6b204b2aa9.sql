
-- Back-in-stock notifications
CREATE TABLE IF NOT EXISTS public.stock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  variant_id UUID,
  email TEXT NOT NULL,
  user_id UUID,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, email)
);
CREATE INDEX IF NOT EXISTS idx_stock_notif_product ON public.stock_notifications(product_id) WHERE notified_at IS NULL;
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert stock notifications" ON public.stock_notifications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(email) <= 255
    AND (user_id IS NULL OR auth.uid() = user_id)
  );

CREATE POLICY "Users read own stock notifications" ON public.stock_notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage stock_notifications" ON public.stock_notifications
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Product bundles (upsell/cross-sell)
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active bundles" ON public.product_bundles FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage bundles" ON public.product_bundles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public read bundle items" ON public.product_bundle_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage bundle items" ON public.product_bundle_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- GDPR: user data deletion request
CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete', 'rectify')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  details TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own gdpr request" ON public.gdpr_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
CREATE POLICY "Users read own gdpr requests" ON public.gdpr_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage gdpr_requests" ON public.gdpr_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_bundles_updated BEFORE UPDATE ON public.product_bundles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
