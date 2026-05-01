/**
 * Go-Live Monitoring — Automated uptime & functional checks
 *
 * This endpoint runs smoke checks against critical URLs and returns
 * a structured JSON report. Can be called by external monitors
 * (UptimeRobot, Checkly, Datadog) or pg_cron.
 *
 * GET /api/public/monitors/smoke
 */
import { createFileRoute } from "@tanstack/react-router";

interface CheckResult {
  name: string;
  url: string;
  status: number | null;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

const BASE_URL = "https://mamalucica.ro";

const CHECKS: { name: string; path: string; expectStatus?: number; expectBody?: string }[] = [
  // Core pages
  { name: "Homepage", path: "/", expectBody: "Mama Lucica" },
  { name: "Catalog", path: "/catalog" },
  { name: "Cart", path: "/cart" },
  { name: "Checkout", path: "/checkout" },
  { name: "Contact", path: "/contact" },

  // Legal pages (EU compliance)
  { name: "Terms & Conditions", path: "/termeni-si-conditii" },
  { name: "Privacy Policy", path: "/politica-confidentialitate" },
  { name: "Cookie Policy", path: "/politica-cookies" },
  { name: "Return Policy", path: "/politica-returnare" },
  { name: "Withdrawal Form", path: "/formular-retragere" },

  // SEO
  { name: "Sitemap XML", path: "/sitemap.xml" },
  { name: "Robots.txt", path: "/robots.txt", expectBody: "Sitemap" },

  // Auth
  { name: "Auth Page", path: "/auth" },

  // About
  { name: "About Us", path: "/despre-noi" },
];

async function runCheck(check: (typeof CHECKS)[0]): Promise<CheckResult> {
  const url = `${BASE_URL}${check.path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "MamaLucica-Monitor/1.0" },
      redirect: "follow",
    });
    const latencyMs = Date.now() - start;
    const expectedStatus = check.expectStatus || 200;
    let bodyOk = true;

    if (check.expectBody) {
      const text = await res.text();
      bodyOk = text.includes(check.expectBody);
    }

    return {
      name: check.name,
      url,
      status: res.status,
      ok: res.status === expectedStatus && bodyOk,
      latencyMs,
      error: !bodyOk ? `Missing expected content: "${check.expectBody}"` : undefined,
    };
  } catch (err: any) {
    return {
      name: check.name,
      url,
      status: null,
      ok: false,
      latencyMs: Date.now() - start,
      error: err.message || "Network error",
    };
  }
}

export const Route = createFileRoute("/api/public/monitors/smoke")({
  server: {
    handlers: {
      GET: async () => {
        const results = await Promise.all(CHECKS.map(runCheck));
        const allOk = results.every((r) => r.ok);
        const failCount = results.filter((r) => !r.ok).length;

        const report = {
          timestamp: new Date().toISOString(),
          status: allOk ? "HEALTHY" : "DEGRADED",
          totalChecks: results.length,
          passed: results.length - failCount,
          failed: failCount,
          checks: results,
          alerting: {
            level: failCount === 0 ? "none" : failCount <= 2 ? "warning" : "critical",
            rules: [
              "WARNING: 1-2 checks failed — investigate within 1h",
              "CRITICAL: 3+ checks failed — immediate action required",
              "Homepage down → P0 incident, rollback deployment",
              "Checkout down → P0 incident, pause marketing spend",
              "Legal pages down → P1 incident, compliance risk",
              "Sitemap down → P2, fix within 24h",
            ],
          },
        };

        return new Response(JSON.stringify(report, null, 2), {
          status: allOk ? 200 : 503,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store",
          },
        });
      },
    },
  },
});
