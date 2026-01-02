import { FullConfig } from '@playwright/test';
import { DataSeeder } from './fixtures/DataSeeder';
import { defaultFixtures, getAllIsolatedUsers } from './fixtures/defaultFixtures';
import { TestUser } from './fixtures/types';

/**
 * Global setup for Playwright tests
 *
 * This function runs once before all tests.
 * - Resets the database to a clean state
 * - Creates test users via API and activates them
 * - Seeds products and coupons
 * - Clears backend cache to ensure fresh data
 *
 * Requirements covered:
 * - 1.2: Test data seeding
 * - 9.4: Database reset to known state
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  timezone: string;
  termsAccepted: boolean;
}

interface LoginResponse {
  token: string;
}

/**
 * Warmup the backend to avoid threat detection blocking first request
 * The ThreatDetectionFilter blocks the first request from a new source
 */
async function warmupBackend(): Promise<void> {
  try {
    // Make a simple health check request to warm up the connection
    await fetch(`${BACKEND_URL}/management/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000',
      },
    });
    console.log('[Setup] Backend warmup complete');
    // Small delay after warmup
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.warn('[Setup] Backend warmup failed (may be expected):', error);
  }
}

/**
 * Login as a user and get JWT token
 */
async function loginUser(email: string, password: string): Promise<string | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      body: JSON.stringify({ email, password, rememberMe: false }),
    });

    if (response.ok) {
      const data = await response.json() as LoginResponse;
      console.log(`[Setup] Logged in as: ${email}`);
      return data.token;
    } else {
      const errorText = await response.text();
      console.warn(`[Setup] Failed to login ${email}: ${response.status} - ${errorText}`);
      return null;
    }
  } catch (error) {
    console.warn(`[Setup] Error logging in ${email}:`, error);
    return null;
  }
}

/**
 * Clear backend application cache (requires admin token)
 * Clears both product and user caches
 */
async function clearBackendCache(adminToken: string, retryCount = 0): Promise<boolean> {
  try {
    // Clear product cache
    const productResponse = await fetch(`${BACKEND_URL}/api/admin/cache/app/products/clear`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Origin': 'http://localhost:3000',
      },
    });

    if (productResponse.ok) {
      console.log('[Setup] Backend product cache cleared');
    } else {
      const errorText = await productResponse.text();
      // Retry on threat detection
      if (productResponse.status === 403 && errorText.includes('threat') && retryCount < 3) {
        console.log('[Setup] Threat detection blocked cache clear, retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return clearBackendCache(adminToken, retryCount + 1);
      }
      console.warn(`[Setup] Failed to clear product cache: ${productResponse.status} - ${errorText}`);
    }

    // Clear user cache - CRITICAL for order history tests
    // Users are registered via API and get new UUIDs, but the cache may have stale data
    const userResponse = await fetch(`${BACKEND_URL}/api/admin/cache/app/users/clear`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Origin': 'http://localhost:3000',
      },
    });

    if (userResponse.ok) {
      console.log('[Setup] Backend user cache cleared');
    } else {
      const errorText = await userResponse.text();
      console.warn(`[Setup] Failed to clear user cache: ${userResponse.status} - ${errorText}`);
    }

    return productResponse.ok;
  } catch (error) {
    console.warn('[Setup] Error clearing cache:', error);
    return false;
  }
}

/**
 * Refresh payment configuration cache (requires admin token)
 * This is CRITICAL after seeding payment method configurations
 */
async function refreshPaymentConfigCache(adminToken: string, retryCount = 0): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/payment-configuration/refresh`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Origin': 'http://localhost:3000',
      },
    });

    if (response.ok) {
      console.log('[Setup] Payment configuration cache refreshed');
      return true;
    } else {
      const errorText = await response.text();
      // Retry on threat detection
      if (response.status === 403 && errorText.includes('threat') && retryCount < 3) {
        console.log('[Setup] Threat detection blocked payment config refresh, retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return refreshPaymentConfigCache(adminToken, retryCount + 1);
      }
      console.warn(`[Setup] Failed to refresh payment config cache: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.warn('[Setup] Error refreshing payment config cache:', error);
    return false;
  }
}

/**
 * Register a user via the backend API with retry logic
 */
async function registerUser(userData: RegisterRequest, retryCount = 0): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      console.log(`[Setup] Registered user: ${userData.email}`);
      return true;
    } else {
      const errorText = await response.text();
      
      // Check for common "already exists" scenarios
      if (response.status === 400 && (errorText.includes('already') || errorText.includes('exists') || errorText.includes('duplicate'))) {
        console.log(`[Setup] User already exists: ${userData.email}`);
        return true;
      }
      
      // If blocked by threat detection and we haven't retried yet, wait and retry
      if (response.status === 403 && errorText.includes('threat') && retryCount < 2) {
        console.log(`[Setup] Threat detection blocked ${userData.email}, retrying after delay...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return registerUser(userData, retryCount + 1);
      }
      
      console.warn(`[Setup] Failed to register ${userData.email}: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.warn(`[Setup] Error registering ${userData.email}:`, error);
    // Retry on network errors
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return registerUser(userData, retryCount + 1);
    }
    return false;
  }
}

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🚀 Running global setup...');
  console.log(`Base URL: ${config.projects[0]?.use?.baseURL || 'not set'}`);
  console.log(`Backend URL: ${BACKEND_URL}`);

  const seeder = new DataSeeder();

  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await seeder.connect();

    // Reset database to clean state
    console.log('🗑️ Resetting database...');
    await seeder.resetDatabase();

    // Warmup backend to avoid threat detection blocking first registration
    console.log('🔥 Warming up backend...');
    await warmupBackend();

    // Register test users via API
    console.log('👤 Creating test users via API...');
    
    const adminData: RegisterRequest = {
      firstName: defaultFixtures.users.admin.firstName,
      lastName: defaultFixtures.users.admin.lastName || 'Admin',
      email: defaultFixtures.users.admin.email,
      password: defaultFixtures.users.admin.password,
      timezone: 'America/Denver',
      termsAccepted: true,
    };
    await registerUser(adminData);

    // Small delay between registrations
    await new Promise(resolve => setTimeout(resolve, 500));

    const customerData: RegisterRequest = {
      firstName: defaultFixtures.users.customer.firstName,
      lastName: defaultFixtures.users.customer.lastName || 'Customer',
      email: defaultFixtures.users.customer.email,
      password: defaultFixtures.users.customer.password,
      timezone: 'America/Denver',
      termsAccepted: true,
    };
    await registerUser(customerData);

    // Register isolated test users (for parallel test execution)
    console.log('👤 Creating isolated test users for parallel execution...');
    const isolatedUsers = getAllIsolatedUsers();
    for (const user of isolatedUsers) {
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between registrations
      const userData: RegisterRequest = {
        firstName: user.firstName,
        lastName: user.lastName || 'User',
        email: user.email,
        password: user.password,
        timezone: 'America/Denver',
        termsAccepted: true,
      };
      await registerUser(userData);
    }

    // Activate users and set admin role directly in MongoDB
    console.log('✅ Activating users and setting roles...');
    const usersToActivate = [
      {
        email: defaultFixtures.users.customer.email,
        authorities: ['ROLE_USER'],
      },
      {
        email: defaultFixtures.users.admin.email,
        authorities: ['ROLE_USER', 'ROLE_ADMIN'],
      },
      // Activate all isolated test users
      ...isolatedUsers.map(user => ({
        email: user.email,
        authorities: ['ROLE_USER'],
      })),
    ];
    await seeder.activateAndSetupUsers(usersToActivate);

    // CRITICAL: Seed special test users directly via MongoDB (not via API)
    // These users need specific activation/reset keys for testing account flows
    console.log('🔑 Seeding special test users for activation/reset testing...');
    const specialTestUsers: TestUser[] = [];
    
    // User pending activation - has a known activation key (chromium)
    if (defaultFixtures.users.pendingActivation) {
      specialTestUsers.push(defaultFixtures.users.pendingActivation);
    }
    
    // Second user pending activation - for login-after-activation test (chromium)
    if (defaultFixtures.users.pendingActivation2) {
      specialTestUsers.push(defaultFixtures.users.pendingActivation2);
    }
    
    // Third user pending activation - for Firefox browser activation test
    if (defaultFixtures.users.pendingActivation3) {
      specialTestUsers.push(defaultFixtures.users.pendingActivation3);
    }
    
    // Fourth user pending activation - for Firefox browser login-after-activation test
    if (defaultFixtures.users.pendingActivation4) {
      specialTestUsers.push(defaultFixtures.users.pendingActivation4);
    }
    
    // Fifth user pending activation - for mobile-chrome browser activation test
    if (defaultFixtures.users.pendingActivation5) {
      specialTestUsers.push(defaultFixtures.users.pendingActivation5);
    }
    
    // Sixth user pending activation - for mobile-chrome browser login-after-activation test
    if (defaultFixtures.users.pendingActivation6) {
      specialTestUsers.push(defaultFixtures.users.pendingActivation6);
    }
    
    // User with valid reset key for password reset testing (chromium)
    if (defaultFixtures.users.pendingReset) {
      specialTestUsers.push(defaultFixtures.users.pendingReset);
    }
    
    // Second user with valid reset key - for login-after-reset test (chromium)
    if (defaultFixtures.users.pendingReset2) {
      specialTestUsers.push(defaultFixtures.users.pendingReset2);
    }
    
    // Third user with valid reset key - for Firefox browser reset test
    if (defaultFixtures.users.pendingReset3) {
      specialTestUsers.push(defaultFixtures.users.pendingReset3);
    }
    
    // Fourth user with valid reset key - for Firefox browser login-after-reset test
    if (defaultFixtures.users.pendingReset4) {
      specialTestUsers.push(defaultFixtures.users.pendingReset4);
    }
    
    // Fifth user with valid reset key - for mobile-chrome browser reset test
    if (defaultFixtures.users.pendingReset5) {
      specialTestUsers.push(defaultFixtures.users.pendingReset5);
    }
    
    // Sixth user with valid reset key - for mobile-chrome browser login-after-reset test
    if (defaultFixtures.users.pendingReset6) {
      specialTestUsers.push(defaultFixtures.users.pendingReset6);
    }
    
    // User with expired reset key for expired token testing
    if (defaultFixtures.users.expiredReset) {
      specialTestUsers.push(defaultFixtures.users.expiredReset);
    }
    
    if (specialTestUsers.length > 0) {
      await seeder.seedSpecialTestUsers(specialTestUsers);
      console.log(`   - Seeded ${specialTestUsers.length} special test users with activation/reset keys`);
    }

    // Seed test products and coupons
    console.log('🌱 Seeding products and coupons...');
    await seeder.seedProducts(defaultFixtures.products);
    
    // CRITICAL: Seed inventory batches - the backend calculates inventory from batches
    console.log('📦 Seeding inventory batches...');
    await seeder.seedInventoryBatches(defaultFixtures.products);

    const coupons = [
      defaultFixtures.coupons.percentage,
      defaultFixtures.coupons.fixed,
      defaultFixtures.coupons.expired,
    ];
    await seeder.seedCoupons(coupons);

    // CRITICAL: Seed payment method configurations for checkout tests
    console.log('💳 Seeding payment method configurations...');
    await seeder.seedPaymentMethodConfigurations();

    // Seed test orders for admin order management tests
    console.log('📋 Seeding test orders...');
    await seeder.seedOrders(defaultFixtures.orders);

    // Seed Bitcoin payments for admin Bitcoin dashboard tests
    console.log('₿ Seeding Bitcoin payments...');
    if (defaultFixtures.bitcoinPayments && defaultFixtures.bitcoinPayments.length > 0) {
      await seeder.seedBitcoinPayments(defaultFixtures.bitcoinPayments);
    }

    // CRITICAL: Update order userIds to match actual database user IDs
    // Users registered via API get new UUIDs, not the fixture IDs
    console.log('🔗 Updating order user IDs to match actual database IDs...');
    const emailToFixtureId = new Map<string, string>();
    // Map customer user
    emailToFixtureId.set(defaultFixtures.users.customer.email, defaultFixtures.users.customer.id);
    // Map accountOrders isolated user (used for order-history tests)
    const accountOrdersUser = isolatedUsers.find(u => u.email === 'account-orders@test.zenithbioscience.com');
    if (accountOrdersUser) {
      emailToFixtureId.set(accountOrdersUser.email, accountOrdersUser.id);
    }
    // Map accountCoa isolated user (used for coa-submission tests)
    const accountCoaUser = isolatedUsers.find(u => u.email === 'account-coa@test.zenithbioscience.com');
    if (accountCoaUser) {
      emailToFixtureId.set(accountCoaUser.email, accountCoaUser.id);
    }
    await seeder.updateOrderUserIds(emailToFixtureId);
    
    // Verify the update worked by checking orders for accountOrders user
    const accountOrdersUserId = await seeder.getUserIdByEmail('account-orders@test.zenithbioscience.com');
    if (accountOrdersUserId) {
      const orderCount = await seeder.countOrdersByUserId(accountOrdersUserId);
      console.log(`[Verification] Orders for accountOrders user (${accountOrdersUserId}): ${orderCount}`);
    }
    
    // Verify the update worked by checking orders for accountCoa user
    const accountCoaUserId = await seeder.getUserIdByEmail('account-coa@test.zenithbioscience.com');
    if (accountCoaUserId) {
      const coaOrderCount = await seeder.countOrdersByUserId(accountCoaUserId);
      console.log(`[Verification] Orders for accountCoa user (${accountCoaUserId}): ${coaOrderCount}`);
    }

    // CRITICAL: Clear backend cache after seeding data
    // The backend caches products, and if products were fetched before batches were seeded,
    // the cached version will have inventory: 0
    console.log('🧹 Clearing backend cache...');
    const adminToken = await loginUser(
      defaultFixtures.users.admin.email,
      defaultFixtures.users.admin.password
    );
    if (adminToken) {
      await clearBackendCache(adminToken);
      // CRITICAL: Refresh payment configuration cache after seeding payment methods
      await refreshPaymentConfigCache(adminToken);
    } else {
      console.warn('⚠️ Could not clear backend cache - admin login failed');
    }

    console.log('✅ Global setup complete');
    console.log(`   - Users: customer (${defaultFixtures.users.customer.email}), admin (${defaultFixtures.users.admin.email})`);
    console.log(`   - Isolated users: ${isolatedUsers.length} users for parallel test execution`);
    console.log(`   - Special test users: pendingActivation, pendingReset, expiredReset`);
    console.log(`   - Products: ${defaultFixtures.products.length} test products`);
    console.log(`   - Inventory batches: ${defaultFixtures.products.filter(p => p.inventory > 0).length} batches created`);
    console.log(`   - Coupons: TEST10, SAVE20, EXPIRED`);
    console.log(`   - Orders: ${defaultFixtures.orders.length} test orders`);
    console.log(`   - Bitcoin payments: ${defaultFixtures.bitcoinPayments?.length || 0} test payments`);
    console.log(`   - Payment methods: CashApp, Solana Pay, Bitcoin (Zelle, ACH disabled - not implemented)`);
    console.log(`   - Backend cache: cleared`);
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    console.warn('⚠️ Tests will run but may fail due to missing test data');
  } finally {
    await seeder.disconnect();
  }
}

export default globalSetup;
