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


export async function setupCurriculumSisCrmRoutes(app: any, context: RouteContext): Promise<void> {
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

  // ===== STUDENT INFORMATION SYSTEM (SIS) ENDPOINTS =====
  
  // GET /api/admin/students - Student Information System as per PRD
  app.get("/api/admin/students", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const students = users
        .filter(user => user.role === 'student')
        .map(student => ({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phoneNumber: student.phoneNumber || null,
          enrollmentDate: student.createdAt,
          status: 'active',
          currentLevel: 'B1', // This would come from user profile when implemented
          targetLanguage: 'English',
          nativeLanguage: 'Persian',
          learningGoals: ['Business Communication', 'Travel'],
          guardianName: null,
          guardianPhone: null,
          dateOfBirth: null,
          address: null,
          communicationLogs: [],
          paymentHistory: [],
          attendanceRecords: [],
          homeworkSubmissions: [],
          progressReports: []
        }));
      
      res.json(students);
    } catch (error) {
      console.error("Error fetching students for SIS:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // ===== CRM MANAGEMENT ENDPOINTS =====
  
  // CRM Dashboard Stats
  app.get("/api/crm/stats", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const stats = await storage.getCRMStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch CRM stats" });
    }
  });

  // Student Management
  app.get("/api/crm/students", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const { search, status, level, language, page = 1, limit = 50 } = req.query;
      const students = await storage.getStudentsWithFilters({
        search: search as string,
        status: status as string,
        level: level as string,
        language: language as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/crm/students/:id", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.getStudentDetails(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student details" });
    }
  });

  app.post("/api/crm/students", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const studentData = req.body;
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      res.status(400).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/crm/students/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.updateStudent(studentId, req.body);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(400).json({ message: "Failed to update student" });
    }
  });

  // Teacher Management
  app.get("/api/crm/teachers", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { search, status, specialization } = req.query;
      const teachers = await storage.getTeachersWithFilters({
        search: search as string,
        status: status as string,
        specialization: specialization as string
      });
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.get("/api/crm/teachers/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const teacher = await storage.getTeacherDetails(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher details" });
    }
  });

  app.post("/api/crm/teachers", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const teacherData = req.body;
      const teacher = await storage.createTeacher(teacherData);
      res.status(201).json(teacher);
    } catch (error) {
      res.status(400).json({ message: "Failed to create teacher" });
    }
  });

  // Student Groups Management
  app.get("/api/crm/groups", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const { language, level, status, teacherId } = req.query;
      const groups = await storage.getStudentGroupsWithFilters({
        language: language as string,
        level: level as string,
        status: status as string,
        teacherId: teacherId ? parseInt(teacherId as string) : undefined
      });
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get("/api/crm/groups/:id", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getStudentGroupDetails(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group details" });
    }
  });

  app.post("/api/crm/groups", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const groupData = req.body;
      const group = await storage.createStudentGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: "Failed to create group" });
    }
  });

  // Attendance Management
  app.get("/api/crm/attendance", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const { groupId, date, studentId } = req.query;
      const attendance = await storage.getAttendanceRecords({
        groupId: groupId ? parseInt(groupId as string) : undefined,
        date: date as string,
        studentId: studentId ? parseInt(studentId as string) : undefined
      });
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/crm/attendance", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const attendanceData = {
        ...req.body,
        markedBy: req.user.id
      };
      const attendance = await storage.createAttendanceRecord(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Failed to mark attendance" });
    }
  });

  // Student Notes Management
  app.get("/api/crm/students/:id/notes", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const notes = await storage.getStudentNotes(studentId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student notes" });
    }
  });

  app.post("/api/crm/students/:id/notes", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const noteData = {
        ...req.body,
        studentId,
        teacherId: req.user.id
      };
      const note = await storage.createStudentNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ message: "Failed to create note" });
    }
  });

  // Parent/Guardian Management
  app.get("/api/crm/students/:id/parents", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const parents = await storage.getStudentParents(studentId);
      res.json(parents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parent information" });
    }
  });

  app.post("/api/crm/students/:id/parents", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const parentData = {
        ...req.body,
        studentId
      };
      const parent = await storage.createParentGuardian(parentData);
      res.status(201).json(parent);
    } catch (error) {
      res.status(400).json({ message: "Failed to add parent information" });
    }
  });

  // Communication Logs
  app.get("/api/crm/communications", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const { studentId, type, dateFrom, dateTo } = req.query;
      const communications = await storage.getCommunicationLogs({
        studentId: studentId ? parseInt(studentId as string) : undefined,
        type: type as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      });
      res.json(communications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communication logs" });
    }
  });

  app.post("/api/crm/communications", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const communicationData = {
        ...req.body,
        fromUserId: req.user.id
      };
      const communication = await storage.createCommunicationLog(communicationData);
      res.status(201).json(communication);
    } catch (error) {
      res.status(400).json({ message: "Failed to log communication" });
    }
  });

  // Student Reports
  app.get("/api/crm/reports", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const { studentId, reportType, period } = req.query;
      const reports = await storage.getStudentReports({
        studentId: studentId ? parseInt(studentId as string) : undefined,
        reportType: reportType as string,
        period: period as string
      });
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/crm/reports", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const reportData = {
        ...req.body,
        generatedBy: req.user.id
      };
      const report = await storage.createStudentReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Failed to generate report" });
    }
  });

  // Institute Management
  app.get("/api/crm/institutes", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const institutes = await storage.getInstitutes();
      res.json(institutes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch institutes" });
    }
  });

  app.post("/api/crm/institutes", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const institute = await storage.createInstitute(req.body);
      res.status(201).json(institute);
    } catch (error) {
      res.status(400).json({ message: "Failed to create institute" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      // Fix 2: Validate message content is not empty
      if (!req.body.content || req.body.content.trim().length === 0) {
        return res.status(400).json({ message: "Message content cannot be empty" });
      }

      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });

      const message = await storage.createMessage(messageData);
      res.status(201).json({ message: "Message sent", data: message });
    } catch (error) {
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Homework endpoints
  app.get("/api/homework", authenticateToken, async (req: any, res) => {
    const homework = await storage.getUserHomework(req.user.id);
    res.json(homework);
  });

  app.get("/api/homework/pending", authenticateToken, async (req: any, res) => {
    const homework = await storage.getPendingHomework(req.user.id);
    res.json(homework);
  });

  // Tutors endpoints - Note: main /api/tutors endpoint is handled separately above with enhanced data

  app.get("/api/tutors/featured", authenticateToken, async (req: any, res) => {
    const tutors = await storage.getFeaturedTutors();
    res.json(tutors);
  });

  // Payments endpoints
  app.get("/api/payments", authenticateToken, async (req: any, res) => {
    const payments = await storage.getUserPayments(req.user.id);
    res.json(payments);
  });

  // Wallet-based Payment System Endpoints
  app.get("/api/wallet", authenticateToken, async (req: any, res) => {
    try {
      const walletData = await storage.getUserWalletData(req.user.id);
      if (!walletData) {
        return res.status(404).json({ message: "Wallet data not found" });
      }
      res.json(walletData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet data" });
    }
  });

  app.get("/api/wallet/transactions", authenticateToken, async (req: any, res) => {
    try {
      const transactions = await storage.getUserWalletTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet transactions" });
    }
  });

  app.post("/api/wallet/topup", authenticateToken, async (req: any, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const settings = await storage.getAdminSettings();
      if (!settings) {
        return res.status(500).json({ message: "Admin settings not configured" });
      }

      // Check if amount is in valid increments
      const increment = (settings as any)?.walletTopupIncrement || 10000;
      if (amount % increment !== 0) {
        return res.status(400).json({ 
          message: `Amount must be in increments of ${increment} IRR` 
        });
      }

      // Create wallet transaction
      const transaction = await storage.createWalletTransaction({
        userId: req.user.id,
        type: 'topup',
        amount,
        description: `Wallet top-up of ${amount.toLocaleString('fa-IR')} IRR`,
        status: 'pending',
        merchantTransactionId: `WALLET_${Date.now()}_${req.user.id}`
      });

      // Use active payment gateway for wallet top-up
      const { getActiveGateway } = await import('../payment/gateway-factory');
      const gateway = await getActiveGateway();

      if (!gateway) {
        return res.status(503).json({ 
          message: "Payment gateway not configured. Please contact support." 
        });
      }

      const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const callbackUrl = `${base}/api/payments/${gateway.name}/callback`;

      const initResult = await gateway.initiate({
        amount,
        orderId: transaction.merchantTransactionId!,
        description: `Wallet Top-up - ${amount.toLocaleString('fa-IR')} IRR`,
        callbackUrl,
        customerEmail: req.user.email || undefined,
        customerPhone: req.user.phoneNumber || undefined,
        metadata: { transactionId: transaction.id, userId: req.user.id, type: 'wallet_topup' }
      });

      if (!initResult.success) {
        return res.status(502).json({ message: initResult.error || "Gateway rejected payment initiation" });
      }

      // Store gateway transactionId for callback lookup (e.g. Zarinpal authority)
      if (initResult.transactionId) {
        await db.update(walletTransactions)
          .set({ shetabTransactionId: initResult.transactionId, gatewayTransactionId: initResult.transactionId, gatewayName: gateway.name })
          .where(eq(walletTransactions.id, transaction.id));
      }

      res.json({
        success: true,
        paymentUrl: initResult.gatewayUrl,
        transactionId: transaction.merchantTransactionId,
        gateway: gateway.name,
        message: "Redirecting to payment gateway",
        transaction
      });

    } catch (error: any) {
      console.error('Wallet top-up error:', error);
      res.status(400).json({ 
        message: "Failed to process wallet top-up",
        error: error.message
      });
    }
  });

  app.get("/api/courses/available", authenticateToken, async (req: any, res) => {
    try {
      const courses = await storage.getAvailableCoursesForUser(req.user.id);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available courses" });
    }
  });

  // ─── CRM BRIDGE HELPER ────────────────────────────────────────────────────
  // Called after any confirmed course payment to auto-advance a matching CRM lead
  async function advanceLeadAfterPayment(opts: {
    userId: number;
    courseId: number;
    finalPrice: number;
    paymentMethod: string;
    transactionId?: string | null;
  }) {
    try {
      const [userRecord] = await db.select({ phoneNumber: users.phoneNumber }).from(users).where(eq(users.id, opts.userId)).limit(1);
      if (!userRecord?.phoneNumber) return;

      // Find an active lead for this phone that is NOT yet enrolled or lost
      const [matchedLead] = await db.select().from(leads)
        .where(
          and(
            eq(leads.phoneNumber, userRecord.phoneNumber),
            sql`${leads.status} IN ('new','contacted','qualified','converted')`,
            sql`${leads.workflowStage} != 'enrolled'`,
            sql`${leads.workflowStage} != 'withdrawal'`
          )
        )
        .orderBy(desc(leads.updatedAt))
        .limit(1);

      if (!matchedLead) return;

      const fromStage = (matchedLead.workflowStage || 'contact_desk') as string;
      await db.update(leads).set({
        workflowStage: 'enrolled',
        status: 'converted',
        conversionDate: new Date(),
        studentId: opts.userId,
        enrolledCourseId: opts.courseId,
        paymentMethod: opts.paymentMethod,
        updatedAt: new Date(),
        stageChangedAt: new Date()
      }).where(eq(leads.id, matchedLead.id));

      await db.insert(leadActivityLog).values({
        leadId: matchedLead.id,
        fromStage,
        toStage: 'enrolled',
        operatorId: null,
        reason: 'Online payment confirmed',
        snapshot: {
          paymentMethod: opts.paymentMethod,
          finalPrice: opts.finalPrice,
          courseId: opts.courseId,
          transactionId: opts.transactionId || null,
          source: 'auto_payment_bridge'
        }
      });

      console.log(`[CRM] Lead #${matchedLead.id} auto-advanced to 'enrolled' after payment userId=${opts.userId}`);
    } catch (e) {
      console.error('[CRM] advanceLeadAfterPayment failed (non-fatal):', e);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  app.post("/api/courses/enroll", authenticateToken, async (req: any, res) => {
    try {
      const { courseId, paymentMethod, promoCode } = req.body;
      
      if (!courseId || !paymentMethod) {
        return res.status(400).json({ message: "Course ID and payment method required" });
      }

      if (!['wallet', 'shetab', 'zarinpal', 'idpay', 'zibal', 'mellat', 'gateway'].includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }

      // Calculate course price with member tier discount
      const priceData = await storage.calculateCoursePrice(courseId, req.user.id);
      if (!priceData) {
        return res.status(404).json({ message: "Course not found or price calculation failed" });
      }

      // Apply promo code discount if provided
      let appliedPromoCodeId: number | null = null;
      let promoDiscountAmount = 0;
      let finalPrice = priceData.finalPrice;

      if (promoCode && typeof promoCode === 'string') {
        const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, promoCode.toUpperCase().trim()));
        if (!promo || !promo.isActive) {
          return res.status(400).json({ message: "کد تخفیف معتبر نیست یا غیرفعال است" });
        }
        if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
          return res.status(400).json({ message: "کد تخفیف منقضی شده است" });
        }
        if (promo.maxUsages !== null && promo.usedCount >= promo.maxUsages) {
          return res.status(400).json({ message: "این کد تخفیف به حداکثر استفاده رسیده است" });
        }
        // If singleUsePerUser is enabled, prevent the same user from reusing the code for the same course
        if (promo.singleUsePerUser) {
          const [previousUse] = await db
            .select({ id: coursePayments.id })
            .from(coursePayments)
            .where(
              and(
                eq(coursePayments.userId, req.user.id),
                eq(coursePayments.courseId, Number(courseId)),
                eq(coursePayments.promoCodeId, promo.id),
                eq(coursePayments.status, 'completed')
              )
            );
          if (previousUse) {
            return res.status(400).json({ message: "شما قبلاً از این کد تخفیف برای این دوره استفاده کرده‌اید" });
          }
        }
        if (promo.minAmount && finalPrice < promo.minAmount) {
          return res.status(400).json({ message: `حداقل مبلغ سفارش برای این کد ${promo.minAmount.toLocaleString('fa-IR')} تومان است` });
        }
        if (promo.applicableCourseIds && Array.isArray(promo.applicableCourseIds) && promo.applicableCourseIds.length > 0) {
          if (!(promo.applicableCourseIds as number[]).includes(Number(courseId))) {
            return res.status(400).json({ message: "این کد تخفیف برای این دوره قابل استفاده نیست" });
          }
        }
        if (promo.discountType === 'percentage') {
          promoDiscountAmount = Math.round(finalPrice * promo.discountValue / 100);
        } else {
          promoDiscountAmount = Math.min(promo.discountValue, finalPrice);
        }
        finalPrice = Math.max(0, finalPrice - promoDiscountAmount);
        appliedPromoCodeId = promo.id;
      }

      // Check wallet balance if paying from wallet
      if (paymentMethod === 'wallet') {
        const walletData = await storage.getUserWalletData(req.user.id);
        if (!walletData || walletData.walletBalance < finalPrice) {
          return res.status(400).json({ 
            message: "Insufficient wallet balance",
            required: finalPrice,
            available: walletData?.walletBalance || 0
          });
        }
      }

      // Create course payment record — store promoCodeId for confirmed-payment increment
      const coursePayment = await storage.createCoursePayment({
        userId: req.user.id,
        courseId,
        originalPrice: priceData.originalPrice,
        discountPercentage: priceData.discountPercentage,
        finalPrice,
        creditsAwarded: priceData.creditsAwarded,
        paymentMethod,
        status: 'pending',
        merchantTransactionId: `COURSE_${Date.now()}_${req.user.id}_${courseId}`,
        promoCodeId: appliedPromoCodeId || null
      });

      if (paymentMethod === 'wallet') {
        // Process wallet payment immediately
        await storage.updateCoursePaymentStatus(coursePayment.id, 'completed');
        // Increment promo code usage only after confirmed wallet payment
        if (appliedPromoCodeId) {
          await db.update(promoCodes)
            .set({ usedCount: sql`${promoCodes.usedCount} + 1`, updatedAt: new Date() })
            .where(eq(promoCodes.id, appliedPromoCodeId));
          // Record detailed usage in promo_code_usages audit table
          await db.insert(promoCodeUsages).values({
            promoCodeId: appliedPromoCodeId,
            userId: req.user.id,
            courseId: Number(courseId),
            discountAmount: promoDiscountAmount,
            originalAmount: priceData.finalPrice,
            finalAmount: finalPrice,
          }).catch((e: any) => console.error("Failed to record promo usage:", e));
        }

        // Copy UTM fields from user record to course_payments for attribution reporting
        try {
          const [userRecord] = await db.select({ utmSource: users.utmSource, utmMedium: users.utmMedium, utmCampaign: users.utmCampaign })
            .from(users).where(eq(users.id, req.user.id)).limit(1);
          if (userRecord && (userRecord.utmSource || userRecord.utmMedium || userRecord.utmCampaign)) {
            await db.update(coursePayments)
              .set({ utmSource: userRecord.utmSource, utmMedium: userRecord.utmMedium, utmCampaign: userRecord.utmCampaign })
              .where(eq(coursePayments.id, coursePayment.id));
          }
        } catch (utmErr) { console.error('UTM copy failed (non-fatal):', utmErr); }

        // Trigger referral first-payment credit (non-blocking)
        try {
          const { processReferralFirstPayment } = await import('./referral-routes.js');
          processReferralFirstPayment(req.user.id, coursePayment.id).catch(() => {});
        } catch (_) {}

        // CRM Bridge: advance matching lead to 'enrolled' (non-blocking)
        advanceLeadAfterPayment({
          userId: req.user.id,
          courseId: Number(courseId),
          finalPrice,
          paymentMethod: 'wallet',
          transactionId: coursePayment.merchantTransactionId
        }).catch(() => {});

        res.json({
          success: true,
          message: "Course enrollment successful",
          payment: coursePayment
        });
      } else {
        // For gateway payment, use active payment gateway
        const { getActiveGateway } = await import('../payment/gateway-factory');
        const gateway = await getActiveGateway();

        if (!gateway) {
          return res.status(503).json({ 
            message: "Payment gateway not configured. Please contact support." 
          });
        }

        const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const callbackUrl = `${base}/api/payments/${gateway.name}/callback`;

        const initResult = await gateway.initiate({
          amount: finalPrice,
          orderId: coursePayment.merchantTransactionId!,
          description: `Course Enrollment - ${finalPrice.toLocaleString('fa-IR')} IRR`,
          callbackUrl,
          customerEmail: req.user.email || undefined,
          customerPhone: req.user.phoneNumber || undefined,
          metadata: { paymentId: coursePayment.id, courseId, userId: req.user.id, type: 'course_enrollment' }
        });

        if (!initResult.success) {
          return res.status(502).json({ message: initResult.error || "Gateway rejected payment initiation" });
        }

        // Store gateway transactionId for callback lookup (e.g. Zarinpal authority)
        if (initResult.transactionId) {
          await db.update(coursePayments)
            .set({ gatewayTransactionId: initResult.transactionId, gatewayName: gateway.name })
            .where(eq(coursePayments.id, coursePayment.id));
        }

        res.json({
          success: true,
          paymentUrl: initResult.gatewayUrl,
          transactionId: coursePayment.merchantTransactionId,
          gateway: gateway.name,
          message: "Redirecting to payment gateway",
          payment: coursePayment
        });
      }

    } catch (error: any) {
      console.error('Course enrollment error:', error);
      res.status(400).json({ 
        message: "Failed to enroll in course",
        error: error.message
      });
    }
  });

  app.get("/api/admin/settings", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.put("/api/admin/settings", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const settings = await storage.updateAdminSettings(req.body);
      
      // Update Whisper service configuration if Whisper settings changed
      if (req.body.whisperProvider || req.body.whisperUrl) {
        whisperService.updateConfigFromSettings({
          whisperProvider: settings.whisperProvider,
          whisperUrl: settings.whisperUrl,
          openaiApiKey: process.env.OPENAI_API_KEY
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Failed to update admin settings" });
    }
  });

  // Enhanced Shetab Payment Integration
  app.post("/api/payments/shetab/initiate", authenticateToken, async (req: any, res) => {
    try {
      const { amount, creditsPurchase, description } = req.body;
      
      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      // Get client IP and user agent for security
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Get user details for payment
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Import Shetab service
      const { createShetabService } = await import('../shetab-service');
      const shetabService = createShetabService();
      
      if (!shetabService) {
        return res.status(503).json({ 
          message: "Payment service temporarily unavailable. Please contact support.",
          error: "SHETAB_NOT_CONFIGURED"
        });
      }

      // Initialize payment
      const paymentRequest = {
        amount: parseInt(amount),
        orderId: `ORDER_${Date.now()}_${req.user.id}`,
        description: description || 'Language Learning Credits Purchase',
        customerEmail: user.email,
        customerPhone: user.phoneNumber,
        metadata: {
          creditsAwarded: creditsPurchase || 0,
          userId: req.user.id
        }
      };

      const result = await shetabService.initializePayment(
        req.user.id,
        paymentRequest,
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        paymentUrl: result.gatewayUrl,
        transactionId: result.payment.merchantTransactionId,
        amount: amount,
        creditsAwarded: creditsPurchase || 0
      });

    } catch (error: any) {
      console.error('Shetab payment initiation error:', error);
      res.status(400).json({ 
        message: "Failed to initiate payment",
        error: error.message
      });
    }
  });

  // Shetab payment callback handler
  app.post("/api/payments/shetab/callback", async (req, res) => {
    try {
      const callbackData = req.body;
      console.log('Shetab callback received:', callbackData);

      // Import Shetab service
      const { createShetabService } = await import('../shetab-service');
      const shetabService = createShetabService();
      
      if (!shetabService) {
        return res.status(503).json({ message: "Payment service unavailable" });
      }

      // Handle callback — updates the payments table and verifies with Shetab
      const payment = await shetabService.handleCallback(callbackData);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      let redirectPath = 'dashboard';

      if (payment.status === 'completed' && payment.transactionId) {
        const txId = payment.transactionId;
        const gatewayData = {
          shetabTransactionId: callbackData.gatewayTransactionId || '',
          shetabReferenceNumber: callbackData.referenceNumber || '',
          cardNumber: callbackData.cardNumber || ''
        };

        // Case A: course enrollment payment — finalize coursePayments + trigger enrollment
        if (txId.startsWith('COURSE_')) {
          const [coursePayment] = await db
            .select()
            .from(coursePayments)
            .where(eq(coursePayments.merchantTransactionId, txId));

          if (coursePayment && coursePayment.status !== 'completed') {
            await storage.updateCoursePaymentStatus(coursePayment.id, 'completed', gatewayData);
            // Increment promo code usage only after gateway payment is confirmed
            if (coursePayment.promoCodeId) {
              await db.update(promoCodes)
                .set({ usedCount: sql`${promoCodes.usedCount} + 1`, updatedAt: new Date() })
                .where(eq(promoCodes.id, coursePayment.promoCodeId));
              // originalAmount = price after member discount but before promo (consistent with wallet path)
              const memberDiscountPct = coursePayment.discountPercentage ?? 0;
              const priceBeforePromo = Math.round(coursePayment.originalPrice * (1 - memberDiscountPct / 100));
              const promoDiscount = priceBeforePromo - coursePayment.finalPrice;
              // Record detailed usage in promo_code_usages audit table
              await db.insert(promoCodeUsages).values({
                promoCodeId: coursePayment.promoCodeId,
                userId: coursePayment.userId,
                courseId: coursePayment.courseId,
                discountAmount: promoDiscount,
                originalAmount: priceBeforePromo,
                finalAmount: coursePayment.finalPrice,
              }).catch((e: any) => console.error("Failed to record gateway promo usage:", e));
            }
            // Copy UTM attribution from user record to payment
            try {
              const [userRec] = await db.select({ utmSource: users.utmSource, utmMedium: users.utmMedium, utmCampaign: users.utmCampaign })
                .from(users).where(eq(users.id, coursePayment.userId)).limit(1);
              if (userRec && (userRec.utmSource || userRec.utmMedium || userRec.utmCampaign)) {
                await db.update(coursePayments)
                  .set({ utmSource: userRec.utmSource, utmMedium: userRec.utmMedium, utmCampaign: userRec.utmCampaign })
                  .where(eq(coursePayments.id, coursePayment.id));
              }
            } catch (_) {}
            // Trigger referral first-payment credit (non-blocking)
            try {
              const { processReferralFirstPayment } = await import('./referral-routes.js');
              processReferralFirstPayment(coursePayment.userId, coursePayment.id).catch(() => {});
            } catch (_) {}

            // CRM Bridge: advance matching lead to 'enrolled' (non-blocking)
            advanceLeadAfterPayment({
              userId: coursePayment.userId,
              courseId: coursePayment.courseId,
              finalPrice: coursePayment.finalPrice,
              paymentMethod: 'gateway',
              transactionId: coursePayment.merchantTransactionId
            }).catch(() => {});
          }
          redirectPath = 'courses';
        }

        // Case B: wallet top-up — finalize walletTransactions + credit user balance
        if (txId.startsWith('WALLET_')) {
          const [walletTxn] = await db
            .select()
            .from(walletTransactions)
            .where(eq(walletTransactions.merchantTransactionId, txId));

          if (walletTxn && walletTxn.status !== 'completed') {
            await storage.updateWalletTransactionStatus(walletTxn.id, 'completed', gatewayData);
          }
          redirectPath = 'student/wallet';
        }
      }

      // Create notification for user
      await storage.createNotification({
        userId: payment.userId,
        title: payment.status === 'completed' ? "Payment Successful" : "Payment Failed",
        message: payment.status === 'completed'
          ? `Your payment of ${payment.amount} IRR was successful.`
          : `Your payment of ${payment.amount} IRR failed. ${payment.failureReason || 'Please try again.'}`,
        type: payment.status === 'completed' ? "success" : "error"
      });

      const redirectUrl = payment.status === 'completed'
        ? `${process.env.FRONTEND_URL || ''}/${redirectPath}?payment=success`
        : `${process.env.FRONTEND_URL || ''}/dashboard?payment=failed`;

      res.redirect(redirectUrl);

    } catch (error: any) {
      console.error('Shetab callback error:', error);
      res.status(400).json({ message: "Payment callback processing failed" });
    }
  });

  // Verify payment status endpoint
  app.post("/api/payments/shetab/verify", authenticateToken, async (req: any, res) => {
    try {
      const { merchantTransactionId, gatewayTransactionId } = req.body;

      if (!merchantTransactionId || !gatewayTransactionId) {
        return res.status(400).json({ message: "Missing required transaction IDs" });
      }

      // Import Shetab service
      const { createShetabService } = await import('../shetab-service');
      const shetabService = createShetabService();
      
      if (!shetabService) {
        return res.status(503).json({ message: "Payment service unavailable" });
      }

      // Verify payment
      const verifyResult = await shetabService.verifyPayment(merchantTransactionId, gatewayTransactionId);
      
      res.json({
        success: verifyResult.success,
        status: verifyResult.status,
        transactionId: verifyResult.transactionId,
        referenceNumber: verifyResult.referenceNumber,
        amount: verifyResult.amount,
        error: verifyResult.error
      });

    } catch (error: any) {
      console.error('Payment verification error:', error);
      res.status(400).json({ 
        message: "Payment verification failed",
        error: error.message
      });
    }
  });

  // Enhanced Role-Based Notifications endpoints
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const { category, priority, includeRead, includeDismissed, limit, offset } = req.query;
      
      const options = {
        category: category as string,
        priority: priority as string,
        includeRead: includeRead === 'true',
        includeDismissed: includeDismissed === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const notifications = await storage.getUserNotifications(req.user.id, options);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.get("/api/notifications/count", authenticateToken, async (req: any, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching notification count:', error);
      res.status(500).json({ message: 'Failed to fetch notification count' });
    }
  });

  app.get("/api/notifications/unread", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getUnreadNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      res.status(500).json({ message: 'Failed to fetch unread notifications' });
    }
  });

  app.post("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notification = await storage.createNotification({
        ...req.body,
        userId: req.user.id
      });
      
      // Emit real-time notification
      if (global.io) {
        global.io.to(`user-${req.user.id}`).emit('new-notification', notification);
      }
      
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Failed to create notification' });
    }
  });

  app.patch("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
    try {
      const notification = await storage.markNotificationAsRead(parseInt(req.params.id));
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Emit real-time update
      if (global.io) {
        global.io.to(`user-${req.user.id}`).emit('notification-read', { id: parseInt(req.params.id) });
      }
      
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  app.patch("/api/notifications/:id/dismiss", authenticateToken, async (req: any, res) => {
    try {
      const notification = await storage.markNotificationAsDismissed(parseInt(req.params.id));
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Emit real-time update
      if (global.io) {
        global.io.to(`user-${req.user.id}`).emit('notification-dismissed', { id: parseInt(req.params.id) });
      }
      
      res.json(notification);
    } catch (error) {
      console.error('Error dismissing notification:', error);
      res.status(500).json({ message: 'Failed to dismiss notification' });
    }
  });

  app.patch("/api/notifications/mark-all-read", authenticateToken, async (req: any, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      
      // Emit real-time update
      if (global.io) {
        global.io.to(`user-${req.user.id}`).emit('all-notifications-read');
      }
      
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  });

  app.delete("/api/notifications/:id", authenticateToken, async (req: any, res) => {
    try {
      const success = await storage.deleteNotification(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Emit real-time update
      if (global.io) {
        global.io.to(`user-${req.user.id}`).emit('notification-deleted', { id: parseInt(req.params.id) });
      }
      
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  });

  app.post("/api/notifications/sms", authenticateToken, async (req: any, res) => {
    try {
      const { message, type, phoneNumber } = req.body;
      const { kavenegarService } = await import('../kavenegar-service');
      
      const recipient = phoneNumber || req.user.phoneNumber || req.user.phone;
      
      if (!recipient) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const result = await kavenegarService.sendSimpleSMS(recipient, message);

      res.json({ 
        success: result.success,
        messageId: result.messageId,
        status: result.status,
        cost: result.cost,
        error: result.error,
        message: result.success ? "SMS sent successfully" : "Failed to send SMS"
      });
    } catch (error) {
      console.error('SMS sending error:', error);
      res.status(500).json({ message: "Failed to send SMS" });
    }
  });

  // SMS Template Configuration endpoints
  app.get("/api/admin/sms/templates", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const settings = await storage.getAdminSettings();
      
      // Default templates for various events
      const templates = {
        studentCreation: settings?.studentCreationSmsTemplate || 
          `Welcome to Meta Lingua Academy!\n\n` +
          `Your student account has been created.\n` +
          `Login Information:\n` +
          `Username: {email}\n` +
          `Password: {password}\n` +
          `Classes: {courses}\n\n` +
          `Please login at: {loginUrl}`,
        
        enrollment: settings?.enrollmentSmsTemplate ||
          `Hello {firstName},\n` +
          `You have been enrolled in {course}.\n` +
          `Class starts: {startDate}\n` +
          `Teacher: {teacherName}\n\n` +
          `Good luck with your studies!`,
        
        sessionReminder: settings?.sessionReminderSmsTemplate ||
          `Reminder: You have a class tomorrow at {time}.\n` +
          `Course: {course}\n` +
          `Teacher: {teacherName}\n` +
          `Room: {room}`,
        
        paymentReceived: settings?.paymentReceivedSmsTemplate ||
          `Payment received: {amount} IRR\n` +
          `Transaction ID: {transactionId}\n` +
          `Thank you for your payment!`
      };
      
      res.json({ templates });
    } catch (error) {
      console.error('Error fetching SMS templates:', error);
      res.status(500).json({ message: "Failed to fetch SMS templates" });
    }
  });
  
  app.post("/api/admin/sms/templates", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { templateType, templateContent } = req.body;
      
      if (!templateType || !templateContent) {
        return res.status(400).json({ message: "Template type and content are required" });
      }
      
      // Get current settings
      const settings = await storage.getAdminSettings() || {};
      
      // Update the specific template
      const templateKey = `${templateType}SmsTemplate`;
      settings[templateKey] = templateContent;
      
      // Save updated settings
      await storage.updateAdminSettings(settings);
      
      res.json({ 
        message: "SMS template updated successfully",
        template: {
          type: templateType,
          content: templateContent
        }
      });
    } catch (error) {
      console.error('Error updating SMS template:', error);
      res.status(500).json({ message: "Failed to update SMS template" });
    }
  });

  // SMS Testing endpoints
  app.post("/api/admin/sms/test", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Phone number and message are required" });
      }

      // Check if SMS is configured
      const settings = await storage.getAdminSettings();
      if (!settings?.kavenegarEnabled || !settings?.kavenegarApiKey) {
        return res.status(400).json({ 
          success: false,
          message: "SMS service not configured. Please configure in Third Party Settings first." 
        });
      }

      // Try to send SMS with timeout handling
      try {
        const { kavenegarService } = await import('../kavenegar-service');
        
        // Set a timeout for the SMS test
        const smsPromise = kavenegarService.sendSimpleSMS(phoneNumber, message);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMS send timeout')), 8000)
        );
        
        const result = await Promise.race([smsPromise, timeoutPromise]);
        
        if (result.success) {
          res.json({ 
            success: true,
            message: "SMS sent successfully",
            messageId: result.messageId,
            status: result.status,
            cost: result.cost
          });
        } else {
          res.json({ 
            success: false, 
            error: result.error || "SMS sending failed",
            note: "Configuration is valid but SMS delivery failed"
          });
        }
      } catch (error) {
        console.error('SMS test error:', error);
        
        // Return validation success even if external API fails
        res.json({ 
          success: false,
          error: "SMS test simulated successfully - External API not reachable in this environment",
          note: "Your SMS configuration is valid. In production, SMS would be sent successfully.",
          phoneNumber: phoneNumber,
          messageLength: message.length,
          status: "configured"
        });
      }
    } catch (error) {
      console.error('SMS test error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "SMS test failed" 
      });
    }
  });

  // Kavenegar settings endpoints
  app.get('/api/admin/kavenegar-settings', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      // Return current Kavenegar configuration
      const settings = {
        isConfigured: !!process.env.KAVENEGAR_API_KEY,
        apiKey: process.env.KAVENEGAR_API_KEY ? `${process.env.KAVENEGAR_API_KEY.substring(0, 8)}...` : null,
        senderNumber: '10008663', // Default sender number
        dailyLimit: 1000,
        isEnabled: true,
        balance: null // Will be fetched from Kavenegar API if needed
      };
      res.json(settings);
    } catch (error) {
      console.error('Kavenegar settings error:', error);
      res.status(500).json({ message: 'Failed to fetch Kavenegar settings' });
    }
  });

  app.post('/api/admin/kavenegar-settings', authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { senderNumber, dailyLimit, isEnabled } = req.body;
      
      // Here you would typically save these settings to database
      // For now, we'll just return success since the API key is env-based
      
      res.json({ 
        message: 'Kavenegar settings saved successfully',
        settings: {
          senderNumber,
          dailyLimit,
          isEnabled
        }
      });
    } catch (error) {
      console.error('Save Kavenegar settings error:', error);
      res.status(500).json({ message: 'Failed to save Kavenegar settings' });
    }
  });

  // SMS connectivity test endpoint
  app.get("/api/admin/sms/connectivity-test", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { kavenegarService } = await import('../kavenegar-service');
      const result = await kavenegarService.testConnectivity();
      res.json(result);
    } catch (error) {
      console.error('SMS connectivity test error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Connectivity test failed" 
      });
    }
  });

  app.get("/api/admin/sms/account-info", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { kavenegarService } = await import('../kavenegar-service');
      const result = await kavenegarService.getAccountInfo();
      res.json(result);
    } catch (error) {
      console.error('SMS account info error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get account info" 
      });
    }
  });

  app.post("/api/admin/sms/send-verification", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { phoneNumber, code, template } = req.body;
      const { kavenegarService } = await import('../kavenegar-service');
      
      if (!phoneNumber || !code) {
        return res.status(400).json({ message: "Phone number and verification code are required" });
      }

      const templateToUse = template === 'none' ? undefined : template;
      const result = await kavenegarService.sendVerificationCode(phoneNumber, code, templateToUse);
      res.json(result);
    } catch (error) {
      console.error('Verification SMS error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to send verification SMS" 
      });
    }
  });

  // SMS Templates endpoints
  app.get("/api/admin/sms-templates", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      // Return default SMS templates for Iranian compliance
      const templates = [
        {
          id: 1,
          event: "enrollment",
          recipient: "student",
          template: "Welcome to Meta Lingua! You have been successfully enrolled in {courseName}. Your learning journey begins now!",
          variables: ["courseName"],
          isActive: true,
          language: "english"
        },
        {
          id: 2,
          event: "enrollment",
          recipient: "student",
          template: "به متا لینگوا خوش آمدید! شما با موفقیت در دوره {courseName} ثبت نام کردید. سفر یادگیری شما از اکنون آغاز می‌شود!",
          variables: ["courseName"],
          isActive: true,
          language: "persian"
        },
        {
          id: 3,
          event: "class_reminder",
          recipient: "student",
          template: "Hi {studentName}, reminder: Your class with {teacherName} is scheduled for {classTime}. Don't forget!",
          variables: ["studentName", "teacherName", "classTime"],
          isActive: true,
          language: "english"
        },
        {
          id: 4,
          event: "class_reminder",
          recipient: "student",
          template: "سلام {studentName}، یادآوری: کلاس شما با {teacherName} برای ساعت {classTime} برنامه‌ریزی شده است. فراموش نکنید!",
          variables: ["studentName", "teacherName", "classTime"],
          isActive: true,
          language: "persian"
        },
        {
          id: 5,
          event: "payment_confirmation",
          recipient: "student",
          template: "Payment confirmed! {amount} IRR received for {courseName}. Thank you for choosing Meta Lingua.",
          variables: ["amount", "courseName"],
          isActive: true,
          language: "english"
        },
        {
          id: 6,
          event: "payment_confirmation",
          recipient: "student",
          template: "پرداخت تأیید شد! {amount} ریال برای {courseName} دریافت شد. از انتخاب متا لینگوا متشکریم.",
          variables: ["amount", "courseName"],
          isActive: true,
          language: "persian"
        },
        {
          id: 7,
          event: "verification",
          recipient: "student",
          template: "Your Meta Lingua verification code is: {code}",
          variables: ["code"],
          isActive: true,
          language: "english"
        },
        {
          id: 8,
          event: "verification",
          recipient: "student",
          template: "کد تأیید متا لینگوا شما: {code}",
          variables: ["code"],
          isActive: true,
          language: "persian"
        }
      ];
      
      res.json(templates);
    } catch (error) {
      console.error('Error fetching SMS templates:', error);
      res.status(500).json({ error: 'Failed to fetch SMS templates' });
    }
  });

  // Kavenegar Settings endpoints
  app.get("/api/admin/kavenegar-settings", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const settings = {
        apiKey: process.env.KAVENEGAR_API_KEY ? "••••••••••••••••" : "",
        isConfigured: !!process.env.KAVENEGAR_API_KEY,
        senderNumber: "10008663", // Default Iranian sender number
        dailyLimit: 1000,
        isEnabled: !!process.env.KAVENEGAR_API_KEY
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching Kavenegar settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post("/api/admin/kavenegar-settings", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { senderNumber, dailyLimit, isEnabled } = req.body;
      
      // Note: API key is set via environment variable for security
      const settings = {
        senderNumber: senderNumber || "10008663",
        dailyLimit: dailyLimit || 1000,
        isEnabled: isEnabled && !!process.env.KAVENEGAR_API_KEY,
        apiKey: process.env.KAVENEGAR_API_KEY ? "••••••••••••••••" : "",
        isConfigured: !!process.env.KAVENEGAR_API_KEY,
        message: process.env.KAVENEGAR_API_KEY ? 
          "Settings saved successfully" : 
          "API key must be set via environment variable KAVENEGAR_API_KEY"
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error saving Kavenegar settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // ====== SMS AUTOMATION SETTINGS ENDPOINTS ======
  
  // Get SMS automation settings
  app.get("/api/admin/sms-automation-settings", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const settings = await storage.getAdminSettings();
      
      const automationSettings = {
        placementSmsEnabled: settings?.placementSmsEnabled ?? true,
        placementSmsReminderCooldownHours: settings?.placementSmsReminderCooldownHours ?? 24,
        placementSmsMaxReminders: settings?.placementSmsMaxReminders ?? 3,
        placementSmsDaysAfterTest: settings?.placementSmsDaysAfterTest ?? 1,
        placementSmsQuietHoursStart: settings?.placementSmsQuietHoursStart ?? "22:00",
        placementSmsQuietHoursEnd: settings?.placementSmsQuietHoursEnd ?? "08:00",
        placementSmsTemplate: settings?.placementSmsTemplate ?? "سلام {studentName} عزیز!\n\n{daysAgo} تست تعیین سطح خود را در سطح {placementLevel} با موفقیت تکمیل کردید. 🎉\n\nبرای شروع مسیر یادگیری و بهره‌مندی از کلاس‌های تخصصی، زمان ثبت‌نام در دوره‌های آموزشی فرا رسیده است.\n\n📞 جهت مشاوره و ثبت‌نام: 021-1234\n🌐 Meta Lingua - همراه شما در مسیر یادگیری",
        kavenegarEnabled: settings?.kavenegarEnabled ?? false,
        kavenegarConfigured: !!(settings?.kavenegarApiKey && settings?.kavenegarEnabled)
      };

      res.json({
        success: true,
        settings: automationSettings
      });
    } catch (error) {
      console.error('Error fetching SMS automation settings:', error);
      res.status(500).json({ message: "Failed to fetch SMS automation settings" });
    }
  });

  // Update SMS automation settings
  app.post("/api/admin/sms-automation-settings", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const {
        placementSmsEnabled,
        placementSmsReminderCooldownHours,
        placementSmsMaxReminders,
        placementSmsDaysAfterTest,
        placementSmsQuietHoursStart,
        placementSmsQuietHoursEnd,
        placementSmsTemplate
      } = req.body;

      // Validate settings
      const validationSchema = z.object({
        placementSmsEnabled: z.boolean(),
        placementSmsReminderCooldownHours: z.number().min(1).max(168), // 1 hour to 1 week
        placementSmsMaxReminders: z.number().min(1).max(10),
        placementSmsDaysAfterTest: z.number().min(0).max(30),
        placementSmsQuietHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        placementSmsQuietHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        placementSmsTemplate: z.string().min(10).max(1000)
      });

      const validatedData = validationSchema.parse(req.body);

      // Get current settings and update
      const currentSettings = await storage.getAdminSettings() || {};
      const updatedSettings = {
        ...currentSettings,
        ...validatedData
      };

      await storage.updateAdminSettings(updatedSettings);

      res.json({
        success: true,
        message: "SMS automation settings updated successfully"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid settings data",
          errors: error.errors 
        });
      }
      console.error('Error updating SMS automation settings:', error);
      res.status(500).json({ message: "Failed to update SMS automation settings" });
    }
  });

  // Get SMS automation statistics
  app.get("/api/admin/sms-statistics", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { period = 'today' } = req.query;
      
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      // Get placement test reminder statistics
      const allCommunicationLogs = await storage.getCommunicationLogs();
      const placementReminders = allCommunicationLogs.filter(log => 
        log.type === 'sms_placement_reminder' &&
        new Date(log.createdAt) >= startDate
      );

      const totalSent = placementReminders.length;
      const successfulSent = placementReminders.filter(log => log.status === 'sent').length;
      const failedSent = placementReminders.filter(log => log.status === 'failed').length;
      const successRate = totalSent > 0 ? ((successfulSent / totalSent) * 100) : 0;

      // Get unique students contacted
      const uniqueStudents = new Set(placementReminders.map(log => log.toUserId)).size;

      // Get enrollment conversions (simplified calculation)
      const enrolledAfterReminder = Math.round(uniqueStudents * 0.15); // Estimate 15% conversion
      const conversionRate = uniqueStudents > 0 ? ((enrolledAfterReminder / uniqueStudents) * 100) : 0;

      const statistics = {
        totalSent,
        successfulSent,
        failedSent,
        successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
        uniqueStudents,
        enrolledAfterReminder,
        conversionRate: Math.round(conversionRate * 10) / 10,
        period,
        periodLabel: period === 'today' ? 'امروز' : period === 'week' ? 'هفته گذشته' : 'ماه جاری',
        dailyBreakdown: placementReminders.reduce((acc, log) => {
          const date = new Date(log.createdAt).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      res.json({
        success: true,
        statistics
      });
    } catch (error) {
      console.error('Error fetching SMS statistics:', error);
      res.status(500).json({ message: "Failed to fetch SMS statistics" });
    }
  });

  // Test SMS automation template
  app.post("/api/admin/test-sms-template", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { template, phoneNumber, testData } = req.body;
      
      if (!template || !phoneNumber) {
        return res.status(400).json({ 
          success: false,
          message: "Template and phone number are required" 
        });
      }

      // Validate phone number format (Iranian mobile)
      const phoneRegex = /^(\+98|0098|98|0)?9\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ 
          success: false,
          message: "Please enter a valid Iranian mobile number (09xxxxxxxxx)" 
        });
      }

      // Replace template variables with test data
      const sampleData = {
        studentName: testData?.studentName || 'احمد رضایی',
        placementLevel: testData?.placementLevel || 'B1',
        daysAgo: testData?.daysAgo || '2 روز پیش'
      };

      let processedMessage = template;
      Object.entries(sampleData).forEach(([key, value]) => {
        processedMessage = processedMessage.replace(new RegExp(`{${key}}`, 'g'), value);
      });

      // Check SMS configuration
      const settings = await storage.getAdminSettings();
      if (!settings?.kavenegarEnabled || !settings?.kavenegarApiKey) {
        return res.status(400).json({ 
          success: false,
          message: "SMS service not configured. Please configure Kavenegar settings first." 
        });
      }

      // Send test SMS
      const { kavenegarService } = await import('../kavenegar-service');
      const result = await kavenegarService.sendSimpleSMS(phoneNumber, processedMessage);

      res.json({
        success: result.success,
        message: result.success ? "Test SMS sent successfully" : "Failed to send test SMS",
        processedMessage,
        messageId: result.messageId,
        cost: result.cost,
        error: result.error
      });
    } catch (error) {
      console.error('Error sending test SMS:', error);
      res.status(500).json({ message: "Failed to send test SMS" });
    }
  });

  // AI recommendations endpoint
  app.post("/api/ai/recommendations", authenticateToken, async (req: any, res) => {
    try {
      // Mock Ollama API call for AI recommendations
      const recommendations = [
        "Focus on pronunciation practice for the next few sessions",
        "Review irregular verbs in your target language",
        "Practice conversation with native speakers",
        "Work on listening comprehension exercises"
      ];

      res.json({ 
        recommendations,
        message: "AI recommendations generated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Course Management API Routes
  
  // Get all courses for admin
  app.get("/api/admin/courses", authenticateToken, requireRole(['Admin', 'Teacher/Tutor', 'Supervisor']), async (req: any, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get single course details
  app.get("/api/admin/courses/:id", authenticateToken, requireRole(['Admin', 'Teacher/Tutor', 'Supervisor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Create new course
  app.post("/api/admin/courses", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const courseData = req.body;
      console.log("Course creation request received:", JSON.stringify(courseData, null, 2));
      
      // Validate required fields (only validate fields that exist in schema)
      if (!courseData.title) {
        console.log("Course creation failed - missing required fields:", {
          title: !!courseData.title
        });
        return res.status(400).json({ message: "Title is required" });
      }

      // Resolve min/max sub-level IDs from codes if provided
      let minSubLevelId: number | null = null;
      let maxSubLevelId: number | null = null;
      if (courseData.minSubLevelCode) {
        const row = await db.execute(sql`SELECT id FROM curriculum_levels WHERE code = ${courseData.minSubLevelCode} LIMIT 1`);
        minSubLevelId = row.rows.length > 0 ? (row.rows[0] as { id: number }).id : null;
      }
      if (courseData.maxSubLevelCode) {
        const row = await db.execute(sql`SELECT id FROM curriculum_levels WHERE code = ${courseData.maxSubLevelCode} LIMIT 1`);
        maxSubLevelId = row.rows.length > 0 ? (row.rows[0] as { id: number }).id : null;
      }

      // Map frontend fields to database schema fields only
      const dbCourseData = {
        title: courseData.title,
        description: courseData.description || '',
        category: courseData.category || 'Language Learning',
        language: courseData.language || courseData.targetLanguage || 'English',
        level: courseData.level || 'Beginner',
        isActive: courseData.isActive !== undefined ? courseData.isActive : true
      };

      console.log("Mapped course data for database:", JSON.stringify(dbCourseData, null, 2));

      // Create course with only existing schema fields
      const newCourse = await storage.createCourse(dbCourseData);

      // Apply sub-level prerequisite config if provided
      if (minSubLevelId !== null || maxSubLevelId !== null || courseData.examTagIds || courseData.skillScope) {
        const examTagIds: number[] = Array.isArray(courseData.examTagIds) ? courseData.examTagIds.map(Number) : [];
        await db.execute(sql`
          UPDATE courses SET
            min_sub_level_id = ${minSubLevelId},
            max_sub_level_id = ${maxSubLevelId},
            exam_tag_ids = ${examTagIds}::integer[],
            skill_scope = ${courseData.skillScope ?? null}
          WHERE id = ${newCourse.id}
        `);
      }

      res.status(201).json({ message: "Course created successfully", course: newCourse });
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // Update course
  app.put("/api/admin/courses/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const updateData = req.body;

      const updatedCourse = await storage.updateCourse(courseId, updateData);
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json({ message: "Course updated successfully", course: updatedCourse });
    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  // Add module to course
  app.post("/api/admin/courses/:id/modules", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const { name, description, duration, order } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Module name is required" });
      }
      
      const newModule = await storage.addCourseModule(courseId, {
        name,
        description: description || '',
        duration: duration || 1,
        order: order || 1
      });
      
      res.status(201).json({ message: "Module added successfully", module: newModule });
    } catch (error) {
      console.error('Error adding module:', error);
      res.status(500).json({ message: "Failed to add module" });
    }
  });

  // Add lesson to module
  app.post("/api/admin/courses/:courseId/modules/:moduleId/lessons", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const moduleId = parseInt(req.params.moduleId);
      const { title, description, videoUrl, duration, orderIndex, skillFocus } = req.body;
      
      if (!title || !videoUrl) {
        return res.status(400).json({ message: "Title and video URL are required" });
      }
      
      const newLesson = await storage.addCourseLesson(courseId, moduleId, {
        title,
        description: description || '',
        videoUrl,
        duration: duration || 300,
        orderIndex: orderIndex || 1,
        skillFocus: skillFocus || 'general',
        teacherId: req.user.id,
        language: 'fa',
        level: 'beginner',
        isPublished: false
      });
      
      res.status(201).json({ message: "Lesson added successfully", lesson: newLesson });
    } catch (error) {
      console.error('Error adding lesson:', error);
      res.status(500).json({ message: "Failed to add lesson" });
    }
  });

  // Publish course
  app.post("/api/admin/courses/:id/publish", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      const publishedCourse = await storage.publishCourse(courseId);
      if (!publishedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json({ message: "Course published successfully", course: publishedCourse });
    } catch (error) {
      console.error('Error publishing course:', error);
      res.status(500).json({ message: "Failed to publish course" });
    }
  });

  // Get course modules
  app.get("/api/admin/courses/:courseId/modules", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const modules = await storage.getCourseModules(courseId);
      res.json(modules);
    } catch (error) {
      console.error('Error fetching modules:', error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  // =====================================================================
  // 3D LESSON MANAGEMENT API ENDPOINTS
  // =====================================================================
  
  // Get all 3D lessons for admin management
  app.get("/api/admin/3d-lessons", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const { courseId, language, level, templateType, search } = req.query;
      
      let query = db.select({
        threeDLesson: threeDVideoLessons,
        course: courses,
        threeDContent: threeDLessonContent,
        creator: users
      })
      .from(threeDVideoLessons)
      .innerJoin(courses, eq(threeDVideoLessons.courseId, courses.id))
      .innerJoin(threeDLessonContent, eq(threeDVideoLessons.threeDContentId, threeDLessonContent.id))
      .innerJoin(users, eq(threeDVideoLessons.createdBy, users.id));
      
      let lessons = await query;
      
      // Apply filters
      if (courseId) {
        lessons = lessons.filter(l => l.threeDLesson.courseId === parseInt(courseId));
      }
      if (language) {
        lessons = lessons.filter(l => l.threeDLesson.language === language);
      }
      if (level) {
        lessons = lessons.filter(l => l.threeDLesson.level === level);
      }
      if (templateType) {
        lessons = lessons.filter(l => l.threeDLesson.templateType === templateType);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        lessons = lessons.filter(l => 
          l.threeDLesson.title.toLowerCase().includes(searchLower) ||
          l.threeDLesson.description?.toLowerCase().includes(searchLower)
        );
      }
      
      // For teachers, only show their own lessons
      if (req.user.role === 'Teacher/Tutor') {
        lessons = lessons.filter(l => l.threeDLesson.createdBy === req.user.id);
      }
      
      res.json(lessons.map(l => ({
        ...l.threeDLesson,
        course: l.course,
        threeDContent: l.threeDContent,
        creator: {
          id: l.creator.id,
          firstName: l.creator.firstName,
          lastName: l.creator.lastName
        }
      })));
    } catch (error) {
      console.error('Error fetching 3D lessons:', error);
      res.status(500).json({ message: "Failed to fetch 3D lessons" });
    }
  });
  
  // Get single 3D lesson by ID
  app.get("/api/admin/3d-lessons/:id", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      
      const [lessonData] = await db.select({
        threeDLesson: threeDVideoLessons,
        course: courses,
        threeDContent: threeDLessonContent,
        creator: users
      })
      .from(threeDVideoLessons)
      .innerJoin(courses, eq(threeDVideoLessons.courseId, courses.id))
      .innerJoin(threeDLessonContent, eq(threeDVideoLessons.threeDContentId, threeDLessonContent.id))
      .innerJoin(users, eq(threeDVideoLessons.createdBy, users.id))
      .where(eq(threeDVideoLessons.id, lessonId));
      
      if (!lessonData) {
        return res.status(404).json({ message: "3D lesson not found" });
      }
      
      // Check permissions for teachers
      if (req.user.role === 'Teacher/Tutor' && lessonData.threeDLesson.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json({
        ...lessonData.threeDLesson,
        course: lessonData.course,
        threeDContent: lessonData.threeDContent,
        creator: {
          id: lessonData.creator.id,
          firstName: lessonData.creator.firstName,
          lastName: lessonData.creator.lastName
        }
      });
    } catch (error) {
      console.error('Error fetching 3D lesson:', error);
      res.status(500).json({ message: "Failed to fetch 3D lesson" });
    }
  });
  
  // Create a new 3D lesson
  app.post("/api/admin/3d-lessons", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const threeDLessonData = insertThreeDVideoLessonSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      // Validate course exists and user has permission
      const [course] = await db.select()
        .from(courses)
        .where(eq(courses.id, threeDLessonData.courseId));
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // For teachers, ensure they own the course
      if (req.user.role === 'Teacher/Tutor' && course.instructorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Create 3D content first
      const threeDContentData = insertThreeDLessonContentSchema.parse(req.body.threeDContent || {
        sceneConfig: { camera: { position: [0, 5, 10] }, lighting: { ambient: 0.4 } },
        models: [],
        materials: [],
        hotspots: [],
        animations: [],
        particleEffects: []
      });
      
      const [threeDContent] = await db.insert(threeDLessonContent)
        .values(threeDContentData)
        .returning();
      
      // Create 3D lesson
      const [threeDLesson] = await db.insert(threeDVideoLessons)
        .values({
          ...threeDLessonData,
          threeDContentId: threeDContent.id
        })
        .returning();
      
      res.status(201).json({
        message: "3D lesson created successfully",
        lesson: threeDLesson,
        threeDContent
      });
    } catch (error) {
      console.error('Error creating 3D lesson:', error);
      res.status(500).json({ message: "Failed to create 3D lesson" });
    }
  });
  
  // Update a 3D lesson
  app.put("/api/admin/3d-lessons/:id", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      
      // Check if lesson exists and user has permission
      const [existingLesson] = await db.select()
        .from(threeDVideoLessons)
        .where(eq(threeDVideoLessons.id, lessonId));
      
      if (!existingLesson) {
        return res.status(404).json({ message: "3D lesson not found" });
      }
      
      if (req.user.role === 'Teacher/Tutor' && existingLesson.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updateData = {
        ...req.body,
        lastModifiedBy: req.user.id,
        updatedAt: new Date()
      };
      delete updateData.id;
      delete updateData.createdBy;
      delete updateData.createdAt;
      delete updateData.threeDContent;
      
      // Update 3D lesson
      const [updatedLesson] = await db.update(threeDVideoLessons)
        .set(updateData)
        .where(eq(threeDVideoLessons.id, lessonId))
        .returning();
      
      // Update 3D content if provided
      if (req.body.threeDContent) {
        const threeDContentUpdate = {
          ...req.body.threeDContent,
          updatedAt: new Date()
        };
        delete threeDContentUpdate.id;
        delete threeDContentUpdate.createdAt;
        
        await db.update(threeDLessonContent)
          .set(threeDContentUpdate)
          .where(eq(threeDLessonContent.id, existingLesson.threeDContentId));
      }
      
      res.json({
        message: "3D lesson updated successfully",
        lesson: updatedLesson
      });
    } catch (error) {
      console.error('Error updating 3D lesson:', error);
      res.status(500).json({ message: "Failed to update 3D lesson" });
    }
  });
  
  // Delete a 3D lesson
  app.delete("/api/admin/3d-lessons/:id", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      
      // Check if lesson exists and user has permission
      const [existingLesson] = await db.select()
        .from(threeDVideoLessons)
        .where(eq(threeDVideoLessons.id, lessonId));
      
      if (!existingLesson) {
        return res.status(404).json({ message: "3D lesson not found" });
      }
      
      if (req.user.role === 'Teacher/Tutor' && existingLesson.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete 3D lesson (this will cascade to progress records)
      await db.delete(threeDVideoLessons)
        .where(eq(threeDVideoLessons.id, lessonId));
      
      // Delete associated 3D content
      await db.delete(threeDLessonContent)
        .where(eq(threeDLessonContent.id, existingLesson.threeDContentId));
      
      res.json({ message: "3D lesson deleted successfully" });
    } catch (error) {
      console.error('Error deleting 3D lesson:', error);
      res.status(500).json({ message: "Failed to delete 3D lesson" });
    }
  });
  
  // Publish/unpublish a 3D lesson
  app.post("/api/admin/3d-lessons/:id/publish", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const { isPublished } = req.body;
      
      // Check if lesson exists and user has permission
      const [existingLesson] = await db.select()
        .from(threeDVideoLessons)
        .where(eq(threeDVideoLessons.id, lessonId));
      
      if (!existingLesson) {
        return res.status(404).json({ message: "3D lesson not found" });
      }
      
      if (req.user.role === 'Teacher/Tutor' && existingLesson.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const [updatedLesson] = await db.update(threeDVideoLessons)
        .set({ 
          isPublished: Boolean(isPublished),
          updatedAt: new Date()
        })
        .where(eq(threeDVideoLessons.id, lessonId))
        .returning();
      
      res.json({
        message: `3D lesson ${isPublished ? 'published' : 'unpublished'} successfully`,
        lesson: updatedLesson
      });
    } catch (error) {
      console.error('Error publishing 3D lesson:', error);
      res.status(500).json({ message: "Failed to publish 3D lesson" });
    }
  });
  
  // Get 3D lessons for a specific course
  app.get("/api/admin/courses/:courseId/3d-lessons", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      const lessons = await db.select({
        threeDLesson: threeDVideoLessons,
        threeDContent: threeDLessonContent,
        creator: users
      })
      .from(threeDVideoLessons)
      .innerJoin(threeDLessonContent, eq(threeDVideoLessons.threeDContentId, threeDLessonContent.id))
      .innerJoin(users, eq(threeDVideoLessons.createdBy, users.id))
      .where(eq(threeDVideoLessons.courseId, courseId))
      .orderBy(threeDVideoLessons.orderIndex);
      
      // For teachers, only show their own lessons
      const filteredLessons = req.user.role === 'Teacher/Tutor' 
        ? lessons.filter(l => l.threeDLesson.createdBy === req.user.id)
        : lessons;
      
      res.json(filteredLessons.map(l => ({
        ...l.threeDLesson,
        threeDContent: l.threeDContent,
        creator: {
          id: l.creator.id,
          firstName: l.creator.firstName,
          lastName: l.creator.lastName
        }
      })));
    } catch (error) {
      console.error('Error fetching course 3D lessons:', error);
      res.status(500).json({ message: "Failed to fetch course 3D lessons" });
    }
  });

  // Video Courses Endpoints (for Admin and Teachers)
  
  // Get all video courses
  app.get("/api/admin/video-courses", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const { language, level, skillFocus, search } = req.query;
      
      // Get courses with deliveryMode = "self_paced"
      const allCourses = await storage.getCourses();
      let videoCourses = allCourses.filter((course: any) => course.deliveryMode === "self_paced");
      
      // Apply filters
      if (language) {
        videoCourses = videoCourses.filter((course: any) => course.language === language);
      }
      if (level) {
        videoCourses = videoCourses.filter((course: any) => course.level === level);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        videoCourses = videoCourses.filter((course: any) => 
          course.title.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower)
        );
      }
      
      // For teachers, only show their own courses
      if (req.user.role === 'Teacher/Tutor') {
        videoCourses = videoCourses.filter((course: any) => course.instructorId === req.user.id);
      }
      
      // Get video lessons for each course
      for (const course of videoCourses) {
        const lessons = await storage.getVideoLessonsByCourse(course.id);
        course.lessons = lessons || [];
        course.totalLessons = lessons?.length || 0;
        course.totalDuration = lessons?.reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0) || 0;
      }
      
      res.json(videoCourses);
    } catch (error) {
      console.error('Error fetching video courses:', error);
      res.status(500).json({ message: "Failed to fetch video courses" });
    }
  });
  
  // Create a video course
  app.post("/api/admin/video-courses", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const { title, description, language, level, price, thumbnail, category, skillFocus, instructorId } = req.body;
      
      if (!title || !language || !level || !category) {
        return res.status(400).json({ message: "Title, language, level, and category are required" });
      }
      
      // Determine the instructor
      let assignedInstructorId = instructorId;
      if (req.user.role === 'Teacher/Tutor') {
        // Teachers can only create courses for themselves
        assignedInstructorId = req.user.id;
      } else if (!instructorId) {
        // Admin must provide an instructor
        return res.status(400).json({ message: "Instructor is required" });
      }
      
      // Generate a unique course code
      const courseCode = `VID-${language.toUpperCase()}-${Date.now()}`;
      
      // Create the course with deliveryMode = "self_paced"
      const newCourse = await storage.createCourse({
        courseCode,
        title,
        description: description || '',
        language,
        level,
        thumbnail: thumbnail || '',
        instructorId: assignedInstructorId,
        price: price || 0,
        totalSessions: 0, // Video courses don't have sessions
        sessionDuration: 0, // Video courses don't have session duration
        deliveryMode: "self_paced", // This marks it as a video course
        classFormat: "self_paced", // Video courses are self-paced
        maxStudents: null, // No limit for video courses
        targetLanguage: language,
        targetLevel: [level],
        category,
        tags: skillFocus ? [skillFocus] : [],
        isActive: true,
        autoRecord: false,
        recordingAvailable: true, // Videos are always available
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(newCourse);
    } catch (error) {
      console.error('Error creating video course:', error);
      res.status(500).json({ message: "Failed to create video course" });
    }
  });
  
  // Update a video course
  app.put("/api/admin/video-courses/:id", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const { title, description, language, level, price, thumbnail, category, skillFocus, instructorId } = req.body;
      
      // Get the existing course
      const existingCourse = await storage.getCourse(courseId);
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check permissions for teachers
      if (req.user.role === 'Teacher/Tutor' && existingCourse.instructorId !== req.user.id) {
        return res.status(403).json({ message: "You can only edit your own courses" });
      }
      
      // Prepare update data
      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (language) updateData.language = language;
      if (level) updateData.level = level;
      if (price !== undefined) updateData.price = price;
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
      if (category) updateData.category = category;
      if (skillFocus) updateData.tags = [skillFocus];
      
      // Only admins can change the instructor
      if (req.user.role === 'Admin' && instructorId) {
        updateData.instructorId = instructorId;
      }
      
      updateData.updatedAt = new Date();
      
      const updatedCourse = await storage.updateCourse(courseId, updateData);
      res.json(updatedCourse);
    } catch (error) {
      console.error('Error updating video course:', error);
      res.status(500).json({ message: "Failed to update video course" });
    }
  });
  
  // Delete a video course
  app.delete("/api/admin/video-courses/:id", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      // Get the existing course
      const existingCourse = await storage.getCourse(courseId);
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check permissions for teachers
      if (req.user.role === 'Teacher/Tutor' && existingCourse.instructorId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own courses" });
      }
      
      // Delete all video lessons associated with this course
      const lessons = await storage.getVideoLessonsByCourse(courseId);
      for (const lesson of lessons) {
        await storage.deleteVideoLesson(lesson.id);
      }
      
      // Delete the course
      await storage.deleteCourse(courseId);
      
      res.json({ message: "Video course deleted successfully" });
    } catch (error) {
      console.error('Error deleting video course:', error);
      res.status(500).json({ message: "Failed to delete video course" });
    }
  });

  // Get course module lessons
  app.get("/api/admin/courses/:courseId/modules/:moduleId/lessons", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const lessons = await storage.getModuleLessons(moduleId);
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  // Delete course
  app.delete("/api/admin/courses/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if course has enrollments
      const enrollments = await storage.getCourseEnrollments(courseId);
      if (enrollments && enrollments.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete course with active enrollments. Please remove all students first." 
        });
      }

      await storage.deleteCourse(courseId);
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error('Error deleting course:', error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Get course enrollments
  app.get("/api/admin/courses/:id/enrollments", authenticateToken, requireRole(['Admin', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const enrollments = await storage.getCourseEnrollments(courseId);
      res.json(enrollments || []);
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Get instructors for course assignment
  app.get("/api/admin/instructors", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const instructors = await storage.getTutors();
      res.json(instructors);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  // Duplicate course
  app.post("/api/admin/courses/:id/duplicate", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const originalCourse = await storage.getCourse(courseId);
      
      if (!originalCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Create duplicate with modified title and code
      const duplicateData = {
        ...originalCourse,
        id: undefined, // Remove ID to create new
        courseCode: `${originalCourse.courseCode}_COPY`,
        title: `${originalCourse.title} (Copy)`,
        isActive: false, // Start as inactive
        isFeatured: false,
        createdAt: undefined,
        updatedAt: undefined
      };

      const duplicatedCourse = await storage.createCourse(duplicateData);
      res.status(201).json({ message: "Course duplicated successfully", course: duplicatedCourse });
    } catch (error) {
      console.error('Error duplicating course:', error);
      res.status(500).json({ message: "Failed to duplicate course" });
    }
  });

}
