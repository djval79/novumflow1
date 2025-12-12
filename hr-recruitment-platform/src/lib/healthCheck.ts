/**
 * Health Check Utility
 * 
 * Checks the health of various system components
 */

import { supabase } from './supabase';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: ComponentHealth;
    auth: ComponentHealth;
    storage: ComponentHealth;
  };
}

export interface ComponentHealth {
  status: 'up' | 'down' | 'unknown';
  latency?: number;
  message?: string;
}

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development';

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<ComponentHealth> {
  const start = performance.now();
  try {
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    const latency = Math.round(performance.now() - start);

    if (error) {
      return {
        status: 'down',
        latency,
        message: error.message,
      };
    }

    return {
      status: 'up',
      latency,
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Math.round(performance.now() - start),
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check auth service
 */
async function checkAuth(): Promise<ComponentHealth> {
  const start = performance.now();
  try {
    const { error } = await supabase.auth.getSession();
    const latency = Math.round(performance.now() - start);

    if (error && error.message !== 'Auth session missing!') {
      return {
        status: 'down',
        latency,
        message: error.message,
      };
    }

    return {
      status: 'up',
      latency,
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Math.round(performance.now() - start),
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check storage service
 */
async function checkStorage(): Promise<ComponentHealth> {
  const start = performance.now();
  try {
    const { error } = await supabase.storage.listBuckets();
    const latency = Math.round(performance.now() - start);

    if (error) {
      // Storage might require auth, so only report down for actual errors
      if (error.message.includes('not authenticated')) {
        return {
          status: 'up',
          latency,
          message: 'Storage available (auth required)',
        };
      }
      return {
        status: 'down',
        latency,
        message: error.message,
      };
    }

    return {
      status: 'up',
      latency,
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Math.round(performance.now() - start),
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Determine overall health status
 */
function determineOverallStatus(checks: HealthStatus['checks']): HealthStatus['status'] {
  const values = Object.values(checks);
  
  if (values.every(c => c.status === 'up')) {
    return 'healthy';
  }
  
  if (values.some(c => c.status === 'down')) {
    // If database is down, consider unhealthy
    if (checks.database.status === 'down') {
      return 'unhealthy';
    }
    return 'degraded';
  }
  
  return 'degraded';
}

/**
 * Run all health checks
 */
export async function runHealthCheck(): Promise<HealthStatus> {
  const [database, auth, storage] = await Promise.all([
    checkDatabase(),
    checkAuth(),
    checkStorage(),
  ]);

  const checks = { database, auth, storage };

  return {
    status: determineOverallStatus(checks),
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    environment: ENVIRONMENT,
    checks,
  };
}

/**
 * Quick health ping (lightweight)
 */
export async function healthPing(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.getSession();
    return !error || error.message === 'Auth session missing!';
  } catch {
    return false;
  }
}

export default runHealthCheck;
