import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Hard-coded canonical domain. We intentionally ignore process.env.SITE_URL to
// prevent stale env values (e.g. an old preview URL like glow-and-spark.lovable.app)
// from leaking into sitemap entries indexed by search engines.
const SITE_URL = "https://mamalucica.ro";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [productsRes, categoriesRes, postsRes] = await Promise.all([
          supabaseAdmin
            .from("products")
            .select("slug, updated_at")
            .eq("is_active", true)
            .order("updated_at", { ascending: false }),
          supabaseAdmin
            .from("categories")
            .select("slug")
            .eq("visible", true),
          supabaseAdmin
            .from("blog_posts")
            .select("slug, updated_at")
            .eq("status", "published")
            .order("updated_at", { ascending: false }),
        ]);

        const products = productsRes.data || [];
        const categories = categoriesRes.data || [];
        const posts = postsRes.data || [];

        const staticPages = [
          { loc: "/", changefreq: "daily", priority: "1.0" },
          { loc: "/catalog", changefreq: "daily", priority: "0.9" },
          { loc: "/contact", changefreq: "monthly", priority: "0.5" },
          { loc: "/faq", changefreq: "monthly", priority: "0.4" },
          { loc: "/blog", changefreq: "weekly", priority: "0.7" },
        ];

        const today = new Date().toISOString().split("T")[0];

        const urls = [
          ...staticPages.map(
            (p) =>
              `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
          ),
          ...products.map(
            (p) =>
              `  <url>
    <loc>${SITE_URL}/produs/${p.slug}</loc>
    <lastmod>${p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
          ),
          ...categories.map(
            (c) =>
              `  <url>
    <loc>${SITE_URL}/categorie/${c.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
          ),
          ...posts.map(
            (p) =>
              `  <url>
    <loc>${SITE_URL}/blog/${p.slug}</loc>
    <lastmod>${p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
          ),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
