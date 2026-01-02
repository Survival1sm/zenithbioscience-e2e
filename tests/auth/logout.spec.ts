import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { getIsolatedUser } from '../../fixtures/defaultFixtures';

/**
 * Logout E2E Tests
 *
 * Tests for logout functionality with authenticated sessions
 *
 * Requirements covered:
 * - 2.3: Session termination on logout
 */
test.describe('Logout Functionality', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // Login first to set up authenticated session
    // Use isolated user for this test file to avoid race conditions
    const customer = getIsolatedUser('authLogout');
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(customer.email, customer.password);

    // Wait for login to complete
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15000,
    });
  });

  test('should successfully logout from user menu', async ({ page }) => {
    // Navigate to account page where logout is accessible
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    // Look for logout button or link
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    const logoutLink = page.getByRole('link', { name: /logout|sign out/i });

    // Click whichever logout element is visible
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else if (await logoutLink.isVisible()) {
      await logoutLink.click();
    } else {
      // Try looking in a menu
      const accountMenu = page.getByRole('button', { name: /account|profile|menu/i });
      if (await accountMenu.isVisible()) {
        await accountMenu.click();
        await page.waitForTimeout(500);
        const menuLogout = page.getByRole('menuitem', { name: /logout|sign out/i });
        if (await menuLogout.isVisible()) {
          await menuLogout.click();
        }
      }
    }

    // Wait for redirect after logout
    await page.waitForTimeout(2000);

    // Verify we're logged out - should be on home or login page
    const currentUrl = page.url();
    const isLoggedOut =
      currentUrl.includes('/login') ||
      currentUrl === '/' ||
      currentUrl.endsWith(':3000/') ||
      currentUrl.endsWith(':3000');

    expect(isLoggedOut).toBeTruthy();
  });

  test('should redirect to home or login page after logout', async ({ page }) => {
    // Navigate to account page
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    // Find and click logout
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    const logoutLink = page.getByRole('link', { name: /logout|sign out/i });

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else if (await logoutLink.isVisible()) {
      await logoutLink.click();
    }

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Should be redirected to home or login
    const currentUrl = page.url();
    expect(currentUrl.includes('/login') || !currentUrl.includes('/account')).toBeTruthy();
  });

  test('should not be able to access protected pages after logout', async ({ page }) => {
    // First logout
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    const logoutLink = page.getByRole('link', { name: /logout|sign out/i });

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else if (await logoutLink.isVisible()) {
      await logoutLink.click();
    }

    await page.waitForTimeout(2000);

    // Try to access protected account page
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    // Should be redirected to login
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl.includes('/login') || currentUrl.includes('/auth')).toBeTruthy();
  });

  test('should clear session data after logout', async ({ page, context }) => {
    // Get cookies before logout
    const cookiesBefore = await context.cookies();
    const hasAuthCookieBefore = cookiesBefore.some(
      (c) => c.name.includes('token') || c.name.includes('session') || c.name.includes('auth')
    );

    // Logout
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    const logoutLink = page.getByRole('link', { name: /logout|sign out/i });

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else if (await logoutLink.isVisible()) {
      await logoutLink.click();
    }

    await page.waitForTimeout(2000);

    // Check localStorage is cleared
    const authToken = await page.evaluate(() => {
      return (
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('jhi-authenticationToken')
      );
    });

    // Auth token should be cleared after logout
    expect(authToken).toBeFalsy();
  });
});
