
CREATE TABLE public.cookie_consent_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  action TEXT NOT NULL,
  categories JSONB NOT NULL DEFAULT '{}',
  policy_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cookie_consent_log ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own consent record
CREATE POLICY "Anyone can insert consent log"
  ON public.cookie_consent_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins can read all consent logs for auditing
CREATE POLICY "Admins can read consent logs"
  ON public.cookie_consent_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can read their own consent logs
CREATE POLICY "Users can read own consent logs"
  ON public.cookie_consent_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_cookie_consent_log_user ON public.cookie_consent_log (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cookie_consent_log_session ON public.cookie_consent_log (session_id);
