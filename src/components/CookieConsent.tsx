import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (type: "all" | "essential") => {
    localStorage.setItem("cookie_consent", JSON.stringify({ type, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-5 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-accent/15">
            <Cookie className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm">🍪 Acest site folosește cookie-uri</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Folosim cookie-uri esențiale pentru funcționarea site-ului și cookie-uri analitice pentru a îmbunătăți experiența ta. 
              Citește{" "}
              <Link to="/page/$slug" params={{ slug: "politica-cookies" }} className="text-accent hover:underline">
                Politica de Cookie-uri
              </Link>{" "}
              pentru mai multe detalii.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => accept("all")}
                className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition"
              >
                Accept toate
              </button>
              <button
                onClick={() => accept("essential")}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary transition"
              >
                Doar esențiale
              </button>
            </div>
          </div>
          <button onClick={() => setVisible(false)} className="shrink-0 text-muted-foreground hover:text-foreground transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
