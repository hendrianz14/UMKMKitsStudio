import { test, expect } from '@playwright/test';

test.describe('Marketing landing', () => {
  test('mobile menu navigation to dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /visual interaktif/i })).toBeVisible();
    await page.getByRole('button', { name: /menu/i }).click();
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/id\/dashboard/);
  });

  test('core sections remain visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#features')).toBeVisible();
    await expect(page.getByRole('heading', { name: /before \/ after/i })).toBeVisible();
    await expect(page.locator('#pricing')).toBeVisible();
    await expect(page.locator('#editor-demo')).toBeVisible();
  });
});
