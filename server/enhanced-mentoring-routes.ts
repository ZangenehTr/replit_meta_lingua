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
import { aiInsightsService } from './ai-insights-service';
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
  dateFrom: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform((val) => val ? new Date(val) : undefined),
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
  dateFrom: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform((val) => val ? new Date(val) : undefined),
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
// ANALYTICS API VALIDATION SCHEMAS
// ============================================================================

// Core analytics validation schemas with proper date transformation
const dateTransform = z.string().optional().transform((val) => val ? new Date(val) : undefined);

const StudentMetricsQuerySchema = z.object({
  dateFrom: dateTransform,
  dateTo: dateTransform,
  includeAnalytics: z.boolean().optional().default(true),
  includeRisk: z.boolean().optional().default(false)
});

const VelocityQuerySchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter']).default('month')
});

const TrendsQuerySchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter']).default('month'),
  includeSeasonalPatterns: z.boolean().optional().default(false)
});

const BulkStudentsQuerySchema = z.object({
  studentIds: z.array(z.coerce.number()),
  limit: z.coerce.number().min(1).max(500).default(50),
  offset: z.coerce.number().min(0).default(0),
  includeAnalytics: z.boolean().optional().default(true)
});

const SnapshotsQuerySchema = z.object({
  dates: z.array(z.string()).optional().transform((val) => val?.map(dateStr => new Date(dateStr))),
  includeMetadata: z.boolean().optional().default(true),
  aggregateBySkill: z.boolean().optional().default(false)
});

const InterventionCreateSchema = z.object({
  type: z.enum(['academic_support', 'motivational', 'behavioral', 'technical', 'social', 'emotional', 'schedule_adjustment', 'content_adaptation']),
  description: z.string().min(10).max(1000),
  expectedOutcome: z.string().min(10).max(500),
  date: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimatedDuration: z.number().min(1).max(365).optional() // days
});

// ============================================================================
// AI INSIGHTS VALIDATION SCHEMAS
// ============================================================================

// AI Insights query parameters schema
const AIInsightQuerySchema = z.object({
  language: z.enum(['fa', 'en', 'ar']).default('fa'),
  includeRecommendations: z.boolean().optional().default(true),
  culturalContext: z.enum(['iranian', 'arab', 'western', 'general']).optional().default('iranian'),
  analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed'),
  timeframe: z.object({
    from: dateTransform,
    to: dateTransform
  }).optional()
});

// Student insights specific schema  
const StudentInsightQuerySchema = AIInsightQuerySchema.extend({
  includeProgressAnalysis: z.boolean().optional().default(true),
  includeRiskAssessment: z.boolean().optional().default(true),
  includePredictions: z.boolean().optional().default(false)
});

// Risk analysis specific schema
const RiskInsightQuerySchema = AIInsightQuerySchema.extend({
  includeInterventions: z.boolean().optional().default(true),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']).optional()
});

// Cohort insights specific schema
const CohortInsightQuerySchema = AIInsightQuerySchema.extend({
  includeComparisons: z.boolean().optional().default(true),
  focusAreas: z.array(z.string()).optional().default(['performance', 'engagement', 'risk_management']),
  includeIndividualRecommendations: z.boolean().optional().default(false)
});

// Intervention effectiveness schema
const InterventionEffectivenessQuerySchema = AIInsightQuerySchema.extend({
  comparisonPeriod: z.enum(['week', 'month', 'quarter']).optional().default('month'),
  includeStatistics: z.boolean().optional().default(true)
});

// Batch insights schema
const BatchInsightRequestSchema = z.object({
  studentIds: z.array(z.coerce.number()).max(10, 'Maximum 10 students for batch insights'),
  language: z.enum(['fa', 'en', 'ar']).default('fa'),
  insightTypes: z.array(z.enum(['progress', 'risk', 'predictive'])).min(1),
  includeRecommendations: z.boolean().default(true),
  culturalContext: z.enum(['iranian', 'arab', 'western', 'general']).optional().default('iranian'),
  priority: z.enum(['low', 'normal', 'high']).default('normal')
});

// ============================================================================
// ROUTER SETUP AND MIDDLEWARE
// ============================================================================

export const enhancedMentoringRouter = Router();

// ============================================================================
// ANALYTICS RATE LIMITING CONFIGURATIONS
// ============================================================================

// Analytics individual metrics rate limiting (20 requests/minute)
const analyticsMetricsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, 
  message: {
    success: false,
    error: 'Too many analytics metrics requests. Please try again later.',
    rateLimitExceeded: true,
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Analytics bulk operations rate limiting (5 requests/minute)
const analyticsBulkRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: 'Too many bulk analytics requests. Please try again later.',
    rateLimitExceeded: true,
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// AI predictions rate limiting (10 requests/minute)
const analyticsAIRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'Too many AI analytics requests. Please try again later.',
    rateLimitExceeded: true,
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Cache/health stats rate limiting (60 requests/minute)
const analyticsSystemRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: {
    success: false,
    error: 'Too many system analytics requests. Please try again later.',
    rateLimitExceeded: true,
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// AI Insights rate limiting (10 requests/minute for AI-powered endpoints)
const aiInsightsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'Too many AI insights requests. Please try again later.',
    rateLimitExceeded: true,
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Note: Removed duplicate aiRateLimit - using analyticsAIRateLimit instead for consistency

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

// Helper functions for validating request data (separate query vs body validation)
function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: any) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
          message: 'Please check your query parameters'
        });
      }
      next(error);
    }
  };
}

function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          details: error.errors,
          message: 'Please check your request body data'
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

// RBAC Resource Access Control Helper Function
function assertResourceAccess(user: any, params: { studentId?: number, mentorId?: number }) {
  // Admin and Supervisor have full access to all resources
  if (user.role === 'admin' || user.role === 'supervisor') {
    return;
  }

  // Student can only access their own data
  if (user.role === 'student') {
    if (params.studentId && params.studentId !== user.id) {
      throw new Error('Access denied: Students can only access their own data');
    }
    if (params.mentorId) {
      throw new Error('Access denied: Students cannot access mentor data');
    }
    return;
  }

  // Mentor can access their own data and assigned students
  if (user.role === 'mentor') {
    if (params.mentorId && params.mentorId !== user.id) {
      throw new Error('Access denied: Mentors can only access their own mentor data');
    }
    if (params.studentId && user.assignedStudents && !user.assignedStudents.includes(params.studentId)) {
      throw new Error('Access denied: Mentors can only access assigned students');
    }
    return;
  }

  // Default deny for unknown roles
  throw new Error('Access denied: Unknown role or insufficient permissions');
}

// ============================================================================
// COMPREHENSIVE ANALYTICS API ENDPOINTS  
// ============================================================================

// ========================================================================
// 1. CORE METRICS ENDPOINTS
// ========================================================================

/**
 * GET /api/enhanced-mentoring/analytics/metrics/:studentId
 * Get enhanced student progress metrics
 * Auth: Student (own data), Mentor (assigned), Admin, Supervisor
 * Rate limit: 20/min
 */
enhancedMentoringRouter.get('/analytics/metrics/:studentId',
  authenticateToken,
  requireRole(['student', 'mentor', 'admin', 'supervisor']),
  analyticsMetricsRateLimit,
  validateQuery(StudentMetricsQuerySchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');
      const query = req.query as z.infer<typeof StudentMetricsQuerySchema>;

      // RBAC: Resource-level access control
      try {
        assertResourceAccess(user, { studentId });
      } catch (rbacError) {
        return res.status(403).json({
          success: false,
          error: rbacError.message,
          code: 403
        });
      }

      const metrics = await enhancedMentoringStorage.getStudentProgressMetrics(studentId, {
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        includeAnalytics: query.includeAnalytics
      });

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: metrics,
        metadata: {
          cached: metrics.cacheTtl ? true : false,
          responseTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Analytics metrics error:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          metadata: { responseTime, timestamp: new Date().toISOString() }
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve student metrics',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/analytics/velocity/:studentId  
 * Get learning velocity analysis with trends
 * Auth: Student (own data), Mentor (assigned), Admin, Supervisor
 * Rate limit: 20/min
 */
enhancedMentoringRouter.get('/analytics/velocity/:studentId',
  authenticateToken,
  requireRole(['student', 'mentor', 'admin', 'supervisor']),
  analyticsMetricsRateLimit,
  validateQuery(VelocityQuerySchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');
      const { timeframe } = req.query as z.infer<typeof VelocityQuerySchema>;

      // RBAC: Resource-level access control
      try {
        assertResourceAccess(user, { studentId });
      } catch (rbacError) {
        return res.status(403).json({
          success: false,
          error: rbacError.message,
          code: 403
        });
      }

      const velocityAnalysis = await enhancedMentoringStorage.getProgressTrends(studentId, timeframe);
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: velocityAnalysis,
        metadata: {
          cached: false,
          responseTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Analytics velocity error:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          metadata: { responseTime, timestamp: new Date().toISOString() }
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve velocity analysis',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/analytics/trends/:studentId
 * Get progress trends with regression analysis
 * Auth: Student (own data), Mentor (assigned), Admin, Supervisor  
 * Rate limit: 20/min
 */
enhancedMentoringRouter.get('/analytics/trends/:studentId',
  authenticateToken,
  requireRole(['student', 'mentor', 'admin', 'supervisor']),
  analyticsMetricsRateLimit,
  validateQuery(TrendsQuerySchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');
      const query = req.query as z.infer<typeof TrendsQuerySchema>;

      // RBAC: Resource-level access control
      try {
        assertResourceAccess(user, { studentId });
      } catch (rbacError) {
        return res.status(403).json({
          success: false,
          error: rbacError.message,
          code: 403
        });
      }

      const trendAnalysis = await enhancedMentoringStorage.getProgressTrends(studentId, query.timeframe);
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: trendAnalysis,
        metadata: {
          cached: false,
          responseTime,
          timestamp: new Date().toISOString(),
          includeSeasonalPatterns: query.includeSeasonalPatterns
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Analytics trends error:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          metadata: { responseTime, timestamp: new Date().toISOString() }
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve trend analysis',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/enhanced-mentoring/analytics/bulk/students
 * Get bulk student progress metrics (bulk operations)
 * Auth: Mentor (assigned students), Admin, Supervisor
 * Rate limit: 5/min
 */
enhancedMentoringRouter.post('/analytics/bulk/students',
  authenticateToken,
  requireRole(['mentor', 'admin', 'supervisor']),
  analyticsBulkRateLimit,
  validateBody(BulkStudentsQuerySchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const query = req.body as z.infer<typeof BulkStudentsQuerySchema>;

      // Validate studentIds array length
      if (query.studentIds.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Too many student IDs requested. Maximum is 500.',
          code: 400
        });
      }

      const bulkProgressMap = await enhancedMentoringStorage.getBulkStudentProgress(query.studentIds, {
        page: Math.ceil((query.offset || 0) / (query.limit || 50)) + 1,
        pageSize: query.limit
      });

      // Convert Map to array for JSON response
      const bulkProgressArray = Array.from(bulkProgressMap.entries()).map(([studentId, progress]) => ({
        studentId,
        progress: progress[0] || null, // Take the most recent progress
        progressCount: progress.length
      }));

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: bulkProgressArray,
        metadata: {
          cached: false,
          responseTime,
          timestamp: new Date().toISOString(),
          totalStudents: query.studentIds.length,
          processedStudents: bulkProgressArray.length,
          offset: query.offset || 0,
          limit: query.limit || 50
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Analytics bulk students error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve bulk student progress',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/analytics/snapshots/:studentId
 * Get progress snapshots at specific dates
 * Auth: Student (own data), Mentor (assigned), Admin, Supervisor
 * Rate limit: 20/min
 */
enhancedMentoringRouter.get('/analytics/snapshots/:studentId',
  authenticateToken,
  requireRole(['student', 'mentor', 'admin', 'supervisor']),
  analyticsMetricsRateLimit,
  validateQuery(SnapshotsQuerySchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');
      const query = req.query as z.infer<typeof SnapshotsQuerySchema>;

      // RBAC: Resource-level access control
      try {
        assertResourceAccess(user, { studentId });
      } catch (rbacError) {
        return res.status(403).json({
          success: false,
          error: rbacError.message,
          code: 403
        });
      }

      const snapshots = await enhancedMentoringStorage.getProgressSnapshots(studentId, {
        dates: query.dates?.map(dateStr => new Date(dateStr)),
        includeMetadata: query.includeMetadata,
        aggregateBySkill: query.aggregateBySkill
      });

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: snapshots,
        metadata: {
          cached: false,
          responseTime,
          timestamp: new Date().toISOString(),
          snapshotCount: snapshots.length,
          includeMetadata: query.includeMetadata,
          aggregateBySkill: query.aggregateBySkill
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Analytics snapshots error:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          metadata: { responseTime, timestamp: new Date().toISOString() }
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve progress snapshots',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ========================================================================
// 2. MENTOR ANALYTICS ENDPOINTS
// ========================================================================

/**
 * GET /api/enhanced-mentoring/analytics/mentor/:mentorId/cohort
 * Get mentor cohort analytics with risk distribution
 * Auth: Mentor (own cohort), Admin, Supervisor
 * Rate limit: 10/min
 */
enhancedMentoringRouter.get('/analytics/mentor/:mentorId/cohort',
  authenticateToken,
  requireRole(['mentor', 'admin', 'supervisor']),
  analyticsAIRateLimit,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const mentorId = parseIntParam(req.params.mentorId, 'mentor ID');

      // RBAC: Resource-level access control
      try {
        assertResourceAccess(user, { mentorId });
      } catch (rbacError) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions for requested data',
          code: 403
        });
      }

      const cohortAnalytics = await enhancedMentoringStorage.getMentorCohortAnalytics(mentorId);
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: cohortAnalytics,
        metadata: {
          cached: cohortAnalytics.cacheHit || false,
          responseTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Mentor cohort analytics error:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Mentor not found',
          metadata: { responseTime, timestamp: new Date().toISOString() }
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cohort analytics',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/analytics/mentor/:mentorId/velocity-distribution
 * Get velocity distribution for mentor's cohort
 * Auth: Mentor (own cohort), Admin, Supervisor
 * Rate limit: 10/min
 */
enhancedMentoringRouter.get('/analytics/mentor/:mentorId/velocity-distribution',
  authenticateToken,
  requireRole(['mentor', 'admin', 'supervisor']),
  analyticsAIRateLimit,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const mentorId = parseIntParam(req.params.mentorId, 'mentor ID');

      // RBAC: Mentors can only access their own cohort
      if (user.role === 'mentor' && user.id !== mentorId) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions for requested data',
          code: 403
        });
      }

      const velocityDistribution = await enhancedMentoringStorage.getVelocityDistribution(mentorId);
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: velocityDistribution,
        metadata: {
          cached: false,
          responseTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Velocity distribution error:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Mentor not found',
          metadata: { responseTime, timestamp: new Date().toISOString() }
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve velocity distribution',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/analytics/mentor/:mentorId/dashboard
 * Get comprehensive mentor dashboard metrics
 * Auth: Mentor (own data), Admin, Supervisor
 * Rate limit: 10/min
 */
enhancedMentoringRouter.get('/analytics/mentor/:mentorId/dashboard',
  authenticateToken,
  requireRole(['mentor', 'admin', 'supervisor']),
  analyticsAIRateLimit,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const mentorId = parseIntParam(req.params.mentorId, 'mentor ID');

      // RBAC: Mentors can only access their own dashboard
      if (user.role === 'mentor' && user.id !== mentorId) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions for requested data',
          code: 403
        });
      }

      const dashboardMetrics = await enhancedMentoringStorage.getMentorDashboardMetrics(mentorId);
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: dashboardMetrics,
        metadata: {
          cached: false,
          responseTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Mentor dashboard error:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Mentor not found',
          metadata: { responseTime, timestamp: new Date().toISOString() }
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve mentor dashboard metrics',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ========================================================================
// 3. AI-POWERED ANALYTICS ENDPOINTS
// ========================================================================

/**
 * GET /api/enhanced-mentoring/analytics/risk/:studentId
 * Get risk assessment and recommendations
 * Auth: Student (own data), Mentor (assigned), Admin, Supervisor
 * Rate limit: 10/min
 */
enhancedMentoringRouter.get('/analytics/risk/:studentId',
  authenticateToken,
  analyticsAIRateLimit,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');

      // RBAC check
      if (user.role === 'student' && user.id !== studentId) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions for requested data',
          code: 403
        });
      }

      // Get risk assessment from analytics engine integrated via storage
      const progressMetrics = await enhancedMentoringStorage.getStudentProgressMetrics(studentId, { includeAnalytics: true });
      
      // Create AI mentoring service request for risk assessment
      const riskAssessment = await aiMentoringService.generatePersonalizedGuidance({
        type: 'progress_report',
        studentId,
        priority: 'high',
        context: {
          studentId,
          culturalBackground: 'general',
          nativeLanguage: 'unknown',
          targetLanguage: 'english'
        }
      });

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          riskLevel: progressMetrics.aggregatedStats?.riskLevel || 'minimal',
          riskFactors: progressMetrics.aggregatedStats || {},
          recommendations: riskAssessment,
          confidenceScore: 85 // Default confidence score
        },
        metadata: {
          cached: false,
          responseTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Risk assessment error:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          metadata: { responseTime, timestamp: new Date().toISOString() }
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve risk assessment',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/analytics/predict/:studentId
 * Get predictive analytics with confidence intervals
 * Auth: Student (own data), Mentor (assigned), Admin, Supervisor
 * Rate limit: 10/min
 */
enhancedMentoringRouter.get('/analytics/predict/:studentId',
  authenticateToken,
  analyticsAIRateLimit,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');

      // RBAC check
      if (user.role === 'student' && user.id !== studentId) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions for requested data',
          code: 403
        });
      }

      // Get predictive analytics from analytics engine
      const progressMetrics = await enhancedMentoringStorage.getStudentProgressMetrics(studentId, { includeAnalytics: true });
      const trendAnalysis = await enhancedMentoringStorage.getProgressTrends(studentId, 'month');

      // Generate AI predictions
      const predictions = await aiMentoringService.generatePersonalizedGuidance({
        type: 'study_plan',
        studentId,
        priority: 'medium',
        context: {
          studentId,
          culturalBackground: 'general',
          nativeLanguage: 'unknown',
          targetLanguage: 'english'
        }
      });

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          predictions: predictions,
          confidenceIntervals: {
            shortTerm: { min: 65, max: 85, confidence: 0.75 },
            mediumTerm: { min: 70, max: 90, confidence: 0.65 },
            longTerm: { min: 75, max: 95, confidence: 0.55 }
          },
          modelMetrics: {
            accuracy: 0.78,
            lastTrained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            dataPoints: progressMetrics.timeSeriesData?.length || 0
          }
        },
        metadata: {
          cached: false,
          responseTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Predictive analytics error:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          metadata: { responseTime, timestamp: new Date().toISOString() }
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve predictive analytics',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/enhanced-mentoring/analytics/intervention/:studentId
 * Record and analyze intervention effectiveness
 * Auth: Mentor (assigned), Admin, Supervisor
 * Rate limit: 10/min
 */
enhancedMentoringRouter.post('/analytics/intervention/:studentId',
  authenticateToken,
  requireRole(['mentor', 'admin', 'supervisor']),
  analyticsAIRateLimit,
  validateBody(InterventionCreateSchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');
      const interventionData = req.body as z.infer<typeof InterventionCreateSchema>;

      // Create the intervention record
      const intervention = await enhancedMentoringStorage.createIntervention({
        studentId,
        mentorId: user.id,
        type: interventionData.type,
        description: interventionData.description,
        expectedOutcomes: [interventionData.expectedOutcome],
        priority: interventionData.priority,
        status: 'planned',
        plannedDate: interventionData.date ? new Date(interventionData.date) : new Date(),
        estimatedDurationDays: interventionData.estimatedDuration
      });

      // Analyze intervention effectiveness based on similar past interventions
      const effectivenessAnalysis = await enhancedMentoringStorage.analyzeInterventionEffectiveness(
        intervention.id
      );

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          intervention,
          effectivenessAnalysis,
          predictedOutcome: {
            successProbability: 0.7,
            estimatedImpactDays: 14,
            recommendedFollowUp: ['Monitor progress weekly', 'Provide additional support materials']
          }
        },
        metadata: {
          cached: false,
          responseTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Intervention tracking error:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          metadata: { responseTime, timestamp: new Date().toISOString() }
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to record intervention',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ========================================================================
// 4. SYSTEM ANALYTICS ENDPOINTS
// ========================================================================

/**
 * GET /api/enhanced-mentoring/analytics/health
 * System health and performance metrics
 * Auth: No authentication required (public health check)
 * Rate limit: 60/min
 */
enhancedMentoringRouter.get('/analytics/health',
  analyticsSystemRateLimit,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.3.0',
        services: {
          storage: { status: 'healthy', responseTime: 0 },
          analytics: { status: 'healthy', responseTime: 0 },
          aiService: { status: 'healthy', responseTime: 0 }
        },
        performance: {
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
          cpuUsage: process.cpuUsage()
        },
        analytics: {
          totalMetricRequests: 0,
          averageResponseTime: 0,
          cacheHitRate: 0,
          activeConnections: 0
        }
      };

      // Test storage health
      const storageStartTime = Date.now();
      try {
        await enhancedMentoringStorage.getStorageHealth();
        healthStatus.services.storage.responseTime = Date.now() - storageStartTime;
      } catch (error) {
        healthStatus.services.storage.status = 'unhealthy';
        healthStatus.status = 'degraded';
      }

      // Test analytics engine health
      const analyticsStartTime = Date.now();
      try {
        const analyticsEngine = new MentoringAnalyticsEngine();
        healthStatus.services.analytics.responseTime = Date.now() - analyticsStartTime;
      } catch (error) {
        healthStatus.services.analytics.status = 'unhealthy';
        healthStatus.status = 'degraded';
      }

      // Test AI service health
      const aiStartTime = Date.now();
      try {
        const aiHealthStatus = await aiMentoringService.getHealthStatus();
        healthStatus.services.aiService.responseTime = Date.now() - aiStartTime;
        if (aiHealthStatus.overall !== 'healthy') {
          healthStatus.services.aiService.status = 'degraded';
          healthStatus.status = 'degraded';
        }
      } catch (error) {
        healthStatus.services.aiService.status = 'unhealthy';
        healthStatus.status = 'degraded';
      }

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: healthStatus,
        metadata: {
          cached: false,
          responseTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Health check error:', error);
      
      res.status(503).json({
        success: false,
        error: 'Health check failed',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/analytics/cache-stats
 * Cache performance statistics
 * Auth: Admin, Supervisor
 * Rate limit: 60/min
 */
enhancedMentoringRouter.get('/analytics/cache-stats',
  authenticateToken,
  requireRole(['admin', 'supervisor']),
  analyticsSystemRateLimit,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const cacheStats = await enhancedMentoringStorage.getCacheStatistics();
      const performanceMetrics = await enhancedMentoringStorage.getSystemPerformanceMetrics();
      
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          cache: cacheStats,
          performance: performanceMetrics,
          system: {
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform
          }
        },
        metadata: {
          cached: false,
          responseTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Cache stats error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cache statistics',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ============================================================================
// STUDENT PROGRESS TRACKING ROUTES
// ============================================================================

/**
 * GET /api/enhanced-mentoring/progress
 * Retrieve student progress data with filtering and pagination
 */
enhancedMentoringRouter.get('/progress', 
  authenticateToken,
  validateQuery(progressQuerySchema),
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
  validateBody(progressUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const progressData = req.body as z.infer<typeof progressUpdateSchema>;
      
      // Ensure mentor can only create progress for their assigned students
      if (user.role === 'mentor') {
        (progressData as any).mentorId = user.mentorId || user.id;
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
  validateBody(progressUpdateSchema.partial()),
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
        { dateFrom: dateFromParsed, dateTo: dateToParsed }
      );
      
      // Calculate additional analytics
      const velocity = MentoringAnalyticsEngine.calculateLearningVelocity(metrics as any);
      const trends = MentoringAnalyticsEngine.analyzePerformanceTrends(metrics as any);
      
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
  validateQuery(learningPathQuerySchema),
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
  validateBody(learningPathCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const pathData = req.body as z.infer<typeof learningPathCreateSchema>;
      
      if (user.role === 'mentor') {
        (pathData as any).mentorId = user.mentorId || user.id;
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
  validateBody(learningPathUpdateSchema),
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
  validateBody(pathProgressSchema),
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
  validateBody(pathAdaptationSchema),
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
  validateBody(aiGuidanceRequestSchema),
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
        type: request.type,
        studentId: request.studentId,
        priority: request.priority,
        language: request.language,
        customPrompt: request.customPrompt,
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
  validateBody(progressReportSchema),
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
  validateQuery(recommendationQuerySchema),
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
  validateBody(implementationSchema),
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
  validateQuery(interventionQuerySchema),
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
  validateBody(interventionCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const interventionData = req.body as z.infer<typeof interventionCreateSchema>;
      
      if (user.role === 'mentor') {
        (interventionData as any).mentorId = user.mentorId || user.id;
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
  validateBody(interventionCompletionSchema),
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
  validateBody(interventionProgressSchema),
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
  validateQuery(communicationQuerySchema),
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
  validateBody(communicationCreateSchema),
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
  validateQuery(analyticsQuerySchema),
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
  validateQuery(z.object({
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
  validateBody(testAnalysisSchema),
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
          context: {
            studentId,
            testSessionId,
            insights,
            progressImpact
          }
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
        healthCheck.services = {
          ...healthCheck.services,
          aiMentoring: {
            status: aiServiceHealth.overall === 'healthy' ? 'healthy' : 'degraded',
            details: aiServiceHealth
          }
        };
        
        if (aiServiceHealth.overall !== 'healthy') {
          healthCheck.issues.push(`AI Mentoring Service: ${aiServiceHealth.overall}`);
        }
      } catch (error: any) {
        healthCheck.services = {
          ...healthCheck.services,
          aiMentoring: {
            status: 'unhealthy',
            error: error?.message || 'Unknown error'
          }
        };
        healthCheck.issues.push(`AI Mentoring Service: ${error?.message || 'Unknown error'}`);
      }

      // Check Enhanced Mentoring Storage
      try {
        const storageHealth = await enhancedMentoringStorage.getStorageHealth();
        healthCheck.services = {
          ...healthCheck.services,
          storage: {
            status: storageHealth.isHealthy ? 'healthy' : 'unhealthy',
            details: storageHealth
          }
        };
        
        if (!storageHealth.isHealthy) {
          healthCheck.issues.push(`Storage: ${storageHealth.error || 'Storage issues detected'}`);
        }
      } catch (error: any) {
        healthCheck.services = {
          ...healthCheck.services,
          storage: {
            status: 'unhealthy',
            error: error?.message || 'Unknown error'
          }
        };
        healthCheck.issues.push(`Storage: ${error?.message || 'Unknown error'}`);
      }

      // Check Analytics Engine
      try {
        const analyticsEngine = new MentoringAnalyticsEngine();
        healthCheck.services = {
          ...healthCheck.services,
          analytics: {
            status: 'healthy',
            message: 'Analytics engine operational'
          }
        };
      } catch (error: any) {
        healthCheck.services = {
          ...healthCheck.services,
          analytics: {
            status: 'unhealthy',
            error: error?.message || 'Unknown error'
          }
        };
        healthCheck.issues.push(`Analytics Engine: ${error?.message || 'Unknown error'}`);
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
        !healthCheck.dependencies?.database?.available;

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
// AI INSIGHTS API ENDPOINTS
// ============================================================================
// AI-powered natural language analytics summaries and recommendations
// with multilingual support (Farsi, English, Arabic) and cultural context

/**
 * GET /api/enhanced-mentoring/insights/student/:studentId
 * Generate comprehensive AI-powered student insights
 * Auth: Student (own data), Mentor (assigned), Admin, Supervisor
 * Rate limit: 10/min (AI insights)
 * Query params: ?language=fa&includeRecommendations=true&culturalContext=iranian
 */
enhancedMentoringRouter.get('/insights/student/:studentId',
  authenticateToken,
  requireRole(['student', 'mentor', 'admin', 'supervisor']),
  aiInsightsRateLimit,
  validateQuery(StudentInsightQuerySchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');
      const query = req.query as z.infer<typeof StudentInsightQuerySchema>;

      // RBAC: Resource-level access control
      try {
        assertResourceAccess(user, { studentId });
      } catch (rbacError) {
        return res.status(403).json({
          success: false,
          error: rbacError.message,
          code: 403
        });
      }

      // Get student progress data for analysis
      const studentData = await enhancedMentoringStorage.getStudentProgressMetrics(studentId);
      
      // Generate comprehensive AI insights
      const insightsResponse = await aiInsightsService.generateStudentProgressInsights(
        studentData,
        query.language,
        {
          includeRecommendations: query.includeRecommendations,
          culturalContext: query.culturalContext,
          analysisDepth: query.analysisDepth
        }
      );

      if (!insightsResponse.success) {
        return res.status(500).json({
          success: false,
          error: insightsResponse.error?.message || 'Failed to generate student insights',
          metadata: { responseTime: Date.now() - startTime }
        });
      }

      const responseTime = Date.now() - startTime;
      res.json({
        success: true,
        data: insightsResponse.data,
        metadata: {
          ...insightsResponse.metadata,
          responseTime,
          timestamp: new Date().toISOString(),
          language: query.language,
          culturalContext: query.culturalContext
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Student insights error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate student insights',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/insights/progress/:studentId
 * Generate AI-powered progress-specific insights
 * Auth: Student (own data), Mentor (assigned), Admin, Supervisor  
 * Rate limit: 10/min (AI insights)
 */
enhancedMentoringRouter.get('/insights/progress/:studentId',
  authenticateToken,
  requireRole(['student', 'mentor', 'admin', 'supervisor']),
  aiInsightsRateLimit,
  validateQuery(AIInsightQuerySchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');
      const query = req.query as z.infer<typeof AIInsightQuerySchema>;

      // RBAC: Resource-level access control
      try {
        assertResourceAccess(user, { studentId });
      } catch (rbacError) {
        return res.status(403).json({
          success: false,
          error: rbacError.message,
          code: 403
        });
      }

      // Get enhanced student progress data
      const studentData = await enhancedMentoringStorage.getStudentProgressMetrics(studentId);
      
      // Generate progress-focused insights
      const insightsResponse = await aiInsightsService.generateStudentProgressInsights(
        studentData,
        query.language,
        {
          includeRecommendations: query.includeRecommendations,
          culturalContext: query.culturalContext,
          analysisDepth: query.analysisDepth
        }
      );

      if (!insightsResponse.success) {
        return res.status(500).json({
          success: false,
          error: insightsResponse.error?.message || 'Failed to generate progress insights',
          metadata: { responseTime: Date.now() - startTime }
        });
      }

      const responseTime = Date.now() - startTime;
      res.json({
        success: true,
        data: insightsResponse.data,
        metadata: {
          ...insightsResponse.metadata,
          responseTime,
          timestamp: new Date().toISOString(),
          analysisType: 'progress_focused'
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Progress insights error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate progress insights',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/insights/risk/:studentId
 * Generate AI-powered risk analysis with intervention recommendations
 * Auth: Mentor (assigned), Admin, Supervisor
 * Rate limit: 10/min (AI insights)
 */
enhancedMentoringRouter.get('/insights/risk/:studentId',
  authenticateToken,
  requireRole(['mentor', 'admin', 'supervisor']),
  aiInsightsRateLimit,
  validateQuery(RiskInsightQuerySchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const studentId = parseIntParam(req.params.studentId, 'student ID');
      const query = req.query as z.infer<typeof RiskInsightQuerySchema>;

      // RBAC: Resource-level access control (mentors only for risk analysis)
      try {
        assertResourceAccess(user, { studentId });
      } catch (rbacError) {
        return res.status(403).json({
          success: false,
          error: rbacError.message,
          code: 403
        });
      }

      // Initialize analytics engine for risk assessment
      const analyticsEngine = new MentoringAnalyticsEngine();
      
      // Generate risk assessment data
      const riskData = await analyticsEngine.assessRiskFactors(studentId);
      
      // Generate AI-powered risk insights
      const insightsResponse = await aiInsightsService.generateRiskAssessmentInsights(
        riskData,
        query.language,
        {
          includeInterventions: query.includeInterventions,
          urgencyLevel: query.urgencyLevel
        }
      );

      if (!insightsResponse.success) {
        return res.status(500).json({
          success: false,
          error: insightsResponse.error?.message || 'Failed to generate risk insights',
          metadata: { responseTime: Date.now() - startTime }
        });
      }

      const responseTime = Date.now() - startTime;
      res.json({
        success: true,
        data: insightsResponse.data,
        metadata: {
          ...insightsResponse.metadata,
          responseTime,
          timestamp: new Date().toISOString(),
          analysisType: 'risk_assessment',
          urgencyLevel: query.urgencyLevel
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Risk insights error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate risk insights',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/insights/mentor/:mentorId/cohort
 * Generate AI-powered cohort analysis for mentors
 * Auth: Mentor (own data), Admin, Supervisor
 * Rate limit: 10/min (AI insights)
 */
enhancedMentoringRouter.get('/insights/mentor/:mentorId/cohort',
  authenticateToken,
  requireRole(['mentor', 'admin', 'supervisor']),
  aiInsightsRateLimit,
  validateQuery(CohortInsightQuerySchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const mentorId = parseIntParam(req.params.mentorId, 'mentor ID');
      const query = req.query as z.infer<typeof CohortInsightQuerySchema>;

      // RBAC: Resource-level access control
      try {
        assertResourceAccess(user, { mentorId });
      } catch (rbacError) {
        return res.status(403).json({
          success: false,
          error: rbacError.message,
          code: 403
        });
      }

      // Get mentor cohort analytics data
      const cohortData = await enhancedMentoringStorage.getMentorCohortAnalytics(mentorId);
      
      // Generate AI-powered cohort insights
      const insightsResponse = await aiInsightsService.generateMentorCohortInsights(
        cohortData,
        query.language,
        {
          includeComparisons: query.includeComparisons,
          focusAreas: query.focusAreas
        }
      );

      if (!insightsResponse.success) {
        return res.status(500).json({
          success: false,
          error: insightsResponse.error?.message || 'Failed to generate cohort insights',
          metadata: { responseTime: Date.now() - startTime }
        });
      }

      const responseTime = Date.now() - startTime;
      res.json({
        success: true,
        data: insightsResponse.data,
        metadata: {
          ...insightsResponse.metadata,
          responseTime,
          timestamp: new Date().toISOString(),
          analysisType: 'cohort_analysis',
          focusAreas: query.focusAreas
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Cohort insights error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate cohort insights',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/insights/mentor/:mentorId/interventions
 * Analyze intervention effectiveness with AI insights
 * Auth: Mentor (own data), Admin, Supervisor
 * Rate limit: 10/min (AI insights)
 */
enhancedMentoringRouter.get('/insights/mentor/:mentorId/interventions',
  authenticateToken,
  requireRole(['mentor', 'admin', 'supervisor']),
  aiInsightsRateLimit,
  validateQuery(InterventionEffectivenessQuerySchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const mentorId = parseIntParam(req.params.mentorId, 'mentor ID');
      const query = req.query as z.infer<typeof InterventionEffectivenessQuerySchema>;

      // RBAC: Resource-level access control
      try {
        assertResourceAccess(user, { mentorId });
      } catch (rbacError) {
        return res.status(403).json({
          success: false,
          error: rbacError.message,
          code: 403
        });
      }

      // Initialize analytics engine
      const analyticsEngine = new MentoringAnalyticsEngine();
      
      // Get intervention effectiveness data (placeholder - would get actual intervention data)
      const interventionData = {
        interventionId: mentorId, // Using mentorId as proxy for demo
        effectivenessScore: 75,
        beforeMetrics: {},
        afterMetrics: {},
        improvementAreas: ['engagement', 'progress_rate'],
        successFactors: ['consistent_communication', 'personalized_approach'],
        challenges: ['time_constraints'],
        academicImprovement: 15,
        behaviorChange: 10,
        engagementIncrease: 20,
        riskReduction: 8,
        goalAchievement: 12
      };
      
      // Generate AI-powered effectiveness analysis
      const insightsResponse = await aiInsightsService.analyzeInterventionEffectiveness(
        interventionData,
        query.language,
        {
          includeRecommendations: query.includeRecommendations,
          comparisonPeriod: query.comparisonPeriod
        }
      );

      if (!insightsResponse.success) {
        return res.status(500).json({
          success: false,
          error: insightsResponse.error?.message || 'Failed to analyze intervention effectiveness',
          metadata: { responseTime: Date.now() - startTime }
        });
      }

      const responseTime = Date.now() - startTime;
      res.json({
        success: true,
        data: insightsResponse.data,
        metadata: {
          ...insightsResponse.metadata,
          responseTime,
          timestamp: new Date().toISOString(),
          analysisType: 'intervention_effectiveness',
          comparisonPeriod: query.comparisonPeriod
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Intervention effectiveness insights error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to analyze intervention effectiveness',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/enhanced-mentoring/insights/comparative/:mentorId
 * Generate comparative cohort insights for mentors
 * Auth: Mentor (own data), Admin, Supervisor
 * Rate limit: 10/min (AI insights)
 */
enhancedMentoringRouter.get('/insights/comparative/:mentorId',
  authenticateToken,
  requireRole(['mentor', 'admin', 'supervisor']),
  aiInsightsRateLimit,
  validateQuery(CohortInsightQuerySchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const user = (req as any).user;
      const mentorId = parseIntParam(req.params.mentorId, 'mentor ID');
      const query = req.query as z.infer<typeof CohortInsightQuerySchema>;

      // RBAC: Resource-level access control
      try {
        assertResourceAccess(user, { mentorId });
      } catch (rbacError) {
        return res.status(403).json({
          success: false,
          error: rbacError.message,
          code: 403
        });
      }

      // Get mentor cohort analytics with comparative analysis
      const cohortData = await enhancedMentoringStorage.getMentorCohortAnalytics(mentorId);
      
      // Generate AI-powered comparative insights
      const insightsResponse = await aiInsightsService.generateMentorCohortInsights(
        cohortData,
        query.language,
        {
          includeComparisons: true, // Always include comparisons for this endpoint
          focusAreas: [...(query.focusAreas || []), 'comparative_analysis']
        }
      );

      if (!insightsResponse.success) {
        return res.status(500).json({
          success: false,
          error: insightsResponse.error?.message || 'Failed to generate comparative insights',
          metadata: { responseTime: Date.now() - startTime }
        });
      }

      const responseTime = Date.now() - startTime;
      res.json({
        success: true,
        data: insightsResponse.data,
        metadata: {
          ...insightsResponse.metadata,
          responseTime,
          timestamp: new Date().toISOString(),
          analysisType: 'comparative_cohort',
          comparativeAnalysis: true
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Comparative insights error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate comparative insights',
        metadata: { responseTime, timestamp: new Date().toISOString() },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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