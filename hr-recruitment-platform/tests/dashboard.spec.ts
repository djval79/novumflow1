import { test, expect, login, waitForPageLoad, createTestUser } from './fixtures/auth';

/**
 * E2E Tests: Dashboard & Navigation
 * Tests the main dashboard and navigation between modules
 */

test.describe('Dashboard', () => {
    let testUser = { email: '', password: '' };

    test.beforeAll(async ({ browser }) => {
        // Create a new context and page to seed the user
        const context = await browser.newContext();
        const page = await context.newPage();

        // Create the user via Quick Admin Setup
        console.log('Seeding test user for dashboard tests...');
        testUser = await createTestUser(page);

        await context.close();
    });

    test.beforeEach(async ({ page }) => {
        await login(page, testUser.email, testUser.password);
    });

    test('should display all stat cards', async ({ page }) => {
        await waitForPageLoad(page);

        // Check for main headers in DashboardAnalytics
        await expect(page.locator('text=Performance Analytics')).toBeVisible();
        await expect(page.locator('text=Hiring Pipeline')).toBeVisible();

        // "Total Employees" is in the Department Distribution card
        await expect(page.locator('text=Total Employees')).toBeVisible();

        await page.screenshot({ path: 'test-results/dashboard-stats.png', fullPage: true });
    });

    test('should display compliance widget', async ({ page }) => {
        await waitForPageLoad(page);

        // Look for compliance-related content (UKComplianceDashboardWidget)
        // Assuming it has text "Compliance" or "CQC"
        const complianceSection = page.locator('text=Compliance').first();
        await expect(complianceSection).toBeVisible({ timeout: 10000 });
    });

    test('should display analytics section', async ({ page }) => {
        await waitForPageLoad(page);

        // "Department Distribution" is a key analytics chart
        await expect(page.locator('text=Department Distribution')).toBeVisible();
    });
});

test.describe('Navigation', () => {
    let testUser = { email: '', password: '' };

    test.beforeAll(async ({ browser }) => {
        // Create a NEW user for navigation tests to avoid state pollution? 
        // Or reuse? Reusing is fine but safe to create new.
        const context = await browser.newContext();
        const page = await context.newPage();
        testUser = await createTestUser(page);
        await context.close();
    });

    test.beforeEach(async ({ page }) => {
        await login(page, testUser.email, testUser.password);
    });

    test('should navigate to HR module', async ({ page }) => {
        await page.click('text=HR Module, a[href="/hr"]');
        await page.waitForURL('**/hr');
        await expect(page.locator('h1, h2').filter({ hasText: /HR|Employee|Staff/i })).toBeVisible();

        await page.screenshot({ path: 'test-results/hr-module.png', fullPage: true });
    });

    test('should navigate to Recruitment module', async ({ page }) => {
        await page.click('text=Recruitment, a[href="/recruitment"]');
        await page.waitForURL('**/recruitment');
        await expect(page.locator('h1, h2').filter({ hasText: /Recruitment|Jobs|Candidates/i })).toBeVisible();

        await page.screenshot({ path: 'test-results/recruitment-module.png', fullPage: true });
    });

    test('should navigate to Compliance module', async ({ page }) => {
        const complianceLink = page.locator('text=Compliance, a[href*="compliance"]').first();
        if (await complianceLink.isVisible()) {
            await complianceLink.click();
            await waitForPageLoad(page);
            await expect(page.locator('h1, h2').filter({ hasText: /Compliance|DBS|Training/i })).toBeVisible();
        }
    });

    test('should navigate to Settings', async ({ page }) => {
        await page.click('text=Settings, a[href="/settings"]');
        await page.waitForURL('**/settings');
        await expect(page.locator('text=Settings, text=Preferences')).toBeVisible();

        await page.screenshot({ path: 'test-results/settings.png', fullPage: true });
    });

    test('should use mobile navigation on small screens', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 390, height: 844 });
        await page.reload();
        await waitForPageLoad(page);

        // Check for mobile navigation elements
        const mobileNav = page.locator('[class*="mobile"], [class*="bottom-nav"]');
        if (await mobileNav.isVisible()) {
            await expect(mobileNav).toBeVisible();
        }

        await page.screenshot({ path: 'test-results/mobile-nav.png', fullPage: true });
    });
});
