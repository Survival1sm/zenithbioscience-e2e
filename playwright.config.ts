import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Playwright configuration for Zenith Bioscience E2E tests
 * 
 * Requirements covered:
 * - 10.1: Multi-browser testing (chromium, firefox, mobile-chrome)
 * - 10.2: Test reporting (HTML, JSON, list reporters)
 * - 10.3: Screenshot, trace, and video capture on failure
 * - 10.5: CI/CD integration (retries, workers, forbidOnly)
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry configuration: 2 retries in CI, 2 locally for flaky tests
  // This helps handle timing issues, especially on Firefox and mobile viewports
  retries: process.env.CI ? 1 : 2,

  // Worker configuration: 1 worker in CI for stability, undefined (auto) locally
  workers: process.env.CI ? 1 : undefined,

  // Global setup and teardown
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  // Reporter configuration
  // In CI, also output JUnit XML for test result reporting
  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { outputFolder: 'reports/html' }],
        ['json', { outputFile: 'reports/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [
        ['list'],
        ['html', { outputFolder: 'reports/html' }],
        ['json', { outputFile: 'reports/results.json' }],
      ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Capture screenshot only on failure
    screenshot: 'only-on-failure',

    // Record trace on first retry
    trace: 'on-first-retry',

    // Retain video only on failure
    video: 'retain-on-failure',
  },

  // Timeout configuration
  timeout: 60000, // Test timeout: 60 seconds
  expect: {
    timeout: 10000, // Expect timeout: 10 seconds
  },

  // Browser projects configuration
  // 3 browsers enabled for cross-browser testing
  // Requirements: 12.1, 12.2, 12.4
  // Note: webkit/mobile-safari removed - WebKit has rendering issues on Windows
  // Note: mobile-firefox removed - Playwright doesn't support isMobile option for Firefox
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
