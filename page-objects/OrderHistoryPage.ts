import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Order status types
 */
export type OrderStatusType = 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

/**
 * Order tab types
 */
export type OrderTabType = 'all' | 'active' | 'completed';

/**
 * Order detail information returned from getOrderDetails
 */
export interface OrderDetailInfo {
  orderNumber: string;
  status: string;
  date: string;
  total: number;
  itemsCount: number;
  trackingNumber?: string;
  shippingAddress?: string;
}

/**
 * OrderHistoryPage Page Object
 * Handles order history page interactions
 *
 * Based on actual frontend implementation:
 * - Orders page: zenithbioscience-next/src/app/account/orders/OrdersPageClient.tsx
 * - OrdersList: zenithbioscience-next/src/app/_components/account/OrdersList.tsx
 *
 * Requirements covered:
 * - 5.6: Order history display
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 */
export class OrderHistoryPage extends BasePage {
  readonly path = '/account/orders';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /** Page heading - "My Orders" h1 */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'My Orders', level: 1 });
  }

  /** Tabs container */
  get tabsContainer(): Locator {
    return this.page.getByRole('tablist');
  }

  /** All Orders tab */
  get allOrdersTab(): Locator {
    return this.page.getByRole('tab', { name: /all orders/i });
  }

  /** Active Orders tab */
  get activeOrdersTab(): Locator {
    return this.page.getByRole('tab', { name: /active orders/i });
  }

  /** Completed tab */
  get completedTab(): Locator {
    return this.page.getByRole('tab', { name: /completed/i });
  }

  /** Orders data grid (desktop) */
  get ordersDataGrid(): Locator {
    return this.page.locator('.MuiDataGrid-root');
  }

  /** Order cards (mobile) - using ResponsiveDataDisplay card list structure */
  get orderCards(): Locator {
    // On mobile, ResponsiveDataDisplay renders CardList with items having data-testid="orders-list-card-list-item-{index}"
    // But the actual card content is rendered by OrderCard which is a MUI Card
    return this.page.locator('[data-testid^="orders-list-card-list-item-"], [data-testid^="orders-list-mobile"] .MuiCard-root');
  }

  /** Empty state message */
  get emptyStateMessage(): Locator {
    return this.page.getByText(/you haven't placed any orders yet|no orders to display/i);
  }

  /** No active orders message */
  get noActiveOrdersMessage(): Locator {
    return this.page.getByText(/you have no active orders/i);
  }

  /** No completed orders message */
  get noCompletedOrdersMessage(): Locator {
    return this.page.getByText(/you have no completed orders/i);
  }

  /** Loading skeleton */
  get loadingSkeleton(): Locator {
    return this.page.locator('.MuiSkeleton-root');
  }

  // ==================== Navigation Methods ====================

  /**
   * Wait for the orders page to be ready
   * This waits for the page to fully load including the orders data
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for heading first
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });
    // Wait for loading skeleton to appear and then disappear (orders are loading)
    await this.loadingSkeleton.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.loadingSkeleton.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    // Wait for either orders to appear (tabs visible) or empty state
    await Promise.race([
      this.tabsContainer.waitFor({ state: 'visible', timeout: 10000 }),
      this.emptyStateMessage.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});
  }

  /**
   * Check if we're on mobile view
   */
  async isMobileView(): Promise<boolean> {
    // On mobile, we show cards instead of data grid
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width < 768 : false;
  }

  // ==================== Tab Methods ====================

  /**
   * Select a tab
   */
  async selectTab(tab: OrderTabType): Promise<void> {
    const tabLocator = {
      'all': this.allOrdersTab,
      'active': this.activeOrdersTab,
      'completed': this.completedTab,
    }[tab];
    
    await tabLocator.click();
    // Wait for tab to be selected
    await expect(tabLocator).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
    // Wait for loading to complete
    await this.loadingSkeleton.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  /**
   * Get the currently selected tab
   */
  async getSelectedTab(): Promise<OrderTabType> {
    if (await this.allOrdersTab.getAttribute('aria-selected') === 'true') {
      return 'all';
    }
    if (await this.activeOrdersTab.getAttribute('aria-selected') === 'true') {
      return 'active';
    }
    if (await this.completedTab.getAttribute('aria-selected') === 'true') {
      return 'completed';
    }
    return 'all';
  }

  // ==================== Order Data Methods ====================

  /**
   * Get the count of orders displayed
   */
  async getOrderCount(): Promise<number> {
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      // On mobile, count cards in the mobile view container
      const cards = this.page.locator('[data-testid^="orders-list-mobile"] .MuiCard-root, [data-testid^="orders-list-card-list-item-"]');
      return await cards.count();
    } else {
      // Count rows in data grid (excluding header)
      const rows = this.page.locator('.MuiDataGrid-row');
      return await rows.count();
    }
  }

  /**
   * Get order numbers from the list
   */
  async getOrderNumbers(): Promise<string[]> {
    const isMobile = await this.isMobileView();
    const orderNumbers: string[] = [];
    
    if (isMobile) {
      // On mobile, find cards and extract order numbers
      const cards = this.page.locator('[data-testid^="orders-list-mobile"] .MuiCard-root, [data-testid^="orders-list-card-list-item-"]');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        // Order number is in a subtitle1 typography element with # prefix
        const orderNumberEl = card.locator('.MuiTypography-subtitle1').first();
        const text = await orderNumberEl.textContent();
        if (text) {
          const match = text.match(/#?([A-Z0-9-]+)/);
          if (match) orderNumbers.push(match[1]);
        }
      }
    } else {
      // Try to get order numbers from the first column of each row
      const rows = this.page.locator('.MuiDataGrid-row');
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        // Get the first cell in each row (order number column)
        const firstCell = rows.nth(i).locator('.MuiDataGrid-cell').first();
        const text = await firstCell.textContent();
        if (text) orderNumbers.push(text.trim());
      }
      
      // Also try to get from gridcell role (fallback)
      if (orderNumbers.length === 0) {
        const gridCells = this.page.locator('div[role="gridcell"]');
        const cellCount = await gridCells.count();
        for (let i = 0; i < cellCount; i++) {
          const text = await gridCells.nth(i).textContent();
          if (text && text.startsWith('ORD-')) {
            orderNumbers.push(text.trim());
          }
        }
      }
    }
    
    return orderNumbers;
  }

  /**
   * Check if an order exists in the list by order number or order ID
   * Supports both the display order number (ORD-xxx) and internal order ID
   */
  async hasOrder(orderIdOrNumber: string): Promise<boolean> {
    // Wait for the data grid or cards to be visible
    await this.loadingSkeleton.first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // Check if there's a link to the order detail page with this ID
    const orderLink = this.page.locator(`a[href*="${orderIdOrNumber}"]`);
    if (await orderLink.count() > 0) {
      return true;
    }
    
    // Check order numbers from the list
    const orderNumbers = await this.getOrderNumbers();
    if (orderNumbers.some(num => num.includes(orderIdOrNumber) || orderIdOrNumber.includes(num))) {
      return true;
    }
    
    // Check if the order number/ID appears directly in the page text
    const pageText = await this.page.locator('body').textContent();
    if (pageText && pageText.includes(orderIdOrNumber)) {
      return true;
    }
    
    return false;
  }

  /**
   * Get order status by order number or order ID
   */
  async getOrderStatus(orderIdOrNumber: string): Promise<string | null> {
    const isMobile = await this.isMobileView();
    
    // Valid status keywords to look for
    const statusKeywords = ['AWAITING', 'PROCESSING', 'PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'CONFIRMED'];
    
    if (isMobile) {
      // On mobile, find the card containing the order and get status from the Chip
      const cards = this.page.locator('[data-testid^="orders-list-mobile"] .MuiCard-root, [data-testid^="orders-list-card-list-item-"]');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const cardText = await card.textContent() || '';
        
        // Check if this card contains the order ID or number
        if (cardText.includes(orderIdOrNumber)) {
          // Get status from the Chip component
          const chip = card.locator('.MuiChip-root');
          if (await chip.count() > 0) {
            return await chip.textContent().catch(() => null);
          }
          
          // Fallback: look for status text in the card
          for (const keyword of statusKeywords) {
            if (cardText.toUpperCase().includes(keyword)) {
              const match = cardText.match(new RegExp(`${keyword}[A-Z_]*`, 'i'));
              if (match) return match[0];
            }
          }
        }
      }
      
      // Also try to find by link containing the ID
      const cardWithLink = this.page.locator('.MuiCard-root').filter({ has: this.page.locator(`a[href*="${orderIdOrNumber}"]`) });
      if (await cardWithLink.count() > 0) {
        const chip = cardWithLink.locator('.MuiChip-root');
        if (await chip.count() > 0) {
          return await chip.textContent().catch(() => null);
        }
      }
      
      return null;
    } else {
      // Desktop: Find the row containing the order ID in a link href
      // The grid structure is: row > gridcell (order#) > gridcell (date) > gridcell (status) > ...
      // The "View Details" link contains the UUID in its href
      
      // Get all data rows (rows with gridcells, excluding header row)
      const dataRows = this.page.locator('[role="rowgroup"] [role="row"]');
      const rowCount = await dataRows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const row = dataRows.nth(i);
        
        // Check if this row contains a link with the order ID
        const linkInRow = row.locator(`a[href*="${orderIdOrNumber}"]`);
        if (await linkInRow.count() > 0) {
          // Found the row - now get the status from the third gridcell (index 2)
          const cells = row.locator('[role="gridcell"]');
          const cellCount = await cells.count();
          
          // Status is typically in the 3rd column (index 2)
          if (cellCount > 2) {
            const statusCell = cells.nth(2);
            const statusText = await statusCell.textContent();
            if (statusText) {
              return statusText.trim();
            }
          }
          
          // Fallback: search all cells for status keywords
          for (let j = 0; j < cellCount; j++) {
            const cellText = await cells.nth(j).textContent();
            if (cellText) {
              for (const keyword of statusKeywords) {
                if (cellText.includes(keyword)) {
                  return cellText.trim();
                }
              }
            }
          }
        }
      }
      
      // Fallback: Search all rows for the order number text directly
      const allRows = this.page.locator('[role="row"]').filter({ 
        has: this.page.locator('[role="gridcell"]') 
      });
      
      const row = allRows.filter({ hasText: orderIdOrNumber });
      if (await row.count() > 0) {
        const cells = row.locator('[role="gridcell"]');
        const cellCount = await cells.count();
        for (let i = 0; i < cellCount; i++) {
          const cellText = await cells.nth(i).textContent();
          if (cellText) {
            for (const keyword of statusKeywords) {
              if (cellText.includes(keyword)) {
                return cellText.trim();
              }
            }
          }
        }
      }
      
      return null;
    }
  }

  /**
   * Click View Details for an order
   */
  async viewOrderDetails(orderNumber: string): Promise<void> {
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      // On mobile, find the card containing the order number and click View Details button
      // The OrderCard component renders a Card with order number in subtitle1 and a View Details button
      const cards = this.page.locator('[data-testid^="orders-list-mobile"] .MuiCard-root, [data-testid^="orders-list-card-list-item-"]');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const cardText = await card.textContent() || '';
        
        if (cardText.includes(orderNumber)) {
          // Click the View Details button/link in the card
          const viewDetailsButton = card.getByRole('link', { name: /view details/i });
          await viewDetailsButton.click();
          break;
        }
      }
    } else {
      const row = this.page.locator('.MuiDataGrid-row', { hasText: orderNumber });
      await row.getByRole('link', { name: /view details/i }).click();
    }
    
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Check if orders list is empty
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyStateMessage.isVisible();
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert orders page is displayed
   */
  async assertOrdersPageDisplayed(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Assert tabs are displayed
   */
  async assertTabsDisplayed(): Promise<void> {
    await expect(this.tabsContainer).toBeVisible();
    await expect(this.allOrdersTab).toBeVisible();
    await expect(this.activeOrdersTab).toBeVisible();
    await expect(this.completedTab).toBeVisible();
  }

  /**
   * Assert orders are displayed
   */
  async assertOrdersDisplayed(): Promise<void> {
    const count = await this.getOrderCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Assert empty state is displayed
   */
  async assertEmptyStateDisplayed(): Promise<void> {
    await expect(this.emptyStateMessage).toBeVisible();
  }

  /**
   * Assert order exists with specific status
   */
  async assertOrderHasStatus(orderNumber: string, expectedStatus: string): Promise<void> {
    const status = await this.getOrderStatus(orderNumber);
    expect(status?.toLowerCase()).toContain(expectedStatus.toLowerCase());
  }

  // ==================== Filtering Methods ====================

  /**
   * Filter orders by status using the tab navigation
   * @param status - The status filter to apply: 'all', 'active', or 'completed'
   */
  async filterByStatus(status: 'all' | 'active' | 'completed'): Promise<void> {
    await this.selectTab(status);
    // selectTab already waits for loading to complete
  }

  // ==================== Order Detail Methods ====================

  /**
   * Navigate to order detail page and return order information
   * @param orderNumber - The order number or order ID to view
   * @returns Order detail information including status, date, total, items count, and tracking
   */
  async getOrderDetails(orderNumber: string): Promise<OrderDetailInfo> {
    // Navigate to the order detail page
    await this.viewOrderDetails(orderNumber);
    
    // Wait for the order detail page to load
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for order heading to appear
    const orderHeading = this.page.getByRole('heading', { name: /order #/i });
    await orderHeading.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    
    // Extract order information from the detail page
    const orderInfo: OrderDetailInfo = {
      orderNumber: '',
      status: '',
      date: '',
      total: 0,
      itemsCount: 0,
    };
    
    // Get order number from heading (e.g., "Order #ORD-123")
    if (await orderHeading.isVisible({ timeout: 5000 })) {
      const headingText = await orderHeading.textContent();
      const match = headingText?.match(/#([A-Z0-9-]+)/i);
      if (match) {
        orderInfo.orderNumber = match[1];
      }
    }
    
    // Get status from chip
    const statusChip = this.page.locator('.MuiChip-root').first();
    if (await statusChip.isVisible({ timeout: 3000 })) {
      orderInfo.status = (await statusChip.textContent()) || '';
    }
    
    // Get order date
    const dateText = this.page.getByText(/order date:/i);
    if (await dateText.isVisible({ timeout: 3000 })) {
      const fullText = await dateText.textContent();
      const dateMatch = fullText?.match(/order date:\s*(.+)/i);
      if (dateMatch) {
        orderInfo.date = dateMatch[1].trim();
      }
    }
    
    // Get total from the order summary
    const totalText = this.page.locator('text=/\\$[\\d,]+\\.\\d{2}/').last();
    if (await totalText.isVisible({ timeout: 3000 })) {
      const text = await totalText.textContent();
      const totalMatch = text?.match(/\$([\d,]+\.\d{2})/);
      if (totalMatch) {
        orderInfo.total = parseFloat(totalMatch[1].replace(',', ''));
      }
    }
    
    // Count items in the order table
    const tableRows = this.page.locator('table tbody tr').filter({
      hasNot: this.page.locator('td[colspan]') // Exclude summary rows
    });
    orderInfo.itemsCount = await tableRows.count();
    
    // Get tracking number if available
    const trackingText = this.page.getByText(/tracking #:/i);
    if (await trackingText.isVisible({ timeout: 2000 }).catch(() => false)) {
      const fullText = await trackingText.textContent();
      const trackingMatch = fullText?.match(/tracking #:\s*(.+)/i);
      if (trackingMatch) {
        orderInfo.trackingNumber = trackingMatch[1].trim();
      }
    }
    
    // Get shipping address
    const shippingSection = this.page.locator('text=Shipping Address').locator('..').locator('..');
    if (await shippingSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      const addressPaper = shippingSection.locator('.MuiPaper-root');
      if (await addressPaper.isVisible({ timeout: 2000 }).catch(() => false)) {
        orderInfo.shippingAddress = (await addressPaper.textContent())?.trim();
      }
    }
    
    return orderInfo;
  }

  // ==================== WebSocket Status Update Methods ====================

  /**
   * Wait for a WebSocket status update for a specific order
   * @param orderNumber - The order number or order ID to monitor
   * @param expectedStatus - The expected status to wait for
   * @param timeout - Maximum time to wait in milliseconds (default: 30000)
   * @returns True if the status was updated to the expected value
   * 
   * JUSTIFICATION for fixed timeout: This is a polling loop waiting for WebSocket-driven
   * status updates. The pollInterval is necessary because we're waiting for an external
   * event (WebSocket message) that updates the DOM asynchronously.
   */
  async waitForStatusUpdate(
    orderNumber: string, 
    expectedStatus: string, 
    timeout: number = 30000
  ): Promise<boolean> {
    // Use Playwright's expect with polling for cleaner implementation
    try {
      await expect(async () => {
        const currentStatus = await this.getOrderStatus(orderNumber);
        expect(currentStatus?.toLowerCase()).toContain(expectedStatus.toLowerCase());
      }).toPass({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for status update on the order detail page
   * This method should be called when already on the order detail page
   * @param expectedStatus - The expected status to wait for
   * @param timeout - Maximum time to wait in milliseconds (default: 30000)
   * @returns True if the status was updated to the expected value
   * 
   * JUSTIFICATION for polling: This waits for WebSocket-driven status updates on the
   * order detail page. The status chip updates asynchronously via WebSocket.
   */
  async waitForStatusUpdateOnDetailPage(
    expectedStatus: string,
    timeout: number = 30000
  ): Promise<boolean> {
    const statusChip = this.page.locator('.MuiChip-root').first();
    
    try {
      await expect(statusChip).toContainText(expectedStatus, { ignoreCase: true, timeout });
      return true;
    } catch {
      // Also check for snackbar notification about status update
      const snackbar = this.page.locator('.MuiSnackbar-root');
      if (await snackbar.isVisible({ timeout: 500 }).catch(() => false)) {
        const snackbarText = await snackbar.textContent();
        if (snackbarText?.toLowerCase().includes(expectedStatus.toLowerCase())) {
          return true;
        }
      }
      return false;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Get the order date for a specific order
   * @param orderNumber - The order number or order ID
   * @returns The order date string or null if not found
   */
  async getOrderDate(orderNumber: string): Promise<string | null> {
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      // Find the card containing the order
      let card = this.orderCards.filter({ hasText: orderNumber });
      if (await card.count() === 0) {
        card = this.orderCards.filter({ has: this.page.locator(`a[href*="${orderNumber}"]`) });
      }
      
      if (await card.count() === 0) {
        return null;
      }
      
      // Look for date text in the card
      const dateText = card.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|\\w+ \\d{1,2}, \\d{4}/');
      if (await dateText.count() > 0) {
        return await dateText.first().textContent();
      }
      
      return null;
    } else {
      // Desktop: Find the row and get date from the second column
      const dataRows = this.page.locator('[role="rowgroup"] [role="row"]');
      const rowCount = await dataRows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const row = dataRows.nth(i);
        const linkInRow = row.locator(`a[href*="${orderNumber}"]`);
        
        if (await linkInRow.count() > 0) {
          // Date is typically in the 2nd column (index 1)
          const cells = row.locator('[role="gridcell"]');
          if (await cells.count() > 1) {
            const dateCell = cells.nth(1);
            return await dateCell.textContent();
          }
        }
      }
      
      // Fallback: search by order number text
      const row = this.page.locator('[role="row"]').filter({ hasText: orderNumber });
      if (await row.count() > 0) {
        const cells = row.locator('[role="gridcell"]');
        if (await cells.count() > 1) {
          return await cells.nth(1).textContent();
        }
      }
      
      return null;
    }
  }

  /**
   * Get the order total for a specific order
   * @param orderNumber - The order number or order ID
   * @returns The order total as a number or null if not found
   */
  async getOrderTotal(orderNumber: string): Promise<number | null> {
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      // Find the card containing the order
      let card = this.orderCards.filter({ hasText: orderNumber });
      if (await card.count() === 0) {
        card = this.orderCards.filter({ has: this.page.locator(`a[href*="${orderNumber}"]`) });
      }
      
      if (await card.count() === 0) {
        return null;
      }
      
      // Look for total/price text in the card (e.g., "$123.45" or "Total: $123.45")
      const priceText = card.locator('text=/\\$[\\d,]+\\.\\d{2}/');
      if (await priceText.count() > 0) {
        const text = await priceText.last().textContent();
        const match = text?.match(/\$([\d,]+\.\d{2})/);
        if (match) {
          return parseFloat(match[1].replace(',', ''));
        }
      }
      
      return null;
    } else {
      // Desktop: Find the row and get total from the appropriate column
      const dataRows = this.page.locator('[role="rowgroup"] [role="row"]');
      const rowCount = await dataRows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const row = dataRows.nth(i);
        const linkInRow = row.locator(`a[href*="${orderNumber}"]`);
        
        if (await linkInRow.count() > 0) {
          // Total is typically in the 4th column (index 3) or look for $ pattern
          const cells = row.locator('[role="gridcell"]');
          const cellCount = await cells.count();
          
          for (let j = 0; j < cellCount; j++) {
            const cellText = await cells.nth(j).textContent();
            const match = cellText?.match(/\$([\d,]+\.\d{2})/);
            if (match) {
              return parseFloat(match[1].replace(',', ''));
            }
          }
        }
      }
      
      // Fallback: search by order number text
      const row = this.page.locator('[role="row"]').filter({ hasText: orderNumber });
      if (await row.count() > 0) {
        const rowText = await row.textContent();
        const match = rowText?.match(/\$([\d,]+\.\d{2})/);
        if (match) {
          return parseFloat(match[1].replace(',', ''));
        }
      }
      
      return null;
    }
  }

  /**
   * Get the number of items in a specific order
   * @param orderNumber - The order number or order ID
   * @returns The number of items or null if not found
   */
  async getOrderItemsCount(orderNumber: string): Promise<number | null> {
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      // Find the card containing the order
      let card = this.orderCards.filter({ hasText: orderNumber });
      if (await card.count() === 0) {
        card = this.orderCards.filter({ has: this.page.locator(`a[href*="${orderNumber}"]`) });
      }
      
      if (await card.count() === 0) {
        return null;
      }
      
      // Look for items count text (e.g., "3 items" or "Items: 3")
      const itemsText = card.locator('text=/\\d+\\s*items?/i');
      if (await itemsText.count() > 0) {
        const text = await itemsText.first().textContent();
        const match = text?.match(/(\d+)\s*items?/i);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
      
      return null;
    } else {
      // Desktop: Find the row and get items count from the appropriate column
      const dataRows = this.page.locator('[role="rowgroup"] [role="row"]');
      const rowCount = await dataRows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const row = dataRows.nth(i);
        const linkInRow = row.locator(`a[href*="${orderNumber}"]`);
        
        if (await linkInRow.count() > 0) {
          // Look for items count in any cell
          const cells = row.locator('[role="gridcell"]');
          const cellCount = await cells.count();
          
          for (let j = 0; j < cellCount; j++) {
            const cellText = await cells.nth(j).textContent();
            const match = cellText?.match(/(\d+)\s*items?/i);
            if (match) {
              return parseInt(match[1], 10);
            }
          }
        }
      }
      
      // Fallback: search by order number text
      const row = this.page.locator('[role="row"]').filter({ hasText: orderNumber });
      if (await row.count() > 0) {
        const rowText = await row.textContent();
        const match = rowText?.match(/(\d+)\s*items?/i);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
      
      return null;
    }
  }

  /**
   * Refresh the orders list
   * Uses page reload as the primary refresh mechanism
   */
  async refreshOrders(): Promise<void> {
    // Check if there's a refresh button first
    const refreshButton = this.page.getByRole('button', { name: /refresh/i });
    if (await refreshButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await refreshButton.click();
      // Wait for loading to complete
      await this.loadingSkeleton.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      return;
    }
    
    // Fallback to page reload
    await this.reload();
    await this.waitForPage();
  }

  /**
   * Navigate back to orders list from order detail page
   */
  async navigateBackToOrdersList(): Promise<void> {
    const backButton = this.page.getByRole('link', { name: /back to orders/i }).first();
    if (await backButton.isVisible({ timeout: 3000 })) {
      await backButton.click();
      await this.waitForPage();
    } else {
      // Fallback to direct navigation
      await this.goto();
    }
  }

  // ==================== Additional Assertion Helpers ====================

  /**
   * Assert order has expected total
   */
  async assertOrderTotal(orderNumber: string, expectedTotal: number): Promise<void> {
    const total = await this.getOrderTotal(orderNumber);
    expect(total).toBe(expectedTotal);
  }

  /**
   * Assert order has expected items count
   */
  async assertOrderItemsCount(orderNumber: string, expectedCount: number): Promise<void> {
    const count = await this.getOrderItemsCount(orderNumber);
    expect(count).toBe(expectedCount);
  }

  /**
   * Assert we are on the order detail page
   */
  async assertOnOrderDetailPage(orderNumber: string): Promise<void> {
    const orderHeading = this.page.getByRole('heading', { name: new RegExp(`order.*${orderNumber}`, 'i') });
    await expect(orderHeading).toBeVisible();
  }
}
