/**
 * E2E Test Fixture Types
 *
 * Type definitions for test data used in E2E integration tests.
 * These interfaces define the structure of test users, products, coupons, and orders.
 */

/**
 * Product category enum matching backend Category.java
 */
export type ProductCategory = 'PEPTIDE' | 'BLEND' | 'BAC_WATER';

/**
 * Represents a test user for E2E testing
 * Matches the User entity in the backend
 */
export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  /** Set of authority strings like "ROLE_USER", "ROLE_ADMIN" */
  authorities: string[];
  activated?: boolean;
  /** Activation key for unactivated users - used for account activation testing */
  activationKey?: string;
  /** Reset key for password reset testing */
  resetKey?: string;
  /** Reset key expiration date - if in the past, the key is expired */
  resetDate?: Date;
}

/**
 * Represents a test product for E2E testing
 * Matches the Product entity in the backend
 */
export interface TestProduct {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  onSale?: boolean;
  isFeatured?: boolean;
  inventory: number;
  price: number;
  salePrice?: number;
  dose?: string;
  images?: ProductImages;
}

/**
 * Product images structure matching backend ProductImages
 */
export interface ProductImages {
  originalUrl: string;
  variants: Record<string, ImageVariant>;
  metadata: ImageMetadata;
}

/**
 * Image variant structure matching backend ImageVariant
 */
export interface ImageVariant {
  url: string;
  width: number;
  height: number;
  fileSize: number;
  format: string;
}

/**
 * Image metadata structure matching backend ImageMetadata
 */
export interface ImageMetadata {
  originalFormat: string;
  originalSize: number;
  uploadedAt: Date;
  uploadedBy: string;
}

/**
 * Represents a test coupon for E2E testing
 */
export interface TestCoupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number;
}

/**
 * Represents an item in a test order
 * Matches backend OrderItem.java
 */
export interface TestOrderItem {
  productId: string;
  productName: string;
  productSku: string;
  productDose?: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  batchNumber?: string;
  reservationId?: string;
}

/**
 * Order status enumeration matching backend OrderStatus.java
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
 * Payment status enumeration matching backend PaymentStatus.java
 */
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'TIMEOUT';

/**
 * Shipping method enumeration matching backend ShippingMethod.java
 */
export type ShippingMethod = 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'PICKUP';

/**
 * Address for orders matching backend Address.java
 */
export interface TestOrderAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  companyName?: string;
}

/**
 * Represents a test order for E2E testing
 * Matches backend Order.java entity
 */
export interface TestOrder {
  id: string;
  orderNumber: string;
  userId: string;
  customerEmail: string;
  customerName: string;
  items: TestOrderItem[];
  shippingAddress: TestOrderAddress;
  billingAddress: TestOrderAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingMethod: ShippingMethod;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  orderDate: Date;
  couponCode?: string;
  discountAmount?: number;
  trackingNumber?: string;
  notes?: string;
}

/**
 * Represents a shipping address for checkout testing
 */
export interface TestShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phoneNumber: string;
}

/**
 * Bitcoin payment status enumeration matching backend PaymentStatus.java
 */
export type BitcoinPaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'TIMEOUT';

/**
 * Compliance status enumeration matching backend ComplianceStatus.java
 */
export type ComplianceStatus = 'PENDING' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';

/**
 * Represents a test Bitcoin payment for E2E testing
 * Matches backend CryptoPayment.java entity (for Bitcoin payments)
 */
export interface TestBitcoinPayment {
  id: string;
  orderId: string;
  userId: string;
  /** USD amount of the payment */
  amount: number;
  /** Payment status */
  status: BitcoinPaymentStatus;
  /** Blockchain network: bitcoin-mainnet or bitcoin-testnet */
  blockchainNetwork: 'bitcoin-mainnet' | 'bitcoin-testnet';
  /** Token symbol - always BTC for Bitcoin payments */
  tokenSymbol: 'BTC';
  /** Recipient Bitcoin address */
  recipientWalletAddress: string;
  /** Sender Bitcoin address (optional, may not be known) */
  senderWalletAddress?: string;
  /** BIP32 derivation index used to generate the address */
  derivationIndex: number;
  /** Expected payment amount in satoshis */
  expectedSats: number;
  /** Received amount in satoshis */
  receivedSats?: number;
  /** Confirmed amount in satoshis */
  confirmedSats?: number;
  /** Locked BTC/USD exchange rate at invoice creation */
  lockedBtcUsdRate: number;
  /** List of transaction IDs */
  txids?: string[];
  /** Number of confirmations */
  confirmationCount?: number;
  /** Flag indicating underpayment */
  underpaid?: boolean;
  /** Flag indicating overpayment */
  overpaid?: boolean;
  /** Invoice expiration timestamp */
  expiresAt?: Date;
  /** Payment date */
  paymentDate?: Date;
  /** Compliance status */
  complianceStatus?: ComplianceStatus;
  /** Compliance notes */
  complianceNotes?: string;
  /** Compliance verification timestamp */
  complianceVerifiedAt?: Date;
}

/**
 * Complete E2E test fixtures structure
 */
export interface E2ETestFixtures {
  users: {
    customer: TestUser;
    admin: TestUser;
    unverified: TestUser;
    /** User with activation key for activation testing */
    pendingActivation?: TestUser;
    /** Second user with activation key for login-after-activation testing */
    pendingActivation2?: TestUser;
    /** Third user with activation key for Firefox browser activation testing */
    pendingActivation3?: TestUser;
    /** Fourth user with activation key for Firefox browser login-after-activation testing */
    pendingActivation4?: TestUser;
    /** Fifth user with activation key for mobile-chrome browser activation testing */
    pendingActivation5?: TestUser;
    /** Sixth user with activation key for mobile-chrome browser login-after-activation testing */
    pendingActivation6?: TestUser;
    /** User with valid reset key for password reset testing */
    pendingReset?: TestUser;
    /** Second user with valid reset key for login-after-reset testing */
    pendingReset2?: TestUser;
    /** Third user with valid reset key for Firefox browser reset testing */
    pendingReset3?: TestUser;
    /** Fourth user with valid reset key for Firefox browser login-after-reset testing */
    pendingReset4?: TestUser;
    /** Fifth user with valid reset key for mobile-chrome browser reset testing */
    pendingReset5?: TestUser;
    /** Sixth user with valid reset key for mobile-chrome browser login-after-reset testing */
    pendingReset6?: TestUser;
    /** User with expired reset key for expired token testing */
    expiredReset?: TestUser;
  };
  products: TestProduct[];
  coupons: {
    percentage: TestCoupon;
    fixed: TestCoupon;
    expired: TestCoupon;
  };
  orders: TestOrder[];
  /** Bitcoin payments for admin dashboard testing */
  bitcoinPayments?: TestBitcoinPayment[];
  shippingAddresses?: {
    valid: TestShippingAddress;
    invalid: TestShippingAddress;
  };
}

