import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface MetricStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  private readonly MAX_VALUES_PER_METRIC = 1000;

  recordLatency(operation: string, latency: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const values = this.metrics.get(operation)!;
    values.push(latency);

    // Keep last N values to prevent memory growth
    if (values.length > this.MAX_VALUES_PER_METRIC) {
      values.shift();
    }
  }

  getStats(operation: string): MetricStats | null {
    const values = this.metrics.get(operation);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(sum / values.length),
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getAllStats(): Record<string, MetricStats | null> {
    const allStats: Record<string, MetricStats | null> = {};
    this.metrics.forEach((_, operation) => {
      allStats[operation] = this.getStats(operation);
    });
    return allStats;
  }

  getSlowestRoutes(limit: number = 10): Array<{ route: string; stats: MetricStats }> {
    const allStats = this.getAllStats();
    return Object.entries(allStats)
      .filter(([_, stats]) => stats !== null)
      .map(([route, stats]) => ({ route, stats: stats! }))
      .sort((a, b) => b.stats.p95 - a.stats.p95)
      .slice(0, limit);
  }

  reset() {
    this.metrics.clear();
  }
}

export const metrics = new MetricsCollector();

// Middleware to track API request latency
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const latency = Date.now() - start;
    const route = `${req.method} ${req.path}`;
    
    metrics.recordLatency(route, latency);

    // Log slow requests
    if (latency > 1000) {
      logger.warn('SLOW_REQUEST', { 
        route, 
        latency, 
        statusCode: res.statusCode,
        method: req.method,
        path: req.path,
      });
    }

    // Log failed requests
    if (res.statusCode >= 500) {
      logger.error('SERVER_ERROR', {
        route,
        statusCode: res.statusCode,
        method: req.method,
        path: req.path,
      });
    }
  });

  next();
}
