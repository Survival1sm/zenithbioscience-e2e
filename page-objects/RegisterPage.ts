import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * User registration data interface
 */
export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms?: boolean;
}

/**
 * Register Page Object
 * Handles registration form interactions and validation
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 */
export class RegisterPage extends BasePage {
  readonly path = '/account/register';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Create an Account', level: 1 });
  }

  get firstNameInput(): Locator {
    return this.page.getByRole('textbox', { name: 'First Name' });
  }

  get lastNameInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Last Name' });
  }

  get emailInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Email Address' });
  }

  get passwordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Password', exact: true });
  }

  get confirmPasswordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Confirm Password' });
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Create Account' });
  }

  get termsCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /I agree to the Terms and Conditions/i });
  }

  /**
   * Get the error alert container
   * Uses MUI Alert class to avoid matching Next.js route announcer
   */
  get errorAlert(): Locator {
    return this.page.locator('.MuiAlert-root[role="alert"]');
  }

  get googleLoginButton(): Locator {
    return this.page.getByRole('button', { name: /Continue with Google/i });
  }

  get signInLink(): Locator {
    return this.page.getByRole('link', { name: 'Sign In' });
  }

  get termsLink(): Locator {
    return this.page.getByRole('link', { name: 'Terms and Conditions' });
  }

  // ==================== Field Error Locators ====================

  /**
   * Email field validation error message
   * Uses MUI FormHelperText with error state
   */
  get emailError(): Locator {
    // Look for helper text near the email input with error state
    return this.page.locator('#email-helper-text, [id*="email"][id*="helper"], .MuiFormHelperText-root.Mui-error').first();
  }

  /**
   * Password field validation error message
   * Uses MUI FormHelperText with error state
   */
  get passwordError(): Locator {
    // Look for helper text near the password input with error state
    return this.page.locator('#password-helper-text, [id*="password"][id*="helper"]:not([id*="confirm"]), .MuiFormHelperText-root.Mui-error').first();
  }

  /**
   * Confirm password field validation error message
   * Uses MUI FormHelperText with error state
   */
  get confirmPasswordError(): Locator {
    // Look for helper text near the confirm password input with error state
    return this.page.locator('#confirmPassword-helper-text, [id*="confirm"][id*="helper"], .MuiFormHelperText-root.Mui-error').first();
  }

  /**
   * General error message (for form-level errors like duplicate email)
   * Alias for errorAlert for consistency with design doc
   */
  get errorMessage(): Locator {
    return this.errorAlert;
  }

  // ==================== Actions ====================

  async fillFirstName(firstName: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
  }

  async fillLastName(lastName: string): Promise<void> {
    await this.lastNameInput.fill(lastName);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(confirmPassword: string): Promise<void> {
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  async acceptTerms(accept: boolean = true): Promise<void> {
    const isChecked = await this.termsCheckbox.isChecked();
    if (isChecked !== accept) {
      await this.termsCheckbox.click();
    }
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Perform a complete registration action
   * @param userData - The registration data
   */
  async register(userData: RegistrationData): Promise<void> {
    await this.fillFirstName(userData.firstName);
    await this.fillLastName(userData.lastName);
    await this.fillEmail(userData.email);
    await this.fillPassword(userData.password);
    await this.fillConfirmPassword(userData.confirmPassword);
    
    if (userData.acceptTerms !== false) {
      await this.acceptTerms(true);
    }
    
    await this.clickSubmit();
  }

  /**
   * Get the error message displayed on the page
   * @returns The error message text, or null if no error is displayed
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorAlert.waitFor({ state: 'visible', timeout: 3000 });
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
      await this.errorAlert.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the registration was successful
   * @returns True if success message is displayed or redirected
   */
  async isRegistrationSuccessful(): Promise<boolean> {
    try {
      // Check for "Check Your Email" heading or similar success indicator
      const heading = this.page.getByRole('heading', { name: /check your email|verify|success/i });
      return await heading.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if the registration form is displayed
   * @returns True if the registration form is visible
   */
  async isRegistrationFormVisible(): Promise<boolean> {
    try {
      const emailVisible = await this.emailInput.isVisible();
      const passwordVisible = await this.passwordInput.isVisible();
      const firstNameVisible = await this.firstNameInput.isVisible();
      return emailVisible && passwordVisible && firstNameVisible;
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
    return buttonText?.includes('Creating') || buttonText?.includes('...') || false;
  }

  /**
   * Navigate to sign in page
   */
  async goToSignIn(): Promise<void> {
    await this.signInLink.click();
    await this.waitForPageLoad();
  }

  /**
   * Wait for the registration form to be ready
   * Handles age verification dialog if present before checking form
   */
  async waitForForm(): Promise<void> {
    // First ensure any dialogs are handled
    await this.handleAgeVerification();
    
    // Then wait for form elements with increased timeout
    await this.pageHeading.waitFor({ state: 'visible', timeout: 15000 });
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.submitButton.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.firstNameInput.clear();
    await this.lastNameInput.clear();
    await this.emailInput.clear();
    await this.passwordInput.clear();
    await this.confirmPasswordInput.clear();
  }

  /**
   * Get the password requirements text
   * @returns The password requirements description
   */
  async getPasswordRequirements(): Promise<string> {
    const requirements = this.page.getByText(/Password must be at least/i);
    return await requirements.textContent() || '';
  }
}
