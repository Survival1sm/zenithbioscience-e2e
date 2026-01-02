/**
 * API Helper for E2E Integration Tests
 *
 * Provides methods for interacting with backend and frontend services,
 * including health checks, API interactions, and request logging.
 *
 * Requirements: 1.6, 10.4
 */

import { TestOrderItem, TestOrder, TestProduct, TestUser } from '../fixtures/types';

/**
 * Configuration for API Helper
 */
export interface ApiHelperConfig {
  backendUrl: string;
  frontendUrl: string;
  defaultTimeout: number;
  healthCheckInterval: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ApiHelperConfig = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:8080',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  defaultTimeout: 60000, // 60 seconds
  healthCheckInterval: 1000, // 1 second
};

/**
 * Request log entry structure
 */
export interface RequestLogEntry {
  timestamp: Date;
  method: string;
  url: string;
  status: number | null;
  responseTime: number;
  error?: string;
  requestBody?: unknown;
  responseBody?: unknown;
}

/**
 * Health check response structure
 */
export interface HealthCheckResponse {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  components?: Record<string, { status: string }>;
}

/**
 * Login response structure
 */
export interface LoginResponse {
  id_token: string;
  expires_in?: number;
}

/**
 * Order creation request structure
 */
export interface CreateOrderRequest {
  userId: string;
  items: TestOrderItem[];
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod?: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * API Helper class for E2E test interactions
 *
 * Provides methods for:
 * - Health checks for backend and frontend services
 * - API interactions (orders, products, authentication)
 * - Request logging for debugging and test reports
 */
export class ApiHelper {
  private config: ApiHelperConfig;
  private requestLogs: RequestLogEntry[] = [];
  private authToken: string | null = null;

  constructor(config: Partial<ApiHelperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================
  // Health Check Methods
  // ============================================

  /**
   * Check backend health status
   * GET /management/health
   *
   * @returns Promise<HealthCheckResponse> Health status of the backend
   */
  async checkBackendHealth(): Promise<HealthCheckResponse> {
    const url = `${this.config.backendUrl}/management/health`;

    try {
      const response = await this.makeRequest<HealthCheckResponse>('GET', url);

      if (response.success && response.data) {
        return response.data;
      }

      return { status: 'DOWN' };
    } catch {
      return { status: 'DOWN' };
    }
  }

  /**
   * Check frontend health status
   * GET / on port 3000
   *
   * @returns Promise<boolean> True if frontend is responding
   */
  async checkFrontendHealth(): Promise<boolean> {
    const url = this.config.frontendUrl;

    try {
      const response = await this.makeRequest<string>('GET', url);
      return response.success && response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Wait for all services to become healthy
   * Polls health endpoints until all services respond or timeout is reached
   *
   * @param timeout Maximum time to wait in milliseconds (default: 60000)
   * @returns Promise<boolean> True if all services are healthy
   */
  async waitForServices(timeout: number = this.config.defaultTimeout): Promise<boolean> {
    const startTime = Date.now();
    const interval = this.config.healthCheckInterval;

    console.log(`[ApiHelper] Waiting for services to become healthy (timeout: ${timeout}ms)...`);

    while (Date.now() - startTime < timeout) {
      const backendHealth = await this.checkBackendHealth();
      const frontendHealthy = await this.checkFrontendHealth();

      const backendHealthy = backendHealth.status === 'UP';

      if (backendHealthy && frontendHealthy) {
        const elapsed = Date.now() - startTime;
        console.log(`[ApiHelper] All services healthy after ${elapsed}ms`);
        return true;
      }

      // Log current status
      console.log(
        `[ApiHelper] Service status - Backend: ${backendHealthy ? 'UP' : 'DOWN'}, Frontend: ${frontendHealthy ? 'UP' : 'DOWN'}`
      );

      // Wait before next poll
      await this.sleep(interval);
    }

    console.error(`[ApiHelper] Services did not become healthy within ${timeout}ms`);
    return false;
  }

  // ============================================
  // API Interaction Methods
  // ============================================

  /**
   * Create a new order
   * POST /api/orders
   *
   * @param orderData Order creation data
   * @returns Promise<ApiResponse<TestOrder>> Created order or error
   */
  async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<TestOrder>> {
    const url = `${this.config.backendUrl}/api/orders`;
    return this.makeRequest<TestOrder>('POST', url, orderData);
  }

  /**
   * Get order by ID
   * GET /api/orders/:orderId
   *
   * @param orderId Order ID to retrieve
   * @returns Promise<ApiResponse<TestOrder>> Order data or error
   */
  async getOrder(orderId: string): Promise<ApiResponse<TestOrder>> {
    const url = `${this.config.backendUrl}/api/orders/${orderId}`;
    return this.makeRequest<TestOrder>('GET', url);
  }

  /**
   * Get product list
   * GET /api/products
   *
   * @param params Optional query parameters (page, size, category, etc.)
   * @returns Promise<ApiResponse<TestProduct[]>> Product list or error
   */
  async getProducts(params?: Record<string, string>): Promise<ApiResponse<TestProduct[]>> {
    let url = `${this.config.backendUrl}/api/products`;

    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url = `${url}?${queryString}`;
    }

    return this.makeRequest<TestProduct[]>('GET', url);
  }

  /**
   * Get product by ID
   * GET /api/products/:productId
   *
   * @param productId Product ID to retrieve
   * @returns Promise<ApiResponse<TestProduct>> Product data or error
   */
  async getProduct(productId: string): Promise<ApiResponse<TestProduct>> {
    const url = `${this.config.backendUrl}/api/products/${productId}`;
    return this.makeRequest<TestProduct>('GET', url);
  }

  /**
   * Authenticate user and store token
   * POST /api/authenticate
   *
   * @param email User email
   * @param password User password
   * @returns Promise<ApiResponse<LoginResponse>> Login response with token or error
   */
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const url = `${this.config.backendUrl}/api/authenticate`;
    const response = await this.makeRequest<LoginResponse>('POST', url, {
      username: email,
      password: password,
      rememberMe: false,
    });

    // Store token if login successful
    if (response.success && response.data?.id_token) {
      this.authToken = response.data.id_token;
    }

    return response;
  }

  /**
   * Clear stored authentication token
   */
  logout(): void {
    this.authToken = null;
    console.log('[ApiHelper] Logged out, token cleared');
  }

  /**
   * Get current user account info
   * GET /api/account
   *
   * @returns Promise<ApiResponse<TestUser>> User account data or error
   */
  async getAccount(): Promise<ApiResponse<TestUser>> {
    const url = `${this.config.backendUrl}/api/account`;
    return this.makeRequest<TestUser>('GET', url);
  }

  // ============================================
  // Request Logging Methods
  // ============================================

  /**
   * Get all request logs
   *
   * @returns RequestLogEntry[] Array of all logged requests
   */
  getRequestLogs(): RequestLogEntry[] {
    return [...this.requestLogs];
  }

  /**
   * Clear all request logs
   */
  clearRequestLogs(): void {
    this.requestLogs = [];
    console.log('[ApiHelper] Request logs cleared');
  }

  /**
   * Get request logs as formatted string for reports
   *
   * @returns string Formatted log output
   */
  getFormattedLogs(): string {
    if (this.requestLogs.length === 0) {
      return 'No requests logged';
    }

    return this.requestLogs
      .map((log) => {
        const timestamp = log.timestamp.toISOString();
        const status = log.status ?? 'ERROR';
        const time = `${log.responseTime}ms`;
        const error = log.error ? ` - Error: ${log.error}` : '';
        return `[${timestamp}] ${log.method} ${log.url} -> ${status} (${time})${error}`;
      })
      .join('\n');
  }

  /**
   * Print request logs to console
   */
  printLogs(): void {
    console.log('\n=== API Request Logs ===');
    console.log(this.getFormattedLogs());
    console.log('========================\n');
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Make an HTTP request with logging
   *
   * @param method HTTP method
   * @param url Request URL
   * @param body Optional request body
   * @returns Promise<ApiResponse<T>> Response wrapper
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method,
      url,
      status: null,
      responseTime: 0,
      requestBody: body,
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      // Add auth token if available
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const fetchOptions: RequestInit = {
        method,
        headers,
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      const responseTime = Date.now() - startTime;

      logEntry.status = response.status;
      logEntry.responseTime = responseTime;

      // Log the request
      this.logRequest(logEntry);

      // Parse response
      let data: T | undefined;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        try {
          data = (await response.json()) as T;
          logEntry.responseBody = data;
        } catch {
          // Response body is not valid JSON
        }
      }

      if (response.ok) {
        return {
          success: true,
          data,
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logEntry.status = null;
      logEntry.responseTime = responseTime;
      logEntry.error = errorMessage;

      // Log the failed request
      this.logRequest(logEntry);

      return {
        success: false,
        error: errorMessage,
        status: 0,
      };
    }
  }

  /**
   * Log a request entry and print to console
   *
   * @param entry Request log entry
   */
  private logRequest(entry: RequestLogEntry): void {
    this.requestLogs.push(entry);

    const status = entry.status ?? 'ERROR';
    const statusEmoji = entry.status && entry.status >= 200 && entry.status < 300 ? '✓' : '✗';

    console.log(
      `[ApiHelper] ${statusEmoji} ${entry.method} ${entry.url} -> ${status} (${entry.responseTime}ms)`
    );

    if (entry.error) {
      console.log(`[ApiHelper]   Error: ${entry.error}`);
    }
  }

  /**
   * Sleep for specified milliseconds
   *
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================
  // Configuration Methods
  // ============================================

  /**
   * Get current configuration
   *
   * @returns ApiHelperConfig Current configuration
   */
  getConfig(): ApiHelperConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   *
   * @param config Partial configuration to update
   */
  updateConfig(config: Partial<ApiHelperConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if currently authenticated
   *
   * @returns boolean True if auth token is set
   */
  isAuthenticated(): boolean {
    return this.authToken !== null;
  }
}

/**
 * Create a pre-configured ApiHelper instance
 *
 * @param config Optional configuration overrides
 * @returns ApiHelper Configured instance
 */
export function createApiHelper(config?: Partial<ApiHelperConfig>): ApiHelper {
  return new ApiHelper(config);
}

/**
 * Default export for convenience
 */
export default ApiHelper;
