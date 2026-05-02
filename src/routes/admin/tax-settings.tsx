import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, Toggle, NumberInput } from "@/components/admin/AdminSettingsEditor";

export const Route = createFileRoute("/admin/tax-settings")({
  component: AdminTaxSettings,
});

const defaults = {
  is_vat_payer: false,
  show_vat_breakdown: false,
  price_label_mode: "final_no_vat",
  legal_price_disclaimer_ro: "Prețurile afișate sunt prețuri finale. Operatorul nu este plătitor de TVA.",
  default_vat_rate: 19,
  prices_include_vat: true,
  show_vat_on_invoice: false,
  company_name: "SC Vomix Genius SRL",
  company_cui: "43025661",
  company_reg_com: "J2020000459343",
  company_address: "Strada Constructorilor Nr 39, sat Voievoda, comuna Furculești",
  company_city: "Furculești",
  company_county: "Teleorman",
  company_postal: "147148",
  company_phone: "+40753326405",
  company_email: "contact@mamalucica.ro",
  company_iban: "RO50BTRLRONCRT0566231601",
  company_bank: "BANCA TRANSILVANIA S.A.",
  invoice_prefix: "ML",
  invoice_auto_generate: true,
  invoice_footer: "Document generat automat — nu necesită semnătură",
  fiscal_printer: false,
  anaf_efactura: false,
  anaf_spv_enabled: false,
  intrastat_enabled: false,
};

function AdminTaxSettings() {
  return (
    <AdminSettingsEditor settingsKey="tax_settings" defaults={defaults} title="⚖️ Setări Fiscale">
      {(s, u) => (
        <>
          <Section title="📊 Regim fiscal">
            <div className="space-y-4">
              <Toggle value={s.is_vat_payer} onChange={v => u("is_vat_payer", v)} label="Plătitor de TVA" />
              {!s.is_vat_payer && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-4">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">✓ Neplătitor de TVA</p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    Prețurile afișate sunt prețuri finale. Nu se aplică TVA, nu se afișează TVA pe facturi sau în magazin.
                  </p>
                </div>
              )}
              {s.is_vat_payer && (
                <div className="space-y-4 rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Setări TVA (active doar pentru plătitori)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Cotă TVA implicită (%)"><NumberInput value={s.default_vat_rate} onChange={v => u("default_vat_rate", v)} min={0} max={30} /></Field>
                  </div>
                  <Toggle value={s.prices_include_vat} onChange={v => u("prices_include_vat", v)} label="Prețurile includ TVA" />
                  <Toggle value={s.show_vat_on_invoice} onChange={v => u("show_vat_on_invoice", v)} label="Afișează TVA detaliat pe factură" />
                  <Toggle value={s.show_vat_breakdown} onChange={v => u("show_vat_breakdown", v)} label="Afișează detalii TVA pe site" />
                </div>
              )}
              <Field label="Disclaimer prețuri (afișat pe site)">
                <TextInput value={s.legal_price_disclaimer_ro} onChange={(v: string) => u("legal_price_disclaimer_ro", v)} />
              </Field>
            </div>
          </Section>

          <Section title="🏢 Date Firmă (Facturare)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Denumire firmă"><TextInput value={s.company_name} onChange={v => u("company_name", v)} /></Field>
              <Field label="CUI"><TextInput value={s.company_cui} onChange={v => u("company_cui", v)} /></Field>
              <Field label="Nr. Reg. Com."><TextInput value={s.company_reg_com} onChange={v => u("company_reg_com", v)} /></Field>
              <Field label="Adresă"><TextInput value={s.company_address} onChange={v => u("company_address", v)} /></Field>
              <Field label="Oraș"><TextInput value={s.company_city} onChange={v => u("company_city", v)} /></Field>
              <Field label="Județ"><TextInput value={s.company_county} onChange={v => u("company_county", v)} /></Field>
              <Field label="Cod poștal"><TextInput value={s.company_postal} onChange={v => u("company_postal", v)} /></Field>
              <Field label="Telefon"><TextInput value={s.company_phone} onChange={v => u("company_phone", v)} /></Field>
              <Field label="Email fiscal"><TextInput value={s.company_email} onChange={v => u("company_email", v)} /></Field>
              <Field label="IBAN"><TextInput value={s.company_iban} onChange={v => u("company_iban", v)} /></Field>
              <Field label="Bancă"><TextInput value={s.company_bank} onChange={v => u("company_bank", v)} /></Field>
            </div>
          </Section>

          <Section title="📄 Facturare">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Prefix factură"><TextInput value={s.invoice_prefix} onChange={v => u("invoice_prefix", v)} /></Field>
              </div>
              <Toggle value={s.invoice_auto_generate} onChange={v => u("invoice_auto_generate", v)} label="Generare automată document la comandă" />
              <Field label="Footer document"><TextInput value={s.invoice_footer} onChange={v => u("invoice_footer", v)} /></Field>
            </div>
          </Section>

          <Section title="🇷🇴 ANAF & Conformitate">
            <div className="space-y-4">
              <Toggle value={s.anaf_efactura} onChange={v => u("anaf_efactura", v)} label="e-Factura ANAF (RO e-Factura)" />
              <Toggle value={s.anaf_spv_enabled} onChange={v => u("anaf_spv_enabled", v)} label="Conectare SPV ANAF" />
              <Toggle value={s.fiscal_printer} onChange={v => u("fiscal_printer", v)} label="Imprimantă fiscală conectată" />
              <Toggle value={s.intrastat_enabled} onChange={v => u("intrastat_enabled", v)} label="Raportare Intrastat" />
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-xs text-blue-700 dark:text-blue-400">ℹ️ Pentru integrare e-Factura ANAF, este necesară configurarea certificatului digital și a API-ului ANAF în secțiunea Integrări.</p>
              </div>
            </div>
          </Section>
        </>
      )}
    </AdminSettingsEditor>
  );
}
