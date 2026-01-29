import { test, expect } from '@playwright/test';

test('debug login page', async ({ page }) => {
    console.log('Navigating to http://localhost:5173/login...');
    await page.goto('http://localhost:5173/login');

    console.log('Current URL:', page.url());

    const title = await page.title();
    console.log('Page Title:', title);

    const content = await page.content();
    // Use Quick Admin Setup
    const testEmail = `e2e.${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';

    console.log(`Using Quick Admin Setup with email: ${testEmail}`);

    const emailInput = page.locator('input[placeholder="Admin email address"]');
    const passwordInput = page.locator('input[placeholder="Admin password (min 6 chars)"]');
    const createButton = page.locator('button:has-text("Create Admin Account")');

    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);

    console.log('Fields filled. Clicking Create Admin Account button...');
    await createButton.click();
    console.log('Button clicked. Waiting for redirection or error...');

    try {
        await page.waitForURL('**/dashboard', { timeout: 30000 });
        console.log('Login successful! Redirected to dashboard.');

        // Wait specifically for dashboard content
        await page.waitForSelector('text=Dashboard, .dashboard', { timeout: 10000 }).catch(() => console.log('Dashboard text/selector not found after redirect'));

        const finalContent = await page.content();
        const fs = require('fs');
        fs.writeFileSync('test-results/dashboard-content.html', finalContent);
        console.log('Final HTML content written to test-results/dashboard-content.html');

    } catch (e) {
        console.log('Redirection to dashboard failed or timed out.');
        const currentUrl = page.url();
        console.log('Final URL:', currentUrl);

        const errorText = await page.locator('.text-red-600').innerText().catch(() => 'No error text found');
        console.log('Potential error message on page:', errorText);
    }

    await page.screenshot({ path: 'test-results/debug-login-success.png', fullPage: true });

    await page.screenshot({ path: 'test-results/debug-login.png', fullPage: true });
});
