/**
 * Fiscal settings hook — single source of truth for VAT status and price disclaimers.
 * Reads from site_settings.general. Used by compliance checks, legal pages, invoices,
 * product cards, cart, checkout, footer, and email templates.
 *
 * [CONTABIL] — legal_disclaimer_price_ro text MUST be reviewed by accountant.
 */
import { useSiteSettings } from "@/hooks/useSiteSettings";

export interface FiscalInfo {
  /** Company is registered as VAT payer (plătitor de TVA) */
  isVatPayer: boolean;
  /** VAT rate (e.g. 19). Only meaningful when isVatPayer=true */
  vatRate: number;
  /** Admin-editable price disclaimer shown near prices [CONTABIL] */
  priceDisclaimer: string;
  /** Short label for price display (e.g. "Preț final" or "Preț cu TVA inclus") */
  priceLabel: string;
}

const DEFAULT_DISCLAIMER_NON_VAT =
  "Prețurile afișate sunt prețuri finale. Societatea nu este plătitoare de TVA conform art. 310 din Codul fiscal.";
const DEFAULT_DISCLAIMER_VAT =
  "Prețurile includ TVA.";

export function useFiscalInfo(): FiscalInfo {
  const { general } = useSiteSettings();

  const isVatPayer = general?.is_vat_payer === true;
  const vatRate = isVatPayer ? Number(general?.vat_rate || 19) : 0;

  const defaultDisclaimer = isVatPayer ? DEFAULT_DISCLAIMER_VAT : DEFAULT_DISCLAIMER_NON_VAT;
  const priceDisclaimer = general?.legal_disclaimer_price_ro || defaultDisclaimer;

  const priceLabel = isVatPayer ? "Preț cu TVA inclus" : "Preț final";

  return { isVatPayer, vatRate, priceDisclaimer, priceLabel };
}
