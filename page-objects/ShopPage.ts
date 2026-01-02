import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Product data interface for shop page products
 */
export interface ProductCardData {
  name: string;
  size: string;
  slug: string;
  status: string;
}

/**
 * Sort options available on the shop page
 */
export type SortOption = 'nameAsc' | 'nameDesc' | 'priceAsc' | 'priceDesc';

/**
 * ShopPage Page Object
 * Handles product listing interactions including search, filter, sort, and pagination
 *
 * Requirements covered:
 * - 3.1: Product catalog display
 * - 3.2: Product search functionality
 * - 3.4: Category filtering
 * - 3.5: Product sorting
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 */
export class ShopPage extends BasePage {
  readonly path = '/shop';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Products', level: 1 });
  }

  get searchInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Search Products' });
  }

  /** Mobile filter accordion toggle */
  get mobileFilterAccordion(): Locator {
    return this.page.getByTestId('mobile-filter-accordion');
  }

  /** Mobile filter accordion summary (clickable header) */
  get mobileFilterToggle(): Locator {
    return this.page.locator('#filter-header');
  }

  get categoryFilter(): Locator {
    return this.page.getByRole('combobox', { name: 'Filter products by category' });
  }

  get priceFilter(): Locator {
    return this.page.getByRole('combobox', { name: 'Filter products by price range' });
  }

  get sortDropdown(): Locator {
    return this.page.getByRole('combobox', { name: 'Sort products by name or price' });
  }

  get onSaleCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: 'Filter to show only products on sale' });
  }

  get inStockCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: 'Filter to show only products in stock' });
  }

  get productListing(): Locator {
    return this.page.locator('[aria-label="Product listing"]');
  }

  get productCards(): Locator {
    // Product cards are links with "View details for" in their accessible name
    return this.page.getByRole('link', { name: /View details for/i });
  }

  get loadingStatus(): Locator {
    return this.page.getByRole('status').filter({ hasText: /loading/i });
  }

  get productCountStatus(): Locator {
    return this.page.getByRole('status').filter({ hasText: /products loaded/i });
  }

  get pagination(): Locator {
    return this.page.getByRole('navigation', { name: 'pagination navigation' });
  }

  get nextPageButton(): Locator {
    return this.page.getByRole('button', { name: 'Go to next page' });
  }

  get prevPageButton(): Locator {
    return this.page.getByRole('button', { name: 'Go to previous page' });
  }

  get firstPageButton(): Locator {
    return this.page.getByRole('button', { name: 'Go to first page' });
  }

  get lastPageButton(): Locator {
    return this.page.getByRole('button', { name: 'Go to last page' });
  }

  // ==================== Search Methods ====================

  /**
   * Check if we're on mobile (filters are in accordion)
   * @returns True if mobile filter accordion is present
   */
  async isMobileView(): Promise<boolean> {
    return await this.mobileFilterAccordion.isVisible();
  }

  /**
   * Expand mobile filters accordion if on mobile
   * Does nothing on desktop where filters are always visible
   */
  async expandMobileFilters(): Promise<void> {
    if (await this.isMobileView()) {
      const accordion = this.mobileFilterAccordion;
      const isExpanded = await accordion.getAttribute('aria-expanded') === 'true' ||
                         await accordion.locator('[aria-expanded="true"]').count() > 0;
      
      if (!isExpanded) {
        await this.mobileFilterToggle.click();
        // Wait for accordion to expand by checking for expanded state
        await expect(accordion.locator('[aria-expanded="true"]')).toBeVisible({ timeout: 3000 }).catch(() => {});
      }
    }
  }

  /**
   * Search for products by query
   * @param query - The search query
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForProductsLoad();
  }

  /**
   * Clear the search input
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.waitForProductsLoad();
  }

  /**
   * Get the current search query value
   * @returns The current search input value
   */
  async getSearchQuery(): Promise<string> {
    return await this.searchInput.inputValue();
  }

  // ==================== Filter Methods ====================

  /**
   * Filter products by category
   * @param category - The category to filter by
   */
  async filterByCategory(category: string): Promise<void> {
    await this.expandMobileFilters();
    await this.categoryFilter.click();
    await this.page.getByRole('option', { name: category }).click();
    await this.waitForProductsLoad();
  }

  /**
   * Filter products by price range
   * @param priceRange - The price range to filter by
   */
  async filterByPrice(priceRange: string): Promise<void> {
    await this.expandMobileFilters();
    await this.priceFilter.click();
    await this.page.getByRole('option', { name: priceRange }).click();
    await this.waitForProductsLoad();
  }

  /**
   * Toggle the "On Sale" filter
   */
  async toggleOnSaleFilter(): Promise<void> {
    await this.expandMobileFilters();
    await this.onSaleCheckbox.click();
    await this.waitForProductsLoad();
  }

  /**
   * Toggle the "In Stock" filter
   */
  async toggleInStockFilter(): Promise<void> {
    await this.expandMobileFilters();
    await this.inStockCheckbox.click();
    await this.waitForProductsLoad();
  }

  // ==================== Sort Methods ====================

  /**
   * Sort products by the specified option
   * @param option - The sort option
   */
  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.click();
    
    const optionNames: Record<SortOption, string> = {
      'nameAsc': 'Name (A–Z)',
      'nameDesc': 'Name (Z–A)',
      'priceAsc': 'Price (Low to High)',
      'priceDesc': 'Price (High to Low)',
    };
    
    await this.page.getByRole('option', { name: optionNames[option] }).click();
    await this.waitForProductsLoad();
  }

  /**
   * Get the current sort option text
   * @returns The current sort option display text
   */
  async getCurrentSort(): Promise<string> {
    return await this.sortDropdown.textContent() || '';
  }

  // ==================== Product Methods ====================

  /**
   * Get all products displayed on the current page
   * @returns Array of product data
   */
  async getProducts(): Promise<ProductCardData[]> {
    await this.waitForProductsLoad();
    const products: ProductCardData[] = [];
    const cards = this.productCards;
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const href = await card.getAttribute('href') || '';
      const slug = href.replace('/shop/', '');
      
      // Get the heading inside the card
      const heading = card.getByRole('heading', { level: 5 });
      const name = await heading.textContent() || '';
      
      // Get the parent container to find size and status
      const cardContainer = card.locator('..').locator('..');
      
      // Get size from paragraph after heading (if exists)
      const paragraphs = cardContainer.locator('p');
      const paragraphCount = await paragraphs.count();
      let size = '';
      let status = '';
      
      if (paragraphCount > 0) {
        size = await paragraphs.first().textContent() || '';
      }
      if (paragraphCount > 1) {
        status = await paragraphs.last().textContent() || '';
      }

      products.push({
        name: name.trim(),
        size: size.trim(),
        slug,
        status: status.trim(),
      });
    }

    return products;
  }

  /**
   * Get the total number of products displayed
   * @returns Number of product cards
   */
  async getProductCount(): Promise<number> {
    await this.waitForProductsLoad();
    return await this.productCards.count();
  }

  /**
   * Get the total product count from the status element
   * @returns Total number of products loaded
   */
  async getTotalProductCount(): Promise<number> {
    const statusText = await this.productCountStatus.textContent();
    if (!statusText) return 0;

    const match = statusText.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get product names from the current page
   * @returns Array of product names
   */
  async getProductNames(): Promise<string[]> {
    const products = await this.getProducts();
    return products.map((p) => p.name);
  }

  /**
   * Click on a product by its name
   * @param productName - The product name
   */
  async clickProductByName(productName: string): Promise<void> {
    const link = this.page.getByRole('link', { name: new RegExp(`View details for ${productName}`, 'i') });
    await link.click();
    await this.waitForNavigation();
  }

  /**
   * Click on a product by its index (0-based)
   * @param index - The product index
   */
  async clickProductByIndex(index: number): Promise<void> {
    const card = this.productCards.nth(index);
    await card.click();
    await this.waitForNavigation();
  }

  /**
   * Check if a specific product is displayed by name
   * @param productName - The product name
   * @returns True if product is visible
   */
  async isProductDisplayed(productName: string): Promise<boolean> {
    const link = this.page.getByRole('link', { name: new RegExp(`View details for ${productName}`, 'i') });
    return await link.isVisible();
  }

  // ==================== Pagination Methods ====================

  /**
   * Check if pagination is available
   * @returns True if pagination is visible
   */
  async hasPagination(): Promise<boolean> {
    return await this.pagination.isVisible();
  }

  /**
   * Go to the next page
   */
  async goToNextPage(): Promise<void> {
    await this.nextPageButton.click();
    await this.waitForProductsLoad();
  }

  /**
   * Go to the previous page
   */
  async goToPreviousPage(): Promise<void> {
    await this.prevPageButton.click();
    await this.waitForProductsLoad();
  }

  /**
   * Go to a specific page number
   * @param pageNumber - The page number to navigate to
   */
  async goToPage(pageNumber: number): Promise<void> {
    const pageButton = this.page.getByRole('button', { name: `Go to page ${pageNumber}` });
    await pageButton.click();
    await this.waitForProductsLoad();
  }

  /**
   * Check if next page button is enabled
   * @returns True if next page is available
   */
  async canGoToNextPage(): Promise<boolean> {
    return await this.nextPageButton.isEnabled();
  }

  /**
   * Check if previous page button is enabled
   * @returns True if previous page is available
   */
  async canGoToPreviousPage(): Promise<boolean> {
    return await this.prevPageButton.isEnabled();
  }

  // ==================== State Methods ====================

  /**
   * Check if products are loading
   * @returns True if loading indicator is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingStatus.isVisible();
  }

  /**
   * Wait for products to finish loading
   */
  async waitForProductsLoad(): Promise<void> {
    // Wait for loading to disappear first
    try {
      await this.loadingStatus.waitFor({ state: 'hidden', timeout: 30000 });
    } catch {
      // Loading may have already finished
    }

    // Wait for either products loaded status OR no products message
    try {
      await this.page.waitForSelector(
        '[role="status"]:has-text("products loaded"), [role="status"]:has-text("No products found")',
        { state: 'visible', timeout: 30000 }
      );
    } catch {
      // Status may not appear
    }

    // Wait for product grid to be stable (at least one product card or empty state)
    await Promise.race([
      this.productCards.first().waitFor({ state: 'visible', timeout: 5000 }),
      this.page.getByText(/no products found/i).waitFor({ state: 'visible', timeout: 5000 }),
    ]).catch(() => {});
  }

  /**
   * Wait for the shop page to be ready
   */
  async waitForPage(): Promise<void> {
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.waitForProductsLoad();
  }
}
