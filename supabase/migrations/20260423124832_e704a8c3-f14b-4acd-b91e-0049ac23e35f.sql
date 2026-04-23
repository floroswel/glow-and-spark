
ALTER TABLE public.products ADD COLUMN sold_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity),
      sold_count = sold_count + p_quantity
  WHERE id = p_product_id;
END;
$$;
