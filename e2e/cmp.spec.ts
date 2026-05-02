/**
 * CMP (Cookie Consent Management) E2E Tests
 *
 * Tests:
 * 1. Reject marketing → marketing scripts not loaded
 * 2. Accept all → scripts can load
 * 3. Reset → scripts removed + banner visible again
 * 4. Footer reset link works from any page
 *
 * DISCLAIMER: These tests verify engineering behavior, not legal compliance.
 */
import { test, expect, type Page } from "@playwright/test";

const CMP_KEY = "mamalucica_cmp_v1";

async function clearCmpState(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("mamalucica_cmp_v1");
    localStorage.removeItem("cookie_consent");
  });
}

test.describe("CMP — Cookie Consent Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearCmpState(page);
    await page.reload();
  });

  test("1. Banner appears on first visit", async ({ page }) => {
    const banner = page.locator('[role="dialog"][aria-label="Consimțământ cookie-uri"]');
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner.getByText("Acceptă toate")).toBeVisible();
    await expect(banner.getByText("Doar esențiale")).toBeVisible();
  });

  test("2. Reject optional → consent stored with analytics/marketing false", async ({ page }) => {
    const banner = page.locator('[role="dialog"][aria-label="Consimțământ cookie-uri"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    await banner.getByText("Doar esențiale").click();

    // Banner should disappear
    await expect(banner).not.toBeVisible();

    // Check localStorage
    const consent = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, CMP_KEY);

    expect(consent).not.toBeNull();
    expect(consent.categories.necessary).toBe(true);
    expect(consent.categories.analytics).toBe(false);
    expect(consent.categories.marketing).toBe(false);
  });

  test("3. Accept all → consent stored with analytics/marketing true", async ({ page }) => {
    const banner = page.locator('[role="dialog"][aria-label="Consimțământ cookie-uri"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    await banner.getByText("Acceptă toate").click();
    await expect(banner).not.toBeVisible();

    const consent = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, CMP_KEY);

    expect(consent.categories.analytics).toBe(true);
    expect(consent.categories.marketing).toBe(true);
  });

  test("4. Reset → clears storage + banner reappears", async ({ page }) => {
    const banner = page.locator('[role="dialog"][aria-label="Consimțământ cookie-uri"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    // Accept first
    await banner.getByText("Acceptă toate").click();
    await expect(banner).not.toBeVisible();

    // Verify consent stored
    let consent = await page.evaluate((key) => localStorage.getItem(key), CMP_KEY);
    expect(consent).not.toBeNull();

    // Click footer reset
    const resetBtn = page.locator('button[aria-label="Resetează preferințele cookie"]');
    await resetBtn.scrollIntoViewIfNeeded();
    await resetBtn.click();

    // Banner should reappear
    await expect(banner).toBeVisible({ timeout: 3000 });

    // localStorage should be cleared
    consent = await page.evaluate((key) => localStorage.getItem(key), CMP_KEY);
    expect(consent).toBeNull();
  });

  test("5. Footer reset link works from non-home page", async ({ page }) => {
    // Accept consent first
    const banner = page.locator('[role="dialog"][aria-label="Consimțământ cookie-uri"]');
    await expect(banner).toBeVisible({ timeout: 5000 });
    await banner.getByText("Acceptă toate").click();
    await expect(banner).not.toBeVisible();

    // Navigate to another page
    await page.goto("/politica-cookies");
    await page.waitForLoadState("domcontentloaded");

    // Reset from footer
    const resetBtn = page.locator('button[aria-label="Resetează preferințele cookie"]');
    await resetBtn.scrollIntoViewIfNeeded();
    await resetBtn.click();

    // Banner should reappear without page reload
    await expect(banner).toBeVisible({ timeout: 3000 });
  });

  test("6. Custom preferences — analytics only", async ({ page }) => {
    const banner = page.locator('[role="dialog"][aria-label="Consimțământ cookie-uri"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    await banner.getByText("Personalizează").click();
    // Check analytics, leave marketing unchecked
    const analyticsCheckbox = banner.locator('input[type="checkbox"]').nth(1); // 0=essential(disabled), 1=analytics
    await analyticsCheckbox.check();
    await banner.getByText("Salvează alegerile").click();

    await expect(banner).not.toBeVisible();

    const consent = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, CMP_KEY);

    expect(consent.categories.analytics).toBe(true);
    expect(consent.categories.marketing).toBe(false);
  });

  test("7. ESC key closes banner (rejects optional)", async ({ page }) => {
    const banner = page.locator('[role="dialog"][aria-label="Consimțământ cookie-uri"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await expect(banner).not.toBeVisible();

    const consent = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, CMP_KEY);

    expect(consent.categories.marketing).toBe(false);
  });
});
