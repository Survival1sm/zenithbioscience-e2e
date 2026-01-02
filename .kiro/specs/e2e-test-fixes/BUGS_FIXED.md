# Bugs Fixed During E2E Test Suite Improvements

## Overview

This spec focused on **improving test assertion quality** rather than fixing production bugs. The E2E test suite had numerous weak assertions that would always pass regardless of actual application behavior. These were systematically identified and replaced with meaningful assertions that properly verify expected outcomes.

## No Production Bugs Found

During the implementation of this spec, **no production bugs were discovered**. The issues addressed were entirely within the test code itself - specifically, assertions that were too weak to catch actual failures.

## Test Quality Improvements Made

The following categories of test improvements were implemented:

### 1. Always-Pass Assertion Removal

**Files Modified:**
- `tests/admin/dashboard-access.spec.ts`
- `tests/account/coa-submission.spec.ts`

**Issue:** Tests used `expect(true).toBeTruthy()` patterns that would always pass regardless of actual behavior.

**Fix:** Replaced with meaningful assertions that verify:
- Unauthenticated users cannot access admin dashboard with full functionality
- Regular users are denied admin access (redirect OR access denied message)
- COA submission page displays appropriate state based on available orders

### 2. Weak OR-Based Assertion Fixes

**Files Modified:**
- `tests/admin/admin-access.property.spec.ts`
- `tests/auth/login.spec.ts`
- `tests/account/addresses.spec.ts`
- `tests/account/forgot-password.spec.ts`

**Issue:** Assertions like `expect(A || B || C).toBeTruthy()` where one condition always evaluated to true, masking actual failures.

**Fix:** 
- Removed fallback conditions that always pass (e.g., `currentUrl.includes('/admin')`)
- Split compound assertions into specific scenario tests
- Added proper verification of expected UI states

### 3. Login Error Assertion Strengthening

**File Modified:** `tests/auth/login.spec.ts`

**Issue:** `expect(hasError || stillOnLogin).toBeTruthy()` accepted staying on login page without error as valid.

**Fix:** Now verifies:
- Error alert is visible when invalid credentials are submitted
- Error message contains relevant text (invalid, incorrect, wrong, etc.)
- Specific error scenarios are tested separately

### 4. Address Management Assertion Fixes

**File Modified:** `tests/account/addresses.spec.ts`

**Issue:** Triple-OR assertions like `expect(isDefault || buttonNotVisible || anyDefault).toBeTruthy()` masked failures.

**Fix:** Now verifies:
- Specific address card shows default badge after setting as default
- Address count changes appropriately after add/delete operations
- Validation errors are displayed for invalid input

### 5. Password Reset Test Separation

**File Modified:** `tests/account/forgot-password.spec.ts`

**Issue:** `expect(hasSuccess || hasError).toBeTruthy()` accepted either outcome as valid.

**Fix:** Separated into distinct tests:
- Success message verification for valid email submission
- Validation error verification for invalid email format
- Security test for non-existent email (no information leak)

### 6. Checkout Summary Tolerance Reduction

**File Modified:** `tests/checkout/checkout-summary.property.spec.ts`

**Issue:** 20% tolerance was too lenient to catch calculation errors.

**Fix:** 
- Reduced tolerance to 5% for price comparisons
- Used `toBeCloseTo()` with 2 decimal places for currency precision
- Added proper error handling for parsing failures

### 7. Registration Validation Tests Added

**File Modified:** `tests/auth/registration.spec.ts`

**New Tests Added:**
- Invalid email format validation (Requirement 9.1)
- Weak password validation (Requirement 9.2)
- Password mismatch validation (Requirement 9.3)
- Duplicate email validation (Requirement 9.4)

### 8. Order History Test Data Seeding

**Files Modified:**
- `fixtures/defaultFixtures.ts`
- `tests/account/order-history.spec.ts`

**Issue:** 10 tests were conditionally skipped due to missing order data.

**Fix:**
- Added order fixtures with various statuses (PENDING, COMPLETED, SHIPPED)
- Implemented order seeding function
- Enabled previously skipped tests

### 9. Fixed Timeout Replacements

**Files Modified:** Multiple test files

**Issue:** Tests used arbitrary `page.waitForTimeout()` calls that made tests slow and flaky.

**Fix:** Replaced with condition-based waits:
- `page.waitForSelector()` for element visibility
- `expect().toBeVisible()` with appropriate timeouts
- `waitForLoadState('networkidle')` where appropriate
- Documented any necessary fixed waits with justification

## Security Note

One potential security concern was documented in `forgot-password.spec.ts`:

> **Observation:** The backend may return different responses for existing vs non-existing emails during password reset, which could enable email enumeration attacks.

This is documented as a security best practice recommendation, not a confirmed bug. The test includes a warning comment if the backend leaks email existence information.

## Verification

All test improvements can be verified by:
1. Running the full E2E test suite: `npx playwright test`
2. Confirming tests now properly fail when expected behavior is not met
3. Verifying no `expect(true).toBeTruthy()` patterns remain in security-related tests

## Conclusion

This spec successfully improved the reliability and accuracy of the E2E test suite by replacing weak assertions with meaningful verifications. The test suite now provides accurate confidence in application behavior rather than false positives.
