/**
 * Whisper Health Monitoring Routes
 * Provides real-time health status for Whisper transcription providers
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware';
import { whisperService } from '../whisper-service';

const router = Router();

/**
 * Get Whisper provider health status
 * Checks both faster-whisper (self-hosted) and OpenAI Whisper availability
 */
router.get('/whisper-health', authenticateToken, async (req: Request, res: Response) => {
  // Verify admin role
  if ((req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const provider = process.env.WHISPER_PROVIDER || 'faster-whisper';
    const whisperUrl = process.env.WHISPER_URL || 'http://localhost:8000';
    const openaiApiKey = process.env.OPENAI_API_KEY;

    const healthStatus: {
      provider: string;
      fasterWhisper: {
        status: 'healthy' | 'unhealthy';
        url: string;
        message: string;
      };
      openai: {
        status: 'healthy' | 'unhealthy';
        message: string;
      };
      overall: 'healthy' | 'degraded' | 'unhealthy';
    } = {
      provider,
      fasterWhisper: {
        status: 'unhealthy',
        url: whisperUrl,
        message: 'Not configured'
      },
      openai: {
        status: 'unhealthy',
        message: 'Not configured'
      },
      overall: 'unhealthy'
    };

    // Check faster-whisper availability
    try {
      const fasterWhisperTest = await whisperService.checkAvailability();
      healthStatus.fasterWhisper.status = fasterWhisperTest ? 'healthy' : 'unhealthy';
      healthStatus.fasterWhisper.message = fasterWhisperTest 
        ? 'Connected and ready' 
        : `Cannot connect to ${whisperUrl}`;
    } catch (error) {
      healthStatus.fasterWhisper.status = 'unhealthy';
      healthStatus.fasterWhisper.message = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Check OpenAI availability (based on API key presence)
    if (openaiApiKey) {
      healthStatus.openai.status = 'healthy';
      healthStatus.openai.message = 'API key configured';
    } else {
      healthStatus.openai.status = 'unhealthy';
      healthStatus.openai.message = 'No API key found in environment variables';
    }

    // Determine overall status
    if (
      (provider === 'faster-whisper' && healthStatus.fasterWhisper.status === 'healthy') ||
      (provider === 'openai' && healthStatus.openai.status === 'healthy')
    ) {
      healthStatus.overall = 'healthy';
    } else if (
      healthStatus.fasterWhisper.status === 'healthy' || 
      healthStatus.openai.status === 'healthy'
    ) {
      healthStatus.overall = 'degraded';
    } else {
      healthStatus.overall = 'unhealthy';
    }

    res.json(healthStatus);
  } catch (error) {
    console.error('Error checking Whisper health:', error);
    res.status(500).json({ 
      error: 'Failed to check Whisper health',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
