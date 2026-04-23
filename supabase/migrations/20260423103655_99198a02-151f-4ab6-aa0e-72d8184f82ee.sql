ALTER TABLE public.returns ADD COLUMN user_id uuid;

CREATE POLICY "Users can insert own returns"
ON public.returns
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own returns"
ON public.returns
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);