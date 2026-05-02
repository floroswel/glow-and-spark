import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { FORBIDDEN_PHRASES, CANONICAL_DEADLINES, IS_VAT_PAYER } from "@/lib/compliance";

const SRC = path.resolve(__dirname, "..");

function readFilesRecursive(dir: string, ext: string): { rel: string; content: string }[] {
  const results: { rel: string; content: string }[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes("node_modules")) {
      results.push(...readFilesRecursive(full, ext));
    } else if (entry.name.endsWith(ext) && !entry.name.includes(".gen.") && !entry.name.includes(".test.")) {
      results.push({ rel: path.relative(SRC, full), content: fs.readFileSync(full, "utf-8") });
    }
  }
  return results;
}

describe("Legal compliance consistency", () => {
  const files = readFilesRecursive(SRC, ".tsx").concat(readFilesRecursive(SRC, ".ts"));

  describe("Forbidden phrases", () => {
    for (const rule of FORBIDDEN_PHRASES) {
      it(`no files contain: ${rule.pattern.source.slice(0, 60)}`, () => {
        const violations: string[] = [];
        for (const f of files) {
          if (rule.allowedFiles?.some((af) => f.rel.includes(af))) continue;
          if (rule.pattern.test(f.content)) {
            violations.push(f.rel);
          }
        }
        expect(violations, `Violation: ${rule.reason}\nFiles: ${violations.join(", ")}`).toEqual([]);
      });
    }
  });

  it("VAT status: no VAT-inclusive price claims when IS_VAT_PAYER=false", () => {
    if (IS_VAT_PAYER) return;
    const legalFiles = files.filter((f) =>
      f.rel.includes("politica-") || f.rel.includes("termeni-") || f.rel.includes("formular-retragere")
    );
    for (const f of legalFiles) {
      expect(f.content, `${f.rel} contains VAT claim`).not.toMatch(/prețuri?\s+(cu|inclusiv)\s+TVA/i);
    }
  });

  it("withdrawal period is consistent across all files", () => {
    const wd = CANONICAL_DEADLINES.withdrawal;
    const legalFiles = files.filter((f) =>
      f.rel.includes("politica-returnare") || f.rel.includes("termeni-si-conditii") || f.rel.includes("HomepageWhyUs")
    );
    for (const f of legalFiles) {
      // Should not contain a different number of days for withdrawal
      const matches = f.content.matchAll(/(\d+)\s+zile\s+calendaristice/g);
      for (const m of matches) {
        const days = parseInt(m[1]);
        // Only check withdrawal-context numbers (14 or whatever WITHDRAWAL_PERIOD_DAYS is)
        if (days !== wd.days && (f.content.includes("retragere") || f.content.includes("retur"))) {
          // Allow other deadlines like refund (also 14) — just flag if it's a different withdrawal period
          if (days !== CANONICAL_DEADLINES.refund.days && days !== CANONICAL_DEADLINES.return_shipping.days) {
            expect.fail(`${f.rel} uses ${days} days instead of ${wd.days} for withdrawal`);
          }
        }
      }
    }
  });

  it("GDPR response deadline is consistent", () => {
    const gdprFiles = files.filter((f) =>
      f.rel.includes("gdpr") || f.rel.includes("politica-confidentialitate")
    );
    const gd = CANONICAL_DEADLINES.gdpr_response;
    for (const f of gdprFiles) {
      // Check no different GDPR deadline is used
      const wrongPattern = new RegExp(`(?<!${gd.days})\\s+zile\\s+calendaristice`, "g");
      // Just verify the correct number appears
      if (f.content.includes("zile calendaristice") && f.content.includes("GDPR") || f.content.includes("gdpr")) {
        expect(f.content).toContain(`${gd.days} zile calendaristice`);
      }
    }
  });

  it("no 'retur gratuit' in legal pages (cost borne by consumer)", () => {
    const legalFiles = files.filter((f) =>
      f.rel.includes("politica-returnare") || f.rel.includes("termeni-si-conditii")
    );
    for (const f of legalFiles) {
      expect(f.content.toLowerCase()).not.toContain("retur gratuit");
    }
  });

  it("homepage WhyUs does not claim 'retur gratuit' or cite specific statutes", () => {
    const whyUs = files.find((f) => f.rel.includes("HomepageWhyUs"));
    if (!whyUs) return;
    expect(whyUs.content).not.toMatch(/retur\s+gratuit/i);
    expect(whyUs.content).not.toMatch(/OUG\s+\d+/i);
  });

  it("all legal pages import from compliance.ts", () => {
    const legalRoutes = ["politica-confidentialitate", "politica-returnare", "termeni-si-conditii"];
    for (const route of legalRoutes) {
      const f = files.find((f) => f.rel.includes(`routes/${route}.tsx`));
      expect(f, `${route} not found`).toBeDefined();
      expect(f!.content).toContain("compliance");
    }
  });
});
