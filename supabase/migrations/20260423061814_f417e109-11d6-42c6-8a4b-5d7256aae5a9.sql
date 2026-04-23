
-- Create user notifications table
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users read own notifications
CREATE POLICY "Users read own notifications"
  ON public.user_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users update own notifications (mark as read)
CREATE POLICY "Users update own notifications"
  ON public.user_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins manage all
CREATE POLICY "Admins manage user_notifications"
  ON public.user_notifications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookup
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications (user_id, created_at DESC);
CREATE INDEX idx_user_notifications_unread ON public.user_notifications (user_id, is_read) WHERE is_read = false;

-- Auto-notify on order status change
CREATE OR REPLACE FUNCTION public.notify_user_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      CASE
        WHEN NEW.status = 'cancelled' THEN 'refund'
        ELSE 'order'
      END,
      CASE NEW.status
        WHEN 'processing' THEN 'Comanda #' || NEW.order_number || ' se procesează'
        WHEN 'shipped' THEN 'Comanda #' || NEW.order_number || ' a fost expediată'
        WHEN 'completed' THEN 'Comanda #' || NEW.order_number || ' a fost livrată'
        WHEN 'cancelled' THEN 'Comanda #' || NEW.order_number || ' a fost anulată'
        ELSE 'Actualizare comandă #' || NEW.order_number
      END,
      'Statusul comenzii tale s-a schimbat din "' || COALESCE(OLD.status, 'nou') || '" în "' || NEW.status || '".',
      '/account/orders'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_user_order_status
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_order_status();
