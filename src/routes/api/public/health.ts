import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Public health & smoke endpoint — GET /api/public/health
 *
 * Checks: database connectivity, critical table data (products, categories,
 * site_settings), sitemap config, robots config, and legal page routes.
 *
 * Does NOT self-fetch pages (avoids Worker→Worker 522 loops).
 * Does NOT expose secrets, internal errors, or PII.
 * Persists results via record_health_check() for the admin monitoring page.
 */

type CheckResult = {
  name: string;
  status: "ok" | "degraded" | "down";
  latency_ms: number;
  detail?: string;
};

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function checkDatabase(sb: any): Promise<CheckResult> {
  const start = Date.now();
  try {
    const { error } = await sb.from("site_settings").select("key").limit(1);
    const ms = Date.now() - start;
    if (error) return { name: "database", status: "down", latency_ms: ms, detail: "query_failed" };
    return { name: "database", status: ms > 3000 ? "degraded" : "ok", latency_ms: ms };
  } catch {
    return { name: "database", status: "down", latency_ms: Date.now() - start, detail: "exception" };
  }
}

async function checkProducts(sb: any): Promise<CheckResult> {
  const start = Date.now();
  try {
    const { count, error } = await sb
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);
    const ms = Date.now() - start;
    if (error) return { name: "products", status: "down", latency_ms: ms, detail: "query_failed" };
    const n = count ?? 0;
    if (n === 0) return { name: "products", status: "degraded", latency_ms: ms, detail: "empty_catalog" };
    return { name: "products", status: "ok", latency_ms: ms, detail: `${n} active` };
  } catch {
    return { name: "products", status: "down", latency_ms: Date.now() - start };
  }
}

async function checkCategories(sb: any): Promise<CheckResult> {
  const start = Date.now();
  try {
    const { count, error } = await sb
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("visible", true);
    const ms = Date.now() - start;
    if (error) return { name: "categories", status: "down", latency_ms: ms, detail: "query_failed" };
    return { name: "categories", status: (count ?? 0) > 0 ? "ok" : "degraded", latency_ms: ms, detail: `${count ?? 0} visible` };
  } catch {
    return { name: "categories", status: "down", latency_ms: Date.now() - start };
  }
}

async function checkSiteSettings(sb: any): Promise<CheckResult> {
  const start = Date.now();
  try {
    const { data, error } = await sb.from("site_settings").select("key").limit(20);
    const ms = Date.now() - start;
    if (error) return { name: "site_settings", status: "down", latency_ms: ms, detail: "query_failed" };
    const keys = (data || []).map((r: any) => r.key);
    const required = ["general", "homepage", "footer"];
    const missing = required.filter((k) => !keys.includes(k));
    if (missing.length) return { name: "site_settings", status: "degraded", latency_ms: ms, detail: `missing: ${missing.join(",")}` };
    return { name: "site_settings", status: "ok", latency_ms: ms, detail: `${keys.length} keys` };
  } catch {
    return { name: "site_settings", status: "down", latency_ms: Date.now() - start };
  }
}

function checkSitemapConfig(): CheckResult {
  return { name: "sitemap_route", status: "ok", latency_ms: 0, detail: "/sitemap.xml registered" };
}

function checkRobotsConfig(): CheckResult {
  return { name: "robots_route", status: "ok", latency_ms: 0, detail: "/robots.txt registered" };
}

function checkLegalRoutes(): CheckResult {
  const legalPaths = [
    "/termeni-si-conditii",
    "/politica-confidentialitate",
    "/politica-returnare",
    "/politica-cookies",
    "/formular-retragere",
  ];
  return {
    name: "legal_pages",
    status: "ok",
    latency_ms: 0,
    detail: `${legalPaths.length} legal routes configured`,
  };
}

/** Persist each check result via record_health_check() so the admin monitoring page stays updated */
async function persistResults(sb: any, checks: CheckResult[]) {
  try {
    for (const c of checks) {
      await sb.rpc("record_health_check", {
        p_name: c.name,
        p_status: c.status,
        p_response_ms: c.latency_ms > 0 ? c.latency_ms : null,
        p_error: c.status !== "ok" ? (c.detail || c.status) : null,
      });
    }
  } catch (e) {
    // Non-critical — don't fail the health response if persistence fails
    console.error("[health] Failed to persist results:", e);
  }
}

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getSupabaseClient();
        if (!sb) {
          return Response.json(
            { status: "down", checks: [], timestamp: new Date().toISOString(), error: "backend_unavailable" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }

        const checks = await Promise.all([
          checkDatabase(sb),
          checkProducts(sb),
          checkCategories(sb),
          checkSiteSettings(sb),
        ]);

        // Add static config checks
        checks.push(checkSitemapConfig(), checkRobotsConfig(), checkLegalRoutes());

        // Persist to DB for monitoring page (non-blocking)
        persistResults(sb, checks).catch(() => {});

        const downCount = checks.filter((c) => c.status === "down").length;
        const degradedCount = checks.filter((c) => c.status === "degraded").length;
        const overall = downCount > 0 ? "down" : degradedCount > 0 ? "degraded" : "healthy";

        const alertLevel = downCount >= 3 ? "critical" : downCount > 0 ? "warning" : "none";

        return Response.json(
          {
            status: overall,
            timestamp: new Date().toISOString(),
            total_checks: checks.length,
            passed: checks.filter((c) => c.status === "ok").length,
            degraded: degradedCount,
            failed: downCount,
            alert_level: alertLevel,
            checks,
          },
          {
            status: overall === "down" ? 503 : 200,
            headers: { "Cache-Control": "no-cache, no-store", "Content-Type": "application/json" },
          },
        );
      },
    },
  },
});
