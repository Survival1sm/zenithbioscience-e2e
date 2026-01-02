import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Page Object for the Account Activation page
 * Handles account activation via email link with activation key
 * 
 * URL: /account/activate?key={activationKey}
 * 
 * Features:
 * - Shows "Account Activation" heading
 * - Shows loading spinner while activating
 * - Shows success Alert with success message when activation succeeds
 * - Shows error Alert with error message when activation fails
 * - Shows "Go to Login" button on success
 * - Shows "Resend Activation Email" button on error or missing key
 * - Shows error for invalid/missing activation link
 */
export class ActivationPage extends BasePage {
  readonly path = '/account/activate';

  // ==================== Locators ====================

  /**
   * Page heading "Account Activation"
   */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Account Activation' });
  }

  /**
   * Loading spinner (MUI CircularProgress)
   */
  get loadingSpinner(): Locator {
    return this.page.getByRole('progressbar');
  }

  /**
   * Success alert (MUI Alert with severity="success")
   */
  get successAlert(): Locator {
    return this.page.locator('.MuiAlert-standardSuccess');
  }

  /**
   * Error alert (MUI Alert with severity="error")
   */
  get errorAlert(): Locator {
    return this.page.locator('.MuiAlert-standardError');
  }

  /**
   * "Go to Login" button - shown on successful activation
   */
  get goToLoginButton(): Locator {
    return this.page.getByRole('button', { name: 'Go to Login' });
  }

  /**
   * "Resend Activation Email" button - shown on error or missing key
   */
  get resendActivationButton(): Locator {
    return this.page.getByRole('button', { name: 'Resend Activation Email' });
  }

  /**
   * Loading text "Activating your account..."
   */
  get loadingText(): Locator {
    return this.page.getByText('Activating your account...');
  }

  // ==================== Actions ====================

  /**
   * Navigate to the activation page with a specific activation key
   * @param key - The activation key from the email link
   */
  async activateAccount(key: string): Promise<void> {
    await this.page.goto(`${this.url}?key=${encodeURIComponent(key)}`);
    await this.waitForPageLoad();
    // Wait for activation to complete by checking for success or error alert
    await this.waitForActivationComplete(15000);
  }

  /**
   * Navigate to the activation page without a key (invalid link scenario)
   */
  async navigateWithoutKey(): Promise<void> {
    await this.goto();
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
   * @returns The error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.waitForElement(this.errorAlert);
    return await this.errorAlert.textContent() || '';
  }

  /**
   * Check if the page is currently in loading state
   * @returns True if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    try {
      return await this.loadingSpinner.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if the activation was successful
   * @returns True if success alert is visible
   */
  async isActivationSuccessful(): Promise<boolean> {
    try {
      return await this.successAlert.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if the activation failed
   * @returns True if error alert is visible
   */
  async isActivationFailed(): Promise<boolean> {
    try {
      return await this.errorAlert.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Click the "Go to Login" button (available after successful activation)
   */
  async clickGoToLogin(): Promise<void> {
    await this.waitForElement(this.goToLoginButton);
    await this.goToLoginButton.click();
    await this.waitForNavigation();
  }

  /**
   * Click the "Resend Activation Email" button (available on error or missing key)
   */
  async clickResendActivation(): Promise<void> {
    await this.waitForElement(this.resendActivationButton);
    await this.resendActivationButton.click();
    await this.waitForNavigation();
  }

  /**
   * Wait for the activation process to complete (either success or error)
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForActivationComplete(timeout: number = 20000): Promise<void> {
    // Wait for loading to finish with extended timeout for Firefox
    try {
      await this.waitForElementHidden(this.loadingSpinner, timeout);
    } catch {
      // Loading spinner may not be visible if activation is very fast
    }

    // Wait for either success or error alert to appear with retry logic
    let attempts = 0;
    const maxAttempts = 4;
    
    while (attempts < maxAttempts) {
      try {
        await Promise.race([
          this.successAlert.waitFor({ state: 'visible', timeout: timeout / maxAttempts }),
          this.errorAlert.waitFor({ state: 'visible', timeout: timeout / maxAttempts }),
        ]);
        return; // Success - one of the alerts appeared
      } catch {
        attempts++;
        // No fixed wait needed - the waitFor already handles timing
      }
    }
    
    // Final check - if neither alert is visible, throw
    const successVisible = await this.successAlert.isVisible().catch(() => false);
    const errorVisible = await this.errorAlert.isVisible().catch(() => false);
    
    if (!successVisible && !errorVisible) {
      throw new Error('Activation did not complete - neither success nor error alert appeared');
    }
  }

  /**
   * Check if the page heading is visible
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
   * Check if the "Go to Login" button is visible
   * @returns True if the button is visible
   */
  async isGoToLoginButtonVisible(): Promise<boolean> {
    try {
      return await this.goToLoginButton.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if the "Resend Activation Email" button is visible
   * @returns True if the button is visible
   */
  async isResendActivationButtonVisible(): Promise<boolean> {
    try {
      return await this.resendActivationButton.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }
}
