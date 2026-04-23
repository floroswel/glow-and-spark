
CREATE OR REPLACE FUNCTION public.compute_tier(pts integer)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = 'public'
AS $$
  SELECT CASE
    WHEN pts >= 2000 THEN 'Gold'
    WHEN pts >= 500 THEN 'Silver'
    ELSE 'Bronze'
  END;
$$;
