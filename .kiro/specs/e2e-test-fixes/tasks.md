# Implementation Plan: E2E Test Suite Fixes

## Overview

This implementation plan addresses critical issues in the E2E test suite including weak assertions, missing test data, and establishes a process for fixing production bugs discovered during testing. Tasks are organized to fix the most critical security-related tests first, then address data seeding, and finally add new validation tests.

## Tasks

- [x] 1. Fix Admin Dashboard Access Tests
  - [x] 1.1 Replace always-pass assertions in `dashboard-access.spec.ts`
    - Remove `expect(true).toBeTruthy()` patterns
    - Implement proper access denial verification
    - Verify either redirect away from /admin OR access denied message displayed
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Verify admin access denial property
    - **Property 2: Admin Access Denial Verification**
    - **Validates: Requirements 1.1, 1.2**

- [x] 2. Fix Admin Access Property Tests
  - [x] 2.1 Remove weak OR fallback conditions in `admin-access.property.spec.ts`
    - Remove `currentUrl.includes('/admin')` from OR assertions
    - Ensure tests verify actual access denial, not just URL presence
    - Update all 18 weak assertions identified in analysis
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Verify security test assertion validity
    - **Property 1: Security Test Assertion Validity**
    - **Validates: Requirements 1.3, 2.1, 2.3**

- [x] 3. Checkpoint - Admin Security Tests
  - Ensure all admin access tests pass with strengthened assertions
  - Verify tests properly fail when access control is bypassed
  - Ask the user if questions arise

- [x] 4. Fix Login Error Assertions
  - [x] 4.1 Strengthen error assertions in `login.spec.ts`
    - Replace `expect(hasError || stillOnLogin).toBeTruthy()` with specific error verification
    - Verify error message is visible and contains expected text
    - Test both invalid credentials and validation errors
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Fix Address Management Assertions
  - [x] 5.1 Replace triple-OR assertions in `addresses.spec.ts`
    - Remove fallback conditions that mask failures
    - Verify specific UI state after each operation
    - Check default badge visibility on correct address
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.2 Verify address operation UI consistency
    - **Property 4: Address Operation UI Consistency**
    - **Validates: Requirements 4.1, 4.3**

- [x] 6. Seed Order History Test Data
  - [x] 6.1 Add order fixtures to `defaultFixtures.ts`
    - Create 3+ orders with different statuses (PENDING, COMPLETED, SHIPPED)
    - Associate orders with test user account
    - Include varied order items and totals
    - _Requirements: 5.1, 5.2_

  - [x] 6.2 Implement order seeding function
    - Create `seedOrderHistoryData()` function
    - Integrate with existing fixture seeding process
    - Verify orders appear in test user's order history
    - _Requirements: 5.3_

  - [x] 6.3 Remove conditional skips from order history tests
    - Update `order-history.spec.ts` to use seeded data
    - Remove `test.skip()` conditions for missing orders
    - Enable all 10 previously skipped tests
    - _Requirements: 5.4_

  - [x] 6.4 Verify order history data availability
    - **Property 5: Order History Data Availability**
    - **Validates: Requirements 5.1, 5.3, 5.4**

- [x] 7. Checkpoint - Data Seeding Complete
  - Ensure order history tests run without skips
  - Verify all order statuses are testable
  - Ask the user if questions arise

- [x] 8. Fix Password Reset Assertions
  - [x] 8.1 Split and strengthen assertions in `forgot-password.spec.ts`
    - Separate success and error scenarios into distinct tests
    - Remove `expect(hasSuccess || hasError).toBeTruthy()` pattern
    - Verify specific success message for valid email
    - Verify specific error message for invalid email
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 9. Fix COA Submission Assertion
  - [x] 9.1 Replace always-pass assertion in `coa-submission.spec.ts`
    - Identify and fix the `expect(true).toBeTruthy()` pattern
    - Implement proper verification of COA submission state
    - _Requirements: 7.1, 7.2_

- [x] 10. Reduce Checkout Summary Tolerance
  - [x] 10.1 Update tolerance in `checkout-summary.property.spec.ts`
    - Change tolerance from 20% to 5%
    - Use `toBeCloseTo()` with 2 decimal places
    - Verify calculation accuracy for various cart configurations
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 10.2 Verify checkout total accuracy property
    - **Property 3: Checkout Total Accuracy**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 11. Add Registration Validation Tests
  - [x] 11.1 Add invalid email format test to `registration.spec.ts`
    - Test submission with malformed email
    - Verify email validation error is displayed
    - _Requirements: 9.1_

  - [x] 11.2 Add weak password test
    - Test submission with password that doesn't meet requirements
    - Verify password strength error is displayed
    - _Requirements: 9.2_

  - [x] 11.3 Add password mismatch test
    - Test submission with non-matching password confirmation
    - Verify mismatch error is displayed
    - _Requirements: 9.3_

  - [x] 11.4 Add duplicate email test
    - Test registration with existing user email
    - Verify duplicate email error is displayed
    - _Requirements: 9.4_

- [x] 12. Replace Fixed Timeouts with Condition-Based Waits
  - [x] 12.1 Audit and replace fixed timeouts across test files
    - Replace `page.waitForTimeout()` with `page.waitForSelector()` or `expect().toBeVisible()`
    - Use `waitForLoadState('networkidle')` where appropriate
    - Document any necessary fixed waits with justification
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 13. Create Bug Documentation File
  - [x] 13.1 Create `BUGS_FIXED.md` in spec directory
    - Document any production bugs discovered during test fixes
    - Include root cause, fix description, and verification test
    - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2_

- [x] 14. Final Checkpoint - All Tests Pass
  - Run full E2E test suite
  - Verify no regressions introduced
  - Confirm all previously skipped tests now run
  - Ensure all strengthened assertions pass
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive test coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- If production bugs are discovered during any task, fix them immediately and document in BUGS_FIXED.md
- Never weaken assertions to work around bugs - fix the root cause
