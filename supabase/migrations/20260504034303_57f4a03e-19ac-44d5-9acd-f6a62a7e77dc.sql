ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_wrapping_price numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_wrapping_description text;