import { test, expect, type Page } from '@playwright/test';
import { describe, it, beforeEach, afterEach, vi } from 'vitest';

// Mock browser APIs for testing environment
const mockMatchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

declare global {
  var page: Page;
}

describe('CareFlow AI Core Functionality', () => {
  beforeEach(async () => {
    // Setup test environment
    await page.goto('http://localhost:5173');
  });

  afterEach(async () => {
    // Cleanup after each test
    await page.context().clearCookies();
  });

  describe('Authentication Flow', () => {
    test('should show login page', async () => {
      await expect(page).toHaveTitle(/CareFlow AI/i);
      await expect(page.locator('form')).toBeVisible();
    });

    test('should validate email input', async () => {
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      
      await emailInput.fill('invalid-email');
      await page.locator('button[type="submit"]').click();
      
      // Should show validation error
      await expect(page.locator('text=Invalid email format')).toBeVisible();
    });

    test('should redirect after successful login', async () => {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/);
    });
  });

  describe('Dashboard Functionality', () => {
    test('should display main dashboard elements', async () => {
      // Mock authentication
      await page.goto('http://localhost:5173/dashboard');
      
      await expect(page.locator('h1')).toContainText('Dashboard');
      await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
    });

    test('should display navigation menu', async () => {
      await page.goto('http://localhost:5173/dashboard');
      
      const navItems = page.locator('[data-testid="navigation"]');
      await expect(navItems).toBeVisible();
      await expect(navItems.locator('text=People')).toBeVisible();
      await expect(navItems.locator('text=Schedule')).toBeVisible();
      await expect(navItems.locator('text=Care Plans')).toBeVisible();
    });
  });

  describe('Responsive Design', () => {
    test('should be mobile responsive', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('http://localhost:5173/dashboard');
      
      // Mobile navigation should be different
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    });

    test('should be desktop responsive', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
      await page.goto('http://localhost:5173/dashboard');
      
      // Desktop navigation should be full sidebar
      await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
    });
  });

  describe('Performance', () => {
    test('should load within performance budget', async () => {
      const startTime = Date.now();
      await page.goto('http://localhost:5173');
      
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second budget
    });

    test('should not have memory leaks', async () => {
      await page.goto('http://localhost:5173/dashboard');
      
      // Check for memory leak warnings in console
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        if (msg.text().includes('memory leak')) {
          consoleMessages.push(msg.text());
        }
      });
      
      // Navigate through several pages
      await page.click('[data-testid="nav-people"]');
      await page.click('[data-testid="nav-schedule"]');
      await page.click('[data-testid="nav-care-plans"]');
      
      expect(consoleMessages.length).toBe(0);
    });
  });

  describe('Accessibility', () => {
    test('should meet WCAG 2.1 AA standards', async () => {
      await page.goto('http://localhost:5173/dashboard');
      
      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible();
      
      // Check for keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Check for ARIA labels
      const button = page.locator('button').first();
      await expect(button).toHaveAttribute('aria-label');
      
      // Check for alt text on images
      const images = page.locator('img');
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toHaveAttribute('alt');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('http://localhost:5173/dashboard');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('text=Unable to load data')).toBeVisible();
    });

    test('should show 404 page for unknown routes', async () => {
      await page.goto('http://localhost:5173/unknown-route');
      
      await expect(page.locator('h1')).toContainText('Page Not Found');
      await expect(page.locator('text=Return to dashboard')).toBeVisible();
    });
  });
});