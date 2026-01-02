/**
 * Admin Page Objects
 * 
 * Exports all admin-related page objects for E2E testing.
 */

export { AdminDashboardPage } from './AdminDashboardPage';
export type { DashboardStats, BatchExpiryAlert, LowStockAlert } from './AdminDashboardPage';

export { AdminOrdersPage } from './AdminOrdersPage';
export type { AdminOrderInfo, AdminOrderDetail, OrderStatus } from './AdminOrdersPage';

export { AdminProductsPage } from './AdminProductsPage';
export type { AdminProductInfo, ProductFormData, ProductCategory } from './AdminProductsPage';
