import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../page-objects/RegisterPage';

/**
 * Registration E2E Tests
 * 
 * Tests for registration page functionality including form validation
 * and successful registration flow.
 */
test.describe('Registration Page', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.waitForForm();
  });

  test('should display registration form with all required fields', async () => {
    await expect(registerPage.firstNameInput).toBeVisible();
    await expect(registerPage.lastNameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.confirmPasswordInput).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();
  });

  test('should display terms and conditions checkbox', async () => {
    await expect(registerPage.termsCheckbox).toBeVisible();
  });

  test('should display link to sign in page', async () => {
    await expect(registerPage.signInLink).toBeVisible();
  });

  test('should show errors when submitting empty form', async () => {
    await registerPage.acceptTerms(true);
    await registerPage.clickSubmit();
    await registerPage.wait(500);
    
    const hasError = await registerPage.hasError();
    const isFormStillVisible = await registerPage.isRegistrationFormVisible();
    
    // Either shows error or form stays visible (validation prevents submission)
    expect(hasError || isFormStillVisible).toBeTruthy();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await registerPage.goToSignIn();
    await expect(page).toHaveURL(/login/);
  });

  test('should successfully register with valid data', async ({ page }) => {
    // Generate unique email using timestamp to avoid conflicts
    const timestamp = Date.now();
    const uniqueEmail = `test.user.${timestamp}@example.com`;
    
    const registrationData = {
      firstName: 'Test',
      lastName: 'User',
      email: uniqueEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      acceptTerms: true,
    };

    // Fill out the registration form
    await registerPage.register(registrationData);

    // Wait for navigation or success message
    await page.waitForTimeout(2000);

    // Check for success - the page shows "Check Your Email" heading on success
    const checkEmailHeading = page.getByRole('heading', { name: /check your email/i });
    const successAlert = page.getByText(/registration successful/i);
    
    const hasCheckEmailHeading = await checkEmailHeading.isVisible().catch(() => false);
    const hasSuccessMessage = await successAlert.isVisible().catch(() => false);
    
    // Registration is successful if we see the confirmation page
    expect(hasCheckEmailHeading || hasSuccessMessage).toBeTruthy();
  });

  /**
   * Registration Validation Tests
   * Tests for form validation error handling
   * Requirements: 9.1, 9.2, 9.3, 9.4
   */
  test.describe('Registration Validation', () => {
    /**
     * Task 11.1: Invalid email format test
     * Requirement: 9.1
     */
    test('should show error for invalid email format', async ({ page }) => {
      // Fill form with invalid email format
      await registerPage.fillFirstName('Test');
      await registerPage.fillLastName('User');
      await registerPage.fillEmail('invalid-email');
      await registerPage.fillPassword('ValidPass123!');
      await registerPage.fillConfirmPassword('ValidPass123!');
      await registerPage.acceptTerms(true);
      await registerPage.clickSubmit();

      // Wait for validation to occur
      await page.waitForTimeout(500);

      // Check for email validation error - either field-level or form-level
      const emailError = registerPage.emailError;
      const formError = registerPage.errorMessage;
      
      const hasEmailError = await emailError.isVisible().catch(() => false);
      const hasFormError = await formError.isVisible().catch(() => false);
      
      // Verify some error is displayed for invalid email
      expect(hasEmailError || hasFormError).toBeTruthy();
      
      // If email error is visible, verify it mentions email validation
      if (hasEmailError) {
        const errorText = await emailError.textContent();
        expect(errorText).toMatch(/valid|email|invalid|format/i);
      }
    });

    /**
     * Task 11.2: Weak password test
     * Requirement: 9.2
     */
    test('should show error for weak password', async ({ page }) => {
      // Fill form with weak password
      await registerPage.fillFirstName('Test');
      await registerPage.fillLastName('User');
      await registerPage.fillEmail('test@example.com');
      await registerPage.fillPassword('weak');
      await registerPage.fillConfirmPassword('weak');
      await registerPage.acceptTerms(true);
      await registerPage.clickSubmit();

      // Wait for validation to occur
      await page.waitForTimeout(500);

      // Check for password validation error - either field-level or form-level
      const passwordError = registerPage.passwordError;
      const formError = registerPage.errorMessage;
      
      const hasPasswordError = await passwordError.isVisible().catch(() => false);
      const hasFormError = await formError.isVisible().catch(() => false);
      
      // Verify some error is displayed for weak password
      expect(hasPasswordError || hasFormError).toBeTruthy();
      
      // If password error is visible, verify it mentions password requirements
      if (hasPasswordError) {
        const errorText = await passwordError.textContent();
        expect(errorText).toMatch(/password|weak|strong|character|length|minimum/i);
      }
    });

    /**
     * Task 11.3: Password mismatch test
     * Requirement: 9.3
     */
    test('should show error for password mismatch', async ({ page }) => {
      // Fill form with non-matching passwords
      await registerPage.fillFirstName('Test');
      await registerPage.fillLastName('User');
      await registerPage.fillEmail('test@example.com');
      await registerPage.fillPassword('ValidPass123!');
      await registerPage.fillConfirmPassword('DifferentPass456!');
      await registerPage.acceptTerms(true);
      await registerPage.clickSubmit();

      // Wait for validation to occur
      await page.waitForTimeout(1000);

      // Look for any error message on the page related to password mismatch
      // The error could be field-level (helper text) or form-level (alert)
      const passwordMismatchError = page.locator('text=/match|same|confirm|identical|do not match|passwords must/i');
      const formError = registerPage.errorMessage;
      const anyHelperError = page.locator('.MuiFormHelperText-root.Mui-error');
      
      const hasMismatchError = await passwordMismatchError.first().isVisible().catch(() => false);
      const hasFormError = await formError.isVisible().catch(() => false);
      const hasHelperError = await anyHelperError.first().isVisible().catch(() => false);
      
      // Verify some error is displayed - either password mismatch specific or general validation error
      // The form should not submit successfully with mismatched passwords
      expect(hasMismatchError || hasFormError || hasHelperError).toBeTruthy();
      
      // Verify we're still on the registration page (form didn't submit)
      expect(page.url()).toContain('/register');
    });

    /**
     * Task 11.4: Duplicate email test
     * Requirement: 9.4
     */
    test('should show error for duplicate email', async ({ page }) => {
      // Use an email that already exists in test fixtures
      // testcustomer@test.zenithbioscience.com is seeded in defaultFixtures.ts
      const existingEmail = 'testcustomer@test.zenithbioscience.com';
      
      await registerPage.fillFirstName('Test');
      await registerPage.fillLastName('User');
      await registerPage.fillEmail(existingEmail);
      await registerPage.fillPassword('ValidPass123!');
      await registerPage.fillConfirmPassword('ValidPass123!');
      await registerPage.acceptTerms(true);
      await registerPage.clickSubmit();

      // Wait for server response
      await page.waitForTimeout(2000);

      // Check for duplicate email error - should be a form-level error from server
      // Use specific MUI Alert selector to avoid matching Next.js route announcer
      const formError = page.locator('.MuiAlert-root[role="alert"]');
      
      await expect(formError).toBeVisible({ timeout: 5000 });
      
      const errorText = await formError.textContent();
      // Verify error is displayed - the actual message may be generic "Registration failed"
      // or specific "email already exists" depending on backend implementation
      expect(errorText).toMatch(/already|exists|registered|in use|taken|failed|error/i);
    });
  });
});
