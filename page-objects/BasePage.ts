import { Page, Locator, expect } from '@playwright/test';

/**
 * Base abstract class for all Page Objects
 * Provides common functionality for navigation, waiting, and element interaction
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 * - 7.5: Test ID selector helper
 */
export abstract class BasePage {
  protected readonly baseUrl: string = 'http://localhost:3000';

  constructor(public readonly page: Page) {}

  /**
   * Abstract property that must be implemented by subclasses
   * Defines the URL path for the page (relative to baseUrl)
   */
  abstract readonly path: string;

  /**
   * Get the full URL for this page
   */
  get url(): string {
    return `${this.baseUrl}${this.path}`;
  }

  /**
   * Navigate to this page
   */
  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to a specific URL
   * @param url - The URL to navigate to
   */
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  /**
   * Wait for navigation to complete
   * @param options - Optional navigation options
   */
  async waitForNavigation(options?: {
    timeout?: number;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  }): Promise<void> {
    await this.page.waitForLoadState(options?.waitUntil || 'networkidle', {
      timeout: options?.timeout,
    });
  }

  /**
   * Wait for the page to fully load
   * Uses domcontentloaded for faster response, with additional checks for WebKit compatibility
   */
  protected async waitForPageLoad(): Promise<void> {
    // Use domcontentloaded instead of networkidle to avoid timeout on pages with long-polling
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for React hydration by checking for interactive elements or body to be stable
    // This replaces the fixed 100ms timeout with a condition-based wait
    await this.page.locator('body').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    // Handle age verification dialog if present
    await this.handleAgeVerification();
    // Handle cookie consent if present
    await this.handleCookieConsent();
  }

  /**
   * Handle age verification dialog if present
   * Clicks "I am 21+" button to dismiss the dialog
   */
  async handleAgeVerification(): Promise<void> {
    try {
      const dialog = this.page.getByRole('dialog');
      if (await dialog.isVisible({ timeout: 2000 })) {
        const ageVerifyButton = this.page.getByRole('button', { name: 'I am 21+' });
        if (await ageVerifyButton.isVisible({ timeout: 1000 })) {
          await ageVerifyButton.click();
          // Wait for dialog to close
          await dialog.waitFor({ state: 'hidden', timeout: 3000 });
        }
      }
    } catch {
      // Age verification dialog not present, continue
    }
  }

  /**
   * Handle cookie consent banner if present
   * Clicks "Accept" button to dismiss the banner
   */
  async handleCookieConsent(): Promise<void> {
    try {
      const acceptButton = this.page.getByRole('button', { name: 'Accept' });
      if (await acceptButton.isVisible({ timeout: 1000 })) {
        await acceptButton.click();
        // Wait for banner to close by checking button is no longer visible
        await acceptButton.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      }
    } catch {
      // Cookie consent banner not present, continue
    }
  }

  /**
   * Get an element by its test ID attribute
   * @param testId - The test ID to search for
   * @returns Locator for the element
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Wait for an element to be visible
   * @param locator - The locator for the element
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForElement(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for an element to be hidden
   * @param locator - The locator for the element
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForElementHidden(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Wait for specific text to appear on the page
   * @param text - The text to wait for
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForText(text: string, timeout?: number): Promise<void> {
    await this.page.getByText(text).waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for specific text to disappear from the page
   * @param text - The text to wait for
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForTextHidden(text: string, timeout?: number): Promise<void> {
    await this.page.getByText(text).waitFor({ state: 'hidden', timeout });
  }

  /**
   * Take a screenshot of the current page
   * @param name - The name for the screenshot file
   * @param options - Optional screenshot options
   * @returns Buffer containing the screenshot
   */
  async takeScreenshot(
    name: string,
    options?: {
      fullPage?: boolean;
      path?: string;
    }
  ): Promise<Buffer> {
    const screenshotPath = options?.path || `screenshots/${name}.png`;
    return await this.page.screenshot({
      path: screenshotPath,
      fullPage: options?.fullPage ?? false,
    });
  }

  /**
   * Take a screenshot of a specific element
   * @param locator - The locator for the element
   * @param name - The name for the screenshot file
   * @returns Buffer containing the screenshot
   */
  async takeElementScreenshot(locator: Locator, name: string): Promise<Buffer> {
    return await locator.screenshot({
      path: `screenshots/${name}.png`,
    });
  }

  // ==================== Common Assertions ====================

  /**
   * Assert that the page URL matches the expected URL
   * @param expectedUrl - The expected URL (can be a string or regex)
   */
  async assertUrl(expectedUrl: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  /**
   * Assert that the page title matches the expected title
   * @param expectedTitle - The expected title (can be a string or regex)
   */
  async assertTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * Assert that an element is visible
   * @param locator - The locator for the element
   */
  async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Assert that an element is hidden
   * @param locator - The locator for the element
   */
  async assertHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  /**
   * Assert that an element contains specific text
   * @param locator - The locator for the element
   * @param text - The expected text
   */
  async assertText(locator: Locator, text: string | RegExp): Promise<void> {
    await expect(locator).toContainText(text);
  }

  /**
   * Assert that an element has a specific value
   * @param locator - The locator for the element
   * @param value - The expected value
   */
  async assertValue(locator: Locator, value: string | RegExp): Promise<void> {
    await expect(locator).toHaveValue(value);
  }

  /**
   * Assert that an element is enabled
   * @param locator - The locator for the element
   */
  async assertEnabled(locator: Locator): Promise<void> {
    await expect(locator).toBeEnabled();
  }

  /**
   * Assert that an element is disabled
   * @param locator - The locator for the element
   */
  async assertDisabled(locator: Locator): Promise<void> {
    await expect(locator).toBeDisabled();
  }

  /**
   * Assert that the page contains specific text
   * @param text - The text to search for
   */
  async assertPageContainsText(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  // ==================== Utility Methods ====================

  /**
   * Get the current page URL
   * @returns The current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Get the current page title
   * @returns Promise resolving to the page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Reload the current page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Go back to the previous page
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  /**
   * Go forward to the next page
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
    await this.waitForPageLoad();
  }

  /**
   * Check if an element exists on the page
   * @param locator - The locator for the element
   * @returns True if the element exists, false otherwise
   */
  async elementExists(locator: Locator): Promise<boolean> {
    return (await locator.count()) > 0;
  }

  /**
   * Get the count of elements matching a locator
   * @param locator - The locator for the elements
   * @returns The number of matching elements
   */
  async getElementCount(locator: Locator): Promise<number> {
    return await locator.count();
  }

  /**
   * Scroll to an element
   * @param locator - The locator for the element
   */
  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Wait for a specific amount of time (use sparingly)
   * @param ms - Milliseconds to wait
   * @deprecated Prefer condition-based waits like waitForElement, waitForText, or expect().toBeVisible()
   * Only use for animation delays or when no other condition can be used
   */
  async wait(ms: number): Promise<void> {
    // JUSTIFICATION: This is a utility method for cases where fixed waits are unavoidable
    // (e.g., CSS animations, third-party component transitions)
    await this.page.waitForTimeout(ms);
  }
}
