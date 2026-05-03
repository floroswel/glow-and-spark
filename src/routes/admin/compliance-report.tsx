import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useFiscalInfo } from "@/hooks/useFiscalInfo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  WITHDRAWAL_PERIOD_DAYS,
  GDPR_RESPONSE_DAYS,
  GDPR_ACK_DAYS,
  COMPLAINT_RESPONSE_DAYS,
  CANONICAL_DEADLINES,
  IS_VAT_PAYER_DEFAULT,
  FORBIDDEN_PHRASES,
} from "@/lib/compliance";
import { Shield, Download, ExternalLink, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export const Route = createFileRoute("/admin/compliance-report")({
  component: ComplianceReportPage,
});

// ─── Canonical legal page URLs ──────────────────────────────────────
const LEGAL_PAGES = [
  { key: "terms", label: "Termeni și Condiții", path: "/termeni-si-conditii", settingsKey: "terms" },
  { key: "privacy", label: "Politica de Confidențialitate", path: "/politica-confidentialitate", settingsKey: "privacy" },
  { key: "cookies", label: "Politica Cookies", path: "/politica-cookies", settingsKey: "cookies" },
  { key: "returns", label: "Politica de Returnare", path: "/politica-returnare", settingsKey: "returns" },
] as const;

const SITE_ORIGIN = "https://mamalucica.ro";

interface PolicyMeta {
  key: string;
  label: string;
  canonicalUrl: string;
  lastUpdated: string | null;
}

function ComplianceReportPage() {
  const company = useCompanyInfo();
  const fiscal = useFiscalInfo();
  const settings = useSiteSettings();
  const [policyMeta, setPolicyMeta] = useState<PolicyMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch policy last-updated dates from site_settings
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value, updated_at")
        .in("key", LEGAL_PAGES.map((p) => p.settingsKey));

      const map = new Map((data ?? []).map((r: any) => [r.key, r.updated_at]));

      setPolicyMeta(
        LEGAL_PAGES.map((p) => ({
          key: p.key,
          label: p.label,
          canonicalUrl: `${SITE_ORIGIN}${p.path}`,
          lastUpdated: map.get(p.settingsKey) ?? null,
        }))
      );
      setLoading(false);
    })();
  }, []);

  // ─── Marketing claims feature flags ─────────────────────────────
  const homepage = settings.homepage ?? {};
  const trustBadges = settings.trust_badges ?? {};
  const general = settings.general ?? {};

  const featureFlags = useMemo(
    () => [
      { flag: "homepage.show_hero", value: homepage.show_hero !== false, label: "Hero Section vizibilă" },
      { flag: "homepage.show_why_us", value: homepage.show_why_us !== false, label: "Secțiunea 'De ce noi'" },
      { flag: "homepage.show_trust_strip", value: homepage.show_trust_strip !== false, label: "Trust Strip" },
      { flag: "trust_badges.enabled", value: trustBadges.enabled !== false, label: "Trust Badges" },
      { flag: "general.is_vat_payer", value: general.is_vat_payer === true, label: "Plătitor TVA" },
      { flag: "general.cookie_banner_enabled", value: general.cookie_banner_enabled !== false, label: "Cookie Banner" },
      { flag: "general.ga4_enabled", value: !!general.ga4_measurement_id, label: "Google Analytics activ" },
      { flag: "general.fb_pixel_enabled", value: !!general.fb_pixel_id, label: "Facebook Pixel activ" },
    ],
    [homepage, trustBadges, general]
  );

  // ─── Build full report object for JSON export ───────────────────
  const reportData = useMemo(
    () => ({
      _meta: {
        generated_at: new Date().toISOString(),
        purpose: "Operational traceability — NOT legal certification",
        requires_review: "[LEGAL_REVIEW] [CONTABIL]",
      },
      company: {
        name: company.name,
        cui: company.cui,
        reg_com: company.regCom,
        address: company.fullAddress,
        email: company.email,
        phone: company.phone,
        iban: company.iban,
        bank: company.bank,
      },
      fiscal: {
        is_vat_payer: fiscal.isVatPayer,
        vat_rate: fiscal.vatRate,
        price_label: fiscal.priceLabel,
        price_disclaimer: fiscal.priceDisclaimer,
        compile_time_default: IS_VAT_PAYER_DEFAULT,
      },
      legal_pages: policyMeta,
      canonical_deadlines: CANONICAL_DEADLINES,
      forbidden_phrases: FORBIDDEN_PHRASES.map((f) => ({
        pattern: f.pattern.source,
        reason: f.reason,
      })),
      feature_flags: featureFlags,
      footer_disclaimer_source: "site_settings.general.legal_disclaimer_price_ro → useFiscalInfo()",
    }),
    [company, fiscal, policyMeta, featureFlags]
  );

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-accent" />
          <div>
            <h1 className="text-2xl font-bold">Raport Conformitate</h1>
            <p className="text-sm text-muted-foreground">
              Trasabilitate operațională — nu certificare juridică
            </p>
          </div>
        </div>
        <button
          onClick={exportJson}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Se încarcă...</p>
      ) : (
        <div className="grid gap-6">
          {/* ─── Legal Pages ──────────────────────────────────── */}
          <Section title="Pagini Legale — URL-uri Canonice">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Pagină</th>
                  <th className="pb-2 font-medium">URL Canonic</th>
                  <th className="pb-2 font-medium">Ultima actualizare (DB)</th>
                </tr>
              </thead>
              <tbody>
                {policyMeta.map((p) => (
                  <tr key={p.key} className="border-b border-border/50">
                    <td className="py-2 font-medium">{p.label}</td>
                    <td className="py-2">
                      <a
                        href={p.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {p.canonicalUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {p.lastUpdated
                        ? new Date(p.lastUpdated).toLocaleDateString("ro-RO", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* ─── Fiscal Status ────────────────────────────────── */}
          <Section title="Stare Fiscală">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Plătitor TVA" value={fiscal.isVatPayer ? "DA" : "NU"} warn={false} />
              <InfoRow label="Cotă TVA" value={fiscal.isVatPayer ? `${fiscal.vatRate}%` : "N/A"} />
              <InfoRow label="Etichetă preț" value={fiscal.priceLabel} />
              <InfoRow
                label="Valoare compilare IS_VAT_PAYER_DEFAULT"
                value={IS_VAT_PAYER_DEFAULT ? "true" : "false"}
                warn={IS_VAT_PAYER_DEFAULT !== fiscal.isVatPayer}
                warnText="Diferență între valoarea compilare și DB!"
              />
            </div>
            <div className="mt-3 rounded-md border border-border/50 bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">Disclaimer preț (sursă: useFiscalInfo)</p>
              <p className="mt-1 text-sm">{fiscal.priceDisclaimer}</p>
            </div>
          </Section>

          {/* ─── Canonical Deadlines ──────────────────────────── */}
          <Section title="Termene Canonice">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Termen</th>
                  <th className="pb-2 font-medium">Zile</th>
                  <th className="pb-2 font-medium">Unitate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(CANONICAL_DEADLINES).map(([key, d]) => (
                  <tr key={key} className="border-b border-border/50">
                    <td className="py-2 font-medium">{d.label}</td>
                    <td className="py-2">{d.days}</td>
                    <td className="py-2 text-muted-foreground">{d.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* ─── Feature Flags ────────────────────────────────── */}
          <Section title="Feature Flags & Marketing Claims">
            <div className="grid gap-2 sm:grid-cols-2">
              {featureFlags.map((f) => (
                <div key={f.flag} className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2">
                  {f.value ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">{f.label}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{f.flag}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ─── Company Identity ─────────────────────────────── */}
          <Section title="Identitate Companie (din DB)">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Denumire" value={company.name} />
              <InfoRow label="CUI" value={company.cui} />
              <InfoRow label="Reg. Com." value={company.regCom} />
              <InfoRow label="Adresă" value={company.fullAddress} />
              <InfoRow label="Email" value={company.email} />
              <InfoRow label="Telefon" value={company.phone} />
              <InfoRow label="IBAN" value={company.iban} />
              <InfoRow label="Bancă" value={company.bank} />
            </div>
          </Section>

          {/* ─── Forbidden Phrases ────────────────────────────── */}
          <Section title="Reguli Fraze Interzise (compliance.ts)">
            <div className="space-y-2">
              {FORBIDDEN_PHRASES.map((f, i) => (
                <div key={i} className="rounded-md border border-border/50 px-3 py-2">
                  <p className="font-mono text-xs text-destructive">{f.pattern.source}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{f.reason}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Footer note */}
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Acest raport este generat automat din configurarea actuală a bazei de date și a codului sursă.
          <strong> Nu constituie certificare juridică sau fiscală.</strong> Toate textele legale necesită
          revizuire de către avocat și contabil înainte de publicare. [LEGAL_REVIEW] [CONTABIL]
        </p>
      </div>
    </div>
  );
}

// ─── Reusable sub-components ─────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  warn = false,
  warnText,
}: {
  label: string;
  value: string;
  warn?: boolean;
  warnText?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
      {warn && warnText && (
        <span className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" />
          {warnText}
        </span>
      )}
    </div>
  );
}
