import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Address data interface for creating/updating addresses
 */
export interface AddressData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phoneNumber?: string;
  companyName?: string;
  additionalInfo?: string;
  isDefault?: boolean;
  addressType?: 'SHIPPING' | 'BILLING';
}

/**
 * Displayed address data returned from getAddresses()
 */
export interface DisplayedAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  cityStateZip: string;
  country: string;
  phoneNumber?: string;
  companyName?: string;
  isDefault: boolean;
  addressType: 'SHIPPING' | 'BILLING';
}

/**
 * AddressBookPage Page Object
 * Handles address management interactions on the account addresses page
 *
 * Based on actual frontend implementation:
 * - Addresses page: zenithbioscience-next/src/app/account/addresses/AddressesPageClient.tsx
 * - AddressBook: zenithbioscience-next/src/app/_components/account/AddressBook.tsx
 * - AddressCard: zenithbioscience-next/src/app/_components/account/AddressCard.tsx
 *
 * Requirements covered:
 * - 12.5: Address management page object
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 */
export class AddressBookPage extends BasePage {
  readonly path = '/account/addresses';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /** Page heading - "Address Book" h1 */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Address Book', level: 1 });
  }

  /** Main "Add Address" button (top of page) */
  get addAddressButton(): Locator {
    return this.page.getByRole('button', { name: 'Add Address' });
  }

  /** Add New button for billing addresses section */
  get addBillingAddressButton(): Locator {
    return this.page
      .locator('h6:has-text("Billing Addresses")')
      .locator('..')
      .getByRole('button', { name: 'Add New' });
  }

  /** Add New button for shipping addresses section */
  get addShippingAddressButton(): Locator {
    return this.page
      .locator('h6:has-text("Shipping Addresses")')
      .locator('..')
      .getByRole('button', { name: 'Add New' });
  }

  /** Address cards container */
  get addressCards(): Locator {
    return this.page.locator('.MuiCard-root');
  }

  /** Billing addresses section */
  get billingAddressesSection(): Locator {
    return this.page.locator('h6:has-text("Billing Addresses")').locator('..').locator('..');
  }

  /** Shipping addresses section */
  get shippingAddressesSection(): Locator {
    return this.page.locator('h6:has-text("Shipping Addresses")').locator('..').locator('..');
  }

  /** Empty state message */
  get emptyStateMessage(): Locator {
    return this.page.getByText(/no addresses found|add your first address/i);
  }

  /** Loading spinner */
  get loadingSpinner(): Locator {
    return this.page.locator('.MuiCircularProgress-root');
  }

  // ==================== Dialog Locators ====================

  /** Address form dialog */
  get addressDialog(): Locator {
    return this.page.getByRole('dialog');
  }

  /** Dialog title */
  get dialogTitle(): Locator {
    return this.addressDialog.locator('.MuiDialogTitle-root');
  }

  /** First name input */
  get firstNameInput(): Locator {
    return this.addressDialog.getByRole('textbox', { name: 'First Name' });
  }

  /** Last name input */
  get lastNameInput(): Locator {
    return this.addressDialog.getByRole('textbox', { name: 'Last Name' });
  }

  /** Company name input */
  get companyNameInput(): Locator {
    return this.addressDialog.getByRole('textbox', { name: /Company Name/i });
  }

  /** Address line 1 input */
  get addressLine1Input(): Locator {
    return this.addressDialog.getByRole('textbox', { name: 'Address Line 1' });
  }

  /** Address line 2 input */
  get addressLine2Input(): Locator {
    return this.addressDialog.getByRole('textbox', { name: /Address Line 2/i });
  }

  /** City input */
  get cityInput(): Locator {
    return this.addressDialog.getByRole('textbox', { name: 'City' });
  }

  /** State select - MUI Select component */
  get stateSelect(): Locator {
    return this.addressDialog.locator('[name="state"]').locator('..');
  }

  /** Postal code input */
  get postalCodeInput(): Locator {
    return this.addressDialog.getByRole('textbox', { name: 'Postal Code' });
  }

  /** Country select - MUI Select component */
  get countrySelect(): Locator {
    return this.addressDialog.locator('[name="country"]').locator('..');
  }

  /** Phone number input */
  get phoneNumberInput(): Locator {
    return this.addressDialog.getByRole('textbox', { name: /Phone Number/i });
  }

  /** Additional info input */
  get additionalInfoInput(): Locator {
    return this.addressDialog.getByRole('textbox', { name: /Additional Information/i });
  }

  /** Address type select */
  get addressTypeSelect(): Locator {
    return this.addressDialog.getByLabel('Address Type');
  }

  /** "Use this address for both" checkbox */
  get sameForBothCheckbox(): Locator {
    return this.addressDialog.getByRole('checkbox', {
      name: /use this address for both shipping and billing/i,
    });
  }

  /** Set as default checkbox */
  get setAsDefaultCheckbox(): Locator {
    return this.addressDialog.getByRole('checkbox', { name: /set as default/i });
  }

  /** Save button in dialog */
  get saveButton(): Locator {
    return this.addressDialog.getByRole('button', { name: 'Save' });
  }

  /** Cancel button in dialog */
  get cancelButton(): Locator {
    return this.addressDialog.getByRole('button', { name: 'Cancel' });
  }

  /** Verification warning alert */
  get verificationWarning(): Locator {
    return this.addressDialog.locator('.MuiAlert-root');
  }

  // ==================== Snackbar Locators ====================

  /** Success snackbar */
  get successSnackbar(): Locator {
    return this.page.locator('.MuiSnackbar-root .MuiAlert-standardSuccess');
  }

  /** Error snackbar */
  get errorSnackbar(): Locator {
    return this.page.locator('.MuiSnackbar-root .MuiAlert-standardError');
  }

  // ==================== Navigation Methods ====================

  /**
   * Wait for the address book page to be ready
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for loading to complete
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    // Wait for heading
    await this.pageHeading.waitFor({ state: 'visible', timeout: 15000 });
    // Give the page time to fully render
    await this.wait(500);
  }

  /**
   * Wait for dialog to open
   */
  async waitForDialog(): Promise<void> {
    // Longer timeout for mobile viewports where dialogs may animate slower
    await this.addressDialog.waitFor({ state: 'visible', timeout: 15000 });
    // Wait for first form field to be ready
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 8000 });
    // Extra wait for mobile animations
    await this.wait(300);
  }

  /**
   * Wait for dialog to close
   */
  async waitForDialogClose(): Promise<void> {
    // Wait for dialog to close - if it doesn't close within timeout, 
    // check for validation errors or other issues
    try {
      await this.addressDialog.waitFor({ state: 'hidden', timeout: 15000 });
    } catch {
      // Check if there are validation errors preventing close
      const errors = await this.getValidationErrors();
      if (errors.length > 0) {
        throw new Error(`Dialog did not close - validation errors: ${errors.join(', ')}`);
      }
      // Check if dialog is still visible
      const isVisible = await this.addressDialog.isVisible();
      if (isVisible) {
        throw new Error('Dialog did not close within timeout');
      }
    }
  }

  // ==================== Address CRUD Methods ====================

  /**
   * Add a new address
   * @param address - Address data to fill in the form
   * @param addressType - Type of address (SHIPPING or BILLING), defaults to BILLING
   */
  async addAddress(
    address: AddressData,
    addressType: 'SHIPPING' | 'BILLING' = 'BILLING'
  ): Promise<void> {
    // Click the main Add Address button - scroll into view first on mobile
    await this.addAddressButton.scrollIntoViewIfNeeded();
    await this.wait(200);
    await this.addAddressButton.click();
    await this.waitForDialog();

    // Select address type if specified
    if (addressType) {
      await this.selectAddressType(addressType);
    }

    // Fill the form
    await this.fillAddressForm(address);

    // Check "same for both" if specified
    if (address.addressType === undefined && address.isDefault) {
      // If no specific type and isDefault, might want same for both
    }

    // Set as default if specified
    if (address.isDefault) {
      const checkbox = this.setAsDefaultCheckbox;
      if (!(await checkbox.isChecked())) {
        await checkbox.scrollIntoViewIfNeeded();
        await checkbox.check();
      }
    }

    // Save the address - scroll into view first on mobile
    await this.saveButton.scrollIntoViewIfNeeded();
    await this.wait(200);
    await this.saveButton.click();

    // Wait for dialog to close and snackbar
    await this.waitForDialogClose();
    await this.wait(500);
  }

  /**
   * Edit an existing address by index
   * @param index - Zero-based index of the address card
   * @param updates - Partial address data to update
   */
  async editAddress(index: number, updates: Partial<AddressData>): Promise<void> {
    const card = this.addressCards.nth(index);
    await card.waitFor({ state: 'visible' });

    // Click the edit button - MUI IconButton with EditIcon
    // The EditIcon renders as an SVG with path, look for the IconButton in CardActions
    const cardActions = card.locator('.MuiCardActions-root');
    const editButton = cardActions.locator('.MuiIconButton-root').first();
    await editButton.click();
    await this.waitForDialog();

    // Fill only the fields that are provided in updates
    await this.fillAddressForm(updates, true);

    // Save the changes
    await this.saveButton.click();
    await this.waitForDialogClose();
    await this.page.waitForTimeout(500);
  }

  /**
   * Delete an address by index
   * @param index - Zero-based index of the address card
   */
  async deleteAddress(index: number): Promise<void> {
    const card = this.addressCards.nth(index);
    await card.waitFor({ state: 'visible' });

    // Set up dialog handler for confirmation
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Click the delete button - MUI IconButton with DeleteIcon (second IconButton in CardActions)
    const cardActions = card.locator('.MuiCardActions-root');
    const deleteButton = cardActions.locator('.MuiIconButton-root').nth(1);
    await deleteButton.click();

    // Wait for the address to be removed
    await this.page.waitForTimeout(1000);
  }

  /**
   * Set an address as default shipping
   * @param index - Zero-based index of the address card in the shipping section
   */
  async setDefaultShipping(index: number): Promise<void> {
    const shippingCards = this.shippingAddressesSection.locator('.MuiCard-root');
    const card = shippingCards.nth(index);
    await card.waitFor({ state: 'visible' });

    const setDefaultButton = card.getByRole('button', { name: /set as default/i });
    if (await setDefaultButton.isVisible()) {
      await setDefaultButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Set an address as default billing
   * @param index - Zero-based index of the address card in the billing section
   */
  async setDefaultBilling(index: number): Promise<void> {
    const billingCards = this.billingAddressesSection.locator('.MuiCard-root');
    const card = billingCards.nth(index);
    await card.waitFor({ state: 'visible' });

    const setDefaultButton = card.getByRole('button', { name: /set as default/i });
    if (await setDefaultButton.isVisible()) {
      await setDefaultButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  // ==================== Data Retrieval Methods ====================

  /**
   * Get all displayed addresses
   * @returns Array of displayed address data
   */
  async getAddresses(): Promise<DisplayedAddress[]> {
    const addresses: DisplayedAddress[] = [];

    // Get billing addresses
    const billingAddresses = await this.getAddressesByType('BILLING');
    addresses.push(...billingAddresses);

    // Get shipping addresses
    const shippingAddresses = await this.getAddressesByType('SHIPPING');
    addresses.push(...shippingAddresses);

    return addresses;
  }

  /**
   * Get addresses by type
   * @param type - Address type (SHIPPING or BILLING)
   */
  private async getAddressesByType(type: 'SHIPPING' | 'BILLING'): Promise<DisplayedAddress[]> {
    const addresses: DisplayedAddress[] = [];
    const section = type === 'BILLING' ? this.billingAddressesSection : this.shippingAddressesSection;

    // Check if section exists
    if (!(await section.isVisible().catch(() => false))) {
      return addresses;
    }

    const cards = section.locator('.MuiCard-root');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const address = await this.parseAddressCard(card, type);
      if (address) {
        addresses.push(address);
      }
    }

    return addresses;
  }

  /**
   * Parse an address card to extract data
   */
  private async parseAddressCard(
    card: Locator,
    type: 'SHIPPING' | 'BILLING'
  ): Promise<DisplayedAddress | null> {
    try {
      const cardContent = card.locator('.MuiCardContent-root');

      // Get name from subtitle1 typography
      const nameElement = cardContent.locator('.MuiTypography-subtitle1');
      const name = (await nameElement.textContent()) || '';

      // Get all body1 typography elements for address lines
      const bodyElements = cardContent.locator('.MuiTypography-body1');
      const bodyTexts: string[] = [];
      const bodyCount = await bodyElements.count();
      for (let i = 0; i < bodyCount; i++) {
        const text = await bodyElements.nth(i).textContent();
        if (text) bodyTexts.push(text.trim());
      }

      // Get company name if present (body2 typography)
      const companyElement = cardContent.locator('.MuiTypography-body2').first();
      const companyName = (await companyElement.textContent())?.trim();

      // Get phone number (body2 with text.secondary color)
      const phoneElement = cardContent.locator('.MuiTypography-body2[class*="textSecondary"]');
      const phoneNumber = (await phoneElement.textContent())?.trim();

      // Check if default (has Default chip)
      const defaultChip = card.locator('.MuiChip-root:has-text("Default")');
      const isDefault = await defaultChip.isVisible().catch(() => false);

      return {
        name: name.trim(),
        addressLine1: bodyTexts[0] || '',
        addressLine2: bodyTexts.length > 3 ? bodyTexts[1] : undefined,
        cityStateZip: bodyTexts.length > 3 ? bodyTexts[2] : bodyTexts[1] || '',
        country: bodyTexts.length > 3 ? bodyTexts[3] : bodyTexts[2] || '',
        phoneNumber: phoneNumber || undefined,
        companyName: companyName || undefined,
        isDefault,
        addressType: type,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get the total count of addresses
   */
  async getAddressCount(): Promise<number> {
    return await this.addressCards.count();
  }

  /**
   * Get billing address count
   */
  async getBillingAddressCount(): Promise<number> {
    if (!(await this.billingAddressesSection.isVisible().catch(() => false))) {
      return 0;
    }
    return await this.billingAddressesSection.locator('.MuiCard-root').count();
  }

  /**
   * Get shipping address count
   */
  async getShippingAddressCount(): Promise<number> {
    if (!(await this.shippingAddressesSection.isVisible().catch(() => false))) {
      return 0;
    }
    return await this.shippingAddressesSection.locator('.MuiCard-root').count();
  }

  /**
   * Get validation error messages from the form
   */
  async getValidationErrors(): Promise<string[]> {
    const errors: string[] = [];

    // Get all helper text elements with error state
    const errorHelpers = this.addressDialog.locator('.MuiFormHelperText-root.Mui-error');
    const count = await errorHelpers.count();

    for (let i = 0; i < count; i++) {
      const text = await errorHelpers.nth(i).textContent();
      if (text) {
        errors.push(text.trim());
      }
    }

    // Also check for snackbar error messages
    if (await this.errorSnackbar.isVisible().catch(() => false)) {
      const snackbarText = await this.errorSnackbar.textContent();
      if (snackbarText) {
        errors.push(snackbarText.trim());
      }
    }

    // Check for verification warning
    if (await this.verificationWarning.isVisible().catch(() => false)) {
      const warningText = await this.verificationWarning.textContent();
      if (warningText) {
        errors.push(warningText.trim());
      }
    }

    return errors;
  }

  // ==================== Form Helper Methods ====================

  /**
   * Fill the address form with provided data
   * @param address - Address data to fill
   * @param isPartial - If true, only fill provided fields (for updates)
   */
  private async fillAddressForm(
    address: Partial<AddressData>,
    isPartial: boolean = false
  ): Promise<void> {
    // On mobile, the dialog might need scrolling - ensure dialog content is scrollable
    const dialogContent = this.addressDialog.locator('.MuiDialogContent-root');
    
    if (address.firstName !== undefined) {
      await this.firstNameInput.scrollIntoViewIfNeeded();
      await this.firstNameInput.clear();
      await this.firstNameInput.fill(address.firstName);
    }

    if (address.lastName !== undefined) {
      await this.lastNameInput.scrollIntoViewIfNeeded();
      await this.lastNameInput.clear();
      await this.lastNameInput.fill(address.lastName);
    }

    if (address.companyName !== undefined) {
      await this.companyNameInput.scrollIntoViewIfNeeded();
      await this.companyNameInput.clear();
      await this.companyNameInput.fill(address.companyName);
    }

    if (address.addressLine1 !== undefined) {
      await this.addressLine1Input.scrollIntoViewIfNeeded();
      await this.addressLine1Input.clear();
      await this.addressLine1Input.fill(address.addressLine1);
    }

    if (address.addressLine2 !== undefined) {
      await this.addressLine2Input.scrollIntoViewIfNeeded();
      await this.addressLine2Input.clear();
      await this.addressLine2Input.fill(address.addressLine2);
    }

    if (address.city !== undefined) {
      await this.cityInput.scrollIntoViewIfNeeded();
      await this.cityInput.clear();
      await this.cityInput.fill(address.city);
    }

    if (address.state !== undefined) {
      await this.selectState(address.state);
    }

    if (address.postalCode !== undefined) {
      await this.postalCodeInput.scrollIntoViewIfNeeded();
      await this.postalCodeInput.clear();
      await this.postalCodeInput.fill(address.postalCode);
    }

    if (address.country !== undefined) {
      await this.selectCountry(address.country);
    }

    if (address.phoneNumber !== undefined) {
      await this.phoneNumberInput.scrollIntoViewIfNeeded();
      await this.phoneNumberInput.clear();
      await this.phoneNumberInput.fill(address.phoneNumber);
    }

    if (address.additionalInfo !== undefined) {
      await this.additionalInfoInput.scrollIntoViewIfNeeded();
      await this.additionalInfoInput.clear();
      await this.additionalInfoInput.fill(address.additionalInfo);
    }
  }

  /**
   * Select address type from dropdown
   */
  private async selectAddressType(type: 'SHIPPING' | 'BILLING'): Promise<void> {
    // MUI TextField with select - find by label text
    const addressTypeSelect = this.addressDialog.locator('label:has-text("Address Type")').locator('..').locator('.MuiSelect-select');
    await addressTypeSelect.scrollIntoViewIfNeeded();
    await this.wait(200);
    
    // Check if the desired value is already selected
    const currentValue = await addressTypeSelect.textContent();
    const desiredValue = type === 'BILLING' ? 'Billing' : 'Shipping';
    
    if (currentValue?.trim() === desiredValue) {
      // Already selected, no need to change
      return;
    }
    
    // Click to open dropdown
    await addressTypeSelect.click();
    await this.wait(300);

    // Wait for the listbox to appear
    const listbox = this.page.getByRole('listbox', { name: 'Address Type' });
    await listbox.waitFor({ state: 'visible', timeout: 5000 });

    // Select the option
    const option = listbox.getByRole('option', { name: desiredValue });
    await option.click();
    
    // Wait for dropdown to close
    await listbox.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // If listbox doesn't hide, press Escape to close it
      return this.page.keyboard.press('Escape');
    });
    await this.wait(200);
  }

  /**
   * Select state from dropdown
   */
  private async selectState(stateCode: string): Promise<void> {
    // MUI TextField with select renders as a div with role="combobox"
    // The State field has name="state" attribute on the hidden input
    // We need to click the parent div that contains the select trigger
    
    // Find the State select by looking for the TextField container with the State label
    // MUI renders: label + div.MuiSelect-select (clickable trigger)
    const stateSelect = this.addressDialog.locator('label:has-text("State")').locator('..').locator('.MuiSelect-select');
    
    // If that doesn't work, try finding by the input name
    const stateSelectAlt = this.addressDialog.locator('[name="state"]').locator('..').locator('.MuiSelect-select');
    
    // Try the first approach, fall back to second
    const selectTrigger = await stateSelect.isVisible() ? stateSelect : stateSelectAlt;
    
    // Scroll into view on mobile
    await selectTrigger.scrollIntoViewIfNeeded();
    await this.wait(200);
    
    // States are displayed as full names but stored as codes
    const stateNames: Record<string, string> = {
      AL: 'Alabama',
      AK: 'Alaska',
      AZ: 'Arizona',
      AR: 'Arkansas',
      CA: 'California',
      CO: 'Colorado',
      CT: 'Connecticut',
      DC: 'District of Columbia',
      DE: 'Delaware',
      FL: 'Florida',
      GA: 'Georgia',
      HI: 'Hawaii',
      ID: 'Idaho',
      IL: 'Illinois',
      IN: 'Indiana',
      IA: 'Iowa',
      KS: 'Kansas',
      KY: 'Kentucky',
      LA: 'Louisiana',
      ME: 'Maine',
      MD: 'Maryland',
      MA: 'Massachusetts',
      MI: 'Michigan',
      MN: 'Minnesota',
      MS: 'Mississippi',
      MO: 'Missouri',
      MT: 'Montana',
      NE: 'Nebraska',
      NV: 'Nevada',
      NH: 'New Hampshire',
      NJ: 'New Jersey',
      NM: 'New Mexico',
      NY: 'New York',
      NC: 'North Carolina',
      ND: 'North Dakota',
      OH: 'Ohio',
      OK: 'Oklahoma',
      OR: 'Oregon',
      PA: 'Pennsylvania',
      RI: 'Rhode Island',
      SC: 'South Carolina',
      SD: 'South Dakota',
      TN: 'Tennessee',
      TX: 'Texas',
      UT: 'Utah',
      VT: 'Vermont',
      VA: 'Virginia',
      WA: 'Washington',
      WV: 'West Virginia',
      WI: 'Wisconsin',
      WY: 'Wyoming',
    };

    const stateName = stateNames[stateCode] || stateCode;
    
    // Check if already selected
    const currentValue = await selectTrigger.textContent();
    if (currentValue?.trim() === stateName) {
      return;
    }
    
    // Click to open dropdown
    await selectTrigger.click();
    await this.wait(300);

    // Wait for the listbox to appear - MUI uses role="listbox" for select options
    const listbox = this.page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: 5000 });

    // Find and click the state option
    const option = listbox.getByRole('option', { name: stateName });
    await option.scrollIntoViewIfNeeded();
    await option.click();
    
    // Wait for dropdown to close
    await listbox.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // If listbox doesn't hide, press Escape to close it
      return this.page.keyboard.press('Escape');
    });
    await this.wait(200);
  }

  /**
   * Select country from dropdown
   */
  private async selectCountry(countryCode: string): Promise<void> {
    // MUI TextField with select renders as a div with role="combobox"
    // Find the Country select by looking for the TextField container with the Country label
    const countrySelect = this.addressDialog.locator('label:has-text("Country")').locator('..').locator('.MuiSelect-select');
    
    // If that doesn't work, try finding by the input name
    const countrySelectAlt = this.addressDialog.locator('[name="country"]').locator('..').locator('.MuiSelect-select');
    
    // Try the first approach, fall back to second
    const selectTrigger = await countrySelect.isVisible() ? countrySelect : countrySelectAlt;
    await selectTrigger.scrollIntoViewIfNeeded();
    await this.wait(200);

    // Currently only US is supported
    const countryNames: Record<string, string> = {
      US: 'United States',
    };

    const countryName = countryNames[countryCode] || countryCode;
    
    // Check if already selected
    const currentValue = await selectTrigger.textContent();
    if (currentValue?.trim() === countryName) {
      return;
    }
    
    // Click to open dropdown
    await selectTrigger.click();
    await this.wait(300);

    // Wait for the listbox to appear
    const listbox = this.page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: 5000 });

    // Find and click the country option
    const option = listbox.getByRole('option', { name: countryName });
    await option.click();
    
    // Wait for dropdown to close
    await listbox.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // If listbox doesn't hide, press Escape to close it
      return this.page.keyboard.press('Escape');
    });
    await this.wait(200);
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert address book page is displayed
   */
  async assertAddressBookPageDisplayed(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Assert empty state is displayed
   */
  async assertEmptyStateDisplayed(): Promise<void> {
    await expect(this.emptyStateMessage).toBeVisible();
  }

  /**
   * Assert address dialog is open
   */
  async assertDialogOpen(): Promise<void> {
    await expect(this.addressDialog).toBeVisible();
  }

  /**
   * Assert address dialog is closed
   */
  async assertDialogClosed(): Promise<void> {
    await expect(this.addressDialog).toBeHidden();
  }

  /**
   * Assert success message is displayed
   */
  async assertSuccessMessage(): Promise<void> {
    await expect(this.successSnackbar).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert error message is displayed
   */
  async assertErrorMessage(): Promise<void> {
    await expect(this.errorSnackbar).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert address count equals expected
   */
  async assertAddressCount(expected: number): Promise<void> {
    const count = await this.getAddressCount();
    expect(count).toBe(expected);
  }

  /**
   * Assert an address exists with the given name
   */
  async assertAddressExists(firstName: string, lastName: string): Promise<void> {
    const fullName = `${firstName} ${lastName}`;
    const card = this.addressCards.filter({ hasText: fullName });
    await expect(card.first()).toBeVisible();
  }

  /**
   * Assert an address is marked as default
   */
  async assertAddressIsDefault(index: number): Promise<void> {
    const card = this.addressCards.nth(index);
    const defaultChip = card.locator('.MuiChip-root:has-text("Default")');
    await expect(defaultChip).toBeVisible();
  }

  /**
   * Check if page is empty (no addresses)
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyStateMessage.isVisible().catch(() => false);
  }
}
