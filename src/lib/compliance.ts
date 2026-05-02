/**
 * compliance.ts — Single source of truth for legal/commercial consistency.
 *
 * This module defines forbidden contradictory pairs and validators.
 * Import in legal pages and marketing blocks to prevent mismatches.
 *
 * IMPORTANT: This is engineering scaffolding. Legal correctness requires
 * Romanian lawyer review. All outputs are DRAFT_FOR_LEGAL_REVIEW.
 */

// ─── Compliance constants ────────────────────────────────────────────
// These MUST match across all legal pages, marketing blocks, checkout,
// footer, emails, and invoices.

/** Withdrawal period in calendar days (OUG 34/2014 minimum = 14) */
export const WITHDRAWAL_PERIOD_DAYS = 14;

/** GDPR response deadline in calendar days */
export const GDPR_RESPONSE_DAYS = 30;

/** GDPR acknowledgment deadline in business days */
export const GDPR_ACK_DAYS = 3;

/** Complaint response deadline in business days */
export const COMPLAINT_RESPONSE_DAYS = 5;

// ─── VAT status ──────────────────────────────────────────────────────
// Default compile-time constant used by tests and forbidden-phrase checks.
// At runtime, prefer useFiscalInfo() hook which reads from site_settings.general.is_vat_payer.
// When false, NO page/component may render "prețuri cu TVA inclus",
// "TVA inclus", "inclusiv TVA", or similar.
export const IS_VAT_PAYER_DEFAULT = false;

// ─── Forbidden phrase pairs ──────────────────────────────────────────
// Each entry: [context, forbiddenPhrase, reason]
// Used by automated tests to grep source files.

export const FORBIDDEN_PHRASES: Array<{
  pattern: RegExp;
  reason: string;
  allowedFiles?: string[];
}> = [
  // VAT contradictions (only allowed in compliance.ts itself and admin pre-launch checklist)
  {
    pattern: /prețuri?\s+(cu|inclusiv)\s+TVA/i,
    reason: "Company is NOT a VAT payer (IS_VAT_PAYER=false). Do not claim prices include VAT.",
    allowedFiles: ["compliance.ts", "admin.pre-launch.tsx"],
  },
  {
    pattern: /TVA\s+inclus/i,
    reason: "Company is NOT a VAT payer. Remove VAT-inclusive language.",
    allowedFiles: ["compliance.ts", "admin.pre-launch.tsx"],
  },
  // Legal superlatives
  {
    pattern: /\b(garantăm|întotdeauna|zero risc|100%\s*conform)/i,
    reason: "Legal superlatives are forbidden. Use qualified language with [PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL].",
    allowedFiles: ["compliance.ts"],
  },
  // Statute citations (should be generalized)
  {
    pattern: /\bart\.\s*\d+\s*(?:alin|lit|pct)/i,
    reason: "Do not cite specific articles unless copying verbatim from user-supplied statute. Use general references.",
    allowedFiles: ["compliance.ts", "admin.pre-launch.tsx", "admin/invoices.tsx"],
  },
  // Return period contradictions
  {
    pattern: /\bretur\s+gratuit\b/i,
    reason: "Return shipping cost is borne by consumer (per OUG 34). Do not promise 'free return' unless commercially offered and documented separately.",
    allowedFiles: ["compliance.ts"],
  },
];

// ─── Deadline consistency map ────────────────────────────────────────
// Maps deadline names to their canonical values. Used by tests to verify
// no page uses a different number.

export const CANONICAL_DEADLINES: Record<string, { days: number; unit: "calendaristice" | "lucrătoare"; label: string }> = {
  withdrawal: {
    days: WITHDRAWAL_PERIOD_DAYS,
    unit: "calendaristice",
    label: "Drept de retragere",
  },
  gdpr_response: {
    days: GDPR_RESPONSE_DAYS,
    unit: "calendaristice",
    label: "Răspuns cerere GDPR",
  },
  gdpr_ack: {
    days: GDPR_ACK_DAYS,
    unit: "lucrătoare",
    label: "Confirmare primire cerere GDPR",
  },
  complaint_response: {
    days: COMPLAINT_RESPONSE_DAYS,
    unit: "lucrătoare",
    label: "Răspuns reclamație",
  },
  refund: {
    days: 14,
    unit: "calendaristice",
    label: "Rambursare după retur",
  },
  return_shipping: {
    days: 14,
    unit: "calendaristice",
    label: "Trimitere produs returnat",
  },
};

// ─── Runtime helpers ─────────────────────────────────────────────────

/** Format a deadline for display in legal text */
export function formatDeadline(key: keyof typeof CANONICAL_DEADLINES): string {
  const d = CANONICAL_DEADLINES[key];
  return `${d.days} zile ${d.unit}`;
}

/** Check if a string contains VAT-inclusive language (should not appear when IS_VAT_PAYER=false) */
export function containsVatClaim(text: string): boolean {
  if (IS_VAT_PAYER) return false;
  return /prețuri?\s+(cu|inclusiv)\s+TVA/i.test(text) || /TVA\s+inclus/i.test(text);
}
