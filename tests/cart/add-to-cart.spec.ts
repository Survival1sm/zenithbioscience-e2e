import { test, expect } from '@playwright/test';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage';
import { CartPage } from '../../page-objects/CartPage';
import { Header } from '../../page-objects/components/Header';
import {
  getInStockProduct,
  getOutOfStockProduct,
} from '../../fixtures/defaultFixtures';

/**
 * Add to Cart E2E Tests
 *
 * Tests for adding products to the shopping cart
 *
 * Requirements covered:
 * - 4.1: Add to cart functionality
 */
test.describe('Add to Cart', () => {
  let productDetailPage: ProductDetailPage;
  let cartPage: CartPage;
  let header: Header;

  test.beforeEach(async ({ page }) => {
    productDetailPage = new ProductDetailPage(page);
    cartPage = new CartPage(page);
    header = new Header(page);
  });

  test('should add product to cart from product detail page', async ({ page }) => {
    // Requirements: 4.1
    const product = getInStockProduct();

    // Navigate to product detail page
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });

    // Verify product is in stock and add to cart button is visible
    const isInStock = await productDetailPage.isInStock();
    expect(isInStock).toBeTruthy();

    // Add product to cart
    await productDetailPage.addToCart();

    // Wait for snackbar notification
    await page.waitForTimeout(1000);

    // Navigate to cart and verify item was added
    await cartPage.goto();
    await cartPage.waitForPage();

    const isEmpty = await cartPage.isEmpty();
    expect(isEmpty).toBeFalsy();

    const hasProduct = await cartPage.hasProduct(product.name);
    expect(hasProduct).toBeTruthy();
  });

  test('should update cart count after adding product', async ({ page }, testInfo) => {
    // Requirements: 4.1
    const product = getInStockProduct();

    // Navigate to product and add to cart
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });

    // Add product to cart
    await productDetailPage.addToCart();

    // Wait for cart to update
    await page.waitForTimeout(1000);

    // On mobile, the cart badge is not visible in the header - it's in the drawer menu
    // Instead, verify by navigating to cart page
    const isMobile = testInfo.project.name === 'mobile-chrome';
    
    if (isMobile) {
      // On mobile, verify cart has items by navigating to cart page
      await cartPage.goto();
      await cartPage.waitForPage();
      const itemCount = await cartPage.getItemCount();
      expect(itemCount).toBeGreaterThanOrEqual(1);
    } else {
      // On desktop, verify cart count updated in header
      const cartCount = await header.getCartItemCount();
      expect(cartCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('should add multiple quantities of a product', async ({ page }) => {
    // Requirements: 4.1
    const product = getInStockProduct();
    const quantity = 3;

    // Navigate to product detail page
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.quantityInput.waitFor({ state: 'visible', timeout: 10000 });

    // Set quantity to 3
    await productDetailPage.setQuantity(quantity);

    // Verify quantity was set
    const setQuantity = await productDetailPage.getQuantity();
    expect(setQuantity).toBe(quantity);

    // Add to cart
    await productDetailPage.addToCart();

    // Wait for cart update
    await page.waitForTimeout(1000);

    // Navigate to cart and verify quantity
    await cartPage.goto();
    await cartPage.waitForPage();

    // Verify the product is in cart with correct quantity
    const hasProduct = await cartPage.hasProduct(product.name);
    expect(hasProduct).toBeTruthy();

    const itemQuantity = await cartPage.getItemQuantity(product.name);
    expect(itemQuantity).toBe(quantity);
  });

  test('should not allow adding out-of-stock product to cart', async ({ page }) => {
    // Requirements: 4.1
    const outOfStockProduct = getOutOfStockProduct();

    // Navigate to out-of-stock product
    await productDetailPage.gotoProduct(outOfStockProduct.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });

    // Verify product shows out of stock status
    const isOutOfStock = await productDetailPage.isOutOfStock();
    expect(isOutOfStock).toBeTruthy();

    // Verify add to cart button is not visible or disabled
    const addToCartVisible = await productDetailPage.addToCartButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (addToCartVisible) {
      // If button is visible, it should be disabled
      const isEnabled = await productDetailPage.isAddToCartEnabled();
      expect(isEnabled).toBeFalsy();
    } else {
      // Button should not be visible for out-of-stock products
      expect(addToCartVisible).toBeFalsy();
    }
  });
});
