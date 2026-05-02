import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SITE_URL = "https://mamalucica.ro";

const STATIC_PAGES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/catalog", changefreq: "daily", priority: "0.9" },
  { loc: "/contact", changefreq: "monthly", priority: "0.5" },
  { loc: "/faq", changefreq: "monthly", priority: "0.4" },
  { loc: "/blog", changefreq: "weekly", priority: "0.7" },
  { loc: "/despre-noi", changefreq: "monthly", priority: "0.5" },
  { loc: "/afiliat", changefreq: "monthly", priority: "0.4" },
  { loc: "/gift-card", changefreq: "monthly", priority: "0.4" },
  { loc: "/compare", changefreq: "weekly", priority: "0.3" },
  { loc: "/termeni-si-conditii", changefreq: "monthly", priority: "0.3" },
  { loc: "/politica-confidentialitate", changefreq: "monthly", priority: "0.3" },
  { loc: "/politica-returnare", changefreq: "monthly", priority: "0.3" },
  { loc: "/formular-retragere", changefreq: "monthly", priority: "0.2" },
  { loc: "/politica-cookies", changefreq: "monthly", priority: "0.3" },
];

function buildXml(
  staticPages: typeof STATIC_PAGES,
  products: { slug: string; updated_at?: string | null }[],
  categories: { slug: string }[],
  posts: { slug: string; updated_at?: string | null }[],
) {
  const today = new Date().toISOString().split("T")[0];

  const urls = [
    ...staticPages.map(
      (p) =>
        `  <url>\n    <loc>${SITE_URL}${p.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
    ),
    ...products.map(
      (p) =>
        `  <url>\n    <loc>${SITE_URL}/produs/${p.slug}</loc>\n    <lastmod>${p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    ),
    ...categories.map(
      (c) =>
        `  <url>\n    <loc>${SITE_URL}/categorie/${c.slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    ),
    ...posts.map(
      (p) =>
        `  <url>\n    <loc>${SITE_URL}/blog/${p.slug}</loc>\n    <lastmod>${p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Force Content-Type via SSR utility to override framework default
        setResponseHeader("Content-Type", "application/xml; charset=utf-8");

        try {
          const [productsRes, categoriesRes, postsRes] = await Promise.all([
            supabaseAdmin
              .from("products")
              .select("slug, updated_at")
              .eq("is_active", true)
              .order("updated_at", { ascending: false })
              .limit(1000),
            supabaseAdmin
              .from("categories")
              .select("slug")
              .eq("visible", true)
              .limit(200),
            supabaseAdmin
              .from("blog_posts")
              .select("slug, updated_at")
              .eq("status", "published")
              .order("updated_at", { ascending: false })
              .limit(500),
          ]);

          const xml = buildXml(
            STATIC_PAGES,
            productsRes.data || [],
            categoriesRes.data || [],
            postsRes.data || [],
          );

          setResponseHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
          });
        } catch (err) {
          console.error("[sitemap.xml] DB fetch failed, returning static fallback:", err);
          const xml = buildXml(STATIC_PAGES, [], [], []);
          setResponseHeader("Cache-Control", "public, max-age=300");
          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=300",
            },
          });
        }
      },
    },
  },
});
