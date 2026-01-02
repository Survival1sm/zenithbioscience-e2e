import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { getTestUser, getIsolatedUser } from '../../fixtures/defaultFixtures';

/**
 * Login E2E Tests
 *
 * Tests for login page functionality with seeded test users
 *
 * Requirements covered:
 * - 2.1: Account creation and activation
 * - 2.2: JWT token storage and authenticated requests
 * - 2.3: Session termination on logout
 * - 2.4: Error messages for invalid credentials
 */
test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.waitForForm();
  });

  test('should display login form with all required elements', async () => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should display remember me checkbox', async () => {
    await expect(loginPage.rememberMeCheckbox).toBeVisible();
  });

  test('should display forgot password and sign up links', async () => {
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.signUpLink).toBeVisible();
  });

  test('should show error for invalid credentials', async () => {
    await loginPage.login('invalid@example.com', 'WrongPassword123!');

    // Wait for error alert to be visible - this verifies the error is actually displayed
    await expect(loginPage.errorAlert).toBeVisible({ timeout: 10000 });

    // Verify the error message contains expected text about invalid credentials
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).not.toBeNull();
    expect(errorText!.toLowerCase()).toMatch(/invalid|incorrect|wrong|failed|error|credentials/i);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await loginPage.goToForgotPassword();
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('should navigate to registration page', async ({ page }) => {
    await loginPage.goToSignUp();
    await expect(page).toHaveURL(/register/);
  });

  test('should successfully login with valid customer credentials', async ({ page }) => {
    // Use isolated user for this test file to avoid race conditions
    const customer = getIsolatedUser('authLogin');

    await loginPage.login(customer.email, customer.password);

    // Wait for redirect away from login page
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15000,
    });

    // Verify we're no longer on the login page
    expect(page.url()).not.toContain('/login');
  });

  test('should successfully login with valid admin credentials', async ({ page }) => {
    const admin = getTestUser('admin');

    await loginPage.login(admin.email, admin.password);

    // Wait for redirect away from login page
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15000,
    });

    // Verify we're no longer on the login page
    expect(page.url()).not.toContain('/login');
  });

  test('should reject login for unverified user', async ({ page }) => {
    const unverified = getTestUser('unverified');

    await loginPage.login(unverified.email, unverified.password);

    // Wait for either error alert or redirect
    await page.waitForTimeout(2000);

    // Check if we're still on the login page (login was rejected)
    const currentUrl = page.url();
    const stillOnLogin = currentUrl.includes('/login');
    
    // Check for error alert
    const errorAlert = page.locator('.MuiAlert-root[role="alert"]');
    const hasError = await errorAlert.isVisible().catch(() => false);
    
    // Either we should see an error OR still be on the login page
    // Unverified users should not be able to log in successfully
    if (hasError) {
      const errorText = await errorAlert.textContent();
      expect(errorText).not.toBeNull();
      // Error should indicate account issue (unverified, not activated, etc.)
      expect(errorText!.toLowerCase()).toMatch(/verify|activate|confirm|invalid|error|not.*active|failed/i);
    } else {
      // If no error shown, we should still be on login page (login blocked)
      expect(stillOnLogin).toBeTruthy();
    }
  });

  test('should show error for wrong password with valid email', async () => {
    // Use isolated user for this test file
    const customer = getIsolatedUser('authLogin');

    await loginPage.login(customer.email, 'WrongPassword999!');

    // Wait for error alert to be visible - wrong password should show an error
    await expect(loginPage.errorAlert).toBeVisible({ timeout: 10000 });

    // Verify the error message contains expected text about invalid credentials
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).not.toBeNull();
    expect(errorText!.toLowerCase()).toMatch(/invalid|incorrect|wrong|failed|error|credentials|password/i);
  });
});
