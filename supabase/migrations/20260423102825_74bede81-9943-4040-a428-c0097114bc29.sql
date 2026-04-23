ALTER TABLE public.product_reviews ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.product_reviews ADD COLUMN author_name text;
ALTER TABLE public.product_reviews ADD COLUMN verified_purchase boolean DEFAULT false;