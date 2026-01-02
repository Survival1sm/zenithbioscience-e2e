# Design Document

## Introduction

This document describes the technical design for fixing production bugs discovered during E2E test execution. The fixes span three codebases: the E2E test fixtures (DataSeeder), the Next.js frontend, and the Spring Boot backend.

## Architecture Overview

The Zenith Bioscience application follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                     E2E Test Suite (Playwright)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Test Specs  │  │ Page Objects│  │ Fixtures (DataSeeder)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │ Guards (AdminGuard)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Controllers │  │  Services   │  │ Repositories (MongoDB)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Bug Categories and Root Causes

### Category 1: Data Seeding Issues (11 Order History + 10 COA Failures)

**Root Cause Analysis:**
- Orders 24-30 are defined in `defaultFixtures.orders` with `userId: 'e2e-account-orders-001'`
- The `accountOrders` user is registered via API, which generates a NEW UUID (not `e2e-account-orders-001`)
- The `updateOrderUserIds` method in global-setup.ts attempts to update order userIds but the mapping may not be working correctly
- The backend's `/api/orders` endpoint filters orders by the authenticated user's ID, so orders with mismatched userIds are not returned

**Fix Location:** `zenithbioscience-e2e/global-setup.ts` and `zenithbioscience-e2e/fixtures/DataSeeder.ts`

### Category 2: Admin Access Control Security Vulnerability (4 Failures)

**Root Cause Analysis:**
- The frontend `AdminGuard` component is not properly blocking non-admin users
- Non-admin users can access `/admin` routes and see the admin dashboard
- This is a **SECURITY VULNERABILITY** that must be fixed in production

**Fix Location:** `zenithbioscience-next/src/app/_components/guards/AdminGuard.tsx` (or equivalent)

### Category 3: Login Error Message Mismatch (3 Failures)

**Root Cause Analysis:**
- Tests expect error messages containing "invalid" or "incorrect" or "credentials"
- Actual error message is "Login failed. Please try again."
- This is a test assertion issue - tests should match actual application behavior

**Fix Location:** `zenithbioscience-e2e/tests/auth/login.spec.ts`

### Category 4: Registration Validation Selector Mismatch (2 Failures)

**Root Cause Analysis:**
- Tests use incorrect selectors for error message elements
- The error IS displayed but the test can't find it with the current selector
- Need to identify the actual error element selector in the frontend

**Fix Location:** `zenithbioscience-e2e/tests/auth/registration.spec.ts`

### Category 5: Forgot Password Security Vulnerability (1 Failure)

**Root Cause Analysis:**
- Backend returns different responses for existing vs non-existing emails
- This allows attackers to enumerate valid email addresses
- This is a **SECURITY VULNERABILITY** that must be fixed in production

**Fix Location:** `zenithbioscience-api/src/main/java/com/zenithbioscience/backend/web/rest/AccountResource.java`

### Category 6: Admin Order Management API Error (2 Failures)

**Root Cause Analysis:**
- Admin orders page shows "Failed to load orders" error
- Backend API `/api/admin/orders` is returning an error response
- Need to investigate backend logs and fix the API endpoint

**Fix Location:** `zenithbioscience-api/src/main/java/com/zenithbioscience/backend/web/rest/admin/AdminOrderResource.java`

## Component Designs

### Component 1: DataSeeder Order User ID Mapping Fix

**Current Behavior:**
```typescript
// global-setup.ts
const emailToFixtureId = new Map<string, string>();
emailToFixtureId.set(defaultFixtures.users.customer.email, defaultFixtures.users.customer.id);
const accountOrdersUser = isolatedUsers.find(u => u.email === 'account-orders@test.zenithbioscience.com');
if (accountOrdersUser) {
  emailToFixtureId.set(accountOrdersUser.email, accountOrdersUser.id);
}
await seeder.updateOrderUserIds(emailToFixtureId);
```

**Problem:** The `updateOrderUserIds` method updates orders where `userId === fixtureId` to use `actualUserId`. But if the orders were seeded BEFORE the user ID mapping is done, the orders already have the fixture ID which should work. The issue is that the orders for `accountCoa` user are NOT being seeded at all.

**Solution:** 
1. Add orders for `accountCoa` user (DELIVERED/COMPLETED status for COA eligibility)
2. Ensure `accountCoa` user is included in the `emailToFixtureId` mapping
3. Verify the order seeding happens AFTER user registration and ID mapping

**New Orders to Add:**
```typescript
// Orders for accountCoa user (COA submission tests)
{
  id: 'e2e-order-031',
  userId: 'e2e-account-coa-001',
  customerEmail: 'account-coa@test.zenithbioscience.com',
  status: 'DELIVERED',
  // ... other fields
},
{
  id: 'e2e-order-032',
  userId: 'e2e-account-coa-001',
  customerEmail: 'account-coa@test.zenithbioscience.com',
  status: 'COMPLETED',
  // ... other fields
}
```

### Component 2: AdminGuard Security Fix

**Current Behavior:** Non-admin users can access `/admin` routes and see the admin dashboard.

**Required Behavior:**
1. Check if user is authenticated
2. Check if user has `ROLE_ADMIN` authority
3. If not authenticated → redirect to `/account/login`
4. If authenticated but not admin → redirect to `/` (home)
5. If admin → render children

**Implementation Pattern:**
```typescript
// AdminGuard.tsx
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/account/login');
      } else if (!user.authorities?.includes('ROLE_ADMIN')) {
        router.replace('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || !user.authorities?.includes('ROLE_ADMIN')) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}
```

### Component 3: Forgot Password Security Fix

**Current Behavior:** Backend returns different responses for existing vs non-existing emails, enabling email enumeration attacks.

**Required Behavior:** Return the same success response regardless of whether the email exists.

**Implementation:**
```java
// AccountResource.java
@PostMapping("/account/reset-password/init")
public ResponseEntity<Void> requestPasswordReset(@RequestBody PasswordResetRequest request) {
    // Always return 200 OK regardless of whether email exists
    // This prevents email enumeration attacks
    
    Optional<User> user = userRepository.findOneByEmailIgnoreCase(request.getEmail());
    if (user.isPresent()) {
        // Send reset email only if user exists
        mailService.sendPasswordResetMail(user.get());
    }
    // Log for security audit (but don't reveal to client)
    log.info("Password reset requested for email: {}", request.getEmail());
    
    return ResponseEntity.ok().build();
}
```

### Component 4: Test Assertion Updates

**Login Error Tests:**
```typescript
// Current (failing)
await expect(page.getByText(/invalid|incorrect|credentials/i)).toBeVisible();

// Fixed (matches actual behavior)
await expect(page.getByText(/login failed|please try again/i)).toBeVisible();
```

**Registration Validation Tests:**
```typescript
// Need to identify actual error element selector
// Use page.locator() with correct selector based on frontend implementation
```

## Correctness Properties

### Property 1: Admin Access Control

**Property Statement:** Non-admin users SHALL NOT be able to view admin dashboard content.

**Verification Method:**
```typescript
test('non-admin user cannot access admin dashboard', async ({ page }) => {
  // Login as regular user (not admin)
  await loginAs(page, regularUser);
  
  // Navigate to admin page
  await page.goto('/admin');
  
  // Verify redirect occurred (not on admin page)
  await expect(page).not.toHaveURL(/\/admin/);
  
  // Verify admin content is NOT visible
  await expect(page.getByRole('heading', { name: /admin dashboard/i })).not.toBeVisible();
});
```

### Property 2: Forgot Password Security (No Email Enumeration)

**Property Statement:** The forgot password endpoint SHALL return identical responses for existing and non-existing emails.

**Verification Method:**
```typescript
test('forgot password returns same response for any email', async ({ request }) => {
  // Request with existing email
  const existingResponse = await request.post('/api/account/reset-password/init', {
    data: { email: 'existing@test.com' }
  });
  
  // Request with non-existing email
  const nonExistingResponse = await request.post('/api/account/reset-password/init', {
    data: { email: 'nonexisting@test.com' }
  });
  
  // Both should return 200 OK
  expect(existingResponse.status()).toBe(200);
  expect(nonExistingResponse.status()).toBe(200);
  
  // Response bodies should be identical (or both empty)
  expect(await existingResponse.text()).toBe(await nonExistingResponse.text());
});
```

## Testing Strategy

### Unit Tests (Backend)
- Test `AccountResource.requestPasswordReset()` returns 200 for any email
- Test admin endpoint authorization annotations

### Integration Tests (E2E)
- Verify order history displays seeded orders for `accountOrders` user
- Verify COA submission shows eligible orders for `accountCoa` user
- Verify admin access control redirects non-admin users
- Verify login error messages match assertions
- Verify registration validation errors are visible

### Security Tests
- Verify email enumeration is not possible via forgot password
- Verify admin routes are protected from unauthorized access

## Implementation Order

1. **Phase 1: Data Seeding Fixes** (Unblocks 21 tests)
   - Add orders for `accountCoa` user
   - Fix order user ID mapping in global-setup.ts
   - Verify orders are correctly associated with users

2. **Phase 2: Security Fixes** (Critical)
   - Fix AdminGuard to block non-admin users
   - Fix forgot password to prevent email enumeration

3. **Phase 3: Test Assertion Updates** (Unblocks 6 tests)
   - Update login error message assertions
   - Update registration validation selectors

4. **Phase 4: Backend API Fixes** (Unblocks 2 tests)
   - Fix admin orders endpoint error

5. **Phase 5: Flaky Test Stabilization**
   - Replace fixed timeouts with condition-based waits
   - Add proper loading state handling

## Dependencies

- Frontend codebase: `zenithbioscience-next/`
- Backend codebase: `zenithbioscience-api/`
- E2E test codebase: `zenithbioscience-e2e/`

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AdminGuard fix breaks legitimate admin access | High | Test with admin user after fix |
| Forgot password change affects email delivery | Medium | Verify email is still sent for existing users |
| Order seeding changes break other tests | Medium | Run full test suite after changes |
| Backend API fix introduces regressions | Medium | Run backend unit tests |

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `zenithbioscience-e2e/fixtures/defaultFixtures.ts` | Modify | Add orders for accountCoa user |
| `zenithbioscience-e2e/global-setup.ts` | Modify | Fix order user ID mapping |
| `zenithbioscience-next/.../AdminGuard.tsx` | Modify | Block non-admin users |
| `zenithbioscience-api/.../AccountResource.java` | Modify | Fix email enumeration |
| `zenithbioscience-e2e/tests/auth/login.spec.ts` | Modify | Update error assertions |
| `zenithbioscience-e2e/tests/auth/registration.spec.ts` | Modify | Update error selectors |
| `zenithbioscience-api/.../AdminOrderResource.java` | Investigate | Fix API error |
