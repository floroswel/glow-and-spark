import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Public health endpoint — sanitized for production.
 * Does NOT expose internal error messages, DB config details, or service role keys in responses.
 */

const CHECKS = [
  { name: "database", test: checkDatabase },
  { name: "sitemap", test: checkSitemap },
  { name: "homepage", test: checkPage("/") },
  { name: "catalog", test: checkPage("/catalog") },
  { name: "contact", test: checkPage("/contact") },
] as const;

type CheckResult = {
  name: string;
  status: "ok" | "degraded" | "down";
  response_time_ms: number;
};

// Internal-only result with error details (never exposed to client)
type InternalCheckResult = CheckResult & { _error?: string };

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function checkDatabase(): Promise<InternalCheckResult> {
  const start = Date.now();
  try {
    const sb = getSupabaseClient();
    if (!sb) return { name: "database", status: "down", response_time_ms: 0, _error: "no config" };
    const { error } = await sb.from("site_settings").select("id").limit(1);
    const ms = Date.now() - start;
    if (error) return { name: "database", status: "down", response_time_ms: ms, _error: "query failed" };
    return { name: "database", status: ms > 3000 ? "degraded" : "ok", response_time_ms: ms };
  } catch {
    return { name: "database", status: "down", response_time_ms: Date.now() - start, _error: "exception" };
  }
}

async function checkSitemap(): Promise<InternalCheckResult> {
  const start = Date.now();
  try {
    const res = await fetch("https://mamalucica.ro/sitemap.xml", { signal: AbortSignal.timeout(10000) });
    const ms = Date.now() - start;
    if (!res.ok) return { name: "sitemap", status: "down", response_time_ms: ms, _error: `http_${res.status}` };
    const body = await res.text();
    if (!body.includes("<urlset")) return { name: "sitemap", status: "degraded", response_time_ms: ms, _error: "invalid_xml" };
    return { name: "sitemap", status: ms > 5000 ? "degraded" : "ok", response_time_ms: ms };
  } catch {
    return { name: "sitemap", status: "down", response_time_ms: Date.now() - start, _error: "timeout" };
  }
}

function checkPage(path: string) {
  return async (): Promise<InternalCheckResult> => {
    const start = Date.now();
    try {
      const res = await fetch(`https://mamalucica.ro${path}`, { signal: AbortSignal.timeout(10000), redirect: "follow" });
      const ms = Date.now() - start;
      if (!res.ok) return { name: path, status: "down", response_time_ms: ms, _error: `http_${res.status}` };
      return { name: path, status: ms > 5000 ? "degraded" : "ok", response_time_ms: ms };
    } catch {
      return { name: path, status: "down", response_time_ms: Date.now() - start, _error: "timeout" };
    }
  };
}

async function runChecks(): Promise<{ results: InternalCheckResult[]; overall: string }> {
  const results: InternalCheckResult[] = [];
  for (const check of CHECKS) {
    const result = await check.test();
    results.push({ ...result, name: check.name });
  }

  // Record to DB — fire-and-forget, never fail the response
  try {
    const sb = getSupabaseClient();
    if (sb) {
      for (const r of results) {
        await sb.rpc("record_health_check", {
          p_name: r.name,
          p_status: r.status,
          p_response_ms: r.response_time_ms,
          p_error: r._error || null,
        });
      }
    }
  } catch {
    // Silent — health recording failure should never affect the health response
  }

  const overall = results.some((r) => r.status === "down")
    ? "down"
    : results.some((r) => r.status === "degraded")
      ? "degraded"
      : "ok";

  return { results, overall };
}

/** Sanitize results for public consumption — strip internal error details */
function sanitize(results: InternalCheckResult[]): CheckResult[] {
  return results.map(({ _error, ...rest }) => rest);
}

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const { results, overall } = await runChecks();
        return Response.json(
          { status: overall, checks: sanitize(results), timestamp: new Date().toISOString() },
          {
            status: overall === "down" ? 503 : 200,
            headers: { "Cache-Control": "no-store", "Content-Type": "application/json" },
          },
        );
      },
      POST: async () => {
        const { results, overall } = await runChecks();
        return Response.json(
          { status: overall, checks: sanitize(results), timestamp: new Date().toISOString() },
          { status: overall === "down" ? 503 : 200, headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
