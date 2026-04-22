
-- Trigger: notify admins on new order
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, link)
  VALUES (
    'order',
    'Comandă nouă: ' || NEW.order_number,
    NEW.customer_name || ' — ' || NEW.total || ' RON',
    '/admin/orders'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_order ON public.orders;
CREATE TRIGGER trg_notify_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order();

-- Trigger: auto-decrease stock when order goes to processing
CREATE OR REPLACE FUNCTION public.auto_decrease_stock()
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
  IF NEW.status = 'processing' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    IF NEW.items IS NOT NULL AND jsonb_array_length(NEW.items) > 0 THEN
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
      LOOP
        prod_id := (item->>'product_id')::uuid;
        qty := COALESCE((item->>'quantity')::int, 1);
        IF prod_id IS NOT NULL THEN
          UPDATE public.products
          SET stock = GREATEST(stock - qty, 0),
              updated_at = now()
          WHERE id = prod_id;
        END IF;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_decrease_stock ON public.orders;
CREATE TRIGGER trg_auto_decrease_stock
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_decrease_stock();

-- Trigger: log order status changes to activity_log
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_log (action, entity_type, entity_id, entity_name, details)
    VALUES (
      'Status schimbat: ' || COALESCE(OLD.status, 'nou') || ' → ' || NEW.status,
      'order',
      NEW.id::text,
      NEW.order_number,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'customer', NEW.customer_name)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_status ON public.orders;
CREATE TRIGGER trg_log_order_status
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();
