const { chromium } = require('playwright');

async function debugPageLoad() {
    console.log('Starting page load debugging...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => {
        console.log('Console:', msg.type(), msg.text());
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
        console.error('Page error:', error.message);
    });
    
    try {
        console.log('\n=== Debugging Landing Page Load ===');
        const response = await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        console.log('Response status:', response.status());
        console.log('Response headers:', response.headers());
        
        await page.waitForTimeout(5000);
        
        // Check if React app is loaded
        const reactLoaded = await page.evaluate(() => {
            return !!document.querySelector('[data-reactroot]') || 
                   !!document.querySelector('#root') ||
                   !!document.querySelector('.react-loading') ||
                   document.body.innerHTML.includes('React');
        });
        
        console.log('React app detected:', reactLoaded);
        
        // Get page content
        const bodyContent = await page.evaluate(() => document.body.innerHTML);
        console.log('Page content length:', bodyContent.length);
        console.log('First 500 chars:', bodyContent.substring(0, 500));
        
        // Check for loading indicators
        const loadingElements = await page.locator('text=Loading').all();
        console.log('Loading elements found:', loadingElements.length);
        
        // Wait a bit longer
        console.log('Waiting 10 more seconds for content to load...');
        await page.waitForTimeout(10000);
        
        // Re-check content
        const bodyContentAfter = await page.evaluate(() => document.body.innerHTML);
        console.log('Page content length after wait:', bodyContentAfter.length);
        console.log('First 500 chars after wait:', bodyContentAfter.substring(0, 500));
        
        // Check specific elements that should be there
        const navElements = await page.locator('nav').all();
        console.log('Nav elements found:', navElements.length);
        
        const h1Elements = await page.locator('h1').all();
        console.log('H1 elements found:', h1Elements.length);
        
        if (h1Elements.length > 0) {
            for (let i = 0; i < h1Elements.length; i++) {
                const text = await h1Elements[i].textContent();
                console.log(`H1 ${i + 1}: "${text}"`);
            }
        }
        
        console.log('\n=== Debug Complete ===');
        
    } catch (error) {
        console.error('Debug failed with error:', error);
    } finally {
        await browser.close();
    }
}

debugPageLoad();
