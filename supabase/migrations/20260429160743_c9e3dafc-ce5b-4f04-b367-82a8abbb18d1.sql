UPDATE public.site_settings
SET value = jsonb_set(
  value,
  '{navbar_links}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN link->>'color' = '#ef4444' THEN jsonb_set(link, '{color}', '"#c81e1e"')
        WHEN link->>'color' = '#f59e0b' THEN jsonb_set(link, '{color}', '"#a05500"')
        ELSE link
      END
    )
    FROM jsonb_array_elements(value->'navbar_links') AS link
  )
)
WHERE key = 'header';