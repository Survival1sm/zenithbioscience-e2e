import { test, expect } from '@playwright/test';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage';
import { CartPage } from '../../page-objects/CartPage';
import { Header } from '../../page-objects/components/Header';
import { getTestProduct, getInStockProduct } from '../../fixtures/defaultFixtures';

/**
 * Property Tests: Cart Operations Maintain Consistency
 *
 * Property 6: Cart Operations Maintain Consistency
 * Validates: Requirements 4.1, 4.2, 4.3
 *
 * These tests verify invariants that should always hold true:
 * - Cart item count matches header badge
 * - Item totals equal price × quantity
 * - Cart total equals sum of item totals
 * - Removing all items results in empty cart
 */
test.describe('Cart Operations Consistency (Property Tests)', () => {
  let productDetailPage: ProductDetailPage;
  let cartPage: CartPage;
  let header: Header;

  test.beforeEach(async ({ page }) => {
    productDetailPage = new ProductDetailPage(page);
    cartPage = new CartPage(page);
    header = new Header(page);
  });

  /**
   * Property: Header badge count matches actual cart item count
   * Invariant: badge_count === sum(item_quantities)
   * 
   * Note: On mobile, the cart badge is not visible in the header - it's only
   * shown in the mobile drawer menu. This test verifies the cart page item count instead.
   */
  test('header badge count matches cart item quantities', async ({ page, browserName }, testInfo) => {
    // Add first product with quantity 1
    const product1 = getTestProduct(0);
    await productDetailPage.gotoProduct(product1.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();
    await page.waitForTimeout(1000);

    // On mobile, the cart badge is not visible in the header
    // Instead, verify by going to cart page
    const isMobile = testInfo.project.name === 'mobile-chrome';
    
    if (isMobile) {
      // On mobile, verify cart has items by navigating to cart page
      await cartPage.goto();
      await cartPage.waitForPage();
      let itemCount = await cartPage.getItemCount();
      expect(itemCount).toBe(1);
      
      // Add second product
      const product2 = getTestProduct(1);
      await productDetailPage.gotoProduct(product2.slug);
      await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
      await productDetailPage.addToCart();
      await page.waitForTimeout(1000);
      
      // Verify cart now has 2 items
      await cartPage.goto();
      await cartPage.waitForPage();
      itemCount = await cartPage.getItemCount();
      expect(itemCount).toBe(2);
    } else {
      // On desktop, check header badge
      let badgeCount = await header.getCartItemCount();
      expect(badgeCount).toBe(1);

      // Add second product with quantity 1
      const product2 = getTestProduct(1);
      await productDetailPage.gotoProduct(product2.slug);
      await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
      await productDetailPage.addToCart();
      await page.waitForTimeout(1000);

      // Check header badge shows 2
      badgeCount = await header.getCartItemCount();
      expect(badgeCount).toBe(2);

      // Go to cart and verify item count matches
      await cartPage.goto();
      await cartPage.waitForPage();
      const cartItemCount = await cartPage.getItemCount();
      expect(cartItemCount).toBe(2);
    }
  });

  /**
   * Property: Item total equals price × quantity
   * Invariant: item_total === item_price × item_quantity
   */
  test('item total equals price multiplied by quantity', async ({ page }) => {
    const product = getInStockProduct();

    // Add product to cart
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();
    await page.waitForTimeout(1000);

    // Go to cart
    await cartPage.goto();
    await cartPage.waitForPage();

    // Get cart items and verify calculation
    const items = await cartPage.getCartItems();
    expect(items.length).toBeGreaterThan(0);

    for (const item of items) {
      const expectedTotal = item.price * item.quantity;
      // Allow small floating point tolerance
      expect(item.total).toBeCloseTo(expectedTotal, 1);
    }
  });

  /**
   * Property: Cart total equals sum of all item totals (without coupon)
   * Invariant: cart_total === sum(item_totals)
   */
  test('cart total equals sum of item totals', async ({ page }) => {
    // Add multiple products
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

    // Go to cart
    await cartPage.goto();
    await cartPage.waitForPage();

    // Get all items and calculate expected total
    const items = await cartPage.getCartItems();
    const expectedTotal = items.reduce((sum, item) => sum + item.total, 0);

    // Get actual cart total
    const actualTotal = await cartPage.getTotal();

    // Verify they match (allow small tolerance for floating point)
    expect(actualTotal).toBeCloseTo(expectedTotal, 1);
  });

  /**
   * Property: Removing all items results in empty cart
   * Invariant: after removing all items, cart.isEmpty() === true
   */
  test('removing all items results in empty cart', async ({ page }) => {
    // Add a product
    const product = getInStockProduct();
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();
    await page.waitForTimeout(1000);

    // Go to cart
    await cartPage.goto();
    await cartPage.waitForPage();

    // Verify cart has items
    await cartPage.assertCartHasItems();

    // Remove the item
    await cartPage.removeItem(product.name);
    await page.waitForTimeout(1000);

    // Verify cart is now empty
    await cartPage.assertCartEmpty();
  });

  /**
   * Property: Quantity update reflects in item total
   * Invariant: after quantity change, new_total === price × new_quantity
   */
  test('quantity update correctly recalculates item total', async ({ page }) => {
    const product = getInStockProduct();

    // Add product to cart
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();
    await page.waitForTimeout(1000);

    // Go to cart
    await cartPage.goto();
    await cartPage.waitForPage();

    // Get initial item data
    const initialItems = await cartPage.getCartItems();
    expect(initialItems.length).toBe(1);
    const initialPrice = initialItems[0].price;

    // Update quantity to 3
    await cartPage.updateItemQuantity(product.name, 3);
    await page.waitForTimeout(1000);

    // Get updated item data
    const updatedItems = await cartPage.getCartItems();
    expect(updatedItems.length).toBe(1);

    // Verify new total equals price × 3
    const expectedTotal = initialPrice * 3;
    expect(updatedItems[0].total).toBeCloseTo(expectedTotal, 1);
    expect(updatedItems[0].quantity).toBe(3);
  });

  /**
   * Property: Cart subtotal equals cart total when no coupon applied
   * Invariant: without coupon, subtotal === total
   */
  test('subtotal equals total when no coupon applied', async ({ page }) => {
    const product = getInStockProduct();

    // Add product to cart
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();
    await page.waitForTimeout(1000);

    // Go to cart
    await cartPage.goto();
    await cartPage.waitForPage();

    // Verify no coupon is applied
    const hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeFalsy();

    // Get subtotal and total
    const subtotal = await cartPage.getSubtotal();
    const total = await cartPage.getTotal();

    // They should be equal
    expect(total).toBeCloseTo(subtotal, 1);
  });
});
