import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/public/monitors/smoke
 *
 * Lightweight smoke test that probes critical public URLs on the live site.
 * Returns JSON health status — no secrets, no PII.
 *
 * Checks:
 *  - Homepage (GET /)
 *  - Checkout page (GET /checkout)
 *  - robots.txt (GET /robots.txt)
 *  - sitemap.xml (GET /sitemap.xml)
 *  - Legal pages (termeni, confidentialitate, returnare, cookies, retragere)
 *  - Supabase DB connectivity via anon key (site_settings query)
 */

type ProbeResult = {
  name: string;
  url: string;
  status: "ok" | "degraded" | "down";
  http_status?: number;
  latency_ms: number;
  detail?: string;
};

/** Probe a URL with HEAD first, fallback to GET. No redirects followed for speed. */
async function probeUrl(
  name: string,
  url: string,
  opts?: { expectContentType?: string; maxMs?: number; method?: string }
): Promise<ProbeResult> {
  const method = opts?.method || "GET";
  const maxMs = opts?.maxMs ?? 5000;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), maxMs);
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "MamaLucica-SmokeMonitor/1.0" },
    });
    clearTimeout(timeout);
    const ms = Date.now() - start;
    const httpStatus = res.status;

    if (httpStatus >= 500) {
      return { name, url, status: "down", http_status: httpStatus, latency_ms: ms, detail: `server_error_${httpStatus}` };
    }
    if (httpStatus >= 400) {
      return { name, url, status: "down", http_status: httpStatus, latency_ms: ms, detail: `client_error_${httpStatus}` };
    }
    if (httpStatus >= 300) {
      return { name, url, status: "degraded", http_status: httpStatus, latency_ms: ms, detail: "redirect" };
    }

    // Content-type validation
    if (opts?.expectContentType) {
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes(opts.expectContentType)) {
        return { name, url, status: "degraded", http_status: httpStatus, latency_ms: ms, detail: `unexpected_content_type: ${ct.slice(0, 60)}` };
      }
    }

    return {
      name,
      url,
      status: ms > 4000 ? "degraded" : "ok",
      http_status: httpStatus,
      latency_ms: ms,
    };
  } catch (err: any) {
    const ms = Date.now() - start;
    const detail = err?.name === "AbortError" ? "timeout" : "fetch_failed";
    return { name, url, status: "down", latency_ms: ms, detail };
  }
}

/** Check Supabase DB via anon key — lightweight query */
async function probeDatabase(): Promise<ProbeResult> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    return { name: "database", url: "n/a", status: "down", latency_ms: 0, detail: "no_credentials" };
  }

  const start = Date.now();
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?select=key&limit=3`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );
    const ms = Date.now() - start;
    if (!res.ok) {
      return { name: "database", url: supabaseUrl, status: "down", http_status: res.status, latency_ms: ms, detail: "query_failed" };
    }
    const data = await res.json();
    const keys = Array.isArray(data) ? data.map((r: any) => r.key) : [];
    const required = ["general", "homepage", "footer"];
    const missing = required.filter((k) => !keys.includes(k));
    if (missing.length) {
      return { name: "database", url: "rest/v1", status: "degraded", latency_ms: ms, detail: `missing_settings: ${missing.join(",")}` };
    }
    return { name: "database", url: "rest/v1", status: ms > 3000 ? "degraded" : "ok", latency_ms: ms, detail: `${keys.length} keys` };
  } catch {
    return { name: "database", url: "rest/v1", status: "down", latency_ms: Date.now() - start, detail: "exception" };
  }
}

export const Route = (createFileRoute as any)("/api/public/monitors/smoke")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Determine base URL from request or env
        const requestUrl = new URL(request.url);
        const origin = requestUrl.origin;
        // Use the canonical domain if we're behind a proxy
        const baseUrl =
          process.env.SITE_URL ||
          (origin.includes("localhost") ? origin : "https://mamalucica.ro");

        // Define probes
        const pageProbes = [
          { name: "homepage", path: "/", expectContentType: "text/html" },
          { name: "checkout", path: "/checkout", expectContentType: "text/html" },
          { name: "robots_txt", path: "/robots.txt", expectContentType: "text/plain" },
          { name: "sitemap_xml", path: "/sitemap.xml", expectContentType: "xml" },
          { name: "legal_termeni", path: "/termeni-si-conditii", expectContentType: "text/html" },
          { name: "legal_confidentialitate", path: "/politica-confidentialitate", expectContentType: "text/html" },
          { name: "legal_returnare", path: "/politica-returnare", expectContentType: "text/html" },
          { name: "legal_cookies", path: "/politica-cookies", expectContentType: "text/html" },
          { name: "legal_retragere", path: "/formular-retragere", expectContentType: "text/html" },
        ];

        // Run all probes in parallel
        const [dbResult, ...pageResults] = await Promise.all([
          probeDatabase(),
          ...pageProbes.map((p) =>
            probeUrl(p.name, `${baseUrl}${p.path}`, {
              expectContentType: p.expectContentType,
              maxMs: 8000,
            })
          ),
        ]);

        const checks: ProbeResult[] = [dbResult, ...pageResults];

        const downCount = checks.filter((c) => c.status === "down").length;
        const degradedCount = checks.filter((c) => c.status === "degraded").length;
        const overall = downCount > 0 ? "down" : degradedCount > 0 ? "degraded" : "healthy";
        const alertLevel = downCount >= 3 ? "critical" : downCount > 0 ? "warning" : "none";

        return Response.json(
          {
            status: overall,
            timestamp: new Date().toISOString(),
            base_url: baseUrl,
            total_checks: checks.length,
            passed: checks.filter((c) => c.status === "ok").length,
            degraded: degradedCount,
            failed: downCount,
            alert_level: alertLevel,
            checks,
          },
          {
            status: overall === "down" ? 503 : 200,
            headers: {
              "Cache-Control": "no-cache, no-store",
              "Content-Type": "application/json",
            },
          }
        );
      },
    },
  },
});
