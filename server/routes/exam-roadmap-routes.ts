/**
 * Exam-focused Roadmap Routes
 * Comprehensive backend endpoints for AI-powered personalized learning plans
 */

import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { openAIService } from '../services/openai-service';
import { ExamRoadmapGenerator } from '../services/exam-roadmap-generator';
import { 
  ExamType, 
  examScoreToCEFR, 
  calculateRequiredHours,
  type ExamTypeValues,
  type CEFRLevelValues 
} from '@shared/schema';
import { requireAuth, AuthRequest } from '../auth-middleware';

const router = express.Router();

// Initialize the roadmap generator with OpenAI service
const roadmapGenerator = new ExamRoadmapGenerator(openAIService);

// Exam-specific targetScore validation schemas
const ieltsTargetScore = z.number().min(1).max(9, 'IELTS target score must be between 1 and 9 (band scores)');
const toeflTargetScore = z.number().min(0).max(120, 'TOEFL iBT target score must be between 0 and 120');
const pteTargetScore = z.number().min(10).max(90, 'PTE Academic target score must be between 10 and 90');

// Extended focus areas that the frontend can send
const focusAreasEnum = z.enum([
  'reading', 'writing', 'listening', 'speaking', 
  'academic_writing', 'grammar', 'vocabulary', 'pronunciation', 'exam_strategy'
]);

// Extended pace options with normalization
const preferredPaceEnum = z.enum(['slow', 'normal', 'fast', 'regular']).transform((val) => {
  // Normalize 'regular' to 'normal' for internal consistency
  return val === 'regular' ? 'normal' : val;
});

// Helper function to normalize focus areas to core skills for internal logic
const normalizeFocusAreas = (areas: string[]): string[] => {
  return areas.map(area => {
    switch(area) {
      case 'academic_writing': return 'writing';
      case 'grammar': return 'writing';
      case 'vocabulary': return 'reading';
      case 'pronunciation': return 'speaking';
      case 'exam_strategy': return 'reading'; // Maps to general comprehension
      default: return area; // reading, writing, listening, speaking stay as-is
    }
  });
};

// Discriminated union for exam-specific validation
const calculatePlanSchema = z.discriminatedUnion('exam', [
  z.object({
    exam: z.literal(ExamType.IELTS_ACADEMIC),
    targetScore: ieltsTargetScore,
    sessionId: z.string().min(1, 'MST session ID is required'),
    examDate: z.string().optional(),
    weeklyHours: z.number().min(1).max(40, 'Weekly hours must be between 1 and 40'),
    focusAreas: z.array(focusAreasEnum).optional().default([]),
    preferredPace: preferredPaceEnum.default('normal')
  }),
  z.object({
    exam: z.literal(ExamType.IELTS_GENERAL),
    targetScore: ieltsTargetScore,
    sessionId: z.string().min(1, 'MST session ID is required'),
    examDate: z.string().optional(),
    weeklyHours: z.number().min(1).max(40, 'Weekly hours must be between 1 and 40'),
    focusAreas: z.array(focusAreasEnum).optional().default([]),
    preferredPace: preferredPaceEnum.default('normal')
  }),
  z.object({
    exam: z.literal(ExamType.TOEFL_IBT),
    targetScore: toeflTargetScore,
    sessionId: z.string().min(1, 'MST session ID is required'),
    examDate: z.string().optional(),
    weeklyHours: z.number().min(1).max(40, 'Weekly hours must be between 1 and 40'),
    focusAreas: z.array(focusAreasEnum).optional().default([]),
    preferredPace: preferredPaceEnum.default('normal')
  }),
  z.object({
    exam: z.literal(ExamType.PTE_ACADEMIC),
    targetScore: pteTargetScore,
    sessionId: z.string().min(1, 'MST session ID is required'),
    examDate: z.string().optional(),
    weeklyHours: z.number().min(1).max(40, 'Weekly hours must be between 1 and 40'),
    focusAreas: z.array(focusAreasEnum).optional().default([]),
    preferredPace: preferredPaceEnum.default('normal')
  }),
  z.object({
    exam: z.literal(ExamType.PTE_CORE),
    targetScore: pteTargetScore,
    sessionId: z.string().min(1, 'MST session ID is required'),
    examDate: z.string().optional(),
    weeklyHours: z.number().min(1).max(40, 'Weekly hours must be between 1 and 40'),
    focusAreas: z.array(focusAreasEnum).optional().default([]),
    preferredPace: preferredPaceEnum.default('normal')
  })
]);

const generateSessionsSchema = z.object({
  planId: z.number().int().positive('Plan ID must be a positive integer'),
  sessionId: z.string().min(1, 'MST session ID is required'),
  exam: z.nativeEnum(ExamType),
  focusAreas: z.array(focusAreasEnum).optional().default([]),
  totalSessions: z.number().int().min(1).max(200, 'Total sessions must be between 1 and 200')
});

const updateProgressSchema = z.object({
  sessionId: z.number().int().positive('Session ID must be a positive integer'),
  completed: z.boolean(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  timeSpent: z.number().min(0).optional()
});


/**
 * POST /api/roadmap/calculate-plan
 * Calculate comprehensive study plan based on MST results
 */
router.post('/calculate-plan', requireAuth, async (req: AuthRequest, res) => {
  try {
    console.log('🎯 POST /api/roadmap/calculate-plan - Calculating study plan');

    // Validate request body
    const validatedData = calculatePlanSchema.parse(req.body);
    const userId = req.user!.id;

    console.log(`📊 Calculating plan for user ${userId}, exam: ${validatedData.exam}, target: ${validatedData.targetScore}`);

    // Calculate comprehensive study plan
    const planResult = await roadmapGenerator.calculatePlan({
      ...validatedData,
      userId
    });

    console.log(`✅ Plan calculated successfully - Plan ID: ${planResult.planId}, ${planResult.totalSessions} sessions over ${planResult.weeksToExam} weeks`);

    res.json({
      success: true,
      data: planResult,
      message: `Study plan created with ${planResult.totalSessions} sessions over ${planResult.weeksToExam} weeks`
    });

  } catch (error) {
    console.error('❌ Error in calculate-plan:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to calculate study plan'
    });
  }
});

/**
 * POST /api/roadmap/generate-sessions
 * Generate detailed AI-powered session plans
 */
router.post('/generate-sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    console.log('🤖 POST /api/roadmap/generate-sessions - Generating AI-powered sessions');

    // Validate request body
    const validatedData = generateSessionsSchema.parse(req.body);
    const userId = req.user!.id;

    console.log(`🎓 Generating ${validatedData.totalSessions} sessions for ${validatedData.exam} exam`);

    // Verify the plan belongs to the user
    const plan = await storage.getRoadmapPlan(validatedData.planId);
    if (!plan || plan.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap plan not found or access denied'
      });
    }

    // Validate that MST session exists and belongs to the user
    const mstSession = await storage.getMSTSession(validatedData.sessionId);
    if (!mstSession || mstSession.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'MST session not found or access denied'
      });
    }

    // Fetch MST results server-side to derive current and target levels
    const mstResults = await storage.getMSTResults(validatedData.sessionId);
    if (!mstResults || !mstResults.skills || mstResults.skills.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'MST results not found - please complete your placement test first'
      });
    }

    // Extract current levels from MST results
    const currentLevel: Record<string, any> = {};
    for (const skill of mstResults.skills) {
      // Convert MST band (e.g., "B1+", "B2-") to standard CEFR level
      let level = skill.band.replace(/[+-]$/, '') as any;
      // Validate CEFR level
      if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
        level = 'B1'; // Default fallback
      }
      currentLevel[skill.skill] = level;
    }

    // Calculate target level from plan's target score and exam type
    const targetLevel = examScoreToCEFR(validatedData.exam, plan.targetScore);

    // Check for duplicate session generation (idempotency)
    const existingSessions = await storage.getRoadmapSessions(validatedData.planId);
    if (existingSessions.length > 0) {
      console.log(`⚠️ Sessions already exist for plan ${validatedData.planId}, returning existing sessions`);
      return res.json({
        success: true,
        data: {
          planId: validatedData.planId,
          totalSessions: existingSessions.length,
          sessions: existingSessions
        },
        message: `Retrieved ${existingSessions.length} existing sessions (idempotency check)`
      });
    }

    // Generate detailed session plans using AI with server-side derived data
    const sessions = await roadmapGenerator.generateSessions({
      planId: validatedData.planId,
      userId,
      sessionId: validatedData.sessionId,
      exam: validatedData.exam,
      currentLevel,
      targetLevel,
      focusAreas: validatedData.focusAreas,
      totalSessions: validatedData.totalSessions
    });

    console.log(`✅ Generated ${sessions.length} AI-powered sessions successfully`);

    res.json({
      success: true,
      data: {
        planId: validatedData.planId,
        totalSessions: sessions.length,
        sessions,
        derivedLevels: {
          currentLevel,
          targetLevel
        }
      },
      message: `Generated ${sessions.length} personalized learning sessions`
    });

  } catch (error) {
    console.error('❌ Error in generate-sessions:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate session plans'
    });
  }
});

/**
 * GET /api/roadmap/plans
 * Get user's roadmap plans
 */
router.get('/plans', requireAuth, async (req: AuthRequest, res) => {
  try {
    console.log(`📚 GET /api/roadmap/plans - Retrieving plans for user ${req.user!.id}`);

    const plans = await storage.getUserRoadmapPlans(req.user!.id);

    // Enhance plans with progress and session counts
    const enhancedPlans = await Promise.all(
      plans.map(async (plan) => {
        const sessions = await storage.getRoadmapSessions(plan.id);
        const completedSessions = plan.completedSessions || 0;
        const progressPercentage = sessions.length > 0 ? 
          Math.round((completedSessions / sessions.length) * 100) : 0;

        return {
          ...plan,
          currentLevel: typeof plan.currentLevel === 'string' ? 
            JSON.parse(plan.currentLevel) : plan.currentLevel,
          sessionCount: sessions.length,
          progressPercentage,
          status: progressPercentage === 100 ? 'completed' : 
                   progressPercentage > 0 ? 'in_progress' : 'not_started'
        };
      })
    );

    console.log(`✅ Retrieved ${enhancedPlans.length} roadmap plans`);

    res.json({
      success: true,
      data: {
        plans: enhancedPlans,
        total: enhancedPlans.length
      }
    });

  } catch (error) {
    console.error('❌ Error in get plans:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve roadmap plans'
    });
  }
});

/**
 * GET /api/roadmap/:planId
 * Retrieve saved roadmap plan with sessions
 */
router.get('/:planId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const planId = parseInt(req.params.planId);
    
    if (!planId || isNaN(planId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan ID'
      });
    }

    console.log(`📖 GET /api/roadmap/${planId} - Retrieving roadmap plan`);

    // Get the roadmap plan
    const plan = await storage.getRoadmapPlan(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap plan not found'
      });
    }

    // Verify ownership
    if (plan.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this roadmap plan'
      });
    }

    // Get associated sessions with progress
    const sessions = await storage.getRoadmapSessionsWithProgress(planId, req.user!.id);

    // Calculate progress metrics
    const completedSessions = sessions.filter(s => s.completed).length;
    const progressPercentage = sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0;

    console.log(`✅ Retrieved plan with ${sessions.length} sessions, ${progressPercentage}% complete`);

    res.json({
      success: true,
      data: {
        plan: {
          ...plan,
          currentLevel: typeof plan.currentLevel === 'string' ? JSON.parse(plan.currentLevel) : plan.currentLevel,
          progressPercentage,
          completedSessions: plan.completedSessions || completedSessions
        },
        sessions,
        stats: {
          totalSessions: sessions.length,
          completedSessions,
          remainingSessions: sessions.length - completedSessions,
          progressPercentage,
          estimatedCompletionWeeks: plan.weeksToExam,
          currentWeek: plan.currentWeek || 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in get roadmap plan:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve roadmap plan'
    });
  }
});

/**
 * PATCH /api/roadmap/:planId/progress
 * Update session completion status and plan progress
 */
router.patch('/:planId/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const planId = parseInt(req.params.planId);
    
    if (!planId || isNaN(planId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan ID'
      });
    }

    console.log(`📝 PATCH /api/roadmap/${planId}/progress - Updating progress`);

    // Validate request body
    const validatedData = updateProgressSchema.parse(req.body);

    // Verify plan ownership
    const plan = await storage.getRoadmapPlan(planId);
    if (!plan || plan.userId !== req.user!.id) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap plan not found or access denied'
      });
    }

    // Get the session to update
    const session = await storage.getRoadmapSession(validatedData.sessionId);
    if (!session || session.planId !== planId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found in this plan'
      });
    }

    // Update session with completion status and optional data
    const sessionUpdates: any = {
      completed: validatedData.completed,
      updatedAt: new Date()
    };

    if (validatedData.score !== undefined) {
      sessionUpdates.score = validatedData.score;
    }
    if (validatedData.notes) {
      sessionUpdates.notes = validatedData.notes;
    }
    if (validatedData.timeSpent !== undefined) {
      sessionUpdates.timeSpent = validatedData.timeSpent;
    }

    const updatedSession = await storage.updateRoadmapSession(validatedData.sessionId, sessionUpdates);

    // Recalculate plan progress
    const allSessions = await storage.getRoadmapSessions(planId);
    const completedCount = allSessions.filter(s => 
      s.id === validatedData.sessionId ? validatedData.completed : (s as any).completed
    ).length;

    const progressPercentage = Math.round((completedCount / allSessions.length) * 100);

    // Update plan progress
    const planUpdates = {
      completedSessions: completedCount,
      progressPercentage,
      lastUpdated: new Date()
    };

    // Update current week based on completed sessions
    if (validatedData.completed) {
      const sessionsPerWeek = plan.sessionsPerWeek || 3;
      const currentWeek = Math.ceil((completedCount + 1) / sessionsPerWeek);
      planUpdates.currentWeek = Math.min(currentWeek, plan.weeksToExam || 1);
    }

    const updatedPlan = await storage.updateRoadmapPlan(planId, planUpdates);

    console.log(`✅ Updated session ${validatedData.sessionId}, plan now ${progressPercentage}% complete`);

    res.json({
      success: true,
      data: {
        session: updatedSession,
        plan: {
          ...updatedPlan,
          currentLevel: typeof updatedPlan.currentLevel === 'string' ? 
            JSON.parse(updatedPlan.currentLevel) : updatedPlan.currentLevel,
          progressPercentage
        },
        progress: {
          completedSessions: completedCount,
          totalSessions: allSessions.length,
          progressPercentage,
          currentWeek: planUpdates.currentWeek
        }
      },
      message: validatedData.completed ? 
        'Session marked as completed' : 
        'Session progress updated'
    });

  } catch (error) {
    console.error('❌ Error in update progress:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update progress'
    });
  }
});

/**
 * DELETE /api/roadmap/:planId
 * Delete a roadmap plan and all its sessions
 */
router.delete('/:planId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const planId = parseInt(req.params.planId);
    
    if (!planId || isNaN(planId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan ID'
      });
    }

    console.log(`🗑️ DELETE /api/roadmap/${planId} - Deleting roadmap plan`);

    // Verify plan ownership
    const plan = await storage.getRoadmapPlan(planId);
    if (!plan || plan.userId !== req.user!.id) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap plan not found or access denied'
      });
    }

    // Get sessions count before deletion
    const sessions = await storage.getRoadmapSessions(planId);
    const sessionCount = sessions.length;

    // Delete all sessions first (due to foreign key constraint)
    for (const session of sessions) {
      await storage.deleteRoadmapSession(session.id);
    }

    // Delete the plan
    await storage.deleteRoadmapPlan(planId);

    console.log(`✅ Deleted roadmap plan with ${sessionCount} sessions`);

    res.json({
      success: true,
      message: `Roadmap plan and ${sessionCount} sessions deleted successfully`
    });

  } catch (error) {
    console.error('❌ Error in delete plan:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to delete roadmap plan'
    });
  }
});

export default router;