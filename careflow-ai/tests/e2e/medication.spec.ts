import { test, expect } from '@playwright/test';

test.describe('Medication Administration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as care worker
    await page.goto('/login');
    await page.fill('input[type="email"]', 'carer@test.careflow.ai');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should display medication list for client', async ({ page }) => {
    await page.goto('/medication');
    
    // Wait for medication list to load
    await expect(page.locator('[data-testid="medication-list"]')).toBeVisible();
    
    // Check that medications are displayed
    await expect(page.locator('[data-testid="medication-item"]')).toHaveCount(1);
  });

  test('should administer medication successfully', async ({ page }) => {
    await page.goto('/medication');
    
    // Select a client
    await page.click('[data-testid="client-select"]');
    await page.click('text=Test Client');
    
    // Wait for medications to load
    await expect(page.locator('[data-testid="medication-item"]')).toBeVisible();
    
    // Click administer button for first medication
    await page.click('[data-testid="administer-btn"]:first-child');
    
    // Fill administration form
    await page.selectOption('[data-testid="status-select"]', 'Given');
    await page.fill('[data-testid="notes-input"]', 'Medication given as prescribed');
    
    // Submit
    await page.click('[data-testid="submit-administration"]');
    
    // Verify success message
    await expect(page.locator('text=Medication administered successfully')).toBeVisible();
    
    // Verify MAR record is updated
    await expect(page.locator('[data-testid="mar-record"]')).toContainText('Given');
  });

  test('should handle refused medication', async ({ page }) => {
    await page.goto('/medication');
    
    // Select a client
    await page.click('[data-testid="client-select"]');
    await page.click('text=Test Client');
    
    // Click administer button
    await page.click('[data-testid="administer-btn"]:first-child');
    
    // Select refused status
    await page.selectOption('[data-testid="status-select"]', 'Refused');
    await page.fill('[data-testid="notes-input"]', 'Patient refused medication');
    
    // Submit
    await page.click('[data-testid="submit-administration"]');
    
    // Verify refusal is recorded
    await expect(page.locator('[data-testid="mar-record"]')).toContainText('Refused');
  });

  test('should validate mandatory fields', async ({ page }) => {
    await page.goto('/medication');
    
    // Select a client
    await page.click('[data-testid="client-select"]');
    await page.click('text=Test Client');
    
    // Try to submit without selecting status
    await page.click('[data-testid="administer-btn"]:first-child');
    await page.click('[data-testid="submit-administration"]');
    
    // Should show validation error
    await expect(page.locator('text=Status is required')).toBeVisible();
  });

  test('should filter medications by time slot', async ({ page }) => {
    await page.goto('/medication');
    
    // Select a client
    await page.click('[data-testid="client-select"]');
    await page.click('text=Test Client');
    
    // Filter by morning time slot
    await page.click('[data-testid="time-slot-filter"]');
    await page.click('text=Morning');
    
    // Verify only morning medications are shown
    const medications = page.locator('[data-testid="medication-item"]');
    await expect(medications).toHaveCount(1);
    
    // Verify time slot is displayed correctly
    await expect(page.locator('text=Morning')).toBeVisible();
  });
});