import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, TextArea, Toggle, NumberInput } from "@/components/admin/AdminSettingsEditor";

export const Route = createFileRoute("/admin/settings/checkout")({
  component: AdminCheckoutSettings,
});

const defaults = {
  checkout_type: "one-page",
  guest_checkout: true,
  require_phone: true,
  require_postal_code: false,
  require_county: true,
  show_order_notes: true,
  show_company_fields: true,
  gift_wrap_enabled: true,
  gift_wrap_price: 15,
  gift_wrap_label: "Ambalaj cadou premium 🎁",
  custom_message_enabled: true,
  custom_message_price: 5,
  custom_message_label: "Mesaj personalizat pe card",
  upsell_enabled: true,
  upsell_title: "Completează experiența",
  checkout_message_top: "Livrare gratuită de la 200 RON! 🚚",
  checkout_message_bottom: "Toate lumânările sunt ambalate cu grijă într-o cutie cadou.",
  min_order_value: 0,
  max_order_value: 0,
  terms_required: true,
  newsletter_opt_in: true,
};

function AdminCheckoutSettings() {
  return (
    <AdminSettingsEditor settingsKey="checkout_config" defaults={defaults} title="🛒 Configurare Checkout">
      {(settings, update) => (
        <>
          <Section title="Tipul Checkout">
            <Field label="Format checkout">
              <select value={settings.checkout_type} onChange={e => update("checkout_type", e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="one-page">One-page checkout</option>
                <option value="multi-step">Multi-step checkout</option>
              </select>
            </Field>
            <Field label="Guest checkout">
              <Toggle value={settings.guest_checkout} onChange={v => update("guest_checkout", v)} label="Permite comenzi fără cont" />
            </Field>
          </Section>
          <Section title="Câmpuri Obligatorii">
            <Field label="Telefon obligatoriu"><Toggle value={settings.require_phone} onChange={v => update("require_phone", v)} label="Activ" /></Field>
            <Field label="Cod poștal obligatoriu"><Toggle value={settings.require_postal_code} onChange={v => update("require_postal_code", v)} label="Activ" /></Field>
            <Field label="Județ obligatoriu"><Toggle value={settings.require_county} onChange={v => update("require_county", v)} label="Activ" /></Field>
            <Field label="Note comandă"><Toggle value={settings.show_order_notes} onChange={v => update("show_order_notes", v)} label="Afișează câmp note" /></Field>
            <Field label="Câmpuri firmă"><Toggle value={settings.show_company_fields} onChange={v => update("show_company_fields", v)} label="Afișează opțiuni factură firmă" /></Field>
          </Section>
          <Section title="Servicii Extra — Perfect pentru Lumânări! 🕯️">
            <Field label="Ambalaj cadou"><Toggle value={settings.gift_wrap_enabled} onChange={v => update("gift_wrap_enabled", v)} label="Activ" /></Field>
            <Field label="Preț ambalaj (RON)"><NumberInput value={settings.gift_wrap_price} onChange={v => update("gift_wrap_price", v)} min={0} /></Field>
            <Field label="Label ambalaj"><TextInput value={settings.gift_wrap_label} onChange={v => update("gift_wrap_label", v)} /></Field>
            <Field label="Mesaj personalizat"><Toggle value={settings.custom_message_enabled} onChange={v => update("custom_message_enabled", v)} label="Activ" /></Field>
            <Field label="Preț mesaj (RON)"><NumberInput value={settings.custom_message_price} onChange={v => update("custom_message_price", v)} min={0} /></Field>
            <Field label="Label mesaj"><TextInput value={settings.custom_message_label} onChange={v => update("custom_message_label", v)} /></Field>
          </Section>
          <Section title="Mesaje & Upsell">
            <Field label="Mesaj sus checkout"><TextInput value={settings.checkout_message_top} onChange={v => update("checkout_message_top", v)} /></Field>
            <Field label="Mesaj jos checkout"><TextInput value={settings.checkout_message_bottom} onChange={v => update("checkout_message_bottom", v)} /></Field>
            <Field label="Upsell la checkout"><Toggle value={settings.upsell_enabled} onChange={v => update("upsell_enabled", v)} label="Activ" /></Field>
            <Field label="Titlu upsell"><TextInput value={settings.upsell_title} onChange={v => update("upsell_title", v)} /></Field>
          </Section>
          <Section title="Reguli">
            <Field label="Valoare minimă comandă (0 = fără limită)"><NumberInput value={settings.min_order_value} onChange={v => update("min_order_value", v)} min={0} /></Field>
            <Field label="Acord termeni obligatoriu"><Toggle value={settings.terms_required} onChange={v => update("terms_required", v)} label="Activ" /></Field>
            <Field label="Opt-in newsletter la checkout"><Toggle value={settings.newsletter_opt_in} onChange={v => update("newsletter_opt_in", v)} label="Activ" /></Field>
          </Section>
        </>
      )}
    </AdminSettingsEditor>
  );
}
