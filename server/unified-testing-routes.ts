// ============================================================================
// UNIFIED TESTING SYSTEM API ROUTES
// ============================================================================
// REST API endpoints for the comprehensive unified testing system

import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import {
  insertUnifiedQuestionSchema,
  insertUnifiedTestTemplateSchema,
  insertUnifiedTestSessionSchema,
  insertUnifiedResponseSchema,
  insertEvaluationRuleSchema,
  insertAiGenerationTemplateSchema,
  QUESTION_TYPES,
  SKILLS,
  CEFR_LEVELS,
  TEST_TYPES,
  QuestionType,
  Skill,
  CEFRLevel,
  TestType
} from '@shared/unified-testing-schema';
import { 
  evaluateAnswer, 
  evaluateMultipleAnswers, 
  calculateOverallScore, 
  EvaluationContext
} from '@shared/evaluation-engine';
import { 
  assembleTest, 
  AdaptiveTestManager, 
  validateAssembledTest,
  AssemblyConfig,
  PRESET_TEMPLATES
} from '@shared/test-assembly-engine';
import { 
  generateQuestions, 
  generateQuestionBank,
  exportGeneratedQuestions,
  GenerationRequest
} from '@shared/ai-generation-engine';
import { IUnifiedTestingStorage } from './unified-testing-storage';

const router = express.Router();

// Get JWT_SECRET with appropriate fallback for development
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production' 
    ? (() => {
        console.error('❌ CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required in production');
        console.error('   Set JWT_SECRET environment variable before starting the application');
        console.error('   Example: export JWT_SECRET="your-secure-random-secret-key-here"');
        process.exit(1);
      })()
    : 'dev-fallback-secret-key-change-in-production'
);

if (process.env.NODE_ENV !== 'production' && !process.env.JWT_SECRET) {
  console.log('⚠️  Unified Testing Routes: Using development JWT_SECRET fallback');
}

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    req.user = {
      id: decoded.userId,
      email: decoded.email || 'user@test.com', 
      role: decoded.role || 'Student',
      firstName: decoded.firstName || 'User',
      lastName: decoded.lastName || 'Name',
      isActive: true
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Role-based authorization middleware
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(403).json({ message: 'User not authenticated' });
    }
    
    const userRole = req.user.role.toLowerCase();
    const normalizedRoles = roles.map(r => r.toLowerCase());
    
    const roleMapping: { [key: string]: string[] } = {
      'admin': ['admin'],
      'supervisor': ['supervisor'],
      'teacher': ['teacher', 'teacher/tutor', 'tutor'],
      'teacher/tutor': ['teacher', 'teacher/tutor', 'tutor'],
      'student': ['student'],
      'mentor': ['mentor'],
      'callcenter': ['callcenter', 'call center agent'],
      'call center agent': ['callcenter', 'call center agent'],
      'accountant': ['accountant']
    };
    
    const userRoleEquivalents = roleMapping[userRole] || [userRole];
    const hasPermission = userRoleEquivalents.some(role => 
      normalizedRoles.includes(role)
    );
    
    if (!hasPermission) {
      console.log(`Role check failed: User role '${req.user.role}' not in required roles [${roles.join(', ')}]`);
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

// ============================================================================
// QUESTION MANAGEMENT ENDPOINTS
// ============================================================================

// Get all questions with filtering
router.get('/questions', async (req, res) => {
  try {
    const {
      questionTypes,
      skills,
      cefrLevels,
      languages,
      tags,
      minQuality,
      createdBy,
      isActive,
      page = 1,
      limit = 20
    } = req.query;

    const criteria = {
      questionTypes: questionTypes ? (questionTypes as string).split(',') as QuestionType[] : undefined,
      skills: skills ? (skills as string).split(',') as Skill[] : undefined,
      cefrLevels: cefrLevels ? (cefrLevels as string).split(',') as CEFRLevel[] : undefined,
      languages: languages ? (languages as string).split(',') : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      minQuality: minQuality ? parseFloat(minQuality as string) : undefined,
      createdBy: createdBy ? parseInt(createdBy as string) : undefined,
      isActive: isActive ? isActive === 'true' : undefined,
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string)
    };

    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    const result = await storage.searchQuestions(criteria);

    res.json({
      questions: result.questions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get a specific question
router.get('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    const question = await storage.getQuestion(parseInt(id));

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// Create a new question
router.post('/questions', authenticateToken, requireRole(['Admin', 'Teacher', 'Supervisor']), async (req, res) => {
  try {
    const questionData = insertUnifiedQuestionSchema.parse(req.body);
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const question = await storage.createQuestion({
      ...questionData,
      createdBy: req.user.id
    });

    res.status(201).json(question);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid question data', details: error.errors });
    }
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Update a question
router.put('/questions/:id', authenticateToken, requireRole(['Admin', 'Teacher', 'Supervisor']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    const updatedQuestion = await storage.updateQuestion(parseInt(id), updates);

    if (!updatedQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete a question
router.delete('/questions/:id', authenticateToken, requireRole(['Admin', 'Supervisor']), async (req, res) => {
  try {
    const { id } = req.params;
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    await storage.deleteQuestion(parseInt(id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Bulk create questions
router.post('/questions/bulk', authenticateToken, requireRole(['Admin', 'Teacher', 'Supervisor']), async (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const validatedQuestions = questions.map((q: any) => 
      insertUnifiedQuestionSchema.parse({ ...q, createdBy: req.user.id })
    );
    
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    const createdQuestions = await storage.createMultipleQuestions(validatedQuestions);

    res.status(201).json({ 
      created: createdQuestions.length,
      questions: createdQuestions 
    });
  } catch (error) {
    console.error('Error bulk creating questions:', error);
    res.status(500).json({ error: 'Failed to create questions in bulk' });
  }
});

// ============================================================================
// TEST TEMPLATE ENDPOINTS
// ============================================================================

// Get all test templates
router.get('/templates', async (req, res) => {
  try {
    const { testType, isPublic } = req.query;
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    let templates;
    if (testType) {
      templates = await storage.getTestTemplatesByType(testType as TestType);
    } else if (isPublic === 'true') {
      templates = await storage.getPublicTestTemplates();
    } else {
      templates = await storage.getUserTestTemplates(req.user?.id || 1);
    }

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get preset templates
router.get('/templates/presets', async (req, res) => {
  try {
    res.json(PRESET_TEMPLATES);
  } catch (error) {
    console.error('Error fetching preset templates:', error);
    res.status(500).json({ error: 'Failed to fetch preset templates' });
  }
});

// Create a new test template
router.post('/templates', authenticateToken, requireRole(['Admin', 'Teacher', 'Supervisor']), async (req, res) => {
  try {
    const templateData = insertUnifiedTestTemplateSchema.parse(req.body);
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const template = await storage.createTestTemplate({
      ...templateData,
      createdBy: req.user.id
    });

    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid template data', details: error.errors });
    }
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// ============================================================================
// TEST SESSION ENDPOINTS
// ============================================================================

// Start a new test session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const { templateId, sessionType, overrides } = req.body;
    
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    // Get template
    const template = await storage.getTestTemplate(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Get available questions for this template
    const questionCriteria = {
      skills: template.targetSkills,
      cefrLevels: template.cefrLevelRange ? 
        CEFR_LEVELS.filter(level => 
          CEFR_LEVELS.indexOf(level) >= CEFR_LEVELS.indexOf(template.cefrLevelRange.min) &&
          CEFR_LEVELS.indexOf(level) <= CEFR_LEVELS.indexOf(template.cefrLevelRange.max)
        ) : undefined,
      languages: [template.targetLanguage],
      isActive: true
    };
    
    const { questions } = await storage.searchQuestions(questionCriteria);

    // Assemble the test
    const assemblyConfig: AssemblyConfig = {
      templateId,
      userId,
      sessionType: sessionType || template.testType,
      randomSeed: Date.now(),
      overrides
    };

    const assembledTest = await assembleTest(assemblyConfig, template, questions);
    
    // Validate assembled test
    const validation = validateAssembledTest(assembledTest);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Failed to assemble valid test', 
        details: validation.errors 
      });
    }

    // Create test session
    const sessionData = {
      userId,
      templateId,
      sessionType: sessionType || template.testType,
      assembledTest: {
        sections: assembledTest.sections.map(section => ({
          id: section.id,
          name: section.name,
          questionIds: section.questions.map(q => q.id),
          timeLimit: section.timeLimit,
          status: 'not_started' as const
        })),
        totalQuestions: assembledTest.totalQuestions,
        estimatedDuration: assembledTest.estimatedDuration
      },
      adaptiveState: assembledTest.adaptiveConfig ? {
        skillLevels: {},
        confidenceScores: {},
        adaptiveHistory: []
      } : undefined
    };

    const session = await storage.createTestSession(sessionData);

    res.status(201).json({
      session,
      assembledTest,
      validation: validation.warnings.length > 0 ? { warnings: validation.warnings } : undefined
    });
  } catch (error) {
    console.error('Error starting test session:', error);
    res.status(500).json({ error: 'Failed to start test session' });
  }
});

// Get test session
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    const session = await storage.getTestSession(parseInt(id));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user owns this session or has admin rights
    if (session.userId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Update test session (for progress, completion, etc.)
router.put('/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    const session = await storage.getTestSession(parseInt(id));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check ownership
    if (session.userId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedSession = await storage.updateTestSession(parseInt(id), updates);
    res.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// ============================================================================
// RESPONSE SUBMISSION AND EVALUATION ENDPOINTS
// ============================================================================

// Submit a response
router.post('/responses', async (req, res) => {
  try {
    const parsedData = insertUnifiedResponseSchema.parse(req.body);
    const responseData = parsedData as any; // Type assertion for property access
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    // Get the question for evaluation
    const question = await storage.getQuestion(responseData.questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Get the session to verify ownership
    const session = await storage.getTestSession(responseData.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId !== (req as any).user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Evaluate the response
    const evaluationContext: EvaluationContext = {
      question,
      userResponse: responseData.responseData,
      evaluationRules: question.evaluationRules,
      aiEnabled: true // Enable AI evaluation if available
    };

    const evaluationResult = await evaluateAnswer(evaluationContext);

    // Create the response with evaluation results
    const response = await storage.createResponse({
      ...parsedData,
      autoScore: evaluationResult.score,
      finalScore: evaluationResult.score,
      maxPossibleScore: question.maxScore,
      isCorrect: evaluationResult.isCorrect,
      evaluationDetails: {
        scoringMethod: question.scoringMethod,
        pointsBreakdown: evaluationResult.pointsBreakdown,
        correctParts: evaluationResult.correctParts,
        incorrectParts: evaluationResult.incorrectParts,
        feedback: evaluationResult.feedback,
        humanReviewRequired: evaluationResult.requiresManualReview
      },
      reviewStatus: evaluationResult.requiresManualReview ? 'pending_review' : 'auto_scored'
    });

    // Update question usage statistics
    await storage.updateQuestionUsageStats(
      question.id, 
      evaluationResult.isCorrect, 
      (responseData.timeSpent as number) || 0
    );

    res.status(201).json({
      response,
      evaluation: evaluationResult
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid response data', details: error.errors });
    }
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Bulk evaluate responses
router.post('/responses/bulk-evaluate', async (req, res) => {
  try {
    const { responseIds } = req.body;
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    const evaluationContexts: EvaluationContext[] = [];
    
    for (const responseId of responseIds) {
      const response = await storage.getResponse(responseId);
      if (response) {
        const question = await storage.getQuestion(response.questionId);
        if (question) {
          evaluationContexts.push({
            question,
            userResponse: response.responseData,
            evaluationRules: question.evaluationRules,
            aiEnabled: true
          });
        }
      }
    }

    const evaluationResults = await evaluateMultipleAnswers(evaluationContexts);
    
    res.json({
      evaluations: evaluationResults,
      overall: calculateOverallScore(evaluationResults)
    });
  } catch (error) {
    console.error('Error bulk evaluating responses:', error);
    res.status(500).json({ error: 'Failed to bulk evaluate responses' });
  }
});

// Get responses for a session
router.get('/sessions/:sessionId/responses', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    // Verify session ownership
    const session = await storage.getTestSession(parseInt(sessionId));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const responses = await storage.getSessionResponses(parseInt(sessionId));
    res.json(responses);
  } catch (error) {
    console.error('Error fetching session responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// ============================================================================
// AI GENERATION ENDPOINTS
// ============================================================================

// Generate questions using AI
router.post('/ai/generate-questions', async (req, res) => {
  try {
    const generationRequest: GenerationRequest = req.body;
    
    // Get AI templates
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    const templates = await storage.getAiGenerationTemplatesByType(generationRequest.questionType);
    
    const result = await generateQuestions(generationRequest, templates);
    
    res.json(result);
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// Generate a question bank
router.post('/ai/generate-bank', async (req, res) => {
  try {
    const { skill, cefrLevel, language, questionCounts } = req.body;
    
    const results = await generateQuestionBank(skill, cefrLevel, language, questionCounts);
    
    res.json({
      results,
      summary: {
        totalQuestions: results.reduce((sum, r) => sum + r.questions.length, 0),
        averageQuality: results.reduce((sum, r) => sum + r.metadata.qualityScore, 0) / results.length
      }
    });
  } catch (error) {
    console.error('Error generating question bank:', error);
    res.status(500).json({ error: 'Failed to generate question bank' });
  }
});

// ============================================================================
// ANALYTICS AND REPORTING ENDPOINTS
// ============================================================================

// Get system analytics
router.get('/analytics/system', async (req, res) => {
  try {
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    const analytics = await storage.getSystemAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    res.status(500).json({ error: 'Failed to fetch system analytics' });
  }
});

// Get user performance analytics
router.get('/analytics/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    // Check if user can access this data
    if (parseInt(userId) !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const analytics = await storage.getUserPerformanceAnalytics(parseInt(userId));
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Get question bank health
router.get('/analytics/question-bank-health', async (req, res) => {
  try {
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    const health = await storage.getQuestionBankHealth();
    res.json(health);
  } catch (error) {
    console.error('Error fetching question bank health:', error);
    res.status(500).json({ error: 'Failed to fetch question bank health' });
  }
});

// ============================================================================
// MIGRATION ENDPOINTS
// ============================================================================

// Get migration status
router.get('/migration/status', async (req, res) => {
  try {
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    const status = await storage.getMigrationStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching migration status:', error);
    res.status(500).json({ error: 'Failed to fetch migration status' });
  }
});

// Start migration from specific system
router.post('/migration/:system', async (req, res) => {
  try {
    const { system } = req.params;
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    let result;
    switch (system) {
      case 'placement-test':
        result = await storage.migrateFromPlacementTestSystem();
        break;
      case 'test-system':
        result = await storage.migrateFromTestSystem();
        break;
      case 'game-system':
        result = await storage.migrateFromGameSystem();
        break;
      case 'level-assessment':
        result = await storage.migrateFromLevelAssessmentSystem();
        break;
      default:
        return res.status(400).json({ error: 'Unknown system type' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error running migration:', error);
    res.status(500).json({ error: 'Failed to run migration' });
  }
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

// Get supported question types
router.get('/question-types', (req, res) => {
  res.json({
    questionTypes: Object.values(QUESTION_TYPES),
    skills: SKILLS,
    cefrLevels: CEFR_LEVELS,
    testTypes: Object.values(TEST_TYPES)
  });
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const storage: IUnifiedTestingStorage = req.app.get('unifiedTestingStorage');
    
    // Basic connectivity test
    const analytics = await storage.getSystemAnalytics();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      systemStats: {
        totalQuestions: analytics.totalQuestions,
        totalTemplates: analytics.totalTemplates,
        totalSessions: analytics.totalSessions
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;