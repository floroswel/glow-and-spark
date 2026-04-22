
-- Add AWB tracking fields to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS awb_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS awb_carrier text;

-- Trigger: restore stock when order cancelled
CREATE OR REPLACE FUNCTION public.auto_restore_stock_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  prod_id uuid;
  qty int;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IN ('processing', 'shipped') THEN
    IF NEW.items IS NOT NULL AND jsonb_array_length(NEW.items) > 0 THEN
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
      LOOP
        prod_id := (item->>'product_id')::uuid;
        IF prod_id IS NULL THEN
          prod_id := (item->>'id')::uuid;
        END IF;
        qty := COALESCE((item->>'quantity')::int, COALESCE((item->>'qty')::int, 1));
        IF prod_id IS NOT NULL THEN
          UPDATE public.products
          SET stock = stock + qty,
              updated_at = now()
          WHERE id = prod_id;
        END IF;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_restore_stock ON public.orders;
CREATE TRIGGER trg_auto_restore_stock
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_restore_stock_on_cancel();

-- Trigger: log product changes
CREATE OR REPLACE FUNCTION public.log_product_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price OR OLD.stock IS DISTINCT FROM NEW.stock OR OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    INSERT INTO public.activity_log (action, entity_type, entity_id, entity_name, details)
    VALUES (
      CASE
        WHEN OLD.price IS DISTINCT FROM NEW.price THEN 'Preț modificat: ' || OLD.price || ' → ' || NEW.price
        WHEN OLD.stock IS DISTINCT FROM NEW.stock THEN 'Stoc modificat: ' || OLD.stock || ' → ' || NEW.stock
        WHEN OLD.is_active IS DISTINCT FROM NEW.is_active THEN CASE WHEN NEW.is_active THEN 'Produs activat' ELSE 'Produs dezactivat' END
        ELSE 'Produs modificat'
      END,
      'product',
      NEW.id::text,
      NEW.name,
      jsonb_build_object('old_price', OLD.price, 'new_price', NEW.price, 'old_stock', OLD.stock, 'new_stock', NEW.stock)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_product_changes ON public.products;
CREATE TRIGGER trg_log_product_changes
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.log_product_changes();
