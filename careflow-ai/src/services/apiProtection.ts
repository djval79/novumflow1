import { supabase } from '../lib/supabase';
import errorMonitoring from './errorMonitoring';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED'
  };
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    if (this.state.state === 'OPEN') {
      if (Date.now() - this.state.lastFailureTime > this.config.resetTimeout) {
        this.state.state = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit breaker is OPEN for ${operationName}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      await errorMonitoring.reportApiError(operationName, error, { circuitBreakerState: this.state.state });
      throw error;
    }
  }

  private onSuccess(): void {
    this.state.failures = 0;
    this.state.state = 'CLOSED';
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state.state;
  }

  getFailureCount(): number {
    return this.state.failures;
  }
}

// Rate limiter for API calls
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkRateLimit(identifier: string): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);

    // Add current request
    this.requests.push(now);

    if (this.requests.length > this.maxRequests) {
      throw new Error(`Rate limit exceeded for ${identifier}. Max ${this.maxRequests} requests per ${this.windowMs}ms.`);
    }
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const currentRequests = this.requests.filter(timestamp => timestamp > windowStart).length;
    return Math.max(0, this.maxRequests - currentRequests);
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return oldestRequest + this.windowMs;
  }
}

// API wrapper with circuit breaker and rate limiting
class ApiClient {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private rateLimiter = new RateLimiter();

  private getCircuitBreaker(operationName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(operationName)) {
      this.circuitBreakers.set(operationName, new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        monitoringPeriod: 10000 // 10 seconds
      }));
    }
    return this.circuitBreakers.get(operationName)!;
  }

  async supabaseQuery<T>(
    operationName: string,
    query: () => Promise<T>,
    userId?: string
  ): Promise<T> {
    // Rate limiting per user
    if (userId) {
      await this.rateLimiter.checkRateLimit(`user_${userId}`);
    }

    // Global rate limiting
    await this.rateLimiter.checkRateLimit('global');

    const circuitBreaker = this.getCircuitBreaker(operationName);
    return circuitBreaker.execute(query, operationName);
  }

  // Circuit breaker status monitoring
  getCircuitBreakerStatus(): Record<string, { state: string; failures: number }> {
    const status: Record<string, { state: string; failures: number }> = {};
    
    for (const [operation, breaker] of this.circuitBreakers.entries()) {
      status[operation] = {
        state: breaker.getState(),
        failures: breaker.getFailureCount()
      };
    }
    
    return status;
  }

  // Rate limiter status
  getRateLimitStatus(): { remaining: number; resetTime: number } {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      resetTime: this.rateLimiter.getResetTime()
    };
  }
}

// Enhanced supabase service with protection
export const protectedSupabase = {
  async query<T>(table: string, operation: () => Promise<T>, userId?: string): Promise<T> {
    return apiClient.supabaseQuery(`${table}_query`, operation, userId);
  },

  async insert<T>(table: string, insertData: any, userId?: string): Promise<T> {
    return apiClient.supabaseQuery(`${table}_insert`, async () => {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase.from(table).insert([insertData]);
      if (error) throw error;
      return data as T;
    }, userId);
  },

  async update<T>(table: string, updates: any, filter: any, userId?: string): Promise<T> {
    return apiClient.supabaseQuery(`${table}_update`, async () => {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase.from(table).update(updates).match(filter);
      if (error) throw error;
      return data as T;
    }, userId);
  },

  async select<T>(table: string, query: any, userId?: string): Promise<T[]> {
    return apiClient.supabaseQuery(`${table}_select`, async () => {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase.from(table).select(query);
      if (error) throw error;
      return data as T[];
    }, userId);
  }
};

export const apiClient = new ApiClient();
export default apiClient;