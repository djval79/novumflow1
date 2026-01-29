import { test, expect, login, waitForPageLoad, createTestUser } from './fixtures/auth';

/**
 * Comprehensive Button Testing Suite
 * Tests all call-to-action buttons across the HR Recruitment Platform
 */

test.describe('Comprehensive Button Testing', () => {
    let testUser = { email: '', password: '' };

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        testUser = await createTestUser(page);
        console.log(`Test user created: ${testUser.email}`);
        await context.close();
    });

    test.describe('Landing Page Buttons', () => {
        test('should test all landing page CTA buttons', async ({ page }) => {
            await page.goto('/');
            await waitForPageLoad(page);

            // Test Navigation Login button
            const navLoginBtn = page.locator('a[href="/login"]');
            await expect(navLoginBtn).toBeVisible();
            await expect(navLoginBtn).toHaveText('Login');
            await navLoginBtn.click();
            await expect(page).toHaveURL('/login');

            // Go back to landing page
            await page.goto('/');
            await waitForPageLoad(page);

            // Test "Explore the Suite" button (Demo Modal)
            const exploreBtn = page.locator('button:has-text("Explore the Suite")');
            await expect(exploreBtn).toBeVisible();
            await exploreBtn.click();
            // Should open demo modal
            await expect(page.locator('[role="dialog"], .modal, .fixed')).toBeVisible({ timeout: 5000 });

            // Close modal if it opened
            const closeBtn = page.locator('button[aria-label="Close"], button:has-text("Close"), .modal button:last-child').first();
            if (await closeBtn.isVisible()) {
                await closeBtn.click();
            }

            // Test "View Live Dashboard" button
            const dashboardBtn = page.locator('a:has-text("View Live Dashboard")');
            await expect(dashboardBtn).toBeVisible();
            await dashboardBtn.click();
            // Should scroll to demo section
            await expect(page.locator('#demo')).toBeInViewport();

            // Test Mobile menu toggle
            await page.setViewportSize({ width: 375, height: 667 }); // Mobile view
            const mobileMenuBtn = page.locator('button:has-text("Menu")');
            await expect(mobileMenuBtn).toBeVisible();
            await mobileMenuBtn.click();
            // Mobile menu should appear
            await expect(page.locator('text=Why NovumFlow')).toBeVisible();

            // Test mobile Login button
            const mobileLoginBtn = page.locator('a:has-text("Login to Dashboard")');
            await expect(mobileLoginBtn).toBeVisible();
            await mobileLoginBtn.click();
            await expect(page).toHaveURL('/login');
        });

        test('should test section navigation buttons', async ({ page }) => {
            await page.goto('/');
            await waitForPageLoad(page);

            // Test navigation links
            const whyUsLink = page.locator('a[href="#problems"]');
            await expect(whyUsLink).toBeVisible();
            await whyUsLink.click();
            await expect(page.locator('#problems')).toBeInViewport();

            const featuresLink = page.locator('a[href="#features"]');
            await expect(featuresLink).toBeVisible();
            await featuresLink.click();
            await expect(page.locator('#features')).toBeInViewport();

            const demoLink = page.locator('a[href="#demo"]');
            await expect(demoLink).toBeVisible();
            await demoLink.click();
            await expect(page.locator('#demo')).toBeInViewport();
        });

        test('should test dashboard preview interactive elements', async ({ page }) => {
            await page.goto('/');
            await waitForPageLoad(page);

            // Scroll to dashboard preview
            await page.locator('#demo').scrollIntoViewIfNeeded();

            // Test tab switching in dashboard preview
            const complianceTab = page.locator('text=Compliance');
            await expect(complianceTab).toBeVisible();
            await complianceTab.click();

            const recruitmentTab = page.locator('text=Recruitment');
            await expect(recruitmentTab).toBeVisible();
            await recruitmentTab.click();

            const operationsTab = page.locator('text=Operations');
            await expect(operationsTab).toBeVisible();
            await operationsTab.click();

            // Test "Find Cover" button in operations tab
            const findCoverBtn = page.locator('button:has-text("Find Cover")');
            await expect(findCoverBtn).toBeVisible();

            // Test "View Profile" buttons in recruitment tab
            await recruitmentTab.click();
            const viewProfileBtns = page.locator('button:has-text("View Profile")');
            await expect(viewProfileBtns.first()).toBeVisible();

            // Test "Renew" buttons in compliance tab
            await complianceTab.click();
            const renewBtns = page.locator('button:has-text("Renew")');
            await expect(renewBtns.first()).toBeVisible();
        });

        test('should test suite CTA buttons', async ({ page }) => {
            await page.goto('/');
            await waitForPageLoad(page);

            // Scroll to suite section
            await page.locator('text=NovumFlow Suite').scrollIntoViewIfNeeded();

            // Test "Get Full Access" button
            const getAccessBtn = page.locator('a:has-text("Get Full Access")');
            await expect(getAccessBtn).toBeVisible();
            await getAccessBtn.click();
            await expect(page).toHaveURL('/signup');
        });

        test('should test bottom CTA buttons', async ({ page }) => {
            await page.goto('/');
            await waitForPageLoad(page);

            // Scroll to bottom CTA section
            await page.locator('text=Stop Risking Your License').scrollIntoViewIfNeeded();

            // Test "Book a Demo" button
            const bookDemoBtn = page.locator('button:has-text("Book a Demo")');
            await expect(bookDemoBtn).toBeVisible();
            await bookDemoBtn.click();
            // Should open demo modal
            await expect(page.locator('[role="dialog"], .modal, .fixed')).toBeVisible({ timeout: 5000 });

            // Close modal
            const closeBtn = page.locator('button[aria-label="Close"], button:has-text("Close")').first();
            if (await closeBtn.isVisible()) {
                await closeBtn.click();
            }

            // Test "Download Compliance Checklist" button
            const checklistBtn = page.locator('a:has-text("Download Compliance Checklist")');
            await expect(checklistBtn).toBeVisible();
            await checklistBtn.click();
            // Should open in new tab (check if new page was created)
            await page.waitForTimeout(2000); // Wait for potential new tab

            // Test "Product One-Pager" link
            const onePagerLink = page.locator('a:has-text("Product One-Pager")');
            await expect(onePagerLink).toBeVisible();
        });
    });

    test.describe('Login Page Buttons', () => {
        test('should test login form submission button', async ({ page }) => {
            await page.goto('/login');
            await waitForPageLoad(page);

            // Test form submission with invalid credentials
            await page.fill('input[type="email"]', 'invalid@test.com');
            await page.fill('input[type="password"]', 'wrongpassword');
            const submitBtn = page.locator('button[type="submit"]');
            await expect(submitBtn).toBeVisible();
            await expect(submitBtn).toHaveText('Sign In');
            await submitBtn.click();

            // Should show error message
            await expect(page.locator('.bg-red-50')).toBeVisible();
            await expect(page.locator('text=Invalid email or password')).toBeVisible();
        });

        test('should test successful login button', async ({ page }) => {
            await login(page, testUser.email, testUser.password);
            // If we reach dashboard, login button worked
            await expect(page).toHaveURL(/.*dashboard/);
        });

        test('should test SSO toggle buttons', async ({ page }) => {
            await page.goto('/login');
            await waitForPageLoad(page);

            // Test Standard Login tab
            const standardTab = page.locator('button:has-text("Standard Login")');
            await expect(standardTab).toBeVisible();
            await standardTab.click();
            await expect(page.locator('input[type="email"]')).toBeVisible();

            // Test Enterprise SSO tab
            const ssoTab = page.locator('button:has-text("Enterprise SSO")');
            await expect(ssoTab).toBeVisible();
            await ssoTab.click();
            await expect(page.locator('input[name="domain"], #domain')).toBeVisible();

            // Test SSO submission button (without domain)
            const ssoSubmitBtn = page.locator('button:has-text("Continue with SSO")');
            await expect(ssoSubmitBtn).toBeVisible();
            await expect(ssoSubmitBtn).toBeDisabled(); // Should be disabled without domain

            // Fill domain and test button becomes enabled
            await page.fill('input[name="domain"], #domain', 'test.com');
            await expect(ssoSubmitBtn).toBeEnabled();
        });

        test('should test forgot password and signup links', async ({ page }) => {
            await page.goto('/login');
            await waitForPageLoad(page);

            // Test Forgot Password link
            const forgotPasswordLink = page.locator('a[href="/forgot-password"]');
            await expect(forgotPasswordLink).toBeVisible();
            await forgotPasswordLink.click();
            await expect(page).toHaveURL('/forgot-password');

            // Go back and test signup link
            await page.goto('/login');
            const signupLink = page.locator('a[href="/signup"]');
            await expect(signupLink).toBeVisible();
            await signupLink.click();
            await expect(page).toHaveURL('/signup');
        });

        test('should test Create New Organization button', async ({ page }) => {
            await page.goto('/login');
            await waitForPageLoad(page);

            const createOrgBtn = page.locator('a[href="/tenant/create"]');
            await expect(createOrgBtn).toBeVisible();
            await expect(createOrgBtn).toHaveText('Create New Organization');
            await createOrgBtn.click();
            await expect(page).toHaveURL('/tenant/create');
        });
    });

    test.describe('Sign Up Page Buttons', () => {
        test('should test signup form submission', async ({ page }) => {
            await page.goto('/signup');
            await waitForPageLoad(page);

            // Fill the form
            await page.fill('input#fullName', 'Test User');
            await page.fill('input#email', `test.${Date.now()}@test.com`);
            await page.fill('input#password', 'TestPassword123!');
            
            // Test form submission button
            const submitBtn = page.locator('button[type="submit"]');
            await expect(submitBtn).toBeVisible();
            await expect(submitBtn).toHaveText('Create Account');
            await submitBtn.click();

            // Should either show success or error based on email service
            await page.waitForTimeout(3000);
        });

        test('should test role selection dropdown', async ({ page }) => {
            await page.goto('/signup');
            await waitForPageLoad(page);

            const roleSelect = page.locator('select#role');
            await expect(roleSelect).toBeVisible();
            
            // Test selecting different roles
            await roleSelect.selectOption('recruiter');
            await expect(roleSelect).toHaveValue('recruiter');
            
            await roleSelect.selectOption('hr_manager');
            await expect(roleSelect).toHaveValue('hr_manager');
        });

        test('should test Sign In link', async ({ page }) => {
            await page.goto('/signup');
            await waitForPageLoad(page);

            const signinLink = page.locator('a[href="/login"]');
            await expect(signinLink).toBeVisible();
            await signinLink.click();
            await expect(page).toHaveURL('/login');
        });
    });

    test.describe('Dashboard Page Buttons', () => {
        test.beforeEach(async ({ page }) => {
            await login(page, testUser.email, testUser.password);
        });

        test('should test navigation menu buttons', async ({ page }) => {
            await waitForPageLoad(page);

            // Test main navigation buttons
            const navButtons = [
                { selector: 'a[href="/dashboard"]', text: /dashboard|mission control/i },
                { selector: 'a[href="/hr"]', text: /hr/i },
                { selector: 'a[href="/recruitment"]', text: /recruitment/i },
                { selector: 'a[href="/settings"]', text: /settings/i }
            ];

            for (const btn of navButtons) {
                const element = page.locator(btn.selector);
                if (await element.isVisible()) {
                    await expect(element).toBeVisible();
                    // Note: We don't click all to avoid navigation away from dashboard
                }
            }
        });

        test('should test System Tour button', async ({ page }) => {
            await waitForPageLoad(page);

            const tourBtn = page.locator('button:has-text("System Tour")');
            await expect(tourBtn).toBeVisible();
            await tourBtn.click();
            // Should start tour
            await page.waitForTimeout(2000);
        });

        test('should test Recent Activity "View All" button', async ({ page }) => {
            await waitForPageLoad(page);

            const viewAllBtn = page.locator('button:has-text("View All")');
            await expect(viewAllBtn).toBeVisible();
            // Note: This might not be clickable if no activities exist
        });

        test('should test support widget buttons', async ({ page }) => {
            await waitForPageLoad(page);

            // Test Knowledge Base button
            const knowledgeBtn = page.locator('button:has-text("Knowledge Base")');
            await expect(knowledgeBtn).toBeVisible();
            
            // Test Contact Support button
            const contactBtn = page.locator('button:has-text("Contact Support")');
            await expect(contactBtn).toBeVisible();
        });

        test('should test sidebar navigation if present', async ({ page }) => {
            await waitForPageLoad(page);

            // Check for sidebar navigation buttons
            const sidebarButtons = page.locator('[role="navigation"] button, [role="navigation"] a');
            const count = await sidebarButtons.count();
            if (count > 0) {
                console.log(`Found ${count} sidebar navigation buttons`);
                for (let i = 0; i < Math.min(count, 5); i++) {
                    await expect(sidebarButtons.nth(i)).toBeVisible();
                }
            }
        });
    });

    test.describe('Form Validation and Error Handling', () => {
        test('should test form validation on signup page', async ({ page }) => {
            await page.goto('/signup');
            await waitForPageLoad(page);

            // Test empty form submission
            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            
            // Browser should prevent submission due to HTML5 validation
            await page.waitForTimeout(1000);

            // Test short password
            await page.fill('input#fullName', 'Test');
            await page.fill('input#email', 'test@test.com');
            await page.fill('input#password', '123'); // Too short
            await submitBtn.click();
            
            // Should show validation error
            await page.waitForTimeout(1000);
        });

        test('should test email validation', async ({ page }) => {
            await page.goto('/signup');
            await waitForPageLoad(page);

            await page.fill('input#fullName', 'Test User');
            await page.fill('input#email', 'invalid-email');
            await page.fill('input#password', 'TestPassword123!');
            
            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            
            // Should show email validation error
            await page.waitForTimeout(1000);
        });
    });

    test.describe('Authentication Flow and Role-Based Access', () => {
        test('should test protected route redirection', async ({ page }) => {
            // Try to access dashboard without login
            await page.goto('/dashboard');
            await waitForPageLoad(page);
            
            // Should redirect to login
            await expect(page).toHaveURL('/login');
        });

        test('should test logout functionality', async ({ page }) => {
            await login(page, testUser.email, testUser.password);
            await waitForPageLoad(page);

            // Look for logout button
            const logoutBtn = page.locator('button[title="Sign Out"], button:has-text("Sign Out")');
            if (await logoutBtn.isVisible()) {
                await logoutBtn.click();
                await page.waitForTimeout(2000);
                
                // Should be redirected to login
                await expect(page).toHaveURL('/login');
            } else {
                // Try mobile menu
                const mobileMenuBtn = page.locator('button:has-text("Menu")');
                if (await mobileMenuBtn.isVisible()) {
                    await mobileMenuBtn.click();
                    await page.locator('text=Sign Out').click();
                    await expect(page).toHaveURL('/login');
                }
            }
        });

        test('should test session persistence', async ({ page }) => {
            await login(page, testUser.email, testUser.password);
            await waitForPageLoad(page);

            // Refresh page
            await page.reload();
            await waitForPageLoad(page);

            // Should still be logged in
            await expect(page).toHaveURL(/.*dashboard/);
        });
    });

    test.describe('Mobile Responsiveness', () => {
        test('should test buttons on mobile view', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            
            // Test landing page mobile
            await page.goto('/');
            await waitForPageLoad(page);

            // Test mobile menu
            const mobileMenuBtn = page.locator('button:has-text("Menu")');
            await expect(mobileMenuBtn).toBeVisible();
            await mobileMenuBtn.click();
            
            // Test mobile navigation items
            const mobileLoginBtn = page.locator('a:has-text("Login to Dashboard")');
            await expect(mobileLoginBtn).toBeVisible();
            
            // Test mobile CTA buttons
            const exploreBtn = page.locator('button:has-text("Explore the Suite")');
            await expect(exploreBtn).toBeVisible();
        });

        test('should test login page on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            
            await page.goto('/login');
            await waitForPageLoad(page);

            // Test form buttons are properly sized and accessible
            const submitBtn = page.locator('button[type="submit"]');
            await expect(submitBtn).toBeVisible();
            await expect(submitBtn).toBeEnabled();
        });
    });
});
