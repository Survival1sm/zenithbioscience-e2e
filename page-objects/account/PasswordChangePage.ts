import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Password Change Page Object
 * Handles password change form interactions and validation
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 * 
 * Note: This page requires authentication (AuthGuard protected)
 */
export class PasswordChangePage extends BasePage {
  readonly path = '/account/password';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /**
   * Get the page heading
   */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Change Password', level: 1 });
  }

  /**
   * Get the current password input field
   */
  get currentPasswordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Current Password' });
  }

  /**
   * Get the new password input field
   */
  get newPasswordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'New Password', exact: true });
  }

  /**
   * Get the confirm password input field
   */
  get confirmPasswordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Confirm New Password' });
  }

  /**
   * Get the submit button
   */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /Update Password/i });
  }

  /**
   * Get the error alert container (for both validation and backend errors)
   */
  get errorAlert(): Locator {
    return this.page.getByRole('alert');
  }

  /**
   * Get the password visibility toggle button for current password
   */
  get currentPasswordToggle(): Locator {
    // The toggle is inside the current password field's InputAdornment
    return this.currentPasswordInput.locator('..').locator('..').getByRole('button');
  }

  /**
   * Get the password visibility toggle button for new password
   */
  get newPasswordToggle(): Locator {
    return this.newPasswordInput.locator('..').locator('..').getByRole('button');
  }

  /**
   * Get the password visibility toggle button for confirm password
   */
  get confirmPasswordToggle(): Locator {
    return this.confirmPasswordInput.locator('..').locator('..').getByRole('button');
  }

  // ==================== Actions ====================

  /**
   * Fill in the current password field
   * @param password - The current password to enter
   */
  async fillCurrentPassword(password: string): Promise<void> {
    await this.currentPasswordInput.fill(password);
  }

  /**
   * Fill in the new password field
   * @param password - The new password to enter
   */
  async fillNewPassword(password: string): Promise<void> {
    await this.newPasswordInput.fill(password);
  }

  /**
   * Fill in the confirm password field
   * @param password - The password confirmation to enter
   */
  async fillConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Click the submit button
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Perform a complete password change action
   * @param currentPassword - The current password
   * @param newPassword - The new password
   * @param confirmPassword - The password confirmation
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    await this.fillCurrentPassword(currentPassword);
    await this.fillNewPassword(newPassword);
    await this.fillConfirmPassword(confirmPassword);
    await this.clickSubmit();
  }

  /**
   * Get validation error messages from the Alert component
   * @returns Array of error messages, or empty array if no errors
   */
  async getValidationErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    try {
      // Wait briefly for potential errors to appear
      await this.errorAlert.first().waitFor({ state: 'visible', timeout: 3000 });
      
      // Get all alert elements (there could be multiple - validation and backend errors)
      const alertCount = await this.errorAlert.count();
      
      for (let i = 0; i < alertCount; i++) {
        const text = await this.errorAlert.nth(i).textContent();
        if (text) {
          errors.push(text.trim());
        }
      }
    } catch {
      // No errors visible
    }
    
    return errors;
  }

  /**
   * Check for successful password change by verifying redirect to login with success message
   * @returns True if redirected to login with password-changed message
   */
  async getSuccessMessage(): Promise<boolean> {
    try {
      // Wait for redirect to login page with success message
      await this.page.waitForURL(/\/account\/login\?message=password-changed/, {
        timeout: 10000,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Toggle password visibility for a specific field
   * @param field - The field to toggle ('current', 'new', or 'confirm')
   */
  async togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): Promise<void> {
    // Find the IconButton within the TextField's InputAdornment
    let inputField: Locator;
    
    switch (field) {
      case 'current':
        inputField = this.currentPasswordInput;
        break;
      case 'new':
        inputField = this.newPasswordInput;
        break;
      case 'confirm':
        inputField = this.confirmPasswordInput;
        break;
    }
    
    // Navigate to the parent container and find the IconButton
    // MUI TextField structure: div > div > input + InputAdornment > IconButton
    const container = inputField.locator('xpath=ancestor::div[contains(@class, "MuiTextField-root")]');
    const toggleButton = container.getByRole('button');
    await toggleButton.click();
  }

  /**
   * Check if password is visible for a specific field
   * @param field - The field to check ('current', 'new', or 'confirm')
   * @returns True if the password is visible (type="text"), false if hidden (type="password")
   */
  async isPasswordVisible(field: 'current' | 'new' | 'confirm'): Promise<boolean> {
    let inputField: Locator;
    
    switch (field) {
      case 'current':
        inputField = this.currentPasswordInput;
        break;
      case 'new':
        inputField = this.newPasswordInput;
        break;
      case 'confirm':
        inputField = this.confirmPasswordInput;
        break;
    }
    
    const inputType = await inputField.getAttribute('type');
    return inputType === 'text';
  }

  /**
   * Wait for form submission to complete
   * Waits for either success redirect or error message to appear
   */
  async waitForSubmit(): Promise<void> {
    // Wait for either:
    // 1. Redirect to login page (success)
    // 2. Error alert to appear (failure)
    // 3. Button to stop showing loading state
    
    await Promise.race([
      this.page.waitForURL(/\/account\/login/, { timeout: 15000 }).catch(() => {}),
      this.errorAlert.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      this.waitForButtonReady(),
    ]);
  }

  /**
   * Wait for the submit button to be ready (not in loading state)
   */
  private async waitForButtonReady(): Promise<void> {
    // Wait for button to not be disabled and not show loading text
    await this.page.waitForFunction(
      () => {
        const button = document.querySelector('button[type="submit"]');
        if (!button) return false;
        const isDisabled = button.hasAttribute('disabled');
        const text = button.textContent || '';
        const isLoading = text.includes('Updating');
        return !isDisabled && !isLoading;
      },
      { timeout: 15000 }
    );
  }

  // ==================== Validation Helpers ====================

  /**
   * Check if an error message is displayed
   * @returns True if an error is visible
   */
  async hasError(): Promise<boolean> {
    try {
      await this.errorAlert.first().waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the first error message displayed
   * @returns The error message text, or null if no error is displayed
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorAlert.first().waitFor({ state: 'visible', timeout: 3000 });
      return await this.errorAlert.first().textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if the submit button is enabled
   * @returns True if the submit button is enabled
   */
  async isSubmitEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  /**
   * Check if the submit button shows loading state
   * @returns True if the button is in loading state
   */
  async isSubmitting(): Promise<boolean> {
    const buttonText = await this.submitButton.textContent();
    return buttonText?.includes('Updating') || false;
  }

  /**
   * Check if the password change form is displayed
   * @returns True if the form is visible
   */
  async isFormVisible(): Promise<boolean> {
    try {
      const currentVisible = await this.currentPasswordInput.isVisible();
      const newVisible = await this.newPasswordInput.isVisible();
      const confirmVisible = await this.confirmPasswordInput.isVisible();
      return currentVisible && newVisible && confirmVisible;
    } catch {
      return false;
    }
  }

  /**
   * Wait for the password change form to be ready
   */
  async waitForForm(): Promise<void> {
    // First ensure any dialogs are handled
    await this.handleAgeVerification();
    
    // Wait for form elements
    await this.pageHeading.waitFor({ state: 'visible', timeout: 15000 });
    await this.currentPasswordInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.newPasswordInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.confirmPasswordInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.submitButton.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.currentPasswordInput.clear();
    await this.newPasswordInput.clear();
    await this.confirmPasswordInput.clear();
  }

  /**
   * Get the password requirements helper text
   * @returns The password requirements description
   */
  async getPasswordRequirements(): Promise<string> {
    const requirements = this.page.getByText(/Password must be at least/i);
    try {
      return await requirements.textContent() || '';
    } catch {
      return '';
    }
  }
}
