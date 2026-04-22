
-- Warehouses
CREATE TABLE public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  city text,
  county text,
  responsible_name text,
  responsible_phone text,
  capacity integer DEFAULT 0,
  warehouse_type text DEFAULT 'principal',
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage warehouses" ON public.warehouses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Stock levels per product per warehouse
CREATE TABLE public.stock_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  available integer DEFAULT 0,
  reserved integer DEFAULT 0,
  location_code text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock_levels" ON public.stock_levels FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_stock_levels_product ON public.stock_levels(product_id);
CREATE INDEX idx_stock_levels_warehouse ON public.stock_levels(warehouse_id);

-- Stock movements log
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  movement_type text NOT NULL, -- 'entry','exit','transfer_in','transfer_out','adjustment','return'
  quantity integer NOT NULL,
  previous_stock integer DEFAULT 0,
  new_stock integer DEFAULT 0,
  reason text,
  reference_type text, -- 'order','transfer','adjustment','nir','manual'
  reference_id uuid,
  performed_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock_movements" ON public.stock_movements FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created ON public.stock_movements(created_at DESC);

-- Stock transfers
CREATE TABLE public.stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number text NOT NULL,
  from_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  to_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  status text DEFAULT 'draft', -- draft, approved, in_transit, received, cancelled
  notes text,
  approved_by uuid,
  approved_at timestamptz,
  received_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock_transfers" ON public.stock_transfers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.stock_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1,
  received_quantity integer DEFAULT 0
);
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock_transfer_items" ON public.stock_transfer_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Stock adjustments
CREATE TABLE public.stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id),
  adjustment_type text NOT NULL, -- 'increase','decrease'
  quantity integer NOT NULL,
  reason text NOT NULL, -- 'inventory','damaged','promotion','error','other'
  notes text,
  status text DEFAULT 'pending', -- pending, approved, rejected
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock_adjustments" ON public.stock_adjustments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Suppliers
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cui text,
  reg_com text,
  address text,
  city text,
  county text,
  contact_name text,
  contact_email text,
  contact_phone text,
  payment_terms integer DEFAULT 30,
  discount_percent numeric DEFAULT 0,
  product_categories text,
  rating integer DEFAULT 3,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Purchase orders
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text NOT NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  status text DEFAULT 'draft', -- draft, sent, confirmed, received, paid, cancelled
  total numeric DEFAULT 0,
  notes text,
  expected_delivery timestamptz,
  received_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage purchase_orders" ON public.purchase_orders FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric DEFAULT 0,
  received_quantity integer DEFAULT 0
);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage purchase_order_items" ON public.purchase_order_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Product batches / lots
CREATE TABLE public.product_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id),
  batch_number text NOT NULL,
  quantity integer DEFAULT 0,
  production_date date,
  expiry_date date,
  cost_price numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage product_batches" ON public.product_batches FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_product_batches_expiry ON public.product_batches(expiry_date);

-- Stock alerts configuration
CREATE TABLE public.stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  min_threshold integer DEFAULT 5,
  notify_email text,
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock_alerts" ON public.stock_alerts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
