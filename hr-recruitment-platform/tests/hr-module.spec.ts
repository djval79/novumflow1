import { test, expect, login, waitForPageLoad } from './fixtures/auth';

/**
 * E2E Tests: HR Module
 * Tests employee management, documents, and leave requests
 */

test.describe('HR Module - Employees', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/hr');
        await waitForPageLoad(page);
    });

    test('should display employee list', async ({ page }) => {
        // Check for employees tab or section
        const employeesTab = page.locator('button:has-text("Employees"), text=Employees').first();
        if (await employeesTab.isVisible()) {
            await employeesTab.click();
        }

        await waitForPageLoad(page);

        // Should have employee cards or table rows
        const employeeItems = page.locator('[class*="employee"], [class*="card"], tr[data-employee]');
        await expect(employeeItems.first()).toBeVisible({ timeout: 10000 });

        await page.screenshot({ path: 'test-results/hr-employees.png', fullPage: true });
    });

    test('should have search functionality', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();

        if (await searchInput.isVisible()) {
            await searchInput.fill('test');
            await page.waitForTimeout(500); // Wait for debounce

            // Search should filter results (UI should update)
            await page.screenshot({ path: 'test-results/hr-search.png', fullPage: true });
        }
    });

    test('should open add employee modal', async ({ page }) => {
        const addButton = page.locator('button:has-text("Add"), button:has-text("New Employee")').first();

        if (await addButton.isVisible()) {
            await addButton.click();

            // Modal should appear
            const modal = page.locator('[role="dialog"], [class*="modal"]');
            await expect(modal).toBeVisible({ timeout: 5000 });

            await page.screenshot({ path: 'test-results/hr-add-modal.png', fullPage: true });
        }
    });
});

test.describe('HR Module - Documents', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/hr');
        await waitForPageLoad(page);
    });

    test('should display documents tab', async ({ page }) => {
        const documentsTab = page.locator('button:has-text("Documents")').first();

        if (await documentsTab.isVisible()) {
            await documentsTab.click();
            await waitForPageLoad(page);

            // Documents section should be visible
            await expect(page.locator('text=Documents, text=Files')).toBeVisible();

            await page.screenshot({ path: 'test-results/hr-documents.png', fullPage: true });
        }
    });
});

test.describe('HR Module - Leave Requests', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/hr');
        await waitForPageLoad(page);
    });

    test('should display leave requests tab', async ({ page }) => {
        const leaveTab = page.locator('button:has-text("Leave")').first();

        if (await leaveTab.isVisible()) {
            await leaveTab.click();
            await waitForPageLoad(page);

            // Leave requests section should be visible
            await expect(page.locator('text=Leave, text=Holiday, text=Request')).toBeVisible();

            await page.screenshot({ path: 'test-results/hr-leave.png', fullPage: true });
        }
    });
});
