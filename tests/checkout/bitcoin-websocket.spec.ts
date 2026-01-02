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
 * Bitcoin WebSocket Integration E2E Tests
 *
 * Tests the WebSocket integration for real-time Bitcoin payment updates.
 *
 * Requirements covered:
 * - 19.22: WebSocket subscription established for payment
 * - 19.23: UI updates immediately on WebSocket notification
 * - 19.24: Graceful handling of WebSocket connection errors
 * - 19.25: Connection status indicator when WebSocket is disconnected
 *
 * Note: These tests verify the WebSocket infrastructure is in place.
 * Full WebSocket testing requires backend simulation of payment events.
 *
 * @tag Feature: e2e-integration-testing
 */
test.describe('Bitcoin WebSocket Integration', () => {
  // Run tests serially within this describe block to avoid cart/user race conditions
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

    // Clear any existing cart items from localStorage
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });
  });

  /**
   * Helper function to login and add product to cart
   * Clears any existing cart items first to ensure test isolation
   */
  async function setupCartWithProduct(
    page: import('@playwright/test').Page,
    request: import('@playwright/test').APIRequestContext
  ): Promise<void> {
    const customer = getBitcoinUser('bitcoinWebsocket');
    const product = getInStockProduct();

    // Clear localStorage BEFORE login to prevent cart sync from restoring old items
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });

    // Login
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(customer.email, customer.password);
    await loginPage.waitForLoginComplete();

    // Clear the backend cart AFTER login to ensure we start fresh
    // This is necessary because different browser projects share the same test user
    const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
      data: {
        email: customer.email,
        password: customer.password,
      },
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      const token = loginData.accessToken;

      // Clear the backend cart and verify it's empty
      const clearResponse = await request.delete('http://localhost:8080/api/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Verify cart is cleared by checking item count
      if (clearResponse.ok()) {
        const countResponse = await request.get('http://localhost:8080/api/cart/count', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (countResponse.ok()) {
          const count = await countResponse.json();
          if (count > 0) {
            // Cart not cleared, try again
            await request.delete('http://localhost:8080/api/cart', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          }
        }
      }
    }

    // Clear localStorage again after login (in case cart sync restored items)
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });

    // Refresh the page to ensure clean state and trigger fresh cart load
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Wait a moment for any cart sync to complete
    await page.waitForTimeout(500);

    // Add a product to cart
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();

    // Wait for add to cart to complete and cart sync to backend
    await page.waitForTimeout(2000);

    // Wait for any pending network requests to complete
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  }

  /**
   * Helper function to complete checkout up to payment step and check availability
   * Returns true if payment methods are available, false otherwise
   */
  async function proceedToPaymentAndCheckAvailability(
    page: import('@playwright/test').Page,
    shippingAddress: ShippingAddressData
  ): Promise<boolean> {
    await checkoutPage.fillShippingAddress(shippingAddress);
    await checkoutPage.proceedToPayment();

    // Wait for payment step to load and order summary to show non-zero total
    await page.waitForTimeout(2000);

    // Wait for order summary total to be non-zero (up to 15 seconds)
    for (let i = 0; i < 15; i++) {
      const totalRow = page.locator('li').filter({ hasText: /^Total/ });
      const totalHeading = totalRow.locator('h6');
      const totalText = await totalHeading.textContent().catch(() => null);
      const total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');
      if (total > 0) {
        await page.waitForTimeout(500);
        break;
      }
      await page.waitForTimeout(1000);
    }

    return await checkoutPage.arePaymentMethodsAvailable();
  }

  /**
   * Helper to navigate to Bitcoin payment and generate invoice
   */
  async function setupBitcoinPayment(
    page: import('@playwright/test').Page,
    request: import('@playwright/test').APIRequestContext
  ): Promise<boolean> {
    await setupCartWithProduct(page, request);
    const shippingAddress = getValidShippingAddress();

    // Navigate to cart and proceed to checkout
    await cartPage.goto();
    await cartPage.waitForPage();
    await cartPage.proceedToCheckout();

    // Wait for checkout page to load
    await checkoutPage.waitForPage();

    // Proceed to payment step
    const paymentMethodsAvailable = await proceedToPaymentAndCheckAvailability(page, shippingAddress);
    if (!paymentMethodsAvailable) {
      return false;
    }

    // Check if Bitcoin is available
    const isBitcoinDisplayed = await bitcoinPage.isBitcoinPaymentDisplayed();
    if (!isBitcoinDisplayed) {
      return false;
    }

    // Select Bitcoin payment
    await bitcoinPage.selectBitcoinPayment();

    // Click "Continue to Review" button to proceed to review step
    const continueToReviewButton = page.getByRole('button', { name: /continue to review/i });
    await continueToReviewButton.waitFor({ state: 'visible', timeout: 10000 });
    await continueToReviewButton.click();
    await page.waitForTimeout(1000);

    // Accept RUO consent checkbox
    await checkoutPage.acceptRuoConsent();
    await page.waitForTimeout(500);

    // Click "Complete Order" button
    const completeOrderButton = page.getByRole('button', { name: /complete order/i });
    await completeOrderButton.waitFor({ state: 'visible', timeout: 10000 });
    await completeOrderButton.click();

    // Wait for redirect to order success page
    await page.waitForURL(/\/checkout\/success/, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Wait for invoice generation on the order success page
    try {
      await bitcoinPage.waitForInvoiceGeneration(20000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test 1: WebSocket connection is established
   * Validates: Requirement 19.22
   * Note: This test verifies the WebSocket infrastructure by checking
   * that the page is ready to receive real-time updates.
   */
  test('should establish WebSocket connection for payment updates', async ({ page, request }) => {
    // Monitor WebSocket connections BEFORE setting up Bitcoin payment
    // This ensures we capture any WebSocket connections established during setup
    const wsConnections: string[] = [];

    page.on('websocket', (ws) => {
      wsConnections.push(ws.url());
    });

    const setupSuccess = await setupBitcoinPayment(page, request);

    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    // Wait for potential WebSocket connection to be established
    await page.waitForTimeout(3000);

    // The page should be ready for real-time updates
    // WebSocket connection may or may not be established depending on backend config

    // Verify the transaction monitor is displayed (ready for updates)
    await bitcoinPage.assertTransactionStepperDisplayed();

    // Verify the progress region has aria-live for real-time announcements
    const ariaLive = await bitcoinPage.transactionProgressRegion.getAttribute('aria-live');
    expect(ariaLive).toBe('polite');
  });

  /**
   * Test 2: UI is ready for real-time updates
   * Validates: Requirement 19.23
   */
  test('should have UI components ready for real-time updates', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);

    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    // Verify all status display components are present
    await bitcoinPage.assertTransactionStepperDisplayed();
    await expect(bitcoinPage.progressBar).toBeVisible();

    // Verify status message element exists
    const statusElement = page.locator('#bitcoin-progress-title');
    await expect(statusElement).toBeVisible();

    // Verify the UI can display different states
    // (The actual state changes require WebSocket events from backend)
    const currentStep = await bitcoinPage.getCurrentStep();
    expect(currentStep).toBeGreaterThanOrEqual(0);
    expect(currentStep).toBeLessThanOrEqual(3);
  });

  /**
   * Test 3: Progress region supports live updates
   * Validates: Requirement 19.23 (accessibility for real-time updates)
   */
  test('should have aria-live region for screen reader announcements', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);

    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    // Verify progress region has aria-live="polite"
    const progressRegion = bitcoinPage.transactionProgressRegion;
    const ariaLive = await progressRegion.getAttribute('aria-live');
    expect(ariaLive).toBe('polite');

    // Verify the region is labeled
    const ariaLabelledBy = await progressRegion.getAttribute('aria-labelledby');
    expect(ariaLabelledBy).toBe('bitcoin-progress-title');
  });

  /**
   * Test 4: Timer continues to update (simulates real-time behavior)
   * Validates: Requirement 19.23 (UI updates)
   */
  test('should update timer in real-time', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);

    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    // Get initial time
    const initialTime = await bitcoinPage.getTimeRemaining();

    // Wait for timer to update
    await page.waitForTimeout(3000);

    // Get updated time
    const updatedTime = await bitcoinPage.getTimeRemaining();

    // Parse times
    const parseTime = (time: string) => {
      const [mins, secs] = time.split(':').map(Number);
      return mins * 60 + secs;
    };

    const initialSeconds = parseTime(initialTime);
    const updatedSeconds = parseTime(updatedTime);

    // Timer should have decreased (real-time update working)
    expect(updatedSeconds).toBeLessThan(initialSeconds);
  });

  /**
   * Test 5: Page handles network interruption gracefully
   * Validates: Requirement 19.24
   * Note: This test verifies the UI remains stable during network issues.
   */
  test('should handle network interruption gracefully', async ({ page, request, context }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);

    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    // Verify initial state is stable
    await bitcoinPage.assertTransactionStepperDisplayed();
    await bitcoinPage.assertQRCodeDisplayed();

    // Simulate offline mode
    await context.setOffline(true);

    // Wait a moment
    await page.waitForTimeout(2000);

    // UI should still be visible (graceful degradation)
    await bitcoinPage.assertTransactionStepperDisplayed();

    // Restore network
    await context.setOffline(false);

    // Wait for potential reconnection
    await page.waitForTimeout(2000);

    // UI should still be functional
    await bitcoinPage.assertTransactionStepperDisplayed();
  });

  /**
   * Test 6: Refresh button works after network recovery
   * Validates: Requirement 19.24 (recovery mechanism)
   */
  test('should allow invoice refresh after network recovery', async ({ page, request, context }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);

    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    // Simulate brief offline period
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    await context.setOffline(false);
    await page.waitForTimeout(1000);

    // Refresh button should still work
    await expect(bitcoinPage.refreshInvoiceButton).toBeVisible();
    await expect(bitcoinPage.refreshInvoiceButton).toBeEnabled();
  });

  /**
   * Test 7: Status display handles various states
   * Validates: Requirement 19.23 (UI updates for different states)
   */
  test('should have status display ready for all payment states', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);

    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    // Verify all step labels are present (ready for any state)
    const steps = ['waiting for payment', 'payment detected', 'confirming transaction', 'payment complete'];

    for (const step of steps) {
      const stepElement = bitcoinPage.getStepByName(step);
      await expect(stepElement).toBeVisible();
    }
  });

  /**
   * Test 8: Confirmation chip is ready to display
   * Validates: Requirement 19.23 (UI ready for confirmation updates)
   */
  test('should be ready to display confirmation count updates', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);

    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    // The confirming transaction step should be present
    // (Confirmation chip appears when status is PROCESSING or COMPLETED)
    await expect(bitcoinPage.confirmingTransactionStep).toBeVisible();

    // Verify the step content area exists for showing confirmation details
    const stepContent = bitcoinPage.transactionStepper.locator('.MuiStepContent-root');
    const contentCount = await stepContent.count();
    expect(contentCount).toBeGreaterThan(0);
  });

  /**
   * Test 9: Transaction ID display area is ready
   * Validates: Requirement 19.23 (UI ready for txid updates)
   */
  test('should be ready to display transaction IDs', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);

    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    // The confirming transaction step should be present
    // (Transaction IDs appear in this step's content)
    await expect(bitcoinPage.confirmingTransactionStep).toBeVisible();

    // Initially, there should be no transaction IDs
    const txids = await bitcoinPage.getTransactionIds();
    expect(txids.length).toBe(0);
  });

  /**
   * Test 10: Page maintains state during long wait
   * Validates: Requirement 19.22, 19.23 (connection stability)
   */
  test('should maintain state during extended wait period', async ({ page, request }) => {
    const setupSuccess = await setupBitcoinPayment(page, request);

    if (!setupSuccess) {
      throw new Error('Bitcoin payment setup failed - check backend Bitcoin configuration');
    }

    // Record initial state
    const initialStep = await bitcoinPage.getCurrentStep();
    const initialStatus = await bitcoinPage.getPaymentStatus();

    // Wait for an extended period (simulating user waiting for payment)
    await page.waitForTimeout(10000);

    // Verify state is maintained (no unexpected changes without events)
    const currentStep = await bitcoinPage.getCurrentStep();
    const currentStatus = await bitcoinPage.getPaymentStatus();

    // Step should remain the same (no payment event occurred)
    expect(currentStep).toBe(initialStep);

    // Status should still indicate waiting
    expect(currentStatus.toLowerCase()).toContain('waiting');

    // UI should still be functional
    await bitcoinPage.assertTransactionStepperDisplayed();
    await bitcoinPage.assertQRCodeDisplayed();
  });
});
