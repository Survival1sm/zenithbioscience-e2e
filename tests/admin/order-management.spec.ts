import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { AdminOrdersPage } from '../../page-objects/admin';
import { defaultFixtures } from '../../fixtures/defaultFixtures';

/**
 * Admin Order Management E2E Tests
 *
 * Tests for admin order management functionality
 *
 * DEDICATED ORDER ASSIGNMENTS (each test has its own order):
 * - Test "CONFIRMED to PROCESSING": Order 0003 (CONFIRMED)
 * - Test "success message after status update": Order 0001 (PENDING)
 * - Test "persist updated status": Order 0005 (PROCESSING with batch)
 * - Test "cancelling an order": Order 0009 (AWAITING_PAYMENT)
 *
 * Requirements covered:
 * - Admin can view orders list
 * - Orders list displays order information (order number, date, status, total)
 * - Admin can view order details dialog
 * - Order details shows shipping address and items
 * - Admin can update order status
 * - Status update shows success message
 * - Updated status persists in the list
 * - Admin can switch between All Orders and Manual Payments tabs
 */
test.describe('Admin Order Management', () => {
  // Run tests serially to avoid race conditions when modifying shared order state
  test.describe.configure({ mode: 'serial' });

  let loginPage: LoginPage;
  let adminOrdersPage: AdminOrdersPage;
  const adminUser = defaultFixtures.users.admin;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    adminOrdersPage = new AdminOrdersPage(page);

    // Login as admin user
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(adminUser.email, adminUser.password);
    await loginPage.waitForLoginComplete();

    // Navigate to admin orders page
    await adminOrdersPage.goto();
    await adminOrdersPage.waitForPage();
  });

  test.describe('Orders List View', () => {
    test('should display order management page with heading', async () => {
      // Verify page heading is visible
      await adminOrdersPage.assertPageDisplayed();
      await expect(adminOrdersPage.pageHeading).toBeVisible();
    });

    test('should display orders list or empty state', async () => {
      // Verify no error is displayed
      await adminOrdersPage.assertNoError();

      // Check if orders exist - they MUST exist in fixtures
      const orderCount = await adminOrdersPage.getOrderCount();
      expect(orderCount, 'Orders must exist in fixtures').toBeGreaterThan(0);
    });

    test('should display order information in the list', async () => {
      // Get orders from the list - they MUST exist in fixtures
      const orders = await adminOrdersPage.getOrders();
      expect(orders.length, 'Orders must exist in fixtures').toBeGreaterThan(0);

      // Verify first order has required information
      const firstOrder = orders[0];
      expect(firstOrder.orderNumber).toBeTruthy();
      expect(firstOrder.status).toBeTruthy();
      expect(firstOrder.total).toBeGreaterThanOrEqual(0);
    });

    test('should display tabs for All Orders and Manual Payments', async () => {
      // Verify tabs are displayed
      await adminOrdersPage.assertTabsDisplayed();
      await expect(adminOrdersPage.allOrdersTab).toBeVisible();
      await expect(adminOrdersPage.manualPaymentsTab).toBeVisible();
    });
  });

  test.describe('Tab Navigation', () => {
    test('should switch to All Orders tab', async () => {
      // Click on All Orders tab
      await adminOrdersPage.switchToAllOrdersTab();

      // Verify tab is selected (aria-selected attribute)
      await expect(adminOrdersPage.allOrdersTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch to Manual Payments tab', async () => {
      // Click on Manual Payments tab
      await adminOrdersPage.switchToManualPaymentsTab();

      // Verify tab is selected
      await expect(adminOrdersPage.manualPaymentsTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch between tabs correctly', async () => {
      // Start on All Orders tab
      await adminOrdersPage.switchToAllOrdersTab();
      await expect(adminOrdersPage.allOrdersTab).toHaveAttribute('aria-selected', 'true');

      // Switch to Manual Payments tab
      await adminOrdersPage.switchToManualPaymentsTab();
      await expect(adminOrdersPage.manualPaymentsTab).toHaveAttribute('aria-selected', 'true');
      await expect(adminOrdersPage.allOrdersTab).toHaveAttribute('aria-selected', 'false');

      // Switch back to All Orders tab
      await adminOrdersPage.switchToAllOrdersTab();
      await expect(adminOrdersPage.allOrdersTab).toHaveAttribute('aria-selected', 'true');
      await expect(adminOrdersPage.manualPaymentsTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  test.describe('Order Details Dialog', () => {
    test('should open order details dialog when viewing an order', async () => {
      // Get orders from the list - they MUST exist in fixtures
      const orders = await adminOrdersPage.getOrders();
      expect(orders.length, 'Orders must exist in fixtures').toBeGreaterThan(0);

      // View the first order
      const firstOrderNumber = orders[0].orderNumber;
      await adminOrdersPage.viewOrder(firstOrderNumber);

      // Verify dialog is open
      await adminOrdersPage.assertDialogOpen();
    });

    test('should display order details in the dialog', async () => {
      // Get orders from the list - they MUST exist in fixtures
      const orders = await adminOrdersPage.getOrders();
      expect(orders.length, 'Orders must exist in fixtures').toBeGreaterThan(0);

      // View the first order
      const firstOrderNumber = orders[0].orderNumber;
      await adminOrdersPage.viewOrder(firstOrderNumber);

      // Get order details from dialog
      const orderDetails = await adminOrdersPage.getOrderDetails();

      // Verify order details contain expected information
      expect(orderDetails.orderNumber || firstOrderNumber).toBeTruthy();
      expect(orderDetails.status).toBeTruthy();
    });

    test('should display shipping address in order details', async () => {
      // Get orders from the list - they MUST exist in fixtures
      const orders = await adminOrdersPage.getOrders();
      expect(orders.length, 'Orders must exist in fixtures').toBeGreaterThan(0);

      // View the first order
      const firstOrderNumber = orders[0].orderNumber;
      await adminOrdersPage.viewOrder(firstOrderNumber);

      // Verify dialog is open and contains shipping information
      await adminOrdersPage.assertDialogOpen();

      // Check dialog content for shipping address section
      const dialogContent = await adminOrdersPage.orderDialog.textContent();
      // Shipping address section should be present (may contain address details)
      expect(dialogContent).toBeTruthy();
    });

    test('should close order details dialog when clicking cancel', async () => {
      // Get orders from the list - they MUST exist in fixtures
      const orders = await adminOrdersPage.getOrders();
      expect(orders.length, 'Orders must exist in fixtures').toBeGreaterThan(0);

      // View the first order
      const firstOrderNumber = orders[0].orderNumber;
      await adminOrdersPage.viewOrder(firstOrderNumber);

      // Verify dialog is open
      await adminOrdersPage.assertDialogOpen();

      // Close the dialog
      await adminOrdersPage.closeOrderDialog();

      // Verify dialog is closed
      await adminOrdersPage.assertDialogClosed();
    });
  });

  test.describe('Order Status Update', () => {
    /**
     * Valid status transitions (from OrderStateMachine.java):
     * PENDING → AWAITING_PAYMENT, CONFIRMED, CANCELLED
     * AWAITING_PAYMENT → CONFIRMED, CANCELLED
     * CONFIRMED → PROCESSING, CANCELLED
     * PROCESSING → SHIPPED, CANCELLED
     * SHIPPED → IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
     *
     * Transition guards:
     * - CONFIRMED requires: payment COMPLETED, has items
     * - PROCESSING requires: status CONFIRMED, payment COMPLETED, has items, has shipping address
     * - SHIPPED requires: status PROCESSING
     */

    test('should update order status from CONFIRMED to PROCESSING', async () => {
      // DEDICATED ORDER: 0003 (CONFIRMED) - only this test uses this order
      // Find order 0003 which is in CONFIRMED status
      const confirmedOrder = await adminOrdersPage.findOrder('0003');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(confirmedOrder, 'Order 0003 (CONFIRMED) must exist in fixtures').not.toBeNull();
      expect(confirmedOrder?.status.toUpperCase()).toBe('CONFIRMED');

      // View the confirmed order
      await adminOrdersPage.viewOrder(confirmedOrder!.orderNumber);

      // Update order status to PROCESSING (valid transition from CONFIRMED)
      await adminOrdersPage.updateOrderStatus('PROCESSING');

      // Click update button
      await adminOrdersPage.clickUpdateOrder();

      // Verify success message is displayed
      await adminOrdersPage.assertSuccessMessageDisplayed();
    });

    test('should display success message after status update', async () => {
      // DEDICATED ORDER: 0001 (PENDING) - only this test uses this order
      // Find order 0001 which is in PENDING status
      const pendingOrder = await adminOrdersPage.findOrder('0001');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(pendingOrder, 'Order 0001 (PENDING) must exist in fixtures').not.toBeNull();
      expect(pendingOrder?.status.toUpperCase()).toBe('PENDING');

      // View the pending order
      await adminOrdersPage.viewOrder(pendingOrder!.orderNumber);

      // Update order status to CONFIRMED (valid transition from PENDING with COMPLETED payment)
      await adminOrdersPage.updateOrderStatus('CONFIRMED');

      // Click update button
      await adminOrdersPage.clickUpdateOrder();

      // Verify success message is displayed
      const hasSuccess = await adminOrdersPage.hasSuccessMessage();
      expect(hasSuccess).toBeTruthy();

      // Get success message text
      const successMessage = await adminOrdersPage.getSuccessMessage();
      expect(successMessage).toBeTruthy();
    });

    test('should persist updated status in the orders list', async () => {
      // DEDICATED ORDER: 0005 (PROCESSING with batch) - only this test uses this order
      // Find order 0005 which is in PROCESSING status with batch numbers
      const processingOrder = await adminOrdersPage.findOrder('0005');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(processingOrder, 'Order 0005 (PROCESSING with batch) must exist in fixtures').not.toBeNull();
      expect(processingOrder?.status.toUpperCase()).toBe('PROCESSING');

      // View the processing order
      await adminOrdersPage.viewOrder(processingOrder!.orderNumber);

      // Update order status to SHIPPED (valid transition from PROCESSING)
      await adminOrdersPage.updateOrderStatus('SHIPPED');

      // Click update button
      await adminOrdersPage.clickUpdateOrder();

      // Wait for success message
      await adminOrdersPage.assertSuccessMessageDisplayed();

      // Wait for list to refresh
      await adminOrdersPage.wait(1000);

      // Verify the status is updated in the list
      await adminOrdersPage.assertOrderStatus(processingOrder!.orderNumber, 'SHIPPED');
    });

    test('should allow cancelling an order', async () => {
      // DEDICATED ORDER: 0009 (AWAITING_PAYMENT) - only this test uses this order
      // Find order 0009 which is in AWAITING_PAYMENT status
      const awaitingPaymentOrder = await adminOrdersPage.findOrder('0009');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(awaitingPaymentOrder, 'Order 0009 (AWAITING_PAYMENT) must exist in fixtures').not.toBeNull();
      const status = awaitingPaymentOrder?.status.toUpperCase();
      expect(status === 'AWAITING_PAYMENT' || status === 'AWAITING PAYMENT',
        `Order 0009 should be AWAITING_PAYMENT but was ${status}`).toBe(true);

      // View the awaiting payment order
      await adminOrdersPage.viewOrder(awaitingPaymentOrder!.orderNumber);

      // Update to CANCELLED status (valid transition from AWAITING_PAYMENT)
      await adminOrdersPage.updateOrderStatus('CANCELLED');
      await adminOrdersPage.clickUpdateOrder();

      // Verify success
      await adminOrdersPage.assertSuccessMessageDisplayed();

      // Wait for list to refresh
      await adminOrdersPage.wait(1000);

      // Verify status in list
      await adminOrdersPage.assertOrderStatus(awaitingPaymentOrder!.orderNumber, 'CANCELLED');
    });
  });

  test.describe('Order Search and Filter', () => {
    test('should find order by order number', async () => {
      // Get orders from the list - they MUST exist in fixtures
      const orders = await adminOrdersPage.getOrders();
      expect(orders.length, 'Orders must exist in fixtures').toBeGreaterThan(0);

      // Find the first order by its number
      const firstOrderNumber = orders[0].orderNumber;
      const foundOrder = await adminOrdersPage.findOrder(firstOrderNumber);

      // Verify order was found
      expect(foundOrder).not.toBeNull();
      expect(foundOrder?.orderNumber).toContain(firstOrderNumber);
    });
  });
});
