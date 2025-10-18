import { Router, Request, Response } from 'express';
import { diskMonitor } from '../monitoring/disk-monitor.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Authentication middleware
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

// Get disk space information (Admin only)
router.get('/space', authenticateToken, requireRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const diskInfo = await diskMonitor.checkDiskSpace();
    
    res.json({
      success: true,
      disk: {
        total: diskInfo.total,
        used: diskInfo.used,
        available: diskInfo.available,
        usedPercent: diskInfo.usedPercent,
        status: diskInfo.status,
        formatted: {
          total: diskMonitor.formatBytes(diskInfo.total),
          used: diskMonitor.formatBytes(diskInfo.used),
          available: diskMonitor.formatBytes(diskInfo.available),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check disk space' });
  }
});

// Scan for orphaned files (Admin only)
router.get('/orphaned', authenticateToken, requireRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const report = await diskMonitor.scanOrphanedFiles();
    
    res.json({
      success: true,
      orphanedFiles: {
        linguaquestAudio: {
          count: report.linguaquestAudio.count,
          size: diskMonitor.formatBytes(report.linguaquestAudio.sizeBytes),
          sizeBytes: report.linguaquestAudio.sizeBytes,
          files: report.linguaquestAudio.files.slice(0, 100), // Limit to first 100 files
        },
        recordings: {
          count: report.recordings.count,
          size: diskMonitor.formatBytes(report.recordings.sizeBytes),
          sizeBytes: report.recordings.sizeBytes,
          files: report.recordings.files.slice(0, 100), // Limit to first 100 files
        },
        total: {
          count: report.total.count,
          size: diskMonitor.formatBytes(report.total.sizeBytes),
          sizeBytes: report.total.sizeBytes,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scan orphaned files' });
  }
});

// Cleanup orphaned files (Admin only)
router.post('/cleanup', authenticateToken, requireRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const { olderThanDays = 30 } = req.body;
    
    // Validate input
    if (typeof olderThanDays !== 'number' || olderThanDays < 1) {
      return res.status(400).json({ error: 'olderThanDays must be a positive number' });
    }
    
    const result = await diskMonitor.cleanupOrphanedFiles(olderThanDays);
    
    res.json({
      success: true,
      cleanup: {
        deleted: result.deleted,
        freed: diskMonitor.formatBytes(result.freedBytes),
        freedBytes: result.freedBytes,
        olderThanDays,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cleanup orphaned files' });
  }
});

// Get comprehensive disk report (Admin only)
router.get('/report', authenticateToken, requireRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const [diskInfo, orphanedReport] = await Promise.all([
      diskMonitor.checkDiskSpace(),
      diskMonitor.scanOrphanedFiles(),
    ]);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      disk: {
        total: diskInfo.total,
        used: diskInfo.used,
        available: diskInfo.available,
        usedPercent: diskInfo.usedPercent,
        status: diskInfo.status,
        formatted: {
          total: diskMonitor.formatBytes(diskInfo.total),
          used: diskMonitor.formatBytes(diskInfo.used),
          available: diskMonitor.formatBytes(diskInfo.available),
        },
      },
      orphanedFiles: {
        linguaquestAudio: {
          count: orphanedReport.linguaquestAudio.count,
          size: diskMonitor.formatBytes(orphanedReport.linguaquestAudio.sizeBytes),
          sizeBytes: orphanedReport.linguaquestAudio.sizeBytes,
        },
        recordings: {
          count: orphanedReport.recordings.count,
          size: diskMonitor.formatBytes(orphanedReport.recordings.sizeBytes),
          sizeBytes: orphanedReport.recordings.sizeBytes,
        },
        total: {
          count: orphanedReport.total.count,
          size: diskMonitor.formatBytes(orphanedReport.total.sizeBytes),
          sizeBytes: orphanedReport.total.sizeBytes,
        },
      },
      recommendations: getRecommendations(diskInfo, orphanedReport),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate disk report' });
  }
});

function getRecommendations(diskInfo: any, orphanedReport: any): string[] {
  const recommendations: string[] = [];
  
  if (diskInfo.status === 'critical') {
    recommendations.push('⚠️ CRITICAL: Disk usage is above 90%. Immediate cleanup required!');
  } else if (diskInfo.status === 'warning') {
    recommendations.push('⚠️ WARNING: Disk usage is above 80%. Consider cleanup soon.');
  }
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  if (orphanedReport.total.count > 100) {
    recommendations.push(`Found ${orphanedReport.total.count} orphaned files (${formatBytes(orphanedReport.total.sizeBytes)}). Consider cleanup.`);
  }
  
  if (orphanedReport.linguaquestAudio.sizeBytes > 100 * 1024 * 1024) { // > 100MB
    recommendations.push(`LinguaQuest audio files occupy ${formatBytes(orphanedReport.linguaquestAudio.sizeBytes)}. Review for cleanup.`);
  }
  
  if (orphanedReport.recordings.sizeBytes > 500 * 1024 * 1024) { // > 500MB
    recommendations.push(`Video recordings occupy ${formatBytes(orphanedReport.recordings.sizeBytes)}. Archive or delete old recordings.`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Disk health is good. No immediate action required.');
  }
  
  return recommendations;
}

export default router;
