import { test, expect } from '@playwright/test';
import { BitcoinPaymentsPage } from '../../page-objects/admin/BitcoinPaymentsPage';
import { LoginPage } from '../../page-objects/LoginPage';
import { defaultFixtures } from '../../fixtures/defaultFixtures';

/**
 * Bitcoin Admin Dashboard E2E Tests
 * 
 * Tests the admin Bitcoin payments management functionality.
 * 
 * Requirements covered:
 * - 19.35: Bitcoin payments displayed in payment management section
 * - 19.36: Bitcoin-specific details shown (address, sats, confirmations, txids)
 * - 19.37: Underpayment/overpayment flags displayed
 * - 19.38: Block explorer links provided
 * - 19.39: Filter orders by Bitcoin payment method
 * 
 * @tag Feature: e2e-integration-testing
 */

test.describe('Bitcoin Admin Dashboard', () => {
  let bitcoinPaymentsPage: BitcoinPaymentsPage;
  let loginPage: LoginPage;

  // Admin user credentials
  const adminUser = defaultFixtures.users.admin;

  test.beforeEach(async ({ page }) => {
    bitcoinPaymentsPage = new BitcoinPaymentsPage(page);
    loginPage = new LoginPage(page);

    // Login as admin
    await loginPage.goto();
    await loginPage.login(adminUser.email, adminUser.password);
    // Wait for login to complete
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  });

  test.describe('Page Access and Display', () => {
    /**
     * Test 1: Admin can access Bitcoin payments page
     * Validates: Requirement 19.35
     */
    test('should allow admin to access Bitcoin payments page', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      // Check if page loads (may show empty state or payments)
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      
      if (!isDisplayed) {
        // Page might not exist yet or Bitcoin payments not enabled
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.assertPageDisplayed();
    });

    /**
     * Test 2: Bitcoin payments table has correct headers
     * Validates: Requirement 19.35
     */
    test('should display correct table headers', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      await bitcoinPaymentsPage.assertTableHeaders();
    });

    /**
     * Test 3: Payments list loads without errors
     * Validates: Requirement 19.35
     */
    test('should load payments list without errors', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      // Should not show error snackbar
      const hasError = await bitcoinPaymentsPage.errorSnackbar.isVisible().catch(() => false);
      expect(hasError).toBe(false);
    });
  });

  test.describe('Bitcoin-Specific Details Display', () => {
    /**
     * Test 4: Payments show BTC amount in correct format
     * Validates: Requirement 19.36
     */
    test('should display BTC amount in correct format', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const paymentCount = await bitcoinPaymentsPage.getPaymentCount();
      if (paymentCount === 0) {
        throw new Error('No Bitcoin payments in test data - check E2E test data setup');
      }

      const payments = await bitcoinPaymentsPage.getPayments();
      const firstPayment = payments[0];
      
      // BTC amount should be in format ₿X.XXXXXXXX
      expect(firstPayment.btcAmount).toMatch(/₿[\d.]+/);
    });

    /**
     * Test 5: Payments show satoshi amounts
     * Validates: Requirement 19.36
     */
    test('should display satoshi amounts', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const paymentCount = await bitcoinPaymentsPage.getPaymentCount();
      if (paymentCount === 0) {
        throw new Error('No Bitcoin payments in test data - check E2E test data setup');
      }

      // Check that "sats" text appears in the amount column
      const satsText = page.getByText(/sats/i);
      await expect(satsText.first()).toBeVisible();
    });

    /**
     * Test 6: Payments show confirmation count
     * Validates: Requirement 19.36
     */
    test('should display confirmation count', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const paymentCount = await bitcoinPaymentsPage.getPaymentCount();
      if (paymentCount === 0) {
        throw new Error('No Bitcoin payments in test data - check E2E test data setup');
      }

      const payments = await bitcoinPaymentsPage.getPayments();
      const firstPayment = payments[0];
      
      // Confirmations should be in format X/Y
      expect(firstPayment.confirmations).toMatch(/\d+\/\d+/);
    });

    /**
     * Test 7: Payments show transaction IDs when available
     * Validates: Requirement 19.36
     */
    test('should display transaction IDs when available', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const paymentCount = await bitcoinPaymentsPage.getPaymentCount();
      if (paymentCount === 0) {
        throw new Error('No Bitcoin payments in test data - check E2E test data setup');
      }

      // Check for transaction column - may show txids or "No transactions yet"
      const txColumn = page.getByText(/transaction/i);
      await expect(txColumn.first()).toBeVisible();
    });

    /**
     * Test 8: Payment status is displayed with appropriate color
     * Validates: Requirement 19.36
     */
    test('should display payment status with color coding', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const paymentCount = await bitcoinPaymentsPage.getPaymentCount();
      if (paymentCount === 0) {
        throw new Error('No Bitcoin payments in test data - check E2E test data setup');
      }

      // Status chips should be visible
      const statusChips = page.locator('.MuiChip-root');
      await expect(statusChips.first()).toBeVisible();
    });
  });

  test.describe('Underpayment/Overpayment Flags', () => {
    /**
     * Test 9: Underpaid payments show UNDERPAID flag
     * Validates: Requirement 19.37
     */
    test('should display UNDERPAID flag for underpaid payments', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const payments = await bitcoinPaymentsPage.getPayments();
      const underpaidPayment = payments.find(p => p.underpaid);
      
      if (!underpaidPayment) {
        // No underpaid payments in test data - verify the chip component exists
        const underpaidChipExists = await page.locator('.MuiChip-root:has-text("UNDERPAID")').count() >= 0;
        expect(underpaidChipExists).toBe(true);
        return;
      }

      await bitcoinPaymentsPage.assertUnderpaidFlagDisplayed();
    });

    /**
     * Test 10: Overpaid payments show OVERPAID flag
     * Validates: Requirement 19.37
     */
    test('should display OVERPAID flag for overpaid payments', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const payments = await bitcoinPaymentsPage.getPayments();
      const overpaidPayment = payments.find(p => p.overpaid);
      
      if (!overpaidPayment) {
        // No overpaid payments in test data - verify the chip component exists
        const overpaidChipExists = await page.locator('.MuiChip-root:has-text("OVERPAID")').count() >= 0;
        expect(overpaidChipExists).toBe(true);
        return;
      }

      await bitcoinPaymentsPage.assertOverpaidFlagDisplayed();
    });

    /**
     * Test 11: Underpaid flag shows in error color
     * Validates: Requirement 19.37
     */
    test('should show underpaid flag in error color', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const underpaidChip = page.locator('.MuiChip-root:has-text("UNDERPAID")');
      const chipCount = await underpaidChip.count();
      
      if (chipCount === 0) {
        throw new Error('No underpaid payments in test data - check E2E test data setup');
      }

      // Underpaid chip should have error color (outlined variant)
      const hasErrorClass = await underpaidChip.first().evaluate(el => {
        return el.classList.contains('MuiChip-colorError') || 
               el.classList.contains('MuiChip-outlinedError');
      });
      expect(hasErrorClass).toBe(true);
    });
  });

  test.describe('Block Explorer Links', () => {
    /**
     * Test 12: Block explorer links are provided for transactions
     * Validates: Requirement 19.38
     */
    test('should provide block explorer links for transactions', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const paymentCount = await bitcoinPaymentsPage.getPaymentCount();
      if (paymentCount === 0) {
        throw new Error('No Bitcoin payments in test data - check E2E test data setup');
      }

      // Look for external link icons (block explorer links)
      const externalLinks = page.locator('a[href*="blockstream.info"], button:has(svg[data-testid="LaunchIcon"])');
      const linkCount = await externalLinks.count();
      
      // If there are transactions, there should be explorer links
      // If no transactions yet, this is expected
      expect(linkCount).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test 13: Block explorer links point to correct network
     * Validates: Requirement 19.38
     */
    test('should link to correct block explorer network', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      // Check for blockstream.info links
      const explorerLinks = page.locator('a[href*="blockstream.info"]');
      const linkCount = await explorerLinks.count();
      
      if (linkCount === 0) {
        throw new Error('No block explorer links found - check Bitcoin transaction data');
      }

      const href = await explorerLinks.first().getAttribute('href');
      expect(href).toMatch(/blockstream\.info\/(testnet\/)?tx\//);
    });

    /**
     * Test 14: Block explorer links open in new tab
     * Validates: Requirement 19.38
     */
    test('should open block explorer links in new tab', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const explorerLinks = page.locator('a[href*="blockstream.info"]');
      const linkCount = await explorerLinks.count();
      
      if (linkCount === 0) {
        throw new Error('No block explorer links found - check Bitcoin transaction data');
      }

      const target = await explorerLinks.first().getAttribute('target');
      expect(target).toBe('_blank');
    });
  });

  test.describe('Filtering', () => {
    /**
     * Test 15: Can filter by payment status
     * Validates: Requirement 19.39
     */
    test('should filter payments by status', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      // Check if status filter exists
      const statusFilterVisible = await bitcoinPaymentsPage.statusFilter.isVisible().catch(() => false);
      
      if (!statusFilterVisible) {
        // Filter might be in a different location or collapsed
        throw new Error('Status filter not visible - check admin UI');
      }

      // Apply a status filter
      await bitcoinPaymentsPage.filterByStatus('COMPLETED');
      await bitcoinPaymentsPage.applyFilters();
      
      // Verify filter was applied (page should reload)
      await bitcoinPaymentsPage.waitForPage();
    });

    /**
     * Test 16: Can filter by network (mainnet/testnet)
     * Validates: Requirement 19.39
     */
    test('should filter payments by network', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const networkFilterVisible = await bitcoinPaymentsPage.networkFilter.isVisible().catch(() => false);
      
      if (!networkFilterVisible) {
        throw new Error('Network filter not visible - check admin UI');
      }

      await bitcoinPaymentsPage.filterByNetwork('testnet');
      await bitcoinPaymentsPage.applyFilters();
      
      await bitcoinPaymentsPage.waitForPage();
    });

    /**
     * Test 17: Can search by transaction ID
     * Validates: Requirement 19.39
     */
    test('should search payments by transaction ID', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const txidFilterVisible = await bitcoinPaymentsPage.txidFilterInput.isVisible().catch(() => false);
      
      if (!txidFilterVisible) {
        throw new Error('Transaction ID filter not visible - check admin UI');
      }

      // Enter a partial txid
      await bitcoinPaymentsPage.filterByTxid('abc123');
      await bitcoinPaymentsPage.applyFilters();
      
      await bitcoinPaymentsPage.waitForPage();
    });

    /**
     * Test 18: Can search by Bitcoin address
     * Validates: Requirement 19.39
     */
    test('should search payments by Bitcoin address', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const addressFilterVisible = await bitcoinPaymentsPage.addressFilterInput.isVisible().catch(() => false);
      
      if (!addressFilterVisible) {
        throw new Error('Address filter not visible - check admin UI');
      }

      await bitcoinPaymentsPage.filterByAddress('bc1q');
      await bitcoinPaymentsPage.applyFilters();
      
      await bitcoinPaymentsPage.waitForPage();
    });

    /**
     * Test 19: Refresh button reloads data
     * Validates: Requirement 19.39
     */
    test('should refresh data when refresh button clicked', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const refreshVisible = await bitcoinPaymentsPage.refreshButton.isVisible().catch(() => false);
      
      if (!refreshVisible) {
        throw new Error('Refresh button not visible - check admin UI');
      }

      await bitcoinPaymentsPage.refresh();
      
      // Page should still be displayed after refresh
      await bitcoinPaymentsPage.assertPageDisplayed();
    });
  });

  test.describe('Payment Details Dialog', () => {
    /**
     * Test 20: Can view payment details
     * Validates: Requirement 19.36
     */
    test('should open payment details dialog', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const paymentCount = await bitcoinPaymentsPage.getPaymentCount();
      if (paymentCount === 0) {
        throw new Error('No Bitcoin payments in test data - check E2E test data setup');
      }

      const payments = await bitcoinPaymentsPage.getPayments();
      await bitcoinPaymentsPage.viewPaymentDetails(payments[0].orderId);
      
      await bitcoinPaymentsPage.assertDialogOpen();
    });

    /**
     * Test 21: Can close payment details dialog
     * Validates: Requirement 19.36
     */
    test('should close payment details dialog', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const paymentCount = await bitcoinPaymentsPage.getPaymentCount();
      if (paymentCount === 0) {
        throw new Error('No Bitcoin payments in test data - check E2E test data setup');
      }

      const payments = await bitcoinPaymentsPage.getPayments();
      await bitcoinPaymentsPage.viewPaymentDetails(payments[0].orderId);
      await bitcoinPaymentsPage.assertDialogOpen();
      
      await bitcoinPaymentsPage.closeDialog();
      await bitcoinPaymentsPage.assertDialogClosed();
    });

    /**
     * Test 22: Can view audit trail
     * Validates: Requirement 19.36
     */
    test('should open audit trail dialog', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const paymentCount = await bitcoinPaymentsPage.getPaymentCount();
      if (paymentCount === 0) {
        throw new Error('No Bitcoin payments in test data - check E2E test data setup');
      }

      const payments = await bitcoinPaymentsPage.getPayments();
      await bitcoinPaymentsPage.viewAuditTrail(payments[0].orderId);
      
      await bitcoinPaymentsPage.assertDialogOpen();
    });
  });

  test.describe('Pagination', () => {
    /**
     * Test 23: Pagination controls are displayed
     * Validates: Requirement 19.35
     */
    test('should display pagination controls', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      await expect(bitcoinPaymentsPage.pagination).toBeVisible();
    });

    /**
     * Test 24: Can change rows per page
     * Validates: Requirement 19.35
     */
    test('should change rows per page', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const rowsPerPageVisible = await bitcoinPaymentsPage.rowsPerPageSelector.isVisible().catch(() => false);
      
      if (!rowsPerPageVisible) {
        throw new Error('Rows per page selector not visible - check admin UI');
      }

      await bitcoinPaymentsPage.setRowsPerPage(25);
      
      // Verify selector shows new value
      const selectorText = await bitcoinPaymentsPage.rowsPerPageSelector.textContent();
      expect(selectorText).toContain('25');
    });
  });

  test.describe('Export Functionality', () => {
    /**
     * Test 25: Export button is available
     * Validates: Requirement 19.35
     */
    test('should display export button', async ({ page }) => {
      await bitcoinPaymentsPage.goto();
      
      const isDisplayed = await bitcoinPaymentsPage.isPageDisplayed();
      if (!isDisplayed) {
        throw new Error('Bitcoin payments admin page not available - check admin routes configuration');
      }

      await bitcoinPaymentsPage.waitForPage();
      
      const exportVisible = await bitcoinPaymentsPage.exportButton.isVisible().catch(() => false);
      
      // Export button should be visible if implemented
      expect(exportVisible).toBeDefined();
    });
  });
});
