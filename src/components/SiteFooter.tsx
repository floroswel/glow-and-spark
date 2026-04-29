import { useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { ChevronDown, Phone, Mail, Clock, MessageCircle, MapPin, FileText, Building2, Shield } from "lucide-react";

/* Inline social SVG icons */
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.27 0 .54.04.8.1v-3.5a6.37 6.37 0 0 0-.8-.05A6.34 6.34 0 0 0 3.15 15.3 6.34 6.34 0 0 0 9.49 21.5a6.34 6.34 0 0 0 6.34-6.34V8.59a8.24 8.24 0 0 0 3.76.92V6.69Z"/></svg>
);
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
);

/* ── Accordion Column (mobile) ── */
function FooterColumn({ title, children, titleColor }: { title: string; children: React.ReactNode; titleColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 md:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 md:py-0 md:pointer-events-none"
        aria-expanded={open}
      >
        <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: titleColor }}>{title}</h4>
        <ChevronDown className={`h-5 w-5 text-white/60 md:hidden transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`${open ? "block" : "hidden"} md:block pb-4 md:pb-0 mt-0 md:mt-4`}>
        {children}
      </div>
    </div>
  );
}

/* ── Newsletter Section ── */
function FooterNewsletter({ accentColor }: { accentColor: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || !email) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: email.toLowerCase().trim(),
        source: "footer",
      });
      if (error && !String(error.message).includes("duplicate")) throw error;
      toast.success("Te-ai abonat cu succes!");
      setEmail("");
      setConsent(false);
    } catch {
      toast.error("Eroare la abonare. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: accentColor }} className="text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="max-w-xl">
          <h3 className="text-2xl font-bold mb-1">Newsletter</h3>
          <p className="text-white text-sm mb-4">Nu rata ofertele și promoțiile noastre</p>
          <form onSubmit={submit} className="space-y-2">
            <div className="flex gap-0">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresa de email"
                className="flex-1 h-12 px-4 bg-white text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none rounded-l-md"
              />
              <button
                type="submit"
                disabled={loading || !consent || !email}
                className="px-6 h-12 font-bold text-sm bg-gray-900 text-white disabled:opacity-40 hover:bg-gray-800 transition-colors rounded-r-md"
              >
                {loading ? "..." : "Abonează-te"}
              </button>
            </div>
            <label className="flex items-start gap-2 text-xs text-white cursor-pointer leading-snug">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-white shrink-0"
              />
              <span>
                Sunt de acord sa primesc informatii cu promotiile magazinului. Afla mai multe in{" "}
                <a href="/page/politica-confidentialitate" className="underline hover:text-white">
                  Politica de Confidentialitate
                </a>
              </span>
            </label>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Payment Icons (SVG-based pills) ── */
function PaymentPill({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center h-8 px-2.5 rounded bg-white text-[10px] font-bold tracking-wider text-slate-800 shadow-sm"
    >
      {children}
    </span>
  );
}

function PaymentIcons({ icons }: { icons: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {icons.map((icon) => {
        switch (icon.toUpperCase()) {
          case "VISA":
            return <PaymentPill key={icon} label="Visa"><span className="text-[#1A1F71] font-black text-xs">VISA</span></PaymentPill>;
          case "MASTERCARD":
            return (
              <PaymentPill key={icon} label="Mastercard">
                <span className="flex items-center gap-0.5">
                  <span className="w-3 h-3 rounded-full bg-[#EB001B]" />
                  <span className="w-3 h-3 rounded-full bg-[#F79E1B] -ml-1.5 mix-blend-multiply" />
                </span>
              </PaymentPill>
            );
          case "NETOPIA":
            return <PaymentPill key={icon} label="Netopia"><span className="text-[#E10E0E] font-bold text-[10px]">netopia</span></PaymentPill>;
          case "RAMBURS":
            return <PaymentPill key={icon} label="Ramburs"><span className="text-gray-700 font-bold text-[10px]">RAMBURS</span></PaymentPill>;
          case "TBI":
          case "TBI BANK":
            return <PaymentPill key={icon} label="TBI Bank"><span className="text-[#00A0E3] font-bold text-[10px]">tbi bank</span></PaymentPill>;
          case "PAYPAL":
            return <PaymentPill key={icon} label="PayPal"><span className="text-[#003087] font-bold text-[10px]">PayPal</span></PaymentPill>;
          default:
            return <PaymentPill key={icon} label={icon}><span className="text-gray-700 font-bold text-[10px]">{icon}</span></PaymentPill>;
        }
      })}
    </div>
  );
}

/* ── MAIN FOOTER ── */
export function SiteFooter() {
  const { footer, general } = useSiteSettings();
  if (footer?.show === false) return null;

  const mainBg = footer?.footer_bg || "#1f1f1f";
  const titleColor = "#ffffff";
  const textColor = footer?.footer_text_color || "#d4d4d4";
  const linkColor = "#9ca3af";
  const linkHover = "#ffffff";
  const bottomBg = footer?.footer_bottom_bg || "#181818";
  const accentColor = "#00838f";

  const socialLinks = [
    { key: "social_facebook", Icon: FacebookIcon, label: "Facebook" },
    { key: "social_instagram", Icon: InstagramIcon, label: "Instagram" },
    { key: "social_youtube", Icon: YoutubeIcon, label: "YouTube" },
    { key: "social_tiktok", Icon: TikTokIcon, label: "TikTok" },
    { key: "social_twitter", Icon: TwitterIcon, label: "Twitter / X" },
    { key: "social_pinterest", Icon: PinterestIcon, label: "Pinterest" },
  ].filter(s => general?.[s.key]);

  // Page slugs (admin-overridable)
  const termsSlug = general?.terms_page_slug || "termeni-si-conditii";
  const privacySlug = general?.privacy_page_slug || "politica-confidentialitate";
  const returnSlug = general?.return_policy_slug || "politica-retur";
  const logoUrl = general?.logo_url || "";

  const renderLink = (url: string, label: string, i: number) => {
    const isExternal = url.startsWith("http");
    const style = { color: linkColor };
    const cls = "text-sm hover:text-white transition-colors block py-0.5";
    if (isExternal) {
      return (
        <li key={i}>
          <a href={url} target="_blank" rel="noopener noreferrer" className={cls} style={style}
            onMouseEnter={e => (e.target as HTMLElement).style.color = linkHover}
            onMouseLeave={e => (e.target as HTMLElement).style.color = linkColor}
          >{label}</a>
        </li>
      );
    }
    return (
      <li key={i}>
        <a href={url} className={cls} style={style}
          onMouseEnter={e => (e.target as HTMLElement).style.color = linkHover}
          onMouseLeave={e => (e.target as HTMLElement).style.color = linkColor}
        >{label}</a>
      </li>
    );
  };

  const col1Links = footer?.col1_links?.length > 0 ? footer.col1_links : [
    { label: "Despre noi", url: "/page/despre-noi" },
    { label: "Termeni și condiții", url: `/page/${termsSlug}` },
    { label: "Politica de Confidențialitate", url: `/page/${privacySlug}` },
    { label: "Politica Cookie-uri", url: "/politica-cookies" },
    { label: "Politică de returnare", url: `/page/${returnSlug}` },
    { label: "Contact", url: "/contact" },
    { label: "Card Cadou", url: "/gift-card" },
  ];

  const col2Links = footer?.col2_links?.length > 0 ? footer.col2_links : [
    { label: "Transport și Livrare", url: "/page/transport-livrare" },
    { label: "Metode de plată", url: "/page/metode-plata" },
    { label: "Politica de Retur", url: `/page/${returnSlug}` },
    { label: "Garanția Produselor", url: "/page/garantie" },
    { label: "ANPC", url: "https://anpc.ro/ce-este-anpc/" },
    { label: "SOL (Soluționare Online Litigii)", url: "https://ec.europa.eu/consumers/odr" },
  ];

  /* Company info - from general or footer settings */
  const companyName = general?.company_name || footer?.company_name || "";
  const regCom = general?.reg_com || footer?.reg_com || "";
  const cui = general?.company_cui || footer?.cui || "";
  const companyAddress = general?.company_address || footer?.company_address || "";
  const companyCity = general?.company_city || footer?.company_city || "";
  const companyCounty = general?.company_county || footer?.company_county || "";
  const companyPostalCode = general?.company_postal_code || footer?.company_postal_code || "";
  const companyIban = general?.invoice_iban || footer?.company_iban || "";
  const companyBank = general?.invoice_bank || footer?.company_bank || "";

  const phone = general?.contact_phone || "";
  const emailAddr = general?.contact_email || "";
  const schedule = general?.contact_schedule || "Luni-Vineri 09:00-17:00";
  const whatsappNumber = general?.whatsapp_number || "";
  const showWhatsapp = general?.whatsapp_show !== false && whatsappNumber;

  const paymentIcons = footer?.payment_icons || ["VISA", "MASTERCARD", "RAMBURS"];

  /* Company documents */
  const companyDocs: { label: string; url: string }[] = footer?.company_documents || [];
  const showDocs = footer?.show_company_documents !== false && companyDocs.length > 0;

  /* Full formatted address */
  const fullAddress = [companyAddress, companyCity, companyCounty, companyPostalCode].filter(Boolean).join(", ");

  return (
    <footer className="mt-0">
      {/* NEWSLETTER SECTION */}
      {footer?.show_newsletter !== false && <FooterNewsletter accentColor={accentColor} />}

      {/* MAIN FOOTER */}
      <div style={{ background: mainBg, color: textColor }}>
        {logoUrl && (
          <div className="mx-auto max-w-7xl px-4 pt-8 flex justify-center">
            <img src={logoUrl} alt={general?.site_name || "Logo"} className="h-12 w-auto opacity-90" loading="lazy" />
          </div>
        )}
        <div className="mx-auto max-w-7xl px-4 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {Array.isArray(footer?.columns) && footer.columns.length > 0 ? (
            /* DYNAMIC COLUMNS — admin-managed (footer.columns) */
            footer.columns.map((col: any, idx: number) => {
              if (col?.show === false) return null;
              const title = col?.title || "";
              const links: Array<{ label: string; url: string }> = Array.isArray(col?.links) ? col.links : [];
              const html: string | undefined = col?.html;
              return (
                <FooterColumn key={idx} title={title} titleColor={titleColor}>
                  {html ? (
                    <div
                      className="text-sm space-y-2 [&_a]:underline hover:[&_a]:text-white"
                      style={{ color: textColor }}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
                    />
                  ) : (
                    <ul className="space-y-2">
                      {links.map((l, i) => renderLink(l.url, l.label, i))}
                    </ul>
                  )}
                </FooterColumn>
              );
            })
          ) : (
            <>
          {/* COL 1 — Informații utile */}
          {footer?.col1_show !== false && (
            <FooterColumn title={footer?.col1_title || "Informații utile"} titleColor={titleColor}>
              <ul className="space-y-2">
                {col1Links.map((l: any, i: number) => renderLink(l.url, l.label, i))}
              </ul>
            </FooterColumn>
          )}

          {/* COL 2 — Clienți */}
          {footer?.col2_show !== false && (
            <FooterColumn title={footer?.col2_title || "Clienți"} titleColor={titleColor}>
              <ul className="space-y-2">
                {col2Links.map((l: any, i: number) => renderLink(l.url, l.label, i))}
              </ul>
            </FooterColumn>
          )}

          {/* COL 3 — Date comerciale */}
          {footer?.col3_show !== false && (
            <FooterColumn title={footer?.col3_title || "Date comerciale"} titleColor={titleColor}>
              <div className="space-y-2 text-sm" style={{ color: textColor }}>
                {companyName && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 shrink-0 text-white/60" />
                    <span className="font-semibold text-white">{companyName}</span>
                  </div>
                )}
                {regCom && <p className="pl-6">Reg. Com.: {regCom}</p>}
                {cui && <p className="pl-6">CUI: {cui}</p>}
                {fullAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-white/60" />
                    <span>{fullAddress}</span>
                  </div>
                )}
                {companyIban && <p className="pl-6">IBAN: {companyIban}</p>}
                {companyBank && <p className="pl-6">Banca: {companyBank}</p>}
              </div>

              {/* Company documents */}
              {showDocs && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Documente
                  </p>
                  {companyDocs.map((doc, i) => (
                    <a
                      key={i}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-white transition-colors block py-0.5 flex items-center gap-1.5"
                      style={{ color: linkColor }}
                      onMouseEnter={e => (e.target as HTMLElement).style.color = linkHover}
                      onMouseLeave={e => (e.target as HTMLElement).style.color = linkColor}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      {doc.label}
                    </a>
                  ))}
                </div>
              )}

              {/* Contact button */}
              <a
                href="/contact"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ background: "#0058b3" }}
              >
                <MessageCircle className="h-4 w-4" />
                Contactează-ne
              </a>
            </FooterColumn>
          )}

          {/* COL 4 — Suport clienți */}
          {footer?.col4_show !== false && (
            <FooterColumn title={footer?.col4_title || "Suport clienți"} titleColor={titleColor}>
              <div className="space-y-3 text-sm">
                {schedule && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0 text-white/60" />
                    <span style={{ color: textColor }}>{schedule}</span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-white/60" />
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white transition-colors font-medium" style={{ color: linkColor }}>
                      {phone}
                    </a>
                  </div>
                )}
                {emailAddr && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-white/60" />
                    <a href={`mailto:${emailAddr}`} className="hover:text-white transition-colors break-all" style={{ color: linkColor }}>
                      {emailAddr}
                    </a>
                  </div>
                )}
                {showWhatsapp && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 shrink-0 text-white/60" />
                    <a
                      href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(general?.whatsapp_message || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                      style={{ color: linkColor }}
                    >
                      WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </FooterColumn>
          )}
            </>
          )}
        </div>
      </div>

      {/* SOCIAL MEDIA BAR */}
      {socialLinks.length > 0 && (
        <div style={{ background: mainBg, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-center gap-5">
            {socialLinks.map((s) => (
              <a
                key={s.key}
                href={general[s.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
                title={s.label}
              >
                <s.Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM BAR — Copyright + Payment Icons + ANPC/SOL */}
      <div style={{ background: bottomBg, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Payment + Badges */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {footer?.show_payment_icons !== false && <PaymentIcons icons={paymentIcons} />}

              {/* ANPC SAL */}
              {footer?.show_anpc_badges !== false && (
                <a
                  href="https://anpc.ro/ce-este-sal/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded px-2 py-1 hover:opacity-90"
                >
                  <img
                    src="https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sal.svg"
                    alt="ANPC SAL"
                    className="h-7"
                    loading="lazy"
                  />
                </a>
              )}

              {/* SOL */}
              {footer?.show_sol_badge !== false && (
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded px-2 py-1 hover:opacity-90"
                >
                  <img
                    src="https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sol.svg"
                    alt="Soluționarea Online a Litigiilor"
                    className="h-7"
                    loading="lazy"
                  />
                </a>
              )}
            </div>
          </div>

          {/* Legal compliance row */}
          <div className="border-t border-white/10 mt-4 pt-3 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-1 text-[11px]" style={{ color: linkColor }}>
            <a
              href="https://anpc.ro/ce-este-sal/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              ANPC — Soluționarea Alternativă a Litigiilor
            </a>
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              SOL — Platformă Online de Soluționare a Litigiilor
            </a>
            <span className="opacity-90">Conform OUG 34/2014 și Regulamentului UE 524/2013</span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-center mt-3" style={{ color: textColor }}>
            {footer?.copyright_text || `© ${new Date().getFullYear()} SC Vomix Genius SRL — Toate drepturile rezervate`}
          </p>

          {/* Reset cookies — GDPR right to withdraw consent */}
          <p className="text-xs text-center mt-2" style={{ color: textColor }}>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem("cookie_consent");
                  window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: null }));
                  window.location.reload();
                } catch {}
              }}
              className="underline opacity-70 hover:opacity-100 transition"
            >
              Resetează preferințele cookies
            </button>
          </p>

          {/* Disclaimer fiscal / legal */}
          {footer?.show_legal_disclaimer !== false && (
            <p className="text-[10px] text-center mt-2 opacity-90" style={{ color: textColor }}>
              {footer?.legal_disclaimer || "Prețurile includ TVA. Imaginile produselor sunt cu titlu informativ și pot diferi de realitate."}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
