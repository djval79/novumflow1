const { chromium } = require('playwright');

async function testDashboardButtons() {
    console.log('Starting dashboard button testing...');
    
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Console Error:', msg.text());
        }
    });
    
    try {
        console.log('\n=== Testing Authentication and Dashboard ===');
        
        // First, create a test user by navigating to signup
        await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
        
        // Fill signup form
        const timestamp = Date.now();
        const testEmail = `test${timestamp}@test.com`;
        const testPassword = 'TestPassword123!';
        
        await page.fill('input#fullName', 'Test User');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.selectOption('select#role', 'admin');
        
        // Submit signup
        const signupSubmit = page.locator('button[type="submit"]');
        await signupSubmit.click();
        
        await page.waitForTimeout(3000);
        
        // Try to login with the created user
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
        
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        
        const loginSubmit = page.locator('button[type="submit"]');
        await loginSubmit.click();
        
        // Wait for dashboard to load
        try {
            await page.waitForURL('**/dashboard', { timeout: 15000 });
            console.log('✓ Successfully logged in and redirected to dashboard');
        } catch (e) {
            console.log('✗ Login failed or not redirected to dashboard');
            console.log('Current URL:', page.url());
        }
        
        // Wait for dashboard content
        await page.waitForTimeout(3000);
        
        console.log('\n=== Testing Dashboard Buttons ===');
        
        // Test System Tour button
        const tourButton = page.locator('text=System Tour');
        const tourCount = await tourButton.count();
        console.log(`Found ${tourCount} "System Tour" elements`);
        
        if (tourCount > 0 && await tourButton.first().isVisible()) {
            console.log('✓ System Tour button found and visible');
            await tourButton.first().click();
            await page.waitForTimeout(2000);
            console.log('✓ System Tour button clicked');
        } else {
            console.log('✗ System Tour button not found or not visible');
        }
        
        // Test navigation buttons
        const navButtons = [
            'Dashboard', 'HR', 'Recruitment', 'Settings', 'Compliance'
        ];
        
        for (const buttonText of navButtons) {
            const navButton = page.locator(`text=${buttonText}`);
            const count = await navButton.count();
            console.log(`Found ${count} "${buttonText}" navigation elements`);
            
            if (count > 0 && await navButton.first().isVisible()) {
                console.log(`✓ "${buttonText}" navigation button found and visible`);
            } else {
                console.log(`✗ "${buttonText}" navigation button not found or not visible`);
            }
        }
        
        // Test "View All" button in activity feed
        const viewAllButton = page.locator('text=View All');
        const viewAllCount = await viewAllButton.count();
        console.log(`Found ${viewAllCount} "View All" elements`);
        
        if (viewAllCount > 0 && await viewAllButton.first().isVisible()) {
            console.log('✓ "View All" button found and visible');
        } else {
            console.log('✗ "View All" button not found or not visible');
        }
        
        // Test support buttons
        const knowledgeBaseButton = page.locator('text=Knowledge Base');
        const kbCount = await knowledgeBaseButton.count();
        console.log(`Found ${kbCount} "Knowledge Base" elements`);
        
        if (kbCount > 0 && await knowledgeBaseButton.first().isVisible()) {
            console.log('✓ "Knowledge Base" button found and visible');
            await knowledgeBaseButton.first().click();
            await page.waitForTimeout(2000);
            console.log('✓ "Knowledge Base" button clicked');
        } else {
            console.log('✗ "Knowledge Base" button not found or not visible');
        }
        
        const contactSupportButton = page.locator('text=Contact Support');
        const supportCount = await contactSupportButton.count();
        console.log(`Found ${supportCount} "Contact Support" elements`);
        
        if (supportCount > 0 && await contactSupportButton.first().isVisible()) {
            console.log('✓ "Contact Support" button found and visible');
            await contactSupportButton.first().click();
            await page.waitForTimeout(2000);
            console.log('✓ "Contact Support" button clicked');
        } else {
            console.log('✗ "Contact Support" button not found or not visible');
        }
        
        console.log('\n=== Testing Logout ===');
        
        // Look for logout button
        const logoutButton = page.locator('button[title="Sign Out"], button:has-text("Sign Out"), [data-testid="logout"]');
        const logoutCount = await logoutButton.count();
        console.log(`Found ${logoutCount} logout elements`);
        
        if (logoutCount > 0) {
            console.log('✓ Logout button found');
            if (await logoutButton.first().isVisible()) {
                await logoutButton.first().click();
                await page.waitForTimeout(3000);
                
                if (page.url().includes('/login')) {
                    console.log('✓ Logout button works - redirected to login');
                } else {
                    console.log('✗ Logout button did not redirect to login');
                    console.log('Current URL:', page.url());
                }
            } else {
                console.log('✗ Logout button not visible');
                
                // Try mobile menu
                const mobileMenuButton = page.locator('button:has-text("Menu")');
                if (await mobileMenuButton.isVisible()) {
                    await mobileMenuButton.click();
                    await page.waitForTimeout(1000);
                    
                    const mobileLogoutButton = page.locator('text=Sign Out').first();
                    if (await mobileLogoutButton.isVisible()) {
                        await mobileLogoutButton.click();
                        await page.waitForTimeout(3000);
                        console.log('✓ Mobile logout button works');
                    } else {
                        console.log('✗ Mobile logout button not found');
                    }
                }
            }
        } else {
            console.log('✗ Logout button not found');
        }
        
        console.log('\n=== Testing Protected Routes ===');
        
        // Test accessing protected route without login
        await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
        if (page.url().includes('/login')) {
            console.log('✓ Protected routes redirect to login when not authenticated');
        } else {
            console.log('✗ Protected routes do not redirect to login');
        }
        
        console.log('\n=== Testing Mobile Responsiveness ===');
        
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Test landing page on mobile
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        const mobileMenuButton = page.locator('button:has-text("Menu")');
        if (await mobileMenuButton.isVisible()) {
            console.log('✓ Mobile menu button visible');
            await mobileMenuButton.click();
            await page.waitForTimeout(1000);
            
            const mobileNavigation = page.locator('text=Why NovumFlow, text=Features, text=Live Preview');
            if (await mobileNavigation.first().isVisible()) {
                console.log('✓ Mobile navigation opens correctly');
            } else {
                console.log('✗ Mobile navigation does not open');
            }
        } else {
            console.log('✗ Mobile menu button not visible');
        }
        
        // Test login page on mobile
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        const mobileLoginButton = page.locator('button[type="submit"]');
        if (await mobileLoginButton.isVisible()) {
            console.log('✓ Login submit button visible on mobile');
        } else {
            console.log('✗ Login submit button not visible on mobile');
        }
        
        console.log('\n=== Test Complete ===');
        
    } catch (error) {
        console.error('Test failed with error:', error);
    } finally {
        console.log('Keeping browser open for 5 seconds for manual inspection...');
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

testDashboardButtons();
