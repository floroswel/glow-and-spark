-- Drop the permissive anon policies on abandoned_carts
DROP POLICY IF EXISTS "Anyone can insert abandoned carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Anyone can update own cart by session" ON public.abandoned_carts;

-- Authenticated users can manage their OWN cart row (when user_id is set)
CREATE POLICY "Users manage own abandoned_carts"
ON public.abandoned_carts
FOR ALL
TO authenticated
USING (user_id IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

-- Anonymous/guest carts (no user_id) can ONLY be written via service role
-- (i.e., through the saveAbandonedCart server function which validates a httpOnly cookie).
-- Admins policy already exists for full read/manage.
-- No anon INSERT/UPDATE policy = anon role is denied by RLS.