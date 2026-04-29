
DROP POLICY IF EXISTS "Public insert push subs" ON public.push_subscriptions;
CREATE POLICY "Public insert push subs" ON public.push_subscriptions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    endpoint ~* '^https://' 
    AND length(endpoint) BETWEEN 20 AND 1000
    AND length(p256dh) BETWEEN 10 AND 500
    AND length(auth) BETWEEN 10 AND 500
    AND ((user_id IS NULL) OR (auth.uid() = user_id))
  );
