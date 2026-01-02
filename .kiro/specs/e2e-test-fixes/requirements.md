# Requirements Document

## Introduction

This specification addresses critical issues identified in the E2E test suite review. The fixes focus on strengthening weak assertions, restoring skipped tests through proper data seeding, and improving test reliability. The goal is to ensure the test suite provides accurate confidence in application behavior rather than false positives.

## Glossary

- **E2E_Test_Suite**: The Playwright-based end-to-end test collection for the Zenith Bioscience application
- **Assertion**: A test verification statement that checks expected behavior
- **Always_Pass_Assertion**: An assertion using `expect(true).toBeTruthy()` that provides no test value
- **OR_Based_Assertion**: An assertion using `expect(A || B).toBeTruthy()` that can mask failures
- **Test_Data_Seeding**: Pre-populating test fixtures with required data before test execution
- **Page_Object**: A class encapsulating page interactions and selectors
- **Property_Test**: A test verifying invariants that should hold across all valid inputs

## Requirements

### Requirement 1: Fix Always-Pass Assertions in Admin Dashboard Access Tests

**User Story:** As a QA engineer, I want admin access control tests to actually verify security behavior, so that I have confidence the admin dashboard is properly protected.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to the admin dashboard, THE E2E_Test_Suite SHALL verify the user is either redirected away from /admin OR shown an access denied message
2. WHEN a regular customer user navigates to the admin dashboard, THE E2E_Test_Suite SHALL verify the user is either redirected away from /admin OR shown an access denied message
3. THE E2E_Test_Suite SHALL NOT use `expect(true).toBeTruthy()` assertions in any security-related tests
4. IF an always-pass assertion is detected in dashboard-access.spec.ts, THEN THE E2E_Test_Suite SHALL replace it with a meaningful assertion that verifies actual behavior

### Requirement 2: Fix Weak OR-Based Assertions in Admin Access Property Tests

**User Story:** As a QA engineer, I want admin access property tests to provide accurate verification, so that security vulnerabilities are not masked by weak assertions.

#### Acceptance Criteria

1. WHEN verifying admin access control in admin-access.property.spec.ts, THE E2E_Test_Suite SHALL NOT include `currentUrl.includes('/admin')` as a passing condition in OR-based assertions
2. THE E2E_Test_Suite SHALL verify that non-admin users are actually denied access rather than accepting any URL containing '/admin' as valid
3. WHEN a property test checks role-based access, THE E2E_Test_Suite SHALL assert specific denial behavior (redirect OR access denied message) without fallback conditions that always pass

### Requirement 3: Strengthen Login Error Assertions

**User Story:** As a QA engineer, I want login error tests to verify specific error messages, so that I can confirm users receive appropriate feedback for invalid credentials.

#### Acceptance Criteria

1. WHEN a user submits invalid credentials, THE E2E_Test_Suite SHALL verify an error message is visible (not just check if user stayed on login page)
2. WHEN a user submits invalid credentials, THE E2E_Test_Suite SHALL verify the error message contains relevant text (e.g., "invalid", "incorrect", or "wrong")
3. THE E2E_Test_Suite SHALL NOT use `expect(hasError || stillOnLogin).toBeTruthy()` pattern for login error verification

### Requirement 4: Strengthen Address Management Assertions

**User Story:** As a QA engineer, I want address management tests to verify specific outcomes, so that I can confirm address operations complete successfully.

#### Acceptance Criteria

1. WHEN setting a default address, THE E2E_Test_Suite SHALL verify the specific address is marked as default (not accept multiple fallback conditions)
2. THE E2E_Test_Suite SHALL NOT use triple-OR assertions like `expect(isDefault || buttonNotVisible || anyDefault).toBeTruthy()`
3. WHEN an address operation completes, THE E2E_Test_Suite SHALL verify the expected UI state change occurred

### Requirement 5: Seed Order History Test Data

**User Story:** As a QA engineer, I want order history tests to run with seeded data, so that tests don't skip due to missing orders.

#### Acceptance Criteria

1. WHEN order-history.spec.ts tests execute, THE E2E_Test_Suite SHALL have pre-seeded orders available for the test user
2. THE E2E_Test_Suite SHALL NOT conditionally skip tests based on `isEmpty` checks when orders should exist
3. WHEN test data seeding is implemented, THE E2E_Test_Suite SHALL enable all 10 previously skipped order history tests
4. THE E2E_Test_Suite SHALL seed orders with various statuses (PENDING, COMPLETED, SHIPPED) to support tab filtering tests

### Requirement 6: Strengthen Password Reset Assertions

**User Story:** As a QA engineer, I want password reset tests to verify specific outcomes, so that I can confirm the reset flow works correctly.

#### Acceptance Criteria

1. WHEN testing forgot-password functionality, THE E2E_Test_Suite SHALL verify specific success OR error messages (not accept either as valid)
2. WHEN testing invalid email format, THE E2E_Test_Suite SHALL verify a validation error is shown
3. WHEN testing valid email submission, THE E2E_Test_Suite SHALL verify a success message is shown
4. THE E2E_Test_Suite SHALL NOT use `expect(hasSuccess || hasError).toBeTruthy()` pattern

### Requirement 7: Fix COA Submission Always-Pass Assertion

**User Story:** As a QA engineer, I want COA submission tests to verify actual behavior, so that the COA workflow is properly tested.

#### Acceptance Criteria

1. THE E2E_Test_Suite SHALL NOT use `expect(true).toBeTruthy()` in coa-submission.spec.ts
2. WHEN no orders exist for COA submission, THE E2E_Test_Suite SHALL verify the appropriate empty state message is displayed
3. WHEN COA submission elements are checked, THE E2E_Test_Suite SHALL verify specific element visibility rather than accepting any state

### Requirement 8: Reduce Checkout Summary Price Tolerance

**User Story:** As a QA engineer, I want checkout summary property tests to use appropriate tolerances, so that price calculation errors are detected.

#### Acceptance Criteria

1. WHEN verifying checkout totals in checkout-summary.property.spec.ts, THE E2E_Test_Suite SHALL use a maximum 5% tolerance (not 20%)
2. THE E2E_Test_Suite SHALL detect price calculation discrepancies greater than 5%
3. WHEN price tolerance is reduced, THE E2E_Test_Suite SHALL still account for legitimate rounding differences

### Requirement 9: Add Registration Form Validation Tests

**User Story:** As a QA engineer, I want registration form validation to be comprehensively tested, so that invalid registrations are properly rejected.

#### Acceptance Criteria

1. WHEN a user submits an invalid email format, THE E2E_Test_Suite SHALL verify a validation error is displayed
2. WHEN a user submits a weak password, THE E2E_Test_Suite SHALL verify a validation error is displayed
3. WHEN a user submits mismatched passwords, THE E2E_Test_Suite SHALL verify a validation error is displayed
4. WHEN a user submits an already-registered email, THE E2E_Test_Suite SHALL verify a duplicate email error is displayed

### Requirement 10: Replace Fixed Timeouts with Condition-Based Waits

**User Story:** As a QA engineer, I want tests to use condition-based waits instead of fixed timeouts, so that tests are faster and more reliable.

#### Acceptance Criteria

1. WHEN waiting for UI updates, THE E2E_Test_Suite SHALL use `waitFor` with specific conditions instead of `waitForTimeout`
2. THE E2E_Test_Suite SHALL replace arbitrary `wait(500)` or `wait(1000)` calls with condition-based waits where possible
3. WHEN fixed timeouts are necessary, THE E2E_Test_Suite SHALL document the reason in a code comment

### Requirement 11: Fix Production Bugs Discovered During Test Fixes

**User Story:** As a developer, I want production bugs discovered during test fixes to be immediately fixed, so that the application behavior is corrected and tests verify real functionality.

#### Acceptance Criteria

1. WHEN a test fix reveals a production bug, THE Developer SHALL fix the production bug before completing the test fix
2. WHEN a production bug is discovered, THE E2E_Test_Suite SHALL NOT weaken assertions to make tests pass around buggy behavior
3. WHEN a production bug is fixed, THE E2E_Test_Suite SHALL include a comment documenting what was fixed (e.g., `// Fixed: Admin redirect was not triggering for non-admin users`)
4. THE E2E_Test_Suite SHALL NOT use `test.skip()` or `test.fixme()` to avoid fixing production bugs
5. THE E2E_Test_Suite SHALL maintain a log of production bugs discovered and fixed during test fixes in a BUGS_FIXED.md file

### Requirement 12: Production Bug Resolution Process

**User Story:** As a developer, I want a clear process for handling production bugs found during testing, so that bugs are fixed systematically and documented for future reference.

#### Acceptance Criteria

1. WHEN a production bug is discovered, THE Developer SHALL document in BUGS_FIXED.md:
   - Bug description and root cause
   - Expected vs actual behavior before fix
   - Files modified to fix the bug
   - Test file(s) that now verify correct behavior
2. WHEN fixing a production bug, THE Developer SHALL categorize it as:
   - Security issue (admin access, authentication)
   - Data integrity issue (calculations, persistence)
   - UI/UX issue (display, navigation)
   - Validation issue (form validation, input handling)
3. WHEN a production bug is found, THE Developer SHALL fix the production code first, then complete the test fix
4. THE E2E_Test_Suite SHALL NOT create simplified or workaround tests to avoid production bugs
5. THE Developer SHALL persist until the actual problem is solved - giving up is not an option
