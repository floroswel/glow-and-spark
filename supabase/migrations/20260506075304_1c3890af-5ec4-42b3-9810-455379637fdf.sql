
-- 1. Fix chatbot_settings: replace public read with a view
DROP POLICY IF EXISTS "Public read chatbot_settings" ON public.chatbot_settings;

CREATE OR REPLACE VIEW public.chatbot_settings_public AS
SELECT bot_name, welcome_message, is_enabled
FROM public.chatbot_settings
LIMIT 1;

GRANT SELECT ON public.chatbot_settings_public TO anon, authenticated;

-- 2. Revoke EXECUTE on sensitive SECURITY DEFINER functions from anon
REVOKE EXECUTE ON FUNCTION public.attribute_affiliate_conversion(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.charge_wallet(uuid, numeric, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.dispatch_webhook_event(text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.gdpr_notif_allowed(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_gdpr_status_history() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_gdpr_internal_note() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_gdpr_new_request() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_gdpr_status_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_new_gdpr_request() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_new_partner_application() FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_back_in_stock_notifications() FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_price_alerts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_health_check(text, text, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_loyalty_points(uuid, integer, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_orders_webhook() FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_products_webhook() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_group_discount(uuid) FROM anon;

-- 3. Revoke EXECUTE on trigger/internal functions from authenticated too
REVOKE EXECUTE ON FUNCTION public.dispatch_webhook_event(text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.gdpr_notif_allowed(text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_gdpr_status_history() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_gdpr_internal_note() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_gdpr_new_request() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_gdpr_status_change() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_gdpr_request() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_partner_application() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.process_back_in_stock_notifications() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.process_price_alerts() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.record_health_check(text, text, integer, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_orders_webhook() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_products_webhook() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.attribute_affiliate_conversion(uuid, text) FROM authenticated;
