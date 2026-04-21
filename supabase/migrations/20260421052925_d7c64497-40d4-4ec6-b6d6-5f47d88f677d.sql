
DROP POLICY "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe with email only" ON public.newsletter_subscribers 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (is_active = true);
