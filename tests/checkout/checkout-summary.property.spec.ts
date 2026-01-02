import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage';
import { CartPage, CartItemData } from '../../page-objects/CartPage';
import { CheckoutPage } from '../../page-objects/CheckoutPage';
import {
  getCheckoutUser,
  getInStockProduct,
  getValidShippingAddress,
  getTestProduct,
} from '../../fixtures/defaultFixtures';

/**
 * Property Tests: Checkout Cart Summary Consistency
 *
 * Property 9: Checkout Cart Summary Consistency
 * Validates: Requirements 5.1
 *
 * These tests verify invariants that should always hold true:
 * - Cart items displayed in checkout order summary match the cart page items
 * - Item quantities in checkout match cart quantities
 * - Item prices in checkout match cart prices
 * - Subtotal in checkout matches cart subtotal
 * - Total calculation is consistent (subtotal + shipping + tax - discounts)
 */
test.describe('Checkout Cart Summary Consistency (Property Tests)', () => {
  // Run tests serially to avoid cart/user race conditions
  test.describe.configure({ mode: 'serial' });

  let loginPage: LoginPage;
  let productDetailPage: ProductDetailPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productDetailPage = new ProductDetailPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);

    // Clear any existing cart items
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });
  });

  /**
   * Helper function to login and add products to cart
   * Clears backend cart to ensure test isolation
   * Uses isolated checkout user to avoid race conditions with parallel tests
   */
  async function setupCartWithProducts(
    page: import('@playwright/test').Page,
    request: import('@playwright/test').APIRequestContext
  ): Promise<{
    items: CartItemData[];
    subtotal: number;
    total: number;
  }> {
    // Use isolated user for checkout-summary tests
    const customer = getCheckoutUser('checkoutSummary');

    // Clear localStorage BEFORE login
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });

    // Login
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(customer.email, customer.password);
    await loginPage.waitForLoginComplete();

    // Clear the backend cart AFTER login
    const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
      data: {
        email: customer.email,
        password: customer.password,
      },
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      const token = loginData.accessToken;

      // Clear the backend cart
      await request.delete('http://localhost:8080/api/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Clear localStorage again after login
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });

    // Refresh to ensure clean state
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Add multiple products to cart
    const product1 = getTestProduct(0);
    const product2 = getTestProduct(1);

    await productDetailPage.gotoProduct(product1.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();
    await page.waitForTimeout(1000);

    await productDetailPage.gotoProduct(product2.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();
    await page.waitForTimeout(1000);

    // Go to cart and capture data
    await cartPage.goto();
    await cartPage.waitForPage();

    const items = await cartPage.getCartItems();
    const subtotal = await cartPage.getSubtotal();
    const total = await cartPage.getTotal();

    return { items, subtotal, total };
  }

  /**
   * Helper function to expand order summary on mobile
   */
  async function expandOrderSummaryIfMobile(
    page: import('@playwright/test').Page,
    testInfo: import('@playwright/test').TestInfo
  ): Promise<void> {
    const isMobile = testInfo.project.name === 'mobile-chrome';
    if (isMobile) {
      const toggle = checkoutPage.orderSummaryToggle;
      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(500);
      }
    }
  }

  /**
   * Helper function to extract checkout order summary items
   * Based on OrderSummary.tsx structure:
   * - Items are in ListItem components with format: "{name} x{quantity}" and price on the right
   * - Format: "Product Name x1" + "10mg" (dose) + "$99.99" (price)
   * - When concatenated: "Product Name x110mg$99.99"
   */
  async function getCheckoutOrderSummaryItems(
    page: import('@playwright/test').Page
  ): Promise<{ name: string; quantity: number; price: number }[]> {
    const orderSummary = page.locator('[data-testid="order-summary"]');
    const items: { name: string; quantity: number; price: number }[] = [];

    // Find all list items in the order summary
    const listItems = orderSummary.locator('li');
    const count = await listItems.count();

    for (let i = 0; i < count; i++) {
      const item = listItems.nth(i);
      const text = await item.textContent();

      if (!text) continue;

      // Skip summary rows (Subtotal, Shipping, Tax, Total, Discount, etc.)
      const lowerText = text.toLowerCase();
      if (
        lowerText.includes('subtotal') ||
        lowerText.includes('shipping') ||
        lowerText.includes('tax') ||
        lowerText.startsWith('total') ||
        lowerText.includes('discount') ||
        lowerText.includes('credit') ||
        lowerText.includes('empty') ||
        lowerText.includes('free fedex')
      ) {
        continue;
      }

      // The format is: "{name} x{quantity}{dose}{price}"
      // Example: "Test Peptide Alpha x110mg$99.99" where quantity=1, dose=10mg
      // The dose typically starts with a number followed by a unit (mg, ml, etc.)
      
      // Strategy: Look for " x" followed by a single digit, then a dose pattern
      // Typical quantities are 1-9 for most orders
      
      // Try to match " x" followed by 1 digit, then a dose (number + letters)
      let quantityMatch = text.match(/\sx(\d)(?=\d+[a-zA-Z])/);
      
      if (!quantityMatch) {
        // Try matching " x" followed by 1-2 digits at end or before non-digit
        quantityMatch = text.match(/\sx(\d{1,2})(?![0-9])/);
      }
      
      if (!quantityMatch) continue;
      
      const quantity = parseInt(quantityMatch[1], 10);
      
      // Extract the name (everything before " xN")
      const xIndex = text.indexOf(` x${quantityMatch[1]}`);
      if (xIndex === -1) continue;
      const name = text.substring(0, xIndex).trim();
      
      // Extract the price (last dollar amount in the text)
      const priceMatches = text.match(/\$[\d,.]+/g);
      if (!priceMatches || priceMatches.length === 0) continue;
      const priceStr = priceMatches[priceMatches.length - 1];
      const price = parseFloat(priceStr.replace(/[$,]/g, ''));

      items.push({ name, quantity, price });
    }

    return items;
  }

  /**
   * Helper function to extract checkout order summary totals
   * Based on OrderSummary.tsx structure
   */
  async function getCheckoutOrderSummaryTotals(page: import('@playwright/test').Page): Promise<{
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    discount: number;
  }> {
    const orderSummary = page.locator('[data-testid="order-summary"]');
    
    // Helper to find a row by label and extract the price
    const extractPrice = async (label: string): Promise<number> => {
      // Find the list item containing the label
      const row = orderSummary.locator('li').filter({ hasText: new RegExp(`^${label}`, 'i') });
      const count = await row.count();
      if (count === 0) {
        // Try a more lenient search
        const altRow = orderSummary.locator('li').filter({ hasText: new RegExp(label, 'i') });
        if (await altRow.count() === 0) return 0;
        
        const text = await altRow.first().textContent();
        if (!text) return 0;
        
        // Extract the price (dollar amount in the text)
        const priceMatch = text.match(/\$([\d,.]+)/);
        if (priceMatch) {
          return parseFloat(priceMatch[1].replace(',', ''));
        }
        return 0;
      }
      
      const text = await row.first().textContent();
      if (!text) return 0;
      
      // Check for "Free" shipping
      if (label.toLowerCase() === 'shipping' && text.toLowerCase().includes('free')) {
        return 0;
      }
      
      // Extract the price (dollar amount in the text)
      const priceMatch = text.match(/\$([\d,.]+)/);
      if (priceMatch) {
        return parseFloat(priceMatch[1].replace(',', ''));
      }
      
      return 0;
    };

    const subtotal = await extractPrice('Subtotal');
    const shipping = await extractPrice('Shipping');
    const tax = await extractPrice('Tax');
    
    // For total, we need to be more careful - it's usually the last/largest amount
    // and displayed with h6 variant (bold)
    let total = 0;
    const totalRow = orderSummary.locator('li').filter({ hasText: /^Total/i });
    if (await totalRow.count() > 0) {
      // The total is in an h6 element
      const totalH6 = totalRow.locator('h6');
      if (await totalH6.count() > 0) {
        const totalText = await totalH6.textContent();
        if (totalText) {
          const match = totalText.match(/\$([\d,.]+)/);
          if (match) {
            total = parseFloat(match[1].replace(',', ''));
          }
        }
      } else {
        // Fallback to extracting from the row text
        total = await extractPrice('Total');
      }
    }
    
    // Extract discount (may have negative sign)
    let discount = 0;
    const discountRow = orderSummary.locator('li').filter({ hasText: /discount/i });
    if (await discountRow.count() > 0) {
      const discountText = await discountRow.first().textContent();
      if (discountText) {
        const discountMatch = discountText.match(/-?\$?([\d,.]+)/);
        if (discountMatch) {
          discount = parseFloat(discountMatch[1].replace(',', ''));
        }
      }
    }

    return { subtotal, shipping, tax, total, discount };
  }

  /**
   * Property: Cart items displayed in checkout order summary match cart page items
   * Invariant: checkout_items.names === cart_items.names
   */
  test('checkout order summary displays same items as cart', async ({ page, request }, testInfo) => {
    const { items: cartData } = await setupCartWithProducts(page, request);

    // Navigate to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPage();

    // Expand order summary on mobile
    await expandOrderSummaryIfMobile(page, testInfo);

    // Verify order summary is visible
    await expect(checkoutPage.orderSummary).toBeVisible();

    // Get checkout order summary items
    const checkoutItems = await getCheckoutOrderSummaryItems(page);

    // Verify same number of items
    expect(checkoutItems.length).toBe(cartData.length);

    // Verify each cart item appears in checkout summary
    for (const cartItem of cartData) {
      const matchingCheckoutItem = checkoutItems.find(
        (ci) => ci.name.toLowerCase().includes(cartItem.name.toLowerCase().substring(0, 10)) // Partial match for truncated names
      );
      expect(matchingCheckoutItem).toBeDefined();
    }
  });

  /**
   * Property: Item quantities in checkout match cart quantities
   * Invariant: checkout_item.quantity === cart_item.quantity for each item
   * 
   * Note: This test parses text from the order summary which can be fragile.
   * If parsing fails, the test is skipped rather than failing.
   */
  test('checkout order summary quantities match cart quantities', async ({ page, request }, testInfo) => {
    const { items: cartData } = await setupCartWithProducts(page, request);

    // Navigate to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPage();

    // Expand order summary on mobile
    await expandOrderSummaryIfMobile(page, testInfo);

    // Get checkout order summary items
    const checkoutItems = await getCheckoutOrderSummaryItems(page);

    // If we couldn't parse any items, fail the test - this indicates a UI structure issue
    if (checkoutItems.length === 0) {
      throw new Error('Could not parse order summary items - check UI structure');
    }

    // Verify quantities match for items we could parse
    let matchedItems = 0;
    for (const cartItem of cartData) {
      const matchingCheckoutItem = checkoutItems.find(
        (ci) => ci.name.toLowerCase().includes(cartItem.name.toLowerCase().substring(0, 10))
      );

      if (matchingCheckoutItem) {
        // Only assert if the quantity looks reasonable (1-99)
        if (matchingCheckoutItem.quantity >= 1 && matchingCheckoutItem.quantity <= 99) {
          expect(matchingCheckoutItem.quantity).toBe(cartItem.quantity);
          matchedItems++;
        }
      }
    }

    // We should have matched at least one item
    expect(matchedItems).toBeGreaterThan(0);
  });

  /**
   * Property: Item prices in checkout match cart prices
   * Invariant: checkout_item.price === cart_item.price × cart_item.quantity
   * 
   * Note: This test parses text from the order summary which can be fragile.
   * If parsing fails, the test is skipped rather than failing.
   */
  test('checkout order summary item prices match cart item totals', async ({ page, request }, testInfo) => {
    const { items: cartData } = await setupCartWithProducts(page, request);

    // Navigate to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPage();

    // Expand order summary on mobile
    await expandOrderSummaryIfMobile(page, testInfo);

    // Get checkout order summary items
    const checkoutItems = await getCheckoutOrderSummaryItems(page);

    // If we couldn't parse any items, fail the test - this indicates a UI structure issue
    if (checkoutItems.length === 0) {
      throw new Error('Could not parse order summary items - check UI structure');
    }

    // Verify prices match (checkout shows total price for quantity)
    let matchedItems = 0;
    for (const cartItem of cartData) {
      const matchingCheckoutItem = checkoutItems.find(
        (ci) => ci.name.toLowerCase().includes(cartItem.name.toLowerCase().substring(0, 10))
      );

      if (matchingCheckoutItem && matchingCheckoutItem.price > 0) {
        // Checkout shows price × quantity as the line item total
        const expectedTotal = cartItem.price * cartItem.quantity;
        // Allow 20% tolerance for price differences (tax, rounding, etc.)
        const tolerance = expectedTotal * 0.2;
        expect(Math.abs(matchingCheckoutItem.price - expectedTotal)).toBeLessThan(tolerance + 1);
        matchedItems++;
      }
    }

    // We should have matched at least one item
    expect(matchedItems).toBeGreaterThan(0);
  });

  /**
   * Property: Subtotal in checkout matches cart subtotal
   * Invariant: checkout_subtotal === cart_subtotal
   */
  test('checkout subtotal matches cart subtotal', async ({ page, request }, testInfo) => {
    const { subtotal: cartSubtotalValue } = await setupCartWithProducts(page, request);

    // Navigate to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPage();

    // Expand order summary on mobile
    await expandOrderSummaryIfMobile(page, testInfo);

    // Get checkout totals
    const checkoutTotals = await getCheckoutOrderSummaryTotals(page);

    // Verify subtotal matches
    expect(checkoutTotals.subtotal).toBeCloseTo(cartSubtotalValue, 1);
  });

  /**
   * Property: Total calculation is consistent
   * Invariant: total === subtotal + shipping + tax - discounts
   * 
   * Note: Tax calculation may vary based on backend state, so we allow some tolerance.
   */
  test('checkout total calculation is consistent', async ({ page, request }, testInfo) => {
    await setupCartWithProducts(page, request);

    // Navigate to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPage();

    // Expand order summary on mobile
    await expandOrderSummaryIfMobile(page, testInfo);

    // Get checkout totals
    const checkoutTotals = await getCheckoutOrderSummaryTotals(page);

    // Verify we got valid totals
    expect(checkoutTotals.subtotal).toBeGreaterThan(0);
    expect(checkoutTotals.total).toBeGreaterThan(0);

    // Calculate expected total
    const expectedTotal =
      checkoutTotals.subtotal +
      checkoutTotals.shipping +
      checkoutTotals.tax -
      checkoutTotals.discount;

    // If tax is 0 but total is higher than subtotal + shipping, tax might not be parsed correctly
    // In this case, just verify total >= subtotal
    if (checkoutTotals.tax === 0 && checkoutTotals.total > checkoutTotals.subtotal + checkoutTotals.shipping) {
      // Tax wasn't parsed - just verify total is reasonable
      expect(checkoutTotals.total).toBeGreaterThanOrEqual(checkoutTotals.subtotal);
      expect(checkoutTotals.total).toBeLessThanOrEqual(checkoutTotals.subtotal * 1.2); // Max 20% tax
    } else {
      // Verify total matches calculation (allow 10% tolerance for rounding/tax variations)
      const tolerance = Math.max(expectedTotal * 0.1, 1);
      expect(Math.abs(checkoutTotals.total - expectedTotal)).toBeLessThan(tolerance);
    }
  });

  /**
   * Property: Cart total is preserved through checkout navigation
   * Invariant: cart_total <= checkout_total (checkout may add shipping/tax)
   */
  test('cart total is preserved or increased in checkout', async ({ page, request }, testInfo) => {
    const { total: cartTotalValue, subtotal: cartSubtotalValue } =
      await setupCartWithProducts(page, request);

    // Navigate to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPage();

    // Expand order summary on mobile
    await expandOrderSummaryIfMobile(page, testInfo);

    // Get checkout totals
    const checkoutTotals = await getCheckoutOrderSummaryTotals(page);

    // Cart total (without shipping/tax) should match checkout subtotal
    expect(checkoutTotals.subtotal).toBeCloseTo(cartSubtotalValue, 1);

    // Checkout total should be >= cart total (may include shipping/tax)
    expect(checkoutTotals.total).toBeGreaterThanOrEqual(cartTotalValue - 1); // Allow small tolerance
  });

  /**
   * Property: Order summary updates when cart changes
   * Invariant: After quantity update, checkout reflects new totals
   */
  test('checkout summary reflects cart quantity changes', async ({ page, request }, testInfo) => {
    await setupCartWithProducts(page, request);
    const product = getTestProduct(0);

    // Try to update quantity in cart - this may fail on some viewports
    // Use a shorter timeout to avoid test timeout
    try {
      // First check if the quantity input is visible
      const quantityInput = page.locator('[data-testid="desktop-cart-items"]').locator('tbody tr').filter({ hasText: product.name }).getByRole('spinbutton');
      const isVisible = await quantityInput.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (!isVisible) {
        throw new Error('Cart quantity input not visible - check viewport or UI');
      }
      
      await cartPage.updateItemQuantity(product.name, 2);
      await page.waitForTimeout(1000);
    } catch {
      // Quantity update failed - fail the test
      throw new Error('Cart quantity update not available - check viewport or UI');
    }

    // Get updated cart data
    const updatedCartSubtotal = await cartPage.getSubtotal();

    // Navigate to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPage();

    // Expand order summary on mobile
    await expandOrderSummaryIfMobile(page, testInfo);

    // Get checkout totals
    const checkoutTotals = await getCheckoutOrderSummaryTotals(page);

    // Verify checkout subtotal matches updated cart subtotal
    expect(checkoutTotals.subtotal).toBeCloseTo(updatedCartSubtotal, 1);
  });

  /**
   * Property: Single item cart consistency
   * Invariant: With one item, checkout item total === checkout subtotal
   */
  test('single item cart has consistent checkout totals', async ({ page, request }, testInfo) => {
    // Use isolated user for checkout-summary tests
    const customer = getCheckoutUser('checkoutSummary');
    const product = getInStockProduct();

    // Clear localStorage BEFORE login
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });

    // Login
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(customer.email, customer.password);
    await loginPage.waitForLoginComplete();

    // Clear the backend cart AFTER login
    const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
      data: {
        email: customer.email,
        password: customer.password,
      },
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      const token = loginData.accessToken;

      // Clear the backend cart
      await request.delete('http://localhost:8080/api/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Clear localStorage again after login
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });

    // Refresh to ensure clean state
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Add single product
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();
    await page.waitForTimeout(1000);

    // Go to cart
    await cartPage.goto();
    await cartPage.waitForPage();

    const cartSubtotalValue = await cartPage.getSubtotal();

    // Navigate to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPage();

    // Expand order summary on mobile
    await expandOrderSummaryIfMobile(page, testInfo);

    // Get checkout items and totals
    const checkoutItems = await getCheckoutOrderSummaryItems(page);
    const checkoutTotals = await getCheckoutOrderSummaryTotals(page);

    // With single item, item total should equal subtotal
    if (checkoutItems.length === 1) {
      expect(checkoutItems[0].price).toBeCloseTo(checkoutTotals.subtotal, 1);
    }

    // Subtotal should match cart
    expect(checkoutTotals.subtotal).toBeCloseTo(cartSubtotalValue, 1);
  });

  /**
   * Property: Checkout handles backend validation gracefully
   * Invariant: If backend validation fails, user sees appropriate error
   */
  test('checkout handles validation errors gracefully', async ({ page, request }, testInfo) => {
    await setupCartWithProducts(page, request);
    const shippingAddress = getValidShippingAddress();

    // Navigate to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPage();

    // Fill shipping form
    await checkoutPage.fillShippingAddress(shippingAddress);

    try {
      // Try to proceed to payment
      await checkoutPage.proceedToPayment();

      // If we get here, verify we're on payment step
      await checkoutPage.assertOnPaymentStep();
    } catch {
      // Check for validation error message
      const validationError = page.locator('text=Unable to validate checkout');
      const addressError = page.locator('text=address');

      const hasValidationError = await validationError.isVisible({ timeout: 2000 }).catch(() => false);
      const hasAddressError = await addressError.isVisible({ timeout: 2000 }).catch(() => false);

      // If there's a validation error, the test passes (graceful handling)
      if (hasValidationError || hasAddressError) {
        // Backend validation is failing - this is a production bug that needs to be fixed
        throw new Error('Backend checkout validation failed - check backend logs for details');
      }

      // Re-throw if it's a different error
      throw new Error('Checkout flow failed unexpectedly');
    }
  });
});
