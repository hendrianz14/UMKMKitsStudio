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
});
