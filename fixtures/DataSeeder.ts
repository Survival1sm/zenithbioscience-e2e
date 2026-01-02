/**
 * E2E Test Data Seeder
 *
 * Provides MongoDB connection and data seeding utilities for E2E integration tests.
 * Handles test user, product, and coupon data management.
 *
 * Validates: Requirements 1.2, 9.4
 */

import { MongoClient, Db, Collection, Document, Decimal128 } from 'mongodb';
import {
  TestUser,
  TestProduct,
  TestCoupon,
  TestOrder,
  TestBitcoinPayment,
  E2ETestFixtures,
} from './types';

/**
 * MongoDB connection configuration
 */
interface DataSeederConfig {
  connectionUri: string;
  databaseName: string;
}

/**
 * Default configuration for E2E test database
 */
const DEFAULT_CONFIG: DataSeederConfig = {
  connectionUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  databaseName: process.env.MONGODB_DATABASE || 'zenith_e2e',
};

/**
 * Collection names used in the database (matching backend entity @Document annotations)
 */
const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'product',
  COUPONS: 'coupons',
  ORDERS: 'orders',
  INVENTORY_BATCHES: 'inventory_batches',
  PAYMENT_METHOD_CONFIGURATIONS: 'payment_method_configurations',
  PAYMENTS: 'payments',
} as const;

/**
 * Pre-computed Argon2id hash for test passwords
 * "TestPassword123!" hashed with Argon2id (OWASP recommended parameters)
 * Generated using AdvancedPasswordEncoder from the backend
 */
const ARGON2_TEST_PASSWORD_HASH = '$argon2id$v=19$m=4096,t=3,p=1$Fc7AoV1rusBGnW+Rpk8rkg$ywQyD5sJRRWvYBRkfmTCWwgiN0kxmlBIQhIEgymGTmk';

/**
 * DataSeeder class for managing E2E test data in MongoDB
 *
 * Provides methods to:
 * - Connect/disconnect from MongoDB
 * - Seed test users, products, and coupons
 * - Reset database or specific collections
 */
export class DataSeeder {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: DataSeederConfig;

  /**
   * Creates a new DataSeeder instance
   * @param config - Optional configuration override
   */
  constructor(config?: Partial<DataSeederConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Establishes connection to MongoDB
   * @throws Error if connection fails
   */
  async connect(): Promise<void> {
    if (this.client && this.db) {
      // Already connected
      return;
    }

    try {
      this.client = new MongoClient(this.config.connectionUri);
      await this.client.connect();
      this.db = this.client.db(this.config.databaseName);
      console.log(`[DataSeeder] Connected to MongoDB: ${this.config.databaseName}`);
    } catch (error) {
      this.client = null;
      this.db = null;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to connect to MongoDB: ${message}`);
    }
  }

  /**
   * Closes the MongoDB connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('[DataSeeder] Disconnected from MongoDB');
    }
  }

  /**
   * Checks if the seeder is connected to MongoDB
   * @returns true if connected, false otherwise
   */
  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }

  /**
   * Gets the database instance, ensuring connection is established
   * @throws Error if not connected
   */
  private getDb(): Db {
    if (!this.db) {
      throw new Error('[DataSeeder] Not connected to MongoDB. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Gets a collection by name
   * @param name - Collection name
   * @returns MongoDB collection
   */
  private getCollection(name: string): Collection<Document> {
    return this.getDb().collection(name);
  }

  /**
   * Seeds test users into the database
   * Matches the User entity schema from the backend
   * @param users - Array of test users to seed
   * @throws Error if seeding fails
   */
  async seedUsers(users: TestUser[]): Promise<void> {
    if (users.length === 0) {
      console.log('[DataSeeder] No users to seed');
      return;
    }

    try {
      const collection = this.getCollection(COLLECTIONS.USERS);
      const now = new Date();

      // Transform users to match backend User entity schema
      const usersToInsert: Document[] = users.map((user) => ({
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || null,
        email: user.email,
        password: ARGON2_TEST_PASSWORD_HASH, // Use pre-computed Argon2id hash
        activated: user.activated !== undefined ? user.activated : true,
        authorities: user.authorities, // Set of strings like "ROLE_USER", "ROLE_ADMIN"
        activationKey: user.activationKey || null,
        resetKey: user.resetKey || null,
        resetDate: user.resetDate || null,
        resetAttempts: null,
        emailSendFailed: null,
        oauth2Provider: null,
        oauth2Id: null,
        phoneNumber: null,
        timezone: 'America/Denver',
        terms_acceptance: null,
        // Audit fields from AbstractAuditingEntity
        createdBy: 'e2e-seeder',
        createdDate: now,
        lastModifiedBy: 'e2e-seeder',
        lastModifiedDate: now,
      }));

      await collection.insertMany(usersToInsert);
      console.log(`[DataSeeder] Seeded ${users.length} users`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to seed users: ${message}`);
    }
  }

  /**
   * Seeds special test users with activation/reset keys using upsert
   * These users need specific keys for testing account activation and password reset flows
   * Uses upsert to handle cases where users may already exist
   * @param users - Array of special test users to seed
   * @throws Error if seeding fails
   */
  async seedSpecialTestUsers(users: TestUser[]): Promise<void> {
    if (users.length === 0) {
      console.log('[DataSeeder] No special test users to seed');
      return;
    }

    try {
      const collection = this.getCollection(COLLECTIONS.USERS);
      const now = new Date();

      // Use bulkWrite with upsert to handle existing users
      const operations = users.map((user) => ({
        updateOne: {
          filter: { _id: user.id } as Document,
          update: {
            $set: {
              firstName: user.firstName,
              lastName: user.lastName || null,
              email: user.email,
              password: ARGON2_TEST_PASSWORD_HASH,
              activated: user.activated !== undefined ? user.activated : true,
              authorities: user.authorities,
              activationKey: user.activationKey || null,
              resetKey: user.resetKey || null,
              resetDate: user.resetDate || null,
              resetAttempts: null,
              emailSendFailed: null,
              oauth2Provider: null,
              oauth2Id: null,
              phoneNumber: null,
              timezone: 'America/Denver',
              terms_acceptance: null,
              lastModifiedBy: 'e2e-seeder',
              lastModifiedDate: now,
            },
            $setOnInsert: {
              createdBy: 'e2e-seeder',
              createdDate: now,
            },
          },
          upsert: true,
        },
      }));

      const result = await collection.bulkWrite(operations);
      console.log(`[DataSeeder] Seeded ${users.length} special test users (${result.upsertedCount} inserted, ${result.modifiedCount} updated)`);
      
      // Log details for debugging
      for (const user of users) {
        const keyInfo = user.activationKey 
          ? `activationKey=${user.activationKey}` 
          : user.resetKey 
            ? `resetKey=${user.resetKey}` 
            : 'no special keys';
        console.log(`[DataSeeder]   - ${user.email}: ${keyInfo}, activated=${user.activated}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to seed special test users: ${message}`);
    }
  }

  /**
   * Seeds test products into the database
   * Uses upsert to update existing products or insert new ones
   * Matches the Product entity schema from the backend
   * @param products - Array of test products to seed
   * @throws Error if seeding fails
   */
  async seedProducts(products: TestProduct[]): Promise<void> {
    if (products.length === 0) {
      console.log('[DataSeeder] No products to seed');
      return;
    }

    try {
      const collection = this.getCollection(COLLECTIONS.PRODUCTS);
      const now = new Date();

      // Use bulkWrite with upsert to update existing products or insert new ones
      const operations = products.map((product) => ({
        updateOne: {
          filter: { slug: product.slug },
          update: {
            $set: {
              slug: product.slug,
              sku: product.sku,
              name: product.name,
              description: product.description || `Test product: ${product.name}`,
              category: product.category, // PEPTIDE, BLEND, or BAC_WATER
              onSale: product.onSale || false,
              isFeatured: product.isFeatured || false,
              inventory: product.inventory,
              lowStockThreshold: 10,
              reorderPoint: 5,
              reorderQuantity: 50,
              price: product.price,
              salePrice: product.salePrice || null,
              dose: product.dose || null,
              coa_history: [],
              images: product.images || null,
              related_products: [],
              // Audit fields from AbstractAuditingEntity
              lastModifiedBy: 'e2e-seeder',
              lastModifiedDate: now,
              // Additional audit fields
              lastModifiedByIp: null,
              lastModifiedByUserAgent: null,
              lastModifiedReason: 'E2E test data seeding',
              // Compliance fields
              dataRetentionFlag: false,
              dataRetentionDate: null,
              complianceNotes: null,
            },
            $setOnInsert: {
              _id: product.id,
              createdBy: 'e2e-seeder',
              createdDate: now,
              createdByIp: null,
              createdByUserAgent: null,
            },
          },
          upsert: true,
        },
      }));

      const result = await collection.bulkWrite(operations);
      console.log(`[DataSeeder] Seeded ${products.length} products (${result.upsertedCount} inserted, ${result.modifiedCount} updated)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to seed products: ${message}`);
    }
  }

  /**
   * Seeds test coupons into the database
   * @param coupons - Array of test coupons to seed
   * @throws Error if seeding fails
   */
  async seedCoupons(coupons: TestCoupon[]): Promise<void> {
    if (coupons.length === 0) {
      console.log('[DataSeeder] No coupons to seed');
      return;
    }

    try {
      const collection = this.getCollection(COLLECTIONS.COUPONS);

      // Transform coupons with additional fields
      const couponsToInsert: Document[] = coupons.map((coupon, index) => {
        // Check if this is the expired coupon (code contains 'EXPIRED')
        const isExpiredCoupon = coupon.code.toUpperCase().includes('EXPIRED');
        
        return {
          _id: `coupon-${index + 1}`,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount || 0,
          active: !isExpiredCoupon, // Mark expired coupons as inactive
          usageLimit: 100,
          usageCount: 0,
          validFrom: new Date(),
          validUntil: isExpiredCoupon
            ? new Date(Date.now() - 86400000) // Yesterday for expired
            : new Date(Date.now() + 30 * 86400000), // 30 days from now
          createdDate: new Date(),
          lastModifiedDate: new Date(),
        };
      });

      await collection.insertMany(couponsToInsert);
      console.log(`[DataSeeder] Seeded ${coupons.length} coupons`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to seed coupons: ${message}`);
    }
  }

  /**
   * Seeds inventory batches for products
   * This is REQUIRED for products to have inventory - the backend calculates
   * inventory from batches, not from the product.inventory field
   * @param products - Array of test products to create batches for
   * @throws Error if seeding fails
   */
  async seedInventoryBatches(products: TestProduct[]): Promise<void> {
    if (products.length === 0) {
      console.log('[DataSeeder] No products to create batches for');
      return;
    }

    try {
      const batchCollection = this.getCollection(COLLECTIONS.INVENTORY_BATCHES);
      const productCollection = this.getCollection(COLLECTIONS.PRODUCTS);
      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD format

      // Get actual product IDs from database (since upsert may have different IDs)
      const productSlugs = products.filter(p => p.inventory > 0).map(p => p.slug);
      console.log(`[DataSeeder] Looking up products by slugs: ${productSlugs.join(', ')}`);
      
      const dbProducts = await productCollection.find({ slug: { $in: productSlugs } }).toArray();
      console.log(`[DataSeeder] Found ${dbProducts.length} products in database`);
      
      const slugToId = new Map<string, string>();
      for (const dbProduct of dbProducts) {
        const productId = String(dbProduct._id);
        const productSlug = dbProduct.slug as string;
        slugToId.set(productSlug, productId);
        console.log(`[DataSeeder]   - Product slug=${productSlug}, _id=${productId}`);
      }

      // Create batches for products that have inventory > 0
      const batchesToUpsert = products
        .filter((product) => product.inventory > 0 && slugToId.has(product.slug))
        .map((product, index) => {
          const actualProductId = slugToId.get(product.slug)!;
          return {
            _id: `e2e-batch-${actualProductId}`,
            batchNumber: `ZB${dateStr}${String(index + 1).padStart(4, '0')}`,
            productId: actualProductId, // Use actual DB product ID
            quantity: product.inventory,
            availableQuantity: product.inventory, // This is what the backend sums for inventory
            supplier: 'E2E Test Supplier',
            coaId: null,
            manufactureDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            purity: 99.5,
            receivedDate: now,
            active: true,
            sequence: index + 1,
            version: 0,
          };
        });

      if (batchesToUpsert.length > 0) {
        // Delete existing batches for these products first
        const batchIds = batchesToUpsert.map(b => b._id);
        await batchCollection.deleteMany({ _id: { $in: batchIds } } as Document);
        
        // Then insert fresh batches (cast to Document[] to satisfy TypeScript)
        await batchCollection.insertMany(batchesToUpsert as Document[]);
        console.log(`[DataSeeder] Seeded ${batchesToUpsert.length} inventory batches`);
        
        // Log batch details for debugging
        for (const batch of batchesToUpsert) {
          console.log(`[DataSeeder]   - Batch ${batch.batchNumber}: productId=${batch.productId}, qty=${batch.availableQuantity}`);
        }
      } else {
        console.log('[DataSeeder] No batches to seed (all products have 0 inventory or not found in DB)');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to seed inventory batches: ${message}`);
    }
  }

  /**
   * Seeds test orders into the database
   * Matches the Order entity schema from the backend
   * @param orders - Array of test orders to seed
   * @throws Error if seeding fails
   */
  async seedOrders(orders: TestOrder[]): Promise<void> {
    if (orders.length === 0) {
      console.log('[DataSeeder] No orders to seed');
      return;
    }

    try {
      const collection = this.getCollection(COLLECTIONS.ORDERS);
      const now = new Date();

      // Transform orders to match backend Order entity schema
      const ordersToInsert: Document[] = orders.map((order) => ({
        _id: order.id,
        _class: 'com.zenithbioscience.backend.domain.order.Order', // Required for Spring Data MongoDB
        version: 0,
        userId: order.userId,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        status: order.status,
        shipping_address: {
          userId: order.userId,
          addressType: 'SHIPPING',
          firstName: order.shippingAddress.firstName,
          lastName: order.shippingAddress.lastName,
          addressLine1: order.shippingAddress.addressLine1,
          addressLine2: order.shippingAddress.addressLine2 || null,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
          phoneNumber: order.shippingAddress.phoneNumber || null,
          companyName: order.shippingAddress.companyName || null,
        },
        billing_address: {
          userId: order.userId,
          addressType: 'BILLING',
          firstName: order.billingAddress.firstName,
          lastName: order.billingAddress.lastName,
          addressLine1: order.billingAddress.addressLine1,
          addressLine2: order.billingAddress.addressLine2 || null,
          city: order.billingAddress.city,
          state: order.billingAddress.state,
          postalCode: order.billingAddress.postalCode,
          country: order.billingAddress.country,
          phoneNumber: order.billingAddress.phoneNumber || null,
          companyName: order.billingAddress.companyName || null,
        },
        items: order.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          productDose: item.productDose || null,
          productImage: item.productImage || null,
          quantity: item.quantity,
          unitPrice: Decimal128.fromString(item.unitPrice.toFixed(2)),
          totalPrice: Decimal128.fromString(item.totalPrice.toFixed(2)),
          batchNumber: item.batchNumber || null,
          reservationId: item.reservationId || null,
        })),
        subtotal: Decimal128.fromString(order.subtotal.toFixed(2)),
        tax: Decimal128.fromString(order.tax.toFixed(2)),
        shippingCost: Decimal128.fromString(order.shippingCost.toFixed(2)),
        total: Decimal128.fromString(order.total.toFixed(2)),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingMethod: order.shippingMethod,
        trackingNumber: order.trackingNumber || null,
        trackingUrl: null,
        carrier: null,
        serviceLevel: null,
        shipmentId: null,
        easypostShipmentId: null,
        labelUrl: null,
        couponCode: order.couponCode || null,
        discountAmount: Decimal128.fromString((order.discountAmount || 0).toFixed(2)),
        cryptoDiscountAmount: Decimal128.fromString('0.00'),
        cryptoDiscountPercentage: Decimal128.fromString('0.00'),
        cryptoDiscountApplied: false,
        notes: order.notes || null,
        adminNotes: null,
        confirmationDate: order.status !== 'PENDING' && order.status !== 'AWAITING_PAYMENT' ? order.orderDate : null,
        shippedDate: order.status === 'SHIPPED' || order.status === 'DELIVERED' ? order.orderDate : null,
        deliveryDate: order.status === 'DELIVERED' ? order.orderDate : null,
        cancellationDate: order.status === 'CANCELLED' ? order.orderDate : null,
        refundDate: order.paymentStatus === 'REFUNDED' ? order.orderDate : null,
        estimatedDeliveryDate: null,
        payment_details: {},
        // Audit fields
        createdBy: 'e2e-seeder',
        createdDate: order.orderDate,
        lastModifiedBy: 'e2e-seeder',
        lastModifiedDate: now,
        createdByIp: null,
        createdByUserAgent: null,
        lastModifiedByIp: null,
        lastModifiedByUserAgent: null,
        lastModifiedReason: 'E2E test data seeding',
        // Compliance fields
        dataRetentionFlag: false,
        dataRetentionDate: null,
        complianceNotes: null,
      }));

      // Use bulkWrite with upsert to handle existing orders
      const bulkOps = ordersToInsert.map(order => ({
        updateOne: {
          filter: { _id: order._id },
          update: { $set: order },
          upsert: true
        }
      }));

      const result = await collection.bulkWrite(bulkOps);
      console.log(`[DataSeeder] Seeded ${orders.length} orders (${result.upsertedCount} inserted, ${result.modifiedCount} updated)`);
      
      // Log order details for debugging
      for (const order of orders) {
        console.log(`[DataSeeder]   - Order ${order.orderNumber}: status=${order.status}, total=$${order.total}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to seed orders: ${message}`);
    }
  }

  /**
   * Seeds Bitcoin payments into the database for admin dashboard testing
   * Matches the CryptoPayment entity schema from the backend
   * @param payments - Array of test Bitcoin payments to seed
   * @throws Error if seeding fails
   */
  async seedBitcoinPayments(payments: TestBitcoinPayment[]): Promise<void> {
    if (payments.length === 0) {
      console.log('[DataSeeder] No Bitcoin payments to seed');
      return;
    }

    try {
      const collection = this.getCollection(COLLECTIONS.PAYMENTS);
      const now = new Date();

      // Transform payments to match backend CryptoPayment entity schema
      const paymentsToInsert: Document[] = payments.map((payment) => ({
        _id: payment.id,
        _class: 'com.zenithbioscience.backend.domain.payment.CryptoPayment', // Required for Spring Data MongoDB polymorphism
        orderId: payment.orderId,
        userId: payment.userId,
        amount: Decimal128.fromString(payment.amount.toFixed(2)),
        refundedAmount: Decimal128.fromString('0.00'),
        status: payment.status,
        paymentType: 'BITCOIN', // PaymentMethodType enum value
        paymentDate: payment.paymentDate || now,
        transactionId: payment.txids && payment.txids.length > 0 ? payment.txids[0] : null,
        // CryptoPayment-specific fields
        transactionSignature: payment.txids && payment.txids.length > 0 ? payment.txids[0] : null,
        blockchainNetwork: payment.blockchainNetwork,
        tokenSymbol: payment.tokenSymbol,
        senderWalletAddress: payment.senderWalletAddress || null,
        recipientWalletAddress: payment.recipientWalletAddress,
        tokenMintAddress: null, // Not used for Bitcoin
        paymentReference: null,
        tokenAmount: null, // Bitcoin uses satoshis instead
        confirmationCount: payment.confirmationCount || 0,
        blockHash: null,
        blockTime: null,
        programId: null,
        transactionMetadata: null,
        transactionFee: null,
        gasPrice: null,
        gasLimit: null,
        // Compliance fields
        complianceStatus: payment.complianceStatus || 'PENDING',
        complianceVerifiedAt: payment.complianceVerifiedAt || null,
        complianceNotes: payment.complianceNotes || null,
        regulatoryData: null,
        // Bitcoin-specific fields
        derivationIndex: payment.derivationIndex,
        expectedSats: payment.expectedSats,
        receivedSats: payment.receivedSats || null,
        confirmedSats: payment.confirmedSats || null,
        lockedBtcUsdRate: Decimal128.fromString(payment.lockedBtcUsdRate.toFixed(2)),
        txids: payment.txids || [],
        underpaid: payment.underpaid || false,
        overpaid: payment.overpaid || false,
        expiresAt: payment.expiresAt || null,
        // Audit fields from AbstractAuditingEntity
        createdBy: 'e2e-seeder',
        createdDate: payment.paymentDate || now,
        lastModifiedBy: 'e2e-seeder',
        lastModifiedDate: now,
        // Sensitive data access audit
        sensitiveDataLastAccessed: null,
        sensitiveDataAccessedBy: null,
      }));

      // Use bulkWrite with upsert to handle existing payments
      const bulkOps = paymentsToInsert.map(payment => ({
        updateOne: {
          filter: { _id: payment._id },
          update: { $set: payment },
          upsert: true
        }
      }));

      const result = await collection.bulkWrite(bulkOps);
      console.log(`[DataSeeder] Seeded ${payments.length} Bitcoin payments (${result.upsertedCount} inserted, ${result.modifiedCount} updated)`);
      
      // Log payment details for debugging
      for (const payment of payments) {
        const flags = [];
        if (payment.underpaid) flags.push('UNDERPAID');
        if (payment.overpaid) flags.push('OVERPAID');
        const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
        console.log(`[DataSeeder]   - Payment ${payment.id}: status=${payment.status}, network=${payment.blockchainNetwork}, sats=${payment.expectedSats}${flagStr}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to seed Bitcoin payments: ${message}`);
    }
  }

  /**
   * Seeds payment method configurations into the database
   * This is REQUIRED for payment methods to be available during checkout
   * @throws Error if seeding fails
   */
  async seedPaymentMethodConfigurations(): Promise<void> {
    try {
      const collection = this.getCollection(COLLECTIONS.PAYMENT_METHOD_CONFIGURATIONS);
      const now = new Date();

      // Payment method configurations matching backend PaymentMethodConfiguration entity
      // IMPLEMENTED payment methods: CashApp, Solana Pay (enabled: true)
      // NOT IMPLEMENTED payment methods: Zelle, ACH (enabled: false)
      const configurations: Document[] = [
        {
          _id: 'config-cashapp',
          paymentMethodType: 'CASHAPP',
          enabled: true,
          displayName: 'CashApp',
          description: 'Pay with CashApp - fast and secure mobile payments',
          configuration: {
            cashAppBusinessId: 'e2e-test-business-id',
            cashAppApiKey: 'e2e-test-api-key',
            cashAppWebhookSecret: 'e2e-test-webhook-secret',
          },
          processingFees: { percentage: 0, fixed: 0 },
          minimumAmount: 1,
          maximumAmount: 50000,
          supportedCountries: ['US'],
          supportedCurrencies: ['USD'],
          metadata: { testMode: true },
          createdAt: now,
          updatedAt: now,
          createdBy: 'e2e-seeder',
          updatedBy: 'e2e-seeder',
        },
        {
          _id: 'config-solana-pay',
          paymentMethodType: 'SOLANA_PAY',
          enabled: true,
          displayName: 'Solana Pay',
          description: 'Pay with USDC on Solana - instant crypto payments with 10% discount',
          configuration: {
            solanaNetwork: 'devnet',
            solanaWalletAddress: 'E2ETestWalletAddress1234567890123456789012345',
            solanaTokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint
          },
          processingFees: { percentage: 0, fixed: 0 },
          minimumAmount: 1,
          maximumAmount: 50000,
          supportedCountries: [],
          supportedCurrencies: ['USD', 'USDC'],
          metadata: { testMode: true, cryptoDiscountPercentage: 10 },
          createdAt: now,
          updatedAt: now,
          createdBy: 'e2e-seeder',
          updatedBy: 'e2e-seeder',
        },
        // NOTE: Zelle is NOT IMPLEMENTED - disabled in backend config
        {
          _id: 'config-zelle',
          paymentMethodType: 'ZELLE',
          enabled: false, // NOT IMPLEMENTED
          displayName: 'Zelle',
          description: 'Pay with Zelle - direct bank transfer',
          configuration: {
            zelleBusinessEmail: 'e2e-test@zenithbioscience.com',
            zelleBusinessPhone: '+15551234567',
            zelleBusinessName: 'Zenith Bioscience E2E Test',
            zelleInstructionTemplate: 'Send payment to {email} with memo: Order #{orderId}',
          },
          processingFees: { percentage: 0, fixed: 0 },
          minimumAmount: 1,
          maximumAmount: 50000,
          supportedCountries: ['US'],
          supportedCurrencies: ['USD'],
          metadata: { testMode: true },
          createdAt: now,
          updatedAt: now,
          createdBy: 'e2e-seeder',
          updatedBy: 'e2e-seeder',
        },
        // NOTE: ACH is NOT IMPLEMENTED - disabled in backend config
        {
          _id: 'config-ach',
          paymentMethodType: 'ACH',
          enabled: false, // NOT IMPLEMENTED
          displayName: 'ACH Bank Transfer',
          description: 'Pay via ACH bank transfer - 3-5 business days processing',
          configuration: {
            achProcessorApiKey: 'e2e-test-ach-api-key',
            achProcessorEndpoint: 'https://api.test.ach-processor.com',
            achBusinessAccountNumber: '1234567890',
            achBusinessRoutingNumber: '021000021',
            achProcessorName: 'E2E Test ACH Processor',
          },
          processingFees: { percentage: 0, fixed: 0 },
          minimumAmount: 1,
          maximumAmount: 50000,
          supportedCountries: ['US'],
          supportedCurrencies: ['USD'],
          metadata: { testMode: true },
          createdAt: now,
          updatedAt: now,
          createdBy: 'e2e-seeder',
          updatedBy: 'e2e-seeder',
        },
        // Bitcoin payment method - enabled for E2E testing
        {
          _id: 'config-bitcoin',
          paymentMethodType: 'BITCOIN',
          enabled: true,
          displayName: 'Bitcoin',
          description: 'Pay with Bitcoin - secure cryptocurrency payments with 10% discount',
          configuration: {
            btcPayServerUrl: 'https://testnet.demo.btcpayserver.org',
            btcPayServerApiKey: 'e2e-test-btcpay-api-key',
            btcPayServerStoreId: 'e2e-test-store-id',
            btcPayServerWebhookSecret: 'e2e-test-webhook-secret',
            network: 'testnet',
            confirmationsRequired: 1,
            invoiceExpirationMinutes: 60,
          },
          processingFees: { percentage: 0, fixed: 0 },
          minimumAmount: 1,
          maximumAmount: 50000,
          supportedCountries: [],
          supportedCurrencies: ['USD', 'BTC'],
          metadata: { testMode: true, cryptoDiscountPercentage: 10 },
          createdAt: now,
          updatedAt: now,
          createdBy: 'e2e-seeder',
          updatedBy: 'e2e-seeder',
        },
      ];

      // Use bulkWrite with upsert to handle existing configurations
      const bulkOps = configurations.map(config => ({
        updateOne: {
          filter: { _id: config._id },
          update: { $set: config },
          upsert: true
        }
      }));

      const result = await collection.bulkWrite(bulkOps);
      console.log(`[DataSeeder] Seeded ${configurations.length} payment method configurations (${result.upsertedCount} inserted, ${result.modifiedCount} updated)`);
      
      // Log enabled payment methods
      const enabledMethods = configurations.filter(c => c.enabled).map(c => c.displayName);
      console.log(`[DataSeeder]   Enabled payment methods: ${enabledMethods.join(', ')}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to seed payment method configurations: ${message}`);
    }
  }

  /**
   * Seeds all test data from fixtures
   * @param fixtures - Complete E2E test fixtures
   * @throws Error if seeding fails
   */
  async seedAll(fixtures: E2ETestFixtures): Promise<void> {
    console.log('[DataSeeder] Starting full data seed...');

    try {
      // Extract users array from fixtures (including optional activation/reset test users)
      // Include all browser-specific activation and reset users for parallel test execution
      const users = [
        fixtures.users.customer,
        fixtures.users.admin,
        fixtures.users.unverified,
        // Activation users (chromium, firefox, mobile-chrome)
        ...(fixtures.users.pendingActivation ? [fixtures.users.pendingActivation] : []),
        ...(fixtures.users.pendingActivation2 ? [fixtures.users.pendingActivation2] : []),
        ...(fixtures.users.pendingActivation3 ? [fixtures.users.pendingActivation3] : []),
        ...(fixtures.users.pendingActivation4 ? [fixtures.users.pendingActivation4] : []),
        ...(fixtures.users.pendingActivation5 ? [fixtures.users.pendingActivation5] : []),
        ...(fixtures.users.pendingActivation6 ? [fixtures.users.pendingActivation6] : []),
        // Reset users (chromium, firefox, mobile-chrome)
        ...(fixtures.users.pendingReset ? [fixtures.users.pendingReset] : []),
        ...(fixtures.users.pendingReset2 ? [fixtures.users.pendingReset2] : []),
        ...(fixtures.users.pendingReset3 ? [fixtures.users.pendingReset3] : []),
        ...(fixtures.users.pendingReset4 ? [fixtures.users.pendingReset4] : []),
        ...(fixtures.users.pendingReset5 ? [fixtures.users.pendingReset5] : []),
        ...(fixtures.users.pendingReset6 ? [fixtures.users.pendingReset6] : []),
        ...(fixtures.users.expiredReset ? [fixtures.users.expiredReset] : []),
      ];

      // Extract coupons array from fixtures
      const coupons = [
        fixtures.coupons.percentage,
        fixtures.coupons.fixed,
        fixtures.coupons.expired,
      ];

      // Seed all data
      await this.seedUsers(users);
      await this.seedProducts(fixtures.products);
      await this.seedInventoryBatches(fixtures.products); // CRITICAL: Seed batches for inventory
      await this.seedCoupons(coupons);
      await this.seedOrders(fixtures.orders);
      await this.seedPaymentMethodConfigurations(); // CRITICAL: Seed payment methods for checkout

      console.log('[DataSeeder] Full data seed completed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to seed all data: ${message}`);
    }
  }

  /**
   * Resets test-related collections in the database
   * Preserves product collection (uses upsert for products)
   * Preserves mongockLock and mongockChangeLog collections (migration tracking)
   * @throws Error if reset fails
   */
  async resetDatabase(): Promise<void> {
    console.log('[DataSeeder] Resetting test data...');

    try {
      const db = this.getDb();
      const collections = await db.listCollections().toArray();

      // Collections to preserve (not drop)
      const preserveCollections = [
        'product',           // Products are updated via upsert
        'mongockLock',       // Mongock migration lock
        'mongockChangeLog',  // Mongock migration history
        'email_templates',   // Email templates from migrations
      ];

      // Collections to explicitly drop (including inventory_batches and payment configs for clean state)
      const collectionsToExplicitlyDrop = ['inventory_batches', 'payment_method_configurations', 'carts', 'user_preferences'];

      for (const collection of collections) {
        if (collectionsToExplicitlyDrop.includes(collection.name)) {
          await db.dropCollection(collection.name);
          console.log(`[DataSeeder] Dropped collection: ${collection.name}`);
        } else if (!preserveCollections.includes(collection.name)) {
          await db.dropCollection(collection.name);
          console.log(`[DataSeeder] Dropped collection: ${collection.name}`);
        } else {
          console.log(`[DataSeeder] Preserved collection: ${collection.name}`);
        }
      }

      console.log('[DataSeeder] Database reset completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to reset database: ${message}`);
    }
  }

  /**
   * Drops a specific collection
   * @param name - Name of the collection to drop
   * @throws Error if reset fails
   */
  async resetCollection(name: string): Promise<void> {
    console.log(`[DataSeeder] Resetting collection: ${name}`);

    try {
      const db = this.getDb();
      const collections = await db.listCollections({ name }).toArray();

      if (collections.length > 0) {
        await db.dropCollection(name);
        console.log(`[DataSeeder] Dropped collection: ${name}`);
      } else {
        console.log(`[DataSeeder] Collection ${name} does not exist, skipping`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to reset collection ${name}: ${message}`);
    }
  }

  /**
   * Activates users and sets their authorities
   * Used after registering users via API to activate them and set admin roles
   * @param users - Array of user configs with email and authorities
   */
  async activateAndSetupUsers(
    users: Array<{ email: string; authorities: string[] }>
  ): Promise<void> {
    try {
      const collection = this.getCollection(COLLECTIONS.USERS);

      for (const user of users) {
        const result = await collection.updateOne(
          { email: user.email },
          {
            $set: {
              activated: true,
              authorities: user.authorities,
              activationKey: null,
            },
          }
        );

        if (result.matchedCount > 0) {
          console.log(`[DataSeeder] Activated user: ${user.email} with roles: ${user.authorities.join(', ')}`);
        } else {
          console.warn(`[DataSeeder] User not found for activation: ${user.email}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to activate users: ${message}`);
    }
  }

  /**
   * Gets the actual database user ID for a given email
   * Used to map fixture user IDs to actual database IDs after API registration
   * @param email - User email to look up
   * @returns The actual database _id or null if not found
   */
  async getUserIdByEmail(email: string): Promise<string | null> {
    try {
      const collection = this.getCollection(COLLECTIONS.USERS);
      const user = await collection.findOne({ email });
      if (user) {
        return String(user._id);
      }
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[DataSeeder] Failed to get user ID for ${email}: ${message}`);
      return null;
    }
  }

  /**
   * Updates orders to use actual database user IDs instead of fixture IDs
   * This is necessary because users registered via API get new UUIDs,
   * not the IDs specified in fixtures
   * @param emailToFixtureId - Map of email to fixture user ID
   */
  async updateOrderUserIds(
    emailToFixtureId: Map<string, string>
  ): Promise<void> {
    try {
      const ordersCollection = this.getCollection(COLLECTIONS.ORDERS);
      const usersCollection = this.getCollection(COLLECTIONS.USERS);
      
      let updatedCount = 0;
      
      for (const [email, fixtureId] of emailToFixtureId) {
        // Get the actual database user ID
        const user = await usersCollection.findOne({ email });
        if (!user) {
          console.warn(`[DataSeeder] User not found for order update: ${email}`);
          continue;
        }
        
        const actualUserId = String(user._id);
        
        // Skip if the IDs are the same
        if (actualUserId === fixtureId) {
          console.log(`[DataSeeder] User ID unchanged for ${email}: ${actualUserId}`);
          continue;
        }
        
        // Update all orders with the fixture userId to use the actual userId
        const result = await ordersCollection.updateMany(
          { userId: fixtureId },
          { $set: { userId: actualUserId } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`[DataSeeder] Updated ${result.modifiedCount} orders for ${email}: ${fixtureId} -> ${actualUserId}`);
          updatedCount += result.modifiedCount;
        }
      }
      
      console.log(`[DataSeeder] Total orders updated with correct user IDs: ${updatedCount}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`[DataSeeder] Failed to update order user IDs: ${message}`);
    }
  }

  /**
   * Count orders by user ID
   * @param userId - The user ID to count orders for
   * @returns The number of orders for the user
   */
  async countOrdersByUserId(userId: string): Promise<number> {
    try {
      const collection = this.getCollection(COLLECTIONS.ORDERS);
      return await collection.countDocuments({ userId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[DataSeeder] Failed to count orders for user ${userId}: ${message}`);
      return 0;
    }
  }
}

/**
 * Singleton instance for convenience
 */
let defaultSeeder: DataSeeder | null = null;

/**
 * Gets the default DataSeeder instance
 * @returns DataSeeder singleton instance
 */
export function getDataSeeder(): DataSeeder {
  if (!defaultSeeder) {
    defaultSeeder = new DataSeeder();
  }
  return defaultSeeder;
}

/**
 * Creates a new DataSeeder instance with custom configuration
 * @param config - Custom configuration
 * @returns New DataSeeder instance
 */
export function createDataSeeder(config?: Partial<DataSeederConfig>): DataSeeder {
  return new DataSeeder(config);
}

// Export types for external use
export type { DataSeederConfig };
