const { chromium } = require('playwright');

async function targetedButtonTest() {
    console.log('Starting targeted button testing...');
    
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Console Error:', msg.text());
        }
    });
    
    try {
        console.log('\n=== Testing Landing Page Buttons ===');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        
        // Wait for content to load
        await page.waitForSelector('h1', { timeout: 15000 });
        console.log('✓ Landing page loaded successfully');
        
        // Test specific text-based selectors
        const loginButton = page.locator('text=Login');
        const loginCount = await loginButton.count();
        console.log(`Found ${loginCount} "Login" elements`);
        
        if (loginCount > 0) {
            console.log('✓ Login button(s) found');
            const firstLogin = loginButton.first();
            if (await firstLogin.isVisible()) {
                console.log('✓ First login button is visible');
                await firstLogin.click();
                await page.waitForTimeout(2000);
                
                if (page.url().includes('/login')) {
                    console.log('✓ Login button navigates correctly');
                } else {
                    console.log('✗ Login button navigation failed');
                    console.log('Current URL:', page.url());
                }
            } else {
                console.log('✗ First login button not visible');
            }
        }
        
        // Go back to landing page
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        await page.waitForSelector('h1', { timeout: 10000 });
        
        // Test "Explore the Suite" button
        const exploreButton = page.locator('text=Explore the Suite');
        const exploreCount = await exploreButton.count();
        console.log(`Found ${exploreCount} "Explore the Suite" elements`);
        
        if (exploreCount > 0) {
            console.log('✓ "Explore the Suite" button found');
            if (await exploreButton.first().isVisible()) {
                console.log('✓ "Explore the Suite" button is visible');
                await exploreButton.first().click();
                await page.waitForTimeout(2000);
                
                // Check for modal or other interaction
                const modal = page.locator('[role="dialog"], .modal, .fixed').first();
                if (await modal.isVisible({ timeout: 5000 })) {
                    console.log('✓ Modal opens when "Explore the Suite" clicked');
                    
                    // Try to close modal
                    const closeButton = page.locator('button:has-text("Close"), button[aria-label="Close"], [data-testid="close-modal"]').first();
                    if (await closeButton.isVisible({ timeout: 3000 })) {
                        await closeButton.click();
                        console.log('✓ Modal close button works');
                    } else {
                        // Try clicking outside modal
                        await page.keyboard.press('Escape');
                        await page.waitForTimeout(1000);
                        const modalStillVisible = await modal.isVisible();
                        if (!modalStillVisible) {
                            console.log('✓ Modal closes with Escape key');
                        }
                    }
                } else {
                    console.log('✗ No modal opened after clicking "Explore the Suite"');
                }
            } else {
                console.log('✗ "Explore the Suite" button not visible');
            }
        }
        
        // Test "View Live Dashboard" button
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        await page.waitForSelector('h1', { timeout: 10000 });
        
        const dashboardButton = page.locator('text=View Live Dashboard');
        const dashboardCount = await dashboardButton.count();
        console.log(`Found ${dashboardCount} "View Live Dashboard" elements`);
        
        if (dashboardCount > 0) {
            console.log('✓ "View Live Dashboard" button found');
            if (await dashboardButton.first().isVisible()) {
                console.log('✓ "View Live Dashboard" button is visible');
                await dashboardButton.first().click();
                await page.waitForTimeout(2000);
                
                // Check if scrolled or navigated
                const demoSection = page.locator('#demo');
                if (await demoSection.isVisible()) {
                    console.log('✓ "View Live Dashboard" shows demo section');
                } else {
                    console.log('✗ "View Live Dashboard" does not show expected content');
                }
            } else {
                console.log('✗ "View Live Dashboard" button not visible');
            }
        }
        
        console.log('\n=== Testing Login Page ===');
        
        // Navigate to login page
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
        
        // Wait for login form
        try {
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            console.log('✓ Email input found on login page');
        } catch (e) {
            console.log('✗ Email input not found on login page');
        }
        
        try {
            await page.waitForSelector('input[type="password"]', { timeout: 10000 });
            console.log('✓ Password input found on login page');
        } catch (e) {
            console.log('✗ Password input not found on login page');
        }
        
        try {
            await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
            console.log('✓ Submit button found on login page');
            
            const submitBtn = page.locator('button[type="submit"]').first();
            const submitText = await submitBtn.textContent();
            console.log(`Submit button text: "${submitText}"`);
            
            if (await submitBtn.isVisible()) {
                console.log('✓ Submit button is visible');
            }
        } catch (e) {
            console.log('✗ Submit button not found on login page');
        }
        
        // Test invalid login
        try {
            const emailInput = page.locator('input[type="email"]').first();
            const passwordInput = page.locator('input[type="password"]').first();
            const submitBtn = page.locator('button[type="submit"]').first();
            
            await emailInput.fill('test@test.com');
            await passwordInput.fill('wrongpassword');
            await submitBtn.click();
            
            // Wait for error message
            await page.waitForTimeout(3000);
            
            const errorElement = page.locator('text=Invalid email or password, .bg-red-50, .text-red-700').first();
            if (await errorElement.isVisible({ timeout: 5000 })) {
                console.log('✓ Error message appears for invalid login');
            } else {
                console.log('✗ No error message for invalid login');
            }
        } catch (e) {
            console.log('✗ Could not test invalid login:', e.message);
        }
        
        console.log('\n=== Testing Signup Page ===');
        
        // Navigate to signup page
        await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
        
        // Look for signup form elements
        try {
            await page.waitForSelector('input#fullName', { timeout: 10000 });
            console.log('✓ Full name input found on signup page');
        } catch (e) {
            console.log('✗ Full name input not found on signup page');
        }
        
        try {
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            console.log('✓ Email input found on signup page');
        } catch (e) {
            console.log('✗ Email input not found on signup page');
        }
        
        try {
            await page.waitForSelector('input[type="password"]', { timeout: 10000 });
            console.log('✓ Password input found on signup page');
        } catch (e) {
            console.log('✗ Password input not found on signup page');
        }
        
        try {
            await page.waitForSelector('select#role', { timeout: 10000 });
            console.log('✓ Role select found on signup page');
        } catch (e) {
            console.log('✗ Role select not found on signup page');
        }
        
        try {
            await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
            const submitBtn = page.locator('button[type="submit"]').first();
            const submitText = await submitBtn.textContent();
            console.log(`Signup submit button text: "${submitText}"`);
            console.log('✓ Submit button found on signup page');
        } catch (e) {
            console.log('✗ Submit button not found on signup page');
        }
        
        console.log('\n=== Test Complete ===');
        
    } catch (error) {
        console.error('Test failed with error:', error);
    } finally {
        // Keep browser open for manual inspection
        console.log('Keeping browser open for 5 seconds for manual inspection...');
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

targetedButtonTest();
