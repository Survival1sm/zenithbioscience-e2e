import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Order information displayed in the admin orders list
 */
export interface AdminOrderInfo {
  orderNumber: string;
  date: string;
  status: string;
  userId: string;
  total: number;
}

/**
 * Order detail information displayed in the order dialog
 */
export interface AdminOrderDetail extends AdminOrderInfo {
  paymentMethod: string;
  paymentStatus: string;
  shippingMethod: string;
  trackingNumber?: string;
  items: Array<{
    productName: string;
    quantity: number;
    totalPrice: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber?: string;
  };
}

/**
 * Order status options
 */
export type OrderStatus =
  | 'AWAITING_PAYMENT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * AdminOrdersPage Page Object
 * Handles admin orders management page interactions
 *
 * Based on actual frontend implementation:
 * - AdminOrdersClient: zenithbioscience-next/src/app/admin/orders/AdminOrdersClient.tsx
 */
export class AdminOrdersPage extends BasePage {
  readonly path = '/admin/orders';

  constructor(page: Page) {
    super(page);
  }


  // ==================== Locators ====================

  /** Page heading - "Order Management" h1 */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Order Management', level: 1 });
  }

  /** Loading state */
  get loadingState(): Locator {
    return this.page.locator('.MuiCircularProgress-root');
  }

  /** Error alert */
  get errorAlert(): Locator {
    return this.page.locator('.MuiAlert-root').filter({ hasText: /failed to load/i });
  }

  /** Tabs container */
  get tabsContainer(): Locator {
    return this.page.locator('.MuiTabs-root');
  }

  /** All Orders tab */
  get allOrdersTab(): Locator {
    return this.page.getByRole('tab', { name: /all orders/i });
  }

  /** Manual Payments tab */
  get manualPaymentsTab(): Locator {
    return this.page.getByRole('tab', { name: /manual payments/i });
  }

  // ==================== Data Grid Locators ====================

  /** Orders data grid */
  get ordersDataGrid(): Locator {
    return this.page.locator('[data-testid="admin-orders-data-grid"]');
  }

  /** Order rows in the data grid */
  get orderRows(): Locator {
    return this.page.locator('.MuiDataGrid-row');
  }

  /** Order cards (mobile view) - using OrderCard component test IDs */
  /** The Card container has data-testid="admin-order-card-{id}" where id is dynamic */
  /** Child elements have static testIds like admin-order-card-order-number, admin-order-card-status */
  /** We select only Card elements by looking for the MuiCard class */
  get orderCards(): Locator {
    return this.page.locator('.MuiCard-root[data-testid^="admin-order-card-"]');
  }

  // ==================== Order Dialog Locators ====================

  /** Order detail dialog */
  get orderDialog(): Locator {
    return this.page.locator('.MuiDialog-root');
  }

  /** Dialog title */
  get dialogTitle(): Locator {
    return this.orderDialog.locator('.MuiDialogTitle-root');
  }

  /** Status select dropdown */
  get statusSelect(): Locator {
    return this.orderDialog.locator('#status-label').locator('xpath=following-sibling::div');
  }

  /** Update Order button in dialog */
  get updateOrderButton(): Locator {
    return this.orderDialog.getByRole('button', { name: /update order/i });
  }

  /** Cancel button in dialog */
  get cancelDialogButton(): Locator {
    return this.orderDialog.getByRole('button', { name: /cancel/i });
  }

  // ==================== Snackbar Locators ====================

  /** Success snackbar */
  get successSnackbar(): Locator {
    return this.page.locator('.MuiSnackbar-root .MuiAlert-standardSuccess');
  }

  /** Error snackbar */
  get errorSnackbar(): Locator {
    return this.page.locator('.MuiSnackbar-root .MuiAlert-standardError');
  }

  // ==================== Navigation Methods ====================

  /**
   * Wait for the orders page to be ready
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.pageHeading.waitFor({ state: 'visible', timeout: 15000 });
    // Wait for loading to complete
    await this.loadingState.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      // Mobile view - wait for order cards to appear
      // Cards have data-testid="admin-order-card-{id}" and are MuiCard-root elements
      await this.page.waitForSelector('.MuiCard-root[data-testid^="admin-order-card-"]', { 
        state: 'visible', 
        timeout: 15000 
      }).catch(() => {});
      // Give cards time to fully render
      await this.wait(1000);
    } else {
      // Desktop view - wait for data grid rows
      await this.wait(500);
    }
  }

  /**
   * Switch to All Orders tab
   */
  async switchToAllOrdersTab(): Promise<void> {
    await this.allOrdersTab.click();
    await this.wait(500);
  }

  /**
   * Switch to Manual Payments tab
   */
  async switchToManualPaymentsTab(): Promise<void> {
    await this.manualPaymentsTab.click();
    await this.wait(500);
  }


  // ==================== Order List Methods ====================

  /**
   * Get the count of orders displayed
   */
  async getOrderCount(): Promise<number> {
    const isMobile = await this.isMobileView();
    if (isMobile) {
      return await this.orderCards.count();
    }
    return await this.orderRows.count();
  }

  /**
   * Check if we're on mobile view
   */
  async isMobileView(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width < 900 : false;
  }

  /**
   * Get all orders displayed in the list
   * @returns Array of AdminOrderInfo objects
   */
  async getOrders(): Promise<AdminOrderInfo[]> {
    const orders: AdminOrderInfo[] = [];
    const isMobile = await this.isMobileView();

    if (isMobile) {
      // Mobile view - parse cards using the OrderCard component structure
      // Cards have data-testid="admin-order-card-{id}" and are MuiCard-root elements
      const cards = this.page.locator('.MuiCard-root[data-testid^="admin-order-card-"]');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        
        // Extract order number from the dedicated element
        const orderNumberEl = card.locator('[data-testid$="-order-number"]');
        const orderNumber = await orderNumberEl.textContent() || '';

        // Extract status from the dedicated chip element
        const statusEl = card.locator('[data-testid$="-status"]');
        const status = await statusEl.textContent() || '';

        // Extract total from the dedicated element
        const totalEl = card.locator('[data-testid$="-total"]');
        const totalText = await totalEl.textContent() || '0';
        const total = parseFloat(totalText.replace(/[^0-9.]/g, '')) || 0;

        // Extract customer/userId from the dedicated element
        const customerEl = card.locator('[data-testid$="-customer"]');
        const userId = await customerEl.textContent() || '';

        orders.push({
          orderNumber: orderNumber.trim(),
          date: '',
          status: status.trim(),
          userId: userId.trim(),
          total,
        });
      }
    } else {
      // Desktop view - parse data grid rows
      const rowCount = await this.orderRows.count();
      for (let i = 0; i < rowCount; i++) {
        const row = this.orderRows.nth(i);
        const cells = row.locator('.MuiDataGrid-cell');

        const orderNumber = await cells.nth(0).textContent() || '';
        const date = await cells.nth(1).textContent() || '';
        const statusChip = cells.nth(2).locator('.MuiChip-root');
        const status = await statusChip.textContent() || '';
        const userId = await cells.nth(3).textContent() || '';
        const totalText = await cells.nth(4).textContent() || '0';
        const total = parseFloat(totalText.replace(/[^0-9.]/g, '')) || 0;

        orders.push({
          orderNumber: orderNumber.trim(),
          date: date.trim(),
          status: status.trim(),
          userId: userId.trim(),
          total,
        });
      }
    }

    return orders;
  }

  /**
   * Find an order by order number (searches across all pages)
   * @param orderNumber - The order number suffix to find (e.g., "0020" matches "ZB2512290020")
   */
  async findOrder(orderNumber: string): Promise<AdminOrderInfo | null> {
    // First, try to go back to the first page to ensure consistent state
    const firstPageButton = this.page.locator('[aria-label="Go to first page"], .MuiTablePagination-actions button:first-child');
    if (await firstPageButton.isVisible().catch(() => false) && await firstPageButton.isEnabled().catch(() => false)) {
      await firstPageButton.click();
      await this.wait(300);
    }

    // Try to increase page size to show all orders
    const pageSizeSelector = this.page.locator('.MuiTablePagination-select, .MuiDataGrid-footerContainer select');
    if (await pageSizeSelector.isVisible().catch(() => false)) {
      await pageSizeSelector.click();
      const menu = this.page.locator('.MuiMenu-paper');
      await menu.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
      
      // Try to select 50 or 100 items per page
      const option50 = menu.getByRole('option', { name: '50' });
      const option100 = menu.getByRole('option', { name: '100' });
      
      if (await option100.isVisible().catch(() => false)) {
        await option100.click();
      } else if (await option50.isVisible().catch(() => false)) {
        await option50.click();
      } else {
        // Close menu if no larger option available
        await this.page.keyboard.press('Escape');
      }
      
      await this.wait(500);
    }

    // Now search for the order on current page
    // Use exact suffix matching to avoid false positives (e.g., "0020" should not match "0002")
    let orders = await this.getOrders();
    let found = orders.find(o => o.orderNumber.endsWith(orderNumber));
    if (found) return found;

    // If still not found, try navigating through pages
    const nextPageButton = this.page.locator('[aria-label="Go to next page"], .MuiTablePagination-actions button:last-child');
    let maxPages = 10; // Safety limit
    
    while (maxPages > 0 && await nextPageButton.isEnabled().catch(() => false)) {
      await nextPageButton.click();
      await this.wait(300);
      
      orders = await this.getOrders();
      found = orders.find(o => o.orderNumber.endsWith(orderNumber));
      if (found) return found;
      
      maxPages--;
    }

    return null;
  }

  // ==================== Order Detail Methods ====================

  /**
   * Click view button for an order
   * @param orderNumber - The order number to view
   */
  async viewOrder(orderNumber: string): Promise<void> {
    const isMobile = await this.isMobileView();

    if (isMobile) {
      // Mobile view - find the card and click the View button
      // Cards have data-testid="admin-order-card-{id}" and are MuiCard-root elements
      const cards = this.page.locator('.MuiCard-root[data-testid^="admin-order-card-"]');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const orderNumberEl = card.locator('[data-testid$="-order-number"]');
        const cardOrderNumber = await orderNumberEl.textContent() || '';
        
        if (cardOrderNumber.includes(orderNumber)) {
          // Scroll card into view first for mobile
          await card.scrollIntoViewIfNeeded();
          await this.wait(200);
          // Click the View button in the card actions
          const viewButton = card.getByRole('button', { name: /view/i });
          await viewButton.scrollIntoViewIfNeeded();
          await viewButton.click();
          break;
        }
      }
    } else {
      // Click the view icon button in the row
      const row = this.orderRows.filter({ hasText: orderNumber });
      await row.locator('button[aria-label*="View order"]').click();
    }

    // Wait for dialog to open - longer timeout for mobile
    await this.orderDialog.waitFor({ state: 'visible', timeout: 10000 });
    // Wait for dialog content to be ready
    await this.wait(isMobile ? 500 : 200);
  }

  /**
   * Get order details from the open dialog
   * @returns AdminOrderDetail object
   */
  async getOrderDetails(): Promise<AdminOrderDetail> {
    await this.orderDialog.waitFor({ state: 'visible' });

    const dialogContent = await this.orderDialog.textContent() || '';

    // Extract order number from title
    const titleText = await this.dialogTitle.textContent() || '';
    const orderMatch = titleText.match(/([A-Z0-9-]+)/);
    const orderNumber = orderMatch ? orderMatch[1] : '';

    // Extract date
    const dateMatch = dialogContent.match(/Date:\s*([^\n]+)/);
    const date = dateMatch ? dateMatch[1].trim() : '';

    // Extract user ID
    const userMatch = dialogContent.match(/User ID:\s*([^\n]+)/);
    const userId = userMatch ? userMatch[1].trim() : '';

    // Extract payment method
    const paymentMethodMatch = dialogContent.match(/Payment Method:\s*([^\n]+)/);
    const paymentMethod = paymentMethodMatch ? paymentMethodMatch[1].trim() : '';

    // Extract payment status
    const paymentStatusMatch = dialogContent.match(/Payment Status:\s*([^\n]+)/);
    const paymentStatus = paymentStatusMatch ? paymentStatusMatch[1].trim() : '';

    // Extract shipping method
    const shippingMethodMatch = dialogContent.match(/Shipping Method:\s*([^\n]+)/);
    const shippingMethod = shippingMethodMatch ? shippingMethodMatch[1].trim() : '';

    // Extract total
    const totalMatch = dialogContent.match(/Total:\s*\$(\d+\.?\d*)/);
    const total = totalMatch ? parseFloat(totalMatch[1]) : 0;

    // Extract tracking number if present
    const trackingMatch = dialogContent.match(/Tracking Number:\s*([^\n]+)/);
    const trackingNumber = trackingMatch ? trackingMatch[1].trim() : undefined;

    // Get current status from select
    const statusSelect = this.orderDialog.locator('[id="status-label"]').locator('xpath=following-sibling::div');
    const status = await statusSelect.textContent() || '';

    return {
      orderNumber,
      date,
      status: status.trim(),
      userId,
      total,
      paymentMethod,
      paymentStatus,
      shippingMethod,
      trackingNumber,
      items: [], // Would need more complex parsing
      shippingAddress: {
        firstName: '',
        lastName: '',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    };
  }


  // ==================== Order Status Update Methods ====================

  /**
   * Update order status in the open dialog
   * @param newStatus - The new status to set
   */
  async updateOrderStatus(newStatus: OrderStatus): Promise<void> {
    await this.orderDialog.waitFor({ state: 'visible' });

    // Click the status select to open dropdown - scroll into view first on mobile
    const selectElement = this.orderDialog.locator('.MuiSelect-select').filter({ hasText: /.+/ });
    await selectElement.scrollIntoViewIfNeeded();
    await this.wait(100);
    await selectElement.click();

    // Wait for dropdown menu to appear - longer timeout for mobile
    const menu = this.page.locator('.MuiMenu-paper');
    await menu.waitFor({ state: 'visible', timeout: 5000 });

    // Click the desired status option
    const option = menu.getByRole('option', { name: new RegExp(newStatus.replace('_', ' '), 'i') });
    await option.scrollIntoViewIfNeeded();
    await option.click();

    // Wait for menu to close
    await menu.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Click Update Order button to save changes
   */
  async clickUpdateOrder(): Promise<void> {
    // Scroll update button into view on mobile
    await this.updateOrderButton.scrollIntoViewIfNeeded();
    await this.wait(100);
    await this.updateOrderButton.click();
    
    // Wait for either dialog to close OR error snackbar to appear - longer timeout for mobile
    const dialogHidden = this.orderDialog.waitFor({ state: 'hidden', timeout: 15000 });
    const errorAppeared = this.errorSnackbar.waitFor({ state: 'visible', timeout: 15000 });
    
    try {
      await Promise.race([dialogHidden, errorAppeared]);
    } catch {
      // If neither happens, check if there's an error message in the dialog
      const dialogText = await this.orderDialog.textContent();
      if (dialogText?.toLowerCase().includes('error') || dialogText?.toLowerCase().includes('failed')) {
        throw new Error(`Order update failed: ${dialogText}`);
      }
      // Otherwise just wait a bit more for the dialog to close
      await this.orderDialog.waitFor({ state: 'hidden', timeout: 10000 });
    }
    
    // Check if error snackbar appeared
    if (await this.errorSnackbar.isVisible().catch(() => false)) {
      const errorMessage = await this.errorSnackbar.textContent();
      throw new Error(`Order update failed: ${errorMessage}`);
    }
  }

  /**
   * Close the order dialog without saving
   */
  async closeOrderDialog(): Promise<void> {
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      // On mobile, ResponsiveDialog has a close button in the header
      const closeButton = this.page.locator('[data-testid="responsive-dialog-close-button"]');
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      } else {
        // Fallback to cancel button
        await this.cancelDialogButton.click();
      }
    } else {
      await this.cancelDialogButton.click();
    }
    
    await this.orderDialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Update an order's status (full flow)
   * @param orderNumber - The order number to update
   * @param newStatus - The new status to set
   */
  async updateOrder(orderNumber: string, newStatus: OrderStatus): Promise<void> {
    await this.viewOrder(orderNumber);
    await this.updateOrderStatus(newStatus);
    await this.clickUpdateOrder();
  }

  // ==================== Snackbar Methods ====================

  /**
   * Get success message from snackbar
   */
  async getSuccessMessage(): Promise<string> {
    await this.successSnackbar.waitFor({ state: 'visible', timeout: 5000 });
    return await this.successSnackbar.textContent() || '';
  }

  /**
   * Get error message from snackbar
   */
  async getErrorMessage(): Promise<string> {
    await this.errorSnackbar.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorSnackbar.textContent() || '';
  }

  /**
   * Check if success snackbar is visible
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.successSnackbar.isVisible().catch(() => false);
  }

  /**
   * Check if error snackbar is visible
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.errorSnackbar.isVisible().catch(() => false);
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert orders page is displayed
   */
  async assertPageDisplayed(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Assert tabs are displayed
   */
  async assertTabsDisplayed(): Promise<void> {
    await expect(this.allOrdersTab).toBeVisible();
    await expect(this.manualPaymentsTab).toBeVisible();
  }

  /**
   * Assert orders are loaded (not empty)
   */
  async assertOrdersLoaded(): Promise<void> {
    const count = await this.getOrderCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Assert order dialog is open
   */
  async assertDialogOpen(): Promise<void> {
    await expect(this.orderDialog).toBeVisible();
  }

  /**
   * Assert order dialog is closed
   */
  async assertDialogClosed(): Promise<void> {
    await expect(this.orderDialog).not.toBeVisible();
  }

  /**
   * Assert order status matches expected
   * @param orderNumber - The order number to check
   * @param expectedStatus - The expected status
   */
  async assertOrderStatus(orderNumber: string, expectedStatus: string): Promise<void> {
    const order = await this.findOrder(orderNumber);
    expect(order).not.toBeNull();
    expect(order?.status.toUpperCase()).toBe(expectedStatus.toUpperCase());
  }

  /**
   * Assert success message is displayed
   */
  async assertSuccessMessageDisplayed(): Promise<void> {
    await expect(this.successSnackbar).toBeVisible();
  }

  /**
   * Assert no error is displayed
   */
  async assertNoError(): Promise<void> {
    await expect(this.errorAlert).not.toBeVisible();
  }
}
