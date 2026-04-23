ALTER TABLE public.orders ADD COLUMN gift_wrapping boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN gift_message text;