import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Phone, Check } from "lucide-react";

export function TopBar() {
  const { header, general } = useSiteSettings();
  const { user } = useAuth();

  if (!header?.show_topbar) return null;

  const phone = general?.contact_phone;
  const freeShippingThreshold = general?.free_shipping_min || "150";
  const welcomeText = header?.topbar_text || "Bine ai venit pe";
  const siteName = general?.site_name || "Lumini.ro";

  return (
    <>
      {/* LAYER 1 — Dark topbar */}
      <div className="hidden md:block bg-foreground text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-8 text-[11px]">
          <div className="flex items-center gap-4">
            <span>{welcomeText} <strong>{siteName}</strong>!</span>
            <Link to="/account" className="hover:underline opacity-80 hover:opacity-100 transition">
              {user ? "Contul meu" : "Autentificare"}
            </Link>
            <span className="opacity-30">|</span>
            <Link to="/track-order" className="hover:underline opacity-80 hover:opacity-100 transition">
              Urmărește comanda
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-60">{header?.topbar_right || "RO / RON"}</span>
          </div>
        </div>
      </div>

      {/* LAYER 2 — White utility bar */}
      <div className="hidden md:block bg-card border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-9 text-xs">
          <div className="flex items-center gap-1.5 text-green-700">
            <Check className="h-3.5 w-3.5" />
            <span>Livrare gratuită peste <strong>{freeShippingThreshold} RON</strong></span>
          </div>
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-accent transition"
            >
              <Phone className="h-3.5 w-3.5" />
              Suport: {phone}
            </a>
          )}
        </div>
      </div>
    </>
  );
}
