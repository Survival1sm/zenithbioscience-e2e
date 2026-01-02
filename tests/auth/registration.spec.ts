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
});
