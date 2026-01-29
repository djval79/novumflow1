import { test, expect, login, waitForPageLoad, createTestUser } from './fixtures/auth';

/**
 * E2E Tests: Authentication Flow
 * Tests the complete login/logout cycle and session persistence
 */

test.describe('Authentication Flow', () => {
    let testUser = { email: '', password: '' };

    test.beforeAll(async ({ browser }) => {
        // Create a new context and page to seed the user
        const context = await browser.newContext();
        const page = await context.newPage();

        // Create the user via Quick Admin Setup
        console.log('Seeding test user for auth tests...');
        testUser = await createTestUser(page);
        console.log(`Seeded user: ${testUser.email}`);

        await context.close();
    });

    test('should display login page correctly', async ({ page }) => {
        await page.goto('/login');
        await waitForPageLoad(page);

        // Check login form elements exist
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();

        // Check for branding - use text instead of image which might fail to load
        await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await waitForPageLoad(page);

        await page.fill('input[type="email"]', 'invalid-user@test.com');
        await page.fill('input[type="password"]', 'WrongPass123!');
        await page.click('button[type="submit"]');

        // Wait for error message (AlertCircle icon or text)
        await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        // Use the seeded credentials
        await login(page, testUser.email, testUser.password);

        // Should be on dashboard
        await expect(page).toHaveURL(/.*dashboard/);

        // Dashboard verification: Look for "Today's Schedule" or "Good morning/afternoon"
        // 'text=Dashboard' was incorrect as the header is dynamic
        await expect(page.locator('text=Today\'s Schedule')).toBeVisible();
    });

    test('should persist session on page refresh', async ({ page }) => {
        // Log in first
        await login(page, testUser.email, testUser.password);

        // Refresh the page
        await page.reload();
        await waitForPageLoad(page);

        // Should still be on dashboard (not redirected to login)
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.locator('text=Today\'s Schedule')).toBeVisible();
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
        // Try to access protected route without login
        await page.goto('/hr');

        // Should be redirected to login
        await expect(page).toHaveURL(/.*login/);
    });

    test('should logout successfully', async ({ page }) => {
        await login(page, testUser.email, testUser.password);

        // Use the dedicated Sign Out button in the top nav
        // It has title="Sign Out"
        const logoutBtn = page.locator('button[title="Sign Out"]');

        // If hidden (mobile), open menu first or look for icon
        if (await logoutBtn.isVisible()) {
            await logoutBtn.click();
        } else {
            // Mobile menu fallback
            const mobileMenuBtn = page.locator('button:has-text("Menu"), button[aria-label="Menu"]').first();
            if (await mobileMenuBtn.isVisible()) {
                await mobileMenuBtn.click();
                await page.locator('text=Sign Out').click();
            }
        }

        // After logout, should be on login page
        await page.waitForURL('**/login', { timeout: 15000 });
        await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
    });
});
