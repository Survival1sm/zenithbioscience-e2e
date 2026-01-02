import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object
 * Handles login form interactions and authentication verification
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 */
export class LoginPage extends BasePage {
  readonly path = '/auth/login';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /**
   * Get the email input field - using aria-label from actual page
   */
  get emailInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Email address for login' });
  }

  /**
   * Get the password input field - using aria-label from actual page
   */
  get passwordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Password for login' });
  }

  /**
   * Get the submit button
   */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Sign In' });
  }

  /**
   * Get the remember me checkbox
   */
  get rememberMeCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: 'Remember me on this device' });
  }

  /**
   * Get the error alert container
   * Uses MUI Alert class to avoid matching Next.js route announcer
   */
  get errorAlert(): Locator {
    return this.page.locator('.MuiAlert-root[role="alert"]');
  }

  /**
   * Get the forgot password link
   */
  get forgotPasswordLink(): Locator {
    return this.page.getByRole('link', { name: 'Reset your password if you\'ve forgotten it' });
  }

  /**
   * Get the sign up link
   */
  get signUpLink(): Locator {
    return this.page.getByRole('link', { name: 'Create a new account' });
  }

  /**
   * Get the Google social login button
   */
  get googleLoginButton(): Locator {
    return this.page.getByRole('button', { name: /continue with google/i });
  }

  /**
   * Get the GitHub social login button - may not exist
   */
  get githubLoginButton(): Locator {
    return this.page.getByRole('button', { name: /continue with github/i });
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
   * Fill in the password field
   * @param password - The password to enter
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Toggle the remember me checkbox
   * @param checked - Whether to check or uncheck
   */
  async setRememberMe(checked: boolean): Promise<void> {
    const isChecked = await this.rememberMeCheckbox.isChecked();
    if (isChecked !== checked) {
      await this.rememberMeCheckbox.click();
    }
  }

  /**
   * Click the submit button
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Perform a complete login action
   * @param email - The email address
   * @param password - The password
   * @param rememberMe - Whether to check remember me (default: false)
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    if (rememberMe) {
      await this.setRememberMe(true);
    }
    await this.clickSubmit();
  }

  /**
   * Wait for login to complete successfully
   * Waits for redirect away from login page
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForLoginComplete(timeout?: number): Promise<void> {
    await this.page.waitForURL((url) => {
      // Check for both possible login paths
      return !url.pathname.includes('/auth/login') && !url.pathname.includes('/account/login');
    }, {
      timeout: timeout || 30000,
    });
    await this.waitForPageLoad();
  }

  /**
   * Get the error message displayed on the page
   * @returns The error message text, or null if no error is displayed
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      const isVisible = await this.errorAlert.isVisible();
      if (!isVisible) {
        return null;
      }
      return await this.errorAlert.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if an error message is displayed
   * @returns True if an error is visible
   */
  async hasError(): Promise<boolean> {
    try {
      // Wait briefly for potential error to appear
      await this.errorAlert.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation error for a specific field
   * @param fieldName - The name of the field (email or password)
   * @returns The validation error text, or null if no error
   */
  async getFieldValidationError(fieldName: 'email' | 'password'): Promise<string | null> {
    // Look for helper text near the field
    const helperTextSelector = fieldName === 'email' 
      ? 'Enter the email address associated with your account'
      : 'Enter your account password';
    
    const helperText = this.page.getByText(helperTextSelector);
    
    try {
      if (await helperText.isVisible()) {
        const text = await helperText.textContent();
        // Check if it contains error-like text
        if (text && (text.toLowerCase().includes('required') || 
                     text.toLowerCase().includes('invalid') ||
                     text.toLowerCase().includes('error'))) {
          return text;
        }
      }
    } catch {
      // Field validation error not found
    }
    
    return null;
  }

  /**
   * Check if the user is logged in
   * Checks for presence of user menu or logout button in header
   * @returns True if logged in, false otherwise
   */
  async isLoggedIn(): Promise<boolean> {
    const currentUrl = this.getCurrentUrl();
    // Check for both possible login paths
    if (currentUrl.includes('/auth/login') || currentUrl.includes('/account/login')) {
      return false;
    }

    // Check for account link or user-specific elements
    const accountLink = this.page.getByRole('link', { name: /account/i });
    
    try {
      return await accountLink.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if the login form is displayed
   * @returns True if the login form is visible
   */
  async isLoginFormVisible(): Promise<boolean> {
    try {
      const emailVisible = await this.emailInput.isVisible();
      const passwordVisible = await this.passwordInput.isVisible();
      return emailVisible && passwordVisible;
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
   * Check if the submit button shows loading state
   * @returns True if the button is in loading state
   */
  async isSubmitting(): Promise<boolean> {
    const buttonText = await this.submitButton.textContent();
    return buttonText?.includes('Signing In') || buttonText?.includes('...') || false;
  }

  /**
   * Navigate to forgot password page
   */
  async goToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to registration page
   */
  async goToSignUp(): Promise<void> {
    await this.signUpLink.click();
    await this.waitForPageLoad();
  }

  /**
   * Click Google social login button
   */
  async clickGoogleLogin(): Promise<void> {
    await this.googleLoginButton.click();
  }

  /**
   * Click GitHub social login button
   */
  async clickGithubLogin(): Promise<void> {
    await this.githubLoginButton.click();
  }

  /**
   * Wait for the login form to be ready
   */
  async waitForForm(): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.submitButton.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }
}
