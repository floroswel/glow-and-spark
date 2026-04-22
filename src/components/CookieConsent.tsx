import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "cookie_consent_v2";

interface Consent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) {
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch { /* SSR safety */ }
  }, []);

  const save = (c: Consent) => {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch {}
    setVisible(false);
  };

  const acceptAll = () => save({ necessary: true, analytics: true, marketing: true, savedAt: new Date().toISOString() });
  const rejectOptional = () => save({ necessary: true, analytics: false, marketing: false, savedAt: new Date().toISOString() });
  const saveCustom = () => save({ necessary: true, analytics, marketing, savedAt: new Date().toISOString() });

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 lg:bottom-4 lg:left-4 lg:right-auto lg:max-w-md animate-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center">
            <Cookie className="h-4.5 w-4.5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Cookies & confidențialitate</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Folosim cookie-uri pentru funcționalitate, analiză și marketing. Citește{" "}
              <a href="/page/politica-cookies" className="text-accent underline hover:no-underline">Politica Cookie</a>.
            </p>
          </div>
        </div>

        {details && (
          <div className="space-y-2.5 my-3 border-t border-border pt-3">
            <label className="flex items-center justify-between text-xs">
              <span><strong>Necesare</strong> — obligatorii pentru funcționare</span>
              <input type="checkbox" checked disabled className="accent-accent" />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span><strong>Analitice</strong> — ne ajută să îmbunătățim site-ul</span>
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="accent-accent" />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span><strong>Marketing</strong> — oferte personalizate</span>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="accent-accent" />
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={acceptAll}
            className="flex-1 min-w-[7rem] h-9 bg-foreground text-primary-foreground rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition"
          >
            Accept toate
          </button>
          {!details ? (
            <button
              onClick={() => setDetails(true)}
              className="flex-1 min-w-[7rem] h-9 border border-border text-foreground rounded-lg text-xs font-semibold hover:bg-secondary transition"
            >
              Setări
            </button>
          ) : (
            <button
              onClick={saveCustom}
              className="flex-1 min-w-[7rem] h-9 border border-border text-foreground rounded-lg text-xs font-semibold hover:bg-secondary transition"
            >
              Salvează alegerile
            </button>
          )}
          <button
            onClick={rejectOptional}
            className="text-xs text-muted-foreground underline hover:text-foreground self-center"
          >
            Refuză opționale
          </button>
        </div>
      </div>
    </div>
  );
}
