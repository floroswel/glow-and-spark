
UPDATE site_settings 
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      value,
      '{col1_links}',
      '[
        {"label": "Termeni și condiții", "url": "/termeni-si-conditii"},
        {"label": "Politica de confidențialitate", "url": "/politica-confidentialitate"},
        {"label": "Politica cookie-uri", "url": "/politica-cookies"},
        {"label": "Politica de returnare", "url": "/politica-returnare"},
        {"label": "Formular de retragere", "url": "/formular-retragere"},
        {"label": "Transport și livrare", "url": "/transport-livrare"},
        {"label": "Metode de plată", "url": "/metode-plata"},
        {"label": "Garanție", "url": "/garantie"}
      ]'::jsonb
    ),
    '{col2_links}',
    '[
      {"label": "Contul meu", "url": "/account"},
      {"label": "Comenzile mele", "url": "/account/orders"},
      {"label": "Lista de dorințe", "url": "/account/favorites"},
      {"label": "Întrebări frecvente", "url": "/faq"},
      {"label": "Urmărește comanda", "url": "/track-order"}
    ]'::jsonb
  ),
  '{col3_links}',
  '[
    {"label": "Despre noi", "url": "/despre-noi"},
    {"label": "Blog", "url": "/blog"},
    {"label": "Contact", "url": "/contact"},
    {"label": "Siguranță produse", "url": "/siguranta-produse"},
    {"label": "Accesibilitate", "url": "/accesibilitate"}
  ]'::jsonb
)
WHERE key = 'footer';
