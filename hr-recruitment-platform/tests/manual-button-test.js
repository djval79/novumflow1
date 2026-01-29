const { chromium } = require('playwright');

async function manualButtonTest() {
    console.log('Starting manual button testing...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Test 1: Landing Page
        console.log('\n=== Testing Landing Page ===');
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('domcontentloaded');
        
        // Test Navigation Login button
        const loginLink = await page.locator('a[href="/login"]').first();
        if (await loginLink.isVisible()) {
            console.log('✓ Login navigation button visible');
            await loginLink.click();
            await page.waitForURL('**/login');
            console.log('✓ Login button works - navigated to login page');
        } else {
            console.log('✗ Login navigation button not found');
        }
        
        // Test 2: Login Page
        console.log('\n=== Testing Login Page ===');
        
        // Look for the main login form elements
        const emailInput = page.locator('input#email');
        const passwordInput = page.locator('input#password');
        const submitButton = page.locator('button[type="submit"]');
        
        if (await emailInput.isVisible()) {
            console.log('✓ Email input field visible');
        } else {
            console.log('✗ Email input field not found');
        }
        
        if (await passwordInput.isVisible()) {
            console.log('✓ Password input field visible');
        } else {
            console.log('✗ Password input field not found');
        }
        
        if (await submitButton.isVisible()) {
            console.log('✓ Submit button visible');
            console.log('Submit button text:', await submitButton.textContent());
        } else {
            console.log('✗ Submit button not found');
        }
        
        // Test invalid login
        await emailInput.fill('test@test.com');
        await passwordInput.fill('wrongpassword');
        await submitButton.click();
        
        // Wait for error message
        await page.waitForTimeout(3000);
        const errorElement = page.locator('.bg-red-50, .text-red-700');
        if (await errorElement.isVisible()) {
            console.log('✓ Error message displayed for invalid login');
        } else {
            console.log('✗ No error message for invalid login');
        }
        
        // Test 3: Navigation to Signup
        console.log('\n=== Testing Signup Navigation ===');
        const signupLink = page.locator('a[href="/signup"]');
        if (await signupLink.isVisible()) {
            console.log('✓ Signup link visible');
            await signupLink.click();
            await page.waitForURL('**/signup');
            console.log('✓ Signup link works - navigated to signup page');
        } else {
            console.log('✗ Signup link not found');
        }
        
        // Test 4: Signup Page
        console.log('\n=== Testing Signup Page ===');
        
        const fullNameInput = page.locator('input#fullName');
        const signupEmailInput = page.locator('input#email');
        const signupPasswordInput = page.locator('input#password');
        const roleSelect = page.locator('select#role');
        const signupSubmitBtn = page.locator('button[type="submit"]');
        
        if (await fullNameInput.isVisible()) {
            console.log('✓ Full name input visible');
        } else {
            console.log('✗ Full name input not found');
        }
        
        if (await signupEmailInput.isVisible()) {
            console.log('✓ Email input visible on signup');
        } else {
            console.log('✗ Email input not found on signup');
        }
        
        if (await signupPasswordInput.isVisible()) {
            console.log('✓ Password input visible on signup');
        } else {
            console.log('✗ Password input not found on signup');
        }
        
        if (await roleSelect.isVisible()) {
            console.log('✓ Role select visible');
        } else {
            console.log('✗ Role select not found');
        }
        
        if (await signupSubmitBtn.isVisible()) {
            console.log('✓ Signup submit button visible');
            console.log('Signup button text:', await signupSubmitBtn.textContent());
        } else {
            console.log('✗ Signup submit button not found');
        }
        
        // Test form validation
        await signupSubmitBtn.click();
        await page.waitForTimeout(1000);
        
        // Check for HTML5 validation
        const emailValid = await signupEmailInput.evaluate(el => el.checkValidity());
        if (!emailValid) {
            console.log('✓ Email validation works');
        } else {
            console.log('✗ Email validation not working');
        }
        
        // Test 5: Go back to landing and test more buttons
        console.log('\n=== Testing Landing Page CTA Buttons ===');
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('domcontentloaded');
        
        // Test Explore the Suite button
        const exploreBtn = page.locator('button:has-text("Explore the Suite")');
        if (await exploreBtn.isVisible()) {
            console.log('✓ "Explore the Suite" button visible');
            await exploreBtn.click();
            await page.waitForTimeout(2000);
            
            // Check if modal opened
            const modal = page.locator('[role="dialog"], .modal, .fixed').first();
            if (await modal.isVisible()) {
                console.log('✓ Demo modal opens correctly');
                // Try to close it
                const closeBtn = page.locator('button[aria-label="Close"], button:has-text("Close")').first();
                if (await closeBtn.isVisible()) {
                    await closeBtn.click();
                    console.log('✓ Modal close button works');
                }
            } else {
                console.log('✗ Modal did not open');
            }
        } else {
            console.log('✗ "Explore the Suite" button not found');
        }
        
        // Test View Live Dashboard button
        const dashboardBtn = page.locator('a:has-text("View Live Dashboard")');
        if (await dashboardBtn.isVisible()) {
            console.log('✓ "View Live Dashboard" button visible');
            await dashboardBtn.click();
            await page.waitForTimeout(2000);
            
            // Check if scrolled to demo section
            const demoSection = page.locator('#demo');
            const isInViewport = await demoSection.evaluate(el => {
                const rect = el.getBoundingClientRect();
                return rect.top >= 0 && rect.bottom <= window.innerHeight;
            });
            
            if (isInViewport) {
                console.log('✓ Dashboard button scrolls to demo section');
            } else {
                console.log('✗ Dashboard button does not scroll correctly');
            }
        } else {
            console.log('✗ "View Live Dashboard" button not found');
        }
        
        console.log('\n=== Testing Mobile Responsiveness ===');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('domcontentloaded');
        
        const mobileMenuBtn = page.locator('button:has-text("Menu")');
        if (await mobileMenuBtn.isVisible()) {
            console.log('✓ Mobile menu button visible');
            await mobileMenuBtn.click();
            await page.waitForTimeout(1000);
            
            const mobileNav = page.locator('text=Why NovumFlow');
            if (await mobileNav.isVisible()) {
                console.log('✓ Mobile menu opens correctly');
            } else {
                console.log('✗ Mobile menu does not open');
            }
        } else {
            console.log('✗ Mobile menu button not found');
        }
        
        console.log('\n=== Test Complete ===');
        
    } catch (error) {
        console.error('Test failed with error:', error);
    } finally {
        await browser.close();
    }
}

manualButtonTest();
