import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

export function NewsletterPopup() {
  const { popup } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Respect admin settings: only show if popup is enabled
  // Admin scrie `show`; păstrăm fallback la `enabled` pentru retrocompatibilitate
  const isEnabled = popup?.show !== false && popup?.enabled !== false;
  const delay = (popup?.delay_seconds || 5) * 1000;
  const title = popup?.title || "10% REDUCERE";
  const subtitle = popup?.subtitle || "La prima comandă";
  const description = popup?.body_text || popup?.description || "Abonează-te și primești un cod de 10% reducere + acces la vânzările private.";
  const buttonText = popup?.btn_text || popup?.button_text || "VREAU REDUCEREA DE 10%";
  const buttonColor: string | undefined = popup?.btn_color;
  const dismissText = popup?.dismiss_text || "Nu, mulțumesc. Renunț la reducere.";
  const discountCode = popup?.discount_code || "";

  useEffect(() => {
    if (!isEnabled) return;

    // Don't show if already shown this session or if user already subscribed
    const alreadyShown = sessionStorage.getItem("newsletter_popup_shown");
    const alreadySubscribed = localStorage.getItem("newsletter_subscribed");
    if (alreadyShown || alreadySubscribed) return;

    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem("newsletter_popup_shown", "1");
    }, delay);
    return () => clearTimeout(timer);
  }, [isEnabled, delay]);

  const handleClose = () => setOpen(false);

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Te rog introdu o adresă de email validă.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: email.trim().toLowerCase(),
      source: "popup",
      discount_code: discountCode || null,
      is_active: true,
    });

    if (error) {
      if (error.code === "23505") {
        // Already subscribed
        setStatus("success");
        localStorage.setItem("newsletter_subscribed", "1");
      } else {
        setErrorMsg("A apărut o eroare. Te rog încearcă din nou.");
        setStatus("error");
      }
    } else {
      setStatus("success");
      localStorage.setItem("newsletter_subscribed", "1");
    }
  };

  if (!open || !isEnabled) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-[450px] max-w-[90vw] overflow-hidden rounded-xl bg-card shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-muted transition"
          aria-label="Închide"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-foreground p-8 text-center text-primary-foreground">
          <p className="font-heading text-3xl font-bold">{title}</p>
          <p className="mt-1 text-sm uppercase tracking-wider text-accent">{subtitle}</p>
        </div>

        <div className="p-6 text-center">
          {status === "success" ? (
            <div className="space-y-3">
              <div className="text-4xl">🎉</div>
              <p className="text-lg font-semibold text-foreground">Mulțumim pentru abonare!</p>
              {discountCode && (
                <div className="rounded-lg border-2 border-dashed border-accent bg-accent/5 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Codul tău de reducere:</p>
                  <p className="font-heading text-2xl font-bold text-accent">{discountCode}</p>
                </div>
              )}
              <button
                onClick={handleClose}
                className="mt-2 text-sm text-accent hover:underline"
              >
                Continuă cumpărăturile →
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">Fii primul care află!</p>
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus("idle"); setErrorMsg(""); }}
                placeholder="Adresa ta de email..."
                className="mt-4 w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
              />
              {errorMsg && <p className="mt-1 text-xs text-destructive">{errorMsg}</p>}
              <button
                onClick={handleSubscribe}
                disabled={status === "loading"}
                className="mt-3 w-full rounded-lg py-2.5 text-sm font-bold uppercase text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
                style={buttonColor ? { backgroundColor: buttonColor, color: "#fff" } : undefined}
              >
                {status === "loading" ? "Se procesează..." : buttonText}
              </button>
              <button
                onClick={handleClose}
                className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
              >
                {dismissText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
