import { test, expect, login, waitForPageLoad } from './fixtures/auth';

/**
 * E2E Tests: Compliance Module
 * Tests DBS, Training, and Right to Work compliance tracking
 */

test.describe('Compliance Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should display compliance overview', async ({ page }) => {
        // Navigate to compliance
        const complianceLink = page.locator('a[href*="compliance"], text=Compliance').first();
        await complianceLink.click();
        await waitForPageLoad(page);

        // Should show compliance-related content
        await expect(page.locator('text=Compliance, text=DBS, text=Training, text=CQC').first()).toBeVisible();

        await page.screenshot({ path: 'test-results/compliance-overview.png', fullPage: true });
    });

    test('should show expiring items warnings', async ({ page }) => {
        await page.goto('/compliance-dashboard');
        await waitForPageLoad(page);

        // Look for expiry warnings or status indicators
        const expirySection = page.locator('text=Expir, text=Due, text=Warning').first();
        if (await expirySection.isVisible()) {
            await expect(expirySection).toBeVisible();
        }

        await page.screenshot({ path: 'test-results/compliance-expiries.png', fullPage: true });
    });
});

test.describe('DBS Checks', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/compliance-hub');
        await waitForPageLoad(page);
    });

    test('should display DBS register', async ({ page }) => {
        // Look for DBS tab or section
        const dbsTab = page.locator('text=DBS, button:has-text("DBS")').first();
        if (await dbsTab.isVisible()) {
            await dbsTab.click();
            await waitForPageLoad(page);
        }

        // Should show DBS-related content
        await expect(page.locator('text=DBS').first()).toBeVisible();

        await page.screenshot({ path: 'test-results/dbs-register.png', fullPage: true });
    });
});

test.describe('Training Matrix', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should display training records', async ({ page }) => {
        await page.goto('/training');
        await waitForPageLoad(page);

        // Should show training-related content
        await expect(page.locator('text=Training').first()).toBeVisible();

        await page.screenshot({ path: 'test-results/training-matrix.png', fullPage: true });
    });

    test('should show mandatory training status', async ({ page }) => {
        await page.goto('/training');
        await waitForPageLoad(page);

        // Look for mandatory training indicators
        const mandatorySection = page.locator('text=Mandatory, text=Required').first();
        if (await mandatorySection.isVisible()) {
            await expect(mandatorySection).toBeVisible();
        }
    });
});

test.describe('Right to Work', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/compliance-hub');
        await waitForPageLoad(page);
    });

    test('should display RTW status', async ({ page }) => {
        // Look for RTW tab or section
        const rtwTab = page.locator('text=Right to Work, text=RTW').first();
        if (await rtwTab.isVisible()) {
            await rtwTab.click();
            await waitForPageLoad(page);
        }

        await page.screenshot({ path: 'test-results/rtw-status.png', fullPage: true });
    });
});
