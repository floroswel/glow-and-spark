-- Omnibus directive fields for products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS lowest_price_30d numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS promo_started_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.products.lowest_price_30d IS 'Lowest price in last 30 days (Omnibus Directive). Required to show discount badges.';
COMMENT ON COLUMN public.products.promo_started_at IS 'When the current promotion started. Used for Omnibus compliance.';

-- Review moderation fields
ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'site',
  ADD COLUMN IF NOT EXISTS moderation_note text DEFAULT NULL;

COMMENT ON COLUMN public.product_reviews.source IS 'Origin of review: site, import, social, etc.';
COMMENT ON COLUMN public.product_reviews.moderation_note IS 'Internal moderation note [PROCESS]';