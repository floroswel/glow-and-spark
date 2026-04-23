CREATE OR REPLACE FUNCTION public.update_reviews_count(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET reviews_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = p_product_id AND status = 'approved'),
      rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) FROM product_reviews WHERE product_id = p_product_id AND status = 'approved')
  WHERE id = p_product_id;
END;
$$;