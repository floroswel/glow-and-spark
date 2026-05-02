import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONSENT_POLICY_VERSION } from "@/config/marketing-tech";

export const CONSENT_KEY = "cookie_consent";

export interface CookieConsentData {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  date: string;
  version: string;
}

export function getConsent(): CookieConsentData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      essential: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      date: parsed.date || new Date().toISOString(),
      version: parsed.version || "unknown",
    };
  } catch {
    return null;
  }
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = sessionStorage.getItem("_consent_sid");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("_consent_sid", sid);
    }
    return sid;
  } catch {
    return crypto.randomUUID();
  }
}

async function persistConsent(consent: CookieConsentData, action: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("marketing_consents" as any).insert({
      user_id: user?.id || null,
      session_id: getSessionId(),
      policy_version: consent.version,
      categories: {
        essential: true,
        analytics: consent.analytics,
        marketing: consent.marketing,
      },
      action,
    });
  } catch {
    // Non-blocking — consent is still recorded in localStorage
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) {
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      /* SSR safety */
    }
  }, []);

  const save = (c: CookieConsentData, action: string) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
      window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: c }));
    } catch {}
    persistConsent(c, action);
    setVisible(false);
  };

  const now = () => new Date().toISOString();
  const ver = CONSENT_POLICY_VERSION;

  const acceptAll = () => save({ essential: true, analytics: true, marketing: true, date: now(), version: ver }, "accept_all");
  const acceptEssential = () => save({ essential: true, analytics: false, marketing: false, date: now(), version: ver }, "reject_optional");
  const saveCustom = () => save({ essential: true, analytics, marketing, date: now(), version: ver }, "custom");

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 lg:bottom-4 lg:left-4 lg:right-auto lg:max-w-md animate-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center">
            <Cookie className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Cookies & confidențialitate</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Folosim cookie-uri pentru funcționalitate, analiză și marketing. Citește{" "}
              <a href="/politica-cookies" className="text-accent underline hover:no-underline">
                Politica Cookie
              </a>
              .
            </p>
          </div>
        </div>

        {details && (
          <div className="space-y-2.5 my-3 border-t border-border pt-3">
            <label className="flex items-center justify-between text-xs">
              <span>
                <strong>Esențiale</strong> — obligatorii pentru funcționare
              </span>
              <input type="checkbox" checked disabled className="accent-accent" />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>
                <strong>Analitice</strong> — analiză trafic (doar dacă sunt configurate de admin)
              </span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="accent-accent"
              />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>
                <strong>Marketing</strong> — pixeli publicitari (doar dacă sunt configurați de admin)
              </span>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="accent-accent"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={acceptAll}
            className="flex-1 min-w-[7rem] h-9 bg-foreground text-primary-foreground rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition"
          >
            Acceptă toate
          </button>
          {!details ? (
            <>
              <button
                onClick={() => setDetails(true)}
                className="flex-1 min-w-[7rem] h-9 border border-border text-foreground rounded-lg text-xs font-semibold hover:bg-secondary transition"
              >
                Personalizează
              </button>
              <button
                onClick={acceptEssential}
                className="flex-1 min-w-[7rem] h-9 border border-border text-muted-foreground rounded-lg text-xs font-semibold hover:bg-secondary hover:text-foreground transition"
              >
                Doar esențiale
              </button>
            </>
          ) : (
            <button
              onClick={saveCustom}
              className="flex-1 min-w-[7rem] h-9 border border-border text-foreground rounded-lg text-xs font-semibold hover:bg-secondary transition"
            >
              Salvează alegerile
            </button>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
          Versiune politică: {CONSENT_POLICY_VERSION}
        </p>
      </div>
    </div>
  );
}
