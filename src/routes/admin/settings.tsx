import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, Toggle } from "@/components/admin/AdminSettingsEditor";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

const defaults = {
  site_name: "Glow & Spark",
  site_tagline: "Lumânări artizanale premium",
  site_url: "https://glowandspark.ro",
  logo_url: "",
  favicon_url: "",
  contact_phone: "+40753326405",
  contact_email: "contact@glowandspark.ro",
  contact_address: "România",
  contact_schedule: "Luni-Vineri 09:00-17:00",
  whatsapp_number: "40753326405",
  whatsapp_show: true,
  whatsapp_message: "Buna ziua! Am o intrebare.",
  free_shipping_min: "200",
  default_shipping_cost: "15",
  currency: "RON",
  language: "ro",
};

function AdminSettings() {
  return (
    <AdminSettingsEditor settingsKey="general" defaults={defaults} title="Setări Generale">
      {(s, u) => (
        <>
          <Section title="Identitate Magazin">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nume magazin"><TextInput value={s.site_name} onChange={(v) => u("site_name", v)} /></Field>
              <Field label="Tagline"><TextInput value={s.site_tagline} onChange={(v) => u("site_tagline", v)} /></Field>
              <Field label="URL site"><TextInput value={s.site_url} onChange={(v) => u("site_url", v)} /></Field>
              <Field label="URL logo"><TextInput value={s.logo_url} onChange={(v) => u("logo_url", v)} /></Field>
              <Field label="URL favicon"><TextInput value={s.favicon_url} onChange={(v) => u("favicon_url", v)} /></Field>
            </div>
          </Section>
          <Section title="Contact">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Telefon"><TextInput value={s.contact_phone} onChange={(v) => u("contact_phone", v)} /></Field>
              <Field label="Email"><TextInput value={s.contact_email} onChange={(v) => u("contact_email", v)} /></Field>
              <Field label="Adresă"><TextInput value={s.contact_address} onChange={(v) => u("contact_address", v)} /></Field>
              <Field label="Program"><TextInput value={s.contact_schedule} onChange={(v) => u("contact_schedule", v)} /></Field>
            </div>
          </Section>
          <Section title="WhatsApp">
            <div className="space-y-4">
              <Toggle value={s.whatsapp_show} onChange={(v) => u("whatsapp_show", v)} label="Afișează buton WhatsApp" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Număr WhatsApp"><TextInput value={s.whatsapp_number} onChange={(v) => u("whatsapp_number", v)} /></Field>
                <Field label="Mesaj implicit"><TextInput value={s.whatsapp_message} onChange={(v) => u("whatsapp_message", v)} /></Field>
              </div>
            </div>
          </Section>
          <Section title="Livrare & Monetar">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Livrare gratuită de la (RON)"><TextInput value={s.free_shipping_min} onChange={(v) => u("free_shipping_min", v)} /></Field>
              <Field label="Cost livrare default (RON)"><TextInput value={s.default_shipping_cost} onChange={(v) => u("default_shipping_cost", v)} /></Field>
              <Field label="Monedă"><TextInput value={s.currency} onChange={(v) => u("currency", v)} /></Field>
              <Field label="Limbă"><TextInput value={s.language} onChange={(v) => u("language", v)} /></Field>
            </div>
          </Section>
        </>
      )}
    </AdminSettingsEditor>
  );
}
