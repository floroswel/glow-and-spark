
-- Product variants
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC,
  old_price NUMERIC,
  stock INTEGER DEFAULT 0,
  options JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage variants" ON public.product_variants FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read active variants" ON public.product_variants FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Product tags
CREATE TABLE public.product_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tags" ON public.product_tags FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read tags" ON public.product_tags FOR SELECT TO anon, authenticated
  USING (true);

-- Product-tag links (many-to-many)
CREATE TABLE public.product_tag_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.product_tags(id) ON DELETE CASCADE,
  UNIQUE(product_id, tag_id)
);

ALTER TABLE public.product_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tag links" ON public.product_tag_links FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read tag links" ON public.product_tag_links FOR SELECT TO anon, authenticated
  USING (true);

-- Related products
CREATE TABLE public.related_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  target_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'similar',
  sort_order INTEGER DEFAULT 0,
  UNIQUE(source_product_id, target_product_id, relation_type)
);

ALTER TABLE public.related_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage related" ON public.related_products FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read related" ON public.related_products FOR SELECT TO anon, authenticated
  USING (true);

-- New columns on products for logistics & digital
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS length_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS width_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS digital_file_url TEXT,
  ADD COLUMN IF NOT EXISTS digital_max_downloads INTEGER DEFAULT 5;

-- Indexes
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_tag_links_product_id ON public.product_tag_links(product_id);
CREATE INDEX idx_product_tag_links_tag_id ON public.product_tag_links(tag_id);
CREATE INDEX idx_related_products_source ON public.related_products(source_product_id);
CREATE INDEX idx_related_products_target ON public.related_products(target_product_id);
CREATE INDEX idx_products_barcode ON public.products(barcode);
