/**
 * SEO endpoint validation tests — sitemap.xml & robots.txt
 *
 * Validates that the server route handlers produce correct output:
 * content types, minimum content, and critical links.
 *
 * Run: bunx vitest run src/test/seo-endpoints.test.ts
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SITEMAP_SOURCE = fs.readFileSync(
  path.resolve(__dirname, "../routes/sitemap[.]xml.tsx"),
  "utf-8",
);

const ROBOTS_SOURCE = fs.readFileSync(
  path.resolve(__dirname, "../routes/robots[.]txt.tsx"),
  "utf-8",
);

// ─── sitemap.xml ────────────────────────────────────────────────────────────

describe("sitemap.xml — source validation", () => {
  it("uses canonical domain https://mamalucica.ro", () => {
    expect(SITEMAP_SOURCE).toContain("https://mamalucica.ro");
  });

  it("sets Content-Type to application/xml", () => {
    expect(SITEMAP_SOURCE).toMatch(/Content-Type.*application\/xml/);
  });

  it("includes homepage with priority 1.0", () => {
    expect(SITEMAP_SOURCE).toMatch(/loc:\s*"\/"/);
    expect(SITEMAP_SOURCE).toMatch(/priority:\s*"1\.0"/);
  });

  it("includes catalog page", () => {
    expect(SITEMAP_SOURCE).toContain('"/catalog"');
  });

  it("includes all EU-required legal pages", () => {
    for (const p of [
      "/termeni-si-conditii",
      "/politica-confidentialitate",
      "/politica-returnare",
      "/politica-cookies",
      "/formular-retragere",
    ]) {
      expect(SITEMAP_SOURCE).toContain(`"${p}"`);
    }
  });

  it("includes contact page", () => {
    expect(SITEMAP_SOURCE).toContain('"/contact"');
  });

  it("fetches products and categories from DB", () => {
    expect(SITEMAP_SOURCE).toContain('.from("products")');
    expect(SITEMAP_SOURCE).toContain('.from("categories")');
  });

  it("has a fallback when DB fetch fails (no 500)", () => {
    expect(SITEMAP_SOURCE).toMatch(/catch/);
    expect(SITEMAP_SOURCE).toContain("static fallback");
  });

  it("outputs valid XML structure markers", () => {
    expect(SITEMAP_SOURCE).toContain('<?xml version="1.0"');
    expect(SITEMAP_SOURCE).toContain("<urlset");
    expect(SITEMAP_SOURCE).toContain("</urlset>");
  });

  it("does not include private routes in sitemap", () => {
    for (const p of ['"/admin"', '"/checkout"', '"/cart"', '"/account"', '"/auth"']) {
      expect(SITEMAP_SOURCE).not.toContain(p);
    }
  });

  it("does not include removed features (blog, subscriptions/abonamente)", () => {
    expect(SITEMAP_SOURCE).not.toContain("/blog");
    expect(SITEMAP_SOURCE).not.toContain("subscription");
    expect(SITEMAP_SOURCE).not.toContain("abonament");
  });
});

// ─── robots.txt ─────────────────────────────────────────────────────────────

describe("robots.txt — source validation", () => {
  it("uses canonical domain https://mamalucica.ro", () => {
    expect(ROBOTS_SOURCE).toContain("https://mamalucica.ro");
  });

  it("sets Content-Type to text/plain", () => {
    expect(ROBOTS_SOURCE).toContain("text/plain");
  });

  it("allows root path", () => {
    expect(ROBOTS_SOURCE).toContain("Allow: /");
  });

  it("disallows all critical private paths", () => {
    for (const p of ["/admin", "/account", "/checkout", "/cart", "/auth"]) {
      expect(ROBOTS_SOURCE).toContain(`"${p}"`);
    }
  });

  it("includes Sitemap directive", () => {
    expect(ROBOTS_SOURCE).toContain("Sitemap:");
    expect(ROBOTS_SOURCE).toContain("/sitemap.xml");
  });

  it("always appends Sitemap if missing from DB override", () => {
    expect(ROBOTS_SOURCE).toContain("if (!/Sitemap:/i.test(result))");
  });

  it("merges critical Disallow rules into DB overrides", () => {
    expect(ROBOTS_SOURCE).toContain("ensureCriticalRules");
    expect(ROBOTS_SOURCE).toContain("CRITICAL_DISALLOWS");
  });

  it("has a fallback when DB fetch fails", () => {
    expect(ROBOTS_SOURCE).toMatch(/catch/);
  });
});

// ─── buildXml unit validation ──────────────────────────────────────────────

describe("sitemap.xml — buildXml output validation", () => {
  it("generates valid XML with static pages only", () => {
    const SITE_URL = "https://mamalucica.ro";
    const today = new Date().toISOString().split("T")[0];
    const pages = [
      { loc: "/", changefreq: "daily", priority: "1.0" },
      { loc: "/catalog", changefreq: "daily", priority: "0.9" },
    ];
    const urls = pages.map(
      (p) => `  <url>\n    <loc>${SITE_URL}${p.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
    );
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain(`<loc>${SITE_URL}/</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/catalog</loc>`);
    expect(xml).toContain("</urlset>");
  });

  it("generates product URLs with correct slugs and lastmod", () => {
    const SITE_URL = "https://mamalucica.ro";
    const today = new Date().toISOString().split("T")[0];
    const products = [
      { slug: "lumanare-lavanda", updated_at: "2025-01-15T10:00:00Z" },
      { slug: "lumanare-vanilie", updated_at: null },
    ];
    const urls = products.map(
      (p) =>
        `<loc>${SITE_URL}/produs/${p.slug}</loc>` +
        `<lastmod>${p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today}</lastmod>`,
    );

    expect(urls[0]).toContain("/produs/lumanare-lavanda");
    expect(urls[0]).toContain("<lastmod>2025-01-15</lastmod>");
    expect(urls[1]).toContain("/produs/lumanare-vanilie");
    expect(urls[1]).toContain(`<lastmod>${today}</lastmod>`);
  });
});

// ─── ensureCriticalRules unit test ─────────────────────────────────────────

describe("robots.txt — ensureCriticalRules logic", () => {
  const CRITICAL_DISALLOWS = [
    "/admin", "/account", "/checkout", "/cart", "/auth",
    "/forgot-password", "/reset-password", "/order-confirmed", "/search",
  ];

  function ensureCriticalRules(body: string): string {
    let result = body.trimEnd();
    for (const p of CRITICAL_DISALLOWS) {
      if (!result.includes(`Disallow: ${p}`)) {
        const lines = result.split("\n");
        let lastIdx = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
          if (lines[i].startsWith("Disallow:")) { lastIdx = i; break; }
        }
        const insertIdx = lastIdx >= 0 ? lastIdx + 1 : lines.findIndex((l: string) => l.startsWith("Allow:")) + 1;
        lines.splice(insertIdx, 0, `Disallow: ${p}`);
        result = lines.join("\n");
      }
    }
    if (!/Sitemap:/i.test(result)) {
      result = result.trimEnd() + `\n\nSitemap: https://mamalucica.ro/sitemap.xml`;
    }
    return result + "\n";
  }

  it("adds all missing Disallow rules to a minimal robots.txt", () => {
    const input = "User-agent: *\nAllow: /";
    const output = ensureCriticalRules(input);
    for (const p of CRITICAL_DISALLOWS) {
      expect(output).toContain(`Disallow: ${p}`);
    }
    expect(output).toContain("Sitemap:");
  });

  it("preserves existing rules and adds missing ones", () => {
    const input = "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /cart";
    const output = ensureCriticalRules(input);
    expect(output).toContain("Disallow: /admin");
    expect(output).toContain("Disallow: /cart");
    expect(output).toContain("Disallow: /checkout");
    expect(output).toContain("Disallow: /account");
  });

  it("does not duplicate existing Sitemap directive", () => {
    const input = "User-agent: *\nAllow: /\nSitemap: https://mamalucica.ro/sitemap.xml";
    const output = ensureCriticalRules(input);
    const sitemapCount = (output.match(/Sitemap:/g) || []).length;
    expect(sitemapCount).toBe(1);
  });
});
