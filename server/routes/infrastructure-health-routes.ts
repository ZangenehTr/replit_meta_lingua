// Infrastructure Health Monitoring Routes
// Read-only endpoints showing TURN/STUN server health without exposing credentials
// REQUIRES ADMIN AUTHENTICATION

import { Router, Request, Response, NextFunction } from "express";

const router = Router();

// Authentication middleware placeholders - will be applied when mounting
export function createInfrastructureHealthRouter(
  authenticateToken: (req: Request, res: Response, next: NextFunction) => void,
  requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void
) {
  const router = Router();
  
  // Apply authentication to all routes
  router.use(authenticateToken);
  router.use(requireRole(['Admin']));

interface InfrastructureHealth {
  webrtc: {
    turn: {
      configured: boolean;
      status: 'healthy' | 'unhealthy' | 'not_configured';
      url?: string; // Masked URL
      lastChecked?: string;
    };
    stun: {
      configured: boolean;
      status: 'healthy' | 'unhealthy' | 'not_configured';
      primaryUrl?: string; // Masked URL
      backupUrl?: string; // Masked URL
      lastChecked?: string;
    };
  };
  smtp: {
    configured: boolean;
    status: 'healthy' | 'unhealthy' | 'not_configured';
    host?: string;
    port?: number;
    lastChecked?: string;
  };
  kavenegar: {
    configured: boolean;
    status: 'healthy' | 'unhealthy' | 'not_configured';
    lastChecked?: string;
  };
}

  // Utility to mask credentials from URLs while preserving hostname
  function maskUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    
    try {
      // Try parsing as full URL first
      const urlObj = new URL(url);
      urlObj.username = '';
      urlObj.password = '';
      return urlObj.toString();
    } catch {
      // Handle TURN/STUN formats: turn:host:port or turn:user:pass@host:port
      const match = url.match(/^(turn|stun|turns|stuns):(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)$/i);
      if (match) {
        const [, protocol, , , host, port] = match;
        // Preserve protocol, host, and port; strip credentials
        return `${protocol}:${host}:${port}`;
      }
      
      // If format is unrecognized, mask but preserve structure
      return url.replace(/:[^:@]+:[^@]+@/, ':***@');
    }
  }

// GET /api/admin/infrastructure/health - Get infrastructure health status
router.get("/health", async (req, res) => {
  try {
    const health: InfrastructureHealth = {
      webrtc: {
        turn: {
          configured: !!process.env.TURN_SERVER_URL,
          status: 'not_configured',
          lastChecked: new Date().toISOString()
        },
        stun: {
          configured: !!process.env.STUN_SERVER_URL,
          status: 'not_configured',
          lastChecked: new Date().toISOString()
        }
      },
      smtp: {
        configured: !!process.env.SMTP_HOST,
        status: 'not_configured',
        lastChecked: new Date().toISOString()
      },
      kavenegar: {
        configured: !!process.env.KAVENEGAR_API_KEY,
        status: 'not_configured',
        lastChecked: new Date().toISOString()
      }
    };

    // TURN Server Health
    if (process.env.TURN_SERVER_URL) {
      health.webrtc.turn.url = maskUrl(process.env.TURN_SERVER_URL);
      
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Production requires TURN_SERVER_URL, TURN_USERNAME, and TURN_PASSWORD
      if (isProduction) {
        if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
          health.webrtc.turn.status = 'healthy';
        } else {
          health.webrtc.turn.status = 'unhealthy';
        }
      } else {
        // Development mode - just check URL is set
        health.webrtc.turn.status = 'healthy';
      }
    }

    // STUN Server Health
    if (process.env.STUN_SERVER_URL) {
      health.webrtc.stun.primaryUrl = maskUrl(process.env.STUN_SERVER_URL);
      health.webrtc.stun.backupUrl = maskUrl(process.env.STUN_SERVER_URL_2);
      
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction && process.env.STUN_SERVER_URL) {
        health.webrtc.stun.status = 'healthy';
      } else if (!isProduction) {
        health.webrtc.stun.status = 'healthy';
      } else {
        health.webrtc.stun.status = 'unhealthy';
      }
    }

    // SMTP Health
    if (process.env.SMTP_HOST) {
      health.smtp.host = process.env.SMTP_HOST;
      health.smtp.port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
      
      // Check if all required SMTP settings are present
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
        health.smtp.status = 'healthy';
      } else {
        health.smtp.status = 'unhealthy';
      }
    }

    // Kavenegar Health
    if (process.env.KAVENEGAR_API_KEY) {
      // Check if API key is present and looks valid
      const apiKey = process.env.KAVENEGAR_API_KEY;
      if (apiKey && apiKey.length > 10) {
        health.kavenegar.status = 'healthy';
      } else {
        health.kavenegar.status = 'unhealthy';
      }
    }

    res.json(health);
  } catch (error) {
    console.error('Error fetching infrastructure health:', error);
    res.status(500).json({ error: 'Failed to fetch infrastructure health' });
  }
});

  return router;
}
