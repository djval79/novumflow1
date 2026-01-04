import { test, expect, login, waitForPageLoad } from './fixtures/auth';

/**
 * E2E Tests: Authentication Flow
 * Tests the complete login/logout cycle and session persistence
 */

test.describe('Authentication Flow', () => {
    test('should display login page correctly', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });

        // Check login form elements exist
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();

        // Check for branding
        await expect(page.locator('text=NovumFlow')).toBeVisible();

        await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });

        await page.fill('input[type="email"]', 'invalid@test.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Wait for error message
        await expect(page.locator('[role="alert"], .text-red-500, .error')).toBeVisible({ timeout: 10000 });

        await page.screenshot({ path: 'test-results/login-error.png', fullPage: true });
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await login(page);

        // Should be on dashboard
        await expect(page).toHaveURL(/.*dashboard/);

        // Dashboard should have key elements
        await expect(page.locator('text=Dashboard')).toBeVisible();

        await page.screenshot({ path: 'test-results/login-success.png', fullPage: true });
    });

    test('should persist session on page refresh', async ({ page }) => {
        await login(page);

        // Refresh the page
        await page.reload();
        await waitForPageLoad(page);

        // Should still be on dashboard (not redirected to login)
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
        // Try to access protected route without login
        await page.goto('/hr', { waitUntil: 'domcontentloaded' });

        // Should be redirected to login
        await expect(page).toHaveURL(/.*login/);
    });

    test('should logout successfully', async ({ page }) => {
        await login(page);

        // Find and click logout button/menu
        const userMenu = page.locator('[aria-label*="menu"], button:has-text("Sign out"), button:has-text("Logout")').first();
        if (await userMenu.isVisible()) {
            await userMenu.click();

            // Look for logout option
            const logoutBtn = page.locator('text=Sign out, text=Logout').first();
            if (await logoutBtn.isVisible()) {
                await logoutBtn.click();
            }
        }

        // After logout, should be on login page
        await page.waitForURL('**/login', { timeout: 10000 });
    });
});
