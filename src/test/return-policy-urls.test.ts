/**
 * Test: return policy URL consistency.
 * Ensures all internal links point to /politica-returnare (canonical)
 * and the footer "Politica de Retur" link resolves correctly.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SRC = path.resolve(__dirname, "..");

function collectFiles(dir: string, exts = [".tsx", ".ts"]): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
      out.push(...collectFiles(full, exts));
    } else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e)) && !entry.name.includes(".gen.")) {
      out.push(full);
    }
  }
  return out;
}

describe("Return policy URL consistency", () => {
  const srcFiles = collectFiles(SRC).filter((f) => !f.includes("__tests__") && !f.includes(".test."));

  it("no internal links point to /page/politica-retur (should use /politica-returnare)", () => {
    const violations: string[] = [];
    // These patterns indicate a link href/to pointing to the wrong URL
    const badPatterns = [
      /["'`]\/page\/politica-retur["'`]/g,
      /to=["'`]\/page\/politica-retur/g,
      /href=["'`]\/page\/politica-retur/g,
    ];

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      for (const re of badPatterns) {
        if (re.test(content)) {
          const rel = path.relative(path.resolve(SRC, ".."), file);
          violations.push(`${rel} contains link to /page/politica-retur`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("footer default col2 links use /politica-returnare for return policy", () => {
    const footerFile = path.join(SRC, "components/SiteFooter.tsx");
    const content = fs.readFileSync(footerFile, "utf-8");

    // The "Politica de Retur" default link should point to /politica-returnare
    expect(content).toContain('{ label: "Politica de Retur", url: "/politica-returnare" }');
    // Should NOT point to /page/politica-retur
    expect(content).not.toContain("/page/politica-retur");
  });

  it("footer return policy link page includes withdrawal form link (/formular-retragere)", () => {
    const returnFile = path.join(SRC, "routes/politica-returnare.tsx");
    const content = fs.readFileSync(returnFile, "utf-8");

    // The canonical return policy page must link to the withdrawal form
    expect(content).toContain("/formular-retragere");
  });

  it("CMS page route redirects politica-retur slug to canonical /politica-returnare", () => {
    const cmsFile = path.join(SRC, "routes/page.$slug.tsx");
    const content = fs.readFileSync(cmsFile, "utf-8");

    // Should have a redirect mapping for politica-retur
    expect(content).toContain('"politica-retur": "/politica-returnare"');
  });

  it("sitemap references /politica-returnare not /page/politica-retur", () => {
    const sitemapFile = path.join(SRC, "routes/sitemap[.]xml.tsx");
    const content = fs.readFileSync(sitemapFile, "utf-8");

    expect(content).toContain("/politica-returnare");
    expect(content).not.toContain("/page/politica-retur");
  });
});
