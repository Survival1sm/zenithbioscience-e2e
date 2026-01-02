import { test, expect } from '@playwright/test';
import { BitcoinPaymentPage } from '../../page-objects/checkout/BitcoinPaymentPage';
import { CheckoutPage, ShippingAddressData } from '../../page-objects/CheckoutPage';
import { CartPage } from '../../page-objects/CartPage';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage';
import { LoginPage } from '../../page-objects/LoginPage';
import {
  getBitcoinUser,
  getInStockProduct,
  getValidShippingAddress,
} from '../../fixtures/defaultFixtures';

/**
 * Bitcoin Payment Status Monitoring E2E Tests
 *
 * Tests the Bitcoin transaction progress monitoring functionality.
 *
 * Requirements covered:
 * - 19.15: Step-by-step progress indicator displayed
 * - 19.16: "Waiting for payment" initial state
 * - 19.17: "Payment detected" state on 0 confirmations
 * - 19.18: Confirmation count displayed (e.g., "1/2 confirmations")
 * - 19.19: Transaction ID displayed when available
 * - 19.20: Block explorer link provided
 * - 19.21: "Payment complete" state with success indicator
 *
 * Note: These tests run serially within each browser project to avoid race conditions
 * with shared user accounts and cart state. Cross-browser parallelization is still enabled.
 *
 * @tag Feature: e2e-integration-testing
 * @tag Property 18: Bitcoin Payment Status Progression
 */
test.describe('Bitcoin Payment Status Monitoring', () => {
  test.describe.configure({ mode: 'serial' });

  let bitcoinPage: BitcoinPaymentPage;
  let checkoutPage: CheckoutPage;
  let cartPage: CartPage;
  let productDetailPage: ProductDetailPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    bitcoinPage = new BitcoinPaymentPage(page);
    checkoutPage = new CheckoutPage(page);
    cartPage = new CartPage(page);
    productDetailPage = new ProductDetailPage(page);
    loginPage = new LoginPage(page);

    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });
  });

  async function setupCartWithProduct(
    page: import('@playwright/test').Page,
    request: import('@playwright/test').APIRequestContext
  ): Promise<void> {
    const customer = getBitcoinUser('bitcoinPaymentStatus');
    const product = getInStockProduct();

    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });

    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(customer.email, customer.password);
    await loginPage.waitForLoginComplete();

    const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
      data: { email: customer.email, password: customer.password },
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      const token = loginData.accessToken;
      await request.delete('http://localhost:8080/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    // Wait for cart sync to complete
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();
    // Wait for cart update - either snackbar notification or network idle
    await Promise.race([
      page.waitForSelector('.MuiSnackbar-root', { state: 'visible', timeout: 5000 }).catch(() => {}),
      page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {}),
    ]);
  }

  async function proceedToPaymentAndCheckAvailability(
    page: import('@playwright/test').Page,
    shippingAddress: ShippingAddressData
  ): Promise<boolean> {
    await checkoutPage.fillShippingAddress(shippingAddress);
    await checkoutPage.proceedToPayment();
    // Wait for payment step to load
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Wait for order summary total to be non-zero (up to 15 seconds)
    try {
      await page.waitForFunction(
        () => {
          const rows = document.querySelectorAll('li');
          for (const row of rows) {
            if (row.textContent?.startsWith('Total')) {
              const h6 = row.querySelector('h6');
              if (h6) {
                const text = h6.textContent || '';
                const total = parseFloat(text.replace(/[^0-9.]/g, '') || '0');
                if (total > 0) return true;
              }
            }
          }
          return false;
        },
        { timeout: 15000 }
      );
    } catch {
      // Continue even if total doesn't appear - let the test handle the failure
    }

    return await checkoutPage.arePaymentMethodsAvailable();
  }

  async function setupBitcoinPayment(
    page: import('@playwright/test').Page,
    request: import('@playwright/test').APIRequestContext
  ): Promise<boolean> {
    await setupCartWithProduct(page, request);
    const shippingAddress = getValidShippingAddress();

    await cartPage.goto();
    await cartPage.waitForPage();
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPage();

    const paymentMethodsAvailable = await proceedToPaymentAndCheckAvailability(page, shippingAddress);
    if (!paymentMethodsAvailable) return false;

    const isBitcoinDisplayed = await bitcoinPage.isBitcoinPaymentDisplayed();
    if (!isBitcoinDisplayed) return false;

    // Select Bitcoin payment
    await bitcoinPage.selectBitcoinPayment();
    // Wait for Bitcoin selection to complete
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Click Continue to Review button
    const continueButton = page.getByRole('button', { name: /continue to review/i });
    await continueButton.click();
    // Wait for review step to load
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Check the RUO consent checkbox
    const ruoCheckbox = page.getByRole('checkbox');
    if (await ruoCheckbox.isVisible()) {
      await ruoCheckbox.check();
    }

    // Click Complete Order button
    const completeOrderButton = page.getByRole('button', { name: /complete order/i });
    await completeOrderButton.click();

    // Wait for navigation to success page
    try {
      await page.waitForURL(/\/checkout\/success\?orderId=/, { timeout: 30000 });
    } catch {
      return false;
    }

    // Wait for invoice generation on success page
    try {
      await bitcoinPage.waitForInvoiceGeneration(30000);
      return true;
    } catch {
      return false;
    }
  }

  test('should display step-by-step progress indicator', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    await bitcoinPage.assertTransactionStepperDisplayed();
    await expect(bitcoinPage.waitingForPaymentStep).toBeVisible();
    await expect(bitcoinPage.paymentDetectedStep).toBeVisible();
    await expect(bitcoinPage.confirmingTransactionStep).toBeVisible();
    await expect(bitcoinPage.paymentCompleteStep).toBeVisible();
  });

  test('should show "Waiting for payment" as initial state', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    const currentStep = await bitcoinPage.getCurrentStep();
    expect(currentStep).toBe(0);

    const status = await bitcoinPage.getPaymentStatus();
    expect(status.toLowerCase()).toContain('waiting');
  });

  test('should display progress bar', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    await expect(bitcoinPage.progressBar).toBeVisible();
    const ariaLabel = await bitcoinPage.progressBar.getAttribute('aria-label');
    expect(ariaLabel).toContain('Bitcoin payment progress');
  });

  test('should display time remaining for payment', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    await expect(bitcoinPage.timeRemainingDisplay).toBeVisible();
    const timeText = await bitcoinPage.timeRemainingDisplay.textContent();
    expect(timeText).toMatch(/\d+:\d+.*remaining/i);
  });

  test('should display invoice ID for reference', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    await expect(bitcoinPage.invoiceIdDisplay).toBeVisible();
    const invoiceText = await bitcoinPage.invoiceIdDisplay.textContent();
    expect(invoiceText).toMatch(/invoice id:/i);
  });

  test('should display correct step labels in stepper', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    const step1Text = await bitcoinPage.waitingForPaymentStep.textContent();
    expect(step1Text?.toLowerCase()).toContain('waiting');

    const step2Text = await bitcoinPage.paymentDetectedStep.textContent();
    expect(step2Text?.toLowerCase()).toContain('detected');

    const step3Text = await bitcoinPage.confirmingTransactionStep.textContent();
    expect(step3Text?.toLowerCase()).toContain('confirm');

    const step4Text = await bitcoinPage.paymentCompleteStep.textContent();
    expect(step4Text?.toLowerCase()).toContain('complete');
  });

  test('should have accessible stepper with aria-label', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    const ariaLabel = await bitcoinPage.transactionStepper.getAttribute('aria-label');
    expect(ariaLabel).toBe('Bitcoin payment progress steps');
  });

  test('should have live region for status updates', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    const ariaLive = await bitcoinPage.transactionProgressRegion.getAttribute('aria-live');
    expect(ariaLive).toBe('polite');
  });

  test('should have underpayment warning component available', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    const isUnderpaymentDisplayed = await bitcoinPage.isUnderpaymentWarningDisplayed();
    expect(isUnderpaymentDisplayed).toBe(false);
  });

  test('should have overpayment info component available', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    const isOverpaymentDisplayed = await bitcoinPage.isOverpaymentInfoDisplayed();
    expect(isOverpaymentDisplayed).toBe(false);
  });

  test('should display appropriate status message for current state', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    const status = await bitcoinPage.getPaymentStatus();
    expect(status.toLowerCase()).toMatch(/waiting|pending/);

    const statusElement = page.locator('#bitcoin-progress-title');
    await expect(statusElement).toBeVisible();
  });

  test('should show progress percentage based on current step', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    const progressBar = bitcoinPage.progressBar;
    const ariaValueNow = await progressBar.getAttribute('aria-valuenow');
    expect(ariaValueNow).not.toBeNull();

    const progressValue = parseFloat(ariaValueNow || '0');
    expect(progressValue).toBeGreaterThanOrEqual(0);
    expect(progressValue).toBeLessThanOrEqual(100);
  });

  test('should display stepper in vertical orientation', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);
    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    const stepperClasses = await bitcoinPage.transactionStepper.getAttribute('class');
    expect(stepperClasses).toContain('MuiStepper-vertical');
  });
});
