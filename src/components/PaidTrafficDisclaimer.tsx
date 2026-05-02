/**
 * PaidTrafficDisclaimer — Reusable ANPC-safe disclaimer for promotional landing pages.
 *
 * Reads admin-editable fields from site_settings.general.paid_traffic_disclaimer:
 *   - enabled: boolean
 *   - promo_name: string (e.g. "Reduceri de Vară 2026")
 *   - valid_from: ISO date string
 *   - valid_until: ISO date string
 *   - stock_limited: boolean
 *   - stock_note: string (e.g. "Stocul este limitat și poate varia")
 *   - eligibility_note: string (e.g. "Oferta se aplică doar comenzilor plasate pe site")
 *   - custom_note: string (free-form extra text, [ANPC_SAFE_LANGUAGE])
 *
 * Shows promo validity dates from the SAME source of truth used by checkout,
 * preventing date/stock mismatches between ads and storefront.
 *
 * [ANPC_SAFE_LANGUAGE] — All text must avoid absolute promises.
 * [LEGAL_REVIEW] — Final wording should be validated by a lawyer.
 */
import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Info } from "lucide-react";

interface PaidTrafficDisclaimerConfig {
  enabled?: boolean;
  promo_name?: string;
  valid_from?: string;
  valid_until?: string;
  stock_limited?: boolean;
  stock_note?: string;
  eligibility_note?: string;
  custom_note?: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function PaidTrafficDisclaimer({ className = "" }: { className?: string }) {
  const { general } = useSiteSettings();
  const config: PaidTrafficDisclaimerConfig = general?.paid_traffic_disclaimer || {};

  if (!config.enabled) return null;

  const hasValidity = config.valid_from || config.valid_until;

  return (
    <div className={`rounded-lg border border-border bg-secondary/30 p-4 text-xs text-muted-foreground space-y-2 ${className}`}>
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
        <div className="space-y-1.5">
          {config.promo_name && (
            <p className="font-semibold text-foreground text-sm">
              {config.promo_name}
            </p>
          )}

          {hasValidity && (
            <p>
              <strong>Valabilitate:</strong>{" "}
              {config.valid_from && config.valid_until
                ? `${formatDate(config.valid_from)} — ${formatDate(config.valid_until)}`
                : config.valid_until
                  ? `Până la ${formatDate(config.valid_until)}`
                  : `De la ${formatDate(config.valid_from!)}`
              }
              {" "}sau până la epuizarea stocului, în funcție de ce survine mai întâi.
            </p>
          )}

          {config.stock_limited && (
            <p>
              <strong>Stoc:</strong>{" "}
              {config.stock_note || "Stocul este limitat. Disponibilitatea produselor poate varia și nu poate fi garantată pe durata promoției."}
              {" "}[ANPC_SAFE_LANGUAGE]
            </p>
          )}

          {config.eligibility_note && (
            <p>
              <strong>Eligibilitate:</strong> {config.eligibility_note}
            </p>
          )}

          {config.custom_note && (
            <p>{config.custom_note}</p>
          )}

          <p className="pt-1">
            Detalii complete în{" "}
            <Link to="/termeni-si-conditii" className="text-accent hover:underline">Termeni și Condiții</Link>
            {" "}și{" "}
            <Link to="/politica-returnare" className="text-accent hover:underline">Politica de Returnare</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to access the canonical promo config — use in checkout, cart, countdown
 * components to ensure dates/stock claims match the disclaimer exactly.
 */
export function usePromoConfig(): PaidTrafficDisclaimerConfig & { isActive: boolean } {
  const { general } = useSiteSettings();
  const config: PaidTrafficDisclaimerConfig = general?.paid_traffic_disclaimer || {};

  const now = new Date();
  const from = config.valid_from ? new Date(config.valid_from) : null;
  const until = config.valid_until ? new Date(config.valid_until) : null;

  const isActive =
    !!config.enabled &&
    (!from || now >= from) &&
    (!until || now <= until);

  return { ...config, isActive };
}
