-- Validate that admin_notifications.link is either NULL, a relative path,
-- or points to an allow-listed hostname. Defence-in-depth against open-redirects.
CREATE OR REPLACE FUNCTION public.validate_admin_notification_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  l text;
  host text;
BEGIN
  l := NEW.link;
  IF l IS NULL OR length(trim(l)) = 0 THEN
    NEW.link := NULL;
    RETURN NEW;
  END IF;

  -- Allow relative paths (must start with single slash, not //)
  IF l ~ '^/[^/]' OR l = '/' THEN
    RETURN NEW;
  END IF;

  -- Absolute http(s) URL: extract hostname and check allow-list
  IF l ~* '^https?://' THEN
    host := lower(split_part(split_part(regexp_replace(l, '^https?://', ''), '/', 1), '?', 1));
    -- strip port if present
    host := split_part(host, ':', 1);
    IF host IN ('mamalucica.ro', 'www.mamalucica.ro') THEN
      RETURN NEW;
    END IF;
  END IF;

  RAISE EXCEPTION 'admin_notifications.link must be a relative path or point to an allowed hostname (got: %)', l
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_admin_notification_link ON public.admin_notifications;
CREATE TRIGGER trg_validate_admin_notification_link
  BEFORE INSERT OR UPDATE OF link ON public.admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_notification_link();