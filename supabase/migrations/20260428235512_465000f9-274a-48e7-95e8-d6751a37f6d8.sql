
CREATE OR REPLACE FUNCTION public.detect_back_in_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stock = 0 AND NEW.stock > 0 THEN
    INSERT INTO public.admin_notifications (type, title, message, link)
    VALUES (
      'stock',
      'Produs revenit pe stoc: ' || NEW.name,
      'Există ' || (
        SELECT COUNT(*) FROM public.stock_notifications
        WHERE product_id = NEW.id AND notified_at IS NULL
      ) || ' clienți de anunțat.',
      '/admin/products'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_detect_back_in_stock ON public.products;
CREATE TRIGGER trg_detect_back_in_stock
  AFTER UPDATE OF stock ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_back_in_stock();

REVOKE EXECUTE ON FUNCTION public.detect_back_in_stock() FROM PUBLIC, anon, authenticated;
