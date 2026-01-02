# Design Document: E2E Test Suite Fixes

## Overview

This design document outlines the technical approach for fixing critical issues in the E2E test suite. The fixes address weak assertions, missing test data, and establish a process for handling production bugs discovered during testing. The implementation will strengthen test reliability and ensure the suite provides accurate confidence in application behavior.

## Architecture

The E2E test suite follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Test Specifications                      │
│  (*.spec.ts files in e2e/tests/)                            │
├─────────────────────────────────────────────────────────────┤
│                      Page Objects                            │
│  (e2e/page-objects/ - encapsulate UI interactions)          │
├─────────────────────────────────────────────────────────────┤
│                    Test Fixtures                             │
│  (e2e/fixtures/ - test data and user accounts)              │
├─────────────────────────────────────────────────────────────┤
│                   Playwright Framework                       │
│  (Browser automation, assertions, test runner)              │
└─────────────────────────────────────────────────────────────┘
```

### Fix Categories

1. **Assertion Fixes**: Replace weak/always-pass assertions with meaningful verifications
2. **Data Seeding**: Add test fixtures to enable skipped tests
3. **Tolerance Adjustments**: Tighten property test tolerances
4. **New Tests**: Add missing validation tests
5. **Bug Documentation**: Track and fix production bugs discovered

## Components and Interfaces

### 1. Admin Dashboard Access Tests (`e2e/tests/admin/dashboard-access.spec.ts`)

**Current Issue**: Uses `expect(true).toBeTruthy()` which always passes

**Fix Approach**:
```typescript
// BEFORE (broken)
if (isHeadingVisible) {
  expect(finalUrl.includes('/admin') || isLoading).toBeTruthy();
} else {
  expect(true).toBeTruthy();  // ALWAYS PASSES
}

// AFTER (correct)
test('should redirect unauthenticated user from admin dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/admin');
  await page.waitForLoadState('networkidle');
  
  // Verify user is NOT on admin with full access
  const currentUrl = page.url();
  const dashboardHeading = page.getByRole('heading', { 
    name: 'Business Intelligence Dashboard', 
    level: 1 
  });
  
  const isOnAdmin = currentUrl.includes('/admin');
  const hasFullAccess = await dashboardHeading.isVisible().catch(() => false);
  
  // Either redirected away OR access denied
  if (isOnAdmin) {
    // If still on admin URL, verify access is blocked
    const accessDenied = page.getByText(/access denied|unauthorized|loading/i);
    await expect(accessDenied).toBeVisible({ timeout: 5000 });
  }
  // If redirected, test passes (user not on /admin)
  expect(isOnAdmin && hasFullAccess).toBe(false);
});
```

### 2. Admin Access Property Tests (`e2e/tests/admin/admin-access.property.spec.ts`)

**Current Issue**: OR assertion includes `currentUrl.includes('/admin')` which always passes

**Fix Approach**:
```typescript
// BEFORE (weak - always passes)
expect(isRedirected || hasAccessDenied || currentUrl.includes('/admin')).toBeTruthy();

// AFTER (correct)
expect(isRedirected || hasAccessDenied).toBeTruthy();
// OR more specific:
if (!isRedirected) {
  await expect(page.getByText(/access denied|unauthorized/i)).toBeVisible();
}
```

### 3. Login Error Assertions (`e2e/tests/auth/login.spec.ts`)

**Current Issue**: Accepts staying on login page without error as valid

**Fix Approach**:
```typescript
// BEFORE (weak)
const hasError = await loginPage.hasErrorMessage();
const stillOnLogin = page.url().includes('/login');
expect(hasError || stillOnLogin).toBeTruthy();

// AFTER (correct)
await expect(loginPage.errorMessage).toBeVisible({ timeout: 5000 });
const errorText = await loginPage.getErrorText();
expect(errorText).toMatch(/invalid|incorrect|wrong/i);
```

### 4. Address Management Assertions (`e2e/tests/account/addresses.spec.ts`)

**Current Issue**: Triple-OR assertion accepts multiple fallback conditions

**Fix Approach**:
```typescript
// BEFORE (weak)
expect(isDefault || buttonNotVisible || anyDefault).toBeTruthy();

// AFTER (correct)
// Verify the specific address is marked as default
const addressCard = addressBookPage.getAddressCard(addressId);
const defaultBadge = addressCard.locator('[data-testid="default-badge"]');
await expect(defaultBadge).toBeVisible();
```

### 5. Order History Test Data Seeding (`e2e/fixtures/defaultFixtures.ts`)

**Current Issue**: 10 tests skip due to missing order data

**Fix Approach**:
```typescript
// Add to defaultFixtures.ts
export const orderHistoryFixtures = {
  orders: [
    { 
      orderNumber: 'TEST-ORDER-001',
      status: 'PENDING',
      userId: 'accountOrders',
      items: [{ productId: 'test-product-1', quantity: 1 }],
      total: 99.99
    },
    { 
      orderNumber: 'TEST-ORDER-002',
      status: 'COMPLETED',
      userId: 'accountOrders',
      items: [{ productId: 'test-product-2', quantity: 2 }],
      total: 199.99
    },
    { 
      orderNumber: 'TEST-ORDER-003',
      status: 'SHIPPED',
      userId: 'accountOrders',
      items: [{ productId: 'test-product-1', quantity: 1 }],
      total: 149.99
    }
  ]
};

// Seed function
export async function seedOrderHistoryData(request: APIRequestContext): Promise<void> {
  // Create orders via API for test user
}
```

### 6. Password Reset Assertions (`e2e/tests/account/forgot-password.spec.ts`)

**Current Issue**: Accepts either success or error as valid

**Fix Approach**:
```typescript
// BEFORE (weak)
expect(hasSuccess || hasError).toBeTruthy();

// AFTER (correct) - separate tests for each scenario
test('should show validation error for invalid email format', async () => {
  await forgotPasswordPage.fillEmail('invalid-email');
  await forgotPasswordPage.submit();
  await expect(forgotPasswordPage.emailError).toBeVisible();
});

test('should show success for valid email submission', async () => {
  await forgotPasswordPage.fillEmail('valid@example.com');
  await forgotPasswordPage.submit();
  await expect(forgotPasswordPage.successMessage).toBeVisible();
});
```

### 7. Checkout Summary Tolerance (`e2e/tests/checkout/checkout-summary.property.spec.ts`)

**Current Issue**: 20% tolerance is too lenient

**Fix Approach**:
```typescript
// BEFORE (too lenient)
const tolerance = expectedTotal * 0.2;  // 20%

// AFTER (appropriate)
const tolerance = expectedTotal * 0.05;  // 5%
expect(actualTotal).toBeCloseTo(expectedTotal, 2);  // 2 decimal places
```

### 8. Registration Validation Tests (`e2e/tests/auth/registration.spec.ts`)

**New Tests to Add**:
```typescript
test('should show error for invalid email format', async ({ page }) => {
  await registerPage.fillEmail('invalid-email');
  await registerPage.fillPassword('ValidPass123!');
  await registerPage.fillConfirmPassword('ValidPass123!');
  await registerPage.submit();
  
  await expect(registerPage.emailError).toBeVisible();
  const errorText = await registerPage.emailError.textContent();
  expect(errorText).toMatch(/valid email|invalid format/i);
});

test('should show error for weak password', async ({ page }) => {
  await registerPage.fillEmail('test@example.com');
  await registerPage.fillPassword('weak');
  await registerPage.submit();
  
  await expect(registerPage.passwordError).toBeVisible();
});

test('should show error for password mismatch', async ({ page }) => {
  await registerPage.fillEmail('test@example.com');
  await registerPage.fillPassword('ValidPass123!');
  await registerPage.fillConfirmPassword('DifferentPass456!');
  await registerPage.submit();
  
  await expect(registerPage.confirmPasswordError).toBeVisible();
  const errorText = await registerPage.confirmPasswordError.textContent();
  expect(errorText).toMatch(/match/i);
});

test('should show error for duplicate email', async ({ page }) => {
  // Use an email that already exists in test fixtures
  await registerPage.fillEmail('existing@test.zenithbioscience.com');
  await registerPage.fillPassword('ValidPass123!');
  await registerPage.fillConfirmPassword('ValidPass123!');
  await registerPage.submit();
  
  await expect(registerPage.errorMessage).toBeVisible();
  const errorText = await registerPage.errorMessage.textContent();
  expect(errorText).toMatch(/already|exists|registered/i);
});
```

## Data Models

### Bug Documentation Model (`BUGS_FIXED.md`)

```markdown
# Production Bugs Fixed During E2E Test Fixes

## Bug #1: [Title]
- **Category**: Security | Data Integrity | UI/UX | Validation
- **Discovered In**: [test file]
- **Root Cause**: [description]
- **Expected Behavior**: [what should happen]
- **Actual Behavior**: [what was happening]
- **Files Modified**: [list of files]
- **Fix Description**: [what was changed]
- **Verification**: [test that now passes]
```

### Test Fixture Data Model

```typescript
interface OrderFixture {
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  createdAt: Date;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, most acceptance criteria are specific examples (test scenarios) rather than universal properties. However, the following properties can be verified:

### Property 1: Security Test Assertion Validity

*For any* security-related test in the E2E test suite (admin access, authentication), the test assertions SHALL NOT include always-pass patterns (`expect(true).toBeTruthy()`) or fallback conditions that always evaluate to true.

**Validates: Requirements 1.3, 2.1, 2.3**

### Property 2: Admin Access Denial Verification

*For any* non-admin user (unauthenticated or customer role) attempting to access admin pages, the test SHALL verify either a redirect away from /admin OR an access denied message is displayed—never accepting the admin URL as a valid outcome.

**Validates: Requirements 1.1, 1.2, 2.2**

### Property 3: Checkout Total Accuracy

*For any* checkout summary calculation, the displayed total SHALL be within 5% of the expected calculated total (subtotal + tax + shipping - discounts), accounting for legitimate rounding differences.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 4: Address Operation UI Consistency

*For any* address management operation (add, edit, delete, set default), the UI state after the operation SHALL reflect the expected change (e.g., default badge visible on the correct address, address removed from list).

**Validates: Requirements 4.1, 4.3**

### Property 5: Order History Data Availability

*For any* order history test execution, the test user SHALL have at least 3 orders with different statuses (PENDING, COMPLETED, SHIPPED) available, enabling all tab filtering tests to run without conditional skips.

**Validates: Requirements 5.1, 5.3, 5.4**

## Error Handling

### Test Failure Handling

1. **Assertion Failures**: Tests should fail with clear error messages indicating:
   - Expected vs actual values
   - Element selectors that failed to match
   - Timeout information if applicable

2. **Production Bug Discovery**: When a test reveals unexpected behavior:
   - Document the bug in BUGS_FIXED.md
   - Fix the production code
   - Update the test to verify correct behavior
   - Never weaken assertions to work around bugs

3. **Flaky Test Prevention**:
   - Use condition-based waits instead of fixed timeouts
   - Implement retry logic only for known transient issues
   - Document any necessary retries with justification

### Error Categories

| Category | Handling Approach |
|----------|-------------------|
| Security Issues | Fix immediately, document in BUGS_FIXED.md |
| Data Integrity | Fix production code, verify with property tests |
| UI/UX Issues | Fix frontend, update page object selectors |
| Validation Issues | Fix validation logic, add specific error tests |

## Testing Strategy

### Dual Testing Approach

This spec involves fixing existing tests rather than creating new functionality. The testing strategy focuses on:

1. **Verification Tests**: Run the fixed tests to verify they now properly detect failures
2. **Regression Tests**: Ensure fixes don't break other tests
3. **Property Tests**: Verify universal properties hold across test scenarios

### Test Execution Plan

1. **Before Fixes**: Document current test behavior (passing with weak assertions)
2. **After Fixes**: Verify tests now properly assert expected behavior
3. **Negative Testing**: Intentionally break functionality to verify tests catch failures

### Property-Based Testing Configuration

For Property 3 (Checkout Total Accuracy), the existing property test in `checkout-summary.property.spec.ts` will be updated:

```typescript
/**
 * Property Test: Checkout Total Accuracy
 * Feature: e2e-test-fixes, Property 3: Checkout totals within 5% tolerance
 * Validates: Requirements 8.1, 8.2, 8.3
 */
test('checkout total should be within 5% of calculated total', async ({ page }) => {
  // Generate various cart configurations
  // Verify total accuracy for each
  const tolerance = 0.05; // 5%
  expect(Math.abs(actualTotal - expectedTotal) / expectedTotal).toBeLessThanOrEqual(tolerance);
});
```

### Unit Tests vs Property Tests

| Test Type | Purpose | Files |
|-----------|---------|-------|
| Unit Tests | Verify specific scenarios (login error, address default) | login.spec.ts, addresses.spec.ts |
| Property Tests | Verify invariants (checkout totals, access control) | checkout-summary.property.spec.ts, admin-access.property.spec.ts |

### Test Data Requirements

| Test Area | Required Data |
|-----------|---------------|
| Order History | 3+ orders with PENDING, COMPLETED, SHIPPED statuses |
| Registration | Existing user email for duplicate test |
| Admin Access | Customer user, Admin user, Unauthenticated state |
| Checkout | Products with known prices for calculation verification |

## Implementation Notes

### Files to Modify

| File | Changes |
|------|---------|
| `e2e/tests/admin/dashboard-access.spec.ts` | Replace always-pass assertions |
| `e2e/tests/admin/admin-access.property.spec.ts` | Remove fallback OR conditions |
| `e2e/tests/auth/login.spec.ts` | Strengthen error assertions |
| `e2e/tests/account/addresses.spec.ts` | Replace triple-OR assertions |
| `e2e/tests/account/forgot-password.spec.ts` | Split into specific scenario tests |
| `e2e/tests/account/coa-submission.spec.ts` | Replace always-pass assertion |
| `e2e/tests/checkout/checkout-summary.property.spec.ts` | Reduce tolerance to 5% |
| `e2e/tests/auth/registration.spec.ts` | Add validation tests |
| `e2e/fixtures/defaultFixtures.ts` | Add order history fixtures |

### New Files to Create

| File | Purpose |
|------|---------|
| `zenithbioscience-e2e/.kiro/specs/e2e-test-fixes/BUGS_FIXED.md` | Document production bugs discovered and fixed |

### Dependencies

- Playwright test framework
- Existing page objects (may need updates for new assertions)
- Backend API for order seeding (if not using database fixtures)
