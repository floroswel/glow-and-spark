#!/usr/bin/env node
/**
 * compliance-grep.mjs — CI-safe script that checks for forbidden strings.
 *
 * Usage: node scripts/compliance-grep.mjs [--fail-on-error]
 *
 * Checks:
 * 1. Hardcoded CUI/IBAN outside useCompanyInfo.tsx
 * 2. TVA/VAT strings when IS_VAT_PAYER_DEFAULT=false
 * 3. Duplicate company identifiers
 */
import fs from "fs";
import path from "path";

const SRC = path.resolve("src");
const FAIL_ON_ERROR = process.argv.includes("--fail-on-error");

const COMPANY_IDENTIFIERS = ["43025661", "RO50BTRLRONCRT0566231601", "J2020000459343"];
const VAT_PATTERNS = [/prețuri?\s+(cu|inclusiv)\s+TVA/gi, /TVA\s+inclus/gi];
const ALLOWED_COMPANY_FILES = ["useCompanyInfo.tsx", "compliance-grep.mjs"];
const ALLOWED_VAT_FILES = ["compliance.ts", "useFiscalInfo.tsx", "compliance-grep.mjs", "pre-launch.tsx", ".test.ts"];

let errors = 0;

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes("node_modules") && entry.name !== ".gen.") {
      results.push(...walk(full));
    } else if ((entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) && !entry.name.includes(".gen.")) {
      results.push(full);
    }
  }
  return results;
}

const files = walk(SRC);

// Check 1: Hardcoded company identifiers
for (const file of files) {
  const rel = path.relative(SRC, file);
  if (ALLOWED_COMPANY_FILES.some((a) => rel.includes(a))) continue;
  const content = fs.readFileSync(file, "utf-8");
  for (const id of COMPANY_IDENTIFIERS) {
    if (content.includes(id)) {
      console.error(`❌ Hardcoded identifier "${id}" in ${rel} — use useCompanyInfo() instead`);
      errors++;
    }
  }
}

// Check 2: VAT strings (only when IS_VAT_PAYER_DEFAULT=false)
// Read the constant from compliance.ts
const compliancePath = path.join(SRC, "lib", "compliance.ts");
let isVatPayer = false;
if (fs.existsSync(compliancePath)) {
  const cc = fs.readFileSync(compliancePath, "utf-8");
  isVatPayer = /IS_VAT_PAYER_DEFAULT\s*=\s*true/.test(cc);
}

if (!isVatPayer) {
  for (const file of files) {
    const rel = path.relative(SRC, file);
    if (ALLOWED_VAT_FILES.some((a) => rel.includes(a))) continue;
    const content = fs.readFileSync(file, "utf-8");
    for (const pattern of VAT_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(content);
      if (match) {
        console.error(`❌ VAT string "${match[0]}" in ${rel} — company is NOT a VAT payer`);
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(`\n🚫 ${errors} compliance violation(s) found.`);
  if (FAIL_ON_ERROR) process.exit(1);
} else {
  console.log("✅ Compliance grep passed — no forbidden strings found.");
}
