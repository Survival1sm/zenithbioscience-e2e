import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { GdprPage } from '../../page-objects/account/GdprPage';
import { getAccountUser } from '../../fixtures/defaultFixtures';

/**
 * GDPR Data Management E2E Tests
 *
 * Tests for GDPR data privacy page functionality including data export and account deletion dialogs.
 *
 * Requirements covered:
 * - GDPR page loads with all sections
 * - Data export functionality
 * - Account deletion dialog interactions
 * - Privacy rights display
 *
 * Note: These tests do NOT actually perform account deletion as it would invalidate the test user.
 * Only dialog interactions are tested.
 */
test.describe('GDPR Data Management', () => {
  let loginPage: LoginPage;
  let gdprPage: GdprPage;
  const testUser = getAccountUser('accountGdpr');

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    gdprPage = new GdprPage(page);

    // Login first since GDPR page requires authentication
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForLoginComplete();

    // Navigate to GDPR page
    await gdprPage.goto();
    await gdprPage.waitForPageReady();
  });

  test('should display GDPR page with all sections', async () => {
    // Verify main page heading
    await expect(gdprPage.pageHeading).toBeVisible();

    // Verify all section headings are visible
    await expect(gdprPage.dataExportHeading).toBeVisible();
    await expect(gdprPage.accountDeletionHeading).toBeVisible();
    await expect(gdprPage.privacyRightsHeading).toBeVisible();
  });

  test('should display Data Export section with export button', async () => {
    // Verify Data Export section heading
    await expect(gdprPage.dataExportHeading).toBeVisible();

    // Verify export button is visible and available
    await expect(gdprPage.requestDataExportButton).toBeVisible();
    const isExportAvailable = await gdprPage.isDataExportAvailable();
    expect(isExportAvailable).toBeTruthy();
  });

  test('should display Account Deletion section with deletion button', async () => {
    // Verify Account Deletion section heading
    await expect(gdprPage.accountDeletionHeading).toBeVisible();

    // Verify deletion button is visible and available
    await expect(gdprPage.requestAccountDeletionButton).toBeVisible();
    const isDeletionAvailable = await gdprPage.isAccountDeletionAvailable();
    expect(isDeletionAvailable).toBeTruthy();
  });

  test('should display Privacy Rights section with user rights', async () => {
    // Verify Privacy Rights section heading
    await expect(gdprPage.privacyRightsHeading).toBeVisible();

    // Verify privacy rights chips are displayed
    const privacyRights = await gdprPage.getPrivacyRights();
    expect(privacyRights.length).toBeGreaterThan(0);
  });

  test('should open data export dialog when clicking export button', async () => {
    // Click the export button
    await gdprPage.requestDataExportButton.click();

    // Verify export dialog is visible
    await expect(gdprPage.exportDialog).toBeVisible();

    // Verify dialog contains expected elements
    await expect(gdprPage.exportDataButton).toBeVisible();
    await expect(gdprPage.exportCancelButton).toBeVisible();
  });

  test('should cancel data export dialog', async () => {
    // Open the export dialog
    await gdprPage.requestDataExportButton.click();
    await expect(gdprPage.exportDialog).toBeVisible();

    // Cancel the dialog
    await gdprPage.cancelExport();

    // Verify dialog is closed
    const isDialogOpen = await gdprPage.isExportDialogOpen();
    expect(isDialogOpen).toBeFalsy();
  });

  test('should open account deletion dialog when clicking deletion button', async () => {
    // Click the deletion button
    await gdprPage.requestAccountDeletionButton.click();

    // Verify deletion dialog is visible
    await expect(gdprPage.deletionDialog).toBeVisible();

    // Verify dialog contains expected elements
    await expect(gdprPage.deleteAccountButton).toBeVisible();
    await expect(gdprPage.deletionCancelButton).toBeVisible();
  });

  test('should cancel account deletion dialog', async () => {
    // Open the deletion dialog
    await gdprPage.requestAccountDeletionButton.click();
    await expect(gdprPage.deletionDialog).toBeVisible();

    // Cancel the dialog
    await gdprPage.cancelDeletion();

    // Verify dialog is closed
    const isDialogOpen = await gdprPage.isDeletionDialogOpen();
    expect(isDialogOpen).toBeFalsy();
  });

  test('should have preserve orders checkbox available in deletion dialog', async () => {
    // Open the deletion dialog
    await gdprPage.requestAccountDeletionButton.click();
    await expect(gdprPage.deletionDialog).toBeVisible();

    // Verify preserve orders checkbox is visible
    await expect(gdprPage.preserveOrdersCheckbox).toBeVisible();

    // Verify checkbox can be toggled
    const initialState = await gdprPage.isPreserveOrdersChecked();
    await gdprPage.preserveOrdersCheckbox.click();
    const newState = await gdprPage.isPreserveOrdersChecked();
    expect(newState).not.toBe(initialState);

    // Cancel the dialog to clean up
    await gdprPage.cancelDeletion();
  });
});
