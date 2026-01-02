import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Page Object for the Reset Password page
 * Handles password reset form interactions via email link with reset key
 * 
 * URL: /account/reset-password?key={resetKey}
 * 
 * Features:
 * - Shows "Reset Your Password" heading when valid key is present
 * - Shows error Alert for invalid/missing reset key
 * - Has new password input field (id="newPassword", label="New Password")
 * - Has confirm password input field (id="confirmPassword", label="Confirm New Password")
 * - Has password visibility toggle buttons
 * - Has submit button "Reset Password"
 * - Shows loading spinner in button while submitting
 * - Shows success Alert when password reset successfully (with redirect message)
 * - Shows error Alert when reset fails
 * - Shows validation error Alert for password mismatch or weak password
 * - Has "Back to Login" link
 * - Redirects to login after 3 seconds on success
 */
export class ResetPasswordPage extends BasePage {
  readonly path = '/account/reset-password';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /**
   * Page heading "Reset Your Password"
   */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Reset Your Password' });
  }

  /**
   * New password input field
   */
  get newPasswordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'New Password', exact: true });
  }

  /**
   * Confirm password input field
   */
  get confirmPasswordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Confirm New Password' });
  }

  /**
   * Submit button "Reset Password"
   */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /Reset Password/i });
  }

  /**
   * Success alert (MUI Alert with severity="success")
   */
  get successAlert(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.locator('[class*="MuiAlert-standardSuccess"]') });
  }

  /**
   * Error alert (MUI Alert with severity="error") - for backend errors
   * Note: There can be multiple error alerts (backend error, validation error)
   * Uses multiple strategies to find error alerts
   */
  get errorAlert(): Locator {
    // Try multiple selectors for error alerts
    return this.page.locator('[role="alert"]').filter({
      has: this.page.locator('[class*="MuiAlert-standardError"], [class*="MuiAlert-filledError"], [class*="error"], svg[data-testid="ErrorOutlineIcon"]')
    }).or(
      // Fallback: look for alert containing error-related text
      this.page.getByRole('alert').filter({ hasText: /error|failed|invalid|expired/i })
    );
  }

  /**
   * Validation error alert - same as error alert but specifically for validation errors
   * (password mismatch, weak password, etc.)
   */
  get validationErrorAlert(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.locator('[class*="MuiAlert-standardError"]') });
  }

  /**
   * "Back to Login" link
   */
  get backToLoginLink(): Locator {
    return this.page.getByRole('link', { name: 'Back to Login' });
  }

  /**
   * Password visibility toggle buttons (both new and confirm password fields)
   */
  get passwordVisibilityToggles(): Locator {
    return this.page.getByRole('button').filter({ has: this.page.locator('svg') });
  }

  /**
   * Loading spinner in submit button (MUI CircularProgress)
   */
  get loadingSpinner(): Locator {
    return this.submitButton.locator('[class*="MuiCircularProgress"]');
  }

  /**
   * "Request Password Reset" link - shown when key is missing/invalid
   */
  get requestPasswordResetLink(): Locator {
    return this.page.getByRole('link', { name: 'Request Password Reset' });
  }

  // ==================== Actions ====================

  /**
   * Navigate to the reset password page with a specific reset key
   * @param key - The reset key from the email link
   */
  async gotoWithKey(key: string): Promise<void> {
    await this.page.goto(`${this.url}?key=${encodeURIComponent(key)}`);
    await this.waitForPageLoad();
  }

  /**
   * Submit the new password form
   * @param newPassword - The new password to set
   * @param confirmPassword - The password confirmation
   */
  async submitNewPassword(newPassword: string, confirmPassword: string): Promise<void> {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }

  /**
   * Get the success message text from the success alert
   * @returns The success message text
   */
  async getSuccessMessage(): Promise<string> {
    await this.waitForElement(this.successAlert);
    return await this.successAlert.textContent() || '';
  }

  /**
   * Get the error message text from the error alert
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
   * Get validation error messages from the Alert component(s)
   * @returns Array of validation error messages, or empty array if no errors
   */
  async getValidationErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    try {
      // Wait briefly for potential errors to appear
      await this.validationErrorAlert.first().waitFor({ state: 'visible', timeout: 3000 });
      
      // Get all error alert elements
      const alertCount = await this.validationErrorAlert.count();
      
      for (let i = 0; i < alertCount; i++) {
        const text = await this.validationErrorAlert.nth(i).textContent();
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
   * Check if the page is currently in loading state (submitting)
   * @returns True if loading spinner is visible or button shows "Resetting..."
   */
  async isLoading(): Promise<boolean> {
    try {
      const buttonText = await this.submitButton.textContent();
      return buttonText?.includes('Resetting') || false;
    } catch {
      return false;
    }
  }

  /**
   * Toggle password visibility for a specific field
   * @param field - The field to toggle ('new' or 'confirm')
   */
  async togglePasswordVisibility(field: 'new' | 'confirm'): Promise<void> {
    let inputField: Locator;
    
    switch (field) {
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
   * Click the "Back to Login" link
   */
  async clickBackToLogin(): Promise<void> {
    await this.backToLoginLink.click();
    await this.waitForNavigation();
  }

  // ==================== Validation Helpers ====================

  /**
   * Check if the reset was successful
   * @returns True if success alert is visible
   */
  async isResetSuccessful(): Promise<boolean> {
    try {
      return await this.successAlert.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if the reset failed
   * @returns True if error alert is visible
   */
  async isResetFailed(): Promise<boolean> {
    try {
      return await this.errorAlert.first().isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if password is visible for a specific field
   * @param field - The field to check ('new' or 'confirm')
   * @returns True if the password is visible (type="text"), false if hidden (type="password")
   */
  async isPasswordVisible(field: 'new' | 'confirm'): Promise<boolean> {
    let inputField: Locator;
    
    switch (field) {
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
   * Check if the submit button is enabled
   * @returns True if the submit button is enabled
   */
  async isSubmitEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  /**
   * Check if the page heading is visible (indicates valid reset key)
   * @returns True if the page heading is visible
   */
  async isPageHeadingVisible(): Promise<boolean> {
    try {
      return await this.pageHeading.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if the form is displayed (valid reset key scenario)
   * @returns True if the form is visible
   */
  async isFormVisible(): Promise<boolean> {
    try {
      const newPasswordVisible = await this.newPasswordInput.isVisible();
      const confirmPasswordVisible = await this.confirmPasswordInput.isVisible();
      return newPasswordVisible && confirmPasswordVisible;
    } catch {
      return false;
    }
  }

  /**
   * Check if the invalid key error is displayed
   * @returns True if the invalid key error message is visible
   */
  async isInvalidKeyErrorVisible(): Promise<boolean> {
    try {
      const errorText = this.page.getByText('Invalid or missing reset key');
      return await errorText.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Wait for the reset process to complete (either success or error)
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForResetComplete(timeout: number = 10000): Promise<void> {
    // Wait for either success or error alert to appear
    // Note: Success alert only shows for 3 seconds before redirect, so we need to catch it quickly
    await Promise.race([
      this.successAlert.waitFor({ state: 'visible', timeout }),
      this.errorAlert.first().waitFor({ state: 'visible', timeout }),
    ]).catch(() => {
      // If neither appears, the page may have already redirected (success case)
      // or the button is still loading
    });
  }

  /**
   * Wait for success alert specifically (with shorter timeout since it disappears after 3 seconds)
   * @param timeout - Optional timeout in milliseconds (default 5 seconds)
   */
  async waitForSuccessAlert(timeout: number = 5000): Promise<boolean> {
    try {
      await this.successAlert.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for the submit button to be ready (not in loading state)
   */
  private async waitForButtonReady(timeout: number = 15000): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const button = document.querySelector('button[type="submit"]');
        if (!button) return false;
        const isDisabled = button.hasAttribute('disabled');
        const text = button.textContent || '';
        const isLoading = text.includes('Resetting');
        return !isDisabled && !isLoading;
      },
      { timeout }
    );
  }

  /**
   * Wait for redirect to login page after successful reset
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForLoginRedirect(timeout: number = 5000): Promise<void> {
    await this.page.waitForURL(/\/account\/login/, { timeout });
  }

  /**
   * Wait for the reset password form to be ready
   */
  async waitForForm(): Promise<void> {
    // First ensure any dialogs are handled
    await this.handleAgeVerification();
    
    // Wait for form elements
    await this.pageHeading.waitFor({ state: 'visible', timeout: 15000 });
    await this.newPasswordInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.confirmPasswordInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.submitButton.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.newPasswordInput.clear();
    await this.confirmPasswordInput.clear();
  }

  /**
   * Fill in the new password field only
   * @param password - The new password to enter
   */
  async fillNewPassword(password: string): Promise<void> {
    await this.newPasswordInput.fill(password);
  }

  /**
   * Fill in the confirm password field only
   * @param password - The password confirmation to enter
   */
  async fillConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
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
