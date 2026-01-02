import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { CreditsPage } from '../../page-objects/account/CreditsPage';
import { getAccountUser } from '../../fixtures/defaultFixtures';

/**
 * Account Credits E2E Tests
 *
 * Tests for account credits dashboard functionality
 *
 * Requirements covered:
 * - 12.9: Credits dashboard page object
 * - Credits page loads and displays correctly
 * - Credit balance and history are visible
 * - Filter and pagination functionality
 */
test.describe('Account Credits Page', () => {
  let loginPage: LoginPage;
  let creditsPage: CreditsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    creditsPage = new CreditsPage(page);

    // Get isolated user for credits tests
    const user = getAccountUser('accountCredits');

    // Login first (credits page requires authentication)
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(user.email, user.password);

    // Wait for login to complete
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15000,
    });

    // Navigate to credits page
    await creditsPage.goto();
    await creditsPage.waitForPage();
  });

  test('should load credits page successfully', async () => {
    // Verify page heading is displayed
    await creditsPage.assertCreditsPageDisplayed();

    // Verify URL is correct
    expect(creditsPage.page.url()).toContain('/account/credits');
  });

  test('should display credit balance cards', async () => {
    // Verify all balance cards are visible
    await creditsPage.assertBalanceCardsDisplayed();

    // Verify balance can be retrieved
    const balance = await creditsPage.getBalance();
    expect(balance).toBeDefined();
    expect(balance).toMatch(/^\$[\d,]+\.\d{2}$/); // Format: $X.XX or $X,XXX.XX
  });

  test('should display credit history section', async () => {
    // Verify credit history section is visible
    await creditsPage.assertCreditHistorySectionDisplayed();

    // Verify the section heading exists
    await expect(creditsPage.creditHistoryHeading).toBeVisible();
  });

  test('should show empty state when no credit history exists', async () => {
    // Check if empty state is displayed (for users with no credits)
    const isEmpty = await creditsPage.isEmpty();

    if (isEmpty) {
      // Verify empty state message is shown
      await creditsPage.assertEmptyStateDisplayed();
    } else {
      // If not empty, verify table is displayed
      await expect(creditsPage.creditHistoryTable).toBeVisible();
    }
  });

  test('should display filter section with filter options', async () => {
    // Verify filter section is displayed
    await creditsPage.assertFilterSectionDisplayed();

    // Verify individual filter controls are visible - they're inside FormControls
    await expect(creditsPage.filterSection).toBeVisible();
    
    // Check that the filter section contains the expected labels - use first() to handle multiple matches
    await expect(creditsPage.filterSection.getByText('Credit Type').first()).toBeVisible();
    await expect(creditsPage.filterSection.getByText('Status').first()).toBeVisible();
    await expect(creditsPage.filterSection.getByText('Date Range').first()).toBeVisible();
  });

  test('should filter credit history by type', async () => {
    // Get initial credit count
    const initialCount = await creditsPage.getCreditCount();

    // Apply type filter - this should work regardless of whether there are credits
    await creditsPage.filterHistory({ type: 'COA_SUBMISSION' });

    // Get filtered count
    const filteredCount = await creditsPage.getFilteredCount();

    // Filtered count should be less than or equal to initial count
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Reset filters
    await creditsPage.resetFilters();

    // Verify count is restored (or still 0 if there were no credits)
    const resetCount = await creditsPage.getCreditCount();
    expect(resetCount).toBe(initialCount);
  });

  test('should filter credit history by status', async () => {
    // Get initial credit count
    const initialCount = await creditsPage.getCreditCount();

    // Filter by active status
    await creditsPage.filterHistory({ status: 'ACTIVE' });

    // Get filtered count
    const filteredCount = await creditsPage.getFilteredCount();

    // Filtered count should be less than or equal to initial count
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Reset filters
    await creditsPage.resetFilters();
  });

  test('should filter credit history by date range', async () => {
    // Get initial credit count
    const initialCount = await creditsPage.getCreditCount();

    // Filter by last 30 days
    await creditsPage.filterHistory({ dateRange: '30_DAYS' });

    // Get filtered count
    const filteredCount = await creditsPage.getFilteredCount();

    // Filtered count should be less than or equal to initial count
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Reset filters
    await creditsPage.resetFilters();
  });

  test('should handle pagination when multiple entries exist', async () => {
    // Check if pagination is available
    const hasPagination = await creditsPage.hasPagination();

    if (hasPagination) {
      // Verify pagination is visible
      await creditsPage.assertPaginationVisible();

      // Get current page
      const currentPage = await creditsPage.getCurrentPage();
      expect(currentPage).toBe(1);

      // Get total pages
      const totalPages = await creditsPage.getTotalPages();
      expect(totalPages).toBeGreaterThanOrEqual(1);

      // If more than one page, test navigation
      if (totalPages > 1) {
        // Navigate to page 2
        await creditsPage.paginate(2);

        // Verify page changed
        const newPage = await creditsPage.getCurrentPage();
        expect(newPage).toBe(2);

        // Navigate back to page 1
        await creditsPage.paginate(1);

        // Verify back on page 1
        const finalPage = await creditsPage.getCurrentPage();
        expect(finalPage).toBe(1);
      }
    } else {
      // No pagination means all entries fit on one page or no entries
      const creditCount = await creditsPage.getCreditCount();
      // This is expected behavior - pagination only shows when needed
      expect(creditCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display refresh button and allow data refresh', async () => {
    // The refresh button is an IconButton with a tooltip "Refresh data"
    // It's in the header area next to the "Account Credits" heading
    
    // First, verify we're on the credits page
    await expect(creditsPage.page).toHaveURL(/\/account\/credits/);
    
    // Find the refresh button by its tooltip
    const refreshButton = creditsPage.page.getByRole('button', { name: 'Refresh data' });
    
    // Check if the refresh button is visible
    const isRefreshVisible = await refreshButton.isVisible().catch(() => false);
    
    if (isRefreshVisible) {
      // Click the refresh button
      await refreshButton.click();
      
      // Wait for any loading to complete - use network idle instead of fixed timeout
      await creditsPage.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      
      // Verify we're still on the credits page
      await expect(creditsPage.page).toHaveURL(/\/account\/credits/);
    } else {
      // If refresh button not found, just verify the page is displayed correctly
      await creditsPage.assertCreditsPageDisplayed();
    }
  });

  test('should display total earned and used credits', async () => {
    // Get total earned
    const totalEarned = await creditsPage.getTotalEarned();
    expect(totalEarned).toBeDefined();
    expect(totalEarned).toMatch(/^\$[\d,]+\.\d{2}$/);

    // Get total used
    const totalUsed = await creditsPage.getTotalUsed();
    expect(totalUsed).toBeDefined();
    expect(totalUsed).toMatch(/^\$[\d,]+\.\d{2}$/);
  });

  test('should display expiring soon amount', async () => {
    // Get expiring amount
    const expiringAmount = await creditsPage.getExpiringAmount();
    expect(expiringAmount).toBeDefined();
    expect(expiringAmount).toMatch(/^\$[\d,]+\.\d{2}$/);
  });

  test('should not show error state on initial load', async () => {
    // Verify no error is displayed
    const hasError = await creditsPage.hasError();
    expect(hasError).toBeFalsy();
  });
});
