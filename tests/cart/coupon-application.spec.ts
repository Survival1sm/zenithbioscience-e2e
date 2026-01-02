import { test, expect } from '@playwright/test';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage';
import { CartPage } from '../../page-objects/CartPage';
import {
  getInStockProduct,
  getTestProduct,
  getTestCoupon,
} from '../../fixtures/defaultFixtures';

/**
 * Coupon Application E2E Tests
 *
 * Tests for applying and validating coupon codes in the cart
 *
 * Requirements covered:
 * - 4.4: Coupon application
 * - 4.5: Coupon validation (invalid/expired coupons, minimum order requirements)
 */
test.describe('Coupon Application', () => {
  let productDetailPage: ProductDetailPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    productDetailPage = new ProductDetailPage(page);
    cartPage = new CartPage(page);
  });

  /**
   * Helper function to add a product to cart and navigate to cart page
   */
  async function addProductAndGoToCart(page: any, productSlug: string): Promise<void> {
    await productDetailPage.gotoProduct(productSlug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();
    // Wait for add to cart notification
    await page.locator('.MuiSnackbar-root').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await cartPage.goto();
    await cartPage.waitForPage();
  }

  test('should apply valid percentage coupon (E2ETEST10)', async ({ page }) => {
    // Requirements: 4.4
    const product = getInStockProduct();
    const coupon = getTestCoupon('percentage'); // E2ETEST10 - 10% off

    // Add product to cart
    await addProductAndGoToCart(page, product.slug);

    // Get subtotal before coupon
    const subtotalBefore = await cartPage.getSubtotal();
    expect(subtotalBefore).toBeGreaterThan(0);

    // Apply coupon
    await cartPage.applyCoupon(coupon.code);

    // Verify coupon was applied (success alert visible)
    const hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeTruthy();

    // Verify discount is applied (total should be less than subtotal)
    const total = await cartPage.getTotal();
    expect(total).toBeLessThan(subtotalBefore);
  });

  test('should apply valid fixed coupon (E2ESAVE20)', async ({ page }) => {
    // Requirements: 4.4
    // Use a product that meets the minimum order requirement ($50)
    const product = getTestProduct(0); // Test Peptide Alpha - $99.99
    const coupon = getTestCoupon('fixed'); // E2ESAVE20 - $20 off, min $50

    // Add product to cart
    await addProductAndGoToCart(page, product.slug);

    // Get subtotal before coupon
    const subtotalBefore = await cartPage.getSubtotal();
    expect(subtotalBefore).toBeGreaterThanOrEqual(coupon.minOrderAmount || 0);

    // Apply coupon
    await cartPage.applyCoupon(coupon.code);

    // Verify coupon was applied
    const hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeTruthy();

    // Verify discount is applied
    const total = await cartPage.getTotal();
    expect(total).toBeLessThan(subtotalBefore);
  });

  // Test that expired coupons are properly rejected by the backend
  // The test data seeds the E2EEXPIRED coupon with:
  // - active: false
  // - validUntil: yesterday
  test('should reject invalid/expired coupon (E2EEXPIRED)', async ({ page }) => {
    // Requirements: 4.5
    const product = getInStockProduct();
    const expiredCoupon = getTestCoupon('expired'); // E2EEXPIRED

    // Add product to cart
    await addProductAndGoToCart(page, product.slug);

    // Get subtotal before attempting coupon
    const subtotalBefore = await cartPage.getSubtotal();

    // Try to apply expired coupon
    await cartPage.applyCoupon(expiredCoupon.code);

    // Verify coupon was NOT applied (no success alert)
    const hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeFalsy();

    // Verify error message is shown
    const hasError = await cartPage.hasCouponError();
    expect(hasError).toBeTruthy();

    // Verify total remains unchanged
    const total = await cartPage.getTotal();
    expect(total).toBeCloseTo(subtotalBefore, 1);
  });

  test('should remove applied coupon', async ({ page }) => {
    // Requirements: 4.4
    const product = getInStockProduct();
    const coupon = getTestCoupon('percentage');

    // Add product to cart
    await addProductAndGoToCart(page, product.slug);

    // Get subtotal before coupon
    const subtotalBefore = await cartPage.getSubtotal();

    // Apply coupon
    await cartPage.applyCoupon(coupon.code);

    // Verify coupon was applied
    let hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeTruthy();

    // Remove coupon
    await cartPage.removeCoupon();

    // Wait for removal to process - check coupon is no longer applied
    await expect(async () => {
      const hasCoupon = await cartPage.hasCouponApplied();
      expect(hasCoupon).toBeFalsy();
    }).toPass({ timeout: 5000 });

    // Verify coupon was removed (no success alert)
    hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeFalsy();

    // Verify total is back to original subtotal
    const total = await cartPage.getTotal();
    expect(total).toBeCloseTo(subtotalBefore, 1);
  });

  test('should reject completely invalid coupon code', async ({ page }) => {
    // Requirements: 4.5
    const product = getInStockProduct();
    const invalidCouponCode = 'INVALIDCODE12345';

    // Add product to cart
    await addProductAndGoToCart(page, product.slug);

    // Get subtotal before attempting coupon
    const subtotalBefore = await cartPage.getSubtotal();

    // Try to apply invalid coupon
    await cartPage.applyCoupon(invalidCouponCode);

    // Verify coupon was NOT applied
    const hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeFalsy();

    // Verify error message is shown
    const hasError = await cartPage.hasCouponError();
    expect(hasError).toBeTruthy();

    // Verify total remains unchanged
    const total = await cartPage.getTotal();
    expect(total).toBeCloseTo(subtotalBefore, 1);
  });

  test('should show discount amount when coupon is applied', async ({ page }) => {
    // Requirements: 4.4
    const product = getInStockProduct();
    const coupon = getTestCoupon('percentage');

    // Add product to cart
    await addProductAndGoToCart(page, product.slug);

    // Apply coupon
    await cartPage.applyCoupon(coupon.code);

    // Verify coupon was applied
    const hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeTruthy();

    // Verify discount is displayed (savings shown in alert)
    const savings = await cartPage.getCouponSavings();
    expect(savings).toBeGreaterThan(0);
  });
});
