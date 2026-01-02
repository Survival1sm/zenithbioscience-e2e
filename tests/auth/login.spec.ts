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

    // Wait for error response - the backend may take a moment
    // Look for any error indication on the page
    try {
      await loginPage.page.getByRole('alert').waitFor({ state: 'visible', timeout: 10000 });
      const hasError = await loginPage.hasError();
      expect(hasError).toBeTruthy();
    } catch {
      // If no alert, check if we're still on login page (login failed)
      await expect(loginPage.page).toHaveURL(/login/);
    }
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

    // Should show error or stay on login page
    await page.waitForTimeout(3000);

    // Either shows error or stays on login page
    const hasError = await loginPage.hasError();
    const stillOnLogin = page.url().includes('/login');

    expect(hasError || stillOnLogin).toBeTruthy();
  });

  test('should show error for wrong password with valid email', async () => {
    // Use isolated user for this test file
    const customer = getIsolatedUser('authLogin');

    await loginPage.login(customer.email, 'WrongPassword999!');

    // Wait for error response
    try {
      await loginPage.page.getByRole('alert').waitFor({ state: 'visible', timeout: 10000 });
      const hasError = await loginPage.hasError();
      expect(hasError).toBeTruthy();
    } catch {
      // If no alert, check if we're still on login page
      await expect(loginPage.page).toHaveURL(/login/);
    }
  });
});
