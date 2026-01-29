import { performance } from 'perf_hooks';
import errorMonitoring from './errorMonitoring';

interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  threshold?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  startTimer(operationName: string, threshold: number = 2000): string {
    const timerId = `${operationName}_${Date.now()}_${Math.random()}`;
    this.metrics.set(timerId, {
      operationName,
      startTime: performance.now(),
      threshold
    });
    return timerId;
  }

  endTimer(timerId: string): number {
    const metric = this.metrics.get(timerId);
    if (!metric) {
      console.warn(`Timer ${timerId} not found`);
      return 0;
    }

    const duration = performance.now() - metric.startTime;
    this.metrics.delete(timerId);

    if (metric.threshold && duration > metric.threshold) {
      errorMonitoring.reportPerformanceIssue(
        metric.operationName,
        duration,
        metric.threshold
      );
    }

    return duration;
  }

  async measureAsync<T>(
    operationName: string,
    operation: () => Promise<T>,
    threshold: number = 2000
  ): Promise<T> {
    const timerId = this.startTimer(operationName, threshold);
    try {
      const result = await operation();
      return result;
    } catch (error) {
      await errorMonitoring.reportError(error as Error, { operationName });
      throw error;
    } finally {
      this.endTimer(timerId);
    }
  }

  measureSync<T>(
    operationName: string,
    operation: () => T,
    threshold: number = 2000
  ): T {
    const timerId = this.startTimer(operationName, threshold);
    try {
      const result = operation();
      return result;
    } catch (error) {
      errorMonitoring.reportError(error as Error, { operationName });
      throw error;
    } finally {
      this.endTimer(timerId);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;