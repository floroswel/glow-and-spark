#!/usr/bin/env node
// Audit script: finds forbidden TVA/VAT strings in src/ when is_vat_payer=false
// Usage: node scripts/remove-vat-audit.mjs
// Exit code != 0 if matches found

import { execSync } from "child_process";

const FORBIDDEN = [
  "cu TVA", "includ TVA", "TVA inclus", "TVA 19", "fără TVA",
  "price_with_vat", "price_without_vat", "includes_vat",
  "\\* 1\\.19", "/ 1\\.19", "\\* 1\\.09",
];

// Exclude: node_modules, .gen files, this script, UI libs, types.ts
const EXCLUDE = "--glob '!node_modules' --glob '!*.gen.*' --glob '!scripts/*' --glob '!src/components/ui/*' --glob '!src/integrations/supabase/types.ts'";

let found = false;
for (const term of FORBIDDEN) {
  try {
    const out = execSync(`rg -n "${term}" src/ supabase/functions/ ${EXCLUDE} 2>/dev/null || true`, { encoding: "utf-8" }).trim();
    if (out) {
      console.error(`❌ Found "${term}":\n${out}\n`);
      found = true;
    }
  } catch { /* ignore */ }
}

if (found) {
  console.error("\n🚫 Audit FAILED: TVA references found while is_vat_payer=false");
  process.exit(1);
} else {
  console.log("✅ Audit PASSED: No forbidden TVA references found in src/ or edge functions");
  process.exit(0);
}
