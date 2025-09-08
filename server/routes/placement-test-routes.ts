/**
 * Placement Test API Routes
 * RESTful endpoints for AI-driven placement testing
 */

import express from 'express';
import { DatabaseStorage } from '../database-storage';
import { AdaptivePlacementService } from '../services/adaptive-placement-service';
import { AIRoadmapGenerator } from '../services/ai-roadmap-generator';
import { OllamaService } from '../ollama-service';
import { authenticateToken, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

// Request schemas
const startTestSchema = z.object({
  targetLanguage: z.string().min(1),
  learningGoal: z.string().optional(),
  timeAvailability: z.number().min(1).max(40).default(6)
});

const submitResponseSchema = z.object({
  questionId: z.number(),
  userResponse: z.any(), // Flexible for different response types
  timeSpent: z.number().optional()
});

const generateRoadmapSchema = z.object({
  sessionId: z.number(),
  learningGoals: z.array(z.string()).default([]),
  timeAvailability: z.number().min(1).max(40).default(6),
  preferredPace: z.enum(['slow', 'normal', 'fast']).default('normal'),
  focusAreas: z.array(z.string()).optional()
});

export function createPlacementTestRoutes(
  storage: DatabaseStorage,
  ollamaService: OllamaService
) {
  const placementService = new AdaptivePlacementService(ollamaService, storage);
  const roadmapGenerator = new AIRoadmapGenerator(ollamaService, storage);

  // Start new placement test
  router.post('/start', authenticateToken, async (req, res) => {
    try {
      const data = startTestSchema.parse(req.body);
      const userId = (req as any).user.id;

      const session = await placementService.startPlacementTest(
        userId,
        data.targetLanguage,
        data.learningGoal
      );

      res.json({
        success: true,
        session: {
          id: session.id,
          status: session.status,
          currentSkill: session.currentSkill,
          startedAt: session.startedAt,
          maxDurationMinutes: 10
        }
      });
    } catch (error) {
      console.error('Error starting placement test:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start placement test'
      });
    }
  });

  // Get next question
  router.get('/sessions/:sessionId/next-question', authenticateToken, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = (req as any).user.id;

      // Verify session belongs to user
      const session = await storage.getPlacementTestSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        });
      }

      const nextQuestion = await placementService.getNextQuestion(sessionId);

      if (!nextQuestion) {
        // Test completed
        const completedSession = await placementService.completeTest(sessionId);
        return res.json({
          success: true,
          testCompleted: true,
          results: {
            overallLevel: completedSession.overallCEFRLevel,
            skillLevels: {
              speaking: completedSession.speakingLevel,
              listening: completedSession.listeningLevel,
              reading: completedSession.readingLevel,
              writing: completedSession.writingLevel
            },
            scores: {
              overall: completedSession.overallScore,
              speaking: completedSession.speakingScore,
              listening: completedSession.listeningScore,
              reading: completedSession.readingScore,
              writing: completedSession.writingScore
            },
            strengths: completedSession.strengths,
            recommendations: completedSession.recommendations,
            confidence: completedSession.confidenceScore
          }
        });
      }

      res.json({
        success: true,
        question: {
          id: nextQuestion.id,
          skill: nextQuestion.skill,
          level: nextQuestion.cefrLevel,
          type: nextQuestion.questionType,
          title: nextQuestion.title,
          prompt: nextQuestion.prompt,
          content: nextQuestion.content,
          responseType: nextQuestion.responseType,
          expectedDurationSeconds: nextQuestion.expectedDurationSeconds,
          estimatedMinutes: nextQuestion.estimatedCompletionMinutes
        }
      });
    } catch (error) {
      console.error('Error getting next question:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get next question'
      });
    }
  });

  // Submit response to question
  router.post('/sessions/:sessionId/responses', authenticateToken, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const data = submitResponseSchema.parse(req.body);
      const userId = (req as any).user.id;

      // Verify session belongs to user
      const session = await storage.getPlacementTestSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        });
      }

      const result = await placementService.submitResponse(
        sessionId,
        data.questionId,
        data.userResponse
      );

      res.json({
        success: true,
        evaluation: {
          score: result.evaluation.score,
          level: result.evaluation.level,
          confidence: result.evaluation.confidence,
          feedback: result.evaluation.detailedFeedback,
          recommendations: result.evaluation.recommendations
        },
        nextQuestion: result.nextQuestion ? {
          id: result.nextQuestion.id,
          skill: result.nextQuestion.skill,
          level: result.nextQuestion.cefrLevel,
          type: result.nextQuestion.questionType,
          title: result.nextQuestion.title,
          prompt: result.nextQuestion.prompt,
          content: result.nextQuestion.content,
          responseType: result.nextQuestion.responseType,
          expectedDurationSeconds: result.nextQuestion.expectedDurationSeconds
        } : null,
        testCompleted: !result.nextQuestion
      });
    } catch (error) {
      console.error('Error submitting response:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit response'
      });
    }
  });

  // Get placement test results
  router.get('/sessions/:sessionId/results', authenticateToken, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = (req as any).user.id;

      const session = await storage.getPlacementTestSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        });
      }

      if (session.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Test not yet completed'
        });
      }

      res.json({
        success: true,
        results: {
          sessionId: session.id,
          completedAt: session.completedAt,
          overallLevel: session.overallCEFRLevel,
          skillLevels: {
            speaking: session.speakingLevel,
            listening: session.listeningLevel,
            reading: session.readingLevel,
            writing: session.writingLevel
          },
          scores: {
            overall: session.overallScore,
            speaking: session.speakingScore,
            listening: session.listeningScore,
            reading: session.readingScore,
            writing: session.writingScore
          },
          analysis: {
            strengths: session.strengths,
            weaknesses: session.weaknesses,
            recommendations: session.recommendations,
            confidenceScore: session.confidenceScore
          },
          testDuration: session.totalDurationSeconds,
          generatedRoadmapId: session.generatedRoadmapId
        }
      });
    } catch (error) {
      console.error('Error getting results:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get test results'
      });
    }
  });

  // Generate instant AI roadmap from placement results
  router.post('/sessions/:sessionId/generate-roadmap', authenticateToken, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const data = generateRoadmapSchema.parse(req.body);
      const userId = (req as any).user.id;

      const session = await storage.getPlacementTestSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        });
      }

      if (session.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Complete placement test before generating roadmap'
        });
      }

      // Generate personalized roadmap
      const roadmapResult = await roadmapGenerator.generatePersonalizedRoadmap({
        placementTestSession: session,
        learningGoals: data.learningGoals,
        timeAvailability: data.timeAvailability,
        preferredPace: data.preferredPace,
        focusAreas: data.focusAreas
      });

      // Update session with generated roadmap ID
      await storage.updatePlacementTestSession(sessionId, {
        generatedRoadmapId: roadmapResult.roadmap.id
      });

      // Create user enrollment in the roadmap
      await storage.createUserRoadmapEnrollment({
        userId,
        roadmapId: roadmapResult.roadmap.id,
        status: 'active',
        totalSteps: roadmapResult.steps.length,
        targetCompletionDate: roadmapResult.estimatedCompletion
      });

      res.json({
        success: true,
        roadmap: {
          id: roadmapResult.roadmap.id,
          title: roadmapResult.roadmap.title,
          description: roadmapResult.roadmap.description,
          estimatedWeeks: roadmapResult.roadmap.estimatedWeeks,
          weeklyHours: roadmapResult.roadmap.weeklyHours,
          totalMilestones: roadmapResult.milestones.length,
          totalSteps: roadmapResult.steps.length,
          estimatedCompletion: roadmapResult.estimatedCompletion,
          personalizedRecommendations: roadmapResult.personalizedRecommendations
        },
        milestones: roadmapResult.milestones.map(milestone => ({
          id: milestone.id,
          title: milestone.title,
          description: milestone.description,
          weekNumber: milestone.weekNumber,
          primarySkill: milestone.primarySkill,
          secondarySkills: milestone.secondarySkills
        })),
        message: 'Personalized roadmap generated successfully based on your placement test results'
      });
    } catch (error) {
      console.error('Error generating roadmap:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate personalized roadmap'
      });
    }
  });

  // Get user's placement test history
  router.get('/history', authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const sessions = await storage.getUserPlacementTestSessions(userId);

      res.json({
        success: true,
        sessions: sessions.map(session => ({
          id: session.id,
          targetLanguage: session.targetLanguage,
          learningGoal: session.learningGoal,
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          overallLevel: session.overallCEFRLevel,
          overallScore: session.overallScore,
          generatedRoadmapId: session.generatedRoadmapId
        }))
      });
    } catch (error) {
      console.error('Error getting placement test history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get placement test history'
      });
    }
  });

  // Admin: Get all placement test sessions (for analytics)
  router.get('/admin/sessions', authenticateToken, requireRole(['Admin', 'Supervisor']), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const sessions = await storage.getPlacementTestSessionsPaginated(limit, offset);
      const totalCount = await storage.getPlacementTestSessionsCount();

      res.json({
        success: true,
        sessions: sessions.map(session => ({
          id: session.id,
          userId: session.userId,
          targetLanguage: session.targetLanguage,
          learningGoal: session.learningGoal,
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          overallLevel: session.overallCEFRLevel,
          skillLevels: {
            speaking: session.speakingLevel,
            listening: session.listeningLevel,
            reading: session.readingLevel,
            writing: session.writingLevel
          },
          confidenceScore: session.confidenceScore,
          generatedRoadmapId: session.generatedRoadmapId
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      console.error('Error getting admin placement sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get placement test sessions'
      });
    }
  });

  return router;
}

export default createPlacementTestRoutes;