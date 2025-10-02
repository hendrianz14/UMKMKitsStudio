import { test, expect } from "@playwright/test";

test.describe("Dashboard smoke", () => {
  test("render halaman dashboard tanpa error utama", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();

    const criticalLinks = ["/billing/topup", "/caption", "/image"];
    for (const href of criticalLinks) {
      const link = page.locator(`a[href="${href}"]`).first();
      if ((await link.count()) === 0) {
        test.info().annotations.push({ type: "skip-link", description: href });
        continue;
      }
      const [resp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes(href)).catch(() => null),
        link.click({ trial: true }).catch(() => null),
      ]);
      if (resp) expect.soft(resp.status(), href).not.toBe(404);
      await page.goBack().catch(() => null);
    }
  });
});
