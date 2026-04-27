
-- =====================================================
-- VAL 1: SECURITATE COMPLETĂ
-- =====================================================

-- 1. PRIVATIZE company-documents bucket
UPDATE storage.buckets SET public = false WHERE id = 'company-documents';

-- Drop old permissive policies pe company-documents
DROP POLICY IF EXISTS "Public read company docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload company docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins update company docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete company docs" ON storage.objects;

-- Politici noi: doar adminii pot face orice pe company-documents
CREATE POLICY "Admins read company docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins write company docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update company docs v2"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete company docs v2"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Review-photos: utilizatorii își încarcă în folderul propriu (auth.uid()/...)
DROP POLICY IF EXISTS "Authenticated users upload review photos" ON storage.objects;

CREATE POLICY "Users upload own review photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own review photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'review-photos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins manage review photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'review-photos' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 3. REVOKE EXECUTE pe funcții sensibile (rămân disponibile pentru triggere și service_role)
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_reviews_count(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_order_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_product_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_user_order_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_order() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_decrease_stock() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_restore_stock_on_cancel() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_points_on_order() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- 4. Auth audit log
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read auth_audit_log"
ON public.auth_audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_auth_audit_user_id ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON public.auth_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_event_type ON public.auth_audit_log(event_type);

-- 5. Restricționează profiles: nu mai e public, doar self + admin
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;

CREATE POLICY "Users read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- (Admins manage profiles deja există și acoperă citirea de către admini)

-- 6. Trigger handler_new_user: asigurăm că este atașat
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
