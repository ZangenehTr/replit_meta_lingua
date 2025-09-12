/**
 * MST API Routes
 * Implements the new MST endpoints as per refactor specification
 */

import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { MstSessionController } from '../controllers/sessionController';
import { MstItemsController } from '../controllers/itemsController';
import { MstResponsesController } from '../controllers/responsesController';
import { determineFinalBand } from '../routing/router';
import { SkillResult } from '../schemas/resultSchema';

const router = express.Router();

// Configure multer for audio uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Controllers
const sessionController = new MstSessionController();
const itemsController = new MstItemsController();
const responsesController = new MstResponsesController();

// Extend Express Request interface to include user
declare module 'express' {
  interface Request {
    user?: {
      id: number;
      role: string;
    };
  }
}

// Simple auth middleware (replace with proper auth)
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }
  
  // For demo purposes - replace with proper JWT validation
  req.user = { id: parseInt(token) || 1, role: 'Student' };
  next();
};

// Request schemas
const skillSchema = z.enum(['listening', 'reading', 'speaking', 'writing']);
const stageSchema = z.enum(['core', 'upper', 'lower']);

// Initialize item bank
itemsController.initialize().catch(console.error);

/**
 * POST /mst/start
 * Start a new MST session
 */
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await sessionController.startSession(userId);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Error starting MST session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start MST session'
    });
  }
});

/**
 * GET /mst/item
 * Get item for specific skill and stage
 */
router.get('/item', authenticateToken, async (req, res) => {
  try {
    const skill = skillSchema.parse(req.query.skill);
    const stage = stageSchema.parse(req.query.stage);
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required'
      });
    }

    // Validate session exists
    const session = sessionController.getSession(sessionId);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if item bank is ready
    if (!itemsController.isReady()) {
      return res.status(503).json({
        success: false,
        error: 'Item bank not ready'
      });
    }

    // Get item
    const item = itemsController.getItem(skill, stage);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'No items available for this skill and stage'
      });
    }

    // Update session with current skill/stage
    sessionController.updateSession(sessionId, {
      currentSkill: skill,
      currentStage: stage
    });

    // Start skill timer
    const timer = sessionController.getTimer(sessionId);
    if (timer) {
      timer.createSkillTimer(skill, session.perSkillSeconds);
    }

    // Store the item for this session
    sessionController.setSessionItem(sessionId, skill, stage, item);

    res.json({
      success: true,
      item: {
        id: item.id,
        skill: item.skill,
        stage: item.stage,
        cefr: item.cefr,
        timing: item.timing,
        content: item,
        metadata: item.metadata
      }
    });
  } catch (error) {
    console.error('❌ Error getting MST item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get item'
    });
  }
});

/**
 * POST /mst/response
 * Submit response for an item
 */
router.post('/response', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    const { sessionId, skill, stage, itemId } = req.body;
    
    // Validate inputs
    const parsedSkill = skillSchema.parse(skill);
    const parsedStage = stageSchema.parse(stage);
    
    // Validate session
    const session = sessionController.getSession(sessionId);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Get the stored item for this session
    const item = sessionController.getSessionItem(sessionId, parsedSkill, parsedStage);
    if (!item || item.id !== itemId) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Prepare response data based on skill
    let responseData: any;
    let timeSpentMs = parseInt(req.body.timeSpentMs) || 0;

    if (parsedSkill === 'speaking' && req.file) {
      // Process audio for speaking
      const asrResult = await responsesController.processAudioResponse(req.file.buffer);
      responseData = {
        audioUrl: '',
        asr: asrResult
      };
    } else {
      // Parse JSON response data
      responseData = JSON.parse(req.body.responseData || '{}');
    }

    // Process response and get quickscore
    const quickscoreResult = await responsesController.processResponse(
      sessionId,
      req.user.id,
      parsedSkill,
      parsedStage,
      item,
      responseData,
      timeSpentMs
    );

    res.json({
      success: true,
      quickscore: quickscoreResult
    });
  } catch (error) {
    console.error('❌ Error processing MST response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process response'
    });
  }
});

/**
 * POST /mst/quickscore
 * Get quickscore for a response (separate endpoint)
 */
router.post('/quickscore', authenticateToken, async (req, res) => {
  try {
    const { sessionId, skill, stage, itemId, responseData, timeSpentMs } = req.body;
    
    const parsedSkill = skillSchema.parse(skill);
    const parsedStage = stageSchema.parse(stage);
    
    // Validate session
    const session = sessionController.getSession(sessionId);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Get the item
    const item = itemsController.getItem(parsedSkill, parsedStage);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Process and get quickscore
    const result = await responsesController.processResponse(
      sessionId,
      req.user.id,
      parsedSkill,
      parsedStage,
      item,
      responseData,
      timeSpentMs || 0
    );

    res.json({
      success: true,
      p: result.p,
      route: result.route,
      features: result.features,
      computeTimeMs: result.computeTimeMs
    });
  } catch (error) {
    console.error('❌ Error computing quickscore:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compute quickscore'
    });
  }
});

/**
 * POST /mst/skill-complete
 * Mark a skill as complete and add result
 */
router.post('/skill-complete', authenticateToken, async (req, res) => {
  try {
    const { sessionId, skill, stage1Score, stage2Score, route, timeSpentSec } = req.body;
    
    const parsedSkill = skillSchema.parse(skill);
    
    // Validate session
    const session = sessionController.getSession(sessionId);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Determine final stage and score
    const finalStage = route === 'up' ? 'upper' : (route === 'down' ? 'lower' : 'core');
    const finalScore = stage2Score || stage1Score;
    
    // Calculate band and confidence
    const band = determineFinalBand(finalStage, finalScore / 100, 'B1');
    const confidence = Math.min(1.0, finalScore / 80); // Simple confidence calculation

    // Create skill result
    const skillResult: SkillResult = {
      skill: parsedSkill,
      band,
      confidence,
      stage1Score,
      stage2Score,
      route: route as any,
      timeSpentSec
    };

    // Add to session
    sessionController.addSkillResult(sessionId, skillResult);

    // Check if this was the last skill
    const nextSkill = sessionController.getNextSkill(sessionId);
    const isComplete = !nextSkill;

    res.json({
      success: true,
      skillResult,
      nextSkill,
      testComplete: isComplete
    });
  } catch (error) {
    console.error('❌ Error completing skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete skill'
    });
  }
});

/**
 * POST /mst/finalize
 * Finalize MST session and get results
 */
router.post('/finalize', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Validate session
    const session = sessionController.getSession(sessionId);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Finalize and get results
    const result = await sessionController.finalizeSession(sessionId);

    res.json({
      success: true,
      result: {
        overallBand: result.overallBand,
        confidence: result.overallConfidence,
        skills: result.skills.map(skill => ({
          skill: skill.skill,
          band: skill.band,
          confidence: skill.confidence
        })),
        totalTimeMin: result.totalTimeMin,
        recommendations: result.recommendations
      }
    });
  } catch (error) {
    console.error('❌ Error finalizing MST session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to finalize session'
    });
  }
});

/**
 * GET /mst/status
 * Get session status and timing info
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    // Validate session
    const session = sessionController.getSession(sessionId as string);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const timer = sessionController.getTimer(sessionId as string);
    const skillResults = sessionController.getSkillResults(sessionId as string);

    res.json({
      success: true,
      session: {
        id: session.sessionId,
        status: session.status,
        currentSkill: session.currentSkill,
        currentStage: session.currentStage,
        skillOrder: session.skillOrder
      },
      timing: {
        totalElapsedSec: timer?.getTotalElapsedTime() || 0,
        totalRemainingSec: timer?.getTotalRemainingTime() || 0,
        skillElapsedSec: session.currentSkill && timer 
          ? timer.getSkillTimer(session.currentSkill)?.getElapsedTime() || 0
          : 0,
        skillRemainingSec: session.currentSkill && timer 
          ? timer.getSkillTimer(session.currentSkill)?.getRemainingTime() || 0
          : 0
      },
      progress: {
        completedSkills: skillResults.length,
        totalSkills: session.skillOrder.length,
        shouldAutoAdvance: sessionController.shouldAutoAdvance(sessionId as string)
      }
    });
  } catch (error) {
    console.error('❌ Error getting MST status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status'
    });
  }
});

/**
 * GET /mst/telemetry
 * Get performance telemetry (admin endpoint)
 */
router.get('/telemetry', authenticateToken, async (req, res) => {
  try {
    const stats = responsesController.getPerformanceStats();
    const logs = responsesController.getTelemetryLogs();

    res.json({
      success: true,
      stats,
      logCount: logs.length,
      recentLogs: logs.slice(-10) // Last 10 logs
    });
  } catch (error) {
    console.error('❌ Error getting telemetry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get telemetry'
    });
  }
});

export default router;