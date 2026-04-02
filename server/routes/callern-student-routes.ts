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


export async function setupCallernStudentRoutes(app: any, context: RouteContext): Promise<void> {
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

  // ===== CALLERN LEARNING SYSTEM API =====
  
  // Get online teachers
  app.get("/api/callern/online-teachers", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      // Get authorized Callern teachers from database
      const authorizedTeachers = await storage.getAuthorizedCallernTeachers();
      
      // Get currently connected teachers from WebSocket server
      const connectedTeacherIds: number[] = app.locals.websocketServer?.getConnectedTeachers?.() || [];
      
      console.log(`Found ${authorizedTeachers.length} authorized Callern teachers`);
      console.log(`Connected teacher IDs:`, connectedTeacherIds);

      // Determine which teachers are actively in a call_session (status='active')
      // OR in a live class session right now — both count as 'teaching'
      const now = new Date();
      const activeSessionRows = await db
        .select({ teacherId: callSessions.teacherId })
        .from(callSessions)
        .where(eq(callSessions.status, 'active'));

      const activeLiveClassRows = await db
        .select({ teacherId: liveClassSessions.teacherId })
        .from(liveClassSessions)
        .where(
          and(
            lte(liveClassSessions.startTime, now),
            or(isNull(liveClassSessions.endTime), gte(liveClassSessions.endTime, now)),
            eq(liveClassSessions.isCompleted, false)
          )
        );

      const teachingTeacherIds = new Set([
        ...activeSessionRows.map(r => r.teacherId),
        ...activeLiveClassRows.map(r => r.teacherId),
      ]);
      
      // Get live rating aggregates from session_ratings table keyed by teacher id
      const ratingRows = await db
        .select({
          teacherId: sessionRatings.teacherId,
          avgRating: sql<string>`coalesce(avg(${sessionRatings.teacherRating})::numeric(3,2), 0)`,
          sessionCount: sql<number>`count(${sessionRatings.id})`
        })
        .from(sessionRatings)
        .where(sql`${sessionRatings.teacherRating} IS NOT NULL`)
        .groupBy(sessionRatings.teacherId);

      const ratingMap = new Map(ratingRows.map(r => [r.teacherId, r]));

      // Get follower counts per teacher
      const followerRows = await db
        .select({
          teacherId: callernTeacherFollowers.teacherId,
          count: sql<number>`count(*)`
        })
        .from(callernTeacherFollowers)
        .where(eq(callernTeacherFollowers.isActive, true))
        .groupBy(callernTeacherFollowers.teacherId);
      const followerMap = new Map(followerRows.map(r => [r.teacherId, Number(r.count)]));

      // Format teachers with 3-state presence
      const teachers = authorizedTeachers.map((teacher) => {
        const isConnected = connectedTeacherIds.includes(teacher.id);
        const hasCallernAvailability = teacher.isOnline === true;
        const isOnlineConnected = isConnected && hasCallernAvailability;

        // Teaching is independent of WebSocket connection:
        // A teacher in an active call_session OR an ongoing live_class_session is 'teaching'
        // even if they're not currently connected to CallerN.
        const isCurrentlyTeaching = teachingTeacherIds.has(teacher.id);

        // 3-state: 'available' | 'teaching' | 'offline'
        let presenceStatus: 'available' | 'teaching' | 'offline';
        if (isCurrentlyTeaching) {
          presenceStatus = 'teaching';
        } else if (!isOnlineConnected) {
          presenceStatus = 'offline';
        } else {
          presenceStatus = 'available';
        }

        const firstName = teacher.firstName || teacher.first_name;
        const lastName = teacher.lastName || teacher.last_name;
        const teacherName = `${firstName} ${lastName}`;
        const liveRatings = ratingMap.get(teacher.id);
        const rating = liveRatings ? parseFloat(String(liveRatings.avgRating)) : 0;
        const sessionCount = liveRatings ? Number(liveRatings.sessionCount) : 0;
        const followerCount = followerMap.get(teacher.id) ?? 0;
        
        return {
          id: teacher.id,
          firstName,
          lastName,
          name: teacherName,
          email: teacher.email,
          avatar: teacher.avatar || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
          specializations: teacher.teacherSpecializations?.length
            ? teacher.teacherSpecializations
            : ["General Language", "Conversation", "Grammar"],
          languages: ["Persian", "English"],
          rating: rating > 0 ? rating : null,
          reviewCount: sessionCount,
          totalMinutes: sessionCount * 30,
          isOnline: presenceStatus !== 'offline',
          status: presenceStatus,
          responseTime: presenceStatus === 'available'
            ? "معمولاً در ۲ دقیقه پاسخ می‌دهد"
            : presenceStatus === 'teaching'
            ? "در حال تدریس"
            : "آفلاین",
          hourlyRate: teacher.hourlyRate ? parseInt(String(teacher.hourlyRate)) : 500000,
          successRate: sessionCount > 0 ? Math.min(98, 80 + Math.round(rating * 3)) : null,
          description: teacher.teacherBio || "مدرس زبان با تجربه در مکالمه و گرامر",
          isCallernAuthorized: teacher.isAuthorized === true,
          followerCount,
        };
      });

      console.log(`Returning ${teachers.length} teachers: ${teachers.filter(t => t.status === 'available').length} available, ${teachers.filter(t => t.status === 'teaching').length} teaching, ${teachers.filter(t => t.status === 'offline').length} offline`);
      res.json(teachers);
    } catch (error) {
      console.error('Error fetching online teachers:', error);
      res.status(500).json({ message: "Failed to get online teachers" });
    }
  });

  // Get call history
  app.get("/api/mentoring/call-history", authenticateToken, async (req: any, res) => {
    try {
      const callHistory = [
        {
          id: 1,
          mentorName: "دکتر امیر حسینی",
          mentorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50",
          duration: 12,
          cost: 1440,
          date: "1403/03/05",
          topic: "Persian Grammar Questions",
          rating: 5
        },
        {
          id: 2,
          mentorName: "خانم مریم صادقی",
          mentorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50",
          duration: 8,
          cost: 800,
          date: "1403/03/03",
          topic: "Business Persian Vocabulary",
          rating: 5
        },
        {
          id: 3,
          mentorName: "دکتر امیر حسینی",
          mentorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50",
          duration: 15,
          cost: 1800,
          date: "1403/02/28",
          topic: "Conversation Practice",
          rating: 4
        }
      ];

      res.json(callHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to get call history" });
    }
  });

  // Start call
  app.post("/api/mentoring/start-call", authenticateToken, async (req: any, res) => {
    try {
      const { mentorId, topic, callType } = req.body;
      
      // In a real implementation, this would integrate with WebRTC/LiveKit
      const session = {
        id: Date.now(),
        mentorId,
        mentorName: "دکتر امیر حسینی",
        mentorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        startTime: new Date(),
        duration: 0,
        status: 'active',
        cost: 0,
        topic,
        callType,
        sessionUrl: `/callern/session/${Date.now()}`
      };

      res.status(201).json({ 
        message: "Call started successfully", 
        session 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to start call" });
    }
  });

  // End call
  app.post("/api/mentoring/end-call/:callId", authenticateToken, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.callId);
      const { startTime, mentorId } = req.body;
      
      // Calculate actual duration based on start time
      const endTime = new Date();
      const startTimeDate = new Date(startTime);
      const durationMinutes = Math.round((endTime.getTime() - startTimeDate.getTime()) / 60000);
      
      // Calculate cost based on mentor's hourly rate (750,000 IRR/hour default)
      const hourlyRate = 750000;
      const totalCost = Math.round((durationMinutes / 60) * hourlyRate);
      
      const callSummary = {
        callId,
        duration: durationMinutes,
        totalCost,
        endTime,
        rating: null // User can rate later
      };

      res.json({ 
        message: "Call ended successfully", 
        summary: callSummary 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to end call" });
    }
  });

  // ===== LIVE CLASSROOM (WebRTC) API =====
  
  // Create virtual classroom
  app.post("/api/classroom/create", authenticateToken, async (req: any, res) => {
    if (!['Teacher/Tutor', 'Admin', 'Supervisor'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { getWebRTCConfig } = await import('../webrtc-config');
      const { classTitle, maxParticipants = 50, duration = 60 } = req.body;
      
      // Generate unique room ID for virtual classroom
      const roomId = `classroom_${crypto.randomUUID()}`;
      const teacherId = req.user.id;
      
      // Get WebRTC configuration for client
      const webrtcConfig = getWebRTCConfig();
      
      // Register classroom with WebSocket server
      const websocketServer = req.app.locals.websocketServer;
      if (websocketServer) {
        // Pre-create room in WebSocket server's activeRooms Map
        // Parameters: roomId, studentId (0 for multi-user), teacherId, packageId (0 for free classroom)
        websocketServer.createRoomWithSafeguards(roomId, 0, teacherId, 0);
        console.log(`✅ Room registered with WebSocket server: ${roomId} (max: ${maxParticipants} participants)`);
      } else {
        console.warn('⚠️  WebSocket server not available - room will be created on first join');
      }
      
      // Create classroom session data
      const classroom = {
        roomId,
        title: classTitle || `Virtual Classroom by ${req.user.firstName} ${req.user.lastName}`,
        teacherId,
        teacherName: `${req.user.firstName} ${req.user.lastName}`,
        createdAt: new Date().toISOString(),
        maxParticipants,
        durationMinutes: duration,
        status: 'active',
        participants: []
      };
      
      console.log(`✅ Virtual classroom created: ${roomId} by teacher ${teacherId}`);
      
      // Return classroom details and WebRTC config
      res.status(201).json({
        success: true,
        message: "Virtual classroom created successfully",
        messageFa: "کلاس مجازی با موفقیت ایجاد شد",
        classroom: {
          roomId,
          title: classroom.title,
          teacherId,
          teacherName: classroom.teacherName,
          joinUrl: `/classroom/${roomId}`,
          webSocketUrl: process.env.NODE_ENV === 'production' 
            ? `wss://${req.get('host')}`
            : 'ws://localhost:5000',
          maxParticipants,
          createdAt: classroom.createdAt
        },
        webrtcConfig
      });
    } catch (error) {
      console.error('❌ Failed to create virtual classroom:', error);
      res.status(500).json({ message: "Failed to create classroom", error: error.message });
    }
  });

  // Join virtual classroom
  app.post("/api/classroom/:classroomId/join", authenticateToken, async (req: any, res) => {
    try {
      // WebRTC virtual classroom feature not configured
      return res.status(501).json({
        error: "Virtual classroom not configured",
        message: "LiveKit or WebRTC classroom system is not configured",
        messageFa: "سیستم کلاس مجازی پیکربندی نشده است"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to join classroom" });
    }
  });

  // Get classroom sessions
  app.get("/api/classroom/sessions", authenticateToken, async (req: any, res) => {
    try {
      // WebRTC virtual classroom feature not configured
      return res.status(501).json({
        error: "Virtual classroom not configured",
        message: "LiveKit or WebRTC classroom system is not configured",
        messageFa: "سیستم کلاس مجازی پیکربندی نشده است"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get classroom sessions" });
    }
  });

  // ===== AI-POWERED PERSONALIZATION API =====
  
  // Get personalized learning recommendations
  app.get("/api/ai/recommendations", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('../ai-services');
      
      const user = await storage.getUser(req.user.id);
      const userPrefs = user?.preferences as any || {};
      
      const profile = {
        userId: req.user.id,
        nativeLanguage: userPrefs.nativeLanguage || "Persian",
        targetLanguage: userPrefs.targetLanguage || "English",
        proficiencyLevel: (user?.level || "intermediate") as "beginner" | "intermediate" | "advanced",
        learningGoals: userPrefs.learningGoals || [],
        culturalBackground: userPrefs.culturalBackground || "",
        preferredLearningStyle: (userPrefs.preferredLearningStyle || "visual") as "visual" | "auditory" | "kinesthetic",
        weaknesses: userPrefs.weaknesses || [],
        strengths: userPrefs.strengths || [],
        progressHistory: []
      };

      const recentActivity: { lesson: string; score: number; date: string }[] = [];

      const recommendations = await aiPersonalizationService.generatePersonalizedRecommendations(
        profile, 
        recentActivity
      );

      res.json({ recommendations, profile });
    } catch (error) {
      console.error('AI recommendations error:', error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Get progress analysis and feedback
  app.get("/api/ai/progress-analysis", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('../ai-services');
      
      const profile = {
        userId: req.user.userId,
        nativeLanguage: "English",
        targetLanguage: "Persian",
        proficiencyLevel: "intermediate" as const,
        learningGoals: ["Business Communication"],
        culturalBackground: "Western",
        preferredLearningStyle: "visual" as const,
        weaknesses: ["Verb Conjugation"],
        strengths: ["Vocabulary"],
        progressHistory: []
      };

      const completedLessons = [
        { title: "Persian Greetings", score: 90, timeSpent: 25 },
        { title: "Business Vocabulary", score: 85, timeSpent: 30 }
      ];

      const quizResults = [
        { topic: "Grammar", score: 75, attempts: 2 },
        { topic: "Vocabulary", score: 95, attempts: 1 }
      ];

      const analysis = await aiPersonalizationService.analyzeProgressAndProvideFeedback(
        profile,
        completedLessons,
        quizResults
      );

      res.json(analysis);
    } catch (error) {
      console.error('Progress analysis error:', error);
      res.status(500).json({ message: "Failed to analyze progress" });
    }
  });

  // Generate conversation scenario
  app.post("/api/ai/conversation-scenario", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('../ai-services');
      const { topic, difficulty } = req.body;
      
      const profile = {
        userId: req.user.userId,
        nativeLanguage: "English",
        targetLanguage: "Persian",
        proficiencyLevel: difficulty || "intermediate" as const,
        learningGoals: [],
        culturalBackground: "Western",
        preferredLearningStyle: "visual" as const,
        weaknesses: [],
        strengths: [],
        progressHistory: []
      };

      const scenario = await aiPersonalizationService.generateConversationScenarios(
        profile,
        topic,
        difficulty
      );

      res.json(scenario);
    } catch (error) {
      console.error('Conversation scenario error:', error);
      res.status(500).json({ message: "Failed to generate conversation scenario" });
    }
  });

  // AI conversation practice
  app.post("/api/ai/conversation", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('../ai-services');
      const { message, context, proficiencyLevel } = req.body;
      const userId = req.user.id;

      const aiResponse = await aiPersonalizationService.generateConversationResponse(
        message,
        context,
        proficiencyLevel || "intermediate",
        "Western"
      );

      // Track this learning activity
      await storage.createLearningActivity({
        userId,
        activityType: 'ai_conversation',
        skillType: 'speaking', // AI conversations primarily practice speaking
        duration: 60, // Estimate 1 minute per conversation turn
        score: null, // No direct score for conversations
        metadata: {
          messageLength: message.length,
          proficiencyLevel: proficiencyLevel || "intermediate",
          conversationContext: context
        }
      });

      // Also track listening skill since they're processing AI responses
      await storage.createLearningActivity({
        userId,
        activityType: 'ai_conversation',
        skillType: 'listening',
        duration: 60,
        score: null,
        metadata: {
          responseLength: aiResponse.response?.length || 0,
          proficiencyLevel: proficiencyLevel || "intermediate"
        }
      });

      // Periodically create skill assessments based on conversation quality
      const activities = await storage.getLearningActivities(userId);
      const recentConversations = activities.filter(a => 
        a.activityType === 'ai_conversation' && 
        new Date(a.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
      );

      // Every 10 conversations, create an assessment
      if (recentConversations.length % 10 === 0) {
        // Estimate speaking skill based on message complexity
        const avgMessageLength = recentConversations.reduce((sum, a) => 
          sum + (a.metadata?.messageLength || 0), 0) / recentConversations.length;
        
        const speakingScore = Math.min(100, Math.max(60, 50 + (avgMessageLength / 10)));
        
        await storage.createSkillAssessment({
          userId,
          skillType: 'speaking',
          score: speakingScore,
          assessmentType: 'ai_conversation',
          metadata: {
            conversationCount: recentConversations.length,
            avgMessageLength,
            proficiencyLevel
          }
        });

        // Also assess listening based on engagement
        await storage.createSkillAssessment({
          userId,
          skillType: 'listening',
          score: Math.min(100, speakingScore + 5), // Listening usually slightly ahead
          assessmentType: 'ai_conversation',
          metadata: {
            conversationCount: recentConversations.length,
            proficiencyLevel
          }
        });
      }

      res.json(aiResponse);
    } catch (error) {
      console.error('AI conversation error:', error);
      res.status(500).json({ message: "Failed to generate conversation response" });
    }
  });

  // Create progress snapshot based on current assessments
  app.post("/api/student/create-progress-snapshot", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get latest assessments for all skills
      const skills = ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary'];
      const skillScores: Record<string, number> = {};
      
      for (const skill of skills) {
        const assessment = await storage.getLatestSkillAssessment(userId, skill);
        skillScores[skill] = assessment ? Number(assessment.score) : 60; // Default to 60 if no assessment
      }
      
      // Calculate average score
      const avgScore = Object.values(skillScores).reduce((sum, score) => sum + score, 0) / skills.length;
      
      // Determine overall level based on average
      const overallLevel = 
        avgScore < 60 ? 'A1' : 
        avgScore < 70 ? 'A2' : 
        avgScore < 75 ? 'B1' : 
        avgScore < 85 ? 'B2' : 
        avgScore < 95 ? 'C1' : 'C2';
      
      // Create snapshot
      const snapshot = await storage.createProgressSnapshot({
        userId,
        skillScores: {
          speaking: skillScores.speaking,
          listening: skillScores.listening,
          reading: skillScores.reading,
          writing: skillScores.writing,
          grammar: skillScores.grammar,
          vocabulary: skillScores.vocabulary
        },
        overallLevel,
        averageScore: avgScore.toString(),
        snapshotDate: new Date().toISOString().split('T')[0]
      });
      
      res.json({ 
        success: true, 
        snapshot,
        message: 'Progress snapshot created successfully' 
      });
    } catch (error) {
      console.error('Error creating progress snapshot:', error);
      res.status(500).json({ message: "Failed to create progress snapshot" });
    }
  });

  // Generate adaptive quiz
  app.post("/api/ai/adaptive-quiz", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('../ai-services');
      const { topic, weakAreas } = req.body;
      
      const profile = {
        userId: req.user.userId,
        nativeLanguage: "English",
        targetLanguage: "Persian",
        proficiencyLevel: "intermediate" as const,
        learningGoals: [],
        culturalBackground: "Western",
        preferredLearningStyle: "visual" as const,
        weaknesses: weakAreas || [],
        strengths: [],
        progressHistory: []
      };

      const quiz = await aiPersonalizationService.generateAdaptiveQuiz(
        profile,
        topic,
        weakAreas || []
      );

      res.json(quiz);
    } catch (error) {
      console.error('Adaptive quiz error:', error);
      res.status(500).json({ message: "Failed to generate adaptive quiz" });
    }
  });

  // AI Companion Chat with Ollama
  app.post("/api/ai/companion-chat", authenticateToken, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      
      const prompt = `You are Lexi, a delightful and encouraging AI companion for Persian language learners. You have a playful, supportive personality and help students learn Persian in a fun way.

Context:
- Student Level: ${context.level || 'intermediate'}
- Current Lesson: ${context.currentLesson || 'general practice'}
- Previous Messages: ${JSON.stringify(context.previousMessages || [])}

Student Message: "${message}"

Respond as Parsa with:
1. A helpful, encouraging response in both Persian and English
2. An appropriate emotion for your animated character
3. Optional cultural tips or pronunciation help
4. Keep responses concise but warm and supportive

Return JSON format:
{
  "response": "Your bilingual response (Persian / English)",
  "emotion": "happy|excited|encouraging|thinking|celebrating",
  "culturalTip": "optional cultural insight",
  "pronunciation": "optional pronunciation guide"
}`;

      // Try Ollama first (local AI)
      try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama2', // or any available model
            prompt: prompt,
            stream: false,
            format: 'json'
          }),
        });

        if (ollamaResponse.ok) {
          const ollamaData = await ollamaResponse.json();
          const result = JSON.parse(ollamaData.response || '{}');
          
          res.json({
            response: result.response || "سلام! چطور می‌تونم کمکت کنم؟ / Hello! How can I help you?",
            emotion: result.emotion || "happy",
            culturalTip: result.culturalTip,
            pronunciation: result.pronunciation
          });
          return;
        }
      } catch (ollamaError) {
        console.log('Ollama not available, using fallback responses');
      }

      // Fallback to intelligent pattern-based responses
      // Get user's language preference from context
      const userLanguage = context.language || 'en';
      const lowerMessage = message.toLowerCase();
      
      let response = "";
      let emotion = "happy";
      let culturalTip = null;
      let pronunciation = null;

      if (lowerMessage.includes('سلام') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        response = userLanguage === 'fa' ? 
          "سلام عزیزم! خیلی خوشحالم که می‌بینمت! چطوری؟ 😊" :
          "Hello dear! I'm so happy to see you! How are you feeling today? 😊";
        emotion = "excited";
        culturalTip = userLanguage === 'fa' ? 
          "در فرهنگ ایرانی، احوال‌پرسی خیلی مهمه و نشان از محبت داره" :
          "In Persian culture, greetings are very warm and personal. 'عزیزم' (azizam) means 'my dear'";
        pronunciation = userLanguage === 'fa' ? 
          "سلام: sa-LAAM (تاکید روی آخر)" :
          "سلام is pronounced 'sa-LAAM' with emphasis on the second syllable";
      } else if (lowerMessage.includes('help') || lowerMessage.includes('راهنمایی') || lowerMessage.includes('کمک')) {
        response = userLanguage === 'fa' ? 
          "البته! همیشه آماده کمکم! امروز چی می‌خوای یاد بگیری؟ 🤝" :
          "Of course! I'm always ready to help! What would you like to learn today? 🤝";
        emotion = "encouraging";
        culturalTip = userLanguage === 'fa' ? 
          "کمک کردن به دیگران از ارزش‌های اصلی فرهنگ ایرانیه" :
          "Helping others is a core value in Persian culture called 'کمک رسانی' (komak resani)";
      } else if (lowerMessage.includes('thanks') || lowerMessage.includes('thank') || lowerMessage.includes('مرسی') || lowerMessage.includes('متشکرم')) {
        response = userLanguage === 'fa' ? 
          "خواهش می‌کنم! خیلی خوشحالم که کمک کردم! 🌟" :
          "You're very welcome! I'm so happy I could help! 🌟";
        emotion = "celebrating";
        culturalTip = userLanguage === 'fa' ? 
          "ایرانی‌ها خیلی مؤدب هستن و همیشه 'خواهش می‌کنم' می‌گن" :
          "Persians are very polite and often say 'خواهش می‌کنم' (khahesh mikonam)";
        pronunciation = userLanguage === 'fa' ? 
          "مرسی: mer-SEE (از فرانسوی گرفته شده)" :
          "مرسی is pronounced 'mer-SEE' - borrowed from French 'merci'";
      } else if (lowerMessage.includes('lesson') || lowerMessage.includes('درس') || lowerMessage.includes('practice') || lowerMessage.includes('تمرین')) {
        response = userLanguage === 'fa' ? 
          "عالی! بیا با هم تمرین کنیم! کدوم موضوع رو دوست داری؟ 📚" :
          "Great! Let's practice together! What topic interests you most? 📚";
        emotion = "excited";
        culturalTip = userLanguage === 'fa' ? 
          "تمرین مداوم کلید یادگیری فارسیه" :
          "Regular practice is key in Persian learning. Try to use new words daily";
      } else if (lowerMessage.includes('culture') || lowerMessage.includes('فرهنگ') || lowerMessage.includes('cultural')) {
        response = userLanguage === 'fa' ? 
          "فرهنگ ایران خیلی غنیه! کدوم قسمتش رو می‌خوای بدونی؟ 🎭" :
          "Iranian culture is so rich! What aspect would you like to learn about? 🎭";
        emotion = "excited";
        culturalTip = userLanguage === 'fa' ? 
          "مهمان‌نوازی، شعر و خانواده از رکن‌های فرهنگ ایرانن" :
          "Iranian culture emphasizes hospitality (مهمان‌نوازی), poetry, and family connections";
      } else {
        response = userLanguage === 'fa' ? 
          "جالبه! بگو ببینم بیشتر چی می‌خوای بدونی؟ 🤔" :
          "Interesting! Tell me more about what you'd like to learn? 🤔";
        emotion = "thinking";
        culturalTip = userLanguage === 'fa' ? 
          "در گفتگوهای فارسی، نشان دادن علاقه واقعی خیلی مهمه" :
          "In Persian conversations, showing genuine interest is very important";
      }

      res.json({
        response,
        emotion,
        culturalTip,
        pronunciation
      });

    } catch (error) {
      console.error('Companion chat error:', error);
      res.json({
        response: "متأسفم، الان نمی‌تونم جواب بدم. دوباره تلاش کن! / Sorry, I can't respond right now. Please try again!",
        emotion: "encouraging",
        culturalTip: null,
        pronunciation: null
      });
    }
  });

  // Institute Branding API (single endpoint to prevent conflicts) - Enhanced for Explorer Dashboard
  app.get("/api/branding", async (req: any, res) => {
    try {
      // Enhanced branding data for conversion-optimized Explorer Dashboard
      const branding = {
        id: 1,
        name: "Meta Lingua Academy",
        tagline: "Master Languages, Master Life",
        logo: "/api/branding/logo.png",
        description: "Leading language learning institute with innovative teaching methods and proven results.",
        
        // Conversion-focused statistics
        stats: {
          totalStudents: 1250,
          expertTeachers: 45,
          coursesOffered: 28,
          successRate: 94,
          averageRating: 4.8,
          hoursLearned: 25000,
          certificatesIssued: 890,
          studentsActive: 450
        },
        
        // Social proof elements
        achievements: [
          "🏆 Top Rated Language Institute 2024",
          "🎓 95% Student Success Rate",
          "🌟 4.8/5 Student Rating",
          "🚀 25,000+ Hours of Learning"
        ],
        
        // Contact and location info
        contact: {
          phone: "+98 21 1234 5678",
          email: "info@metalingua.com",
          address: "Tehran, Iran",
          website: "https://metalingua.com"
        },
        
        // Feature highlights for conversion
        features: [
          {
            title: "Expert Native Teachers",
            description: "Learn from certified native speakers with years of experience",
            icon: "users"
          },
          {
            title: "Flexible Learning",
            description: "Online, in-person, and hybrid options to fit your schedule",
            icon: "clock"
          },
          {
            title: "Proven Methods",
            description: "Interactive teaching methods with guaranteed results",
            icon: "target"
          },
          {
            title: "Global Community",
            description: "Connect with learners worldwide and practice together",
            icon: "globe"
          }
        ],
        
        // Special offers for conversion
        offers: [
          {
            title: "Free Trial Lesson",
            description: "Book a complimentary 30-minute session with an expert teacher",
            cta: "Book Now"
          },
          {
            title: "Free Assessment Test",
            description: "Discover your language level with our AI-powered placement test",
            cta: "Take Test"
          }
        ]
      };
      
      res.json(branding);
    } catch (error) {
      console.error("Error fetching branding:", error);
      res.status(500).json({ message: "Failed to fetch branding" });
    }
  });

  app.put("/api/branding", authenticateToken, async (req: any, res) => {
    try {
      // Only managers can update branding
      if (req.user.role !== 'Supervisor') {
        return res.status(403).json({ message: "Only managers can update branding" });
      }

      const brandingData = req.body;
      const updatedBranding = await storage.updateBranding(brandingData);
      res.json(updatedBranding);
    } catch (error) {
      console.error("Error updating branding:", error);
      res.status(500).json({ message: "Failed to update branding" });
    }
  });

  // Course Referral System Routes
  
  // Generate "tell a friend" link for a specific course
  app.post("/api/courses/:courseId/refer", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.id;
      
      // Generate secure unique referral code
      const referralCode = `COURSE${courseId}_USER${userId}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      // Create referral link entry
      const referralLink = await storage.createReferralLink({
        userId: userId,
        courseId,
        code: referralCode,
        isActive: true
      });
      
      // Generate shareable link
      const shareUrl = `${req.protocol}://${req.get('host')}/course/${courseId}?ref=${referralCode}`;
      
      res.json({
        referralCode,
        referralLink: shareUrl,
        linkData: referralLink
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create course referral" });
    }
  });

  // Get user's referral settings
  app.get("/api/referrals/settings", authenticateToken, async (req: any, res) => {
    try {
      // Default settings if none exist
      const defaultSettings = {
        id: req.user.id,
        referrerPercentage: 15,
        referredPercentage: 5,
        totalReferrals: 0,
        totalEnrollments: 0,
        totalCommissionEarned: 0
      };
      res.json(defaultSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch referral settings" });
    }
  });

  // Update referral settings
  app.post("/api/referrals/settings", authenticateToken, async (req: any, res) => {
    try {
      const { referrerPercentage, referredPercentage } = req.body;
      
      // Validate that total doesn't exceed 20%
      if (referrerPercentage + referredPercentage > 20) {
        return res.status(400).json({ message: "Total commission cannot exceed 20%" });
      }
      
      // Return updated settings
      const updatedSettings = {
        id: req.user.id,
        referrerPercentage,
        referredPercentage,
        totalReferrals: 0,
        totalEnrollments: 0,
        totalCommissionEarned: 0
      };
      
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update referral settings" });
    }
  });

  // Get referral statistics
  app.get("/api/referrals/stats", authenticateToken, async (req: any, res) => {
    try {
      const stats = {
        totalShares: 12,
        totalClicks: 45,
        totalEnrollments: 8,
        totalCommissionEarned: 250000,
        conversionRate: 17.8
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  // Legacy route - to be removed
  app.post("/api/referrals/links", authenticateToken, async (req: any, res) => {
    try {
      const linkData = {
        userId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        selfCommissionRate: req.body.selfCommissionRate || 100,
        referredCommissionRate: req.body.referredCommissionRate || 0,
        commissionType: req.body.commissionType || 'percentage'
      };

      // Validate commission rates
      if (linkData.selfCommissionRate + linkData.referredCommissionRate > 100) {
        return res.status(400).json({ 
          message: "Total commission rate cannot exceed 100%" 
        });
      }

      const link = await storage.createReferralLink(linkData);
      res.status(201).json(link);
    } catch (error) {
      res.status(400).json({ message: "Failed to create referral link" });
    }
  });

  // Update referral link
  app.put("/api/referrals/links/:id", authenticateToken, async (req: any, res) => {
    try {
      const linkId = parseInt(req.params.id);
      const updates = {
        title: req.body.title,
        description: req.body.description,
        selfCommissionRate: req.body.selfCommissionRate,
        referredCommissionRate: req.body.referredCommissionRate,
        isActive: req.body.isActive
      };

      // Validate commission rates if provided
      if (updates.selfCommissionRate !== undefined && updates.referredCommissionRate !== undefined) {
        if (updates.selfCommissionRate + updates.referredCommissionRate > 100) {
          return res.status(400).json({ 
            message: "Total commission rate cannot exceed 100%" 
          });
        }
      }

      const updated = await storage.updateReferralLink(linkId, req.user.id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Referral link not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Failed to update referral link" });
    }
  });

  // Get referral statistics
  app.get("/api/referrals/stats", authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getReferralStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch referral statistics" });
    }
  });

  // Get referral commissions
  app.get("/api/referrals/commissions", authenticateToken, async (req: any, res) => {
    try {
      const commissions = await storage.getUserReferralCommissions(req.user.id);
      res.json(commissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch commissions" });
    }
  });

  // Track referral click (public endpoint)
  app.post("/api/referrals/track/:code", async (req, res) => {
    try {
      const referralCode = req.params.code;
      const link = await storage.getReferralLinkByCode(referralCode);
      
      if (!link || !link.isActive) {
        return res.status(404).json({ message: "Invalid referral code" });
      }

      // Track the click
      await storage.trackReferralActivity({
        referralLinkId: link.id,
        activityType: 'click',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrerUrl: req.get('Referer')
      });

      res.json({ 
        success: true, 
        referralLink: {
          title: link.title,
          description: link.description,
          referrerCommission: link.selfCommissionRate,
          referredBonus: link.referredCommissionRate
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to track referral" });
    }
  });

  // Register with referral code
  app.post("/api/referrals/signup/:code", async (req, res) => {
    try {
      const referralCode = req.params.code;
      const link = await storage.getReferralLinkByCode(referralCode);
      
      if (!link || !link.isActive) {
        return res.status(404).json({ message: "Invalid referral code" });
      }

      // The actual user registration would happen here
      // For now, we'll just track the signup activity
      await storage.trackReferralActivity({
        referralLinkId: link.id,
        activityType: 'signup',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrerUrl: req.get('Referer')
      });

      res.json({ 
        success: true,
        message: "Signup tracked successfully",
        bonus: link.referredCommissionRate
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process referral signup" });
    }
  });

  // AI Personalization Routes
  app.post("/api/ai/course-recommendations", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user profile and learning data
      const userProfile = await storage.getUserProfile(userId);
      const userCourses = await storage.getUserCourses(userId);
      const user = await storage.getUser(userId);
      
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      // Prepare learning profile for AI
      const learningProfile = {
        userId: userId,
        nativeLanguage: userProfile.nativeLanguage || 'en',
        targetLanguage: userProfile.targetLanguage || 'persian',
        proficiencyLevel: (userProfile.proficiencyLevel as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
        learningGoals: userProfile.learningGoals || [],
        culturalBackground: userProfile.culturalBackground || 'western',
        preferredLearningStyle: (userProfile.learningStyle as 'visual' | 'auditory' | 'kinesthetic' | 'reading') || 'visual',
        weaknesses: userProfile.learningChallenges || [],
        strengths: userProfile.strengths || [],
        progressHistory: userCourses || []
      };

      // Get recent activity (enrollment, completions, etc.)
      const recentActivity = userCourses.map(course => ({
        courseId: course.id,
        title: course.title,
        progress: course.progress || 0,
        lastAccessed: new Date()
      }));

      // Use AI service to generate recommendations
      const { aiPersonalizationService } = await import('../ai-services');
      const recommendations = await aiPersonalizationService.generatePersonalizedRecommendations(
        learningProfile,
        recentActivity
      );

      res.json({
        success: true,
        recommendations: recommendations,
        profile: {
          targetLanguage: learningProfile.targetLanguage,
          proficiencyLevel: learningProfile.proficiencyLevel,
          culturalBackground: learningProfile.culturalBackground
        }
      });
    } catch (error) {
      console.error('AI recommendations error:', error);
      res.status(500).json({ 
        message: "Failed to generate recommendations",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // AI Progress Analysis
  app.post("/api/ai/progress-analysis", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user data for analysis
      const userProfile = await storage.getUserProfile(userId);
      const userCourses = await storage.getUserCourses(userId);
      const userStats = await storage.getUserStats(userId);
      
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      const learningProfile = {
        userId: userId,
        nativeLanguage: userProfile.nativeLanguage || 'en',
        targetLanguage: userProfile.targetLanguage || 'persian',
        proficiencyLevel: userProfile.proficiencyLevel || 'beginner',
        learningGoals: userProfile.learningGoals || [],
        culturalBackground: userProfile.culturalBackground || 'western',
        preferredLearningStyle: userProfile.learningStyle || 'visual',
        weaknesses: userProfile.learningChallenges || [],
        strengths: userProfile.strengths || [],
        progressHistory: userCourses || []
      };

      const progressData = {
        coursesCompleted: userCourses.filter(c => c.progress === 100).length,
        averageProgress: userCourses.reduce((sum, c) => sum + c.progress, 0) / (userCourses.length || 1),
        streakDays: userStats?.streakDays || 0,
        totalStudyTime: userStats?.totalStudyTime || 0,
        weakAreas: userProfile.learningChallenges || [],
        strongAreas: userProfile.strengths || []
      };

      const { aiPersonalizationService } = await import('../ai-services');
      const analysis = await aiPersonalizationService.analyzeProgressAndProvideFeedback(
        learningProfile,
        userCourses,
        [] // quiz results - integrated with existing test system
      );

      res.json({
        success: true,
        analysis: analysis,
        progressData: progressData
      });
    } catch (error) {
      console.error('AI progress analysis error:', error);
      res.status(500).json({ 
        message: "Failed to analyze progress",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Ollama Management Routes - duplicate removed (keeping main implementation at line 619)

  app.post("/api/admin/ollama/pull-model", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { modelName } = req.body;
      
      if (!modelName) {
        return res.status(400).json({ 
          success: false,
          message: "Model name is required" 
        });
      }

      const { ollamaService } = await import('../ollama-service');
      const success = await ollamaService.pullModel(modelName);
      
      if (success) {
        res.json({
          success: true,
          message: `Model ${modelName} download started successfully`
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to download model ${modelName}. The model may not exist or download failed.`
        });
      }
    } catch (error: any) {
      console.error('Pull model error:', error);
      
      if (error.message === 'SERVICE_UNAVAILABLE') {
        return res.status(503).json({
          success: false,
          message: `Cannot download model. Ollama service is not running or available.`
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Failed to pull model",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Delete model endpoint
  app.delete("/api/admin/ollama/delete-model", async (req: any, res) => {
    try {
      const { modelName } = req.body;
      
      if (!modelName) {
        return res.status(400).json({ 
          success: false,
          message: "Model name is required" 
        });
      }

      const { ollamaService } = await import('../ollama-service');
      const success = await ollamaService.deleteModel(modelName);
      
      if (success) {
        res.json({
          success: true,
          message: `Model ${modelName} deleted successfully`
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to delete model ${modelName}. The model may not exist or cannot be removed.`
        });
      }
    } catch (error: any) {
      console.error('Delete model error:', error);
      
      if (error.message === 'SERVICE_UNAVAILABLE') {
        return res.status(503).json({
          success: false,
          message: `Cannot delete model. Ollama service is not running or available.`
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Failed to delete model",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get model information by name
  app.get("/api/admin/ollama/model/:modelName", async (req: any, res) => {
    try {
      const { modelName } = req.params;
      const { ollamaService } = await import('../ollama-service');
      const modelInfo = await ollamaService.getModelInfo(modelName);
      
      if (modelInfo) {
        res.json({
          success: true,
          model: modelInfo
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Model ${modelName} not found`
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to get model information",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get detailed model information
  app.get("/api/admin/ollama/models", async (req: any, res) => {
    try {
      const { ollamaService } = await import('../ollama-service');
      const models = await ollamaService.listModels();
      
      // Get detailed model information
      const modelDetails = await Promise.all(
        models.map(async (model) => {
          const info = await ollamaService.getModelInfo(model);
          return {
            name: model,
            size: info?.details?.parameter_size || "Unknown",
            modified: new Date(Date.now() - crypto.randomInt(30) * 24 * 60 * 60 * 1000).toISOString(),
            digest: `sha256:${crypto.randomBytes(12).toString('hex')}`,
            family: model.includes('llama') ? 'llama' : model.includes('mistral') ? 'mistral' : 'other',
            format: "gguf",
            parameterSize: model.includes('1b') ? '1B' : model.includes('3b') ? '3B' : '7B',
            quantizationLevel: "Q4_0"
          };
        })
      );
      
      res.json(modelDetails);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to get model details",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Token usage analytics endpoint
  app.get("/api/admin/ai/token-usage", async (req: any, res) => {
    try {
      // Simulate token usage data - in production this would come from a database
      const tokenUsage = [
        {
          user: "admin@metalingua.com",
          model: "llama3.2:1b",
          tokensUsed: 15420,
          requestCount: 45,
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          cost: 12.45
        },
        {
          user: "teacher@example.com",
          model: "persian-llm:3b",
          tokensUsed: 8930,
          requestCount: 23,
          lastUsed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          cost: 7.23
        },
        {
          user: "student@example.com",
          model: "llama3.2:3b",
          tokensUsed: 3250,
          requestCount: 12,
          lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          cost: 2.15
        }
      ];
      
      res.json(tokenUsage);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to get token usage data",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/admin/ai/usage-stats", async (req: any, res) => {
    try {
      const totalSessions = await db.select({ count: sql<number>`count(*)` }).from(aiActivitySessions);
      const todaySessions = await db.select({ count: sql<number>`count(*)` })
        .from(aiActivitySessions)
        .where(gte(aiActivitySessions.createdAt, sql`CURRENT_DATE`));
      
      const usageStats = {
        totalTokensUsed: 0,
        averageResponseTime: 0,
        requestsToday: Number(todaySessions[0]?.count || 0),
        totalSessions: Number(totalSessions[0]?.count || 0)
      };
      
      res.json(usageStats);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch usage statistics",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Enhanced Model Management Endpoints

  // Get active model
  app.get("/api/admin/ollama/active-model", async (req: any, res) => {
    try {
      const { ollamaService } = await import('../ollama-service');
      const activeModel = ollamaService.getActiveModel();
      const storagePath = await ollamaService.getModelStoragePath();
      
      res.json({
        success: true,
        activeModel,
        storagePath
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to get active model",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Set active model
  app.post("/api/admin/ollama/set-active-model", async (req: any, res) => {
    try {
      const { modelName } = req.body;
      
      if (!modelName) {
        return res.status(400).json({ 
          success: false,
          message: "Model name is required" 
        });
      }

      const { ollamaService } = await import('../ollama-service');
      
      // Validate that model exists
      const isValid = await ollamaService.validateModel(modelName);
      if (!isValid) {
        return res.status(404).json({
          success: false,
          message: `Model ${modelName} is not installed`
        });
      }

      ollamaService.setActiveModel(modelName);
      
      res.json({
        success: true,
        message: `Active model set to ${modelName}`,
        activeModel: modelName
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to set active model",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get download progress for a specific model
  app.get("/api/admin/ollama/download-progress/:modelName", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { modelName } = req.params;
      const { ollamaService } = await import('../ollama-service');
      
      const progress = await ollamaService.getDownloadProgress(modelName);
      
      res.json({
        success: true,
        modelName,
        progress: progress || { percent: 0, status: 'unknown' },
        status: progress?.status || 'unknown'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to get download progress",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Enhanced pull model with progress tracking
  app.post("/api/admin/ollama/pull-model-with-progress", async (req: any, res) => {
    try {
      const { modelName } = req.body;
      
      if (!modelName) {
        return res.status(400).json({ 
          success: false,
          message: "Model name is required" 
        });
      }

      const { ollamaService } = await import('../ollama-service');
      
      // Start download with progress tracking
      let lastProgress = null;
      const success = await ollamaService.pullModel(modelName, (progress) => {
        lastProgress = progress;
        console.log(`Download progress for ${modelName}:`, progress);
      });
      
      if (success) {
        res.json({
          success: true,
          message: `Model ${modelName} downloaded successfully`,
          modelName,
          finalProgress: lastProgress
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to download model ${modelName}. The model may not exist or download failed.`
        });
      }
    } catch (error: any) {
      console.error('Pull model with progress error:', error);
      
      if (error.message === 'SERVICE_UNAVAILABLE') {
        return res.status(503).json({
          success: false,
          message: `Cannot download model. Ollama service is not running or available.`
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Failed to pull model",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get models with enhanced metadata including active status
  app.get("/api/admin/ollama/models-enhanced", async (req: any, res) => {
    try {
      const { ollamaService } = await import('../ollama-service');
      const models = await ollamaService.listModels();
      const activeModel = ollamaService.getActiveModel();
      const storagePath = await ollamaService.getModelStoragePath();
      
      // Get detailed model information with active status
      const modelDetails = await Promise.all(
        models.map(async (model) => {
          const info = await ollamaService.getModelInfo(model);
          return {
            name: model,
            size: info?.details?.parameter_size || "Unknown",
            modified: new Date(Date.now() - crypto.randomInt(30) * 24 * 60 * 60 * 1000).toISOString(),
            digest: `sha256:${crypto.randomBytes(12).toString('hex')}`,
            family: model.includes('llama') ? 'llama' : model.includes('mistral') ? 'mistral' : 'other',
            format: "gguf",
            parameterSize: model.includes('1b') ? '1B' : model.includes('3b') ? '3B' : '7B',
            quantizationLevel: "Q4_0",
            isActive: model === activeModel,
            storagePath: storagePath
          };
        })
      );
      
      res.json({
        success: true,
        models: modelDetails,
        activeModel,
        storagePath
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to get enhanced model details",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Ollama Bootstrap and Installation Endpoints
  app.get("/api/admin/ollama/installation-status", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const status = await ollamaInstaller.checkInstallationStatus();
      res.json(status);
    } catch (error: any) {
      console.error('Installation status check error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to check installation status",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/admin/ollama/install", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const result = await ollamaInstaller.installOllama();
      res.json(result);
    } catch (error: any) {
      console.error('Ollama installation error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to install Ollama",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/admin/ollama/start-service", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const result = await ollamaInstaller.startOllamaService();
      res.json(result);
    } catch (error: any) {
      console.error('Ollama service start error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to start Ollama service",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/admin/ollama/bootstrap", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const result = await ollamaInstaller.bootstrap();
      res.json(result);
    } catch (error: any) {
      console.error('Ollama bootstrap error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to bootstrap Ollama",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/admin/ollama/verify", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const result = await ollamaInstaller.verifyInstallation();
      res.json(result);
    } catch (error: any) {
      console.error('Ollama verification error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to verify Ollama installation",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/admin/ai/settings", async (req: any, res) => {
    try {
      // Get current AI settings - in production this would be stored in database
      const settings = {
        primaryProvider: "ollama",
        fallbackProvider: "openai",
        responseCaching: true,
        features: {
          personalizedRecommendations: true,
          progressAnalysis: true,
          conversationScenarios: true,
          culturalInsights: true,
        }
      };
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch AI settings",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.put("/api/admin/ai/settings", async (req: any, res) => {
    try {
      const settings = req.body;
      
      // In production, save settings to database
      console.log('AI Settings updated:', settings);
      
      res.json({
        success: true,
        message: "AI settings updated successfully",
        settings
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to update AI settings",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Advanced Reporting & Analytics Routes
  app.get("/api/reports/financial-summary", authenticateToken, requireRole(['Admin', 'Accountant']), async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      // Get all payments in date range
      const allPayments = await storage.getAllPayments();
      const paymentsInRange = allPayments.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
      });

      // Calculate metrics
      const completedPayments = paymentsInRange.filter(p => p.status === 'completed');
      const failedPayments = paymentsInRange.filter(p => p.status === 'failed');
      const refundedPayments = paymentsInRange.filter(p => p.status === 'reversed');

      const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const totalRefunds = refundedPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const totalTransactions = paymentsInRange.length;
      const successRate = totalTransactions > 0 ? (completedPayments.length / totalTransactions) * 100 : 0;

      // Get wallet top-ups
      const walletTransactions = await storage.getUserWalletTransactions(0); // Get all transactions
      const walletTopups = walletTransactions.filter(wt => 
        wt.type === 'topup' && 
        wt.status === 'completed' &&
        new Date(wt.createdAt) >= new Date(startDate) &&
        new Date(wt.createdAt) <= new Date(endDate)
      );

      const totalWalletTopups = walletTopups.reduce((sum, wt) => sum + wt.amount, 0);

      // Course enrollment metrics
      const coursePayments = paymentsInRange.filter(p => p.creditsAwarded > 0);
      const newEnrollments = coursePayments.length;

      // Revenue by payment method
      const shetabRevenue = completedPayments
        .filter(p => p.provider === 'shetab')
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      
      const cashRevenue = completedPayments
        .filter(p => p.provider === 'cash')
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      // Daily revenue breakdown for charts
      const dailyRevenue = {};
      completedPayments.forEach(payment => {
        const date = new Date(payment.createdAt).toISOString().split('T')[0];
        dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(payment.amount.toString());
      });

      const chartData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue: Number(revenue)
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      res.json({
        success: true,
        period: { startDate, endDate },
        summary: {
          totalRevenue: Math.round(totalRevenue),
          totalRefunds: Math.round(totalRefunds),
          netRevenue: Math.round(totalRevenue - totalRefunds),
          totalTransactions,
          successRate: Math.round(successRate * 100) / 100,
          newEnrollments,
          totalWalletTopups: Math.round(totalWalletTopups)
        },
        breakdown: {
          shetabRevenue: Math.round(shetabRevenue),
          cashRevenue: Math.round(cashRevenue),
          walletTopups: Math.round(totalWalletTopups)
        },
        chartData,
        trends: {
          averageDailyRevenue: chartData.length > 0 ? Math.round(totalRevenue / chartData.length) : 0,
          peakDay: chartData.length > 0 ? chartData.reduce((max, day) => day.revenue > max.revenue ? day : max) : null
        }
      });
    } catch (error) {
      console.error('Financial summary error:', error);
      res.status(500).json({ 
        message: "Failed to generate financial summary",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Student enrollment analytics
  app.get("/api/reports/enrollment-analytics", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { period = '30d' } = req.query;
      
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get enrollment data
      const allUsers = await storage.getAllUsers();
      const students = allUsers.filter(user => user.role === 'Student');
      
      const newStudents = students.filter(student => 
        new Date(student.createdAt) >= startDate && new Date(student.createdAt) <= endDate
      );

      // Get course enrollment data
      const courses = await storage.getCourses();
      const courseEnrollmentData = await Promise.all(
        courses.map(async (course) => {
          const enrollments = await storage.getCourseEnrollments(course.id);
          const recentEnrollments = enrollments.filter(enrollment =>
            new Date(enrollment.enrolledAt) >= startDate && new Date(enrollment.enrolledAt) <= endDate
          );
          
          return {
            courseId: course.id,
            courseTitle: course.title,
            totalEnrollments: enrollments.length,
            recentEnrollments: recentEnrollments.length,
            language: course.language,
            level: course.level
          };
        })
      );

      // Enrollment trends by day
      const dailyEnrollments = {};
      newStudents.forEach(student => {
        const date = new Date(student.createdAt).toISOString().split('T')[0];
        dailyEnrollments[date] = (dailyEnrollments[date] || 0) + 1;
      });

      const enrollmentChartData = Object.entries(dailyEnrollments).map(([date, count]) => ({
        date,
        enrollments: Number(count)
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Language and level distribution
      const languageStats = {};
      const levelStats = {};
      
      courseEnrollmentData.forEach(course => {
        languageStats[course.language] = (languageStats[course.language] || 0) + course.recentEnrollments;
        levelStats[course.level] = (levelStats[course.level] || 0) + course.recentEnrollments;
      });

      res.json({
        success: true,
        period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        summary: {
          totalStudents: students.length,
          newStudents: newStudents.length,
          totalCourses: courses.length,
          activeCourses: courses.filter(c => c.isActive).length
        },
        trends: {
          dailyEnrollments: enrollmentChartData,
          averageDailyEnrollments: enrollmentChartData.length > 0 
            ? Math.round((newStudents.length / enrollmentChartData.length) * 100) / 100 
            : 0
        },
        distribution: {
          languages: Object.entries(languageStats).map(([language, count]) => ({
            language, 
            enrollments: Number(count)
          })),
          levels: Object.entries(levelStats).map(([level, count]) => ({
            level, 
            enrollments: Number(count)
          }))
        },
        topCourses: courseEnrollmentData
          .sort((a, b) => b.recentEnrollments - a.recentEnrollments)
          .slice(0, 10)
      });
    } catch (error) {
      console.error('Enrollment analytics error:', error);
      res.status(500).json({ 
        message: "Failed to generate enrollment analytics",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // ============================================
  // SIMPLIFIED AI SERVICES MANAGEMENT
  // ============================================
  
  // Get AI service status (production-ready)
  app.get("/api/admin/ai/service-status", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { ollamaService } = await import('../ollama-service');
      const isRunning = await ollamaService.isServiceAvailable();
      
      res.json({
        isRunning,
        isEnabled: true,
        mode: isRunning ? 'ollama' : 'production-fallback',
        message: isRunning ? 'Ollama service active' : 'Using production fallback AI system'
      });
    } catch (error) {
      res.json({
        isRunning: false,
        isEnabled: true,
        mode: 'production-fallback',
        message: 'Using production fallback AI system'
      });
    }
  });

  // Get installed models (simplified version)
  app.get("/api/admin/ai/installed-models", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { ollamaService } = await import('../ollama-service');
      const models = await ollamaService.listModels();
      
      // Map to simplified format
      const installedModels = models.map((model: any) => ({
        id: model.name || model,
        name: model.name || model,
        size: model.size || '1.2B',
        downloadProgress: 100 // All installed models are 100% downloaded
      }));
      
      res.json(installedModels);
    } catch (error) {
      console.error('Error fetching installed models:', error);
      res.json([]);
    }
  });

  // Get active model
  app.get("/api/admin/ai/active-model", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { ollamaService } = await import('../ollama-service');
      const activeModel = await ollamaService.getActiveModel();
      
      res.json({
        modelId: activeModel || 'llama3.2:3b'
      });
    } catch (error) {
      res.json({
        modelId: 'llama3.2:3b'
      });
    }
  });

  // Set active model
  app.post("/api/admin/ai/set-active-model", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { modelId } = req.body;
      const { ollamaService } = await import('../ollama-service');
      
      await ollamaService.setActiveModel(modelId);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to set active model",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Start AI service
  app.post("/api/admin/ai/start-service", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { ollamaInstaller } = await import('../ollama-installer');
      const result = await ollamaInstaller.bootstrap();
      
      res.json({ 
        success: result.success,
        message: result.message 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to start AI service",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Install model
  app.post("/api/admin/ai/install-model", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { modelId } = req.body;
      const { ollamaService } = await import('../ollama-service');
      
      console.log(`Starting download for model: ${modelId}`);
      
      // Check if model already exists
      const existingModels = await ollamaService.getAvailableModels();
      if (existingModels.some((model: any) => model.id === modelId)) {
        console.log(`Model ${modelId} already installed`);
        return res.json({ 
          success: true, 
          message: "Model already installed",
          alreadyInstalled: true 
        });
      }
      
      // Start model download with progress tracking
      const downloadResult = await ollamaService.pullModel(modelId, (progress) => {
        console.log(`Download progress for ${modelId}:`, progress);
      });
      
      if (downloadResult) {
        console.log(`Successfully downloaded model: ${modelId}`);
        res.json({ 
          success: true, 
          message: `Model ${modelId} downloaded successfully` 
        });
      } else {
        console.log(`Failed to download model: ${modelId}`);
        res.status(500).json({ 
          success: false,
          message: `Failed to download model ${modelId}` 
        });
      }
    } catch (error) {
      console.error(`Error installing model:`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to start model installation",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Toggle service (simplified - just return success)
  app.post("/api/admin/ai/toggle-service", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { enable } = req.body;
      // In this simplified version, service is always enabled
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to toggle service"
      });
    }
  });

  // ============================================
}
