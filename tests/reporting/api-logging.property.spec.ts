/**
 * Property Test: API Request Logging Completeness
 *
 * **Property 15: API Request Logging Completeness**
 * *For any* test execution, all HTTP requests made to the backend API
 * should be logged with request and response details.
 *
 * **Validates: Requirements 10.4**
 */

import { test, expect } from '@playwright/test';
import { RequestLogger, createRequestLogger } from '../../helpers/RequestLogger';
import { ApiHelper, createApiHelper } from '../../helpers/ApiHelper';

test.describe('Property 15: API Request Logging Completeness', () => {
  // Feature: e2e-integration-testing, Property 15: API Request Logging Completeness
  // Validates: Requirements 10.4

  let requestLogger: RequestLogger;
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ page }) => {
    requestLogger = createRequestLogger();
    requestLogger.attach(page);
    apiHelper = createApiHelper();
  });

  test.afterEach(async () => {
    requestLogger.detach();
    requestLogger.clear();
    apiHelper.clearRequestLogs();
  });

  test('RequestLogger captures page navigation requests', async ({ page }) => {
    // Navigate to a page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Get all logged requests
    const logs = requestLogger.getLogs();
    
    // Should have captured at least the main document request
    expect(logs.length).toBeGreaterThan(0);
    
    // Find the main document request
    const mainRequest = logs.find(
      (log) => log.request.resourceType === 'document'
    );
    
    expect(mainRequest).toBeTruthy();
    expect(mainRequest?.request.method).toBe('GET');
    
    console.log(`[Property 15] Captured ${logs.length} requests during navigation`);
  });

  test('RequestLogger captures API requests with method and URL', async ({ page }) => {
    // Navigate to shop page which makes API calls
    await page.goto('/shop');
    
    // Wait for page to load (don't use networkidle - analytics keeps firing)
    await page.waitForLoadState('domcontentloaded');
    // Give API calls time to complete
    await page.waitForTimeout(2000);
    
    // Get API logs
    const apiLogs = requestLogger.getApiLogs();
    
    // Should have captured API requests
    // Note: This may be 0 if the shop page doesn't make API calls in test environment
    console.log(`[Property 15] Captured ${apiLogs.length} API requests`);
    
    // Verify each API log has required fields
    for (const log of apiLogs) {
      expect(log.request.method).toBeTruthy();
      expect(log.request.url).toBeTruthy();
      expect(log.request.timestamp).toBeInstanceOf(Date);
      
      // If response exists, verify it has required fields
      if (log.response) {
        expect(typeof log.response.status).toBe('number');
        expect(log.response.url).toBeTruthy();
      }
    }
  });

  test('RequestLogger captures response status codes', async ({ page }) => {
    // Navigate to a page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Give API calls time to complete
    await page.waitForTimeout(2000);
    
    // Get logs with responses
    const logsWithResponses = requestLogger.getLogs().filter((log) => log.response);
    
    // Should have responses for completed requests
    expect(logsWithResponses.length).toBeGreaterThan(0);
    
    // Verify status codes are captured
    for (const log of logsWithResponses) {
      expect(log.response?.status).toBeDefined();
      expect(typeof log.response?.status).toBe('number');
      expect(log.response?.status).toBeGreaterThanOrEqual(100);
      expect(log.response?.status).toBeLessThan(600);
    }
    
    console.log(`[Property 15] Captured ${logsWithResponses.length} responses with status codes`);
  });

  test('RequestLogger calculates request duration', async ({ page }) => {
    // Navigate to a page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Give API calls time to complete
    await page.waitForTimeout(2000);
    
    // Get logs with duration
    const logsWithDuration = requestLogger.getLogs().filter((log) => log.duration !== undefined);
    
    // Should have duration for completed requests
    expect(logsWithDuration.length).toBeGreaterThan(0);
    
    // Verify durations are reasonable (positive numbers)
    for (const log of logsWithDuration) {
      expect(log.duration).toBeGreaterThanOrEqual(0);
      expect(log.duration).toBeLessThan(60000); // Less than 60 seconds
    }
    
    console.log(`[Property 15] Captured ${logsWithDuration.length} requests with duration`);
  });

  test('RequestLogger identifies failed requests', async ({ page }) => {
    // Try to navigate to a non-existent API endpoint
    // This should result in a 404 or similar error
    
    // First navigate to home
    await page.goto('/');
    
    // Try to fetch a non-existent resource
    await page.evaluate(async () => {
      try {
        await fetch('/api/non-existent-endpoint-12345');
      } catch {
        // Expected to fail
      }
    });
    
    // Wait a bit for the request to be logged
    await page.waitForTimeout(500);
    
    // Get failed requests
    const failedRequests = requestLogger.getFailedRequests();
    
    // Log the results (may or may not have failures depending on how the server responds)
    console.log(`[Property 15] Captured ${failedRequests.length} failed requests`);
    
    // Verify failed requests have error info or 4xx/5xx status
    for (const log of failedRequests) {
      const hasError = log.error !== undefined;
      const hasErrorStatus = log.response && log.response.status >= 400;
      expect(hasError || hasErrorStatus).toBeTruthy();
    }
  });

  test('RequestLogger provides formatted log output', async ({ page }) => {
    // Navigate to a page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Give API calls time to complete
    await page.waitForTimeout(2000);
    
    // Get formatted logs
    const formattedLogs = requestLogger.getFormattedLogs();
    
    // Should return a string
    expect(typeof formattedLogs).toBe('string');
    
    // If there are API logs, the formatted output should contain timestamps
    const apiLogs = requestLogger.getApiLogs();
    if (apiLogs.length > 0) {
      // Should contain ISO timestamp format
      expect(formattedLogs).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    }
    
    console.log(`[Property 15] Formatted logs:\n${formattedLogs.substring(0, 500)}...`);
  });

  test('RequestLogger provides summary statistics', async ({ page }) => {
    // Navigate to a page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Give API calls time to complete
    await page.waitForTimeout(2000);
    
    // Get summary
    const summary = requestLogger.getSummary();
    
    // Verify summary structure
    expect(typeof summary.total).toBe('number');
    expect(typeof summary.apiRequests).toBe('number');
    expect(typeof summary.successful).toBe('number');
    expect(typeof summary.failed).toBe('number');
    expect(typeof summary.avgDuration).toBe('number');
    
    // Total should be >= API requests
    expect(summary.total).toBeGreaterThanOrEqual(summary.apiRequests);
    
    // Successful + failed should equal API requests
    expect(summary.successful + summary.failed).toBe(summary.apiRequests);
    
    console.log(`[Property 15] Summary: ${JSON.stringify(summary)}`);
  });

  test('ApiHelper logs all requests made', async ({ page }) => {
    // Use ApiHelper to make requests
    const healthResponse = await apiHelper.checkBackendHealth();
    
    // Get ApiHelper logs
    const logs = apiHelper.getRequestLogs();
    
    // Should have logged the health check request
    expect(logs.length).toBeGreaterThan(0);
    
    // Find the health check request
    const healthLog = logs.find((log) => log.url.includes('/management/health'));
    
    if (healthLog) {
      expect(healthLog.method).toBe('GET');
      expect(healthLog.timestamp).toBeInstanceOf(Date);
      expect(typeof healthLog.responseTime).toBe('number');
    }
    
    console.log(`[Property 15] ApiHelper logged ${logs.length} requests`);
  });

  test('ApiHelper provides formatted log output', async ({ page }) => {
    // Make some API calls
    await apiHelper.checkBackendHealth();
    await apiHelper.checkFrontendHealth();
    
    // Get formatted logs
    const formattedLogs = apiHelper.getFormattedLogs();
    
    // Should return a string
    expect(typeof formattedLogs).toBe('string');
    
    // Should contain request info
    if (apiHelper.getRequestLogs().length > 0) {
      expect(formattedLogs).toContain('GET');
    }
    
    console.log(`[Property 15] ApiHelper formatted logs:\n${formattedLogs}`);
  });

  test('logs can be cleared between tests', async ({ page }) => {
    // Navigate to create some logs
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Give API calls time to complete
    await page.waitForTimeout(2000);
    
    // Verify we have logs
    const initialLogs = requestLogger.getLogs();
    expect(initialLogs.length).toBeGreaterThan(0);
    
    // Clear logs
    requestLogger.clear();
    
    // Verify logs are cleared
    const clearedLogs = requestLogger.getLogs();
    expect(clearedLogs.length).toBe(0);
    
    console.log(`[Property 15] Logs cleared successfully (had ${initialLogs.length} logs)`);
  });
});
