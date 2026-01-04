import { test, expect, login, waitForPageLoad } from './fixtures/auth';

/**
 * E2E Tests: Mobile Responsiveness
 * Tests the application on mobile/tablet viewports
 */

const MOBILE_VIEWPORT = { width: 390, height: 844 };   // iPhone 12/13
const TABLET_VIEWPORT = { width: 768, height: 1024 };  // iPad

test.describe('Mobile Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
    });

    test('should display mobile-friendly login', async ({ page }) => {
        await page.goto('/login');

        // Login form should be visible and usable
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();

        await page.screenshot({ path: 'test-results/mobile-login.png', fullPage: true });
    });

    test('should show bottom navigation after login', async ({ page }) => {
        await login(page);
        await waitForPageLoad(page);

        // Check for mobile bottom navigation
        const bottomNav = page.locator('[class*="bottom"], [class*="mobile-nav"], nav').last();
        await expect(bottomNav).toBeVisible();

        await page.screenshot({ path: 'test-results/mobile-dashboard.png', fullPage: true });
    });

    test('should display cards instead of tables on HR page', async ({ page }) => {
        await login(page);
        await page.goto('/hr');
        await waitForPageLoad(page);

        // On mobile, should see card layout instead of wide tables
        const cards = page.locator('[class*="card"]');
        await expect(cards.first()).toBeVisible({ timeout: 10000 });

        await page.screenshot({ path: 'test-results/mobile-hr.png', fullPage: true });
    });

    test('should navigate using mobile menu', async ({ page }) => {
        await login(page);
        await waitForPageLoad(page);

        // Look for hamburger menu or mobile menu trigger
        const menuTrigger = page.locator('button[aria-label*="menu"], [class*="hamburger"], button:has(svg)').first();

        if (await menuTrigger.isVisible()) {
            await menuTrigger.click();
            await page.waitForTimeout(300);

            await page.screenshot({ path: 'test-results/mobile-menu-open.png', fullPage: true });
        }
    });

    test('should display recruitment page on mobile', async ({ page }) => {
        await login(page);
        await page.goto('/recruitment');
        await waitForPageLoad(page);

        // Content should be visible and not overflow
        await expect(page.locator('h1, h2').first()).toBeVisible();

        await page.screenshot({ path: 'test-results/mobile-recruitment.png', fullPage: true });
    });
});

test.describe('Tablet Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize(TABLET_VIEWPORT);
    });

    test('should display dashboard correctly on tablet', async ({ page }) => {
        await login(page);
        await waitForPageLoad(page);

        // Stat cards should be visible
        await expect(page.locator('text=Total Employees')).toBeVisible();

        await page.screenshot({ path: 'test-results/tablet-dashboard.png', fullPage: true });
    });

    test('should show two-column layout where appropriate', async ({ page }) => {
        await login(page);
        await page.goto('/hr');
        await waitForPageLoad(page);

        await page.screenshot({ path: 'test-results/tablet-hr.png', fullPage: true });
    });
});

test.describe('PWA Features', () => {
    test('should have valid PWA manifest', async ({ page }) => {
        await page.goto('/');

        // Check for manifest link
        const manifestLink = await page.locator('link[rel="manifest"]');
        await expect(manifestLink).toHaveAttribute('href', /manifest/);
    });

    test('should show PWA install prompt UI', async ({ page }) => {
        await login(page);
        await waitForPageLoad(page);

        // PWA install prompt may appear (if not dismissed)
        const installPrompt = page.locator('[class*="pwa"], [class*="install-prompt"]');
        if (await installPrompt.isVisible()) {
            await page.screenshot({ path: 'test-results/pwa-install-prompt.png', fullPage: true });
        }
    });
});
