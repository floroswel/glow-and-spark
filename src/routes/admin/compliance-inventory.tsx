import { createFileRoute } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useFiscalInfo } from "@/hooks/useFiscalInfo";
import { resolveEnabledPlatforms, CONSENT_POLICY_VERSION } from "@/config/marketing-tech";
import { Shield, CheckCircle2, XCircle, Download } from "lucide-react";

export const Route = createFileRoute("/admin/compliance-inventory")({
  component: ComplianceInventoryPage,
});

function ComplianceInventoryPage() {
  const { general } = useSiteSettings();
  const fiscal = useFiscalInfo();
  const platforms = resolveEnabledPlatforms(general);

  const exportJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      consent_policy_version: CONSENT_POLICY_VERSION,
      vat_mode: { is_vat_payer: fiscal.isVatPayer, vat_rate: fiscal.vatRate, disclaimer: fiscal.priceDisclaimer },
      platforms: platforms.map((p) => ({
        key: p.key,
        label: p.label,
        enabled: p.enabled,
        configured_id: p.configuredId,
        capi_enabled: p.capiEnabled ?? false,
        consent_category: p.consentCategory,
        privacy_url: p.privacyUrl,
        dpa_url: p.dpaUrl,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-inventory-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Inventar Conformitate</h1>
        </div>
        <button
          onClick={exportJson}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-primary-foreground rounded-lg text-sm font-semibold hover:bg-accent transition"
        >
          <Download className="h-4 w-4" /> Export JSON
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Versiune politică consimțământ: <strong>{CONSENT_POLICY_VERSION}</strong> · Documentele legale sunt <strong>DRAFT</strong> — necesită revizuire de avocat.
      </p>

      {/* VAT Mode */}
      <section className="border border-border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Mod TVA</h2>
        <div className="flex items-center gap-2 text-sm">
          {fiscal.isVatPayer ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-orange-500" />
          )}
          <span>{fiscal.isVatPayer ? "Plătitor de TVA" : "Neîntregistrat în scopuri de TVA"}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{fiscal.priceDisclaimer}</p>
      </section>

      {/* Marketing Stack */}
      <section className="border border-border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Platforme Marketing / Analytics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">Platformă</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">ID Configurat</th>
                <th className="py-2 pr-3">Categorie</th>
                <th className="py-2 pr-3">CAPI</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map((p) => (
                <tr key={p.key} className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">{p.label}</td>
                  <td className="py-2 pr-3">
                    {p.enabled ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="h-3 w-3" /> Activ</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs"><XCircle className="h-3 w-3" /> Dezactivat</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-xs font-mono">{p.configuredId || "—"}</td>
                  <td className="py-2 pr-3 text-xs capitalize">{p.consentCategory}</td>
                  <td className="py-2 pr-3 text-xs">{p.capiEnabled ? "Da" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Conversion Events Documentation */}
      <section className="border border-border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Evenimente de conversie — Ce date se trimit</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Parametrii trimiși platformelor. <strong>Niciun PII</strong> (email, telefon, nume) nu este trimis în clar.
          Dacă platformele cer email hashing, acesta trebuie implementat server-side. [VERIFICARE_IMPLEMENTARE]
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 pr-3">Eveniment</th>
                <th className="py-1.5 pr-3">Parametri trimiși</th>
                <th className="py-1.5 pr-3">Platforme</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30">
                <td className="py-1.5 pr-3 font-medium text-foreground">PageView</td>
                <td className="py-1.5 pr-3">URL, referrer, user-agent</td>
                <td className="py-1.5 pr-3">Meta, GA4, TikTok</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-1.5 pr-3 font-medium text-foreground">ViewContent</td>
                <td className="py-1.5 pr-3">product_id, name, price, currency, category</td>
                <td className="py-1.5 pr-3">Meta, GA4</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-1.5 pr-3 font-medium text-foreground">AddToCart</td>
                <td className="py-1.5 pr-3">product_id, name, price × quantity, currency</td>
                <td className="py-1.5 pr-3">Meta, GA4</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-1.5 pr-3 font-medium text-foreground">InitiateCheckout</td>
                <td className="py-1.5 pr-3">content_ids[], total value, currency, num_items</td>
                <td className="py-1.5 pr-3">Meta</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-1.5 pr-3 font-medium text-foreground">Purchase</td>
                <td className="py-1.5 pr-3">content_ids[], total value, currency</td>
                <td className="py-1.5 pr-3">Meta, GA4</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-3 font-medium text-foreground">Lead (Newsletter)</td>
                <td className="py-1.5 pr-3">event only, no PII</td>
                <td className="py-1.5 pr-3">Meta, GA4</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2">
          ⚠ Nu se trimit: email, telefon, nume, adresă. IP-ul este colectat automat de platforme prin scripturi client-side.
        </p>
      </section>

      <p className="text-[10px] text-muted-foreground/60 text-center">
        Acest raport este destinat utilizării interne. Nu constituie certificare legală.
      </p>
    </div>
  );
}
