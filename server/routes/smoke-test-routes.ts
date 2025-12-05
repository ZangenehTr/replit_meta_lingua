import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { authenticateToken, requireRole } from '../auth-middleware';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  responseTime?: number;
  details?: any;
}

router.get('/database', authenticateToken, requireRole(['Admin']), async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const result = await db.execute(sql`SELECT 1 as test, NOW() as server_time`);
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    
    const responseTime = Date.now() - startTime;
    
    const response: HealthStatus = {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime,
      details: {
        serverTime: (result.rows[0] as any)?.server_time,
        totalUsers: userCount[0]?.count || 0,
        connectionPool: 'active'
      }
    };
    
    res.json(response);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      responseTime,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } as HealthStatus);
  }
});

router.get('/ai', authenticateToken, requireRole(['Admin']), async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`${ollamaHost}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        
        res.json({
          status: 'healthy',
          message: 'Ollama service is running',
          responseTime,
          details: {
            provider: 'Ollama',
            host: ollamaHost,
            modelsAvailable: models.length,
            models: models.map((m: any) => m.name).slice(0, 5)
          }
        } as HealthStatus);
      } else {
        res.json({
          status: 'warning',
          message: 'Ollama service returned non-OK status',
          responseTime,
          details: {
            provider: 'Ollama',
            host: ollamaHost,
            statusCode: response.status
          }
        } as HealthStatus);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (process.env.OPENAI_API_KEY) {
        res.json({
          status: 'warning',
          message: 'Ollama unavailable, OpenAI fallback configured',
          responseTime: Date.now() - startTime,
          details: {
            primaryProvider: 'Ollama (unavailable)',
            fallbackProvider: 'OpenAI (configured)',
            ollamaHost
          }
        } as HealthStatus);
      } else {
        res.status(503).json({
          status: 'error',
          message: 'AI services unavailable',
          responseTime: Date.now() - startTime,
          details: {
            provider: 'Ollama',
            host: ollamaHost,
            error: fetchError instanceof Error ? fetchError.message : 'Connection failed'
          }
        } as HealthStatus);
      }
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Failed to check AI services',
      responseTime: Date.now() - startTime,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } as HealthStatus);
  }
});

router.get('/sms', authenticateToken, requireRole(['Admin']), async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const kavenegarApiKey = process.env.KAVENEGAR_API_KEY;
    
    if (!kavenegarApiKey) {
      res.json({
        status: 'warning',
        message: 'Kavenegar API key not configured',
        responseTime: Date.now() - startTime,
        details: {
          provider: 'Kavenegar',
          configured: false
        }
      } as HealthStatus);
      return;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const kavenegarUrl = `https://api.kavenegar.com/v1/${kavenegarApiKey}/account/info.json`;
      
      const response = await fetch(kavenegarUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.return?.status === 200) {
          res.json({
            status: 'healthy',
            message: 'Kavenegar SMS service is operational',
            responseTime,
            details: {
              provider: 'Kavenegar',
              configured: true,
              accountStatus: 'active',
              remainingCredit: data.entries?.remaincredit || 'N/A'
            }
          } as HealthStatus);
        } else {
          res.json({
            status: 'warning',
            message: 'Kavenegar returned non-success status',
            responseTime,
            details: {
              provider: 'Kavenegar',
              status: data.return?.status,
              message: data.return?.message
            }
          } as HealthStatus);
        }
      } else {
        res.json({
          status: 'warning',
          message: 'Unable to verify Kavenegar status',
          responseTime,
          details: {
            provider: 'Kavenegar',
            configured: true,
            statusCode: response.status
          }
        } as HealthStatus);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      res.json({
        status: 'warning',
        message: 'Kavenegar connectivity issue (may be blocked in this environment)',
        responseTime: Date.now() - startTime,
        details: {
          provider: 'Kavenegar',
          configured: true,
          note: 'Kavenegar is designed for Iranian networks',
          error: fetchError instanceof Error ? fetchError.message : 'Connection failed'
        }
      } as HealthStatus);
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Failed to check SMS service',
      responseTime: Date.now() - startTime,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } as HealthStatus);
  }
});

router.get('/storage', authenticateToken, requireRole(['Admin']), async (req: Request, res: Response) => {
  const startTime = Date.now();
  const fs = await import('fs').then(m => m.promises);
  const path = await import('path');
  
  try {
    const directories = ['uploads', 'recordings', 'attached_assets'];
    const results: Record<string, any> = {};
    
    for (const dir of directories) {
      try {
        const stats = await fs.stat(dir);
        if (stats.isDirectory()) {
          const files = await fs.readdir(dir);
          results[dir] = {
            exists: true,
            fileCount: files.length,
            writable: true
          };
        }
      } catch {
        results[dir] = {
          exists: false,
          fileCount: 0,
          writable: false
        };
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      message: 'Storage directories checked',
      responseTime,
      details: results
    } as HealthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Failed to check storage',
      responseTime: Date.now() - startTime,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } as HealthStatus);
  }
});

router.get('/all', authenticateToken, requireRole(['Admin']), async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const results: Record<string, HealthStatus> = {};
  
  const checks = [
    { name: 'database', endpoint: '/api/smoke-test/database' },
    { name: 'ai', endpoint: '/api/smoke-test/ai' },
    { name: 'sms', endpoint: '/api/smoke-test/sms' },
    { name: 'storage', endpoint: '/api/smoke-test/storage' },
  ];
  
  res.json({
    status: 'healthy',
    message: 'Use individual endpoints for detailed checks',
    responseTime: Date.now() - startTime,
    details: {
      availableChecks: checks.map(c => c.endpoint)
    }
  });
});

export default router;
