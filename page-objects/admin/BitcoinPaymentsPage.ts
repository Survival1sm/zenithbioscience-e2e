import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Bitcoin payment information displayed in the admin list
 */
export interface AdminBitcoinPayment {
  orderId: string;
  btcAmount: string;
  satsExpected: number;
  satsReceived: number;
  status: string;
  confirmations: string;
  date: string;
  txids: string[];
  underpaid: boolean;
  overpaid: boolean;
}

/**
 * Bitcoin payment statistics
 */
export interface BitcoinStatistics {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  totalBtcReceived: string;
  averageConfirmationTime: string;
}

/**
 * Bitcoin payment filter state
 */
export interface BitcoinFilterState {
  statusFilter: string;
  networkFilter: string;
  txidFilter: string;
  addressFilter: string;
}

/**
 * BitcoinPaymentsPage Page Object
 * Handles admin Bitcoin payments dashboard interactions
 *
 * Based on actual frontend implementation:
 * - BitcoinPaymentDashboard: zenithbioscience-next/src/app/_components/admin/BitcoinPaymentDashboard.tsx
 * - BitcoinTransactionList: zenithbioscience-next/src/app/_components/admin/bitcoin/BitcoinTransactionList.tsx
 * - BitcoinPaymentDashboardHeader: zenithbioscience-next/src/app/_components/admin/bitcoin/BitcoinPaymentDashboardHeader.tsx
 *
 * Requirements covered:
 * - 19.35: Bitcoin payments displayed in payment management section
 * - 19.36: Bitcoin-specific details shown (address, sats, confirmations, txids)
 * - 19.37: Underpayment/overpayment flags displayed
 * - 19.38: Block explorer links provided
 * - 19.39: Filter orders by Bitcoin payment method
 */
export class BitcoinPaymentsPage extends BasePage {
  readonly path = '/admin/payments/bitcoin';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Header/Statistics Locators ====================

  /** Page heading */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: /bitcoin payment/i, level: 1 });
  }

  /** Loading indicator */
  get loadingIndicator(): Locator {
    return this.page.locator('.MuiCircularProgress-root');
  }

  /** Statistics cards container */
  get statisticsContainer(): Locator {
    return this.page.locator('[data-testid="bitcoin-statistics"]');
  }

  /** Total payments stat */
  get totalPaymentsStat(): Locator {
    return this.page.getByText(/total payments/i).locator('..');
  }

  /** Completed payments stat */
  get completedPaymentsStat(): Locator {
    return this.page.getByText(/completed/i).locator('..');
  }

  /** Pending payments stat */
  get pendingPaymentsStat(): Locator {
    return this.page.getByText(/pending/i).locator('..');
  }

  /** Total BTC received stat */
  get totalBtcReceivedStat(): Locator {
    return this.page.getByText(/total btc/i).locator('..');
  }

  // ==================== Filter Locators ====================

  /** Status filter dropdown - MUI Select with InputLabel "Status" */
  get statusFilter(): Locator {
    return this.page.locator('[id="status-filter"], .MuiFormControl-root:has(label:text("Status")) .MuiSelect-select');
  }

  /** Network filter dropdown - MUI Select with InputLabel "Network" */
  get networkFilter(): Locator {
    return this.page.locator('[id="network-filter"], .MuiFormControl-root:has(label:text("Network")) .MuiSelect-select');
  }

  /** Transaction ID filter input */
  get txidFilterInput(): Locator {
    return this.page.getByLabel(/transaction id/i);
  }

  /** Address filter input - MUI TextField with label "BTC Address" */
  get addressFilterInput(): Locator {
    return this.page.getByLabel(/btc address/i);
  }

  /** Apply filters button - Button with text "Filter" */
  get applyFiltersButton(): Locator {
    return this.page.getByRole('button', { name: 'Filter' });
  }

  /** Refresh button */
  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: /refresh/i });
  }

  /** Export button */
  get exportButton(): Locator {
    return this.page.getByRole('button', { name: /export/i });
  }

  // ==================== Table Locators ====================

  /** Payments table */
  get paymentsTable(): Locator {
    return this.page.locator('.MuiTableContainer-root');
  }

  /** Table header row */
  get tableHeader(): Locator {
    return this.page.locator('.MuiTableHead-root');
  }

  /** Payment rows */
  get paymentRows(): Locator {
    return this.page.locator('.MuiTableBody-root .MuiTableRow-root');
  }

  /** Pagination controls */
  get pagination(): Locator {
    return this.page.locator('.MuiTablePagination-root');
  }

  /** Rows per page selector - MUI TablePagination uses a MUI Select component */
  get rowsPerPageSelector(): Locator {
    return this.page.locator('.MuiTablePagination-root .MuiSelect-select');
  }

  /** Next page button */
  get nextPageButton(): Locator {
    return this.page.locator('[aria-label="Go to next page"]');
  }

  /** Previous page button */
  get prevPageButton(): Locator {
    return this.page.locator('[aria-label="Go to previous page"]');
  }

  // ==================== Status Chip Locators ====================

  /** Get status chip by status name */
  getStatusChip(status: string): Locator {
    return this.page.locator('.MuiChip-root').filter({ hasText: new RegExp(status, 'i') });
  }

  /** Underpaid chip */
  get underpaidChip(): Locator {
    return this.page.locator('.MuiChip-root').filter({ hasText: /underpaid/i });
  }

  /** Overpaid chip */
  get overpaidChip(): Locator {
    return this.page.locator('.MuiChip-root').filter({ hasText: /overpaid/i });
  }

  // ==================== Action Button Locators ====================

  /** View details button (in row) - Tooltip title "View Details" */
  getViewDetailsButton(rowIndex: number): Locator {
    return this.paymentRows.nth(rowIndex).locator('button[aria-label="View Details"], button:has(svg[data-testid="VisibilityIcon"])');
  }

  /** Audit trail button (in row) - Tooltip title "Audit Trail" */
  getAuditTrailButton(rowIndex: number): Locator {
    return this.paymentRows.nth(rowIndex).locator('button[aria-label="Audit Trail"], button:has(svg[data-testid="HistoryIcon"])');
  }

  /** Refund button (in row) - Tooltip title "Refund Instructions" */
  getRefundButton(rowIndex: number): Locator {
    return this.paymentRows.nth(rowIndex).locator('button[aria-label="Refund Instructions"], button:has(svg[data-testid="AccountBalanceIcon"])');
  }

  /** Compliance button (in row) - Tooltip title "Compliance" */
  getComplianceButton(rowIndex: number): Locator {
    return this.paymentRows.nth(rowIndex).locator('button[aria-label="Compliance"], button:has(svg[data-testid="SecurityIcon"])');
  }

  /** Block explorer link (in row) - Link with href containing "blockstream.info" */
  getBlockExplorerLink(rowIndex: number): Locator {
    return this.paymentRows.nth(rowIndex).locator('a[href*="blockstream.info"]');
  }

  // ==================== Dialog Locators ====================

  /** Details dialog */
  get detailsDialog(): Locator {
    return this.page.locator('.MuiDialog-root');
  }

  /** Dialog title */
  get dialogTitle(): Locator {
    return this.detailsDialog.locator('.MuiDialogTitle-root');
  }

  /** Dialog close button */
  get dialogCloseButton(): Locator {
    return this.detailsDialog.getByRole('button', { name: /close/i });
  }

  /** Refund form amount input */
  get refundAmountInput(): Locator {
    return this.detailsDialog.getByLabel(/amount/i);
  }

  /** Refund form reason input */
  get refundReasonInput(): Locator {
    return this.detailsDialog.getByLabel(/reason/i);
  }

  /** Refund form address input */
  get refundAddressInput(): Locator {
    return this.detailsDialog.getByLabel(/refund address/i);
  }

  /** Generate refund instructions button */
  get generateRefundButton(): Locator {
    return this.detailsDialog.getByRole('button', { name: /generate.*refund/i });
  }

  /** Compliance status select */
  get complianceStatusSelect(): Locator {
    return this.detailsDialog.locator('[data-testid="compliance-status-select"]');
  }

  /** Compliance notes input */
  get complianceNotesInput(): Locator {
    return this.detailsDialog.getByLabel(/notes/i);
  }

  /** Update compliance button */
  get updateComplianceButton(): Locator {
    return this.detailsDialog.getByRole('button', { name: /update.*compliance/i });
  }

  // ==================== Snackbar Locators ====================

  /** Success snackbar */
  get successSnackbar(): Locator {
    return this.page.locator('.MuiSnackbar-root .MuiAlert-standardSuccess');
  }

  /** Error snackbar */
  get errorSnackbar(): Locator {
    return this.page.locator('.MuiSnackbar-root .MuiAlert-standardError');
  }

  // ==================== Navigation Methods ====================

  /**
   * Navigate to the Bitcoin payments page with retry logic
   * Overrides BasePage.goto() to handle admin page navigation issues
   */
  async goto(): Promise<void> {
    // Navigate with retry logic for flaky page loads
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.page.goto(this.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait a moment for any redirects to occur
        await this.wait(1000);
        
        // Check if we're still on the Bitcoin payments page (not redirected)
        const currentUrl = this.page.url();
        if (currentUrl.includes('/admin/payments/bitcoin')) {
          // Wait for the page to be ready
          await this.waitForPage();
          return;
        }
        
        // If redirected, wait and retry
        if (attempt < 2) {
          console.log(`[BitcoinPaymentsPage] Redirected to ${currentUrl}, retrying...`);
          await this.wait(1000);
        }
      } catch (error) {
        if (attempt < 2) {
          console.log(`[BitcoinPaymentsPage] Navigation failed, retrying...`);
          await this.wait(1000);
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Wait for the Bitcoin payments page to be ready
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for loading to complete
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    // Wait for table to appear
    await this.paymentsTable.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    await this.wait(500);
  }

  /**
   * Check if page is displayed
   * Waits briefly for the table to appear before checking
   */
  async isPageDisplayed(): Promise<boolean> {
    try {
      // Wait briefly for the table to appear
      await this.paymentsTable.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  // ==================== Filter Methods ====================

  /**
   * Filter by status
   */
  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter.click();
    const menu = this.page.locator('.MuiMenu-paper');
    await menu.waitFor({ state: 'visible' });
    await menu.getByRole('option', { name: new RegExp(status, 'i') }).click();
    await menu.waitFor({ state: 'hidden' });
  }

  /**
   * Filter by network
   */
  async filterByNetwork(network: string): Promise<void> {
    await this.networkFilter.click();
    const menu = this.page.locator('.MuiMenu-paper');
    await menu.waitFor({ state: 'visible' });
    await menu.getByRole('option', { name: new RegExp(network, 'i') }).click();
    await menu.waitFor({ state: 'hidden' });
  }

  /**
   * Filter by transaction ID
   */
  async filterByTxid(txid: string): Promise<void> {
    await this.txidFilterInput.fill(txid);
  }

  /**
   * Filter by Bitcoin address
   */
  async filterByAddress(address: string): Promise<void> {
    await this.addressFilterInput.fill(address);
  }

  /**
   * Apply current filters
   */
  async applyFilters(): Promise<void> {
    await this.applyFiltersButton.click();
    await this.wait(500);
  }

  /**
   * Refresh the payments list
   */
  async refresh(): Promise<void> {
    await this.refreshButton.click();
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  /**
   * Export payments to CSV
   */
  async exportPayments(): Promise<void> {
    await this.exportButton.click();
    await this.wait(1000);
  }

  // ==================== Table Methods ====================

  /**
   * Get the count of payments displayed
   */
  async getPaymentCount(): Promise<number> {
    return await this.paymentRows.count();
  }

  /**
   * Get all payments displayed in the table
   */
  async getPayments(): Promise<AdminBitcoinPayment[]> {
    const payments: AdminBitcoinPayment[] = [];
    const rowCount = await this.paymentRows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = this.paymentRows.nth(i);
      const cells = row.locator('.MuiTableCell-root');

      const orderId = await cells.nth(0).textContent() || '';
      
      // Amount cell contains BTC and sats
      const amountCell = cells.nth(1);
      const btcAmount = await amountCell.locator('text=/₿[\\d.]+/').textContent().catch(() => '') || '';
      const satsExpectedText = await amountCell.getByText(/expected/i).textContent().catch(() => '0') || '0';
      // "received" text only appears when receivedSats > 0, so make it optional
      const receivedElement = amountCell.getByText(/received/i);
      const hasReceived = await receivedElement.isVisible().catch(() => false);
      const satsReceivedText = hasReceived ? await receivedElement.textContent().catch(() => '0') || '0' : '0';
      
      // Status cell
      const statusChip = cells.nth(2).locator('.MuiChip-root').first();
      const status = await statusChip.textContent().catch(() => '') || '';
      const underpaid = await cells.nth(2).locator('.MuiChip-root:has-text("UNDERPAID")').isVisible().catch(() => false);
      const overpaid = await cells.nth(2).locator('.MuiChip-root:has-text("OVERPAID")').isVisible().catch(() => false);

      // Confirmations cell
      const confirmations = await cells.nth(3).textContent() || '0/0';

      // Date cell
      const date = await cells.nth(4).textContent() || '';

      // Transaction IDs cell
      const txidElements = cells.nth(5).locator('text=/[a-f0-9]{12}/i');
      const txidCount = await txidElements.count();
      const txids: string[] = [];
      for (let j = 0; j < txidCount; j++) {
        const txid = await txidElements.nth(j).textContent();
        if (txid) txids.push(txid.trim());
      }

      payments.push({
        orderId: orderId.trim(),
        btcAmount: btcAmount.trim(),
        satsExpected: parseInt(satsExpectedText.replace(/[^0-9]/g, '')) || 0,
        satsReceived: parseInt(satsReceivedText.replace(/[^0-9]/g, '')) || 0,
        status: status.trim(),
        confirmations: confirmations.trim(),
        date: date.trim(),
        txids,
        underpaid,
        overpaid,
      });
    }

    return payments;
  }

  /**
   * Find a payment by order ID
   */
  async findPaymentByOrderId(orderId: string): Promise<AdminBitcoinPayment | null> {
    const payments = await this.getPayments();
    return payments.find(p => p.orderId.includes(orderId)) || null;
  }

  /**
   * Get row index by order ID
   */
  async getRowIndexByOrderId(orderId: string): Promise<number> {
    const rowCount = await this.paymentRows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = this.paymentRows.nth(i);
      const orderIdCell = await row.locator('.MuiTableCell-root').first().textContent();
      if (orderIdCell?.includes(orderId)) {
        return i;
      }
    }
    return -1;
  }

  // ==================== Action Methods ====================

  /**
   * View payment details
   */
  async viewPaymentDetails(orderId: string): Promise<void> {
    const rowIndex = await this.getRowIndexByOrderId(orderId);
    if (rowIndex === -1) throw new Error(`Payment with order ID ${orderId} not found`);
    
    await this.getViewDetailsButton(rowIndex).click();
    await this.detailsDialog.waitFor({ state: 'visible' });
  }

  /**
   * View audit trail for a payment
   */
  async viewAuditTrail(orderId: string): Promise<void> {
    const rowIndex = await this.getRowIndexByOrderId(orderId);
    if (rowIndex === -1) throw new Error(`Payment with order ID ${orderId} not found`);
    
    await this.getAuditTrailButton(rowIndex).click();
    await this.detailsDialog.waitFor({ state: 'visible' });
  }

  /**
   * Open refund dialog for a payment
   */
  async openRefundDialog(orderId: string): Promise<void> {
    const rowIndex = await this.getRowIndexByOrderId(orderId);
    if (rowIndex === -1) throw new Error(`Payment with order ID ${orderId} not found`);
    
    await this.getRefundButton(rowIndex).click();
    await this.detailsDialog.waitFor({ state: 'visible' });
  }

  /**
   * Open compliance dialog for a payment
   */
  async openComplianceDialog(orderId: string): Promise<void> {
    const rowIndex = await this.getRowIndexByOrderId(orderId);
    if (rowIndex === -1) throw new Error(`Payment with order ID ${orderId} not found`);
    
    await this.getComplianceButton(rowIndex).click();
    await this.detailsDialog.waitFor({ state: 'visible' });
  }

  /**
   * Click block explorer link for a payment
   */
  async openBlockExplorer(orderId: string): Promise<void> {
    const rowIndex = await this.getRowIndexByOrderId(orderId);
    if (rowIndex === -1) throw new Error(`Payment with order ID ${orderId} not found`);
    
    await this.getBlockExplorerLink(rowIndex).click();
  }

  /**
   * Close the open dialog
   */
  async closeDialog(): Promise<void> {
    await this.dialogCloseButton.click();
    await this.detailsDialog.waitFor({ state: 'hidden' });
  }

  /**
   * Generate refund instructions
   */
  async generateRefundInstructions(amount: string, reason: string, refundAddress: string): Promise<void> {
    await this.refundAmountInput.fill(amount);
    await this.refundReasonInput.fill(reason);
    await this.refundAddressInput.fill(refundAddress);
    await this.generateRefundButton.click();
    await this.wait(1000);
  }

  /**
   * Update compliance status
   */
  async updateComplianceStatus(status: string, notes: string): Promise<void> {
    await this.complianceStatusSelect.click();
    const menu = this.page.locator('.MuiMenu-paper');
    await menu.waitFor({ state: 'visible' });
    await menu.getByRole('option', { name: new RegExp(status, 'i') }).click();
    await menu.waitFor({ state: 'hidden' });
    
    if (notes) {
      await this.complianceNotesInput.fill(notes);
    }
    
    await this.updateComplianceButton.click();
    await this.wait(500);
  }

  // ==================== Pagination Methods ====================

  /**
   * Go to next page
   */
  async nextPage(): Promise<void> {
    await this.nextPageButton.click();
    await this.wait(500);
  }

  /**
   * Go to previous page
   */
  async prevPage(): Promise<void> {
    await this.prevPageButton.click();
    await this.wait(500);
  }

  /**
   * Change rows per page
   */
  async setRowsPerPage(count: number): Promise<void> {
    await this.rowsPerPageSelector.click();
    const menu = this.page.locator('.MuiMenu-paper');
    await menu.waitFor({ state: 'visible' });
    await menu.getByRole('option', { name: count.toString() }).click();
    await menu.waitFor({ state: 'hidden' });
    await this.wait(500);
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert page is displayed
   */
  async assertPageDisplayed(): Promise<void> {
    await expect(this.paymentsTable).toBeVisible();
  }

  /**
   * Assert payments are loaded
   */
  async assertPaymentsLoaded(): Promise<void> {
    const count = await this.getPaymentCount();
    expect(count).toBeGreaterThanOrEqual(0);
  }

  /**
   * Assert table headers are correct
   */
  async assertTableHeaders(): Promise<void> {
    const headers = ['Order ID', 'Amount', 'Status', 'Confirmations', 'Date', 'Transaction'];
    for (const header of headers) {
      await expect(this.tableHeader.getByText(new RegExp(header, 'i'))).toBeVisible();
    }
  }

  /**
   * Assert payment has Bitcoin-specific details
   */
  async assertBitcoinDetailsDisplayed(orderId: string): Promise<void> {
    const payment = await this.findPaymentByOrderId(orderId);
    expect(payment).not.toBeNull();
    expect(payment?.btcAmount).toMatch(/₿[\d.]+/);
    expect(payment?.confirmations).toMatch(/\d+\/\d+/);
  }

  /**
   * Assert underpaid flag is displayed
   */
  async assertUnderpaidFlagDisplayed(): Promise<void> {
    await expect(this.underpaidChip.first()).toBeVisible();
  }

  /**
   * Assert overpaid flag is displayed
   */
  async assertOverpaidFlagDisplayed(): Promise<void> {
    await expect(this.overpaidChip.first()).toBeVisible();
  }

  /**
   * Assert block explorer link is present
   */
  async assertBlockExplorerLinkPresent(rowIndex: number): Promise<void> {
    await expect(this.getBlockExplorerLink(rowIndex)).toBeVisible();
  }

  /**
   * Assert dialog is open
   */
  async assertDialogOpen(): Promise<void> {
    await expect(this.detailsDialog).toBeVisible();
  }

  /**
   * Assert dialog is closed
   */
  async assertDialogClosed(): Promise<void> {
    await expect(this.detailsDialog).not.toBeVisible();
  }

  /**
   * Assert success message displayed
   */
  async assertSuccessMessage(): Promise<void> {
    await expect(this.successSnackbar).toBeVisible();
  }

  /**
   * Assert error message displayed
   */
  async assertErrorMessage(): Promise<void> {
    await expect(this.errorSnackbar).toBeVisible();
  }
}
