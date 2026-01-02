import { Page, Locator } from '@playwright/test';

/**
 * Cart Drawer component Page Object
 * Handles cart sidebar interactions including viewing items, updating quantities, and checkout
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 */
export class CartDrawer {
  private readonly page: Page;

  // Selectors
  private readonly drawerSelector = '[data-testid="cart-drawer"]';
  private readonly closeButtonSelector = '[data-testid="cart-drawer-close"]';
  private readonly cartItemsContainerSelector = '[data-testid="cart-items"]';
  private readonly cartItemSelector = '[data-testid="cart-item"]';
  private readonly cartTotalSelector = '[data-testid="cart-total"]';
  private readonly checkoutButtonSelector = '[data-testid="checkout-button"]';
  private readonly emptyCartMessageSelector = '[data-testid="empty-cart-message"]';
  private readonly cartSubtotalSelector = '[data-testid="cart-subtotal"]';

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Locators ====================

  get drawer(): Locator {
    return this.page.locator(this.drawerSelector);
  }

  get closeButton(): Locator {
    return this.page.locator(this.closeButtonSelector);
  }

  get cartItemsContainer(): Locator {
    return this.page.locator(this.cartItemsContainerSelector);
  }

  get cartItems(): Locator {
    return this.page.locator(this.cartItemSelector);
  }

  get cartTotal(): Locator {
    return this.page.locator(this.cartTotalSelector);
  }

  get checkoutButton(): Locator {
    return this.page.locator(this.checkoutButtonSelector);
  }

  get emptyCartMessage(): Locator {
    return this.page.locator(this.emptyCartMessageSelector);
  }

  get cartSubtotal(): Locator {
    return this.page.locator(this.cartSubtotalSelector);
  }

  // ==================== Drawer Actions ====================

  /**
   * Open the cart drawer
   * Note: This typically requires clicking the cart icon in the header
   */
  async open(): Promise<void> {
    // Click the cart icon to open the drawer
    await this.page.locator('[data-testid="cart-icon"]').click();
    await this.drawer.waitFor({ state: 'visible' });
  }

  /**
   * Close the cart drawer
   */
  async close(): Promise<void> {
    await this.closeButton.click();
    await this.drawer.waitFor({ state: 'hidden' });
  }

  /**
   * Check if the cart drawer is open
   * @returns True if drawer is visible
   */
  async isOpen(): Promise<boolean> {
    return await this.drawer.isVisible();
  }

  /**
   * Wait for the cart drawer to be visible
   */
  async waitForDrawer(): Promise<void> {
    await this.drawer.waitFor({ state: 'visible' });
  }

  // ==================== Cart Item Actions ====================

  /**
   * Get all cart items
   * @returns Array of cart item data
   */
  async getCartItems(): Promise<CartItemData[]> {
    const items: CartItemData[] = [];
    const count = await this.cartItems.count();

    for (let i = 0; i < count; i++) {
      const item = this.cartItems.nth(i);
      const name = await item.locator('[data-testid="cart-item-name"]').textContent();
      const priceText = await item.locator('[data-testid="cart-item-price"]').textContent();
      const quantityText = await item.locator('[data-testid="cart-item-quantity"]').inputValue();
      const productId = await item.getAttribute('data-product-id');

      items.push({
        productId: productId || '',
        name: name || '',
        price: this.parsePrice(priceText || '0'),
        quantity: parseInt(quantityText || '1', 10),
      });
    }

    return items;
  }

  /**
   * Get the number of items in the cart
   * @returns Number of distinct items
   */
  async getItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * Check if the cart is empty
   * @returns True if cart is empty
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyCartMessage.isVisible();
  }

  /**
   * Get a specific cart item by product ID
   * @param productId - The product ID
   * @returns Locator for the cart item
   */
  getCartItemByProductId(productId: string): Locator {
    return this.page.locator(`${this.cartItemSelector}[data-product-id="${productId}"]`);
  }

  /**
   * Get a specific cart item by index
   * @param index - The item index (0-based)
   * @returns Locator for the cart item
   */
  getCartItemByIndex(index: number): Locator {
    return this.cartItems.nth(index);
  }

  // ==================== Quantity Actions ====================

  /**
   * Update the quantity of a cart item by product ID
   * @param productId - The product ID
   * @param quantity - The new quantity
   */
  async updateItemQuantity(productId: string, quantity: number): Promise<void> {
    const item = this.getCartItemByProductId(productId);
    const quantityInput = item.locator('[data-testid="cart-item-quantity"]');
    await quantityInput.fill(quantity.toString());
    await quantityInput.press('Enter');
    // Wait for cart to update
    await this.page.waitForResponse(
      (response) => response.url().includes('/cart') && response.status() === 200
    ).catch(() => {
      // Response might not be captured if cart updates locally
    });
  }

  /**
   * Increment the quantity of a cart item
   * @param productId - The product ID
   */
  async incrementItemQuantity(productId: string): Promise<void> {
    const item = this.getCartItemByProductId(productId);
    await item.locator('[data-testid="cart-item-increment"]').click();
  }

  /**
   * Decrement the quantity of a cart item
   * @param productId - The product ID
   */
  async decrementItemQuantity(productId: string): Promise<void> {
    const item = this.getCartItemByProductId(productId);
    await item.locator('[data-testid="cart-item-decrement"]').click();
  }

  /**
   * Get the quantity of a specific cart item
   * @param productId - The product ID
   * @returns The quantity
   */
  async getItemQuantity(productId: string): Promise<number> {
    const item = this.getCartItemByProductId(productId);
    const quantityText = await item.locator('[data-testid="cart-item-quantity"]').inputValue();
    return parseInt(quantityText || '0', 10);
  }

  // ==================== Remove Item Actions ====================

  /**
   * Remove an item from the cart by product ID
   * @param productId - The product ID
   */
  async removeItem(productId: string): Promise<void> {
    const item = this.getCartItemByProductId(productId);
    await item.locator('[data-testid="cart-item-remove"]').click();
    // Wait for item to be removed
    await item.waitFor({ state: 'hidden' });
  }

  /**
   * Remove an item from the cart by index
   * @param index - The item index (0-based)
   */
  async removeItemByIndex(index: number): Promise<void> {
    const item = this.getCartItemByIndex(index);
    const productId = await item.getAttribute('data-product-id');
    await item.locator('[data-testid="cart-item-remove"]').click();
    if (productId) {
      await this.getCartItemByProductId(productId).waitFor({ state: 'hidden' });
    }
  }

  /**
   * Clear all items from the cart
   */
  async clearCart(): Promise<void> {
    const count = await this.getItemCount();
    for (let i = count - 1; i >= 0; i--) {
      await this.removeItemByIndex(i);
    }
  }

  // ==================== Total and Checkout ====================

  /**
   * Get the cart total amount
   * @returns The total amount as a number
   */
  async getCartTotal(): Promise<number> {
    const totalText = await this.cartTotal.textContent();
    return this.parsePrice(totalText || '0');
  }

  /**
   * Get the cart subtotal amount
   * @returns The subtotal amount as a number
   */
  async getCartSubtotal(): Promise<number> {
    const subtotalText = await this.cartSubtotal.textContent();
    return this.parsePrice(subtotalText || '0');
  }

  /**
   * Click the proceed to checkout button
   */
  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if the checkout button is enabled
   * @returns True if checkout button is enabled
   */
  async isCheckoutEnabled(): Promise<boolean> {
    return await this.checkoutButton.isEnabled();
  }

  // ==================== Utility Methods ====================

  /**
   * Parse a price string to a number
   * @param priceText - The price text (e.g., "$99.99" or "99.99")
   * @returns The price as a number
   */
  private parsePrice(priceText: string): number {
    const cleanedPrice = priceText.replace(/[^0-9.]/g, '');
    return parseFloat(cleanedPrice) || 0;
  }

  /**
   * Wait for the cart to update after an action
   */
  async waitForCartUpdate(): Promise<void> {
    // Wait for any loading indicators to disappear
    const loadingIndicator = this.page.locator('[data-testid="cart-loading"]');
    if (await loadingIndicator.isVisible()) {
      await loadingIndicator.waitFor({ state: 'hidden' });
    }
  }
}

/**
 * Interface representing cart item data
 */
export interface CartItemData {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}
