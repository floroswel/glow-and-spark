import { createFileRoute } from "@tanstack/react-router";
import { setResponseHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SITE_URL = "https://mamalucica.ro";

// Critical paths that must ALWAYS be disallowed, regardless of DB override
const CRITICAL_DISALLOWS = [
  "/admin",
  "/account",
  "/checkout",
  "/cart",
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/order-confirmed",
  "/search",
];

const DEFAULT_BODY = `User-agent: *
Allow: /
${CRITICAL_DISALLOWS.map((p) => `Disallow: ${p}`).join("\n")}

Sitemap: ${SITE_URL}/sitemap.xml
`;

/**
 * Merge critical Disallow rules into a robots.txt body if missing.
 */
function ensureCriticalRules(body: string): string {
  let result = body.trimEnd();

  // Ensure all critical Disallow paths are present
  for (const path of CRITICAL_DISALLOWS) {
    if (!result.includes(`Disallow: ${path}`)) {
      // Insert after the last existing Disallow or after Allow
      const lines = result.split("\n");
      const lastDisallowIdx = lines.findLastIndex((l) => l.startsWith("Disallow:"));
      const insertIdx = lastDisallowIdx >= 0 ? lastDisallowIdx + 1 : lines.findIndex((l) => l.startsWith("Allow:")) + 1;
      lines.splice(insertIdx, 0, `Disallow: ${path}`);
      result = lines.join("\n");
    }
  }

  // Ensure Sitemap directive
  if (!/Sitemap:/i.test(result)) {
    result = result.trimEnd() + `\n\nSitemap: ${SITE_URL}/sitemap.xml`;
  }

  return result + "\n";
}

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        // Force Content-Type via SSR utility to override framework default
        setResponseHeader("Content-Type", "text/plain; charset=utf-8");
        setResponseHeader("Cache-Control", "public, max-age=3600");

        let body = DEFAULT_BODY;
        try {
          const { data } = await supabaseAdmin
            .from("site_settings")
            .select("value")
            .eq("key", "general")
            .maybeSingle();
          const general = (data?.value ?? {}) as Record<string, any>;
          if (typeof general.robots_txt === "string" && general.robots_txt.trim()) {
            body = ensureCriticalRules(general.robots_txt);
          }
        } catch (err) {
          console.error("[robots.txt] DB fetch failed, using default:", err);
        }

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
