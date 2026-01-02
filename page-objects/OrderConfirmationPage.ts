import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Order details interface
 */
export interface OrderDetailsData {
  orderNumber: string;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
}

/**
 * OrderConfirmationPage Page Object
 * Handles order confirmation/success page interactions
 *
 * Based on actual frontend implementation:
 * - Success page: zenithbioscience-next/src/app/checkout/success/OrderSuccessClient.tsx
 *
 * Requirements covered:
 * - 5.5: Order confirmation display
 * - 5.6: Order details visibility
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 */
export class OrderConfirmationPage extends BasePage {
  readonly path = '/checkout/success';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /** Success icon (CheckCircle) */
  get successIcon(): Locator {
    return this.page.locator('[data-testid="CheckCircleIcon"]');
  }

  /** Thank you heading */
  get thankYouHeading(): Locator {
    return this.page.getByRole('heading', { name: /thank you/i, level: 1 });
  }

  /** Order number text */
  get orderNumberText(): Locator {
    return this.page.getByText(/order number/i);
  }

  /** Order date text */
  get orderDateText(): Locator {
    return this.page.getByText(/order date/i);
  }

  /** Payment method text */
  get paymentMethodText(): Locator {
    return this.page.getByText(/payment method/i);
  }

  /** Shipping address text */
  get shippingAddressText(): Locator {
    return this.page.getByText(/shipping address/i);
  }

  /** Order items table */
  get orderItemsTable(): Locator {
    return this.page.locator('table');
  }

  /** Order items heading */
  get orderItemsHeading(): Locator {
    return this.page.getByRole('heading', { name: /order items/i });
  }

  /** Subtotal row */
  get subtotalRow(): Locator {
    return this.page.getByText(/subtotal/i).locator('..');
  }

  /** Shipping row */
  get shippingRow(): Locator {
    return this.page.getByText(/shipping/i).first().locator('..');
  }

  /** Tax row */
  get taxRow(): Locator {
    return this.page.getByText(/tax/i).locator('..');
  }

  /** Discount row (if present) */
  get discountRow(): Locator {
    return this.page.getByText(/discount/i).locator('..');
  }

  /** Total row - the container holding both "Total Paid:" and the amount */
  get totalRow(): Locator {
    // The total is in a sibling heading element, so we need to get the grandparent container
    return this.page.getByText(/total paid/i).locator('../..');
  }

  /** View Your Orders button */
  get viewOrdersButton(): Locator {
    return this.page.getByRole('link', { name: /view your orders/i });
  }

  /** Continue Shopping button */
  get continueShoppingButton(): Locator {
    return this.page.getByRole('link', { name: /continue shopping/i });
  }

  /** What's Next section */
  get whatsNextSection(): Locator {
    return this.page.getByRole('heading', { name: /what's next/i });
  }

  /** Payment status alerts */
  get paymentStatusAlert(): Locator {
    return this.page.getByRole('alert');
  }

  /** Solana Pay QR code (if present) */
  get solanaPayQR(): Locator {
    return this.page.locator('[data-testid="solana-pay-qr"]');
  }

  // ==================== Navigation Methods ====================

  /**
   * Navigate to order confirmation page with order ID
   */
  async gotoWithOrderId(orderId: string): Promise<void> {
    await this.page.goto(`${this.path}?orderId=${orderId}`);
    await this.waitForPage();
  }

  /**
   * Wait for the order confirmation page to be ready
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for thank you heading or loading to complete
    await Promise.race([
      this.thankYouHeading.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      this.page.waitForSelector('.MuiSkeleton-root', { state: 'hidden', timeout: 15000 }).catch(() => {}),
    ]);
  }

  // ==================== Data Extraction Methods ====================

  /**
   * Get the order number from the page
   */
  async getOrderNumber(): Promise<string> {
    const text = await this.orderNumberText.locator('..').textContent();
    const match = text?.match(/order number[:\s]*([A-Z0-9-]+)/i);
    return match ? match[1] : '';
  }

  /**
   * Get the payment status
   */
  async getPaymentStatus(): Promise<string> {
    const text = await this.paymentMethodText.locator('..').textContent();
    // Extract status from parentheses, e.g., "Card (Confirmed)"
    const match = text?.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
  }

  /**
   * Get the order total
   */
  async getOrderTotal(): Promise<number> {
    const text = await this.totalRow.textContent();
    const match = text?.match(/\$?([\d,.]+)/);
    return match ? parseFloat(match[1].replace(',', '')) : 0;
  }

  /**
   * Get the number of items in the order
   */
  async getItemCount(): Promise<number> {
    const rows = this.orderItemsTable.locator('tbody tr');
    return await rows.count();
  }

  /**
   * Check if order is awaiting payment (Solana Pay)
   */
  async isAwaitingPayment(): Promise<boolean> {
    const alert = this.page.getByRole('alert').filter({ hasText: /complete your payment|waiting for payment/i });
    return await alert.isVisible();
  }

  /**
   * Check if payment is confirmed
   */
  async isPaymentConfirmed(): Promise<boolean> {
    const alert = this.page.getByRole('alert').filter({ hasText: /payment confirmed/i });
    return await alert.isVisible();
  }

  /**
   * Check if order is shipped
   */
  async isOrderShipped(): Promise<boolean> {
    const alert = this.page.getByRole('alert').filter({ hasText: /order shipped/i });
    return await alert.isVisible();
  }

  // ==================== Action Methods ====================

  /**
   * Click View Your Orders button
   */
  async viewOrders(): Promise<void> {
    await this.viewOrdersButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click Continue Shopping button
   */
  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert order confirmation page is displayed
   */
  async assertConfirmationDisplayed(): Promise<void> {
    await expect(this.thankYouHeading).toBeVisible();
  }

  /**
   * Assert order number is displayed
   */
  async assertOrderNumberDisplayed(): Promise<void> {
    await expect(this.orderNumberText).toBeVisible();
  }

  /**
   * Assert order items are displayed
   */
  async assertOrderItemsDisplayed(): Promise<void> {
    await expect(this.orderItemsHeading).toBeVisible();
    await expect(this.orderItemsTable).toBeVisible();
  }

  /**
   * Assert order totals are displayed
   */
  async assertTotalsDisplayed(): Promise<void> {
    await expect(this.subtotalRow).toBeVisible();
    await expect(this.totalRow).toBeVisible();
  }

  /**
   * Assert navigation buttons are displayed
   */
  async assertNavigationButtonsDisplayed(): Promise<void> {
    await expect(this.viewOrdersButton).toBeVisible();
    await expect(this.continueShoppingButton).toBeVisible();
  }
}
