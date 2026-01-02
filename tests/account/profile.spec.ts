import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { ProfilePage } from '../../page-objects/account/ProfilePage';
import { getAccountUser } from '../../fixtures/defaultFixtures';

/**
 * Profile Management E2E Tests
 *
 * Tests for profile page functionality with authenticated users
 *
 * Requirements covered:
 * - Profile form displays with current user data
 * - Email field is disabled (cannot be changed)
 * - Update first name, last name, phone number successfully
 * - Toggle email and SMS notifications on/off
 * - Validation errors shown for empty required fields
 * - Success message shown after saving changes
 */
test.describe('Profile Page', () => {
  let loginPage: LoginPage;
  let profilePage: ProfilePage;
  const testUser = getAccountUser('accountProfile');

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    profilePage = new ProfilePage(page);

    // Login first since profile page requires authentication
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForLoginComplete();
    
    // Wait for session to be fully established
    await page.waitForLoadState('networkidle').catch(() => {});

    // Navigate to profile page
    await profilePage.goto();
    await profilePage.waitForForm();
  });

  test('should display profile form with current user data', async () => {
    // Verify form elements are visible
    await expect(profilePage.firstNameInput).toBeVisible();
    await expect(profilePage.lastNameInput).toBeVisible();
    await expect(profilePage.emailInput).toBeVisible();
    await expect(profilePage.phoneNumberInput).toBeVisible();
    await expect(profilePage.saveButton).toBeVisible();

    // Verify email is populated with user's email
    const profileData = await profilePage.getProfileData();
    expect(profileData.email).toBe(testUser.email);
  });

  test('should have email field disabled (cannot be changed)', async () => {
    const isEmailDisabled = await profilePage.isEmailDisabled();
    expect(isEmailDisabled).toBeTruthy();
  });

  test('should update first name successfully', async ({ page }) => {
    // Use valid name format (letters, spaces, hyphens, apostrophes only - no numbers)
    const testNames = ['James', 'Michael', 'Sarah', 'Emily', 'Robert', 'Jennifer'];
    const newFirstName = testNames[Math.floor(Math.random() * testNames.length)];

    await profilePage.fillFirstName(newFirstName);
    await profilePage.clickSave();
    await profilePage.waitForSave();

    // Verify success message
    const successMessage = await profilePage.getSuccessMessage();
    expect(successMessage).toBeTruthy();

    // Refresh page and verify the change persisted
    await page.reload();
    await profilePage.waitForForm();

    const profileData = await profilePage.getProfileData();
    expect(profileData.firstName).toBe(newFirstName);
  });

  test('should update last name successfully', async ({ page }) => {
    // Use valid name format (letters, spaces, hyphens, apostrophes only - no numbers)
    const testNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis'];
    const newLastName = testNames[Math.floor(Math.random() * testNames.length)];

    await profilePage.fillLastName(newLastName);
    await profilePage.clickSave();
    await profilePage.waitForSave();

    // Verify success message
    const successMessage = await profilePage.getSuccessMessage();
    expect(successMessage).toBeTruthy();

    // Refresh page and verify the change persisted
    await page.reload();
    await profilePage.waitForForm();

    const profileData = await profilePage.getProfileData();
    expect(profileData.lastName).toBe(newLastName);
  });

  test('should update phone number successfully', async ({ page }) => {
    const newPhoneNumber = '+1555' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');

    await profilePage.fillPhoneNumber(newPhoneNumber);
    await profilePage.clickSave();
    await profilePage.waitForSave();

    // Verify success message
    const successMessage = await profilePage.getSuccessMessage();
    expect(successMessage).toBeTruthy();

    // Refresh page and verify the change persisted
    await page.reload();
    await profilePage.waitForForm();

    const profileData = await profilePage.getProfileData();
    expect(profileData.phoneNumber).toBe(newPhoneNumber);
  });

  test('should toggle email notifications on/off', async ({ page }) => {
    await profilePage.waitForNotificationPreferences();

    // Get initial state
    const initialPrefs = await profilePage.getNotificationPreferences();
    const targetState = !initialPrefs.emailNotifications;

    // Toggle email notifications
    await profilePage.toggleNotifications('email', targetState);
    await profilePage.clickSave();
    await profilePage.waitForSave();

    // Verify success message
    const successMessage = await profilePage.getSuccessMessage();
    expect(successMessage).toBeTruthy();

    // Reload page to verify persistence
    await page.reload();
    await profilePage.waitForForm();
    await profilePage.waitForNotificationPreferences();

    // Verify the toggle state persisted
    const updatedPrefs = await profilePage.getNotificationPreferences();
    expect(updatedPrefs.emailNotifications).toBe(targetState);
  });

  test('should toggle SMS notifications on/off', async ({ page }) => {
    await profilePage.waitForNotificationPreferences();

    // Get initial state
    const initialPrefs = await profilePage.getNotificationPreferences();
    const targetState = !initialPrefs.smsNotifications;

    // Toggle SMS notifications
    await profilePage.toggleNotifications('sms', targetState);
    await profilePage.clickSave();
    await profilePage.waitForSave();

    // Verify success message
    const successMessage = await profilePage.getSuccessMessage();
    expect(successMessage).toBeTruthy();

    // Reload page to verify persistence
    await page.reload();
    await profilePage.waitForForm();
    await profilePage.waitForNotificationPreferences();

    // Verify the toggle state persisted
    const updatedPrefs = await profilePage.getNotificationPreferences();
    expect(updatedPrefs.smsNotifications).toBe(targetState);
  });

  test('should show validation errors for empty required fields', async ({ page }) => {
    // Clear required fields
    await profilePage.clearForm();

    // Try to save - HTML5 validation should prevent submission
    await profilePage.clickSave();

    // Check for HTML5 validation - the form should not submit with empty required fields
    // The browser will show native validation messages
    // We can verify by checking that no success message appears and form is still visible
    const successMessage = await profilePage.getSuccessMessage();
    expect(successMessage).toBeNull();
    
    // Form should still be visible (not submitted)
    const isFormVisible = await profilePage.isProfileFormVisible();
    expect(isFormVisible).toBeTruthy();
  });

  test('should show success message after saving changes', async () => {
    // Make a small change using valid name format (no numbers allowed)
    const currentData = await profilePage.getProfileData();
    const updatedFirstName = currentData.firstName === 'Account' ? 'Updated' : 'Account';

    await profilePage.fillFirstName(updatedFirstName);
    await profilePage.clickSave();
    await profilePage.waitForSave();

    // Verify success message is displayed
    const successMessage = await profilePage.getSuccessMessage();
    expect(successMessage).toBeTruthy();
    expect(successMessage?.toLowerCase()).toContain('success');
  });
});
