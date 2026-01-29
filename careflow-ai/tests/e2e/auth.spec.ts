import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Use test user credentials (should be set up in test environment)
    await page.fill('input[type="email"]', 'test@careflow.ai');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should handle logout correctly', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'test@careflow.ai');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sign Out');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });
});