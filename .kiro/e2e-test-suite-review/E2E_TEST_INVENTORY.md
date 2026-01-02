# E2E Test Suite Inventory

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total Test Files** | 37 |
| **Total Tests** | ~395 |
| **Property Test Files** | 8 |
| **Property Tests** | ~74 |
| **Page Object Files** | 27 |
| **Skipped Tests** | 4 (3 intentional, 1 conditional) |
| **Weak Assertions** | ~35+ instances |

---

## Test Distribution by Feature Area

| Feature Area | Files | Tests | Property Tests |
|--------------|-------|-------|----------------|
| Auth | 3 | 21 | 0 |
| Account | 12 | 113 | 0 |
| Cart | 5 | 29 | 12 |
| Checkout | 11 | 119 | 24 |
| Admin | 6 | 75 | 26 |
| Shop | 3 | 26 | 0 |
| Reporting | 2 | 17 | 17 |
| Smoke | 1 | 2 | 0 |
| **Total** | **43** | **~402** | **~79** |

---

## Detailed Inventory by Directory

### 1. Auth Tests (`e2e/tests/auth/`) - 3 files, 21 tests

| File | Tests | Issues |
|------|-------|--------|
| `login.spec.ts` | 10 | 3 weak assertions (OR-based) |
| `logout.spec.ts` | 4 | 2 weak assertions |
| `registration.spec.ts` | 7 | 2 weak assertions |

**Coverage:**
- ✅ Login with valid credentials (customer, admin)
- ✅ Login error handling (invalid credentials, unverified user)
- ✅ Logout functionality
- ✅ Registration form and validation
- ⚠️ Missing: Password reset flow tests

---

### 2. Account Tests (`e2e/tests/account/`) - 12 files, 113 tests

| File | Tests | Issues |
|------|-------|--------|
| `activation.spec.ts` | 9 | 1 weak assertion |
| `addresses.spec.ts` | 9 | 3 weak assertions |
| `coa-submission.spec.ts` | 11 | 4 weak assertions |
| `credits.spec.ts` | 14 | ✅ None |
| `dashboard.spec.ts` | 8 | ✅ None |
| `forgot-password.spec.ts` | 10 | 3 weak assertions |
| `gdpr.spec.ts` | 10 | ✅ None |
| `order-history.spec.ts` | 12 | 10 conditional skips |
| `password-change.spec.ts` | 11 | 1 weak assertion |
| `profile.spec.ts` | 9 | ✅ None |
| `resend-activation.spec.ts` | 8 | 3 weak assertions |
| `reset-password.spec.ts` | 15 | 4 weak assertions |

**Coverage:**
- ✅ Account activation
- ✅ Address management (CRUD)
- ✅ COA submission workflow
- ✅ Credits management
- ✅ Dashboard display
- ✅ Password management (change, forgot, reset)
- ✅ Profile management
- ✅ GDPR compliance features
- ⚠️ Order history has many conditional skips

---

### 3. Cart Tests (`e2e/tests/cart/`) - 5 files, 29 tests

| File | Tests | Property Tests | Issues |
|------|-------|----------------|--------|
| `add-to-cart.spec.ts` | 4 | 0 | ✅ None |
| `cart-management.spec.ts` | 7 | 0 | ✅ None |
| `cart-operations.property.spec.ts` | 6 | 6 | ✅ None |
| `coupon-application.spec.ts` | 6 | 0 | ✅ None |
| `coupon-calculation.property.spec.ts` | 6 | 6 | ✅ None |

**Coverage:**
- ✅ Add to cart functionality
- ✅ Cart quantity management
- ✅ Cart persistence
- ✅ Coupon application (percentage, fixed)
- ✅ Property: Cart total calculations
- ✅ Property: Coupon discount calculations

---

### 4. Checkout Tests (`e2e/tests/checkout/`) - 11 files, 119 tests

| File | Tests | Property Tests | Issues |
|------|-------|----------------|--------|
| `address-validation.spec.ts` | 21 | 0 | ✅ None |
| `bitcoin-accessibility.spec.ts` | 18 | 0 | Uses throw for skip |
| `bitcoin-error-handling.spec.ts` | 12 | 0 | Uses throw for skip |
| `bitcoin-payment-selection.spec.ts` | 8 | 0 | Uses throw for skip |
| `bitcoin-payment-status.spec.ts` | 13 | 0 | Uses throw for skip |
| `bitcoin-qr-generation.spec.ts` | 11 | 0 | 120s timeout |
| `bitcoin-websocket.spec.ts` | 10 | 0 | 10s waitForTimeout |
| `checkout-flow.spec.ts` | 10 | 0 | ✅ None |
| `checkout-summary.property.spec.ts` | 8 | 8 | ✅ None |
| `order-creation.property.spec.ts` | 8 | 8 | Uses test.slow() |
| `payment-processing.spec.ts` | 10 | 0 | 3 skipped tests |

**Coverage:**
- ✅ Address validation (all fields)
- ✅ Bitcoin payment flow (comprehensive)
- ✅ Checkout stepper navigation
- ✅ Order summary display
- ✅ Property: Checkout totals consistency
- ✅ Property: Order creation persistence
- ⚠️ Zelle and ACH payment tests skipped (not implemented)

---

### 5. Admin Tests (`e2e/tests/admin/`) - 6 files, 75 tests

| File | Tests | Property Tests | Issues |
|------|-------|----------------|--------|
| `admin-access.property.spec.ts` | 20 | 20 | Weak assertions (always pass) |
| `bitcoin-payments.spec.ts` | 25 | 0 | Weak assertions |
| `dashboard-access.spec.ts` | 9 | 0 | Weak assertions, excessive timeouts |
| `order-management.property.spec.ts` | 8 | 8 | ✅ None |
| `order-management.spec.ts` | 13 | 0 | ✅ None |
| `product-management.spec.ts` | 14 | 0 | ✅ None |

**Coverage:**
- ✅ Admin access control
- ✅ Dashboard display
- ✅ Order management (CRUD, status updates)
- ✅ Product management (CRUD)
- ✅ Bitcoin payments admin
- ✅ Property: Order status persistence
- ⚠️ Admin access tests have weak assertions

---

### 6. Shop Tests (`e2e/tests/shop/`) - 3 files, 26 tests

| File | Tests | Issues |
|------|-------|--------|
| `product-catalog.spec.ts` | 8 | 1 conditional skip |
| `product-detail.spec.ts` | 9 | Excessive timeouts |
| `product-search.spec.ts` | 12 | Weak assertion |

**Coverage:**
- ✅ Product catalog display
- ✅ Product detail page
- ✅ Search functionality
- ✅ Category filtering
- ✅ In-stock/on-sale filtering

---

### 7. Reporting Tests (`e2e/tests/reporting/`) - 2 files, 17 tests

| File | Tests | Property Tests | Issues |
|------|-------|----------------|--------|
| `api-logging.property.spec.ts` | 10 | 10 | ✅ None |
| `failure-artifacts.property.spec.ts` | 7 | 7 | ✅ None |

**Coverage:**
- ✅ API request logging
- ✅ Failure artifact capture
- ✅ Screenshot/trace/video configuration

---

### 8. Smoke Tests (`e2e/tests/`) - 1 file, 2 tests

| File | Tests | Issues |
|------|-------|--------|
| `smoke.spec.ts` | 2 | ✅ None |

---

## Property Tests Summary

| File | Property Count | Validates |
|------|----------------|-----------|
| `cart-operations.property.spec.ts` | 6 | Cart calculations |
| `coupon-calculation.property.spec.ts` | 6 | Coupon discounts |
| `checkout-summary.property.spec.ts` | 8 | Checkout consistency |
| `order-creation.property.spec.ts` | 8 | Order persistence |
| `admin-access.property.spec.ts` | 20 | Role-based access |
| `order-management.property.spec.ts` | 8 | Order status persistence |
| `api-logging.property.spec.ts` | 10 | Request logging |
| `failure-artifacts.property.spec.ts` | 7 | Artifact capture |
| **Total** | **73** | |

---

## Page Objects Summary

| Category | Files | Issues |
|----------|-------|--------|
| Root-level | 9 | 2 with fragile selectors |
| Account | 10 | 8 with MUI class selectors |
| Admin | 4 | 4 with MUI class selectors |
| Checkout | 1 | 1 with MUI class selectors |
| Components | 3 | 1 missing waits |
| **Total** | **27** | **16 with issues** |

**Selector Strategy Distribution:**
- Accessibility-based (getByRole, getByLabel, getByText): ~85%
- CSS/data-testid: ~15%
- Fragile MUI class selectors: 45+ instances

---

## Issues Identified

### Critical Issues

| Issue | Count | Impact |
|-------|-------|--------|
| Weak assertions (always pass) | 4 tests | Tests provide false confidence |
| Weak assertions (OR-based) | ~30 tests | Can mask failures |

### Moderate Issues

| Issue | Count | Impact |
|-------|-------|--------|
| Excessive timeouts (>10s) | 12+ tests | Slow test execution |
| Conditional test.skip() | 11 tests | Reduced coverage |
| MUI class selectors | 45+ instances | Fragile to UI changes |

### Files with No Issues
- `credits.spec.ts` ✅
- `dashboard.spec.ts` ✅
- `gdpr.spec.ts` ✅
- `profile.spec.ts` ✅
- `cart-operations.property.spec.ts` ✅
- `coupon-calculation.property.spec.ts` ✅
- `order-management.property.spec.ts` ✅
- `order-management.spec.ts` ✅
- `product-management.spec.ts` ✅


---

## Coverage Matrix

### Core Functionality Coverage

| Functionality | Test Files | Test Count | Coverage Status | Gaps |
|---------------|------------|------------|-----------------|------|
| **Authentication** | | | | |
| Login | login.spec.ts | 10 | ✅ Full | None |
| Logout | logout.spec.ts | 4 | ✅ Full | None |
| Registration | registration.spec.ts | 7 | ✅ Full | None |
| Password Reset | forgot-password.spec.ts, reset-password.spec.ts | 25 | ✅ Full | None |
| Account Activation | activation.spec.ts, resend-activation.spec.ts | 17 | ✅ Full | None |
| **Shopping Cart** | | | | |
| Add to Cart | add-to-cart.spec.ts | 4 | ✅ Full | None |
| Update Quantity | cart-management.spec.ts | 7 | ✅ Full | None |
| Remove Items | cart-management.spec.ts | 1 | ✅ Full | None |
| Cart Persistence | cart-management.spec.ts | 1 | ✅ Full | None |
| Cart Calculations | cart-operations.property.spec.ts | 6 | ✅ Full (Property) | None |
| Coupon Application | coupon-application.spec.ts, coupon-calculation.property.spec.ts | 12 | ✅ Full | None |
| **Checkout** | | | | |
| Address Entry | address-validation.spec.ts | 21 | ✅ Full | None |
| Stepper Navigation | checkout-flow.spec.ts | 3 | ✅ Full | None |
| Order Summary | checkout-summary.property.spec.ts | 8 | ✅ Full (Property) | None |
| Order Placement | order-creation.property.spec.ts | 8 | ✅ Full (Property) | None |
| **Payment Methods** | | | | |
| CashApp | checkout-flow.spec.ts, payment-processing.spec.ts | 3 | ✅ Full | None |
| Bitcoin | bitcoin-*.spec.ts (6 files) | 72 | ✅ Full | None |
| Solana Pay | payment-processing.spec.ts | 2 | ⚠️ Partial | Missing QR/wallet tests |
| Zelle | payment-processing.spec.ts | 0 | ❌ Missing | Tests skipped - not implemented |
| ACH | payment-processing.spec.ts | 0 | ❌ Missing | Tests skipped - not implemented |
| **Account Management** | | | | |
| Profile | profile.spec.ts | 9 | ✅ Full | None |
| Addresses | addresses.spec.ts | 9 | ✅ Full | None |
| Order History | order-history.spec.ts | 12 | ⚠️ Partial | 10 conditional skips |
| Credits | credits.spec.ts | 14 | ✅ Full | None |
| COA Submission | coa-submission.spec.ts | 11 | ✅ Full | None |
| GDPR | gdpr.spec.ts | 10 | ✅ Full | None |
| **Admin** | | | | |
| Dashboard Access | dashboard-access.spec.ts, admin-access.property.spec.ts | 29 | ✅ Full | None |
| Order Management | order-management.spec.ts, order-management.property.spec.ts | 21 | ✅ Full | None |
| Product Management | product-management.spec.ts | 14 | ✅ Full | None |
| Bitcoin Payments | bitcoin-payments.spec.ts | 25 | ✅ Full | None |
| User Management | admin-access.property.spec.ts | 2 | ⚠️ Partial | Missing CRUD tests |
| Coupon Management | - | 0 | ❌ Missing | No admin coupon tests |
| Batch Management | - | 0 | ❌ Missing | No batch management tests |
| **Shop** | | | | |
| Product Catalog | product-catalog.spec.ts | 8 | ✅ Full | None |
| Product Detail | product-detail.spec.ts | 9 | ✅ Full | None |
| Search | product-search.spec.ts | 12 | ✅ Full | None |

---

## Coverage Gaps Identified

### Critical Gaps (Missing Core Functionality)

| Gap | Severity | Requirements | Recommended Tests |
|-----|----------|--------------|-------------------|
| Zelle Payment Flow | High | 1.4 | Full payment flow with instructions display |
| ACH Payment Flow | High | 1.4 | Full payment flow with form validation |
| Admin Coupon Management | Medium | 6.3 | CRUD operations for coupons |
| Admin Batch Management | Medium | 6.3 | Batch creation, expiry tracking |
| Admin User Management | Medium | 6.3 | User CRUD, role assignment |

### Partial Coverage (Needs Enhancement)

| Area | Current State | Enhancement Needed |
|------|---------------|-------------------|
| Solana Pay | Selection only | QR code generation, wallet connection |
| Order History | 10 conditional skips | Ensure test data seeding |
| Admin Access Control | Weak assertions | Strengthen to actually verify redirects |

### Missing Property Tests

| Functionality | Suggested Property |
|---------------|-------------------|
| User Registration | Email uniqueness, password strength validation |
| Address Validation | ZIP code format, state/country consistency |
| Order Status Transitions | Valid state machine transitions |
| Product Inventory | Stock decrements on order, prevents overselling |

---

## Test Quality Metrics

### Assertion Strength Distribution

| Strength | Count | Percentage |
|----------|-------|------------|
| Strong (specific values) | ~320 | 80% |
| Moderate (existence + content) | ~45 | 11% |
| Weak (OR-based, existence only) | ~35 | 9% |

### Test Isolation

| Pattern | Count | Status |
|---------|-------|--------|
| Uses beforeEach cleanup | 35 files | ✅ Good |
| Uses serial mode for shared state | 8 files | ✅ Good |
| Potential race conditions | 3 files | ⚠️ Review needed |

### Documentation Quality

| Metric | Count | Percentage |
|--------|-------|------------|
| Files with JSDoc comments | 37/37 | 100% |
| Tests with requirements refs | ~60% | Needs improvement |
| Property tests with invariant docs | 8/8 | 100% |
