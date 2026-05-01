import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const CHECKS = [
  { name: "database", test: checkDatabase },
  { name: "sitemap", test: checkSitemap },
  { name: "homepage", test: checkPage("/") },
  { name: "catalog", test: checkPage("/catalog") },
  { name: "checkout", test: checkPage("/checkout") },
  { name: "contact", test: checkPage("/contact") },
  { name: "cart", test: checkPage("/cart") },
] as const;

type CheckResult = {
  name: string;
  status: "ok" | "degraded" | "down";
  response_time_ms: number;
  error?: string;
};

async function checkDatabase(): Promise<Omit<CheckResult, "name">> {
  const start = Date.now();
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return { status: "down", response_time_ms: 0, error: "Missing DB config" };

    const supabase = createClient(url, key);
    const { error } = await supabase.from("site_settings").select("id").limit(1);
    const ms = Date.now() - start;
    if (error) return { status: "down", response_time_ms: ms, error: error.message };
    return { status: ms > 3000 ? "degraded" : "ok", response_time_ms: ms };
  } catch (e: any) {
    return { status: "down", response_time_ms: Date.now() - start, error: e.message };
  }
}

async function checkSitemap(): Promise<Omit<CheckResult, "name">> {
  const start = Date.now();
  try {
    const res = await fetch("https://mamalucica.ro/sitemap.xml", {
      signal: AbortSignal.timeout(10000),
    });
    const ms = Date.now() - start;
    if (!res.ok) return { status: "down", response_time_ms: ms, error: `HTTP ${res.status}` };
    const body = await res.text();
    if (!body.includes("<urlset")) return { status: "degraded", response_time_ms: ms, error: "Invalid sitemap XML" };
    return { status: ms > 5000 ? "degraded" : "ok", response_time_ms: ms };
  } catch (e: any) {
    return { status: "down", response_time_ms: Date.now() - start, error: e.message };
  }
}

function checkPage(path: string) {
  return async (): Promise<Omit<CheckResult, "name">> => {
    const start = Date.now();
    try {
      const res = await fetch(`https://mamalucica.ro${path}`, {
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
      });
      const ms = Date.now() - start;
      if (!res.ok) return { status: "down", response_time_ms: ms, error: `HTTP ${res.status}` };
      return { status: ms > 5000 ? "degraded" : "ok", response_time_ms: ms };
    } catch (e: any) {
      return { status: "down", response_time_ms: Date.now() - start, error: e.message };
    }
  };
}

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const results: CheckResult[] = [];
        for (const check of CHECKS) {
          const result = await check.test();
          results.push({ name: check.name, ...result });
        }

        // Record results in DB
        try {
          const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (url && key) {
            const supabase = createClient(url, key);
            for (const r of results) {
              await supabase.rpc("record_health_check", {
                p_name: r.name,
                p_status: r.status,
                p_response_ms: r.response_time_ms,
                p_error: r.error || null,
              });
            }
          }
        } catch (_) {
          // Don't fail the health response if DB recording fails
        }

        const overall = results.some((r) => r.status === "down")
          ? "down"
          : results.some((r) => r.status === "degraded")
            ? "degraded"
            : "ok";

        return Response.json(
          { status: overall, checks: results, timestamp: new Date().toISOString() },
          {
            status: overall === "ok" ? 200 : overall === "degraded" ? 200 : 503,
            headers: {
              "Cache-Control": "no-store",
              "Content-Type": "application/json",
            },
          }
        );
      },
      POST: async () => {
        // pg_cron calls POST — same logic
        const getHandler = Route.options?.server?.handlers;
        if (getHandler && typeof getHandler === "object" && "GET" in getHandler) {
          return (getHandler as any).GET({ request: new Request("https://mamalucica.ro/api/public/health") });
        }
        return new Response("OK");
      },
    },
  },
});
