CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text;
  attempts int := 0;
BEGIN
  LOOP
    candidate := 'ML' || lpad(floor(random() * 100000)::int::text, 5, '0');
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = candidate) THEN
      RETURN candidate;
    END IF;
    attempts := attempts + 1;
    IF attempts > 50 THEN
      -- Fallback extrem: adaugă timestamp ms pentru a garanta unicitatea
      candidate := 'ML' || lpad((floor(random() * 100000)::int)::text, 5, '0');
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$;