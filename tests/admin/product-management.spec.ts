import { test, expect } from '@playwright/test';
import { AdminProductsPage, ProductFormData } from '../../page-objects/admin';
import { LoginPage } from '../../page-objects/LoginPage';
import { defaultFixtures } from '../../fixtures/defaultFixtures';

/**
 * Admin Product Management E2E Tests
 *
 * Tests for admin product CRUD operations
 *
 * Requirements covered:
 * - Admin can view products list
 * - Admin can create new products
 * - Admin can edit existing products
 * - Admin can delete products
 * - Product form validation
 */
test.describe('Admin Product Management', () => {
  let adminProductsPage: AdminProductsPage;
  let loginPage: LoginPage;
  const admin = defaultFixtures.users.admin;

  // Generate unique product names with timestamps to avoid conflicts
  const generateUniqueProductName = (prefix: string): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  };

  test.beforeEach(async ({ page }) => {
    adminProductsPage = new AdminProductsPage(page);
    loginPage = new LoginPage(page);

    // Login as admin before each test
    await loginPage.goto();
    await loginPage.waitForForm();
    await loginPage.login(admin.email, admin.password);
    await loginPage.waitForLoginComplete();

    // Navigate to admin products page
    await adminProductsPage.goto();
    await adminProductsPage.waitForPage();
  });

  test.describe('Products List View', () => {
    /**
     * Test: Admin can view products list
     * Verifies that the products page loads and displays the product list
     */
    test('should display products list page with heading', async () => {
      await adminProductsPage.assertPageDisplayed();
      await expect(adminProductsPage.pageHeading).toHaveText('Product Management');
    });

    /**
     * Test: Products list displays product information
     * Verifies that product information (name, SKU, category, price, inventory) is displayed
     */
    test('should display product information in the list', async () => {
      // Wait for products to load
      await adminProductsPage.assertProductsLoaded();

      // Get products from the list
      const products = await adminProductsPage.getProducts();

      // Verify at least one product exists
      expect(products.length).toBeGreaterThan(0);

      // Verify first product has required fields
      const firstProduct = products[0];
      expect(firstProduct.name).toBeTruthy();
      // SKU, category, price, and inventory should be present (may be empty strings or 0)
      expect(firstProduct).toHaveProperty('sku');
      expect(firstProduct).toHaveProperty('category');
      expect(firstProduct).toHaveProperty('price');
      expect(firstProduct).toHaveProperty('inventory');
    });

    /**
     * Test: Add New Product button is visible
     * Verifies that the add product button is displayed for admin users
     */
    test('should display Add New Product button', async () => {
      await adminProductsPage.assertAddButtonDisplayed();
    });

    /**
     * Test: No error is displayed on page load
     * Verifies that the page loads without errors
     */
    test('should load products without errors', async () => {
      await adminProductsPage.assertNoError();
    });
  });

  test.describe('Create Product', () => {
    /**
     * Test: Admin can open create product dialog
     * Verifies that clicking Add New Product opens the create dialog
     */
    test('should open create product dialog when clicking Add New Product', async () => {
      await adminProductsPage.openCreateDialog();
      await adminProductsPage.assertDialogOpen();

      // Verify dialog is in create mode
      const isCreateMode = await adminProductsPage.isCreateMode();
      expect(isCreateMode).toBeTruthy();
    });

    /**
     * Test: Admin can create a new product with required fields
     * Creates a new product and verifies success
     */
    test('should create a new product with required fields', async () => {
      const uniqueName = generateUniqueProductName('E2E-Test-Product');
      const newProduct: ProductFormData = {
        name: uniqueName,
        description: 'E2E test product description',
        category: 'PEPTIDE',
        dose: '5mg',
        price: 49.99,
        isFeatured: false,
        onSale: false,
      };

      // Create the product
      await adminProductsPage.createProduct(newProduct);

      // Verify dialog is closed
      await adminProductsPage.assertDialogClosed();

      // Wait for the list to refresh
      await adminProductsPage.wait(2000);

      // Verify success message is displayed
      const hasSuccess = await adminProductsPage.hasSuccessMessage();
      expect(hasSuccess).toBeTruthy();
    });

    /**
     * Test: Created product appears in the list
     * Creates a product and verifies it appears in the products list
     */
    test('should show created product in the list', async () => {
      const uniqueName = generateUniqueProductName('E2E-List-Product');
      const newProduct: ProductFormData = {
        name: uniqueName,
        description: 'E2E test product for list verification',
        category: 'PEPTIDE', // Changed from BLEND to PEPTIDE for consistency
        dose: '10mg',
        price: 79.99,
        isFeatured: true,
        onSale: false,
      };

      // Create the product
      await adminProductsPage.createProduct(newProduct);

      // Wait for the list to refresh
      await adminProductsPage.wait(2000);

      // Verify the product appears in the list
      await adminProductsPage.assertProductExists(uniqueName);
    });

    /**
     * Test: Can cancel create product dialog
     * Verifies that canceling the dialog doesn't create a product
     */
    test('should cancel create product dialog without creating product', async () => {
      const uniqueName = generateUniqueProductName('E2E-Cancel-Product');

      // Open create dialog
      await adminProductsPage.openCreateDialog();
      await adminProductsPage.assertDialogOpen();

      // Fill in some data
      await adminProductsPage.nameInput.fill(uniqueName);

      // Cancel the dialog
      await adminProductsPage.closeDialog();

      // Verify dialog is closed
      await adminProductsPage.assertDialogClosed();

      // Verify the product was NOT created
      await adminProductsPage.assertProductNotExists(uniqueName);
    });
  });

  test.describe('Edit Product', () => {
    let testProductName: string;
    let createdProductName: string;

    test.beforeEach(async () => {
      // Create a product to edit in each test
      testProductName = generateUniqueProductName('E2E-Edit-Source');
      const newProduct: ProductFormData = {
        name: testProductName,
        description: 'Product to be edited',
        category: 'PEPTIDE',
        dose: '5mg',
        price: 29.99,
        isFeatured: false,
        onSale: false,
      };

      await adminProductsPage.createProduct(newProduct);
      await adminProductsPage.wait(2000);
      createdProductName = testProductName;
      
      // Don't reload the page - the product is in the local state
      // Just wait for the product to appear in the list
      await adminProductsPage.assertProductExists(createdProductName);
    });

    /**
     * Test: Admin can open edit product dialog
     * Verifies that clicking edit opens the edit dialog for a product
     */
    test('should open edit product dialog', async () => {
      await adminProductsPage.openEditDialog(createdProductName);
      await adminProductsPage.assertDialogOpen();

      // Verify dialog is in edit mode
      const isEditMode = await adminProductsPage.isEditMode();
      expect(isEditMode).toBeTruthy();
    });

    /**
     * Test: Admin can update product details
     * Updates a product and verifies the changes are saved
     */
    test('should update product details', async () => {
      const updatedName = generateUniqueProductName('E2E-Updated-Product');

      // Edit the product
      await adminProductsPage.editProduct(createdProductName, {
        name: updatedName,
        price: 39.99,
      });

      // Verify dialog is closed
      await adminProductsPage.assertDialogClosed();

      // Wait for the list to refresh
      await adminProductsPage.wait(2000);

      // Verify success message
      const hasSuccess = await adminProductsPage.hasSuccessMessage();
      expect(hasSuccess).toBeTruthy();

      // Verify the updated product appears in the list
      await adminProductsPage.assertProductExists(updatedName);
    });

    /**
     * Test: Updated product shows changes in list
     * Verifies that product changes are reflected in the list
     */
    test('should reflect updated product details in the list', async () => {
      const updatedName = generateUniqueProductName('E2E-Reflected-Update');

      // Edit the product with new name
      await adminProductsPage.editProduct(createdProductName, {
        name: updatedName,
      });

      // Wait for the list to refresh
      await adminProductsPage.wait(2000);

      // Verify the old name no longer exists
      await adminProductsPage.assertProductNotExists(createdProductName);

      // Verify the new name exists
      await adminProductsPage.assertProductExists(updatedName);
    });
  });

  test.describe('Delete Product', () => {
    let productToDelete: string;

    test.beforeEach(async () => {
      // Create a product to delete in each test
      productToDelete = generateUniqueProductName('E2E-Delete-Target');
      const newProduct: ProductFormData = {
        name: productToDelete,
        description: 'Product to be deleted',
        category: 'BAC_WATER', // Changed from OTHER - only PEPTIDE, BLEND, BAC_WATER exist
        dose: '1mg',
        price: 9.99,
        isFeatured: false,
        onSale: false,
      };

      await adminProductsPage.createProduct(newProduct);
      await adminProductsPage.wait(2000);

      // Don't reload the page - the product is in the local state
      // Just verify product was created - it should be visible in the grid
      await adminProductsPage.assertProductExists(productToDelete);
    });

    /**
     * Test: Admin can delete a product
     * Deletes a product and verifies it's removed
     */
    test('should delete a product', async () => {
      // Delete the product
      await adminProductsPage.deleteProduct(productToDelete);

      // Wait for the deletion to complete
      await adminProductsPage.wait(2000);

      // Verify the product is removed from the list
      await adminProductsPage.assertProductNotExists(productToDelete);
    });

    /**
     * Test: Deleted product is removed from list
     * Verifies that after deletion, the product no longer appears in the list
     */
    test('should remove deleted product from the list', async () => {
      // Wait for the page to be fully loaded
      await adminProductsPage.waitForPage();
      await adminProductsPage.wait(1000);

      // Delete the product
      await adminProductsPage.deleteProduct(productToDelete);

      // Wait for the list to refresh
      await adminProductsPage.wait(2000);

      // Verify the specific product is gone - this is the key assertion
      const deletedProduct = await adminProductsPage.findProduct(productToDelete);
      expect(deletedProduct).toBeNull();
    });
  });

  test.describe('Form Validation', () => {
    /**
     * Test: Product form validates required fields
     * Verifies that the form shows validation errors for missing required fields
     */
    test('should validate required fields on product form', async () => {
      // Open create dialog
      await adminProductsPage.openCreateDialog();
      await adminProductsPage.assertDialogOpen();

      // Try to submit without filling required fields
      await adminProductsPage.submitButton.click();

      // Dialog should still be open (form validation prevents submission)
      await adminProductsPage.assertDialogOpen();

      // The form should show validation errors or prevent submission
      // We verify by checking the dialog is still open after clicking submit
      const isDialogVisible = await adminProductsPage.productDialog.isVisible();
      expect(isDialogVisible).toBeTruthy();
    });

    /**
     * Test: Product name is required
     * Verifies that product name field is required
     */
    test('should require product name', async () => {
      // Open create dialog
      await adminProductsPage.openCreateDialog();

      // Fill all fields except name
      await adminProductsPage.descriptionInput.fill('Test description');
      await adminProductsPage.doseInput.fill('5mg');
      await adminProductsPage.priceInput.fill('29.99');

      // Select category
      await adminProductsPage.categorySelect.click();
      const categoryMenu = adminProductsPage.page.locator('.MuiMenu-paper');
      await categoryMenu.waitFor({ state: 'visible' });
      await categoryMenu.getByRole('option', { name: /peptide/i }).click();
      await categoryMenu.waitFor({ state: 'hidden' });

      // Try to submit
      await adminProductsPage.submitButton.click();

      // Wait a moment for validation
      await adminProductsPage.wait(1000);

      // Dialog should still be open due to validation
      await adminProductsPage.assertDialogOpen();
    });

    /**
     * Test: Product price must be valid
     * Verifies that price field accepts valid numeric values
     */
    test('should accept valid price values', async () => {
      const uniqueName = generateUniqueProductName('E2E-Price-Test');

      // Open create dialog
      await adminProductsPage.openCreateDialog();

      // Fill form with valid price
      await adminProductsPage.fillProductForm({
        name: uniqueName,
        description: 'Price validation test',
        category: 'PEPTIDE',
        dose: '5mg',
        price: 99.99,
      });

      // Submit should succeed
      await adminProductsPage.submitProductForm();

      // Verify dialog closed (submission successful)
      await adminProductsPage.assertDialogClosed();
    });
  });
});
