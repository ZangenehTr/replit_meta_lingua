import { Router, Request, Response } from 'express';
import { metrics } from '../monitoring/metrics.js';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const router = Router();

// Authentication middleware (imported from server/index.ts auth logic)
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Role requirement middleware
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Get metrics dashboard (Admin only)
router.get('/metrics', authenticateToken, requireRole(['Admin']), (req: Request, res: Response) => {
  try {
    const allStats = metrics.getAllStats();
    const slowestRoutes = metrics.getSlowestRoutes(10);

    res.json({
      timestamp: new Date().toISOString(),
      metrics: allStats,
      slowestRoutes,
      summary: {
        totalRoutes: Object.keys(allStats).length,
        totalRequests: Object.values(allStats)
          .filter(s => s !== null)
          .reduce((sum, s) => sum + s!.count, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get error logs (Admin only)
router.get('/errors', authenticateToken, requireRole(['Admin']), (req: Request, res: Response) => {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const errorLogPath = path.join(logDir, 'error.log');

    if (!fs.existsSync(errorLogPath)) {
      return res.json({
        totalErrors: 0,
        recentErrors: [],
      });
    }

    const errorLog = fs.readFileSync(errorLogPath, 'utf-8');
    const errors = errorLog
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .slice(-100); // Last 100 errors

    res.json({
      totalErrors: errors.length,
      recentErrors: errors,
    });
  } catch (error) {
    console.error('Error reading error logs:', error);
    res.status(500).json({ error: 'Failed to read error logs' });
  }
});

// Get system health (Admin only)
router.get('/health', authenticateToken, requireRole(['Admin']), (req: Request, res: Response) => {
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        formatted: formatUptime(uptime),
      },
      memory: {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapPercent: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1)}%`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  } catch (error) {
    console.error('Error fetching health:', error);
    res.status(500).json({ error: 'Failed to fetch health status' });
  }
});

// Reset metrics (Admin only)
router.post('/metrics/reset', authenticateToken, requireRole(['Admin']), (req: Request, res: Response) => {
  try {
    metrics.reset();
    res.json({ success: true, message: 'Metrics reset successfully' });
  } catch (error) {
    console.error('Error resetting metrics:', error);
    res.status(500).json({ error: 'Failed to reset metrics' });
  }
});

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

export default router;
