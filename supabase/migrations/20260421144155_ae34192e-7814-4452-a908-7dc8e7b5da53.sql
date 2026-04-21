
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- Search products with diacritics-insensitive matching
CREATE OR REPLACE FUNCTION public.search_products_unaccent(term text, lim int DEFAULT 6)
RETURNS SETOF products
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM products
  WHERE is_active = true
  AND (
    extensions.unaccent(lower(name)) LIKE '%' || extensions.unaccent(lower(term)) || '%'
    OR extensions.unaccent(lower(COALESCE(short_description, ''))) LIKE '%' || extensions.unaccent(lower(term)) || '%'
  )
  ORDER BY is_featured DESC
  LIMIT lim;
$$;

-- Search categories with diacritics-insensitive matching
CREATE OR REPLACE FUNCTION public.search_categories_unaccent(term text, lim int DEFAULT 4)
RETURNS SETOF categories
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM categories
  WHERE visible = true
  AND extensions.unaccent(lower(name)) LIKE '%' || extensions.unaccent(lower(term)) || '%'
  ORDER BY sort_order
  LIMIT lim;
$$;

-- Return matching product IDs for catalog filtering
CREATE OR REPLACE FUNCTION public.search_product_ids_unaccent(term text)
RETURNS TABLE(id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT p.id
  FROM products p
  WHERE p.is_active = true
  AND (
    extensions.unaccent(lower(p.name)) LIKE '%' || extensions.unaccent(lower(term)) || '%'
    OR extensions.unaccent(lower(COALESCE(p.short_description, ''))) LIKE '%' || extensions.unaccent(lower(term)) || '%'
  );
$$;
