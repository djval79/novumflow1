import { test, expect } from '@playwright/test';

test('HR Module comprehensive test', async ({ page }) => {
    // Navigate directly to HR module
    await page.goto('http://localhost:5173/hr');

    // Should redirect to login since not authenticated
    await page.waitForURL('**/login', { timeout: 10000 });
    console.log('Redirected to login - auth protection working');

    // Use Quick Admin Setup
    const testEmail = `hr-test.${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';

    await page.fill('input[placeholder="Admin email address"]', testEmail);
    await page.fill('input[placeholder="Admin password (min 6 chars)"]', testPassword);
    await page.click('button:has-text("Create Admin Account")');

    // Wait for redirect 
    await page.waitForURL(/.*/, { timeout: 30000 });
    console.log('Current URL after login:', page.url());

    // Navigate directly to HR (as admin should have access)
    await page.goto('http://localhost:5173/hr');
    await page.waitForLoadState('networkidle');
    console.log('HR Page URL:', page.url());

    await page.screenshot({ path: 'test-results/hr-module.png', fullPage: true });

    // Check for HR module elements
    const hrElements = await page.locator('text=Employee, text=Add Employee, text=Staff, text=HR').count();
    console.log('HR-related elements found:', hrElements);

    // Check page content
    const content = await page.content();
    const fs = require('fs');
    fs.writeFileSync('test-results/hr-module-content.html', content);
    console.log('HR Module HTML saved to test-results/hr-module-content.html');
});
