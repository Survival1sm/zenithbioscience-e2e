import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Cart item data interface
 */
export interface CartItemData {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

/**
 * CartPage Page Object
 * Handles cart page interactions including viewing items, updating quantities, applying coupons, and checkout
 *
 * Based on actual frontend implementation:
 * - Cart page: zenithbioscience-next/src/app/cart/page.tsx
 * - CartItems component: zenithbioscience-next/src/app/_components/cart/CartItems.tsx
 * - MobileCartItem component: zenithbioscience-next/src/app/_components/cart/MobileCartItem.tsx
 * - CartContext: zenithbioscience-next/src/app/_lib/CartContext.tsx
 *
 * Requirements covered:
 * - 4.1: Add to cart functionality
 * - 4.2: Cart management (view, update, remove)
 * - 4.3: Cart persistence for logged-in users
 * - 4.4: Coupon application
 * - 4.5: Coupon validation
 * - 4.6: Empty cart state
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 */
export class CartPage extends BasePage {
  readonly path = '/cart';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /** Page heading - "Your Cart" h1 (styled as h4) */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Your Cart', level: 1 });
  }

  /** Cart items container - data-testid="cart-items-container" */
  get cartItemsContainer(): Locator {
    return this.page.locator('[data-testid="cart-items-container"]');
  }

  /** Desktop cart items table - data-testid="desktop-cart-items" */
  get desktopCartItems(): Locator {
    return this.page.locator('[data-testid="desktop-cart-items"]');
  }

  /** Mobile cart items - data-testid="mobile-cart-items" */
  get mobileCartItems(): Locator {
    return this.page.locator('[data-testid="mobile-cart-items"]');
  }

  /** Individual mobile cart item cards - data-testid="mobile-cart-item" */
  get mobileCartItemCards(): Locator {
    return this.page.locator('[data-testid="mobile-cart-item"]');
  }

  /** Individual cart item rows in desktop table */
  get cartItemRows(): Locator {
    return this.desktopCartItems.locator('tbody tr');
  }

  /** Empty cart message - "Your cart is empty" */
  get emptyCartMessage(): Locator {
    return this.page.getByText('Your cart is empty');
  }

  /** Continue shopping button/link */
  get continueShoppingButton(): Locator {
    return this.page.getByRole('link', { name: 'Continue Shopping' });
  }

  /** Coupon input field - label "Coupon Code" */
  get couponInput(): Locator {
    return this.page.getByLabel('Coupon Code');
  }

  /** Apply coupon button */
  get applyCouponButton(): Locator {
    return this.page.getByRole('button', { name: 'Apply' });
  }

  /** Applied coupon success alert */
  get appliedCouponAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /coupon applied/i });
  }

  /** Coupon error alert */
  get couponErrorAlert(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.locator('.MuiAlert-standardError') });
  }

  /** Subtotal text - contains "Subtotal:" */
  get subtotalText(): Locator {
    return this.page.getByText('Subtotal:').locator('..').locator('xpath=following-sibling::*[1]');
  }

  /** Discount text - contains "Discount:" (only visible when coupon applied) */
  get discountText(): Locator {
    return this.page.getByText('Discount:').locator('..').locator('xpath=following-sibling::*[1]');
  }

  /** Total text - h6 containing total amount */
  get totalText(): Locator {
    return this.page.locator('h6').filter({ hasText: /^\$/ });
  }

  /** Proceed to Checkout button */
  get proceedToCheckoutButton(): Locator {
    return this.page.getByRole('link', { name: 'Proceed to Checkout' });
  }

  // ==================== Navigation Methods ====================

  /**
   * Wait for the cart page to be ready
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for page heading to appear
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });
    // Wait for either cart items container or empty cart message
    await Promise.race([
      this.cartItemsContainer.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      this.emptyCartMessage.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    ]);
  }

  /**
   * Check if we're on mobile view
   */
  async isMobileView(): Promise<boolean> {
    return await this.mobileCartItems.isVisible();
  }

  // ==================== Cart Item Methods ====================

  /**
   * Get the number of distinct items in the cart
   */
  async getItemCount(): Promise<number> {
    const isEmpty = await this.isEmpty();
    if (isEmpty) return 0;

    // Check if mobile or desktop view
    const isMobile = await this.isMobileView();
    if (isMobile) {
      // Mobile view uses MobileCartItem components with data-testid="mobile-cart-item"
      return await this.mobileCartItemCards.count();
    } else {
      // Desktop view uses table rows
      return await this.cartItemRows.count();
    }
  }

  /**
   * Check if the cart is empty
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyCartMessage.isVisible();
  }

  /**
   * Get a cart item row by product name (desktop view)
   */
  getCartItemByName(productName: string): Locator {
    // In desktop view, find the table row containing the product name
    return this.cartItemRows.filter({ hasText: productName });
  }

  /**
   * Get a mobile cart item card by product name
   */
  getMobileCartItemByName(productName: string): Locator {
    return this.mobileCartItemCards.filter({ hasText: productName });
  }

  /**
   * Get a cart item by index (desktop)
   */
  getCartItemByIndex(index: number): Locator {
    return this.cartItemRows.nth(index);
  }

  /**
   * Get a mobile cart item by index
   */
  getMobileCartItemByIndex(index: number): Locator {
    return this.mobileCartItemCards.nth(index);
  }

  /**
   * Get the quantity input for a specific cart item row (desktop)
   */
  getQuantityInput(itemRow: Locator): Locator {
    return itemRow.getByRole('spinbutton');
  }

  /**
   * Get the remove button for a specific cart item (desktop)
   * Uses aria-label pattern: "Remove {product name} from cart"
   */
  getRemoveButton(productName: string): Locator {
    return this.page.getByRole('button', { name: `Remove ${productName} from cart` });
  }

  /**
   * Get the remove button for a mobile cart item
   * Uses data-testid="mobile-cart-item-remove" within the item card
   */
  getMobileRemoveButton(itemCard: Locator): Locator {
    return itemCard.locator('[data-testid="mobile-cart-item-remove"]');
  }

  /**
   * Update the quantity of a cart item by name
   */
  async updateItemQuantity(productName: string, quantity: number): Promise<void> {
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      const itemCard = this.getMobileCartItemByName(productName);
      const quantityInput = itemCard.getByRole('spinbutton');
      await quantityInput.clear();
      await quantityInput.fill(quantity.toString());
      await quantityInput.press('Tab');
    } else {
      const itemRow = this.getCartItemByName(productName);
      const quantityInput = this.getQuantityInput(itemRow);
      await quantityInput.clear();
      await quantityInput.fill(quantity.toString());
      await quantityInput.press('Tab');
    }
    // Wait for cart update by checking the input value changed
    await expect(async () => {
      const currentQty = await this.getItemQuantity(productName);
      expect(currentQty).toBe(quantity);
    }).toPass({ timeout: 5000 }).catch(() => {});
  }

  /**
   * Remove an item from the cart by name
   */
  async removeItem(productName: string): Promise<void> {
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      const itemCard = this.getMobileCartItemByName(productName);
      const removeButton = this.getMobileRemoveButton(itemCard);
      await removeButton.click();
      // Wait for item card to be removed
      await itemCard.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    } else {
      const removeButton = this.getRemoveButton(productName);
      await removeButton.click();
      // Wait for item row to be removed
      const itemRow = this.getCartItemByName(productName);
      await itemRow.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  }

  /**
   * Get the quantity of a specific item
   */
  async getItemQuantity(productName: string): Promise<number> {
    const isMobile = await this.isMobileView();
    
    let quantityInput: Locator;
    if (isMobile) {
      const itemCard = this.getMobileCartItemByName(productName);
      quantityInput = itemCard.getByRole('spinbutton');
    } else {
      const itemRow = this.getCartItemByName(productName);
      quantityInput = this.getQuantityInput(itemRow);
    }
    
    const value = await quantityInput.inputValue();
    return parseInt(value || '0', 10);
  }

  /**
   * Check if a specific product is in the cart
   */
  async hasProduct(productName: string): Promise<boolean> {
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      const itemCard = this.getMobileCartItemByName(productName);
      return await itemCard.isVisible();
    } else {
      const itemRow = this.getCartItemByName(productName);
      return await itemRow.isVisible();
    }
  }

  /**
   * Get all cart items data
   */
  async getCartItems(): Promise<CartItemData[]> {
    const items: CartItemData[] = [];
    const count = await this.getItemCount();
    const isMobile = await this.isMobileView();

    for (let i = 0; i < count; i++) {
      if (isMobile) {
        const card = this.getMobileCartItemByIndex(i);
        
        // Get product name from the card (link text)
        const nameLink = card.locator('a').first();
        const name = await nameLink.textContent() || '';
        
        // Get price - look for the price text in the card
        const cardText = await card.textContent() || '';
        const priceMatch = cardText.match(/\$(\d+\.?\d*)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        
        // Get quantity from spinbutton
        const quantityInput = card.getByRole('spinbutton');
        const quantityValue = await quantityInput.inputValue();
        const quantity = parseInt(quantityValue || '1', 10);
        
        // Calculate total (mobile view may not show individual totals)
        const total = price * quantity;
        
        items.push({ name: name.trim(), price, quantity, total });
      } else {
        const row = this.getCartItemByIndex(i);
        const cells = row.locator('td');

        // Get product name from first cell
        const nameCell = cells.nth(0);
        const name = await nameCell.locator('a').first().textContent() || '';

        // Get price from second cell
        const priceCell = cells.nth(1);
        const priceText = await priceCell.textContent() || '0';
        const price = this.parsePrice(priceText);

        // Get quantity from third cell
        const quantityCell = cells.nth(2);
        const quantityInput = quantityCell.getByRole('spinbutton');
        const quantityValue = await quantityInput.inputValue();
        const quantity = parseInt(quantityValue || '1', 10);

        // Get total from fourth cell
        const totalCell = cells.nth(3);
        const totalText = await totalCell.textContent() || '0';
        const total = this.parsePrice(totalText);

        items.push({ name: name.trim(), price, quantity, total });
      }
    }

    return items;
  }

  // ==================== Coupon Methods ====================

  /**
   * Apply a coupon code
   */
  async applyCoupon(code: string): Promise<void> {
    await this.couponInput.fill(code.toUpperCase());
    await this.applyCouponButton.click();
    // Wait for coupon validation response by checking for success or error alert
    const successAlert = this.page.locator('.MuiAlert-standardSuccess');
    const errorAlert = this.page.locator('.MuiAlert-standardError');
    await Promise.race([
      successAlert.waitFor({ state: 'visible', timeout: 10000 }),
      errorAlert.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});
  }

  /**
   * Remove the applied coupon
   * The coupon remove button is in the coupon success alert section, not the cart items
   */
  async removeCoupon(): Promise<void> {
    // Find the success alert that contains "Coupon applied" and get the Remove button within that section
    const couponSection = this.page.locator('.MuiAlert-standardSuccess').locator('..').locator('..');
    const removeButton = couponSection.getByRole('button', { name: 'Remove', exact: true });
    
    // If that doesn't work, try finding the button that's NOT the mobile cart item remove button
    if (await removeButton.count() === 0) {
      // Fallback: find Remove button that's not inside a mobile-cart-item
      const allRemoveButtons = this.page.getByRole('button', { name: 'Remove', exact: true });
      const count = await allRemoveButtons.count();
      
      for (let i = 0; i < count; i++) {
        const btn = allRemoveButtons.nth(i);
        const testId = await btn.getAttribute('data-testid');
        if (testId !== 'mobile-cart-item-remove') {
          await btn.click();
          // Wait for coupon to be removed
          await this.page.locator('.MuiAlert-standardSuccess').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
          return;
        }
      }
    } else {
      await removeButton.click();
    }
    
    // Wait for coupon success alert to disappear
    await this.page.locator('.MuiAlert-standardSuccess').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  /**
   * Check if a coupon is applied (success alert visible)
   */
  async hasCouponApplied(): Promise<boolean> {
    // Check for success alert with "Coupon applied!" text
    const successAlert = this.page.getByRole('alert').filter({ hasText: /coupon applied/i });
    return await successAlert.isVisible();
  }

  /**
   * Check if there's a coupon error
   */
  async hasCouponError(): Promise<boolean> {
    // Check for error alert (MuiAlert-standardError class)
    const errorAlert = this.page.locator('.MuiAlert-standardError');
    return await errorAlert.isVisible();
  }

  /**
   * Get the coupon error message
   */
  async getCouponErrorMessage(): Promise<string> {
    const errorAlert = this.page.locator('.MuiAlert-standardError');
    if (await errorAlert.isVisible()) {
      const text = await errorAlert.textContent();
      return text?.trim() || '';
    }
    return '';
  }

  /**
   * Get the savings amount from applied coupon alert
   */
  async getCouponSavings(): Promise<number> {
    const successAlert = this.page.getByRole('alert').filter({ hasText: /coupon applied/i });
    if (await successAlert.isVisible()) {
      const text = await successAlert.textContent();
      // Extract price from "You saved $X.XX"
      const match = text?.match(/\$[\d,.]+/);
      if (match) {
        return this.parsePrice(match[0]);
      }
    }
    return 0;
  }

  // ==================== Total Methods ====================

  /**
   * Get the cart subtotal
   */
  async getSubtotal(): Promise<number> {
    // Find the row with "Subtotal:" label and get the price next to it
    const subtotalRow = this.page.locator('div').filter({ hasText: /^Subtotal:/ }).first();
    const priceText = await subtotalRow.locator('..').textContent();
    // Extract the price after "Subtotal:"
    const match = priceText?.match(/Subtotal:\s*\$?([\d,.]+)/);
    if (match) {
      return parseFloat(match[1].replace(',', ''));
    }
    return 0;
  }

  /**
   * Get the discount amount (only visible when coupon applied)
   */
  async getDiscount(): Promise<number> {
    try {
      // Find the row with "Discount:" label
      const discountRow = this.page.locator('div').filter({ hasText: /^Discount:/ }).first();
      if (await discountRow.isVisible()) {
        const priceText = await discountRow.locator('..').textContent();
        const match = priceText?.match(/Discount:\s*-?\$?([\d,.]+)/);
        if (match) {
          return parseFloat(match[1].replace(',', ''));
        }
      }
    } catch {
      // Discount row not visible
    }
    return 0;
  }

  /**
   * Get the cart total
   */
  async getTotal(): Promise<number> {
    // Find the h6 element with "Total:" label
    const totalRow = this.page.locator('h6').filter({ hasText: 'Total:' });
    const priceElement = totalRow.locator('..').locator('h6').last();
    const priceText = await priceElement.textContent();
    return this.parsePrice(priceText || '0');
  }

  /**
   * Parse a price string to a number
   */
  private parsePrice(priceText: string): number {
    const cleanedPrice = priceText.replace(/[^0-9.]/g, '');
    return parseFloat(cleanedPrice) || 0;
  }

  // ==================== Checkout Methods ====================

  /**
   * Proceed to checkout
   */
  async proceedToCheckout(): Promise<void> {
    await this.proceedToCheckoutButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Check if checkout button is enabled
   */
  async isCheckoutEnabled(): Promise<boolean> {
    return await this.proceedToCheckoutButton.isEnabled();
  }

  /**
   * Click continue shopping button
   */
  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert cart page is displayed
   */
  async assertCartPageDisplayed(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Assert cart is empty
   */
  async assertCartEmpty(): Promise<void> {
    await expect(this.emptyCartMessage).toBeVisible();
    await expect(this.continueShoppingButton).toBeVisible();
  }

  /**
   * Assert cart has items
   */
  async assertCartHasItems(): Promise<void> {
    await expect(this.cartItemsContainer).toBeVisible();
    const count = await this.getItemCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Assert specific product is in cart
   */
  async assertItemInCart(productName: string): Promise<void> {
    const hasProduct = await this.hasProduct(productName);
    expect(hasProduct).toBeTruthy();
  }

  /**
   * Assert specific product is NOT in cart
   */
  async assertItemNotInCart(productName: string): Promise<void> {
    const hasProduct = await this.hasProduct(productName);
    expect(hasProduct).toBeFalsy();
  }
}
