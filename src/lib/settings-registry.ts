/**
 * Settings Registry — Single Source of Truth
 *
 * Maps every site_settings key to:
 *  - its TS type
 *  - default value
 *  - admin page where it's edited
 *  - storefront consumers (files that read it)
 *
 * Used by:
 *  - scripts/audit-settings.mjs to detect mismatches
 *  - admin pages to validate keys before write
 *  - documentation/onboarding
 *
 * RULE: when you add a new key to site_settings, you MUST add it here.
 */

export type SettingType = "string" | "number" | "boolean" | "url" | "color" | "array" | "object" | "richtext";

export type SettingGroup =
  | "general"
  | "homepage"
  | "header"
  | "footer"
  | "theme"
  | "popup"
  | "ticker"
  | "trust_badges"
  | "social_proof"
  | "tax_settings"
  | "payment_methods"
  | "shipping_carriers"
  | "integrations";

export interface SettingDefinition {
  /** Path inside site_settings, e.g. "homepage.show_hero" */
  key: string;
  /** Top-level key in DB */
  group: SettingGroup;
  /** Leaf key inside the group's JSON */
  field: string;
  type: SettingType;
  default: unknown;
  /** Admin route where this is edited, e.g. "/admin/homepage" */
  adminPage: string;
  /** Files that consume this setting at runtime in the storefront */
  consumers: string[];
  /** Short human description (RO) */
  description: string;
  /** If true, key has no storefront effect by design (e.g. internal labels) */
  internalOnly?: boolean;
  /** If true, key is deprecated and should not be used */
  deprecated?: boolean;
}

const def = (
  group: SettingGroup,
  field: string,
  type: SettingType,
  defaultValue: unknown,
  adminPage: string,
  consumers: string[],
  description: string,
  flags: { internalOnly?: boolean; deprecated?: boolean } = {},
): SettingDefinition => ({
  key: `${group}.${field}`,
  group,
  field,
  type,
  default: defaultValue,
  adminPage,
  consumers,
  description,
  ...flags,
});

export const SETTINGS_REGISTRY: SettingDefinition[] = [
  // ─── GENERAL ────────────────────────────────────────────────────────────
  def("general", "site_name", "string", "Mama Lucica", "/admin/system", ["src/routes/__root.tsx", "src/components/SiteHeader.tsx", "src/components/SiteFooter.tsx"], "Numele site-ului afișat în header/title"),
  def("general", "site_tagline", "string", "Lumânări artizanale premium", "/admin/system", ["src/routes/__root.tsx"], "Slogan/tagline (meta description fallback)"),
  def("general", "logo_url", "url", "", "/admin/system", ["src/components/SiteHeader.tsx", "src/components/SiteFooter.tsx"], "URL logo principal"),
  def("general", "favicon_url", "url", "", "/admin/system", ["src/routes/__root.tsx"], "URL favicon"),
  def("general", "og_image_url", "url", "", "/admin/system", ["src/routes/__root.tsx"], "Imagine OpenGraph pentru share-uri sociale"),
  def("general", "contact_email", "string", "contact@mamalucica.ro", "/admin/system", ["src/routes/contact.tsx", "src/components/SiteFooter.tsx"], "Email contact public"),
  def("general", "contact_phone", "string", "+40753326405", "/admin/system", ["src/routes/contact.tsx", "src/components/SiteFooter.tsx"], "Telefon contact public"),
  def("general", "contact_address", "string", "România", "/admin/system", ["src/routes/contact.tsx", "src/components/SiteFooter.tsx"], "Adresă contact public"),
  def("general", "contact_schedule", "string", "Luni-Vineri 09:00-17:00", "/admin/system", ["src/routes/contact.tsx"], "Program contact"),
  def("general", "whatsapp_show", "boolean", false, "/admin/system", ["src/components/WhatsAppButton.tsx"], "Afișează buton WhatsApp"),
  def("general", "whatsapp_number", "string", "", "/admin/system", ["src/components/WhatsAppButton.tsx"], "Număr WhatsApp (ex: +40...)"),
  def("general", "whatsapp_message", "string", "Bună ziua!", "/admin/system", ["src/components/WhatsAppButton.tsx"], "Mesaj prepopulat WhatsApp"),
  def("general", "social_facebook", "url", "", "/admin/system", ["src/components/SiteFooter.tsx"], "URL Facebook"),
  def("general", "social_instagram", "url", "", "/admin/system", ["src/components/SiteFooter.tsx"], "URL Instagram"),
  def("general", "social_twitter", "url", "", "/admin/system", ["src/components/SiteFooter.tsx"], "URL Twitter/X"),
  def("general", "social_youtube", "url", "", "/admin/system", ["src/components/SiteFooter.tsx"], "URL YouTube"),
  def("general", "social_tiktok", "url", "", "/admin/system", ["src/components/SiteFooter.tsx"], "URL TikTok"),
  def("general", "social_pinterest", "url", "", "/admin/system", ["src/components/SiteFooter.tsx"], "URL Pinterest"),
  def("general", "free_shipping_min", "number", 200, "/admin/shipping", ["src/routes/checkout.tsx", "src/routes/cart.tsx"], "Prag livrare gratuită (RON)"),
  def("general", "default_shipping_cost", "number", 25, "/admin/shipping", ["src/routes/checkout.tsx", "src/routes/cart.tsx"], "Cost livrare standard (RON)"),
  def("general", "gift_wrapping_price", "number", 15, "/admin/checkout", ["src/routes/checkout.tsx"], "Preț ambalaj cadou (RON)"),
  def("general", "google_analytics_id", "string", "", "/admin/integrations", ["src/routes/__root.tsx"], "GA4 Measurement ID (G-XXXXX)"),
  def("general", "facebook_pixel_id", "string", "", "/admin/integrations", ["src/routes/__root.tsx"], "Facebook Pixel ID"),
  def("general", "maintenance_mode", "boolean", false, "/admin/system", ["src/routes/__root.tsx"], "Activează modul mentenanță"),
  def("general", "maintenance_message", "string", "Revenim în curând!", "/admin/system", ["src/routes/__root.tsx"], "Mesaj afișat în mentenanță"),
  def("general", "site_alert_enabled", "boolean", false, "/admin/system", ["src/components/SiteAlert.tsx"], "Activează banner alertă site-wide"),
  def("general", "site_alert_text", "string", "", "/admin/system", ["src/components/SiteAlert.tsx"], "Textul bannerului de alertă"),
  def("general", "site_alert_type", "string", "info", "/admin/system", ["src/components/SiteAlert.tsx"], "Tipul alertei (info/warning/success/error)"),
  def("general", "site_alert_dismissible", "boolean", false, "/admin/system", ["src/components/SiteAlert.tsx"], "Permite închiderea alertei"),
  def("general", "robots_txt", "richtext", "User-agent: *\nAllow: /", "/admin/system", ["src/routes/api/public/robots.ts"], "Conținut robots.txt"),
  def("general", "order_prefix", "string", "GS", "/admin/system", ["src/routes/checkout.tsx"], "Prefix număr comandă (ex: GS-1234)"),
  def("general", "order_email_notifications", "boolean", true, "/admin/system", ["src/routes/checkout.tsx"], "Trimite email confirmare comandă"),
  def("general", "smtp_from_name", "string", "Mamalucica.ro", "/admin/system", [], "Nume expeditor email", { internalOnly: true }),
  def("general", "smtp_from_email", "string", "comenzi@mamalucica.ro", "/admin/system", [], "Email expeditor", { internalOnly: true }),
  def("general", "currency", "string", "RON", "/admin/system", ["src/routes/checkout.tsx", "src/components/ProductGrid.tsx"], "Moneda magazinului"),
  def("general", "language", "string", "ro", "/admin/system", ["src/routes/__root.tsx"], "Limba site-ului (lang attr)"),
  def("general", "meta_title_suffix", "string", " — Mama Lucica", "/admin/system", ["src/routes/__root.tsx"], "Sufix adăugat la <title>"),
  def("general", "terms_page_slug", "string", "termeni-si-conditii", "/admin/pages", ["src/components/SiteFooter.tsx", "src/routes/checkout.tsx"], "Slug pagină Termeni"),
  def("general", "privacy_page_slug", "string", "politica-confidentialitate", "/admin/pages", ["src/components/SiteFooter.tsx"], "Slug pagină Confidențialitate"),
  def("general", "return_policy_slug", "string", "politica-retur", "/admin/pages", ["src/components/SiteFooter.tsx"], "Slug pagină Retur"),
  def("general", "company_name", "string", "SC Vomix Genius SRL", "/admin/system", ["src/components/SiteFooter.tsx"], "Denumire juridică"),
  def("general", "company_cui", "string", "43025661", "/admin/system", ["src/components/SiteFooter.tsx"], "CUI"),
  def("general", "reg_com", "string", "J2020000459343", "/admin/system", ["src/components/SiteFooter.tsx"], "Nr. Registrul Comerțului"),
  def("general", "company_address", "string", "", "/admin/system", ["src/components/SiteFooter.tsx"], "Adresă sediu"),
  def("general", "company_city", "string", "Furculești", "/admin/system", ["src/components/SiteFooter.tsx"], "Oraș sediu"),
  def("general", "company_county", "string", "Teleorman", "/admin/system", ["src/components/SiteFooter.tsx"], "Județ sediu"),
  def("general", "company_postal_code", "string", "147148", "/admin/system", ["src/components/SiteFooter.tsx"], "Cod poștal sediu"),
  // Deprecated/duplicates — păstrate pentru migrare ulterioară
  def("general", "free_shipping_threshold", "number", 150, "/admin/shipping", [], "DEPRECATED — folosește free_shipping_min", { deprecated: true }),
  def("general", "express_shipping_cost", "number", 30, "/admin/shipping", [], "DEPRECATED — neutilizat", { deprecated: true }),
  def("general", "low_stock_threshold", "number", 5, "/admin/stock", [], "DEPRECATED — folosește products.min_stock_alert", { deprecated: true }),
  def("general", "stock_alert_threshold", "number", 5, "/admin/stock", [], "DEPRECATED — folosește stock_alerts.min_threshold", { deprecated: true }),
  def("general", "vat_rate", "number", 19, "/admin/tax-settings", [], "DEPRECATED — folosește tax_settings.rate", { deprecated: true }),
  def("general", "vat_included", "boolean", false, "/admin/tax-settings", [], "DEPRECATED — folosește tax_settings.included", { deprecated: true }),

  // ─── HOMEPAGE ───────────────────────────────────────────────────────────
  def("homepage", "show_hero", "boolean", true, "/admin/homepage", ["src/components/HeroSection.tsx"], "Afișează secțiunea hero"),
  def("homepage", "hero_title", "string", "", "/admin/homepage", ["src/components/HeroSection.tsx"], "Titlu hero"),
  def("homepage", "hero_subtitle", "string", "", "/admin/homepage", ["src/components/HeroSection.tsx"], "Subtitlu hero"),
  def("homepage", "hero_cta_text", "string", "Descoperă", "/admin/homepage", ["src/components/HeroSection.tsx"], "Text buton CTA hero"),
  def("homepage", "hero_cta_url", "url", "/catalog", "/admin/homepage", ["src/components/HeroSection.tsx"], "Link CTA hero"),
  def("homepage", "hero_image_url", "url", "", "/admin/homepage", ["src/components/HeroSection.tsx"], "Imagine fundal hero"),
  def("homepage", "hero_overlay_opacity", "number", 0.6, "/admin/homepage", ["src/components/HeroSection.tsx"], "Opacitate overlay hero (0-1)"),
  def("homepage", "show_story", "boolean", true, "/admin/homepage", ["src/components/StorySection.tsx"], "Afișează secțiunea Poveste"),
  def("homepage", "story_label", "string", "", "/admin/homepage", ["src/components/StorySection.tsx"], "Eticheta de deasupra titlului"),
  def("homepage", "story_title", "string", "", "/admin/homepage", ["src/components/StorySection.tsx"], "Titlu poveste"),
  def("homepage", "story_text", "string", "", "/admin/homepage", ["src/components/StorySection.tsx"], "Text poveste"),
  def("homepage", "story_cta_text", "string", "", "/admin/homepage", ["src/components/StorySection.tsx"], "Text CTA poveste"),
  def("homepage", "story_cta_url", "url", "", "/admin/homepage", ["src/components/StorySection.tsx"], "Link CTA poveste"),
  def("homepage", "story_image_url", "url", "", "/admin/homepage", ["src/components/StorySection.tsx"], "Imagine poveste"),
  def("homepage", "show_products", "boolean", true, "/admin/homepage", ["src/components/ProductGrid.tsx"], "Afișează grila produse pe home"),
  def("homepage", "products_title", "string", "", "/admin/homepage", ["src/components/ProductGrid.tsx"], "Titlu grilă produse"),
  def("homepage", "products_subtitle", "string", "", "/admin/homepage", ["src/components/ProductGrid.tsx"], "Subtitlu grilă produse"),
  def("homepage", "show_collection_banners", "boolean", true, "/admin/homepage", ["src/components/CollectionBanners.tsx"], "Afișează bannere colecție"),
  def("homepage", "collection_label", "string", "", "/admin/homepage", ["src/components/CollectionBanners.tsx"], "Eticheta banner colecție"),
  def("homepage", "collection_title", "string", "", "/admin/homepage", ["src/components/CollectionBanners.tsx"], "Titlu banner colecție"),
  def("homepage", "collection_url", "url", "/catalog", "/admin/homepage", ["src/components/CollectionBanners.tsx"], "Link banner colecție"),
  def("homepage", "collection_image", "url", "", "/admin/homepage", ["src/components/CollectionBanners.tsx"], "Imagine banner colecție"),
  def("homepage", "clearance_title", "string", "", "/admin/homepage", ["src/components/CollectionBanners.tsx"], "Titlu banner stoc limitat"),
  def("homepage", "clearance_price", "string", "", "/admin/homepage", ["src/components/CollectionBanners.tsx"], "Preț banner stoc limitat"),
  def("homepage", "clearance_url", "url", "", "/admin/homepage", ["src/components/CollectionBanners.tsx"], "Link banner stoc limitat"),
  def("homepage", "show_how_to_buy", "boolean", true, "/admin/homepage", ["src/components/HowToBuy.tsx"], "Afișează secțiunea Cum cumperi"),
  def("homepage", "step1", "string", "", "/admin/homepage", ["src/components/HowToBuy.tsx"], "Text pasul 1"),
  def("homepage", "step2", "string", "", "/admin/homepage", ["src/components/HowToBuy.tsx"], "Text pasul 2"),
  def("homepage", "step3", "string", "", "/admin/homepage", ["src/components/HowToBuy.tsx"], "Text pasul 3"),

  // ─── HEADER ─────────────────────────────────────────────────────────────
  def("header", "show_search", "boolean", true, "/admin/header", ["src/components/SiteHeader.tsx"], "Afișează căutare în header"),
  def("header", "show_cart", "boolean", true, "/admin/header", ["src/components/SiteHeader.tsx"], "Afișează coș în header"),
  def("header", "show_favorites", "boolean", true, "/admin/header", ["src/components/SiteHeader.tsx"], "Afișează favorite în header"),
  def("header", "show_account", "boolean", true, "/admin/header", [], "Afișează cont în header", { deprecated: true }),
  def("header", "menu_items", "array", [], "/admin/header", [], "Items meniu principal", { deprecated: true }),
  def("header", "announcement", "string", "", "/admin/header", [], "Bandă anunț în top", { deprecated: true }),

  // ─── FOOTER ─────────────────────────────────────────────────────────────
  def("footer", "columns", "array", [], "/admin/footer", ["src/components/SiteFooter.tsx"], "Coloane personalizate footer"),
  def("footer", "payment_icons", "array", [], "/admin/footer", ["src/components/SiteFooter.tsx"], "Iconițe metode plată afișate"),
  def("footer", "copyright", "string", "", "/admin/footer", [], "Text copyright override", { deprecated: true }),
  def("footer", "newsletter_enabled", "boolean", true, "/admin/footer", [], "Newsletter în footer", { deprecated: true }),
  def("footer", "show_social", "boolean", true, "/admin/footer", [], "Iconițe sociale în footer", { deprecated: true }),

  // ─── THEME ──────────────────────────────────────────────────────────────
  // All theme.* keys are applied at runtime by src/hooks/useSiteSettings.tsx
  // via applyThemeVariables() → CSS custom properties on :root. They have no
  // direct per-component references, so we mark them internalOnly to prevent
  // false positives in the audit. Admin editor: /admin/theme.
  def("theme", "primary_color", "color", "#3d2c1f", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Culoare primară (→ --primary)", { internalOnly: true }),
  def("theme", "secondary_color", "color", "#f0ece6", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Culoare secundară (→ --secondary)", { internalOnly: true }),
  def("theme", "accent_color", "color", "#c4873a", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Culoare accent (→ --accent, --ring)", { internalOnly: true }),
  def("theme", "background_color", "color", "#f7f5f2", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Culoare fundal (→ --background)", { internalOnly: true }),
  def("theme", "foreground_color", "color", "#2d1f14", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Culoare text (→ --foreground)", { internalOnly: true }),
  def("theme", "card_color", "color", "#ffffff", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Culoare card (→ --card)", { internalOnly: true }),
  def("theme", "muted_color", "color", "#ebe7e0", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Culoare muted (→ --muted)", { internalOnly: true }),
  def("theme", "border_color", "color", "#e0dbd4", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Culoare border (→ --border, --input)", { internalOnly: true }),
  def("theme", "destructive_color", "color", "#c53030", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Culoare destructive (→ --destructive, --sale)", { internalOnly: true }),
  def("theme", "heading_font", "string", "Playfair Display", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Font titluri (→ --font-heading + Google Fonts)", { internalOnly: true }),
  def("theme", "body_font", "string", "Inter", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Font body (→ --font-body + Google Fonts)", { internalOnly: true }),
  def("theme", "border_radius", "string", "0.5", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Rază colțuri în rem (→ --radius)", { internalOnly: true }),
  def("theme", "button_style", "string", "rounded", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Stil butoane: rounded|pill|square (→ --button-radius)", { internalOnly: true }),
  def("theme", "product_card_shadow", "string", "sm", "/admin/theme", ["src/hooks/useSiteSettings.tsx"], "Umbră card produs: none|sm|md|lg (→ --product-card-shadow)", { internalOnly: true }),
  def("theme", "hero_overlay_opacity", "string", "0.6", "/admin/theme", [], "DUPLICAT — folosește homepage.hero_overlay_opacity", { deprecated: true }),
  def("theme", "badge_style", "string", "rounded", "/admin/theme", [], "Stil badge", { deprecated: true }),

  // ─── POPUP ──────────────────────────────────────────────────────────────
  def("popup", "show", "boolean", false, "/admin/popup", ["src/components/NewsletterPopup.tsx", "src/components/ExitIntentPopup.tsx"], "Activează popup newsletter"),
  def("popup", "title", "string", "10% REDUCERE", "/admin/popup", ["src/components/NewsletterPopup.tsx", "src/components/ExitIntentPopup.tsx"], "Titlu popup"),
  def("popup", "subtitle", "string", "", "/admin/popup", ["src/components/NewsletterPopup.tsx", "src/components/ExitIntentPopup.tsx"], "Subtitlu popup"),
  def("popup", "body_text", "string", "", "/admin/popup", ["src/components/NewsletterPopup.tsx", "src/components/ExitIntentPopup.tsx"], "Text descriere popup"),
  def("popup", "btn_text", "string", "Vreau reducerea", "/admin/popup", ["src/components/NewsletterPopup.tsx", "src/components/ExitIntentPopup.tsx"], "Text buton popup"),
  def("popup", "btn_color", "color", "#f97316", "/admin/popup", ["src/components/NewsletterPopup.tsx", "src/components/ExitIntentPopup.tsx"], "Culoare buton popup"),
  def("popup", "dismiss_text", "string", "Nu, mulțumesc", "/admin/popup", ["src/components/NewsletterPopup.tsx", "src/components/ExitIntentPopup.tsx"], "Text închidere popup"),
  def("popup", "discount_code", "string", "WELCOME10", "/admin/popup", ["src/components/NewsletterPopup.tsx"], "Cod reducere oferit"),
  def("popup", "delay_seconds", "number", 5, "/admin/popup", ["src/components/NewsletterPopup.tsx"], "Întârziere afișare (secunde)"),

  // ─── TICKER ─────────────────────────────────────────────────────────────
  def("ticker", "show", "boolean", true, "/admin/ticker", ["src/components/MarqueeBanner.tsx"], "Afișează bandă ticker"),
  def("ticker", "messages", "array", [], "/admin/ticker", ["src/components/MarqueeBanner.tsx"], "Mesaje rotative"),
  def("ticker", "speed", "number", 50, "/admin/ticker", ["src/components/MarqueeBanner.tsx"], "Viteza animație"),
  def("ticker", "text_color", "color", "#ffffff", "/admin/ticker", ["src/components/MarqueeBanner.tsx"], "Culoare text"),
  def("ticker", "background_color", "color", "#046b27", "/admin/ticker", ["src/components/MarqueeBanner.tsx"], "Culoare fundal"),

  // ─── TRUST BADGES ───────────────────────────────────────────────────────
  def("trust_badges", "enabled", "boolean", true, "/admin/trust-badges", ["src/components/TrustBadges.tsx"], "Activează insignele de încredere"),
  def("trust_badges", "badges", "array", [], "/admin/trust-badges", ["src/components/TrustBadges.tsx"], "Lista insigne"),

  // ─── SOCIAL PROOF ───────────────────────────────────────────────────────
  def("social_proof", "show", "boolean", false, "/admin/social-proof", ["src/components/SocialProofToast.tsx"], "Activează social proof toasts"),
  def("social_proof", "messages", "array", [], "/admin/social-proof", ["src/components/SocialProofToast.tsx"], "Mesaje rotative"),
  def("social_proof", "interval_seconds", "number", 12, "/admin/social-proof", ["src/components/SocialProofToast.tsx"], "Interval afișare (secunde)"),
];

/** Lookup helper: get definition by full key (e.g. "homepage.show_hero") */
export function getSetting(key: string): SettingDefinition | undefined {
  return SETTINGS_REGISTRY.find((s) => s.key === key);
}

/** All keys grouped by group */
export function getRegistryByGroup(): Record<string, SettingDefinition[]> {
  return SETTINGS_REGISTRY.reduce((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {} as Record<string, SettingDefinition[]>);
}

/** Default value snapshot for a group (useful for seeding) */
export function getDefaultsForGroup(group: SettingGroup): Record<string, unknown> {
  return SETTINGS_REGISTRY.filter((s) => s.group === group).reduce((acc, s) => {
    acc[s.field] = s.default;
    return acc;
  }, {} as Record<string, unknown>);
}
