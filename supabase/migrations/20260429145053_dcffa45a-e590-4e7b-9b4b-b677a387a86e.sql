
INSERT INTO public.site_settings (key, value)
VALUES (
  'trust_badges',
  jsonb_build_object(
    'enabled', true,
    'badges', jsonb_build_array(
      jsonb_build_object('id', 'b1', 'icon', 'ShieldCheck', 'title', 'Plată securizată SSL', 'desc', 'Protecție 100%', 'color', '#C9A24A', 'active', true),
      jsonb_build_object('id', 'b2', 'icon', 'RotateCcw',  'title', 'Retur 30 de zile',     'desc', 'Fără întrebări', 'color', '#C9A24A', 'active', true),
      jsonb_build_object('id', 'b3', 'icon', 'Truck',      'title', 'Livrare 24-48h',       'desc', 'Prin Fan Courier', 'color', '#C9A24A', 'active', true),
      jsonb_build_object('id', 'b4', 'icon', 'Award',      'title', 'Produs artizanal',     'desc', 'Fabricat în România', 'color', '#C9A24A', 'active', true)
    )
  )
)
ON CONFLICT (key) DO NOTHING;
