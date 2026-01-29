import { test, expect } from '@playwright/test';

test.describe('Shift Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.careflow.ai');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should display shift calendar', async ({ page }) => {
    await page.goto('/rostering');
    
    // Wait for calendar to load
    await expect(page.locator('[data-testid="shift-calendar"]')).toBeVisible();
    
    // Check that shifts are displayed
    await expect(page.locator('[data-testid="shift-item"]')).toHaveCount(1);
  });

  test('should create new shift', async ({ page }) => {
    await page.goto('/rostering');
    
    // Click create shift button
    await page.click('[data-testid="create-shift-btn"]');
    
    // Fill shift details
    await page.selectOption('[data-testid="client-select"]', 'Test Client');
    await page.selectOption('[data-testid="staff-select"]', 'Test Carer');
    await page.fill('[data-testid="date-input"]', '2024-01-28');
    await page.fill('[data-testid="start-time"]', '09:00');
    await page.fill('[data-testid="end-time"]', '17:00');
    await page.selectOption('[data-testid="visit-type"]', 'Home Visit');
    
    // Save shift
    await page.click('[data-testid="save-shift"]');
    
    // Verify success message
    await expect(page.locator('text=Shift created successfully')).toBeVisible();
    
    // Verify shift appears in calendar
    await expect(page.locator('[data-testid="shift-item"]')).toContainText('Test Client');
  });

  test('should assign staff to unassigned shift', async ({ page }) => {
    await page.goto('/rostering');
    
    // Find unassigned shift
    await page.click('[data-testid="unassigned-shifts-tab"]');
    
    // Click assign button
    await page.click('[data-testid="assign-btn"]:first-child');
    
    // Select staff member
    await page.selectOption('[data-testid="staff-select"]', 'Test Carer');
    
    // Confirm assignment
    await page.click('[data-testid="confirm-assign"]');
    
    // Verify success message
    await expect(page.locator('text=Staff assigned successfully')).toBeVisible();
    
    // Verify shift is no longer in unassigned tab
    await expect(page.locator('[data-testid="unassigned-shift"]')).toHaveCount(0);
  });

  test('should edit shift details', async ({ page }) => {
    await page.goto('/rostering');
    
    // Click on existing shift
    await page.click('[data-testid="shift-item"]:first-child');
    
    // Edit shift time
    await page.fill('[data-testid="start-time"]', '10:00');
    await page.fill('[data-testid="end-time"]', '18:00');
    
    // Save changes
    await page.click('[data-testid="update-shift"]');
    
    // Verify success message
    await expect(page.locator('text=Shift updated successfully')).toBeVisible();
    
    // Verify updated time is displayed
    await expect(page.locator('[data-testid="shift-item"]:first-child')).toContainText('10:00 - 18:00');
  });

  test('should handle shift conflicts', async ({ page }) => {
    await page.goto('/rostering');
    
    // Create conflicting shift for same staff
    await page.click('[data-testid="create-shift-btn"]');
    await page.selectOption('[data-testid="staff-select"]', 'Test Carer');
    await page.fill('[data-testid="date-input"]', '2024-01-28');
    await page.fill('[data-testid="start-time"]', '09:00');
    await page.fill('[data-testid="end-time"]', '17:00');
    
    // Try to save
    await page.click('[data-testid="save-shift"]');
    
    // Should show conflict warning
    await expect(page.locator('text=Staff already has a shift during this time')).toBeVisible();
  });
});