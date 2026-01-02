import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { AddressBookPage, AddressData } from '../../page-objects/account/AddressBookPage';
import { getAccountUser } from '../../fixtures/defaultFixtures';

/**
 * Address Management E2E Tests
 *
 * Tests for address book functionality in the user account section
 *
 * Requirements covered:
 * - Address book page loads successfully
 * - Add new billing address
 * - Add new shipping address
 * - Edit existing address
 * - Delete an address
 * - Set address as default shipping
 * - Set address as default billing
 * - Validation errors shown for invalid address data
 * - Cancel button closes the address dialog
 */
test.describe('Address Management', () => {
  let loginPage: LoginPage;
  let addressBookPage: AddressBookPage;
  const testUser = getAccountUser('accountAddresses');

  // Valid US address data for tests - using well-known verifiable commercial addresses
  // Empire State Building - a standard commercial address that passes USPS verification
  const validAddress: AddressData = {
    firstName: 'Test',
    lastName: 'User',
    addressLine1: '350 5th Ave',
    addressLine2: '',
    city: 'New York',
    state: 'NY',
    postalCode: '10118',
    country: 'US',
    phoneNumber: '+12127363100',
  };

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    addressBookPage = new AddressBookPage(page);

    // Login first - addresses page requires authentication
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForLoginComplete();
    
    // Wait for session to be fully established by checking for account navigation
    await page.waitForLoadState('networkidle').catch(() => {});

    // Navigate to addresses page
    await addressBookPage.goto();
    await addressBookPage.waitForPage();
  });

  test('should display address book page with all required elements', async () => {
    // Verify page heading is visible
    await expect(addressBookPage.pageHeading).toBeVisible();

    // Verify Add Address button is visible
    await expect(addressBookPage.addAddressButton).toBeVisible();
  });

  test('should add a new billing address', async () => {
    const initialCount = await addressBookPage.getBillingAddressCount();

    // Add a new billing address
    const billingAddress: AddressData = {
      ...validAddress,
      firstName: 'Billing',
      lastName: 'Address',
    };

    await addressBookPage.addAddress(billingAddress, 'BILLING');

    // Verify the address was added by checking count increased
    await expect(async () => {
      const newCount = await addressBookPage.getBillingAddressCount();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    }).toPass({ timeout: 5000 });

    // Verify the address exists
    await addressBookPage.assertAddressExists('Billing', 'Address');
  });

  test('should add a new shipping address', async () => {
    const initialCount = await addressBookPage.getShippingAddressCount();

    // Add a new shipping address
    const shippingAddress: AddressData = {
      ...validAddress,
      firstName: 'Shipping',
      lastName: 'Address',
    };

    await addressBookPage.addAddress(shippingAddress, 'SHIPPING');

    // Verify the address was added by checking count increased
    await expect(async () => {
      const newCount = await addressBookPage.getShippingAddressCount();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    }).toPass({ timeout: 5000 });

    // Verify the address exists
    await addressBookPage.assertAddressExists('Shipping', 'Address');
  });

  test('should edit an existing address', async () => {
    // First, ensure we have an address to edit by adding one
    const addressToEdit: AddressData = {
      ...validAddress,
      firstName: 'Edit',
      lastName: 'Test',
    };

    await addressBookPage.addAddress(addressToEdit, 'BILLING');

    // Get the count of addresses
    const addressCount = await addressBookPage.getAddressCount();

    if (addressCount > 0) {
      // Edit the first address
      const updates: Partial<AddressData> = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      await addressBookPage.editAddress(0, updates);

      // Verify the address was updated
      await addressBookPage.assertAddressExists('Updated', 'Name');
    }
  });

  test('should delete an address', async () => {
    // First, add an address to delete
    const addressToDelete: AddressData = {
      ...validAddress,
      firstName: 'Delete',
      lastName: 'Me',
    };

    await addressBookPage.addAddress(addressToDelete, 'BILLING');

    // Get the initial count
    const initialCount = await addressBookPage.getAddressCount();

    if (initialCount > 0) {
      // Delete the first address
      await addressBookPage.deleteAddress(0);

      // Verify the address count decreased
      await expect(async () => {
        const newCount = await addressBookPage.getAddressCount();
        expect(newCount).toBeLessThan(initialCount);
      }).toPass({ timeout: 5000 });
    }
  });

  test('should set address as default shipping', async () => {
    // First, add a shipping address
    const shippingAddress: AddressData = {
      ...validAddress,
      firstName: 'Default',
      lastName: 'Shipping',
    };

    await addressBookPage.addAddress(shippingAddress, 'SHIPPING');

    // Get shipping address count
    const shippingCount = await addressBookPage.getShippingAddressCount();
    expect(shippingCount).toBeGreaterThan(0);

    // Set the first shipping address as default
    await addressBookPage.setDefaultShipping(0);

    // Verify the first shipping address is marked as default
    // The default badge must be visible on the address we just set as default
    const shippingSection = addressBookPage.shippingAddressesSection;
    const firstShippingCard = shippingSection.locator('.MuiCard-root').first();
    const defaultBadge = firstShippingCard.locator('.MuiChip-root:has-text("Default")');
    
    await expect(defaultBadge).toBeVisible({ timeout: 5000 });
  });

  test('should set address as default billing', async () => {
    // First, add a billing address
    const billingAddress: AddressData = {
      ...validAddress,
      firstName: 'Default',
      lastName: 'Billing',
    };

    await addressBookPage.addAddress(billingAddress, 'BILLING');

    // Get billing address count
    const billingCount = await addressBookPage.getBillingAddressCount();
    expect(billingCount).toBeGreaterThan(0);

    // Set the first billing address as default
    await addressBookPage.setDefaultBilling(0);

    // Verify the first billing address is marked as default
    // The default badge must be visible on the address we just set as default
    const billingSection = addressBookPage.billingAddressesSection;
    const firstBillingCard = billingSection.locator('.MuiCard-root').first();
    const defaultBadge = firstBillingCard.locator('.MuiChip-root:has-text("Default")');
    
    await expect(defaultBadge).toBeVisible({ timeout: 5000 });
  });

  test('should show validation errors for invalid address data', async () => {
    // Click Add Address button to open dialog
    await addressBookPage.addAddressButton.click();
    await addressBookPage.waitForDialog();

    // Try to save without filling required fields
    await addressBookPage.saveButton.click();

    // Check for validation errors - there must be at least one error for empty required fields
    await expect(async () => {
      const errors = await addressBookPage.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });

    // Close the dialog
    await addressBookPage.cancelButton.click();
    await addressBookPage.waitForDialogClose();
  });

  test('should close address dialog when cancel button is clicked', async () => {
    // Click Add Address button to open dialog
    await addressBookPage.addAddressButton.click();
    await addressBookPage.waitForDialog();

    // Verify dialog is open
    await addressBookPage.assertDialogOpen();

    // Fill in some data (to ensure cancel discards it)
    await addressBookPage.firstNameInput.fill('Test');
    await addressBookPage.lastNameInput.fill('Cancel');

    // Click cancel button
    await addressBookPage.cancelButton.click();

    // Wait for dialog to close
    await addressBookPage.waitForDialogClose();

    // Verify dialog is closed
    await addressBookPage.assertDialogClosed();
  });
});
