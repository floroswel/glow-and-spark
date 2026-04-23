import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://mamalucica.ro";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Sitemap: ${SITE_URL}/sitemap.xml
`;

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
