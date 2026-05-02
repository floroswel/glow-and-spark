import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const SRC = path.resolve(__dirname, "..");

function readFile(rel: string): string {
  return fs.readFileSync(path.join(SRC, rel), "utf-8");
}

function readFilesRecursive(dir: string, ext: string): { path: string; content: string }[] {
  const results: { path: string; content: string }[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readFilesRecursive(full, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push({ path: full, content: fs.readFileSync(full, "utf-8") });
    }
  }
  return results;
}

describe("Return policy canonical URL consistency", () => {

  it("no internal links point to /page/politica-retur (should use /politica-returnare)", () => {
    const files = readFilesRecursive(SRC, ".tsx");
    const violations: string[] = [];
    for (const f of files) {
      // Skip the CMS page route itself (it defines the redirect map)
      if (f.path.includes("page.$slug")) continue;
      // Skip test files
      if (f.path.includes(".test.")) continue;

      if (
        f.content.includes("/page/politica-retur") ||
        f.content.includes("/page/politica-returnare")
      ) {
        violations.push(path.relative(SRC, f.path));
      }
    }
    expect(violations, `Files with old /page/politica-retur links: ${violations.join(", ")}`).toEqual([]);
  });

  it("footer default links use /politica-returnare canonical URL", () => {
    const footer = readFile("components/SiteFooter.tsx");
    // Should contain canonical URL
    expect(footer).toContain("/politica-returnare");
    // Should NOT contain /page/politica-retur
    expect(footer).not.toContain("/page/politica-retur");
  });

  it("return policy page contains withdrawal form link to /formular-retragere", () => {
    const page = readFile("routes/politica-returnare.tsx");
    expect(page).toContain("/formular-retragere");
    // The withdrawal form button should be near the top (before accordion sections)
    const formularIdx = page.indexOf("formular-retragere");
    const accordionIdx = page.indexOf("sections.map");
    expect(formularIdx).toBeLessThan(accordionIdx);
  });

  it("CMS page route has 301 redirect for politica-retur slug", () => {
    const cms = readFile("routes/page.$slug.tsx");
    // Must have redirect mapping
    expect(cms).toContain('"politica-retur": "/politica-returnare"');
    // Must use statusCode 301
    expect(cms).toContain("statusCode: 301");
  });

  it("sitemap references /politica-returnare not /page/politica-retur", () => {
    const sitemap = readFile("routes/sitemap[.]xml.tsx");
    expect(sitemap).toContain("/politica-returnare");
    expect(sitemap).not.toContain("/page/politica-retur");
  });
});
