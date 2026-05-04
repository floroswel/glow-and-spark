import { useState, useEffect, useCallback, useRef } from "react";
import { Cookie } from "lucide-react";
import { CONSENT_POLICY_VERSION } from "@/config/marketing-tech";
import {
  getConsent,
  setConsent,
  resetConsent,
  hasConsent,
} from "@/lib/cmp/consentController";

/**
 * Re-export for backward compat — other files importing getConsent from here.
 */
export { getConsent } from "@/lib/cmp/consentController";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => setVisible(true), []);

  useEffect(() => {
    // Show banner if no consent stored
    if (!hasConsent()) {
      const timer = setTimeout(show, 1200);
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Listen for reset events to re-show banner
  useEffect(() => {
    const onReset = () => {
      setDetails(false);
      setAnalytics(false);
      setMarketing(false);
      setPreferences(false);
      setVisible(true);
    };
    window.addEventListener("cmp:reset", onReset);
    return () => window.removeEventListener("cmp:reset", onReset);
  }, []);

  // Focus trap: focus banner on open
  useEffect(() => {
    if (visible && bannerRef.current) {
      const firstBtn = bannerRef.current.querySelector("button");
      firstBtn?.focus();
    }
  }, [visible]);

  // ESC to close (reject optional)
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") acceptEssential();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  const acceptAll = () => {
    setConsent({ analytics: true, marketing: true }, "accept_all");
    setVisible(false);
  };

  const acceptEssential = () => {
    setConsent({ analytics: false, marketing: false }, "reject_optional");
    setVisible(false);
  };

  const saveCustom = () => {
    setConsent({ analytics, marketing }, "custom");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="Consimțământ cookie-uri"
      aria-modal="true"
      className="fixed bottom-0 left-0 right-0 z-[9999] p-3 lg:bottom-4 lg:left-4 lg:right-auto lg:max-w-md animate-in slide-in-from-bottom-4 duration-500"
    >
      <div className="rounded-xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center">
            <Cookie className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              Cookies & confidențialitate
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Folosim cookie-uri pentru funcționalitate, analiză și marketing.
              Citește{" "}
              <a
                href="/politica-cookies"
                className="text-accent underline hover:no-underline"
              >
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
              <input
                type="checkbox"
                checked
                disabled
                className="accent-accent"
              />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>
                <strong>Analitice</strong> — analiză trafic
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
                <strong>Marketing</strong> — pixeli publicitari
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
