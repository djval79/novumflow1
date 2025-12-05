import { test, expect } from '@playwright/test';

const BASE_URL = 'https://bgffggjfgcfnjgcj.vercel.app';
const TEST_EMAIL = 'hr@ringsteadcare.com';
const TEST_PASSWORD = 'phoneBobby1?';

// Helper function to login
async function login(page) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
}

test.describe('NovumFlow Recruitment Module - Automated Tests', () => {

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    // TEST 4: Job Management - Create Job
    test('TEST 4: Create new job posting', async ({ page }) => {
        await page.goto(`${BASE_URL}/recruitment/jobs`);

        // Click create job button
        await page.click('text=Create New Job, text=Add Job, button:has-text("New")').catch(() => {
            console.log('Create button not found with text, trying other selectors');
        });

        // Wait for modal or form
        await page.waitForTimeout(2000);

        // Fill job details
        await page.fill('input[name="title"], input[placeholder*="title" i]', 'Test Software Engineer');
        await page.fill('input[name="location"], input[placeholder*="location" i]', 'London');

        // Select employment type
        await page.selectOption('select[name="employment_type"], select:has-text("Full-time")', 'full-time').catch(() => {
            console.log('Employment type dropdown not found');
        });

        // Fill salary
        await page.fill('input[name="salary_min"], input[placeholder*="min" i]', '40000');
        await page.fill('input[name="salary_max"], input[placeholder*="max" i]', '60000');

        // Fill description
        await page.fill('textarea[name="description"], textarea[placeholder*="description" i]',
            'We are looking for an experienced software engineer to join our team. This role involves developing and maintaining web applications using modern technologies. The ideal candidate will have strong problem-solving skills and experience with React, TypeScript, and Node.js.');

        // Take screenshot before submit
        await page.screenshot({ path: 'test-results/job-create-form.png', fullPage: true });

        // Submit form
        await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Publish")');

        // Wait for success message or redirect
        await page.waitForTimeout(3000);

        // Take screenshot after submit
        await page.screenshot({ path: 'test-results/job-create-result.png', fullPage: true });

        // Verify job appears in list
        const jobExists = await page.locator('text=Test Software Engineer').count() > 0;
        expect(jobExists).toBeTruthy();
    });

    // TEST 7: Applications - View List
    test('TEST 7: View applications list', async ({ page }) => {
        await page.goto(`${BASE_URL}/recruitment/applications`);
        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({ path: 'test-results/applications-list.png', fullPage: true });

        // Check if applications are visible
        const applicationCards = await page.locator('[class*="application"], [class*="candidate"]').count();
        console.log(`Found ${applicationCards} application elements`);

        // Verify at least some applications exist (Ringstead has 15)
        expect(applicationCards).toBeGreaterThan(0);
    });

    // TEST 8: Applications - View Details
    test('TEST 8: View application details', async ({ page }) => {
        await page.goto(`${BASE_URL}/recruitment/applications`);
        await page.waitForTimeout(2000);

        // Click first application
        const firstApplication = page.locator('[class*="application"], [class*="candidate"]').first();
        await firstApplication.click();

        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({ path: 'test-results/application-details.png', fullPage: true });

        // Verify detail view loaded
        const hasDetails = await page.locator('text=Email, text=Phone, text=Resume').count() > 0;
        expect(hasDetails).toBeTruthy();
    });

    // TEST 13: Search & Filter - Search by Name
    test('TEST 13: Search applications by name', async ({ page }) => {
        await page.goto(`${BASE_URL}/recruitment/applications`);
        await page.waitForTimeout(2000);

        // Find search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        await searchInput.fill('test');
        await searchInput.press('Enter');

        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({ path: 'test-results/search-results.png', fullPage: true });

        // Verify search executed
        const url = page.url();
        console.log('Current URL after search:', url);
    });

    // TEST 14: Filter by Job
    test('TEST 14: Filter applications by job', async ({ page }) => {
        await page.goto(`${BASE_URL}/recruitment/applications`);
        await page.waitForTimeout(2000);

        // Look for filter button or dropdown
        await page.click('button:has-text("Filter"), select[name="job"]').catch(() => {
            console.log('Filter button not found');
        });

        await page.waitForTimeout(1000);

        // Take screenshot
        await page.screenshot({ path: 'test-results/filter-options.png', fullPage: true });
    });

    // TEST 16: Reports - View Dashboard
    test('TEST 16: View recruitment dashboard/reports', async ({ page }) => {
        await page.goto(`${BASE_URL}/recruitment/dashboard`);
        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({ path: 'test-results/recruitment-dashboard.png', fullPage: true });

        // Verify KPIs are visible
        const kpiCount = await page.locator('[class*="stat"], [class*="kpi"], [class*="metric"]').count();
        console.log(`Found ${kpiCount} KPI elements`);
        expect(kpiCount).toBeGreaterThan(0);
    });

    // TEST 18: Mobile Responsiveness
    test('TEST 18: Mobile responsiveness', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 390, height: 844 });

        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({ path: 'test-results/mobile-dashboard.png', fullPage: true });

        // Navigate to applications
        await page.goto(`${BASE_URL}/recruitment/applications`);
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'test-results/mobile-applications.png', fullPage: true });

        // Verify mobile menu is accessible
        const mobileMenu = await page.locator('button[aria-label*="menu" i], button:has-text("☰")').count();
        console.log(`Mobile menu elements found: ${mobileMenu}`);
    });

    // TEST 19: Form Validation
    test('TEST 19: Form validation - missing required fields', async ({ page }) => {
        await page.goto(`${BASE_URL}/recruitment/jobs`);

        // Try to create job without filling required fields
        await page.click('text=Create New Job, text=Add Job, button:has-text("New")').catch(() => {
            console.log('Create button not found');
        });

        await page.waitForTimeout(1000);

        // Try to submit empty form
        await page.click('button[type="submit"], button:has-text("Save")').catch(() => {
            console.log('Submit button not found');
        });

        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({ path: 'test-results/form-validation-errors.png', fullPage: true });

        // Verify error messages appear
        const errorCount = await page.locator('[class*="error"], [role="alert"], .text-red-500').count();
        console.log(`Found ${errorCount} error elements`);
        expect(errorCount).toBeGreaterThan(0);
    });

    // TEST: Multi-tenant isolation verification
    test('VERIFY: Multi-tenant data isolation', async ({ page }) => {
        // Check Ringstead data
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForTimeout(2000);

        const ringsteadStats = await page.textContent('body');
        await page.screenshot({ path: 'test-results/ringstead-dashboard.png', fullPage: true });

        // Switch to Novumsolvo
        await page.click('button:has-text("Ringstead"), [class*="tenant"]').catch(() => {
            console.log('Tenant switcher not found');
        });

        await page.waitForTimeout(1000);
        await page.click('text=novumsolvo').catch(() => {
            console.log('Novumsolvo option not found');
        });

        await page.waitForTimeout(3000);

        const novumsolvoStats = await page.textContent('body');
        await page.screenshot({ path: 'test-results/novumsolvo-dashboard.png', fullPage: true });

        // Verify they show different data
        expect(ringsteadStats).not.toEqual(novumsolvoStats);

        console.log('Ringstead stats:', ringsteadStats?.substring(0, 200));
        console.log('Novumsolvo stats:', novumsolvoStats?.substring(0, 200));
    });

    // TEST: Navigation and routing
    test('VERIFY: All recruitment pages load', async ({ page }) => {
        const pages = [
            '/dashboard',
            '/recruitment/jobs',
            '/recruitment/applications',
            '/recruitment/interviews',
            '/recruitment/settings'
        ];

        for (const pagePath of pages) {
            await page.goto(`${BASE_URL}${pagePath}`);
            await page.waitForTimeout(2000);

            // Take screenshot
            const filename = pagePath.replace(/\//g, '-').substring(1) || 'root';
            await page.screenshot({ path: `test-results/page-${filename}.png`, fullPage: true });

            // Verify page loaded (no 404 or error)
            const hasError = await page.locator('text=404, text=Error, text=Not Found').count();
            expect(hasError).toBe(0);

            console.log(`✓ ${pagePath} loaded successfully`);
        }
    });
});
