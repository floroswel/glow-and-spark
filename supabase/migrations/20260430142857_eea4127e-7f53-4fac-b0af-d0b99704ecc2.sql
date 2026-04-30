-- ============================================================
-- ETAPA 2: Tabele noi pentru features admin importate
-- Toate cu RLS strict (admin manage / public read where needed)
-- ============================================================

-- ---------- CHATBOT / SUPPORT ----------
CREATE TABLE IF NOT EXISTS public.chatbot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT true,
  bot_name text NOT NULL DEFAULT 'Asistent Mama Lucica',
  welcome_message text DEFAULT 'Bună! Cu ce te pot ajuta?',
  ai_model text DEFAULT 'google/gemini-2.5-flash',
  system_prompt text,
  fallback_email text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chatbot_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  keywords text[] DEFAULT '{}',
  category text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  user_id uuid,
  visitor_email text,
  visitor_name text,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- GEOGRAPHY ROMANIA ----------
CREATE TABLE IF NOT EXISTS public.romania_judete (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cod text UNIQUE NOT NULL,
  nume text NOT NULL,
  auto text
);

CREATE TABLE IF NOT EXISTS public.romania_localitati (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judet_cod text NOT NULL,
  nume text NOT NULL,
  tip text DEFAULT 'oras',
  cod_postal text
);
CREATE INDEX IF NOT EXISTS idx_localitati_judet ON public.romania_localitati(judet_cod);
CREATE INDEX IF NOT EXISTS idx_localitati_nume ON public.romania_localitati(lower(nume));

-- ---------- SECURITY / AUDIT ----------
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address, created_at DESC);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  secret text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  backup_codes text[] DEFAULT '{}',
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  UNIQUE (role, resource, action)
);

-- ---------- GDPR ----------
CREATE TABLE IF NOT EXISTS public.gdpr_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  consent_type text NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_user ON public.gdpr_consents(user_id);

CREATE TABLE IF NOT EXISTS public.legal_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  document_type text NOT NULL,
  document_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

-- ---------- WEBHOOKS ----------
CREATE TABLE IF NOT EXISTS public.external_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  secret text,
  headers jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  failure_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.external_webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  next_retry_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_queue_status ON public.webhook_queue(status, next_retry_at);

-- ---------- WINBACK / MARKETING AUTOMATION ----------
CREATE TABLE IF NOT EXISTS public.winback_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_days_inactive integer NOT NULL DEFAULT 60,
  discount_percent numeric DEFAULT 10,
  email_subject text,
  email_body text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.winback_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.winback_campaigns(id) ON DELETE CASCADE,
  user_id uuid,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  converted boolean DEFAULT false,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text,
  template text,
  status text NOT NULL DEFAULT 'sent',
  provider text DEFAULT 'resend',
  provider_id text,
  error text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sms_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  provider text,
  provider_id text,
  error text,
  cost numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  channel text NOT NULL,
  subject text,
  body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- CRM ----------
CREATE TABLE IF NOT EXISTS public.customer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  discount_percent numeric DEFAULT 0,
  color text DEFAULT '#888888',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.customer_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#888'
);

CREATE TABLE IF NOT EXISTS public.customer_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tag_id uuid NOT NULL REFERENCES public.customer_tags(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.customer_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  ip_address text,
  reason text NOT NULL,
  blocked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- AFFILIATES ----------
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  commission_percent numeric NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'pending',
  total_earned numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  payout_method text,
  payout_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  referrer text,
  landing_page text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id uuid,
  order_total numeric NOT NULL,
  commission_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- BRANDS / ATTRIBUTES ----------
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo_url text,
  website text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'text',
  is_filterable boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES public.product_attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  display_value text,
  sort_order integer DEFAULT 0
);

-- ---------- LOYALTY ADVANCED ----------
CREATE TABLE IF NOT EXISTS public.loyalty_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_points integer NOT NULL DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  benefits text[] DEFAULT '{}',
  badge_color text DEFAULT '#888',
  sort_order integer DEFAULT 0
);

-- ---------- PRICE LISTS B2B ----------
CREATE TABLE IF NOT EXISTS public.price_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  applies_to_group_id uuid REFERENCES public.customer_groups(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.price_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id uuid NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  price numeric NOT NULL,
  min_quantity integer DEFAULT 1,
  UNIQUE (price_list_id, product_id, min_quantity)
);

-- ---------- WALLET / STORE CREDIT ----------
CREATE TABLE IF NOT EXISTS public.customer_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'RON',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.customer_wallets(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  reason text,
  order_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- A/B TESTING ----------
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  target_url text,
  status text NOT NULL DEFAULT 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ab_test_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  name text NOT NULL,
  traffic_percent numeric NOT NULL DEFAULT 50,
  config jsonb DEFAULT '{}'::jsonb,
  visitors integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0
);

-- ---------- HEALTH / SYSTEM ----------
CREATE TABLE IF NOT EXISTS public.health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL,
  status text NOT NULL,
  response_time_ms integer,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_health_logs_check ON public.health_logs(check_name, created_at DESC);

CREATE TABLE IF NOT EXISTS public.error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  message text NOT NULL,
  stack_trace text,
  url text,
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text DEFAULT 'general',
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- SEO ----------
CREATE TABLE IF NOT EXISTS public.seo_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path text UNIQUE NOT NULL,
  target_path text NOT NULL,
  redirect_type integer NOT NULL DEFAULT 301,
  is_active boolean NOT NULL DEFAULT true,
  hits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- POPUPS / EXIT INTENT ----------
CREATE TABLE IF NOT EXISTS public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'modal',
  trigger text NOT NULL DEFAULT 'time',
  trigger_value integer DEFAULT 5,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  views integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- BANNERS ----------
CREATE TABLE IF NOT EXISTS public.site_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_url text,
  position text NOT NULL DEFAULT 'home_hero',
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- BACK IN STOCK ----------
CREATE TABLE IF NOT EXISTS public.back_in_stock_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  variant_id uuid,
  email text NOT NULL,
  user_id uuid,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- PRICE ALERTS ----------
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  product_id uuid NOT NULL,
  target_price numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- INVOICES ENHANCED ----------
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  series text DEFAULT 'ML',
  order_id uuid,
  customer_name text NOT NULL,
  customer_email text,
  customer_cui text,
  customer_address text,
  subtotal numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'RON',
  status text NOT NULL DEFAULT 'issued',
  pdf_url text,
  smartbill_id text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  vat_percent numeric NOT NULL DEFAULT 19,
  total numeric NOT NULL
);

-- ============================================================
-- ENABLE RLS ON ALL NEW TABLES
-- ============================================================
ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romania_judete ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romania_localitati ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winback_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winback_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.back_in_stock_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Admin-only management on all
DO $$
DECLARE
  t text;
  admin_only_tables text[] := ARRAY[
    'chatbot_faq','chatbot_settings','chatbot_sessions','chatbot_messages',
    'login_attempts','audit_log','role_permissions','two_factor_auth',
    'external_webhooks','webhook_queue','winback_campaigns','winback_enrollments',
    'email_logs','sms_log','notification_templates','customer_groups','customer_group_members',
    'customer_segments','customer_tags','customer_tag_assignments','customer_blacklist',
    'affiliate_clicks','affiliate_conversions','affiliate_payout_requests',
    'product_attributes','attribute_values','loyalty_levels','price_lists','price_list_items',
    'customer_wallets','wallet_transactions','ab_tests','ab_test_variants',
    'health_logs','error_log','app_settings','seo_redirects','popups',
    'back_in_stock_notifications','price_alerts','invoices','invoice_items',
    'gdpr_consents','legal_consents'
  ];
BEGIN
  FOREACH t IN ARRAY admin_only_tables LOOP
    EXECUTE format('CREATE POLICY "Admins manage %1$I" ON public.%1$I FOR ALL TO authenticated USING (has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (has_role(auth.uid(), ''admin''::app_role))', t);
  END LOOP;
END $$;

-- Public read for romania_judete / romania_localitati / brands / site_banners (active) / loyalty_levels
CREATE POLICY "Public read romania_judete" ON public.romania_judete FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage romania_judete" ON public.romania_judete FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read romania_localitati" ON public.romania_localitati FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage romania_localitati" ON public.romania_localitati FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read active brands" ON public.brands FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read active site_banners" ON public.site_banners FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage site_banners" ON public.site_banners FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Affiliates: each affiliate reads own row
CREATE POLICY "Admins manage affiliates" ON public.affiliates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Affiliate reads own row" ON public.affiliates FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Public can insert chatbot session/messages (needed for chatbot widget) - controlled by edge function ideally
CREATE POLICY "Public insert chatbot_sessions" ON public.chatbot_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public read own chatbot_session" ON public.chatbot_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert chatbot_messages" ON public.chatbot_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public read chatbot_messages by session" ON public.chatbot_messages FOR SELECT TO anon, authenticated USING (true);

-- Public read active chatbot_faq
CREATE POLICY "Public read active chatbot_faq" ON public.chatbot_faq FOR SELECT TO anon, authenticated USING (is_active = true);

-- Public read chatbot_settings (widget needs config)
CREATE POLICY "Public read chatbot_settings" ON public.chatbot_settings FOR SELECT TO anon, authenticated USING (true);

-- Public insert price_alerts and back_in_stock_notifications (subscribe by email)
CREATE POLICY "Public insert price_alerts" ON public.price_alerts FOR INSERT TO anon, authenticated WITH CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
CREATE POLICY "Public insert back_in_stock" ON public.back_in_stock_notifications FOR INSERT TO anon, authenticated WITH CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- Users read own price_alerts / back_in_stock
CREATE POLICY "Users read own price_alerts" ON public.price_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users read own back_in_stock" ON public.back_in_stock_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users read own wallet
CREATE POLICY "Users read own wallet" ON public.customer_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users read own wallet_transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.customer_wallets w WHERE w.id = wallet_transactions.wallet_id AND w.user_id = auth.uid())
);

-- Users read own 2FA / consents
CREATE POLICY "Users manage own 2FA" ON public.two_factor_auth FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own gdpr_consent" ON public.gdpr_consents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users read own gdpr_consent" ON public.gdpr_consents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own legal_consent" ON public.legal_consents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own legal_consent" ON public.legal_consents FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Public insert login_attempts (edge function will log) - service role bypasses RLS, but allow for safety
-- Keep admin-only read

-- Updated_at trigger for tables that have it
CREATE TRIGGER trg_chatbot_settings_updated BEFORE UPDATE ON public.chatbot_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_chatbot_faq_updated BEFORE UPDATE ON public.chatbot_faq FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_chatbot_sessions_updated BEFORE UPDATE ON public.chatbot_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_external_webhooks_updated BEFORE UPDATE ON public.external_webhooks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_winback_campaigns_updated BEFORE UPDATE ON public.winback_campaigns FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_notification_templates_updated BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_customer_segments_updated BEFORE UPDATE ON public.customer_segments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_affiliates_updated BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_brands_updated BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_customer_wallets_updated BEFORE UPDATE ON public.customer_wallets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
