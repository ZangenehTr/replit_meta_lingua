// ============================================================================
// ENHANCED MENTORING API ROUTES
// ============================================================================
// Comprehensive API endpoints for the enhanced mentoring system
// Provides mentor dashboard, progress tracking, learning paths, AI recommendations,
// communication management, and analytics with proper authentication and validation

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { enhancedMentoringStorage } from './enhanced-mentoring-storage';
import { aiMentoringService } from './ai-mentoring-service';
import { MentoringAnalyticsEngine } from '@shared/mentoring-analytics-engine';
import { authenticateToken, requireRole } from './auth-middleware';
import {
  insertEnhancedStudentProgressSchema,
  insertAdaptiveLearningPathSchema,
  insertAiMentoringRecommendationSchema,
  insertMentoringInterventionSchema,
  insertMentoringCommunicationSchema,
  insertMentorScheduleSchema
} from '@shared/enhanced-mentoring-schema';

// ============================================================================
// REQUEST VALIDATION SCHEMAS
// ============================================================================

// Progress tracking schemas
const progressQuerySchema = z.object({
  studentId: z.coerce.number().optional(),
  mentorId: z.coerce.number().optional(),
  dateFrom: z.string().optional().transform(str => str ? new Date(str) : undefined),
  dateTo: z.string().optional().transform(str => str ? new Date(str) : undefined),
  riskLevel: z.enum(['minimal', 'low', 'moderate', 'high', 'critical']).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20)
});

const progressUpdateSchema = insertEnhancedStudentProgressSchema.omit({ id: true });

// Learning path schemas
const learningPathQuerySchema = z.object({
  studentId: z.coerce.number().optional(),
  mentorId: z.coerce.number().optional(),
  status: z.enum(['active', 'paused', 'completed', 'suspended', 'archived']).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20)
});

const learningPathCreateSchema = insertAdaptiveLearningPathSchema.omit({ id: true });
const learningPathUpdateSchema = insertAdaptiveLearningPathSchema.partial().omit({ id: true });

// AI recommendation schemas  
const aiGuidanceRequestSchema = z.object({
  type: z.enum(['progress_report', 'learning_recommendation', 'intervention_suggestion', 'study_plan', 'motivation_boost', 'skill_analysis']),
  studentId: z.number(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  language: z.string().optional(),
  customPrompt: z.string().optional(),
  context: z.object({
    culturalBackground: z.string().optional(),
    nativeLanguage: z.string().optional(),
    targetLanguage: z.string().optional()
  }).optional()
});

const recommendationQuerySchema = z.object({
  studentId: z.coerce.number().optional(),
  mentorId: z.coerce.number().optional(),
  type: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).optional(),
  status: z.enum(['pending', 'implemented', 'dismissed', 'modified']).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20)
});

// Intervention schemas
const interventionCreateSchema = insertMentoringInterventionSchema.omit({ id: true });
const interventionUpdateSchema = insertMentoringInterventionSchema.partial().omit({ id: true });

const interventionQuerySchema = z.object({
  studentId: z.coerce.number().optional(),
  mentorId: z.coerce.number().optional(),
  type: z.enum(['academic_support', 'motivational', 'behavioral', 'technical', 'social', 'emotional', 'schedule_adjustment', 'content_adaptation']).optional(),
  status: z.enum(['planned', 'active', 'completed', 'suspended', 'cancelled']).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20)
});

// Communication schemas
const communicationCreateSchema = insertMentoringCommunicationSchema.omit({ id: true });
const communicationQuerySchema = z.object({
  mentorId: z.coerce.number().optional(),
  studentId: z.coerce.number().optional(),
  type: z.enum(['text_message', 'voice_message', 'video_message', 'email', 'in_app_notification', 'system_alert', 'scheduled_meeting', 'emergency_contact']).optional(),
  unreadOnly: z.coerce.boolean().default(false),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20)
});

// Analytics schemas
const analyticsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
  dateFrom: z.string().optional().transform(str => str ? new Date(str) : undefined),
  dateTo: z.string().optional().transform(str => str ? new Date(str) : undefined),
  mentorId: z.coerce.number().optional(),
  studentId: z.coerce.number().optional()
});

// Test integration schemas
const testAnalysisSchema = z.object({
  testSessionId: z.number(),
  studentId: z.number(),
  includeRecommendations: z.boolean().default(true)
});

// ============================================================================
// ROUTER SETUP AND MIDDLEWARE
// ============================================================================

export const enhancedMentoringRouter = Router();

// Rate limiting for AI endpoints (more restrictive)
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute for AI endpoints
  message: {
    success: false,
    error: 'Too many AI requests. Please try again later.',
    rateLimitExceeded: true
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Standard rate limiting
const standardRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute for standard endpoints
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    rateLimitExceeded: true
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply standard rate limiting to all routes
enhancedMentoringRouter.use(standardRateLimit);

// Helper function for validating request data
function validateRequestData<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: any) => {
    try {
      // Validate query parameters
      if (req.query && Object.keys(req.query).length > 0) {
        req.query = schema.parse(req.query) as any;
      }
      // Validate request body
      if (req.body && Object.keys(req.body).length > 0) {
        req.body = schema.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
          message: 'Please check your input data'
        });
      }
      next(error);
    }
  };
}

// Helper function for safe parameter parsing
function parseIntParam(param: string, paramName: string): number {
  const parsed = parseInt(param);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${paramName}: must be a positive integer`);
  }
  return parsed;
}

// ============================================================================
// STUDENT PROGRESS TRACKING ROUTES
// ============================================================================

/**
 * GET /api/enhanced-mentoring/progress
 * Retrieve student progress data with filtering and pagination
 */
enhancedMentoringRouter.get('/progress', 
  authenticateToken,
  validateRequestData(progressQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const query = req.query as z.infer<typeof progressQuerySchema>;
      
      let progress: any[] = [];
      
      // Role-based access control and data retrieval
      if (user.role === 'student') {
        // Students can only see their own progress
        progress = await enhancedMentoringStorage.getStudentProgressByStudent(user.id, query);
      } else if (user.role === 'mentor') {
        // Mentors can see their assigned students
        if (query.studentId) {
          // Specific student requested - verify mentor has access via query.mentorId
          query.mentorId = user.id;
          progress = await enhancedMentoringStorage.getStudentProgressByStudent(query.studentId, query);
        } else {
          // No specific student - get all students for this mentor
          const studentsAtRisk = await enhancedMentoringStorage.getStudentsAtRisk(undefined, user.id);
          const studentIds = studentsAtRisk.map(s => s.studentId);
          
          if (studentIds.length > 0) {
            const bulkProgress = await enhancedMentoringStorage.getBulkStudentProgress(studentIds, query);
            progress = Array.from(bulkProgress.values()).flat();
          }
        }
      } else if (user.role === 'admin' || user.role === 'supervisor') {
        // Admin/supervisor access
        if (query.studentId) {
          // Specific student requested
          progress = await enhancedMentoringStorage.getStudentProgressByStudent(query.studentId, query);
        } else {
          // No specific student - require studentId parameter for admin/supervisor
          return res.status(400).json({
            success: false,
            error: 'studentId parameter is required for admin/supervisor role',
            message: 'Please specify a studentId to retrieve progress data'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      res.json({
        success: true,
        data: progress,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: progress.length
        }
      });
    } catch (error) {
      console.error('Progress retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve progress data',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/enhanced-mentoring/progress
 * Create new student progress entry
 */
enhancedMentoringRouter.post('/progress',
  authenticateToken,
  requireRole(['mentor', 'admin']),
  validateRequestData(progressUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const progressData = req.body as z.infer<typeof progressUpdateSchema>;
      
      // Ensure mentor can only create progress for their assigned students
      if (user.role === 'mentor') {
        progressData.mentorId = user.id;
      }
      
      const progress = await enhancedMentoringStorage.createStudentProgress(progressData);
      
      res.status(201).json({
        success: true,
        data: progress,
        message: 'Progress entry created successfully'
      });
    } catch (error) {
      console.error('Progress creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create progress entry',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * PUT /api/enhanced-mentoring/progress/:id
 * Update existing progress entry
 */
enhancedMentoringRouter.put('/progress/:id',
  authenticateToken,
  requireRole(['mentor', 'admin']),
  validateRequestData(progressUpdateSchema.partial()),
  async (req: Request, res: Response) => {
    try {
      const progressId = parseIntParam(req.params.id, 'progress ID');
      const updateData = req.body;
      
      const progress = await enhancedMentoringStorage.updateStudentProgress(progressId, updateData);
      
      res.json({
        success: true,
        data: progress,
        message: 'Progress updated successfully'
      });
    } catch (error) {
      console.error('Progress update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update progress',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/progress/:studentId/metrics
 * Get comprehensive progress metrics for a student
 */
enhancedMentoringRouter.get('/progress/:studentId/metrics',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');
      const { dateFrom, dateTo, timeframeDays } = req.query;
      
      // Access control
      if (user.role === 'student' && user.id !== studentId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      const dateFromParsed = dateFrom ? new Date(dateFrom as string) : undefined;
      const dateToParsed = dateTo ? new Date(dateTo as string) : undefined;
      
      const metrics = await enhancedMentoringStorage.getStudentProgressMetrics(
        studentId, 
        dateFromParsed, 
        dateToParsed
      );
      
      // Calculate additional analytics
      const velocity = MentoringAnalyticsEngine.calculateLearningVelocity(metrics);
      const trends = MentoringAnalyticsEngine.analyzePerformanceTrends(metrics);
      
      res.json({
        success: true,
        data: {
          metrics,
          velocity,
          trends,
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      console.error('Metrics retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/progress/:studentId/risk-assessment
 * Get risk assessment for a student
 */
enhancedMentoringRouter.get('/progress/:studentId/risk-assessment',
  authenticateToken,
  requireRole(['mentor', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const studentId = parseIntParam(req.params.studentId, 'student ID');
      
      const riskAssessment = await enhancedMentoringStorage.calculateStudentRiskScore(studentId);
      
      res.json({
        success: true,
        data: riskAssessment,
        assessedAt: new Date()
      });
    } catch (error) {
      console.error('Risk assessment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assess student risk',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// ============================================================================
// LEARNING PATHS MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/enhanced-mentoring/learning-paths
 * Retrieve learning paths with filtering
 */
enhancedMentoringRouter.get('/learning-paths',
  authenticateToken,
  validateRequestData(learningPathQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const query = req.query as z.infer<typeof learningPathQuerySchema>;
      
      // Role-based filtering
      if (user.role === 'student') {
        query.studentId = user.id;
      } else if (user.role === 'mentor') {
        query.mentorId = user.id;
      }
      
      // Validate studentId is provided or can be determined
      if (!query.studentId && user.role !== 'mentor') {
        return res.status(400).json({
          success: false,
          error: 'studentId parameter is required',
          message: 'Please specify a studentId to retrieve learning paths'
        });
      }
      
      // For mentors without specific studentId, get paths for all their students
      let paths = [];
      if (user.role === 'mentor' && !query.studentId) {
        // Get all students for this mentor and aggregate their paths
        const studentsAtRisk = await enhancedMentoringStorage.getStudentsAtRisk(undefined, user.id);
        const studentIds = studentsAtRisk.map(s => s.studentId);
        
        for (const studentId of studentIds) {
          const studentPaths = await enhancedMentoringStorage.getLearningPathsByStudent(studentId, query);
          paths.push(...studentPaths);
        }
      } else if (query.studentId) {
        paths = await enhancedMentoringStorage.getLearningPathsByStudent(query.studentId, query);
      }
      
      res.json({
        success: true,
        data: paths,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: paths.length
        }
      });
    } catch (error) {
      console.error('Learning paths retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve learning paths',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/enhanced-mentoring/learning-paths
 * Create new learning path
 */
enhancedMentoringRouter.post('/learning-paths',
  authenticateToken,
  requireRole(['mentor', 'admin']),
  validateRequestData(learningPathCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const pathData = req.body as z.infer<typeof learningPathCreateSchema>;
      
      if (user.role === 'mentor') {
        pathData.mentorId = user.id;
      }
      
      const path = await enhancedMentoringStorage.createLearningPath(pathData);
      
      res.status(201).json({
        success: true,
        data: path,
        message: 'Learning path created successfully'
      });
    } catch (error) {
      console.error('Learning path creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create learning path',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * PUT /api/enhanced-mentoring/learning-paths/:id
 * Update learning path
 */
enhancedMentoringRouter.put('/learning-paths/:id',
  authenticateToken,
  requireRole(['mentor', 'admin']),
  validateRequestData(learningPathUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const pathId = parseIntParam(req.params.id, 'learning path ID');
      const updateData = req.body;
      
      const path = await enhancedMentoringStorage.updateLearningPath(pathId, updateData);
      
      res.json({
        success: true,
        data: path,
        message: 'Learning path updated successfully'
      });
    } catch (error) {
      console.error('Learning path update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update learning path',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/enhanced-mentoring/learning-paths/:id/progress
 * Update progress on a learning path step
 */
const pathProgressSchema = z.object({
  stepIndex: z.number(),
  performanceScore: z.number().optional(),
  stepId: z.string().optional(),
  performanceData: z.any().optional()
});

enhancedMentoringRouter.post('/learning-paths/:id/progress',
  authenticateToken,
  validateRequestData(pathProgressSchema),
  async (req: Request, res: Response) => {
    try {
      const pathId = parseIntParam(req.params.id, 'learning path ID');
      const { stepIndex, performanceScore, stepId, performanceData } = req.body;
      
      if (stepId) {
        await enhancedMentoringStorage.completePathStep(pathId, stepId, performanceData);
      }
      
      const updatedPath = await enhancedMentoringStorage.updatePathProgress(
        pathId, 
        stepIndex, 
        performanceScore
      );
      
      res.json({
        success: true,
        data: updatedPath,
        message: 'Path progress updated successfully'
      });
    } catch (error) {
      console.error('Path progress update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update path progress',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/enhanced-mentoring/learning-paths/:id/adapt
 * Adapt learning path based on performance
 */
const pathAdaptationSchema = z.object({
  adaptationRules: z.any(),
  reason: z.string()
});

enhancedMentoringRouter.post('/learning-paths/:id/adapt',
  authenticateToken,
  requireRole(['mentor', 'admin']),
  validateRequestData(pathAdaptationSchema),
  async (req: Request, res: Response) => {
    try {
      const pathId = parseIntParam(req.params.id, 'learning path ID');
      const { adaptationRules, reason } = req.body;
      
      const adaptedPath = await enhancedMentoringStorage.adaptLearningPath(
        pathId, 
        adaptationRules, 
        reason
      );
      
      res.json({
        success: true,
        data: adaptedPath,
        message: 'Learning path adapted successfully'
      });
    } catch (error) {
      console.error('Path adaptation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to adapt learning path',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// ============================================================================
// AI RECOMMENDATIONS ROUTES
// ============================================================================

/**
 * POST /api/enhanced-mentoring/ai/guidance
 * Generate AI-powered personalized guidance
 */
enhancedMentoringRouter.post('/ai/guidance',
  authenticateToken,
  requireRole(['mentor', 'admin', 'teacher', 'supervisor']),
  aiRateLimit,
  validateRequestData(aiGuidanceRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const request = req.body as z.infer<typeof aiGuidanceRequestSchema>;
      
      // Access control
      if (user.role === 'student' && user.id !== request.studentId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      // Get student context
      const progressData = await enhancedMentoringStorage.getStudentProgressByStudent(request.studentId);
      const learningPaths = await enhancedMentoringStorage.getLearningPathsByStudent(request.studentId);
      
      // Build context for AI
      const context = {
        studentId: request.studentId,
        progressData: progressData[0], // Latest progress
        learningPath: learningPaths.find(p => p.status === 'active'),
        ...request.context
      };
      
      const guidance = await aiMentoringService.generatePersonalizedGuidance({
        ...request,
        context
      });
      
      // Save as recommendation if successful
      if (guidance.success && guidance.recommendations.length > 0) {
        for (const rec of guidance.recommendations.slice(0, 3)) { // Limit to 3 recommendations
          await enhancedMentoringStorage.createAiRecommendation({
            studentId: request.studentId,
            mentorId: user.role === 'mentor' ? user.id : undefined,
            recommendationType: request.type,
            category: rec.type,
            priority: rec.priority,
            title: rec.description.substring(0, 100),
            description: rec.description,
            actionSteps: rec.actionSteps,
            aiModelUsed: guidance.modelUsed,
            analysisData: {
              confidenceLevel: guidance.confidence,
              analysisMethod: request.type
            }
          });
        }
      }
      
      res.json({
        success: true,
        data: guidance,
        generatedAt: new Date()
      });
    } catch (error) {
      console.error('AI guidance generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate AI guidance',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/enhanced-mentoring/ai/progress-report
 * Generate AI-powered progress report
 */
const progressReportSchema = z.object({
  studentId: z.number(),
  reportType: z.enum(['weekly', 'monthly', 'milestone', 'intervention_followup']).default('weekly')
});

enhancedMentoringRouter.post('/ai/progress-report',
  authenticateToken,
  requireRole(['mentor', 'admin', 'teacher', 'supervisor']),
  aiRateLimit,
  validateRequestData(progressReportSchema),
  async (req: Request, res: Response) => {
    try {
      const { studentId, reportType } = req.body;
      
      // Gather comprehensive context
      const progressData = await enhancedMentoringStorage.getStudentProgressByStudent(studentId);
      const learningPaths = await enhancedMentoringStorage.getLearningPathsByStudent(studentId);
      const interventions = await enhancedMentoringStorage.getInterventions({ studentId });
      
      const context = {
        studentId,
        progressData: progressData[0],
        learningPath: learningPaths.find(p => p.status === 'active'),
        interventionHistory: interventions.interventions
      };
      
      const report = await aiMentoringService.generateProgressReport(context, reportType);
      
      res.json({
        success: true,
        data: report,
        generatedAt: new Date()
      });
    } catch (error) {
      console.error('Progress report generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate progress report',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/recommendations
 * Retrieve AI recommendations with filtering
 */
enhancedMentoringRouter.get('/recommendations',
  authenticateToken,
  validateRequestData(recommendationQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const query = req.query as z.infer<typeof recommendationQuerySchema>;
      
      // Role-based filtering
      if (user.role === 'student') {
        query.studentId = user.id;
      } else if (user.role === 'mentor') {
        query.mentorId = user.id;
      }
      
      const result = await enhancedMentoringStorage.getAiRecommendations(query);
      
      res.json({
        success: true,
        data: result.recommendations,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.total
        }
      });
    } catch (error) {
      console.error('Recommendations retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve recommendations',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * PUT /api/enhanced-mentoring/recommendations/:id/implement
 * Mark recommendation as implemented
 */
const implementationSchema = z.object({
  implementationNotes: z.string()
});

enhancedMentoringRouter.put('/recommendations/:id/implement',
  authenticateToken,
  requireRole(['mentor', 'admin', 'teacher', 'supervisor']),
  validateRequestData(implementationSchema),
  async (req: Request, res: Response) => {
    try {
      const recommendationId = parseIntParam(req.params.id, 'recommendation ID');
      const { implementationNotes } = req.body;
      
      const recommendation = await enhancedMentoringStorage.implementRecommendation(
        recommendationId, 
        implementationNotes
      );
      
      res.json({
        success: true,
        data: recommendation,
        message: 'Recommendation marked as implemented'
      });
    } catch (error) {
      console.error('Recommendation implementation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to implement recommendation',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// ============================================================================
// INTERVENTION MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/enhanced-mentoring/interventions
 * Retrieve interventions with filtering
 */
enhancedMentoringRouter.get('/interventions',
  authenticateToken,
  validateRequestData(interventionQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const query = req.query as z.infer<typeof interventionQuerySchema>;
      
      // Role-based filtering
      if (user.role === 'student') {
        query.studentId = user.id;
      } else if (user.role === 'mentor') {
        query.mentorId = user.id;
      }
      
      const result = await enhancedMentoringStorage.getInterventions(query);
      
      res.json({
        success: true,
        data: result.interventions,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.total
        }
      });
    } catch (error) {
      console.error('Interventions retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve interventions',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/enhanced-mentoring/interventions
 * Create new intervention
 */
enhancedMentoringRouter.post('/interventions',
  authenticateToken,
  requireRole(['mentor', 'admin', 'teacher', 'supervisor']),
  validateRequestData(interventionCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const interventionData = req.body as z.infer<typeof interventionCreateSchema>;
      
      if (user.role === 'mentor') {
        interventionData.mentorId = user.id;
      }
      
      const intervention = await enhancedMentoringStorage.createIntervention(interventionData);
      
      res.status(201).json({
        success: true,
        data: intervention,
        message: 'Intervention created successfully'
      });
    } catch (error) {
      console.error('Intervention creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create intervention',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * PUT /api/enhanced-mentoring/interventions/:id/start
 * Start an intervention
 */
enhancedMentoringRouter.put('/interventions/:id/start',
  authenticateToken,
  requireRole(['mentor', 'admin', 'teacher', 'supervisor']),
  async (req: Request, res: Response) => {
    try {
      const interventionId = parseIntParam(req.params.id, 'intervention ID');
      
      const intervention = await enhancedMentoringStorage.startIntervention(interventionId);
      
      res.json({
        success: true,
        data: intervention,
        message: 'Intervention started successfully'
      });
    } catch (error) {
      console.error('Intervention start error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start intervention',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * PUT /api/enhanced-mentoring/interventions/:id/complete
 * Complete an intervention
 */
const interventionCompletionSchema = z.object({
  outcomeData: z.any(),
  effectiveness: z.enum(['highly_effective', 'effective', 'partially_effective', 'ineffective']).optional()
});

enhancedMentoringRouter.put('/interventions/:id/complete',
  authenticateToken,
  requireRole(['mentor', 'admin', 'teacher', 'supervisor']),
  validateRequestData(interventionCompletionSchema),
  async (req: Request, res: Response) => {
    try {
      const interventionId = parseIntParam(req.params.id, 'intervention ID');
      const { outcomeData } = req.body;
      
      const intervention = await enhancedMentoringStorage.completeIntervention(interventionId, outcomeData);
      
      res.json({
        success: true,
        data: intervention,
        message: 'Intervention completed successfully'
      });
    } catch (error) {
      console.error('Intervention completion error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete intervention',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/enhanced-mentoring/interventions/:id/progress
 * Add progress note to intervention
 */
const interventionProgressSchema = z.object({
  progressNote: z.string(),
  metricsSnapshot: z.any().optional()
});

enhancedMentoringRouter.post('/interventions/:id/progress',
  authenticateToken,
  requireRole(['mentor', 'admin', 'teacher', 'supervisor']),
  validateRequestData(interventionProgressSchema),
  async (req: Request, res: Response) => {
    try {
      const interventionId = parseIntParam(req.params.id, 'intervention ID');
      const { progressNote, metricsSnapshot } = req.body;
      
      await enhancedMentoringStorage.addInterventionProgress(
        interventionId, 
        progressNote, 
        metricsSnapshot
      );
      
      res.json({
        success: true,
        message: 'Progress note added successfully'
      });
    } catch (error) {
      console.error('Intervention progress error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add intervention progress',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// ============================================================================
// COMMUNICATION MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/enhanced-mentoring/communications
 * Retrieve communications with filtering
 */
enhancedMentoringRouter.get('/communications',
  authenticateToken,
  validateRequestData(communicationQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const query = req.query as z.infer<typeof communicationQuerySchema>;
      
      // Role-based filtering
      if (user.role === 'student') {
        query.studentId = user.id;
      } else if (user.role === 'mentor') {
        query.mentorId = user.id;
      }
      
      const result = await enhancedMentoringStorage.getCommunications(query);
      
      res.json({
        success: true,
        data: result.communications,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.total
        }
      });
    } catch (error) {
      console.error('Communications retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve communications',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/enhanced-mentoring/communications
 * Create new communication
 */
enhancedMentoringRouter.post('/communications',
  authenticateToken,
  validateRequestData(communicationCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const communicationData = req.body as z.infer<typeof communicationCreateSchema>;
      
      // Set sender based on user role
      if (user.role === 'mentor') {
        communicationData.mentorId = user.id;
      } else if (user.role === 'student') {
        communicationData.studentId = user.id;
      }
      
      const communication = await enhancedMentoringStorage.createCommunication(communicationData);
      
      res.status(201).json({
        success: true,
        data: communication,
        message: 'Communication sent successfully'
      });
    } catch (error) {
      console.error('Communication creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send communication',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * PUT /api/enhanced-mentoring/communications/:id/read
 * Mark communication as read
 */
enhancedMentoringRouter.put('/communications/:id/read',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const communicationId = parseIntParam(req.params.id, 'communication ID');
      
      const communication = await enhancedMentoringStorage.markCommunicationRead(communicationId);
      
      res.json({
        success: true,
        data: communication,
        message: 'Communication marked as read'
      });
    } catch (error) {
      console.error('Communication read error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark communication as read',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/communications/unread
 * Get unread communications count
 */
enhancedMentoringRouter.get('/communications/unread',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      let unreadCommunications;
      if (user.role === 'mentor') {
        unreadCommunications = await enhancedMentoringStorage.getUnreadCommunications(user.id);
      } else if (user.role === 'student') {
        unreadCommunications = await enhancedMentoringStorage.getUnreadCommunications(undefined, user.id);
      } else {
        unreadCommunications = await enhancedMentoringStorage.getUnreadCommunications();
      }
      
      res.json({
        success: true,
        data: {
          count: unreadCommunications.length,
          communications: unreadCommunications.slice(0, 10) // Latest 10
        }
      });
    } catch (error) {
      console.error('Unread communications error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get unread communications',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// ============================================================================
// ANALYTICS AND DASHBOARD ROUTES
// ============================================================================

/**
 * GET /api/enhanced-mentoring/dashboard
 * Get dashboard metrics based on user role
 */
enhancedMentoringRouter.get('/dashboard',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      let dashboardData;
      
      if (user.role === 'mentor') {
        dashboardData = await enhancedMentoringStorage.getDashboardMetrics(user.id);
      } else if (user.role === 'admin') {
        dashboardData = await enhancedMentoringStorage.getDashboardMetrics();
      } else {
        // Student dashboard - simplified metrics
        const progress = await enhancedMentoringStorage.getStudentProgressByStudent(user.id);
        const learningPaths = await enhancedMentoringStorage.getLearningPathsByStudent(user.id);
        const unreadComms = await enhancedMentoringStorage.getUnreadCommunications(undefined, user.id);
        
        dashboardData = {
          currentProgress: progress[0]?.overallProgressPercentage || 0,
          activeLearningPaths: learningPaths.filter(p => p.status === 'active').length,
          unreadMessages: unreadComms.length,
          recentActivity: progress.slice(0, 5)
        };
      }
      
      res.json({
        success: true,
        data: dashboardData,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load dashboard',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/analytics
 * Get system analytics
 */
enhancedMentoringRouter.get('/analytics',
  authenticateToken,
  requireRole(['mentor', 'admin', 'teacher', 'supervisor']),
  validateRequestData(analyticsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const query = req.query as z.infer<typeof analyticsQuerySchema>;
      
      // Get analytics data
      const analytics = await enhancedMentoringStorage.getAnalytics(query);
      
      // Get additional analytics based on user role
      let additionalData = {};
      
      if (user.role === 'mentor') {
        additionalData = await enhancedMentoringStorage.getRecommendationAnalytics(
          user.id, 
          undefined, 
          query.dateFrom, 
          query.dateTo
        );
      } else if (user.role === 'admin') {
        const systemPerformance = await enhancedMentoringStorage.getSystemPerformanceMetrics();
        additionalData = { systemPerformance };
      }
      
      res.json({
        success: true,
        data: {
          analytics: analytics.analytics,
          additional: additionalData,
          total: analytics.total
        }
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analytics',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/students-at-risk
 * Get students at risk
 */
enhancedMentoringRouter.get('/students-at-risk',
  authenticateToken,
  requireRole(['mentor', 'admin', 'teacher', 'supervisor']),
  validateRequestData(z.object({
    riskLevel: z.enum(['minimal', 'low', 'moderate', 'high', 'critical']).optional(),
    mentorId: z.coerce.number().optional()
  })),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { riskLevel, mentorId } = req.query;
      
      const finalMentorId = user.role === 'mentor' ? user.id : mentorId;
      
      const studentsAtRisk = await enhancedMentoringStorage.getStudentsAtRisk(
        riskLevel as any, 
        finalMentorId
      );
      
      res.json({
        success: true,
        data: studentsAtRisk,
        count: studentsAtRisk.length
      });
    } catch (error) {
      console.error('Students at risk error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve students at risk',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// ============================================================================
// UNIFIED TESTING INTEGRATION ROUTES
// ============================================================================

/**
 * POST /api/enhanced-mentoring/analyze-test-results
 * Analyze test results and generate insights
 */
enhancedMentoringRouter.post('/analyze-test-results',
  authenticateToken,
  requireRole(['mentor', 'admin', 'teacher', 'supervisor']),
  aiRateLimit,
  validateRequestData(testAnalysisSchema),
  async (req: Request, res: Response) => {
    try {
      const { testSessionId, studentId, includeRecommendations } = req.body;
      
      // Link test session to progress tracking
      await enhancedMentoringStorage.linkTestSessionToProgress(testSessionId, studentId);
      
      // Generate insights
      const insights = await enhancedMentoringStorage.generateTestInsights(testSessionId, studentId);
      
      // Analyze impact on progress
      const progressImpact = await enhancedMentoringStorage.analyzeTestProgressImpact(testSessionId);
      
      let recommendations = null;
      if (includeRecommendations) {
        // Generate AI recommendations based on test results
        const context = {
          studentId,
          testSessionId,
          insights,
          progressImpact
        };
        
        recommendations = await aiMentoringService.generatePersonalizedGuidance({
          type: 'skill_analysis',
          studentId,
          priority: 'medium',
          context
        });
      }
      
      res.json({
        success: true,
        data: {
          insights,
          progressImpact,
          recommendations,
          analyzedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Test analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze test results',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// ============================================================================
// UTILITY AND SYSTEM ROUTES
// ============================================================================

/**
 * GET /api/enhanced-mentoring/health
 * Comprehensive system health check with detailed monitoring
 */
enhancedMentoringRouter.get('/health',
  async (req: Request, res: Response) => {
    try {
      const healthCheck = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        services: {},
        system: {},
        dependencies: {},
        performance: {},
        issues: []
      };

      // Check AI Mentoring Service with comprehensive health status
      try {
        const aiServiceHealth = await aiMentoringService.getHealthStatus();
        healthCheck.services.aiMentoring = {
          status: aiServiceHealth.overall === 'healthy' ? 'healthy' : 'degraded',
          details: aiServiceHealth
        };
        
        if (aiServiceHealth.overall !== 'healthy') {
          healthCheck.issues.push(`AI Mentoring Service: ${aiServiceHealth.overall}`);
        }
      } catch (error) {
        healthCheck.services.aiMentoring = {
          status: 'unhealthy',
          error: error.message
        };
        healthCheck.issues.push(`AI Mentoring Service: ${error.message}`);
      }

      // Check Enhanced Mentoring Storage
      try {
        const storageHealth = await enhancedMentoringStorage.getStorageHealth();
        healthCheck.services.storage = {
          status: storageHealth.isHealthy ? 'healthy' : 'unhealthy',
          details: storageHealth
        };
        
        if (!storageHealth.isHealthy) {
          healthCheck.issues.push(`Storage: ${storageHealth.error || 'Storage issues detected'}`);
        }
      } catch (error) {
        healthCheck.services.storage = {
          status: 'unhealthy',
          error: error.message
        };
        healthCheck.issues.push(`Storage: ${error.message}`);
      }

      // Check Analytics Engine
      try {
        const analyticsEngine = new MentoringAnalyticsEngine();
        healthCheck.services.analytics = {
          status: 'healthy',
          message: 'Analytics engine operational'
        };
      } catch (error) {
        healthCheck.services.analytics = {
          status: 'unhealthy',
          error: error.message
        };
        healthCheck.issues.push(`Analytics Engine: ${error.message}`);
      }

      // System Performance Metrics
      healthCheck.performance = {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        nodeEnv: process.env.NODE_ENV || 'unknown'
      };

      // Environment Dependencies
      healthCheck.dependencies = {
        database: {
          available: !!process.env.DATABASE_URL,
          url: process.env.DATABASE_URL ? '[CONFIGURED]' : '[MISSING]'
        },
        openaiApiKey: {
          available: !!process.env.OPENAI_API_KEY,
          status: process.env.OPENAI_API_KEY ? '[CONFIGURED]' : '[MISSING]'
        }
      };

      // Determine overall system status
      const hasServiceIssues = Object.values(healthCheck.services).some(
        (service: any) => service.status === 'unhealthy'
      );
      
      const hasCriticalDependencyIssues = 
        !healthCheck.dependencies.database.available;

      if (hasCriticalDependencyIssues) {
        healthCheck.status = 'critical';
        healthCheck.issues.push('Critical dependencies missing (database)');
      } else if (hasServiceIssues) {
        healthCheck.status = 'degraded';
      } else if (healthCheck.issues.length > 0) {
        healthCheck.status = 'warning';
      }

      // Set appropriate HTTP status code
      const statusCode = healthCheck.status === 'critical' ? 503 :
                        healthCheck.status === 'degraded' ? 503 :
                        healthCheck.status === 'warning' ? 200 : 200;

      res.status(statusCode).json({
        success: true,
        data: healthCheck
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/student-journey/:studentId
 * Get comprehensive student journey data
 */
enhancedMentoringRouter.get('/student-journey/:studentId',
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');
      
      // Access control
      if (user.role === 'student' && user.id !== studentId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      const journey = await enhancedMentoringStorage.getStudentJourney(studentId);
      
      res.json({
        success: true,
        data: journey,
        generatedAt: new Date()
      });
    } catch (error) {
      console.error('Student journey error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve student journey',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

enhancedMentoringRouter.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Enhanced mentoring API error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default enhancedMentoringRouter;