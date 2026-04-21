
-- Add missing columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description text;

-- Add missing columns to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS visible boolean DEFAULT true;

-- Add missing columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'individual';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_cui text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_reg text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- Add missing columns to newsletter_subscribers
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS source text DEFAULT 'popup';
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS discount_code text;

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  type text DEFAULT 'percent',
  value numeric NOT NULL,
  min_order numeric DEFAULT 0,
  max_uses integer,
  uses integer DEFAULT 0,
  active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Public can read active coupons
CREATE POLICY "Public read active coupons" ON coupons
  FOR SELECT TO anon, authenticated USING (active = true);

-- Admins manage coupons
CREATE POLICY "Admins manage coupons" ON coupons
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow public to insert orders (for checkout)
CREATE POLICY "Public insert orders" ON orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Insert default categories
INSERT INTO categories (name, slug, sort_order, visible) VALUES
  ('Lumânări Parfumate', 'lumanari-parfumate', 1, true),
  ('Odorizante Auto', 'odorizante-auto', 2, true),
  ('Seturi Cadou', 'seturi-cadou', 3, true),
  ('Lumânări Decorative', 'lumanari-decorative', 4, true),
  ('Lumânări Botez & Nuntă', 'lumanari-botez-nunta', 5, true),
  ('Promoții', 'promotii', 6, true)
ON CONFLICT (slug) DO NOTHING;
