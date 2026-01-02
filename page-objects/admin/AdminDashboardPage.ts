import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Dashboard statistics displayed on the admin dashboard
 */
export interface DashboardStats {
  totalOrders: number;
  totalSales: number;
  totalProducts: number;
  activeBatches: number;
  pendingOrders: number;
  lowInventoryProducts: number;
  expiringBatches: number;
}

/**
 * Batch expiry alert information
 */
export interface BatchExpiryAlert {
  batchNumber: string;
  productName: string;
  daysUntilExpiry: number;
}

/**
 * Low stock alert information
 */
export interface LowStockAlert {
  productName: string;
  totalInventory: number;
  activeBatches: number;
}

/**
 * AdminDashboardPage Page Object
 * Handles admin dashboard page interactions
 *
 * Based on actual frontend implementation:
 * - AdminDashboardClient: zenithbioscience-next/src/app/admin/AdminDashboardClient.tsx
 *
 * Requirements covered:
 * - 14.2: Admin dashboard page object
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 *
 * Note: This page uses AdminGuard, so user must be logged in with ROLE_ADMIN.
 */
export class AdminDashboardPage extends BasePage {
  readonly path = '/admin';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /** Page heading - "Business Intelligence Dashboard" h1 */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Business Intelligence Dashboard', level: 1 });
  }

  /** Loading spinner */
  get loadingSpinner(): Locator {
    return this.page.locator('.MuiCircularProgress-root');
  }

  /** Error alert */
  get errorAlert(): Locator {
    return this.page.locator('.MuiAlert-root').filter({ hasText: /failed to load/i });
  }

  // ==================== Main Stats Card Locators ====================

  /** Total Orders stat card */
  get totalOrdersCard(): Locator {
    return this.page.locator('.MuiPaper-root').filter({ hasText: /total orders/i }).first();
  }

  /** Total Sales stat card */
  get totalSalesCard(): Locator {
    return this.page.locator('.MuiPaper-root').filter({ hasText: /total sales/i }).first();
  }

  /** Total Products stat card */
  get totalProductsCard(): Locator {
    return this.page.locator('.MuiPaper-root').filter({ hasText: /total products/i }).first();
  }

  /** Active Batches stat card */
  get activeBatchesCard(): Locator {
    return this.page.locator('.MuiPaper-root').filter({ hasText: /active batches/i }).first();
  }

  // ==================== Batch Management Section Locators ====================

  /** Inventory Batch Management card */
  get batchManagementCard(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: /inventory batch management/i });
  }

  /** Manage Batches button */
  get manageBatchesButton(): Locator {
    return this.page.getByRole('link', { name: /manage batches/i });
  }

  /** Total Batches stat in batch management section */
  get totalBatchesStat(): Locator {
    return this.batchManagementCard.locator('text=/total batches/i').locator('xpath=preceding-sibling::*[1]');
  }

  /** Expiring Soon stat in batch management section */
  get expiringSoonStat(): Locator {
    return this.batchManagementCard.locator('text=/expiring soon/i').locator('xpath=preceding-sibling::*[1]');
  }

  // ==================== Alerts Section Locators ====================

  /** Batch Expiry Warnings card */
  get batchExpiryWarningsCard(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: /batch expiry warnings/i });
  }

  /** Low Stock Alerts card */
  get lowStockAlertsCard(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: /low stock alerts/i });
  }

  /** View All expiring batches link */
  get viewAllExpiringLink(): Locator {
    return this.batchExpiryWarningsCard.getByRole('button', { name: /view all/i });
  }

  /** View All low stock link */
  get viewAllLowStockLink(): Locator {
    return this.lowStockAlertsCard.getByRole('button', { name: /view all/i });
  }

  // ==================== Quick Actions Section Locators ====================

  /** Quick Actions card */
  get quickActionsCard(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: /quick actions/i });
  }

  /** View All Batches button */
  get viewAllBatchesButton(): Locator {
    return this.quickActionsCard.getByRole('link', { name: /view all batches/i });
  }

  /** Expiring Batches button */
  get expiringBatchesButton(): Locator {
    return this.quickActionsCard.getByRole('link', { name: /expiring batches/i });
  }

  /** Low Stock Items button */
  get lowStockItemsButton(): Locator {
    return this.quickActionsCard.getByRole('link', { name: /low stock items/i });
  }

  /** Create New Batch button */
  get createNewBatchButton(): Locator {
    return this.quickActionsCard.getByRole('link', { name: /create new batch/i });
  }

  // ==================== System Status Section Locators ====================

  /** System Status card */
  get systemStatusCard(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: /system status/i });
  }

  /** Pending Orders stat in system status */
  get pendingOrdersStat(): Locator {
    return this.systemStatusCard.locator('text=/pending orders/i').locator('xpath=preceding-sibling::*[1]');
  }

  /** Low Inventory Products stat in system status */
  get lowInventoryProductsStat(): Locator {
    return this.systemStatusCard.locator('text=/low inventory products/i').locator('xpath=preceding-sibling::*[1]');
  }

  /** System Status indicator */
  get systemStatusIndicator(): Locator {
    return this.systemStatusCard.locator('text=/system status/i').locator('xpath=preceding-sibling::*[1]');
  }

  // ==================== Navigation Methods ====================

  /**
   * Wait for the dashboard page to be ready
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for loading to complete
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    // Wait for heading
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if dashboard is loading
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  /**
   * Check if there's an error displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  // ==================== Stats Methods ====================

  /**
   * Get dashboard statistics
   * @returns DashboardStats object with all main stats
   */
  async getStats(): Promise<DashboardStats> {
    await this.waitForPage();

    // Extract stats from cards
    const totalOrdersText = await this.totalOrdersCard.locator('.MuiTypography-h4').textContent() || '0';
    const totalSalesText = await this.totalSalesCard.locator('.MuiTypography-h4').textContent() || '$0';
    const totalProductsText = await this.totalProductsCard.locator('.MuiTypography-h4').textContent() || '0';
    const activeBatchesText = await this.activeBatchesCard.locator('.MuiTypography-h4').textContent() || '0';

    // Extract system status stats
    const pendingOrdersText = await this.pendingOrdersStat.textContent() || '0';
    const lowInventoryText = await this.lowInventoryProductsStat.textContent() || '0';
    
    // Extract expiring batches from batch management section
    const expiringBatchesText = await this.expiringSoonStat.textContent() || '0';

    return {
      totalOrders: parseInt(totalOrdersText.replace(/[^0-9]/g, ''), 10) || 0,
      totalSales: parseFloat(totalSalesText.replace(/[^0-9.]/g, '')) || 0,
      totalProducts: parseInt(totalProductsText.replace(/[^0-9]/g, ''), 10) || 0,
      activeBatches: parseInt(activeBatchesText.replace(/[^0-9]/g, ''), 10) || 0,
      pendingOrders: parseInt(pendingOrdersText.replace(/[^0-9]/g, ''), 10) || 0,
      lowInventoryProducts: parseInt(lowInventoryText.replace(/[^0-9]/g, ''), 10) || 0,
      expiringBatches: parseInt(expiringBatchesText.replace(/[^0-9]/g, ''), 10) || 0,
    };
  }

  /**
   * Get total orders count
   */
  async getTotalOrders(): Promise<number> {
    const text = await this.totalOrdersCard.locator('.MuiTypography-h4').textContent() || '0';
    return parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
  }

  /**
   * Get total sales amount
   */
  async getTotalSales(): Promise<number> {
    const text = await this.totalSalesCard.locator('.MuiTypography-h4').textContent() || '$0';
    return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
  }

  // ==================== Batch Expiry Alerts Methods ====================

  /**
   * Get batch expiry alerts displayed on the dashboard
   * @returns Array of BatchExpiryAlert objects
   */
  async getBatchExpiryAlerts(): Promise<BatchExpiryAlert[]> {
    const alerts: BatchExpiryAlert[] = [];

    // Check if there are no alerts
    const noAlertsMessage = this.batchExpiryWarningsCard.getByText(/no batches expiring soon/i);
    if (await noAlertsMessage.isVisible().catch(() => false)) {
      return alerts;
    }

    // Find all alert boxes
    const alertBoxes = this.batchExpiryWarningsCard.locator('div[class*="MuiBox-root"]').filter({
      has: this.page.locator('.MuiChip-root')
    });

    const count = await alertBoxes.count();
    for (let i = 0; i < count; i++) {
      const box = alertBoxes.nth(i);
      const text = await box.textContent() || '';

      // Extract batch number (format: ZB25012301)
      const batchMatch = text.match(/([A-Z]{2}\d+)/);
      const batchNumber = batchMatch ? batchMatch[1] : '';

      // Extract days until expiry from chip
      const daysMatch = text.match(/(\d+)\s*days?/i);
      const daysUntilExpiry = daysMatch ? parseInt(daysMatch[1], 10) : 0;

      // Extract product name (after batch number, before expiry date)
      const productName = await box.locator('.MuiTypography-body2').first().textContent() || '';

      if (batchNumber) {
        alerts.push({
          batchNumber,
          productName: productName.trim(),
          daysUntilExpiry,
        });
      }
    }

    return alerts;
  }

  // ==================== Low Stock Alerts Methods ====================

  /**
   * Get low stock alerts displayed on the dashboard
   * @returns Array of LowStockAlert objects
   */
  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    const alerts: LowStockAlert[] = [];

    // Check if there are no alerts
    const noAlertsMessage = this.lowStockAlertsCard.getByText(/no low stock alerts/i);
    if (await noAlertsMessage.isVisible().catch(() => false)) {
      return alerts;
    }

    // Find all alert boxes
    const alertBoxes = this.lowStockAlertsCard.locator('div[class*="MuiBox-root"]').filter({
      has: this.page.locator('.MuiChip-root')
    });

    const count = await alertBoxes.count();
    for (let i = 0; i < count; i++) {
      const box = alertBoxes.nth(i);
      const text = await box.textContent() || '';

      // Extract product name
      const productNameElement = box.locator('.MuiTypography-subtitle2');
      const productName = await productNameElement.textContent() || '';

      // Extract units from chip
      const unitsMatch = text.match(/(\d+)\s*units?/i);
      const totalInventory = unitsMatch ? parseInt(unitsMatch[1], 10) : 0;

      // Extract active batches count
      const batchesMatch = text.match(/(\d+)\s*active\s*batch/i);
      const activeBatches = batchesMatch ? parseInt(batchesMatch[1], 10) : 0;

      if (productName) {
        alerts.push({
          productName: productName.trim(),
          totalInventory,
          activeBatches,
        });
      }
    }

    return alerts;
  }

  // ==================== Quick Action Methods ====================

  /**
   * Click View All Batches button
   */
  async clickViewAllBatches(): Promise<void> {
    await this.viewAllBatchesButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click Expiring Batches button
   */
  async clickExpiringBatches(): Promise<void> {
    await this.expiringBatchesButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click Low Stock Items button
   */
  async clickLowStockItems(): Promise<void> {
    await this.lowStockItemsButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click Create New Batch button
   */
  async clickCreateNewBatch(): Promise<void> {
    await this.createNewBatchButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click Manage Batches button in batch management section
   */
  async clickManageBatches(): Promise<void> {
    await this.manageBatchesButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ==================== System Status Methods ====================

  /**
   * Get system status (Online/Offline)
   */
  async getSystemStatus(): Promise<string> {
    const text = await this.systemStatusIndicator.textContent() || '';
    return text.trim();
  }

  /**
   * Check if system is online
   */
  async isSystemOnline(): Promise<boolean> {
    const status = await this.getSystemStatus();
    return status.toLowerCase() === 'online';
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert dashboard page is displayed
   */
  async assertDashboardDisplayed(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Assert main stats cards are displayed
   */
  async assertStatsCardsDisplayed(): Promise<void> {
    await expect(this.totalOrdersCard).toBeVisible();
    await expect(this.totalSalesCard).toBeVisible();
    await expect(this.totalProductsCard).toBeVisible();
    await expect(this.activeBatchesCard).toBeVisible();
  }

  /**
   * Assert batch management section is displayed
   */
  async assertBatchManagementDisplayed(): Promise<void> {
    await expect(this.batchManagementCard).toBeVisible();
    await expect(this.manageBatchesButton).toBeVisible();
  }

  /**
   * Assert quick actions section is displayed
   */
  async assertQuickActionsDisplayed(): Promise<void> {
    await expect(this.quickActionsCard).toBeVisible();
    await expect(this.viewAllBatchesButton).toBeVisible();
    await expect(this.createNewBatchButton).toBeVisible();
  }

  /**
   * Assert system status section is displayed
   */
  async assertSystemStatusDisplayed(): Promise<void> {
    await expect(this.systemStatusCard).toBeVisible();
  }

  /**
   * Assert no error is displayed
   */
  async assertNoError(): Promise<void> {
    await expect(this.errorAlert).not.toBeVisible();
  }

  /**
   * Assert loading is complete
   */
  async assertLoadingComplete(): Promise<void> {
    await expect(this.loadingSpinner).not.toBeVisible();
  }
}
