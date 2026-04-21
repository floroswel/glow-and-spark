import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, Toggle, NumberInput, TextArea } from "@/components/admin/AdminSettingsEditor";
import { useState } from "react";
import { Store, Phone, MessageCircle, Truck, Globe, CreditCard, Bell, Shield, FileText, Mail } from "lucide-react";

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
  currency: "RON",
  language: "ro",
  vat_rate: "19",
  vat_included: true,
  order_prefix: "GS",
  order_email_notifications: true,
  low_stock_threshold: "5",
  google_analytics_id: "",
  facebook_pixel_id: "",
  meta_title_suffix: " — Glow & Spark",
  robots_txt: "User-agent: *\nAllow: /",
  maintenance_mode: false,
  maintenance_message: "Revenim în curând cu o experiență nouă!",
  terms_page_slug: "termeni-si-conditii",
  privacy_page_slug: "politica-confidentialitate",
  return_policy_slug: "politica-retur",
  invoice_company_name: "",
  invoice_cui: "",
  invoice_reg: "",
  invoice_address: "",
  invoice_bank: "",
  invoice_iban: "",
  smtp_from_name: "Glow & Spark",
  smtp_from_email: "comenzi@glowandspark.ro",
};

function AdminSettings() {
  const [activeSection, setActiveSection] = useState("identity");

  const sections = [
    { key: "identity", label: "Identitate", icon: Store },
    { key: "contact", label: "Contact", icon: Phone },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { key: "shipping", label: "Livrare", icon: Truck },
    { key: "tax", label: "Fiscalitate", icon: FileText },
    { key: "notifications", label: "Notificări", icon: Bell },
    { key: "seo", label: "SEO & Analytics", icon: Globe },
    { key: "legal", label: "Legal", icon: Shield },
    { key: "invoicing", label: "Facturare", icon: CreditCard },
    { key: "email", label: "Email", icon: Mail },
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

            {activeSection === "shipping" && (
              <Section title="🚚 Livrare">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Livrare gratuită de la (RON)"><TextInput value={s.free_shipping_min} onChange={(v) => u("free_shipping_min", v)} /></Field>
                  <Field label="Cost livrare standard (RON)"><TextInput value={s.default_shipping_cost} onChange={(v) => u("default_shipping_cost", v)} /></Field>
                  <Field label="Cost livrare express (RON)"><TextInput value={s.express_shipping_cost} onChange={(v) => u("express_shipping_cost", v)} /></Field>
                  <Field label="Prag stoc scăzut (alerte)"><TextInput value={s.low_stock_threshold} onChange={(v) => u("low_stock_threshold", v)} /></Field>
                </div>
              </Section>
            )}

            {activeSection === "tax" && (
              <Section title="💰 Fiscalitate">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Cotă TVA (%)"><TextInput value={s.vat_rate} onChange={(v) => u("vat_rate", v)} /></Field>
                  <div className="flex items-end pb-2">
                    <Toggle value={s.vat_included} onChange={(v) => u("vat_included", v)} label="Prețurile includ TVA" />
                  </div>
                </div>
              </Section>
            )}

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

            {activeSection === "seo" && (
              <Section title="🔍 SEO & Analytics">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Sufix titlu pagini (ex: — Glow & Spark)"><TextInput value={s.meta_title_suffix} onChange={(v) => u("meta_title_suffix", v)} /></Field>
                  <Field label="Google Analytics ID"><TextInput value={s.google_analytics_id} onChange={(v) => u("google_analytics_id", v)} /></Field>
                  <Field label="Facebook Pixel ID"><TextInput value={s.facebook_pixel_id} onChange={(v) => u("facebook_pixel_id", v)} /></Field>
                </div>
                <div className="mt-4">
                  <label className="text-xs font-medium text-muted-foreground">robots.txt</label>
                  <div className="mt-1">
                    <TextArea value={s.robots_txt} onChange={(v) => u("robots_txt", v)} rows={4} />
                  </div>
                </div>
              </Section>
            )}

            {activeSection === "legal" && (
              <Section title="⚖️ Legal">
                <p className="text-sm text-muted-foreground mb-4">Slug-urile paginilor legale (trebuie create în secțiunea Pagini CMS)</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field label="Termeni și condiții (slug)"><TextInput value={s.terms_page_slug} onChange={(v) => u("terms_page_slug", v)} /></Field>
                  <Field label="Politica confidentialitate (slug)"><TextInput value={s.privacy_page_slug} onChange={(v) => u("privacy_page_slug", v)} /></Field>
                  <Field label="Politica retur (slug)"><TextInput value={s.return_policy_slug} onChange={(v) => u("return_policy_slug", v)} /></Field>
                </div>
              </Section>
            )}

            {activeSection === "invoicing" && (
              <Section title="🧾 Date Facturare">
                <p className="text-sm text-muted-foreground mb-4">Aceste date apar pe facturile generate</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Denumire firmă"><TextInput value={s.invoice_company_name} onChange={(v) => u("invoice_company_name", v)} /></Field>
                  <Field label="CUI"><TextInput value={s.invoice_cui} onChange={(v) => u("invoice_cui", v)} /></Field>
                  <Field label="Nr. Reg. Comerțului"><TextInput value={s.invoice_reg} onChange={(v) => u("invoice_reg", v)} /></Field>
                  <Field label="Adresă sediu"><TextInput value={s.invoice_address} onChange={(v) => u("invoice_address", v)} /></Field>
                  <Field label="Bancă"><TextInput value={s.invoice_bank} onChange={(v) => u("invoice_bank", v)} /></Field>
                  <Field label="IBAN"><TextInput value={s.invoice_iban} onChange={(v) => u("invoice_iban", v)} /></Field>
                </div>
              </Section>
            )}

            {activeSection === "email" && (
              <Section title="📧 Email">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Nume expeditor"><TextInput value={s.smtp_from_name} onChange={(v) => u("smtp_from_name", v)} /></Field>
                  <Field label="Email expeditor"><TextInput value={s.smtp_from_email} onChange={(v) => u("smtp_from_email", v)} /></Field>
                </div>
              </Section>
            )}
          </div>
        </div>
      )}
    </AdminSettingsEditor>
  );
}
