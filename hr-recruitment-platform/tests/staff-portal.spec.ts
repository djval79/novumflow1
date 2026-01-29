import { test, expect } from '@playwright/test';

test('comprehensive staff portal test', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:5173/login');

    // Use Quick Admin Setup
    const testEmail = `e2e.${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';

    await page.fill('input[placeholder="Admin email address"]', testEmail);
    await page.fill('input[placeholder="Admin password (min 6 chars)"]', testPassword);
    await page.click('button:has-text("Create Admin Account")');

    // Wait for redirect to staff-portal (as per RBAC)
    await page.waitForURL('**/staff-portal', { timeout: 30000 });
    console.log('Redirected to Staff Portal');

    // Verify Staff Portal elements
    await expect(page.locator('text=Staff Portal')).toBeVisible();
    await expect(page.locator('text=Quick Actions')).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-results/staff-portal.png', fullPage: true });

    // Test navigation to My Passport
    await page.click('button:has-text("My Passport")');
    await page.waitForURL('**/my-passport', { timeout: 10000 });
    console.log('Navigated to My Passport');
    await page.screenshot({ path: 'test-results/my-passport.png', fullPage: true });

    // Go back and test Training
    await page.goBack();
    await page.click('button:has-text("My Training")');
    await page.waitForURL('**/training', { timeout: 10000 });
    console.log('Navigated to Training');
    await page.screenshot({ path: 'test-results/training.png', fullPage: true });

    // Go back and test Documents
    await page.goBack();
    await page.click('button:has-text("Documents")');
    await page.waitForURL('**/documents', { timeout: 10000 });
    console.log('Navigated to Documents');
    await page.screenshot({ path: 'test-results/documents.png', fullPage: true });

    // Go back and test Noticeboard
    await page.goBack();
    await page.click('button:has-text("Notices")');
    await page.waitForURL('**/noticeboard', { timeout: 10000 });
    console.log('Navigated to Noticeboard');
    await page.screenshot({ path: 'test-results/noticeboard.png', fullPage: true });

    // Test logout
    await page.click('button:has(svg.lucide-log-out)');
    await page.waitForURL('**/login', { timeout: 10000 });
    console.log('Successfully logged out');

    await page.screenshot({ path: 'test-results/logout-success.png', fullPage: true });
});
