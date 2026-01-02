import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Resend Activation Page Object
 * Handles resend activation email form interactions and validation
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 */
export class ResendActivationPage extends BasePage {
  readonly path = '/account/resend-activation';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /**
   * Get the page heading - h5 with component="h1"
   */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Resend Activation Email' });
  }

  /**
   * Get the email input field
   */
  get emailInput(): Locator {
    return this.page.getByLabel('Email Address');
  }

  /**
   * Get the submit button
   */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /Resend Activation Email|Sending/i });
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
   * Get the back to login link
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
   * Submit the resend activation form with an email address
   * @param email - The email address to submit
   */
  async submitEmail(email: string): Promise<void> {
    await this.fillEmail(email);
    await this.clickSubmit();
  }

  /**
   * Click the back to login link
   */
  async clickBackToLogin(): Promise<void> {
    await this.backToLoginLink.click();
  }

  // ==================== State Checks ====================

  /**
   * Check if the form is in loading state
   * @returns True if the form is submitting (loading spinner visible or button shows "Sending...")
   */
  async isLoading(): Promise<boolean> {
    try {
      // Check if button text contains "Sending"
      const buttonText = await this.submitButton.textContent();
      if (buttonText?.includes('Sending')) {
        return true;
      }
      
      // Also check for loading spinner
      const spinnerVisible = await this.loadingSpinner.isVisible({ timeout: 500 });
      return spinnerVisible;
    } catch {
      return false;
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
   * Check if a success message is displayed
   * @returns True if success alert is visible
   */
  async hasSuccessMessage(): Promise<boolean> {
    try {
      // MUI Alert with severity="success" has class MuiAlert-standardSuccess
      const successAlert = this.page.locator('.MuiAlert-standardSuccess, .MuiAlert-filledSuccess, .MuiAlert-outlinedSuccess');
      return await successAlert.isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if an error message is displayed
   * @returns True if error alert is visible
   */
  async hasErrorMessage(): Promise<boolean> {
    try {
      // MUI Alert with severity="error" has class MuiAlert-standardError
      const errorAlert = this.page.locator('.MuiAlert-standardError, .MuiAlert-filledError, .MuiAlert-outlinedError');
      return await errorAlert.isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  // ==================== Message Retrieval ====================

  /**
   * Get the success message text
   * @returns The success message text, or null if no success message is displayed
   */
  async getSuccessMessage(): Promise<string | null> {
    try {
      const successAlert = this.page.locator('.MuiAlert-standardSuccess, .MuiAlert-filledSuccess, .MuiAlert-outlinedSuccess');
      await successAlert.waitFor({ state: 'visible', timeout: 5000 });
      return await successAlert.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Get the error message text
   * @returns The error message text, or null if no error message is displayed
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      const errorAlert = this.page.locator('.MuiAlert-standardError, .MuiAlert-filledError, .MuiAlert-outlinedError');
      await errorAlert.waitFor({ state: 'visible', timeout: 5000 });
      return await errorAlert.textContent();
    } catch {
      return null;
    }
  }

  // ==================== Wait Methods ====================

  /**
   * Wait for the form to be ready
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
    // Wait for loading to start
    await this.page.waitForTimeout(100);
    
    // Wait for either success or error alert to appear, or loading to finish
    await Promise.race([
      this.page.getByRole('alert').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
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
        if (!button) return false;
        const text = button.textContent || '';
        return !text.includes('Sending');
      },
      { timeout: 15000 }
    );
  }

  // ==================== Form Helpers ====================

  /**
   * Clear the email field
   */
  async clearEmail(): Promise<void> {
    await this.emailInput.clear();
  }

  /**
   * Check if the form is displayed
   * @returns True if the form is visible
   */
  async isFormVisible(): Promise<boolean> {
    try {
      const headingVisible = await this.pageHeading.isVisible();
      const emailVisible = await this.emailInput.isVisible();
      const buttonVisible = await this.submitButton.isVisible();
      return headingVisible && emailVisible && buttonVisible;
    } catch {
      return false;
    }
  }

  /**
   * Get the current value of the email input
   * @returns The current email value
   */
  async getEmailValue(): Promise<string> {
    return await this.emailInput.inputValue();
  }
}
