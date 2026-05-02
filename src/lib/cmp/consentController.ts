/**
 * consentController.ts — Single module for all CMP operations.
 *
 * Exports: getConsent, setConsent, resetConsent, applyConsentToTags
 *
 * Storage namespace: mamalucica_cmp_v1
 * Legacy key "cookie_consent" is migrated on first read, then removed.
 *
 * DISCLAIMER: Legal interpretation of consent logging retention belongs
 * to Romanian counsel; engineering provides mechanisms + configurability.
 */

import { supabase } from "@/integrations/supabase/client";
import { CONSENT_POLICY_VERSION, PLATFORM_REGISTRY } from "@/config/marketing-tech";

/* ─── Types ─── */
export interface ConsentCategories {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentRecord {
  version: string;
  timestamp: string;
  categories: ConsentCategories;
}

/* ─── Storage namespace ─── */
const CMP_KEY = "mamalucica_cmp_v1";
const LEGACY_KEY = "cookie_consent"; // old key, migrated automatically
const SESSION_KEY = "_consent_sid";
const CMP_DEBUG = typeof window !== "undefined" && (window as any).__CMP_DEBUG === true;

function debugLog(...args: any[]) {
  if (CMP_DEBUG) console.log("[CMP]", ...args);
}

/* ─── Session ID ─── */
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return crypto.randomUUID();
  }
}

/* ─── Read consent (with legacy migration) ─── */
export function getConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    // Try current namespace first
    let raw = localStorage.getItem(CMP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ConsentRecord;
      debugLog("Read consent:", parsed);
      return parsed;
    }

    // Migrate legacy key
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy);
      const migrated: ConsentRecord = {
        version: old.version || CONSENT_POLICY_VERSION,
        timestamp: old.date || new Date().toISOString(),
        categories: {
          necessary: true,
          analytics: !!old.analytics,
          marketing: !!old.marketing,
        },
      };
      localStorage.setItem(CMP_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_KEY);
      debugLog("Migrated legacy consent:", migrated);
      return migrated;
    }

    return null;
  } catch {
    return null;
  }
}

/* ─── Write consent ─── */
export function setConsent(
  categories: Omit<ConsentCategories, "necessary">,
  action: string
): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_POLICY_VERSION,
    timestamp: new Date().toISOString(),
    categories: { necessary: true, ...categories },
  };

  try {
    localStorage.setItem(CMP_KEY, JSON.stringify(record));
    // Remove legacy key if present
    localStorage.removeItem(LEGACY_KEY);
  } catch {}

  debugLog("Set consent:", action, record);

  // Dispatch event for TrackingInit and other listeners
  window.dispatchEvent(
    new CustomEvent("cmp:consent-changed", { detail: record })
  );
  // Legacy event for backward compat
  window.dispatchEvent(
    new CustomEvent("cookie-consent-changed", {
      detail: {
        essential: true,
        analytics: record.categories.analytics,
        marketing: record.categories.marketing,
        date: record.timestamp,
        version: record.version,
      },
    })
  );

  // Persist to DB (non-blocking)
  persistToDb(record, action);

  // Apply/remove tags immediately
  applyConsentToTags(record);

  return record;
}

/* ─── Reset consent ─── */
export function resetConsent(): void {
  debugLog("Reset consent requested");

  const previousConsent = getConsent();

  // 1. Clear CMP storage
  try {
    localStorage.removeItem(CMP_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {}

  // 2. Tear down non-essential scripts
  teardownNonEssentialScripts();

  // 3. Vendor revoke APIs (best-effort)
  revokeVendorConsent();

  // 4. Dispatch reset event
  window.dispatchEvent(new CustomEvent("cmp:reset"));
  window.dispatchEvent(
    new CustomEvent("cookie-consent-changed", { detail: null })
  );
  window.dispatchEvent(
    new CustomEvent("cmp:consent-changed", { detail: null })
  );

  // 5. Audit log if there was a previous accept
  if (previousConsent) {
    persistToDb(
      {
        version: CONSENT_POLICY_VERSION,
        timestamp: new Date().toISOString(),
        categories: { necessary: true, analytics: false, marketing: false },
      },
      "reset_requested"
    );
  }

  debugLog("Reset complete — banner should re-appear");
}

/* ─── Apply consent to script tags ─── */
export function applyConsentToTags(consent: ConsentRecord | null): void {
  if (typeof window === "undefined") return;
  if (!consent) return;

  debugLog("Applying consent to tags:", consent.categories);

  // If analytics or marketing revoked, tear down those scripts
  if (!consent.categories.analytics && !consent.categories.marketing) {
    teardownNonEssentialScripts();
  } else if (!consent.categories.analytics) {
    teardownByCategory("analytics");
  } else if (!consent.categories.marketing) {
    teardownByCategory("marketing");
  }
}

/* ─── Script teardown ─── */
const MARKETING_SCRIPT_PATTERNS = [
  /connect\.facebook\.net/,
  /facebook\.com\/tr/,
  /analytics\.tiktok\.com/,
  /googleads\.g\.doubleclick\.net/,
  /s\.pinimg\.com/,
  /sc-static\.net/,
  /snap\.licdn\.com/,
  /bat\.bing\.com/,
];

const ANALYTICS_SCRIPT_PATTERNS = [
  /googletagmanager\.com/,
  /google-analytics\.com/,
  /clarity\.ms/,
];

function teardownNonEssentialScripts(): void {
  teardownByPatterns([...MARKETING_SCRIPT_PATTERNS, ...ANALYTICS_SCRIPT_PATTERNS]);
  clearVendorCookies();
}

function teardownByCategory(category: "analytics" | "marketing"): void {
  const patterns =
    category === "marketing"
      ? MARKETING_SCRIPT_PATTERNS
      : ANALYTICS_SCRIPT_PATTERNS;
  teardownByPatterns(patterns);
}

function teardownByPatterns(patterns: RegExp[]): void {
  if (typeof document === "undefined") return;

  // Remove script tags
  const scripts = document.querySelectorAll("script[src]");
  scripts.forEach((el) => {
    const src = el.getAttribute("src") || "";
    if (patterns.some((p) => p.test(src))) {
      debugLog("Removing script:", src);
      el.remove();
    }
  });

  // Remove iframes (tracking pixels)
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((el) => {
    const src = el.getAttribute("src") || "";
    if (patterns.some((p) => p.test(src))) {
      debugLog("Removing iframe:", src);
      el.remove();
    }
  });

  // Remove noscript img pixels
  const imgs = document.querySelectorAll('img[src*="facebook.com/tr"], img[src*="analytics.tiktok.com"]');
  imgs.forEach((el) => {
    debugLog("Removing pixel img:", el.getAttribute("src"));
    el.remove();
  });
}

function clearVendorCookies(): void {
  if (typeof document === "undefined") return;
  // Best-effort: clear known vendor cookies
  const vendorPrefixes = ["_fbp", "_fbc", "_ga", "_gid", "_gat", "_gcl", "_ttp", "_tt_", "_pin", "_scid", "sc_at", "_clck", "_clsk", "li_sugr", "MUID", "_uet"];
  const cookies = document.cookie.split(";");
  for (const c of cookies) {
    const name = c.split("=")[0]?.trim();
    if (name && vendorPrefixes.some((p) => name.startsWith(p))) {
      debugLog("Clearing cookie:", name);
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

/* ─── Vendor revoke APIs (best-effort) ─── */
function revokeVendorConsent(): void {
  try {
    // Google Consent Mode v2 — revoke
    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      debugLog("Google Consent Mode: denied");
    }

    // GTM dataLayer reset
    if (Array.isArray((window as any).dataLayer)) {
      (window as any).dataLayer.push({
        event: "consent_revoked",
        consent_categories: { analytics: false, marketing: false },
      });
      debugLog("GTM dataLayer: consent_revoked pushed");
    }

    // Meta — fbq revoke (if available)
    if (typeof (window as any).fbq === "function") {
      (window as any).fbq("consent", "revoke");
      debugLog("Meta fbq: consent revoked");
    }

    // TikTok — no official revoke API, just stop tracking
    // [VERIFY_VENDOR_DOCS] — TikTok pixel has no documented revoke method
    debugLog("TikTok: no vendor revoke API; script removed instead");
  } catch (e) {
    debugLog("Vendor revoke error (non-fatal):", e);
  }
}

/* ─── DB persistence (non-blocking) ─── */
async function persistToDb(record: ConsentRecord, action: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("cookie_consent_log" as any).insert({
      user_id: user?.id || null,
      session_id: getSessionId(),
      action,
      categories: record.categories,
      policy_version: record.version,
    });
    debugLog("DB persisted:", action);
  } catch (e) {
    debugLog("DB persist failed (non-fatal):", e);
  }
}

/* ─── Utilities for external use ─── */
export function hasConsent(): boolean {
  return getConsent() !== null;
}

export function isCategoryAllowed(category: "analytics" | "marketing"): boolean {
  const consent = getConsent();
  if (!consent) return false;
  return consent.categories[category] === true;
}
