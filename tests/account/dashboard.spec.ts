import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { AccountDashboardPage } from '../../page-objects/account/AccountDashboardPage';
import { getAccountUser } from '../../fixtures/defaultFixtures';

/**
 * Account Dashboard E2E Tests
 *
 * Tests for account dashboard page functionality with seeded test users
 *
 * Requirements covered:
 * - 12.3: Account dashboard page object
 * - User dashboard displays user information
 * - Quick actions navigation works correctly
 * - Account information section displays user details
 */
test.describe('Account Dashboard', () => {
  let loginPage: LoginPage;
  let dashboardPage: AccountDashboardPage;
  const testUser = getAccountUser('accountDashboard');

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new AccountDashboardPage(page);

    // Login first since account pages require authentication
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForLoginComplete();

    // Navigate to account dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForPage();
  });

  test('should load dashboard with user info displayed', async () => {
    // Verify dashboard page is displayed
    await dashboardPage.assertDashboardDisplayed();

    // Verify account info section is visible
    await dashboardPage.assertAccountInfoDisplayed();
  });

  test('should display welcome message containing user first name', async () => {
    // Verify welcome message is displayed
    await dashboardPage.assertWelcomeMessageDisplayed();

    // Verify welcome message contains user's first name
    await dashboardPage.assertWelcomeMessageContains(testUser.firstName);
  });

  test('should display quick actions section with all buttons', async () => {
    // Verify quick actions section is displayed with all buttons
    await dashboardPage.assertQuickActionsDisplayed();

    // Verify individual buttons are visible
    await expect(dashboardPage.continueShoppingButton).toBeVisible();
    await expect(dashboardPage.trackOrdersButton).toBeVisible();
    await expect(dashboardPage.updateNotificationsButton).toBeVisible();
  });

  test('should display account information section with user details', async () => {
    // Verify account info section is displayed
    await dashboardPage.assertAccountInfoDisplayed();

    // Verify user info is displayed correctly
    const userInfo = await dashboardPage.getUserInfo();
    expect(userInfo.firstName).toBe(testUser.firstName);
    expect(userInfo.lastName).toBe(testUser.lastName);
    expect(userInfo.email).toBe(testUser.email);
  });

  test('should navigate to profile page when clicking edit profile', async ({ page }) => {
    // Navigate to profile section
    await dashboardPage.navigateToSection('profile');

    // Verify navigation to profile page
    await expect(page).toHaveURL(/\/account\/profile/);
  });

  test('should navigate to addresses page when clicking manage addresses', async ({ page }) => {
    // Navigate to addresses section
    await dashboardPage.navigateToSection('addresses');

    // Verify navigation to addresses page
    await expect(page).toHaveURL(/\/account\/addresses/);
  });

  test('should navigate to orders page when clicking view all orders', async ({ page }) => {
    // Navigate to orders section
    await dashboardPage.navigateToSection('orders');

    // Verify navigation to orders page
    await expect(page).toHaveURL(/\/account\/orders/);
  });

  test('should navigate to shop when clicking continue shopping button', async ({ page }) => {
    // Click continue shopping button
    await dashboardPage.clickContinueShopping();

    // Verify navigation to shop page
    await expect(page).toHaveURL(/\/shop/);
  });
});
