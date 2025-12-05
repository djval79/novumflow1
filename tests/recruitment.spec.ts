import { test, expect } from '@playwright/test';

test.describe('Recruitment Page', () => {
  test('should display the recruitment page title', async ({ page }) => {
    // Navigate to the recruitment page
    await page.goto('/recruitment');

    // Check for the main title of the page
    const title = page.locator('h1');
    await expect(title).toHaveText('Recruitment');
  });
});
