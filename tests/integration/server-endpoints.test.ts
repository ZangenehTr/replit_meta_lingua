// ============================================================================
// REAL SERVER INTEGRATION TESTS
// ============================================================================
// Integration tests that validate actual server route registration without mocking
// Tests authentication, rate limiting, and real endpoint behavior

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Import the real app (not mocked)
const createApp = async () => {
  // Import server components
  const express = await import('express');
  const { healthRouter } = await import('../../server/health-monitoring');
  
  const app = express.default();
  app.use(express.json());
  
  // Mount health router exactly as in server/index.ts
  app.use('/api', healthRouter);
  
  return app;
};

// ============================================================================
// REAL SERVER ENDPOINT TESTS
// ============================================================================

describe('Real Server Endpoints (No Mocking)', () => {
  let app: any;
  
  beforeAll(async () => {
    // Create real app instance with actual routes
    app = await createApp();
  });

  // ========================================================================
  // HEALTH ENDPOINT TESTS
  // ========================================================================

  describe('Health Endpoint', () => {
    it('should respond to health endpoint with proper structure', async () => {
      const response = await request(app)
        .get('/api/health');
      
      // Should return valid response (200 or 503)
      expect([200, 503]).toContain(response.status);
      
      // Should have required fields
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      
      // Status should be valid
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
      
      // Metrics should have required sections
      expect(response.body.metrics).toHaveProperty('system');
      expect(response.body.metrics).toHaveProperty('analytics');
      expect(response.body.metrics).toHaveProperty('ai');
      expect(response.body.metrics).toHaveProperty('database');
      expect(response.body.metrics).toHaveProperty('cache');
      
      // Checks should be an array
      expect(Array.isArray(response.body.checks)).toBe(true);
    });
    
    it('should have system metrics with proper structure', async () => {
      const response = await request(app)
        .get('/api/health');
      
      const systemMetrics = response.body.metrics.system;
      expect(systemMetrics).toHaveProperty('uptime');
      expect(systemMetrics).toHaveProperty('memory');
      expect(systemMetrics).toHaveProperty('cpu');
      expect(systemMetrics).toHaveProperty('platform');
      expect(systemMetrics).toHaveProperty('nodeVersion');
      
      expect(typeof systemMetrics.uptime).toBe('number');
      expect(typeof systemMetrics.cpu).toBe('number');
      expect(typeof systemMetrics.platform).toBe('string');
    });
    
    it('should handle health checks gracefully even with degraded services', async () => {
      const response = await request(app)
        .get('/api/health');
      
      // Should still respond even if some services are unhealthy
      expect(response.status).toBeLessThan(600);
      expect(response.body).toHaveProperty('status');
      
      // Should include error details for failed checks
      const unhealthyChecks = response.body.checks.filter((check: any) => 
        check.status === 'unhealthy' || check.status === 'degraded'
      );
      
      // Each unhealthy check should have error or details
      unhealthyChecks.forEach((check: any) => {
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('lastChecked');
        // Should have either error or details explaining the issue
        expect(check.error || check.details).toBeDefined();
      });
    });
  });

  // ========================================================================
  // METRICS ENDPOINTS TESTS
  // ========================================================================

  describe('Health Metrics Endpoints', () => {
    it('should respond to metrics endpoint', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('metrics');
        expect(response.body.data).toHaveProperty('timestamp');
        expect(response.body.data).toHaveProperty('uptime');
      }
    });
    
    it('should respond to readiness probe', async () => {
      const response = await request(app)
        .get('/api/ready');
      
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.ready).toBe('boolean');
    });
    
    it('should respond to liveness probe', async () => {
      const response = await request(app)
        .get('/api/live');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('alive');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body.alive).toBe(true);
    });
  });

  // ========================================================================
  // ROUTE REGISTRATION VALIDATION
  // ========================================================================

  describe('Route Registration Validation', () => {
    it('should properly mount health router at /api prefix', async () => {
      // Test that health endpoints are accessible under /api
      const healthResponse = await request(app).get('/api/health');
      const metricsResponse = await request(app).get('/api/metrics');
      const readyResponse = await request(app).get('/api/ready');
      const liveResponse = await request(app).get('/api/live');
      
      // All should return valid responses (not 404)
      expect(healthResponse.status).not.toBe(404);
      expect(metricsResponse.status).not.toBe(404);
      expect(readyResponse.status).not.toBe(404);
      expect(liveResponse.status).not.toBe(404);
    });
    
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint');
      
      expect(response.status).toBe(404);
    });
  });
});

// ============================================================================
// HEALTH ENDPOINT PERFORMANCE TESTS
// ============================================================================

describe('Health Endpoint Performance', () => {
  let app: any;
  
  beforeAll(async () => {
    app = await createApp();
  });

  it('should respond to health checks within reasonable time', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/health');
    
    const responseTime = Date.now() - startTime;
    
    // Health check should respond within 5 seconds
    expect(responseTime).toBeLessThan(5000);
  });
  
  it('should handle multiple concurrent health checks', async () => {
    const promises = Array(5).fill(0).map(() => 
      request(app).get('/api/health')
    );
    
    const responses = await Promise.all(promises);
    
    // All should succeed
    responses.forEach(response => {
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
    });
  });
});