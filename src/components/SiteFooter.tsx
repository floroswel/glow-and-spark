import { useSiteSettings } from "@/hooks/useSiteSettings";

export function SiteFooter() {
  const { footer, general } = useSiteSettings();
  if (footer?.show === false) return null;

  const textColor = footer?.footer_text_color || "#d4d4d4";
  const headingColor = "#ffffff";

  const renderLinks = (links: any[]) =>
    (links || []).map((link: any, i: number) => (
      <li key={i}>
        <a href={link.url} className="hover:opacity-80 transition" style={{ color: textColor }}>
          {link.label}
        </a>
      </li>
    ));

  return (
    <footer className="border-t border-border" style={{ backgroundColor: footer?.footer_bg || "#1f1f1f", color: textColor }}>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footer?.col1_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: headingColor }}>{footer?.col1_title || "Informații utile"}</h4>
              <ul className="mt-4 space-y-2 text-sm">{renderLinks(footer?.col1_links)}</ul>
            </div>
          )}
          {footer?.col2_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: headingColor }}>{footer?.col2_title || "Contul meu"}</h4>
              <ul className="mt-4 space-y-2 text-sm">{renderLinks(footer?.col2_links)}</ul>
            </div>
          )}
          {footer?.col3_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: headingColor }}>{footer?.col3_title || "Magazinul nostru"}</h4>
              <ul className="mt-4 space-y-2 text-sm">{renderLinks(footer?.col3_links)}</ul>
            </div>
          )}
          {footer?.col4_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: headingColor }}>{footer?.col4_title || "Suport clienți"}</h4>
              <ul className="mt-4 space-y-2 text-sm" style={{ color: textColor }}>
                <li>📞 {general?.contact_phone || "0800 123 456"}</li>
                <li>✉️ {general?.contact_email || "suport@lumini.ro"}</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {footer?.show_delivery_badges !== false && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs" style={{ color: textColor }}>
            <div className="flex items-center gap-3">
              <span className="font-semibold">LIVRARE:</span>
              {(footer?.delivery_badges || ["DPD", "Fan Courier", "Cargus"]).map((b: string) => (
                <span key={b} className="rounded px-2 py-0.5" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>{b}</span>
              ))}
            </div>
            {footer?.show_payment_icons !== false && (
              <div className="flex items-center gap-3">
                <span className="font-semibold">PLATĂ SECURIZATĂ:</span>
                {(footer?.payment_icons || ["VISA", "MASTERCARD", "PAYPAL", "RAMBURS"]).map((p: string) => (
                  <span key={p} className="rounded px-2 py-0.5" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="py-3 text-center text-xs" style={{ backgroundColor: footer?.footer_bottom_bg || "#181818", color: textColor, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {footer?.copyright_text || "© 2026 LUMINI.RO - Toate drepturile rezervate"} | CUI: {footer?.cui || general?.cui || "RO12345678"}
      </div>
    </footer>
  );
}