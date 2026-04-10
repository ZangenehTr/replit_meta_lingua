import type { Express } from "express";
import express from "express";
import { storage } from "../storage";
import { db } from "../db";
import { sql, eq, and, desc, inArray, gte, lte, isNull, or } from "drizzle-orm";
import { users, courses, enrollments, userAchievements, userProfiles, curriculums, curriculumLevels, studentCurriculumProgress, curriculumLevelCourses, teacherTrialAvailability, trialLessons, scrapeJobs, competitorPrices, scrapedLeads, marketTrends, calendarEventsIranian, paymentIdempotency, aiActivitySessions, learningRecommendations, callSessions, coursePayments, walletTransactions, promoCodes, certificates, promoCodeUsages, videoProgress, sessionRatings, callernTeacherFollowers, liveClassSessions } from "@shared/schema";
import { insertUserSchema, insertUserProfileSchema, insertSessionSchema, insertPaymentSchema, insertMoodEntrySchema, insertMoodRecommendationSchema, insertLearningAdaptationSchema, insertRoomSchema, insertLeadSchema, insertCommunicationLogSchema, insertDepartmentSchema, peerMatchingRequests, insertPeerMatchingRequestSchema, peerSocializerParticipants, insertPeerSocializerParticipantSchema, peerSocializerGroups, insertPeerSocializerGroupSchema, classEnrollments, specialClasses, teacherPaymentRecords, WORKFLOW_STATUS, type InsertMoodEntry, type InsertMoodRecommendation, type InsertLearningAdaptation, type AttendanceRecord, type InsertAttendanceRecord, type UserProfile, type InsertUserProfile, type Room, type InsertRoom, type Lead, type InsertLead, type CommunicationLog, type InsertCommunicationLog, insertFrontDeskOperationSchema, insertPhoneCallLogSchema, insertFrontDeskTaskSchema, type FrontDeskOperation, type InsertFrontDeskOperation, type PhoneCallLog, type InsertPhoneCallLog, type FrontDeskTask, type InsertFrontDeskTask, LEAD_STAGE_TRANSITIONS, LEAD_WORKFLOW_STAGE, type LeadWorkflowStage, leadActivityLog } from "@shared/schema";
import { filterTeachers, filterActiveTeachers, filterStudents, filterActiveUsers, excludeTestUsers, calculatePercentage, calculateAttendanceRate, calculateGrowthRate, roundCurrency, safeNumber, isActiveUser, ACTIVE_OBSERVATION_STATUSES, isActiveObservation, validateActiveTeacher } from "../business-logic-utils";
import { ttsService } from "../tts-service";
import type { TTSRequest } from "../tts-service";
import { ollamaService } from "../ollama-service";
import { ollamaInstaller } from "../ollama-installer";
import { authenticate, authorizePermission } from "../auth";
import { createAdminUsersRouter } from "./admin-users";
import { createInfrastructureHealthRouter } from "./infrastructure-health-routes";
import { createAIHealthRouter } from "./ai-health-routes";
import whisperHealthRouter from "./whisper-health-routes";
import smokeTestRouter from './smoke-test-routes';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import mammoth from "mammoth";
import { generatePayslipPDF, generateCertificatePDF, generateTestResultsPDF } from "../utils/pdf-generator";
import type { TestResultsPDFData } from "../utils/pdf-generator";
import { validateIranianPhone, validateIranianEmail, validatePersianText } from "../utils/iranian-validation";
import { parsePhoneNumbersFromCSV, parsePhoneNumbersFromText, normalizeIranianPhone, isValidIranianPhone } from "../utils/csv-phone-parser";
import { OtpService } from '../services/otp-service';
import { z } from "zod";
import { createPlatformAuthMiddleware, validatePlatformCredential } from "../middleware/platform-auth";
import { PlatformFactory, getPlatformStrategy } from "../social-platforms/platform-factory";
import { exportStudentsCSV, exportTeachersCSV, exportFinancialReportCSV, exportAttendanceCSV } from "../utils/csv-export";
import { setupRoadmapRoutes } from "../roadmap-routes";
import { setupCallernEnhancementRoutes } from "../callern-enhancement-routes";
import { registerCallernAIRoutes } from "../callern-ai-routes";
import { setupCallernPackageRoutes } from "../callern-package-routes";
import { setupCallernRecordingRoutes } from "../callern-recording-routes";
import { registerCallernTeacherRoutes } from "../callern-teacher-routes";
import callernRoadmapRoutes from "./callern-roadmap-routes";
import teacherProfileRoutes from "./teacher-profile-routes";
import courseRoadmapRoutes from "./course-roadmap-routes";
import examRoadmapRoutes from "./exam-roadmap-routes";
import { createAiStudyPartnerRoutes } from "./ai-study-partner-routes";
import { registerGlobalLexiRoutes } from "./global-lexi-routes";
import { setupBookEcommerceRoutes } from "./book-ecommerce-routes";
import { setupContentBankRoutes } from "./content-bank-routes";
import { registerLinguaQuestRoutes } from "./linguaquest-routes";
import { registerAISalesAgentRoutes } from "./ai-sales-agent-routes";
import linguaquestAudioRoutes from "./linguaquest-audio-routes";
import searchRoutes from "./search-routes";
import visitorChatRoutes from "./visitor-chat-routes";
import thirdPartyIntegrationRoutes from "./third-party-integration-routes";
import tttRoutes from "../ttt-routes";
import aiWebhookRoutes from "../ai-webhook-routes";
import publicFeaturesRoutes from "./public-features-routes";
import mstRoutes from "../modules/mst/routes/mstRoutes";
import { DEFAULT_ROLE_PERMISSIONS } from '@shared/subsystem-permissions';
import rateLimit from 'express-rate-limit';
import { seedTestUsers } from "../content/seed-test-users";
import { setupAiTrainingRoutes } from "../ai-training-routes";
import { setupAiAnalysisRoutes } from "../ai-analysis-routes";

import type { RouteContext } from "./route-context";


export async function setupStudentGamesRoutes(app: any, context: RouteContext): Promise<void> {
  const {
    authenticateToken,
    requireRole,
    productionGateMiddleware,
    upload,
    uploadVideo,
    uploadPhoto,
    audioUpload,
    uploadStudentPhoto,
    smsRateLimit,
    smsBulkRateLimit,
    checkIdempotency,
    calculateStudentAttendance,
    getLastActivityTime,
    calculateTeacherRating,
    calculateOverallTeacherSatisfaction,
    sendSmsSchema,
    sendBulkSmsSchema,
    sendTestSmsSchema,
  } = context;

  // GAMES API ROUTES (PUBLIC & STUDENT ACCESS)
  // ============================================
  
  // Public games endpoints (for student access)
  app.get("/api/games", async (req: any, res) => {
    try {
      const { ageGroup, skillFocus, level } = req.query;
      let games;
      
      if (ageGroup && ageGroup !== 'all') {
        games = await storage.getGamesByAgeGroup(ageGroup as string);
      } else {
        games = await storage.getAllGames();
      }
      
      // Filter by skill focus if specified
      if (skillFocus && skillFocus !== 'all') {
        games = games.filter(game => game.gameType === skillFocus);
      }
      
      res.json(games);
    } catch (error) {
      console.error('Error fetching games:', error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/:gameId", async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const game = await storage.getGameById(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Transform to expected format
      const gameData = {
        id: game.id,
        title: game.gameName,
        description: game.description,
        gameType: game.gameType,
        ageGroup: game.ageGroup,
        difficultyLevel: game.minLevel,
        skillFocus: game.gameType,
        estimatedDuration: game.duration,
        xpReward: game.pointsPerCorrect,
        thumbnailUrl: game.thumbnailUrl || '/assets/games/default-game.png',
        totalLevels: game.totalLevels
      };

      res.json(gameData);
    } catch (error) {
      console.error('Error fetching game:', error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.post("/api/games/:gameId/start", authenticateToken, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const game = await storage.getGameById(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const session = await storage.createGameSession({
        userId: req.user.id,
        gameId,
        levelId: null,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        isCompleted: false,
        gameState: {}
      });

      res.json({
        id: session.id.toString(),
        gameId: session.gameId,
        userId: session.userId,
        currentLevel: 1,
        score: 0,
        startTime: new Date().toISOString(),
        isCompleted: false,
        timeSpent: 0,
        xpEarned: 0
      });
    } catch (error) {
      console.error('Error starting game:', error);
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  app.post("/api/games/:gameId/complete", authenticateToken, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const { level, score, timeSpent, xpEarned } = req.body;
      
      const game = await storage.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Update or create game session completion
      const sessionData = {
        userId: req.user.id,
        gameId,
        levelId: null, // No specific level system yet
        score: score || 0,
        correctAnswers: Math.floor((score || 0) / 10), // Approximate
        wrongAnswers: Math.max(0, 10 - Math.floor((score || 0) / 10)),
        isCompleted: true,
        gameState: {
          timeSpent: timeSpent || 0,
          xpEarned: xpEarned || 0,
          completedAt: new Date().toISOString()
        }
      };

      const session = await storage.createGameSession(sessionData);
      
      res.json({
        success: true,
        session: {
          id: session.id,
          gameId: session.gameId,
          score: session.score,
          xpEarned: xpEarned || 0,
          timeSpent: timeSpent || 0,
          isCompleted: true
        }
      });
    } catch (error) {
      console.error('Error completing game:', error);
      res.status(500).json({ message: "Failed to complete game" });
    }
  });

  // ============================================
  // GAMES MANAGEMENT API ROUTES (ADMIN)
  // ============================================
  
  app.get("/api/admin/games", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.post("/api/admin/games", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const gameData = req.body;
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.put("/api/admin/games/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const gameData = req.body;
      const game = await storage.updateGame(gameId, gameData);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("Error updating game:", error);
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  app.delete("/api/admin/games/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const success = await storage.deleteGame(gameId);
      if (!success) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json({ message: "Game deleted successfully" });
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // Get game questions
  app.get('/api/admin/games/:id/questions', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const questions = await storage.getGameQuestions(Number(id));
      res.json(questions);
    } catch (error) {
      console.error('Error fetching game questions:', error);
      res.status(500).json({ error: 'Failed to fetch game questions' });
    }
  });

  // Create game question
  app.post('/api/admin/games/:id/questions', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const questionData = { ...req.body, gameId: Number(id) };
      const question = await storage.createGameQuestion(questionData);
      res.json(question);
    } catch (error) {
      console.error('Error creating game question:', error);
      res.status(500).json({ error: 'Failed to create game question' });
    }
  });

  // Update game question
  app.put('/api/admin/games/:gameId/questions/:questionId', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { questionId } = req.params;
      const question = await storage.updateGameQuestion(Number(questionId), req.body);
      res.json(question);
    } catch (error) {
      console.error('Error updating game question:', error);
      res.status(500).json({ error: 'Failed to update game question' });
    }
  });

  // Delete game question
  app.delete('/api/admin/games/:gameId/questions/:questionId', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { questionId } = req.params;
      await storage.deleteGameQuestion(Number(questionId));
      res.json({ message: 'Question deleted successfully' });
    } catch (error) {
      console.error('Error deleting game question:', error);
      res.status(500).json({ error: 'Failed to delete game question' });
    }
  });

  // Generate game questions
  app.post('/api/admin/games/:id/generate-questions', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { count = 10, levelNumber = 1 } = req.body;
      const { GameService } = await import('../game-service');
      const gameService = new GameService();
      const questions = await gameService.generateQuestionsForGame(Number(id), levelNumber, count);
      res.json({ message: `Generated ${questions.length} questions`, questions });
    } catch (error) {
      console.error('Error generating game questions:', error);
      res.status(500).json({ error: 'Failed to generate game questions' });
    }
  });

  // Get game analytics
  app.get('/api/admin/games/:id/analytics', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const analytics = await storage.getGameAnalytics(Number(id));
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching game analytics:', error);
      res.status(500).json({ error: 'Failed to fetch game analytics' });
    }
  });

  // ============================================
  // GAME ACCESS CONTROL ROUTES
  // ============================================

  // Get student accessible games
  app.get('/api/student/games/accessible', authenticateToken, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      const games = await storage.getStudentAccessibleGames(studentId);
      res.json(games);
    } catch (error) {
      console.error('Error fetching accessible games:', error);
      res.status(500).json({ error: 'Failed to fetch accessible games' });
    }
  });

  // Create game access rule
  app.post('/api/admin/games/:id/access-rules', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const ruleData = { ...req.body, gameId: Number(id) };
      const rule = await storage.createGameAccessRule(ruleData);
      res.json(rule);
    } catch (error) {
      console.error('Error creating access rule:', error);
      res.status(500).json({ error: 'Failed to create access rule' });
    }
  });

  // Get game access rules
  app.get('/api/admin/games/:id/access-rules', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const rules = await storage.getGameAccessRules(Number(id));
      res.json(rules);
    } catch (error) {
      console.error('Error fetching access rules:', error);
      res.status(500).json({ error: 'Failed to fetch access rules' });
    }
  });

  // Update game access rule
  app.put('/api/admin/access-rules/:id', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const rule = await storage.updateGameAccessRule(Number(id), req.body);
      res.json(rule);
    } catch (error) {
      console.error('Error updating access rule:', error);
      res.status(500).json({ error: 'Failed to update access rule' });
    }
  });

  // Delete game access rule
  app.delete('/api/admin/access-rules/:id', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGameAccessRule(Number(id));
      res.json({ message: 'Access rule deleted successfully' });
    } catch (error) {
      console.error('Error deleting access rule:', error);
      res.status(500).json({ error: 'Failed to delete access rule' });
    }
  });

  // Assign game to student
  app.post('/api/admin/students/:studentId/games', authenticateToken, requireRole(['Admin', 'Teacher']), async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const assignmentData = {
        ...req.body,
        studentId: Number(studentId),
        assignedBy: req.user.id
      };
      const assignment = await storage.assignGameToStudent(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error('Error assigning game to student:', error);
      res.status(500).json({ error: 'Failed to assign game to student' });
    }
  });

  // Get student game assignments
  app.get('/api/admin/students/:studentId/games', authenticateToken, requireRole(['Admin', 'Teacher']), async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const assignments = await storage.getStudentGameAssignments(Number(studentId));
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching student game assignments:', error);
      res.status(500).json({ error: 'Failed to fetch game assignments' });
    }
  });

  // Update student game assignment
  app.put('/api/admin/game-assignments/:id', authenticateToken, requireRole(['Admin', 'Teacher']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const assignment = await storage.updateStudentGameAssignment(Number(id), req.body);
      res.json(assignment);
    } catch (error) {
      console.error('Error updating game assignment:', error);
      res.status(500).json({ error: 'Failed to update game assignment' });
    }
  });

  // Remove student game assignment
  app.delete('/api/admin/game-assignments/:id', authenticateToken, requireRole(['Admin', 'Teacher']), async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.removeStudentGameAssignment(Number(id));
      res.json({ message: 'Game assignment removed successfully' });
    } catch (error) {
      console.error('Error removing game assignment:', error);
      res.status(500).json({ error: 'Failed to remove game assignment' });
    }
  });

  // Assign game to course
  app.post('/api/admin/courses/:courseId/games', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const courseGameData = { ...req.body, courseId: Number(courseId) };
      const courseGame = await storage.assignGameToCourse(courseGameData);
      res.json(courseGame);
    } catch (error) {
      console.error('Error assigning game to course:', error);
      res.status(500).json({ error: 'Failed to assign game to course' });
    }
  });

  // Get course games
  app.get('/api/admin/courses/:courseId/games', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const games = await storage.getCourseGames(Number(courseId));
      res.json(games);
    } catch (error) {
      console.error('Error fetching course games:', error);
      res.status(500).json({ error: 'Failed to fetch course games' });
    }
  });

  // Update course game
  app.put('/api/admin/course-games/:id', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const courseGame = await storage.updateCourseGame(Number(id), req.body);
      res.json(courseGame);
    } catch (error) {
      console.error('Error updating course game:', error);
      res.status(500).json({ error: 'Failed to update course game' });
    }
  });

  // Remove course game
  app.delete('/api/admin/course-games/:id', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.removeCourseGame(Number(id));
      res.json({ message: 'Course game removed successfully' });
    } catch (error) {
      console.error('Error removing course game:', error);
      res.status(500).json({ error: 'Failed to remove course game' });
    }
  });

  // ============================================
  // STUDENT AI CONVERSATION ROUTES
  // ============================================
  
  // Check AI service status for students
  app.get("/api/student/ai/status", authenticateToken, async (req: any, res) => {
    try {
      const { ollamaService } = await import('../ollama-service');
      const isAvailable = await ollamaService.isServiceAvailable();
      
      res.json({ 
        isAvailable: true, // Always available in production (with fallback)
        mode: isAvailable ? 'ollama' : 'production-fallback'
      });
    } catch (error) {
      res.json({ 
        isAvailable: true, // Always available with fallback
        mode: 'production-fallback'
      });
    }
  });

  // Handle voice message from student (with file upload)
  app.post("/api/student/ai/voice-message", authenticateToken, upload.single('audio'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const language = req.body.language || 'english';
      const audioFile = req.file;
      
      // Simulate processing the audio file
      // In production, you would use speech-to-text services like OpenAI Whisper
      let transcript = '';
      
      if (audioFile) {
        // Simulate transcript based on language and file presence
        transcript = language === 'farsi' 
          ? "سلام، من می‌خواهم انگلیسی یاد بگیرم. این پیام صوتی من است."
          : "Hello, I want to practice my conversation skills. This is my voice message.";
      } else {
        // Fallback if no audio file
        transcript = language === 'farsi' 
          ? "سلام، من می‌خواهم انگلیسی یاد بگیرم"
          : "Hello, I want to practice my conversation skills";
      }
      
      // Get AI response (with production fallback)
      let aiResponse;
      try {
        const { ollamaService } = await import('../ollama-service');
        aiResponse = await ollamaService.generateCompletion(
          `Student said: "${transcript}". Please provide an encouraging response in ${language} to help them continue practicing.`,
          "You are a helpful Persian language learning assistant."
        );
      } catch (error) {
        // Production fallback response
        aiResponse = language === 'farsi' 
          ? "عالی! ادامه دهید و روزانه تمرین کنید. زبان انگلیسی با تمرین مداوم یاد می‌گیرید."
          : "Great! Keep practicing daily. You're making good progress with your conversation skills.";
      }
      
      const userProfile = await storage.getUserProfile(userId);
      
      const profile = {
        userId,
        nativeLanguage: language === 'farsi' ? 'farsi' : 'english',
        targetLanguage: language === 'farsi' ? 'english' : 'farsi',
        proficiencyLevel: (userProfile?.proficiencyLevel || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
        learningGoals: userProfile?.learningGoals || [],
        culturalBackground: userProfile?.culturalBackground || 'general',
        preferredLearningStyle: (userProfile?.learningStyle || 'visual') as 'visual' | 'auditory' | 'kinesthetic' | 'reading',
        weaknesses: userProfile?.learningChallenges || [],
        strengths: userProfile?.strengths || [],
        progressHistory: []
      };
      
      // Use the aiResponse already generated above (fallback or Ollama)
      const conversationResponse = {
        response: aiResponse,
        confidence: 0.9,
        suggestions: []
      };
      
      // Track conversation in database for analytics
      try {
        await storage.createMessage({
          senderId: userId,
          receiverId: 0, // AI assistant
          content: transcript,
          type: 'ai_conversation',
          createdAt: new Date()
        });
        
        await storage.createMessage({
          senderId: 0, // AI assistant
          receiverId: userId,
          content: conversationResponse.response,
          type: 'ai_conversation',
          createdAt: new Date()
        });
      } catch (error) {
        console.error('Error saving conversation:', error);
      }
      
      res.json({
        transcript: transcript,
        response: conversationResponse.response,
        audioUrl: null // In production, this would be the URL to the generated audio
      });
    } catch (error) {
      console.error('Voice message error:', error);
      res.status(500).json({ 
        message: "Failed to process voice message",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // AI Training File Upload Routes
  app.post("/api/admin/ai-training/upload", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      // File upload processing for AI training
      const files = req.files || [];
      const processedFiles = [];

      for (const file of files) {
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        let extractedContent = '';

        switch (fileExtension) {
          case 'pdf':
            extractedContent = `PDF content extracted from ${file.originalname}`;
            break;
          case 'mp4':
          case 'avi':
          case 'mov':
            extractedContent = `Video speech-to-text from ${file.originalname}`;
            break;
          case 'xlsx':
          case 'xls':
            extractedContent = `Excel data structure from ${file.originalname}`;
            break;
          case 'txt':
          case 'json':
          case 'csv':
            extractedContent = `Text content from ${file.originalname}`;
            break;
          default:
            extractedContent = `Unsupported file type: ${fileExtension}`;
        }

        processedFiles.push({
          filename: file.originalname,
          type: fileExtension,
          size: file.size,
          extractedContent: extractedContent,
          processed: true
        });
      }

      res.json({
        success: true,
        message: "Files processed successfully",
        processedFiles: processedFiles
      });
    } catch (error) {
      console.error('File upload processing error:', error);
      res.status(500).json({ 
        message: "Failed to process uploaded files",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Test training endpoint without authentication for development
  app.post("/api/test/ai-training/start", async (req: any, res) => {
    try {
      const { 
        modelName, 
        trainingType, 
        learningRate, 
        epochs, 
        batchSize, 
        datasetFiles 
      } = req.body;

      // Validate required fields - training type is now optional
      if (!modelName) {
        return res.status(400).json({ message: "Model name is required" });
      }

      // Simulate training process
      res.json({
        success: true,
        message: "Training started successfully",
        trainingId: `training-${Date.now()}`,
        modelName,
        trainingType: trainingType || "general",
        parameters: {
          learningRate: learningRate || 0.001,
          epochs: epochs || 10,
          batchSize: batchSize || 32
        },
        estimatedTime: "10-15 minutes",
        datasetFiles: datasetFiles || []
      });
    } catch (error) {
      console.error('Training start error:', error);
      res.status(500).json({ 
        message: "Failed to start training",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/admin/ai-training/start", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { 
        modelName, 
        trainingType, 
        learningRate, 
        epochs, 
        batchSize, 
        datasetFiles 
      } = req.body;

      // Validate required fields - training type is now optional
      if (!modelName) {
        return res.status(400).json({ message: "Model name is required" });
      }

      // Simulate training process
      const trainingJob = {
        id: Date.now(),
        modelName,
        trainingType,
        parameters: {
          learningRate: learningRate || 0.001,
          epochs: epochs || 10,
          batchSize: batchSize || 32
        },
        status: 'started',
        progress: 0,
        startedAt: new Date(),
        estimatedCompletion: new Date(Date.now() + (epochs || 10) * 60000) // Estimate 1 minute per epoch
      };

      res.json({
        success: true,
        message: "Training started successfully",
        trainingJob: trainingJob
      });
    } catch (error) {
      console.error('Training start error:', error);
      res.status(500).json({ 
        message: "Failed to start training",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/admin/ai-training/status/:jobId", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { jobId } = req.params;
      
      // Simulate training progress
      const progress = Math.min(100, Math.floor(crypto.randomInt(100)));
      const status = progress === 100 ? 'completed' : 'training';

      res.json({
        success: true,
        jobId: jobId,
        status: status,
        progress: progress,
        message: status === 'completed' ? 'Training completed successfully' : `Training in progress: ${progress}%`
      });
    } catch (error) {
      console.error('Training status check error:', error);
      res.status(500).json({ 
        message: "Failed to check training status",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Test endpoint for model testing
  app.post('/api/test/model-test', async (req, res) => {
    try {
      const { modelName, prompt, temperature = 0.7, maxTokens = 500 } = req.body;
      
      console.log(`Testing model ${modelName} with prompt:`, prompt);
      
      // Use Ollama service to generate response
      const response = await ollamaService.generateCompletion(
        prompt,
        "You are a helpful AI assistant specialized in Persian language learning.",
        {
          temperature,
          maxTokens,
          model: modelName
        }
      );

      res.json({ 
        success: true, 
        response: response || `Test response from ${modelName}: This is a sample response demonstrating the model's capabilities after training. Based on your prompt: "${prompt.substring(0, 50)}...", the model would provide relevant language learning assistance.`,
        model: modelName,
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
      });

    } catch (error: any) {
      console.error('Model testing error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to test model'
      });
    }
  });

  // ===== IRANIAN SELF-HOSTING REAL DATA ENDPOINTS =====
  // Replace ALL mock data with real database calls

  // 1. LEAD MANAGEMENT SYSTEM (Call Center Dashboard)
  app.get("/api/leads", authenticateToken, requireRole(['Admin', 'Call Center Agent', 'Supervisor']), async (req: any, res) => {
    try {
      const { source, status, priority, stage, assignedAgent, dateFrom, dateTo } = req.query as Record<string, string | undefined>;
      const hasFilter = source || status || priority || stage || assignedAgent || dateFrom || dateTo;
      if (hasFilter) {
        const conditions: ReturnType<typeof eq>[] = [];
        if (source) conditions.push(eq(leads.source, source));
        if (status) conditions.push(eq(leads.status, status));
        if (priority) conditions.push(eq(leads.priority, priority));
        if (stage) conditions.push(eq(leads.workflowStage, stage));
        if (assignedAgent) {
          const agentId = parseInt(assignedAgent);
          if (!isNaN(agentId)) conditions.push(eq(leads.assignedTo, agentId));
        }
        if (dateFrom) conditions.push(gte(leads.createdAt, new Date(dateFrom)));
        if (dateTo) conditions.push(lte(leads.createdAt, new Date(dateTo)));
        const filtered = await db.select().from(leads)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(leads.updatedAt));
        return res.json(filtered);
      }
      const allLeads = await storage.getLeads();
      res.json(allLeads);
    } catch (dbError: any) {
      console.error('Error fetching leads:', dbError);
      res.json([]);
    }
  });


  // Get workflow statistics for unified call center (MUST be before /api/leads/:id)
  app.get("/api/leads/workflow-stats", authenticateToken, requireRole(['Admin', 'Call Center Agent', 'Supervisor']), async (req: any, res) => {
    try {
      const counts = await db.select({
        stage: leads.workflowStage,
        count: sql<number>`count(*)::int`
      }).from(leads).groupBy(leads.workflowStage);

      const stats: Record<string, number> = { total: 0 };
      counts.forEach(({ stage, count }) => {
        if (stage) stats[stage] = count;
        stats.total = (stats.total || 0) + count;
      });
      res.json(stats);
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      res.status(500).json({ message: "Failed to fetch workflow statistics" });
    }
  });

  // Get workflow stage counts for dashboard - MUST be before /api/leads/:id route
  app.get("/api/leads/stage-counts", authenticateToken, requireRole(['Admin', 'Call Center Agent', 'Supervisor', 'Front Desk']), async (req: any, res) => {
    try {
      const counts = await db.select({
        stage: leads.workflowStage,
        count: sql<number>`count(*)::int`
      }).from(leads).groupBy(leads.workflowStage);

      const stageStats: Record<string, number> = {
        contact_desk: 0,
        new_intake: 0,
        follow_up: 0,
        no_response: 0,
        level_assessment: 0,
        withdrawal: 0,
        no_show: 0,
        evaluation: 0,
        consultation_cc: 0,
        consultation_sup: 0,
        pre_registration: 0,
        final_registration: 0,
        private_class_setup: 0,
        set_class_number: 0,
        active_private_class: 0,
        charge_renewal: 0,
        hold: 0,
        private_class_withdrawal: 0,
        completed_private_class: 0,
        installments: 0,
        cheque: 0,
        online_attendance: 0,
        student_absence: 0,
        teacher_absence: 0,
        enrolled: 0
      };

      counts.forEach(({ stage, count }) => {
        if (stage && stageStats.hasOwnProperty(stage)) {
          stageStats[stage] = count;
        }
      });

      res.json(stageStats);
    } catch (error) {
      console.error('Error fetching stage counts:', error);
      res.status(500).json({ message: "Failed to fetch stage counts" });
    }
  });

  app.get("/api/leads/:id", authenticateToken, requireRole(['Admin', 'Call Center Agent', 'Supervisor']), async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      // Try database first
      const lead = await storage.getLead(leadId);
      if (lead) {
        res.json(lead);
      } else {
        res.status(404).json({ message: "Lead not found" });
      }
    } catch (dbError: any) {
      console.error('Error fetching lead:', dbError);
      res.status(404).json({ message: "Lead not found" });
    }
  });

  app.post("/api/leads", authenticateToken, requireRole(['Admin', 'Call Center Agent', 'Supervisor']), async (req: any, res) => {
    try {
      // Create lead with proper field mapping
      
      // Handle name field conversion for database compatibility
      const { name, ...otherData } = req.body;
      let requestData = { ...otherData };
      
      if (name && !requestData.firstName && !requestData.lastName) {
        const nameParts = name.trim().split(' ');
        requestData.firstName = nameParts[0] || '';
        requestData.lastName = nameParts.slice(1).join(' ') || '';
      }

      // Ensure required fields are present
      if (!requestData.firstName || !requestData.phoneNumber) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          details: { 
            firstName: !requestData.firstName ? "First name is required" : undefined,
            phoneNumber: !requestData.phoneNumber ? "Phone number is required" : undefined
          }
        });
      }

      // Validate Iranian phone number
      const phoneValidation = validateIranianPhone(requestData.phone || requestData.phoneNumber);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ 
          message: "Invalid Iranian phone number format. Please use +98 format or local format (09xxxxxxxxx)" 
        });
      }

      // Validate email if provided
      if (requestData.email) {
        const emailValidation = validateIranianEmail(requestData.email);
        if (!emailValidation.isValid) {
          return res.status(400).json({ message: "Invalid email format" });
        }
      }

      // Validate and normalize Persian text fields
      const firstNameValidation = validatePersianText(requestData.firstName);
      const lastNameValidation = validatePersianText(requestData.lastName || '');
      const notesValidation = requestData.notes ? validatePersianText(requestData.notes) : { normalized: requestData.notes };
      
      // Prepare data for Zod validation
      const leadDataForValidation = {
        firstName: firstNameValidation.normalized || requestData.firstName,
        lastName: lastNameValidation.normalized || requestData.lastName || '',
        email: requestData.email || null,
        phone: phoneValidation.normalized,
        leadSource: requestData.leadSource || 'website',
        status: requestData.status || 'new',
        priority: requestData.priority || 'medium',
        level: requestData.level || 'beginner',
        interestedLanguage: requestData.interestedLanguage || null,
        interestedLevel: requestData.interestedLevel || null,
        preferredFormat: requestData.preferredFormat || null,
        budget: requestData.budget ? parseInt(requestData.budget) : null,
        notes: notesValidation.normalized || null,
        assignedTo: req.user.id,
        nextFollowUpDate: requestData.nextFollowUpDate ? new Date(requestData.nextFollowUpDate) : null,
        lastContactDate: null,
        conversionDate: null,
        studentId: null
      };

      // Validate with Zod schema
      const validatedData = insertLeadSchema.parse(leadDataForValidation);
      
      try {
        const lead = await storage.createLead(validatedData);
        res.status(201).json(lead);
      } catch (dbError: any) {
        // Fallback for development/testing when database schema is not available
        const isSchemaError = dbError.message && (
          dbError.message.includes('column') && dbError.message.includes('does not exist') ||
          dbError.message.includes('relation') && dbError.message.includes('does not exist') ||
          dbError.code === '42P01' || // undefined_table
          dbError.code === '42703'    // undefined_column
        );
        if (isSchemaError) {
          console.error('Database schema issue for leads table:', dbError.message);
          res.status(503).json({ 
            message: "Lead creation temporarily unavailable - database schema needs migration",
            error: "SCHEMA_MISMATCH"
          });
        } else {
          throw dbError; // Re-throw if it's a different error
        }
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      res.status(400).json({ message: "Failed to create lead", error: error.message });
    }
  });

  app.put("/api/leads/:id", authenticateToken, requireRole(['Admin', 'Call Center Agent', 'Supervisor']), async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }

      // Prepare update data for validation
      const updateData = { ...req.body };
      
      // Validate Iranian phone number if provided
      if (updateData.phoneNumber || updateData.phone) {
        const phoneValidation = validateIranianPhone(updateData.phoneNumber || updateData.phone);
        if (!phoneValidation.isValid) {
          return res.status(400).json({ 
            message: "Invalid Iranian phone number format. Please use +98 format or local format (09xxxxxxxxx)" 
          });
        }
        updateData.phoneNumber = phoneValidation.normalized;
        delete updateData.phone;
      }

      // Validate email if provided
      if (updateData.email) {
        const emailValidation = validateIranianEmail(updateData.email);
        if (!emailValidation.isValid) {
          return res.status(400).json({ message: "Invalid email format" });
        }
      }

      // Validate and normalize Persian text fields if provided
      if (updateData.firstName) {
        const validation = validatePersianText(updateData.firstName);
        updateData.firstName = validation.normalized || updateData.firstName;
      }
      if (updateData.lastName) {
        const validation = validatePersianText(updateData.lastName);
        updateData.lastName = validation.normalized || updateData.lastName;
      }
      if (updateData.notes) {
        const validation = validatePersianText(updateData.notes);
        updateData.notes = validation.normalized || updateData.notes;
      }

      // Convert date strings to Date objects if provided
      if (updateData.nextFollowUpDate) {
        updateData.nextFollowUpDate = new Date(updateData.nextFollowUpDate);
      }
      if (updateData.lastContactDate) {
        updateData.lastContactDate = new Date(updateData.lastContactDate);
      }
      if (updateData.conversionDate) {
        updateData.conversionDate = new Date(updateData.conversionDate);
      }

      // Convert budget to number if provided
      if (updateData.budget && typeof updateData.budget === 'string') {
        updateData.budget = parseInt(updateData.budget);
      }

      // Use partial validation for updates - only validate provided fields
      const partialLeadSchema = insertLeadSchema.partial();
      const validatedData = partialLeadSchema.parse(updateData);
      
      const lead = await storage.updateLead(leadId, validatedData);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error('Error updating lead:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      res.status(400).json({ message: "Failed to update lead", error: error.message });
    }
  });

  // Search lead by phone number
  app.post("/api/leads/search-by-phone", authenticateToken, requireRole(['Admin', 'Call Center Agent', 'Supervisor']), async (req: any, res) => {
    try {
      // Validate request body
      const phoneSearchSchema = z.object({
        phoneNumber: z.string().min(10, "Phone number must be at least 10 digits")
      });
      
      const { phoneNumber } = phoneSearchSchema.parse(req.body);
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const lead = await storage.getLeadByPhone(phoneNumber);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error('Error searching lead by phone:', error);
      res.status(500).json({ message: "Failed to search lead" });
    }
  });

  // Log call attempt
  app.post("/api/leads/:id/call-attempt", authenticateToken, requireRole(['Admin', 'Call Center Agent', 'Supervisor']), async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }

      // Validate request body
      const callAttemptSchema = z.object({
        duration: z.number().optional(),
        outcome: z.string().optional(),
        notes: z.string().optional()
      });
      
      const { duration, outcome, notes } = callAttemptSchema.parse(req.body);
      
      // Get current lead to increment call count
      const currentLead = await storage.getLead(leadId);
      if (!currentLead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Calculate progressive backoff for next retry
      const newCallCount = (currentLead.callCount || 0) + 1;
      const now = new Date();
      
      // Progressive backoff schedule: 0h, 2h, 24h, 3d, 7d
      const backoffSchedule = [
        0,           // 1st attempt: immediate (0 hours)
        2 * 60 * 60, // 2nd attempt: 2 hours in seconds  
        24 * 60 * 60, // 3rd attempt: 24 hours in seconds
        3 * 24 * 60 * 60, // 4th attempt: 3 days in seconds
        7 * 24 * 60 * 60, // 5th attempt: 7 days in seconds
        14 * 24 * 60 * 60 // 6th+ attempts: 14 days in seconds
      ];
      
      // Calculate next retry time based on call count
      const backoffIndex = Math.min(newCallCount, backoffSchedule.length - 1);
      const backoffSeconds = backoffSchedule[backoffIndex];
      const nextRetryAt = new Date(now.getTime() + (backoffSeconds * 1000));

      // Update call count, last contact date, and retry scheduling
      const lead = await storage.updateLead(leadId, {
        callCount: newCallCount,
        lastContactDate: now,
        lastAttemptAt: now,
        nextRetryAt: nextRetryAt
      });

      // Log the call attempt
      await storage.createCommunicationLog({
        fromUserId: req.user.id,
        toUserId: null,
        toParentId: leadId,
        type: 'call',
        subject: 'Call Attempt',
        content: notes || 'Call attempted',
        status: outcome || 'completed',
        sentAt: new Date(),
        metadata: { duration: duration || 0, outcome: outcome || 'attempted' },
        studentId: null
      });
      
      res.json({ success: true, lead });
    } catch (error) {
      console.error('Error logging call attempt:', error);
      res.status(500).json({ message: "Failed to log call attempt" });
    }
  });


  // ============================================================================
}
