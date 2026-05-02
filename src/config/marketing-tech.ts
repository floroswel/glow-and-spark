/**
 * marketing-tech.ts — Single source of truth for all marketing/analytics platforms.
 *
 * Each platform is enabled ONLY when its ID is configured in site_settings.general.
 * Legal pages, cookie banners, and CSP must derive their vendor lists from this config.
 *
 * RULE: If a platform is not enabled here, it MUST NOT appear in:
 *  - Privacy Policy vendor list
 *  - Cookie Policy table
 *  - CookieConsent banner descriptions
 *  - CSP headers (except for always-allowed domains)
 */

export interface PlatformConfig {
  key: string;
  /** Display name for legal pages */
  label: string;
  /** Parent company for privacy policy recipient list */
  company: string;
  /** EU entity for GDPR data recipient section */
  euEntity: string;
  /** Consent category: "analytics" | "marketing" */
  consentCategory: "analytics" | "marketing";
  /** Whether this platform is enabled (has a configured ID) */
  enabled: boolean;
  /** The configured ID (pixel, measurement, tag, etc.) */
  configuredId: string | null;
  /** Whether CAPI / server-side integration is enabled */
  capiEnabled?: boolean;
  /** Link to vendor privacy policy */
  privacyUrl: string;
  /** Link to vendor DPA / data processing terms */
  dpaUrl: string;
  /** Cookie names set by this platform */
  cookies: Array<{
    name: string;
    purpose: string;
    duration: string;
  }>;
  /** Script domains loaded (for CSP) */
  scriptDomains: string[];
  /** Connect domains (for CSP connect-src) */
  connectDomains: string[];
}

/** All supported platforms — order matters for legal page rendering */
export const PLATFORM_REGISTRY: Omit<PlatformConfig, "enabled" | "configuredId" | "capiEnabled">[] = [
  {
    key: "meta",
    label: "Meta (Facebook / Instagram)",
    company: "Meta Platforms",
    euEntity: "Meta Platforms Ireland Ltd., Dublin, Irlanda",
    consentCategory: "marketing",
    privacyUrl: "https://www.facebook.com/privacy/policy/",
    dpaUrl: "https://www.facebook.com/legal/terms/dataprocessing",
    cookies: [
      { name: "_fbp", purpose: "Urmărire conversii, remarketing", duration: "3 luni" },
      { name: "_fbc", purpose: "Atribuirea click-urilor de pe Facebook", duration: "3 luni" },
    ],
    scriptDomains: ["https://connect.facebook.net"],
    connectDomains: ["https://www.facebook.com"],
  },
  {
    key: "ga4",
    label: "Google Analytics 4",
    company: "Google",
    euEntity: "Google Ireland Ltd., Dublin, Irlanda",
    consentCategory: "analytics",
    privacyUrl: "https://policies.google.com/privacy",
    dpaUrl: "https://business.safety.google/processorterms/",
    cookies: [
      { name: "_ga, _ga_*", purpose: "Identificare vizitatori unici, analiză trafic", duration: "2 ani" },
      { name: "_gid", purpose: "Distingerea vizitatorilor", duration: "24 ore" },
      { name: "_gat", purpose: "Limitarea ratei de solicitări", duration: "1 minut" },
    ],
    scriptDomains: ["https://www.googletagmanager.com", "https://www.google-analytics.com", "https://tagmanager.google.com"],
    connectDomains: ["https://www.google-analytics.com", "https://region1.google-analytics.com", "https://analytics.google.com", "https://stats.g.doubleclick.net"],
  },
  {
    key: "googleAds",
    label: "Google Ads",
    company: "Google",
    euEntity: "Google Ireland Ltd., Dublin, Irlanda",
    consentCategory: "marketing",
    privacyUrl: "https://policies.google.com/privacy",
    dpaUrl: "https://business.safety.google/processorterms/",
    cookies: [
      { name: "_gcl_au", purpose: "Atribuire conversii Google Ads", duration: "90 zile" },
    ],
    scriptDomains: ["https://www.googletagmanager.com", "https://googleads.g.doubleclick.net"],
    connectDomains: ["https://googleads.g.doubleclick.net"],
  },
  {
    key: "tiktok",
    label: "TikTok",
    company: "TikTok",
    euEntity: "TikTok Technology Ltd., Dublin, Irlanda",
    consentCategory: "marketing",
    privacyUrl: "https://www.tiktok.com/legal/page/global/privacy-policy",
    dpaUrl: "https://ads.tiktok.com/i18n/official/policy/business-products-terms",
    cookies: [
      { name: "_ttp", purpose: "Identificare vizitatori unici pentru remarketing TikTok", duration: "13 luni" },
      { name: "_tt_enable_cookie", purpose: "Verificarea suportului de cookie-uri", duration: "13 luni" },
      { name: "ttq_*", purpose: "Urmărire conversii și atribuire TikTok Ads", duration: "Sesiune / 13 luni" },
    ],
    scriptDomains: ["https://analytics.tiktok.com"],
    connectDomains: ["https://analytics.tiktok.com"],
  },
  {
    key: "pinterest",
    label: "Pinterest",
    company: "Pinterest",
    euEntity: "Pinterest Europe Ltd., Dublin, Irlanda",
    consentCategory: "marketing",
    privacyUrl: "https://policy.pinterest.com/privacy-policy",
    dpaUrl: "https://business.pinterest.com/pinterest-advertising-services-agreement/",
    cookies: [
      { name: "_pin_unauth", purpose: "Identificare vizitatori Pinterest", duration: "1 an" },
      { name: "_pinterest_ct_ua", purpose: "Urmărire conversii Pinterest", duration: "1 an" },
    ],
    scriptDomains: ["https://s.pinimg.com"],
    connectDomains: ["https://ct.pinterest.com"],
  },
  {
    key: "snapchat",
    label: "Snapchat",
    company: "Snap Inc.",
    euEntity: "Snap Group Ltd., Londra, Regatul Unit [VERIFICARE_AVOCAT — transferuri post-Brexit]",
    consentCategory: "marketing",
    privacyUrl: "https://snap.com/privacy/privacy-policy",
    dpaUrl: "https://snap.com/terms/snap-business-tools-terms",
    cookies: [
      { name: "_scid", purpose: "Urmărire conversii Snapchat", duration: "13 luni" },
      { name: "sc_at", purpose: "Atribuire click-uri Snapchat Ads", duration: "1 an" },
    ],
    scriptDomains: ["https://sc-static.net"],
    connectDomains: ["https://tr.snapchat.com"],
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    company: "LinkedIn (Microsoft)",
    euEntity: "LinkedIn Ireland Unlimited Company, Dublin, Irlanda",
    consentCategory: "marketing",
    privacyUrl: "https://www.linkedin.com/legal/privacy-policy",
    dpaUrl: "https://legal.linkedin.com/pages-joint-controller-addendum",
    cookies: [
      { name: "li_sugr", purpose: "Identificare vizitatori LinkedIn Ads", duration: "3 luni" },
      { name: "bcookie", purpose: "Funcționalitate browser LinkedIn", duration: "1 an" },
    ],
    scriptDomains: ["https://snap.licdn.com"],
    connectDomains: ["https://px.ads.linkedin.com"],
  },
  {
    key: "microsoftAds",
    label: "Microsoft Ads (Bing UET)",
    company: "Microsoft",
    euEntity: "Microsoft Ireland Operations Ltd., Dublin, Irlanda",
    consentCategory: "marketing",
    privacyUrl: "https://privacy.microsoft.com/privacystatement",
    dpaUrl: "https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA",
    cookies: [
      { name: "_uetmsclkid", purpose: "Atribuire click-uri Microsoft Ads", duration: "90 zile" },
      { name: "MUID", purpose: "Identificare utilizator Microsoft", duration: "13 luni" },
    ],
    scriptDomains: ["https://bat.bing.com"],
    connectDomains: ["https://bat.bing.com"],
  },
  {
    key: "clarity",
    label: "Microsoft Clarity",
    company: "Microsoft",
    euEntity: "Microsoft Ireland Operations Ltd., Dublin, Irlanda",
    consentCategory: "analytics",
    privacyUrl: "https://privacy.microsoft.com/privacystatement",
    dpaUrl: "https://learn.microsoft.com/clarity/setup-and-installation/clarity-privacy",
    cookies: [
      { name: "_clck", purpose: "Sesiune Clarity (heatmaps, recordings)", duration: "1 an" },
      { name: "_clsk", purpose: "Conectare click-uri și sesiuni Clarity", duration: "1 zi" },
    ],
    scriptDomains: ["https://www.clarity.ms"],
    connectDomains: ["https://www.clarity.ms"],
  },
];

/** Essential (always-on) cookies — not dependent on any platform */
export const ESSENTIAL_COOKIES = [
  { name: "sb-*-auth-token", provider: "mamalucica.ro", purpose: "Sesiune de autentificare utilizator", duration: "1 an" },
  { name: "__cf_bm", provider: "Cloudflare", purpose: "Protecție anti-bot și securitate", duration: "30 min" },
  { name: "cookie_consent", provider: "mamalucica.ro (localStorage)", purpose: "Memorarea preferințelor de cookie", duration: "Permanent (localStorage)" },
];

/** Current consent policy version — bump when privacy/cookie policy changes materially */
export const CONSENT_POLICY_VERSION = "2026-05-02-v2";

/**
 * Resolve enabled platforms from site_settings.general.
 * Call this with the `general` object from useSiteSettings().
 */
export function resolveEnabledPlatforms(general: Record<string, any> | undefined): PlatformConfig[] {
  if (!general) return [];

  const idMap: Record<string, { idKey: string; capiKey?: string }> = {
    meta: { idKey: "facebook_pixel_id", capiKey: "meta_capi_enabled" },
    ga4: { idKey: "google_analytics_id" },
    googleAds: { idKey: "google_ads_id" },
    tiktok: { idKey: "tiktok_pixel_id", capiKey: "tiktok_capi_enabled" },
    pinterest: { idKey: "pinterest_tag_id" },
    snapchat: { idKey: "snapchat_pixel_id" },
    linkedin: { idKey: "linkedin_partner_id" },
    microsoftAds: { idKey: "microsoft_uet_id" },
    clarity: { idKey: "clarity_id" },
  };

  return PLATFORM_REGISTRY.map((platform) => {
    const mapping = idMap[platform.key];
    const envFallbacks: Record<string, string> = {
      meta: "VITE_FB_PIXEL_ID",
      ga4: "VITE_GTM_ID",
      tiktok: "VITE_TIKTOK_PIXEL_ID",
    };

    let configuredId: string | null = null;
    if (mapping) {
      configuredId = general[mapping.idKey] || null;
      // Env var fallback for core platforms
      if (!configuredId && envFallbacks[platform.key] && typeof import.meta !== "undefined") {
        try {
          configuredId = (import.meta as any).env?.[envFallbacks[platform.key]] || null;
        } catch { /* SSR safety */ }
      }
    }

    return {
      ...platform,
      enabled: !!configuredId,
      configuredId,
      capiEnabled: mapping?.capiKey ? !!general[mapping.capiKey] : undefined,
    };
  });
}

/**
 * Get only enabled platforms, optionally filtered by consent category.
 */
export function getEnabledPlatforms(
  general: Record<string, any> | undefined,
  category?: "analytics" | "marketing"
): PlatformConfig[] {
  const all = resolveEnabledPlatforms(general);
  const enabled = all.filter((p) => p.enabled);
  if (category) return enabled.filter((p) => p.consentCategory === category);
  return enabled;
}
