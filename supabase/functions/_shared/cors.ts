// Restricted CORS — allows only the configured site origins.
// Add new origins via the ALLOWED_ORIGINS env var (comma-separated) if needed.

const DEFAULT_ALLOWED = [
  "https://mamalucica.ro",
  "https://www.mamalucica.ro",
  "https://glow-and-spark.lovable.app",
  "https://id-preview--b382c71c-cfbb-4967-add4-5e8c15bf4fcd.lovable.app",
];

function getAllowedOrigins(): string[] {
  const extra = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_ALLOWED, ...extra];
}

export function buildCorsHeaders(req: Request, extraMethods = "POST, OPTIONS"): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowed = getAllowedOrigins();

  // Allow lovable preview subdomains (project id pattern) + localhost dev
  const isLovablePreview = /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin);
  const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin);

  const allowOrigin =
    allowed.includes(origin) || isLovablePreview || isLocalhost ? origin : allowed[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": extraMethods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    "Access-Control-Max-Age": "86400",
  };
}
