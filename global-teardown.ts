import { FullConfig } from '@playwright/test';
import { DataSeeder } from './fixtures/DataSeeder';

/**
 * Global teardown for Playwright tests
 *
 * This function runs once after all tests.
 * - Cleans up test data from database
 * - Releases resources
 *
 * Requirements covered:
 * - 1.3: Test environment cleanup
 */
async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('🧹 Running global teardown...');

  // Only clean up if CLEANUP_AFTER_TESTS is set (default: keep data for debugging)
  const shouldCleanup = process.env.CLEANUP_AFTER_TESTS === 'true';

  if (shouldCleanup) {
    const seeder = new DataSeeder();

    try {
      await seeder.connect();
      console.log('🗑️ Cleaning up test data...');
      await seeder.resetDatabase();
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.warn('⚠️ Cleanup failed (non-fatal):', error);
    } finally {
      await seeder.disconnect();
    }
  } else {
    console.log('ℹ️ Skipping cleanup (set CLEANUP_AFTER_TESTS=true to enable)');
  }

  console.log('✅ Global teardown complete');
}

export default globalTeardown;
