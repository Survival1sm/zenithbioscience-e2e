import { test, expect } from '@playwright/test';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage';
import { CartPage } from '../../page-objects/CartPage';
import { getTestProduct, getTestCoupon } from '../../fixtures/defaultFixtures';

/**
 * Property Tests: Coupon Discount Calculation
 *
 * Property 7: Coupon Discount Calculation
 * Validates: Requirements 4.4
 *
 * These tests verify coupon calculation invariants:
 * - Percentage discount: total = subtotal × (1 - discount_percent/100)
 * - Fixed discount: total = subtotal - fixed_amount
 * - Discount never exceeds subtotal (total >= 0)
 * - Removing coupon restores original total
 */
test.describe('Coupon Discount Calculation (Property Tests)', () => {
  let productDetailPage: ProductDetailPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    productDetailPage = new ProductDetailPage(page);
    cartPage = new CartPage(page);
  });

  /**
   * Helper to add product and go to cart
   */
  async function addProductAndGoToCart(page: any, productSlug: string): Promise<void> {
    await productDetailPage.gotoProduct(productSlug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();
    // Wait for cart update - either snackbar notification or network idle
    await Promise.race([
      page.waitForSelector('.MuiSnackbar-root', { state: 'visible', timeout: 5000 }).catch(() => {}),
      page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {}),
    ]);
    await cartPage.goto();
    await cartPage.waitForPage();
  }

  /**
   * Property: Percentage discount correctly reduces total
   * Invariant: total = subtotal × (1 - discount_percent/100)
   */
  test('percentage discount correctly calculates total', async ({ page }) => {
    const product = getTestProduct(0); // $99.99
    const coupon = getTestCoupon('percentage'); // 10% off

    await addProductAndGoToCart(page, product.slug);

    // Get subtotal before coupon
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toBeGreaterThan(0);

    // Apply percentage coupon
    await cartPage.applyCoupon(coupon.code);

    // Verify coupon was applied
    const hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeTruthy();

    // Calculate expected total: subtotal × (1 - 10/100) = subtotal × 0.9
    const expectedTotal = subtotal * (1 - coupon.discountValue / 100);

    // Get actual total
    const actualTotal = await cartPage.getTotal();

    // Verify calculation (allow small tolerance)
    expect(actualTotal).toBeCloseTo(expectedTotal, 1);
  });

  /**
   * Property: Fixed discount correctly reduces total
   * Invariant: total = subtotal - fixed_amount
   */
  test('fixed discount correctly calculates total', async ({ page }) => {
    const product = getTestProduct(0); // $99.99 - meets $50 minimum
    const coupon = getTestCoupon('fixed'); // $20 off, min $50

    await addProductAndGoToCart(page, product.slug);

    // Get subtotal before coupon
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toBeGreaterThanOrEqual(coupon.minOrderAmount || 0);

    // Apply fixed coupon
    await cartPage.applyCoupon(coupon.code);

    // Verify coupon was applied
    const hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeTruthy();

    // Calculate expected total: subtotal - $20
    const expectedTotal = subtotal - coupon.discountValue;

    // Get actual total
    const actualTotal = await cartPage.getTotal();

    // Verify calculation (allow small tolerance)
    expect(actualTotal).toBeCloseTo(expectedTotal, 1);
  });

  /**
   * Property: Discount amount shown matches actual reduction
   * Invariant: savings_shown === subtotal - total
   */
  test('displayed savings matches actual discount', async ({ page }) => {
    const product = getTestProduct(0);
    const coupon = getTestCoupon('percentage');

    await addProductAndGoToCart(page, product.slug);

    // Get subtotal before coupon
    const subtotal = await cartPage.getSubtotal();

    // Apply coupon
    await cartPage.applyCoupon(coupon.code);

    // Verify coupon was applied
    const hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeTruthy();

    // Get displayed savings from alert
    const displayedSavings = await cartPage.getCouponSavings();

    // Get actual total
    const actualTotal = await cartPage.getTotal();

    // Calculate actual savings
    const actualSavings = subtotal - actualTotal;

    // Verify displayed savings matches actual savings
    expect(displayedSavings).toBeCloseTo(actualSavings, 1);
  });

  /**
   * Property: Removing coupon restores original total
   * Invariant: after remove, total === original_subtotal
   */
  test('removing coupon restores original total', async ({ page }) => {
    const product = getTestProduct(0);
    const coupon = getTestCoupon('percentage');

    await addProductAndGoToCart(page, product.slug);

    // Get original subtotal
    const originalSubtotal = await cartPage.getSubtotal();

    // Apply coupon
    await cartPage.applyCoupon(coupon.code);
    const hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeTruthy();

    // Verify total is reduced
    const discountedTotal = await cartPage.getTotal();
    expect(discountedTotal).toBeLessThan(originalSubtotal);

    // Remove coupon
    await cartPage.removeCoupon();
    // Wait for coupon removal to complete
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Verify coupon is removed
    const stillHasCoupon = await cartPage.hasCouponApplied();
    expect(stillHasCoupon).toBeFalsy();

    // Verify total is restored to original
    const restoredTotal = await cartPage.getTotal();
    expect(restoredTotal).toBeCloseTo(originalSubtotal, 1);
  });

  /**
   * Property: Total is never negative
   * Invariant: total >= 0 (even with large discounts)
   */
  test('total is never negative after discount', async ({ page }) => {
    const product = getTestProduct(0);
    const coupon = getTestCoupon('percentage');

    await addProductAndGoToCart(page, product.slug);

    // Apply coupon
    await cartPage.applyCoupon(coupon.code);

    // Get total
    const total = await cartPage.getTotal();

    // Verify total is non-negative
    expect(total).toBeGreaterThanOrEqual(0);
  });

  /**
   * Property: Coupon discount is idempotent
   * Invariant: applying same coupon twice doesn't double discount
   * 
   * Note: The UI correctly prevents double-applying by hiding the coupon input
   * when a coupon is already applied. This test verifies that:
   * 1. After applying a coupon, the input is hidden (UI prevents re-application)
   * 2. Removing and re-applying gives the same discount
   */
  test('applying same coupon twice does not double discount', async ({ page }) => {
    const product = getTestProduct(0);
    const coupon = getTestCoupon('percentage');

    await addProductAndGoToCart(page, product.slug);

    // Get subtotal
    const subtotal = await cartPage.getSubtotal();

    // Apply coupon first time
    await cartPage.applyCoupon(coupon.code);
    const hasCoupon = await cartPage.hasCouponApplied();
    expect(hasCoupon).toBeTruthy();

    // Get total after first application
    const totalAfterFirst = await cartPage.getTotal();

    // Verify the coupon input is now hidden (UI prevents double-apply)
    const couponInputVisible = await cartPage.couponInput.isVisible();
    expect(couponInputVisible).toBeFalsy();

    // Remove coupon and re-apply to verify idempotency
    await cartPage.removeCoupon();
    // Wait for coupon removal to complete
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Re-apply the same coupon
    await cartPage.applyCoupon(coupon.code);
    // Wait for coupon application to complete
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Get total after re-application
    const totalAfterReapply = await cartPage.getTotal();

    // Verify total is the same (discount not doubled)
    expect(totalAfterReapply).toBeCloseTo(totalAfterFirst, 1);

    // Verify discount is still correct (10% off)
    const expectedTotal = subtotal * 0.9;
    expect(totalAfterReapply).toBeCloseTo(expectedTotal, 1);
  });
});
