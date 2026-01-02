import { test, expect } from '@playwright/test';

/**
 * Smoke test to verify E2E infrastructure is working
 * This test navigates to the homepage and verifies basic page load
 */
test.describe('Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load - use domcontentloaded instead of networkidle
    // networkidle can timeout if there are persistent connections (websockets, polling, etc.)
    await page.waitForLoadState('domcontentloaded');
    
    // Verify the page loaded successfully
    expect(page.url()).toContain('localhost:3000');
    
    // Check that the page has content by verifying a visible element exists
    // Using a more reliable check than body visibility (WebKit on Windows reports body as hidden)
    const hasContent = await page.locator('body').evaluate(el => el.innerHTML.length > 0);
    expect(hasContent).toBeTruthy();
  });

  test('should have a valid page title', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Verify the page has a title
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
