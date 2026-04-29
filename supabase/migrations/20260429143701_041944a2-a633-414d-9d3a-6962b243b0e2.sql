UPDATE public.site_settings
SET value = jsonb_set(value, '{meta_title_suffix}', '" — Mama Lucica"'::jsonb)
WHERE key = 'general';