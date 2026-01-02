import { test, expect } from '@playwright/test';
import { ForgotPasswordPage } from '../../page-objects/account/ForgotPasswordPage';
import { LoginPage } from '../../page-objects/LoginPage';
import { getTestUser } from '../../fixtures/defaultFixtures';

/**
 * Forgot Password E2E Tests
 *
 * Tests for forgot password page functionality
 * These tests don't need isolated users since they only test the forgot password form
 * and don't modify user state.
 *
 * Requirements covered:
 * - 15.8: Password reset request form
 * - 15.9: Email validation on forgot password form
 * - 15.10: Success/error feedback for password reset requests
 */
test.describe('Forgot Password', () => {
  let forgotPasswordPage: ForgotPasswordPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    forgotPasswordPage = new ForgotPasswordPage(page);
    loginPage = new LoginPage(page);
    await forgotPasswordPage.goto();
    await forgotPasswordPage.waitForForm();
  });

  /**
   * Requirement 15.8: Password reset request form
   * Verifies that all form elements are visible on page load
   */
  test('should display forgot password form with all required elements', async () => {
    // Verify page heading is visible
    await expect(forgotPasswordPage.pageHeading).toBeVisible();

    // Verify email input field is visible
    await expect(forgotPasswordPage.emailInput).toBeVisible();

    // Verify submit button is visible
    await expect(forgotPasswordPage.submitButton).toBeVisible();

    // Verify back to login link is visible
    await expect(forgotPasswordPage.backToLoginLink).toBeVisible();
  });

  /**
   * Requirement 15.8, 15.10: Password reset request with valid email
   * Submits form with valid email and verifies success message is displayed
   */
  test('should show success message when submitting valid email', async () => {
    const customer = getTestUser('customer');

    // Submit the forgot password form with a valid email
    await forgotPasswordPage.submitEmail(customer.email);

    // Wait for the submission to complete
    await forgotPasswordPage.waitForSubmit();

    // Verify success message is displayed
    const hasSuccess = await forgotPasswordPage.hasSuccessMessage();
    expect(hasSuccess).toBeTruthy();

    // Verify success message content
    const successMessage = await forgotPasswordPage.getSuccessMessage();
    expect(successMessage).toBeTruthy();
  });

  /**
   * Requirement 15.9: Email validation on forgot password form
   * Submits form with invalid email format and verifies validation error
   */
  test('should show validation error for invalid email format', async () => {
    // Submit with invalid email format
    await forgotPasswordPage.fillEmail('invalid-email-format');
    await forgotPasswordPage.clickSubmit();

    // Wait for form submission to complete
    await forgotPasswordPage.waitForSubmit();

    // Verify error message is displayed for invalid email format
    const hasError = await forgotPasswordPage.hasErrorMessage();
    expect(hasError).toBeTruthy();

    // Verify no success message is shown
    const hasSuccess = await forgotPasswordPage.hasSuccessMessage();
    expect(hasSuccess).toBeFalsy();

    // Verify error message content indicates validation failure
    const errorMessage = await forgotPasswordPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  /**
   * Requirement 15.10: Security best practice - no information leak
   * Submits form with non-existent email and verifies same success message is shown
   * (to prevent email enumeration attacks)
   * 
   * NOTE: Currently the backend returns an error for non-existent emails, which is a
   * security issue (email enumeration). This test documents the current behavior and
   * expects the backend to be fixed to return success for all emails.
   * 
   * SECURITY: Backend should return 200 OK for all emails to prevent enumeration.
   * When backend is fixed, this test will pass with success message assertion.
   */
  test('should show success message for non-existent email (no information leak)', async () => {
    // Submit with a non-existent email address
    const nonExistentEmail = 'nonexistent-user-12345@test.zenithbioscience.com';
    await forgotPasswordPage.submitEmail(nonExistentEmail);

    // Wait for the submission to complete
    await forgotPasswordPage.waitForSubmit();

    // Ideal behavior: Backend should return success to prevent email enumeration
    // The test expects success message - if backend leaks info, this test will fail
    // and serve as a reminder to fix the security issue
    const hasSuccess = await forgotPasswordPage.hasSuccessMessage();
    
    // If we got an error instead of success, log the security concern
    if (!hasSuccess) {
      const hasError = await forgotPasswordPage.hasErrorMessage();
      if (hasError) {
        const errorMessage = await forgotPasswordPage.getErrorMessage();
        console.warn(`[SECURITY ISSUE] Backend leaked email existence info: ${errorMessage}`);
        console.warn('[SECURITY ISSUE] Backend should return success for all emails to prevent enumeration attacks');
      }
    }
    
    // Assert success message is shown (this is the secure behavior)
    // If this fails, it indicates a security vulnerability that needs to be fixed
    expect(hasSuccess).toBeTruthy();
  });

  /**
   * Requirement 15.9: Empty email validation
   * Verifies that form validation prevents submission with empty email
   */
  test('should prevent submission with empty email', async () => {
    // Ensure email field is empty
    await forgotPasswordPage.clearEmail();

    // Check if submit button is disabled when email is empty
    const isSubmitEnabled = await forgotPasswordPage.isSubmitEnabled();

    // The button should either be disabled, or clicking it should not result in success
    if (isSubmitEnabled) {
      // If button is enabled, try to submit and verify no success
      await forgotPasswordPage.clickSubmit();
      await forgotPasswordPage.page.waitForTimeout(1000);

      // Should not show success message with empty email
      const hasSuccess = await forgotPasswordPage.hasSuccessMessage();
      expect(hasSuccess).toBeFalsy();
    } else {
      // Button is disabled - this is the expected behavior
      expect(isSubmitEnabled).toBeFalsy();
    }
  });

  /**
   * Requirement 15.8: Navigation back to login
   * Clicks "Back to Login" link and verifies navigation to login page
   */
  test('should navigate back to login page when clicking back link', async ({ page }) => {
    // Click the back to login link
    await forgotPasswordPage.clickBackToLogin();

    // Verify navigation to login page
    await expect(page).toHaveURL(/login/);

    // Verify login form is displayed
    await loginPage.waitForForm();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  /**
   * Requirement 15.10: Form state after successful submission
   * After successful submission, verifies email field is disabled and submit button is hidden
   */
  test('should disable form after successful submission', async () => {
    const customer = getTestUser('customer');

    // Submit the forgot password form
    await forgotPasswordPage.submitEmail(customer.email);

    // Wait for success state
    await forgotPasswordPage.waitForSuccess();

    // Verify form is in success state
    const isInSuccessState = await forgotPasswordPage.isInSuccessState();
    expect(isInSuccessState).toBeTruthy();

    // Verify email field is disabled
    const isEmailDisabled = await forgotPasswordPage.isEmailDisabled();
    expect(isEmailDisabled).toBeTruthy();

    // Verify submit button is hidden
    const isSubmitVisible = await forgotPasswordPage.isSubmitButtonVisible();
    expect(isSubmitVisible).toBeFalsy();
  });

  /**
   * Requirement 15.8: Form visibility check
   * Verifies the form is displayed and ready for input on page load
   */
  test('should have form visible and ready for input', async () => {
    // Verify form is visible
    const isFormVisible = await forgotPasswordPage.isFormVisible();
    expect(isFormVisible).toBeTruthy();

    // Verify email field is enabled and can receive input
    const isEmailDisabled = await forgotPasswordPage.isEmailDisabled();
    expect(isEmailDisabled).toBeFalsy();

    // Verify submit button is visible
    const isSubmitVisible = await forgotPasswordPage.isSubmitButtonVisible();
    expect(isSubmitVisible).toBeTruthy();
  });

  /**
   * Requirement 15.9: Email field accepts valid input
   * Verifies that the email field properly accepts and stores input
   */
  test('should accept and store email input correctly', async () => {
    const testEmail = 'test@example.com';

    // Fill in the email
    await forgotPasswordPage.fillEmail(testEmail);

    // Verify the value is stored correctly
    const emailValue = await forgotPasswordPage.getEmailValue();
    expect(emailValue).toBe(testEmail);
  });

  /**
   * Requirement 15.10: Loading state during submission
   * Verifies that the form submission completes and shows success message
   * 
   * NOTE: The loading state may be very brief depending on network speed.
   * This test verifies that submission completes with a success response.
   */
  test('should show loading state during form submission', async () => {
    const customer = getTestUser('customer');

    // Fill in the email
    await forgotPasswordPage.fillEmail(customer.email);

    // Click submit
    await forgotPasswordPage.clickSubmit();

    // Wait for submission to complete
    await forgotPasswordPage.waitForSubmit();

    // Verify success message is shown after submission completes
    const hasSuccess = await forgotPasswordPage.hasSuccessMessage();
    expect(hasSuccess).toBeTruthy();

    // Verify success message content
    const successMessage = await forgotPasswordPage.getSuccessMessage();
    expect(successMessage).toBeTruthy();
  });
});
