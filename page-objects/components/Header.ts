import { Page, Locator } from '@playwright/test';

/**
 * Header component Page Object
 * Handles navigation header interactions including logo, nav links, search, cart, and user menu
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 */
export class Header {
  private readonly page: Page;

  // Selectors
  private readonly logoSelector = '[data-testid="header-logo"]';
  private readonly navShopSelector = '[data-testid="nav-shop"]';
  private readonly navCartSelector = '[data-testid="nav-cart"]';
  private readonly navAccountSelector = '[data-testid="nav-account"]';
  private readonly searchInputSelector = '[data-testid="search-input"]';
  private readonly searchButtonSelector = '[data-testid="search-button"]';
  private readonly cartIconSelector = '[data-testid="cart-icon"]';
  private readonly cartCountSelector = '[data-testid="cart-count"]';
  private readonly userMenuSelector = '[data-testid="user-menu"]';
  private readonly loginButtonSelector = '[data-testid="login-button"]';
  private readonly logoutButtonSelector = '[data-testid="logout-button"]';
  private readonly userMenuDropdownSelector = '[data-testid="user-menu-dropdown"]';

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Locators ====================

  /**
   * Get the logo element
   */
  get logo(): Locator {
    return this.page.locator(this.logoSelector);
  }

  /**
   * Get the Shop navigation link
   */
  get navShop(): Locator {
    return this.page.locator(this.navShopSelector);
  }

  /**
   * Get the Cart navigation link
   */
  get navCart(): Locator {
    return this.page.locator(this.navCartSelector);
  }

  /**
   * Get the Account navigation link
   */
  get navAccount(): Locator {
    return this.page.locator(this.navAccountSelector);
  }

  /**
   * Get the search input field
   */
  get searchInput(): Locator {
    return this.page.locator(this.searchInputSelector);
  }

  /**
   * Get the search button
   */
  get searchButton(): Locator {
    return this.page.locator(this.searchButtonSelector);
  }

  /**
   * Get the cart icon
   */
  get cartIcon(): Locator {
    return this.page.locator(this.cartIconSelector);
  }

  /**
   * Get the cart item count badge
   * Uses MUI Badge which renders the count in a span with class MuiBadge-badge
   */
  get cartCount(): Locator {
    // MUI Badge renders the count in a span with class MuiBadge-badge
    return this.page.locator('.MuiBadge-badge');
  }

  /**
   * Get the user menu button
   */
  get userMenu(): Locator {
    return this.page.locator(this.userMenuSelector);
  }

  /**
   * Get the login button
   */
  get loginButton(): Locator {
    return this.page.locator(this.loginButtonSelector);
  }

  /**
   * Get the logout button
   */
  get logoutButton(): Locator {
    return this.page.locator(this.logoutButtonSelector);
  }

  /**
   * Get the user menu dropdown
   */
  get userMenuDropdown(): Locator {
    return this.page.locator(this.userMenuDropdownSelector);
  }

  // ==================== Navigation Actions ====================

  /**
   * Click the logo to navigate to home page
   */
  async clickLogo(): Promise<void> {
    await this.logo.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to the Shop page
   */
  async goToShop(): Promise<void> {
    await this.navShop.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to the Cart page
   */
  async goToCart(): Promise<void> {
    await this.navCart.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to the Account page
   */
  async goToAccount(): Promise<void> {
    await this.navAccount.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ==================== Search Actions ====================

  /**
   * Perform a search
   * @param query - The search query
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Enter text in the search input without submitting
   * @param query - The search query
   */
  async enterSearchQuery(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  /**
   * Submit the search form by pressing Enter
   */
  async submitSearch(): Promise<void> {
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear the search input
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }

  /**
   * Get the current search query value
   * @returns The current search input value
   */
  async getSearchQuery(): Promise<string> {
    return await this.searchInput.inputValue();
  }

  // ==================== Cart Actions ====================

  /**
   * Click the cart icon to open cart drawer or navigate to cart
   */
  async clickCartIcon(): Promise<void> {
    await this.cartIcon.click();
  }

  /**
   * Get the number of items in the cart from the badge
   * Works on both desktop (header badge) and mobile (bottom navigation badge)
   * @returns The cart item count, or 0 if badge is not visible
   */
  async getCartItemCount(): Promise<number> {
    try {
      // Wait a moment for React state to update
      await this.page.waitForTimeout(500);
      
      // First try to find the mobile navigation cart button with aria-label containing item count
      // The mobile nav has aria-label like "Navigate to cart page with X items"
      const mobileCartButton = this.page.locator('[aria-label*="Navigate to cart page with"]');
      if (await mobileCartButton.isVisible({ timeout: 2000 })) {
        const ariaLabel = await mobileCartButton.getAttribute('aria-label');
        if (ariaLabel) {
          const match = ariaLabel.match(/with (\d+) items?/);
          if (match) {
            return parseInt(match[1], 10);
          }
        }
      }
      
      // Fall back to MUI Badge - look for visible badges with numeric content
      // MUI Badge renders the count in a span with class MuiBadge-badge
      const badges = this.page.locator('.MuiBadge-badge:not(.MuiBadge-invisible)');
      const count = await badges.count();
      
      for (let i = 0; i < count; i++) {
        const badge = badges.nth(i);
        try {
          const isVisible = await badge.isVisible({ timeout: 500 });
          if (isVisible) {
            const countText = await badge.textContent();
            if (countText && /^\d+$/.test(countText.trim())) {
              return parseInt(countText.trim(), 10);
            }
          }
        } catch {
          // Continue to next badge
        }
      }
      
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Check if the cart has items
   * @returns True if cart has items, false otherwise
   */
  async hasCartItems(): Promise<boolean> {
    return (await this.getCartItemCount()) > 0;
  }

  // ==================== User Menu Actions ====================

  /**
   * Open the user menu dropdown
   */
  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
    await this.userMenuDropdown.waitFor({ state: 'visible' });
  }

  /**
   * Close the user menu dropdown
   */
  async closeUserMenu(): Promise<void> {
    // Click outside to close the dropdown
    await this.page.keyboard.press('Escape');
    await this.userMenuDropdown.waitFor({ state: 'hidden' });
  }

  /**
   * Click the login button
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click the logout button (assumes user menu is open)
   */
  async clickLogout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Perform logout action (opens menu and clicks logout)
   */
  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.clickLogout();
  }

  /**
   * Check if the user is logged in
   * @returns True if logged in (logout button visible), false otherwise
   */
  async isLoggedIn(): Promise<boolean> {
    await this.openUserMenu();
    const isLoggedIn = await this.logoutButton.isVisible();
    await this.closeUserMenu();
    return isLoggedIn;
  }

  /**
   * Check if the login button is visible
   * @returns True if login button is visible
   */
  async isLoginButtonVisible(): Promise<boolean> {
    return await this.loginButton.isVisible();
  }

  // ==================== Visibility Checks ====================

  /**
   * Check if the header is visible
   * @returns True if header logo is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.logo.isVisible();
  }

  /**
   * Check if the search functionality is visible
   * @returns True if search input is visible
   */
  async isSearchVisible(): Promise<boolean> {
    return await this.searchInput.isVisible();
  }

  /**
   * Wait for the header to be fully loaded
   */
  async waitForHeader(): Promise<void> {
    await this.logo.waitFor({ state: 'visible' });
  }
}
