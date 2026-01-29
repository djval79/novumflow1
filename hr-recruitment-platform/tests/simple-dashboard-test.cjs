const { chromium } = require('playwright');

async function simpleDashboardTest() {
    console.log('Starting simple dashboard test...');
    
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Console Error:', msg.text());
        }
    });
    
    try {
        console.log('\n=== Testing Landing to Login Flow ===');
        
        // Test landing page login navigation
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        await page.waitForSelector('h1', { timeout: 10000 });
        
        const loginButton = page.locator('text=Login').first();
        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.waitForTimeout(2000);
            console.log('✓ Login navigation works');
        }
        
        console.log('\n=== Testing Login Page Elements ===');
        
        // Test login page elements
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        const submitButton = page.locator('button[type="submit"]');
        
        console.log('✓ Login form elements found');
        
        // Test SSO toggle
        const ssoTab = page.locator('text=Enterprise SSO');
        if (await ssoTab.isVisible()) {
            await ssoTab.click();
            await page.waitForTimeout(1000);
            console.log('✓ SSO tab clickable');
            
            const domainInput = page.locator('input[name="domain"], #domain, input[placeholder*="domain"]');
            if (await domainInput.isVisible()) {
                console.log('✓ SSO domain input appears');
                
                const ssoSubmit = page.locator('button:has-text("Continue with SSO")');
                if (await ssoSubmit.isVisible()) {
                    // Initially should be disabled
                    const isDisabled = await ssoSubmit.isDisabled();
                    if (isDisabled) {
                        console.log('✓ SSO submit button correctly disabled without domain');
                    }
                    
                    // Fill domain and test button enables
                    await domainInput.fill('test.com');
                    await page.waitForTimeout(500);
                    const isEnabledAfter = await ssoSubmit.isEnabled();
                    if (isEnabledAfter) {
                        console.log('✓ SSO submit button enables after domain filled');
                    }
                }
            }
        }
        
        // Switch back to standard login
        const standardTab = page.locator('text=Standard Login');
        if (await standardTab.isVisible()) {
            await standardTab.click();
            await page.waitForTimeout(1000);
            console.log('✓ Standard login tab works');
        }
        
        console.log('\n=== Testing Login Form Validation ===');
        
        // Test invalid credentials
        await emailInput.fill('invalid@test.com');
        await passwordInput.fill('wrongpassword');
        await submitButton.click();
        
        await page.waitForTimeout(3000);
        
        // Check for error message (it might take time to appear)
        const errorSelectors = [
            'text=Invalid email or password',
            '.bg-red-50',
            '.text-red-700',
            '[data-testid="login-error"]'
        ];
        
        let errorFound = false;
        for (const selector of errorSelectors) {
            try {
                const errorElement = page.locator(selector).first();
                if (await errorElement.isVisible({ timeout: 2000 })) {
                    errorFound = true;
                    console.log('✓ Error message displayed for invalid login');
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }
        
        if (!errorFound) {
            console.log('✗ No error message found for invalid login');
        }
        
        console.log('\n=== Testing Navigation Links ===');
        
        // Test signup link
        const signupLink = page.locator('a[href="/signup"], text=Sign up');
        if (await signupLink.isVisible()) {
            await signupLink.click();
            await page.waitForTimeout(2000);
            
            if (page.url().includes('/signup')) {
                console.log('✓ Signup link works');
            }
        }
        
        // Test forgot password link
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
        const forgotPasswordLink = page.locator('a[href="/forgot-password"], text=Forgot password');
        if (await forgotPasswordLink.isVisible()) {
            await forgotPasswordLink.click();
            await page.waitForTimeout(2000);
            
            if (page.url().includes('/forgot-password')) {
                console.log('✓ Forgot password link works');
            }
        }
        
        // Test create organization link
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
        const createOrgLink = page.locator('a[href="/tenant/create"], text=Create New Organization');
        if (await createOrgLink.isVisible()) {
            await createOrgLink.click();
            await page.waitForTimeout(2000);
            
            if (page.url().includes('/tenant/create')) {
                console.log('✓ Create organization link works');
            }
        }
        
        console.log('\n=== Testing Signup Page ===');
        
        await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
        
        // Test signup form elements
        const signupInputs = [
            { selector: 'input#fullName', name: 'Full Name' },
            { selector: 'input[type="email"]', name: 'Email' },
            { selector: 'input[type="password"]', name: 'Password' },
            { selector: 'select#role', name: 'Role' }
        ];
        
        for (const input of signupInputs) {
            try {
                await page.waitForSelector(input.selector, { timeout: 5000 });
                const element = page.locator(input.selector);
                if (await element.isVisible()) {
                    console.log(`✓ ${input.name} input found and visible`);
                } else {
                    console.log(`✗ ${input.name} input not visible`);
                }
            } catch (e) {
                console.log(`✗ ${input.name} input not found`);
            }
        }
        
        // Test role selection
        const roleSelect = page.locator('select#role');
        if (await roleSelect.isVisible()) {
            const options = await roleSelect.locator('option').allTextContents();
            console.log(`✓ Role options available: ${options.join(', ')}`);
            
            // Test selecting different roles
            await roleSelect.selectOption('recruiter');
            const selectedValue = await roleSelect.inputValue();
            console.log(`✓ Role selection works - selected: ${selectedValue}`);
        }
        
        // Test signup submission validation
        const signupSubmit = page.locator('button[type="submit"]');
        if (await signupSubmit.isVisible()) {
            console.log('✓ Signup submit button visible');
            
            // Test empty form submission
            await signupSubmit.click();
            await page.waitForTimeout(1000);
            
            // HTML5 validation should prevent submission
            const emailRequired = await page.locator('input[type="email"]').evaluate(el => !el.validity.valid);
            if (emailRequired) {
                console.log('✓ HTML5 email validation works');
            }
        }
        
        // Test sign in link on signup page
        const signinLink = page.locator('a[href="/login"], text=Sign in');
        if (await signinLink.isVisible()) {
            await signinLink.click();
            await page.waitForTimeout(2000);
            
            if (page.url().includes('/login')) {
                console.log('✓ Sign in link on signup page works');
            }
        }
        
        console.log('\n=== Testing Landing Page CTAs ===');
        
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        await page.waitForSelector('h1', { timeout: 10000 });
        
        // Test "Get Full Access" button in suite section
        const getAccessButton = page.locator('text=Get Full Access');
        const accessCount = await getAccessButton.count();
        if (accessCount > 0 && await getAccessButton.first().isVisible()) {
            await getAccessButton.first().click();
            await page.waitForTimeout(2000);
            
            if (page.url().includes('/signup')) {
                console.log('✓ "Get Full Access" button navigates to signup');
            }
        }
        
        // Test "Book a Demo" button
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        const bookDemoButton = page.locator('text=Book a Demo');
        const demoCount = await bookDemoButton.count();
        if (demoCount > 0 && await bookDemoButton.first().isVisible()) {
            await bookDemoButton.first().click();
            await page.waitForTimeout(2000);
            
            // Check for modal
            const modal = page.locator('[role="dialog"], .modal, .fixed').first();
            if (await modal.isVisible({ timeout: 3000 })) {
                console.log('✓ "Book a Demo" button opens modal');
            } else {
                console.log('✗ "Book a Demo" button does not open modal');
            }
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

simpleDashboardTest();
