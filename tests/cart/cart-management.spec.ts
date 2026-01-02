import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { ShopPage } from '../../page-objects/ShopPage';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage';
import { CartPage } from '../../page-objects/CartPage';
import {
  getIsolatedUser,
  getInStockProduct,
} from '../../fixtures/defaultFixtures';

/**
 * Cart Management E2E Tests
 *
 * Tests for cart page functionality including viewing, updating, and removing items
 *
 * Requirements covered:
 * - 4.2: Cart management (view, update, remove)
 * - 4.3: Cart persistence for logged-in users
 * - 4.6: Empty cart state
 */
test.describe('Cart Management', () => {
  let loginPage: LoginPage;
  let productDetailPage: ProductDetailPage;
  let cartPage: CartPage;
  let shopPage: ShopPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productDetailPage = new ProductDetailPage(page);
    cartPage = new CartPage(page);
    shopPage = new ShopPage(page);
  });

  test('should display cart page with items', async ({ page }) => {
    // Requirements: 4.2
    const product = getInStockProduct();

    // Add a product to cart first
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();

    // Wait for add to cart notification
    await page.locator('.MuiSnackbar-root').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Navigate to cart page
    await cartPage.goto();
    await cartPage.waitForPage();

    // Verify cart has items
    const isEmpty = await cartPage.isEmpty();
    expect(isEmpty).toBeFalsy();

    // Verify the product is displayed
    const hasProduct = await cartPage.hasProduct(product.name);
    expect(hasProduct).toBeTruthy();
  });

  test('should update item quantity in cart', async ({ page }) => {
    // Requirements: 4.2
    const product = getInStockProduct();
    const newQuantity = 5;

    // Add a product to cart
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();

    // Wait for add to cart notification
    await page.locator('.MuiSnackbar-root').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Navigate to cart page
    await cartPage.goto();
    await cartPage.waitForPage();

    // Update quantity
    await cartPage.updateItemQuantity(product.name, newQuantity);

    // Verify quantity was updated
    const quantity = await cartPage.getItemQuantity(product.name);
    expect(quantity).toBe(newQuantity);
  });

  test('should remove item from cart', async ({ page }) => {
    // Requirements: 4.2
    const product = getInStockProduct();

    // Add a product to cart
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();

    // Wait for add to cart notification
    await page.locator('.MuiSnackbar-root').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Navigate to cart page
    await cartPage.goto();
    await cartPage.waitForPage();

    // Verify product is in cart
    let hasProduct = await cartPage.hasProduct(product.name);
    expect(hasProduct).toBeTruthy();

    // Remove the item
    await cartPage.removeItem(product.name);

    // Verify product was removed - cart should be empty now
    const isEmpty = await cartPage.isEmpty();
    expect(isEmpty).toBeTruthy();
  });

  test('should display empty cart state', async ({ page }) => {
    // Requirements: 4.6
    // Clear any existing cart items by clearing localStorage
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });

    await cartPage.goto();
    await cartPage.waitForPage();

    // Verify empty cart message is displayed
    const isEmpty = await cartPage.isEmpty();
    expect(isEmpty).toBeTruthy();

    // Verify continue shopping button is available
    await expect(cartPage.continueShoppingButton).toBeVisible();
  });

  test('should persist cart for logged-in users after navigation', async ({ page }) => {
    // Requirements: 4.3, 4.6
    // Use isolated user for this test file to avoid race conditions
    const customer = getIsolatedUser('cartManagement');
    const product = getInStockProduct();

    // Login first
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(customer.email, customer.password);
    await loginPage.waitForLoginComplete();

    // Add a product to cart
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();

    // Wait for add to cart notification
    await page.locator('.MuiSnackbar-root').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Navigate to cart and verify item
    await cartPage.goto();
    await cartPage.waitForPage();

    let hasProduct = await cartPage.hasProduct(product.name);
    expect(hasProduct).toBeTruthy();

    // Navigate away to shop page
    await shopPage.goto();
    await shopPage.waitForPage();

    // Navigate back to cart
    await cartPage.goto();
    await cartPage.waitForPage();

    // Verify cart still has the product (persistence)
    hasProduct = await cartPage.hasProduct(product.name);
    expect(hasProduct).toBeTruthy();
  });

  test('should show correct cart totals', async ({ page }) => {
    // Requirements: 4.2
    const product = getInStockProduct();

    // Add a product to cart
    await productDetailPage.gotoProduct(product.slug);
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    await productDetailPage.addToCart();

    // Wait for add to cart notification
    await page.locator('.MuiSnackbar-root').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Navigate to cart page
    await cartPage.goto();
    await cartPage.waitForPage();

    // Verify totals are displayed and greater than 0
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toBeGreaterThan(0);

    const total = await cartPage.getTotal();
    expect(total).toBeGreaterThan(0);

    // Subtotal and total should be equal when no coupon is applied
    expect(total).toBeCloseTo(subtotal, 1);
  });

  test('should navigate to shop when clicking continue shopping', async ({ page }) => {
    // Requirements: 4.6
    // Clear cart first
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.removeItem('zenithCartItems');
    });

    await cartPage.goto();
    await cartPage.waitForPage();

    // Click continue shopping
    await cartPage.continueShopping();

    // Verify navigation to shop page
    await expect(page).toHaveURL(/\/shop/);
  });
});
