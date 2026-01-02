import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * User information displayed on the dashboard
 */
export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

/**
 * Recent order information displayed on the dashboard
 */
export interface RecentOrderInfo {
  orderNumber: string;
  date: string;
  status: string;
  itemsCount: number;
  total: string;
}

/**
 * Notification status from the dashboard chip
 */
export interface NotificationStatus {
  emailEnabled: boolean;
  smsEnabled: boolean;
}

/**
 * Navigation section types
 */
export type DashboardSection = 'profile' | 'addresses' | 'orders' | 'shop';

/**
 * AccountDashboardPage Page Object
 * Handles account dashboard page interactions
 *
 * Based on actual frontend implementation:
 * - Account page: zenithbioscience-next/src/app/account/page.tsx
 * - AccountDashboard: zenithbioscience-next/src/app/_components/account/AccountDashboard.tsx
 *
 * Requirements covered:
 * - 12.3: Account dashboard page object
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 *
 * Note: This page uses AuthGuard, so user must be logged in to access it.
 */
export class AccountDashboardPage extends BasePage {
  readonly path = '/account';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /** Page heading - "Dashboard" h1 */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Dashboard', level: 1 });
  }

  /** Welcome message section */
  get welcomeMessage(): Locator {
    return this.page.getByRole('heading', { name: /welcome back/i, level: 6 });
  }

  /** Account status section (contains welcome message and chips) */
  get accountStatusSection(): Locator {
    return this.page.locator('.MuiPaper-root').filter({ hasText: /welcome back/i });
  }

  /** Notification status chip */
  get notificationChip(): Locator {
    return this.page.locator('.MuiChip-root').filter({ hasText: /email:/i });
  }

  /** SMS notification chip (mobile only) */
  get smsNotificationChip(): Locator {
    return this.page.locator('.MuiChip-root').filter({ hasText: /^sms:/i });
  }

  /** OAuth provider chip (if connected via OAuth) */
  get oauthProviderChip(): Locator {
    return this.page.locator('.MuiChip-root').filter({ hasText: /connected via/i });
  }

  // ==================== Quick Actions Locators ====================

  /** Quick Actions section */
  get quickActionsSection(): Locator {
    return this.page.locator('.MuiPaper-root').filter({ hasText: /quick actions/i });
  }

  /** Continue Shopping button */
  get continueShoppingButton(): Locator {
    return this.page.getByRole('link', { name: /continue shopping/i });
  }

  /** Track Orders button */
  get trackOrdersButton(): Locator {
    return this.page.getByRole('link', { name: /track orders/i });
  }

  /** Update Notifications button */
  get updateNotificationsButton(): Locator {
    return this.page.getByRole('link', { name: /update notifications/i });
  }

  // ==================== Recent Orders Locators ====================

  /** Recent Orders section */
  get recentOrdersSection(): Locator {
    return this.page.locator('.MuiPaper-root').filter({ hasText: /recent orders/i }).first();
  }

  /** Recent Orders heading */
  get recentOrdersHeading(): Locator {
    return this.page.getByRole('heading', { name: /recent orders/i, level: 6 });
  }

  /** View All orders button/link */
  get viewAllOrdersLink(): Locator {
    // Find the link with "View All" text that has href to /account/orders
    // within the section that contains "Recent Orders" heading
    return this.page.locator('a[href="/account/orders"]').filter({ hasText: /^view all$/i });
  }

  /** Order cards in recent orders section */
  get orderCards(): Locator {
    return this.recentOrdersSection.locator('div[class*="MuiBox-root"]').filter({
      has: this.page.locator('text=/#[A-Z0-9-]+/')
    });
  }

  /** Empty orders message */
  get emptyOrdersMessage(): Locator {
    return this.page.getByText(/you haven't placed any orders yet/i);
  }

  // ==================== Account Information Locators ====================

  /** Account Information section */
  get accountInfoSection(): Locator {
    return this.page.locator('.MuiPaper-root').filter({ hasText: /account information/i });
  }

  /** Account Information heading */
  get accountInfoHeading(): Locator {
    return this.page.getByRole('heading', { name: /account information/i, level: 6 });
  }

  /** Edit profile link in account info section */
  get editProfileLink(): Locator {
    return this.accountInfoSection.getByRole('link', { name: /edit/i });
  }

  /** Contact Information section */
  get contactInfoSection(): Locator {
    return this.accountInfoSection.locator('div').filter({ hasText: /contact information/i }).first();
  }

  /** Manage addresses link */
  get manageAddressesLink(): Locator {
    return this.accountInfoSection.getByRole('link', { name: /manage/i });
  }

  /** Loading skeleton */
  get loadingSkeleton(): Locator {
    return this.page.locator('.MuiSkeleton-root');
  }

  // ==================== Navigation Methods ====================

  /**
   * Wait for the dashboard page to be ready
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for loading to complete
    await this.loadingSkeleton.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    // Wait for heading
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if we're on mobile view
   */
  async isMobileView(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width < 900 : false;
  }

  // ==================== User Info Methods ====================

  /**
   * Get user information displayed on the dashboard
   * @returns UserInfo object with firstName, lastName, email, and optional phoneNumber
   */
  async getUserInfo(): Promise<UserInfo> {
    // Wait for account info section to be visible
    await this.accountInfoSection.waitFor({ state: 'visible', timeout: 10000 });

    // Get the contact information text content
    const contactSection = this.accountInfoSection.locator('div').filter({ 
      has: this.page.getByText(/contact information/i) 
    }).first();

    // Get all text content from the contact section
    const textContent = await contactSection.textContent() || '';
    
    // Parse the user info from the text content
    // The format is: "Contact Information\nFirstName LastName\nemail@example.com\nphone (optional)"
    const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Find the name line (after "Contact Information")
    let firstName = '';
    let lastName = '';
    let email = '';
    let phoneNumber: string | undefined;

    // Look for email pattern to identify the email line
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;

    for (const line of lines) {
      if (line.toLowerCase().includes('contact information')) {
        continue;
      }
      if (emailRegex.test(line)) {
        email = line;
      } else if (phoneRegex.test(line) && line.length >= 7) {
        phoneNumber = line;
      } else if (!firstName && !line.toLowerCase().includes('edit')) {
        // This should be the name line
        const nameParts = line.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
    }

    // Alternative approach: get text from specific typography elements
    if (!firstName || !email) {
      const typographyElements = this.accountInfoSection.locator('.MuiTypography-body2');
      const count = await typographyElements.count();
      
      for (let i = 0; i < count; i++) {
        const text = await typographyElements.nth(i).textContent() || '';
        if (emailRegex.test(text.trim())) {
          email = text.trim();
        } else if (phoneRegex.test(text.trim()) && text.trim().length >= 7) {
          phoneNumber = text.trim();
        } else if (text.trim() && !text.toLowerCase().includes('manage') && 
                   !text.toLowerCase().includes('address') && !firstName) {
          const nameParts = text.trim().split(' ');
          if (nameParts.length >= 2 && !emailRegex.test(text.trim())) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          }
        }
      }
    }

    return {
      firstName,
      lastName,
      email,
      phoneNumber
    };
  }

  // ==================== Recent Orders Methods ====================

  /**
   * Get list of recent orders displayed on the dashboard
   * @returns Array of RecentOrderInfo objects
   */
  async getRecentOrders(): Promise<RecentOrderInfo[]> {
    const orders: RecentOrderInfo[] = [];

    // Check if there are no orders
    if (await this.emptyOrdersMessage.isVisible().catch(() => false)) {
      return orders;
    }

    // Wait for recent orders section
    await this.recentOrdersSection.waitFor({ state: 'visible', timeout: 10000 });

    // Find all order boxes within the recent orders section
    // Each order is in a Box with bgcolor: 'background.default'
    const orderBoxes = this.recentOrdersSection.locator('div[class*="MuiBox-root"]').filter({
      has: this.page.locator('text=/^#[A-Z0-9-]+$/')
    });

    // Alternative: look for subtitle1 elements that contain order numbers
    const orderNumberElements = this.recentOrdersSection.locator('.MuiTypography-subtitle1');
    const orderCount = await orderNumberElements.count();

    for (let i = 0; i < orderCount; i++) {
      const orderNumberText = await orderNumberElements.nth(i).textContent() || '';
      
      // Only process if it looks like an order number
      if (!orderNumberText.startsWith('#')) {
        continue;
      }

      // Get the parent container for this order
      const orderContainer = orderNumberElements.nth(i).locator('xpath=ancestor::div[contains(@class, "MuiBox-root")][last()]');
      
      // Extract order details from the container
      const containerText = await orderContainer.textContent() || '';
      
      // Parse order number (format: #ORD-XXXXX)
      const orderNumber = orderNumberText.replace('#', '').trim();

      // Parse date (format: MM/DD/YYYY or similar)
      const dateMatch = containerText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      const date = dateMatch ? dateMatch[1] : '';

      // Parse status (format: Status: Xxxxx)
      const statusMatch = containerText.match(/Status:\s*(\w+)/i);
      const status = statusMatch ? statusMatch[1] : '';

      // Parse items count (format: X item(s))
      const itemsMatch = containerText.match(/(\d+)\s*items?/i);
      const itemsCount = itemsMatch ? parseInt(itemsMatch[1], 10) : 0;

      // Parse total (format: $XX.XX)
      const totalMatch = containerText.match(/\$(\d+\.?\d*)/);
      const total = totalMatch ? `$${totalMatch[1]}` : '';

      orders.push({
        orderNumber,
        date,
        status,
        itemsCount,
        total
      });
    }

    return orders;
  }

  // ==================== Navigation Methods ====================

  /**
   * Navigate to a specific section from the dashboard
   * @param section - The section to navigate to: 'profile', 'addresses', 'orders', or 'shop'
   */
  async navigateToSection(section: DashboardSection): Promise<void> {
    switch (section) {
      case 'profile':
        await this.editProfileLink.click();
        break;
      case 'addresses':
        await this.manageAddressesLink.click();
        break;
      case 'orders':
        await this.viewAllOrdersLink.click();
        break;
      case 'shop':
        await this.continueShoppingButton.click();
        break;
      default:
        throw new Error(`Unknown section: ${section}`);
    }
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ==================== Welcome Message Methods ====================

  /**
   * Get the welcome message text displayed on the dashboard
   * @returns The welcome message text (e.g., "Welcome back, John!")
   */
  async getWelcomeMessage(): Promise<string> {
    await this.welcomeMessage.waitFor({ state: 'visible', timeout: 10000 });
    return await this.welcomeMessage.textContent() || '';
  }

  // ==================== Notification Status Methods ====================

  /**
   * Get the notification status from the dashboard chip
   * @returns NotificationStatus object with emailEnabled and smsEnabled booleans
   */
  async getNotificationStatus(): Promise<NotificationStatus> {
    await this.notificationChip.waitFor({ state: 'visible', timeout: 10000 });
    
    const isMobile = await this.isMobileView();
    let emailEnabled = false;
    let smsEnabled = false;

    // Get the notification chip text
    const chipText = await this.notificationChip.textContent() || '';
    
    // Parse email status
    const emailMatch = chipText.match(/email:\s*(on|off)/i);
    if (emailMatch) {
      emailEnabled = emailMatch[1].toLowerCase() === 'on';
    }

    if (isMobile) {
      // On mobile, SMS is in a separate chip
      try {
        const smsChipText = await this.smsNotificationChip.textContent() || '';
        const smsMatch = smsChipText.match(/sms:\s*(on|off)/i);
        if (smsMatch) {
          smsEnabled = smsMatch[1].toLowerCase() === 'on';
        }
      } catch {
        // SMS chip might not be visible
      }
    } else {
      // On desktop, both are in the same chip
      const smsMatch = chipText.match(/sms:\s*(on|off)/i);
      if (smsMatch) {
        smsEnabled = smsMatch[1].toLowerCase() === 'on';
      }
    }

    return {
      emailEnabled,
      smsEnabled
    };
  }

  // ==================== Quick Action Methods ====================

  /**
   * Click the Continue Shopping button
   */
  async clickContinueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click the Track Orders button
   */
  async clickTrackOrders(): Promise<void> {
    await this.trackOrdersButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click the Update Notifications button
   */
  async clickUpdateNotifications(): Promise<void> {
    await this.updateNotificationsButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ==================== Order Detail Methods ====================

  /**
   * Click View Details for a specific order
   * @param orderNumber - The order number (without the # prefix)
   */
  async viewOrderDetails(orderNumber: string): Promise<void> {
    const orderContainer = this.recentOrdersSection.locator('div').filter({
      hasText: `#${orderNumber}`
    });
    
    await orderContainer.getByRole('link', { name: /view details/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Check if there are any recent orders displayed
   * @returns True if there are orders, false if empty
   */
  async hasRecentOrders(): Promise<boolean> {
    const isEmpty = await this.emptyOrdersMessage.isVisible().catch(() => false);
    return !isEmpty;
  }

  // ==================== OAuth Provider Methods ====================

  /**
   * Get the OAuth provider name if connected via OAuth
   * @returns The provider name (e.g., "Google", "Github") or null if not OAuth
   */
  async getOAuthProvider(): Promise<string | null> {
    try {
      if (await this.oauthProviderChip.isVisible({ timeout: 2000 })) {
        const chipText = await this.oauthProviderChip.textContent() || '';
        const match = chipText.match(/connected via\s+(\w+)/i);
        return match ? match[1] : null;
      }
    } catch {
      // OAuth chip not present
    }
    return null;
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert dashboard page is displayed
   */
  async assertDashboardDisplayed(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Assert welcome message is displayed
   */
  async assertWelcomeMessageDisplayed(): Promise<void> {
    await expect(this.welcomeMessage).toBeVisible();
  }

  /**
   * Assert welcome message contains user's first name
   * @param firstName - The expected first name
   */
  async assertWelcomeMessageContains(firstName: string): Promise<void> {
    await expect(this.welcomeMessage).toContainText(firstName);
  }

  /**
   * Assert quick actions section is displayed
   */
  async assertQuickActionsDisplayed(): Promise<void> {
    await expect(this.quickActionsSection).toBeVisible();
    await expect(this.continueShoppingButton).toBeVisible();
    await expect(this.trackOrdersButton).toBeVisible();
    await expect(this.updateNotificationsButton).toBeVisible();
  }

  /**
   * Assert recent orders section is displayed
   */
  async assertRecentOrdersSectionDisplayed(): Promise<void> {
    await expect(this.recentOrdersSection).toBeVisible();
    await expect(this.recentOrdersHeading).toBeVisible();
  }

  /**
   * Assert account information section is displayed
   */
  async assertAccountInfoDisplayed(): Promise<void> {
    await expect(this.accountInfoSection).toBeVisible();
    await expect(this.accountInfoHeading).toBeVisible();
  }

  /**
   * Assert user info matches expected values
   * @param expected - The expected user info
   */
  async assertUserInfo(expected: Partial<UserInfo>): Promise<void> {
    const userInfo = await this.getUserInfo();
    
    if (expected.firstName) {
      expect(userInfo.firstName).toBe(expected.firstName);
    }
    if (expected.lastName) {
      expect(userInfo.lastName).toBe(expected.lastName);
    }
    if (expected.email) {
      expect(userInfo.email).toBe(expected.email);
    }
    if (expected.phoneNumber) {
      expect(userInfo.phoneNumber).toBe(expected.phoneNumber);
    }
  }

  /**
   * Assert notification status matches expected values
   * @param expected - The expected notification status
   */
  async assertNotificationStatus(expected: Partial<NotificationStatus>): Promise<void> {
    const status = await this.getNotificationStatus();
    
    if (expected.emailEnabled !== undefined) {
      expect(status.emailEnabled).toBe(expected.emailEnabled);
    }
    if (expected.smsEnabled !== undefined) {
      expect(status.smsEnabled).toBe(expected.smsEnabled);
    }
  }

  /**
   * Assert empty orders state is displayed
   */
  async assertEmptyOrdersDisplayed(): Promise<void> {
    await expect(this.emptyOrdersMessage).toBeVisible();
  }

  /**
   * Assert orders are displayed (not empty)
   */
  async assertOrdersDisplayed(): Promise<void> {
    const orders = await this.getRecentOrders();
    expect(orders.length).toBeGreaterThan(0);
  }
}
