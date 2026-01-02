import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * COA Details data interface for Step 3
 */
export interface CoaDetailsData {
  coaFile: string;
  testingProvider: string;
  laboratory: string;
  testDate: string;
}

/**
 * Resubmission data interface
 */
export interface ResubmissionData {
  coaFile: string;
  testingProvider?: string;
  laboratory?: string;
  testDate?: string;
}

/**
 * COA Submission entry interface
 */
export interface CoaSubmissionEntry {
  id: string;
  productName: string;
  batchNumber: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_MODIFICATION';
  submissionDate: string;
  reviewedDate?: string;
  creditAmount?: string;
  rejectionReason?: string;
}

/**
 * COA Submission Page Object
 * Handles COA form interactions and submission management
 * 
 * Requirements covered:
 * - 7.1: Page Object Model pattern implementation
 * - 7.2: Encapsulated selectors and action methods
 * - 7.3: Common navigation and wait methods
 * 
 * Note: This page uses AuthGuard, so user must be logged in to access
 */
export class CoaSubmissionPage extends BasePage {
  readonly path = '/account/coa';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Tab Locators ====================

  /**
   * Get the page heading
   */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Certificate of Analysis Submissions', level: 1 });
  }

  /**
   * Get the Submit COA tab
   */
  get submitCoaTab(): Locator {
    return this.page.getByRole('tab', { name: 'Submit COA' });
  }

  /**
   * Get the My Submissions tab
   */
  get mySubmissionsTab(): Locator {
    return this.page.getByRole('tab', { name: 'My Submissions' });
  }

  // ==================== Stepper Locators ====================

  /**
   * Get the stepper component
   */
  get stepper(): Locator {
    return this.page.locator('.MuiStepper-root');
  }

  /**
   * Get all step labels
   */
  get stepLabels(): Locator {
    return this.page.locator('.MuiStepLabel-label');
  }

  /**
   * Get the active step
   */
  get activeStep(): Locator {
    return this.page.locator('.MuiStep-root.Mui-active');
  }

  // ==================== Step 1: Order Selection Locators ====================

  /**
   * Get the order selection dropdown
   * Uses multiple selectors to handle MUI Select component rendering
   */
  get orderSelectDropdown(): Locator {
    // MUI Select renders as a div with role="combobox" inside a FormControl
    // The label may not be properly associated, so we use the combobox role
    return this.page.locator('.MuiFormControl-root').filter({ hasText: 'Select Order' }).locator('[role="combobox"]');
  }
  
  /**
   * Get the order selection form control (parent container)
   */
  get orderSelectFormControl(): Locator {
    return this.page.locator('.MuiFormControl-root').filter({ hasText: 'Select Order' });
  }

  /**
   * Get the order details card (shown after selection)
   */
  get orderDetailsCard(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: 'Order Details' });
  }

  // ==================== Step 2: Batch Selection Locators ====================

  /**
   * Get the batch selection dropdown
   */
  get batchSelectDropdown(): Locator {
    return this.page.getByLabel('Select Batch');
  }

  /**
   * Get the eligibility success alert
   */
  get eligibilitySuccessAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'eligible for COA submission' });
  }

  /**
   * Get the eligibility error alert
   */
  get eligibilityErrorAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'not eligible' });
  }

  // ==================== Step 3: COA Details Locators ====================

  /**
   * Get the COA file upload input
   */
  get coaFileInput(): Locator {
    return this.page.locator('input[type="file"]');
  }

  /**
   * Get the testing provider input
   */
  get testingProviderInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Testing Provider' });
  }

  /**
   * Get the laboratory input
   */
  get laboratoryInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Laboratory' });
  }

  /**
   * Get the test date input
   */
  get testDateInput(): Locator {
    return this.page.getByLabel('Test Date');
  }

  // ==================== Step 4: Review Locators ====================

  /**
   * Get the review card
   */
  get reviewCard(): Locator {
    return this.page.locator('.MuiCard-root').filter({ hasText: 'Review Your Submission' }).or(
      this.page.locator('.MuiCard-root').filter({ hasText: 'Order' }).filter({ hasText: 'Batch' })
    );
  }

  // ==================== Navigation Button Locators ====================

  /**
   * Get the Next button
   */
  get nextButton(): Locator {
    return this.page.getByRole('button', { name: 'Next' });
  }

  /**
   * Get the Back button
   */
  get backButton(): Locator {
    return this.page.getByRole('button', { name: 'Back' });
  }

  /**
   * Get the Submit COA button (on review step)
   */
  get submitCoaButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit COA' });
  }

  /**
   * Get the Submit Another COA button (on success step)
   */
  get submitAnotherButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit Another COA' });
  }

  // ==================== Confirmation Dialog Locators ====================

  /**
   * Get the confirmation dialog
   */
  get confirmationDialog(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: 'Confirm COA Submission' });
  }

  /**
   * Get the Confirm Submit button in dialog
   */
  get confirmSubmitButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm Submit' });
  }

  /**
   * Get the Cancel button in dialog
   */
  get cancelDialogButton(): Locator {
    return this.confirmationDialog.getByRole('button', { name: 'Cancel' });
  }

  // ==================== My Submissions Tab Locators ====================

  /**
   * Get the status filter dropdown
   */
  get statusFilterDropdown(): Locator {
    return this.page.getByLabel('Filter by Status');
  }

  /**
   * Get the refresh button
   */
  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: 'Refresh' });
  }

  /**
   * Get all submission cards
   */
  get submissionCards(): Locator {
    return this.page.locator('.MuiCard-root').filter({ has: this.page.locator('text=Batch #') });
  }

  /**
   * Get the pagination component
   */
  get pagination(): Locator {
    return this.page.locator('.MuiPagination-root');
  }

  /**
   * Get the View Details buttons
   */
  get viewDetailsButtons(): Locator {
    return this.page.getByRole('button', { name: 'View Details' });
  }

  /**
   * Get the Resubmit buttons
   */
  get resubmitButtons(): Locator {
    return this.page.getByRole('button', { name: 'Resubmit' });
  }

  // ==================== Resubmission Dialog Locators ====================

  /**
   * Get the resubmission dialog
   */
  get resubmissionDialog(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: 'Resubmit COA' });
  }

  /**
   * Get the resubmission file input
   */
  get resubmissionFileInput(): Locator {
    return this.resubmissionDialog.locator('input[type="file"]');
  }

  /**
   * Get the resubmission testing provider input
   */
  get resubmissionTestingProviderInput(): Locator {
    return this.resubmissionDialog.getByLabel('Testing Provider (Optional)');
  }

  /**
   * Get the resubmission laboratory input
   */
  get resubmissionLaboratoryInput(): Locator {
    return this.resubmissionDialog.getByLabel('Laboratory (Optional)');
  }

  /**
   * Get the resubmission test date input
   */
  get resubmissionTestDateInput(): Locator {
    return this.resubmissionDialog.getByLabel('Test Date (Optional)');
  }

  /**
   * Get the Resubmit COA button in dialog
   */
  get resubmitCoaButton(): Locator {
    return this.resubmissionDialog.getByRole('button', { name: 'Resubmit COA' });
  }

  // ==================== Details Dialog Locators ====================

  /**
   * Get the details dialog
   */
  get detailsDialog(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: 'COA Submission Details' });
  }

  /**
   * Get the close button in details dialog
   */
  get closeDetailsButton(): Locator {
    return this.detailsDialog.getByRole('button', { name: 'Close' });
  }

  // ==================== Common Locators ====================

  /**
   * Get the loading spinner
   */
  get loadingSpinner(): Locator {
    return this.page.locator('.MuiCircularProgress-root');
  }

  /**
   * Get the success message (after submission)
   */
  get successMessage(): Locator {
    return this.page.getByText('COA Submitted Successfully!');
  }

  /**
   * Get any alert messages
   */
  get alertMessages(): Locator {
    return this.page.getByRole('alert');
  }

  /**
   * Get snackbar alerts
   */
  get snackbarAlert(): Locator {
    return this.page.locator('.MuiSnackbar-root .MuiAlert-root');
  }

  // ==================== Tab Actions ====================

  /**
   * Select a tab
   * @param tab - The tab to select ('submit' or 'submissions')
   */
  async selectTab(tab: 'submit' | 'submissions'): Promise<void> {
    const tabLocator = tab === 'submit' ? this.submitCoaTab : this.mySubmissionsTab;
    await tabLocator.click();
    // Wait for tab to be selected
    await expect(tabLocator).toHaveAttribute('aria-selected', 'true', { timeout: 5000 }).catch(() => {});
  }

  // ==================== Step Navigation Actions ====================

  /**
   * Get the current step number (1-based)
   * @returns The current step number
   */
  async getCurrentStep(): Promise<number> {
    const steps = this.page.locator('.MuiStep-root');
    const count = await steps.count();
    
    for (let i = 0; i < count; i++) {
      const step = steps.nth(i);
      const isActive = await step.evaluate(el => el.classList.contains('Mui-active'));
      if (isActive) {
        return i + 1;
      }
    }
    
    // Check for completed state (all steps completed)
    const completedSteps = await this.page.locator('.MuiStep-root.Mui-completed').count();
    if (completedSteps === count) {
      return count + 1; // Success step
    }
    
    return 1;
  }

  /**
   * Click the Next button to go to the next step
   */
  async goToNextStep(): Promise<void> {
    const currentStep = await this.getCurrentStep();
    await this.nextButton.click();
    // Wait for step transition by checking step number changed
    await expect(async () => {
      const newStep = await this.getCurrentStep();
      expect(newStep).toBeGreaterThan(currentStep);
    }).toPass({ timeout: 5000 }).catch(() => {});
  }

  /**
   * Click the Back button to go to the previous step
   */
  async goToPreviousStep(): Promise<void> {
    const currentStep = await this.getCurrentStep();
    await this.backButton.click();
    // Wait for step transition by checking step number changed
    await expect(async () => {
      const newStep = await this.getCurrentStep();
      expect(newStep).toBeLessThan(currentStep);
    }).toPass({ timeout: 5000 }).catch(() => {});
  }

  // ==================== Step 1: Order Selection Actions ====================

  /**
   * Fill Step 1 - Select an order from the dropdown
   * @param orderId - The order ID to select
   */
  async fillStep1(orderId: string): Promise<void> {
    // Click the dropdown to open it
    await this.orderSelectDropdown.click();
    
    // Wait for dropdown options to appear
    const menuPaper = this.page.locator('.MuiMenu-paper');
    await menuPaper.waitFor({ state: 'visible', timeout: 5000 });
    
    // Find and click the option containing the order ID
    const option = this.page.locator('.MuiMenuItem-root').filter({ hasText: orderId });
    await option.click();
    
    // Wait for menu to close and order details to load
    await menuPaper.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  // ==================== Step 2: Batch Selection Actions ====================

  /**
   * Fill Step 2 - Select a batch from the dropdown
   * @param batchNumber - The batch number to select
   */
  async fillStep2(batchNumber: string): Promise<void> {
    // Wait for eligibility check to complete
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Spinner may have already disappeared
    }
    
    // Click the dropdown to open it
    await this.batchSelectDropdown.click();
    
    // Wait for dropdown options to appear
    const menuPaper = this.page.locator('.MuiMenu-paper');
    await menuPaper.waitFor({ state: 'visible', timeout: 5000 });
    
    // Find and click the option containing the batch number
    const option = this.page.locator('.MuiMenuItem-root').filter({ hasText: batchNumber });
    await option.click();
    
    // Wait for menu to close
    await menuPaper.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  // ==================== Step 3: COA Details Actions ====================

  /**
   * Fill Step 3 - Fill in COA details
   * @param data - The COA details data
   */
  async fillStep3(data: CoaDetailsData): Promise<void> {
    // Upload COA file
    if (data.coaFile) {
      await this.coaFileInput.setInputFiles(data.coaFile);
      // Wait for file to be processed by checking for file name display
      await this.page.locator('text=/.*\\.pdf/i').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    }
    
    // Fill testing provider
    await this.testingProviderInput.clear();
    await this.testingProviderInput.fill(data.testingProvider);
    
    // Fill laboratory
    await this.laboratoryInput.clear();
    await this.laboratoryInput.fill(data.laboratory);
    
    // Fill test date
    await this.testDateInput.clear();
    await this.testDateInput.fill(data.testDate);
  }

  // ==================== Step 4: Submit Actions ====================

  /**
   * Submit the form - clicks Submit COA and confirms the dialog
   */
  async submitForm(): Promise<void> {
    // Click Submit COA button
    await this.submitCoaButton.click();
    
    // Wait for confirmation dialog
    await this.confirmationDialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // Click Confirm Submit
    await this.confirmSubmitButton.click();
    
    // Wait for submission to complete
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
    } catch {
      // Spinner may have already disappeared
    }
  }

  // ==================== My Submissions Tab Actions ====================

  /**
   * Get the list of COA submissions from the My Submissions tab
   * @returns Array of submission entries
   */
  async getSubmissionHistory(): Promise<CoaSubmissionEntry[]> {
    const submissions: CoaSubmissionEntry[] = [];
    
    // Make sure we're on the submissions tab
    const isSubmissionsTabActive = await this.mySubmissionsTab.getAttribute('aria-selected');
    if (isSubmissionsTabActive !== 'true') {
      await this.selectTab('submissions');
    }
    
    // Wait for loading to complete
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Spinner may have already disappeared
    }
    
    const cards = this.submissionCards;
    const count = await cards.count();
    
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      
      // Extract product name from heading
      const productName = await card.locator('.MuiTypography-h6').first().textContent() || '';
      
      // Extract batch number
      const batchText = await card.getByText(/Batch #/).textContent() || '';
      const batchNumber = batchText.replace('Batch #', '').trim();
      
      // Extract status from chip
      const statusChip = card.locator('.MuiChip-root');
      const statusLabel = await statusChip.textContent() || '';
      const status = this.mapStatusLabelToEnum(statusLabel);
      
      // Extract submission date
      const submittedText = await card.getByText(/Submitted:/).textContent() || '';
      const submissionDate = submittedText.replace('Submitted:', '').trim();
      
      // Extract reviewed date if present
      let reviewedDate: string | undefined;
      try {
        const reviewedText = await card.getByText(/Reviewed:/).textContent();
        if (reviewedText) {
          reviewedDate = reviewedText.replace('Reviewed:', '').trim();
        }
      } catch {
        // Reviewed date not present
      }
      
      // Extract credit amount if present
      let creditAmount: string | undefined;
      try {
        const creditText = await card.getByText(/Credit Earned:/).textContent();
        if (creditText) {
          creditAmount = creditText.replace('Credit Earned:', '').trim();
        }
      } catch {
        // Credit not present
      }
      
      // Extract rejection reason if present
      let rejectionReason: string | undefined;
      try {
        const rejectionAlert = card.locator('.MuiAlert-root').filter({ hasText: 'Rejection Reason' });
        if (await rejectionAlert.isVisible()) {
          const rejectionText = await rejectionAlert.textContent() || '';
          rejectionReason = rejectionText.replace('Rejection Reason:', '').trim();
        }
      } catch {
        // Rejection reason not present
      }
      
      submissions.push({
        id: `submission-${i}`, // ID not directly visible, using index
        productName: productName.trim(),
        batchNumber,
        status,
        submissionDate,
        reviewedDate,
        creditAmount,
        rejectionReason,
      });
    }
    
    return submissions;
  }

  /**
   * Map status label to enum value
   */
  private mapStatusLabelToEnum(label: string): CoaSubmissionEntry['status'] {
    const normalizedLabel = label.toLowerCase().trim();
    if (normalizedLabel.includes('pending')) return 'PENDING_REVIEW';
    if (normalizedLabel.includes('approved')) return 'APPROVED';
    if (normalizedLabel.includes('rejected')) return 'REJECTED';
    if (normalizedLabel.includes('needs') || normalizedLabel.includes('modification')) return 'REQUIRES_MODIFICATION';
    return 'PENDING_REVIEW';
  }

  /**
   * Resubmit a rejected COA
   * @param submissionId - The submission ID (index-based)
   * @param data - The resubmission data
   */
  async resubmit(submissionId: string, data: ResubmissionData): Promise<void> {
    // Make sure we're on the submissions tab
    await this.selectTab('submissions');
    
    // Wait for loading to complete
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Spinner may have already disappeared
    }
    
    // Find the submission card and click Resubmit
    const index = parseInt(submissionId.replace('submission-', ''), 10);
    const card = this.submissionCards.nth(index);
    const resubmitButton = card.getByRole('button', { name: 'Resubmit' });
    await resubmitButton.click();
    
    // Wait for resubmission dialog
    await this.resubmissionDialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // Upload new COA file
    if (data.coaFile) {
      await this.resubmissionFileInput.setInputFiles(data.coaFile);
      // Wait for file to be processed
      await this.page.locator('text=/.*\\.pdf/i').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    }
    
    // Fill optional fields if provided
    if (data.testingProvider) {
      await this.resubmissionTestingProviderInput.clear();
      await this.resubmissionTestingProviderInput.fill(data.testingProvider);
    }
    
    if (data.laboratory) {
      await this.resubmissionLaboratoryInput.clear();
      await this.resubmissionLaboratoryInput.fill(data.laboratory);
    }
    
    if (data.testDate) {
      await this.resubmissionTestDateInput.clear();
      await this.resubmissionTestDateInput.fill(data.testDate);
    }
    
    // Click Resubmit COA button
    await this.resubmitCoaButton.click();
    
    // Wait for submission to complete
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
    } catch {
      // Spinner may have already disappeared
    }
  }

  /**
   * Filter submissions by status
   * @param status - The status to filter by, or empty string for all
   */
  async filterByStatus(status: string): Promise<void> {
    await this.statusFilterDropdown.click();
    const menuPaper = this.page.locator('.MuiMenu-paper');
    await menuPaper.waitFor({ state: 'visible', timeout: 5000 });
    
    if (status === '') {
      await this.page.getByRole('option', { name: 'All Statuses' }).click();
    } else {
      await this.page.getByRole('option', { name: status }).click();
    }
    
    // Wait for menu to close
    await menuPaper.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  /**
   * Navigate to a specific page in the submissions list
   * @param pageNumber - The page number to navigate to
   */
  async goToPage(pageNumber: number): Promise<void> {
    const pageButton = this.pagination.getByRole('button', { name: String(pageNumber) });
    await pageButton.click();
    // Wait for page button to be selected
    await expect(pageButton).toHaveAttribute('aria-current', 'true', { timeout: 5000 }).catch(() => {});
  }

  // ==================== Validation and State Methods ====================

  /**
   * Get form validation errors
   * @returns Array of validation error messages
   */
  async getValidationErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    // Look for MUI helper text with error state
    const helperTexts = this.page.locator('.MuiFormHelperText-root.Mui-error');
    const count = await helperTexts.count();
    
    for (let i = 0; i < count; i++) {
      const text = await helperTexts.nth(i).textContent();
      if (text) {
        errors.push(text);
      }
    }
    
    // Also check for alert messages with error severity
    const errorAlerts = this.page.locator('.MuiAlert-standardError, .MuiAlert-filledError');
    const alertCount = await errorAlerts.count();
    
    for (let i = 0; i < alertCount; i++) {
      const text = await errorAlerts.nth(i).textContent();
      if (text) {
        errors.push(text);
      }
    }
    
    return errors;
  }

  /**
   * Get the success message after submission
   * @returns The success message text, or null if not visible
   */
  async getSuccessMessage(): Promise<string | null> {
    try {
      // Check for the success step message
      if (await this.successMessage.isVisible({ timeout: 5000 })) {
        return await this.successMessage.textContent();
      }
      
      // Check for snackbar success message
      const snackbar = this.snackbarAlert.filter({ hasText: /success/i });
      if (await snackbar.isVisible({ timeout: 2000 })) {
        return await snackbar.textContent();
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if the Next button is enabled
   * @returns True if the Next button is enabled
   */
  async isNextButtonEnabled(): Promise<boolean> {
    return await this.nextButton.isEnabled();
  }

  /**
   * Check if the Submit button is enabled
   * @returns True if the Submit button is enabled
   */
  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.submitCoaButton.isEnabled();
  }

  /**
   * Check if the form is in loading state
   * @returns True if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  // ==================== Wait Methods ====================

  /**
   * Dismiss the onboarding dialog if present
   * The CoaUploadOnboarding component shows a multi-step dialog with:
   * - "Skip" button in the title area
   * - "Close" button in the dialog actions
   * - Dialog title contains "COA Submission Guide" or "COA Management Guide"
   */
  async dismissOnboardingDialog(): Promise<void> {
    try {
      // Check for onboarding dialog by its title
      const dialog = this.page.getByRole('dialog').filter({ 
        hasText: /COA (Submission|Management) Guide/i 
      });
      
      if (await dialog.isVisible({ timeout: 2000 })) {
        // Try the "Skip" button first (in the title area)
        const skipButton = dialog.getByRole('button', { name: 'Skip' });
        if (await skipButton.isVisible({ timeout: 1000 })) {
          await skipButton.click();
          await dialog.waitFor({ state: 'hidden', timeout: 3000 });
          return;
        }
        
        // Try the "Close" button (in dialog actions)
        const closeButton = dialog.getByRole('button', { name: 'Close' });
        if (await closeButton.isVisible({ timeout: 1000 })) {
          await closeButton.click();
          await dialog.waitFor({ state: 'hidden', timeout: 3000 });
          return;
        }
        
        // Fallback: press Escape
        await this.page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      }
    } catch {
      // Dialog not present or already dismissed
    }
  }
  
  /**
   * Set localStorage to mark onboarding as seen (call before navigating to page)
   * This prevents the onboarding dialog from appearing
   */
  async markOnboardingAsSeen(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.setItem('coa-onboarding-customer', 'true');
      localStorage.setItem('coa-onboarding-admin', 'true');
    });
  }

  /**
   * Wait for the page to be ready
   */
  async waitForPageReady(): Promise<void> {
    // Wait for page heading
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });
    
    // Dismiss onboarding dialog if present
    await this.dismissOnboardingDialog();
    
    // Wait for tabs to be visible
    await this.submitCoaTab.waitFor({ state: 'visible', timeout: 5000 });
    await this.mySubmissionsTab.waitFor({ state: 'visible', timeout: 5000 });
    
    // Wait for any loading to complete
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Spinner may not be present
    }
    
    // Wait for orders to load - either the dropdown with orders or the "no orders" alert
    await this.waitForOrdersLoaded();
  }
  
  /**
   * Wait for orders to be loaded on the Submit COA tab
   * Either the order dropdown will have items, or the "no orders" alert will be shown
   */
  async waitForOrdersLoaded(): Promise<void> {
    // Wait for either:
    // 1. The order dropdown to be visible (orders loaded)
    // 2. The "no orders" alert to be visible (no eligible orders)
    // 3. A loading spinner to disappear
    
    const orderDropdown = this.orderSelectFormControl;
    const noOrdersAlert = this.page.getByRole('alert').filter({ 
      hasText: /don't have any completed orders/i 
    });
    
    try {
      // First wait for any loading spinner to disappear
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      
      // Then wait for either the dropdown or the alert
      await Promise.race([
        orderDropdown.waitFor({ state: 'visible', timeout: 10000 }),
        noOrdersAlert.waitFor({ state: 'visible', timeout: 10000 })
      ]);
    } catch {
      // If neither appears, the page might still be loading or there's an error
      // Continue anyway and let the test handle it
    }
  }

  /**
   * Wait for the stepper to be visible
   */
  async waitForStepper(): Promise<void> {
    await this.stepper.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Wait for submissions to load
   */
  async waitForSubmissionsLoad(): Promise<void> {
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 });
    } catch {
      // Spinner may have already disappeared
    }
  }

  /**
   * Wait for the confirmation dialog to appear
   */
  async waitForConfirmationDialog(): Promise<void> {
    await this.confirmationDialog.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Wait for the resubmission dialog to appear
   */
  async waitForResubmissionDialog(): Promise<void> {
    await this.resubmissionDialog.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Close the snackbar notification if visible
   */
  async closeSnackbar(): Promise<void> {
    try {
      const closeButton = this.snackbarAlert.getByRole('button', { name: 'Close' });
      if (await closeButton.isVisible({ timeout: 1000 })) {
        await closeButton.click();
        await this.snackbarAlert.waitFor({ state: 'hidden', timeout: 3000 });
      }
    } catch {
      // Snackbar may have auto-closed or close button not found
    }
  }

  /**
   * View details of a specific submission
   * @param index - The index of the submission to view
   */
  async viewSubmissionDetails(index: number): Promise<void> {
    const card = this.submissionCards.nth(index);
    const viewButton = card.getByRole('button', { name: 'View Details' });
    await viewButton.click();
    await this.detailsDialog.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Close the details dialog
   */
  async closeDetailsDialog(): Promise<void> {
    await this.closeDetailsButton.click();
    await this.detailsDialog.waitFor({ state: 'hidden', timeout: 3000 });
  }

  /**
   * Get the expected credit amount from eligibility check
   * @returns The expected credit amount or null
   */
  async getExpectedCreditAmount(): Promise<string | null> {
    try {
      const creditText = await this.page.getByText(/Expected credit:/).textContent();
      if (creditText) {
        return creditText.replace('Expected credit:', '').trim();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if order is eligible for COA submission
   * @returns True if eligible, false otherwise
   */
  async isOrderEligible(): Promise<boolean> {
    try {
      return await this.eligibilitySuccessAlert.isVisible({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  /**
   * Get ineligibility reasons if order is not eligible
   * @returns Array of ineligibility reasons
   */
  async getIneligibilityReasons(): Promise<string[]> {
    const reasons: string[] = [];
    
    try {
      if (await this.eligibilityErrorAlert.isVisible({ timeout: 2000 })) {
        const listItems = this.eligibilityErrorAlert.locator('.MuiListItemText-primary');
        const count = await listItems.count();
        
        for (let i = 0; i < count; i++) {
          const text = await listItems.nth(i).textContent();
          if (text) {
            reasons.push(text);
          }
        }
      }
    } catch {
      // No ineligibility alert found
    }
    
    return reasons;
  }
}
