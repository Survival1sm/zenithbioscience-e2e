/**
 * Default E2E Test Fixtures
 *
 * Test data for E2E integration tests.
 * Users are created via the backend API and activated directly in MongoDB.
 */

import { E2ETestFixtures, ProductCategory, TestShippingAddress, TestOrder, TestOrderItem, TestOrderAddress, TestBitcoinPayment } from './types';

/**
 * Generate a unique order number
 */
function generateOrderNumber(index: number): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `ZB${dateStr}${String(index).padStart(4, '0')}`;
}

/**
 * Create test orders for E2E testing
 * These orders reference the seeded products and users
 * 
 * IMPORTANT: Each test gets its own dedicated order to avoid conflicts.
 * Tests run serially within each file, so orders are consumed (status changed).
 * 
 * ORDER ASSIGNMENTS:
 * 
 * SPEC TESTS (order-management.spec.ts):
 * - Order 0001: PENDING → for "success message after status update" test
 * - Order 0003: CONFIRMED → for "CONFIRMED to PROCESSING" test
 * - Order 0005: PROCESSING with batch → for "persist updated status" test
 * - Order 0009: AWAITING_PAYMENT → for "cancelling an order" test
 * 
 * PROPERTY TESTS (order-management.property.spec.ts):
 * - Order 0017: CONFIRMED → for "Order status update is immediately visible" test
 * - Order 0018: PENDING → for "Multiple valid status transitions" test
 * - Order 0006: PROCESSING with batch → for "Order status persists after page reload" test
 * - Order 0019: AWAITING_PAYMENT → for "Order status persists after navigating away" test
 * - Order 0020: PENDING → for "Order details remain intact" test
 * - Order 0021: CONFIRMED → for "Order count remains the same" test
 * - Order 0022: PENDING → for "Valid status transitions succeed" test
 * - Order 0023: PENDING → for "Cancellation is available" test
 * 
 * SHARED/UNUSED:
 * - Order 0002, 0012, 0013: PENDING (extra)
 * - Order 0004: CONFIRMED (extra)
 * - Order 0010, 0014: AWAITING_PAYMENT (extra)
 * - Order 0015, 0016: PROCESSING with batch (extra)
 * - Order 0007: SHIPPED
 * - Order 0008: DELIVERED
 * - Order 0011: CANCELLED
 */
function createTestOrders(): TestOrder[] {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const shippingAddress: TestOrderAddress = {
    firstName: 'Test',
    lastName: 'Customer',
    addressLine1: '417 Montgomery St',
    addressLine2: 'Floor 5',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94104',
    country: 'US',
    phoneNumber: '+14151234567',
  };

  const billingAddress: TestOrderAddress = { ...shippingAddress };

  return [
    // Order 1: PENDING - for spec tests
    {
      id: 'e2e-order-001',
      orderNumber: generateOrderNumber(1),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 2,
          unitPrice: 99.99,
          totalPrice: 199.98,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PENDING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'STANDARD',
      subtotal: 199.98,
      tax: 16.50,
      shippingCost: 9.99,
      total: 226.47,
      orderDate: yesterday,
    },
    // Order 2: PENDING - for property tests
    {
      id: 'e2e-order-002',
      orderNumber: generateOrderNumber(2),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PENDING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ZELLE',
      shippingMethod: 'STANDARD',
      subtotal: 99.99,
      tax: 8.25,
      shippingCost: 9.99,
      total: 118.23,
      orderDate: yesterday,
    },
    // Order 2B: PENDING - additional for parallel test execution
    {
      id: 'e2e-order-002b',
      orderNumber: generateOrderNumber(12),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PENDING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ACH',
      shippingMethod: 'EXPRESS',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 14.99,
      total: 155.71,
      orderDate: yesterday,
    },
    // Order 2C: PENDING - additional for parallel test execution
    {
      id: 'e2e-order-002c',
      orderNumber: generateOrderNumber(13),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 2,
          unitPrice: 99.99,
          totalPrice: 199.98,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PENDING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'STANDARD',
      subtotal: 199.98,
      tax: 16.50,
      shippingCost: 9.99,
      total: 226.47,
      orderDate: yesterday,
    },
    // Order 3: CONFIRMED - for spec tests
    {
      id: 'e2e-order-003',
      orderNumber: generateOrderNumber(3),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ZELLE',
      shippingMethod: 'EXPRESS',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 14.99,
      total: 155.71,
      orderDate: twoDaysAgo,
    },
    // Order 4: CONFIRMED - for property tests
    {
      id: 'e2e-order-004',
      orderNumber: generateOrderNumber(4),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ACH',
      shippingMethod: 'STANDARD',
      subtotal: 99.99,
      tax: 8.25,
      shippingCost: 9.99,
      total: 118.23,
      orderDate: twoDaysAgo,
    },
    // Order 5: PROCESSING - for spec tests (with batch numbers for SHIPPED transition)
    {
      id: 'e2e-order-005',
      orderNumber: generateOrderNumber(5),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99,
          batchNumber: 'BATCH-E2E-001',
        },
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 2,
          unitPrice: 129.99,
          totalPrice: 259.98,
          batchNumber: 'BATCH-E2E-002',
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PROCESSING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ACH',
      shippingMethod: 'STANDARD',
      subtotal: 359.97,
      tax: 29.70,
      shippingCost: 9.99,
      total: 399.66,
      orderDate: threeDaysAgo,
    },
    // Order 6: PROCESSING - for property tests (with batch numbers for SHIPPED transition)
    {
      id: 'e2e-order-006',
      orderNumber: generateOrderNumber(6),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
          batchNumber: 'BATCH-E2E-003',
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PROCESSING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'EXPRESS',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 14.99,
      total: 155.71,
      orderDate: fourDaysAgo,
    },
    // Order 7: SHIPPED - in transit (with batch numbers)
    {
      id: 'e2e-order-007',
      orderNumber: generateOrderNumber(7),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 3,
          unitPrice: 99.99,
          totalPrice: 299.97,
          batchNumber: 'BATCH-E2E-004',
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'SHIPPED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'EXPRESS',
      subtotal: 299.97,
      tax: 24.75,
      shippingCost: 14.99,
      total: 339.71,
      orderDate: oneWeekAgo,
      trackingNumber: 'E2E1234567890',
    },
    // Order 8: DELIVERED - completed delivery (with batch numbers)
    {
      id: 'e2e-order-008',
      orderNumber: generateOrderNumber(8),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
          batchNumber: 'BATCH-E2E-005',
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'DELIVERED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'SOLANA_PAY',
      shippingMethod: 'OVERNIGHT',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 24.99,
      total: 165.71,
      orderDate: oneWeekAgo,
      trackingNumber: 'E2E0987654321',
    },
    // Order 9: AWAITING_PAYMENT - for spec tests cancellation
    {
      id: 'e2e-order-009',
      orderNumber: generateOrderNumber(9),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'AWAITING_PAYMENT',
      paymentStatus: 'PENDING',
      paymentMethod: 'ZELLE',
      shippingMethod: 'STANDARD',
      subtotal: 99.99,
      tax: 8.25,
      shippingCost: 9.99,
      total: 118.23,
      orderDate: now,
    },
    // Order 10: AWAITING_PAYMENT - for property tests cancellation
    {
      id: 'e2e-order-010',
      orderNumber: generateOrderNumber(10),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'AWAITING_PAYMENT',
      paymentStatus: 'PENDING',
      paymentMethod: 'ACH',
      shippingMethod: 'EXPRESS',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 14.99,
      total: 155.71,
      orderDate: now,
    },
    // Order 10B: AWAITING_PAYMENT - additional for parallel test execution
    {
      id: 'e2e-order-010b',
      orderNumber: generateOrderNumber(14),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 2,
          unitPrice: 99.99,
          totalPrice: 199.98,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'AWAITING_PAYMENT',
      paymentStatus: 'PENDING',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'STANDARD',
      subtotal: 199.98,
      tax: 16.50,
      shippingCost: 9.99,
      total: 226.47,
      orderDate: now,
    },
    // Order 11: CANCELLED - cancelled order
    {
      id: 'e2e-order-011',
      orderNumber: generateOrderNumber(11),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'STANDARD',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 9.99,
      total: 150.71,
      orderDate: oneWeekAgo,
      notes: 'Customer requested cancellation',
    },
    // Order 15: PROCESSING - additional for spec tests (with batch numbers for SHIPPED transition)
    {
      id: 'e2e-order-015',
      orderNumber: generateOrderNumber(15),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 2,
          unitPrice: 99.99,
          totalPrice: 199.98,
          batchNumber: 'BATCH-E2E-015',
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PROCESSING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ZELLE',
      shippingMethod: 'EXPRESS',
      subtotal: 199.98,
      tax: 16.50,
      shippingCost: 14.99,
      total: 231.47,
      orderDate: threeDaysAgo,
    },
    // Order 16: PROCESSING - additional for property tests (with batch numbers for SHIPPED transition)
    {
      id: 'e2e-order-016',
      orderNumber: generateOrderNumber(16),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
          batchNumber: 'BATCH-E2E-016',
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PROCESSING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ACH',
      shippingMethod: 'STANDARD',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 9.99,
      total: 150.71,
      orderDate: fourDaysAgo,
    },
    // Order 17: CONFIRMED - DEDICATED for property test "Order status update is immediately visible"
    {
      id: 'e2e-order-017',
      orderNumber: generateOrderNumber(17),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ZELLE',
      shippingMethod: 'STANDARD',
      subtotal: 99.99,
      tax: 8.25,
      shippingCost: 9.99,
      total: 118.23,
      orderDate: twoDaysAgo,
    },
    // Order 18: PENDING - DEDICATED for property test "Multiple valid status transitions"
    {
      id: 'e2e-order-018',
      orderNumber: generateOrderNumber(18),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PENDING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ACH',
      shippingMethod: 'EXPRESS',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 14.99,
      total: 155.71,
      orderDate: yesterday,
    },
    // Order 19: AWAITING_PAYMENT - DEDICATED for property test "Order status persists after navigating away"
    {
      id: 'e2e-order-019',
      orderNumber: generateOrderNumber(19),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'AWAITING_PAYMENT',
      paymentStatus: 'PENDING',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'STANDARD',
      subtotal: 99.99,
      tax: 8.25,
      shippingCost: 9.99,
      total: 118.23,
      orderDate: now,
    },
    // Order 20: PENDING - DEDICATED for property test "Order details remain intact"
    {
      id: 'e2e-order-020',
      orderNumber: generateOrderNumber(20),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 2,
          unitPrice: 99.99,
          totalPrice: 199.98,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PENDING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ZELLE',
      shippingMethod: 'STANDARD',
      subtotal: 199.98,
      tax: 16.50,
      shippingCost: 9.99,
      total: 226.47,
      orderDate: yesterday,
    },
    // Order 21: CONFIRMED - DEDICATED for property test "Order count remains the same"
    {
      id: 'e2e-order-021',
      orderNumber: generateOrderNumber(21),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ACH',
      shippingMethod: 'EXPRESS',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 14.99,
      total: 155.71,
      orderDate: twoDaysAgo,
    },
    // Order 22: PENDING - DEDICATED for property test "Valid status transitions succeed"
    {
      id: 'e2e-order-022',
      orderNumber: generateOrderNumber(22),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PENDING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'STANDARD',
      subtotal: 99.99,
      tax: 8.25,
      shippingCost: 9.99,
      total: 118.23,
      orderDate: yesterday,
    },
    // Order 23: PENDING - DEDICATED for property test "Cancellation is available"
    {
      id: 'e2e-order-023',
      orderNumber: generateOrderNumber(23),
      userId: 'e2e-customer-001',
      customerEmail: 'testcustomer@test.zenithbioscience.com',
      customerName: 'Test Customer',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
        },
      ],
      shippingAddress,
      billingAddress,
      status: 'PENDING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ZELLE',
      shippingMethod: 'EXPRESS',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 14.99,
      total: 155.71,
      orderDate: yesterday,
    },
    // ============ ORDERS FOR accountOrders USER (order-history.spec.ts) ============
    // Order 24: PENDING - for order history tests
    {
      id: 'e2e-order-024',
      orderNumber: generateOrderNumber(24),
      userId: 'e2e-account-orders-001',
      customerEmail: 'account-orders@test.zenithbioscience.com',
      customerName: 'Account Orders',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 2,
          unitPrice: 99.99,
          totalPrice: 199.98,
        },
      ],
      shippingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      billingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      status: 'PENDING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'STANDARD',
      subtotal: 199.98,
      tax: 16.50,
      shippingCost: 9.99,
      total: 226.47,
      orderDate: yesterday,
    },
    // Order 25: CONFIRMED - for order history tests
    {
      id: 'e2e-order-025',
      orderNumber: generateOrderNumber(25),
      userId: 'e2e-account-orders-001',
      customerEmail: 'account-orders@test.zenithbioscience.com',
      customerName: 'Account Orders',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
        },
      ],
      shippingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      billingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'SOLANA_PAY',
      shippingMethod: 'EXPRESS',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 14.99,
      total: 155.71,
      orderDate: twoDaysAgo,
    },
    // Order 26: SHIPPED - for order history tests
    {
      id: 'e2e-order-026',
      orderNumber: generateOrderNumber(26),
      userId: 'e2e-account-orders-001',
      customerEmail: 'account-orders@test.zenithbioscience.com',
      customerName: 'Account Orders',
      items: [
        {
          productId: 'e2e-prod-003',
          productName: 'Test BAC Water',
          productSku: 'E2E-BAC-003',
          quantity: 3,
          unitPrice: 19.99,
          totalPrice: 59.97,
        },
      ],
      shippingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      billingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      status: 'SHIPPED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'STANDARD',
      subtotal: 59.97,
      tax: 4.95,
      shippingCost: 9.99,
      total: 74.91,
      orderDate: threeDaysAgo,
      trackingNumber: 'E2E123456789',
    },
    // Order 27: DELIVERED - for order history tests
    {
      id: 'e2e-order-027',
      orderNumber: generateOrderNumber(27),
      userId: 'e2e-account-orders-001',
      customerEmail: 'account-orders@test.zenithbioscience.com',
      customerName: 'Account Orders',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99,
        },
      ],
      shippingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      billingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      status: 'DELIVERED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'SOLANA_PAY',
      shippingMethod: 'EXPRESS',
      subtotal: 99.99,
      tax: 8.25,
      shippingCost: 14.99,
      total: 123.23,
      orderDate: oneWeekAgo,
      trackingNumber: 'E2E987654321',
    },
    // Order 28: COMPLETED - for order history tests (completed/fulfilled order)
    {
      id: 'e2e-order-028',
      orderNumber: generateOrderNumber(28),
      userId: 'e2e-account-orders-001',
      customerEmail: 'account-orders@test.zenithbioscience.com',
      customerName: 'Account Orders',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 2,
          unitPrice: 129.99,
          totalPrice: 259.98,
        },
      ],
      shippingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      billingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      status: 'DELIVERED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ACH',
      shippingMethod: 'STANDARD',
      subtotal: 259.98,
      tax: 21.45,
      shippingCost: 9.99,
      total: 291.42,
      orderDate: oneWeekAgo,
      trackingNumber: 'E2ECOMPLETE001',
    },
    // Order 29: PROCESSING - for order history tests (active order in processing)
    {
      id: 'e2e-order-029',
      orderNumber: generateOrderNumber(29),
      userId: 'e2e-account-orders-001',
      customerEmail: 'account-orders@test.zenithbioscience.com',
      customerName: 'Account Orders',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 3,
          unitPrice: 99.99,
          totalPrice: 299.97,
          batchNumber: 'BATCH-E2E-029',
        },
      ],
      shippingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      billingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      status: 'PROCESSING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ZELLE',
      shippingMethod: 'EXPRESS',
      subtotal: 299.97,
      tax: 24.75,
      shippingCost: 14.99,
      total: 339.71,
      orderDate: twoDaysAgo,
    },
    // Order 30: CANCELLED - for order history tests (cancelled order)
    {
      id: 'e2e-order-030',
      orderNumber: generateOrderNumber(30),
      userId: 'e2e-account-orders-001',
      customerEmail: 'account-orders@test.zenithbioscience.com',
      customerName: 'Account Orders',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
        },
      ],
      shippingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      billingAddress: {
        firstName: 'Account',
        lastName: 'Orders',
        addressLine1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'US',
        phoneNumber: '+13031234567',
      },
      status: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'STANDARD',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 9.99,
      total: 150.71,
      orderDate: fiveDaysAgo,
      notes: 'Customer requested cancellation',
    },
    // ============ ORDERS FOR accountCoa USER (coa-submission.spec.ts) ============
    // Order 31: DELIVERED - for COA submission tests
    {
      id: 'e2e-order-031',
      orderNumber: generateOrderNumber(31),
      userId: 'e2e-account-coa-001',
      customerEmail: 'account-coa@test.zenithbioscience.com',
      customerName: 'Account Coa',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 2,
          unitPrice: 99.99,
          totalPrice: 199.98,
          batchNumber: 'BATCH-E2E-031',
        },
      ],
      shippingAddress: {
        firstName: 'Account',
        lastName: 'Coa',
        addressLine1: '456 Research Blvd',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US',
        phoneNumber: '+16171234567',
      },
      billingAddress: {
        firstName: 'Account',
        lastName: 'Coa',
        addressLine1: '456 Research Blvd',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US',
        phoneNumber: '+16171234567',
      },
      status: 'DELIVERED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'BITCOIN',
      shippingMethod: 'EXPRESS',
      subtotal: 199.98,
      tax: 16.50,
      shippingCost: 14.99,
      total: 231.47,
      orderDate: oneWeekAgo,
      trackingNumber: 'E2ECOA001TRACK',
    },
    // Order 32: DELIVERED - for COA submission tests
    {
      id: 'e2e-order-032',
      orderNumber: generateOrderNumber(32),
      userId: 'e2e-account-coa-001',
      customerEmail: 'account-coa@test.zenithbioscience.com',
      customerName: 'Account Coa',
      items: [
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
          batchNumber: 'BATCH-E2E-032',
        },
      ],
      shippingAddress: {
        firstName: 'Account',
        lastName: 'Coa',
        addressLine1: '456 Research Blvd',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US',
        phoneNumber: '+16171234567',
      },
      billingAddress: {
        firstName: 'Account',
        lastName: 'Coa',
        addressLine1: '456 Research Blvd',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US',
        phoneNumber: '+16171234567',
      },
      status: 'DELIVERED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'ZELLE',
      shippingMethod: 'STANDARD',
      subtotal: 129.99,
      tax: 10.73,
      shippingCost: 9.99,
      total: 150.71,
      orderDate: oneWeekAgo,
      trackingNumber: 'E2ECOA002TRACK',
    },
    // Order 33: COMPLETED - for COA submission tests
    {
      id: 'e2e-order-033',
      orderNumber: generateOrderNumber(33),
      userId: 'e2e-account-coa-001',
      customerEmail: 'account-coa@test.zenithbioscience.com',
      customerName: 'Account Coa',
      items: [
        {
          productId: 'e2e-prod-001',
          productName: 'Test Peptide Alpha',
          productSku: 'E2E-PEPTIDE-001',
          productDose: '5mg',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99,
          batchNumber: 'BATCH-E2E-033',
        },
        {
          productId: 'e2e-prod-002',
          productName: 'Test Blend Beta',
          productSku: 'E2E-BLEND-002',
          productDose: '10mg',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
          batchNumber: 'BATCH-E2E-033B',
        },
      ],
      shippingAddress: {
        firstName: 'Account',
        lastName: 'Coa',
        addressLine1: '456 Research Blvd',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US',
        phoneNumber: '+16171234567',
      },
      billingAddress: {
        firstName: 'Account',
        lastName: 'Coa',
        addressLine1: '456 Research Blvd',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US',
        phoneNumber: '+16171234567',
      },
      status: 'DELIVERED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'CASHAPP',
      shippingMethod: 'OVERNIGHT',
      subtotal: 229.98,
      tax: 18.97,
      shippingCost: 24.99,
      total: 273.94,
      orderDate: oneWeekAgo,
      trackingNumber: 'E2ECOA003TRACK',
    },
  ];
}

/**
 * Create test Bitcoin payments for E2E testing
 * These payments are used for admin dashboard Bitcoin payment management tests
 * 
 * PAYMENT ASSIGNMENTS:
 * - Payment 1: COMPLETED - testnet, fully paid, 6 confirmations
 * - Payment 2: PROCESSING - testnet, partially confirmed, 3 confirmations
 * - Payment 3: PENDING - testnet, awaiting payment
 * - Payment 4: TIMEOUT - testnet, expired invoice
 * - Payment 5: COMPLETED - mainnet, fully paid, 6 confirmations
 * - Payment 6: COMPLETED - testnet, UNDERPAID flag
 * - Payment 7: COMPLETED - testnet, OVERPAID flag
 * - Payment 8: PROCESSING - mainnet, 2 confirmations
 */
function createTestBitcoinPayments(): TestBitcoinPayment[] {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  return [
    // Payment 1: COMPLETED - testnet, fully paid, 6 confirmations
    {
      id: 'e2e-btc-payment-001',
      orderId: 'e2e-order-btc-001',
      userId: 'e2e-customer-001',
      amount: 199.98,
      status: 'COMPLETED',
      blockchainNetwork: 'bitcoin-testnet',
      tokenSymbol: 'BTC',
      recipientWalletAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      senderWalletAddress: 'tb1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
      derivationIndex: 0,
      expectedSats: 500000, // 0.005 BTC
      receivedSats: 500000,
      confirmedSats: 500000,
      lockedBtcUsdRate: 40000.00,
      txids: ['abc123def456789012345678901234567890123456789012345678901234abcd'],
      confirmationCount: 6,
      underpaid: false,
      overpaid: false,
      expiresAt: oneHourFromNow,
      paymentDate: twoDaysAgo,
      complianceStatus: 'VERIFIED',
      complianceNotes: 'Verified by automated compliance check',
      complianceVerifiedAt: yesterday,
    },
    // Payment 2: PROCESSING - testnet, partially confirmed, 3 confirmations
    {
      id: 'e2e-btc-payment-002',
      orderId: 'e2e-order-btc-002',
      userId: 'e2e-customer-001',
      amount: 129.99,
      status: 'PROCESSING',
      blockchainNetwork: 'bitcoin-testnet',
      tokenSymbol: 'BTC',
      recipientWalletAddress: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0g',
      senderWalletAddress: 'tb1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs6',
      derivationIndex: 1,
      expectedSats: 325000, // ~0.00325 BTC
      receivedSats: 325000,
      confirmedSats: 325000,
      lockedBtcUsdRate: 40000.00,
      txids: ['def456abc789012345678901234567890123456789012345678901234567efgh'],
      confirmationCount: 3,
      underpaid: false,
      overpaid: false,
      expiresAt: oneHourFromNow,
      paymentDate: yesterday,
      complianceStatus: 'PENDING',
    },
    // Payment 3: PENDING - testnet, awaiting payment
    {
      id: 'e2e-btc-payment-003',
      orderId: 'e2e-order-btc-003',
      userId: 'e2e-customer-001',
      amount: 99.99,
      status: 'PENDING',
      blockchainNetwork: 'bitcoin-testnet',
      tokenSymbol: 'BTC',
      recipientWalletAddress: 'tb1qqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxec',
      derivationIndex: 2,
      expectedSats: 250000, // ~0.0025 BTC
      receivedSats: 0,
      confirmedSats: 0,
      lockedBtcUsdRate: 40000.00,
      txids: [],
      confirmationCount: 0,
      underpaid: false,
      overpaid: false,
      expiresAt: oneHourFromNow,
      paymentDate: now,
      complianceStatus: 'PENDING',
    },
    // Payment 4: TIMEOUT - testnet, expired invoice
    {
      id: 'e2e-btc-payment-004',
      orderId: 'e2e-order-btc-004',
      userId: 'e2e-customer-001',
      amount: 59.99,
      status: 'TIMEOUT',
      blockchainNetwork: 'bitcoin-testnet',
      tokenSymbol: 'BTC',
      recipientWalletAddress: 'tb1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs7',
      derivationIndex: 3,
      expectedSats: 150000, // ~0.0015 BTC
      receivedSats: 0,
      confirmedSats: 0,
      lockedBtcUsdRate: 40000.00,
      txids: [],
      confirmationCount: 0,
      underpaid: false,
      overpaid: false,
      expiresAt: oneHourAgo, // Expired
      paymentDate: threeDaysAgo,
      complianceStatus: 'PENDING',
    },
    // Payment 5: COMPLETED - mainnet, fully paid, 6 confirmations
    {
      id: 'e2e-btc-payment-005',
      orderId: 'e2e-order-btc-005',
      userId: 'e2e-customer-001',
      amount: 299.99,
      status: 'COMPLETED',
      blockchainNetwork: 'bitcoin-mainnet',
      tokenSymbol: 'BTC',
      recipientWalletAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
      senderWalletAddress: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
      derivationIndex: 4,
      expectedSats: 750000, // 0.0075 BTC
      receivedSats: 750000,
      confirmedSats: 750000,
      lockedBtcUsdRate: 40000.00,
      txids: ['mainnet123456789012345678901234567890123456789012345678901234ijkl'],
      confirmationCount: 6,
      underpaid: false,
      overpaid: false,
      expiresAt: oneHourFromNow,
      paymentDate: oneWeekAgo,
      complianceStatus: 'VERIFIED',
      complianceNotes: 'Mainnet payment verified',
      complianceVerifiedAt: threeDaysAgo,
    },
    // Payment 6: COMPLETED - testnet, UNDERPAID flag
    {
      id: 'e2e-btc-payment-006',
      orderId: 'e2e-order-btc-006',
      userId: 'e2e-customer-001',
      amount: 149.99,
      status: 'COMPLETED',
      blockchainNetwork: 'bitcoin-testnet',
      tokenSymbol: 'BTC',
      recipientWalletAddress: 'tb1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h',
      senderWalletAddress: 'tb1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs8',
      derivationIndex: 5,
      expectedSats: 375000, // ~0.00375 BTC expected
      receivedSats: 350000, // Only received 0.0035 BTC - UNDERPAID
      confirmedSats: 350000,
      lockedBtcUsdRate: 40000.00,
      txids: ['underpaid123456789012345678901234567890123456789012345678mnop'],
      confirmationCount: 6,
      underpaid: true, // UNDERPAID FLAG
      overpaid: false,
      expiresAt: oneHourFromNow,
      paymentDate: twoDaysAgo,
      complianceStatus: 'FAILED',
      complianceNotes: 'Underpaid by 25,000 sats - requires support escalation',
    },
    // Payment 7: COMPLETED - testnet, OVERPAID flag
    {
      id: 'e2e-btc-payment-007',
      orderId: 'e2e-order-btc-007',
      userId: 'e2e-customer-001',
      amount: 79.99,
      status: 'COMPLETED',
      blockchainNetwork: 'bitcoin-testnet',
      tokenSymbol: 'BTC',
      recipientWalletAddress: 'tb1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu',
      senderWalletAddress: 'tb1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs9',
      derivationIndex: 6,
      expectedSats: 200000, // ~0.002 BTC expected
      receivedSats: 250000, // Received 0.0025 BTC - OVERPAID
      confirmedSats: 250000,
      lockedBtcUsdRate: 40000.00,
      txids: ['overpaid123456789012345678901234567890123456789012345678qrst'],
      confirmationCount: 6,
      underpaid: false,
      overpaid: true, // OVERPAID FLAG
      expiresAt: oneHourFromNow,
      paymentDate: yesterday,
      complianceStatus: 'VERIFIED',
      complianceNotes: 'Overpaid by 50,000 sats - refund may be required',
      complianceVerifiedAt: now,
    },
    // Payment 8: PROCESSING - mainnet, 2 confirmations
    {
      id: 'e2e-btc-payment-008',
      orderId: 'e2e-order-btc-008',
      userId: 'e2e-customer-001',
      amount: 199.99,
      status: 'PROCESSING',
      blockchainNetwork: 'bitcoin-mainnet',
      tokenSymbol: 'BTC',
      recipientWalletAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      senderWalletAddress: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs0',
      derivationIndex: 7,
      expectedSats: 500000, // 0.005 BTC
      receivedSats: 500000,
      confirmedSats: 500000,
      lockedBtcUsdRate: 40000.00,
      txids: ['mainnetproc123456789012345678901234567890123456789012345uvwx'],
      confirmationCount: 2,
      underpaid: false,
      overpaid: false,
      expiresAt: oneHourFromNow,
      paymentDate: now,
      complianceStatus: 'PENDING',
    },
  ];
}

/**
 * Default test fixtures for standard E2E test scenarios
 */
export const defaultFixtures: E2ETestFixtures = {
  users: {
    customer: {
      id: 'e2e-customer-001',
      email: 'testcustomer@test.zenithbioscience.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Customer',
      authorities: ['ROLE_USER'],
      activated: true,
    },
    admin: {
      id: 'e2e-admin-001',
      email: 'testadmin@test.zenithbioscience.com',
      password: 'TestAdminPassword123!',
      firstName: 'Test',
      lastName: 'Admin',
      authorities: ['ROLE_USER', 'ROLE_ADMIN'],
      activated: true,
    },
    unverified: {
      id: 'e2e-unverified-001',
      email: 'testunverified@test.zenithbioscience.com',
      password: 'TestUnverifiedPassword123!',
      firstName: 'Test',
      lastName: 'Unverified',
      authorities: ['ROLE_USER'],
      activated: false,
    },
    // User pending activation - has a known activation key for testing
    pendingActivation: {
      id: 'e2e-pending-activation-001',
      email: 'testpendingactivation@test.zenithbioscience.com',
      password: 'TestPassword123!', // Must match BCRYPT_TEST_PASSWORD_HASH in DataSeeder
      firstName: 'Test',
      lastName: 'PendingActivation',
      authorities: ['ROLE_USER'],
      activated: false,
      activationKey: 'e2e-valid-activation-key-12345',
    },
    // User with valid reset key for password reset testing
    pendingReset: {
      id: 'e2e-pending-reset-001',
      email: 'testpendingreset@test.zenithbioscience.com',
      password: 'TestPassword123!', // Must match BCRYPT_TEST_PASSWORD_HASH in DataSeeder
      firstName: 'Test',
      lastName: 'PendingReset',
      authorities: ['ROLE_USER'],
      activated: true,
      resetKey: 'e2e-valid-reset-key-12345',
      resetDate: new Date(), // Reset requested NOW (valid for 24 hours from now)
    },
    // User with expired reset key for expired token testing
    expiredReset: {
      id: 'e2e-expired-reset-001',
      email: 'testexpiredreset@test.zenithbioscience.com',
      password: 'TestPassword123!', // Must match BCRYPT_TEST_PASSWORD_HASH in DataSeeder
      firstName: 'Test',
      lastName: 'ExpiredReset',
      authorities: ['ROLE_USER'],
      activated: true,
      resetKey: 'e2e-expired-reset-key-12345',
      resetDate: new Date(Date.now() - 25 * 60 * 60 * 1000), // Expired 25 hours ago (past 24h window)
    },
    // Second user pending activation - for login-after-activation test
    pendingActivation2: {
      id: 'e2e-pending-activation-002',
      email: 'testpendingactivation2@test.zenithbioscience.com',
      password: 'TestPassword123!', // Must match BCRYPT_TEST_PASSWORD_HASH in DataSeeder
      firstName: 'Test',
      lastName: 'PendingActivation2',
      authorities: ['ROLE_USER'],
      activated: false,
      activationKey: 'e2e-valid-activation-key-67890',
    },
    // Second user with valid reset key - for login-after-reset test
    pendingReset2: {
      id: 'e2e-pending-reset-002',
      email: 'testpendingreset2@test.zenithbioscience.com',
      password: 'TestPassword123!', // Must match BCRYPT_TEST_PASSWORD_HASH in DataSeeder
      firstName: 'Test',
      lastName: 'PendingReset2',
      authorities: ['ROLE_USER'],
      activated: true,
      resetKey: 'e2e-valid-reset-key-67890',
      resetDate: new Date(), // Reset requested NOW (valid for 24 hours from now)
    },
    // Third user with valid reset key - for Firefox browser reset test
    pendingReset3: {
      id: 'e2e-pending-reset-003',
      email: 'testpendingreset3@test.zenithbioscience.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'PendingReset3',
      authorities: ['ROLE_USER'],
      activated: true,
      resetKey: 'e2e-valid-reset-key-firefox-1',
      resetDate: new Date(),
    },
    // Fourth user with valid reset key - for Firefox browser login-after-reset test
    pendingReset4: {
      id: 'e2e-pending-reset-004',
      email: 'testpendingreset4@test.zenithbioscience.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'PendingReset4',
      authorities: ['ROLE_USER'],
      activated: true,
      resetKey: 'e2e-valid-reset-key-firefox-2',
      resetDate: new Date(),
    },
    // Fifth user with valid reset key - for mobile-chrome browser reset test
    pendingReset5: {
      id: 'e2e-pending-reset-005',
      email: 'testpendingreset5@test.zenithbioscience.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'PendingReset5',
      authorities: ['ROLE_USER'],
      activated: true,
      resetKey: 'e2e-valid-reset-key-mobile-1',
      resetDate: new Date(),
    },
    // Sixth user with valid reset key - for mobile-chrome browser login-after-reset test
    pendingReset6: {
      id: 'e2e-pending-reset-006',
      email: 'testpendingreset6@test.zenithbioscience.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'PendingReset6',
      authorities: ['ROLE_USER'],
      activated: true,
      resetKey: 'e2e-valid-reset-key-mobile-2',
      resetDate: new Date(),
    },
    // Third user pending activation - for Firefox browser activation test
    pendingActivation3: {
      id: 'e2e-pending-activation-003',
      email: 'testpendingactivation3@test.zenithbioscience.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'PendingActivation3',
      authorities: ['ROLE_USER'],
      activated: false,
      activationKey: 'e2e-valid-activation-key-firefox-1',
    },
    // Fourth user pending activation - for Firefox browser login-after-activation test
    pendingActivation4: {
      id: 'e2e-pending-activation-004',
      email: 'testpendingactivation4@test.zenithbioscience.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'PendingActivation4',
      authorities: ['ROLE_USER'],
      activated: false,
      activationKey: 'e2e-valid-activation-key-firefox-2',
    },
    // Fifth user pending activation - for mobile-chrome browser activation test
    pendingActivation5: {
      id: 'e2e-pending-activation-005',
      email: 'testpendingactivation5@test.zenithbioscience.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'PendingActivation5',
      authorities: ['ROLE_USER'],
      activated: false,
      activationKey: 'e2e-valid-activation-key-mobile-1',
    },
    // Sixth user pending activation - for mobile-chrome browser login-after-activation test
    pendingActivation6: {
      id: 'e2e-pending-activation-006',
      email: 'testpendingactivation6@test.zenithbioscience.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'PendingActivation6',
      authorities: ['ROLE_USER'],
      activated: false,
      activationKey: 'e2e-valid-activation-key-mobile-2',
    },
  },
  products: [
    {
      id: 'e2e-prod-001',
      slug: 'test-peptide-alpha',
      sku: 'E2E-PEPTIDE-001',
      name: 'Test Peptide Alpha',
      description: 'A high-quality test peptide for E2E testing',
      category: 'PEPTIDE' as ProductCategory,
      onSale: false,
      isFeatured: true,
      inventory: 10000, // High inventory to support parallel test runs
      price: 99.99,
      dose: '5mg',
    },
    {
      id: 'e2e-prod-002',
      slug: 'test-blend-beta',
      sku: 'E2E-BLEND-002',
      name: 'Test Blend Beta',
      description: 'A premium test blend for E2E testing',
      category: 'BLEND' as ProductCategory,
      onSale: true,
      isFeatured: false,
      inventory: 5000, // High inventory to support parallel test runs
      price: 149.99,
      salePrice: 129.99,
      dose: '10mg',
    },
    {
      id: 'e2e-prod-003',
      slug: 'out-of-stock-bac-water',
      sku: 'E2E-BAC-003',
      name: 'Out of Stock BAC Water',
      description: 'Bacteriostatic water - currently out of stock',
      category: 'BAC_WATER' as ProductCategory,
      onSale: false,
      isFeatured: false,
      inventory: 0,
      price: 19.99,
    },
  ],
  coupons: {
    percentage: {
      code: 'E2ETEST10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    },
    fixed: {
      code: 'E2ESAVE20',
      discountType: 'FIXED',
      discountValue: 20,
      minOrderAmount: 50,
    },
    expired: {
      code: 'E2EEXPIRED',
      discountType: 'PERCENTAGE',
      discountValue: 50,
    },
  },
  orders: createTestOrders(),
  bitcoinPayments: createTestBitcoinPayments(),
  shippingAddresses: {
    valid: {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'testcustomer@test.zenithbioscience.com',
      address1: '417 Montgomery St',
      address2: 'Floor 5',
      city: 'San Francisco',
      state: 'CA',
      zip: '94104',
      country: 'United States',
      phoneNumber: '+14151234567',
    },
    invalid: {
      firstName: '',
      lastName: '',
      email: 'invalid-email',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: 'invalid',
      country: '',
      phoneNumber: '',
    },
  },
};

/**
 * Isolated test users - each test file that modifies user state gets its own user
 * to prevent race conditions when tests run in parallel.
 * 
 * Test files that only READ data (login, logout) can share the default customer user.
 * Test files that MODIFY data (cart, checkout, orders) need isolated users.
 */
export const isolatedTestUsers = {
  // ============ CHECKOUT TESTS ============
  // For checkout-flow.spec.ts
  checkoutFlow: {
    id: 'e2e-checkout-flow-001',
    email: 'checkout-flow@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Checkout',
    lastName: 'Flow',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For address-validation.spec.ts
  addressValidation: {
    id: 'e2e-address-val-001',
    email: 'address-validation@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Address',
    lastName: 'Validation',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For checkout-summary.property.spec.ts
  checkoutSummary: {
    id: 'e2e-checkout-summary-001',
    email: 'checkout-summary@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Checkout',
    lastName: 'Summary',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For order-creation.property.spec.ts
  orderCreation: {
    id: 'e2e-order-creation-001',
    email: 'order-creation@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Order',
    lastName: 'Creation',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For payment-processing.spec.ts
  paymentProcessing: {
    id: 'e2e-payment-proc-001',
    email: 'payment-processing@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Payment',
    lastName: 'Processing',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  
  // ============ CART TESTS ============
  // For cart-management.spec.ts (modifies cart state for logged-in user)
  cartManagement: {
    id: 'e2e-cart-mgmt-001',
    email: 'cart-management@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Cart',
    lastName: 'Management',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  
  // ============ AUTH TESTS ============
  // For login.spec.ts (read-only, but isolated for safety)
  authLogin: {
    id: 'e2e-auth-login-001',
    email: 'auth-login@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Auth',
    lastName: 'Login',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For logout.spec.ts (read-only, but isolated for safety)
  authLogout: {
    id: 'e2e-auth-logout-001',
    email: 'auth-logout@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Auth',
    lastName: 'Logout',
    authorities: ['ROLE_USER'],
    activated: true,
  },

  // ============ ACCOUNT TESTS ============
  // For dashboard.spec.ts
  accountDashboard: {
    id: 'e2e-account-dashboard-001',
    email: 'account-dashboard@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Account',
    lastName: 'Dashboard',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For profile.spec.ts
  accountProfile: {
    id: 'e2e-account-profile-001',
    email: 'account-profile@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Account',
    lastName: 'Profile',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For addresses.spec.ts
  accountAddresses: {
    id: 'e2e-account-addresses-001',
    email: 'account-addresses@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Account',
    lastName: 'Addresses',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For password-change.spec.ts
  accountPassword: {
    id: 'e2e-account-password-001',
    email: 'account-password@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Account',
    lastName: 'Password',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For password-change.spec.ts - successful change test (isolated to avoid breaking other tests)
  accountPasswordChange: {
    id: 'e2e-account-password-change-001',
    email: 'account-password-change@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Account',
    lastName: 'PasswordChange',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For order-history.spec.ts
  accountOrders: {
    id: 'e2e-account-orders-001',
    email: 'account-orders@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Account',
    lastName: 'Orders',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For coa-submission.spec.ts
  accountCoa: {
    id: 'e2e-account-coa-001',
    email: 'account-coa@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Account',
    lastName: 'Coa',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For credits.spec.ts
  accountCredits: {
    id: 'e2e-account-credits-001',
    email: 'account-credits@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Account',
    lastName: 'Credits',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For gdpr.spec.ts
  accountGdpr: {
    id: 'e2e-account-gdpr-001',
    email: 'account-gdpr@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Account',
    lastName: 'Gdpr',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  
  // ============ BITCOIN PAYMENT TESTS ============
  // For bitcoin-payment-selection.spec.ts
  bitcoinPaymentSelection: {
    id: 'e2e-bitcoin-selection-001',
    email: 'bitcoin-selection@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Bitcoin',
    lastName: 'Selection',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For bitcoin-qr-generation.spec.ts
  bitcoinQrGeneration: {
    id: 'e2e-bitcoin-qr-001',
    email: 'bitcoin-qr@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Bitcoin',
    lastName: 'QR',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For bitcoin-payment-status.spec.ts
  bitcoinPaymentStatus: {
    id: 'e2e-bitcoin-status-001',
    email: 'bitcoin-status@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Bitcoin',
    lastName: 'Status',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For bitcoin-error-handling.spec.ts
  bitcoinErrorHandling: {
    id: 'e2e-bitcoin-error-001',
    email: 'bitcoin-error@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Bitcoin',
    lastName: 'Error',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For bitcoin-accessibility.spec.ts
  bitcoinAccessibility: {
    id: 'e2e-bitcoin-a11y-001',
    email: 'bitcoin-a11y@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Bitcoin',
    lastName: 'Accessibility',
    authorities: ['ROLE_USER'],
    activated: true,
  },
  // For bitcoin-websocket.spec.ts
  bitcoinWebsocket: {
    id: 'e2e-bitcoin-ws-001',
    email: 'bitcoin-ws@test.zenithbioscience.com',
    password: 'TestPassword123!',
    firstName: 'Bitcoin',
    lastName: 'Websocket',
    authorities: ['ROLE_USER'],
    activated: true,
  },
};

// Backwards compatibility alias
export const checkoutUsers = isolatedTestUsers;

/**
 * Helper function to get a deep copy of default fixtures
 */
export function getDefaultFixtures(): E2ETestFixtures {
  return JSON.parse(JSON.stringify(defaultFixtures));
}

/**
 * Helper function to get a specific test user by role
 */
export function getTestUser(role: 'customer' | 'admin' | 'unverified') {
  return { ...defaultFixtures.users[role] };
}

/**
 * Helper function to get an isolated checkout user by test file
 * Use these users in checkout tests to avoid race conditions during parallel execution
 */
export function getCheckoutUser(testFile: 'checkoutFlow' | 'addressValidation' | 'checkoutSummary' | 'orderCreation' | 'paymentProcessing') {
  return { ...isolatedTestUsers[testFile] };
}

/**
 * Helper function to get an isolated Bitcoin test user by test file
 * Use these users in Bitcoin payment tests to avoid race conditions during parallel execution
 */
export function getBitcoinUser(testFile: 'bitcoinPaymentSelection' | 'bitcoinQrGeneration' | 'bitcoinPaymentStatus' | 'bitcoinErrorHandling' | 'bitcoinAccessibility' | 'bitcoinWebsocket') {
  return { ...isolatedTestUsers[testFile] };
}

/**
 * Helper function to get an isolated test user by test domain
 * Use these users in tests that modify user state to avoid race conditions
 */
export function getIsolatedUser(testDomain: keyof typeof isolatedTestUsers) {
  return { ...isolatedTestUsers[testDomain] };
}

/**
 * Helper function to get an isolated account test user by test file
 * Use these users in account tests to avoid race conditions during parallel execution
 */
export function getAccountUser(
  testFile:
    | 'accountDashboard'
    | 'accountProfile'
    | 'accountAddresses'
    | 'accountPassword'
    | 'accountOrders'
    | 'accountCoa'
    | 'accountCredits'
    | 'accountGdpr'
) {
  return { ...isolatedTestUsers[testFile] };
}

/**
 * Get all isolated users as an array (for seeding)
 */
export function getAllIsolatedUsers() {
  return Object.values(isolatedTestUsers);
}

/**
 * Get all checkout users as an array (for seeding) - backwards compatibility
 */
export function getAllCheckoutUsers() {
  return getAllIsolatedUsers();
}

/**
 * Helper function to get a specific test product by index
 */
export function getTestProduct(index: number) {
  if (index < 0 || index >= defaultFixtures.products.length) {
    throw new Error(`Product index ${index} out of range`);
  }
  return { ...defaultFixtures.products[index] };
}

/**
 * Helper function to get a specific test coupon by type
 */
export function getTestCoupon(type: 'percentage' | 'fixed' | 'expired') {
  return { ...defaultFixtures.coupons[type] };
}

/**
 * Helper function to get an in-stock product
 */
export function getInStockProduct() {
  const product = defaultFixtures.products.find((p) => p.inventory > 0);
  if (!product) {
    throw new Error('No in-stock product found in fixtures');
  }
  return { ...product };
}

/**
 * Helper function to get an out-of-stock product
 */
export function getOutOfStockProduct() {
  const product = defaultFixtures.products.find((p) => p.inventory === 0);
  if (!product) {
    throw new Error('No out-of-stock product found in fixtures');
  }
  return { ...product };
}

/**
 * Helper function to get a valid shipping address
 */
export function getValidShippingAddress(): TestShippingAddress {
  return { ...defaultFixtures.shippingAddresses!.valid };
}

/**
 * Helper function to get an invalid shipping address
 */
export function getInvalidShippingAddress(): TestShippingAddress {
  return { ...defaultFixtures.shippingAddresses!.invalid };
}

/**
 * Helper function to get the pending activation test user
 * Use this user for account activation testing
 */
export function getPendingActivationUser() {
  if (!defaultFixtures.users.pendingActivation) {
    throw new Error('Pending activation user not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingActivation };
}

/**
 * Helper function to get the second pending activation test user
 * Use this user for login-after-activation testing (separate from basic activation test)
 */
export function getPendingActivationUser2() {
  if (!defaultFixtures.users.pendingActivation2) {
    throw new Error('Pending activation user 2 not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingActivation2 };
}

/**
 * Helper function to get the pending reset test user
 * Use this user for password reset testing with a valid reset key
 */
export function getPendingResetUser() {
  if (!defaultFixtures.users.pendingReset) {
    throw new Error('Pending reset user not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingReset };
}

/**
 * Helper function to get the second pending reset test user
 * Use this user for login-after-reset testing (separate from basic reset test)
 */
export function getPendingResetUser2() {
  if (!defaultFixtures.users.pendingReset2) {
    throw new Error('Pending reset user 2 not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingReset2 };
}

/**
 * Helper function to get the expired reset test user
 * Use this user for testing expired password reset tokens
 */
export function getExpiredResetUser() {
  if (!defaultFixtures.users.expiredReset) {
    throw new Error('Expired reset user not found in fixtures');
  }
  return { ...defaultFixtures.users.expiredReset };
}

/**
 * Get the activation key for the pending activation user
 */
export function getValidActivationKey(): string {
  const user = getPendingActivationUser();
  if (!user.activationKey) {
    throw new Error('Activation key not set for pending activation user');
  }
  return user.activationKey;
}

/**
 * Get the activation key for the second pending activation user
 * Use this for login-after-activation testing
 */
export function getValidActivationKey2(): string {
  const user = getPendingActivationUser2();
  if (!user.activationKey) {
    throw new Error('Activation key not set for pending activation user 2');
  }
  return user.activationKey;
}

/**
 * Get the valid reset key for password reset testing
 */
export function getValidResetKey(): string {
  const user = getPendingResetUser();
  if (!user.resetKey) {
    throw new Error('Reset key not set for pending reset user');
  }
  return user.resetKey;
}

/**
 * Get the valid reset key for the second pending reset user
 * Use this for login-after-reset testing
 */
export function getValidResetKey2(): string {
  const user = getPendingResetUser2();
  if (!user.resetKey) {
    throw new Error('Reset key not set for pending reset user 2');
  }
  return user.resetKey;
}

/**
 * Get the pending reset user 3 (for Firefox browser)
 */
export function getPendingResetUser3() {
  if (!defaultFixtures.users.pendingReset3) {
    throw new Error('Pending reset user 3 not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingReset3 };
}

/**
 * Get the pending reset user 4 (for Firefox browser login-after-reset)
 */
export function getPendingResetUser4() {
  if (!defaultFixtures.users.pendingReset4) {
    throw new Error('Pending reset user 4 not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingReset4 };
}

/**
 * Get the pending reset user 5 (for mobile-chrome browser)
 */
export function getPendingResetUser5() {
  if (!defaultFixtures.users.pendingReset5) {
    throw new Error('Pending reset user 5 not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingReset5 };
}

/**
 * Get the pending reset user 6 (for mobile-chrome browser login-after-reset)
 */
export function getPendingResetUser6() {
  if (!defaultFixtures.users.pendingReset6) {
    throw new Error('Pending reset user 6 not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingReset6 };
}

/**
 * Get browser-specific reset key and user for the "successful reset" test
 * Each browser gets its own reset key to avoid conflicts in parallel execution
 * @param browserName - The browser name from Playwright (chromium, firefox, webkit, Mobile Chrome, etc.)
 */
export function getBrowserResetKeyAndUser(browserName: string): { resetKey: string; user: ReturnType<typeof getPendingResetUser> } {
  const normalizedBrowser = browserName.toLowerCase();
  
  if (normalizedBrowser.includes('firefox')) {
    return { resetKey: getPendingResetUser3().resetKey!, user: getPendingResetUser3() };
  } else if (normalizedBrowser.includes('mobile') || normalizedBrowser.includes('android') || normalizedBrowser.includes('pixel')) {
    return { resetKey: getPendingResetUser5().resetKey!, user: getPendingResetUser5() };
  } else {
    // Default to chromium/webkit
    return { resetKey: getPendingResetUser().resetKey!, user: getPendingResetUser() };
  }
}

/**
 * Get browser-specific reset key and user for the "login after reset" test
 * Each browser gets its own reset key to avoid conflicts in parallel execution
 * @param browserName - The browser name from Playwright (chromium, firefox, webkit, Mobile Chrome, etc.)
 */
export function getBrowserLoginAfterResetKeyAndUser(browserName: string): { resetKey: string; user: ReturnType<typeof getPendingResetUser> } {
  const normalizedBrowser = browserName.toLowerCase();
  
  if (normalizedBrowser.includes('firefox')) {
    return { resetKey: getPendingResetUser4().resetKey!, user: getPendingResetUser4() };
  } else if (normalizedBrowser.includes('mobile') || normalizedBrowser.includes('android') || normalizedBrowser.includes('pixel')) {
    return { resetKey: getPendingResetUser6().resetKey!, user: getPendingResetUser6() };
  } else {
    // Default to chromium/webkit
    return { resetKey: getPendingResetUser2().resetKey!, user: getPendingResetUser2() };
  }
}

/**
 * Get the expired reset key for expired token testing
 */
export function getExpiredResetKey(): string {
  const user = getExpiredResetUser();
  if (!user.resetKey) {
    throw new Error('Reset key not set for expired reset user');
  }
  return user.resetKey;
}

/**
 * Get the pending activation user 3 (for Firefox browser)
 */
export function getPendingActivationUser3() {
  if (!defaultFixtures.users.pendingActivation3) {
    throw new Error('Pending activation user 3 not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingActivation3 };
}

/**
 * Get the pending activation user 4 (for Firefox browser login-after-activation)
 */
export function getPendingActivationUser4() {
  if (!defaultFixtures.users.pendingActivation4) {
    throw new Error('Pending activation user 4 not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingActivation4 };
}

/**
 * Get the pending activation user 5 (for mobile-chrome browser)
 */
export function getPendingActivationUser5() {
  if (!defaultFixtures.users.pendingActivation5) {
    throw new Error('Pending activation user 5 not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingActivation5 };
}

/**
 * Get the pending activation user 6 (for mobile-chrome browser login-after-activation)
 */
export function getPendingActivationUser6() {
  if (!defaultFixtures.users.pendingActivation6) {
    throw new Error('Pending activation user 6 not found in fixtures');
  }
  return { ...defaultFixtures.users.pendingActivation6 };
}

/**
 * Get browser-specific activation key and user for the "successful activation" test
 * Each browser gets its own activation key to avoid conflicts in parallel execution
 * @param browserName - The browser name from Playwright (chromium, firefox, webkit, Mobile Chrome, etc.)
 */
export function getBrowserActivationKeyAndUser(browserName: string): { activationKey: string; user: ReturnType<typeof getPendingActivationUser> } {
  const normalizedBrowser = browserName.toLowerCase();
  
  // Debug logging to help diagnose browser detection issues
  console.log(`[getBrowserActivationKeyAndUser] browserName: "${browserName}", normalized: "${normalizedBrowser}"`);
  
  if (normalizedBrowser.includes('firefox')) {
    console.log(`[getBrowserActivationKeyAndUser] Using Firefox user: pendingActivation3`);
    return { activationKey: getPendingActivationUser3().activationKey!, user: getPendingActivationUser3() };
  } else if (normalizedBrowser.includes('mobile') || normalizedBrowser.includes('android') || normalizedBrowser.includes('pixel')) {
    console.log(`[getBrowserActivationKeyAndUser] Using Mobile user: pendingActivation5`);
    return { activationKey: getPendingActivationUser5().activationKey!, user: getPendingActivationUser5() };
  } else {
    // Default to chromium/webkit
    console.log(`[getBrowserActivationKeyAndUser] Using Chromium user: pendingActivation`);
    return { activationKey: getPendingActivationUser().activationKey!, user: getPendingActivationUser() };
  }
}

/**
 * Get browser-specific activation key and user for the "login after activation" test
 * Each browser gets its own activation key to avoid conflicts in parallel execution
 * @param browserName - The browser name from Playwright (chromium, firefox, webkit, Mobile Chrome, etc.)
 */
export function getBrowserLoginAfterActivationKeyAndUser(browserName: string): { activationKey: string; user: ReturnType<typeof getPendingActivationUser> } {
  const normalizedBrowser = browserName.toLowerCase();
  
  // Debug logging to help diagnose browser detection issues
  console.log(`[getBrowserLoginAfterActivationKeyAndUser] browserName: "${browserName}", normalized: "${normalizedBrowser}"`);
  
  if (normalizedBrowser.includes('firefox')) {
    console.log(`[getBrowserLoginAfterActivationKeyAndUser] Using Firefox user: pendingActivation4`);
    return { activationKey: getPendingActivationUser4().activationKey!, user: getPendingActivationUser4() };
  } else if (normalizedBrowser.includes('mobile') || normalizedBrowser.includes('android') || normalizedBrowser.includes('pixel')) {
    console.log(`[getBrowserLoginAfterActivationKeyAndUser] Using Mobile user: pendingActivation6`);
    return { activationKey: getPendingActivationUser6().activationKey!, user: getPendingActivationUser6() };
  } else {
    // Default to chromium/webkit
    console.log(`[getBrowserLoginAfterActivationKeyAndUser] Using Chromium user: pendingActivation2`);
    return { activationKey: getPendingActivationUser2().activationKey!, user: getPendingActivationUser2() };
  }
}

/**
 * Get orders for the accountOrders test user
 * These are orders 24-30 which are dedicated for order-history.spec.ts tests
 * @returns Array of TestOrder objects for the accountOrders user
 */
export function getAccountOrdersUserOrders(): TestOrder[] {
  const accountOrdersUserId = isolatedTestUsers.accountOrders.id;
  return defaultFixtures.orders.filter(order => order.userId === accountOrdersUserId);
}

/**
 * Seed order history data for the accountOrders test user
 * This function seeds orders 24-30 which are dedicated for order-history.spec.ts tests
 * 
 * Usage:
 * ```typescript
 * import { seedOrderHistoryData } from '../fixtures/defaultFixtures';
 * import { getDataSeeder } from '../fixtures/DataSeeder';
 * 
 * // In test setup or global setup
 * const seeder = getDataSeeder();
 * await seeder.connect();
 * await seedOrderHistoryData(seeder);
 * ```
 * 
 * @param seeder - DataSeeder instance (must be connected)
 * @throws Error if seeding fails
 */
export async function seedOrderHistoryData(seeder: { seedOrders: (orders: TestOrder[]) => Promise<void> }): Promise<void> {
  const accountOrdersOrders = getAccountOrdersUserOrders();
  
  if (accountOrdersOrders.length === 0) {
    console.warn('[seedOrderHistoryData] No orders found for accountOrders user');
    return;
  }
  
  console.log(`[seedOrderHistoryData] Seeding ${accountOrdersOrders.length} orders for accountOrders user...`);
  
  await seeder.seedOrders(accountOrdersOrders);
  
  console.log(`[seedOrderHistoryData] Successfully seeded ${accountOrdersOrders.length} orders for order history tests`);
  console.log('[seedOrderHistoryData] Order statuses:', accountOrdersOrders.map(o => `${o.orderNumber}: ${o.status}`).join(', '));
}
