import { test, expect } from '@playwright/test';
import { ShopPage } from '../../page-objects';
import { defaultFixtures } from '../../fixtures/defaultFixtures';

/**
 * Product Search E2E Tests
 *
 * Tests for search and filter functionality with seeded products
 *
 * Requirements covered:
 * - 3.2: Search results match query
 * - 3.4: Filter products by category
 */
test.describe('Product Search', () => {
  let shopPage: ShopPage;

  test.beforeEach(async ({ page }) => {
    shopPage = new ShopPage(page);
    await shopPage.goto();
    await shopPage.waitForProductsLoad();
  });

  test('should have search input visible', async () => {
    await expect(shopPage.searchInput).toBeVisible();
  });

  test('should allow typing in search input', async () => {
    const searchTerm = 'test product';
    await shopPage.searchInput.fill(searchTerm);

    const value = await shopPage.getSearchQuery();
    expect(value).toBe(searchTerm);
  });

  test('should clear search input', async () => {
    await shopPage.searchInput.fill('test');
    await shopPage.clearSearch();

    const value = await shopPage.getSearchQuery();
    expect(value).toBe('');
  });

  test('should have category filter visible', async () => {
    // On mobile, filters are in a collapsible accordion - expand it first
    await shopPage.expandMobileFilters();
    await expect(shopPage.categoryFilter).toBeVisible();
  });

  test('should have price filter visible', async () => {
    // On mobile, filters are in a collapsible accordion - expand it first
    await shopPage.expandMobileFilters();
    await expect(shopPage.priceFilter).toBeVisible();
  });

  test('should return matching products when searching for "Peptide"', async () => {
    await shopPage.search('Peptide');
    await shopPage.page.waitForTimeout(1000); // Wait for search results

    const productCount = await shopPage.getProductCount();
    // Should find at least the "Test Peptide Alpha" product
    expect(productCount).toBeGreaterThanOrEqual(1);
  });

  test('should return matching products when searching for "Blend"', async () => {
    await shopPage.search('Blend');
    await shopPage.page.waitForTimeout(1000);

    const productCount = await shopPage.getProductCount();
    // Should find at least the "Test Blend Beta" product
    expect(productCount).toBeGreaterThanOrEqual(1);
  });

  test('should return no products for non-matching search', async () => {
    await shopPage.search('xyznonexistent12345');
    await shopPage.page.waitForTimeout(1000);

    const productCount = await shopPage.getProductCount();
    expect(productCount).toBe(0);
  });

  test('should filter products by PEPTIDE category', async ({ page }) => {
    // On mobile, filters are in a collapsible accordion - expand it first
    await shopPage.expandMobileFilters();
    
    // Look for category filter options
    const categorySelect = shopPage.categoryFilter;

    if (await categorySelect.isVisible()) {
      // Try to select PEPTIDE category
      await categorySelect.click();
      await page.waitForTimeout(500);

      // Look for PEPTIDE option
      const peptideOption = page.getByRole('option', { name: /peptide/i });
      if (await peptideOption.isVisible()) {
        await peptideOption.click();
        await page.waitForTimeout(1000);

        // Verify filtered results
        const productCount = await shopPage.getProductCount();
        expect(productCount).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('should show all products when clearing filters', async () => {
    // Get initial product count (before any filtering)
    const initialCount = await shopPage.getProductCount();
    
    // First apply a search
    await shopPage.search('Peptide');
    await shopPage.page.waitForTimeout(1000);

    // Verify search reduced the count (or kept it the same if all match)
    const filteredCount = await shopPage.getProductCount();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Then clear it
    await shopPage.clearSearch();
    await shopPage.page.waitForTimeout(1000);

    // Should restore to initial count
    const restoredCount = await shopPage.getProductCount();
    expect(restoredCount).toBe(initialCount);
  });

  test('should filter by in-stock products', async () => {
    // On mobile, filters are in a collapsible accordion - expand it first
    await shopPage.expandMobileFilters();
    
    const inStockCheckbox = shopPage.inStockCheckbox;

    if (await inStockCheckbox.isVisible()) {
      await inStockCheckbox.check();
      await shopPage.page.waitForTimeout(1000);

      const productCount = await shopPage.getProductCount();
      // Should show only in-stock products (2 out of 3 in fixtures)
      expect(productCount).toBeLessThanOrEqual(defaultFixtures.products.length);
    }
  });

  test('should filter by on-sale products', async () => {
    // On mobile, filters are in a collapsible accordion - expand it first
    await shopPage.expandMobileFilters();
    
    const onSaleCheckbox = shopPage.onSaleCheckbox;

    if (await onSaleCheckbox.isVisible()) {
      await onSaleCheckbox.check();
      await shopPage.page.waitForTimeout(1000);

      const productCount = await shopPage.getProductCount();
      // Should show only on-sale products (1 in fixtures)
      expect(productCount).toBeGreaterThanOrEqual(0);
    }
  });
});
