/**
 * Footer compliance E2E tests.
 * Verifies critical footer links resolve with 200 status codes
 * and that the footer structure matches EU/Romania requirements.
 */
import { test, expect } from "@playwright/test";

const CRITICAL_FOOTER_LINKS = [
  { label: "Termeni și condiții", path: "/termeni-si-conditii" },
  { label: "Politica de confidențialitate", path: "/politica-confidentialitate" },
  { label: "Politica cookie-uri", path: "/politica-cookies" },
  { label: "Politica de returnare", path: "/politica-returnare" },
  { label: "Formular de retragere", path: "/formular-retragere" },
  { label: "Contact", path: "/contact" },
  { label: "Despre noi", path: "/despre-noi" },
];

test.describe("Footer — Link Resolution", () => {
  for (const link of CRITICAL_FOOTER_LINKS) {
    test(`${link.label} (${link.path}) returns 200`, async ({ request }) => {
      const response = await request.get(link.path);
      expect(response.status()).toBe(200);
    });
  }
});

test.describe("Footer — Structure & Compliance", () => {
  test("Footer contains ANPC and SOL external links", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // ANPC link
    const anpcLink = footer.locator('a[href*="anpc.ro"]').first();
    await expect(anpcLink).toBeVisible();
    await expect(anpcLink).toHaveAttribute("target", "_blank");
    await expect(anpcLink).toHaveAttribute("rel", /noopener/);

    // SOL / ODR link
    const solLink = footer.locator('a[href*="ec.europa.eu/consumers/odr"]').first();
    await expect(solLink).toBeVisible();
    await expect(solLink).toHaveAttribute("target", "_blank");
  });

  test("Footer contains cookie reset button with aria-label", async ({ page }) => {
    await page.goto("/");
    const resetBtn = page.locator('button[aria-label="Resetează preferințele cookie"]');
    await expect(resetBtn).toBeVisible();
  });

  test("Footer contains company identification data", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");

    // Should contain CUI
    await expect(footer.getByText("CUI")).toBeVisible();
    // Should contain Reg. Com.
    await expect(footer.getByText("Reg. Com.")).toBeVisible();
  });

  test("Footer contains OUG 34/2014 compliance reference", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByText(/OUG 34\/2014/)).toBeVisible();
  });

  test("Footer contains formular-retragere link", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    const link = footer.locator('a[href="/formular-retragere"]');
    await expect(link).toBeVisible();
  });
});
