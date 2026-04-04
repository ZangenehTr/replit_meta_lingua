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

import { setupTeacherAdminRoutes } from "./teacher-admin-routes";
import { setupAISalesAgentContextRoutes } from "./ai-sales-context-routes";
import { setupAITrainingDashboardRoutes } from "./ai-training-dashboard-routes";
import type { RouteContext } from "./route-context";

export async function setupAdminAndMiscRoutes(app: Express, context: RouteContext): Promise<void> {
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

  let downloadedModels = context.downloadedModels;
  const setDownloadedModels = context.setDownloadedModels;
  const trainingData = context.trainingData;


  // Call Center Performance Analytics
  app.get("/api/admin/call-center-performance", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const stats = await storage.getCallCenterPerformanceStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching call center performance:', error);
      res.status(500).json({ message: "Failed to fetch call center performance" });
    }
  });

  // Overdue Payments Analytics
  app.get("/api/admin/overdue-payments", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const overdueData = await storage.getOverduePaymentsData();
      res.json(overdueData);
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
      res.status(500).json({ message: "Failed to fetch overdue payments" });
    }
  });

  // Revenue Analytics
  app.get("/api/admin/revenue-analytics", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const revenueData = await storage.getRevenueAnalytics();
      res.json(revenueData);
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  });

  // Registration Analytics by Type
  app.get("/api/admin/registration-analytics", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const registrationData = await storage.getRegistrationAnalytics();
      res.json(registrationData);
    } catch (error) {
      console.error('Error fetching registration analytics:', error);
      res.status(500).json({ message: "Failed to fetch registration analytics" });
    }
  });

  // Teacher Performance Analytics
  app.get("/api/admin/teacher-performance", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const teacherData = await storage.getTeacherPerformanceAnalytics();
      res.json(teacherData);
    } catch (error) {
      console.error('Error fetching teacher performance:', error);
      res.status(500).json({ message: "Failed to fetch teacher performance" });
    }
  });

  // Student Retention Analytics
  app.get("/api/admin/student-retention", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const retentionData = await storage.getStudentRetentionAnalytics();
      res.json(retentionData);
    } catch (error) {
      console.error('Error fetching student retention:', error);
      res.status(500).json({ message: "Failed to fetch student retention" });
    }
  });

  // Course Completion Analytics
  app.get("/api/admin/course-completion", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const completionData = await storage.getCourseCompletionAnalytics();
      res.json(completionData);
    } catch (error) {
      console.error('Error fetching course completion:', error);
      res.status(500).json({ message: "Failed to fetch course completion" });
    }
  });

  // Marketing Metrics
  app.get("/api/admin/marketing-metrics", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const marketingData = await storage.getMarketingMetrics();
      res.json(marketingData);
    } catch (error) {
      console.error('Error fetching marketing metrics:', error);
      res.status(500).json({ message: "Failed to fetch marketing metrics" });
    }
  });

  // Operational Metrics
  app.get("/api/admin/operational-metrics", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const operationalData = await storage.getOperationalMetrics();
      res.json(operationalData);
    } catch (error) {
      console.error('Error fetching operational metrics:', error);
      res.status(500).json({ message: "Failed to fetch operational metrics" });
    }
  });

  // Financial KPIs
  app.get("/api/admin/financial-kpis", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const financialData = await storage.getFinancialKPIs();
      res.json(financialData);
    } catch (error) {
      console.error('Error fetching financial KPIs:', error);
      res.status(500).json({ message: "Failed to fetch financial KPIs" });
    }
  });

  // Admin Dashboard Stats (Main overview)
  app.get("/api/admin/dashboard-stats", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      res.status(500).json({ message: "Failed to fetch admin dashboard stats" });
    }
  });

  // Class Observations for Admin Dashboard
  app.get("/api/admin/class-observations", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const observations = await storage.getClassObservations({});
      const total = Array.isArray(observations) ? observations.length : 0;
      const recentObservations = Array.isArray(observations) ? observations.slice(0, 5) : [];
      res.json({ total, observations: recentObservations });
    } catch (error) {
      console.error('Error fetching class observations:', error);
      // Real data only - no fallbacks per check-first protocol
      res.json({ total: 0, observations: [] });
    }
  });

  // ==================== ADMIN VIDEO LESSONS MANAGEMENT ====================
  
  // Get all video lessons with optional filters
  app.get("/api/admin/video-lessons", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { courseId, level, isPublished } = req.query;
      let lessons = await storage.getAllVideoLessons();
      
      // Apply filters
      if (courseId) {
        lessons = lessons.filter(l => l.courseId === Number(courseId));
      }
      if (level) {
        lessons = lessons.filter(l => l.level === level);
      }
      if (isPublished !== undefined) {
        lessons = lessons.filter(l => l.isPublished === (isPublished === 'true'));
      }
      
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching video lessons:', error);
      res.status(500).json({ message: "Failed to fetch video lessons" });
    }
  });

  // Get video lessons statistics
  app.get("/api/admin/video-lessons/stats", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const lessons = await storage.getAllVideoLessons();
      const totalLessons = lessons.length;
      const publishedLessons = lessons.filter(l => l.isPublished).length;
      const totalViews = lessons.reduce((sum, l) => sum + (l.viewCount || 0), 0);
      const avgCompletionRate = lessons.length > 0 
        ? Math.round(lessons.reduce((sum, l) => sum + (l.completionRate || 0), 0) / lessons.length)
        : 0;
      
      res.json({
        totalLessons,
        publishedLessons,
        totalViews,
        avgCompletionRate
      });
    } catch (error) {
      console.error('Error fetching video lesson stats:', error);
      res.status(500).json({ message: "Failed to fetch video lesson statistics" });
    }
  });

  // Create a new video lesson
  app.post("/api/admin/video-lessons", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const lessonData = req.body;
      const lesson = await storage.createVideoLesson(lessonData);
      res.status(201).json(lesson);
    } catch (error) {
      console.error('Error creating video lesson:', error);
      res.status(500).json({ message: "Failed to create video lesson" });
    }
  });

  // Update a video lesson
  app.put("/api/admin/video-lessons/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const lessonId = Number(req.params.id);
      const updates = req.body;
      const updatedLesson = await storage.updateVideoLesson(lessonId, updates);
      
      if (!updatedLesson) {
        return res.status(404).json({ message: "Video lesson not found" });
      }
      
      res.json(updatedLesson);
    } catch (error) {
      console.error('Error updating video lesson:', error);
      res.status(500).json({ message: "Failed to update video lesson" });
    }
  });

  // Delete a video lesson
  app.delete("/api/admin/video-lessons/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const lessonId = Number(req.params.id);
      const success = await storage.deleteVideoLesson(lessonId);
      
      if (!success) {
        return res.status(404).json({ message: "Video lesson not found" });
      }
      
      res.json({ message: "Video lesson deleted successfully" });
    } catch (error) {
      console.error('Error deleting video lesson:', error);
      res.status(500).json({ message: "Failed to delete video lesson" });
    }
  });

  // Toggle publish status of a video lesson
  app.patch("/api/admin/video-lessons/:id/publish", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const lessonId = Number(req.params.id);
      const { isPublished } = req.body;
      
      const updatedLesson = await storage.updateVideoLesson(lessonId, { isPublished });
      
      if (!updatedLesson) {
        return res.status(404).json({ message: "Video lesson not found" });
      }
      
      res.json(updatedLesson);
    } catch (error) {
      console.error('Error toggling video lesson publish status:', error);
      res.status(500).json({ message: "Failed to update video lesson status" });
    }
  });

  // ==================== OLLAMA AI SERVICES CONFIGURATION ====================
  
  // Ollama Setup and Management - status endpoint removed (duplicate of line 619)

  app.post("/api/admin/ollama/install", authenticateToken, requireRole(['Admin']), async (req, res) => {
    try {
      const { ollamaSetup } = await import('../ollama-setup.js');
      const result = await ollamaSetup.installOllama();
      res.json(result);
    } catch (error) {
      console.error('Error installing Ollama:', error);
      res.status(500).json({ message: 'Failed to install Ollama' });
    }
  });

  app.post("/api/admin/ollama/start", authenticateToken, requireRole(['Admin']), async (req, res) => {
    try {
      const { ollamaSetup } = await import('../ollama-setup.js');
      const result = await ollamaSetup.startOllamaService();
      res.json(result);
    } catch (error) {
      console.error('Error starting Ollama service:', error);
      res.status(500).json({ message: 'Failed to start Ollama service' });
    }
  });

  app.get("/api/admin/ollama/models", authenticateToken, requireRole(['Admin']), async (req, res) => {
    try {
      const { ollamaSetup } = await import('../ollama-setup.js');
      const models = await ollamaSetup.getInstalledModels();
      res.json({ models });
    } catch (error) {
      console.error('Error getting Ollama models:', error);
      res.status(500).json({ message: 'Failed to get models' });
    }
  });

  app.post("/api/admin/ollama/models/:modelName/download", authenticateToken, requireRole(['Admin']), async (req, res) => {
    try {
      const { modelName } = req.params;
      const { ollamaSetup } = await import('../ollama-setup.js');
      const result = await ollamaSetup.downloadModel(modelName);
      res.json(result);
    } catch (error) {
      console.error('Error downloading model:', error);
      res.status(500).json({ message: 'Failed to download model' });
    }
  });

  app.delete("/api/admin/ollama/models/:modelName", authenticateToken, requireRole(['Admin']), async (req, res) => {
    try {
      const { modelName } = req.params;
      const { ollamaSetup } = await import('../ollama-setup.js');
      const result = await ollamaSetup.removeModel(modelName);
      res.json(result);
    } catch (error) {
      console.error('Error removing model:', error);
      res.status(500).json({ message: 'Failed to remove model' });
    }
  });

  app.post("/api/admin/ollama/generate", authenticateToken, requireRole(['Admin']), async (req, res) => {
    try {
      const { prompt, model } = req.body;
      const { ollamaSetup } = await import('../ollama-setup.js');
      const response = await ollamaSetup.generateCompletion(prompt, model);
      res.json({ response });
    } catch (error) {
      console.error('Error generating completion:', error);
      res.status(500).json({ message: 'Failed to generate completion' });
    }
  });

  // ==================== WEBRTC CONFIGURATION ====================
  
  // WebRTC Configuration Endpoint
  app.get("/api/webrtc-config", (req, res) => {
    const useCustomTurnServer = process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD;
    
    if (useCustomTurnServer) {
      // Self-hosted TURN server configuration
      res.json({
        iceServers: [
          // Free public STUN servers (always include these)
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          
          // Your self-hosted TURN server
          {
            urls: process.env.TURN_SERVER_URL,
            username: process.env.TURN_USERNAME,
            credential: process.env.TURN_PASSWORD
          }
        ]
      });
    } else {
      // Free public servers configuration (sufficient for most deployments)
      res.json({
        iceServers: [
          // Google's free STUN servers
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          
          // Mozilla's free STUN servers
          { urls: 'stun:stun.services.mozilla.com' },
          
          // OpenRelay free TURN servers (limited but functional)
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject', 
            credential: 'openrelayproject'
          }
        ]
      });
    }
  });

  // ==================== TEACHER OBSERVATION WORKFLOW ====================
  
  // Get teacher's observations
  app.get("/api/teacher/observations", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const observations = await storage.getTeacherObservations(teacherId);
      res.json(observations);
    } catch (error) {
      console.error('Error fetching teacher observations:', error);
      res.status(500).json({ message: "Failed to fetch observations" });
    }
  });

  // Get unacknowledged observations for notifications
  app.get("/api/teacher/observations/unacknowledged", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const observations = await storage.getUnacknowledgedObservations(teacherId);
      res.json(observations);
    } catch (error) {
      console.error('Error fetching unacknowledged observations:', error);
      res.status(500).json({ message: "Failed to fetch unacknowledged observations" });
    }
  });

  // Acknowledge observation
  app.post("/api/teacher/observations/:id/acknowledge", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const observationId = parseInt(req.params.id);
      const teacherId = req.user.id;
      await storage.acknowledgeObservation(observationId, teacherId);
      
      // Send SMS confirmation to teacher
      try {
        const teacher = await storage.getUser(teacherId);
        if (teacher?.phoneNumber) {
          const { kavenegarService } = await import('../kavenegar-service');
          await kavenegarService.sendObservationAcknowledgmentConfirmation(
            teacher.phoneNumber,
            teacher.firstName
          );
          console.log(`SMS acknowledgment confirmation sent to teacher ${teacher.firstName}`);
        }
      } catch (smsError) {
        console.error('Error sending acknowledgment SMS:', smsError);
      }
      
      res.json({ success: true, message: "Observation acknowledged successfully" });
    } catch (error) {
      console.error('Error acknowledging observation:', error);
      res.status(500).json({ message: "Failed to acknowledge observation" });
    }
  });

  // Submit teacher response to observation
  app.post("/api/teacher/observations/:id/respond", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const observationId = parseInt(req.params.id);
      const teacherId = req.user.id;
      const { responseType, content } = req.body;
      
      if (!responseType || !content) {
        return res.status(400).json({ message: "Response type and content are required" });
      }

      const response = await storage.createTeacherObservationResponse({
        observationId,
        teacherId,
        responseType,
        content
      });
      
      // Send SMS confirmation to teacher
      try {
        const teacher = await storage.getUser(teacherId);
        if (teacher?.phoneNumber) {
          const { kavenegarService } = await import('../kavenegar-service');
          const message = `Dear ${teacher.firstName}, your observation response has been submitted successfully. Your supervisor will review it shortly. Thank you for your engagement. MetaLingo Academy`;
          await kavenegarService.sendSimpleSMS(teacher.phoneNumber, message);
          console.log(`SMS response confirmation sent to teacher ${teacher.firstName}`);
        }
      } catch (smsError) {
        console.error('Error sending response confirmation SMS:', smsError);
      }
      
      res.status(201).json({ success: true, response, message: "Response submitted successfully" });
    } catch (error) {
      console.error('Error submitting teacher response:', error);
      res.status(500).json({ message: "Failed to submit response" });
    }
  });

  // Get responses for an observation (for supervisors)
  app.get("/api/supervision/observations/:id/responses", authenticateToken, requireRole(['Supervisor', 'Admin']), async (req: any, res) => {
    try {
      const observationId = parseInt(req.params.id);
      const responses = await storage.getObservationResponses(observationId);
      res.json(responses);
    } catch (error) {
      console.error('Error fetching observation responses:', error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  // ===== Teacher Supervision Dashboard Routes =====
  
  // Get active teacher sessions for real-time monitoring
  app.get("/api/supervision/active-sessions", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const activeSessions = await storage.getActiveTeacherSessions();
      res.json(activeSessions);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      res.status(500).json({ message: 'Failed to fetch active sessions' });
    }
  });

  // Send reminder to teacher during session
  app.post("/api/supervision/send-reminder", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { teacherId, sessionId, reminderType, message } = req.body;
      
      // Store reminder in database
      await storage.createTeacherReminder({
        teacherId,
        sessionId,
        supervisorId: req.user.id,
        reminderType,
        message,
        sentAt: new Date()
      });

      // Send real-time reminder via WebSocket
      io.to(`teacher_${teacherId}`).emit('supervision-reminder', {
        sessionId,
        type: reminderType,
        message,
        timestamp: new Date()
      });

      res.json({ success: true, message: 'Reminder sent successfully' });
    } catch (error) {
      console.error('Error sending reminder:', error);
      res.status(500).json({ message: 'Failed to send reminder' });
    }
  });

  // Get teacher performance metrics
  app.get("/api/supervision/teacher-metrics", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const metrics = await storage.getTeacherPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching teacher metrics:', error);
      res.status(500).json({ message: 'Failed to fetch teacher metrics' });
    }
  });

  // Get individual teacher performance metrics
  app.get("/api/supervision/teacher-metrics/:teacherId", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const metrics = await storage.getTeacherPerformanceMetrics(parseInt(req.params.teacherId));
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching teacher metrics:', error);
      res.status(500).json({ message: 'Failed to fetch teacher metrics' });
    }
  });

  // Get supervision alerts
  app.get("/api/supervision/alerts", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const alerts = await storage.getSupervisionAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching supervision alerts:', error);
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });

  // Update teacher improvement plan
  app.put("/api/teacher/observations/:id/improvement-plan", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const observationId = parseInt(req.params.id);
      const teacherId = req.user.id;
      const { improvementPlan, deadline } = req.body;
      
      const updates = {
        teacherImprovementPlan: improvementPlan,
        improvementPlanDeadline: deadline ? new Date(deadline) : null
      };
      
      const updated = await storage.updateObservationResponse(observationId, teacherId, updates);
      if (!updated) {
        return res.status(404).json({ message: "Observation not found or unauthorized" });
      }
      
      res.json({ success: true, observation: updated, message: "Improvement plan updated successfully" });
    } catch (error) {
      console.error('Error updating improvement plan:', error);
      res.status(500).json({ message: "Failed to update improvement plan" });
    }
  });

  // ==================== MODERN COMMUNICATION SYSTEM ====================

  // Support Tickets
  app.get("/api/support-tickets", authenticateToken, async (req, res) => {
    try {
      const { status, priority, assignedTo } = req.query;
      const tickets = await storage.getSupportTickets({
        status: status as string,
        priority: priority as string,
        assignedTo: assignedTo ? parseInt(assignedTo as string) : undefined
      });
      // Add messages array to each ticket
      const ticketsWithMessages = tickets.map(ticket => ({
        ...ticket,
        messages: [] // Will be populated when individual ticket is fetched
      }));
      res.json(ticketsWithMessages);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      res.status(500).json({ message: 'Failed to fetch support tickets' });
    }
  });

  app.get("/api/support-tickets/:id", authenticateToken, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(parseInt(req.params.id));
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      res.json(ticket);
    } catch (error) {
      console.error('Error fetching support ticket:', error);
      res.status(500).json({ message: 'Failed to fetch support ticket' });
    }
  });

  app.post("/api/support-tickets", authenticateToken, async (req, res) => {
    try {
      const ticketData = {
        ...req.body,
        studentId: req.user.role === 'Student' ? req.user.id : req.body.studentId
      };
      const ticket = await storage.createSupportTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({ message: 'Failed to create support ticket' });
    }
  });

  app.patch("/api/support-tickets/:id", authenticateToken, requireRole(['Admin', 'Manager', 'Call Center Agent']), async (req, res) => {
    try {
      const ticket = await storage.updateSupportTicket(parseInt(req.params.id), req.body);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      res.json(ticket);
    } catch (error) {
      console.error('Error updating support ticket:', error);
      res.status(500).json({ message: 'Failed to update support ticket' });
    }
  });

  app.delete("/api/support-tickets/:id", authenticateToken, requireRole(['Admin', 'Manager']), async (req, res) => {
    try {
      await storage.deleteSupportTicket(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting support ticket:', error);
      res.status(500).json({ message: 'Failed to delete support ticket' });
    }
  });

  // Support Ticket Messages
  app.get("/api/support-tickets/:ticketId/messages", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getSupportTicketMessages(parseInt(req.params.ticketId));
      res.json(messages);
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
      res.status(500).json({ message: 'Failed to fetch ticket messages' });
    }
  });

  app.post("/api/support-tickets/:ticketId/messages", authenticateToken, async (req, res) => {
    try {
      const messageData = {
        ...req.body,
        ticketId: parseInt(req.params.ticketId),
        senderId: req.user.id,
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        senderType: req.user.role === 'Student' ? 'student' : 'staff'
      };
      const message = await storage.createSupportTicketMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating ticket message:', error);
      res.status(500).json({ message: 'Failed to create ticket message' });
    }
  });

  // Chat Conversations
  app.get("/api/chat/conversations", authenticateToken, async (req, res) => {
    try {
      const conversations = await storage.getChatConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  app.get("/api/chat/conversations/:id", authenticateToken, async (req, res) => {
    try {
      const conversation = await storage.getChatConversation(parseInt(req.params.id));
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      res.json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ message: 'Failed to fetch conversation' });
    }
  });

  app.post("/api/chat/conversations", authenticateToken, async (req, res) => {
    try {
      const conversationData = {
        ...req.body,
        createdBy: req.user.id,
        participants: [...(req.body.participants || []), req.user.id]
      };
      const conversation = await storage.createChatConversation(conversationData);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });

  app.patch("/api/chat/conversations/:id", authenticateToken, async (req, res) => {
    try {
      const conversation = await storage.updateChatConversation(parseInt(req.params.id), req.body);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      res.json(conversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(500).json({ message: 'Failed to update conversation' });
    }
  });

  // Chat Messages
  app.get("/api/chat/conversations/:conversationId/messages", authenticateToken, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getChatMessages(parseInt(req.params.conversationId), limit);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post("/api/chat/conversations/:conversationId/messages", authenticateToken, async (req, res) => {
    try {
      // Fix 2: Validate message content is not empty
      if (!req.body.message || req.body.message.trim().length === 0) {
        return res.status(400).json({ message: "Message content cannot be empty" });
      }

      const messageData = {
        ...req.body,
        conversationId: parseInt(req.params.conversationId),
        senderId: req.user.id,  // Fix 1: Ensure correct user ID from JWT token
        senderName: req.user.firstName + ' ' + req.user.lastName
      };
      
      console.log('Creating message with user ID:', req.user.id, 'email:', req.user.email);
      const message = await storage.createChatMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  app.patch("/api/chat/messages/:id", authenticateToken, async (req, res) => {
    try {
      const message = await storage.updateChatMessage(parseInt(req.params.id), req.body);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      res.json(message);
    } catch (error) {
      console.error('Error updating message:', error);
      res.status(500).json({ message: 'Failed to update message' });
    }
  });

  app.delete("/api/chat/messages/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteChatMessage(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ message: 'Failed to delete message' });
    }
  });

  // Push Notifications
  app.get("/api/push-notifications", authenticateToken, requireRole(['Admin', 'Manager', 'Teacher/Tutor', 'Mentor', 'Supervisor', 'Call Center Agent', 'Accountant']), async (req, res) => {
    try {
      const { targetAudience, status } = req.query;
      const notifications = await storage.getPushNotifications({
        targetAudience: targetAudience as string,
        status: status as string
      });
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.get("/api/push-notifications/:id", authenticateToken, requireRole(['Admin', 'Manager', 'Teacher/Tutor', 'Mentor', 'Supervisor', 'Call Center Agent', 'Accountant']), async (req, res) => {
    try {
      const notification = await storage.getPushNotification(parseInt(req.params.id));
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      res.json(notification);
    } catch (error) {
      console.error('Error fetching notification:', error);
      res.status(500).json({ message: 'Failed to fetch notification' });
    }
  });

  app.post("/api/push-notifications", authenticateToken, requireRole(['Admin', 'Manager', 'Teacher/Tutor', 'Mentor', 'Supervisor', 'Call Center Agent', 'Accountant']), async (req, res) => {
    try {
      const { testPhoneNumber, ...notificationData } = req.body;
      const notification = await storage.createPushNotification({
        ...notificationData,
        createdBy: req.user.id
      });
      
      // Send SMS if SMS channel is selected and test phone number is provided
      if (notificationData.channels?.includes('sms') && testPhoneNumber) {
        try {
          await kavenegar.sendSMS(
            testPhoneNumber,
            `${notification.title}\n\n${notification.message}`
          );
          console.log('SMS sent successfully to:', testPhoneNumber);
        } catch (smsError) {
          console.error('Failed to send SMS:', smsError);
          // Continue execution even if SMS fails
        }
      }
      
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Failed to create notification' });
    }
  });

  app.patch("/api/push-notifications/:id", authenticateToken, requireRole(['Admin', 'Manager', 'Teacher/Tutor', 'Mentor', 'Supervisor', 'Call Center Agent', 'Accountant']), async (req, res) => {
    try {
      const notification = await storage.updatePushNotification(parseInt(req.params.id), req.body);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      res.json(notification);
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });

  app.delete("/api/push-notifications/:id", authenticateToken, requireRole(['Admin', 'Manager', 'Teacher/Tutor', 'Mentor', 'Supervisor', 'Call Center Agent', 'Accountant']), async (req, res) => {
    try {
      await storage.deletePushNotification(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  });

  // Get notification delivery logs
  app.get("/api/push-notifications/:id/delivery-logs", authenticateToken, requireRole(['Admin', 'Manager']), async (req, res) => {
    try {
      const logs = await storage.getNotificationDeliveryLogs(parseInt(req.params.id));
      res.json(logs);
    } catch (error) {
      console.error('Error fetching delivery logs:', error);
      res.status(500).json({ message: 'Failed to fetch delivery logs' });
    }
  });

  // =====================================================

  // Delegate to extracted route modules
  await setupTeacherAdminRoutes(app, context);
  await setupAISalesAgentContextRoutes(app, context);
  await setupAITrainingDashboardRoutes(app, context);

  // FRONT DESK CLERK SYSTEM API ROUTES
  // ========================
  
  // Front Desk Operations Routes
  app.get("/api/front-desk/operations", authenticate, authorizePermission('front_desk_operations', 'list'), async (req: any, res) => {
    try {
      const { status, handledBy, visitType, date } = req.query;
      const filters = { status, handledBy: handledBy ? parseInt(handledBy) : undefined, visitType, date };
      const operations = await storage.getFrontDeskOperations(filters);
      res.json(operations);
    } catch (error) {
      console.error('Error fetching front desk operations:', error);
      res.status(500).json({ error: 'Failed to fetch operations', message: error.message });
    }
  });

  app.get("/api/front-desk/operations/:id", authenticate, authorizePermission('front_desk_operations', 'read'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const operation = await storage.getFrontDeskOperation(id);
      if (!operation) {
        return res.status(404).json({ error: 'Operation not found' });
      }
      res.json(operation);
    } catch (error) {
      console.error('Error fetching front desk operation:', error);
      res.status(500).json({ error: 'Failed to fetch operation', message: error.message });
    }
  });

  app.post("/api/front-desk/operations", authenticate, authorizePermission('front_desk_operations', 'create'), async (req: any, res) => {
    try {
      const validation = insertFrontDeskOperationSchema.safeParse({ ...req.body, handledBy: req.user.id });
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid data', details: validation.error.issues });
      }
      
      let operation = await storage.createFrontDeskOperation(validation.data);
      
      // AUTO-CONVERT walk-in and inquiry operations to leads for Call Center follow-up
      if ((operation.operationType === 'walk_in' || operation.operationType === 'inquiry') && 
          operation.visitorName && operation.visitorPhone) {
        try {
          const nameParts = operation.visitorName.split(' ');
          const leadData = {
            firstName: nameParts[0] || 'Walk-in',
            lastName: nameParts.slice(1).join(' ') || 'Visitor',
            phoneNumber: operation.visitorPhone,
            leadSource: 'front_desk',
            status: 'new',
            priority: operation.priority || 'medium',
            notes: `Auto-created from front desk operation #${operation.id}. Purpose: ${operation.purpose || 'Not specified'}. ${operation.description || ''}`,
            createdBy: req.user.id
          };
          
          const result = await storage.convertFrontDeskOperationToLead(operation.id, leadData);
          // Use the updated operation from conversion (has leadId, convertedToLead fields)
          operation = result.operation;
          console.log(`✅ Auto-converted front desk operation #${operation.id} to lead #${result.lead.id}`);
        } catch (conversionError) {
          console.error('⚠️ Auto-conversion to lead failed:', conversionError);
          // Continue with original operation - frontend still receives valid response
        }
      }
      
      // Always return operation object (maintains frontend contract)
      res.status(201).json(operation);
    } catch (error) {
      console.error('Error creating front desk operation:', error);
      res.status(500).json({ error: 'Failed to create operation', message: error.message });
    }
  });

  app.put("/api/front-desk/operations/:id", authenticate, authorizePermission('front_desk_operations', 'update'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const operation = await storage.updateFrontDeskOperation(id, req.body);
      if (!operation) {
        return res.status(404).json({ error: 'Operation not found' });
      }
      res.json(operation);
    } catch (error) {
      console.error('Error updating front desk operation:', error);
      res.status(500).json({ error: 'Failed to update operation', message: error.message });
    }
  });

  app.post("/api/front-desk/operations/:id/complete", authenticate, authorizePermission('front_desk_operations', 'complete'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { completionNotes } = req.body;
      const operation = await storage.completeFrontDeskOperation(id, completionNotes);
      if (!operation) {
        return res.status(404).json({ error: 'Operation not found' });
      }
      res.json(operation);
    } catch (error) {
      console.error('Error completing front desk operation:', error);
      res.status(500).json({ error: 'Failed to complete operation', message: error.message });
    }
  });

  app.post("/api/front-desk/operations/:id/convert-to-lead", authenticate, authorizePermission('front_desk_operations', 'convert'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const leadData = { ...req.body, createdBy: req.user.id };
      const result = await storage.convertFrontDeskOperationToLead(id, leadData);
      res.json(result);
    } catch (error) {
      console.error('Error converting operation to lead:', error);
      res.status(500).json({ error: 'Failed to convert operation', message: error.message });
    }
  });

  app.delete("/api/front-desk/operations/:id", authenticate, authorizePermission('front_desk_operations', 'delete'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFrontDeskOperation(id);
      res.json({ message: 'Operation deleted successfully' });
    } catch (error) {
      console.error('Error deleting front desk operation:', error);
      res.status(500).json({ error: 'Failed to delete operation', message: error.message });
    }
  });

  // Phone Call Logs Routes
  app.get("/api/front-desk/calls", authenticate, authorizePermission('phone_call_logs', 'list'), async (req: any, res) => {
    try {
      const { callType, handledBy, date, result } = req.query;
      const filters = { callType, handledBy: handledBy ? parseInt(handledBy) : undefined, date, result };
      const calls = await storage.getPhoneCallLogs(filters);
      res.json(calls);
    } catch (error) {
      console.error('Error fetching phone call logs:', error);
      res.status(500).json({ error: 'Failed to fetch call logs', message: error.message });
    }
  });

  app.get("/api/front-desk/calls/:id", authenticate, authorizePermission('phone_call_logs', 'read'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const call = await storage.getPhoneCallLog(id);
      if (!call) {
        return res.status(404).json({ error: 'Call log not found' });
      }
      res.json(call);
    } catch (error) {
      console.error('Error fetching phone call log:', error);
      res.status(500).json({ error: 'Failed to fetch call log', message: error.message });
    }
  });

  app.post("/api/front-desk/calls", authenticate, authorizePermission('phone_call_logs', 'create'), async (req: any, res) => {
    try {
      const validation = insertPhoneCallLogSchema.safeParse({ ...req.body, handledBy: req.user.id });
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid data', details: validation.error.issues });
      }
      
      const call = await storage.createPhoneCallLog(validation.data);
      res.status(201).json(call);
    } catch (error) {
      console.error('Error creating phone call log:', error);
      res.status(500).json({ error: 'Failed to create call log', message: error.message });
    }
  });

  app.put("/api/front-desk/calls/:id", authenticate, authorizePermission('phone_call_logs', 'update'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const call = await storage.updatePhoneCallLog(id, req.body);
      if (!call) {
        return res.status(404).json({ error: 'Call log not found' });
      }
      res.json(call);
    } catch (error) {
      console.error('Error updating phone call log:', error);
      res.status(500).json({ error: 'Failed to update call log', message: error.message });
    }
  });

  app.delete("/api/front-desk/calls/:id", authenticate, authorizePermission('phone_call_logs', 'delete'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePhoneCallLog(id);
      res.json({ message: 'Call log deleted successfully' });
    } catch (error) {
      console.error('Error deleting phone call log:', error);
      res.status(500).json({ error: 'Failed to delete call log', message: error.message });
    }
  });

  // Phone Call Draft endpoint for auto-save functionality
  app.post("/api/front-desk/calls/draft", authenticate, authorizePermission('phone_call_logs', 'create'), async (req: any, res) => {
    try {
      // For now, we'll store drafts in the same table with a draft flag
      // In production, you might want a separate drafts table
      const draftData = {
        ...req.body,
        handledBy: req.user.id,
        callNotes: (req.body.callNotes || '') + ' [DRAFT]',
        tags: [...(req.body.tags || []), 'draft']
      };
      
      const validation = insertPhoneCallLogSchema.safeParse(draftData);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid data', details: validation.error.issues });
      }
      
      const draft = await storage.createPhoneCallLog(validation.data);
      res.status(201).json({ message: 'Draft saved', draftId: draft.id });
    } catch (error) {
      console.error('Error saving draft:', error);
      res.status(500).json({ error: 'Failed to save draft', message: error.message });
    }
  });

  // Get staff members for follow-up assignments
  app.get("/api/admin/staff", authenticate, authorizePermission('users', 'list'), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const staff = users.filter(user => 
        ['Admin', 'Teacher/Tutor', 'Supervisor', 'Call Center Agent', 'Front Desk'].includes(user.role)
      );
      res.json(staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff', message: error.message });
    }
  });

  // Auto-create follow-up task endpoint
  app.post("/api/front-desk/calls/:callId/follow-up-task", authenticate, authorizePermission('front_desk_tasks', 'create'), async (req: any, res) => {
    try {
      const callId = parseInt(req.params.callId);
      const call = await storage.getPhoneCallLog(callId);
      
      if (!call) {
        return res.status(404).json({ error: 'Call log not found' });
      }

      const taskData = {
        title: `Follow-up call: ${call.callerName}`,
        description: `Follow-up for call regarding: ${call.callPurpose}`,
        taskType: 'follow_up_call',
        assignedTo: req.body.assignedTo || req.user.id,
        createdBy: req.user.id,
        priority: req.body.urgencyLevel || 'medium',
        relatedCall: callId,
        contactName: call.callerName,
        contactPhone: call.callerPhone,
        contactEmail: call.callerEmail,
        dueDate: req.body.followUpDate ? new Date(req.body.followUpDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        notes: req.body.nextSteps || call.callNotes,
      };

      const validation = insertFrontDeskTaskSchema.safeParse(taskData);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid task data', details: validation.error.issues });
      }

      const task = await storage.createFrontDeskTask(validation.data);
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating follow-up task:', error);
      res.status(500).json({ error: 'Failed to create follow-up task', message: error.message });
    }
  });

  // Front Desk Tasks Routes
  app.get("/api/front-desk/tasks", authenticate, authorizePermission('front_desk_tasks', 'list'), async (req: any, res) => {
    try {
      const { assignedTo, status, taskType, dueDate } = req.query;
      const filters = { assignedTo: assignedTo ? parseInt(assignedTo) : undefined, status, taskType, dueDate };
      const tasks = await storage.getFrontDeskTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching front desk tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks', message: error.message });
    }
  });

  app.get("/api/front-desk/tasks/my", authenticate, authorizePermission('front_desk_tasks', 'list'), async (req: any, res) => {
    try {
      const tasks = await storage.getFrontDeskTasksByUser(req.user.id);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks', message: error.message });
    }
  });

  app.get("/api/front-desk/tasks/today", authenticate, authorizePermission('front_desk_tasks', 'list'), async (req: any, res) => {
    try {
      const tasks = await storage.getTodaysFrontDeskTasks(req.user.id);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error);
      res.status(500).json({ error: 'Failed to fetch today\'s tasks', message: error.message });
    }
  });

  app.get("/api/front-desk/tasks/overdue", authenticate, authorizePermission('front_desk_tasks', 'list'), async (req: any, res) => {
    try {
      const tasks = await storage.getOverdueFrontDeskTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      res.status(500).json({ error: 'Failed to fetch overdue tasks', message: error.message });
    }
  });

  app.get("/api/front-desk/tasks/:id", authenticate, authorizePermission('front_desk_tasks', 'read'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getFrontDeskTask(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      console.error('Error fetching front desk task:', error);
      res.status(500).json({ error: 'Failed to fetch task', message: error.message });
    }
  });

  app.post("/api/front-desk/tasks", authenticate, authorizePermission('front_desk_tasks', 'create'), async (req: any, res) => {
    try {
      const validation = insertFrontDeskTaskSchema.safeParse({ ...req.body, createdBy: req.user.id, assignedTo: req.body.assignedTo || req.user.id });
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid data', details: validation.error.issues });
      }
      
      const task = await storage.createFrontDeskTask(validation.data);
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating front desk task:', error);
      res.status(500).json({ error: 'Failed to create task', message: error.message });
    }
  });

  app.put("/api/front-desk/tasks/:id", authenticate, authorizePermission('front_desk_tasks', 'update'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateFrontDeskTask(id, req.body);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      console.error('Error updating front desk task:', error);
      res.status(500).json({ error: 'Failed to update task', message: error.message });
    }
  });

  app.post("/api/front-desk/tasks/:id/complete", authenticate, authorizePermission('front_desk_tasks', 'complete'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { completionNotes, taskResult } = req.body;
      const task = await storage.completeFrontDeskTask(id, completionNotes, taskResult);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      console.error('Error completing front desk task:', error);
      res.status(500).json({ error: 'Failed to complete task', message: error.message });
    }
  });

  app.post("/api/front-desk/tasks/:id/follow-up", authenticate, authorizePermission('front_desk_tasks', 'follow_up'), async (req: any, res) => {
    try {
      const parentTaskId = parseInt(req.params.id);
      const followUpData = { ...req.body, createdBy: req.user.id, assignedTo: req.body.assignedTo || req.user.id };
      const followUpTask = await storage.generateFollowUpTask(parentTaskId, followUpData);
      res.status(201).json(followUpTask);
    } catch (error) {
      console.error('Error generating follow-up task:', error);
      res.status(500).json({ error: 'Failed to generate follow-up task', message: error.message });
    }
  });

  app.delete("/api/front-desk/tasks/:id", authenticate, authorizePermission('front_desk_tasks', 'delete'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFrontDeskTask(id);
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting front desk task:', error);
      res.status(500).json({ error: 'Failed to delete task', message: error.message });
    }
  });

  // ========================
  // COMPREHENSIVE CALLER HISTORY DASHBOARD ROUTES
  // ========================

  // Get comprehensive interactions (combining phone calls, walk-ins, tasks, etc.)
  app.get("/api/front-desk/interactions", authenticate, authorizePermission('front_desk_operations', 'list'), async (req: any, res) => {
    try {
      const {
        query,
        phone,
        email,
        dateFrom,
        dateTo,
        callType,
        outcome,
        urgencyLevel,
        interactionType,
        handledBy,
        tag,
        conversionStatus
      } = req.query;

      const interactions = await storage.getComprehensiveInteractions({
        query,
        phone,
        email,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        callType: Array.isArray(callType) ? callType : callType ? [callType] : [],
        outcome: Array.isArray(outcome) ? outcome : outcome ? [outcome] : [],
        urgencyLevel: Array.isArray(urgencyLevel) ? urgencyLevel : urgencyLevel ? [urgencyLevel] : [],
        interactionType: Array.isArray(interactionType) ? interactionType : interactionType ? [interactionType] : [],
        handledBy: Array.isArray(handledBy) ? handledBy : handledBy ? [handledBy] : [],
        tags: Array.isArray(tag) ? tag : tag ? [tag] : [],
        conversionStatus: Array.isArray(conversionStatus) ? conversionStatus : conversionStatus ? [conversionStatus] : []
      });

      res.json(interactions);
    } catch (error) {
      console.error('Error fetching comprehensive interactions:', error);
      res.status(500).json({ error: 'Failed to fetch interactions', message: error.message });
    }
  });

  // Get analytics data for dashboard
  app.get("/api/front-desk/analytics", authenticate, authorizePermission('front_desk_operations', 'list'), async (req: any, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      
      const analytics = await storage.getFrontDeskAnalytics({
        dateFrom: dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dateTo: dateTo ? new Date(dateTo) : new Date()
      });

      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
    }
  });

  // Get unified customer profile
  app.get("/api/front-desk/customer-profile/:customerKey", authenticate, authorizePermission('front_desk_operations', 'read'), async (req: any, res) => {
    try {
      const { customerKey } = req.params;
      const profile = await storage.getUnifiedCustomerProfile(customerKey);
      res.json(profile);
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      res.status(500).json({ error: 'Failed to fetch customer profile', message: error.message });
    }
  });

  // Get staff members for filtering
  app.get("/api/staff/front-desk", authenticate, async (req: any, res) => {
    try {
      const staff = await storage.getFrontDeskStaff();
      res.json(staff);
    } catch (error) {
      console.error('Error fetching front desk staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff', message: error.message });
    }
  });

  // Export functionality
  app.get("/api/front-desk/export", authenticate, authorizePermission('front_desk_operations', 'export'), async (req: any, res) => {
    try {
      const { format, ...filters } = req.query;
      
      // Get interactions with filters
      const interactions = await storage.getComprehensiveInteractions({
        query: filters.query,
        phone: filters.phone,
        email: filters.email,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        callType: Array.isArray(filters.callType) ? filters.callType : filters.callType ? [filters.callType] : [],
        outcome: Array.isArray(filters.outcome) ? filters.outcome : filters.outcome ? [filters.outcome] : [],
        urgencyLevel: Array.isArray(filters.urgencyLevel) ? filters.urgencyLevel : filters.urgencyLevel ? [filters.urgencyLevel] : [],
        interactionType: Array.isArray(filters.interactionType) ? filters.interactionType : filters.interactionType ? [filters.interactionType] : [],
        handledBy: Array.isArray(filters.handledBy) ? filters.handledBy : filters.handledBy ? [filters.handledBy] : [],
        tags: Array.isArray(filters.tag) ? filters.tag : filters.tag ? [filters.tag] : [],
        conversionStatus: Array.isArray(filters.conversionStatus) ? filters.conversionStatus : filters.conversionStatus ? [filters.conversionStatus] : []
      });

      if (format === 'csv') {
        const csvData = await exportInteractionsCSV(interactions);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="caller-history-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvData);
      } else if (format === 'pdf') {
        const pdfBuffer = await generateInteractionsPDF(interactions);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="caller-history-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(pdfBuffer);
      } else if (format === 'excel') {
        const excelBuffer = await generateInteractionsExcel(interactions);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="caller-history-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(excelBuffer);
      } else {
        res.status(400).json({ error: 'Invalid export format. Supported: csv, pdf, excel' });
      }
    } catch (error) {
      console.error('Error exporting interactions:', error);
      res.status(500).json({ error: 'Failed to export interactions' });
    }
  });


  // ========================================================================
  // FORM MANAGEMENT ENDPOINTS
  // ========================================================================

  // Get all forms (admin only)
  app.get("/api/admin/forms", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { category, isActive, createdBy } = req.query;
      const forms = await storage.getForms({
        category: category || undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        createdBy: createdBy ? parseInt(createdBy) : undefined
      });
      res.json(forms);
    } catch (error) {
      console.error('Error fetching forms:', error);
      res.status(500).json({ error: 'Failed to fetch forms' });
    }
  });

  // Get form by ID (admin only)
  app.get("/api/admin/forms/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const form = await storage.getFormById(parseInt(id));
      
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }
      
      res.json(form);
    } catch (error) {
      console.error('Error fetching form:', error);
      res.status(500).json({ error: 'Failed to fetch form' });
    }
  });

  // Create new form (admin only)
  app.post("/api/admin/forms", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const formData = {
        ...req.body,
        createdBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const form = await storage.createForm(formData);
      res.status(201).json(form);
    } catch (error) {
      console.error('Error creating form:', error);
      res.status(500).json({ error: 'Failed to create form' });
    }
  });

  // Update form (admin only)
  app.patch("/api/admin/forms/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const form = await storage.updateForm(parseInt(id), updates);
      
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }
      
      res.json(form);
    } catch (error) {
      console.error('Error updating form:', error);
      res.status(500).json({ error: 'Failed to update form' });
    }
  });

  // Delete form (admin only)
  app.delete("/api/admin/forms/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteForm(parseInt(id));
      res.json({ message: 'Form deleted successfully' });
    } catch (error) {
      console.error('Error deleting form:', error);
      res.status(500).json({ error: 'Failed to delete form' });
    }
  });

  // Get form submissions (admin only)
  app.get("/api/admin/forms/:id/submissions", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, submittedBy, startDate, endDate } = req.query;

      const submissions = await storage.getFormSubmissions(parseInt(id), {
        status: status || undefined,
        submittedBy: submittedBy ? parseInt(submittedBy) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });

      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  // Get submission by ID (admin only)
  app.get("/api/admin/submissions/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const submission = await storage.getSubmissionById(parseInt(id));
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      res.json(submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  });

  // Update submission status (admin only)
  app.patch("/api/admin/submissions/:id/status", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      const submission = await storage.updateSubmissionStatus(
        parseInt(id),
        status,
        req.user.id,
        rejectionReason
      );
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      res.json(submission);
    } catch (error) {
      console.error('Error updating submission status:', error);
      res.status(500).json({ error: 'Failed to update submission status' });
    }
  });

  // Get submission statistics (admin only)
  app.get("/api/admin/forms/:id/stats", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getSubmissionStats(parseInt(id));
      res.json(stats);
    } catch (error) {
      console.error('Error fetching submission stats:', error);
      res.status(500).json({ error: 'Failed to fetch submission stats' });
    }
  });

  // Submit form (authenticated users or guest with token)
  app.post("/api/forms/:id/submit", async (req: any, res) => {
    try {
      const { id } = req.params;
      const { data, guestToken } = req.body;

      // Verify form exists and is active
      const form = await storage.getFormById(parseInt(id));
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }
      if (!form.isActive) {
        return res.status(400).json({ error: 'Form is not currently accepting submissions' });
      }

      // Create submission
      const submission = await storage.createSubmission({
        formId: parseInt(id),
        submittedBy: req.user?.id || null,
        guestToken: guestToken || null,
        data,
        status: 'pending',
        submittedAt: new Date()
      });

      res.status(201).json({
        message: 'Form submitted successfully',
        submissionId: submission.id
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      res.status(500).json({ error: 'Failed to submit form' });
    }
  });

  // Get public form by ID (no authentication required)
  app.get("/api/forms/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const form = await storage.getFormById(parseInt(id));
      
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      if (!form.isActive) {
        return res.status(400).json({ error: 'Form is not currently available' });
      }

      // Return only public-facing information (including multi-language fields)
      res.json({
        id: form.id,
        title: form.title,
        titleEn: form.titleEn,
        titleFa: form.titleFa,
        titleAr: form.titleAr,
        description: form.description,
        descriptionEn: form.descriptionEn,
        descriptionFa: form.descriptionFa,
        descriptionAr: form.descriptionAr,
        category: form.category,
        fields: form.fields,
        submitButtonText: form.submitButtonText || 'Submit',
        submitButtonTextEn: form.submitButtonTextEn,
        submitButtonTextFa: form.submitButtonTextFa,
        submitButtonTextAr: form.submitButtonTextAr
      });
    } catch (error) {
      console.error('Error fetching public form:', error);
      res.status(500).json({ error: 'Failed to fetch form' });
    }
  });



  // ========== TRIAL LESSONS ENDPOINTS ==========
  
  // Get all trial lessons with filtering
  app.get("/api/trial-lessons", authenticateToken, requireRole(['Admin', 'Front Desk Clerk', 'Supervisor']), async (req: any, res) => {
    try {
      // For now, return empty array until storage methods are implemented
      // TODO: Implement proper trial lessons storage methods
      const trialLessons: any[] = [];
      res.json(trialLessons);
    } catch (error) {
      console.error('Error fetching trial lessons:', error);
      res.status(500).json({ message: "Failed to fetch trial lessons" });
    }
  });

  // Get trial lessons metrics for front desk
  app.get("/api/front-desk/trial-metrics", authenticateToken, requireRole(['Admin', 'Front Desk Clerk', 'Supervisor']), async (req: any, res) => {
    try {
      // Return basic metrics structure
      const metrics = {
        todayTrials: 0,
        confirmedTrials: 0,
        pendingTrials: 0,
        completedTrials: 0,
        noShowTrials: 0,
        totalTeachers: 0,
        availableTeachers: 0,
        averageResponseTime: 0,
        conversionRate: 0,
        todayRevenue: 0,
        weeklyTrials: 0,
        monthlyTrials: 0
      };
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching trial metrics:', error);
      res.status(500).json({ message: "Failed to fetch trial metrics" });
    }
  });

  // Update trial lesson
  app.put("/api/trial-lessons/:id", authenticateToken, requireRole(['Admin', 'Front Desk Clerk', 'Supervisor']), async (req: any, res) => {
    try {
      const trialId = parseInt(req.params.id);
      // For now, return success message
      // TODO: Implement proper trial lesson update logic
      res.json({ message: "Trial lesson updated successfully", id: trialId });
    } catch (error) {
      console.error('Error updating trial lesson:', error);
      res.status(500).json({ message: "Failed to update trial lesson" });
    }
  });

  // ========== TEACHER REVIEWS API ==========
  
  // Submit a teacher review (students only, after completed sessions)
  app.post("/api/reviews", authenticateToken, async (req: any, res) => {
    try {
      const { teacherId, rating, reviewText, reviewTextFa, reviewTextAr, sessionId, isAnonymous } = req.body;
      
      if (!teacherId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ 
          error: "Invalid request", 
          message: "Teacher ID and rating (1-5) are required" 
        });
      }
      
      const review = await storage.createTeacherReview({
        teacherId,
        studentId: req.user.userId,
        rating,
        reviewText,
        reviewTextFa,
        reviewTextAr,
        sessionId: sessionId || null,
        isAnonymous: isAnonymous || false
      });
      
      res.status(201).json({
        message: "Review submitted successfully. It will be visible after admin approval.",
        messageFa: "نظر شما با موفقیت ثبت شد. پس از تأیید مدیر نمایش داده می‌شود.",
        messageAr: "تم إرسال المراجعة بنجاح. ستكون مرئية بعد موافقة المسؤول.",
        review
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });
  
  // Get approved reviews for a teacher (public)
  app.get("/api/reviews/teacher/:teacherId", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const reviews = await storage.getApprovedTeacherReviews(teacherId);
      
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching teacher reviews:', error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  
  // Get all reviews for admin moderation
  app.get("/api/admin/reviews", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { status } = req.query;
      const reviews = await storage.getAllTeacherReviews(status as string || undefined);
      
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  
  // Approve or reject a review (admin only)
  app.patch("/api/admin/reviews/:id/status", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'approved' or 'rejected'" });
      }
      
      const review = await storage.updateTeacherReviewStatus(
        reviewId,
        status,
        req.user.userId,
        rejectionReason
      );
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      res.json({ 
        message: `Review ${status} successfully`,
        review 
      });
    } catch (error) {
      console.error('Error updating review status:', error);
      res.status(500).json({ error: "Failed to update review status" });
    }
  });
  
  // Get recent approved reviews for widget (public)
  app.get("/api/public/reviews/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const reviews = await storage.getRecentApprovedReviews(limit);
      
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching recent reviews:', error);
      res.status(500).json({ error: "Failed to fetch recent reviews" });
    }
  });
  
  // ========== TEACHER INTRO VIDEO API ==========
  
  // Update teacher intro video (teacher or admin only)
  app.patch("/api/teachers/:id/intro-video", authenticateToken, async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const { introVideoUrl } = req.body;
      
      // Only the teacher themselves or an admin can update
      const isAdmin = ['Admin'].includes(req.user.role);
      const isTeacher = req.user.userId === teacherId && ['Teacher', 'Instructor'].includes(req.user.role);
      
      if (!isAdmin && !isTeacher) {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "Only the teacher or an admin can update the intro video"
        });
      }
      
      const updatedUser = await storage.updateTeacherIntroVideo(teacherId, introVideoUrl);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      
      res.json({
        message: "Intro video updated successfully",
        messageFa: "ویدیو معرفی با موفقیت به‌روزرسانی شد",
        introVideoUrl: updatedUser.introVideoUrl
      });
    } catch (error) {
      console.error('Error updating intro video:', error);
      res.status(500).json({ error: "Failed to update intro video" });
    }
  });
  
  // Get teacher profile with intro video (public)
  app.get("/api/public/teachers/:id", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const teacher = await storage.getTeacherPublicProfile(teacherId);
      
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      
      res.json(teacher);
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      res.status(500).json({ error: "Failed to fetch teacher profile" });
    }
  });

  // ========== INSTITUTE EVENTS API ==========
  
  // Get upcoming events (public)
  app.get("/api/public/events/upcoming", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const events = await storage.getUpcomingEvents(limit);
      
      res.json(events);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      res.status(500).json({ error: "Failed to fetch upcoming events" });
    }
  });
  
  // Get all events (admin)
  app.get("/api/admin/events", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  
  // Create event (admin)
  app.post("/api/admin/events", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const event = await storage.createEvent({
        ...req.body,
        createdBy: req.user.userId
      });
      
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });
  
  // Update event (admin)
  app.put("/api/admin/events/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.updateEvent(eventId, req.body);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });
  
  // Delete event (admin)
  app.delete("/api/admin/events/:id", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.deleteEvent(eventId);
      
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // ========== DYNAMIC WIDGETS DATA API ==========
  
  // Get top-rated teachers for widget (public)
  app.get("/api/public/widgets/top-teachers", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const teachers = await storage.getTopRatedTeachers(limit);
      
      res.json(teachers);
    } catch (error) {
      console.error('Error fetching top teachers:', error);
      res.status(500).json({ error: "Failed to fetch top teachers" });
    }
  });
  
  // Get new classes for widget (public)
  app.get("/api/public/widgets/new-classes", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const classes = await storage.getNewClasses(limit);
      
      res.json(classes);
    } catch (error) {
      console.error('Error fetching new classes:', error);
      res.status(500).json({ error: "Failed to fetch new classes" });
    }
  });
  
  // Get best student for widget (public)
  app.get("/api/public/widgets/best-student", async (req, res) => {
    try {
      const period = (req.query.period as string) || 'month'; // week, month, year
      const student = await storage.getBestStudent(period);
      
      res.json(student);
    } catch (error) {
      console.error('Error fetching best student:', error);
      res.status(500).json({ error: "Failed to fetch best student" });
    }
  });

  // Public stats endpoint — returns live counts for the homepage
  app.get("/api/public/stats", async (_req, res) => {
    try {
      const [studentsResult, teachersResult, coursesResult] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'Student')),
        db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'Teacher')),
        db.select({ count: sql<number>`count(*)` }).from(courses).where(eq(courses.status, 'active')),
      ]);
      res.json({
        students: Number(studentsResult[0]?.count ?? 0),
        teachers: Number(teachersResult[0]?.count ?? 0),
        courses: Number(coursesResult[0]?.count ?? 0),
      });
    } catch (error) {
      console.error('Error fetching public stats:', error);
      res.status(500).json({ students: 0, teachers: 0, courses: 0 });
    }
  });

  // Seed test users endpoint (for development and initial production setup)
  app.post("/api/seed-test-users", async (req, res) => {
    try {
      const result = await seedTestUsers();
      res.json(result);
    } catch (error: any) {
      console.error("Error seeding test users:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to seed test users" 
      });
    }
  });

  // Seed test users endpoint (for development and initial production setup)
  app.post("/api/seed-test-users", async (req, res) => {
    try {
      const result = await seedTestUsers();
      res.json(result);
    } catch (error: any) {
      console.error("Error seeding test users:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to seed test users" 
      });
    }
  });

  // Activate all test users (fix for inactive accounts in production)
  app.post("/api/activate-test-users", async (req, res) => {
    try {
      const testPhones = [
        '+989121234567', '+989127654321', '+989131234567', '+989137654321',
        '+989101234567', '+989101234568', '+989101234569', '+989101234570', '+989101234571'
      ];
      
      const result = await db.update(users)
        .set({ isActive: true, status: 'active' })
        .where(inArray(users.phoneNumber, testPhones))
        .returning({ id: users.id, phone: users.phoneNumber, firstName: users.firstName, isActive: users.isActive });
      
      console.log(`Activated ${result.length} test users`);
      
      res.json({
        success: true,
        message: `Activated ${result.length} test users`,
        users: result.map(u => ({ id: u.id, phone: u.phone, name: u.firstName, isActive: u.isActive }))
      });
    } catch (error: any) {
      console.error("Error activating test users:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to activate test users" 
      });
    }
  });

  // Check test user status (diagnostic endpoint)
  app.get("/api/check-test-users", async (req, res) => {
    try {
      const testPhones = [
        '+989121234567', '+989127654321', '+989131234567', '+989137654321',
        '+989101234567', '+989101234568', '+989101234569', '+989101234570', '+989101234571'
      ];
      
      const testUsers = await db.select({
        id: users.id,
        phone: users.phoneNumber,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        status: users.status
      }).from(users).where(inArray(users.phoneNumber, testPhones));
      
      res.json({
        success: true,
        count: testUsers.length,
        users: testUsers
      });
    } catch (error: any) {
      console.error("Error checking test users:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to check test users" 
      });
    }
  });


  // Debug endpoint to check demo mode configuration
  app.get("/api/debug-demo-mode", async (req, res) => {
    const isDemoEnabled = process.env.DEMO_TEST_ACCOUNTS === 'true';
    const hasSecret = !!process.env.DEMO_TEST_SECRET;
    const secretLength = process.env.DEMO_TEST_SECRET?.length || 0;
    const timeSlice = Math.floor(Date.now() / (30 * 60 * 1000));
    
    res.json({
      demoEnabled: isDemoEnabled,
      hasSecret: hasSecret,
      secretLength: secretLength,
      currentTimeSlice: timeSlice,
      serverTime: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV
    });
  });

  // HR Module routes
  const { default: hrRoutes } = await import('./hr-routes');
  app.use('/api/hr/employees', hrRoutes);
  console.log('✅ HR Module routes registered (Employees, Contracts, Leave, Payroll, Performance)');

  // HR Scheduler — monthly performance review auto-generation (non-blocking, BullMQ with setInterval fallback)
  import('../services/hr-scheduler').then(({ startHrScheduler }) => startHrScheduler()).catch((err) => {
    console.warn('[HR Scheduler] Failed to start:', err.message);
  });


  // ========================
  // SUB-LEVEL SYSTEM API
  // ========================

  // GET /api/curriculum-sublevels — list all 17 sub-levels (public)
  app.get("/api/curriculum-sublevels", async (_req, res) => {
    try {
      const levels = await db.execute(sql`
        SELECT cl.id, cl.code, cl.name, cl.cefr_band, cl.order_index, cl.description
        FROM curriculum_levels cl
        JOIN curriculums c ON c.id = cl.curriculum_id
        WHERE c.key = 'general_english' AND cl.is_active = true
        ORDER BY cl.order_index
      `);
      res.json(levels.rows);
    } catch (err) {
      console.error("Error fetching sub-levels:", err);
      res.status(500).json({ error: "Failed to fetch sub-levels" });
    }
  });

  // GET /api/student/available-courses — smart course discovery with eligibility filtering
  // Returns courses AND session packages whose sub-level range includes the student's level.
  // Products without a range configured are always shown (open to all).
  // Also returns self_paced (video) courses as they are stored in the same `courses` table with delivery_mode='self_paced'.
  // Query params: examTagId, skillScope, search, showAll (Admin-only eligibility bypass), type (courses|packages|all)
  app.get("/api/student/available-courses", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Fetch student profile, enrollments, session package purchases, and waitlists in parallel
      const [userRow, enrollmentRow, packageRow] = await Promise.all([
        db.execute(sql`SELECT sub_level_id, sub_level_code FROM users WHERE id = ${userId}`),
        db.execute(sql`SELECT course_id, status FROM enrollments WHERE user_id = ${userId}`),
        db.execute(sql`SELECT package_id FROM student_session_packages WHERE student_id = ${userId} AND status IN ('active','purchased')`),
      ]);

      const user = userRow.rows[0] as any;
      const subLevelId: number | null = user?.sub_level_id ?? null;
      const subLevelCode: string | null = user?.sub_level_code ?? null;

      // Build enrollment/waitlist map: courseId → status
      const enrollmentMap = new Map<number, string>();
      for (const r of enrollmentRow.rows as any[]) {
        enrollmentMap.set(r.course_id, r.status ?? 'active');
      }
      const purchasedPackageIds = new Set((packageRow.rows as any[]).map((r: any) => r.package_id));

      // Fetch student's current sub-level order_index for range comparison
      let subLevelOrderIndex = 0;
      if (subLevelId) {
        const slRow = await db.execute(sql`SELECT order_index FROM curriculum_levels WHERE id = ${subLevelId}`);
        subLevelOrderIndex = ((slRow.rows[0] as any)?.order_index ?? 0);
      }

      const { examTagId, skillScope, search, showAll, type } = req.query;
      const productType = (type as string) || 'all';

      // Helper: compute eligibility, match label, and status for any product
      function classifyProduct(p: any, enrolledStatus: string | undefined, isPurchased?: boolean) {
        const minOrder: number = p.min_sub_level_order ?? 0;
        const maxOrder: number = p.max_sub_level_order ?? 99;
        const hasRange = p.min_sub_level_id != null || p.max_sub_level_id != null;
        const eligible = !hasRange || (subLevelId != null && subLevelOrderIndex >= minOrder && subLevelOrderIndex <= maxOrder);

        let match: 'recommended' | 'available' | 'advanced' | 'all' = 'all';
        if (subLevelId && hasRange) {
          if (subLevelOrderIndex >= minOrder && subLevelOrderIndex <= maxOrder) match = 'recommended';
          else if (subLevelOrderIndex < minOrder) match = 'advanced';
          else match = 'available';
        }

        let status: 'enrolled' | 'waitlist' | 'available' = 'available';
        if (enrolledStatus === 'active') status = 'enrolled';
        else if (enrolledStatus === 'waitlist') status = 'waitlist';
        else if (isPurchased) status = 'enrolled';

        return { eligible, match, status, enrollmentStatus: status };
      }

      // --- Courses ---
      let courseResults: any[] = [];
      if (productType === 'all' || productType === 'courses') {
        const rows = await db.execute(sql`
          SELECT
            c.id, c.title, c.description, c.level, c.thumbnail, c.price,
            c.total_lessons, c.category, c.difficulty, c.is_active,
            c.min_sub_level_id, c.max_sub_level_id,
            c.exam_tag_ids, c.skill_scope,
            c.delivery_mode, c.class_format, c.rating,
            min_cl.code         AS min_sub_level_code,
            min_cl.order_index  AS min_sub_level_order,
            max_cl.code         AS max_sub_level_code,
            max_cl.order_index  AS max_sub_level_order,
            u.first_name || ' ' || u.last_name AS instructor_name
          FROM courses c
          LEFT JOIN curriculum_levels min_cl ON min_cl.id = c.min_sub_level_id
          LEFT JOIN curriculum_levels max_cl ON max_cl.id = c.max_sub_level_id
          LEFT JOIN users u ON u.id = c.instructor_id
          WHERE c.is_active = true
          ORDER BY c.created_at DESC
        `);
        courseResults = (rows.rows as any[]).map((c: any) => ({
          ...c,
          productType: 'course',
          ...classifyProduct(c, enrollmentMap.get(c.id)),
        }));
      }

      // --- Session Packages ---
      let packageResults: any[] = [];
      if (productType === 'all' || productType === 'packages') {
        const pkgRows = await db.execute(sql`
          SELECT
            sp.id, sp.name AS title, sp.description, sp.price, sp.is_active,
            sp.min_sub_level_id, sp.max_sub_level_id,
            sp.exam_tag_ids, sp.skill_scope,
            sp.session_count, sp.session_duration, sp.validity_days, sp.package_type,
            sp.target_audience, sp.skill_level,
            min_cl.code         AS min_sub_level_code,
            min_cl.order_index  AS min_sub_level_order,
            max_cl.code         AS max_sub_level_code,
            max_cl.order_index  AS max_sub_level_order
          FROM session_packages sp
          LEFT JOIN curriculum_levels min_cl ON min_cl.id = sp.min_sub_level_id
          LEFT JOIN curriculum_levels max_cl ON max_cl.id = sp.max_sub_level_id
          WHERE sp.is_active = true
          ORDER BY sp.created_at DESC
        `);
        packageResults = (pkgRows.rows as any[]).map((p: any) => ({
          ...p,
          productType: 'session_package',
          ...classifyProduct(p, undefined, purchasedPackageIds.has(p.id)),
        }));
      }

      // Combine all products
      let allProducts = [...courseResults, ...packageResults];

      // Eligibility filter: unless showAll=true AND user is Admin, only return eligible products
      const isAdmin = req.user?.role === 'Admin';
      if (!(showAll === 'true' && isAdmin)) {
        allProducts = allProducts.filter((p: any) => p.eligible || p.status !== 'available');
      }

      // Filter by exam tag if provided
      if (examTagId) {
        const tagIdNum = parseInt(examTagId as string, 10);
        if (!isNaN(tagIdNum)) {
          allProducts = allProducts.filter((p: any) => {
            const ids = Array.isArray(p.exam_tag_ids) ? p.exam_tag_ids : [];
            return ids.includes(tagIdNum);
          });
        }
      }

      // Filter by skill scope if provided
      if (skillScope) {
        allProducts = allProducts.filter((p: any) =>
          !p.skill_scope || p.skill_scope === skillScope || p.skill_scope === 'all'
        );
      }

      // Filter by search text if provided
      if (search) {
        const q = (search as string).toLowerCase();
        allProducts = allProducts.filter((p: any) =>
          p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
        );
      }

      // Group by exam tag for UI convenience
      const byExamTag: Record<string, number> = {};
      for (const p of allProducts) {
        for (const tagId of (Array.isArray(p.exam_tag_ids) ? p.exam_tag_ids : [])) {
          byExamTag[tagId] = (byExamTag[tagId] ?? 0) + 1;
        }
      }

      res.json({
        courses: allProducts,
        studentSubLevel: subLevelCode,
        total: allProducts.length,
        recommended: allProducts.filter((p: any) => p.match === 'recommended').length,
        enrolled: allProducts.filter((p: any) => p.status === 'enrolled').length,
        waitlisted: allProducts.filter((p: any) => p.status === 'waitlist').length,
        byExamTag,
      });
    } catch (err) {
      console.error("Error fetching available courses:", err);
      res.status(500).json({ error: "Failed to fetch available courses" });
    }
  });

  // PATCH /api/admin/students/:id/sublevel — admin override student's sub-level
  // Send { subLevelCode: null } to clear the override and reset to MST-derived value.
  app.patch("/api/admin/students/:id/sublevel", authenticateToken, requireRole(['Admin', 'Supervisor', 'Front Desk']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id, 10);
      const { subLevelCode } = req.body;

      // Allow null to clear the override
      if (subLevelCode === null || subLevelCode === undefined || subLevelCode === '') {
        await db.execute(sql`
          UPDATE users SET sub_level_id = NULL, sub_level_code = NULL, updated_at = now()
          WHERE id = ${studentId}
        `);
        return res.json({ success: true, studentId, subLevelCode: null, subLevelId: null, cleared: true });
      }

      // Resolve sub-level ID from code
      const slRow = await db.execute(sql`SELECT id FROM curriculum_levels WHERE code = ${subLevelCode} LIMIT 1`);
      if (slRow.rows.length === 0) {
        return res.status(404).json({ error: `Sub-level "${subLevelCode}" not found` });
      }
      const subLevelId = (slRow.rows[0] as any).id;

      await db.execute(sql`
        UPDATE users SET sub_level_id = ${subLevelId}, sub_level_code = ${subLevelCode}, updated_at = now()
        WHERE id = ${studentId}
      `);

      res.json({ success: true, studentId, subLevelCode, subLevelId });
    } catch (err) {
      console.error("Error updating student sub-level:", err);
      res.status(500).json({ error: "Failed to update student sub-level" });
    }
  });

  // PATCH /api/admin/courses/:id/sublevel-config — update course sub-level range + exam tags
  app.patch("/api/admin/courses/:id/sublevel-config", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id, 10);
      const { minSubLevelCode, maxSubLevelCode, examTagIds, skillScope } = req.body;

      // Resolve sub-level IDs with order_index for range validation
      let minId: number | null = null;
      let maxId: number | null = null;
      let minOrder: number | null = null;
      let maxOrder: number | null = null;

      if (minSubLevelCode) {
        const r = await db.execute(sql`SELECT id, order_index FROM curriculum_levels WHERE code = ${minSubLevelCode} LIMIT 1`);
        if (r.rows.length > 0) {
          minId = (r.rows[0] as { id: number; order_index: number }).id;
          minOrder = (r.rows[0] as { id: number; order_index: number }).order_index;
        }
      }
      if (maxSubLevelCode) {
        const r = await db.execute(sql`SELECT id, order_index FROM curriculum_levels WHERE code = ${maxSubLevelCode} LIMIT 1`);
        if (r.rows.length > 0) {
          maxId = (r.rows[0] as { id: number; order_index: number }).id;
          maxOrder = (r.rows[0] as { id: number; order_index: number }).order_index;
        }
      }

      // Validate that min <= max
      if (minOrder !== null && maxOrder !== null && minOrder > maxOrder) {
        return res.status(400).json({ error: "minSubLevelCode must be at or before maxSubLevelCode in the curriculum sequence" });
      }

      const tagIds: number[] = Array.isArray(examTagIds) ? examTagIds.map(Number).filter((n) => !isNaN(n)) : [];

      await db.update(courses)
        .set({
          minSubLevelId: minId,
          maxSubLevelId: maxId,
          examTagIds: tagIds,
          skillScope: skillScope ?? null,
        })
        .where(eq(courses.id, courseId));

      res.json({ success: true, courseId, minId, maxId });
    } catch (err) {
      console.error("Error updating course sublevel config:", err);
      res.status(500).json({ error: "Failed to update course sub-level config" });
    }
  });


}
