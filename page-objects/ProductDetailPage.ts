import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ProductDetailPage Page Object
 * Handles product detail page interactions using role-based selectors
 */
export class ProductDetailPage extends BasePage {
  readonly path = '/shop';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /** Product name heading (h1) */
  get productName(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** Add to Cart button */
  get addToCartButton(): Locator {
    return this.page.getByRole('button', { name: 'Add to Cart' });
  }

  /** Back button */
  get backButton(): Locator {
    return this.page.getByRole('button', { name: 'Back' });
  }

  /** Quantity input field - MUI TextField with label "Quantity" */
  get quantityInput(): Locator {
    return this.page.getByLabel('Quantity');
  }

  /** Error message when product fails to load */
  get errorMessage(): Locator {
    return this.page.getByText('Failed to load product');
  }

  /** Return to Shop link (shown on error) */
  get returnToShopLink(): Locator {
    return this.page.getByRole('link', { name: 'Return to Shop' });
  }

  /** Out of Stock chip - use exact match to avoid matching product name */
  get outOfStockChip(): Locator {
    return this.page.locator('.MuiChip-label').filter({ hasText: /^Out of Stock$/ });
  }

  // ==================== Navigation Methods ====================

  /**
   * Navigate to a specific product detail page by slug
   */
  async gotoProduct(slug: string): Promise<void> {
    await this.navigateTo(`${this.baseUrl}/shop/${slug}`);
    await this.waitForProductLoad();
  }

  /**
   * Wait for the product page to finish loading
   * Handles: product loaded, error message, or 404 page
   */
  async waitForProductLoad(): Promise<void> {
    // Wait for either the product name, error message, or 404 page to appear
    await Promise.race([
      this.productName.waitFor({ state: 'visible', timeout: 10000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 10000 }),
      this.page.getByText('404').first().waitFor({ state: 'visible', timeout: 10000 }),
      this.page.getByText(/not found/i).first().waitFor({ state: 'visible', timeout: 10000 }),
    ]);
  }

  /**
   * Click the back button to return to previous page
   */
  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  // ==================== Product Info Methods ====================

  /**
   * Get the product name text
   */
  async getName(): Promise<string> {
    const name = await this.productName.textContent();
    return name?.trim() || '';
  }

  /**
   * Check if the product loaded successfully
   */
  async isProductLoaded(): Promise<boolean> {
    return await this.productName.isVisible();
  }

  /**
   * Check if the error state is shown
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  // ==================== Stock Status Methods ====================

  /**
   * Check if the product is out of stock
   */
  async isOutOfStock(): Promise<boolean> {
    return await this.outOfStockChip.isVisible();
  }

  /**
   * Check if the product is in stock (add to cart available)
   */
  async isInStock(): Promise<boolean> {
    const outOfStock = await this.isOutOfStock();
    if (outOfStock) return false;
    return await this.addToCartButton.isVisible();
  }

  // ==================== Add to Cart Methods ====================

  /**
   * Add the product to cart with current quantity
   */
  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  /**
   * Check if add to cart button is enabled
   */
  async isAddToCartEnabled(): Promise<boolean> {
    return await this.addToCartButton.isEnabled();
  }

  // ==================== Quantity Methods ====================

  /**
   * Set the quantity value
   */
  async setQuantity(qty: number): Promise<void> {
    await this.quantityInput.fill(qty.toString());
  }

  /**
   * Get the current quantity value
   */
  async getQuantity(): Promise<number> {
    const value = await this.quantityInput.inputValue();
    return parseInt(value || '1', 10);
  }
}
