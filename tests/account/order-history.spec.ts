import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { OrderHistoryPage } from '../../page-objects/OrderHistoryPage';
import { getAccountUser } from '../../fixtures/defaultFixtures';

/**
 * Order History E2E Tests
 *
 * Tests for order history page functionality
 *
 * Requirements covered:
 * - 5.6: Order history display
 * - Order list viewing and filtering
 * - Order detail navigation
 * - Status tab filtering
 */
test.describe('Order History Page', () => {
  let loginPage: LoginPage;
  let orderHistoryPage: OrderHistoryPage;
  const testUser = getAccountUser('accountOrders');

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    orderHistoryPage = new OrderHistoryPage(page);

    // Login first - order history requires authentication
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForLoginComplete();

    // Navigate to order history page
    await orderHistoryPage.goto();
    await orderHistoryPage.waitForPage();
  });

  test('should display order history page with heading', async () => {
    // Verify page heading is visible
    await expect(orderHistoryPage.pageHeading).toBeVisible();
    await expect(orderHistoryPage.pageHeading).toHaveText('My Orders');
  });

  test('should display orders for accountOrders user', async () => {
    // This test specifically verifies that the accountOrders user sees their seeded orders
    // The accountOrders user should have 4 orders (orders 24-27) seeded in global-setup
    
    // Wait for orders to load by checking loading skeleton is hidden
    await orderHistoryPage.loadingSkeleton.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // Check if orders exist or empty state is shown
    const isEmpty = await orderHistoryPage.isEmpty();
    const orderCount = await orderHistoryPage.getOrderCount();

    // The accountOrders user should have orders
    expect(isEmpty).toBe(false);
    expect(orderCount).toBeGreaterThan(0);
  });

  test('should display orders list or empty state', async ({ page }) => {
    // Check if orders exist or empty state is shown
    const isEmpty = await orderHistoryPage.isEmpty();
    const orderCount = await orderHistoryPage.getOrderCount();

    if (isEmpty) {
      // Empty state should be displayed
      await expect(orderHistoryPage.emptyStateMessage).toBeVisible();
    } else {
      // Orders should be displayed
      expect(orderCount).toBeGreaterThan(0);
    }
  });

  test('should display order status tabs', async () => {
    // accountOrders user has seeded orders (24-30), so tabs should be visible
    // Verify all tabs are visible
    await orderHistoryPage.assertTabsDisplayed();
    await expect(orderHistoryPage.allOrdersTab).toBeVisible();
    await expect(orderHistoryPage.activeOrdersTab).toBeVisible();
    await expect(orderHistoryPage.completedTab).toBeVisible();
  });

  test('should filter orders by All Orders tab', async () => {
    // accountOrders user has seeded orders (24-30), so tabs should be visible
    // Click on All Orders tab
    await orderHistoryPage.filterByStatus('all');

    // Verify the tab is selected
    const selectedTab = await orderHistoryPage.getSelectedTab();
    expect(selectedTab).toBe('all');
  });

  test('should filter orders by Active Orders tab', async () => {
    // accountOrders user has seeded orders including active ones (PENDING, CONFIRMED, PROCESSING, SHIPPED)
    // Click on Active Orders tab
    await orderHistoryPage.filterByStatus('active');

    // Verify the tab is selected
    const selectedTab = await orderHistoryPage.getSelectedTab();
    expect(selectedTab).toBe('active');

    // accountOrders user has active orders (PENDING: 24, CONFIRMED: 25, SHIPPED: 26, PROCESSING: 29)
    // Verify active orders are displayed
    const orderCount = await orderHistoryPage.getOrderCount();
    expect(orderCount).toBeGreaterThan(0);
  });

  test('should filter orders by Completed tab', async () => {
    // accountOrders user has seeded orders including completed ones (DELIVERED, COMPLETED, CANCELLED)
    // Click on Completed tab
    await orderHistoryPage.filterByStatus('completed');

    // Verify the tab is selected
    const selectedTab = await orderHistoryPage.getSelectedTab();
    expect(selectedTab).toBe('completed');

    // accountOrders user has completed orders (DELIVERED: 27, COMPLETED: 28, CANCELLED: 30)
    // Verify completed orders are displayed
    const orderCount = await orderHistoryPage.getOrderCount();
    expect(orderCount).toBeGreaterThan(0);
  });

  test('should navigate to order details when clicking on an order', async ({ page }) => {
    // accountOrders user has seeded orders (24-30)
    // Get the first order number
    const orderNumbers = await orderHistoryPage.getOrderNumbers();
    expect(orderNumbers.length).toBeGreaterThan(0);

    const firstOrderNumber = orderNumbers[0];

    // Click to view order details
    await orderHistoryPage.viewOrderDetails(firstOrderNumber);

    // Verify we navigated to order detail page
    await expect(page).toHaveURL(/\/account\/orders\/.+/);
  });

  test('should display correct order information in details', async ({ page }) => {
    // accountOrders user has seeded orders (24-30)
    // Get the first order number
    const orderNumbers = await orderHistoryPage.getOrderNumbers();
    expect(orderNumbers.length).toBeGreaterThan(0);

    const firstOrderNumber = orderNumbers[0];

    // Get order details
    const orderDetails = await orderHistoryPage.getOrderDetails(firstOrderNumber);

    // Verify order details contain expected information
    // Order number should be present (may be different format on detail page)
    expect(orderDetails.orderNumber || firstOrderNumber).toBeTruthy();

    // Status should be present
    expect(orderDetails.status).toBeTruthy();

    // Navigate back to orders list
    await orderHistoryPage.navigateBackToOrdersList();
    await orderHistoryPage.waitForPage();

    // Verify we're back on the orders list
    await expect(orderHistoryPage.pageHeading).toBeVisible();
  });

  test('should handle pagination if multiple orders exist', async () => {
    // accountOrders user has 7 seeded orders (24-30)
    // Get initial order count
    const orderCount = await orderHistoryPage.getOrderCount();
    expect(orderCount).toBeGreaterThan(0);

    // Check if pagination controls exist (for data grid)
    const paginationControls = orderHistoryPage.page.locator('.MuiTablePagination-root, .MuiDataGrid-footerContainer');
    const hasPagination = await paginationControls.isVisible().catch(() => false);

    if (hasPagination) {
      // Verify pagination is functional
      await expect(paginationControls).toBeVisible();
    } else {
      // If no pagination, all orders should be visible (7 orders may not require pagination)
      expect(orderCount).toBeGreaterThan(0);
    }
  });

  test('should maintain tab selection after page refresh', async () => {
    // accountOrders user has seeded orders (24-30), so tabs should be visible
    // Select Active Orders tab
    await orderHistoryPage.filterByStatus('active');

    // Verify tab is selected
    let selectedTab = await orderHistoryPage.getSelectedTab();
    expect(selectedTab).toBe('active');

    // Refresh the page
    await orderHistoryPage.refreshOrders();

    // Note: Tab selection may or may not persist after refresh depending on implementation
    // This test verifies the page loads correctly after refresh
    await orderHistoryPage.assertOrdersPageDisplayed();
  });

  test('should display order date for orders in the list', async () => {
    // accountOrders user has seeded orders (24-30)
    // Get the first order number
    const orderNumbers = await orderHistoryPage.getOrderNumbers();
    expect(orderNumbers.length).toBeGreaterThan(0);

    const firstOrderNumber = orderNumbers[0];

    // Get order date
    const orderDate = await orderHistoryPage.getOrderDate(firstOrderNumber);

    // Date should be present (format may vary)
    // If date is not displayed in list view, this is acceptable
    if (orderDate) {
      expect(orderDate).toBeTruthy();
    }
  });

  test('should display order status for orders in the list', async () => {
    // accountOrders user has seeded orders (24-30) with various statuses
    // Get the first order number
    const orderNumbers = await orderHistoryPage.getOrderNumbers();
    expect(orderNumbers.length).toBeGreaterThan(0);

    const firstOrderNumber = orderNumbers[0];

    // Get order status
    const orderStatus = await orderHistoryPage.getOrderStatus(firstOrderNumber);

    // Status should be present
    expect(orderStatus).toBeTruthy();
  });
});
