
-- 1. Restrict listing on public buckets (păstrăm acces direct la fișiere)
-- Strategie: înlocuim politicile SELECT "USING (bucket_id = X)" cu unele care
-- permit acces obiect-cu-obiect prin URL public (CDN), dar listarea prin API
-- e blocată de RLS pentru cei neautentificați.

-- Pentru product-images: permitem doar adminii să listeze; CDN-ul public servește direct.
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Authenticated browse product images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images');

-- Pentru review-photos: la fel
DROP POLICY IF EXISTS "Public read review photos" ON storage.objects;
CREATE POLICY "Authenticated browse review photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'review-photos');

-- 2. Funcțiile de căutare devin SECURITY INVOKER (respectă RLS)
CREATE OR REPLACE FUNCTION public.search_categories_unaccent(term text, lim integer DEFAULT 4)
 RETURNS SETOF categories
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT *
  FROM categories
  WHERE visible = true
  AND extensions.unaccent(lower(name)) LIKE '%' || extensions.unaccent(lower(term)) || '%'
  ORDER BY sort_order
  LIMIT lim;
$function$;

CREATE OR REPLACE FUNCTION public.search_products_unaccent(term text, lim integer DEFAULT 6)
 RETURNS SETOF products
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT *
  FROM products
  WHERE is_active = true
  AND (
    extensions.unaccent(lower(name)) LIKE '%' || extensions.unaccent(lower(term)) || '%'
    OR extensions.unaccent(lower(COALESCE(short_description, ''))) LIKE '%' || extensions.unaccent(lower(term)) || '%'
  )
  ORDER BY is_featured DESC
  LIMIT lim;
$function$;

CREATE OR REPLACE FUNCTION public.search_product_ids_unaccent(term text)
 RETURNS TABLE(id uuid)
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT p.id
  FROM products p
  WHERE p.is_active = true
  AND (
    extensions.unaccent(lower(p.name)) LIKE '%' || extensions.unaccent(lower(term)) || '%'
    OR extensions.unaccent(lower(COALESCE(p.short_description, ''))) LIKE '%' || extensions.unaccent(lower(term)) || '%'
  );
$function$;

-- 3. has_role rămâne SECURITY DEFINER (necesar pentru RLS), dar revoke de la anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;

-- compute_tier este IMMUTABLE pură, nu necesită SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.compute_tier(pts integer)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN pts >= 2000 THEN 'Gold'
    WHEN pts >= 500 THEN 'Silver'
    ELSE 'Bronze'
  END;
$function$;
