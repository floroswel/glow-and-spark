CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products SET stock = GREATEST(0, stock - p_quantity) WHERE id = p_product_id;
END;
$$;