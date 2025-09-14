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
import { whisperService } from '../../../whisper-service';

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

    // Get used item suffixes for speaking skill to prevent duplicates
    let excludedSuffixes: Set<string> | undefined;
    if (skill === 'speaking') {
      const usedIds = sessionController.getUsedItemIds(sessionId);
      excludedSuffixes = new Set<string>();
      
      // Extract suffixes from used items (e.g., '002' from 'S-B1-002')
      for (const usedId of usedIds) {
        if (usedId.startsWith('S-')) { // Only check speaking items
          const suffix = usedId.split('-').pop();
          if (suffix) {
            excludedSuffixes.add(suffix);
          }
        }
      }
      
      if (excludedSuffixes.size > 0) {
        console.log(`🔍 Speaking item selection: excluding suffixes ${Array.from(excludedSuffixes).join(', ')}`);
      }
    }

    // Get item with exclusions for speaking
    const item = itemsController.getItem(skill, stage, undefined, excludedSuffixes);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'No items available for this skill and stage'
      });
    }
    
    console.log(`📝 Selected item: ${item.id} for ${skill}/${stage}`);

    // Update session with current skill/stage
    sessionController.updateSession(sessionId, {
      currentSkill: skill,
      currentStage: stage
    });

    // Timer logic now handled on frontend - no server-side skill timers needed

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

    if (parsedSkill === 'speaking') {
      // Process audio for speaking (if file provided, otherwise empty response)
      if (req.file) {
        const asrResult = await responsesController.processAudioResponse(req.file.buffer, whisperService);
        responseData = {
          audioUrl: '',
          asr: asrResult
        };
      } else {
        // No audio file provided for speaking (might be a test or error case)
        responseData = {
          audioUrl: '',
          asr: { transcription: '', confidence: 0 }
        };
      }
    } else {
      // Parse JSON response data for non-speaking skills
      const rawData = req.body.responseData;
      if (rawData && rawData !== 'undefined') {
        responseData = JSON.parse(rawData);
      } else {
        responseData = {};
      }
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
      route: quickscoreResult.route,
      p: quickscoreResult.p,
      features: quickscoreResult.features,
      computeTimeMs: quickscoreResult.computeTimeMs,
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

    // Determine final stage and score based on current stage and routing decision
    let finalStage: 'core' | 'upper' | 'lower';
    
    // Get current stage from session - this will be 'core', 'upper', or 'lower'
    const currentStage = session.currentStage || 'core'; // Default to core if not set
    
    if (route === 'up') {
      finalStage = 'upper';
    } else if (route === 'down') {
      // Allow routing to lower stage for A1-A2 levels
      finalStage = 'lower';
    } else {
      finalStage = 'core';
    }
    
    const finalScore = stage2Score || stage1Score;
    
    // Calculate band and confidence - finalScore is already normalized 0-100
    const normalizedScore = finalScore / 100; // Convert to 0-1 range
    const band = determineFinalBand(finalStage, normalizedScore, 'B1');
    const confidence = Math.min(1.0, finalScore / 80); // Simple confidence calculation
    
    console.log(`🎯 MST Final Band Calculation: stage=${finalStage}, score=${finalScore}, normalized=${normalizedScore}, band=${band}`);

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
        totalElapsedSec: 0, // Session timing handled by frontend
        totalRemainingSec: 600, // 10 minute session limit
        skillElapsedSec: 0, // Question timing handled by frontend
        skillRemainingSec: 0 // Question timing handled by frontend
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

/**
 * POST /mst/generate-roadmap
 * Generate AI roadmap from MST results
 */
router.post('/generate-roadmap', authenticateToken, async (req, res) => {
  try {
    const { sessionId, learningGoals, timeAvailability, preferredPace, focusAreas, placementResults } = req.body;
    
    console.log('🗺 MST Roadmap generation requested for session:', sessionId);
    
    // Validate MST session exists
    const session = sessionController.getSession(sessionId);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'MST session not found or access denied'
      });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Complete MST assessment before generating roadmap'
      });
    }

    // Create simplified roadmap structure (mock for now - can be enhanced with AI later)
    const mockRoadmap = {
      id: Date.now(),
      title: `Personalized English Learning Path`,
      description: `Based on your MST assessment results (${placementResults?.overallBand || 'B1'} level), this roadmap will help you achieve your learning goals.`,
      estimatedWeeks: timeAvailability <= 5 ? 16 : (timeAvailability <= 10 ? 12 : 8),
      weeklyHours: timeAvailability,
      milestones: [
        {
          id: 1,
          title: 'Foundation Building',
          description: 'Strengthen core language skills based on your assessment',
          weekNumber: 2,
          primarySkill: getWeakestSkill(placementResults)
        },
        {
          id: 2,
          title: 'Intermediate Development',
          description: 'Build fluency and confidence in all skills',
          weekNumber: 6,
          primarySkill: 'speaking'
        },
        {
          id: 3,
          title: 'Advanced Practice',
          description: 'Master complex language structures and expressions',
          weekNumber: 10,
          primarySkill: 'writing'
        },
        {
          id: 4,
          title: 'Goal Achievement',
          description: `Focus on your specific goals: ${learningGoals.join(', ')}`,
          weekNumber: 14,
          primarySkill: 'speaking'
        }
      ],
      personalizedRecommendations: generateRecommendations(placementResults, learningGoals)
    };

    res.json({
      success: true,
      roadmap: mockRoadmap,
      milestones: mockRoadmap.milestones,
      steps: [], // Can be populated later
      estimatedCompletion: new Date(Date.now() + mockRoadmap.estimatedWeeks * 7 * 24 * 60 * 60 * 1000),
      personalizedRecommendations: mockRoadmap.personalizedRecommendations,
      message: 'Roadmap generated successfully from MST assessment results'
    });

  } catch (error) {
    console.error('❌ Error generating MST roadmap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate roadmap from MST results'
    });
  }
});

// Helper functions for roadmap generation
function getWeakestSkill(placementResults: any): string {
  if (!placementResults?.levels) return 'speaking';
  
  const skills = ['speaking', 'listening', 'reading', 'writing'];
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  let weakestSkill = 'speaking';
  let lowestLevel = 6; // Start with highest
  
  for (const skill of skills) {
    const level = placementResults.levels[skill];
    if (level) {
      const levelIndex = levels.indexOf(level.replace(/[+-]/, ''));
      if (levelIndex !== -1 && levelIndex < lowestLevel) {
        lowestLevel = levelIndex;
        weakestSkill = skill;
      }
    }
  }
  
  return weakestSkill;
}

function generateRecommendations(placementResults: any, learningGoals: string[]): string[] {
  const recommendations = [];
  
  // Based on overall level
  const overallLevel = placementResults?.overallBand || 'B1';
  if (['A1', 'A2'].includes(overallLevel)) {
    recommendations.push('Focus on building vocabulary and basic grammar structures');
    recommendations.push('Practice daily conversations to improve fluency');
  } else if (['B1', 'B2'].includes(overallLevel)) {
    recommendations.push('Expand vocabulary with academic and professional terms');
    recommendations.push('Practice complex sentence structures and idioms');
  } else {
    recommendations.push('Refine nuanced language use and cultural expressions');
    recommendations.push('Focus on specialized vocabulary for your field of interest');
  }
  
  // Based on learning goals
  if (learningGoals.includes('ielts') || learningGoals.includes('toefl')) {
    recommendations.push('Practice test-specific formats and timing strategies');
  }
  if (learningGoals.includes('business')) {
    recommendations.push('Focus on professional communication and presentation skills');
  }
  if (learningGoals.includes('conversation')) {
    recommendations.push('Engage in regular speaking practice with native speakers');
  }
  
  return recommendations;
}

export default router;