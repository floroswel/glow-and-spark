-- Allow public (anon + authenticated) to insert login attempts for security audit
CREATE POLICY "Public insert login_attempts"
ON public.login_attempts
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) <= 320
  AND (failure_reason IS NULL OR length(failure_reason) <= 500)
);