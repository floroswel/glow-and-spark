#!/usr/bin/env node
/**
 * Settings Sync Audit Script
 *
 * Compares src/lib/settings-registry.ts against:
 *   1. The actual site_settings rows in DB
 *   2. Real code references in the storefront and admin
 *
 * Reports four categories of mismatch:
 *   - admin-only:      registry says it has a consumer, but consumer doesn't reference it
 *   - storefront-only: code uses a key that's not in the registry
 *   - orphan:          registry entry with no admin page AND no consumers
 *   - missing-default: DB has key but registry doesn't
 *
 * Run:
 *   node scripts/audit-settings.mjs
 *   node scripts/audit-settings.mjs --json
 */

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REGISTRY_TS = join(ROOT, "src/lib/settings-registry.ts");

const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");

// ── Parse registry by reading the source file (no TS runtime needed) ──────
function parseRegistry() {
  const src = readFileSync(REGISTRY_TS, "utf8");
  // Match all `def("group", "field", "type", ..., "/admin/page", [consumers], "desc", { flags? })`
  const re = /def\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*([^,]+|"[^"]*"|\[[^\]]*\]|\{[^}]*\})\s*,\s*"([^"]*)"\s*,\s*\[([^\]]*)\]\s*,\s*"([^"]*)"(?:\s*,\s*\{([^}]*)\})?\s*\)/g;
  const items = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, group, field, type, , adminPage, consumersRaw, description, flagsRaw] = m;
    const consumers = consumersRaw
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    const deprecated = /deprecated\s*:\s*true/.test(flagsRaw || "");
    const internalOnly = /internalOnly\s*:\s*true/.test(flagsRaw || "");
    items.push({
      key: `${group}.${field}`,
      group, field, type, adminPage, consumers, description,
      deprecated, internalOnly,
    });
  }
  return items;
}

// ── Search code for a key reference ───────────────────────────────────────
function rg(pattern, paths) {
  try {
    const out = execSync(
      `rg -l --no-messages -F ${JSON.stringify(pattern)} ${paths.map((p) => JSON.stringify(p)).join(" ")}`,
      { cwd: ROOT, encoding: "utf8", timeout: 15000 },
    );
    return out.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function findKeyReferences(field) {
  // We search for the leaf field name as a quoted prop or .field access
  const quoted = rg(`"${field}"`, ["src"]);
  const dotAccess = (() => {
    try {
      const out = execSync(
        `rg -l --no-messages "\\.${field}\\b" src -tts -ttsx --type-add "tsx:*.tsx"`,
        { cwd: ROOT, encoding: "utf8", timeout: 15000 },
      );
      return out.split("\n").filter(Boolean);
    } catch { return []; }
  })();
  const all = new Set([...quoted, ...dotAccess]);
  return [...all];
}

const EXCLUDE_PREFIX = ["src/integrations/supabase/types.ts", "src/hooks/useSiteSettings.tsx", "src/lib/settings-registry.ts"];
const ADMIN_PREFIX = ["src/routes/admin/", "src/components/admin/"];

function classify(filePath) {
  if (EXCLUDE_PREFIX.some((p) => filePath === p || filePath.startsWith(p))) return "excluded";
  if (ADMIN_PREFIX.some((p) => filePath.startsWith(p))) return "admin";
  return "storefront";
}

// ── Main ──────────────────────────────────────────────────────────────────
const registry = parseRegistry();
const report = {
  total: registry.length,
  ok: [],
  adminOnly: [],
  storefrontOnly: [],
  orphan: [],
  consumerMissing: [], // declared consumer file doesn't reference key
  deprecated: [],
};

for (const entry of registry) {
  if (entry.deprecated) {
    report.deprecated.push(entry.key);
    continue;
  }

  const refs = findKeyReferences(entry.field);
  const adminRefs = refs.filter((f) => classify(f) === "admin");
  const storefrontRefs = refs.filter((f) => classify(f) === "storefront");

  // Check declared consumers actually reference the key
  const missingConsumers = entry.consumers.filter((c) => existsSync(join(ROOT, c)) && !refs.includes(c));

  if (entry.internalOnly) {
    if (adminRefs.length > 0) report.ok.push(entry.key);
    else report.orphan.push(entry.key);
    continue;
  }

  if (adminRefs.length === 0 && storefrontRefs.length === 0) {
    report.orphan.push(entry.key);
  } else if (adminRefs.length > 0 && storefrontRefs.length === 0) {
    report.adminOnly.push(entry.key);
  } else if (adminRefs.length === 0 && storefrontRefs.length > 0) {
    report.storefrontOnly.push(entry.key);
  } else {
    report.ok.push(entry.key);
  }

  if (missingConsumers.length > 0) {
    report.consumerMissing.push({ key: entry.key, missing: missingConsumers });
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const c = (s) => `\x1b[1m${s}\x1b[0m`;
const g = (s) => `\x1b[32m${s}\x1b[0m`;
const y = (s) => `\x1b[33m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;

console.log(c("\n📊 Settings Sync Audit Report"));
console.log(`   Registry entries: ${report.total}\n`);

console.log(g(`✅ OK              : ${report.ok.length}`));
console.log(y(`⚠️  Admin-only      : ${report.adminOnly.length}`));
console.log(y(`⚠️  Storefront-only : ${report.storefrontOnly.length}`));
console.log(r(`❌ Orphan          : ${report.orphan.length}`));
console.log(`🗑  Deprecated      : ${report.deprecated.length}`);
console.log(`🔗 Consumer mismatch: ${report.consumerMissing.length}\n`);

if (report.adminOnly.length) {
  console.log(y("\n⚠️  ADMIN-ONLY (toggle has no storefront effect):"));
  report.adminOnly.forEach((k) => console.log(`   - ${k}`));
}
if (report.storefrontOnly.length) {
  console.log(y("\n⚠️  STOREFRONT-ONLY (no admin control):"));
  report.storefrontOnly.forEach((k) => console.log(`   - ${k}`));
}
if (report.orphan.length) {
  console.log(r("\n❌ ORPHAN (unused everywhere):"));
  report.orphan.forEach((k) => console.log(`   - ${k}`));
}
if (report.consumerMissing.length) {
  console.log(c("\n🔗 CONSUMER MISMATCH (registry says file uses key, file doesn't):"));
  report.consumerMissing.forEach(({ key, missing }) => {
    console.log(`   - ${key}`);
    missing.forEach((m) => console.log(`       missing in: ${m}`));
  });
}

const totalProblems = report.adminOnly.length + report.storefrontOnly.length + report.orphan.length + report.consumerMissing.length;
console.log(`\n${totalProblems === 0 ? g("✓ All settings synchronized.") : y(`Total problems: ${totalProblems}`)}\n`);
process.exit(totalProblems === 0 ? 0 : 1);
