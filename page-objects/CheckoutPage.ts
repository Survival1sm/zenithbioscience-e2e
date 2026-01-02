import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Shipping address data interface
 */
export interface ShippingAddressData {
  firstName: string;
  lastName: string;
  email: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phoneNumber: string;
}

/**
 * Payment method types
 */
export type PaymentMethodType = 'solana-pay' | 'cashapp' | 'zelle' | 'ach' | 'credit-card';

/**
 * CheckoutPage Page Object
 * Handles checkout flow interactions including shipping info, payment selection, and order placement
 *
 * Based on actual frontend implementation:
 * - Checkout page: zenithbioscience-next/src/app/checkout/CheckoutPageClient.tsx
 * - CheckoutForm: zenithbioscience-next/src/app/_components/checkout/CheckoutForm.tsx
 * - PaymentMethodSelector: zenithbioscience-next/src/app/_components/checkout/PaymentMethodSelector.tsx
 * - OrderSummary: zenithbioscience-next/src/app/_components/checkout/OrderSummary.tsx
 *
 * Requirements covered:
 * - 5.1: Checkout flow with shipping and payment
 * - 5.2: Address validation
 * - 5.3: Payment method selection
 * - 5.4: Order placement
 * - 5.5: Order confirmation
 * - 5.6: Order history
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 */
export class CheckoutPage extends BasePage {
  readonly path = '/checkout';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /** Page heading - "Checkout" h1 */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Checkout', level: 1 });
  }

  /** Back to Cart button */
  get backToCartButton(): Locator {
    // The link has aria-label "Return to shopping cart" and text "← Back to Cart"
    return this.page.getByRole('link', { name: /return to shopping cart|back to cart/i });
  }

  /** Stepper component */
  get stepper(): Locator {
    return this.page.locator('.MuiStepper-root');
  }

  /** Get step label by name */
  getStepLabel(stepName: string): Locator {
    return this.page.locator('.MuiStepLabel-label', { hasText: new RegExp(stepName, 'i') });
  }

  // ==================== Shipping Form Locators ====================

  /** Checkout form - data-testid="checkout-form" */
  get checkoutForm(): Locator {
    return this.page.locator('[data-testid="checkout-form"]');
  }

  /** First name input */
  get firstNameInput(): Locator {
    return this.page.getByRole('textbox', { name: 'First Name' });
  }

  /** Last name input */
  get lastNameInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Last Name' });
  }

  /** Email input */
  get emailInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Email Address' });
  }

  /** Address line 1 input */
  get address1Input(): Locator {
    return this.page.getByRole('textbox', { name: 'Address Line 1' });
  }

  /** Address line 2 input */
  get address2Input(): Locator {
    return this.page.getByRole('textbox', { name: /Address Line 2/i });
  }

  /** City input */
  get cityInput(): Locator {
    return this.page.getByRole('textbox', { name: 'City' });
  }

  /** State input/select */
  get stateInput(): Locator {
    return this.page.getByRole('textbox', { name: 'State' });
  }

  /** ZIP code input */
  get zipInput(): Locator {
    return this.page.getByRole('textbox', { name: /ZIP.*Postal Code/i });
  }

  /** Country select */
  get countrySelect(): Locator {
    return this.page.getByLabel('Country');
  }

  /** Phone number input */
  get phoneInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Phone Number' });
  }

  /** Research acknowledgment box - data-testid="research-acknowledgment-box" */
  get researchAcknowledgmentBox(): Locator {
    return this.page.locator('[data-testid="research-acknowledgment-box"]');
  }

  /** Research acknowledgment checkbox */
  get researchAcknowledgmentCheckbox(): Locator {
    return this.researchAcknowledgmentBox.getByRole('checkbox');
  }

  /** Continue to Payment button */
  get continueToPaymentButton(): Locator {
    return this.page.getByRole('button', { name: /continue to payment/i });
  }

  // ==================== Payment Method Locators ====================

  /** Payment method radio group */
  get paymentMethodRadioGroup(): Locator {
    return this.page.getByRole('radiogroup', { name: 'payment-method' });
  }

  /** Get payment method option by type */
  getPaymentMethodOption(type: PaymentMethodType): Locator {
    const labels: Record<PaymentMethodType, string> = {
      'solana-pay': 'Solana Pay',
      'cashapp': 'CashApp',
      'zelle': 'Zelle',
      'ach': 'ACH',
      'credit-card': 'Credit Card'
    };
    return this.page.getByRole('radio', { name: new RegExp(labels[type], 'i') });
  }

  /** Solana Pay selector */
  get solanaPaySelector(): Locator {
    return this.page.locator('[data-testid="solana-pay-selector"]');
  }

  /** CashApp payment form */
  get cashAppForm(): Locator {
    return this.page.locator('[data-testid="cashapp-payment-form"]');
  }

  // ==================== Order Summary Locators ====================

  /** Order summary - find by heading text since data-testid may not be present */
  get orderSummary(): Locator {
    // Try data-testid first, fallback to finding by heading
    return this.page.locator('[data-testid="order-summary"], h6:has-text("Order Summary")').first().locator('..');
  }

  /** Order summary container - data-testid="checkout-order-summary-container" */
  get orderSummaryContainer(): Locator {
    return this.page.locator('[data-testid="checkout-order-summary-container"]');
  }

  /** Mobile order summary toggle - data-testid="order-summary-toggle" */
  get orderSummaryToggle(): Locator {
    return this.page.locator('[data-testid="order-summary-toggle"]');
  }

  /** RUO consent checkbox (on review step) */
  get ruoConsentCheckbox(): Locator {
    return this.orderSummary.getByRole('checkbox');
  }

  /** CashApp continue button */
  get cashAppContinueButton(): Locator {
    return this.page.getByRole('button', { name: /continue with cashapp/i });
  }

  /** Solana Pay continue button */
  get solanaPayContinueButton(): Locator {
    return this.page.getByRole('button', { name: /continue to review/i });
  }

  /** Complete Order button (in OrderSummary on review step) */
  get completeOrderButton(): Locator {
    return this.page.getByRole('button', { name: /complete order/i });
  }

  /** Coupon input */
  get couponInput(): Locator {
    return this.page.getByLabel(/coupon/i);
  }

  /** Apply coupon button */
  get applyCouponButton(): Locator {
    return this.page.getByRole('button', { name: /apply/i });
  }

  // ==================== Navigation Methods ====================

  /**
   * Wait for the checkout page to be ready
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for page heading or stepper to appear
    await Promise.race([
      this.pageHeading.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      this.stepper.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    ]);
  }

  /**
   * Get the current active step (0-indexed)
   */
  async getCurrentStep(): Promise<number> {
    // Find the active step by looking for the step with active styling
    const steps = this.page.locator('.MuiStep-root');
    const count = await steps.count();
    
    for (let i = 0; i < count; i++) {
      const step = steps.nth(i);
      const isActive = await step.locator('.Mui-active').count() > 0;
      if (isActive) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Check if we're on mobile view
   */
  async isMobileView(): Promise<boolean> {
    return await this.orderSummaryToggle.isVisible();
  }

  // ==================== Shipping Form Methods ====================

  /**
   * Fill the shipping address form
   */
  async fillShippingAddress(address: ShippingAddressData): Promise<void> {
    // Wait for form to be visible
    await this.checkoutForm.waitFor({ state: 'visible', timeout: 10000 });

    // Fill form fields
    if (address.firstName) {
      await this.firstNameInput.fill(address.firstName);
    }
    if (address.lastName) {
      await this.lastNameInput.fill(address.lastName);
    }
    if (address.email) {
      await this.emailInput.fill(address.email);
    }
    if (address.address1) {
      await this.address1Input.fill(address.address1);
    }
    if (address.address2) {
      await this.address2Input.fill(address.address2);
    }
    if (address.city) {
      await this.cityInput.fill(address.city);
    }
    if (address.state) {
      await this.stateInput.fill(address.state);
    }
    if (address.zip) {
      await this.zipInput.fill(address.zip);
    }
    if (address.phoneNumber) {
      await this.phoneInput.fill(address.phoneNumber);
    }
  }

  /**
   * Check the research acknowledgment checkbox
   */
  async acknowledgeResearchUse(): Promise<void> {
    const checkbox = this.researchAcknowledgmentCheckbox;
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
  }

  /**
   * Submit shipping form and proceed to payment
   */
  async proceedToPayment(): Promise<void> {
    await this.acknowledgeResearchUse();
    
    // Wait for button to be visible and enabled
    await this.continueToPaymentButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Wait for button to become enabled (form validation complete)
    await expect(this.continueToPaymentButton).toBeEnabled({ timeout: 5000 }).catch(() => {});
    
    await this.continueToPaymentButton.click();
    
    // Handle address verification dialog if it appears
    const useOriginalButton = this.page.getByRole('button', { name: /use original|use my address/i });
    const useVerifiedButton = this.page.getByRole('button', { name: /use verified|use suggested/i });
    
    // Check if verification dialog appeared (with reasonable timeout)
    if (await useOriginalButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click "Use Original" to proceed with the entered address
      await useOriginalButton.click();
      // Wait for dialog to close
      await useOriginalButton.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    } else if (await useVerifiedButton.isVisible({ timeout: 500 }).catch(() => false)) {
      // Click "Use Verified" if that's the option
      await useVerifiedButton.click();
      // Wait for dialog to close
      await useVerifiedButton.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    
    // Wait for payment step to load by checking for payment method elements
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ==================== Payment Method Methods ====================

  /**
   * Check if any payment methods are available (backend API returned methods)
   * Uses retry logic to handle timing issues where payment methods may still be loading
   */
  async arePaymentMethodsAvailable(): Promise<boolean> {
    // Check for the "No payment methods" error message
    const noMethodsError = this.page.locator('text=No payment methods are currently available');
    const loadError = this.page.locator('text=Unable to load payment methods');
    
    const hasNoMethodsError = await noMethodsError.isVisible({ timeout: 1000 }).catch(() => false);
    const hasLoadError = await loadError.isVisible({ timeout: 1000 }).catch(() => false);
    
    if (!hasNoMethodsError && !hasLoadError) {
      // Also verify that at least one payment method option is visible
      const paymentOptions = this.page.locator('[data-testid="payment-method-option"], [role="radio"][name*="payment"], input[type="radio"][name*="payment"]');
      const hasPaymentOptions = await paymentOptions.first().isVisible({ timeout: 1000 }).catch(() => false);
      
      if (hasPaymentOptions) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Wait for payment methods to load with detailed error reporting
   * Throws an error if payment methods don't load within timeout
   */
  async waitForPaymentMethods(timeoutMs: number = 15000): Promise<void> {
    // Wait for payment options to appear using Playwright's built-in retry
    const paymentOptions = this.page.locator('[data-testid="payment-method-option"], [role="radio"][name*="payment"], input[type="radio"][name*="payment"]');
    
    try {
      await paymentOptions.first().waitFor({ state: 'visible', timeout: timeoutMs });
      return;
    } catch {
      // If we get here, payment methods didn't load - capture diagnostic info
      const noMethodsError = this.page.locator('text=No payment methods are currently available');
      const loadError = this.page.locator('text=Unable to load payment methods');
      
      const hasNoMethodsError = await noMethodsError.isVisible({ timeout: 500 }).catch(() => false);
      const hasLoadError = await loadError.isVisible({ timeout: 500 }).catch(() => false);
      
      let errorMessage = 'Payment methods did not load within timeout.';
      if (hasNoMethodsError) {
        errorMessage += ' Backend returned no payment methods - check payment configuration.';
      }
      if (hasLoadError) {
        errorMessage += ' Failed to load payment methods from backend - check API connectivity.';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Select a payment method (without auto-proceeding)
   */
  async selectPaymentMethodOnly(type: PaymentMethodType): Promise<void> {
    const option = this.getPaymentMethodOption(type);
    await option.click();
    // Wait for the payment option to be checked/selected
    await expect(option).toBeChecked({ timeout: 5000 }).catch(() => {});
  }

  /**
   * Select a payment method and proceed to review step
   */
  async selectPaymentMethod(type: PaymentMethodType): Promise<void> {
    // Wait for order total to be non-zero before selecting payment method
    // This ensures the checkout preview has loaded
    const totalRow = this.page.locator('li').filter({ hasText: /^Total/ });
    const totalHeading = totalRow.locator('h6');
    
    // Use expect with polling to wait for total to be non-zero
    await expect(async () => {
      const totalText = await totalHeading.textContent().catch(() => null);
      const total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');
      expect(total).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });
    
    await this.selectPaymentMethodOnly(type);
    
    // For CashApp, click the continue button to proceed to review
    if (type === 'cashapp') {
      // Wait for the CashApp form to load and show the continue button
      await this.cashAppContinueButton.waitFor({ state: 'visible', timeout: 15000 });
      await this.cashAppContinueButton.click();
      // Wait for review step to load
      await this.completeOrderButton.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    }
  }

  /**
   * Check if a payment method is available
   */
  async isPaymentMethodAvailable(type: PaymentMethodType): Promise<boolean> {
    const option = this.getPaymentMethodOption(type);
    return await option.isEnabled();
  }

  // ==================== Order Review Methods ====================

  /**
   * Check the RUO consent checkbox on review step
   */
  async acceptRuoConsent(): Promise<void> {
    // The RUO consent checkbox is in the OrderSummary component
    const checkbox = this.page.getByRole('checkbox').filter({ hasText: /21 or older|research use only/i });
    const isVisible = await checkbox.isVisible().catch(() => false);
    
    if (isVisible && !(await checkbox.isChecked())) {
      await checkbox.check();
    } else {
      // Try alternative selector - checkbox near the text
      const altCheckbox = this.page.locator('label:has-text("21 or older") input[type="checkbox"], label:has-text("research use only") input[type="checkbox"]');
      if (await altCheckbox.isVisible()) {
        if (!(await altCheckbox.isChecked())) {
          await altCheckbox.check();
        }
      }
    }
  }

  /**
   * Complete the order
   */
  async completeOrder(): Promise<void> {
    // First accept RUO consent
    await this.acceptRuoConsent();
    // Wait for checkbox to be checked
    const checkbox = this.page.getByRole('checkbox').filter({ hasText: /21 or older|research use only/i });
    await expect(checkbox).toBeChecked({ timeout: 3000 }).catch(() => {});
    
    // Then click Complete Order
    await this.completeOrderButton.click();
    // Wait for order processing by checking for navigation or confirmation
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get the order total from the summary
   */
  async getOrderTotal(): Promise<number> {
    // The order summary structure is:
    // listitem > generic "Total" + heading "$XX.XX"
    // Find the Total listitem and get the heading value
    const totalListItem = this.page.locator('li').filter({ hasText: /^Total/ });
    const totalHeading = totalListItem.locator('h6');
    
    // Wait for the element to be visible
    await totalHeading.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    
    const totalText = await totalHeading.textContent().catch(() => null);
    if (totalText) {
      return this.parsePrice(totalText);
    }
    
    // Fallback: try to find any heading with a dollar amount in the order summary area
    const orderSummaryArea = this.page.locator('h6:has-text("Order Summary")').locator('..').locator('..');
    const priceHeadings = orderSummaryArea.locator('h6').filter({ hasText: /^\$/ });
    const lastPrice = await priceHeadings.last().textContent().catch(() => null);
    
    return this.parsePrice(lastPrice || '0');
  }

  /**
   * Apply a coupon code
   */
  async applyCoupon(code: string): Promise<void> {
    await this.couponInput.fill(code);
    await this.applyCouponButton.click();
    // Wait for coupon validation response by checking for success or error alert
    const successAlert = this.page.locator('.MuiAlert-standardSuccess');
    const errorAlert = this.page.locator('.MuiAlert-standardError');
    await Promise.race([
      successAlert.waitFor({ state: 'visible', timeout: 10000 }),
      errorAlert.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});
  }

  /**
   * Parse a price string to a number
   */
  private parsePrice(priceText: string): number {
    const cleanedPrice = priceText.replace(/[^0-9.]/g, '');
    return parseFloat(cleanedPrice) || 0;
  }

  // ==================== Full Checkout Flow Methods ====================

  /**
   * Complete the full checkout flow with given address and payment method
   */
  async completeCheckoutFlow(
    address: ShippingAddressData,
    paymentMethod: PaymentMethodType = 'cashapp'
  ): Promise<void> {
    // Step 1: Fill shipping info
    await this.fillShippingAddress(address);
    await this.proceedToPayment();

    // Step 2: Select payment method
    await this.selectPaymentMethod(paymentMethod);
    
    // For CashApp, the form auto-proceeds to review
    // Wait for review step to be ready
    await this.completeOrderButton.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    // Step 3: Complete order
    await this.completeOrder();
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert checkout page is displayed
   */
  async assertCheckoutPageDisplayed(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
    await expect(this.stepper).toBeVisible();
  }

  /**
   * Assert we're on the shipping step
   */
  async assertOnShippingStep(): Promise<void> {
    await expect(this.checkoutForm).toBeVisible();
  }

  /**
   * Assert we're on the payment step
   */
  async assertOnPaymentStep(): Promise<void> {
    // Wait for payment step heading or payment method options
    await Promise.race([
      this.page.getByText('Payment Method').first().waitFor({ state: 'visible', timeout: 10000 }),
      this.page.getByText('Select Payment Method').waitFor({ state: 'visible', timeout: 10000 }),
      this.paymentMethodRadioGroup.waitFor({ state: 'visible', timeout: 10000 }),
    ]);
  }

  /**
   * Assert we're on the review step
   */
  async assertOnReviewStep(): Promise<void> {
    await expect(this.completeOrderButton).toBeVisible();
  }
}
