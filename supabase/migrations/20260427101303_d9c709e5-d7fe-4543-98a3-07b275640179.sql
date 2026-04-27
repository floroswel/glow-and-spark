
-- 1. Restrânge INSERT pe orders
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;

CREATE POLICY "Public insert valid orders"
ON public.orders FOR INSERT TO anon, authenticated
WITH CHECK (
  customer_name IS NOT NULL AND length(trim(customer_name)) BETWEEN 2 AND 200
  AND customer_email IS NOT NULL AND customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND total >= 0 AND total <= 1000000
  AND subtotal >= 0
  AND items IS NOT NULL AND jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0
  AND (user_id IS NULL OR auth.uid() = user_id)
  AND status IN ('pending', 'processing')
);

-- 2. Mută unaccent în schema extensions (dacă există deja, nu face nimic)
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE e.extname = 'unaccent' AND n.nspname = 'public') THEN
    ALTER EXTENSION unaccent SET SCHEMA extensions;
  END IF;
END $$;

GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
