# Page Objects Inventory

## Summary

| Metric | Count |
|--------|-------|
| Total Page Object Files | 27 |
| Total Page Object Classes | 27 |
| Accessibility-Based Selectors | ~85% |
| CSS/Data-testid Selectors | ~15% |
| Files with Fragile Selectors | 8 |
| Files Missing Waits in Actions | 3 |

---

## Root-Level Page Objects

### 1. BasePage.ts
**Class:** `BasePage` (abstract)

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 2 | `getByRole('dialog')`, `getByRole('button', { name: 'I am 21+' })` |
| getByTestId | 1 | `getByTestId(testId)` helper method |
| getByText | 1 | `getByText(text)` |

**Issues Found:**
- ✅ No fragile selectors
- ✅ All action methods include waits (`waitForPageLoad`, `waitForElement`)
- ✅ Good base class with reusable wait utilities

---

### 2. CartPage.ts
**Class:** `CartPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 5 | `getByRole('heading')`, `getByRole('button')`, `getByRole('link')`, `getByRole('spinbutton')`, `getByRole('alert')` |
| getByLabel | 1 | `getByLabel('Coupon Code')` |
| getByText | 3 | `getByText('Your cart is empty')`, `getByText('Subtotal:')`, `getByText('Discount:')` |
| data-testid | 5 | `[data-testid="cart-items-container"]`, `[data-testid="desktop-cart-items"]`, `[data-testid="mobile-cart-items"]`, `[data-testid="mobile-cart-item"]`, `[data-testid="mobile-cart-item-remove"]` |
| CSS class | 2 | `.MuiAlert-standardError`, `.MuiAlert-standardSuccess` |

**Issues Found:**
- ⚠️ **Fragile selectors:** `.MuiAlert-standardError`, `.MuiAlert-standardSuccess` - MUI class names can change
- ⚠️ **Complex XPath:** `locator('..').locator('xpath=following-sibling::*[1]')` for subtotal/discount
- ✅ Action methods include waits (`waitForTimeout`)

---

### 3. CheckoutPage.ts
**Class:** `CheckoutPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 15 | `getByRole('heading')`, `getByRole('link')`, `getByRole('textbox')`, `getByRole('radiogroup')`, `getByRole('radio')`, `getByRole('button')`, `getByRole('checkbox')` |
| getByLabel | 2 | `getByLabel('Country')`, `getByLabel(/coupon/i)` |
| getByText | 3 | `getByText('Payment Method')`, `getByText('No payment methods')` |
| data-testid | 5 | `[data-testid="checkout-form"]`, `[data-testid="research-acknowledgment-box"]`, `[data-testid="solana-pay-selector"]`, `[data-testid="cashapp-payment-form"]`, `[data-testid="checkout-order-summary-container"]` |
| CSS class | 3 | `.MuiStepper-root`, `.MuiStep-root`, `.Mui-active` |

**Issues Found:**
- ⚠️ **Fragile selectors:** `.MuiStepper-root`, `.MuiStep-root`, `.Mui-active` - MUI class names
- ✅ Good use of accessibility-based selectors for form fields
- ✅ Action methods include waits

---

### 4. LoginPage.ts
**Class:** `LoginPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 8 | `getByRole('textbox', { name: 'Email address for login' })`, `getByRole('button', { name: 'Sign In' })`, `getByRole('checkbox')`, `getByRole('alert')`, `getByRole('link')` |

**Issues Found:**
- ✅ **Excellent** - 100% accessibility-based selectors
- ✅ All action methods include waits
- ✅ No fragile selectors

---

### 5. OrderConfirmationPage.ts
**Class:** `OrderConfirmationPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 5 | `getByRole('heading')`, `getByRole('link')`, `getByRole('alert')` |
| getByText | 5 | `getByText(/order number/i)`, `getByText(/payment method/i)`, `getByText(/subtotal/i)` |
| data-testid | 2 | `[data-testid="CheckCircleIcon"]`, `[data-testid="solana-pay-qr"]` |
| CSS locator | 1 | `locator('table')` |

**Issues Found:**
- ⚠️ **Fragile selector:** `locator('table')` - generic element selector
- ⚠️ **Complex XPath:** `locator('../..')` for totalRow
- ✅ Action methods include waits

---

### 6. OrderHistoryPage.ts
**Class:** `OrderHistoryPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 6 | `getByRole('heading')`, `getByRole('tablist')`, `getByRole('tab')`, `getByRole('link')` |
| getByText | 3 | `getByText(/you haven't placed any orders/i)`, `getByText(/no active orders/i)` |
| CSS class | 5 | `.MuiDataGrid-root`, `.MuiDataGrid-row`, `.MuiSkeleton-root`, `.MuiChip-root`, `.MuiTypography-subtitle1` |
| CSS role | 3 | `[role="rowgroup"]`, `[role="row"]`, `[role="gridcell"]` |
| data-testid | 2 | `[data-testid^="orders-list-mobile"]`, `[data-testid^="orders-list-card-list-item-"]` |

**Issues Found:**
- ⚠️ **Fragile selectors:** Multiple MUI class selectors (`.MuiDataGrid-*`, `.MuiChip-root`, `.MuiTypography-subtitle1`)
- ⚠️ **Complex CSS:** `[data-testid^="orders-list-mobile"] .MuiCard-root`
- ✅ Action methods include waits

---

### 7. ProductDetailPage.ts
**Class:** `ProductDetailPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 3 | `getByRole('heading', { level: 1 })`, `getByRole('button', { name: 'Add to Cart' })`, `getByRole('link')` |
| getByLabel | 1 | `getByLabel('Quantity')` |
| getByText | 2 | `getByText('Failed to load product')`, `getByText('404')` |
| CSS class | 1 | `.MuiChip-label` |

**Issues Found:**
- ⚠️ **Fragile selector:** `.MuiChip-label` for out of stock chip
- ✅ Good accessibility-based selectors for main interactions
- ✅ Action methods include waits

---

### 8. RegisterPage.ts
**Class:** `RegisterPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 10 | `getByRole('heading')`, `getByRole('textbox')`, `getByRole('button')`, `getByRole('checkbox')`, `getByRole('alert')`, `getByRole('link')` |

**Issues Found:**
- ✅ **Excellent** - 100% accessibility-based selectors
- ✅ All action methods include waits
- ✅ No fragile selectors

---

### 9. ShopPage.ts
**Class:** `ShopPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 12 | `getByRole('heading')`, `getByRole('textbox')`, `getByRole('combobox')`, `getByRole('checkbox')`, `getByRole('navigation')`, `getByRole('button')`, `getByRole('option')`, `getByRole('link')`, `getByRole('status')` |
| getByTestId | 1 | `getByTestId('mobile-filter-accordion')` |
| CSS locator | 2 | `locator('#filter-header')`, `locator('[aria-label="Product listing"]')` |

**Issues Found:**
- ⚠️ **Fragile selector:** `locator('#filter-header')` - ID selector
- ✅ Excellent use of accessibility-based selectors
- ✅ Action methods include waits

---

## Account Page Objects

### 10. AccountDashboardPage.ts
**Class:** `AccountDashboardPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 5 | `getByRole('heading')`, `getByRole('link')` |
| getByText | 2 | `getByText(/welcome back/i)`, `getByText(/you haven't placed any orders/i)` |
| CSS class | 5 | `.MuiPaper-root`, `.MuiChip-root`, `.MuiSkeleton-root`, `.MuiTypography-body2` |

**Issues Found:**
- ⚠️ **Fragile selectors:** Multiple MUI class selectors
- ✅ Action methods include waits

---

### 11. ActivationPage.ts
**Class:** `ActivationPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 3 | `getByRole('heading')`, `getByRole('progressbar')`, `getByRole('button')` |
| getByText | 1 | `getByText('Activating your account...')` |
| CSS class | 2 | `.MuiAlert-standardSuccess`, `.MuiAlert-standardError` |

**Issues Found:**
- ⚠️ **Fragile selectors:** MUI Alert class selectors
- ✅ Action methods include waits

---

### 12. AddressBookPage.ts
**Class:** `AddressBookPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 6 | `getByRole('heading')`, `getByRole('button')`, `getByRole('textbox')`, `getByRole('checkbox')`, `getByRole('listbox')`, `getByRole('option')` |
| getByLabel | 1 | `getByLabel('Address Type')` |
| CSS class | 8 | `.MuiCard-root`, `.MuiDialog-root`, `.MuiDialogTitle-root`, `.MuiCircularProgress-root`, `.MuiSnackbar-root`, `.MuiAlert-root`, `.MuiSelect-select`, `.MuiFormHelperText-root.Mui-error` |
| CSS locator | 3 | `locator('h6:has-text("Billing Addresses")')`, `locator('[name="state"]')`, `locator('[name="country"]')` |

**Issues Found:**
- ⚠️ **Fragile selectors:** Many MUI class selectors
- ⚠️ **Complex CSS:** `locator('h6:has-text("...")').locator('..').getByRole('button')`
- ✅ Action methods include waits

---

### 13. CoaSubmissionPage.ts
**Class:** `CoaSubmissionPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 8 | `getByRole('heading')`, `getByRole('tab')`, `getByRole('button')`, `getByRole('textbox')`, `getByRole('dialog')`, `getByRole('alert')` |
| getByLabel | 3 | `getByLabel('Select Order')`, `getByLabel('Select Batch')`, `getByLabel('Test Date')` |
| CSS class | 5 | `.MuiStepper-root`, `.MuiStepLabel-label`, `.MuiStep-root`, `.MuiCircularProgress-root`, `.MuiSnackbar-root` |
| CSS locator | 2 | `locator('input[type="file"]')`, `locator('.MuiMenuItem-root')` |

**Issues Found:**
- ⚠️ **Fragile selectors:** MUI Stepper class selectors
- ✅ Action methods include waits

---

### 14. CreditsPage.ts
**Class:** `CreditsPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 4 | `getByRole('heading')`, `getByRole('button')`, `getByRole('option')` |
| getByText | 4 | `getByText(/Available Balance/i)`, `getByText(/Total Earned/i)`, `getByText(/Credit Type/i)` |
| CSS class | 8 | `.MuiCard-root`, `.MuiCircularProgress-root`, `.MuiAlert-standardError`, `.MuiAlert-standardWarning`, `.MuiTypography-h4`, `.MuiTypography-h6`, `.MuiChip-root`, `.MuiPagination-root` |
| CSS locator | 2 | `locator('svg[data-testid="RefreshIcon"]')`, `locator('table')` |

**Issues Found:**
- ⚠️ **Fragile selectors:** Many MUI class selectors
- ⚠️ **Fragile selector:** `locator('table')` - generic element
- ✅ Action methods include waits

---

### 15. ForgotPasswordPage.ts
**Class:** `ForgotPasswordPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 4 | `getByRole('heading')`, `getByRole('button')`, `getByRole('link')`, `getByRole('progressbar')` |
| getByLabel | 1 | `getByLabel('Email Address')` |
| CSS class | 2 | `.MuiAlert-standardSuccess`, `.MuiAlert-standardError` |

**Issues Found:**
- ⚠️ **Fragile selectors:** MUI Alert class selectors
- ✅ Action methods include waits

---

### 16. GdprPage.ts
**Class:** `GdprPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 6 | `getByRole('heading')`, `getByRole('button')`, `getByRole('dialog')`, `getByRole('checkbox')`, `getByRole('alert')`, `getByRole('link')` |
| getByLabel | 2 | `getByLabel(/amount/i)`, `getByLabel(/reason/i)` |
| CSS class | 3 | `.MuiChip-root`, `svg[class*="MuiCircularProgress"]` |
| data-testid | 1 | `[data-testid="compliance-status-select"]` |

**Issues Found:**
- ⚠️ **Fragile selector:** `svg[class*="MuiCircularProgress"]`
- ✅ Action methods include waits

---

### 17. PasswordChangePage.ts
**Class:** `PasswordChangePage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 5 | `getByRole('heading')`, `getByRole('textbox')`, `getByRole('button')`, `getByRole('alert')` |
| getByText | 1 | `getByText(/Password must be at least/i)` |
| CSS class | 1 | `.MuiTextField-root` (via XPath) |

**Issues Found:**
- ✅ Mostly accessibility-based selectors
- ✅ Action methods include waits

---

### 18. ProfilePage.ts
**Class:** `ProfilePage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 6 | `getByRole('heading')`, `getByRole('textbox')`, `getByRole('checkbox')`, `getByRole('button')` |
| CSS class | 4 | `.MuiSnackbar-root`, `.MuiAlert-root`, `.MuiCircularProgress`, `.MuiFormHelperText-root.Mui-error` |
| CSS locator | 1 | `locator('form')` |

**Issues Found:**
- ⚠️ **Fragile selectors:** MUI Snackbar/Alert class selectors
- ⚠️ **Fragile selector:** `locator('form')` - generic element
- ✅ Action methods include waits

---

### 19. ResendActivationPage.ts
**Class:** `ResendActivationPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 4 | `getByRole('heading')`, `getByRole('button')`, `getByRole('link')`, `getByRole('progressbar')` |
| getByLabel | 1 | `getByLabel('Email Address')` |
| CSS class | 2 | `.MuiAlert-standardSuccess`, `.MuiAlert-standardError` |

**Issues Found:**
- ⚠️ **Fragile selectors:** MUI Alert class selectors
- ✅ Action methods include waits

---

### 20. ResetPasswordPage.ts
**Class:** `ResetPasswordPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 5 | `getByRole('heading')`, `getByRole('textbox')`, `getByRole('button')`, `getByRole('link')`, `getByRole('alert')` |
| getByText | 2 | `getByText('Invalid or missing reset key')`, `getByText(/Password must be at least/i)` |
| CSS class | 3 | `.MuiAlert-standardSuccess`, `.MuiAlert-standardError`, `.MuiCircularProgress`, `.MuiTextField-root` |

**Issues Found:**
- ⚠️ **Fragile selectors:** MUI Alert/Progress class selectors
- ✅ Action methods include waits

---

## Admin Page Objects

### 21. AdminDashboardPage.ts
**Class:** `AdminDashboardPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 3 | `getByRole('heading')`, `getByRole('link')`, `getByRole('button')` |
| getByText | 4 | `getByText(/total orders/i)`, `getByText(/batch expiry warnings/i)` |
| CSS class | 5 | `.MuiPaper-root`, `.MuiCard-root`, `.MuiCircularProgress-root`, `.MuiAlert-root`, `.MuiTypography-h4` |
| CSS locator | 2 | `locator('text=/total batches/i')`, XPath for sibling elements |

**Issues Found:**
- ⚠️ **Fragile selectors:** MUI class selectors
- ⚠️ **Complex XPath:** `locator('xpath=preceding-sibling::*[1]')` for stats
- ✅ Action methods include waits

---

### 22. AdminOrdersPage.ts
**Class:** `AdminOrdersPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 6 | `getByRole('heading')`, `getByRole('tab')`, `getByRole('button')`, `getByRole('option')`, `getByRole('dialog')` |
| data-testid | 3 | `[data-testid="admin-orders-data-grid"]`, `[data-testid^="admin-order-card-"]`, `[data-testid$="-order-number"]` |
| CSS class | 6 | `.MuiCircularProgress-root`, `.MuiAlert-root`, `.MuiTabs-root`, `.MuiDataGrid-row`, `.MuiDataGrid-cell`, `.MuiDialog-root`, `.MuiSnackbar-root` |

**Issues Found:**
- ⚠️ **Fragile selectors:** MUI DataGrid class selectors
- ✅ Good use of data-testid for card components
- ✅ Action methods include waits

---

### 23. AdminProductsPage.ts
**Class:** `AdminProductsPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 6 | `getByRole('heading')`, `getByRole('button')`, `getByRole('tab')`, `getByRole('option')` |
| data-testid | 3 | `[data-testid="admin-products-data-grid"]`, `[data-testid^="product-card-"]`, `[data-testid$="-name"]` |
| CSS class | 5 | `.MuiCircularProgress-root`, `.MuiAlert-root`, `.MuiDataGrid-row`, `.MuiDialog-root`, `.MuiSnackbar-root` |
| CSS locator | 3 | `locator('#name')`, `locator('#description')`, `locator('#category')` |

**Issues Found:**
- ⚠️ **Fragile selectors:** ID selectors (`#name`, `#description`, `#category`)
- ⚠️ **Fragile selectors:** MUI class selectors
- ✅ Good use of data-testid for card components
- ✅ Action methods include waits

---

### 24. BitcoinPaymentsPage.ts
**Class:** `BitcoinPaymentsPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 5 | `getByRole('heading')`, `getByRole('button')`, `getByRole('option')` |
| getByLabel | 2 | `getByLabel(/transaction id/i)`, `getByLabel(/btc address/i)` |
| getByText | 2 | `getByText(/total payments/i)`, `getByText(/underpaid/i)` |
| data-testid | 2 | `[data-testid="bitcoin-statistics"]`, `[data-testid="compliance-status-select"]` |
| CSS class | 6 | `.MuiCircularProgress-root`, `.MuiTableContainer-root`, `.MuiTableHead-root`, `.MuiTableBody-root`, `.MuiTableRow-root`, `.MuiTablePagination-root`, `.MuiChip-root`, `.MuiSnackbar-root` |
| CSS locator | 4 | `locator('[id="status-filter"]')`, `locator('[aria-label="Go to next page"]')`, `locator('a[href*="blockstream.info"]')` |

**Issues Found:**
- ⚠️ **Fragile selectors:** MUI Table class selectors
- ⚠️ **Fragile selector:** ID selectors for filters
- ✅ Action methods include waits

---

## Checkout Page Objects

### 25. BitcoinPaymentPage.ts
**Class:** `BitcoinPaymentPage`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| getByRole | 8 | `getByRole('radio')`, `getByRole('heading')`, `getByRole('button')`, `getByRole('status')`, `getByRole('timer')`, `getByRole('alert')`, `getByRole('link')`, `getByRole('progressbar')` |
| getByLabel | 6 | `getByLabel('Bitcoin payment method')`, `getByLabel(/percent discount/i)`, `getByLabel(/toggle bitcoin payment help/i)`, `getByLabel('Bitcoin payment QR code')`, `getByLabel(/copy bitcoin address/i)`, `getByLabel(/generate new bitcoin invoice/i)` |
| getByText | 4 | `getByText(/10-60 min.*confirmations/i)`, `getByText(/secure on-chain payment/i)`, `getByText(/rate.*1 BTC.*\$/i)` |
| CSS class | 3 | `.MuiAlert-root`, `.MuiChip-root`, `.MuiStepLabel-label` |
| CSS locator | 3 | `locator('svg').first()`, `locator('[aria-labelledby="bitcoin-progress-title"]')`, `locator('#bitcoin-progress-title')` |

**Issues Found:**
- ⚠️ **Fragile selectors:** MUI class selectors for alerts/chips/steps
- ✅ Excellent use of aria-label for accessibility
- ✅ Action methods include waits

---

## Component Page Objects

### 26. CartDrawer.ts
**Class:** `CartDrawer`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| data-testid | 12 | `[data-testid="cart-drawer"]`, `[data-testid="cart-drawer-close"]`, `[data-testid="cart-items"]`, `[data-testid="cart-item"]`, `[data-testid="cart-item-name"]`, `[data-testid="cart-item-price"]`, `[data-testid="cart-item-quantity"]`, `[data-testid="cart-item-remove"]`, `[data-testid="cart-total"]`, `[data-testid="checkout-button"]`, `[data-testid="empty-cart-message"]`, `[data-testid="cart-loading"]` |

**Issues Found:**
- ✅ **Excellent** - 100% data-testid selectors (consistent pattern)
- ⚠️ **Missing waits:** Some action methods don't include explicit waits (e.g., `incrementItemQuantity`, `decrementItemQuantity`)
- ⚠️ **Potential issue:** These data-testid selectors may not exist in the actual implementation

---

### 27. Footer.ts
**Class:** `Footer`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| data-testid | 9 | `[data-testid="footer"]`, `[data-testid="footer-links"]`, `[data-testid="footer-link"]`, `[data-testid="social-links"]`, `[data-testid="social-link"]`, `[data-testid="footer-copyright"]`, `[data-testid="newsletter-form"]`, `[data-testid="newsletter-input"]`, `[data-testid="newsletter-button"]` |

**Issues Found:**
- ✅ **Excellent** - 100% data-testid selectors (consistent pattern)
- ⚠️ **Potential issue:** These data-testid selectors may not exist in the actual implementation
- ✅ Action methods include waits

---

### 28. Header.ts
**Class:** `Header`

**Selector Strategy Breakdown:**
| Strategy | Count | Examples |
|----------|-------|----------|
| data-testid | 11 | `[data-testid="header-logo"]`, `[data-testid="nav-shop"]`, `[data-testid="nav-cart"]`, `[data-testid="nav-account"]`, `[data-testid="search-input"]`, `[data-testid="search-button"]`, `[data-testid="cart-icon"]`, `[data-testid="cart-count"]`, `[data-testid="user-menu"]`, `[data-testid="login-button"]`, `[data-testid="logout-button"]` |
| CSS class | 1 | `.MuiBadge-badge` |
| CSS locator | 1 | `locator('[aria-label*="Navigate to cart page with"]')` |

**Issues Found:**
- ✅ Mostly data-testid selectors (consistent pattern)
- ⚠️ **Fragile selector:** `.MuiBadge-badge` for cart count
- ⚠️ **Potential issue:** These data-testid selectors may not exist in the actual implementation
- ✅ Action methods include waits

---

## Issues Summary

### Fragile Selectors by Category

| Category | Count | Files Affected |
|----------|-------|----------------|
| MUI Class Names (`.Mui*`) | 45+ | CartPage, CheckoutPage, OrderHistoryPage, AccountDashboardPage, ActivationPage, AddressBookPage, CoaSubmissionPage, CreditsPage, ForgotPasswordPage, ProfilePage, ResendActivationPage, ResetPasswordPage, AdminDashboardPage, AdminOrdersPage, AdminProductsPage, BitcoinPaymentsPage, BitcoinPaymentPage, Header |
| Generic Element Selectors (`table`, `form`) | 4 | OrderConfirmationPage, CreditsPage, ProfilePage |
| ID Selectors (`#name`, `#filter-header`) | 5 | ShopPage, AdminProductsPage, BitcoinPaymentsPage |
| Complex XPath | 6 | CartPage, OrderConfirmationPage, AdminDashboardPage, PasswordChangePage |

### Missing Waits

| File | Methods Missing Waits |
|------|----------------------|
| CartDrawer.ts | `incrementItemQuantity`, `decrementItemQuantity` |

### Duplicated Selector Logic

| Pattern | Files |
|---------|-------|
| MUI Alert success/error | ActivationPage, ForgotPasswordPage, ResendActivationPage, ResetPasswordPage, ProfilePage |
| MUI DataGrid rows | OrderHistoryPage, AdminOrdersPage, AdminProductsPage |
| MUI Snackbar alerts | AddressBookPage, ProfilePage, AdminOrdersPage, AdminProductsPage, BitcoinPaymentsPage |

---

## Recommendations

1. **Replace MUI class selectors** with data-testid or aria-label attributes where possible
2. **Add data-testid attributes** to components that currently rely on MUI class names
3. **Standardize alert handling** - create a shared utility for MUI Alert/Snackbar interactions
4. **Add explicit waits** to CartDrawer increment/decrement methods
5. **Verify data-testid existence** in CartDrawer, Footer, and Header components
6. **Replace generic selectors** (`table`, `form`) with more specific locators
7. **Simplify XPath usage** by adding appropriate data-testid or aria-label attributes
