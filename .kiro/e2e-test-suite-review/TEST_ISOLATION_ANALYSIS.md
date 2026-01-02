# Test Isolation Analysis

## Executive Summary

This document analyzes test isolation patterns across all E2E test files in `e2e/tests/`. The analysis covers cart and user state management, cleanup patterns, serial mode configuration, and potential race conditions.

**Overall Assessment**: The test suite has **strong isolation patterns** with comprehensive use of:
- Isolated user accounts per test file
- Serial mode configuration for stateful tests
- beforeEach hooks that clear cart state
- API calls to clear backend state

---

## Task 6.1: Cart and User State Management Analysis

### Serial Mode Configuration

The following test files correctly use `test.describe.configure({ mode: 'serial' })` to prevent race conditions when tests share user accounts or modify state:

| Test File | Serial Mode | Reason |
|-----------|-------------|--------|
| `checkout/checkout-flow.spec.ts` | ✅ Yes | Shared checkout user, cart state |
| `checkout/bitcoin-qr-generation.spec.ts` | ✅ Yes | Shared Bitcoin user, cart state |
| `checkout/bitcoin-payment-selection.spec.ts` | ✅ Yes | Shared Bitcoin user, cart state |
| `checkout/bitcoin-payment-status.spec.ts` | ✅ Yes | Shared Bitcoin user, cart state |
| `checkout/bitcoin-accessibility.spec.ts` | ✅ Yes | Shared Bitcoin user, cart state |
| `checkout/bitcoin-error-handling.spec.ts` | ✅ Yes | Shared Bitcoin user, cart state |
| `checkout/bitcoin-websocket.spec.ts` | ✅ Yes | Shared Bitcoin user, cart state |
| `checkout/address-validation.spec.ts` | ✅ Yes | Shared checkout user, cart state |
| `checkout/payment-processing.spec.ts` | ✅ Yes | Shared checkout user, cart state |
| `admin/order-management.spec.ts` | ✅ Yes | Modifies order status |
| `admin/order-management.property.spec.ts` | ✅ Yes | Modifies order status |

### beforeEach Hooks - Cart State Clearing

**Pattern 1: localStorage Clearing**
Most checkout and cart tests clear localStorage before each test:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.removeItem('zenithCartItems');
  });
});
```

**Files using this pattern:**
- ✅ `checkout/checkout-flow.spec.ts`
- ✅ `checkout/bitcoin-qr-generation.spec.ts`
- ✅ `checkout/bitcoin-payment-selection.spec.ts`
- ✅ `checkout/bitcoin-payment-status.spec.ts`
- ✅ `checkout/bitcoin-accessibility.spec.ts`
- ✅ `checkout/bitcoin-error-handling.spec.ts`
- ✅ `checkout/bitcoin-websocket.spec.ts`
- ✅ `checkout/address-validation.spec.ts`
- ✅ `checkout/payment-processing.spec.ts`
- ✅ `cart/cart-management.spec.ts`

**Pattern 2: Backend Cart Clearing via API**
Checkout tests also clear the backend cart after login:

```typescript
const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
  data: { email: customer.email, password: customer.password },
});

if (loginResponse.ok()) {
  const loginData = await loginResponse.json();
  const token = loginData.accessToken;
  await request.delete('http://localhost:8080/api/cart', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

**Files using this pattern:**
- ✅ `checkout/checkout-flow.spec.ts`
- ✅ `checkout/bitcoin-qr-generation.spec.ts`
- ✅ `checkout/bitcoin-payment-selection.spec.ts`
- ✅ `checkout/bitcoin-payment-status.spec.ts`
- ✅ `checkout/bitcoin-accessibility.spec.ts`
- ✅ `checkout/bitcoin-error-handling.spec.ts`
- ✅ `checkout/bitcoin-websocket.spec.ts`
- ✅ `checkout/address-validation.spec.ts`
- ✅ `checkout/payment-processing.spec.ts`

### Isolated User Accounts

The test suite uses a comprehensive isolated user system defined in `e2e/fixtures/defaultFixtures.ts`:

#### Checkout Users (via `getCheckoutUser()`)
| User Key | Email | Used By |
|----------|-------|---------|
| `checkoutFlow` | checkout-flow@test.zenithbioscience.com | checkout-flow.spec.ts |
| `addressValidation` | address-validation@test.zenithbioscience.com | address-validation.spec.ts |
| `checkoutSummary` | checkout-summary@test.zenithbioscience.com | checkout-summary.property.spec.ts |
| `orderCreation` | order-creation@test.zenithbioscience.com | order-creation.property.spec.ts |
| `paymentProcessing` | payment-processing@test.zenithbioscience.com | payment-processing.spec.ts |

#### Bitcoin Users (via `getBitcoinUser()`)
| User Key | Email | Used By |
|----------|-------|---------|
| `bitcoinPaymentSelection` | bitcoin-selection@test.zenithbioscience.com | bitcoin-payment-selection.spec.ts |
| `bitcoinQrGeneration` | bitcoin-qr@test.zenithbioscience.com | bitcoin-qr-generation.spec.ts |
| `bitcoinPaymentStatus` | bitcoin-status@test.zenithbioscience.com | bitcoin-payment-status.spec.ts |
| `bitcoinErrorHandling` | bitcoin-error@test.zenithbioscience.com | bitcoin-error-handling.spec.ts |
| `bitcoinAccessibility` | bitcoin-a11y@test.zenithbioscience.com | bitcoin-accessibility.spec.ts |
| `bitcoinWebsocket` | bitcoin-ws@test.zenithbioscience.com | bitcoin-websocket.spec.ts |

#### Account Users (via `getAccountUser()`)
| User Key | Email | Used By |
|----------|-------|---------|
| `accountDashboard` | account-dashboard@test.zenithbioscience.com | dashboard.spec.ts |
| `accountProfile` | account-profile@test.zenithbioscience.com | profile.spec.ts |
| `accountAddresses` | account-addresses@test.zenithbioscience.com | addresses.spec.ts |
| `accountPassword` | account-password@test.zenithbioscience.com | password-change.spec.ts |
| `accountOrders` | account-orders@test.zenithbioscience.com | order-history.spec.ts |
| `accountCoa` | account-coa@test.zenithbioscience.com | coa-submission.spec.ts |
| `accountCredits` | account-credits@test.zenithbioscience.com | credits.spec.ts |
| `accountGdpr` | account-gdpr@test.zenithbioscience.com | gdpr.spec.ts |

#### Auth Users (via `getIsolatedUser()`)
| User Key | Email | Used By |
|----------|-------|---------|
| `authLogin` | auth-login@test.zenithbioscience.com | login.spec.ts |
| `authLogout` | auth-logout@test.zenithbioscience.com | logout.spec.ts |
| `cartManagement` | cart-management@test.zenithbioscience.com | cart-management.spec.ts |

#### Browser-Specific Users
For tests that consume single-use tokens (activation, password reset), browser-specific users are provided:

| Browser | Activation User | Reset User |
|---------|-----------------|------------|
| Chromium | pendingActivation | pendingReset |
| Firefox | pendingActivation3 | pendingReset3 |
| Mobile Chrome | pendingActivation5 | pendingReset5 |

---

## Task 6.2: Cleanup and Race Condition Analysis

### afterEach/afterAll Hooks

**Finding**: Most test files do NOT use afterEach/afterAll hooks for cleanup. Instead, they rely on:
1. beforeEach hooks to clear state before each test
2. Serial mode to prevent parallel execution conflicts
3. Isolated user accounts to prevent cross-test interference

**Files with explicit cleanup:**
- `reporting/api-logging.property.spec.ts` - Clears request logs in afterEach

### Potential Race Conditions Identified

#### 1. **Cart Tests Without Serial Mode** ⚠️ LOW RISK
**Files:**
- `cart/add-to-cart.spec.ts`
- `cart/cart-management.spec.ts`
- `cart/cart-operations.property.spec.ts`
- `cart/coupon-application.spec.ts`
- `cart/coupon-calculation.property.spec.ts`

**Risk**: These tests don't use serial mode, but they:
- Don't require login (except cart-management.spec.ts which uses isolated user)
- Use localStorage for cart state (browser-isolated)
- Don't share backend state

**Mitigation**: Low risk because cart state is browser-isolated via localStorage.

#### 2. **Shop Tests Without Serial Mode** ✅ NO RISK
**Files:**
- `shop/product-catalog.spec.ts`
- `shop/product-detail.spec.ts`
- `shop/product-search.spec.ts`

**Risk**: None - these are read-only tests that don't modify state.

#### 3. **Auth Tests Without Serial Mode** ✅ LOW RISK
**Files:**
- `auth/login.spec.ts`
- `auth/logout.spec.ts`
- `auth/registration.spec.ts`

**Risk**: Low - login/logout use isolated users, registration generates unique emails.

#### 4. **Admin Order Tests - Dedicated Order Assignments** ✅ WELL MANAGED
**Files:**
- `admin/order-management.spec.ts`
- `admin/order-management.property.spec.ts`

**Pattern**: Each test has a dedicated order number to avoid conflicts:
```
SPEC TESTS:
- Order 0001: PENDING → "success message after status update"
- Order 0003: CONFIRMED → "CONFIRMED to PROCESSING"
- Order 0005: PROCESSING → "persist updated status"
- Order 0009: AWAITING_PAYMENT → "cancelling an order"

PROPERTY TESTS:
- Order 0017: CONFIRMED → "Order status update is immediately visible"
- Order 0018: PENDING → "Multiple valid status transitions"
- Order 0006: PROCESSING → "Order status persists after page reload"
...
```

#### 5. **Account Tests - Shared User State** ⚠️ MEDIUM RISK
**Files:**
- `account/profile.spec.ts` - Modifies user profile
- `account/addresses.spec.ts` - Adds/deletes addresses
- `account/password-change.spec.ts` - Changes password

**Risk**: These tests modify user state but use isolated users, so risk is mitigated.

**Potential Issue**: If the same test file runs in parallel across browsers, they share the same isolated user. However, Playwright runs tests within a file serially by default.

### Shared State Issues Documented

#### 1. **Single-Use Tokens**
**Issue**: Activation keys and reset keys can only be used once.
**Solution**: Browser-specific users with unique keys:
```typescript
// Each browser gets its own activation key
export function getBrowserActivationKeyAndUser(browserName: string) {
  if (normalizedBrowser.includes('firefox')) {
    return { activationKey: getPendingActivationUser3().activationKey!, ... };
  } else if (normalizedBrowser.includes('mobile')) {
    return { activationKey: getPendingActivationUser5().activationKey!, ... };
  } else {
    return { activationKey: getPendingActivationUser().activationKey!, ... };
  }
}
```

#### 2. **Order Status Changes**
**Issue**: Order status changes are permanent and affect subsequent tests.
**Solution**: Dedicated order assignments per test (documented in fixtures).

#### 3. **Product Inventory**
**Issue**: Checkout tests consume inventory.
**Solution**: High inventory values (10000, 5000) in fixtures to support parallel runs.

---

## Summary of Isolation Patterns

### ✅ Well-Implemented Patterns

1. **Serial Mode for Stateful Tests**
   - All checkout tests use `test.describe.configure({ mode: 'serial' })`
   - Admin order tests use serial mode

2. **Isolated User Accounts**
   - 30+ isolated users for different test domains
   - Browser-specific users for single-use token tests

3. **Cart State Clearing**
   - localStorage cleared in beforeEach
   - Backend cart cleared via API after login

4. **Dedicated Order Assignments**
   - Each order management test has its own order number
   - Prevents conflicts when tests modify order status

5. **High Inventory Values**
   - Products have 5000-10000 inventory
   - Supports parallel test execution

### ⚠️ Areas for Potential Improvement

1. **Missing afterEach Cleanup**
   - Most tests don't clean up created data
   - Relies on test database reset between runs

2. **Cart Tests Without Serial Mode**
   - Low risk due to localStorage isolation
   - Could add serial mode for extra safety

3. **Account Tests Modifying User State**
   - Profile/address changes persist
   - Isolated users mitigate but don't eliminate risk

---

## Recommendations

### High Priority
None - the test suite has strong isolation patterns.

### Medium Priority
1. Consider adding `test.describe.configure({ mode: 'serial' })` to cart tests for consistency
2. Document the test database reset requirement between full test runs

### Low Priority
1. Add afterEach hooks to clean up created addresses in `addresses.spec.ts`
2. Add afterEach hooks to reset profile changes in `profile.spec.ts`

---

## Test File Isolation Matrix

| Test File | Serial Mode | Isolated User | Cart Clear | Backend Clear | Risk Level |
|-----------|-------------|---------------|------------|---------------|------------|
| checkout/checkout-flow.spec.ts | ✅ | ✅ | ✅ | ✅ | ✅ Low |
| checkout/bitcoin-*.spec.ts (6 files) | ✅ | ✅ | ✅ | ✅ | ✅ Low |
| checkout/address-validation.spec.ts | ✅ | ✅ | ✅ | ✅ | ✅ Low |
| checkout/payment-processing.spec.ts | ✅ | ✅ | ✅ | ✅ | ✅ Low |
| cart/add-to-cart.spec.ts | ❌ | ❌ | ❌ | ❌ | ✅ Low* |
| cart/cart-management.spec.ts | ❌ | ✅ | ✅ | ❌ | ✅ Low |
| cart/cart-operations.property.spec.ts | ❌ | ❌ | ❌ | ❌ | ✅ Low* |
| cart/coupon-*.spec.ts (2 files) | ❌ | ❌ | ❌ | ❌ | ✅ Low* |
| auth/login.spec.ts | ❌ | ✅ | ❌ | ❌ | ✅ Low |
| auth/logout.spec.ts | ❌ | ✅ | ❌ | ❌ | ✅ Low |
| auth/registration.spec.ts | ❌ | N/A | ❌ | ❌ | ✅ Low |
| account/*.spec.ts (12 files) | ❌ | ✅ | ❌ | ❌ | ✅ Low |
| admin/order-management.spec.ts | ✅ | N/A | ❌ | ❌ | ✅ Low |
| admin/order-management.property.spec.ts | ✅ | N/A | ❌ | ❌ | ✅ Low |
| admin/dashboard-access.spec.ts | ❌ | N/A | ❌ | ❌ | ✅ Low |
| admin/product-management.spec.ts | ❌ | N/A | ❌ | ❌ | ⚠️ Medium** |
| admin/bitcoin-payments.spec.ts | ❌ | N/A | ❌ | ❌ | ✅ Low |
| shop/*.spec.ts (3 files) | ❌ | ❌ | ❌ | ❌ | ✅ Low |
| reporting/*.spec.ts (2 files) | ❌ | ❌ | ❌ | ❌ | ✅ Low |

*Low risk because cart state is browser-isolated via localStorage
**Medium risk because product CRUD operations could conflict if run in parallel

---

## Conclusion

The E2E test suite demonstrates **mature test isolation practices**:

1. **44 test files analyzed** across 8 directories
2. **30+ isolated user accounts** prevent cross-test interference
3. **Serial mode** properly configured for all stateful checkout/order tests
4. **Comprehensive cart clearing** in beforeEach hooks
5. **Dedicated order assignments** prevent admin test conflicts
6. **Browser-specific users** for single-use token tests

The test suite is well-designed for parallel execution across browsers while maintaining test isolation within each browser context.
