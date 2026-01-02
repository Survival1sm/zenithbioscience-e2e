/**
 * Request Logger for E2E Integration Tests
 *
 * Provides centralized request/response logging with aggregation
 * for debugging and test reports.
 *
 * Requirements: 10.4
 */

import { Page, Request, Response } from '@playwright/test';

/**
 * Logged request entry
 */
export interface LoggedRequest {
  timestamp: Date;
  method: string;
  url: string;
  resourceType: string;
  postData?: string;
  headers: Record<string, string>;
}

/**
 * Logged response entry
 */
export interface LoggedResponse {
  timestamp: Date;
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timing?: number;
}

/**
 * Complete request/response log entry
 */
export interface RequestLogEntry {
  id: string;
  request: LoggedRequest;
  response?: LoggedResponse;
  error?: string;
  duration?: number;
}

/**
 * Request Logger class for capturing and aggregating HTTP requests
 * during Playwright test execution.
 */
export class RequestLogger {
  private logs: Map<string, RequestLogEntry> = new Map();
  private requestCounter = 0;
  private page: Page | null = null;
  private isAttached = false;

  /**
   * Attach the logger to a Playwright page
   * @param page Playwright page instance
   */
  attach(page: Page): void {
    if (this.isAttached) {
      this.detach();
    }

    this.page = page;
    this.isAttached = true;

    // Listen for requests
    page.on('request', this.handleRequest.bind(this));
    page.on('response', this.handleResponse.bind(this));
    page.on('requestfailed', this.handleRequestFailed.bind(this));

    console.log('[RequestLogger] Attached to page');
  }

  /**
   * Detach the logger from the current page
   */
  detach(): void {
    if (this.page && this.isAttached) {
      this.page.removeListener('request', this.handleRequest.bind(this));
      this.page.removeListener('response', this.handleResponse.bind(this));
      this.page.removeListener('requestfailed', this.handleRequestFailed.bind(this));
      this.isAttached = false;
      console.log('[RequestLogger] Detached from page');
    }
  }

  /**
   * Handle incoming request
   */
  private handleRequest(request: Request): void {
    const id = this.generateRequestId();
    const entry: RequestLogEntry = {
      id,
      request: {
        timestamp: new Date(),
        method: request.method(),
        url: request.url(),
        resourceType: request.resourceType(),
        postData: request.postData() || undefined,
        headers: request.headers(),
      },
    };

    this.logs.set(request.url() + '-' + id, entry);

    // Log API requests (filter out static resources)
    if (this.isApiRequest(request.url())) {
      console.log(`[RequestLogger] → ${request.method()} ${request.url()}`);
    }
  }

  /**
   * Handle response
   */
  private handleResponse(response: Response): void {
    const request = response.request();
    const entry = this.findEntry(request.url());

    if (entry) {
      entry.response = {
        timestamp: new Date(),
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
      };

      // Calculate duration
      if (entry.request.timestamp) {
        entry.duration = entry.response.timestamp.getTime() - entry.request.timestamp.getTime();
      }

      // Log API responses
      if (this.isApiRequest(response.url())) {
        const statusEmoji = response.status() >= 200 && response.status() < 300 ? '✓' : '✗';
        console.log(
          `[RequestLogger] ${statusEmoji} ${response.status()} ${response.url()} (${entry.duration}ms)`
        );
      }
    }
  }

  /**
   * Handle failed request
   */
  private handleRequestFailed(request: Request): void {
    const entry = this.findEntry(request.url());

    if (entry) {
      entry.error = request.failure()?.errorText || 'Unknown error';
      console.log(`[RequestLogger] ✗ FAILED ${request.url()} - ${entry.error}`);
    }
  }

  /**
   * Find log entry by URL (most recent)
   */
  private findEntry(url: string): RequestLogEntry | undefined {
    // Find the most recent entry for this URL
    let latestEntry: RequestLogEntry | undefined;
    for (const [key, entry] of this.logs) {
      if (key.startsWith(url + '-')) {
        if (!latestEntry || entry.request.timestamp > latestEntry.request.timestamp) {
          latestEntry = entry;
        }
      }
    }
    return latestEntry;
  }

  /**
   * Check if URL is an API request (not static resource)
   */
  private isApiRequest(url: string): boolean {
    return (
      url.includes('/api/') ||
      url.includes('/management/') ||
      url.includes('/authenticate')
    );
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${++this.requestCounter}-${Date.now()}`;
  }

  /**
   * Get all logged entries
   */
  getLogs(): RequestLogEntry[] {
    return Array.from(this.logs.values());
  }

  /**
   * Get only API request logs (filtered)
   */
  getApiLogs(): RequestLogEntry[] {
    return this.getLogs().filter((entry) => this.isApiRequest(entry.request.url));
  }

  /**
   * Get failed requests
   */
  getFailedRequests(): RequestLogEntry[] {
    return this.getLogs().filter(
      (entry) => entry.error || (entry.response && entry.response.status >= 400)
    );
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs.clear();
    this.requestCounter = 0;
    console.log('[RequestLogger] Logs cleared');
  }

  /**
   * Get formatted log output for reports
   */
  getFormattedLogs(): string {
    const apiLogs = this.getApiLogs();

    if (apiLogs.length === 0) {
      return 'No API requests logged';
    }

    return apiLogs
      .map((entry) => {
        const timestamp = entry.request.timestamp.toISOString();
        const method = entry.request.method;
        const url = entry.request.url;
        const status = entry.response?.status ?? 'PENDING';
        const duration = entry.duration ? `${entry.duration}ms` : 'N/A';
        const error = entry.error ? ` - Error: ${entry.error}` : '';

        return `[${timestamp}] ${method} ${url} -> ${status} (${duration})${error}`;
      })
      .join('\n');
  }

  /**
   * Print logs to console
   */
  printLogs(): void {
    console.log('\n=== API Request Logs ===');
    console.log(this.getFormattedLogs());
    console.log('========================\n');
  }

  /**
   * Get log summary statistics
   */
  getSummary(): {
    total: number;
    apiRequests: number;
    successful: number;
    failed: number;
    avgDuration: number;
  } {
    const allLogs = this.getLogs();
    const apiLogs = this.getApiLogs();
    const failedLogs = this.getFailedRequests();

    const durations = apiLogs
      .filter((entry) => entry.duration !== undefined)
      .map((entry) => entry.duration!);

    const avgDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    return {
      total: allLogs.length,
      apiRequests: apiLogs.length,
      successful: apiLogs.length - failedLogs.filter((e) => this.isApiRequest(e.request.url)).length,
      failed: failedLogs.filter((e) => this.isApiRequest(e.request.url)).length,
      avgDuration: Math.round(avgDuration),
    };
  }
}

/**
 * Create a new RequestLogger instance
 */
export function createRequestLogger(): RequestLogger {
  return new RequestLogger();
}

export default RequestLogger;
