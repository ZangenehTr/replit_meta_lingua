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
import { authenticateToken, requireRole } from '../../../auth-middleware';
import { AuthRequest } from '../../../auth-middleware';
import { storage } from '../../../storage';

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

// Using real authentication middleware from auth-middleware.ts

// Request schemas
const skillSchema = z.enum(['listening', 'reading', 'speaking', 'writing']);
const stageSchema = z.enum(['core', 'upper', 'lower']);

// Client score validation schema
const CLIENT_SCORING_VERSION = "1.0";
const CLIENT_SCORE_TOLERANCE = 0.1; // Tight tolerance to prevent manipulation
const VALIDATION_SAMPLE_RATE = 0.15; // Validate 15% of client scores

const clientScoreSchema = z.object({
  p: z.number().min(0).max(1),
  route: z.enum(['up', 'down', 'stay']), // Will be ignored - computed server-side
  features: z.record(z.unknown()).optional(),
  computeTimeMs: z.number().min(0).optional(),
  version: z.string()
}).optional();

// Helper function to derive route from score and session context
function deriveRouteFromScore(p: number, skill: string, stage: string): 'up' | 'down' | 'stay' {
  // Core stage routing thresholds
  if (stage === 'core') {
    if (p >= 0.65) return 'up';
    if (p <= 0.35) return 'down';
    return 'stay';
  }
  // For upper/lower stages, use different thresholds
  if (stage === 'upper') {
    if (p >= 0.7) return 'stay';
    return 'down';
  }
  if (stage === 'lower') {
    if (p <= 0.3) return 'stay';
    return 'up';
  }
  return 'stay';
}

// Initialize item bank
itemsController.initialize().catch(console.error);

// Helper function to get next week start date
function getNextWeekStartDate(): string {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
  nextWeek.setHours(0, 0, 0, 0);
  return nextWeek.toISOString();
}

/**
 * POST /mst/start
 * Start a new MST session
 */
router.post('/start', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Check weekly limits (max 3 attempts per week) - consistent with placement tests
    const sessionsThisWeek = await storage.getUserPlacementTestSessionsThisWeek(userId);
    if (sessionsThisWeek.length >= 3) {
      return res.status(429).json({
        success: false,
        error: 'Weekly placement test limit exceeded',
        message: 'You can only take 3 placement tests per week. Please try again next week.',
        attemptsUsed: sessionsThisWeek.length,
        maxAttempts: 3,
        nextAvailableDate: getNextWeekStartDate()
      });
    }
    
    const result = await sessionController.startSession(userId);
    
    res.json({
      success: true,
      ...result,
      weeklyLimits: {
        attemptsUsed: sessionsThisWeek.length + 1,
        maxAttempts: 3,
        remainingAttempts: 2 - sessionsThisWeek.length
      }
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
router.get('/item', authenticateToken, async (req: AuthRequest, res) => {
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
    if (!session || session.userId !== req.user!.id) {
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
router.post('/response', authenticateToken, upload.single('audio'), async (req: AuthRequest, res) => {
  try {
    const { sessionId, skill, stage, itemId } = req.body;
    
    // Validate inputs
    const parsedSkill = skillSchema.parse(skill);
    const parsedStage = stageSchema.parse(stage);
    
    // Validate session
    const session = sessionController.getSession(sessionId);
    if (!session || session.userId !== req.user!.id) {
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

    // Check for client-side score validation
    let clientScore = null;
    let useClientScore = false;
    let shouldValidateServerSide = false;
    
    if (req.body.clientScore) {
      try {
        const parsedClientScore = JSON.parse(req.body.clientScore);
        clientScore = clientScoreSchema.parse(parsedClientScore);
        
        // Version validation - reject mismatched versions
        if (clientScore.version !== CLIENT_SCORING_VERSION) {
          console.warn(`⚠️ Client score version mismatch: expected ${CLIENT_SCORING_VERSION}, got ${clientScore.version}`);
          throw new Error('Version mismatch');
        }
        
        // Only accept client scores for speaking or writing
        if (parsedSkill === 'speaking' || parsedSkill === 'writing') {
          console.log(`🔍 Client-side ${parsedSkill} score received: p=${clientScore.p.toFixed(3)}, v=${clientScore.version}`);
          useClientScore = true;
          
          // Determine if we need server validation (sampling + boundary cases)
          const isRandomSample = Math.random() < VALIDATION_SAMPLE_RATE;
          const isBoundaryCase = Math.abs(clientScore.p - 0.5) < 0.05 || 
                                 Math.abs(clientScore.p - 0.35) < 0.05 || 
                                 Math.abs(clientScore.p - 0.65) < 0.05;
          shouldValidateServerSide = isRandomSample || isBoundaryCase;
          
          if (shouldValidateServerSide) {
            console.log(`🔬 Server validation triggered: ${isRandomSample ? 'random sample' : 'boundary case'}`);
          }
        } else {
          console.warn(`⚠️ Client score ignored for ${parsedSkill} - not supported`);
        }
      } catch (error) {
        console.warn('⚠️ Invalid client score, falling back to server scoring:', error);
      }
    }

    // Process response with true load reduction
    let quickscoreResult;
    
    if (useClientScore && clientScore && !shouldValidateServerSide) {
      // FAST PATH: Use client score without server validation
      console.log(`⚡ Fast path: Using client-side ${parsedSkill} score (p=${clientScore.p.toFixed(3)})`);
      
      // Derive route server-side from client score (never trust client route)
      const serverRoute = deriveRouteFromScore(clientScore.p, parsedSkill, parsedStage);
      
      quickscoreResult = {
        p: clientScore.p,
        route: serverRoute,
        features: clientScore.features || {},
        computeTimeMs: clientScore.computeTimeMs || 0,
        clientScored: true,
        serverValidated: false,
        loadReduced: true
      };
    } else if (useClientScore && clientScore && shouldValidateServerSide) {
      // VALIDATION PATH: Compare client score with server score
      console.log(`🔬 Validation path: Comparing client vs server ${parsedSkill} score`);
      
      const serverQuickscoreResult = await responsesController.processResponse(
        sessionId,
        req.user!.id,
        parsedSkill,
        parsedStage,
        item,
        responseData,
        timeSpentMs
      );
      
      const scoreDifference = Math.abs(clientScore.p - serverQuickscoreResult.p);
      const serverRoute = deriveRouteFromScore(clientScore.p, parsedSkill, parsedStage);
      
      if (scoreDifference <= CLIENT_SCORE_TOLERANCE) {
        console.log(`✅ Client score validated (diff: ${scoreDifference.toFixed(3)}) - using client score with server route`);
        quickscoreResult = {
          ...serverQuickscoreResult,
          p: clientScore.p,
          route: serverRoute, // Always use server-derived route
          features: clientScore.features || serverQuickscoreResult.features,
          computeTimeMs: clientScore.computeTimeMs || 0,
          clientScored: true,
          serverValidated: true,
          scoreDifference,
          validationPassed: true
        };
      } else {
        console.warn(`⚠️ Client score validation failed (diff: ${scoreDifference.toFixed(3)}) - using server score`);
        quickscoreResult = {
          ...serverQuickscoreResult,
          clientScored: false,
          serverValidated: true,
          scoreDifference,
          validationPassed: false
        };
      }
    } else {
      // STANDARD PATH: Server-side scoring for reading/listening or when no client score
      console.log(`🌐 Standard path: Server-side ${parsedSkill} scoring`);
      quickscoreResult = await responsesController.processResponse(
        sessionId,
        req.user!.id,
        parsedSkill,
        parsedStage,
        item,
        responseData,
        timeSpentMs
      );
      quickscoreResult.clientScored = false;
      quickscoreResult.loadReduced = false;
    }

    res.json({
      success: true,
      route: quickscoreResult.route,
      p: quickscoreResult.p,
      features: quickscoreResult.features,
      computeTimeMs: quickscoreResult.computeTimeMs,
      clientScored: quickscoreResult.clientScored || false,
      serverValidated: quickscoreResult.serverValidated || false,
      scoreDifference: quickscoreResult.scoreDifference,
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
router.post('/quickscore', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { sessionId, skill, stage, itemId, responseData, timeSpentMs } = req.body;
    
    const parsedSkill = skillSchema.parse(skill);
    const parsedStage = stageSchema.parse(stage);
    
    // Validate session
    const session = sessionController.getSession(sessionId);
    if (!session || session.userId !== req.user!.id) {
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
      req.user!.id,
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
router.post('/skill-complete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { sessionId, skill, stage1Score, stage2Score, route, timeSpentSec } = req.body;
    
    const parsedSkill = skillSchema.parse(skill);
    
    // Validate session
    const session = sessionController.getSession(sessionId);
    if (!session || session.userId !== req.user!.id) {
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
    
    // Calculate band and confidence - finalScore is from quickscore p (0-1 range)
    const normalizedScore = finalScore; // Already in 0-1 range from quickscore
    const band = determineFinalBand(finalStage, normalizedScore, 'B1');
    const confidence = Math.min(1.0, finalScore / 0.8); // Simple confidence calculation
    
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

    console.log(`✅ Created skill result for ${parsedSkill}:`, skillResult);

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
router.post('/finalize', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.body;
    
    // Validate session
    const session = sessionController.getSession(sessionId);
    if (!session || session.userId !== req.user!.id) {
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
router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.query;
    
    // Validate session
    const session = sessionController.getSession(sessionId as string);
    if (!session || session.userId !== req.user!.id) {
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
router.get('/telemetry', authenticateToken, async (req: AuthRequest, res) => {
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
router.post('/generate-roadmap', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { sessionId, learningGoals, timeAvailability, preferredPace, focusAreas, placementResults } = req.body;
    
    console.log('🗺 MST Roadmap generation requested for session:', sessionId);
    
    // Validate MST session exists
    const session = sessionController.getSession(sessionId);
    if (!session || session.userId !== req.user!.id) {
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

    // Create personalized roadmap structure based on actual MST results
    const skillResults = sessionController.getSkillResults(sessionId);
    const weakestSkill = getWeakestSkillFromResults(skillResults);
    const totalWeeks = Math.max(8, Math.min(24, timeAvailability <= 5 ? 20 : (timeAvailability <= 10 ? 16 : 12)));
    
    const personalizedRoadmap = {
      id: Date.now(),
      title: `Personalized English Learning Path`,
      description: `Based on your MST assessment results (${placementResults?.overallBand || 'B1'} level), this roadmap targets your specific weaknesses and goals.`,
      estimatedWeeks: totalWeeks,
      weeklyHours: timeAvailability,
      milestones: [
        {
          id: 1,
          title: 'Strengthen Your Foundation',
          description: `Focus on ${weakestSkill} skills - your assessment shows this needs the most improvement`,
          weekNumber: Math.ceil(totalWeeks * 0.15),
          primarySkill: weakestSkill
        },
        {
          id: 2,
          title: 'Build All-Round Fluency',
          description: `Develop balanced proficiency across listening, reading, speaking, and writing`,
          weekNumber: Math.ceil(totalWeeks * 0.4),
          primarySkill: getSecondWeakestSkill(skillResults)
        },
        {
          id: 3,
          title: 'Advanced Application',
          description: `Apply your skills in real-world contexts and complex scenarios`,
          weekNumber: Math.ceil(totalWeeks * 0.7),
          primarySkill: 'speaking'
        },
        {
          id: 4,
          title: 'Goal Mastery',
          description: `Achieve your specific learning objectives: ${learningGoals?.join(', ') || 'general fluency'}`,
          weekNumber: Math.ceil(totalWeeks * 0.9),
          primarySkill: getMostRelevantSkillForGoals(learningGoals)
        }
      ],
      personalizedRecommendations: generatePersonalizedRecommendations(skillResults, placementResults, learningGoals, focusAreas)
    };

    res.json({
      success: true,
      roadmap: personalizedRoadmap,
      milestones: personalizedRoadmap.milestones,
      steps: [], // Can be populated later
      estimatedCompletion: new Date(Date.now() + personalizedRoadmap.estimatedWeeks * 7 * 24 * 60 * 60 * 1000),
      personalizedRecommendations: personalizedRoadmap.personalizedRecommendations,
      message: 'Personalized roadmap generated successfully from your MST assessment results'
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
function getWeakestSkillFromResults(skillResults: any[]): string {
  if (!skillResults || skillResults.length === 0) return 'speaking';
  
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  let weakestSkill = 'speaking';
  let lowestLevelIndex = 6; // Start with highest
  
  for (const result of skillResults) {
    const levelIndex = levels.indexOf(result.band);
    if (levelIndex !== -1 && levelIndex < lowestLevelIndex) {
      lowestLevelIndex = levelIndex;
      weakestSkill = result.skill;
    }
  }
  
  return weakestSkill;
}

function getSecondWeakestSkill(skillResults: any[]): string {
  if (!skillResults || skillResults.length < 2) return 'reading';
  
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const sortedResults = skillResults
    .map(result => ({ skill: result.skill, levelIndex: levels.indexOf(result.band) }))
    .filter(item => item.levelIndex !== -1)
    .sort((a, b) => a.levelIndex - b.levelIndex);
  
  return sortedResults.length > 1 ? sortedResults[1].skill : 'reading';
}

function getMostRelevantSkillForGoals(learningGoals: string[]): string {
  if (!learningGoals || learningGoals.length === 0) return 'speaking';
  
  for (const goal of learningGoals) {
    const lowerGoal = goal.toLowerCase();
    if (lowerGoal.includes('ielts') || lowerGoal.includes('toefl') || lowerGoal.includes('exam')) return 'writing';
    if (lowerGoal.includes('business') || lowerGoal.includes('professional')) return 'speaking';
    if (lowerGoal.includes('academic') || lowerGoal.includes('university')) return 'reading';
    if (lowerGoal.includes('conversation') || lowerGoal.includes('speaking')) return 'speaking';
  }
  
  return 'speaking'; // Default fallback
}

function generatePersonalizedRecommendations(skillResults: any[], placementResults: any, learningGoals: string[], focusAreas: string[]): string[] {
  const recommendations = [];
  
  // Based on skill results analysis
  const weakestSkill = getWeakestSkillFromResults(skillResults);
  const overallLevel = placementResults?.overallBand || 'B1';
  
  // Personalized skill-specific recommendations
  switch (weakestSkill) {
    case 'speaking':
      recommendations.push('Focus on daily conversation practice - your speaking needs the most improvement');
      recommendations.push('Practice pronunciation and fluency exercises regularly');
      break;
    case 'writing':
      recommendations.push('Develop your writing skills through structured essay practice');
      recommendations.push('Focus on grammar accuracy and coherent paragraph organization');
      break;
    case 'reading':
      recommendations.push('Expand reading comprehension with diverse text types');
      recommendations.push('Practice skimming and scanning techniques for better efficiency');
      break;
    case 'listening':
      recommendations.push('Improve listening skills with varied accents and speaking speeds');
      recommendations.push('Practice note-taking while listening to longer passages');
      break;
  }
  
  // Level-appropriate recommendations
  if (['A1', 'A2'].includes(overallLevel)) {
    recommendations.push('Build fundamental vocabulary and basic grammar structures');
    recommendations.push('Practice simple daily conversations and basic reading');
  } else if (['B1', 'B2'].includes(overallLevel)) {
    recommendations.push('Develop intermediate vocabulary and complex sentence structures');
    recommendations.push('Practice expressing opinions and handling longer discussions');
  } else {
    recommendations.push('Refine advanced language nuances and cultural expressions');
    recommendations.push('Focus on specialized vocabulary in your areas of interest');
  }
  
  // Goal-specific recommendations
  if (learningGoals) {
    for (const goal of learningGoals) {
      const lowerGoal = goal.toLowerCase();
      if (lowerGoal.includes('ielts') || lowerGoal.includes('toefl')) {
        recommendations.push('Practice exam-specific formats and time management strategies');
      }
      if (lowerGoal.includes('business') || lowerGoal.includes('professional')) {
        recommendations.push('Focus on professional communication and presentation skills');
      }
      if (lowerGoal.includes('conversation')) {
        recommendations.push('Engage in regular speaking practice with native speakers');
      }
    }
  }
  
  return recommendations.slice(0, 6); // Limit to 6 recommendations
}

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