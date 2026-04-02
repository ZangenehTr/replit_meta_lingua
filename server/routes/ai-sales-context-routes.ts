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


export async function setupAISalesAgentContextRoutes(app: any, context: RouteContext): Promise<void> {
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

  // AI Sales Agent Routes (24/7 Telegram/WhatsApp Bot)
  registerAISalesAgentRoutes(app);
  
  // LinguaQuest Audio Generation Routes
  app.use('/api/linguaquest/audio', linguaquestAudioRoutes);
  console.log('✅ LinguaQuest Audio Generation routes registered successfully');
  
  setupBookEcommerceRoutes(app);
  console.log('✅ Book E-Commerce routes registered successfully');
  
  setupContentBankRoutes(app);
  console.log('✅ Content Bank routes registered successfully');
  
  console.log('✅ CMS routes registered via index.ts (consolidated)');
  
  console.log('✅ CallerN Roadmap Template & Flow routes registered successfully');
  console.log('✅ Exam-focused roadmap routes registered successfully');
  console.log('✅ AI Study Partner routes registered successfully');
  console.log('✅ Global Lexi routes registered successfully');

  // Import and register Sample Courses routes
  const { sampleCoursesRoutes } = await import('./sample-courses-routes');
  app.use('/api', sampleCoursesRoutes);
  console.log('✅ Sample Courses routes registered successfully');

  // Setup Phase 2 AI routes (Persian NLP, Real-time Processing, Knowledge RAG)
  const { registerPhase2AIRoutes } = await import('../ai-phase2-routes');
  registerPhase2AIRoutes(app);

  // Multi-gateway payment routes (Zarinpal, IDPay, Zibal callbacks + admin config)
  const { registerPaymentGatewayRoutes } = await import('../payment/payment-gateway-routes');
  registerPaymentGatewayRoutes(app, authenticateToken, requireRole);
  console.log('✅ Multi-gateway payment routes registered (Zarinpal, IDPay, Zibal)');


  // ===== STUDENT ENROLLMENT STATUS API =====
  
  // Get student enrollment status - determines dashboard experience
  app.get("/api/student/enrollment-status", authenticateToken, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      
      // Only allow students to access this endpoint
      if (req.user.role !== 'Student') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Import placementTestSessions (not in top-level imports)
      const { placementTestSessions } = await import("@shared/schema");
      
      // Get student's ACTIVE enrollments - using simple select without joins
      const studentEnrollments = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.userId, studentId),
          eq(enrollments.status, 'active')
        ));
      
      // Check if student has completed placement test
      const placementTests = await db
        .select()
        .from(placementTestSessions)
        .where(and(
          eq(placementTestSessions.userId, studentId),
          eq(placementTestSessions.status, 'completed')
        ))
        .limit(1);
      
      // Get user details for wallet/credits
      const [userDetails] = await db
        .select({
          walletBalance: users.walletBalance,
          totalCredits: users.totalCredits,
          memberTier: users.memberTier
        })
        .from(users)
        .where(eq(users.id, studentId))
        .limit(1);
      
      const enrollmentStatus = {
        isEnrolled: studentEnrollments.length > 0,
        hasActiveEnrollments: studentEnrollments.length > 0,
        totalEnrollments: studentEnrollments.length,
        activeCourses: studentEnrollments.map((enrollment: any) => ({
          id: enrollment.courseId,
          title: 'Course ' + enrollment.courseId,
          level: 'beginner',
          progress: enrollment.progress || 0
        })),
        hasCompletedPlacementTest: placementTests.length > 0,
        membershipTier: userDetails?.memberTier || 'bronze',
        walletBalance: userDetails?.walletBalance || 0,
        totalCredits: userDetails?.totalCredits || 0
      };
      
      res.json(enrollmentStatus);
    } catch (error) {
      console.error('Error fetching enrollment status:', error);
      res.status(500).json({ message: "Failed to fetch enrollment status" });
    }
  });
  
  // Get teacher directory for non-enrolled students
  app.get("/api/teachers/directory", async (req: any, res) => {
    try {
      // Use raw SQL query to avoid Drizzle schema issues
      const result = await db.execute(sql`
        SELECT id, first_name, last_name, email, profile_image, is_active 
        FROM users 
        WHERE role = 'teacher' 
        AND is_active = true
      `);

      const teachers = result.rows.map((teacher: any) => ({
        id: teacher.id,
        firstName: teacher.first_name || 'Teacher',
        lastName: teacher.last_name || '',
        email: teacher.email,
        profileImage: teacher.profile_image || '/images/default-avatar.png',
        specializations: ['General English', 'Conversation'],
        experience: '3+ years',
        rating: 4.5 + Math.random() * 0.5,
        totalStudents: Math.floor(Math.random() * 100) + 20,
        languages: ['English', 'Persian'],
        bio: 'Experienced language instructor',
        availability: ['Monday', 'Wednesday', 'Friday']
      }));

      res.json(teachers);
    } catch (error) {
      console.error('Error fetching teacher directory:', error);
      res.status(500).json({ message: "Failed to fetch teacher directory" });
    }
  });
  
  // Get course catalog for non-enrolled students
  app.get("/api/courses/catalog", async (req: any, res) => {
    try {
      const { courses, users } = await import("@shared/schema");
      
      const courseCatalog = await db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          level: courses.level,
          price: courses.price,
          thumbnail: courses.thumbnail,
          deliveryMode: courses.deliveryMode,
          classFormat: courses.classFormat,
          totalSessions: courses.totalSessions,
          sessionDuration: courses.sessionDuration,
          instructorId: courses.instructorId,
          rating: courses.rating
        })
        .from(courses)
        .limit(20);
      
      // Get instructor names
      const instructorIds = [...new Set(courseCatalog.map(c => c.instructorId).filter(Boolean))];
      const instructors = instructorIds.length > 0 ? await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(inArray(users.id, instructorIds)) : [];
      
      const instructorMap = new Map(instructors.map(i => [i.id, i]));
      
      const formattedCourses = courseCatalog.map(course => {
        const instructor = instructorMap.get(course.instructorId);
        return {
          ...course,
          duration: `${course.totalSessions} sessions`,
          features: ['Certificate', 'Live Classes', 'Practice Materials'],
          instructorName: instructor ? `${instructor.firstName} ${instructor.lastName}` : 'Expert Instructor',
          rating: course.rating ? parseFloat(course.rating) : 4.5,
          studentsCount: Math.floor(Math.random() * 200) + 50
        };
      });
      
      res.json(formattedCourses);
    } catch (error) {
      console.error('Error fetching course catalog:', error);
      res.status(500).json({ message: "Failed to fetch course catalog" });
    }
  });
  
  // Book trial lesson for non-enrolled students
  app.post("/api/student/book-trial", authenticateToken, async (req: any, res) => {
    try {
      const { teacherId, date, time, studentDetails, lessonType } = req.body;
      const studentId = req.user.id;
      
      // Create scheduled timestamp from date and time
      const scheduledAt = new Date(`${date}T${time}:00`);
      
      // Validate required fields
      if (!teacherId || !date || !time) {
        return res.status(400).json({ message: "Missing required fields: teacherId, date, time" });
      }
      
      // Create trial lesson in database
      const [trialLesson] = await db.insert(trialLessons).values({
        studentId,
        teacherId: parseInt(teacherId),
        lessonType: lessonType || 'general_trial',
        scheduledAt,
        status: 'scheduled',
        notes: studentDetails ? JSON.stringify(studentDetails) : null
      }).returning();
      
      res.json({ 
        message: "Trial lesson booked successfully",
        bookingId: trialLesson.id,
        booking: trialLesson
      });
    } catch (error) {
      console.error('Error booking trial lesson:', error);
      res.status(500).json({ message: "Failed to book trial lesson" });
    }
  });

  // Get trial bookings for current student
  app.get("/api/student/trial-bookings", authenticateToken, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      
      const bookings = await db.select().from(trialLessons)
        .where(eq(trialLessons.studentId, studentId))
        .orderBy(desc(trialLessons.createdAt));
      
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching trial bookings:', error);
      res.status(500).json({ message: "Failed to fetch trial bookings" });
    }
  });
  
  // Submit contact inquiry
  app.post("/api/contact/inquiry", async (req: any, res) => {
    try {
      const inquiryData = req.body;
      
      // Store contact inquiry (you might want to create a contact_inquiries table)
      console.log('Contact inquiry received:', inquiryData);
      
      res.json({ 
        message: "Contact inquiry submitted successfully",
        inquiryId: Date.now() // Mock inquiry ID
      });
    } catch (error) {
      console.error('Error submitting contact inquiry:', error);
      res.status(500).json({ message: "Failed to submit contact inquiry" });
    }
  });
  
  // Get upcoming sessions for enrolled students
  app.get("/api/student/upcoming-sessions", authenticateToken, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      
      // Only allow students to access this endpoint
      if (req.user.role !== 'Student') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get real upcoming sessions for the student
      const now = new Date();
      const studentEnrollments = await storage.getEnrollmentsByUserId(studentId);
      
      const upcomingSessions = await Promise.all(
        studentEnrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          const sessions = await storage.getSessionsByCourseId(enrollment.courseId);
          
          // Filter for future sessions
          return sessions
            .filter(s => new Date(s.sessionDate) > now)
            .map(s => ({
              id: s.id,
              courseTitle: course?.title || 'Unknown Course',
              teacherName: 'Teacher', // Can be enhanced by joining with users table
              startTime: s.sessionDate,
              duration: s.duration || 60,
              type: s.isOnline ? 'online' : 'in-person',
              location: s.location,
              joinUrl: s.isOnline ? `/callern/video/session-${s.id}` : undefined
            }));
        })
      ).then(results => results.flat());
      
      res.json(upcomingSessions);
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      res.status(500).json({ message: "Failed to fetch upcoming sessions" });
    }
  });
  
  // Get learning materials for enrolled students
  app.get("/api/student/materials", authenticateToken, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      
      // Only allow students to access this endpoint
      if (req.user.role !== 'Student') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get real learning materials from enrollments and homework/content library
      const studentEnrollments = await storage.getEnrollmentsByUserId(studentId);
      
      const materials = await Promise.all(
        studentEnrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          const homework = await storage.getHomeworkForCourse(enrollment.courseId);
          
          return homework.map(hw => ({
            id: hw.id,
            title: hw.title,
            type: hw.attachmentUrl?.includes('.pdf') ? 'pdf' : hw.attachmentUrl?.includes('.mp3') ? 'audio' : 'document',
            courseTitle: course?.title || 'Unknown Course',
            size: 'N/A', // Can be enhanced with file metadata
            downloadUrl: hw.attachmentUrl || `/api/materials/download/${hw.id}`
          }));
        })
      ).then(results => results.flat());
      
      res.json(materials);
    } catch (error) {
      console.error('Error fetching learning materials:', error);
      res.status(500).json({ message: "Failed to fetch learning materials" });
    }
  });

  // ===== HOMEWORK/ASSIGNMENTS API ENDPOINTS =====
  // Note: Assignments are stored in the "homework" table
  // Routes use "assignments" terminology, homework routes deprecated
  
  // Get homework for a student
  app.get("/api/student/homework", authenticateToken, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      const { status } = req.query;
      
      const { homework, courses, users } = await import("@shared/schema");
      
      // Get homework for the student - select updated schema columns
      const homeworkList = await db
        .select({
          id: homework.id,
          studentId: homework.studentId,
          teacherId: homework.teacherId,
          courseId: homework.courseId,
          title: homework.title,
          description: homework.description,
          instructions: homework.instructions,
          dueDate: homework.dueDate,
          status: homework.status,
          submission: homework.submission,
          submissionUrl: homework.submissionUrl,
          submissionFiles: homework.submissionFiles,
          grade: homework.grade,
          maxGrade: homework.maxGrade,
          feedback: homework.feedback,
          difficulty: homework.difficulty,
          estimatedTime: homework.estimatedTime,
          xpReward: homework.xpReward,
          allowLateSubmission: homework.allowLateSubmission,
          latePenaltyPercent: homework.latePenaltyPercent,
          assignedAt: homework.assignedAt,
          submittedAt: homework.submittedAt,
          attachments: homework.attachments
        })
        .from(homework)
        .where(eq(homework.studentId, studentId));
      
      // Get teacher and course info separately
      const teacherIds = [...new Set(homeworkList.map(h => h.teacherId))];
      const courseIds = [...new Set(homeworkList.map(h => h.courseId).filter(Boolean))];
      
      const teachers = teacherIds.length > 0 ? await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, teacherIds[0])) : [];
      
      const coursesList = courseIds.length > 0 ? await db
        .select({ id: courses.id, title: courses.title })
        .from(courses)
        .where(eq(courses.id, courseIds[0])) : [];
      
      // Map teacher and course info
      const teacherMap = new Map(teachers.map(t => [t.id, t]));
      const courseMap = new Map(coursesList.map(c => [c.id, c]));
      
      // Filter by status if provided
      const filteredHomework = status && status !== 'all' 
        ? homeworkList.filter(hw => hw.status === status)
        : homeworkList;
      
      // Format the response using actual data from schema
      const formattedHomework = filteredHomework.map(hw => {
        const teacher = teacherMap.get(hw.teacherId);
        const course = courseMap.get(hw.courseId);
        
        return {
          id: hw.id,
          title: hw.title,
          description: hw.description,
          instructions: hw.instructions || hw.description,
          courseTitle: course?.title || 'General',
          className: 'Class A', // TODO: Add class relationship
          teacherName: teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() : 'Teacher',
          assignedDate: hw.assignedAt,
          dueDate: hw.dueDate,
          status: hw.status || 'pending',
          grade: hw.grade,
          maxGrade: hw.maxGrade || 100,
          feedback: hw.feedback,
          attachments: hw.attachments || [],
          submissionUrl: hw.submissionUrl || hw.submission, // Fallback to old submission field
          submissionFiles: hw.submissionFiles || [],
          difficulty: hw.difficulty || 'medium',
          estimatedTime: hw.estimatedTime || 30,
          xpReward: hw.xpReward || 50,
          submittedAt: hw.submittedAt,
          allowLateSubmission: hw.allowLateSubmission ?? true,
          latePenaltyPercent: hw.latePenaltyPercent || 10
        };
      });
      
      res.json(formattedHomework);
    } catch (error) {
      console.error('Error fetching homework:', error);
      res.status(500).json({ message: "Failed to fetch homework" });
    }
  });
  
  // Submit homework
  app.post("/api/student/homework/:id/submit", authenticateToken, upload.single('file'), async (req: any, res) => {
    try {
      const studentId = req.user.id;
      const homeworkId = parseInt(req.params.id);
      const { submission } = req.body;
      const file = req.file;
      
      const { homework, users } = await import("@shared/schema");
      
      // Check if homework exists and belongs to student
      const [existingHomework] = await db
        .select()
        .from(homework)
        .where(eq(homework.id, homeworkId))
        .limit(1);
      
      if (!existingHomework) {
        return res.status(404).json({ message: "Homework not found" });
      }
      
      if (existingHomework.studentId !== studentId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Check if late submission is allowed
      const now = new Date();
      const dueDate = existingHomework.dueDate ? new Date(existingHomework.dueDate) : null;
      let status = 'submitted';
      
      if (dueDate && now > dueDate) {
        if (!existingHomework.allowLateSubmission) {
          return res.status(400).json({ message: "Late submission not allowed" });
        }
        status = 'late';
      }
      
      // Handle file upload
      let submissionUrl = existingHomework.submissionUrl;
      let submissionFiles = existingHomework.submissionFiles || [];
      
      if (file) {
        submissionUrl = `/uploads/homework/${file.filename}`;
        submissionFiles = [...submissionFiles, file.filename];
      }
      
      // Update homework
      await db
        .update(homework)
        .set({
          submission: submission || existingHomework.submission,
          submissionUrl,
          submissionFiles,
          status,
          submittedAt: now,
          updatedAt: now
        })
        .where(eq(homework.id, homeworkId));
      
      // Award XP for submission
      if (existingHomework.xpReward && existingHomework.status === 'pending') {
        const [student] = await db
          .select()
          .from(users)
          .where(eq(users.id, studentId))
          .limit(1);
        
        if (student) {
          const newXp = (student.totalCredits || 0) + 50; // Default XP award
          await db
            .update(users)
            .set({ totalCredits: newXp })
            .where(eq(users.id, studentId));
        }
      }
      
      res.json({ 
        message: "Homework submitted successfully", 
        status,
        xpAwarded: 50 // Default XP
      });
    } catch (error) {
      console.error('Error submitting homework:', error);
      res.status(500).json({ message: "Failed to submit homework" });
    }
  });
  
  // Download homework attachment
  app.get("/api/homework/:id/attachment/:filename", authenticateToken, async (req: any, res) => {
    try {
      const { id, filename } = req.params;
      const studentId = req.user.userId;
      
      const { homework } = await import("@shared/schema");
      
      // Verify student has access to this homework
      const [hw] = await db
        .select()
        .from(homework)
        .where(eq(homework.id, parseInt(id)))
        .limit(1);
      
      if (!hw || hw.studentId !== studentId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const filePath = path.join(__dirname, 'uploads', 'homework', filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.download(filePath);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({ message: "Failed to download attachment" });
    }
  });
  
  // Teacher: Create homework assignment
  app.post("/api/teacher/homework", authenticateToken, requireRole(['Teacher/Tutor', 'Admin']), async (req: any, res) => {
    try {
      const teacherId = req.user.userId;
      const {
        studentIds,
        courseId,
        classId,
        title,
        description,
        instructions,
        dueDate,
        difficulty,
        estimatedTime,
        xpReward,
        attachments,
        rubric,
        tags,
        allowLateSubmission,
        latePenaltyPercent
      } = req.body;
      
      const { homework } = await import("@shared/schema");
      
      // Create homework for each student
      const homeworkEntries = studentIds.map((studentId: number) => ({
        studentId,
        teacherId,
        courseId,
        classId,
        title,
        description,
        instructions,
        dueDate: dueDate ? new Date(dueDate) : null,
        difficulty: difficulty || 'medium',
        estimatedTime: estimatedTime || 30,
        xpReward: xpReward || 50,
        attachments: attachments || [],
        rubric,
        tags: tags || [],
        allowLateSubmission: allowLateSubmission !== false,
        latePenaltyPercent: latePenaltyPercent || 10,
        status: 'pending',
        maxGrade: 100
      }));
      
      await db.insert(homework).values(homeworkEntries);
      
      res.json({ message: "Homework assigned successfully" });
    } catch (error) {
      console.error('Error creating homework:', error);
      res.status(500).json({ message: "Failed to create homework" });
    }
  });
  
  // Teacher: Grade homework
  app.put("/api/teacher/homework/:id/grade", authenticateToken, requireRole(['Teacher/Tutor', 'Admin']), async (req: any, res) => {
    try {
      const homeworkId = parseInt(req.params.id);
      const { grade, feedback } = req.body;
      
      const { homework, users } = await import("@shared/schema");
      
      // Update homework with grade
      await db
        .update(homework)
        .set({
          grade,
          feedback,
          status: 'graded',
          updatedAt: new Date()
        })
        .where(eq(homework.id, homeworkId));
      
      // Get homework details for XP calculation
      const [hw] = await db
        .select()
        .from(homework)
        .where(eq(homework.id, homeworkId))
        .limit(1);
      
      if (hw && hw.xpReward) {
        // Award bonus XP based on grade
        const gradePercent = (grade / (hw.maxGrade || 100)) * 100;
        let bonusXp = 0;
        
        if (gradePercent >= 90) bonusXp = Math.floor(hw.xpReward * 0.5); // 50% bonus
        else if (gradePercent >= 80) bonusXp = Math.floor(hw.xpReward * 0.25); // 25% bonus
        else if (gradePercent >= 70) bonusXp = Math.floor(hw.xpReward * 0.1); // 10% bonus
        
        if (bonusXp > 0) {
          const [student] = await db
            .select()
            .from(users)
            .where(eq(users.id, hw.studentId))
            .limit(1);
          
          if (student) {
            const newXp = (student.totalCredits || 0) + bonusXp;
            await db
              .update(users)
              .set({ totalCredits: newXp })
              .where(eq(users.id, hw.studentId));
          }
        }
      }
      
      res.json({ message: "Homework graded successfully" });
    } catch (error) {
      console.error('Error grading homework:', error);
      res.status(500).json({ message: "Failed to grade homework" });
    }
  });
  
  // Get homework statistics for student dashboard
  app.get("/api/student/homework/stats", authenticateToken, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      
      const { homework } = await import("@shared/schema");
      
      // Select only the columns we need for stats calculation
      const allHomework = await db
        .select({
          id: homework.id,
          status: homework.status,
          grade: homework.grade,
          dueDate: homework.dueDate,
          xpReward: homework.xpReward
        })
        .from(homework)
        .where(eq(homework.studentId, studentId));
      
      const gradedHomework = allHomework.filter(h => h.status === 'graded' && h.grade !== null);
      const averageGrade = gradedHomework.length > 0 
        ? gradedHomework.reduce((acc, h) => acc + (h.grade || 0), 0) / gradedHomework.length 
        : 0;
        
      const totalXpEarned = gradedHomework.reduce((acc, h) => acc + (h.xpReward || 0), 0);
      
      const stats = {
        total: allHomework.length,
        pending: allHomework.filter(h => h.status === 'pending').length,
        submitted: allHomework.filter(h => h.status === 'submitted' || h.status === 'late').length,
        graded: gradedHomework.length,
        averageGrade: Math.round(averageGrade * 100) / 100,
        totalXpEarned,
        upcomingDeadlines: allHomework
          .filter(h => h.status === 'pending' && h.dueDate && new Date(h.dueDate) > new Date())
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
          .slice(0, 3)
          .map(h => ({
            id: h.id,
            dueDate: h.dueDate
          }))
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching homework stats:', error);
      res.status(500).json({ message: "Failed to fetch homework stats" });
    }
  });

  // ===== STUDENT TESTS & ASSESSMENTS =====
  
  // Get available tests for student
  app.get("/api/student/tests", authenticateToken, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      const { filter = 'all' } = req.query;
      
      const unifiedStorage = req.app.get('unifiedTestingStorage');
      if (!unifiedStorage) {
        return res.status(500).json({ message: "Testing system not initialized" });
      }
      
      // Get all test sessions for this student
      const allSessions = await unifiedStorage.getStudentSessions(studentId);
      
      // Filter based on query parameter
      let filteredSessions = allSessions;
      if (filter === 'upcoming') {
        filteredSessions = allSessions.filter((s: any) => s.status === 'not_started' || s.status === 'in_progress');
      } else if (filter === 'completed') {
        filteredSessions = allSessions.filter((s: any) => s.status === 'completed');
      }
      
      res.json(filteredSessions);
    } catch (error) {
      console.error('Error fetching student tests:', error);
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });
  
  // Start a test
  app.post("/api/student/tests/:testId/start", authenticateToken, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      const testId = parseInt(req.params.testId);
      
      const unifiedStorage = req.app.get('unifiedTestingStorage');
      if (!unifiedStorage) {
        return res.status(500).json({ message: "Testing system not initialized" });
      }
      
      // Update session status to in_progress
      const session = await unifiedStorage.getSession(testId);
      if (!session || session.studentId !== studentId) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      await unifiedStorage.updateSessionStatus(testId, 'in_progress');
      
      res.json({ success: true, sessionId: testId });
    } catch (error) {
      console.error('Error starting test:', error);
      res.status(500).json({ message: "Failed to start test" });
    }
  });
  
  // Submit an answer
  app.post("/api/student/tests/:testId/answer", authenticateToken, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      const testId = parseInt(req.params.testId);
      const { questionId, answer } = req.body;
      
      const unifiedStorage = req.app.get('unifiedTestingStorage');
      if (!unifiedStorage) {
        return res.status(500).json({ message: "Testing system not initialized" });
      }
      
      // Verify session belongs to student
      const session = await unifiedStorage.getSession(testId);
      if (!session || session.studentId !== studentId) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Save the response
      await unifiedStorage.saveResponse({
        sessionId: testId,
        questionId: questionId,
        answer: answer,
        isCorrect: null, // Will be evaluated later
        pointsEarned: 0
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error submitting answer:', error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });
  
  // Finish a test
  app.post("/api/student/tests/:testId/finish", authenticateToken, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      const testId = parseInt(req.params.testId);
      
      const unifiedStorage = req.app.get('unifiedTestingStorage');
      if (!unifiedStorage) {
        return res.status(500).json({ message: "Testing system not initialized" });
      }
      
      // Verify session belongs to student
      const session = await unifiedStorage.getSession(testId);
      if (!session || session.studentId !== studentId) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Update session status to completed
      await unifiedStorage.updateSessionStatus(testId, 'completed');
      
      // Calculate score
      const responses = await unifiedStorage.getSessionResponses(testId);
      const totalPoints = responses.reduce((sum: number, r: any) => sum + (r.pointsEarned || 0), 0);
      
      res.json({ 
        success: true, 
        score: totalPoints,
        totalPoints: session.totalPoints || 100
      });
    } catch (error) {
      console.error('Error finishing test:', error);
      res.status(500).json({ message: "Failed to finish test" });
    }
  });
  
  // ===== ADMIN LEADS =====
  
  // Get admin leads
  app.get("/api/admin/leads", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { leads } = await import("@shared/schema");
      
      const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));
      
      res.json(allLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // ===== ADMIN SCRAPED LEADS BRIDGE =====

  // GET /api/admin/scraped-leads — list scraped leads with optional filters
  app.get("/api/admin/scraped-leads", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { status, platform, minScore, maxScore } = req.query as Record<string, string | undefined>;

      let query = db.select().from(scrapedLeads).$dynamic();

      const conditions: any[] = [];
      if (status && status !== 'all') {
        conditions.push(eq(scrapedLeads.status, status));
      }
      if (platform && platform !== 'all') {
        conditions.push(eq(scrapedLeads.source, platform));
      }
      if (minScore) {
        conditions.push(sql`${scrapedLeads.qualificationScore} >= ${parseInt(minScore, 10)}`);
      }
      if (maxScore) {
        conditions.push(sql`${scrapedLeads.qualificationScore} <= ${parseInt(maxScore, 10)}`);
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const rows = await query.orderBy(desc(scrapedLeads.scrapedAt));
      res.json(rows);
    } catch (error: any) {
      console.error('Error fetching scraped leads:', error);
      res.status(500).json({ message: "Failed to fetch scraped leads" });
    }
  });

  // POST /api/admin/scraped-leads/:id/promote — promote a single scraped lead
  app.post("/api/admin/scraped-leads/:id/promote", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const { promoteScrapedLead } = await import('../services/scraper-crm-bridge');
      const result = await promoteScrapedLead(id);

      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      res.json({ success: true, crmLeadId: result.crmLeadId, duplicate: result.duplicate });
    } catch (error: any) {
      console.error('Error promoting scraped lead:', error);
      res.status(500).json({ message: "Failed to promote scraped lead" });
    }
  });

  // POST /api/admin/scraped-leads/:id/dismiss — dismiss a scraped lead
  app.post("/api/admin/scraped-leads/:id/dismiss", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      await db.update(scrapedLeads).set({ status: 'dismissed' }).where(eq(scrapedLeads.id, id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error dismissing scraped lead:', error);
      res.status(500).json({ message: "Failed to dismiss scraped lead" });
    }
  });

  // POST /api/admin/scraped-leads/bulk-promote — promote multiple scraped leads
  app.post("/api/admin/scraped-leads/bulk-promote", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { ids } = req.body as { ids: number[] };
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "ids array is required" });
      }

      const { promoteScrapedLead } = await import('../services/scraper-crm-bridge');
      const results: Array<{ id: number; success: boolean; crmLeadId?: number; error?: string }> = [];

      for (const id of ids) {
        const r = await promoteScrapedLead(id);
        results.push({ id, success: r.success, crmLeadId: r.crmLeadId, error: r.error });
      }

      const succeeded = results.filter(r => r.success).length;
      res.json({ success: true, promoted: succeeded, total: ids.length, results });
    } catch (error: any) {
      console.error('Error bulk-promoting scraped leads:', error);
      res.status(500).json({ message: "Failed to bulk-promote scraped leads" });
    }
  });

  // TTS (Text-to-Speech) API Routes for pronunciation practice
  
  // Generate speech from text
  app.post("/api/tts/generate", authenticateToken, async (req: any, res) => {
    try {
      const { text, language, speed = 1.0, voice } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }
      
      if (!language) {
        return res.status(400).json({ error: "Language is required" });
      }

      const ttsRequest: TTSRequest = {
        text: text.trim(),
        language: language.toLowerCase(),
        speed,
        voice
      };

      const result = await ttsService.generateSpeech(ttsRequest);
      
      if (result.success) {
        res.json({
          success: true,
          audioUrl: result.audioUrl,
          duration: result.duration,
          message: "Speech generated successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('TTS generation error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate speech" 
      });
    }
  });

  // Generate pronunciation practice audio
  app.post("/api/tts/pronunciation", authenticateToken, async (req: any, res) => {
    try {
      const { text, language, level = 'normal' } = req.body;
      
      if (!text || !language) {
        return res.status(400).json({ error: "Text and language are required" });
      }

      const result = await ttsService.generatePronunciationAudio(text, language, level);
      
      if (result.success) {
        res.json({
          success: true,
          audioUrl: result.audioUrl,
          duration: result.duration,
          level,
          message: `Pronunciation audio generated at ${level} speed`
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Pronunciation TTS error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate pronunciation audio" 
      });
    }
  });

  // Get supported languages
  app.get("/api/tts/languages", authenticateToken, async (req: any, res) => {
    try {
      const languages = ttsService.getSupportedLanguages();
      const languageList = languages.map(code => ({
        code,
        name: ttsService.getLanguageName(code),
        englishName: code === 'fa' ? 'Persian' : code === 'ar' ? 'Arabic' : 'English'
      }));

      res.json({
        success: true,
        languages: languageList,
        total: languages.length
      });
    } catch (error) {
      console.error('TTS languages error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to get supported languages" 
      });
    }
  });

  // Vocabulary pronunciation - for language learning
  app.post("/api/tts/vocabulary", authenticateToken, async (req: any, res) => {
    try {
      const { words, language, level = 'normal' } = req.body;
      
      if (!words || !Array.isArray(words) || words.length === 0) {
        return res.status(400).json({ error: "Words array is required" });
      }
      
      if (!language) {
        return res.status(400).json({ error: "Language is required" });
      }

      const pronunciations = [];
      
      for (const word of words) {
        const result = await ttsService.generatePronunciationAudio(word, language, level);
        pronunciations.push({
          word,
          success: result.success,
          audioUrl: result.success ? result.audioUrl : null,
          duration: result.duration,
          error: result.error
        });
      }

      const successCount = pronunciations.filter(p => p.success).length;
      
      res.json({
        success: true,
        pronunciations,
        total: words.length,
        successful: successCount,
        failed: words.length - successCount,
        message: `Generated pronunciation for ${successCount} out of ${words.length} words`
      });
    } catch (error) {
      console.error('Vocabulary TTS error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate vocabulary pronunciations" 
      });
    }
  });

  // Enhanced TTS Routes following Master Prompt Guidelines
  const { default: ttsRoutes } = await import('./tts-routes.js');
  const { default: ttsPipelineRoutes } = await import('./tts-pipeline-routes.js');
  app.use('/api/tts', ttsRoutes);  // Fixed: Mount directly at /api/tts for frontend compatibility
  app.use('/api/tts-pipeline', ttsPipelineRoutes);
  console.log('✅ Enhanced TTS routes with Master Prompt registered successfully');
  console.log('✅ Advanced TTS Pipeline routes registered successfully');

  // ============================================================================
}
