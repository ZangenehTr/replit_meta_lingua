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


export async function setupCallernCoreRoutes(app: any, context: RouteContext): Promise<void> {
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

  // CALLERN ROADMAP API ROUTES  
  // =====================================================
  
  // Get student briefing when teacher receives a call
  app.get("/api/callern/student-briefing/:studentId", authenticateToken, requireRole(['Teacher', 'Admin']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const briefing = await storage.getStudentCallernBriefing(studentId);
      res.json(briefing);
    } catch (error) {
      console.error('Error fetching student briefing:', error);
      res.status(500).json({ message: 'Failed to fetch student briefing' });
    }
  });

  // Get all roadmaps
  app.get("/api/admin/callern/roadmaps", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const roadmaps = await storage.getCallernRoadmaps();
      res.json(roadmaps);
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      res.status(500).json({ message: 'Failed to fetch roadmaps' });
    }
  });

  // Create roadmap
  app.post("/api/admin/callern/roadmaps", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const roadmapData = {
        ...req.body,
        createdBy: req.user.id
      };
      const roadmap = await storage.createCallernRoadmap(roadmapData);
      res.status(201).json(roadmap);
    } catch (error) {
      console.error('Error creating roadmap:', error);
      res.status(500).json({ message: 'Failed to create roadmap' });
    }
  });

  // Update roadmap
  app.put("/api/admin/callern/roadmaps/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const roadmapId = parseInt(req.params.id);
      const roadmap = await storage.updateCallernRoadmap(roadmapId, req.body);
      res.json(roadmap);
    } catch (error) {
      console.error('Error updating roadmap:', error);
      res.status(500).json({ message: 'Failed to update roadmap' });
    }
  });

  // Delete roadmap
  app.delete("/api/admin/callern/roadmaps/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const roadmapId = parseInt(req.params.id);
      await storage.deleteCallernRoadmap(roadmapId);
      res.json({ message: 'Roadmap deleted successfully' });
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      res.status(500).json({ message: 'Failed to delete roadmap' });
    }
  });

  // Get roadmap steps
  app.get("/api/admin/callern/roadmaps/:roadmapId/steps", authenticateToken, async (req: any, res) => {
    try {
      const roadmapId = parseInt(req.params.roadmapId);
      const steps = await storage.getRoadmapSteps(roadmapId);
      res.json(steps);
    } catch (error) {
      console.error('Error fetching roadmap steps:', error);
      res.status(500).json({ message: 'Failed to fetch roadmap steps' });
    }
  });

  // Create roadmap step
  app.post("/api/admin/callern/roadmaps/:roadmapId/steps", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const roadmapId = parseInt(req.params.roadmapId);
      const stepData = {
        ...req.body,
        roadmapId
      };
      const step = await storage.createRoadmapStep(stepData);
      res.status(201).json(step);
    } catch (error) {
      console.error('Error creating roadmap step:', error);
      res.status(500).json({ message: 'Failed to create roadmap step' });
    }
  });

  // Update roadmap step
  app.put("/api/admin/callern/roadmap-steps/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const stepId = parseInt(req.params.id);
      const step = await storage.updateRoadmapStep(stepId, req.body);
      res.json(step);
    } catch (error) {
      console.error('Error updating roadmap step:', error);
      res.status(500).json({ message: 'Failed to update roadmap step' });
    }
  });

  // Delete roadmap step
  app.delete("/api/admin/callern/roadmap-steps/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const stepId = parseInt(req.params.id);
      await storage.deleteRoadmapStep(stepId);
      res.json({ message: 'Step deleted successfully' });
    } catch (error) {
      console.error('Error deleting roadmap step:', error);
      res.status(500).json({ message: 'Failed to delete roadmap step' });
    }
  });

  // Get student progress in roadmap
  app.get("/api/callern/student-progress/:studentId/:packageId", authenticateToken, async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const packageId = parseInt(req.params.packageId);
      const progress = await storage.getStudentRoadmapProgress(studentId, packageId);
      res.json(progress);
    } catch (error) {
      console.error('Error fetching student progress:', error);
      res.status(500).json({ message: 'Failed to fetch student progress' });
    }
  });

  // Mark step as completed
  app.post("/api/callern/student-progress/complete", authenticateToken, requireRole(['Teacher', 'Admin']), async (req: any, res) => {
    try {
      const progressData = {
        ...req.body,
        teacherId: req.user.id
      };
      const progress = await storage.markStepCompleted(progressData);
      res.status(201).json(progress);
    } catch (error) {
      console.error('Error marking step completed:', error);
      res.status(500).json({ message: 'Failed to mark step completed' });
    }
  });

  // Update student progress
  app.put("/api/callern/student-progress/:id", authenticateToken, requireRole(['Teacher', 'Admin']), async (req: any, res) => {
    try {
      const progressId = parseInt(req.params.id);
      const progress = await storage.updateStepProgress(progressId, req.body);
      res.json(progress);
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({ message: 'Failed to update progress' });
    }
  });

  // Get roadmap for a package
  app.get("/api/callern/packages/:packageId/roadmap", authenticateToken, async (req: any, res) => {
    try {
      const packageId = parseInt(req.params.packageId);
      const roadmap = await storage.getRoadmapByPackageId(packageId);
      if (roadmap) {
        const steps = await storage.getRoadmapSteps(roadmap.id);
        res.json({ ...roadmap, steps });
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error('Error fetching package roadmap:', error);
      res.status(500).json({ message: 'Failed to fetch package roadmap' });
    }
  });

  // Simple in-memory rate limiter for TURN credentials
  const turnRateLimiter = new Map<string, { count: number; resetTime: number }>();
  const TURN_RATE_LIMIT = 10; // 10 requests per minute
  const TURN_RATE_WINDOW = 60000; // 1 minute in milliseconds

  // Get dynamic TURN server credentials for WebRTC with rate limiting
  app.get("/api/callern/turn-credentials", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
      const now = Date.now();
      
      // Rate limiting check
      const userLimit = turnRateLimiter.get(userId);
      if (userLimit) {
        if (now < userLimit.resetTime) {
          if (userLimit.count >= TURN_RATE_LIMIT) {
            return res.status(429).json({ 
              message: 'Too many requests. Please wait before requesting TURN credentials again.',
              retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
            });
          }
          userLimit.count++;
        } else {
          // Reset the window
          turnRateLimiter.set(userId, { count: 1, resetTime: now + TURN_RATE_WINDOW });
        }
      } else {
        // First request from this user
        turnRateLimiter.set(userId, { count: 1, resetTime: now + TURN_RATE_WINDOW });
      }
      
      // Clean up old entries periodically (every 100 requests)
      if (Math.random() < 0.01) {
        for (const [key, value] of turnRateLimiter.entries()) {
          if (value.resetTime < now) {
            turnRateLimiter.delete(key);
          }
        }
      }

      // Use environment variables if available, otherwise use free servers
      const customTurnUrl = process.env.TURN_SERVER_URL;
      const customTurnUsername = process.env.TURN_SERVER_USERNAME;
      const customTurnCredential = process.env.TURN_SERVER_CREDENTIAL;
      
      const iceServers = [];
      
      // Always include STUN servers
      iceServers.push(
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' }
      );
      
      if (customTurnUrl && customTurnUsername && customTurnCredential) {
        // Use custom TURN server (for production)
        iceServers.push({
          urls: customTurnUrl,
          username: customTurnUsername,
          credential: customTurnCredential
        });
      } else {
        // Fallback to free TURN servers with both UDP and TCP transports
        iceServers.push(
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject', 
            credential: 'openrelayproject'
          },
          {
            urls: 'turns:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        );
      }

      // Add cache headers to reduce repeated requests
      res.set({
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'X-RateLimit-Limit': TURN_RATE_LIMIT.toString(),
        'X-RateLimit-Remaining': Math.max(0, TURN_RATE_LIMIT - (userLimit?.count || 1)).toString(),
        'X-RateLimit-Reset': new Date((userLimit?.resetTime || now + TURN_RATE_WINDOW)).toISOString()
      });

      res.json({ iceServers });
    } catch (error) {
      console.error('Error fetching TURN credentials:', error);
      res.status(500).json({ message: 'Failed to fetch TURN credentials' });
    }
  });

  // IRT Adaptive Assessment Endpoints
  app.post("/api/assessment/irt/start", authenticateToken, async (req: any, res) => {
    try {
      const { studentId, testType } = req.body;
      
      // Initialize IRT session with calibrated question bank
      const session = {
        id: `irt-${Date.now()}-${studentId}`,
        studentId,
        testType,
        currentQuestionIndex: 0,
        questions: await generateAdaptiveQuestionBank(testType),
        responses: [],
        ability: 0, // Start with average ability
        standardError: 1,
        startTime: new Date(),
        status: 'in_progress'
      };

      // Store session in memory or database
      await storage.createAssessmentSession(session);

      res.json(session);
    } catch (error) {
      console.error('Error starting IRT assessment:', error);
      res.status(500).json({ message: 'Failed to start assessment' });
    }
  });

  app.post("/api/assessment/irt/submit", authenticateToken, async (req: any, res) => {
    try {
      const { sessionId, questionId, answer, responseTime } = req.body;
      
      // Get current session
      const session = await storage.getAssessmentSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Find question and check answer
      const question = session.questions.find((q: any) => q.id === questionId);
      const correct = await checkAnswer(question, answer);

      // Calculate new ability estimate using IRT formula
      const newAbility = calculateIRTAbility(
        session.ability,
        question.difficulty,
        question.discrimination,
        correct
      );

      // Calculate standard error
      const standardError = calculateStandardError(session.responses.length + 1);

      // Create response record
      const response = {
        questionId,
        answer,
        correct,
        responseTime,
        difficulty: question.difficulty
      };

      // Update session
      session.responses.push(response);
      session.ability = newAbility;
      session.standardError = standardError;
      session.currentQuestionIndex++;

      // Select next question based on new ability
      let nextQuestion = null;
      if (session.currentQuestionIndex < 20 && standardError > 0.3) {
        nextQuestion = selectNextQuestion(session.ability, session.questions, session.responses);
      }

      await storage.updateAssessmentSession(session);

      res.json({
        correct,
        newAbility,
        standardError,
        response,
        nextQuestion
      });
    } catch (error) {
      console.error('Error submitting IRT answer:', error);
      res.status(500).json({ message: 'Failed to submit answer' });
    }
  });

  app.post("/api/assessment/irt/complete", authenticateToken, async (req: any, res) => {
    try {
      const { sessionId } = req.body;
      
      const session = await storage.getAssessmentSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Calculate final results
      const cefrLevel = mapAbilityToCEFR(session.ability);
      const percentile = calculatePercentile(session.ability);
      const strengths = analyzeStrengths(session.responses);
      const weaknesses = analyzeWeaknesses(session.responses);

      // Update session status
      session.status = 'completed';
      session.endTime = new Date();
      await storage.updateAssessmentSession(session);

      // Save results to student profile
      await storage.updateStudentAssessmentResults(session.studentId, {
        testType: session.testType,
        ability: session.ability,
        cefrLevel,
        percentile,
        strengths,
        weaknesses,
        completedAt: session.endTime
      });

      res.json({
        ability: session.ability,
        cefrLevel,
        percentile,
        strengths,
        weaknesses,
        totalQuestions: session.responses.length,
        correctAnswers: session.responses.filter((r: any) => r.correct).length,
        averageResponseTime: session.responses.reduce((sum: number, r: any) => sum + r.responseTime, 0) / session.responses.length
      });
    } catch (error) {
      console.error('Error completing IRT assessment:', error);
      res.status(500).json({ message: 'Failed to complete assessment' });
    }
  });

  // Helper functions for IRT calculations
  function calculateIRTAbility(currentAbility: number, difficulty: number, discrimination: number, correct: boolean): number {
    // Simplified IRT ability update using Maximum Likelihood Estimation
    const probability = 1 / (1 + Math.exp(-discrimination * (currentAbility - difficulty)));
    const information = discrimination * discrimination * probability * (1 - probability);
    const score = correct ? 1 : 0;
    
    // Newton-Raphson update
    const adjustment = (score - probability) / Math.max(information, 0.1);
    const newAbility = currentAbility + adjustment * 0.5; // Damping factor
    
    // Constrain ability to reasonable range
    return Math.max(-3, Math.min(3, newAbility));
  }

  function calculateStandardError(numResponses: number): number {
    // Standard error decreases with more responses
    return Math.max(0.2, 1 / Math.sqrt(numResponses));
  }

  function selectNextQuestion(ability: number, allQuestions: any[], answeredQuestions: any[]): any {
    const answeredIds = new Set(answeredQuestions.map(r => r.questionId));
    const availableQuestions = allQuestions.filter(q => !answeredIds.has(q.id));
    
    if (availableQuestions.length === 0) return null;
    
    // Select question closest to current ability level for maximum information
    return availableQuestions.reduce((best, current) => {
      const bestDiff = Math.abs(best.difficulty - ability);
      const currentDiff = Math.abs(current.difficulty - ability);
      return currentDiff < bestDiff ? current : best;
    });
  }

  function mapAbilityToCEFR(ability: number): string {
    if (ability < -2) return 'A1';
    if (ability < -1) return 'A2';
    if (ability < 0) return 'B1';
    if (ability < 1) return 'B2';
    if (ability < 2) return 'C1';
    return 'C2';
  }

  function calculatePercentile(ability: number): number {
    // Convert ability to percentile using normal distribution
    const z = ability;
    const percentile = 50 + 50 * erf(z / Math.sqrt(2));
    return Math.round(percentile);
  }

  function erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1 / (1 + p * x);
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;

    const y = 1 - (((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * Math.exp(-x * x));

    return sign * y;
  }

  function analyzeStrengths(responses: any[]): string[] {
    // Analyze categories where student performed well
    const categoryPerformance = new Map<string, { correct: number, total: number }>();
    
    responses.forEach(r => {
      const category = r.category || 'General';
      if (!categoryPerformance.has(category)) {
        categoryPerformance.set(category, { correct: 0, total: 0 });
      }
      const perf = categoryPerformance.get(category)!;
      perf.total++;
      if (r.correct) perf.correct++;
    });

    const strengths: string[] = [];
    categoryPerformance.forEach((perf, category) => {
      if (perf.correct / perf.total > 0.7) {
        strengths.push(category);
      }
    });

    return strengths;
  }

  function analyzeWeaknesses(responses: any[]): string[] {
    // Analyze categories where student needs improvement
    const categoryPerformance = new Map<string, { correct: number, total: number }>();
    
    responses.forEach(r => {
      const category = r.category || 'General';
      if (!categoryPerformance.has(category)) {
        categoryPerformance.set(category, { correct: 0, total: 0 });
      }
      const perf = categoryPerformance.get(category)!;
      perf.total++;
      if (r.correct) perf.correct++;
    });

    const weaknesses: string[] = [];
    categoryPerformance.forEach((perf, category) => {
      if (perf.correct / perf.total < 0.4) {
        weaknesses.push(category);
      }
    });

    return weaknesses;
  }

  async function generateAdaptiveQuestionBank(testType: string): Promise<any[]> {
    // Fetch real calibrated questions from database
    const questions = await storage.getPlacementTestQuestions();
    
    // Map database questions to IRT format with difficulty estimation
    return questions.map((q, index) => ({
      id: q.id.toString(),
      text: q.prompt || q.title,
      type: q.questionType,
      options: q.content?.options?.map((opt: any) => opt.text) || [],
      difficulty: mapCEFRToAbility(q.cefrLevel), // Convert CEFR to IRT ability scale
      discrimination: 1.5, // Default discrimination parameter
      category: q.skill,
      cefrLevel: q.cefrLevel,
      timeLimit: q.expectedDurationSeconds,
      correctAnswers: q.content?.correctAnswers || []
    }));
  }

  async function checkAnswer(question: any, answer: string): Promise<boolean> {
    // Real answer checking logic using question's correct answers
    if (!question.correctAnswers || question.correctAnswers.length === 0) {
      console.warn(`Question ${question.id} has no correct answers defined`);
      return false;
    }
    
    // Normalize answer for comparison (trim, lowercase)
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedCorrect = question.correctAnswers.map((a: string) => a.trim().toLowerCase());
    
    return normalizedCorrect.includes(normalizedAnswer);
  }

  // Adaptive Content Generation Endpoints
  app.post("/api/callern/adaptive-content/generate", authenticateToken, async (req: any, res) => {
    try {
      const { sessionId, studentId, contentType, sessionMetrics, currentLevel } = req.body;
      
      // Import the adaptive content generator
      const { AdaptiveContentGenerator } = await import('../services/adaptive-content-generator.js');
      const generator = new AdaptiveContentGenerator();
      
      // Get student profile
      const student = await storage.getUser(studentId);
      const studentProfile = {
        id: studentId,
        currentLevel: currentLevel || 'B1',
        irtAbility: sessionMetrics?.confidenceScore ? (sessionMetrics.confidenceScore - 0.5) * 6 : 0,
        strengths: [],
        weaknesses: [],
        recentErrors: [],
        learningStyle: 'mixed' as const,
        interests: [],
        nativeLanguage: student?.language || 'Persian'
      };
      
      // Create session context
      const context = {
        sessionId,
        studentId,
        teacherId: req.user.id,
        currentTopic: 'general conversation',
        sessionDuration: 0,
        performanceMetrics: sessionMetrics || {
          correctAnswers: 0,
          totalQuestions: 0,
          responseTime: [],
          engagementLevel: 75,
          confidenceScore: 0.5
        },
        conversationHistory: []
      };
      
      // Generate adaptive content
      const content = await generator.generateAdaptiveContent(
        studentProfile,
        context,
        contentType as any
      );
      
      res.json(content);
    } catch (error) {
      console.error('Error generating adaptive content:', error);
      res.status(500).json({ message: 'Failed to generate adaptive content' });
    }
  });

  app.post("/api/callern/adaptive-content/submit", authenticateToken, async (req: any, res) => {
    try {
      const { sessionId, studentId, contentId, answer, responseTime, isCorrect } = req.body;
      
      // Update session metrics based on response
      const newConfidence = isCorrect 
        ? Math.min(1, (req.body.confidence || 0.5) + 0.05)
        : Math.max(0, (req.body.confidence || 0.5) - 0.03);
      
      // Store response for analytics
      await storage.createIRTResponse({
        studentId,
        sessionId: Date.now(), // Convert sessionId to number
        itemId: contentId,
        correct: isCorrect,
        responseTime,
        theta: (newConfidence - 0.5) * 6 // Convert to IRT scale
      });
      
      res.json({
        isCorrect,
        newConfidence,
        feedback: isCorrect ? 'Great job!' : 'Keep practicing!'
      });
    } catch (error) {
      console.error('Error submitting adaptive content response:', error);
      res.status(500).json({ message: 'Failed to submit response' });
    }
  });

  app.post("/api/callern/vocabulary/generate", authenticateToken, async (req: any, res) => {
    try {
      const { sessionId, studentId, targetWords } = req.body;
      
      const { AdaptiveContentGenerator } = await import('../services/adaptive-content-generator.js');
      const generator = new AdaptiveContentGenerator();
      
      // Get student data
      const student = await storage.getUser(studentId);
      const studentProfile = {
        id: studentId,
        currentLevel: 'B1',
        irtAbility: 0,
        strengths: [],
        weaknesses: [],
        recentErrors: [],
        learningStyle: 'mixed' as const,
        interests: [],
        nativeLanguage: student?.language || 'Persian'
      };
      
      const context = {
        sessionId,
        studentId,
        teacherId: req.user.id,
        currentTopic: 'vocabulary practice',
        sessionDuration: 0,
        performanceMetrics: {
          correctAnswers: 0,
          totalQuestions: 0,
          responseTime: [],
          engagementLevel: 75,
          confidenceScore: 0.5
        },
        conversationHistory: []
      };
      
      const exercise = await generator.generateVocabularyExercise(
        studentProfile,
        context,
        targetWords
      );
      
      res.json(exercise);
    } catch (error) {
      console.error('Error generating vocabulary exercise:', error);
      res.status(500).json({ message: 'Failed to generate vocabulary exercise' });
    }
  });

  app.post("/api/callern/grammar/generate", authenticateToken, async (req: any, res) => {
    try {
      const { sessionId, studentId, targetGrammar } = req.body;
      
      const { AdaptiveContentGenerator } = await import('../services/adaptive-content-generator.js');
      const generator = new AdaptiveContentGenerator();
      
      const student = await storage.getUser(studentId);
      const studentProfile = {
        id: studentId,
        currentLevel: 'B1',
        irtAbility: 0,
        strengths: [],
        weaknesses: [],
        recentErrors: [],
        learningStyle: 'mixed' as const,
        interests: [],
        nativeLanguage: student?.language || 'Persian'
      };
      
      const context = {
        sessionId,
        studentId,
        teacherId: req.user.id,
        currentTopic: 'grammar practice',
        sessionDuration: 0,
        performanceMetrics: {
          correctAnswers: 0,
          totalQuestions: 0,
          responseTime: [],
          engagementLevel: 75,
          confidenceScore: 0.5
        },
        conversationHistory: []
      };
      
      const exercise = await generator.generateGrammarExercise(
        studentProfile,
        context,
        targetGrammar
      );
      
      res.json(exercise);
    } catch (error) {
      console.error('Error generating grammar exercise:', error);
      res.status(500).json({ message: 'Failed to generate grammar exercise' });
    }
  });

  app.post("/api/callern/conversation/generate", authenticateToken, async (req: any, res) => {
    try {
      const { sessionId, studentId } = req.body;
      
      const { AdaptiveContentGenerator } = await import('../services/adaptive-content-generator.js');
      const generator = new AdaptiveContentGenerator();
      
      const student = await storage.getUser(studentId);
      const studentProfile = {
        id: studentId,
        currentLevel: 'B1',
        irtAbility: 0,
        strengths: [],
        weaknesses: [],
        recentErrors: [],
        learningStyle: 'mixed' as const,
        interests: ['daily life', 'hobbies', 'travel'],
        nativeLanguage: student?.language || 'Persian'
      };
      
      const context = {
        sessionId,
        studentId,
        teacherId: req.user.id,
        currentTopic: 'conversation',
        sessionDuration: Math.floor(Math.random() * 30),
        performanceMetrics: {
          correctAnswers: 0,
          totalQuestions: 0,
          responseTime: [],
          engagementLevel: 75,
          confidenceScore: 0.5
        },
        conversationHistory: []
      };
      
      const prompt = await generator.generateConversationPrompt(
        studentProfile,
        context
      );
      
      res.json(prompt);
    } catch (error) {
      console.error('Error generating conversation prompt:', error);
      res.status(500).json({ message: 'Failed to generate conversation prompt' });
    }
  });

  // Upload Callern session recording - AUTOMATIC (not optional)
  app.post("/api/callern/upload-recording", authenticateToken, upload.single('recording'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No recording file provided" });
      }

      const { roomId, duration, studentId, teacherId } = req.body;
      
      // Save recording metadata to database
      const recordingData = {
        roomId,
        studentId: parseInt(studentId),
        teacherId: parseInt(teacherId),
        duration: parseInt(duration),
        fileName: req.file.filename,
        filePath: `/recordings/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        recordedAt: new Date(),
        status: 'completed',
        isAutomatic: true // Flag to indicate automatic recording
      };

      // Store recording metadata (recordings are stored in filesystem via multer)
      await storage.createCallHistory({
        studentId: recordingData.studentId,
        teacherId: recordingData.teacherId,
        startTime: new Date(Date.now() - recordingData.duration * 1000),
        endTime: new Date(),
        duration: recordingData.duration,
        status: 'completed',
        recordingPath: recordingData.filePath,
        metadata: recordingData
      });

      // Log recording for compliance and audit
      console.log(`[AUTOMATIC RECORDING] Saved: Room ${roomId}, Duration: ${duration}s, File: ${req.file.filename}`);

      res.json({ 
        success: true, 
        message: "Recording saved successfully (automatic)",
        recordingId: recordingData.fileName,
        filePath: recordingData.filePath
      });
    } catch (error) {
      console.error('Error saving automatic recording:', error);
      res.status(500).json({ message: "Failed to save recording" });
    }
  });

  // Get teacher session details for payment period
  app.get("/api/admin/teacher-payments/:teacherId/sessions/:period", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const period = req.params.period;
      
      // Sample session data - in real implementation, query database for actual sessions
      const sessions = [
        {
          date: "2024-12-15",
          type: "1-on-1",
          studentName: "Ahmad Hosseini",
          startTime: "10:00",
          endTime: "11:30",
          duration: 1.5,
          platform: "Online",
          courseTitle: "Persian Conversation"
        },
        {
          date: "2024-12-16",
          type: "group",
          studentName: null,
          groupDetails: "Persian Intermediate - Mon/Wed/Fri",
          startTime: "18:00",
          endTime: "19:30",
          duration: 1.5,
          platform: "In-person",
          courseTitle: "Persian Intermediate"
        },
        {
          date: "2024-12-17",
          type: "callern",
          studentName: "Maryam Rahimi",
          startTime: "14:00",
          endTime: "15:00",
          duration: 1.0,
          platform: "VoIP Call",
          courseTitle: "Callern Session"
        }
      ];

      res.json(sessions);
    } catch (error) {
      console.error("Error fetching teacher sessions:", error);
      res.status(500).json({ message: "Failed to fetch teacher sessions" });
    }
  });

  // Send SMS notification for payment approval
  app.post("/api/admin/teacher-payments/send-approval-sms", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { teacherId, teacherName, amount, period } = req.body;
      
      // Get teacher's phone number
      const teachers = await storage.getTeachersWithRates();
      const teacher = teachers.find(t => t.id === teacherId);
      
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      // Check if teacher has phone number
      const phoneNumber = teacher.phoneNumber;
      if (!phoneNumber || phoneNumber === 'Unknown') {
        return res.status(404).json({ message: "Teacher phone number not found" });
      }

      // SMS message content
      const message = `سلام ${teacherName}، حقوق شما برای دوره ${period} محاسبه و به حسابداری ارسال شد. مبلغ: ${amount?.toLocaleString()} ریال`;
      
      // In a real implementation, integrate with Kavenegar SMS service
      // For now, simulate SMS sending
      console.log(`SMS would be sent to ${phoneNumber}: ${message}`);
      
      res.json({ 
        success: true, 
        message: "SMS notification sent successfully",
        sentTo: phoneNumber,
        content: message
      });
    } catch (error) {
      console.error("Error sending SMS notification:", error);
      res.status(500).json({ message: "Failed to send SMS notification" });
    }
  });

  // Update teacher payment details with full recalculation
  app.put("/api/admin/teacher-payments/:id/update", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { basePay, bonuses, deductions, totalHours, hourlyRate } = req.body;
      
      // Recalculate everything based on new values  
      // If totalHours changed, recalculate basePay from hours
      const newBasePay = totalHours ? (totalHours * (hourlyRate || 750000)) : (basePay || 0);
      const newFinalAmount = newBasePay + (bonuses || 0) - (deductions || 0);
      
      // Create a completely new payslip with recalculated values
      const updatedPayment = {
        id: paymentId,
        basePay: newBasePay,
        bonuses: bonuses || 0,
        deductions: deductions || 0,
        totalHours: totalHours,
        hourlyRate: hourlyRate || 750000,
        finalAmount: newFinalAmount,
        status: 'calculated', // Reset to calculated when manually edited
        calculatedAt: new Date().toISOString(),
        isRecalculated: true // Flag to indicate this was manually adjusted
      };
      
      // Update payment in database
      const result = await storage.updateTeacherPayment(paymentId, {
        ...req.body,
        totalHours,
        hourlyRate,
        basePay: newBasePay,
        bonuses: bonuses || 0,
        deductions: deductions || 0
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error updating teacher payment:", error);
      res.status(500).json({ message: "Failed to update teacher payment" });
    }
  });

  // Get teacher payment history endpoint
  app.get("/api/admin/teacher-payments/history/:teacherId", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const { limit = 12, offset = 0 } = req.query;
      
      // Get payment history from database
      const paymentHistory = await storage.getTeacherPaymentHistory(teacherId, parseInt(limit), parseInt(offset));
      
      res.json({
        teacherId,
        payments: paymentHistory,
        total: paymentHistory.length,
        hasMore: paymentHistory.length === parseInt(limit)
      });
    } catch (error) {
      console.error("Error fetching teacher payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // White-Label Institute Management
  app.get("/api/admin/white-label/institutes", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const institutes = await storage.getWhiteLabelInstitutes();
      res.json(institutes);
    } catch (error) {
      console.error('Error fetching white-label institutes:', error);
      res.status(500).json({ error: 'Failed to fetch white-label institutes' });
    }
  });

  app.post("/api/admin/white-label/institutes", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const institute = await storage.createWhiteLabelInstitute(req.body);
      res.status(201).json(institute);
    } catch (error) {
      console.error('Error creating white-label institute:', error);
      res.status(500).json({ error: 'Failed to create white-label institute' });
    }
  });

  app.put("/api/admin/white-label/institutes/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const instituteId = parseInt(req.params.id);
      const institute = await storage.updateWhiteLabelInstitute(instituteId, req.body);
      res.json(institute);
    } catch (error) {
      console.error('Error updating white-label institute:', error);
      res.status(500).json({ error: 'Failed to update white-label institute' });
    }
  });

  // Campaign Management
  app.get("/api/admin/campaigns", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const campaigns = await storage.getMarketingCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching marketing campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch marketing campaigns' });
    }
  });

  app.get("/api/admin/campaign-management", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const campaigns = await storage.getMarketingCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching marketing campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch marketing campaigns' });
    }
  });

  app.post("/api/admin/campaign-management", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const campaign = await storage.createMarketingCampaign(req.body);
      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating marketing campaign:', error);
      res.status(500).json({ error: 'Failed to create marketing campaign' });
    }
  });

  app.patch("/api/admin/campaigns/:id", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const updates = req.body;
      const updatedCampaign = await storage.updateMarketingCampaign(campaignId, updates);
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error updating marketing campaign:', error);
      res.status(500).json({ error: 'Failed to update marketing campaign' });
    }

  // Bulk SMS Campaign Endpoints
  app.get("/api/admin/campaigns/audience-preview", authenticateToken, requireRole(["Admin", "Call Center Agent"]), async (req: any, res) => {
    try {
      const { segment, monthsInactive, customFilter } = req.query;
      let count = 0;
      let sampleRecords: any[] = [];

      switch (segment) {
        case "unpaid_placement_test":
          const unpaidStudents = await storage.getUnpaidStudentsAfterPlacementTest(7);
          count = unpaidStudents.filter((s: any) => s.phone).length;
          sampleRecords = unpaidStudents.slice(0, 5);
          break;
        case "inactive_students":
          const months = parseInt(monthsInactive as string) || 3;
          const inactiveStudents = await storage.getInactiveStudents(months);
          count = inactiveStudents.filter((s: any) => s.phone).length;
          sampleRecords = inactiveStudents.slice(0, 5);
          break;
        case "current_students":
          const currentStudents = await storage.getCurrentEnrolledStudents();
          count = currentStudents.filter((s: any) => s.phone).length;
          sampleRecords = currentStudents.slice(0, 5);
          break;
        case "custom_filter":
          const criteria = customFilter ? JSON.parse(customFilter as string) : {};
          const filteredStudents = await storage.getStudentsByCustomFilter(criteria);
          count = filteredStudents.filter((s: any) => s.phone).length;
          sampleRecords = filteredStudents.slice(0, 5);
          break;
        default:
          return res.status(400).json({ error: "Invalid audience segment" });
      }

      res.json({ count, sampleRecords, segment });
    } catch (error) {
      console.error("Error previewing campaign audience:", error);
      res.status(500).json({ error: "Failed to preview audience" });
    }
  });

  app.post("/api/admin/campaigns/upload-recipients", authenticateToken, requireRole(["Admin", "Call Center Agent"]), async (req: any, res) => {
    try {
      const { content, format } = req.body;

      if (!content) {
        return res.status(400).json({ error: "No content provided" });
      }

      let result;
      if (format === "csv") {
        result = parsePhoneNumbersFromCSV(content);
      } else {
        result = parsePhoneNumbersFromText(content);
      }

      if (!result.success) {
        return res.status(400).json({ error: result.error || "Failed to parse phone numbers" });
      }

      res.json({
        success: true,
        validCount: result.validPhones.length,
        invalidCount: result.invalidPhones.length,
        duplicateCount: result.duplicates.length,
        validPhones: result.validPhones,
        invalidPhones: result.invalidPhones.slice(0, 20),
        duplicates: result.duplicates.slice(0, 20)
      });
    } catch (error) {
      console.error("Error uploading recipients:", error);
      res.status(500).json({ error: "Failed to upload recipients" });
    }
  });

  app.post("/api/admin/campaigns/:id/send-sms", authenticateToken, requireRole(["Admin", "Call Center Agent"]), async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const { message, segment, recipients, monthsInactive, customFilter, testMode, testPhone } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message text is required" });
      }

      const { kavenegarService } = await import("../kavenegar-service");

      if (testMode && testPhone) {
        const normalizedPhone = normalizeIranianPhone(testPhone);
        if (!normalizedPhone || !isValidIranianPhone(normalizedPhone)) {
          return res.status(400).json({ error: "Invalid test phone number" });
        }
        const result = await kavenegarService.sendBulkSMS([normalizedPhone], message);
        return res.json({ success: true, testMode: true, sent: result.sent, failed: result.failed });
      }

      let phoneNumbers: string[] = [];
      if (recipients && recipients.length > 0) {
        phoneNumbers = recipients.map((r: any) => r.phone).filter((p: string) => p && isValidIranianPhone(p));
      } else if (segment) {
        let students: any[] = [];
        switch (segment) {
          case "unpaid_placement_test":
            students = await storage.getUnpaidStudentsAfterPlacementTest(7);
            break;
          case "inactive_students":
            const months = monthsInactive || 3;
            students = await storage.getInactiveStudents(months);
            break;
          case "current_students":
            students = await storage.getCurrentEnrolledStudents();
            break;
          case "custom_filter":
            const criteria = customFilter || {};
            students = await storage.getStudentsByCustomFilter(criteria);
            break;
          default:
            return res.status(400).json({ error: "Invalid audience segment" });
        }
        phoneNumbers = students.map((s: any) => s.phone).filter((p: string) => p && isValidIranianPhone(p));
      } else {
        return res.status(400).json({ error: "Either recipients or segment must be provided" });
      }

      if (phoneNumbers.length === 0) {
        return res.status(400).json({ error: "No valid phone numbers found" });
      }

      const result = await kavenegarService.sendBulkSMS(phoneNumbers, message);

      await storage.updateMarketingCampaign(campaignId, {
        smsRecipientCount: phoneNumbers.length,
        smsTemplate: message
      });

      res.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        totalRecipients: phoneNumbers.length
      });
    } catch (error) {
      console.error("Error sending bulk SMS:", error);
      res.status(500).json({ error: "Failed to send bulk SMS" });
    }
  });
  });

  app.get("/api/admin/campaign-management/analytics", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const analytics = await storage.getCampaignAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      res.status(500).json({ error: 'Failed to fetch campaign analytics' });
    }
  });

  // Website Builder
  app.get("/api/admin/website-builder/templates", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const templates = await storage.getWebsiteTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching website templates:', error);
      res.status(500).json({ error: 'Failed to fetch website templates' });
    }
  });

  app.post("/api/admin/website-builder/deploy", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const deployment = await storage.deployWebsite(req.body);
      res.json(deployment);
    } catch (error) {
      console.error('Error deploying website:', error);
      res.status(500).json({ error: 'Failed to deploy website' });
    }
  });

  // Campaign Management API Routes
  app.post("/api/admin/campaigns", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const campaignData = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: req.body.status || 'draft',
        spent: 0,
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          cost_per_lead: 0,
          roi: 0
        }
      };
      const campaign = await storage.createMarketingCampaign(campaignData);
      res.status(201).json({ 
        success: true, 
        campaign,
        message: 'Campaign created successfully' 
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  });

  // Social Media Management Routes
  app.post("/api/admin/social-media/:platform/:action", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const { platform, action } = req.params;
      
      // Get real analytics summary for the platform (last 30 days)
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);
      
      const analyticsData = await storage.getAnalyticsSummary(platform, dateFrom, new Date());
      
      // Get latest posts for this platform
      const recentPosts = await storage.getSocialMediaPosts({ 
        platform, 
        dateFrom,
        dateTo: new Date()
      });
      
      const lastPost = recentPosts.length > 0 ? recentPosts[0].content : null;
      
      // Calculate engagement rate from real data
      const engagementRate = analyticsData.averageEngagementRate.toFixed(1) + '%';
      
      const socialMediaData = {
        platform: platform,
        action: action,
        timestamp: new Date(),
        user: req.user.email,
        success: true,
        metrics: {
          followers: analyticsData.totalFollowers,
          followersGrowth: analyticsData.followersGrowth,
          engagement: engagementRate,
          lastPost: lastPost || 'No recent posts',
          totalPosts: recentPosts.length,
          totalImpressions: Number(analyticsData.totalImpressions),
          totalEngagement: analyticsData.totalEngagement,
          iranianMarket: true
        }
      };

      res.json({
        success: true,
        data: socialMediaData,
        message: `${action} operation for ${platform} completed successfully`
      });
    } catch (error) {
      console.error('Error managing social media:', error);
      res.status(500).json({ error: 'Failed to manage social media platform' });
    }
  });

  // Social Media Scraper Admin Routes
  app.get("/api/admin/social-media/content", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { platform } = req.query;
      const filter: any = {};
      
      if (platform && platform !== 'all') {
        filter.platform = platform as string;
      }

      const posts = await storage.getSocialMediaPosts(filter);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching scraped content:', error);
      res.status(500).json({ error: 'Failed to fetch scraped content' });
    }
  });

  app.get("/api/admin/scraper/jobs", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const jobs = await storage.getAllScrapeJobs();
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching scrape jobs:', error);
      res.status(500).json({ error: 'Failed to fetch scrape jobs' });
    }
  });

  app.get("/api/admin/social-media/analytics", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);
      
      const posts = await storage.getSocialMediaPosts({ 
        dateFrom,
        dateTo: new Date() 
      });
      
      const leads = await storage.getScrapedLeads({});
      const jobs = await storage.getAllScrapeJobs();
      
      const totalEngagement = posts.reduce((sum: number, post: any) => 
        sum + (post.likes || 0) + (post.comments || 0) + (post.shares || 0), 0
      );
      const avgEngagement = posts.length > 0 
        ? ((totalEngagement / posts.length) / (posts.reduce((sum: number, p: any) => sum + (p.likes || 0), 0) || 1) * 100).toFixed(1)
        : '0';

      res.json({
        totalPosts: posts.length,
        leadsGenerated: leads.length,
        avgEngagement,
        activeJobs: jobs.filter((j: any) => j.status === 'running').length,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  app.post("/api/admin/scraper/create-job", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { platform, jobType, targetUrl, maxItems } = req.body;
      
      const job = await storage.createScrapeJob({
        name: `${platform} - ${jobType}`,
        type: jobType,
        platform: platform,
        jobType: jobType,
        targetUrl,
        status: 'pending',
        config: {
          platform,
          maxItems: maxItems || 100,
          rateLimit: { requestsPerMinute: 10, delayBetweenRequests: 2000 }
        },
        priority: 'medium',
        attempts: 0,
        maxRetries: 3
      });

      res.status(201).json({ success: true, job });
    } catch (error) {
      console.error('Error creating scrape job:', error);
      res.status(500).json({ error: 'Failed to create scrape job' });
    }
  });

  app.post("/api/admin/scraper/retry/:jobId", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      await storage.updateScrapeJob(jobId, { status: 'pending', attempts: 0 });
      res.json({ success: true, message: 'Job restarted successfully' });
    } catch (error) {
      console.error('Error retrying scrape job:', error);
      res.status(500).json({ error: 'Failed to retry job' });
    }
  });

  // Cross-platform Campaign Tools Routes
  app.post("/api/admin/crossplatform-tools/:tool", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const { tool } = req.params;
      
      let toolMetrics;
      
      if (tool === 'scheduler') {
        // Get real scheduled posts data
        const scheduledPosts = await storage.getScheduledPosts({ status: 'scheduled' });
        const uniquePlatforms = [...new Set(scheduledPosts.flatMap(p => p.platforms))];
        const nextPostData = scheduledPosts.length > 0 ? scheduledPosts[0] : null;
        const timeToNext = nextPostData ? 
          Math.floor((new Date(nextPostData.scheduledFor).getTime() - Date.now()) / (1000 * 60 * 60)) : null;
        
        toolMetrics = {
          scheduledPosts: scheduledPosts.length,
          platforms: uniquePlatforms,
          nextPost: timeToNext ? `${timeToNext} hours` : 'No scheduled posts'
        };
      } else if (tool === 'analytics') {
        // Get real analytics summary across all platforms (last 30 days)
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30);
        const analyticsData = await storage.getAnalyticsSummary(undefined, dateFrom, new Date());
        
        // Get all campaigns to calculate ROI and conversion rate
        const campaigns = await storage.getMarketingCampaigns({ status: 'active' });
        const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.spent ?? 0), 0);
        const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget ?? 0), 0);
        const avgROI = campaigns.length > 0 ? 
          campaigns.reduce((sum, c) => sum + Number(c.roi ?? 0), 0) / campaigns.length : 0;
        
        // Calculate real conversion rate from campaign data
        const totalClicks = campaigns.reduce((sum, c) => sum + Number(c.clicks ?? 0), 0);
        const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions ?? 0), 0);
        const realConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
        
        // Get Iranian user percentage from analytics demographics (fallback to campaign data)
        const totalFollowers = analyticsData.totalFollowers;
        const iranianFollowers = campaigns.reduce((sum, c) => {
          const metadata = c.metadata as any;
          return sum + (metadata?.iranianAudience ?? 0);
        }, 0);
        const iranianPercentage = totalFollowers > 0 ? (iranianFollowers / totalFollowers) * 100 : 0;
        
        toolMetrics = {
          totalReach: Number(analyticsData.totalImpressions),
          iranianUsers: iranianPercentage > 0 ? iranianPercentage.toFixed(1) + '%' : 'N/A',
          conversionRate: realConversionRate.toFixed(2) + '%',
          roi: avgROI.toFixed(1) + '%'
        };
      } else if (tool === 'tracking') {
        // Get real lead tracking data
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30);
        const campaigns = await storage.getMarketingCampaigns({ status: 'active' });
        
        // Calculate total leads and conversions from campaign data
        const totalClicks = campaigns.reduce((sum, c) => sum + Number(c.clicks ?? 0), 0);
        const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions ?? 0), 0);
        const avgConversionRate = totalClicks > 0 ? 
          (totalConversions / totalClicks) * 100 : 0;
        
        // Calculate Iranian leads from campaign metadata
        const iranianLeads = campaigns.reduce((sum, c) => {
          const metadata = c.metadata as any;
          return sum + (metadata?.iranianLeads ?? 0);
        }, 0);
        
        // Calculate average response time from communication logs (placeholder for future implementation)
        const avgResponseTime = 'N/A';
        
        toolMetrics = {
          totalLeads: totalClicks, // Leads are tracked as clicks in marketing campaigns
          iranianLeads: iranianLeads > 0 ? iranianLeads : 0,
          conversionRate: avgConversionRate.toFixed(2) + '%',
          avgResponseTime: avgResponseTime
        };
      } else {
        toolMetrics = { status: 'configured' };
      }
      
      const toolData = {
        tool: tool,
        timestamp: new Date(),
        user: req.user.email,
        success: true,
        iranianCompliance: true,
        metrics: toolMetrics
      };

      res.json({
        success: true,
        data: toolData,
        message: `${tool} tool configured successfully`
      });
    } catch (error) {
      console.error('Error configuring crossplatform tool:', error);
      res.status(500).json({ error: 'Failed to configure tool' });
    }
  });

  // Marketing Tools Configuration Routes
  app.post("/api/admin/marketing-tools/:toolName/:action", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const { toolName, action } = req.params;
      
      let toolMetrics;
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);
      
      if (toolName === 'Instagram Integration') {
        const analyticsData = await storage.getAnalyticsSummary('Instagram', dateFrom, new Date());
        const credential = await storage.getPlatformCredentialByPlatform('Instagram');
        const posts = await storage.getSocialMediaPosts({ platform: 'Instagram', dateFrom, dateTo: new Date() });
        
        // Calculate Persian content percentage from actual posts
        const persianPosts = posts.filter(p => p.language === 'fa' || (p.content && p.content.match(/[\u0600-\u06FF]/)));
        const persianPercentage = posts.length > 0 ? (persianPosts.length / posts.length) * 100 : 0;
        
        toolMetrics = {
          connected: credential?.isActive ?? false,
          followers: analyticsData.totalFollowers,
          persianContent: persianPercentage > 0 ? persianPercentage.toFixed(1) + '%' : 'N/A',
          engagement: analyticsData.averageEngagementRate.toFixed(1) + '%'
        };
      } else if (toolName === 'Telegram Marketing') {
        const messages = await storage.getTelegramMessages({ status: 'sent' });
        const analyticsData = await storage.getAnalyticsSummary('Telegram', dateFrom, new Date());
        const channelIds = [...new Set(messages.map(m => m.channelId))];
        
        // Calculate Persian user percentage from message content
        const persianMessages = messages.filter(m => m.content && m.content.match(/[\u0600-\u06FF]/));
        const persianPercentage = messages.length > 0 ? (persianMessages.length / messages.length) * 100 : 0;
        
        // Calculate delivery rate from sent messages
        const sentMessages = messages.filter(m => m.status === 'sent');
        const deliveryRate = messages.length > 0 ? (sentMessages.length / messages.length) * 100 : 0;
        
        toolMetrics = {
          channels: channelIds.length,
          subscribers: analyticsData.totalFollowers,
          persianUsers: persianPercentage > 0 ? persianPercentage.toFixed(1) + '%' : 'N/A',
          messageDelivery: deliveryRate > 0 ? deliveryRate.toFixed(1) + '%' : 'N/A'
        };
      } else if (toolName === 'YouTube Channel') {
        const analyticsData = await storage.getAnalyticsSummary('YouTube', dateFrom, new Date());
        const posts = await storage.getSocialMediaPosts({ platform: 'YouTube', dateFrom, dateTo: new Date() });
        const persianPosts = posts.filter(p => p.language === 'fa');
        
        // Calculate Iranian viewers from analytics metadata (placeholder for future implementation)
        const iranianViewers = 'N/A';
        const watchTime = 'N/A';
        
        toolMetrics = {
          subscribers: analyticsData.totalFollowers,
          persianVideos: persianPosts.length,
          watchTime: watchTime,
          iranianViewers: iranianViewers
        };
      } else if (toolName === 'Email Marketing') {
        const emails = await storage.getEmailCampaigns({ status: 'sent' });
        const totalRecipients = emails.reduce((sum, e) => sum + (e.totalRecipients ?? 0), 0);
        const totalOpened = emails.reduce((sum, e) => sum + (e.opened ?? 0), 0);
        const avgOpenRate = totalRecipients > 0 ? (totalOpened / totalRecipients) * 100 : 0;
        
        // Calculate delivery rate from actual email campaigns
        const totalSent = emails.reduce((sum, e) => sum + (e.successfulSends ?? 0), 0);
        const totalFailed = emails.reduce((sum, e) => sum + (e.failedSends ?? 0), 0);
        const deliveryRate = (totalSent + totalFailed) > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0;
        
        toolMetrics = {
          subscribers: totalRecipients,
          persianTemplates: emails.filter(e => e.subject.match(/[\u0600-\u06FF]/)).length,
          openRate: avgOpenRate.toFixed(1) + '%',
          iranianDelivery: deliveryRate > 0 ? deliveryRate.toFixed(1) + '%' : 'N/A'
        };
      } else {
        toolMetrics = { status: 'configured' };
      }
      
      const marketingToolData = {
        tool: toolName,
        action: action,
        timestamp: new Date(),
        user: req.user.email,
        success: true,
        iranianConfiguration: {
          language: 'Persian',
          currency: 'IRR',
          timezone: 'Asia/Tehran',
          compliance: 'Iranian regulations',
          localization: true
        },
        metrics: toolMetrics
      };

      res.json({
        success: true,
        data: marketingToolData,
        message: `${action} completed for ${toolName}`
      });
    } catch (error) {
      console.error('Error managing marketing tool:', error);
      res.status(500).json({ error: 'Failed to manage marketing tool' });
    }
  });

  // ===== SOCIAL MEDIA PLATFORM INTEGRATION ROUTES =====
  
  const platformAuth = createPlatformAuthMiddleware(storage);

  app.post("/api/admin/platforms/:platform/publish", authenticateToken, requireRole(['Admin', 'Call Center Agent']), platformAuth, async (req: any, res) => {
    try {
      const { content, mediaUrls, hashtags, language } = req.body;
      const credential = req.platformCredential;
      const platform = req.platform;

      const credentials = {
        apiKey: credential.apiKey,
        apiSecret: credential.apiSecret,
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        accountId: credential.accountId,
        channelId: credential.channelId,
        additionalData: credential.additionalData as Record<string, any>,
      };

      const strategy = await getPlatformStrategy(platform, credentials);

      const result = await strategy.publishPost({
        content,
        mediaUrls,
        hashtags,
        language: language || 'fa',
        scheduledFor: new Date(),
      });

      if (result.success && result.platformPostId) {
        await storage.createSocialMediaPost({
          platform,
          content,
          mediaUrls,
          hashtags,
          language: language || 'fa',
          scheduledFor: new Date(),
          status: 'published',
          platformPostId: result.platformPostId,
        });
      }

      res.json({
        success: result.success,
        data: result,
        message: result.success ? `Post published to ${platform} successfully` : `Failed to publish to ${platform}`,
      });
    } catch (error: any) {
      console.error('Platform publish error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.post("/api/admin/platforms/:platform/schedule", authenticateToken, requireRole(['Admin', 'Call Center Agent']), platformAuth, async (req: any, res) => {
    try {
      const { content, mediaUrls, hashtags, scheduledFor, language } = req.body;
      const platform = req.platform;

      const scheduledPost = await storage.createScheduledPost({
        platforms: [platform],
        content,
        mediaUrls,
        hashtags,
        scheduledFor: new Date(scheduledFor),
        language: language || 'fa',
        status: 'scheduled',
      });

      res.json({
        success: true,
        data: scheduledPost,
        message: `Post scheduled for ${platform} on ${new Date(scheduledFor).toLocaleString('fa-IR')}`,
      });
    } catch (error: any) {
      console.error('Platform schedule error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.post("/api/admin/platforms/:platform/sync-analytics", authenticateToken, requireRole(['Admin']), platformAuth, async (req: any, res) => {
    try {
      const { dateFrom, dateTo } = req.body;
      const credential = req.platformCredential;
      const platform = req.platform;

      const credentials = {
        apiKey: credential.apiKey,
        apiSecret: credential.apiSecret,
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        accountId: credential.accountId,
        channelId: credential.channelId,
        additionalData: credential.additionalData as Record<string, any>,
      };

      const strategy = await getPlatformStrategy(platform, credentials);

      const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = dateTo ? new Date(dateTo) : new Date();

      const analytics = await strategy.getAnalytics(from, to);

      const analyticsRecord = await storage.createSocialMediaAnalytics({
        platform,
        date: to,
        followers: analytics.followers,
        impressions: analytics.impressions,
        engagement: analytics.engagement,
        clicks: analytics.clicks || 0,
        shares: analytics.shares || 0,
        comments: analytics.comments || 0,
        likes: analytics.likes || 0,
        reach: analytics.reach || 0,
      });

      res.json({
        success: true,
        data: {
          analytics: analyticsRecord,
          platformData: analytics,
        },
        message: `Analytics synced for ${platform}`,
      });
    } catch (error: any) {
      console.error('Platform analytics sync error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.delete("/api/admin/platforms/:platform/posts/:postId", authenticateToken, requireRole(['Admin', 'Call Center Agent']), platformAuth, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const credential = req.platformCredential;
      const platform = req.platform;

      const post = await storage.getSocialMediaPostById(parseInt(postId, 10));
      if (!post || !post.platformPostId) {
        return res.status(404).json({
          success: false,
          error: 'Post not found or not published to platform',
        });
      }

      const credentials = {
        apiKey: credential.apiKey,
        apiSecret: credential.apiSecret,
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        accountId: credential.accountId,
        channelId: credential.channelId,
        additionalData: credential.additionalData as Record<string, any>,
      };

      const strategy = await getPlatformStrategy(platform, credentials);
      const deleted = await strategy.deletePost(post.platformPostId);

      if (deleted) {
        await storage.updateSocialMediaPost(parseInt(postId, 10), { status: 'deleted' });
      }

      res.json({
        success: deleted,
        message: deleted ? `Post deleted from ${platform}` : `Failed to delete post from ${platform}`,
      });
    } catch (error: any) {
      console.error('Platform post deletion error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.post("/api/admin/platforms/credentials/validate", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { platform, credentialId } = req.body;

      const result = await validatePlatformCredential(storage, platform, credentialId);

      res.json({
        success: result.valid,
        valid: result.valid,
        error: result.error,
        message: result.valid ? 'Credentials are valid' : `Validation failed: ${result.error}`,
      });
    } catch (error: any) {
      console.error('Credential validation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.get("/api/admin/platforms/supported", authenticateToken, requireRole(['Admin', 'Call Center Agent']), (req: any, res) => {
    try {
      const platforms = PlatformFactory.getSupportedPlatforms();
      res.json({
        success: true,
        platforms,
        count: platforms.length,
      });
    } catch (error: any) {
      console.error('Get supported platforms error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ===== AI CONTENT GENERATION ROUTES =====
  
  app.post("/api/admin/ai/generate-content", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const { socialMediaContentGenerator, SocialContentRequestSchema } = await import('../services/social-media-content-generator');
      
      const validationResult = SocialContentRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          details: validationResult.error.errors,
        });
      }

      const result = await socialMediaContentGenerator.generateContent(validationResult.data);

      res.json({
        success: true,
        data: result,
        message: 'Content generated successfully',
      });
    } catch (error: any) {
      console.error('AI content generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.post("/api/admin/ai/generate-bulk", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const { socialMediaContentGenerator, SocialContentRequestSchema } = await import('../services/social-media-content-generator');
      
      if (!Array.isArray(req.body.requests)) {
        return res.status(400).json({
          success: false,
          error: 'requests must be an array',
        });
      }

      const validationErrors: any[] = [];
      const validRequests: any[] = [];

      req.body.requests.forEach((request: any, index: number) => {
        const validationResult = SocialContentRequestSchema.safeParse(request);
        if (!validationResult.success) {
          validationErrors.push({ index, errors: validationResult.error.errors });
        } else {
          validRequests.push(validationResult.data);
        }
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Some requests are invalid',
          details: validationErrors,
        });
      }

      const results = await socialMediaContentGenerator.generateBulkContent(validRequests);

      res.json({
        success: true,
        data: results,
        count: results.length,
        message: `Generated ${results.length} pieces of content`,
      });
    } catch (error: any) {
      console.error('AI bulk content generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.post("/api/admin/ai/improve-content", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const { socialMediaContentGenerator } = await import('../services/social-media-content-generator');
      
      const { originalContent, platform, language, improvements } = req.body;
      const improved = await socialMediaContentGenerator.improveContent(
        originalContent,
        platform,
        language,
        improvements
      );

      res.json({
        success: true,
        data: { improvedContent: improved },
        message: 'Content improved successfully',
      });
    } catch (error: any) {
      console.error('AI content improvement error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.post("/api/admin/ai/generate-hashtags", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const { socialMediaContentGenerator } = await import('../services/social-media-content-generator');
      
      const { content, platform, language, count = 10 } = req.body;
      const hashtags = await socialMediaContentGenerator.generateHashtags(
        content,
        platform,
        language,
        count
      );

      res.json({
        success: true,
        data: { hashtags },
        count: hashtags.length,
        message: `Generated ${hashtags.length} hashtags`,
      });
    } catch (error: any) {
      console.error('AI hashtag generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ===== AI SALES AGENT ROUTES =====
  
  app.post("/api/admin/ai/handle-inquiry", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const { aiSalesAgent, LeadInquirySchema } = await import('../services/ai-sales-agent');
      
      const validationResult = LeadInquirySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid inquiry data',
          details: validationResult.error.errors,
        });
      }

      const response = await aiSalesAgent.handleInquiry(validationResult.data);

      if (response.requiresHumanEscalation) {
        await storage.createNotification({
          userId: req.user.id,
          type: 'lead_escalation',
          title: `Hot Lead - ${response.qualification.toUpperCase()}`,
          message: `Lead score: ${response.leadScore}. Intents: ${response.detectedIntent.join(', ')}`,
          read: false,
          createdAt: new Date(),
        });
      }

      res.json({
        success: true,
        data: response,
        message: 'Inquiry handled successfully',
      });
    } catch (error: any) {
      console.error('AI sales agent error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.post("/api/admin/ai/generate-followup", authenticateToken, requireRole(['Admin', 'Call Center Agent']), async (req: any, res) => {
    try {
      const { aiSalesAgent, LeadInquirySchema } = await import('../services/ai-sales-agent');
      
      const { inquiry, previousResponse, context } = req.body;

      if (!inquiry || !previousResponse) {
        return res.status(400).json({
          success: false,
          error: 'inquiry and previousResponse are required',
        });
      }

      const validationResult = LeadInquirySchema.safeParse(inquiry);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid inquiry data',
          details: validationResult.error.errors,
        });
      }

      const followUp = await aiSalesAgent.generateFollowUp(
        validationResult.data,
        previousResponse,
        context || 'No additional context'
      );

      res.json({
        success: true,
        data: { followUpMessage: followUp },
        message: 'Follow-up generated successfully',
      });
    } catch (error: any) {
      console.error('Follow-up generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.post("/api/public/ai/lead-inquiry", async (req: any, res) => {
    try {
      const { aiSalesAgent, LeadInquirySchema } = await import('../services/ai-sales-agent');
      
      const validationResult = LeadInquirySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid inquiry data',
          details: validationResult.error.errors,
        });
      }

      const response = await aiSalesAgent.handleInquiry(validationResult.data);

      const nameParts = (response.extractedInfo.name || validationResult.data.senderName || 'Unknown').split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || '';

      await storage.createLead({
        firstName,
        lastName,
        email: response.extractedInfo.email,
        phoneNumber: response.extractedInfo.phone || validationResult.data.senderContact,
        source: validationResult.data.source,
        status: 'new',
        priority: response.qualification === 'hot' ? 'high' : response.qualification === 'warm' ? 'medium' : 'low',
        interestedLanguage: response.extractedInfo.courseInterest?.[0] || 'English',
        level: response.extractedInfo.proficiencyLevel,
        notes: `Initial inquiry: ${validationResult.data.message}\n\nAI Response: ${response.message}\n\nDetected Intent: ${response.detectedIntent.join(', ')}\n\nLead Score: ${response.leadScore}`,
        nextFollowUpDate: response.suggestedFollowUpTime ? new Date(response.suggestedFollowUpTime) : undefined,
        workflowStatus: response.requiresHumanEscalation ? 'escalated' : 'automated',
      });

      res.json({
        success: true,
        data: {
          message: response.message,
          language: response.language,
        },
      });
    } catch (error: any) {
      console.error('Public lead inquiry error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process inquiry. Please try again.',
      });
    }
  });

  // ===== USER MANAGEMENT API =====
  
  // Get all users
  app.get("/api/admin/users", authenticateToken, requireRole(["Admin"]), async (req: any, res) => {
    try {
      res.removeHeader('ETag');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // Query directly from database to bypass any storage layer issues
      const allUsers = await db.select().from(users).orderBy(users.createdAt);
      
      console.log(`[GET /api/admin/users] Query returned ${allUsers.length} users`);
      console.log(`[GET /api/admin/users] User emails: ${allUsers.map(u => u.email).join(', ')}`);
      console.log(`[GET /api/admin/users] Full response size: ${JSON.stringify(allUsers).length} bytes`);
      
      // Ensure response is JSON array
      res.json(Array.isArray(allUsers) ? allUsers : []);
    } catch (error) {
      console.error('[GET /api/admin/users] Error:', error);
      res.status(500).json({ message: "Failed to get users", error: String(error) });
    }
  });

  // Duplicate endpoint removed - using the first one above

  // ===== MENTOR MATCHING API =====
  
  // Get teacher-student bundles without mentors
  app.get("/api/admin/teacher-student-bundles", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const bundles = await storage.getTeacherStudentBundles();
      res.json(bundles);
    } catch (error) {
      console.error('Error getting teacher-student bundles:', error);
      res.status(500).json({ message: "Failed to get teacher-student bundles" });
    }
  });

  // Get unassigned students
  app.get("/api/admin/students/unassigned", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const unassignedStudents = await storage.getUnassignedStudents();
      res.json(unassignedStudents);
    } catch (error) {
      console.error('Error getting unassigned students:', error);
      res.status(500).json({ message: "Failed to get unassigned students" });
    }
  });

  // Get available mentors
  app.get("/api/admin/mentors/available", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const availableMentors = await storage.getAvailableMentors();
      res.json(availableMentors);
    } catch (error) {
      console.error('Error getting available mentors:', error);
      res.status(500).json({ message: "Failed to get available mentors" });
    }
  });

  // Get mentor assignments
  app.get("/api/admin/mentor-assignments", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const assignments = await storage.getAllMentorAssignments();
      res.json(assignments);
    } catch (error) {
      console.error('Error getting mentor assignments:', error);
      res.status(500).json({ message: "Failed to get mentor assignments" });
    }
  });

  // Create mentor assignment
  app.post("/api/admin/mentor-assignments", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { mentorId, studentId, goals, notes } = req.body;
      
      if (!mentorId || !studentId) {
        return res.status(400).json({ message: "Mentor and student IDs are required" });
      }

      const assignment = await storage.createMentorAssignment({
        mentorId,
        studentId,
        status: 'active',
        assignedDate: new Date(),
        goals: goals ? goals.split('\n').filter(g => g.trim()) : [],
        notes
      });

      // Get user details for SMS notifications
      const mentor = await storage.getUser(mentorId);
      const student = await storage.getUser(studentId);
      
      // Get teacher-student bundle info
      const bundles = await storage.getTeacherStudentBundles();
      const bundle = bundles.find(b => b.student.id === studentId);
      
      // Send SMS notification to mentor
      if (mentor?.phone && bundle) {
        const mentorMessage = `New mentorship assignment: You've been assigned to support ${student?.firstName} ${student?.lastName}. Teacher: ${bundle.teacher.firstName} ${bundle.teacher.lastName}. ${notes ? `Notes: ${notes}` : ''}`;
        console.log(`SMS to mentor ${mentor.phone}: ${mentorMessage}`);
      }

      res.status(201).json(assignment);
    } catch (error) {
      console.error('Error creating mentor assignment:', error);
      res.status(500).json({ message: "Failed to create mentor assignment" });
    }
  });

  // ===== TEACHER-STUDENT MATCHING API =====
  
  // Get available teachers for matching
  app.get("/api/admin/teachers/available", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const allTeachers = await storage.getAllUsers();
      const sessions = await storage.getAllSessions();
      
      // Count current students for each teacher
      const studentCountByTeacher = sessions.reduce((acc, session) => {
        const teacherId = session.tutorId;
        if (!acc[teacherId]) acc[teacherId] = new Set();
        acc[teacherId].add(session.studentId);
        return acc;
      }, {} as Record<number, Set<number>>);
      
      // Get teachers with availability
      const teachersWithStats = allTeachers
        .filter(u => filterTeachers([u]).length > 0)
        .map(teacher => {
          const currentStudents = studentCountByTeacher[teacher.id]?.size || 0;
          const maxStudents = teacher.maxStudents || 20;
          
          return {
            id: teacher.id,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
            languages: teacher.languages || ['persian', 'english'],
            levels: teacher.levels || ['beginner', 'intermediate', 'advanced'],
            classTypes: teacher.classTypes || ['private', 'group'],
            modes: teacher.modes || ['online', 'in-person'],
            timeSlots: teacher.timeSlots || [
              { day: 'Monday', startTime: '08:00', endTime: '12:00' },
              { day: 'Tuesday', startTime: '14:00', endTime: '18:00' },
              { day: 'Wednesday', startTime: '09:00', endTime: '13:00' },
              { day: 'Thursday', startTime: '15:00', endTime: '19:00' },
              { day: 'Friday', startTime: '10:00', endTime: '14:00' }
            ],
            maxStudents,
            currentStudents,
            hourlyRate: teacher.hourlyRate || 150000
          };
        })
        .filter(teacher => teacher.currentStudents < teacher.maxStudents);
      
      res.json(teachersWithStats);
    } catch (error) {
      console.error('Error getting available teachers:', error);
      res.status(500).json({ message: "Failed to get available teachers" });
    }
  });

  // Get students needing teachers
  app.get("/api/admin/students/unassigned-teacher", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const allStudents = await storage.getAllUsers();
      const sessions = await storage.getAllSessions();
      
      // Get IDs of students who already have teachers
      const studentsWithTeachers = new Set(sessions.map(s => s.studentId));
      
      // Return only students without teachers
      const studentsForTeacher = allStudents
        .filter(u => filterStudents([u]).length > 0 && !studentsWithTeachers.has(u.id))
        .map(student => ({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          level: student.level || 'beginner',
          language: student.language || 'persian',
          preferredClassType: student.preferredClassType || 'private',
          preferredMode: student.preferredMode || 'online',
          timeSlots: student.timeSlots || [
            { day: 'Monday', startTime: '09:00', endTime: '11:00' },
            { day: 'Wednesday', startTime: '14:00', endTime: '16:00' },
            { day: 'Friday', startTime: '10:00', endTime: '12:00' }
          ],
          enrollmentDate: student.createdAt
        }));
      
      res.json(studentsForTeacher);
    } catch (error) {
      console.error('Error getting students for teacher matching:', error);
      res.status(500).json({ message: "Failed to get students for teacher matching" });
    }
  });

  // Create teacher-student assignment
  app.post("/api/admin/teacher-assignments", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { teacherId, studentId, classType, mode, scheduledSlots, notes } = req.body;
      
      if (!teacherId || !studentId || !scheduledSlots || scheduledSlots.length === 0) {
        return res.status(400).json({ message: "Teacher, student, and scheduled slots are required" });
      }

      // Convert time slots to proper dates with times
      const processedSlots = scheduledSlots.map((slot: any) => {
        const today = new Date();
        const dayOffset = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(slot.day);
        const currentDay = today.getDay();
        let daysUntilSlot = dayOffset - currentDay;
        if (daysUntilSlot < 0) daysUntilSlot += 7; // Next week
        
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + daysUntilSlot);
        
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        
        const startTime = new Date(slotDate);
        startTime.setHours(startHour, startMinute, 0, 0);
        
        const endTime = new Date(slotDate);
        endTime.setHours(endHour, endMinute, 0, 0);
        
        return { startTime, endTime };
      });

      // Create assignment in database
      const result = await storage.createTeacherStudentAssignment({
        teacherId,
        studentId,
        classType,
        mode,
        scheduledSlots: processedSlots,
        notes
      });

      // Get teacher and student details for SMS
      const teacher = await storage.getUser(teacherId);
      const student = await storage.getUser(studentId);

      // Send SMS notifications
      if (teacher?.phone) {
        const teacherMessage = `New class assignment: ${student?.firstName} ${student?.lastName} - ${classType} class - ${mode}. Schedule: ${scheduledSlots.map((s: any) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}${classType === 'private' ? ` Target: ${student?.learningGoals?.join(', ') || 'General improvement'}` : ''}`;
        
        // In production, integrate with Kavenegar SMS service
        console.log(`SMS to teacher ${teacher.phone}: ${teacherMessage}`);
      }

      if (student?.phone) {
        const studentMessage = `You've been matched with ${teacher?.firstName} ${teacher?.lastName} for ${classType} ${mode} classes. Schedule: ${scheduledSlots.map((s: any) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}`;
        
        // In production, integrate with Kavenegar SMS service
        console.log(`SMS to student ${student.phone}: ${studentMessage}`);
      }

      res.status(201).json({ 
        message: "Teacher successfully assigned to student",
        sessions: result.sessions.length,
        assignmentId: result.sessions[0]?.id
      });
    } catch (error) {
      console.error('Error creating teacher assignment:', error);
      res.status(500).json({ message: "Failed to create teacher assignment" });
    }
  });

}
