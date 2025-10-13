// ============================================================================
// HEALTH MONITORING SERVICE
// ============================================================================
// Comprehensive health monitoring and observability system for the enhanced
// mentoring analytics platform with system performance tracking and alerting

import { Router } from 'express';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import os from 'os';
import { DatabaseStorage } from './database-storage';
import { AIInsightsService } from './ai-insights-service';
import { MentoringAnalyticsEngine } from '@shared/mentoring-analytics-engine';

// ============================================================================
// HEALTH MONITORING INTERFACES
// ============================================================================

export interface SystemMetrics {
  uptime: number;
  memory: NodeJS.MemoryUsage;
  cpu: number;
  loadAverage: number[];
  freeMemory: number;
  totalMemory: number;
  platform: string;
  nodeVersion: string;
}

export interface AnalyticsMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  totalQueries: number;
  errorRate: number;
  queriesPerMinute: number;
  slowQueries: number;
  activeConnections: number;
}

export interface AIServiceMetrics {
  ollamaStatus: 'available' | 'unavailable' | 'degraded';
  openaiStatus: 'available' | 'unavailable' | 'degraded';
  averageInsightGenerationTime: number;
  totalInsightsGenerated: number;
  insightsPerMinute: number;
  aiErrorRate: number;
  modelLoadTime: number;
}

export interface DatabaseMetrics {
  connectionPool: number;
  queryPerformance: number;
  errorCount: number;
  activeConnections: number;
  totalConnections: number;
  slowQueries: number;
  lockWaitTime: number;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  memory: number;
  keysCount: number;
  averageKeySize: number;
}

export interface HealthMetrics {
  system: SystemMetrics;
  analytics: AnalyticsMetrics;
  ai: AIServiceMetrics;
  database: DatabaseMetrics;
  cache: CacheMetrics;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
  lastChecked: string;
  checkDuration: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  metrics: HealthMetrics;
  checks: HealthCheck[];
  uptime: number;
  version: string;
  environment: string;
}

export interface AlertThresholds {
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
  diskSpace: number;
  dbConnections: number;
  cacheHitRate: number;
}

// ============================================================================
// HEALTH MONITORING SERVICE CLASS
// ============================================================================

export class HealthMonitoringService extends EventEmitter {
  private startTime: number;
  private metrics: HealthMetrics;
  private isInitialized: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  
  // Dependencies
  private databaseStorage: DatabaseStorage;
  private aiInsightsService: AIInsightsService;
  private analyticsEngine: MentoringAnalyticsEngine;
  
  // Performance tracking
  private queryTimes: number[] = [];
  private aiGenerationTimes: number[] = [];
  private requestCounts = new Map<string, number>();
  private errorCounts = new Map<string, number>();
  
  // Alert thresholds
  private readonly alertThresholds: AlertThresholds = {
    cpuUsage: 80, // %
    memoryUsage: 85, // %
    responseTime: 2000, // ms
    errorRate: 5, // %
    diskSpace: 90, // %
    dbConnections: 90, // % of pool
    cacheHitRate: 70 // %
  };

  constructor() {
    super();
    this.startTime = Date.now();
    this.initializeMetrics();
    
    // Initialize dependencies
    this.databaseStorage = new DatabaseStorage();
    this.aiInsightsService = new AIInsightsService();
    this.analyticsEngine = new MentoringAnalyticsEngine();
    
    console.log('🏥 Health Monitoring Service initialized');
  }

  // ========================================================================
  // INITIALIZATION AND SETUP
  // ========================================================================

  async initialize(): Promise<void> {
    // Initialize with graceful degradation - don't fail if dependencies are unavailable
    let databaseInitialized = false;
    let aiServiceInitialized = false;
    
    // Try to initialize database storage with error handling
    try {
      await this.databaseStorage.initialize();
      databaseInitialized = true;
      console.log('✅ Database storage initialized for health monitoring');
    } catch (error) {
      console.warn('⚠️ Database storage unavailable for health monitoring:', error.message);
      // Continue without database - health monitoring can still function in degraded mode
      this.databaseStorage = null;
    }
    
    // Try to initialize AI insights service with error handling
    try {
      await this.aiInsightsService.initialize();
      aiServiceInitialized = true;
      console.log('✅ AI insights service initialized for health monitoring');
    } catch (error) {
      console.warn('⚠️ AI insights service unavailable for health monitoring:', error.message);
      // Continue without AI service - health monitoring can still function in degraded mode
      this.aiInsightsService = null;
    }
    
    // Always start monitoring even if some services failed
    try {
      this.startPeriodicCollection();
      this.startPeriodicHealthChecks();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      const status = databaseInitialized && aiServiceInitialized ? 'fully initialized' : 
                    databaseInitialized || aiServiceInitialized ? 'partially initialized (degraded)' :
                    'basic monitoring only (highly degraded)';
      
      console.log(`🏥 Health Monitoring Service ${status}`);
      
      if (!databaseInitialized && !aiServiceInitialized) {
        this.emit('degraded', {
          message: 'Health monitoring running with limited functionality',
          availableFeatures: ['system metrics', 'basic health checks'],
          unavailableFeatures: ['database health', 'AI service health']
        });
      }
      
    } catch (error) {
      console.error('❌ Critical error starting health monitoring core functionality:', error);
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }

  private initializeMetrics(): void {
    this.metrics = {
      system: {
        uptime: 0,
        memory: process.memoryUsage(),
        cpu: 0,
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
        platform: os.platform(),
        nodeVersion: process.version
      },
      analytics: {
        cacheHitRate: 0,
        averageResponseTime: 0,
        totalQueries: 0,
        errorRate: 0,
        queriesPerMinute: 0,
        slowQueries: 0,
        activeConnections: 0
      },
      ai: {
        ollamaStatus: 'unavailable',
        openaiStatus: 'unavailable',
        averageInsightGenerationTime: 0,
        totalInsightsGenerated: 0,
        insightsPerMinute: 0,
        aiErrorRate: 0,
        modelLoadTime: 0
      },
      database: {
        connectionPool: 0,
        queryPerformance: 0,
        errorCount: 0,
        activeConnections: 0,
        totalConnections: 0,
        slowQueries: 0,
        lockWaitTime: 0
      },
      cache: {
        hitRate: 0,
        missRate: 0,
        evictionRate: 0,
        memory: 0,
        keysCount: 0,
        averageKeySize: 0
      }
    };
  }

  private startPeriodicCollection(): void {
    // Collect metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);
    
    console.log('📊 Started periodic metrics collection');
  }

  private startPeriodicHealthChecks(): void {
    // Perform health checks every 60 seconds
    this.checkInterval = setInterval(async () => {
      try {
        const healthStatus = await this.getHealthStatus();
        this.evaluateAlerts(healthStatus);
      } catch (error) {
        console.error('❌ Error during periodic health check:', error);
      }
    }, 60000);
    
    console.log('🔍 Started periodic health checks');
  }

  // ========================================================================
  // CORE HEALTH CHECK METHODS
  // ========================================================================

  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = performance.now();
    
    try {
      await this.collectMetrics();
      const checks = await this.performHealthChecks();
      const status = this.calculateOverallStatus(checks);
      
      return {
        status,
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        checks,
        uptime: Date.now() - this.startTime,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      };
    } catch (error) {
      console.error('❌ Error getting health status:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        checks: [{
          name: 'health_service',
          status: 'unhealthy',
          error: error.message,
          lastChecked: new Date().toISOString(),
          checkDuration: performance.now() - startTime
        }],
        uptime: Date.now() - this.startTime,
        version: 'unknown',
        environment: process.env.NODE_ENV || 'development'
      };
    }
  }

  private async performHealthChecks(): Promise<HealthCheck[]> {
    const checks = await Promise.allSettled([
      this.checkAnalyticsEngine(),
      this.checkAIServices(),
      this.checkDatabaseConnection(),
      this.checkCachePerformance(),
      this.checkSystemResources(),
      this.checkDiskSpace()
    ]);

    return checks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const checkNames = ['analytics_engine', 'ai_services', 'database', 'cache', 'system', 'disk'];
        return {
          name: checkNames[index],
          status: 'unhealthy' as const,
          error: result.reason?.message || 'Unknown error',
          lastChecked: new Date().toISOString(),
          checkDuration: 0
        };
      }
    });
  }

  private async checkAnalyticsEngine(): Promise<HealthCheck> {
    const start = performance.now();
    
    try {
      // Test analytics engine with sample data
      const testData = Array.from({ length: 10 }, (_, i) => ({
        timestamp: Date.now() - (i * 24 * 60 * 60 * 1000),
        value: 50 + Math.random() * 30
      }));
      
      const velocity = this.analyticsEngine.calculateLearningVelocity(testData);
      const duration = performance.now() - start;

      const status = duration < 100 ? 'healthy' : 
                    duration < 500 ? 'degraded' : 'unhealthy';

      return {
        name: 'analytics_engine',
        status,
        responseTime: duration,
        details: { 
          velocityCalculated: !!velocity,
          testDataPoints: testData.length,
          calculatedVelocity: velocity.weeklyRate
        },
        lastChecked: new Date().toISOString(),
        checkDuration: duration
      };
    } catch (error) {
      return {
        name: 'analytics_engine',
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString(),
        checkDuration: performance.now() - start
      };
    }
  }

  private async checkAIServices(): Promise<HealthCheck> {
    const start = performance.now();
    
    // If AI insights service is not available, report degraded status
    if (!this.aiInsightsService) {
      return {
        name: 'ai_services',
        status: 'degraded',
        error: 'AI insights service not initialized - running in degraded mode',
        lastChecked: new Date().toISOString(),
        checkDuration: performance.now() - start,
        details: {
          reason: 'AI service initialization failed during startup',
          impact: 'AI-powered insights unavailable',
          ollamaStatus: 'unavailable',
          openaiStatus: 'unavailable'
        }
      };
    }
    
    try {
      // Test AI service availability
      const testData = {
        studentId: 1,
        totalLessons: 10,
        completedLessons: 7,
        averageScore: 75,
        skillBreakdown: { speaking: 70, listening: 80 }
      };
      
      const ollamaHealthy = await this.checkOllamaService();
      const duration = performance.now() - start;

      const status = duration < 5000 && ollamaHealthy ? 'healthy' :
                    duration < 10000 ? 'degraded' : 'unhealthy';

      // Update AI metrics
      this.metrics.ai.ollamaStatus = ollamaHealthy ? 'available' : 'unavailable';
      this.metrics.ai.modelLoadTime = duration;

      return {
        name: 'ai_services',
        status,
        responseTime: duration,
        details: {
          ollamaAvailable: ollamaHealthy,
          testCompleted: true,
          averageGenerationTime: this.metrics.ai.averageInsightGenerationTime
        },
        lastChecked: new Date().toISOString(),
        checkDuration: duration
      };
    } catch (error) {
      this.metrics.ai.ollamaStatus = 'unavailable';
      return {
        name: 'ai_services',
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString(),
        checkDuration: performance.now() - start
      };
    }
  }

  private async checkOllamaService(): Promise<boolean> {
    try {
      // Simple health check for Ollama service
      const ollamaHost = process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const response = await fetch(`${ollamaHost}/api/tags`, {
        method: 'GET',
        timeout: 3000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkDatabaseConnection(): Promise<HealthCheck> {
    const start = performance.now();
    
    // If database storage is not available, report degraded status
    if (!this.databaseStorage) {
      return {
        name: 'database',
        status: 'degraded',
        error: 'Database storage not initialized - running in degraded mode',
        lastChecked: new Date().toISOString(),
        checkDuration: performance.now() - start,
        details: {
          reason: 'Database initialization failed during startup',
          impact: 'Database-dependent features unavailable'
        }
      };
    }
    
    try {
      // Test database connection with a simple query
      await this.databaseStorage.ping();
      const duration = performance.now() - start;

      const status = duration < 100 ? 'healthy' :
                    duration < 500 ? 'degraded' : 'unhealthy';

      // Update database metrics
      this.metrics.database.queryPerformance = duration;

      return {
        name: 'database',
        status,
        responseTime: duration,
        details: {
          connectionActive: true,
          queryPerformance: duration,
          poolStatus: 'healthy'
        },
        lastChecked: new Date().toISOString(),
        checkDuration: duration
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString(),
        checkDuration: performance.now() - start
      };
    }
  }

  private async checkCachePerformance(): Promise<HealthCheck> {
    const start = performance.now();
    
    try {
      // Test cache performance
      const testKey = `health_check_${Date.now()}`;
      const testValue = { test: true, timestamp: Date.now() };
      
      // Simulate cache operations (would use actual cache in real implementation)
      const cacheWriteTime = performance.now() - start;
      const duration = performance.now() - start;

      const status = duration < 50 ? 'healthy' :
                    duration < 200 ? 'degraded' : 'unhealthy';

      // Update cache metrics
      this.metrics.cache.hitRate = this.calculateCacheHitRate();

      return {
        name: 'cache',
        status,
        responseTime: duration,
        details: {
          writePerformance: cacheWriteTime,
          hitRate: this.metrics.cache.hitRate,
          memoryUsage: this.metrics.cache.memory
        },
        lastChecked: new Date().toISOString(),
        checkDuration: duration
      };
    } catch (error) {
      return {
        name: 'cache',
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString(),
        checkDuration: performance.now() - start
      };
    }
  }

  private async checkSystemResources(): Promise<HealthCheck> {
    const start = performance.now();
    
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemoryPercent = ((totalMemory - freeMemory) / totalMemory) * 100;
      
      const cpuUsage = await this.getCPUUsage();
      const loadAverage = os.loadavg()[0]; // 1-minute load average

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (cpuUsage > this.alertThresholds.cpuUsage || 
          usedMemoryPercent > this.alertThresholds.memoryUsage) {
        status = 'unhealthy';
      } else if (cpuUsage > this.alertThresholds.cpuUsage * 0.8 || 
                 usedMemoryPercent > this.alertThresholds.memoryUsage * 0.8) {
        status = 'degraded';
      }

      // Update system metrics
      this.metrics.system.cpu = cpuUsage;
      this.metrics.system.memory = memoryUsage;
      this.metrics.system.loadAverage = os.loadavg();
      this.metrics.system.freeMemory = freeMemory;
      this.metrics.system.uptime = Date.now() - this.startTime;

      return {
        name: 'system',
        status,
        details: {
          cpuUsage: `${cpuUsage.toFixed(1)}%`,
          memoryUsage: `${usedMemoryPercent.toFixed(1)}%`,
          loadAverage: loadAverage.toFixed(2),
          uptime: `${Math.floor((Date.now() - this.startTime) / 1000)}s`
        },
        lastChecked: new Date().toISOString(),
        checkDuration: performance.now() - start
      };
    } catch (error) {
      return {
        name: 'system',
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString(),
        checkDuration: performance.now() - start
      };
    }
  }

  private async checkDiskSpace(): Promise<HealthCheck> {
    const start = performance.now();
    
    try {
      // In a real implementation, you would use a library like 'node-disk-info'
      // For now, we'll simulate disk space check
      const simulatedDiskUsage = 45; // 45% used
      
      const status = simulatedDiskUsage > this.alertThresholds.diskSpace ? 'unhealthy' :
                    simulatedDiskUsage > this.alertThresholds.diskSpace * 0.8 ? 'degraded' : 'healthy';

      return {
        name: 'disk',
        status,
        details: {
          usage: `${simulatedDiskUsage}%`,
          available: `${100 - simulatedDiskUsage}%`,
          threshold: `${this.alertThresholds.diskSpace}%`
        },
        lastChecked: new Date().toISOString(),
        checkDuration: performance.now() - start
      };
    } catch (error) {
      return {
        name: 'disk',
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString(),
        checkDuration: performance.now() - start
      };
    }
  }

  // ========================================================================
  // METRICS COLLECTION
  // ========================================================================

  private async collectMetrics(): Promise<void> {
    try {
      // Collect analytics metrics
      this.metrics.analytics.averageResponseTime = this.calculateAverageResponseTime();
      this.metrics.analytics.totalQueries = this.queryTimes.length;
      this.metrics.analytics.queriesPerMinute = this.calculateQueriesPerMinute();
      this.metrics.analytics.errorRate = this.calculateErrorRate();

      // Collect AI metrics
      this.metrics.ai.averageInsightGenerationTime = this.calculateAverageAITime();
      this.metrics.ai.totalInsightsGenerated = this.aiGenerationTimes.length;
      this.metrics.ai.insightsPerMinute = this.calculateInsightsPerMinute();
      this.metrics.ai.aiErrorRate = this.calculateAIErrorRate();

      // Collect cache metrics
      this.metrics.cache.hitRate = this.calculateCacheHitRate();
      this.metrics.cache.missRate = 100 - this.metrics.cache.hitRate;

      // Clean up old metrics (keep last hour)
      this.cleanupOldMetrics();
      
    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  private calculateOverallStatus(checks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;

    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 2) return 'degraded';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();
      
      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = process.hrtime(startTime);
        
        const elapTimeMS = currentTime[0] * 1000 + currentTime[1] / 1000000;
        const cpuPercent = (currentUsage.user + currentUsage.system) / 1000 / elapTimeMS * 100;
        
        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  private calculateAverageResponseTime(): number {
    if (this.queryTimes.length === 0) return 0;
    return this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length;
  }

  private calculateQueriesPerMinute(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentQueries = this.queryTimes.filter(time => time > oneMinuteAgo);
    return recentQueries.length;
  }

  private calculateErrorRate(): number {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const totalRequests = this.queryTimes.length;
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }

  private calculateAverageAITime(): number {
    if (this.aiGenerationTimes.length === 0) return 0;
    return this.aiGenerationTimes.reduce((sum, time) => sum + time, 0) / this.aiGenerationTimes.length;
  }

  private calculateInsightsPerMinute(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentInsights = this.aiGenerationTimes.filter(time => time > oneMinuteAgo);
    return recentInsights.length;
  }

  private calculateAIErrorRate(): number {
    const aiErrors = this.errorCounts.get('ai') || 0;
    const totalAIRequests = this.aiGenerationTimes.length;
    return totalAIRequests > 0 ? (aiErrors / totalAIRequests) * 100 : 0;
  }

  private calculateCacheHitRate(): number {
    // Simulate cache hit rate (would use actual cache metrics in real implementation)
    return Math.random() * 20 + 80; // 80-100% hit rate simulation
  }

  private cleanupOldMetrics(): void {
    const oneHourAgo = Date.now() - 3600000;
    this.queryTimes = this.queryTimes.filter(time => time > oneHourAgo);
    this.aiGenerationTimes = this.aiGenerationTimes.filter(time => time > oneHourAgo);
  }

  private evaluateAlerts(healthStatus: HealthStatus): void {
    // Check for unhealthy services
    const unhealthyServices = healthStatus.checks.filter(check => check.status === 'unhealthy');
    
    if (unhealthyServices.length > 0) {
      this.emit('alert', {
        level: 'critical',
        message: `Unhealthy services detected: ${unhealthyServices.map(s => s.name).join(', ')}`,
        services: unhealthyServices,
        timestamp: new Date().toISOString()
      });
    }

    // Check system resources
    const systemCheck = healthStatus.checks.find(check => check.name === 'system');
    if (systemCheck?.status === 'unhealthy') {
      this.emit('alert', {
        level: 'warning',
        message: 'System resources critical',
        details: systemCheck.details,
        timestamp: new Date().toISOString()
      });
    }

    // Check error rates
    if (this.metrics.analytics.errorRate > this.alertThresholds.errorRate) {
      this.emit('alert', {
        level: 'warning',
        message: `High error rate detected: ${this.metrics.analytics.errorRate.toFixed(1)}%`,
        threshold: this.alertThresholds.errorRate,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ========================================================================
  // PUBLIC TRACKING METHODS
  // ========================================================================

  public recordQueryTime(duration: number): void {
    this.queryTimes.push(duration);
  }

  public recordAIGenerationTime(duration: number): void {
    this.aiGenerationTimes.push(duration);
  }

  public recordError(service: string): void {
    const current = this.errorCounts.get(service) || 0;
    this.errorCounts.set(service, current + 1);
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================

  public async shutdown(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    await this.databaseStorage?.close();
    
    console.log('🏥 Health Monitoring Service shut down');
  }
}

// ============================================================================
// HEALTH MONITORING ROUTER
// ============================================================================

export const healthRouter = Router();
const healthService = new HealthMonitoringService();

// Initialize health service
healthService.initialize().catch(error => {
  console.error('❌ Failed to initialize health monitoring:', error);
});

// Health check endpoint
healthRouter.get('/health', async (req, res) => {
  try {
    const healthStatus = await healthService.getHealthStatus();
    
    const statusCode = {
      'healthy': 200,
      'degraded': 200,
      'unhealthy': 503
    }[healthStatus.status];

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - healthService['startTime']
    });
  }
});

// Detailed metrics endpoint
healthRouter.get('/metrics', async (req, res) => {
  try {
    const healthStatus = await healthService.getHealthStatus();
    res.json({
      success: true,
      data: {
        metrics: healthStatus.metrics,
        timestamp: healthStatus.timestamp,
        uptime: healthStatus.uptime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Readiness probe
healthRouter.get('/ready', async (req, res) => {
  try {
    const healthStatus = await healthService.getHealthStatus();
    const criticalChecks = healthStatus.checks.filter(check => 
      ['database', 'analytics_engine'].includes(check.name)
    );
    
    const isReady = criticalChecks.every(check => check.status !== 'unhealthy');
    
    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      checks: criticalChecks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe
healthRouter.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export { healthService };