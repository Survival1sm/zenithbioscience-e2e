import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Forgot Password Page Object
 * Handles password reset request form interactions and validation
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 * 
 * URL: /account/forgot-password
 * Features:
 * - Email input for password reset request
 * - Success/error alert messages
 * - Loading state during submission
 * - Back to login navigation
 */
export class ForgotPasswordPage extends BasePage {
  readonly path = '/account/forgot-password';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /**
   * Get the page heading "Forgot Your Password?"
   */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Forgot Your Password?', level: 1 });
  }

  /**
   * Get the email input field
   */
  get emailInput(): Locator {
    return this.page.getByLabel('Email Address');
  }

  /**
   * Get the submit button "Send Reset Instructions"
   */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /Send Reset Instructions|Sending/i });
  }

  /**
   * Get the success alert container
   */
  get successAlert(): Locator {
    return this.page.locator('[role="alert"]').filter({ has: this.page.locator('.MuiAlert-standardSuccess, .MuiAlert-filledSuccess, .MuiAlert-outlinedSuccess') });
  }

  /**
   * Get the error alert container
   */
  get errorAlert(): Locator {
    return this.page.locator('[role="alert"]').filter({ has: this.page.locator('.MuiAlert-standardError, .MuiAlert-filledError, .MuiAlert-outlinedError') });
  }

  /**
   * Get the "Back to Login" link
   */
  get backToLoginLink(): Locator {
    return this.page.getByRole('link', { name: 'Back to Login' });
  }

  /**
   * Get the loading spinner inside the submit button
   */
  get loadingSpinner(): Locator {
    return this.submitButton.locator('[role="progressbar"]');
  }

  // ==================== Actions ====================

  /**
   * Fill in the email field
   * @param email - The email address to enter
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Click the submit button
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Submit the forgot password form with an email address
   * @param email - The email address to submit
   */
  async submitEmail(email: string): Promise<void> {
    await this.fillEmail(email);
    await this.clickSubmit();
  }

  /**
   * Click the "Back to Login" link
   */
  async clickBackToLogin(): Promise<void> {
    await this.backToLoginLink.click();
    await this.waitForNavigation();
  }

  // ==================== State Checks ====================

  /**
   * Check if the form is in loading state
   * @returns True if the submit button shows loading spinner
   */
  async isLoading(): Promise<boolean> {
    try {
      // Check for loading spinner or "Sending..." text
      const buttonText = await this.submitButton.textContent();
      const hasLoadingText = buttonText?.includes('Sending') || false;
      
      // Also check for CircularProgress spinner
      const spinnerVisible = await this.loadingSpinner.isVisible().catch(() => false);
      
      return hasLoadingText || spinnerVisible;
    } catch {
      return false;
    }
  }

  /**
   * Check if the email input field is disabled
   * @returns True if the email field is disabled (after successful submission)
   */
  async isEmailDisabled(): Promise<boolean> {
    return await this.emailInput.isDisabled();
  }

  /**
   * Check if the submit button is visible
   * @returns True if the submit button is visible (hidden after success)
   */
  async isSubmitButtonVisible(): Promise<boolean> {
    try {
      return await this.submitButton.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if the submit button is enabled
   * @returns True if the submit button is enabled
   */
  async isSubmitEnabled(): Promise<boolean> {
    try {
      return await this.submitButton.isEnabled();
    } catch {
      return false;
    }
  }

  // ==================== Message Retrieval ====================

  /**
   * Get the success message text
   * @returns The success message text, or null if not displayed
   */
  async getSuccessMessage(): Promise<string | null> {
    try {
      // Wait for success alert to appear
      const alert = this.page.getByRole('alert').filter({ hasText: /.+/ });
      await alert.waitFor({ state: 'visible', timeout: 5000 });
      
      // Check if it's a success alert (MUI uses severity="success")
      const alertElement = this.page.locator('.MuiAlert-standardSuccess, .MuiAlert-filledSuccess, .MuiAlert-outlinedSuccess');
      if (await alertElement.isVisible()) {
        return await alertElement.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get the error message text
   * @returns The error message text, or null if not displayed
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      // Wait for error alert to appear
      const alertElement = this.page.locator('.MuiAlert-standardError, .MuiAlert-filledError, .MuiAlert-outlinedError');
      await alertElement.waitFor({ state: 'visible', timeout: 5000 });
      return await alertElement.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if a success message is displayed
   * @returns True if a success alert is visible
   */
  async hasSuccessMessage(): Promise<boolean> {
    try {
      const alertElement = this.page.locator('.MuiAlert-standardSuccess, .MuiAlert-filledSuccess, .MuiAlert-outlinedSuccess');
      return await alertElement.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if an error message is displayed
   * @returns True if an error alert is visible
   */
  async hasErrorMessage(): Promise<boolean> {
    try {
      const alertElement = this.page.locator('.MuiAlert-standardError, .MuiAlert-filledError, .MuiAlert-outlinedError');
      return await alertElement.isVisible();
    } catch {
      return false;
    }
  }

  // ==================== Wait Helpers ====================

  /**
   * Wait for the forgot password form to be ready
   */
  async waitForForm(): Promise<void> {
    // First ensure any dialogs are handled
    await this.handleAgeVerification();
    
    // Wait for form elements
    await this.pageHeading.waitFor({ state: 'visible', timeout: 15000 });
    await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.submitButton.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Wait for form submission to complete
   * Waits for either success message, error message, or loading to finish
   */
  async waitForSubmit(): Promise<void> {
    // Wait for either:
    // 1. Success alert to appear
    // 2. Error alert to appear
    // 3. Loading state to end
    
    await Promise.race([
      this.page.locator('.MuiAlert-standardSuccess, .MuiAlert-filledSuccess, .MuiAlert-outlinedSuccess')
        .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      this.page.locator('.MuiAlert-standardError, .MuiAlert-filledError, .MuiAlert-outlinedError')
        .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      this.waitForLoadingComplete(),
    ]);
  }

  /**
   * Wait for loading state to complete
   */
  private async waitForLoadingComplete(): Promise<void> {
    // Wait for button to not show loading text
    await this.page.waitForFunction(
      () => {
        const button = document.querySelector('button[type="submit"]');
        if (!button) return true; // Button hidden after success
        const text = button.textContent || '';
        return !text.includes('Sending');
      },
      { timeout: 15000 }
    );
  }

  /**
   * Wait for success state (email disabled, button hidden)
   */
  async waitForSuccess(): Promise<void> {
    // Wait for success alert
    await this.page.locator('.MuiAlert-standardSuccess, .MuiAlert-filledSuccess, .MuiAlert-outlinedSuccess')
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  // ==================== Form Validation ====================

  /**
   * Check if the form is in success state
   * (email disabled, submit button hidden, success message shown)
   * @returns True if form is in success state
   */
  async isInSuccessState(): Promise<boolean> {
    const emailDisabled = await this.isEmailDisabled();
    const buttonHidden = !(await this.isSubmitButtonVisible());
    const hasSuccess = await this.hasSuccessMessage();
    
    return emailDisabled && buttonHidden && hasSuccess;
  }

  /**
   * Check if the form is displayed and ready for input
   * @returns True if the form is visible and ready
   */
  async isFormVisible(): Promise<boolean> {
    try {
      const headingVisible = await this.pageHeading.isVisible();
      const emailVisible = await this.emailInput.isVisible();
      return headingVisible && emailVisible;
    } catch {
      return false;
    }
  }

  /**
   * Clear the email field
   */
  async clearEmail(): Promise<void> {
    await this.emailInput.clear();
  }

  /**
   * Get the current value of the email field
   * @returns The current email value
   */
  async getEmailValue(): Promise<string> {
    return await this.emailInput.inputValue();
  }
}
