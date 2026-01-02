import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Bitcoin payment status types
 */
export type BitcoinPaymentStatus = 
  | 'PENDING' 
  | 'DETECTED' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'TIMEOUT' 
  | 'UNDERPAID';

/**
 * Bitcoin invoice data interface
 */
export interface BitcoinInvoiceData {
  invoiceId: string;
  btcAddress: string;
  expectedBtc: string;
  expectedSats: number;
  btcUsdRate: string;
  qrCodePayload: string;
  expiresAt: number;
}

/**
 * BitcoinPaymentPage Page Object
 * Handles Bitcoin payment flow interactions including:
 * - Payment method selection
 * - QR code display and invoice generation
 * - Payment status monitoring
 * - Copy functionality
 * - Error handling
 *
 * Based on actual frontend implementation:
 * - BitcoinPaySelector: zenithbioscience-next/src/app/_components/checkout/bitcoin/BitcoinPaySelector.tsx
 * - BitcoinPayQR: zenithbioscience-next/src/app/_components/checkout/bitcoin/BitcoinPayQR.tsx
 * - BitcoinTransactionMonitor: zenithbioscience-next/src/app/_components/checkout/bitcoin/BitcoinTransactionMonitor.tsx
 *
 * Requirements covered:
 * - 19.1-19.4: Bitcoin payment method selection
 * - 19.5-19.14: QR code generation and display
 * - 19.15-19.21: Payment status monitoring
 * - 19.22-19.25: WebSocket integration
 * - 19.26-19.30: Error handling
 * - 19.31-19.34: Accessibility
 * - 19.35-19.39: Admin dashboard integration
 */
export class BitcoinPaymentPage extends BasePage {
  readonly path = '/checkout';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Payment Method Selection Locators ====================

  /** Bitcoin payment method selector region */
  get bitcoinPaySelector(): Locator {
    return this.page.locator('[aria-label="Bitcoin payment method"]');
  }

  /** Bitcoin payment radio button */
  get bitcoinPaymentRadio(): Locator {
    return this.page.getByRole('radio', { name: /bitcoin/i });
  }

  /** Bitcoin icon in selector - located within the Bitcoin payment option */
  get bitcoinIcon(): Locator {
    // The Bitcoin icon is an SVG within the Bitcoin payment option row
    // We locate it by finding the heading "Bitcoin" and then the adjacent icon
    return this.page.locator('h6:has-text("Bitcoin")').locator('..').locator('svg, img').first();
  }

  /** Crypto discount chip (e.g., "10% OFF") - specifically in the Bitcoin payment section */
  get cryptoDiscountChip(): Locator {
    // Target the chip with aria-label for percent discount (appears in Bitcoin section when selected)
    return this.page.getByLabel(/percent discount/i);
  }

  /** Processing time indicator */
  get processingTimeIndicator(): Locator {
    return this.page.getByText(/10-60 min.*confirmations/i);
  }

  /** Security indicator */
  get securityIndicator(): Locator {
    return this.page.getByText(/secure on-chain payment/i);
  }

  /** Discount applied alert (shown when Bitcoin is selected) */
  get discountAppliedAlert(): Locator {
    return this.page.getByRole('status').filter({ hasText: /crypto discount applied/i });
  }

  /** Help toggle button */
  get helpToggleButton(): Locator {
    return this.page.getByLabel(/toggle bitcoin payment help/i);
  }

  /** Help section content */
  get helpSection(): Locator {
    return this.page.locator('.MuiAlert-root').filter({ hasText: /how bitcoin payments work/i });
  }

  // ==================== QR Code Display Locators ====================

  /** QR code region */
  get qrCodeRegion(): Locator {
    return this.page.locator('[aria-label="Bitcoin payment QR code"]');
  }

  /** QR code SVG element */
  get qrCodeSvg(): Locator {
    return this.qrCodeRegion.locator('svg').first();
  }

  /** Loading indicator during invoice generation */
  get invoiceLoadingIndicator(): Locator {
    return this.page.locator('[aria-label="Generating Bitcoin payment invoice"]');
  }

  /** Bitcoin address display */
  get btcAddressDisplay(): Locator {
    return this.page.locator('text=Bitcoin Address').locator('..').locator('..').locator('[style*="monospace"], .MuiTypography-root').filter({ hasText: /^[13bc][a-zA-Z0-9]{25,}$/i });
  }

  /** BTC amount display (e.g., "0.00123456 BTC") - targets the h5 heading specifically */
  get btcAmountDisplay(): Locator {
    return this.page.getByRole('heading', { name: /BTC/i, level: 5 });
  }

  /** Satoshi amount display - targets the body2 text with satoshis */
  get satoshiAmountDisplay(): Locator {
    return this.page.locator('p.MuiTypography-body2').filter({ hasText: /satoshis/i });
  }

  /** Exchange rate display */
  get exchangeRateDisplay(): Locator {
    return this.page.getByText(/rate.*1 BTC.*\$/i);
  }

  /** Invoice expiration timer */
  get expirationTimer(): Locator {
    return this.page.locator('[role="timer"]');
  }

  /** Copy address button - matches both "Copy Address" and "Copied" states */
  get copyAddressButton(): Locator {
    // Use aria-label pattern that matches both states: "Copy Bitcoin address" and "Address copied"
    return this.page.getByRole('button', { name: /copy bitcoin address|address copied/i });
  }

  /** Copy amount button - matches both "Copy Amount" and "Copied" states */
  get copyAmountButton(): Locator {
    // Use aria-label pattern that matches both states: "Copy BTC amount" and "Amount copied"
    return this.page.getByRole('button', { name: /copy.*amount|amount copied/i });
  }

  /** Refresh/regenerate invoice button */
  get refreshInvoiceButton(): Locator {
    return this.page.getByLabel(/generate new bitcoin invoice/i);
  }

  /** Open wallet button (mobile only) */
  get openWalletButton(): Locator {
    return this.page.getByRole('button', { name: /open wallet/i });
  }

  /** Invoice error alert */
  get invoiceErrorAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /failed|error|expired/i });
  }

  /** Retry button in error state */
  get retryButton(): Locator {
    return this.page.getByRole('button', { name: /retry/i });
  }

  // ==================== Transaction Monitor Locators ====================

  /** Transaction progress region */
  get transactionProgressRegion(): Locator {
    return this.page.locator('[aria-labelledby="bitcoin-progress-title"]');
  }

  /** Progress bar */
  get progressBar(): Locator {
    // Use role='progressbar' to specifically target the LinearProgress, not the Stepper
    return this.page.getByRole('progressbar', { name: /Bitcoin payment progress/i });
  }

  /** Confirmation count chip */
  get confirmationCountChip(): Locator {
    return this.page.locator('.MuiChip-root').filter({ hasText: /\d+\/\d+ confirmations/i });
  }

  /** Transaction stepper */
  get transactionStepper(): Locator {
    return this.page.locator('[aria-label="Bitcoin payment progress steps"]');
  }

  /** Get step by name */
  getStepByName(stepName: string): Locator {
    return this.transactionStepper.locator('.MuiStepLabel-label', { hasText: new RegExp(stepName, 'i') });
  }

  /** Waiting for payment step */
  get waitingForPaymentStep(): Locator {
    return this.getStepByName('waiting for payment');
  }

  /** Payment detected step */
  get paymentDetectedStep(): Locator {
    return this.getStepByName('payment detected');
  }

  /** Confirming transaction step */
  get confirmingTransactionStep(): Locator {
    return this.getStepByName('confirming transaction');
  }

  /** Payment complete step */
  get paymentCompleteStep(): Locator {
    return this.getStepByName('payment complete');
  }

  /** Transaction ID display */
  get transactionIdDisplay(): Locator {
    return this.page.getByText(/transaction:/i).locator('..');
  }

  /** Block explorer link */
  get blockExplorerLink(): Locator {
    return this.page.getByLabel(/view.*on block explorer/i);
  }

  /** Time remaining display */
  get timeRemainingDisplay(): Locator {
    return this.page.getByText(/remaining/i).filter({ hasText: /\d+:\d+/ });
  }

  /** Underpayment warning alert */
  get underpaymentWarning(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /underpayment/i });
  }

  /** Overpayment info alert */
  get overpaymentInfo(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /overpayment/i });
  }

  /** Invoice ID display */
  get invoiceIdDisplay(): Locator {
    return this.page.getByText(/invoice id:/i);
  }

  // ==================== Error Handling Locators ====================

  /** Try again button */
  get tryAgainButton(): Locator {
    return this.page.getByRole('button', { name: /try again/i });
  }

  /** Use different payment method button */
  get useDifferentPaymentButton(): Locator {
    return this.page.getByRole('button', { name: /different payment|change payment/i });
  }

  /** Contact support button/link */
  get contactSupportLink(): Locator {
    return this.page.getByRole('link', { name: /contact support/i });
  }

  /** Timeout message */
  get timeoutMessage(): Locator {
    return this.page.getByText(/timeout|expired/i);
  }

  // ==================== Payment Method Selection Methods ====================

  /**
   * Select Bitcoin as the payment method
   */
  async selectBitcoinPayment(): Promise<void> {
    // Click the Bitcoin radio button directly
    await this.bitcoinPaymentRadio.click();
    
    // Wait for the Bitcoin radio to be checked
    await expect(this.bitcoinPaymentRadio).toBeChecked({ timeout: 5000 });
    
    // Wait for the Bitcoin payment section to appear
    await this.bitcoinPaySelector.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if Bitcoin payment option is displayed
   */
  async isBitcoinPaymentDisplayed(): Promise<boolean> {
    return await this.bitcoinPaymentRadio.isVisible();
  }

  /**
   * Check if Bitcoin payment option is enabled
   */
  async isBitcoinPaymentEnabled(): Promise<boolean> {
    return await this.bitcoinPaymentRadio.isEnabled();
  }

  /**
   * Get the crypto discount percentage from the chip
   */
  async getCryptoDiscountPercentage(): Promise<number> {
    const chipText = await this.cryptoDiscountChip.textContent();
    const match = chipText?.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Toggle the help section
   */
  async toggleHelpSection(): Promise<void> {
    await this.helpToggleButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if help section is visible
   */
  async isHelpSectionVisible(): Promise<boolean> {
    return await this.helpSection.isVisible();
  }

  // ==================== QR Code Methods ====================

  /**
   * Wait for invoice to be generated
   */
  async waitForInvoiceGeneration(timeout: number = 15000): Promise<void> {
    // Wait for loading to disappear
    await this.invoiceLoadingIndicator.waitFor({ state: 'hidden', timeout });
    // Wait for QR code to appear
    await this.qrCodeSvg.waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if QR code is displayed
   */
  async isQRCodeDisplayed(): Promise<boolean> {
    return await this.qrCodeSvg.isVisible();
  }

  /**
   * Get the displayed BTC amount
   */
  async getBtcAmount(): Promise<string> {
    const text = await this.btcAmountDisplay.textContent();
    return text?.trim() || '';
  }

  /**
   * Get the displayed satoshi amount
   */
  async getSatoshiAmount(): Promise<number> {
    const text = await this.satoshiAmountDisplay.textContent();
    const match = text?.replace(/,/g, '').match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get the exchange rate
   */
  async getExchangeRate(): Promise<string> {
    const text = await this.exchangeRateDisplay.textContent();
    return text?.trim() || '';
  }

  /**
   * Get the time remaining on the invoice
   */
  async getTimeRemaining(): Promise<string> {
    const text = await this.expirationTimer.textContent();
    const match = text?.match(/(\d+:\d+)/);
    return match ? match[1] : '00:00';
  }

  /**
   * Copy the Bitcoin address to clipboard
   */
  async copyAddress(): Promise<void> {
    await this.copyAddressButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Copy the BTC amount to clipboard
   */
  async copyAmount(): Promise<void> {
    await this.copyAmountButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if copy address button shows "Copied" state
   * Looks for the button with aria-label "Address copied" which appears after clicking
   */
  async isAddressCopied(): Promise<boolean> {
    // Check if the "Address copied" button is visible (aria-label changes when copied)
    const copiedButton = this.page.getByRole('button', { name: /address copied/i });
    return await copiedButton.isVisible().catch(() => false);
  }

  /**
   * Check if copy amount button shows "Copied" state
   * Looks for the button with aria-label "Amount copied" which appears after clicking
   */
  async isAmountCopied(): Promise<boolean> {
    // Check if the "Amount copied" button is visible (aria-label changes when copied)
    const copiedButton = this.page.getByRole('button', { name: /amount copied/i });
    return await copiedButton.isVisible().catch(() => false);
  }

  /**
   * Refresh/regenerate the invoice
   */
  async refreshInvoice(): Promise<void> {
    await this.refreshInvoiceButton.click();
    await this.waitForInvoiceGeneration();
  }

  /**
   * Open wallet (mobile only)
   */
  async openWallet(): Promise<void> {
    await this.openWalletButton.click();
  }

  /**
   * Check if Open Wallet button is visible (mobile only)
   */
  async isOpenWalletButtonVisible(): Promise<boolean> {
    return await this.openWalletButton.isVisible();
  }

  // ==================== Transaction Monitor Methods ====================

  /**
   * Get the current payment status step (0-3)
   */
  async getCurrentStep(): Promise<number> {
    const steps = this.transactionStepper.locator('.MuiStep-root');
    const count = await steps.count();
    
    for (let i = 0; i < count; i++) {
      const step = steps.nth(i);
      const isActive = await step.locator('.Mui-active').count() > 0;
      if (isActive) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Get the current payment status
   */
  async getPaymentStatus(): Promise<string> {
    const statusText = await this.page.locator('#bitcoin-progress-title').textContent();
    return statusText?.trim() || '';
  }

  /**
   * Get the confirmation count (e.g., "1/2")
   */
  async getConfirmationCount(): Promise<{ current: number; required: number }> {
    const chipText = await this.confirmationCountChip.textContent();
    const match = chipText?.match(/(\d+)\/(\d+)/);
    return {
      current: match ? parseInt(match[1], 10) : 0,
      required: match ? parseInt(match[2], 10) : 2
    };
  }

  /**
   * Wait for payment to be detected
   */
  async waitForPaymentDetection(timeout: number = 60000): Promise<void> {
    await this.paymentDetectedStep.locator('.Mui-completed, .Mui-active').waitFor({ 
      state: 'visible', 
      timeout 
    });
  }

  /**
   * Wait for payment to be complete
   */
  async waitForPaymentComplete(timeout: number = 120000): Promise<void> {
    await this.paymentCompleteStep.locator('.Mui-completed').waitFor({ 
      state: 'visible', 
      timeout 
    });
  }

  /**
   * Check if underpayment warning is displayed
   */
  async isUnderpaymentWarningDisplayed(): Promise<boolean> {
    return await this.underpaymentWarning.isVisible();
  }

  /**
   * Check if overpayment info is displayed
   */
  async isOverpaymentInfoDisplayed(): Promise<boolean> {
    return await this.overpaymentInfo.isVisible();
  }

  /**
   * Get the transaction ID(s)
   */
  async getTransactionIds(): Promise<string[]> {
    const txidElements = this.page.locator('[aria-label*="View transaction details"]');
    const count = await txidElements.count();
    const txids: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const text = await txidElements.nth(i).textContent();
      if (text) {
        txids.push(text.trim());
      }
    }
    return txids;
  }

  /**
   * Click on block explorer link for a transaction
   */
  async openBlockExplorer(): Promise<void> {
    await this.blockExplorerLink.first().click();
  }

  // ==================== Error Handling Methods ====================

  /**
   * Check if invoice error is displayed
   */
  async isInvoiceErrorDisplayed(): Promise<boolean> {
    return await this.invoiceErrorAlert.isVisible();
  }

  /**
   * Get the error message
   */
  async getErrorMessage(): Promise<string> {
    const errorText = await this.invoiceErrorAlert.textContent();
    return errorText?.trim() || '';
  }

  /**
   * Retry invoice generation after error
   */
  async retryInvoiceGeneration(): Promise<void> {
    await this.retryButton.click();
    await this.waitForInvoiceGeneration();
  }

  /**
   * Check if timeout message is displayed
   */
  async isTimeoutDisplayed(): Promise<boolean> {
    return await this.timeoutMessage.isVisible();
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert Bitcoin payment option is displayed
   */
  async assertBitcoinPaymentDisplayed(): Promise<void> {
    await expect(this.bitcoinPaymentRadio).toBeVisible();
  }

  /**
   * Assert crypto discount is displayed
   */
  async assertCryptoDiscountDisplayed(): Promise<void> {
    await expect(this.cryptoDiscountChip).toBeVisible();
  }

  /**
   * Assert QR code is displayed
   */
  async assertQRCodeDisplayed(): Promise<void> {
    await expect(this.qrCodeSvg).toBeVisible();
  }

  /**
   * Assert payment amount is displayed
   */
  async assertPaymentAmountDisplayed(): Promise<void> {
    await expect(this.btcAmountDisplay).toBeVisible();
    await expect(this.satoshiAmountDisplay).toBeVisible();
  }

  /**
   * Assert expiration timer is displayed
   */
  async assertExpirationTimerDisplayed(): Promise<void> {
    await expect(this.expirationTimer).toBeVisible();
  }

  /**
   * Assert transaction stepper is displayed
   */
  async assertTransactionStepperDisplayed(): Promise<void> {
    await expect(this.transactionStepper).toBeVisible();
  }

  /**
   * Assert payment is complete
   */
  async assertPaymentComplete(): Promise<void> {
    await expect(this.paymentCompleteStep.locator('.Mui-completed')).toBeVisible();
  }

  /**
   * Assert discount alert is displayed when Bitcoin is selected
   */
  async assertDiscountAlertDisplayed(): Promise<void> {
    await expect(this.discountAppliedAlert).toBeVisible();
  }
}
