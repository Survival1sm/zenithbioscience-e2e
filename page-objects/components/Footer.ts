import { Page, Locator } from '@playwright/test';

/**
 * Footer component Page Object
 * Handles footer interactions including links, social media, and copyright
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 */
export class Footer {
  private readonly page: Page;

  // Selectors
  private readonly footerSelector = '[data-testid="footer"]';
  private readonly footerLinksSelector = '[data-testid="footer-links"]';
  private readonly footerLinkSelector = '[data-testid="footer-link"]';
  private readonly socialLinksSelector = '[data-testid="social-links"]';
  private readonly socialLinkSelector = '[data-testid="social-link"]';
  private readonly copyrightSelector = '[data-testid="footer-copyright"]';
  private readonly newsletterFormSelector = '[data-testid="newsletter-form"]';
  private readonly newsletterInputSelector = '[data-testid="newsletter-input"]';
  private readonly newsletterButtonSelector = '[data-testid="newsletter-button"]';

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Locators ====================

  get footer(): Locator {
    return this.page.locator(this.footerSelector);
  }

  get footerLinks(): Locator {
    return this.page.locator(this.footerLinksSelector);
  }

  get allFooterLinks(): Locator {
    return this.page.locator(this.footerLinkSelector);
  }

  get socialLinks(): Locator {
    return this.page.locator(this.socialLinksSelector);
  }

  get allSocialLinks(): Locator {
    return this.page.locator(this.socialLinkSelector);
  }

  get copyright(): Locator {
    return this.page.locator(this.copyrightSelector);
  }

  get newsletterForm(): Locator {
    return this.page.locator(this.newsletterFormSelector);
  }

  get newsletterInput(): Locator {
    return this.page.locator(this.newsletterInputSelector);
  }

  get newsletterButton(): Locator {
    return this.page.locator(this.newsletterButtonSelector);
  }

  // ==================== Footer Link Actions ====================

  /**
   * Get all footer link texts
   * @returns Array of link texts
   */
  async getFooterLinkTexts(): Promise<string[]> {
    const links = this.allFooterLinks;
    const count = await links.count();
    const texts: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).textContent();
      if (text) {
        texts.push(text.trim());
      }
    }

    return texts;
  }

  /**
   * Click a footer link by its text
   * @param linkText - The text of the link to click
   */
  async clickFooterLink(linkText: string): Promise<void> {
    await this.page.locator(`${this.footerLinkSelector}:has-text("${linkText}")`).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get a footer link by its text
   * @param linkText - The text of the link
   * @returns Locator for the link
   */
  getFooterLinkByText(linkText: string): Locator {
    return this.page.locator(`${this.footerLinkSelector}:has-text("${linkText}")`);
  }

  /**
   * Check if a specific footer link exists
   * @param linkText - The text of the link
   * @returns True if the link exists
   */
  async hasFooterLink(linkText: string): Promise<boolean> {
    return (await this.getFooterLinkByText(linkText).count()) > 0;
  }

  /**
   * Get the href attribute of a footer link
   * @param linkText - The text of the link
   * @returns The href value
   */
  async getFooterLinkHref(linkText: string): Promise<string | null> {
    return await this.getFooterLinkByText(linkText).getAttribute('href');
  }

  // ==================== Social Media Link Actions ====================

  /**
   * Get all social media link data
   * @returns Array of social link data
   */
  async getSocialLinks(): Promise<SocialLinkData[]> {
    const links = this.allSocialLinks;
    const count = await links.count();
    const socialLinks: SocialLinkData[] = [];

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      const platform = await link.getAttribute('data-platform');
      const ariaLabel = await link.getAttribute('aria-label');

      socialLinks.push({
        href: href || '',
        platform: platform || '',
        ariaLabel: ariaLabel || '',
      });
    }

    return socialLinks;
  }

  /**
   * Click a social media link by platform name
   * @param platform - The platform name (e.g., 'facebook', 'twitter', 'instagram')
   */
  async clickSocialLink(platform: string): Promise<void> {
    await this.page.locator(`${this.socialLinkSelector}[data-platform="${platform}"]`).click();
  }

  /**
   * Get a social media link by platform
   * @param platform - The platform name
   * @returns Locator for the social link
   */
  getSocialLinkByPlatform(platform: string): Locator {
    return this.page.locator(`${this.socialLinkSelector}[data-platform="${platform}"]`);
  }

  /**
   * Check if a specific social media link exists
   * @param platform - The platform name
   * @returns True if the link exists
   */
  async hasSocialLink(platform: string): Promise<boolean> {
    return (await this.getSocialLinkByPlatform(platform).count()) > 0;
  }

  /**
   * Get the count of social media links
   * @returns Number of social links
   */
  async getSocialLinkCount(): Promise<number> {
    return await this.allSocialLinks.count();
  }

  // ==================== Copyright Actions ====================

  /**
   * Get the copyright text
   * @returns The copyright text
   */
  async getCopyrightText(): Promise<string> {
    const text = await this.copyright.textContent();
    return text?.trim() || '';
  }

  /**
   * Check if copyright contains the current year
   * @returns True if current year is in copyright text
   */
  async hasCopyrightYear(): Promise<boolean> {
    const text = await this.getCopyrightText();
    const currentYear = new Date().getFullYear().toString();
    return text.includes(currentYear);
  }

  // ==================== Newsletter Actions ====================

  /**
   * Subscribe to the newsletter
   * @param email - The email address to subscribe
   */
  async subscribeToNewsletter(email: string): Promise<void> {
    await this.newsletterInput.fill(email);
    await this.newsletterButton.click();
  }

  /**
   * Check if newsletter form is visible
   * @returns True if newsletter form is visible
   */
  async isNewsletterFormVisible(): Promise<boolean> {
    return await this.newsletterForm.isVisible();
  }

  // ==================== Visibility Checks ====================

  /**
   * Check if the footer is visible
   * @returns True if footer is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.footer.isVisible();
  }

  /**
   * Wait for the footer to be visible
   */
  async waitForFooter(): Promise<void> {
    await this.footer.waitFor({ state: 'visible' });
  }

  /**
   * Scroll to the footer
   */
  async scrollToFooter(): Promise<void> {
    await this.footer.scrollIntoViewIfNeeded();
  }
}

/**
 * Interface representing social link data
 */
export interface SocialLinkData {
  href: string;
  platform: string;
  ariaLabel: string;
}
