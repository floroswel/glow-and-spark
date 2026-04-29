import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Hard-coded canonical domain — see sitemap.xml.tsx for rationale.
const SITE_URL = "https://mamalucica.ro";

const DEFAULT_BODY = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Sitemap: ${SITE_URL}/sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        let body = DEFAULT_BODY;
        try {
          const { data } = await supabaseAdmin
            .from("site_settings")
            .select("value")
            .eq("key", "general")
            .maybeSingle();
          const general = (data?.value ?? {}) as Record<string, any>;
          if (typeof general.robots_txt === "string" && general.robots_txt.trim()) {
            body = general.robots_txt;
            if (!/Sitemap:/i.test(body)) {
              body = body.trimEnd() + `\nSitemap: ${SITE_URL}/sitemap.xml\n`;
            }
          }
        } catch {
          // fall back to default body
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
