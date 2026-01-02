/**
 * Empty Fixture Profile
 *
 * Minimal test data for testing empty state scenarios.
 * Contains only a single user with no products or coupons.
 */

import { E2ETestFixtures } from '../types';

/**
 * Empty profile fixtures for testing empty state scenarios
 * - No products in catalog
 * - Single user for authentication
 * - No coupons available
 */
export const emptyFixtures: E2ETestFixtures = {
  users: {
    customer: {
      id: 'empty-customer-001',
      email: 'empty-customer@test.zenith.com',
      password: 'EmptyTestPassword123!',
      firstName: 'Empty',
      lastName: 'Customer',
      authorities: ['ROLE_USER'],
    },
    admin: {
      id: 'empty-admin-001',
      email: 'empty-admin@test.zenith.com',
      password: 'EmptyAdminPassword123!',
      firstName: 'Empty',
      lastName: 'Admin',
      authorities: ['ROLE_USER', 'ROLE_ADMIN'],
    },
    unverified: {
      id: 'empty-unverified-001',
      email: 'empty-unverified@test.zenith.com',
      password: 'EmptyUnverifiedPassword123!',
      firstName: 'Empty',
      lastName: 'Unverified',
      authorities: ['ROLE_USER'],
    },
  },
  products: [],
  coupons: {
    percentage: {
      code: 'EMPTY_PERCENT',
      discountType: 'PERCENTAGE',
      discountValue: 0,
    },
    fixed: {
      code: 'EMPTY_FIXED',
      discountType: 'FIXED',
      discountValue: 0,
    },
    expired: {
      code: 'EMPTY_EXPIRED',
      discountType: 'PERCENTAGE',
      discountValue: 0,
    },
  },
  orders: [],
};

/**
 * Helper function to get a deep copy of empty fixtures
 */
export function getEmptyFixtures(): E2ETestFixtures {
  return JSON.parse(JSON.stringify(emptyFixtures));
}
