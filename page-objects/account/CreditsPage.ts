import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Credit history entry interface
 */
export interface CreditHistoryEntry {
  type: string;
  amount: string;
  status: string;
  description: string;
  date: string;
  expires?: string;
  source?: string;
}

/**
 * Credit filter options interface
 */
export interface CreditFilters {
  type?: string;
  status?: string;
  dateRange?: string;
}

/**
 * CreditsPage Page Object
 * Handles account credits dashboard interactions
 *
 * Based on actual frontend implementation:
 * - Credits page: zenithbioscience-next/src/app/account/credits/page.tsx
 * - AccountCreditDashboard: zenithbioscience-next/src/app/_components/account/AccountCreditDashboard.tsx
 *
 * Requirements covered:
 * - 12.9: Credits dashboard page object
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 *
 * Note: This page uses AuthGuard, so user must be logged in to access it.
 */
export class CreditsPage extends BasePage {
  readonly path = '/account/credits';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /** Page heading - "Account Credits" - uses variant="h4" component="h1" so it's semantically h1 */
  get pageHeading(): Locator {
    // MUI Typography with variant="h4" component="h1" renders as h1 element
    return this.page.getByRole('heading', { name: 'Account Credits' });
  }

  /** Refresh button - IconButton with RefreshIcon (has tooltip "Refresh data") */
  get refreshButton(): Locator {
    // The IconButton has a tooltip, so we can find it by the tooltip text or by the SVG icon
    return this.page.locator('button').filter({ has: this.page.locator('svg[data-testid="RefreshIcon"]') });
  }

  /** Loading spinner */
  get loadingSpinner(): Locator {
    return this.page.locator('.MuiCircularProgress-root');
  }

  /** Error alert */
  get errorAlert(): Locator {
    return this.page.locator('.MuiAlert-standardError');
  }

  /** Expiration warning alert */
  get expirationWarningAlert(): Locator {
    return this.page.locator('.MuiAlert-standardWarning');
  }

  // ==================== Balance Card Locators ====================

  /** Available Balance card */
  get availableBalanceCard(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: 'Available Balance' });
  }

  /** Total Earned card */
  get totalEarnedCard(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: 'Total Earned' });
  }

  /** Used Credits card */
  get usedCreditsCard(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: 'Used Credits' });
  }

  /** Expiring Soon card */
  get expiringSoonCard(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: 'Expiring Soon' });
  }

  // ==================== Filter Locators ====================

  /** Filter section card */
  get filterSection(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: 'Filter Credit History' });
  }

  /** Credit Type filter select - MUI FormControl with InputLabel "Credit Type" */
  get creditTypeSelect(): Locator {
    // MUI Select is rendered as a div with role="combobox" inside a FormControl
    // The label is associated via aria-labelledby
    return this.filterSection.locator('.MuiFormControl-root').filter({ hasText: 'Credit Type' }).locator('.MuiSelect-select');
  }

  /** Status filter select - MUI FormControl with InputLabel "Status" */
  get statusSelect(): Locator {
    return this.filterSection.locator('.MuiFormControl-root').filter({ hasText: 'Status' }).locator('.MuiSelect-select');
  }

  /** Date Range filter select - MUI FormControl with InputLabel "Date Range" */
  get dateRangeSelect(): Locator {
    return this.filterSection.locator('.MuiFormControl-root').filter({ hasText: 'Date Range' }).locator('.MuiSelect-select');
  }

  // ==================== Credit History Table Locators ====================

  /** Credit history section card - find by the heading text pattern */
  get creditHistorySection(): Locator {
    // The credit history section has a heading like "Credit History (X credits)"
    // We need to find the card that contains this heading
    return this.page.locator('.MuiCard-root').filter({ 
      has: this.page.locator('.MuiTypography-root', { hasText: /Credit History/ })
    }).last();
  }

  /** Credit history heading with count - Typography variant="h6" */
  get creditHistoryHeading(): Locator {
    return this.creditHistorySection.locator('.MuiTypography-h6, .MuiTypography-root').filter({ hasText: /Credit History/ }).first();
  }

  /** Credit history table */
  get creditHistoryTable(): Locator {
    return this.creditHistorySection.locator('table');
  }

  /** Credit history table rows (body only) */
  get creditHistoryRows(): Locator {
    return this.creditHistoryTable.locator('tbody tr');
  }

  /** Empty state message */
  get emptyStateMessage(): Locator {
    return this.creditHistorySection.getByText(/no credits found matching your filters/i);
  }

  /** Pagination component */
  get pagination(): Locator {
    return this.creditHistorySection.locator('.MuiPagination-root');
  }

  /** Pagination buttons */
  get paginationButtons(): Locator {
    return this.pagination.locator('button');
  }

  // ==================== Navigation Methods ====================

  /**
   * Wait for the credits page to be ready
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for loading to complete
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    // Wait for heading
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });
  }

  // ==================== Balance Methods ====================

  /**
   * Get the available balance amount
   * @returns The available balance as a string (e.g., "$100.00")
   */
  async getBalance(): Promise<string> {
    await this.availableBalanceCard.waitFor({ state: 'visible', timeout: 10000 });
    const amountElement = this.availableBalanceCard.locator('.MuiTypography-h4');
    return (await amountElement.textContent())?.trim() || '$0.00';
  }

  /**
   * Get the total earned amount
   * @returns The total earned as a string (e.g., "$500.00")
   */
  async getTotalEarned(): Promise<string> {
    await this.totalEarnedCard.waitFor({ state: 'visible', timeout: 10000 });
    const amountElement = this.totalEarnedCard.locator('.MuiTypography-h4');
    return (await amountElement.textContent())?.trim() || '$0.00';
  }

  /**
   * Get the total used credits amount
   * @returns The total used as a string (e.g., "$200.00")
   */
  async getTotalUsed(): Promise<string> {
    await this.usedCreditsCard.waitFor({ state: 'visible', timeout: 10000 });
    const amountElement = this.usedCreditsCard.locator('.MuiTypography-h4');
    return (await amountElement.textContent())?.trim() || '$0.00';
  }

  /**
   * Get the amount expiring in 30 days
   * @returns The expiring amount as a string (e.g., "$50.00")
   */
  async getExpiringAmount(): Promise<string> {
    await this.expiringSoonCard.waitFor({ state: 'visible', timeout: 10000 });
    const amountElement = this.expiringSoonCard.locator('.MuiTypography-h4');
    return (await amountElement.textContent())?.trim() || '$0.00';
  }

  // ==================== Credit History Methods ====================

  /**
   * Get all credit history entries from the current page
   * @returns Array of credit history entries
   */
  async getCreditHistory(): Promise<CreditHistoryEntry[]> {
    const entries: CreditHistoryEntry[] = [];

    // Check if empty state is displayed
    if (await this.emptyStateMessage.isVisible().catch(() => false)) {
      return entries;
    }

    await this.creditHistoryTable.waitFor({ state: 'visible', timeout: 10000 });

    const rows = this.creditHistoryRows;
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();

      // Parse each cell based on column order: Type, Amount, Status, Description, Date, Expires, Source
      const type = (await cells.nth(0).textContent())?.trim() || '';
      const amount = (await cells.nth(1).textContent())?.trim() || '';
      
      // Status is in a Chip component
      const statusChip = cells.nth(2).locator('.MuiChip-root');
      const status = (await statusChip.textContent())?.trim() || '';
      
      const description = (await cells.nth(3).textContent())?.trim() || '';
      const date = (await cells.nth(4).textContent())?.trim() || '';

      // Expires and Source columns may not be visible on mobile
      let expires: string | undefined;
      let source: string | undefined;

      if (cellCount > 5) {
        expires = (await cells.nth(5).textContent())?.trim() || undefined;
      }
      if (cellCount > 6) {
        source = (await cells.nth(6).textContent())?.trim() || undefined;
      }

      entries.push({
        type,
        amount,
        status,
        description,
        date,
        expires,
        source,
      });
    }

    return entries;
  }

  /**
   * Get the total number of credits displayed (from heading)
   * @returns The total credit count
   */
  async getCreditCount(): Promise<number> {
    await this.creditHistoryHeading.waitFor({ state: 'visible', timeout: 10000 });
    const headingText = (await this.creditHistoryHeading.textContent()) || '';
    
    // Parse count from "Credit History (X credits)"
    const match = headingText.match(/\((\d+)\s*credits?\)/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get the count of credits after filtering (same as getCreditCount)
   * @returns The filtered credit count
   */
  async getFilteredCount(): Promise<number> {
    return await this.getCreditCount();
  }

  // ==================== Filter Methods ====================

  /**
   * Apply filters to the credit history
   * @param filters - Filter options to apply
   */
  async filterHistory(filters: CreditFilters): Promise<void> {
    if (filters.type !== undefined) {
      await this.selectCreditType(filters.type);
    }

    if (filters.status !== undefined) {
      await this.selectStatus(filters.status);
    }

    if (filters.dateRange !== undefined) {
      await this.selectDateRange(filters.dateRange);
    }

    // Wait for filter to apply
    await this.page.waitForTimeout(500);
  }

  /**
   * Select credit type filter
   * @param type - Credit type to select (e.g., "ALL", "COA_SUBMISSION", "PROMOTION")
   */
  private async selectCreditType(type: string): Promise<void> {
    // Find the FormControl containing "Credit Type" label and click the select
    const formControl = this.filterSection.locator('.MuiFormControl-root').filter({ hasText: 'Credit Type' });
    await formControl.locator('.MuiSelect-select').click();
    await this.page.waitForTimeout(300);

    const typeLabels: Record<string, string> = {
      'ALL': 'All Types',
      'COA_SUBMISSION': 'COA Submission',
      'MANUAL_ADJUSTMENT': 'Manual Adjustment',
      'PROMOTION': 'Promotion',
      'REFUND': 'Refund',
    };

    const label = typeLabels[type] || type;
    // MUI Select options appear in a listbox (Popover/Menu)
    const option = this.page.getByRole('option', { name: label });
    await option.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Select status filter
   * @param status - Status to select (e.g., "ALL", "ACTIVE", "USED", "EXPIRED")
   */
  private async selectStatus(status: string): Promise<void> {
    const formControl = this.filterSection.locator('.MuiFormControl-root').filter({ hasText: 'Status' });
    await formControl.locator('.MuiSelect-select').click();
    await this.page.waitForTimeout(300);

    const statusLabels: Record<string, string> = {
      'ALL': 'All Status',
      'ACTIVE': 'Active',
      'USED': 'Used',
      'EXPIRED': 'Expired',
    };

    const label = statusLabels[status] || status;
    const option = this.page.getByRole('option', { name: label });
    await option.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Select date range filter
   * @param dateRange - Date range to select (e.g., "ALL", "30_DAYS", "90_DAYS", "1_YEAR")
   */
  private async selectDateRange(dateRange: string): Promise<void> {
    const formControl = this.filterSection.locator('.MuiFormControl-root').filter({ hasText: 'Date Range' });
    await formControl.locator('.MuiSelect-select').click();
    await this.page.waitForTimeout(300);

    const dateRangeLabels: Record<string, string> = {
      'ALL': 'All Time',
      '30_DAYS': 'Last 30 Days',
      '90_DAYS': 'Last 90 Days',
      '1_YEAR': 'Last Year',
    };

    const label = dateRangeLabels[dateRange] || dateRange;
    const option = this.page.getByRole('option', { name: label });
    await option.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Reset all filters to default values
   */
  async resetFilters(): Promise<void> {
    await this.filterHistory({
      type: 'ALL',
      status: 'ALL',
      dateRange: 'ALL',
    });
  }

  // ==================== Pagination Methods ====================

  /**
   * Navigate to a specific page in the credit history
   * @param pageNumber - The page number to navigate to (1-indexed)
   */
  async paginate(pageNumber: number): Promise<void> {
    await this.pagination.waitFor({ state: 'visible', timeout: 5000 });
    
    // Click the specific page button
    const pageButton = this.pagination.getByRole('button', { name: String(pageNumber) });
    await pageButton.click();
    
    // Wait for page change
    await this.page.waitForTimeout(300);
  }

  /**
   * Get the current page number
   * @returns The current page number
   */
  async getCurrentPage(): Promise<number> {
    const selectedButton = this.pagination.locator('button[aria-current="true"]');
    const pageText = await selectedButton.textContent();
    return pageText ? parseInt(pageText, 10) : 1;
  }

  /**
   * Get the total number of pages
   * @returns The total page count
   */
  async getTotalPages(): Promise<number> {
    const buttons = this.pagination.locator('button[aria-label^="Go to page"]');
    const count = await buttons.count();
    
    if (count === 0) {
      return 1;
    }

    // Get the last page button's label
    const lastButton = buttons.last();
    const label = await lastButton.getAttribute('aria-label');
    const match = label?.match(/Go to page (\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * Check if pagination is visible
   * @returns True if pagination is visible
   */
  async hasPagination(): Promise<boolean> {
    return await this.pagination.isVisible().catch(() => false);
  }

  // ==================== Action Methods ====================

  /**
   * Click the refresh button to reload credit data
   */
  async refresh(): Promise<void> {
    await this.refreshButton.click();
    // Wait for loading to complete
    await this.page.waitForTimeout(500);
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  // ==================== State Check Methods ====================

  /**
   * Check if the page is in loading state
   * @returns True if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible().catch(() => false);
  }

  /**
   * Check if there's an error displayed
   * @returns True if error alert is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorAlert.isVisible().catch(() => false);
  }

  /**
   * Get the error message if displayed
   * @returns The error message or null
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.hasError()) {
      return (await this.errorAlert.textContent())?.trim() || null;
    }
    return null;
  }

  /**
   * Check if expiration warning is displayed
   * @returns True if expiration warning is visible
   */
  async hasExpirationWarning(): Promise<boolean> {
    return await this.expirationWarningAlert.isVisible().catch(() => false);
  }

  /**
   * Get the expiration warning message
   * @returns The warning message or null
   */
  async getExpirationWarningMessage(): Promise<string | null> {
    if (await this.hasExpirationWarning()) {
      return (await this.expirationWarningAlert.textContent())?.trim() || null;
    }
    return null;
  }

  /**
   * Check if credit history is empty
   * @returns True if no credits are displayed
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyStateMessage.isVisible().catch(() => false);
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert credits page is displayed
   */
  async assertCreditsPageDisplayed(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Assert all balance cards are displayed
   */
  async assertBalanceCardsDisplayed(): Promise<void> {
    await expect(this.availableBalanceCard).toBeVisible();
    await expect(this.totalEarnedCard).toBeVisible();
    await expect(this.usedCreditsCard).toBeVisible();
    await expect(this.expiringSoonCard).toBeVisible();
  }

  /**
   * Assert filter section is displayed
   */
  async assertFilterSectionDisplayed(): Promise<void> {
    await expect(this.filterSection).toBeVisible();
    // Verify the filter labels are present - use first() to handle multiple matches
    await expect(this.filterSection.getByText('Credit Type').first()).toBeVisible();
    await expect(this.filterSection.getByText('Status').first()).toBeVisible();
    await expect(this.filterSection.getByText('Date Range').first()).toBeVisible();
  }

  /**
   * Assert credit history section is displayed
   */
  async assertCreditHistorySectionDisplayed(): Promise<void> {
    await expect(this.creditHistorySection).toBeVisible();
  }

  /**
   * Assert empty state is displayed
   */
  async assertEmptyStateDisplayed(): Promise<void> {
    await expect(this.emptyStateMessage).toBeVisible();
  }

  /**
   * Assert credit count equals expected
   * @param expected - Expected credit count
   */
  async assertCreditCount(expected: number): Promise<void> {
    const count = await this.getCreditCount();
    expect(count).toBe(expected);
  }

  /**
   * Assert available balance equals expected
   * @param expected - Expected balance string (e.g., "$100.00")
   */
  async assertBalance(expected: string): Promise<void> {
    const balance = await this.getBalance();
    expect(balance).toBe(expected);
  }

  /**
   * Assert a credit entry exists with the given type
   * @param type - Credit type to search for
   */
  async assertCreditTypeExists(type: string): Promise<void> {
    const entries = await this.getCreditHistory();
    const found = entries.some(entry => entry.type.includes(type));
    expect(found).toBe(true);
  }

  /**
   * Assert pagination is visible
   */
  async assertPaginationVisible(): Promise<void> {
    await expect(this.pagination).toBeVisible();
  }

  /**
   * Assert current page number
   * @param expected - Expected page number
   */
  async assertCurrentPage(expected: number): Promise<void> {
    const current = await this.getCurrentPage();
    expect(current).toBe(expected);
  }
}
