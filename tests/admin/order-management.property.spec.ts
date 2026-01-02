import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { AdminOrdersPage } from '../../page-objects/admin';
import { defaultFixtures } from '../../fixtures/defaultFixtures';

/**
 * Property Test: Admin Order Management Persistence
 *
 * Property 12: Admin Order Management Persistence
 * Validates that order status changes persist correctly
 *
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
 * - SHIPPED requires: status PROCESSING, all items have batch numbers
 *
 * DEDICATED ORDER ASSIGNMENTS (each test has its own order):
 * - Test "Order status update is immediately visible": Order 0017 (CONFIRMED)
 * - Test "Multiple valid status transitions": Order 0018 (PENDING)
 * - Test "Order status persists after page reload": Order 0006 (PROCESSING with batch)
 * - Test "Order status persists after navigating away": Order 0019 (AWAITING_PAYMENT)
 * - Test "Order details remain intact": Order 0020 (PENDING)
 * - Test "Order count remains the same": Order 0021 (CONFIRMED)
 * - Test "Valid status transitions succeed": Order 0022 (PENDING)
 * - Test "Cancellation is available": Order 0023 (PENDING)
 *
 * Requirements covered:
 * - 6.3: Admin order management
 */
test.describe('Property: Admin Order Management Persistence', () => {
  // Run tests serially to avoid race conditions when modifying shared order state
  test.describe.configure({ mode: 'serial' });

  const adminUser = defaultFixtures.users.admin;
  let loginPage: LoginPage;
  let adminOrdersPage: AdminOrdersPage;

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

  test.describe('Property: Status changes are reflected in UI', () => {
    test('Order status update is immediately visible in the list', async () => {
      // DEDICATED ORDER: 0017 (CONFIRMED) - only this test uses this order
      // Find order 0017 which is in CONFIRMED status
      const confirmedOrder = await adminOrdersPage.findOrder('0017');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(confirmedOrder, 'Order 0017 (CONFIRMED) must exist in fixtures').not.toBeNull();
      expect(confirmedOrder?.status.toUpperCase()).toBe('CONFIRMED');

      // Update the order status to PROCESSING (valid transition from CONFIRMED)
      await adminOrdersPage.viewOrder(confirmedOrder!.orderNumber);
      await adminOrdersPage.updateOrderStatus('PROCESSING');
      await adminOrdersPage.clickUpdateOrder();

      // Wait for success message to confirm update completed
      await adminOrdersPage.assertSuccessMessageDisplayed();

      // Property: Status should be updated in the list
      const updatedOrder = await adminOrdersPage.findOrder(confirmedOrder!.orderNumber);
      expect(updatedOrder).not.toBeNull();
      expect(updatedOrder?.status.toUpperCase()).toBe('PROCESSING');
    });

    test('Multiple valid status transitions are all reflected correctly', async () => {
      // DEDICATED ORDER: 0018 (PENDING) - only this test uses this order
      // Find order 0018 which is in PENDING status
      const pendingOrder = await adminOrdersPage.findOrder('0018');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(pendingOrder, 'Order 0018 (PENDING) must exist in fixtures').not.toBeNull();
      expect(pendingOrder?.status.toUpperCase()).toBe('PENDING');

      // First transition: PENDING → CONFIRMED
      await adminOrdersPage.viewOrder(pendingOrder!.orderNumber);
      await adminOrdersPage.updateOrderStatus('CONFIRMED');
      await adminOrdersPage.clickUpdateOrder();
      await adminOrdersPage.assertSuccessMessageDisplayed();

      // Verify first transition
      let updatedOrder = await adminOrdersPage.findOrder(pendingOrder!.orderNumber);
      expect(updatedOrder?.status.toUpperCase()).toBe('CONFIRMED');

      // Second transition: CONFIRMED → PROCESSING
      await adminOrdersPage.viewOrder(pendingOrder!.orderNumber);
      await adminOrdersPage.updateOrderStatus('PROCESSING');
      await adminOrdersPage.clickUpdateOrder();
      await adminOrdersPage.assertSuccessMessageDisplayed();

      // Verify second transition
      updatedOrder = await adminOrdersPage.findOrder(pendingOrder!.orderNumber);
      expect(updatedOrder?.status.toUpperCase()).toBe('PROCESSING');
    });
  });

  test.describe('Property: Status changes persist after reload', () => {
    test('Order status persists after page reload', async ({ page }) => {
      // DEDICATED ORDER: 0006 (PROCESSING with batch) - only this test uses this order
      // Find order 0006 which is in PROCESSING status with batch numbers
      const processingOrder = await adminOrdersPage.findOrder('0006');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(processingOrder, 'Order 0006 (PROCESSING with batch) must exist in fixtures').not.toBeNull();
      expect(processingOrder?.status.toUpperCase()).toBe('PROCESSING');

      // Store the order number for later lookup
      const orderNumber = processingOrder!.orderNumber;

      // Update the order status to SHIPPED
      await adminOrdersPage.viewOrder(orderNumber);
      await adminOrdersPage.updateOrderStatus('SHIPPED');
      await adminOrdersPage.clickUpdateOrder();

      // Wait for success message to confirm update completed
      await adminOrdersPage.assertSuccessMessageDisplayed();

      // Reload the page
      await page.reload();
      await adminOrdersPage.waitForPage();

      // Property: Status should persist after reload
      const reloadedOrder = await adminOrdersPage.findOrder(orderNumber);
      expect(reloadedOrder, `Order ${orderNumber} should be found after reload`).not.toBeNull();
      expect(reloadedOrder?.status.toUpperCase()).toBe('SHIPPED');
    });

    test('Order status persists after navigating away and back', async ({ page }) => {
      // DEDICATED ORDER: 0019 (AWAITING_PAYMENT) - only this test uses this order
      // Find order 0019 which is in AWAITING_PAYMENT status
      const awaitingOrder = await adminOrdersPage.findOrder('0019');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(awaitingOrder, 'Order 0019 (AWAITING_PAYMENT) must exist in fixtures').not.toBeNull();
      const status = awaitingOrder?.status.toUpperCase();
      expect(status === 'AWAITING_PAYMENT' || status === 'AWAITING PAYMENT', 
        `Order 0019 should be AWAITING_PAYMENT but was ${status}`).toBe(true);

      // Update the order status to CANCELLED
      await adminOrdersPage.viewOrder(awaitingOrder!.orderNumber);
      await adminOrdersPage.updateOrderStatus('CANCELLED');
      await adminOrdersPage.clickUpdateOrder();

      // Wait for success message to confirm update completed
      await adminOrdersPage.assertSuccessMessageDisplayed();

      // Navigate away to admin dashboard
      await page.goto('http://localhost:3000/admin');
      await page.waitForLoadState('domcontentloaded');

      // Navigate back to orders
      await adminOrdersPage.goto();
      await adminOrdersPage.waitForPage();

      // Property: Status should persist after navigation
      const returnedOrder = await adminOrdersPage.findOrder(awaitingOrder!.orderNumber);
      expect(returnedOrder).not.toBeNull();
      expect(returnedOrder?.status.toUpperCase()).toBe('CANCELLED');
    });
  });

  test.describe('Property: Order data integrity', () => {
    test('Order details remain intact after status change', async () => {
      // DEDICATED ORDER: 0020 (PENDING) - only this test uses this order
      // Find order 0020 which is in PENDING status
      const pendingOrder = await adminOrdersPage.findOrder('0020');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(pendingOrder, 'Order 0020 (PENDING) must exist in fixtures').not.toBeNull();
      expect(pendingOrder?.status.toUpperCase()).toBe('PENDING');

      const originalTotal = pendingOrder!.total;
      const originalOrderNumber = pendingOrder!.orderNumber;

      // Update the order status to CONFIRMED (valid transition from PENDING)
      await adminOrdersPage.viewOrder(pendingOrder!.orderNumber);
      await adminOrdersPage.updateOrderStatus('CONFIRMED');
      await adminOrdersPage.clickUpdateOrder();

      // Wait for success message to confirm update completed
      await adminOrdersPage.assertSuccessMessageDisplayed();

      // Property: Order details should remain intact
      const updatedOrder = await adminOrdersPage.findOrder(originalOrderNumber);
      expect(updatedOrder).not.toBeNull();
      expect(updatedOrder?.orderNumber).toBe(originalOrderNumber);
      expect(updatedOrder?.total).toBe(originalTotal);
    });

    test('Order count remains the same after status updates', async () => {
      // DEDICATED ORDER: 0021 (CONFIRMED) - only this test uses this order
      // Find order 0021 which is in CONFIRMED status
      const confirmedOrder = await adminOrdersPage.findOrder('0021');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(confirmedOrder, 'Order 0021 (CONFIRMED) must exist in fixtures').not.toBeNull();
      expect(confirmedOrder?.status.toUpperCase()).toBe('CONFIRMED');

      // Get initial order count AFTER finding the order (pagination may have changed)
      const initialCount = await adminOrdersPage.getOrderCount();
      expect(initialCount, 'Orders must exist in fixtures').toBeGreaterThan(0);

      // Update the order status to PROCESSING (valid transition from CONFIRMED)
      await adminOrdersPage.viewOrder(confirmedOrder!.orderNumber);
      await adminOrdersPage.updateOrderStatus('PROCESSING');
      await adminOrdersPage.clickUpdateOrder();

      // Wait for success message to confirm update completed
      await adminOrdersPage.assertSuccessMessageDisplayed();

      // Property: Order count should remain the same (status change doesn't delete orders)
      const finalCount = await adminOrdersPage.getOrderCount();
      expect(finalCount).toBe(initialCount);
    });
  });

  test.describe('Property: Status transition validity', () => {
    test('Valid status transitions succeed', async () => {
      // DEDICATED ORDER: 0022 (PENDING) - only this test uses this order
      // Find order 0022 which is in PENDING status
      const pendingOrder = await adminOrdersPage.findOrder('0022');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(pendingOrder, 'Order 0022 (PENDING) must exist in fixtures').not.toBeNull();
      expect(pendingOrder?.status.toUpperCase()).toBe('PENDING');

      // Update to CONFIRMED (valid transition from PENDING with COMPLETED payment)
      await adminOrdersPage.viewOrder(pendingOrder!.orderNumber);
      await adminOrdersPage.updateOrderStatus('CONFIRMED');
      await adminOrdersPage.clickUpdateOrder();

      // Wait for success message to confirm update completed
      await adminOrdersPage.assertSuccessMessageDisplayed();

      // Property: Status should be successfully set
      const updatedOrder = await adminOrdersPage.findOrder(pendingOrder!.orderNumber);
      expect(updatedOrder?.status.toUpperCase()).toBe('CONFIRMED');
    });

    test('Cancellation is available from multiple statuses', async () => {
      // DEDICATED ORDER: 0023 (PENDING) - only this test uses this order
      // Find order 0023 which is in PENDING status (cancellable)
      const cancellableOrder = await adminOrdersPage.findOrder('0023');
      
      // This order MUST exist - fail the test if not found (not skip!)
      expect(cancellableOrder, 'Order 0023 (PENDING) must exist in fixtures').not.toBeNull();
      expect(cancellableOrder?.status.toUpperCase()).toBe('PENDING');

      // Update to CANCELLED
      await adminOrdersPage.viewOrder(cancellableOrder!.orderNumber);
      await adminOrdersPage.updateOrderStatus('CANCELLED');
      await adminOrdersPage.clickUpdateOrder();

      // Wait for success message to confirm update completed
      await adminOrdersPage.assertSuccessMessageDisplayed();

      // Property: Order should be cancelled
      const updatedOrder = await adminOrdersPage.findOrder(cancellableOrder!.orderNumber);
      expect(updatedOrder?.status.toUpperCase()).toBe('CANCELLED');
    });
  });
});
