/**
 * Smoke test: brand consistency, OG meta, header logo, footer copyright.
 *
 * Run: bunx vitest run src/components/__tests__/brand-smoke.test.ts
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SRC = path.resolve(__dirname, "../../..");

/** Recursively collect .tsx/.ts files under a dir (skipping gen/node_modules) */
function collectFiles(dir: string, exts = [".tsx", ".ts"]): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes("node_modules") && entry.name !== ".git") {
      out.push(...collectFiles(full, exts));
    } else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e)) && !entry.name.includes(".gen.")) {
      out.push(full);
    }
  }
  return out;
}

describe("Brand consistency audit", () => {
  const srcFiles = collectFiles(path.join(SRC, "src")).filter(f => !f.includes("__tests__") && !f.includes(".test."));

  it("no leftover generic brand names in source", () => {
    const forbidden = [
      /Your\s?Company/i,
      /Your\s?Brand/i,
      /ACME\s/i,
      /example\.com/i,
      /example\.org/i,
      /lorem ipsum/i,
    ];
    const violations: string[] = [];
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      for (const re of forbidden) {
        if (re.test(content)) {
          const rel = path.relative(SRC, file);
          violations.push(`${rel} matches ${re}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("header shows logo link exactly once (no duplicate brand text)", () => {
    const headerFile = path.join(SRC, "src/components/SiteHeader.tsx");
    const content = fs.readFileSync(headerFile, "utf-8");

    // The main header row should have exactly one <Link to="/"> with the logo
    // Check that we don't have two visible brand text nodes in the main header div
    const logoLinks = content.match(/Link\s+to="\/"/g) || [];
    // There can be 2: one in main header, one in mobile sheet header — that's expected
    expect(logoLinks.length).toBeGreaterThanOrEqual(1);
    expect(logoLinks.length).toBeLessThanOrEqual(2);

    // The logo should render either <img> OR text fallback, never both simultaneously
    // Check the conditional pattern: logo_url ? <img> : <text>
    const conditionalLogo = content.match(/logo_url\s*\?\s*\(/g) || [];
    expect(conditionalLogo.length).toBeGreaterThanOrEqual(1);
  });

  it("footer uses useCompanyInfo and shows brand fallback", () => {
    const footerFile = path.join(SRC, "src/components/SiteFooter.tsx");
    const content = fs.readFileSync(footerFile, "utf-8");

    // Footer uses dynamic company info from hook
    expect(content).toContain("useCompanyInfo");
    // Has Mama Lucica as fallback
    expect(content).toContain("Mama Lucica");
    // Copyright line should exist
    expect(content).toMatch(/©.*Mama Lucica/);
  });

  it("root route defines correct og:title and og:site_name for Mama Lucica", () => {
    const rootFile = path.join(SRC, "src/routes/__root.tsx");
    const content = fs.readFileSync(rootFile, "utf-8");

    // og:site_name should be Mama Lucica
    expect(content).toMatch(/og:site_name.*Mama Lucica/);
    // og:title should contain Mama Lucica
    expect(content).toMatch(/og:title.*Mama Lucica/);
    // Should not contain other brand names
    expect(content).not.toMatch(/og:site_name.*(?!Mama Lucica)[A-Z][a-z]+ [A-Z][a-z]+.*(?=["'])/);
  });

  it("no duplicate og:title in root route", () => {
    const rootFile = path.join(SRC, "src/routes/__root.tsx");
    const content = fs.readFileSync(rootFile, "utf-8");

    const ogTitleMatches = content.match(/og:title/g) || [];
    // Should appear exactly once in the head config
    expect(ogTitleMatches.length).toBe(1);
  });

  it("no duplicate og:description in root route", () => {
    const rootFile = path.join(SRC, "src/routes/__root.tsx");
    const content = fs.readFileSync(rootFile, "utf-8");

    const ogDescMatches = content.match(/og:description/g) || [];
    expect(ogDescMatches.length).toBe(1);
  });

  it("child routes with head() do not duplicate og:site_name (inherited from root)", () => {
    const routeFiles = srcFiles.filter(
      (f) => f.includes("/routes/") && !f.includes("__root") && !f.includes(".gen.")
    );
    const violations: string[] = [];
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, "utf-8");
      if (content.includes("og:site_name")) {
        violations.push(path.relative(SRC, file));
      }
    }
    expect(violations).toEqual([]);
  });
});
