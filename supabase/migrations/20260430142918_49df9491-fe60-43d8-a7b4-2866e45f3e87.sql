-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Public insert chatbot_sessions" ON public.chatbot_sessions;
DROP POLICY IF EXISTS "Public insert chatbot_messages" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Users insert own gdpr_consent" ON public.gdpr_consents;

-- Replace with tighter checks
CREATE POLICY "Public insert chatbot_sessions"
  ON public.chatbot_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    session_token IS NOT NULL
    AND length(session_token) >= 16
    AND (user_id IS NULL OR auth.uid() = user_id)
  );

CREATE POLICY "Public insert chatbot_messages"
  ON public.chatbot_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    session_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.chatbot_sessions s WHERE s.id = session_id)
    AND role IN ('user','assistant','system')
    AND length(content) BETWEEN 1 AND 5000
  );

CREATE POLICY "Users insert own gdpr_consent"
  ON public.gdpr_consents FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
    OR (user_id IS NOT NULL AND auth.uid() = user_id)
  );