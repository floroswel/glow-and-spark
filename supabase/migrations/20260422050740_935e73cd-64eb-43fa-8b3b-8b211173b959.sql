
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_stock_alert integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS allow_backorder boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS promo_start timestamp with time zone,
  ADD COLUMN IF NOT EXISTS promo_end timestamp with time zone,
  ADD COLUMN IF NOT EXISTS brand text;

CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
