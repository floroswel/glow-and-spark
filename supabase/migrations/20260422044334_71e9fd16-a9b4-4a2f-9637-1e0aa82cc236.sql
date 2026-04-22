CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  email text,
  customer_name text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  recovered boolean DEFAULT false,
  recovered_order_id uuid,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage abandoned_carts"
  ON public.abandoned_carts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert abandoned carts"
  ON public.abandoned_carts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update own cart by session"
  ON public.abandoned_carts FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_abandoned_carts_session ON public.abandoned_carts(session_id);
CREATE INDEX idx_abandoned_carts_email ON public.abandoned_carts(email);
CREATE INDEX idx_abandoned_carts_created ON public.abandoned_carts(created_at DESC);