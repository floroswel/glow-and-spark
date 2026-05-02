-- Marketing consent audit log
CREATE TABLE public.marketing_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  policy_version text NOT NULL,
  categories jsonb NOT NULL DEFAULT '{"essential":true,"analytics":false,"marketing":false}'::jsonb,
  action text NOT NULL DEFAULT 'custom',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by user
CREATE INDEX idx_marketing_consents_user ON public.marketing_consents(user_id) WHERE user_id IS NOT NULL;
-- Index for querying by session
CREATE INDEX idx_marketing_consents_session ON public.marketing_consents(session_id) WHERE session_id IS NOT NULL;
-- Index for policy version audits
CREATE INDEX idx_marketing_consents_version ON public.marketing_consents(policy_version);

-- Enable RLS
ALTER TABLE public.marketing_consents ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage marketing_consents"
  ON public.marketing_consents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert consent (including anonymous visitors)
CREATE POLICY "Anyone can insert marketing_consent"
  ON public.marketing_consents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Authenticated users can read their own consents
CREATE POLICY "Users read own marketing_consents"
  ON public.marketing_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);