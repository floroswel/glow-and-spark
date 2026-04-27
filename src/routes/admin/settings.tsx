import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, Toggle, TextArea } from "@/components/admin/AdminSettingsEditor";
import { useState } from "react";
import { Store, Phone, MessageCircle, CreditCard, Bell, Shield, Mail, Share2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

const defaults = {
  site_name: "Glow & Spark",
  site_tagline: "Lumânări artizanale premium",
  site_url: "https://glowandspark.ro",
  logo_url: "",
  favicon_url: "",
  og_image_url: "",
  contact_phone: "+40753326405",
  contact_email: "contact@glowandspark.ro",
  contact_address: "România",
  contact_schedule: "Luni-Vineri 09:00-17:00",
  whatsapp_number: "40753326405",
  whatsapp_show: true,
  whatsapp_message: "Buna ziua! Am o intrebare.",
  free_shipping_min: "200",
  default_shipping_cost: "15",
  express_shipping_cost: "30",
  gift_wrapping_price: "15",
  currency: "RON",
  language: "ro",
  vat_rate: "19",
  vat_included: true,
  order_prefix: "GS",
  order_email_notifications: true,
  low_stock_threshold: "5",
  stock_alert_threshold: "5",
  google_analytics_id: "",
  facebook_pixel_id: "",
  meta_title_suffix: " — Glow & Spark",
  robots_txt: "User-agent: *\nAllow: /",
  maintenance_mode: false,
  maintenance_message: "Revenim în curând cu o experiență nouă!",
  // Site Alert
  site_alert_enabled: false,
  site_alert_text: "",
  site_alert_type: "info",
  site_alert_dismissible: true,
  // Company data (used in footer + invoices)
  company_name: "",
  reg_com: "",
  company_cui: "",
  company_address: "",
  company_city: "",
  company_caen: "",
  
  // Legal pages
  terms_page_slug: "termeni-si-conditii",
  privacy_page_slug: "politica-confidentialitate",
  return_policy_slug: "politica-retur",
  invoice_address: "",
  invoice_bank: "",
  invoice_iban: "",
  smtp_from_name: "Glow & Spark",
  smtp_from_email: "comenzi@glowandspark.ro",
  // Social Media
  social_facebook: "",
  social_instagram: "",
  social_tiktok: "",
  social_youtube: "",
  social_pinterest: "",
  social_twitter: "",
};

function AdminSettings() {
  const [activeSection, setActiveSection] = useState("identity");

  const sections = [
    { key: "identity", label: "Identitate", icon: Store },
    { key: "contact", label: "Contact", icon: Phone },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { key: "notifications", label: "Notificări", icon: Bell },
    { key: "legal", label: "Legal", icon: Shield },
    { key: "invoicing", label: "Firmă & Facturare", icon: CreditCard },
    { key: "email", label: "Email", icon: Mail },
    { key: "social", label: "Social Media", icon: Share2 },
    { key: "alert", label: "Alertă Site", icon: AlertTriangle },
  ];

  return (
    <AdminSettingsEditor settingsKey="general" defaults={defaults} title="Setări Generale">
      {(s, u) => (
        <div className="flex gap-6">
          {/* Sidebar navigation */}
          <div className="hidden md:block w-48 shrink-0">
            <nav className="sticky top-4 space-y-1">
              {sections.map((sec) => (
                <button
                  key={sec.key}
                  onClick={() => setActiveSection(sec.key)}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition text-left ${activeSection === sec.key ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                >
                  <sec.icon className="h-4 w-4 shrink-0" />
                  {sec.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile section selector */}
          <div className="md:hidden w-full">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full mb-4 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {sections.map((sec) => (
                <option key={sec.key} value={sec.key}>{sec.label}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6 min-w-0">
            {activeSection === "identity" && (
              <Section title="🏪 Identitate Magazin">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Nume magazin"><TextInput value={s.site_name} onChange={(v) => u("site_name", v)} /></Field>
                  <Field label="Tagline"><TextInput value={s.site_tagline} onChange={(v) => u("site_tagline", v)} /></Field>
                  <Field label="URL site"><TextInput value={s.site_url} onChange={(v) => u("site_url", v)} /></Field>
                  <Field label="Monedă"><TextInput value={s.currency} onChange={(v) => u("currency", v)} /></Field>
                  <Field label="Limbă"><TextInput value={s.language} onChange={(v) => u("language", v)} /></Field>
                  <Field label="Prefix comandă"><TextInput value={s.order_prefix} onChange={(v) => u("order_prefix", v)} /></Field>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">URL Logo</label>
                    <TextInput value={s.logo_url} onChange={(v) => u("logo_url", v)} />
                    {s.logo_url && <img src={s.logo_url} alt="Logo" className="mt-2 h-12 object-contain rounded border border-border" />}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">URL Favicon</label>
                    <TextInput value={s.favicon_url} onChange={(v) => u("favicon_url", v)} />
                    {s.favicon_url && <img src={s.favicon_url} alt="Favicon" className="mt-2 h-8 object-contain" />}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">OG Image (social share)</label>
                    <TextInput value={s.og_image_url} onChange={(v) => u("og_image_url", v)} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Toggle value={s.maintenance_mode} onChange={(v) => u("maintenance_mode", v)} label="🔧 Mod mentenanță (site-ul va afișa o pagină de mentenanță)" />
                  {s.maintenance_mode && (
                    <div className="mt-2">
                      <Field label="Mesaj mentenanță"><TextInput value={s.maintenance_message} onChange={(v) => u("maintenance_message", v)} /></Field>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {activeSection === "contact" && (
              <Section title="📞 Contact">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Telefon"><TextInput value={s.contact_phone} onChange={(v) => u("contact_phone", v)} /></Field>
                  <Field label="Email"><TextInput value={s.contact_email} onChange={(v) => u("contact_email", v)} /></Field>
                  <Field label="Adresă completă"><TextInput value={s.contact_address} onChange={(v) => u("contact_address", v)} /></Field>
                  <Field label="Program lucru"><TextInput value={s.contact_schedule} onChange={(v) => u("contact_schedule", v)} /></Field>
                </div>
              </Section>
            )}

            {activeSection === "whatsapp" && (
              <Section title="💬 WhatsApp">
                <div className="space-y-4">
                  <Toggle value={s.whatsapp_show} onChange={(v) => u("whatsapp_show", v)} label="Afișează buton WhatsApp pe site" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Număr WhatsApp (cu prefix țară, fără +)"><TextInput value={s.whatsapp_number} onChange={(v) => u("whatsapp_number", v)} /></Field>
                    <Field label="Mesaj pre-completat"><TextInput value={s.whatsapp_message} onChange={(v) => u("whatsapp_message", v)} /></Field>
                  </div>
                  {s.whatsapp_show && (
                    <div className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
                      Preview link: <a href={`https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(s.whatsapp_message)}`} target="_blank" rel="noreferrer" className="text-accent underline">wa.me/{s.whatsapp_number}</a>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Livrare → /admin/shipping (pagină dedicată cu curieri și zone) */}
            {/* Fiscalitate → /admin/tax-settings (cote TVA multiple) */}

            {activeSection === "notifications" && (
              <Section title="🔔 Notificări">
                <div className="space-y-4">
                  <Toggle value={s.order_email_notifications} onChange={(v) => u("order_email_notifications", v)} label="Trimite email la comandă nouă" />
                  <div className="rounded-lg bg-secondary/50 p-4 text-sm text-muted-foreground">
                    <p>Notificările vor fi trimise la adresa: <strong>{s.contact_email}</strong></p>
                  </div>
                </div>
              </Section>
            )}

            {/* SEO & Analytics → /admin/content/seo (configurare completă SEO + schema.org) */}


            {activeSection === "alert" && (
              <Section title="⚠️ Alertă Site">
                <div className="space-y-4">
                  <Toggle value={s.site_alert_enabled} onChange={(v) => u("site_alert_enabled", v)} label="Activează alerta" />
                  <Field label="Textul alertei"><TextInput value={s.site_alert_text} onChange={(v) => u("site_alert_text", v)} /></Field>
                  <Field label="Tip alertă">
                    <select value={s.site_alert_type} onChange={(e) => u("site_alert_type", e.target.value)} className="w-full rounded border border-border px-3 py-2 text-sm">
                      <option value="info">Info (albastru)</option>
                      <option value="warning">Avertisment (galben)</option>
                      <option value="success">Succes (verde)</option>
                      <option value="error">Eroare (roșu)</option>
                    </select>
                  </Field>
                  <Toggle value={s.site_alert_dismissible} onChange={(v) => u("site_alert_dismissible", v)} label="Poate fi închisă de utilizator" />
                </div>
              </Section>
            )}
          </div>
        </div>
      )}
    </AdminSettingsEditor>
  );
}
