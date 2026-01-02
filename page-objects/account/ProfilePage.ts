import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Profile data interface for form values
 */
export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

/**
 * Profile update data interface (partial, email cannot be changed)
 */
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

/**
 * Notification preferences interface
 */
export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
}

/**
 * Profile Page Object
 * Handles profile form interactions and notification preferences
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 * 
 * Note: This page uses AuthGuard, so user must be logged in to access
 */
export class ProfilePage extends BasePage {
  readonly path = '/account/profile';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /**
   * Get the page heading
   */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'My Profile', level: 1 });
  }

  /**
   * Get the first name input field
   */
  get firstNameInput(): Locator {
    return this.page.getByRole('textbox', { name: 'First Name' });
  }

  /**
   * Get the last name input field
   */
  get lastNameInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Last Name' });
  }

  /**
   * Get the email input field (disabled)
   */
  get emailInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Email Address' });
  }

  /**
   * Get the phone number input field
   */
  get phoneNumberInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Phone Number' });
  }

  /**
   * Get the email notifications switch
   */
  get emailNotificationsSwitch(): Locator {
    return this.page.getByRole('checkbox', { name: 'Email Notifications' });
  }

  /**
   * Get the SMS notifications switch
   */
  get smsNotificationsSwitch(): Locator {
    return this.page.getByRole('checkbox', { name: 'SMS Notifications' });
  }

  /**
   * Get the save changes button
   */
  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save Changes' });
  }

  /**
   * Get the loading spinner in the save button
   */
  get saveButtonSpinner(): Locator {
    return this.saveButton.locator('svg[class*="MuiCircularProgress"]');
  }

  /**
   * Get the success snackbar alert
   * The profile page uses a Snackbar with Alert component
   * Message: "Profile updated successfully!"
   */
  get successAlert(): Locator {
    return this.page.locator('.MuiSnackbar-root .MuiAlert-root').filter({ hasText: /success/i });
  }

  /**
   * Get the error snackbar alert
   */
  get errorAlert(): Locator {
    return this.page.locator('.MuiSnackbar-root .MuiAlert-root').filter({ hasText: /failed|error/i });
  }

  /**
   * Get any snackbar alert
   */
  get snackbarAlert(): Locator {
    return this.page.locator('.MuiSnackbar-root .MuiAlert-root');
  }

  /**
   * Get the page loading spinner
   */
  get pageLoadingSpinner(): Locator {
    return this.page.locator('svg[class*="MuiCircularProgress"]').first();
  }

  /**
   * Get the form container
   */
  get formContainer(): Locator {
    return this.page.locator('form');
  }

  /**
   * Get the notification preferences section heading
   */
  get notificationPreferencesHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Notification Preferences' });
  }

  // ==================== Actions ====================

  /**
   * Fill in the first name field
   * @param firstName - The first name to enter
   */
  async fillFirstName(firstName: string): Promise<void> {
    await this.firstNameInput.clear();
    await this.firstNameInput.fill(firstName);
  }

  /**
   * Fill in the last name field
   * @param lastName - The last name to enter
   */
  async fillLastName(lastName: string): Promise<void> {
    await this.lastNameInput.clear();
    await this.lastNameInput.fill(lastName);
  }

  /**
   * Fill in the phone number field
   * @param phoneNumber - The phone number to enter
   */
  async fillPhoneNumber(phoneNumber: string): Promise<void> {
    await this.phoneNumberInput.clear();
    await this.phoneNumberInput.fill(phoneNumber);
  }

  /**
   * Click the save changes button
   */
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Update profile with provided data and submit the form
   * @param data - Partial profile data to update
   */
  async updateProfile(data: ProfileUpdateData): Promise<void> {
    if (data.firstName !== undefined) {
      await this.fillFirstName(data.firstName);
    }
    if (data.lastName !== undefined) {
      await this.fillLastName(data.lastName);
    }
    if (data.phoneNumber !== undefined) {
      await this.fillPhoneNumber(data.phoneNumber);
    }
    await this.clickSave();
  }

  /**
   * Get current profile data from the form
   * @returns The current profile form values
   */
  async getProfileData(): Promise<ProfileData> {
    const firstName = await this.firstNameInput.inputValue();
    const lastName = await this.lastNameInput.inputValue();
    const email = await this.emailInput.inputValue();
    const phoneNumber = await this.phoneNumberInput.inputValue();

    return {
      firstName,
      lastName,
      email,
      phoneNumber,
    };
  }

  /**
   * Toggle notification preference switch
   * @param type - The notification type ('email' or 'sms')
   * @param enabled - Whether to enable or disable the notification
   */
  async toggleNotifications(type: 'email' | 'sms', enabled: boolean): Promise<void> {
    const switchLocator = type === 'email' 
      ? this.emailNotificationsSwitch 
      : this.smsNotificationsSwitch;

    const isCurrentlyChecked = await switchLocator.isChecked();
    
    if (isCurrentlyChecked !== enabled) {
      await switchLocator.click();
    }
  }

  /**
   * Get current notification preferences
   * @returns The current notification preference states
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const emailNotifications = await this.emailNotificationsSwitch.isChecked();
    const smsNotifications = await this.smsNotificationsSwitch.isChecked();

    return {
      emailNotifications,
      smsNotifications,
    };
  }

  /**
   * Get validation error messages from the form
   * @returns Array of validation error messages
   */
  async getValidationErrors(): Promise<string[]> {
    const errors: string[] = [];

    // Look for MUI helper text with error state
    const helperTexts = this.page.locator('.MuiFormHelperText-root.Mui-error');
    const count = await helperTexts.count();

    for (let i = 0; i < count; i++) {
      const text = await helperTexts.nth(i).textContent();
      if (text) {
        errors.push(text);
      }
    }

    return errors;
  }

  /**
   * Get the success message from the snackbar
   * @returns The success message text, or null if not visible
   */
  async getSuccessMessage(): Promise<string | null> {
    try {
      // Wait for snackbar to appear
      await this.snackbarAlert.waitFor({ state: 'visible', timeout: 5000 });
      
      // Check if it's a success alert (green/success severity)
      const alertText = await this.snackbarAlert.textContent();
      if (alertText?.toLowerCase().includes('success') || 
          alertText?.toLowerCase().includes('updated')) {
        return alertText;
      }
      
      // Also check for success severity class
      const hasSuccessSeverity = await this.snackbarAlert.locator('.MuiAlert-colorSuccess, .MuiAlert-standardSuccess, .MuiAlert-filledSuccess').count() > 0;
      if (hasSuccessSeverity) {
        return alertText;
      }
      
      return null;
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
      // Try generic alert if specific error alert not found
      try {
        const alertText = await this.snackbarAlert.textContent();
        if (alertText?.toLowerCase().includes('failed') || alertText?.toLowerCase().includes('error')) {
          return alertText;
        }
      } catch {
        // No alert found
      }
      return null;
    }
  }

  /**
   * Wait for the save operation to complete
   * Waits for the button to stop showing loading state and for snackbar to appear
   * @param timeout - Optional timeout in milliseconds (default: 10000)
   */
  async waitForSave(timeout: number = 10000): Promise<void> {
    // Wait for the save button to be enabled again (not in loading state)
    await this.saveButton.waitFor({ state: 'visible', timeout });
    
    // Wait for the button to not be disabled (loading complete)
    await this.saveButton.waitFor({ state: 'attached', timeout });
    await this.page.waitForFunction(
      () => {
        // Find button by text content instead of :has-text pseudo-selector
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Save Changes')) {
            return !button.hasAttribute('disabled');
          }
        }
        return false;
      },
      { timeout }
    );

    // Wait for snackbar notification to appear
    try {
      await this.snackbarAlert.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Snackbar may not always appear, continue
    }
  }

  /**
   * Check if the save button is in loading state
   * @returns True if the button shows loading spinner
   */
  async isSaving(): Promise<boolean> {
    const isDisabled = await this.saveButton.isDisabled();
    return isDisabled;
  }

  /**
   * Check if the email field is disabled (as expected)
   * @returns True if the email field is disabled
   */
  async isEmailDisabled(): Promise<boolean> {
    return await this.emailInput.isDisabled();
  }

  /**
   * Wait for the profile form to be ready
   * Handles page load and ensures form elements are visible
   */
  async waitForForm(): Promise<void> {
    // Wait for page loading to complete
    try {
      await this.pageLoadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Spinner may have already disappeared
    }

    // Wait for form elements to be visible
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.lastNameInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.saveButton.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Wait for notification preferences to load
   * Waits for the loading spinner to disappear and switches to be visible
   */
  async waitForNotificationPreferences(): Promise<void> {
    await this.notificationPreferencesHeading.waitFor({ state: 'visible', timeout: 10000 });
    
    // Wait for preferences loading to complete (the "Loading preferences..." text should disappear)
    try {
      const loadingText = this.page.getByText('Loading preferences...');
      await loadingText.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Loading text may have already disappeared
    }
    
    // Small delay to ensure React state has updated
    await this.page.waitForTimeout(500);
    
    await this.emailNotificationsSwitch.waitFor({ state: 'visible', timeout: 5000 });
    await this.smsNotificationsSwitch.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Check if the profile form is displayed
   * @returns True if the profile form is visible
   */
  async isProfileFormVisible(): Promise<boolean> {
    try {
      const firstNameVisible = await this.firstNameInput.isVisible();
      const lastNameVisible = await this.lastNameInput.isVisible();
      const emailVisible = await this.emailInput.isVisible();
      return firstNameVisible && lastNameVisible && emailVisible;
    } catch {
      return false;
    }
  }

  /**
   * Check if the save button is enabled
   * @returns True if the save button is enabled
   */
  async isSaveEnabled(): Promise<boolean> {
    return await this.saveButton.isEnabled();
  }

  /**
   * Clear all editable form fields
   */
  async clearForm(): Promise<void> {
    await this.firstNameInput.clear();
    await this.lastNameInput.clear();
    await this.phoneNumberInput.clear();
  }

  /**
   * Close the snackbar notification if visible
   */
  async closeSnackbar(): Promise<void> {
    try {
      const closeButton = this.snackbarAlert.getByRole('button', { name: 'Close' });
      if (await closeButton.isVisible({ timeout: 1000 })) {
        await closeButton.click();
        await this.snackbarAlert.waitFor({ state: 'hidden', timeout: 3000 });
      }
    } catch {
      // Snackbar may have auto-closed or close button not found
    }
  }
}
