// ============================================================================
// LEXI AI TEACHING ASSISTANT API ROUTES
// ============================================================================
// RESTful API endpoints for the Lexi AI teaching assistant functionality

import type { Express } from "express";
import express from "express";
import { lexiAIService } from "../services/lexi-ai-service";
import { z } from "zod";
import { db } from "../db";
import { 
  lexiConversations, 
  lexiMessages, 
  lexiRecommendations,
  lexiLearningAnalytics,
  lexiQuizzes,
  lexiQuizAttempts,
  insertLexiVoiceInteractionSchema,
  insertLexiLearningInteractionSchema
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const router = express.Router();

// Request validation schemas
const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.number().optional(),
  courseId: z.number().optional(),
  videoLessonId: z.number().optional(),
  videoTimestamp: z.number().optional(),
  sessionType: z.enum(['video_learning', 'general_chat', 'vocabulary', 'grammar', 'pronunciation']),
  language: z.string().default('en'),
  userLevel: z.string().optional(),
  culturalContext: z.string().optional(),
  contextData: z.any().optional()
});

const videoAnalysisRequestSchema = z.object({
  videoLessonId: z.number(),
  courseId: z.number().optional(),
  language: z.string(),
  analysisType: z.enum(['content_summary', 'vocabulary_extraction', 'grammar_points', 'cultural_context', 'full_analysis']),
  videoTranscript: z.string().optional(),
  videoUrl: z.string().optional()
});

const voiceInteractionSchema = z.object({
  conversationId: z.number().optional(),
  audioUrl: z.string().optional(),
  transcription: z.string(),
  targetText: z.string().optional(),
  language: z.string(),
  difficulty_level: z.string().optional()
});

// Middleware to ensure user authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// ============================================================================
// CHAT & CONVERSATION ENDPOINTS
// ============================================================================

// POST /api/lexi/chat - Main conversation endpoint
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const validatedData = chatRequestSchema.parse(req.body);
    
    const response = await lexiAIService.chat({
      ...validatedData,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Lexi chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// GET /api/lexi/conversation/:id - Retrieve conversation history
router.get('/conversation/:id', requireAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    
    // Get conversation details
    const conversation = await db.select()
      .from(lexiConversations)
      .where(and(
        eq(lexiConversations.id, conversationId),
        eq(lexiConversations.userId, req.user.id)
      ))
      .limit(1);

    if (!conversation.length) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const messages = await db.select()
      .from(lexiMessages)
      .where(eq(lexiMessages.conversationId, conversationId))
      .orderBy(lexiMessages.createdAt);

    res.json({
      success: true,
      data: {
        conversation: conversation[0],
        messages
      }
    });

  } catch (error) {
    console.error('❌ Get conversation error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
});

// GET /api/lexi/conversations - List user's conversations
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const conversations = await db.select()
      .from(lexiConversations)
      .where(eq(lexiConversations.userId, req.user.id))
      .orderBy(desc(lexiConversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    const total = await db.select({ count: sql<number>`count(*)` })
      .from(lexiConversations)
      .where(eq(lexiConversations.userId, req.user.id));

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page,
          limit,
          total: total[0].count,
          totalPages: Math.ceil(total[0].count / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ List conversations error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
});

// POST /api/lexi/analyze-video - Video content analysis
router.post('/analyze-video', requireAuth, async (req, res) => {
  try {
    const validatedData = videoAnalysisRequestSchema.parse(req.body);
    
    const analysis = await lexiAIService.analyzeVideo(validatedData);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('❌ Video analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze video content',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// POST /api/lexi/explain - Explain specific concepts
router.post('/explain', requireAuth, async (req, res) => {
  try {
    const { concept, context, language, level } = req.body;

    if (!concept) {
      return res.status(400).json({ error: 'Concept is required' });
    }

    // Use the chat service to explain the concept
    const response = await lexiAIService.chat({
      message: `Please explain: ${concept}`,
      userId: req.user.id,
      sessionType: 'general_chat',
      language: language || 'en',
      userLevel: level,
      contextData: { explainMode: true, context }
    });

    res.json({
      success: true,
      data: {
        explanation: response.response,
        relatedConcepts: response.relatedConcepts,
        suggestions: response.suggestions
      }
    });

  } catch (error) {
    console.error('❌ Explain concept error:', error);
    res.status(500).json({ error: 'Failed to explain concept' });
  }
});

// ============================================================================
// LEARNING FEATURES ENDPOINTS
// ============================================================================

// POST /api/lexi/vocabulary - Vocabulary assistance
router.post('/vocabulary', requireAuth, async (req, res) => {
  try {
    const { word, context, language, level } = req.body;

    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const response = await lexiAIService.chat({
      message: `Explain the word "${word}" in detail, including pronunciation, meaning, usage, and examples.${context ? ` Context: ${context}` : ''}`,
      userId: req.user.id,
      sessionType: 'vocabulary',
      language: language || 'en',
      userLevel: level,
      contextData: { vocabularyMode: true, word, context }
    });

    res.json({
      success: true,
      data: {
        word,
        explanation: response.response,
        relatedConcepts: response.relatedConcepts,
        suggestions: response.suggestions
      }
    });

  } catch (error) {
    console.error('❌ Vocabulary assistance error:', error);
    res.status(500).json({ error: 'Failed to provide vocabulary assistance' });
  }
});

// POST /api/lexi/grammar - Grammar explanations
router.post('/grammar', requireAuth, async (req, res) => {
  try {
    const { concept, example, language, level } = req.body;

    if (!concept) {
      return res.status(400).json({ error: 'Grammar concept is required' });
    }

    const response = await lexiAIService.chat({
      message: `Explain the grammar concept "${concept}" with clear examples and usage rules.${example ? ` Example: ${example}` : ''}`,
      userId: req.user.id,
      sessionType: 'grammar',
      language: language || 'en',
      userLevel: level,
      contextData: { grammarMode: true, concept, example }
    });

    res.json({
      success: true,
      data: {
        concept,
        explanation: response.response,
        relatedConcepts: response.relatedConcepts,
        suggestions: response.suggestions
      }
    });

  } catch (error) {
    console.error('❌ Grammar explanation error:', error);
    res.status(500).json({ error: 'Failed to provide grammar explanation' });
  }
});

// POST /api/lexi/pronunciation - Pronunciation guides
router.post('/pronunciation', requireAuth, async (req, res) => {
  try {
    const { text, language, level } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for pronunciation guide' });
    }

    const response = await lexiAIService.chat({
      message: `Provide pronunciation guidance for "${text}" including phonetic transcription, mouth positioning, and practice tips.`,
      userId: req.user.id,
      sessionType: 'pronunciation',
      language: language || 'en',
      userLevel: level,
      contextData: { pronunciationMode: true, text }
    });

    res.json({
      success: true,
      data: {
        text,
        pronunciationGuide: response.response,
        suggestions: response.suggestions
      }
    });

  } catch (error) {
    console.error('❌ Pronunciation guide error:', error);
    res.status(500).json({ error: 'Failed to provide pronunciation guide' });
  }
});

// POST /api/lexi/voice-interaction - Voice interaction endpoint
router.post('/voice-interaction', requireAuth, async (req, res) => {
  try {
    const validatedData = voiceInteractionSchema.parse(req.body);
    
    // Log voice interaction in database
    await db.insert(insertLexiVoiceInteractionSchema).values({
      userId: req.user.id,
      conversationId: validatedData.conversationId,
      transcription: validatedData.transcription,
      targetText: validatedData.targetText,
      language: validatedData.language,
      difficulty_level: validatedData.difficulty_level
    });

    // Process with chat service for voice-specific response
    const response = await lexiAIService.chat({
      message: `Voice input: "${validatedData.transcription}"${validatedData.targetText ? ` (Target: "${validatedData.targetText}")` : ''}`,
      userId: req.user.id,
      sessionType: 'pronunciation',
      language: validatedData.language,
      contextData: { 
        voiceMode: true, 
        transcription: validatedData.transcription,
        targetText: validatedData.targetText
      }
    });

    res.json({
      success: true,
      data: {
        transcription: validatedData.transcription,
        response: response.response,
        feedback: response.metadata,
        suggestions: response.suggestions
      }
    });

  } catch (error) {
    console.error('❌ Voice interaction error:', error);
    res.status(500).json({ error: 'Failed to process voice interaction' });
  }
});

// POST /api/lexi/quiz-generate - Generate quizzes from content
router.post('/quiz-generate', requireAuth, async (req, res) => {
  try {
    const { videoLessonId, quizType, difficulty } = req.body;

    if (!videoLessonId) {
      return res.status(400).json({ error: 'Video lesson ID is required' });
    }

    const quiz = await lexiAIService.generateQuizFromVideo(
      req.user.id,
      videoLessonId,
      quizType || 'comprehension'
    );

    res.json({
      success: true,
      data: quiz
    });

  } catch (error) {
    console.error('❌ Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// ============================================================================
// ANALYTICS & PROGRESS ENDPOINTS
// ============================================================================

// GET /api/lexi/learning-stats - Learning analytics
router.get('/learning-stats', requireAuth, async (req, res) => {
  try {
    const timeframe = req.query.timeframe as 'day' | 'week' | 'month' || 'week';
    
    const stats = await lexiAIService.getLearningStats(req.user.id, timeframe);

    res.json({
      success: true,
      data: {
        timeframe,
        stats
      }
    });

  } catch (error) {
    console.error('❌ Learning stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve learning statistics' });
  }
});

// POST /api/lexi/interaction-log - Log user interactions
router.post('/interaction-log', requireAuth, async (req, res) => {
  try {
    const interactionData = insertLexiLearningInteractionSchema.parse({
      ...req.body,
      userId: req.user.id
    });

    await db.insert(insertLexiLearningInteractionSchema).values(interactionData);

    res.json({
      success: true,
      message: 'Interaction logged successfully'
    });

  } catch (error) {
    console.error('❌ Interaction logging error:', error);
    res.status(500).json({ 
      error: 'Failed to log interaction',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// GET /api/lexi/recommendations - Personalized recommendations
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);
    
    // Get existing recommendations from database first
    const existingRecommendations = await db.select()
      .from(lexiRecommendations)
      .where(and(
        eq(lexiRecommendations.userId, req.user.id),
        eq(lexiRecommendations.isCompleted, false)
      ))
      .orderBy(desc(lexiRecommendations.priority))
      .limit(limit);

    // If we don't have enough recommendations, generate new ones
    let recommendations = existingRecommendations;
    if (recommendations.length < limit) {
      const newRecommendations = await lexiAIService.generatePersonalizedRecommendations(
        req.user.id,
        limit - recommendations.length
      );
      
      // Combine existing and new recommendations
      recommendations = [
        ...existingRecommendations,
        ...newRecommendations.map(rec => ({
          ...rec,
          id: 0, // Will be set by database
          userId: req.user.id,
          isCompleted: false,
          userRating: null,
          completedAt: null,
          expiresAt: null,
          createdAt: new Date()
        }))
      ];
    }

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('❌ Recommendations error:', error);
    res.status(500).json({ error: 'Failed to retrieve recommendations' });
  }
});

// PUT /api/lexi/recommendations/:id/complete - Mark recommendation as completed
router.put('/recommendations/:id/complete', requireAuth, async (req, res) => {
  try {
    const recommendationId = parseInt(req.params.id);
    const { rating } = req.body;

    await db.update(lexiRecommendations)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        userRating: rating || null
      })
      .where(and(
        eq(lexiRecommendations.id, recommendationId),
        eq(lexiRecommendations.userId, req.user.id)
      ));

    res.json({
      success: true,
      message: 'Recommendation marked as completed'
    });

  } catch (error) {
    console.error('❌ Complete recommendation error:', error);
    res.status(500).json({ error: 'Failed to complete recommendation' });
  }
});

// GET /api/lexi/quizzes - Get user's quizzes
router.get('/quizzes', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = (page - 1) * limit;

    const quizzes = await db.select()
      .from(lexiQuizzes)
      .where(eq(lexiQuizzes.userId, req.user.id))
      .orderBy(desc(lexiQuizzes.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: quizzes
    });

  } catch (error) {
    console.error('❌ Get quizzes error:', error);
    res.status(500).json({ error: 'Failed to retrieve quizzes' });
  }
});

// POST /api/lexi/quizzes/:id/attempt - Submit quiz attempt
router.post('/quizzes/:id/attempt', requireAuth, async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { answers, timeSpent } = req.body;

    if (!answers) {
      return res.status(400).json({ error: 'Answers are required' });
    }

    // Get quiz details
    const quiz = await db.select()
      .from(lexiQuizzes)
      .where(and(
        eq(lexiQuizzes.id, quizId),
        eq(lexiQuizzes.userId, req.user.id)
      ))
      .limit(1);

    if (!quiz.length) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Calculate score and determine pass/fail
    const score = 75; // Placeholder - implement actual scoring logic
    const isPassed = score >= (quiz[0].passingScore || 70);
    
    // Get next attempt number
    const attemptNumber = quiz[0].currentAttempts + 1;

    // Save attempt
    const attempt = await db.insert(lexiQuizAttempts).values({
      quizId,
      userId: req.user.id,
      attemptNumber,
      answers,
      score,
      timeSpent: timeSpent || 0,
      isPassed,
      feedback: { message: 'Quiz completed' },
      improvementAreas: [],
      strengths: [],
      nextSteps: []
    }).returning();

    // Update quiz stats
    await db.update(lexiQuizzes)
      .set({
        currentAttempts: attemptNumber,
        bestScore: sql`GREATEST(${lexiQuizzes.bestScore}, ${score})`,
        isCompleted: isPassed,
        lastAttemptAt: new Date(),
        totalTimeSpent: sql`${lexiQuizzes.totalTimeSpent} + ${timeSpent || 0}`
      })
      .where(eq(lexiQuizzes.id, quizId));

    res.json({
      success: true,
      data: {
        attempt: attempt[0],
        score,
        isPassed,
        message: isPassed ? 'Congratulations! You passed the quiz.' : 'Keep practicing and try again.'
      }
    });

  } catch (error) {
    console.error('❌ Quiz attempt error:', error);
    res.status(500).json({ error: 'Failed to submit quiz attempt' });
  }
});

// ============================================================================
// HEALTH CHECK AND INIT ENDPOINTS
// ============================================================================

// GET /api/lexi/health - Health check
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await lexiAIService.aiProviderManager?.getHealthStatus();
    
    res.json({
      success: true,
      data: {
        service: 'Lexi AI Service',
        status: 'operational',
        aiProviders: healthStatus,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Service health check failed'
    });
  }
});

export function registerLexiRoutes(app: Express): void {
  app.use('/api/lexi', router);
  console.log('✅ Lexi AI routes registered');
}