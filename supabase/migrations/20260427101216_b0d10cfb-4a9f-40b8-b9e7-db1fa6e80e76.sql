
-- REVOKE FROM PUBLIC pentru toate SECURITY DEFINER (rolul PUBLIC e cel care dă EXECUTE implicit)
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_reviews_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_order_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_product_changes() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_user_order_status() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_order() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_decrease_stock() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_restore_stock_on_cancel() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_points_on_order() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- has_role: doar authenticated (necesar pentru policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
