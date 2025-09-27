import { test, expect } from '@playwright/test';

test.describe('Editor experience', () => {
  test('export to PNG shows success toast', async ({ page }) => {
    await page.goto('/id/editor');
    await expect(page.getByRole('heading', { name: /editor visual interaktif/i })).toBeVisible();
    await page.getByRole('button', { name: /^png$/i }).click();
    await expect(page.getByText('Export berhasil', { exact: false })).toBeVisible();
  });
});
