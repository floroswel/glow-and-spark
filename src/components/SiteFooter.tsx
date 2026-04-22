import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "@tanstack/react-router";

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

  // Social links from general settings
  const socialLinks = [
    { key: "social_facebook", label: "Facebook", icon: "📘" },
    { key: "social_instagram", label: "Instagram", icon: "📷" },
    { key: "social_tiktok", label: "TikTok", icon: "🎵" },
    { key: "social_youtube", label: "YouTube", icon: "🎬" },
    { key: "social_pinterest", label: "Pinterest", icon: "📌" },
    { key: "social_twitter", label: "Twitter/X", icon: "🐦" },
  ].filter(s => general?.[s.key]);

  return (
    <footer className="border-t border-border" style={{ backgroundColor: footer?.footer_bg || "#1f1f1f", color: textColor }}>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footer?.col1_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: headingColor }}>{footer?.col1_title || "Informații utile"}</h4>
              <ul className="mt-4 space-y-2 text-sm">
                {renderLinks(footer?.col1_links)}
                {/* Default legal links for Romania if no links configured */}
                {(!footer?.col1_links || footer.col1_links.length === 0) && (
                  <>
                    <li><a href="/page/termeni-si-conditii" className="hover:opacity-80 transition" style={{ color: textColor }}>Termeni și Condiții</a></li>
                    <li><a href="/page/politica-confidentialitate" className="hover:opacity-80 transition" style={{ color: textColor }}>Politica de Confidențialitate</a></li>
                    <li><a href="/page/politica-retur" className="hover:opacity-80 transition" style={{ color: textColor }}>Politica de Retur</a></li>
                    <li><a href="/page/politica-cookies" className="hover:opacity-80 transition" style={{ color: textColor }}>Politica Cookie-uri</a></li>
                  </>
                )}
              </ul>
            </div>
          )}
          {footer?.col2_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: headingColor }}>{footer?.col2_title || "Contul meu"}</h4>
              <ul className="mt-4 space-y-2 text-sm">
                {(footer?.col2_links && footer.col2_links.length > 0) ? renderLinks(footer.col2_links) : (
                  <>
                    <li><Link to="/account" className="hover:opacity-80 transition" style={{ color: textColor }}>Contul meu</Link></li>
                    <li><Link to="/account/orders" className="hover:opacity-80 transition" style={{ color: textColor }}>Comenzile mele</Link></li>
                    <li><Link to="/wishlist" className="hover:opacity-80 transition" style={{ color: textColor }}>Favorite</Link></li>
                    <li><Link to="/track-order" className="hover:opacity-80 transition" style={{ color: textColor }}>Urmărește comanda</Link></li>
                  </>
                )}
              </ul>
            </div>
          )}
          {footer?.col3_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: headingColor }}>{footer?.col3_title || "Magazinul nostru"}</h4>
              <ul className="mt-4 space-y-2 text-sm">
                {(footer?.col3_links && footer.col3_links.length > 0) ? renderLinks(footer.col3_links) : (
                  <>
                    <li><Link to="/catalog" className="hover:opacity-80 transition" style={{ color: textColor }}>Catalog</Link></li>
                    <li><Link to="/blog" className="hover:opacity-80 transition" style={{ color: textColor }}>Blog</Link></li>
                    <li><Link to="/contact" className="hover:opacity-80 transition" style={{ color: textColor }}>Contact</Link></li>
                    <li><Link to="/faq" className="hover:opacity-80 transition" style={{ color: textColor }}>Întrebări Frecvente</Link></li>
                    <li><a href="/page/despre-noi" className="hover:opacity-80 transition" style={{ color: textColor }}>Despre Noi</a></li>
                  </>
                )}
              </ul>
            </div>
          )}
          {footer?.col4_show !== false && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: headingColor }}>{footer?.col4_title || "Suport clienți"}</h4>
              <ul className="mt-4 space-y-2 text-sm" style={{ color: textColor }}>
                <li>📞 {general?.contact_phone || "0800 123 456"}</li>
                <li>✉️ {general?.contact_email || "suport@lumini.ro"}</li>
                {general?.contact_schedule && <li>🕐 {general.contact_schedule}</li>}
                {general?.contact_address && <li>📍 {general.contact_address}</li>}
              </ul>

              {/* Social media links */}
              {socialLinks.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: headingColor }}>Urmărește-ne</p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map(s => (
                      <a
                        key={s.key}
                        href={general[s.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg px-2 py-1 text-sm hover:opacity-80 transition"
                        style={{ backgroundColor: "rgba(255,255,255,0.1)", color: textColor }}
                        title={s.label}
                      >
                        {s.icon} {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
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

      {/* ANPC & Legal - obligatoriu România */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 px-4 py-3 text-xs" style={{ color: textColor }}>
          <a href="https://anpc.ro/ce-este-anpc/pentru-consumatori/informatii-utile/reclamatii/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:opacity-80 transition" style={{ color: textColor }}>
            🛡️ ANPC – Reclamații
          </a>
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:opacity-80 transition" style={{ color: textColor }}>
            🇪🇺 SOL – Soluționare Online Litigii
          </a>
          <span>|</span>
          <a href="/page/termeni-si-conditii" className="hover:opacity-80 transition" style={{ color: textColor }}>
            Termeni
          </a>
          <a href="/page/politica-confidentialitate" className="hover:opacity-80 transition" style={{ color: textColor }}>
            GDPR
          </a>
          <a href="/page/politica-cookies" className="hover:opacity-80 transition" style={{ color: textColor }}>
            Cookie-uri
          </a>
        </div>
      </div>

      <div className="py-3 text-center text-xs" style={{ backgroundColor: footer?.footer_bottom_bg || "#181818", color: textColor, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {footer?.copyright_text || `© ${new Date().getFullYear()} LUMINI.RO - Toate drepturile rezervate`} | CUI: {footer?.cui || general?.invoice_cui || general?.cui || "RO12345678"}
      </div>
    </footer>
  );
}
