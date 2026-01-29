const { chromium } = require('playwright');

async function inspectPages() {
    console.log('Starting page inspection...');
    
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const page = await browser.newPage();
    
    try {
        // Check landing page
        console.log('\n=== Inspecting Landing Page ===');
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('domcontentloaded');
        
        console.log('Page title:', await page.title());
        console.log('Page URL:', page.url());
        
        // Check all buttons and links
        const buttons = await page.locator('button').all();
        console.log(`Found ${buttons.length} buttons`);
        for (let i = 0; i < Math.min(buttons.length, 5); i++) {
            const text = await buttons[i].textContent();
            console.log(`Button ${i + 1}: "${text}"`);
        }
        
        const links = await page.locator('a').all();
        console.log(`Found ${links.length} links`);
        for (let i = 0; i < Math.min(links.length, 5); i++) {
            const text = await links[i].textContent();
            const href = await links[i].getAttribute('href');
            console.log(`Link ${i + 1}: "${text}" -> ${href}`);
        }
        
        // Check login link
        const loginLinks = await page.locator('a[href="/login"]').all();
        console.log(`Found ${loginLinks.length} login links`);
        
        // Take screenshot
        await page.screenshot({ path: 'landing-page.png', fullPage: true });
        console.log('Screenshot saved as landing-page.png');
        
        // Check login page
        console.log('\n=== Inspecting Login Page ===');
        await page.goto('http://localhost:5173/login');
        await page.waitForLoadState('domcontentloaded');
        
        console.log('Login page title:', await page.title());
        console.log('Login page URL:', page.url());
        
        const loginInputs = await page.locator('input').all();
        console.log(`Found ${loginInputs.length} input fields on login page`);
        for (let i = 0; i < loginInputs.length; i++) {
            const type = await loginInputs[i].getAttribute('type');
            const id = await loginInputs[i].getAttribute('id');
            const placeholder = await loginInputs[i].getAttribute('placeholder');
            console.log(`Input ${i + 1}: type=${type}, id=${id}, placeholder="${placeholder}"`);
        }
        
        const loginButtons = await page.locator('button').all();
        console.log(`Found ${loginButtons.length} buttons on login page`);
        for (let i = 0; i < loginButtons.length; i++) {
            const text = await loginButtons[i].textContent();
            const type = await loginButtons[i].getAttribute('type');
            console.log(`Button ${i + 1}: "${text}" (type: ${type})`);
        }
        
        await page.screenshot({ path: 'login-page.png', fullPage: true });
        console.log('Screenshot saved as login-page.png');
        
        // Check signup page
        console.log('\n=== Inspecting Signup Page ===');
        await page.goto('http://localhost:5173/signup');
        await page.waitForLoadState('domcontentloaded');
        
        console.log('Signup page title:', await page.title());
        
        const signupInputs = await page.locator('input').all();
        console.log(`Found ${signupInputs.length} input fields on signup page`);
        for (let i = 0; i < signupInputs.length; i++) {
            const type = await signupInputs[i].getAttribute('type');
            const id = await signupInputs[i].getAttribute('id');
            const placeholder = await signupInputs[i].getAttribute('placeholder');
            console.log(`Input ${i + 1}: type=${type}, id=${id}, placeholder="${placeholder}"`);
        }
        
        const signupSelects = await page.locator('select').all();
        console.log(`Found ${signupSelects.length} select fields on signup page`);
        for (let i = 0; i < signupSelects.length; i++) {
            const id = await signupSelects[i].getAttribute('id');
            console.log(`Select ${i + 1}: id=${id}`);
        }
        
        await page.screenshot({ path: 'signup-page.png', fullPage: true });
        console.log('Screenshot saved as signup-page.png');
        
        console.log('\n=== Inspection Complete ===');
        
    } catch (error) {
        console.error('Inspection failed with error:', error);
    } finally {
        // Keep browser open for 10 seconds for manual inspection
        console.log('Keeping browser open for 10 seconds for manual inspection...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

inspectPages();
