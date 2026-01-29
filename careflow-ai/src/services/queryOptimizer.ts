import { performanceMonitor } from './performanceMonitor';
import { supabase } from '../lib/supabase';
import errorMonitoring from './errorMonitoring';

interface QueryMetrics {
  queryName: string;
  duration: number;
  recordCount: number;
  cacheHit: boolean;
  timestamp: number;
}

class QueryOptimizer {
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private slowQueryThreshold = 2000; // 2 seconds
  private cacheEnabled = true;
  private maxCacheSize = 100;

  // Cache management
  private generateCacheKey(table: string, query: string, params: any[]): string {
    return `${table}:${query}:${JSON.stringify(params)}`;
  }

  private isCacheValid(cacheEntry: { timestamp: number; ttl: number }): boolean {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
  }

  private cleanExpiredCache(): void {
    for (const [key, entry] of this.queryCache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.queryCache.delete(key);
      }
    }
  }

  private limitCacheSize(): void {
    if (this.queryCache.size > this.maxCacheSize) {
      const entries = Array.from(this.queryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 20% of entries
      const toRemove = Math.floor(this.maxCacheSize * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.queryCache.delete(entries[i][0]);
      }
    }
  }

  // Optimized query execution
  async executeQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    cacheKey?: string,
    cacheTTL: number = 300000 // 5 minutes
  ): Promise<T> {
    const timerId = performanceMonitor.startTimer(queryName, this.slowQueryThreshold);

    try {
      // Check cache first
      if (this.cacheEnabled && cacheKey) {
        this.cleanExpiredCache();
        this.limitCacheSize();
        
        const cached = this.queryCache.get(cacheKey);
        if (cached && this.isCacheValid(cached)) {
          performanceMonitor.endTimer(timerId);
          this.logQueryMetrics(queryName, 0, 0, true);
          return cached.data;
        }
      }

      // Execute query
      const result = await queryFn();
      
      // Cache successful result
      if (this.cacheEnabled && cacheKey) {
        this.queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: cacheTTL
        });
      }

      const duration = performanceMonitor.endTimer(timerId);
      const recordCount = Array.isArray(result) ? result.length : 1;
      this.logQueryMetrics(queryName, duration, recordCount, false);

      return result;
    } catch (error) {
      performanceMonitor.endTimer(timerId);
      await errorMonitoring.reportError(error as Error, { queryName, operation: 'database_query' });
      throw error;
    }
  }

  private logQueryMetrics(
    queryName: string,
    duration: number,
    recordCount: number,
    cacheHit: boolean
  ): void {
    if (duration > this.slowQueryThreshold) {
      errorMonitoring.reportPerformanceIssue(
        `slow_query_${queryName}`,
        duration,
        this.slowQueryThreshold
      );
    }

    // Log to performance table for analysis
    supabase.from('query_performance_logs').insert([{
      query_name: queryName,
      duration_ms: duration,
      record_count: recordCount,
      cache_hit: cacheHit,
      timestamp: new Date().toISOString()
    }]).then(({ error }) => {
      if (error) {
        console.error('Failed to log query performance:', error);
      }
    });
  }

  // Batch query optimization
  async batchQuery<T>(
    queries: Array<{ name: string; fn: () => Promise<T>; cacheKey?: string }>
  ): Promise<T[]> {
    const batchTimerId = performanceMonitor.startTimer('batch_query', 5000);
    
    try {
      const results = await Promise.all(
        queries.map(q => this.executeQuery(q.name, q.fn, q.cacheKey))
      );
      
      performanceMonitor.endTimer(batchTimerId);
      return results;
    } catch (error) {
      performanceMonitor.endTimer(batchTimerId);
      throw error;
    }
  }

  // Optimized paginated queries
  async paginatedQuery<T>(
    queryName: string,
    page: number,
    pageSize: number,
    queryFn: (page: number, pageSize: number) => Promise<{
      data: T[];
      hasMore: boolean;
      totalCount: number;
    }>
  ): Promise<{
    data: T[];
    hasMore: boolean;
    totalCount: number;
  }> {
    const cacheKey = `${queryName}_page_${page}_size_${pageSize}`;
    
    return this.executeQuery(
      `${queryName}_paginated`,
      () => queryFn(page, pageSize),
      cacheKey,
      60000 // Cache pages for 1 minute
    );
  }

  // Query optimization helpers
  createOptimizedSelect(table: string, columns: string[] = ['*']): string {
    // Avoid SELECT *, only select needed columns
    const selectedColumns = columns.length > 0 && !columns.includes('*') 
      ? columns.join(', ') 
      : '*';
    
    return `SELECT ${selectedColumns} FROM ${table}`;
  }

  createIndexedWhereClause(conditions: Record<string, any>): string {
    const whereClauses = Object.entries(conditions).map(([column, value]) => {
      if (value === null || value === undefined) {
        return `${column} IS NULL`;
      } else if (Array.isArray(value)) {
        return `${column} IN (${value.map(v => `'${v}'`).join(', ')})`;
      } else if (typeof value === 'object' && value !== null) {
        // Handle range queries
        const entries = Object.entries(value);
        return entries.map(([op, val]) => {
          switch (op) {
            case '$gte': return `${column} >= '${val}'`;
            case '$lte': return `${column} <= '${val}'`;
            case '$gt': return `${column} > '${val}'`;
            case '$lt': return `${column} < '${val}'`;
            case '$like': return `${column} LIKE '${val}'`;
            case '$ilike': return `${column} ILIKE '${val}'`;
            default: return `${column} = '${val}'`;
          }
        }).join(' AND ');
      } else {
        return `${column} = '${value}'`;
      }
    });

    return whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  }

  // Get cache statistics
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    // This would require tracking cache hits/misses
    return {
      size: this.queryCache.size,
      hitRate: 0, // Would need to implement tracking
      memoryUsage: JSON.stringify([...this.queryCache.entries()]).length
    };
  }

  // Clear cache manually if needed
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  // Enable/disable caching
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.queryCache.clear();
    }
  }

  // Performance monitoring
  getSlowQueries(): Promise<QueryMetrics[]> {
    return supabase
      .from('query_performance_logs')
      .select('*')
      .gte('duration_ms', this.slowQueryThreshold)
      .order('timestamp DESC')
      .limit(50);
  }
}

export const queryOptimizer = new QueryOptimizer();
export default queryOptimizer;