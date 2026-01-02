import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Product information displayed in the admin products list
 */
export interface AdminProductInfo {
  id?: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  salePrice?: number;
  inventory: number;
  totalBatches: number;
  isFeatured: boolean;
  onSale: boolean;
}

/**
 * Product form data for create/edit
 */
export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  dose: string;
  price: number;
  onSale?: boolean;
  salePrice?: number;
  isFeatured?: boolean;
  relatedProductIds?: string[];
}

/**
 * Product category options - must match the Category enum in the frontend
 * Only PEPTIDE, BLEND, and BAC_WATER are valid categories
 */
export type ProductCategory = 'PEPTIDE' | 'BLEND' | 'BAC_WATER';

/**
 * AdminProductsPage Page Object
 * Handles admin products management page interactions
 *
 * Based on actual frontend implementation:
 * - AdminProductsPageClient: zenithbioscience-next/src/app/admin/products/AdminProductsPageClient.tsx
 */
export class AdminProductsPage extends BasePage {
  readonly path = '/admin/products';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /** Page heading - "Product Management" h1 */
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Product Management', level: 1 });
  }

  /** Loading state */
  get loadingState(): Locator {
    return this.page.locator('.MuiCircularProgress-root');
  }

  /** Error alert */
  get errorAlert(): Locator {
    return this.page.locator('.MuiAlert-root').filter({ hasText: /failed to load/i });
  }

  /** Add New Product button */
  get addProductButton(): Locator {
    return this.page.getByRole('button', { name: /add new product/i });
  }

  // ==================== Data Grid Locators ====================

  /** Products data grid */
  get productsDataGrid(): Locator {
    return this.page.locator('[data-testid="admin-products-data-grid"]');
  }

  /** Product rows in the data grid */
  get productRows(): Locator {
    return this.page.locator('.MuiDataGrid-row');
  }

  /** Product cards (mobile view) - using ProductCard component test IDs */
  /** The Card container has data-testid="product-card-{id}" where id is dynamic */
  /** Child elements have static testIds like product-card-name, product-card-price */
  /** We select only Card elements by looking for the MuiCard class */
  get productCards(): Locator {
    return this.page.locator('.MuiCard-root[data-testid^="product-card-"]');
  }

  // ==================== Product Dialog Locators ====================

  /** Product create/edit dialog */
  get productDialog(): Locator {
    return this.page.locator('.MuiDialog-root');
  }

  /** Dialog title */
  get dialogTitle(): Locator {
    return this.productDialog.locator('.MuiDialogTitle-root');
  }

  /** Product name input */
  get nameInput(): Locator {
    return this.productDialog.locator('#name');
  }

  /** Product description input */
  get descriptionInput(): Locator {
    return this.productDialog.locator('#description');
  }

  /** Category select */
  get categorySelect(): Locator {
    return this.productDialog.locator('#category');
  }

  /** Dose input */
  get doseInput(): Locator {
    return this.productDialog.locator('#dose');
  }

  /** Price input */
  get priceInput(): Locator {
    return this.productDialog.locator('#price');
  }

  /** On Sale switch */
  get onSaleSwitch(): Locator {
    return this.productDialog.locator('input[name="onSale"]');
  }

  /** Featured switch */
  get featuredSwitch(): Locator {
    return this.productDialog.locator('input[name="isFeatured"]');
  }

  /** Create/Update button in dialog */
  get submitButton(): Locator {
    return this.productDialog.getByRole('button', { name: /create|update/i });
  }

  /** Cancel button in dialog */
  get cancelDialogButton(): Locator {
    return this.productDialog.getByRole('button', { name: /cancel/i });
  }

  // ==================== Delete Confirmation ====================

  /** Delete confirmation dialog */
  get deleteConfirmDialog(): Locator {
    return this.page.locator('.MuiDialog-root').filter({ hasText: /are you sure/i });
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
   * Wait for the products page to be ready
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.pageHeading.waitFor({ state: 'visible', timeout: 15000 });
    // Wait for loading to complete
    await this.loadingState.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      // Mobile view - wait for product cards to appear
      await this.page.waitForSelector('.MuiCard-root[data-testid^="product-card-"]', { 
        state: 'visible', 
        timeout: 15000 
      }).catch(() => {});
      // Give cards time to fully render
      await this.wait(1000);
    } else {
      // Desktop view - wait for the data grid to appear
      const dataGridContainer = this.page.locator('[data-testid^="admin-products-"]').first();
      await dataGridContainer.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
      await this.wait(500);
    }
  }

  /**
   * Check if we're on mobile view
   */
  async isMobileView(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width < 900 : false;
  }

  // ==================== Product List Methods ====================

  /**
   * Get the count of products displayed
   */
  async getProductCount(): Promise<number> {
    const isMobile = await this.isMobileView();
    if (isMobile) {
      return await this.productCards.count();
    }
    const dataRows = this.page.locator('.MuiDataGrid-row, [role="rowgroup"] [role="row"]');
    const count = await dataRows.count();
    if (count === 0) {
      const gridRows = this.page.locator('[role="row"]').filter({ has: this.page.locator('[role="gridcell"]') });
      return await gridRows.count();
    }
    return count;
  }

  /**
   * Get all products displayed in the list
   */
  async getProducts(): Promise<AdminProductInfo[]> {
    const products: AdminProductInfo[] = [];
    const isMobile = await this.isMobileView();

    if (isMobile) {
      const cards = this.page.locator('.MuiCard-root[data-testid^="product-card-"]');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const nameEl = card.locator('[data-testid$="-name"]');
        const name = await nameEl.textContent() || '';
        const priceEl = card.locator('[data-testid$="-price"]');
        const priceText = await priceEl.textContent() || '0';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        const cardText = await card.textContent() || '';
        const isFeatured = cardText.toLowerCase().includes('featured');
        const onSale = cardText.toLowerCase().includes('on sale');
        const skuMatch = cardText.match(/SKU:\s*([^\s]+)/i);
        const sku = skuMatch ? skuMatch[1] : '';
        const categoryMatch = cardText.match(/Category:\s*([^\s]+)/i);
        const category = categoryMatch ? categoryMatch[1] : '';

        products.push({
          name: name.trim(),
          sku: sku.trim(),
          category: category.trim(),
          price,
          inventory: 0,
          totalBatches: 0,
          isFeatured,
          onSale,
        });
      }
    } else {
      const dataRows = this.page.locator('[role="rowgroup"] [role="row"]');
      const rowCount = await dataRows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const row = dataRows.nth(i);
        const cells = row.locator('[role="gridcell"]');
        const cellCount = await cells.count();
        
        if (cellCount < 5) continue;

        const name = await cells.nth(0).textContent() || '';
        const sku = await cells.nth(1).textContent() || '';
        const category = await cells.nth(2).textContent() || '';
        const priceText = await cells.nth(3).textContent() || '0';
        const priceMatch = priceText.match(/\$?(\d+\.?\d*)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        const inventoryText = await cells.nth(4).textContent() || '0';
        const inventory = parseInt(inventoryText.replace(/[^0-9]/g, ''), 10) || 0;
        const batchesText = cellCount > 5 ? await cells.nth(5).textContent() || '0' : '0';
        const totalBatches = parseInt(batchesText.replace(/[^0-9]/g, ''), 10) || 0;
        const featuredCell = cellCount > 6 ? cells.nth(6) : null;
        const isFeatured = featuredCell ? await featuredCell.locator('.MuiChip-root').isVisible().catch(() => false) : false;
        const saleCell = cellCount > 7 ? cells.nth(7) : null;
        const onSale = saleCell ? await saleCell.locator('.MuiChip-root').isVisible().catch(() => false) : false;

        products.push({
          name: name.trim(),
          sku: sku.trim(),
          category: category.trim(),
          price,
          inventory,
          totalBatches,
          isFeatured,
          onSale,
        });
      }
    }

    return products;
  }

  /**
   * Find a product by name
   */
  async findProduct(productName: string): Promise<AdminProductInfo | null> {
    const isMobile = await this.isMobileView();
    
    if (isMobile) {
      const cards = this.page.locator('.MuiCard-root[data-testid^="product-card-"]');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const nameEl = card.locator('[data-testid$="-name"]');
        const cardProductName = await nameEl.textContent() || '';
        
        if (cardProductName.toLowerCase().includes(productName.toLowerCase())) {
          const priceEl = card.locator('[data-testid$="-price"]');
          const priceText = await priceEl.textContent() || '0';
          const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
          const cardText = await card.textContent() || '';
          const isFeatured = cardText.toLowerCase().includes('featured');
          const onSale = cardText.toLowerCase().includes('on sale');

          return {
            name: cardProductName.trim(),
            sku: '',
            category: '',
            price,
            inventory: 0,
            totalBatches: 0,
            isFeatured,
            onSale,
          };
        }
      }
      return null;
    }
    
    // Desktop view
    const products = await this.getProducts();
    const found = products.find(p => p.name.toLowerCase().includes(productName.toLowerCase()));
    if (found) return found;
    
    const row = this.page.locator('[role="row"]').filter({ hasText: productName });
    const rowCount = await row.count();
    
    if (rowCount > 0) {
      const cells = row.first().locator('[role="gridcell"]');
      const cellCount = await cells.count();
      
      if (cellCount >= 4) {
        const name = await cells.nth(0).textContent() || '';
        const sku = await cells.nth(1).textContent() || '';
        const category = await cells.nth(2).textContent() || '';
        const priceText = await cells.nth(3).textContent() || '0';
        const priceMatch = priceText.match(/\$?(\d+\.?\d*)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        
        return {
          name: name.trim(),
          sku: sku.trim(),
          category: category.trim(),
          price,
          inventory: 0,
          totalBatches: 0,
          isFeatured: false,
          onSale: false,
        };
      }
    }
    
    // Try pagination
    const nextPageButton = this.page.getByRole('button', { name: /go to next page/i });
    const isNextEnabled = await nextPageButton.isEnabled().catch(() => false);
    
    if (isNextEnabled) {
      const lastPageButton = this.page.getByRole('button', { name: /go to last page/i });
      const hasLastPage = await lastPageButton.isVisible().catch(() => false);
      
      if (hasLastPage) {
        await lastPageButton.click();
        await this.wait(500);
      } else {
        let maxClicks = 10;
        while (maxClicks > 0 && await nextPageButton.isEnabled().catch(() => false)) {
          await nextPageButton.click();
          await this.wait(300);
          
          const rowOnPage = this.page.locator('[role="row"]').filter({ hasText: productName });
          if (await rowOnPage.count() > 0) {
            const cells = rowOnPage.first().locator('[role="gridcell"]');
            const cellCount = await cells.count();
            
            if (cellCount >= 4) {
              const name = await cells.nth(0).textContent() || '';
              const sku = await cells.nth(1).textContent() || '';
              const category = await cells.nth(2).textContent() || '';
              const priceText = await cells.nth(3).textContent() || '0';
              const priceMatch = priceText.match(/\$?(\d+\.?\d*)/);
              const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
              
              return {
                name: name.trim(),
                sku: sku.trim(),
                category: category.trim(),
                price,
                inventory: 0,
                totalBatches: 0,
                isFeatured: false,
                onSale: false,
              };
            }
          }
          maxClicks--;
        }
      }
      
      const rowAfterPagination = this.page.locator('[role="row"]').filter({ hasText: productName });
      if (await rowAfterPagination.count() > 0) {
        const cells = rowAfterPagination.first().locator('[role="gridcell"]');
        const cellCount = await cells.count();
        
        if (cellCount >= 4) {
          const name = await cells.nth(0).textContent() || '';
          const sku = await cells.nth(1).textContent() || '';
          const category = await cells.nth(2).textContent() || '';
          const priceText = await cells.nth(3).textContent() || '0';
          const priceMatch = priceText.match(/\$?(\d+\.?\d*)/);
          const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
          
          return {
            name: name.trim(),
            sku: sku.trim(),
            category: category.trim(),
            price,
            inventory: 0,
            totalBatches: 0,
            isFeatured: false,
            onSale: false,
          };
        }
      }
    }
    
    return null;
  }


  // ==================== Create Product Methods ====================

  /**
   * Open the create product dialog
   */
  async openCreateDialog(): Promise<void> {
    const isMobile = await this.isMobileView();
    
    await this.addProductButton.scrollIntoViewIfNeeded();
    await this.wait(isMobile ? 300 : 100);
    await this.addProductButton.click();
    
    await this.productDialog.waitFor({ state: 'visible', timeout: isMobile ? 15000 : 10000 });
    await this.nameInput.waitFor({ state: 'visible', timeout: isMobile ? 8000 : 5000 });
    if (isMobile) {
      await this.wait(500);
    }
  }

  /**
   * Fill the product form
   * On mobile, the form is split into tabs:
   * - Tab 0: Basic Info (name, description, category, dose)
   * - Tab 1: Pricing (price, onSale, salePrice)
   * - Tab 2: Image & Options (isFeatured)
   * - Tab 3: Initial Batch (create mode only)
   */
  async fillProductForm(data: ProductFormData): Promise<void> {
    await this.productDialog.waitFor({ state: 'visible' });
    const isMobile = await this.isMobileView();

    await this.nameInput.waitFor({ state: 'visible', timeout: 5000 });

    // Fill basic fields (Tab 0 on mobile)
    await this.nameInput.fill(data.name);
    await this.wait(100);
    await this.descriptionInput.fill(data.description);
    await this.wait(100);
    await this.doseInput.fill(data.dose);
    await this.wait(100);

    // Select category (also on Tab 0)
    await this.categorySelect.scrollIntoViewIfNeeded();
    await this.categorySelect.click();
    const categoryMenu = this.page.locator('.MuiMenu-paper');
    await categoryMenu.waitFor({ state: 'visible', timeout: 5000 });

    // Format the category name to match the display format (e.g., "PEPTIDE" -> "Peptide")
    const formattedCategory = data.category.charAt(0) + data.category.slice(1).toLowerCase().replace('_', ' ');
    const categoryOption = categoryMenu.getByRole('option', { name: new RegExp(`^${formattedCategory}$`, 'i') });
    await categoryOption.click();
    await categoryMenu.waitFor({ state: 'hidden' });

    // Switch to Pricing tab on mobile before filling price
    if (isMobile) {
      const pricingTab = this.productDialog.getByRole('tab', { name: /pricing/i });
      await pricingTab.click();
      await this.wait(300);
    }

    // Price input (Tab 1 on mobile)
    await this.priceInput.scrollIntoViewIfNeeded();
    await this.priceInput.fill(data.price.toString());
    await this.wait(100);

    // Toggle onSale switch if needed (also on Tab 1)
    if (data.onSale) {
      const isChecked = await this.onSaleSwitch.isChecked();
      if (!isChecked) {
        await this.onSaleSwitch.click();
      }
    }

    // Switch to Image & Options tab on mobile for isFeatured
    if (isMobile && data.isFeatured) {
      const optionsTab = this.productDialog.getByRole('tab', { name: /image/i });
      await optionsTab.click();
      await this.wait(300);
    }

    // Toggle isFeatured switch if needed (Tab 2 on mobile)
    if (data.isFeatured) {
      await this.featuredSwitch.scrollIntoViewIfNeeded();
      const isChecked = await this.featuredSwitch.isChecked();
      if (!isChecked) {
        await this.featuredSwitch.click();
      }
    }
  }

  /**
   * Submit the product form
   */
  async submitProductForm(): Promise<void> {
    const isMobile = await this.isMobileView();
    
    await this.submitButton.scrollIntoViewIfNeeded();
    await this.wait(isMobile ? 300 : 100);
    await this.submitButton.click();
    
    await this.productDialog.waitFor({ state: 'hidden', timeout: isMobile ? 20000 : 15000 });
  }

  /**
   * Create a new product (full flow)
   */
  async createProduct(data: ProductFormData): Promise<void> {
    await this.openCreateDialog();
    await this.fillProductForm(data);
    await this.submitProductForm();
  }

  // ==================== Edit Product Methods ====================

  /**
   * Open edit dialog for a product
   */
  async openEditDialog(productName: string): Promise<void> {
    const isMobile = await this.isMobileView();

    if (isMobile) {
      const cards = this.page.locator('.MuiCard-root[data-testid^="product-card-"]');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const nameEl = card.locator('[data-testid$="-name"]');
        const cardProductName = await nameEl.textContent() || '';
        
        if (cardProductName.toLowerCase().includes(productName.toLowerCase())) {
          await card.scrollIntoViewIfNeeded();
          await this.wait(300);
          // ProductCard uses Button with aria-label="Edit product {name}"
          const editButton = card.getByRole('button', { name: new RegExp(`edit product ${productName}`, 'i') });
          // Fallback to just "Edit" if specific name doesn't match
          const buttonToClick = await editButton.count() > 0 
            ? editButton 
            : card.getByRole('button', { name: /^edit$/i });
          await buttonToClick.scrollIntoViewIfNeeded();
          await this.wait(200);
          await buttonToClick.click();
          break;
        }
      }
    } else {
      const row = this.page.locator('[role="row"]').filter({ hasText: productName });
      const editButton = row.getByRole('button', { name: /edit product/i });
      await editButton.click();
    }

    await this.productDialog.waitFor({ state: 'visible', timeout: isMobile ? 15000 : 10000 });
    await this.nameInput.waitFor({ state: 'visible', timeout: isMobile ? 8000 : 5000 });
    if (isMobile) {
      await this.wait(500);
    }
  }

  /**
   * Edit a product (full flow)
   */
  async editProduct(productName: string, data: Partial<ProductFormData>): Promise<void> {
    await this.openEditDialog(productName);
    const isMobile = await this.isMobileView();

    // Update fields that are provided (Tab 0 on mobile)
    if (data.name) await this.nameInput.fill(data.name);
    if (data.description) await this.descriptionInput.fill(data.description);
    if (data.dose) await this.doseInput.fill(data.dose);

    if (data.category) {
      await this.categorySelect.click();
      const categoryMenu = this.page.locator('.MuiMenu-paper');
      await categoryMenu.waitFor({ state: 'visible' });
      const formattedCategory = data.category.charAt(0) + data.category.slice(1).toLowerCase().replace('_', ' ');
      await categoryMenu.getByRole('option', { name: new RegExp(`^${formattedCategory}$`, 'i') }).click();
      await categoryMenu.waitFor({ state: 'hidden' });
    }

    // Switch to Pricing tab on mobile if price needs to be updated
    if (isMobile && data.price !== undefined) {
      const pricingTab = this.productDialog.getByRole('tab', { name: /pricing/i });
      await pricingTab.click();
      await this.wait(300);
    }

    if (data.price !== undefined) {
      await this.priceInput.scrollIntoViewIfNeeded();
      await this.priceInput.fill(data.price.toString());
    }

    await this.submitProductForm();
  }

  // ==================== Delete Product Methods ====================

  /**
   * Delete a product
   */
  async deleteProduct(productName: string): Promise<void> {
    const isMobile = await this.isMobileView();

    // Set up dialog handler for confirmation
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    if (isMobile) {
      const cards = this.page.locator('.MuiCard-root[data-testid^="product-card-"]');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const nameEl = card.locator('[data-testid$="-name"]');
        const cardProductName = await nameEl.textContent() || '';
        
        if (cardProductName.toLowerCase().includes(productName.toLowerCase())) {
          await card.scrollIntoViewIfNeeded();
          await this.wait(300);
          // ProductCard uses Button with aria-label="Delete product {name}"
          const deleteButton = card.getByRole('button', { name: new RegExp(`delete product ${productName}`, 'i') });
          // Fallback to just "Delete" if specific name doesn't match
          const buttonToClick = await deleteButton.count() > 0 
            ? deleteButton 
            : card.getByRole('button', { name: /^delete$/i });
          await buttonToClick.scrollIntoViewIfNeeded();
          await this.wait(200);
          await buttonToClick.click();
          break;
        }
      }
    } else {
      const row = this.page.locator('[role="row"]').filter({ hasText: productName });
      const deleteButton = row.getByRole('button', { name: /delete product/i });
      await deleteButton.click();
    }

    await this.wait(isMobile ? 2500 : 1000);
  }

  // ==================== Batch Management Methods ====================

  /**
   * Navigate to batch management for a product
   */
  async manageBatches(productName: string): Promise<void> {
    const isMobile = await this.isMobileView();

    if (isMobile) {
      const cards = this.page.locator('.MuiCard-root[data-testid^="product-card-"]');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const nameEl = card.locator('[data-testid$="-name"]');
        const cardProductName = await nameEl.textContent() || '';
        
        if (cardProductName.toLowerCase().includes(productName.toLowerCase())) {
          // ProductCard uses Button with aria-label="Manage batches for {name}"
          const batchesButton = card.getByRole('button', { name: new RegExp(`manage batches for ${productName}`, 'i') });
          // Fallback to just "Batches" if specific name doesn't match
          const buttonToClick = await batchesButton.count() > 0 
            ? batchesButton 
            : card.getByRole('button', { name: /^batches$/i });
          await buttonToClick.click();
          break;
        }
      }
    } else {
      const row = this.page.locator('[role="row"]').filter({ hasText: productName });
      const batchesButton = row.getByRole('button', { name: /manage batches/i });
      await batchesButton.click();
    }

    await this.page.waitForLoadState('domcontentloaded');
  }

  // ==================== Dialog Methods ====================

  /**
   * Close the product dialog without saving
   */
  async closeDialog(): Promise<void> {
    await this.cancelDialogButton.click();
    await this.productDialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Check if dialog is in create mode
   */
  async isCreateMode(): Promise<boolean> {
    const title = await this.dialogTitle.textContent() || '';
    return title.toLowerCase().includes('add') || title.toLowerCase().includes('create');
  }

  /**
   * Check if dialog is in edit mode
   */
  async isEditMode(): Promise<boolean> {
    const title = await this.dialogTitle.textContent() || '';
    return title.toLowerCase().includes('edit');
  }

  // ==================== Snackbar Methods ====================

  /**
   * Get success message from snackbar
   */
  async getSuccessMessage(): Promise<string> {
    await this.successSnackbar.waitFor({ state: 'visible', timeout: 5000 });
    return await this.successSnackbar.textContent() || '';
  }

  /**
   * Get error message from snackbar
   */
  async getErrorMessage(): Promise<string> {
    await this.errorSnackbar.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorSnackbar.textContent() || '';
  }

  /**
   * Check if success snackbar is visible
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.successSnackbar.isVisible().catch(() => false);
  }

  // ==================== Assertion Helpers ====================

  /**
   * Assert products page is displayed
   */
  async assertPageDisplayed(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Assert add product button is visible
   */
  async assertAddButtonDisplayed(): Promise<void> {
    await expect(this.addProductButton).toBeVisible();
  }

  /**
   * Assert products are loaded (not empty)
   */
  async assertProductsLoaded(): Promise<void> {
    const count = await this.getProductCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Assert product dialog is open
   */
  async assertDialogOpen(): Promise<void> {
    await expect(this.productDialog).toBeVisible();
  }

  /**
   * Assert product dialog is closed
   */
  async assertDialogClosed(): Promise<void> {
    await expect(this.productDialog).not.toBeVisible();
  }

  /**
   * Assert product exists in list
   */
  async assertProductExists(productName: string): Promise<void> {
    const product = await this.findProduct(productName);
    expect(product).not.toBeNull();
  }

  /**
   * Assert product does not exist in list
   */
  async assertProductNotExists(productName: string): Promise<void> {
    const product = await this.findProduct(productName);
    expect(product).toBeNull();
  }

  /**
   * Assert success message is displayed
   */
  async assertSuccessMessageDisplayed(): Promise<void> {
    await expect(this.successSnackbar).toBeVisible();
  }

  /**
   * Assert no error is displayed
   */
  async assertNoError(): Promise<void> {
    await expect(this.errorAlert).not.toBeVisible();
  }
}
