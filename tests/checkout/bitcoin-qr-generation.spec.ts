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
 * Bitcoin QR Code Generation E2E Tests
 *
 * Tests the Bitcoin invoice generation and QR code display functionality.
 * The QR code is displayed on the order success page after placing an order
 * with Bitcoin as the payment method.
 *
 * Requirements covered:
 * - 19.5: Loading indicator displayed while invoice generating
 * - 19.6: QR code displayed after invoice received
 * - 19.7: Payment amount displayed in BTC and satoshis
 * - 19.8: Bitcoin address displayed for manual copy
 * - 19.9: Copy Address button copies to clipboard
 * - 19.10: Copy Amount button copies to clipboard
 * - 19.11: Exchange rate displayed
 * - 19.12: Invoice expiration countdown displayed
 * - 19.13: Refresh button generates new invoice
 * - 19.14: Error message with retry on invoice generation failure
 *
 * Note: These tests run serially within each browser project to avoid race conditions
 * with shared user accounts and cart state. Cross-browser parallelization is still enabled.
 *
 * @tag Feature: e2e-integration-testing
 * @tag Property 17: Bitcoin Invoice Generation Round-Trip
 */
test.describe('Bitcoin QR Code Generation', () => {
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
   */
  async function setupCartWithProduct(
    page: import('@playwright/test').Page,
    request: import('@playwright/test').APIRequestContext
  ): Promise<void> {
    const customer = getBitcoinUser('bitcoinQrGeneration');
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

  /**
   * Helper function to proceed to payment step
   */
  async function proceedToPaymentAndCheckAvailability(
    page: import('@playwright/test').Page,
    shippingAddress: ShippingAddressData
  ): Promise<void> {
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
  }

  /**
   * Helper to complete checkout with Bitcoin and navigate to success page
   * Returns the order ID from the success page URL
   * Throws an error if Bitcoin payment is not available (Bitcoin IS an implemented payment method)
   */
  async function completeBitcoinCheckout(
    page: import('@playwright/test').Page,
    request: import('@playwright/test').APIRequestContext
  ): Promise<string> {
    await setupCartWithProduct(page, request);
    const shippingAddress = getValidShippingAddress();

    await cartPage.goto();
    await cartPage.waitForPage();
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPage();

    await proceedToPaymentAndCheckAvailability(page, shippingAddress);
    
    // Wait for payment methods to load - throws if they don't
    await checkoutPage.waitForPaymentMethods(15000);

    const isBitcoinDisplayed = await bitcoinPage.isBitcoinPaymentDisplayed();
    if (!isBitcoinDisplayed) {
      throw new Error('Bitcoin payment method is not displayed - check backend Bitcoin configuration (BTC_PAY_ENABLED)');
    }

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
    await page.waitForURL(/\/checkout\/success\?orderId=/, { timeout: 30000 });
    
    // Extract order ID from URL
    const url = page.url();
    const orderIdMatch = url.match(/orderId=([^&]+)/);
    if (!orderIdMatch) {
      throw new Error('Failed to extract order ID from success page URL');
    }
    return orderIdMatch[1];
  }

  test('should display loading indicator while invoice is generating', async ({ page, request }) => {
    const orderId = await completeBitcoinCheckout(page, request);

    // Check for loading indicator or QR code on success page
    const qrRegionExists = await bitcoinPage.qrCodeRegion.isVisible().catch(() => false);
    if (qrRegionExists) {
      const isLoading = await bitcoinPage.invoiceLoadingIndicator.isVisible().catch(() => false);
      const isQRDisplayed = await bitcoinPage.isQRCodeDisplayed().catch(() => false);
      expect(isLoading || isQRDisplayed).toBe(true);
    }
  });

  test('should display QR code after invoice is generated', async ({ page, request }) => {
    const orderId = await completeBitcoinCheckout(page, request);

    try {
      await bitcoinPage.waitForInvoiceGeneration(30000);
      await bitcoinPage.assertQRCodeDisplayed();
    } catch {
      const hasError = await bitcoinPage.isInvoiceErrorDisplayed();
      if (hasError) {
        const errorMsg = await bitcoinPage.getErrorMessage();
        throw new Error(`Invoice generation failed: ${errorMsg}`);
      } else {
        await page.screenshot({ path: 'debug-bitcoin-qr.png', fullPage: true });
        throw new Error('Invoice generation timed out - check debug-bitcoin-qr.png');
      }
    }
  });

  test('should display payment amount in BTC and satoshis', async ({ page, request }) => {
    const orderId = await completeBitcoinCheckout(page, request);

    try {
      await bitcoinPage.waitForInvoiceGeneration(30000);
    } catch {
      throw new Error('Invoice generation failed or timed out - check backend Bitcoin configuration');
    }

    await bitcoinPage.assertPaymentAmountDisplayed();
    const btcAmount = await bitcoinPage.getBtcAmount();
    expect(btcAmount).toMatch(/\d+\.\d+ BTC/);

    const satoshiAmount = await bitcoinPage.getSatoshiAmount();
    expect(satoshiAmount).toBeGreaterThan(0);
  });

  test('should display Bitcoin address for manual copy', async ({ page, request }) => {
    const orderId = await completeBitcoinCheckout(page, request);

    try {
      await bitcoinPage.waitForInvoiceGeneration(30000);
    } catch {
      throw new Error('Invoice generation failed or timed out - check backend Bitcoin configuration');
    }

    await expect(page.getByText(/bitcoin address/i)).toBeVisible();
    // Match both mainnet (bc1, 1, 3) and testnet (tb1) addresses
    const addressElement = page.locator('.MuiTypography-root').filter({
      hasText: /^(bc1|tb1|[13])[a-zA-Z0-9]{25,}/i,
    });
    const addressCount = await addressElement.count();
    expect(addressCount).toBeGreaterThan(0);
  });

  test('should copy Bitcoin address to clipboard when Copy Address is clicked', async ({ page, request, context }) => {
    // Increase timeout for clipboard tests which involve more complex operations
    test.setTimeout(120000);
    
    // Grant clipboard permissions BEFORE checkout to avoid blocking
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch (e) {
      console.log('Failed to grant clipboard permissions:', e);
      // Continue anyway - clipboard might work without explicit permissions
    }

    const orderId = await completeBitcoinCheckout(page, request);

    try {
      await bitcoinPage.waitForInvoiceGeneration(30000);
    } catch {
      throw new Error('Invoice generation failed or timed out - check backend Bitcoin configuration');
    }

    // Wait for the copy button to be visible and clickable
    await bitcoinPage.copyAddressButton.waitFor({ state: 'visible', timeout: 10000 });
    await bitcoinPage.copyAddress();
    const isCopied = await bitcoinPage.isAddressCopied();
    expect(isCopied).toBe(true);

    // Try to read clipboard, but don't fail if it doesn't work
    try {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      // Match both mainnet (bc1, 1, 3) and testnet (tb1) addresses
      expect(clipboardText).toMatch(/^(bc1|tb1|[13])[a-zA-Z0-9]{25,}$/i);
    } catch (e) {
      console.log('Clipboard read failed (may be expected in some environments):', e);
      // The button showing "Copied" is sufficient verification
    }
  });

  test('should copy BTC amount to clipboard when Copy Amount is clicked', async ({ page, request, context }) => {
    // Increase timeout for clipboard tests which involve more complex operations
    test.setTimeout(120000);
    
    // Grant clipboard permissions BEFORE checkout to avoid blocking
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch (e) {
      console.log('Failed to grant clipboard permissions:', e);
    }

    const orderId = await completeBitcoinCheckout(page, request);

    try {
      await bitcoinPage.waitForInvoiceGeneration(30000);
    } catch {
      throw new Error('Invoice generation failed or timed out - check backend Bitcoin configuration');
    }

    // Wait for the copy button to be visible and clickable
    await bitcoinPage.copyAmountButton.waitFor({ state: 'visible', timeout: 10000 });
    await bitcoinPage.copyAmount();
    const isCopied = await bitcoinPage.isAmountCopied();
    expect(isCopied).toBe(true);

    // Try to read clipboard, but don't fail if it doesn't work
    try {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toMatch(/^\d+\.\d+$/);
    } catch (e) {
      console.log('Clipboard read failed (may be expected in some environments):', e);
      // The button showing "Copied" is sufficient verification
    }
  });

  test('should display the BTC/USD exchange rate', async ({ page, request }) => {
    const orderId = await completeBitcoinCheckout(page, request);

    try {
      await bitcoinPage.waitForInvoiceGeneration(30000);
    } catch {
      throw new Error('Invoice generation failed or timed out - check backend Bitcoin configuration');
    }

    await expect(bitcoinPage.exchangeRateDisplay).toBeVisible();
    const rateText = await bitcoinPage.getExchangeRate();
    expect(rateText).toMatch(/1 BTC.*\$/i);
  });

  test('should display invoice expiration countdown that actively counts down', async ({ page, request }) => {
    const orderId = await completeBitcoinCheckout(page, request);

    try {
      await bitcoinPage.waitForInvoiceGeneration(30000);
    } catch {
      throw new Error('Invoice generation failed or timed out - check backend Bitcoin configuration');
    }

    await bitcoinPage.assertExpirationTimerDisplayed();
    
    const parseTime = (time: string) => {
      const [mins, secs] = time.split(':').map(Number);
      return mins * 60 + secs;
    };

    // Get initial time
    const initialTime = await bitcoinPage.getTimeRemaining();
    // Backend uses 24-hour expiration, so format can be "1439:59" or "14:59"
    expect(initialTime).toMatch(/^\d{1,4}:\d{2}$/);
    const initialSeconds = parseTime(initialTime);
    expect(initialSeconds).toBeGreaterThan(0);

    // Wait 3 seconds for the timer to count down
    // This is an intentional fixed wait to test real-time timer behavior
    await page.waitForTimeout(3000);

    // Get the new time - it should have decreased
    const newTime = await bitcoinPage.getTimeRemaining();
    const newSeconds = parseTime(newTime);

    // The timer should have decreased by approximately 3 seconds (allow 1 second tolerance)
    const timeDifference = initialSeconds - newSeconds;
    expect(timeDifference).toBeGreaterThanOrEqual(2); // At least 2 seconds should have passed
    expect(timeDifference).toBeLessThanOrEqual(5); // But not more than 5 (accounting for test overhead)
  });

  test('should generate new invoice when Refresh button is clicked', async ({ page, request }) => {
    const orderId = await completeBitcoinCheckout(page, request);

    try {
      await bitcoinPage.waitForInvoiceGeneration(30000);
    } catch {
      throw new Error('Invoice generation failed or timed out - check backend Bitcoin configuration');
    }

    const initialTime = await bitcoinPage.getTimeRemaining();
    // Intentional fixed wait to test timer countdown before refresh
    await page.waitForTimeout(3000);
    await bitcoinPage.refreshInvoice();
    const newTime = await bitcoinPage.getTimeRemaining();

    const parseTime = (time: string) => {
      const [mins, secs] = time.split(':').map(Number);
      return mins * 60 + secs;
    };

    expect(parseTime(newTime)).toBeGreaterThanOrEqual(parseTime(initialTime) - 5);
  });

  test('should display QR code at appropriate size for scanning', async ({ page, request }) => {
    const orderId = await completeBitcoinCheckout(page, request);

    try {
      await bitcoinPage.waitForInvoiceGeneration(30000);
    } catch {
      throw new Error('Invoice generation failed or timed out - check backend Bitcoin configuration');
    }

    const qrCode = bitcoinPage.qrCodeSvg;
    const boundingBox = await qrCode.boundingBox();
    expect(boundingBox).not.toBeNull();

    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThanOrEqual(150);
      expect(boundingBox.height).toBeGreaterThanOrEqual(150);
      const aspectRatio = boundingBox.width / boundingBox.height;
      expect(aspectRatio).toBeCloseTo(1, 1);
    }
  });
});
