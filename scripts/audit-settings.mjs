#!/usr/bin/env node
/**
 * Settings Sync Audit Script (pure Node — works on Windows/macOS/Linux)
 *
 * Compares src/lib/settings-registry.ts against real code references in src/.
 *
 * Categories:
 *   - admin-only:      registry says it has a consumer, but only admin code references it
 *   - storefront-only: storefront code uses a key that's not in the registry
 *   - orphan:          registry entry with no admin AND no storefront reference
 *   - consumer-mismatch: declared consumer file doesn't reference the key
 *
 * Usage:
 *   node scripts/audit-settings.mjs
 *   node scripts/audit-settings.mjs --json
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REGISTRY_TS = join(ROOT, "src/lib/settings-registry.ts");
const SRC_DIR = join(ROOT, "src");

const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");

// ── Parse registry ─────────────────────────────────────────────────────────
function parseRegistry() {
  const src = readFileSync(REGISTRY_TS, "utf8");
  const re = /def\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*([^,]+|"[^"]*"|\[[^\]]*\]|\{[^}]*\})\s*,\s*"([^"]*)"\s*,\s*\[([^\]]*)\]\s*,\s*"([^"]*)"(?:\s*,\s*\{([^}]*)\})?\s*\)/g;
  const items = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, group, field, type, , adminPage, consumersRaw, description, flagsRaw] = m;
    const consumers = consumersRaw
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    items.push({
      key: `${group}.${field}`,
      group, field, type, adminPage, consumers, description,
      deprecated: /deprecated\s*:\s*true/.test(flagsRaw || ""),
      internalOnly: /internalOnly\s*:\s*true/.test(flagsRaw || ""),
    });
  }
  return items;
}

// ── Walk src/ and load file contents ───────────────────────────────────────
const SCAN_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".turbo"]);

function walk(dir, files = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return files; }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      walk(full, files);
    } else {
      const dot = name.lastIndexOf(".");
      if (dot >= 0 && SCAN_EXTS.has(name.slice(dot))) files.push(full);
    }
  }
  return files;
}

// Build a single in-memory index: { relativePath: contents }
function buildIndex() {
  const files = walk(SRC_DIR);
  const map = new Map();
  for (const abs of files) {
    const rel = relative(ROOT, abs).split(sep).join("/");
    try { map.set(rel, readFileSync(abs, "utf8")); } catch {}
  }
  return map;
}

// ── Reference detection ───────────────────────────────────────────────────
// Match either "field" (quoted string key) or .field (dot access) as a whole token.
function makeKeyRegex(field) {
  const esc = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:["']${esc}["']|\\.${esc}\\b|\\b${esc}\\s*[:,}=])`);
}

const EXCLUDE = ["src/integrations/supabase/types.ts", "src/hooks/useSiteSettings.tsx", "src/lib/settings-registry.ts"];
const ADMIN_PREFIXES = ["src/routes/admin/", "src/components/admin/"];

function classify(rel) {
  if (EXCLUDE.includes(rel)) return "excluded";
  if (ADMIN_PREFIXES.some((p) => rel.startsWith(p))) return "admin";
  return "storefront";
}

function findKeyReferences(field, index) {
  const re = makeKeyRegex(field);
  const hits = [];
  for (const [rel, content] of index) {
    if (EXCLUDE.includes(rel)) continue;
    if (re.test(content)) hits.push(rel);
  }
  return hits;
}

// ── Main ──────────────────────────────────────────────────────────────────
const registry = parseRegistry();
const index = buildIndex();

const report = {
  total: registry.length,
  ok: [],
  adminOnly: [],
  storefrontOnly: [],
  orphan: [],
  consumerMissing: [],
  deprecated: [],
};

for (const entry of registry) {
  if (entry.deprecated) {
    report.deprecated.push(entry.key);
    continue;
  }

  const refs = findKeyReferences(entry.field, index);
  const adminRefs = refs.filter((f) => classify(f) === "admin");
  const storefrontRefs = refs.filter((f) => classify(f) === "storefront");
  // Verify declared consumers actually reference the key.
  // Check the consumer file directly (don't filter through EXCLUDE), so
  // legitimate sinks like src/hooks/useSiteSettings.tsx (theme.* applier)
  // count as real consumers.
  const re = makeKeyRegex(entry.field);
  const missingConsumers = entry.consumers.filter((c) => {
    const content = index.get(c);
    if (content === undefined) return false; // unknown path — skip
    return !re.test(content);
  });

  if (entry.internalOnly) {
    if (adminRefs.length > 0) report.ok.push(entry.key);
    else report.orphan.push(entry.key);
  } else if (adminRefs.length === 0 && storefrontRefs.length === 0) {
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

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (s) => (useColor ? `\x1b[1m${s}\x1b[0m` : s);
const g = (s) => (useColor ? `\x1b[32m${s}\x1b[0m` : s);
const y = (s) => (useColor ? `\x1b[33m${s}\x1b[0m` : s);
const r = (s) => (useColor ? `\x1b[31m${s}\x1b[0m` : s);

console.log(c("\n📊 Settings Sync Audit Report"));
console.log(`   Registry entries: ${report.total}`);
console.log(`   Files scanned:    ${index.size}\n`);

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
  console.log(c("\n🔗 CONSUMER MISMATCH (informational — declared consumer file may use indirect access):"));
  report.consumerMissing.forEach(({ key, missing }) => {
    console.log(`   - ${key}`);
    missing.forEach((m) => console.log(`       missing in: ${m}`));
  });
}

// Exit code is gated on STRUCTURAL problems only (admin/storefront/orphan).
// consumerMissing is informational: detection is heuristic and may produce
// false positives for destructuring or computed property access.
const blockers = report.adminOnly.length + report.storefrontOnly.length + report.orphan.length;
const totalIssues = blockers + report.consumerMissing.length;
console.log(
  `\n${blockers === 0 ? g("✓ All settings synchronized.") : y(`Blocking problems: ${blockers}`)}` +
    (report.consumerMissing.length ? y(`  (${report.consumerMissing.length} informational mismatches)`) : "") +
    "\n",
);
process.exit(blockers === 0 ? 0 : 1);

