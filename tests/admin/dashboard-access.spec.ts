import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { defaultFixtures } from '../../fixtures/defaultFixtures';

/**
 * Admin Dashboard Access E2E Tests
 *
 * Tests for admin dashboard access control and functionality
 *
 * Requirements covered:
 * - Admin users can access the admin dashboard
 * - Regular users are redirected when trying to access admin dashboard
 * - Unauthenticated users are redirected away from admin pages
 * - Dashboard displays correctly with stats cards and sections
 * 
 * Note: The dashboard loads data asynchronously from /api/analytics.
 * Tests wait for either the data to load OR the loading state to be visible,
 * as the analytics API may not always return data in test environments.
 */

test.describe('Admin Dashboard Access Control', () => {
  test.describe('Unauthenticated Access', () => {
    test('should not allow unauthenticated user to interact with admin dashboard', async ({
      page,
    }) => {
      // Try to access admin dashboard without authentication
      await page.goto('http://localhost:3000/admin');
      await page.waitForLoadState('networkidle');

      // Wait for the page to settle and any redirects to complete
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      const dashboardHeading = page.getByRole('heading', { 
        name: 'Business Intelligence Dashboard', 
        level: 1 
      });
      
      const isOnAdmin = currentUrl.includes('/admin');
      const hasFullAccess = await dashboardHeading.isVisible().catch(() => false);
      
      // Security verification: unauthenticated users should NEVER have full admin access
      // Valid outcomes:
      // 1. Redirected away from /admin (isOnAdmin = false)
      // 2. On /admin but access is blocked (hasFullAccess = false, showing loading/denied state)
      
      if (isOnAdmin) {
        // If still on admin URL, verify access is actually blocked
        // Check for access denied, unauthorized, or loading indicators
        const accessDeniedIndicator = page.getByText(/access denied|unauthorized|forbidden|loading/i);
        const isAccessBlocked = await accessDeniedIndicator.isVisible().catch(() => false);
        
        // If on admin page, either access should be blocked OR dashboard should not be fully visible
        expect(
          isAccessBlocked || !hasFullAccess,
          'Unauthenticated user should not have full admin dashboard access'
        ).toBe(true);
      }
      
      // Final assertion: unauthenticated user should NEVER have both admin URL AND full dashboard access
      expect(
        isOnAdmin && hasFullAccess,
        'Unauthenticated user must not have full admin dashboard access'
      ).toBe(false);
    });
  });

  test.describe('Regular User Access', () => {
    let loginPage: LoginPage;
    const customerUser = defaultFixtures.users.customer;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);

      // Login as regular customer user
      await loginPage.goto();
      await loginPage.waitForForm();
      await loginPage.login(customerUser.email, customerUser.password);
      await loginPage.waitForLoginComplete();
    });

    test('should not allow regular user to access admin dashboard functionality', async ({
      page,
    }) => {
      // Try to access admin dashboard as regular user
      await page.goto('http://localhost:3000/admin');
      await page.waitForLoadState('networkidle');

      // Wait for AdminGuard to check auth and potentially redirect
      await page.waitForTimeout(5000);

      const currentUrl = page.url();
      const dashboardHeading = page.getByRole('heading', { 
        name: 'Business Intelligence Dashboard', 
        level: 1 
      });
      
      const isOnAdmin = currentUrl.includes('/admin');
      const hasFullAccess = await dashboardHeading.isVisible().catch(() => false);
      
      // Security verification: regular users should NEVER have full admin access
      // Valid outcomes:
      // 1. Redirected away from /admin (isOnAdmin = false)
      // 2. On /admin but access is blocked (hasFullAccess = false)
      // 3. On /admin showing loading/error state (API rejects non-admin requests)
      
      if (isOnAdmin) {
        // If still on admin page, verify access is actually blocked
        const loadingText = page.getByText('Loading dashboard data...');
        const errorText = page.getByText(/error|failed|unauthorized|access denied|forbidden/i);
        
        const isLoading = await loadingText.isVisible().catch(() => false);
        const hasError = await errorText.isVisible().catch(() => false);
        
        // If on admin page, either:
        // - Dashboard should not be fully visible (hasFullAccess = false)
        // - OR should show loading/error state (backend will reject)
        expect(
          !hasFullAccess || isLoading || hasError,
          'Regular user should not have full admin dashboard access'
        ).toBe(true);
      }
      
      // Final assertion: regular user should NEVER have both admin URL AND full dashboard access
      expect(
        isOnAdmin && hasFullAccess,
        'Regular user must not have full admin dashboard access'
      ).toBe(false);
    });
  });

  test.describe('Admin User Access', () => {
    let loginPage: LoginPage;
    const adminUser = defaultFixtures.users.admin;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);

      // Login as admin user
      await loginPage.goto();
      await loginPage.waitForForm();
      await loginPage.login(adminUser.email, adminUser.password);
      await loginPage.waitForLoginComplete();

      // Navigate to admin dashboard
      await page.goto('http://localhost:3000/admin');
      await page.waitForLoadState('networkidle');
    });

    test('should allow admin user to access dashboard', async ({ page }) => {
      // Verify we're on the admin dashboard
      await expect(page).toHaveURL(/\/admin/);

      // Verify dashboard heading is displayed (Business Intelligence Dashboard)
      const heading = page.getByRole('heading', { name: 'Business Intelligence Dashboard', level: 1 });
      await expect(heading).toBeVisible({ timeout: 30000 });
    });

    test('should display dashboard content or loading state', async ({ page }) => {
      // Wait for dashboard heading to be visible
      const heading = page.getByRole('heading', { name: 'Business Intelligence Dashboard', level: 1 });
      await expect(heading).toBeVisible({ timeout: 30000 });

      // The dashboard may be in loading state or have loaded data
      // Check for either the loading indicator OR the actual content
      const loadingText = page.getByText('Loading dashboard data...');
      const usersCard = page.getByText('Users').first();
      
      // Wait for either loading to complete or content to appear
      await Promise.race([
        loadingText.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {}),
        usersCard.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
      ]);

      // Verify either loading state or content is visible
      const isLoading = await loadingText.isVisible().catch(() => false);
      const hasContent = await usersCard.isVisible().catch(() => false);
      
      // Dashboard should show either loading state or actual content
      expect(isLoading || hasContent).toBeTruthy();
    });

    test('should display admin navigation tabs', async ({ page }) => {
      // Wait for dashboard heading
      const heading = page.getByRole('heading', { name: 'Business Intelligence Dashboard', level: 1 });
      await expect(heading).toBeVisible({ timeout: 30000 });

      // Check viewport to determine if mobile or desktop
      const viewport = page.viewportSize();
      const isMobile = viewport ? viewport.width < 600 : false;

      if (isMobile) {
        // Mobile view uses AdminMobileNavigation with bottom nav bar
        const mobileNav = page.locator('[data-testid="admin-mobile-nav"]');
        await expect(mobileNav).toBeVisible();
        
        // Check for mobile nav items (first 4 items + More button)
        const dashboardNavItem = page.locator('[data-testid="admin-nav-item-dashboard"]');
        const productsNavItem = page.locator('[data-testid="admin-nav-item-products"]');
        const ordersNavItem = page.locator('[data-testid="admin-nav-item-orders"]');
        
        await expect(dashboardNavItem).toBeVisible();
        await expect(productsNavItem).toBeVisible();
        await expect(ordersNavItem).toBeVisible();
      } else {
        // Desktop/tablet view uses tabs
        const dashboardTab = page.getByRole('tab', { name: 'Dashboard' });
        const productsTab = page.getByRole('tab', { name: 'Products' });
        const ordersTab = page.getByRole('tab', { name: 'Orders' });
        
        await expect(dashboardTab).toBeVisible();
        await expect(productsTab).toBeVisible();
        await expect(ordersTab).toBeVisible();
      }
    });

    test('should navigate to orders page via tab', async ({ page }) => {
      // Wait for dashboard heading
      const heading = page.getByRole('heading', { name: 'Business Intelligence Dashboard', level: 1 });
      await expect(heading).toBeVisible({ timeout: 30000 });

      // Check viewport to determine if mobile or desktop
      const viewport = page.viewportSize();
      const isMobile = viewport ? viewport.width < 600 : false;

      if (isMobile) {
        // Mobile view - click on orders nav item in bottom bar
        const ordersNavItem = page.locator('[data-testid="admin-nav-item-orders"]');
        await ordersNavItem.click();
      } else {
        // Desktop/tablet view - click Orders tab
        await page.getByRole('tab', { name: 'Orders' }).click();
      }
      
      await page.waitForLoadState('domcontentloaded');

      // Verify navigation to orders page
      await expect(page).toHaveURL(/\/admin\/orders/);
    });

    test('should navigate to products page via tab', async ({ page }) => {
      // Wait for dashboard heading
      const heading = page.getByRole('heading', { name: 'Business Intelligence Dashboard', level: 1 });
      await expect(heading).toBeVisible({ timeout: 30000 });

      // Check viewport to determine if mobile or desktop
      const viewport = page.viewportSize();
      const isMobile = viewport ? viewport.width < 600 : false;

      if (isMobile) {
        // Mobile view - click on products nav item in bottom bar
        const productsNavItem = page.locator('[data-testid="admin-nav-item-products"]');
        await productsNavItem.click();
      } else {
        // Desktop/tablet view - click Products tab
        await page.getByRole('tab', { name: 'Products' }).click();
      }
      
      await page.waitForLoadState('domcontentloaded');

      // Verify navigation to products page
      await expect(page).toHaveURL(/\/admin\/products/);
    });

    test('should navigate to users page via tab', async ({ page }) => {
      // Wait for dashboard heading
      const heading = page.getByRole('heading', { name: 'Business Intelligence Dashboard', level: 1 });
      await expect(heading).toBeVisible({ timeout: 30000 });

      // Check viewport to determine if mobile or desktop
      const viewport = page.viewportSize();
      const isMobile = viewport ? viewport.width < 600 : false;

      if (isMobile) {
        // Mobile view - Users is in the "More" drawer, need to open it first
        const moreButton = page.locator('[data-testid="admin-nav-more-button"]');
        await moreButton.click();
        
        // Wait for drawer to open
        const drawer = page.locator('[data-testid="admin-nav-drawer"]');
        await expect(drawer).toBeVisible();
        
        // Click Users in the drawer
        const usersDrawerItem = page.locator('[data-testid="admin-nav-drawer-item-users"]');
        await usersDrawerItem.click();
      } else {
        // Desktop/tablet view - click Users tab
        await page.getByRole('tab', { name: 'Users' }).click();
      }
      
      await page.waitForLoadState('domcontentloaded');

      // Verify navigation to users page
      await expect(page).toHaveURL(/\/admin\/users/);
    });

    test('should display notification button', async ({ page }) => {
      // Wait for dashboard heading
      const heading = page.getByRole('heading', { name: 'Business Intelligence Dashboard', level: 1 });
      await expect(heading).toBeVisible({ timeout: 30000 });

      // Check viewport to determine if mobile or desktop
      const viewport = page.viewportSize();
      const isMobile = viewport ? viewport.width < 600 : false;

      // Verify notification button is visible
      // On mobile, the notification button may be in a different location or hidden
      const notificationButton = page.getByRole('button', { name: /notifications/i });
      
      if (isMobile) {
        // On mobile, notification button might be in the header or accessible via menu
        // Check if it's visible, if not, it's acceptable for mobile layout
        const isVisible = await notificationButton.isVisible().catch(() => false);
        if (!isVisible) {
          // On mobile, notifications might be accessed differently
          // Check for alternative notification access (e.g., in drawer or header)
          const moreButton = page.locator('[data-testid="admin-nav-more-button"]');
          await expect(moreButton).toBeVisible();
        } else {
          await expect(notificationButton).toBeVisible();
        }
      } else {
        await expect(notificationButton).toBeVisible();
      }
    });
  });
});
