CREATE TABLE IF NOT EXISTS public.stock_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  stock_at_alert integer NOT NULL DEFAULT 0,
  threshold integer,
  alerted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_alert_log_product_alerted
  ON public.stock_alert_log (product_id, alerted_at DESC);

ALTER TABLE public.stock_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stock alert log"
  ON public.stock_alert_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert stock alert log"
  ON public.stock_alert_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));