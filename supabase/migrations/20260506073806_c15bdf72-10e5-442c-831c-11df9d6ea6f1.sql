
-- 1. Products view excluding sensitive columns
CREATE OR REPLACE VIEW public.products_public AS
  SELECT id, name, slug, short_description, description, price, old_price,
         image_url, gallery, category_id, brand, badge, badge_type,
         stock, is_active, is_featured, is_digital,
         rating, reviews_count, sold_count, weight,
         length_cm, width_cm, height_cm, sku,
         meta_title, meta_description,
         sort_order, lowest_price_30d, promo_start, promo_end,
         promo_started_at, countdown_end, min_stock_alert, allow_backorder,
         created_at, updated_at
  FROM public.products
  WHERE is_active = true;

GRANT SELECT ON public.products_public TO anon, authenticated;

-- 2. user_points — remove direct UPDATE policy for users
DROP POLICY IF EXISTS "Users update own points" ON public.user_points;

-- 3. chatbot_sessions — replace USING(true) with session_token scoping
DROP POLICY IF EXISTS "Public read own chatbot_session" ON public.chatbot_sessions;
DROP POLICY IF EXISTS "Anyone can update own session" ON public.chatbot_sessions;
DROP POLICY IF EXISTS "Anyone can create chatbot session" ON public.chatbot_sessions;

CREATE POLICY "Public read own chatbot_session"
ON public.chatbot_sessions FOR SELECT
TO anon, authenticated
USING (
  session_token = coalesce(
    current_setting('request.headers', true)::json->>'x-session-token',
    ''
  )
  OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

CREATE POLICY "Public update own chatbot_session"
ON public.chatbot_sessions FOR UPDATE
TO anon, authenticated
USING (
  session_token = coalesce(
    current_setting('request.headers', true)::json->>'x-session-token',
    ''
  )
  OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

-- 4. chatbot_messages — restrict SELECT to own session messages
DROP POLICY IF EXISTS "Public read chatbot_messages by session" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Anyone can insert chatbot message" ON public.chatbot_messages;

CREATE POLICY "Public read own chatbot_messages"
ON public.chatbot_messages FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chatbot_sessions s
    WHERE s.id = chatbot_messages.session_id
    AND (
      s.session_token = coalesce(
        current_setting('request.headers', true)::json->>'x-session-token',
        ''
      )
      OR (auth.uid() IS NOT NULL AND auth.uid() = s.user_id)
    )
  )
);

-- 5. ab_test_assignments — remove dangerous public UPDATE
DROP POLICY IF EXISTS "Anyone can update own assignment" ON public.ab_test_assignments;
DROP POLICY IF EXISTS "Anyone can record AB assignment" ON public.ab_test_assignments;

CREATE POLICY "Record own AB assignment"
ON public.ab_test_assignments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admin updates AB assignments"
ON public.ab_test_assignments FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. company-documents bucket — make private
UPDATE storage.buckets SET public = false WHERE id = 'company-documents';
DROP POLICY IF EXISTS "Public read access for company documents" ON storage.objects;

-- 7. Revoke EXECUTE on trigger/internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.notify_gdpr_new_request() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_gdpr_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_gdpr_internal_note() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_gdpr_request() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_partner_application() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_gdpr_status_history() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_orders_webhook() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_products_webhook() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dispatch_webhook_event(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_health_check(text, text, integer, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_back_in_stock_notifications() FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_price_alerts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.attribute_affiliate_conversion(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.charge_wallet(uuid, numeric, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_loyalty_points(uuid, integer, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_gift_card(text, numeric, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_group_discount(uuid) FROM anon;
