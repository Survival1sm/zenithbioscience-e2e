import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Deletion result interface matching the component's DataDeletionResult
 */
export interface DeletionResult {
  deletionId: string;
  deletionDate: string;
  userId: string;
  success: boolean;
  preserveOrders: boolean;
  deletedAddresses: number;
  deletedOrders: number;
  anonymizedOrders: number;
  userProfileAnonymized: boolean;
  errorMessage?: string;
}

/**
 * GDPR Page Object
 * Handles GDPR data management interactions including data export and account deletion
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 * 
 * Note: This page uses AuthGuard, so user must be logged in to access
 */
export class GdprPage extends BasePage {
  readonly path = '/account/gdpr';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /**
   * Get the page heading
   */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Data Privacy & Rights', level: 4 });
  }

  /**
   * Get the Data Export section heading
   */
  get dataExportHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Data Export' });
  }

  /**
   * Get the Account Deletion section heading
   */
  get accountDeletionHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Account Deletion' });
  }

  /**
   * Get the Privacy Rights section heading
   */
  get privacyRightsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Your Privacy Rights' });
  }

  /**
   * Get the Request Data Export button
   */
  get requestDataExportButton(): Locator {
    return this.page.getByRole('button', { name: 'Request Data Export' });
  }

  /**
   * Get the Request Account Deletion button
   */
  get requestAccountDeletionButton(): Locator {
    return this.page.getByRole('button', { name: 'Request Account Deletion' });
  }

  /**
   * Get the data export dialog
   */
  get exportDialog(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: 'Export Your Data' });
  }

  /**
   * Get the Export Data button in the export dialog
   */
  get exportDataButton(): Locator {
    return this.exportDialog.getByRole('button', { name: /Export Data/i });
  }

  /**
   * Get the Cancel button in the export dialog
   */
  get exportCancelButton(): Locator {
    return this.exportDialog.getByRole('button', { name: 'Cancel' });
  }

  /**
   * Get the account deletion dialog
   */
  get deletionDialog(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: 'Delete Your Account' });
  }

  /**
   * Get the Preserve order records checkbox in the deletion dialog
   */
  get preserveOrdersCheckbox(): Locator {
    return this.deletionDialog.getByRole('checkbox');
  }

  /**
   * Get the Delete Account button in the deletion dialog
   */
  get deleteAccountButton(): Locator {
    return this.deletionDialog.getByRole('button', { name: /Delete Account/i });
  }

  /**
   * Get the Cancel button in the deletion dialog
   */
  get deletionCancelButton(): Locator {
    return this.deletionDialog.getByRole('button', { name: 'Cancel' });
  }

  /**
   * Get the deletion result dialog
   */
  get deletionResultDialog(): Locator {
    return this.page.getByRole('dialog').filter({ 
      hasText: /Account Deletion (Completed|Failed)/i 
    });
  }

  /**
   * Get the Close button in the deletion result dialog
   */
  get deletionResultCloseButton(): Locator {
    return this.deletionResultDialog.getByRole('button', { name: 'Close' });
  }

  /**
   * Get the privacy rights chips container
   */
  get privacyRightsChips(): Locator {
    return this.page.locator('.MuiChip-root');
  }

  /**
   * Get the success snackbar alert
   */
  get successAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /success/i });
  }

  /**
   * Get the error snackbar alert
   */
  get errorAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /failed|error/i });
  }

  /**
   * Get the loading spinner
   */
  get loadingSpinner(): Locator {
    return this.page.locator('svg[class*="MuiCircularProgress"]');
  }

  // ==================== Actions ====================

  /**
   * Request data export - clicks export button, confirms dialog, waits for download
   * @returns Promise that resolves when download is triggered
   */
  async requestDataExport(): Promise<void> {
    // Click the Request Data Export button to open dialog
    await this.requestDataExportButton.click();
    
    // Wait for dialog to be visible
    await this.exportDialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // Set up download listener before clicking
    const downloadPromise = this.page.waitForEvent('download', { timeout: 30000 });
    
    // Click Export Data button
    await this.exportDataButton.click();
    
    // Wait for download to start
    await downloadPromise;
    
    // Wait for dialog to close
    await this.exportDialog.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Request account deletion - opens dialog and sets preserve orders option
   * @param preserveOrders - Whether to preserve order records (default: true)
   */
  async requestAccountDeletion(preserveOrders: boolean = true): Promise<void> {
    // Click the Request Account Deletion button to open dialog
    await this.requestAccountDeletionButton.click();
    
    // Wait for dialog to be visible
    await this.deletionDialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // Set the preserve orders checkbox
    const isChecked = await this.preserveOrdersCheckbox.isChecked();
    if (isChecked !== preserveOrders) {
      await this.preserveOrdersCheckbox.click();
    }
  }

  /**
   * Confirm the deletion in the dialog
   * Clicks the Delete Account button to proceed with deletion
   */
  async confirmDeletion(): Promise<void> {
    // Click Delete Account button
    await this.deleteAccountButton.click();
    
    // Wait for the deletion dialog to close
    await this.deletionDialog.waitFor({ state: 'hidden', timeout: 30000 });
  }

  /**
   * Cancel the deletion dialog
   */
  async cancelDeletion(): Promise<void> {
    await this.deletionCancelButton.click();
    
    // Wait for dialog to close
    await this.deletionDialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Check if the data export button is visible and available
   * @returns True if the export button is visible
   */
  async isDataExportAvailable(): Promise<boolean> {
    try {
      return await this.requestDataExportButton.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if the account deletion button is visible and available
   * @returns True if the deletion button is visible
   */
  async isAccountDeletionAvailable(): Promise<boolean> {
    try {
      return await this.requestAccountDeletionButton.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get the list of privacy rights chips displayed
   * @returns Array of privacy rights text
   */
  async getPrivacyRights(): Promise<string[]> {
    const rights: string[] = [];
    const chips = this.privacyRightsChips;
    const count = await chips.count();
    
    for (let i = 0; i < count; i++) {
      const text = await chips.nth(i).textContent();
      if (text) {
        rights.push(text.trim());
      }
    }
    
    return rights;
  }

  /**
   * Get deletion result information after deletion completes
   * @returns Partial deletion result with available information
   */
  async getDeletionResult(): Promise<Partial<DeletionResult>> {
    // Wait for result dialog to appear
    await this.deletionResultDialog.waitFor({ state: 'visible', timeout: 10000 });
    
    const result: Partial<DeletionResult> = {};
    
    // Check if deletion was successful based on dialog title
    const dialogTitle = await this.deletionResultDialog.getByRole('heading').textContent();
    result.success = dialogTitle?.includes('Completed') ?? false;
    
    // Try to extract deletion details from the dialog content
    const dialogContent = await this.deletionResultDialog.textContent();
    
    if (dialogContent) {
      // Extract addresses deleted count
      const addressesMatch = dialogContent.match(/Addresses deleted:\s*(\d+)/i);
      if (addressesMatch) {
        result.deletedAddresses = parseInt(addressesMatch[1], 10);
      }
      
      // Extract orders deleted count
      const ordersDeletedMatch = dialogContent.match(/Orders deleted:\s*(\d+)/i);
      if (ordersDeletedMatch) {
        result.deletedOrders = parseInt(ordersDeletedMatch[1], 10);
      }
      
      // Extract orders anonymized count
      const ordersAnonymizedMatch = dialogContent.match(/Orders anonymized:\s*(\d+)/i);
      if (ordersAnonymizedMatch) {
        result.anonymizedOrders = parseInt(ordersAnonymizedMatch[1], 10);
      }
      
      // Extract profile anonymized status
      const profileMatch = dialogContent.match(/Profile anonymized:\s*(Yes|No)/i);
      if (profileMatch) {
        result.userProfileAnonymized = profileMatch[1].toLowerCase() === 'yes';
      }
      
      // Extract deletion ID
      const deletionIdMatch = dialogContent.match(/Deletion ID:\s*([a-zA-Z0-9-]+)/i);
      if (deletionIdMatch) {
        result.deletionId = deletionIdMatch[1];
      }
      
      // Check for error message
      if (!result.success) {
        const errorAlert = this.deletionResultDialog.getByRole('alert');
        if (await errorAlert.isVisible()) {
          result.errorMessage = await errorAlert.textContent() ?? undefined;
        }
      }
    }
    
    return result;
  }

  /**
   * Close the deletion result dialog
   */
  async closeDeletionResultDialog(): Promise<void> {
    await this.deletionResultCloseButton.click();
    await this.deletionResultDialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Cancel the export dialog
   */
  async cancelExport(): Promise<void> {
    await this.exportCancelButton.click();
    await this.exportDialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Wait for the GDPR page to be fully loaded
   */
  async waitForPageReady(): Promise<void> {
    // Wait for page heading to be visible
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });
    
    // Wait for main sections to be visible
    await this.dataExportHeading.waitFor({ state: 'visible', timeout: 5000 });
    await this.accountDeletionHeading.waitFor({ state: 'visible', timeout: 5000 });
    await this.privacyRightsHeading.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Check if the export dialog is open
   * @returns True if the export dialog is visible
   */
  async isExportDialogOpen(): Promise<boolean> {
    try {
      return await this.exportDialog.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if the deletion dialog is open
   * @returns True if the deletion dialog is visible
   */
  async isDeletionDialogOpen(): Promise<boolean> {
    try {
      return await this.deletionDialog.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if the deletion result dialog is open
   * @returns True if the deletion result dialog is visible
   */
  async isDeletionResultDialogOpen(): Promise<boolean> {
    try {
      return await this.deletionResultDialog.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get the success message from the snackbar
   * @returns The success message text, or null if not visible
   */
  async getSuccessMessage(): Promise<string | null> {
    try {
      await this.successAlert.waitFor({ state: 'visible', timeout: 5000 });
      return await this.successAlert.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Get the error message from the snackbar
   * @returns The error message text, or null if not visible
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorAlert.waitFor({ state: 'visible', timeout: 5000 });
      return await this.errorAlert.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if the preserve orders checkbox is checked
   * @returns True if the checkbox is checked
   */
  async isPreserveOrdersChecked(): Promise<boolean> {
    return await this.preserveOrdersCheckbox.isChecked();
  }

  /**
   * Perform full account deletion flow
   * @param preserveOrders - Whether to preserve order records
   * @returns The deletion result
   */
  async performAccountDeletion(preserveOrders: boolean = true): Promise<Partial<DeletionResult>> {
    await this.requestAccountDeletion(preserveOrders);
    await this.confirmDeletion();
    return await this.getDeletionResult();
  }
}
