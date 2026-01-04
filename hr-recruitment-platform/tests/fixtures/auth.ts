import { test as base, expect, Page } from '@playwright/test';

// Test user credentials from environment or defaults
const TEST_USER = {
    email: process.env.E2E_TEST_EMAIL || 'e2e.test@novumflow.com',
    password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
};

// Extended test with authentication
export const test = base.extend<{ authenticatedPage: Page }>({
    authenticatedPage: async ({ page }, use) => {
        // Navigate to login page
        await page.goto('/login');

        // Fill in credentials
        await page.fill('input[type="email"]', TEST_USER.email);
        await page.fill('input[type="password"]', TEST_USER.password);

        // Submit login form
        await page.click('button[type="submit"]');

        // Wait for navigation to dashboard
        await page.waitForURL('**/dashboard', { timeout: 15000 });

        // Use the authenticated page
        await use(page);
    },
});

// Helper function to login
export async function login(page: Page, email?: string, password?: string) {
    await page.goto('/login');
    await page.fill('input[type="email"]', email || TEST_USER.email);
    await page.fill('input[type="password"]', password || TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
}

// Helper to wait for page load
export async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('domcontentloaded');
}

// Helper to take debug screenshot
export async function debugScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `test-results/debug-${name}.png`, fullPage: true });
}

export { expect };
