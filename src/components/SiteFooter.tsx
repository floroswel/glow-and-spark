import { useSiteSettings } from "@/hooks/useSiteSettings";

export function SiteFooter() {
  const { footer, general } = useSiteSettings();
  if (footer?.show === false) return null;

  const renderLinks = (links: any[]) =>
    (links || []).map((link: any, i: number) => (
      <li key={i}>
        <a href={link.url} className="hover:text-foreground transition">
          {link.label}
        </a>
      </li>
    ));

  return (
    <footer className="border-t border-border" style={{ backgroundColor: footer?.footer_bg, color: footer?.footer_text_color }}>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footer?.col1_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">{footer?.col1_title || "Informații utile"}</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">{renderLinks(footer?.col1_links)}</ul>
            </div>
          )}
          {footer?.col2_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">{footer?.col2_title || "Contul meu"}</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">{renderLinks(footer?.col2_links)}</ul>
            </div>
          )}
          {footer?.col3_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">{footer?.col3_title || "Magazinul nostru"}</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">{renderLinks(footer?.col3_links)}</ul>
            </div>
          )}
          {footer?.col4_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">{footer?.col4_title || "Suport clienți"}</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>📞 {general?.contact_phone || "0800 123 456"}</li>
                <li>✉️ {general?.contact_email || "suport@lumini.ro"}</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {footer?.show_delivery_badges !== false && (
        <div className="border-t border-border/20">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="font-semibold">LIVRARE:</span>
              {(footer?.delivery_badges || ["DPD", "Fan Courier", "Cargus"]).map((b: string) => (
                <span key={b} className="rounded bg-secondary px-2 py-0.5">{b}</span>
              ))}
            </div>
            {footer?.show_payment_icons !== false && (
              <div className="flex items-center gap-3">
                <span className="font-semibold">PLATĂ SECURIZATĂ:</span>
                {(footer?.payment_icons || ["VISA", "MASTERCARD", "PAYPAL", "RAMBURS"]).map((p: string) => (
                  <span key={p} className="rounded bg-secondary px-2 py-0.5">{p}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-border/20 py-3 text-center text-xs text-muted-foreground" style={{ backgroundColor: footer?.footer_bottom_bg }}>
        {footer?.copyright_text || "© 2026 LUMINI.RO - Toate drepturile rezervate"} | CUI: {footer?.cui || general?.cui || "RO12345678"}
      </div>
    </footer>
  );
}
