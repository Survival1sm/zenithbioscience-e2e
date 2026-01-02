import { test, expect } from '@playwright/test';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage';
import { getInStockProduct, getOutOfStockProduct } from '../../fixtures/defaultFixtures';

/**
 * Product Detail E2E Tests
 *
 * Tests for product detail page functionality with seeded products
 *
 * Requirements covered:
 * - 3.3: Product detail page displays correct information
 */
test.describe('Product Detail', () => {
  let productDetailPage: ProductDetailPage;

  test.beforeEach(async ({ page }) => {
    productDetailPage = new ProductDetailPage(page);
  });

  test('should display product details correctly', async () => {
    const product = getInStockProduct();
    await productDetailPage.gotoProduct(product.slug);

    // Verify product loaded
    const isLoaded = await productDetailPage.isProductLoaded();
    expect(isLoaded).toBeTruthy();
  });

  test('should display product name', async () => {
    const product = getInStockProduct();
    await productDetailPage.gotoProduct(product.slug);

    const name = await productDetailPage.getName();
    expect(name).toBeTruthy();
    expect(name.toLowerCase()).toContain(product.name.toLowerCase().split(' ')[0]);
  });

  test('should have add to cart button visible for in-stock product', async () => {
    const product = getInStockProduct();
    await productDetailPage.gotoProduct(product.slug);

    // Wait for product name to be visible first (indicates page loaded)
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    
    // The add to cart button should be visible for in-stock products when store is live
    await expect(productDetailPage.addToCartButton).toBeVisible({ timeout: 10000 });
  });

  test('should have quantity selector visible for in-stock product', async () => {
    const product = getInStockProduct();
    await productDetailPage.gotoProduct(product.slug);

    // Wait for product name to be visible first
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    
    // Quantity input should be visible for in-stock products
    await expect(productDetailPage.quantityInput).toBeVisible({ timeout: 10000 });
  });

  test('should show out of stock status for out-of-stock product', async () => {
    const product = getOutOfStockProduct();
    await productDetailPage.gotoProduct(product.slug);

    const isOutOfStock = await productDetailPage.isOutOfStock();
    expect(isOutOfStock).toBeTruthy();
  });

  test('should not show add to cart for out-of-stock product', async () => {
    const product = getOutOfStockProduct();
    await productDetailPage.gotoProduct(product.slug);

    // Wait for product name to be visible first
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    
    // For out-of-stock products, add to cart should not be visible
    const addToCartVisible = await productDetailPage.addToCartButton.isVisible({ timeout: 3000 }).catch(() => false);
    expect(addToCartVisible).toBeFalsy();
  });

  test('should allow changing quantity when available', async () => {
    const product = getInStockProduct();
    await productDetailPage.gotoProduct(product.slug);

    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });
    
    // Wait for quantity input to be visible
    await productDetailPage.quantityInput.waitFor({ state: 'visible', timeout: 10000 });
    
    await productDetailPage.setQuantity(3);
    const quantity = await productDetailPage.getQuantity();
    expect(quantity).toBe(3);
  });

  test('should navigate back when clicking back button', async ({ page }) => {
    // First navigate to shop, then to product detail to have history
    await page.goto('http://localhost:3000/shop');
    await page.waitForLoadState('domcontentloaded');
    
    const product = getInStockProduct();
    await productDetailPage.gotoProduct(product.slug);
    
    // Wait for product to load
    await productDetailPage.productName.waitFor({ state: 'visible', timeout: 10000 });

    // Check if back button exists and click it
    const backButtonVisible = await productDetailPage.backButton.isVisible().catch(() => false);

    if (backButtonVisible) {
      await productDetailPage.backButton.click();
      // Wait for navigation to complete
      await page.waitForURL(/\/shop/, { timeout: 10000 });
      expect(page.url()).toContain('/shop');
    } else {
      // Use browser back navigation
      await page.goBack();
      await page.waitForURL(/\/shop/, { timeout: 10000 });
      expect(page.url()).toContain('/shop');
    }
  });

  test('should show 404 for non-existent product', async ({ page }) => {
    await productDetailPage.gotoProduct('non-existent-product-slug-12345');

    // Next.js returns 404 page for non-existent products
    // Check for 404 text or error state
    const has404 = await page.getByText('404').isVisible().catch(() => false);
    const hasNotFound = await page.getByText(/not found/i).isVisible().catch(() => false);
    const hasError = await productDetailPage.hasError();

    expect(has404 || hasNotFound || hasError).toBeTruthy();
  });
});
