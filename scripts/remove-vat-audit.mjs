#!/usr/bin/env node
// Audit script: finds forbidden TVA/VAT strings in src/ when is_vat_payer=false
// Usage: node scripts/remove-vat-audit.mjs
// Exit code != 0 if matches found outside conditional guards
//
// Lines containing isVatPayer / is_vat_payer guards are ALLOWED — these are
// behind the toggle and only appear when VAT mode is re-enabled.
// The admin tax-settings page is also excluded (admin must see the toggle).

import { execSync } from "child_process";

const FORBIDDEN = [
  "cu TVA", "includ TVA", "TVA inclus", "TVA 19",
  "price_with_vat", "price_without_vat", "includes_vat",
  "\\* 1\\.19", "/ 1\\.19", "\\* 1\\.09",
];

// Lines matching these patterns are guarded behind the VAT toggle — safe to keep
const SAFE_PATTERNS = [
  /isVatPayer/i,
  /is_vat_payer/i,
  /vat_enabled/i,
  /show_vat/i,
  /Neplătitor/i,
  /neplătitor/i,
  /art\.\s*310/,
  /Codul fiscal/,
];

// Exclude: node_modules, .gen files, this script, UI libs, types.ts, admin tax page
const EXCLUDE = [
  "--glob '!node_modules'",
  "--glob '!*.gen.*'",
  "--glob '!scripts/*'",
  "--glob '!src/components/ui/*'",
  "--glob '!src/integrations/supabase/types.ts'",
  "--glob '!src/routes/admin/tax-settings.tsx'",
].join(" ");

let found = false;
for (const term of FORBIDDEN) {
  try {
    const out = execSync(`rg -n "${term}" src/ supabase/functions/ ${EXCLUDE} 2>/dev/null || true`, { encoding: "utf-8" }).trim();
    if (!out) continue;

    // Filter out lines that are behind conditional guards
    const unguardedLines = out
      .split("\n")
      .filter((line) => !SAFE_PATTERNS.some((p) => p.test(line)));

    if (unguardedLines.length > 0) {
      console.error(`❌ Found "${term}":\n${unguardedLines.join("\n")}\n`);
      found = true;
    }
  } catch { /* ignore */ }
}

if (found) {
  console.error("\n🚫 Audit FAILED: Unguarded TVA references found while is_vat_payer=false");
  process.exit(1);
} else {
  console.log("✅ Audit PASSED: No unguarded TVA references found in src/ or edge functions");
  process.exit(0);
}
