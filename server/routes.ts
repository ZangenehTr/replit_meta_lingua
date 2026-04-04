import type { Express } from "express";
import { seedTestUsers } from "./content/seed-test-users";
import express from "express";
import { DEFAULT_ROLE_PERMISSIONS } from '@shared/subsystem-permissions';
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { CallernWebSocketServer } from "./websocket-server";
import { users, courses, enrollments, userAchievements, userProfiles, curriculums, curriculumLevels, studentCurriculumProgress, curriculumLevelCourses, teacherTrialAvailability, trialLessons, scrapeJobs, competitorPrices, scrapedLeads, marketTrends, calendarEventsIranian, paymentIdempotency, aiActivitySessions, learningRecommendations, callSessions, coursePayments, walletTransactions, promoCodes, certificates, promoCodeUsages, videoProgress, sessionRatings, callernTeacherFollowers, liveClassSessions } from "@shared/schema";
import { eq, sql, and, desc, inArray, gte, lte, isNull, or } from "drizzle-orm";
import { setupRoadmapRoutes } from "./roadmap-routes";
import { setupCallernEnhancementRoutes } from "./callern-enhancement-routes";
import { registerCallernAIRoutes } from "./callern-ai-routes";
import { setupCallernPackageRoutes } from "./callern-package-routes";
import { setupCallernRecordingRoutes } from "./callern-recording-routes";
import { registerCallernTeacherRoutes } from "./callern-teacher-routes";
import callernRoadmapRoutes from "./routes/callern-roadmap-routes";
import teacherProfileRoutes from "./routes/teacher-profile-routes";
import courseRoadmapRoutes from "./routes/course-roadmap-routes";
import examRoadmapRoutes from "./routes/exam-roadmap-routes";
import { createAiStudyPartnerRoutes } from "./routes/ai-study-partner-routes";
import { registerGlobalLexiRoutes } from "./routes/global-lexi-routes";
import { setupBookEcommerceRoutes } from "./routes/book-ecommerce-routes";
import { setupContentBankRoutes } from "./routes/content-bank-routes";
import { registerLinguaQuestRoutes } from "./routes/linguaquest-routes";
import { registerAISalesAgentRoutes } from "./routes/ai-sales-agent-routes";
import linguaquestAudioRoutes from "./routes/linguaquest-audio-routes";
import searchRoutes from "./routes/search-routes";
import visitorChatRoutes from "./routes/visitor-chat-routes";
import thirdPartyIntegrationRoutes from "./routes/third-party-integration-routes";
import tttRoutes from "./ttt-routes";
import aiWebhookRoutes from "./ai-webhook-routes";
import publicFeaturesRoutes from "./routes/public-features-routes";
import mstRoutes from "./modules/mst/routes/mstRoutes";
import { 
  filterTeachers, 
  filterActiveTeachers,
  filterStudents, 
  filterActiveUsers,
  excludeTestUsers,
  calculatePercentage, 
  calculateAttendanceRate,
  calculateGrowthRate,
  roundCurrency,
  safeNumber,
  isActiveUser,
  ACTIVE_OBSERVATION_STATUSES,
  isActiveObservation,
  validateActiveTeacher
} from "./business-logic-utils";
import { ttsService, type TTSRequest } from "./tts-service";
import { ollamaService } from "./ollama-service";
import { ollamaInstaller } from "./ollama-installer";
import { setupAiTrainingRoutes } from "./ai-training-routes";
import { setupAiAnalysisRoutes } from "./ai-analysis-routes";
import { authenticate, authorizePermission } from "./auth";
import { createAdminUsersRouter } from "./routes/admin-users";
import { createInfrastructureHealthRouter } from "./routes/infrastructure-health-routes";
import { createAIHealthRouter } from "./routes/ai-health-routes";
import whisperHealthRouter from "./routes/whisper-health-routes";
import smokeTestRouter from './routes/smoke-test-routes';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { generatePayslipPDF, generateCertificatePDF, generateTestResultsPDF, type TestResultsPDFData } from "./utils/pdf-generator";
import { validateIranianPhone, validateIranianEmail, validatePersianText } from "./utils/iranian-validation";
import { parsePhoneNumbersFromCSV, parsePhoneNumbersFromText, normalizeIranianPhone, isValidIranianPhone } from "./utils/csv-phone-parser";
import { OtpService } from './services/otp-service';
import { createPlatformAuthMiddleware, validatePlatformCredential } from "./middleware/platform-auth";
import { PlatformFactory, getPlatformStrategy } from "./social-platforms/platform-factory";
import { setupCoreRoutes } from "./routes/core-routes";
import { setupCurriculumAndClassesRoutes } from "./routes/curriculum-and-classes-routes";
import { setupStudentAndCallerRoutes } from "./routes/student-and-callern-routes";
import { setupLeadAndRoadmapRoutes } from "./routes/lead-and-roadmap-routes";
import { setupAdminAndMiscRoutes } from "./routes/admin-and-misc-routes";
import { uploadVideo, uploadPhoto, uploadStudentPhoto, audioUpload } from "./middleware/uploads";
import {
  smsRateLimit, smsBulkRateLimit, authRateLimit, otpRequestRateLimit, otpVerifyRateLimit,
  sendSmsSchema, sendBulkSmsSchema, sendTestSmsSchema, checkIdempotency
} from "./middleware/rate-limits";
import { 
  insertUserSchema, 
  insertUserProfileSchema, 
  insertSessionSchema, 
  insertPaymentSchema, 
  insertMoodEntrySchema,
  insertMoodRecommendationSchema,
  insertLearningAdaptationSchema,
  insertRoomSchema,
  insertLeadSchema,
  insertCommunicationLogSchema,
  insertDepartmentSchema,
  peerMatchingRequests,
  insertPeerMatchingRequestSchema,
  peerSocializerParticipants,
  insertPeerSocializerParticipantSchema,
  peerSocializerGroups,
  insertPeerSocializerGroupSchema,
  classEnrollments,
  specialClasses,
  teacherPaymentRecords,
  WORKFLOW_STATUS,
  type InsertMoodEntry,
  type InsertMoodRecommendation,
  type InsertLearningAdaptation,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type UserProfile,
  type InsertUserProfile,
  type Room,
  type InsertRoom,
  type Lead,
  type InsertLead,
  type CommunicationLog,
  type InsertCommunicationLog,
  insertFrontDeskOperationSchema,
  insertPhoneCallLogSchema,
  insertFrontDeskTaskSchema,
  type FrontDeskOperation,
  type InsertFrontDeskOperation,
  type PhoneCallLog,
  type InsertPhoneCallLog,
  type FrontDeskTask,
  type InsertFrontDeskTask,
  LEAD_STAGE_TRANSITIONS,
  LEAD_WORKFLOW_STAGE,
  type LeadWorkflowStage,
  leadActivityLog
} from "@shared/schema";
import mammoth from "mammoth";
import { 
  exportStudentsCSV, 
  exportTeachersCSV, 
  exportFinancialReportCSV, 
  exportAttendanceCSV 
} from "./utils/csv-export";

// Critical security: JWT_SECRET must be provided via environment variable
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required but not set. Application cannot start.');
  process.exit(1);
}

// Helper functions to calculate real data from database
async function calculateStudentAttendance(studentId: number): Promise<number> {
  try {
    const sessions = await storage.getStudentSessions(studentId);
    if (!sessions || sessions.length === 0) return 0;
    const attendedSessions = sessions.filter(s => s.status === 'completed' || s.attended === true);
    const attendanceRate = (attendedSessions.length / sessions.length) * 100;
    return Math.round(attendanceRate);
  } catch (error) {
    console.error('Error calculating attendance:', error);
    return 0;
  }
}

async function getLastActivityTime(userId: number): Promise<string> {
  try {
    const sessions = await storage.getUserSessions(userId);
    const activities = await storage.getUserActivities(userId);
    let lastActivity = new Date(0);
    if (sessions && sessions.length > 0) {
      const lastSession = sessions.sort((a, b) => 
        new Date(b.scheduledAt || b.createdAt).getTime() - new Date(a.scheduledAt || a.createdAt).getTime()
      )[0];
      if (lastSession?.scheduledAt) {
        lastActivity = new Date(lastSession.scheduledAt);
      }
    }
    if (activities && activities.length > 0) {
      const lastActivityDate = new Date(activities[0].timestamp || activities[0].createdAt);
      if (lastActivityDate > lastActivity) {
        lastActivity = lastActivityDate;
      }
    }
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch (error) {
    console.error('Error getting last activity:', error);
    return 'Unknown';
  }
}

async function calculateTeacherRating(teacherId: number): Promise<string> {
  try {
    const reviews = await storage.getTeacherReviews(teacherId);
    if (!reviews || reviews.length === 0) return '0.0';
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / reviews.length;
    return averageRating.toFixed(1);
  } catch (error) {
    console.error('Error calculating teacher rating:', error);
    return '0.0';
  }
}

async function calculateOverallTeacherSatisfaction(): Promise<number> {
  try {
    const allReviews = await storage.getAllTeacherReviews();
    if (!allReviews || allReviews.length === 0) return 0;
    const totalRating = allReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / allReviews.length;
    return parseFloat(averageRating.toFixed(1));
  } catch (error) {
    console.error('Error calculating overall satisfaction:', error);
    return 0;
  }
}

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        messageFa: 'کاربر یافت نشد'
      });
    }
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'User account is inactive',
        messageFa: 'حساب کاربری غیرفعال است'
      });
    }
    req.user = user;
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
    const hasPermission = userRole === 'admin' || userRoleEquivalents.some(role => 
      normalizedRoles.includes(role)
    );
    if (!hasPermission) {
      console.log(`Role check failed: User role '${req.user.role}' not in required roles [${roles.join(', ')}]`);
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {

  // ── Scraper-CRM bridge: ensure columns exist (idempotent, fire-and-forget, retries) ──
  (async () => {
    const { pool } = await import('./db');
    const SQL = `
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS scrape_source_ref VARCHAR(255),
        ADD COLUMN IF NOT EXISTS scrape_qualification_score INTEGER;
      ALTER TABLE admin_settings
        ADD COLUMN IF NOT EXISTS scraper_auto_promotion_threshold INTEGER DEFAULT 60;
      ALTER TABLE admin_settings
        ADD COLUMN IF NOT EXISTS homepage_content JSONB;
    `;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await pool.query(SQL);
        console.log('[ScraperBridge] Schema columns verified/added');
        break;
      } catch (err: any) {
        if (attempt < 5) {
          await new Promise(r => setTimeout(r, attempt * 3000));
        } else {
          console.warn('[ScraperBridge] Column migration could not complete after retries:', err.message);
        }
      }
    }
  })().catch(() => {});

  // Serve static audio and photo files
  app.use('/uploads/audio', express.static('uploads/audio'));
  app.use('/uploads/teacher-photos', express.static('uploads/teacher-photos'));
  app.use('/uploads/student-photos', express.static('uploads/student-photos'));
  
  // Serve IELTS Section 2 audio files
  app.use('/ielts_section2_online', express.static(path.join(__dirname, '../ielts_section2_online')));
  app.use('/ielts_section2_offline', express.static(path.join(__dirname, '../ielts_section2_offline')));
  
  // Serve IELTS comparison interface
  app.get('/ielts_section2_comparison.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../ielts_section2_comparison.html'));
  });
  
  // Serve test files from root directory
  app.get('/test-callern-system.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'test-callern-system.html'));
  });
  
  // Simple in-memory store for downloaded models (in production, use database)
  let downloadedModels: string[] = [
    'llama3.2:1b',
    'llama3.2:3b', 
    'codellama:7b',
    'mistral:7b',
    'persian-llm:3b'
  ];

  // Production gate middleware for test endpoints
  const productionGateMiddleware = (req: any, res: any, next: any) => {
    if (process.env.NODE_ENV === 'production') {
      return authenticateToken(req, res, (err: any) => {
        if (err) return;
        return requireRole(['Admin'])(req, res, next);
      });
    }
    next();
  };

  const trainingData = new Map<string, Map<string, string[]>>();

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  });

  const routeContext = {
    authenticateToken,
    requireRole,
    downloadedModels,
    setDownloadedModels: (models: string[]) => { downloadedModels = models; },
    trainingData,
    upload,
    uploadVideo,
    uploadPhoto,
    audioUpload,
    uploadStudentPhoto,
    smsRateLimit,
    smsBulkRateLimit,
    otpRequestRateLimit,
    otpVerifyRateLimit,
    checkIdempotency,
    productionGateMiddleware,
    calculateStudentAttendance,
    getLastActivityTime,
    calculateTeacherRating,
    calculateOverallTeacherSatisfaction,
    sendSmsSchema,
    sendBulkSmsSchema,
    sendTestSmsSchema,
  };

  setupCoreRoutes(app, routeContext);
  setupCurriculumAndClassesRoutes(app, routeContext);
  setupStudentAndCallerRoutes(app, routeContext);
  setupLeadAndRoadmapRoutes(app, routeContext);
  await setupAdminAndMiscRoutes(app, routeContext);

  const { createAdminCopilotRoutes } = await import('./routes/admin-copilot-routes');
  const copilotRouter = createAdminCopilotRoutes(storage);
  app.use(copilotRouter);

  return app;
}

export default registerRoutes;
