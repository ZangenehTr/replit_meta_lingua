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


export async function setupCallernTestingManagementRoutes(app: any, context: RouteContext): Promise<void> {
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

  // ========== TESTING SUBSYSTEM ROUTES ==========
  
  // Teacher test routes
  app.get("/api/teacher/tests", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const tests = await storage.getTestsByTeacher(req.user.id);
      res.json(tests);
    } catch (error) {
      console.error('Error fetching teacher tests:', error);
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  app.get("/api/teacher/courses", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      // Get courses where user is the instructor
      const courses = await storage.getTeacherCourses(req.user.id);
      res.json(courses);
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/teacher/tests", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const testData = {
        ...req.body,
        createdBy: req.user.id,
        totalQuestions: 0 // Will be updated when questions are added
      };
      
      const test = await storage.createTest(testData);
      res.status(201).json(test);
    } catch (error) {
      console.error('Error creating test:', error);
      res.status(500).json({ message: "Failed to create test" });
    }
  });

  app.get("/api/teacher/tests/:testId", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const test = await storage.getTestById(parseInt(req.params.testId));
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Ensure teacher owns this test
      if (test.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get questions for the test
      const questions = await storage.getTestQuestions(test.id);
      
      res.json({ ...test, questions });
    } catch (error) {
      console.error('Error fetching test details:', error);
      res.status(500).json({ message: "Failed to fetch test details" });
    }
  });

  app.put("/api/teacher/tests/:testId", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const test = await storage.getTestById(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Ensure teacher owns this test
      if (test.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedTest = await storage.updateTest(testId, req.body);
      res.json(updatedTest);
    } catch (error) {
      console.error('Error updating test:', error);
      res.status(500).json({ message: "Failed to update test" });
    }
  });

  app.delete("/api/teacher/tests/:testId", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const test = await storage.getTestById(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Ensure teacher owns this test
      if (test.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteTest(testId);
      res.json({ message: "Test deleted successfully" });
    } catch (error) {
      console.error('Error deleting test:', error);
      res.status(500).json({ message: "Failed to delete test" });
    }
  });

  // Test questions routes
  app.post("/api/teacher/tests/:testId/questions", authenticateToken, requireRole(['Teacher/Tutor']), audioUpload.single('audio'), async (req: any, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const test = await storage.getTestById(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Ensure teacher owns this test
      if (test.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Parse form data
      let questionData = { ...req.body, testId };
      
      // Handle JSON fields that come as strings from FormData
      if (typeof questionData.options === 'string') {
        try {
          questionData.options = JSON.parse(questionData.options);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
      
      // Add audio file path if uploaded
      if (req.file) {
        questionData.questionAudio = `/uploads/audio/${req.file.filename}`;
      }
      
      const question = await storage.createTestQuestion(questionData);
      
      // Update test's totalQuestions count
      const questions = await storage.getTestQuestions(testId);
      await storage.updateTest(testId, { totalQuestions: questions.length });
      
      res.status(201).json(question);
    } catch (error) {
      console.error('Error creating test question:', error);
      
      // Clean up uploaded file if question creation failed
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up uploaded file:', unlinkError);
        }
      }
      
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.put("/api/teacher/tests/:testId/questions/:questionId", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const questionId = parseInt(req.params.questionId);
      
      const test = await storage.getTestById(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Ensure teacher owns this test
      if (test.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedQuestion = await storage.updateTestQuestion(questionId, req.body);
      res.json(updatedQuestion);
    } catch (error) {
      console.error('Error updating test question:', error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  // Get test questions
  app.get("/api/teacher/tests/:testId/questions", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const test = await storage.getTestById(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Ensure teacher owns this test
      if (test.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const questions = await storage.getTestQuestions(testId);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching test questions:', error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.delete("/api/teacher/tests/:testId/questions/:questionId", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const questionId = parseInt(req.params.questionId);
      
      const test = await storage.getTestById(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Ensure teacher owns this test
      if (test.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteTestQuestion(questionId);
      
      // Update test's totalQuestions count
      const questions = await storage.getTestQuestions(testId);
      await storage.updateTest(testId, { totalQuestions: questions.length });
      
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error('Error deleting test question:', error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Student test routes
  app.get("/api/student/tests/available", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      // Get student's enrolled courses
      const enrollments = await storage.getUserEnrollments(req.user.id);
      const courseIds = enrollments.map(e => e.courseId);
      
      // Get all tests for enrolled courses
      const allTests = [];
      for (const courseId of courseIds) {
        const tests = await storage.getTestsByCourse(courseId);
        allTests.push(...tests.filter(t => t.isActive));
      }
      
      res.json(allTests);
    } catch (error) {
      console.error('Error fetching available tests:', error);
      res.status(500).json({ message: "Failed to fetch available tests" });
    }
  });

  app.post("/api/student/tests/:testId/attempt", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const test = await storage.getTestById(testId);
      
      if (!test || !test.isActive) {
        return res.status(404).json({ message: "Test not found or not available" });
      }
      
      // Check if student has access to this test
      const enrollments = await storage.getUserEnrollments(req.user.id);
      const hasAccess = enrollments.some(e => e.courseId === test.courseId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "You are not enrolled in this course" });
      }
      
      // Check max attempts
      const previousAttempts = await storage.getStudentTestAttempts(req.user.id, testId);
      if (previousAttempts.length >= test.maxAttempts) {
        return res.status(400).json({ 
          message: `Maximum attempts (${test.maxAttempts}) reached for this test` 
        });
      }
      
      // Create new attempt
      const attempt = await storage.createTestAttempt({
        testId,
        studentId: req.user.id,
        startedAt: new Date(),
        status: 'in_progress'
      });
      
      // Get questions for the test
      const questions = await storage.getTestQuestions(testId);
      
      res.json({ 
        attempt,
        questions: questions.map(q => ({
          id: q.id,
          questionType: q.questionType,
          questionText: q.questionText,
          options: q.options,
          points: q.points,
          order: q.order,
          mediaUrl: q.mediaUrl
          // Don't send correctAnswer or explanation
        }))
      });
    } catch (error) {
      console.error('Error starting test attempt:', error);
      res.status(500).json({ message: "Failed to start test attempt" });
    }
  });

  app.post("/api/student/tests/attempts/:attemptId/submit", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const attemptId = parseInt(req.params.attemptId);
      const { answers } = req.body;
      
      const attempt = await storage.getTestAttemptById(attemptId);
      
      if (!attempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }
      
      // Ensure student owns this attempt
      if (attempt.studentId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Save all answers
      for (const answer of answers) {
        await storage.saveTestAnswer({
          attemptId,
          questionId: answer.questionId,
          answerValue: answer.answerValue
        });
      }
      
      // Auto-grade the test
      const test = await storage.getTestById(attempt.testId);
      const questions = await storage.getTestQuestions(attempt.testId);
      let totalScore = 0;
      let maxScore = 0;
      
      for (const question of questions) {
        const studentAnswer = answers.find(a => a.questionId === question.id);
        maxScore += question.points;
        
        if (studentAnswer) {
          let isCorrect = false;
          let pointsEarned = 0;
          
          // Auto-grade based on question type
          switch (question.questionType) {
            case 'multiple_choice':
            case 'true_false':
              isCorrect = studentAnswer.answerValue === question.correctAnswer;
              pointsEarned = isCorrect ? question.points : 0;
              break;
            case 'multiple_select':
              // For multiple select, check if arrays match
              const correctAnswers = JSON.parse(question.correctAnswer || '[]');
              const studentAnswers = JSON.parse(studentAnswer.answerValue || '[]');
              isCorrect = JSON.stringify(correctAnswers.sort()) === JSON.stringify(studentAnswers.sort());
              pointsEarned = isCorrect ? question.points : 0;
              break;
            // Other types need manual grading
            default:
              // Will be graded manually by teacher
              break;
          }
          
          if (question.questionType !== 'essay' && question.questionType !== 'short_answer') {
            await storage.gradeTestAnswer(studentAnswer.id, {
              isCorrect,
              pointsEarned
            });
            totalScore += pointsEarned;
          }
        }
      }
      
      // Calculate percentage
      const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const passed = scorePercentage >= test.passingScore;
      
      // Update attempt
      const completedAttempt = await storage.updateTestAttempt(attemptId, {
        completedAt: new Date(),
        score: totalScore,
        maxScore,
        percentage: scorePercentage,
        passed,
        status: 'completed'
      });
      
      res.json({
        attempt: completedAttempt,
        results: {
          score: totalScore,
          maxScore,
          percentage: scorePercentage,
          passed,
          passingScore: test.passingScore
        }
      });
    } catch (error) {
      console.error('Error submitting test:', error);
      res.status(500).json({ message: "Failed to submit test" });
    }
  });

  app.get("/api/student/tests/:testId/attempts", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const attempts = await storage.getStudentTestAttempts(req.user.id, testId);
      
      res.json(attempts);
    } catch (error) {
      console.error('Error fetching test attempts:', error);
      res.status(500).json({ message: "Failed to fetch test attempts" });
    }
  });

  // =====================================================
  // VIDEO COURSES SUBSYSTEM
  // =====================================================

  // Admin and Teacher endpoints for video lessons
  app.post("/api/admin/video-lessons", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const lessonData = req.body;
      const newLesson = await storage.createVideoLesson(lessonData);
      res.status(201).json(newLesson);
    } catch (error: any) {
      console.error('Error creating video lesson:', error);
      res.status(500).json({ 
        message: 'Failed to create video lesson',
        error: error.message 
      });
    }
  });

  app.get("/api/admin/courses/:courseId/lessons", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const lessons = await storage.getVideoLessonsByCourse(Number(courseId));
      res.json(lessons || []);
    } catch (error: any) {
      console.error('Error fetching lessons:', error);
      res.json([]); // Return empty array on error
    }
  });

  // Get all video lessons for a teacher
  app.get("/api/teacher/video-lessons", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const lessons = await storage.getTeacherVideoLessons(teacherId);
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching video lessons:', error);
      res.status(500).json({ message: "Failed to fetch video lessons" });
    }
  });

  // Get video lessons by course
  app.get("/api/teacher/courses/:courseId/video-lessons", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const lessons = await storage.getCourseVideoLessons(courseId);
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching course video lessons:', error);
      res.status(500).json({ message: "Failed to fetch course video lessons" });
    }
  });

  // Create a new video lesson
  app.post("/api/teacher/video-lessons", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const lessonData = {
        ...req.body,
        teacherId: req.user.id,
        isPublished: false,
        viewCount: 0,
        completionRate: 0
      };
      
      const lesson = await storage.createVideoLesson(lessonData);
      res.status(201).json(lesson);
    } catch (error) {
      console.error('Error creating video lesson:', error);
      res.status(500).json({ message: "Failed to create video lesson" });
    }
  });

  // Update a video lesson
  app.put("/api/teacher/video-lessons/:lessonId", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const lesson = await storage.getVideoLessonById(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Video lesson not found" });
      }
      
      // Ensure teacher owns this lesson
      if (lesson.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedLesson = await storage.updateVideoLesson(lessonId, req.body);
      res.json(updatedLesson);
    } catch (error) {
      console.error('Error updating video lesson:', error);
      res.status(500).json({ message: "Failed to update video lesson" });
    }
  });

  // Delete a video lesson
  app.delete("/api/teacher/video-lessons/:lessonId", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const lesson = await storage.getVideoLessonById(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Video lesson not found" });
      }
      
      // Ensure teacher owns this lesson
      if (lesson.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteVideoLesson(lessonId);
      res.json({ message: "Video lesson deleted successfully" });
    } catch (error) {
      console.error('Error deleting video lesson:', error);
      res.status(500).json({ message: "Failed to delete video lesson" });
    }
  });

  // Toggle publish status
  app.patch("/api/teacher/video-lessons/:lessonId/publish", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const { isPublished } = req.body;
      
      const lesson = await storage.getVideoLessonById(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Video lesson not found" });
      }
      
      // Ensure teacher owns this lesson
      if (lesson.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedLesson = await storage.updateVideoLesson(lessonId, { isPublished });
      res.json(updatedLesson);
    } catch (error) {
      console.error('Error toggling video lesson publish status:', error);
      res.status(500).json({ message: "Failed to update publish status" });
    }
  });

  // Get video lesson analytics
  app.get("/api/teacher/video-lessons/:lessonId/analytics", authenticateToken, requireRole(['Teacher/Tutor']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const lesson = await storage.getVideoLessonById(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Video lesson not found" });
      }
      
      // Ensure teacher owns this lesson
      if (lesson.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const analytics = await storage.getVideoLessonAnalytics(lessonId);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching video lesson analytics:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Student endpoints for video courses
  
  // Get available video courses for students
  app.get("/api/student/video-courses", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const { language, level, skillFocus, search } = req.query;
      const filters = {
        language,
        level, 
        skillFocus,
        search,
        isPublished: true
      };
      
      const courses = await storage.getAvailableVideoCourses(filters);
      res.json(courses);
    } catch (error) {
      console.error('Error fetching video courses:', error);
      res.status(500).json({ message: "Failed to fetch video courses" });
    }
  });

  // Get video lessons for a course (student view)
  app.get("/api/student/courses/:courseId/video-lessons", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const studentId = req.user.id;
      
      // Check if student has access to this course
      const hasAccess = await storage.studentHasCourseAccess(studentId, courseId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied. Please enroll in this course." });
      }
      
      const lessons = await storage.getCourseVideoLessonsForStudent(courseId, studentId);
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching student video lessons:', error);
      res.status(500).json({ message: "Failed to fetch video lessons" });
    }
  });

  // Track video progress
  app.post("/api/student/video-lessons/:lessonId/progress", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const studentId = req.user.id;
      const { watchTime, totalDuration, completed } = req.body;
      
      const progress = await storage.updateVideoProgress({
        studentId,
        videoLessonId: lessonId,
        watchTime,
        totalDuration,
        completed,
        lastWatchedAt: new Date()
      });
      
      res.json(progress);
    } catch (error) {
      console.error('Error updating video progress:', error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Add video note
  app.post("/api/student/video-lessons/:lessonId/notes", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const studentId = req.user.id;
      const { timestamp, content } = req.body;
      
      const note = await storage.createVideoNote({
        studentId,
        videoLessonId: lessonId,
        timestamp,
        content
      });
      
      res.status(201).json(note);
    } catch (error) {
      console.error('Error creating video note:', error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  // Get video notes
  app.get("/api/student/video-lessons/:lessonId/notes", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const studentId = req.user.id;
      
      const notes = await storage.getVideoNotes(studentId, lessonId);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching video notes:', error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  // Add video bookmark
  app.post("/api/student/video-lessons/:lessonId/bookmarks", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const studentId = req.user.id;
      const { timestamp, title } = req.body;
      
      const bookmark = await storage.createVideoBookmark({
        studentId,
        videoLessonId: lessonId,
        timestamp,
        title
      });
      
      res.status(201).json(bookmark);
    } catch (error) {
      console.error('Error creating video bookmark:', error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  // Get video bookmarks
  app.get("/api/student/video-lessons/:lessonId/bookmarks", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const studentId = req.user.id;
      
      const bookmarks = await storage.getVideoBookmarks(studentId, lessonId);
      res.json(bookmarks);
    } catch (error) {
      console.error('Error fetching video bookmarks:', error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // ===== ROOM MANAGEMENT API ENDPOINTS =====
  
  // Get all rooms
  app.get("/api/rooms", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  // Get room by ID
  app.get("/api/rooms/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getRoomById(id);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      res.json(room);
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  // Create room
  app.post("/api/rooms", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      console.error('Error creating room:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid room data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  // Update room
  app.put("/api/rooms/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertRoomSchema.partial().parse(req.body);
      
      const room = await storage.updateRoom(id, updates);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      res.json(room);
    } catch (error) {
      console.error('Error updating room:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid room data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update room" });
    }
  });

  // Delete room
  app.delete("/api/rooms/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRoom(id);
      
      if (!success) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  // Get active rooms
  app.get("/api/rooms/active", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const rooms = await storage.getActiveRooms();
      res.json(rooms);
    } catch (error) {
      console.error('Error fetching active rooms:', error);
      res.status(500).json({ message: "Failed to fetch active rooms" });
    }
  });

  // Get rooms by type
  app.get("/api/rooms/type/:type", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const type = req.params.type;
      const rooms = await storage.getRoomsByType(type);
      res.json(rooms);
    } catch (error) {
      console.error('Error fetching rooms by type:', error);
      res.status(500).json({ message: "Failed to fetch rooms by type" });
    }
  });

  // ===== CALLERN VIDEO CALL SYSTEM API ENDPOINTS =====
  
  // Get available Callern packages
  app.get("/api/student/callern-packages", authenticateToken, async (req: any, res) => {
    try {
      const packages = await storage.getCallernPackages();
      res.json(packages);
    } catch (error) {
      console.error('Error fetching Callern packages:', error);
      res.status(500).json({ message: "Failed to fetch Callern packages" });
    }
  });

  // Get student's purchased Callern packages
  app.get("/api/student/my-callern-packages", authenticateToken, async (req: any, res) => {
    try {
      const packages = await storage.getStudentCallernPackages(req.user.id);
      res.json(packages);
    } catch (error) {
      console.error('Error fetching student Callern packages:', error);
      res.status(500).json({ message: "Failed to fetch your Callern packages" });
    }
  });

  // Get student's Callern call history
  app.get("/api/student/callern-history", authenticateToken, async (req: any, res) => {
    try {
      const history = await storage.getStudentCallernHistory(req.user.id);
      res.json(history);
    } catch (error) {
      console.error('Error fetching Callern history:', error);
      res.status(500).json({ message: "Failed to fetch call history" });
    }
  });

  // Get available Callern teachers
  app.get("/api/student/callern-teachers", authenticateToken, async (req: any, res) => {
    try {
      const { language } = req.query;
      
      // Get authorized Callern teachers from database
      const authorizedTeachers = await storage.getAuthorizedCallernTeachers();
      
      console.log('Found authorized Callern teachers:', authorizedTeachers.length);
      
      // Filter by language if specified
      let callernTeachers = authorizedTeachers;
      
      if (language && language !== 'all') {
        callernTeachers = callernTeachers.filter((teacher: any) => {
          const languages = teacher.languages || ['English'];
          const specializations = teacher.specializations || [];
          return languages.includes(language) || specializations.includes(language);
        });
      }
      
      console.log('Filtered teachers by language:', callernTeachers.length);
      
      // Teachers are already formatted by getAuthorizedCallernTeachers
      const formattedTeachers = callernTeachers.map((teacher: any) => ({
        id: teacher.id,
        firstName: teacher.firstName || teacher.first_name || 'Teacher',
        lastName: teacher.lastName || teacher.last_name || '',
        languages: teacher.languages || ['English', 'Persian'],
        specializations: teacher.specializations || ['General Conversation'],
        rating: teacher.rating || 4.5,
        hourlyRate: teacher.hourlyRate || 600000, // 600k IRR default
        isOnline: teacher.isOnline || false,
        profileImageUrl: teacher.avatar || null
      }));
      
      res.json(formattedTeachers);
    } catch (error) {
      console.error('Error fetching Callern teachers:', error);
      res.status(500).json({ message: "Failed to fetch available teachers" });
    }
  });

  // Purchase Callern package
  app.post("/api/student/purchase-callern-package", authenticateToken, async (req: any, res) => {
    try {
      const { packageId } = req.body;
      
      if (!packageId) {
        return res.status(400).json({ message: "Package ID is required" });
      }

      // Get package details
      const packages = await storage.getCallernPackages();
      const selectedPackage = packages.find(p => p.id === packageId);
      
      if (!selectedPackage) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Get user's wallet balance
      const walletData = await storage.getUserWalletData(req.user.id);
      const packagePrice = parseFloat(selectedPackage.price);
      
      if (!walletData || walletData.walletBalance < packagePrice) {
        console.log(`Wallet check - Balance: ${walletData?.walletBalance}, Package price: ${packagePrice}, Required: ${packagePrice}`);
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      // Deduct from wallet
      await storage.updateWalletBalance(req.user.id, -packagePrice);
      
      // Create wallet transaction
      await storage.createWalletTransaction({
        userId: req.user.id,
        type: 'purchase',
        amount: -packagePrice,
        description: `Purchased Callern package: ${selectedPackage.packageName}`,
        status: 'completed',
        merchantTransactionId: `CALLERN_${Date.now()}_${req.user.id}`
      });

      // Purchase the package
      const purchasedPackage = await storage.purchaseCallernPackage({
        studentId: req.user.id,
        packageId: packageId,
        price: packagePrice
      });
      
      if (!purchasedPackage) {
        // Rollback wallet deduction if purchase fails
        await storage.updateWalletBalance(req.user.id, packagePrice);
        return res.status(400).json({ message: "Failed to purchase package" });
      }

      res.status(201).json(purchasedPackage);
    } catch (error) {
      console.error('Error purchasing Callern package:', error);
      res.status(500).json({ message: "Failed to purchase package" });
    }
  });

  // ===== GAMIFICATION SYSTEM API ENDPOINTS =====
  
  // Get available games
  app.get("/api/student/games", authenticateToken, async (req: any, res) => {
    try {
      const { ageGroup, skillFocus } = req.query;
      let games;
      
      if (ageGroup && ageGroup !== 'all') {
        games = await storage.getGamesByAgeGroup(ageGroup as string);
      } else {
        games = await storage.getAllGames();
      }
      
      // Filter by skill focus if specified
      if (skillFocus && skillFocus !== 'all') {
        games = games.filter(game => game.skillFocus === skillFocus);
      }
      
      res.json(games);
    } catch (error) {
      console.error('Error fetching games:', error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Get user's game progress
  app.get("/api/student/game-progress", authenticateToken, async (req: any, res) => {
    try {
      const progress = await storage.getUserGameProgressByUser(req.user.id);
      res.json(progress);
    } catch (error) {
      console.error('Error fetching game progress:', error);
      res.status(500).json({ message: "Failed to fetch game progress" });
    }
  });

  // Get user's achievements
  app.get("/api/student/achievements", authenticateToken, async (req: any, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.user.id);
      res.json(achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Get user's game sessions
  app.get("/api/student/game-sessions", authenticateToken, async (req: any, res) => {
    try {
      const sessions = await storage.getUserGameSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching game sessions:', error);
      res.status(500).json({ message: "Failed to fetch game sessions" });
    }
  });

  // Get leaderboard
  app.get("/api/student/leaderboard", authenticateToken, async (req: any, res) => {
    try {
      const leaderboard = await storage.getGlobalLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Duplicate stats endpoint removed

  // Start a game session
  app.post("/api/student/start-game", authenticateToken, async (req: any, res) => {
    try {
      const { gameId } = req.body;
      
      if (!gameId) {
        return res.status(400).json({ message: "Game ID is required" });
      }

      // Create or get user game progress
      const progress = await storage.getOrCreateUserGameProgress(req.user.id, gameId);
      
      // Create new game session
      const session = await storage.createGameSession({
        userId: req.user.id,
        gameId,
        currentLevel: progress.currentLevel,
        score: 0,
        xpEarned: 0,
        duration: 0,
        status: 'active'
      });

      res.status(201).json({ sessionId: session.id, session });
    } catch (error) {
      console.error('Error starting game:', error);
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  // Start a specific game (alternative endpoint) with CHECK-FIRST PROTOCOL
  app.post("/api/student/games/:gameId/start", authenticateToken, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      
      if (!gameId) {
        return res.status(400).json({ message: "Game ID is required" });
      }

      // CHECK-FIRST PROTOCOL: Validate game and user prerequisites
      const game = await storage.getGameById(gameId);
      if (!game || !game.isActive) {
        return res.status(404).json({ message: "Game not found or inactive" });
      }

      // CHECK: User already has active session for this game
      const activeSessions = await storage.getUserGameSessions(req.user.id, gameId);
      const activeSession = activeSessions.find(s => s.status === 'active');
      if (activeSession) {
        return res.status(409).json({ 
          message: "Active game session already exists", 
          sessionId: activeSession.id,
          existingSession: activeSession
        });
      }

      // CHECK: User level requirements (self-hosted validation)
      const userStats = await storage.getUserStats(req.user.id);
      const userLevel = userStats?.currentLevel || 1;
      
      // Self-hosted level validation (no external APIs)
      const levelMapping = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
      const requiredMinLevel = levelMapping[game.minLevel] || 1;
      
      // For admin users testing, allow bypass of level requirements
      if (req.user.role === 'Admin') {
        console.log('Admin user bypassing level requirements for game testing');
      } else if (userLevel < requiredMinLevel) {
        return res.status(403).json({ 
          message: "User level insufficient for this game",
          requiredLevel: game.minLevel,
          userLevel: Object.keys(levelMapping)[userLevel - 1] || 'A1'
        });
      }

      // CHECK: No schedule conflicts (for Iranian self-hosted compliance)
      const now = new Date();
      const recentSessions = await storage.getUserGameSessions(req.user.id);
      const recentActiveCount = recentSessions.filter(s => 
        s.startedAt && new Date(s.startedAt).getTime() > now.getTime() - 30 * 60 * 1000 // 30 minutes
      ).length;

      if (recentActiveCount >= 3) {
        return res.status(429).json({ 
          message: "Too many recent game sessions. Please wait before starting a new game.",
          waitTime: "30 minutes"
        });
      }

      // All checks passed - create game session
      const progress = await storage.getOrCreateUserGameProgress(req.user.id, gameId);
      
      const session = await storage.createGameSession({
        userId: req.user.id,
        gameId,
        currentLevel: progress.currentLevel,
        score: 0,
        xpEarned: 0,
        duration: 0,
        status: 'active'
      });

      res.status(201).json({ 
        sessionId: session.id, 
        session,
        checksCompleted: {
          gameExists: true,
          userEligible: true,
          noConflicts: true,
          levelRequirementMet: true
        }
      });
    } catch (error) {
      console.error('Error starting game:', error);
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  // ===== CALLERN MANAGEMENT ENDPOINTS =====
  
  // Create Callern course with package configuration
  app.post("/api/admin/callern/courses", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { courseData, callernConfig } = req.body;
      
      // Create Callern course
      const callernCourse = await storage.createCourse({
        ...courseData,
        deliveryMode: 'callern',
        classFormat: 'callern_package',
        totalSessions: 1, // Callern is on-demand
        sessionDuration: callernConfig.minCallDuration || 15
      });

      // Create Callern package
      const callernPackage = await storage.createCallernPackage({
        packageName: callernConfig.packageName,
        totalHours: callernConfig.totalHours,
        price: callernConfig.price,
        description: callernConfig.description,
        isActive: true
      });

      // Assign standby teachers
      if (callernConfig.standbyTeachers && callernConfig.standbyTeachers.length > 0) {
        for (const teacherId of callernConfig.standbyTeachers) {
          await storage.setTeacherCallernAvailability({
            teacherId,
            isOnline: false, // Initial state
            availableHours: ["00:00-23:59"], // 24/7 if overnight coverage
            hourlyRate: null
          });
        }
      }

      res.status(201).json({
        message: "Callern course created successfully",
        course: callernCourse,
        package: callernPackage
      });
    } catch (error) {
      console.error('Error creating Callern course:', error);
      res.status(500).json({ message: "Failed to create Callern course" });
    }
  });

  // Get teacher availability for Callern
  app.get("/api/admin/callern/teacher-availability", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const availability = await storage.getTeacherCallernAvailability();
      res.json(availability);
    } catch (error) {
      console.error('Error fetching teacher availability:', error);
      res.status(500).json({ message: "Failed to fetch teacher availability" });
    }
  });

  // Add teacher to Callern availability with schedule conflict checking
  app.post("/api/admin/callern/teacher-availability", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { teacherId, hourlyRate, availableHours } = req.body;

      // CRITICAL: Check for schedule conflicts across all delivery modes
      const teacherScheduleConflicts = await storage.checkTeacherScheduleConflicts(
        parseInt(teacherId), 
        availableHours
      );

      if (teacherScheduleConflicts.hasConflicts) {
        // Provide detailed conflict information
        const conflictSessions = teacherScheduleConflicts.conflicts
          .filter(c => c.type === 'scheduled_session')
          .map(c => `${c.courseTitle} on ${c.sessionTime}`)
          .join(', ');
          
        return res.status(409).json({
          message: "Schedule conflict detected",
          conflicts: teacherScheduleConflicts.conflicts,
          conflictDetails: conflictSessions 
            ? `Teacher has scheduled sessions: ${conflictSessions}. Please choose different hours or cancel conflicting sessions first.`
            : `Teacher has existing ${teacherScheduleConflicts.conflictType} during these hours: ${teacherScheduleConflicts.conflictingHours.join(', ')}`
        });
      }

      const availability = await storage.setTeacherCallernAvailability({
        teacherId: parseInt(teacherId),
        isOnline: false, // Initial state
        availableHours: availableHours || [],
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null
      });

      res.status(201).json({
        message: "Teacher added to Callern successfully",
        availability,
        scheduleValidated: true
      });
    } catch (error) {
      console.error('Error adding teacher to Callern:', error);
      res.status(500).json({ message: "Failed to add teacher to Callern" });
    }
  });

  // Update teacher standby status
  app.put("/api/admin/callern/teacher-availability/:teacherId", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const { isOnline, availableHours, hourlyRate } = req.body;

      const updated = await storage.updateTeacherCallernAvailability(teacherId, {
        isOnline,
        availableHours,
        hourlyRate,
        lastActiveAt: new Date()
      });

      res.json({ message: "Teacher availability updated", availability: updated });
    } catch (error) {
      console.error('Error updating teacher availability:', error);
      res.status(500).json({ message: "Failed to update teacher availability" });
    }
  });

  // Get available teachers for Callern assignment
  app.get("/api/admin/callern/available-teachers", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const teachers = await storage.getTeachersForCallern();
      res.json(teachers);
    } catch (error) {
      console.error('Error fetching available teachers:', error);
      res.status(500).json({ message: "Failed to fetch available teachers" });
    }
  });

  // Get Callern packages
  app.get("/api/admin/callern/packages", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const packages = await storage.getCallernPackages();
      res.json(packages);
    } catch (error) {
      console.error('Error fetching Callern packages:', error);
      res.status(500).json({ message: "Failed to fetch Callern packages" });
    }
  });

  // Create Callern package
  app.post("/api/admin/callern/packages", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { packageName, totalHours, price, description, isActive } = req.body;
      
      if (!packageName || !totalHours || !price) {
        return res.status(400).json({ message: "Package name, total hours, and price are required" });
      }

      const newPackage = await storage.createCallernPackage({
        packageName,
        totalHours,
        price,
        description,
        isActive: isActive !== undefined ? isActive : true
      });

      res.status(201).json(newPackage);
    } catch (error) {
      console.error('Error creating Callern package:', error);
      res.status(500).json({ message: "Failed to create Callern package" });
    }
  });

  // Update Callern package
  app.put("/api/admin/callern/packages/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { packageName, totalHours, price, description, isActive } = req.body;
      
      const updatedPackage = await storage.updateCallernPackage(parseInt(id), {
        packageName,
        totalHours,
        price,
        description,
        isActive
      });

      if (!updatedPackage) {
        return res.status(404).json({ message: "Package not found" });
      }

      res.json(updatedPackage);
    } catch (error) {
      console.error('Error updating Callern package:', error);
      res.status(500).json({ message: "Failed to update Callern package" });
    }
  });

  // Delete Callern package
  app.delete("/api/admin/callern/packages/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteCallernPackage(parseInt(id));
      res.json({ message: "Package deleted successfully" });
    } catch (error) {
      console.error('Error deleting Callern package:', error);
      res.status(500).json({ message: "Failed to delete Callern package" });
    }
  });

  // Student endpoints for Callern
  app.get("/api/student/callern/packages", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const packages = await storage.getCallernPackages();
      const userPackages = await storage.getStudentCallernPackages(req.user.id);
      res.json({ availablePackages: packages, userPackages });
    } catch (error) {
      console.error('Error fetching student Callern data:', error);
      res.status(500).json({ message: "Failed to fetch Callern data" });
    }
  });

  // ===== GAMIFICATION AND GAMES API ENDPOINTS =====

  // Get available games with filtering (age-based filtering for students)
  app.get("/api/student/games", authenticateToken, async (req: any, res) => {
    try {
      const { ageGroup, skillFocus, level } = req.query;
      
      // Get user profile to determine age group
      const userProfile = await storage.getUserProfile(req.user.id);
      let studentAgeGroup = ageGroup;
      
      // If no age group specified, determine from user's date of birth
      if (!ageGroup && userProfile?.dateOfBirth) {
        const birthDate = new Date(userProfile.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age <= 10) studentAgeGroup = '5-10';
        else if (age <= 14) studentAgeGroup = '11-14';
        else if (age <= 20) studentAgeGroup = '15-20';
        else studentAgeGroup = '21+';
      }
      
      const games = await storage.getGamesByFilters({
        ageGroup: studentAgeGroup === 'all' ? undefined : studentAgeGroup,
        gameType: skillFocus === 'all' ? undefined : skillFocus,
        level: level === 'all' ? undefined : level,
        language: 'en'
      });
      res.json(games);
    } catch (error) {
      console.error('Error fetching games:', error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Get user game progress
  app.get("/api/student/game-progress", authenticateToken, async (req: any, res) => {
    try {
      const progress = await storage.getUserGameProgressByUser(req.user.id);
      res.json(progress);
    } catch (error) {
      console.error('Error fetching game progress:', error);
      res.status(500).json({ message: "Failed to fetch game progress" });
    }
  });

  // Get specific game details for student
  app.get("/api/student/games/:gameId", authenticateToken, async (req: any, res) => {
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

  // Get game questions/content
  app.get("/api/student/games/:gameId/questions", authenticateToken, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const game = await storage.getGameById(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Generate questions based on game type and level
      const questions = await storage.getGameLevels(gameId);
      
      // If no questions exist, generate sample questions based on game type
      if (questions.length === 0) {
        const sampleQuestions = generateSampleQuestions(game.gameType, game.minLevel);
        res.json(sampleQuestions);
      } else {
        // Transform game levels to questions format
        const questionData = questions.map((level, index) => ({
          id: level.id,
          question: `${game.gameType.charAt(0).toUpperCase() + game.gameType.slice(1)} Challenge ${index + 1}`,
          options: generateOptionsForGameType(game.gameType),
          correctAnswer: generateCorrectAnswer(game.gameType),
          explanation: `This ${game.gameType} exercise helps improve your skills.`,
          type: 'multiple_choice'
        }));
        res.json(questionData);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Start a game session
  app.post("/api/student/games/:gameId/start", authenticateToken, requireRole(['Student']), async (req: any, res) => {
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

  // Submit game answer
  app.post("/api/student/games/:gameId/answer", authenticateToken, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const { sessionId, questionId, answer } = req.body;
      
      const game = await storage.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Simple answer validation - in a real implementation this would check against stored correct answers
      const isCorrect = validateAnswer(game.gameType, answer);
      
      res.json({
        correct: isCorrect,
        explanation: isCorrect ? 
          `Correct! Great ${game.gameType} skills!` : 
          `Not quite right. Keep practicing your ${game.gameType} skills.`,
        xpEarned: isCorrect ? game.pointsPerCorrect : 0
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  // Complete game session
  app.post("/api/student/games/:gameId/complete", authenticateToken, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const { sessionId, finalScore, timeSpent, answers } = req.body;
      
      const game = await storage.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Update game session
      const session = await storage.endGameSession(parseInt(sessionId), {
        score: finalScore,
        isCompleted: true,
        endedAt: new Date()
      });

      // Update user progress
      await storage.getOrCreateUserGameProgress(req.user.id, gameId);

      res.json({
        sessionId,
        xpEarned: finalScore,
        coinsEarned: Math.floor(finalScore / 10),
        completed: true,
        newAchievements: []
      });
    } catch (error) {
      console.error('Error completing game:', error);
      res.status(500).json({ message: "Failed to complete game" });
    }
  });

  // Helper functions for game content generation
  function generateSampleQuestions(gameType: string, level: string) {
    const baseQuestions = {
      vocabulary: [
        {
          id: 1,
          question: "What does 'comprehensive' mean?",
          options: ["Simple", "Complete and thorough", "Difficult", "Quick"],
          correctAnswer: "Complete and thorough",
          type: "multiple_choice"
        },
        {
          id: 2,
          question: "Choose the synonym for 'abundant':",
          options: ["Scarce", "Plentiful", "Empty", "Small"],
          correctAnswer: "Plentiful",
          type: "multiple_choice"
        }
      ],
      grammar: [
        {
          id: 1,
          question: "Choose the correct form: 'She _____ to school every day.'",
          options: ["go", "goes", "going", "gone"],
          correctAnswer: "goes",
          type: "multiple_choice"
        },
        {
          id: 2,
          question: "Which sentence is correct?",
          options: ["I have went there", "I have gone there", "I have go there", "I has gone there"],
          correctAnswer: "I have gone there",
          type: "multiple_choice"
        }
      ],
      listening: [
        {
          id: 1,
          question: "What did the speaker say about the weather?",
          options: ["It's sunny", "It's raining", "It's cloudy", "It's snowing"],
          correctAnswer: "It's raining",
          type: "multiple_choice"
        }
      ],
      speaking: [
        {
          id: 1,
          question: "Pronounce this word correctly: 'through'",
          options: ["threw", "through", "throw", "thought"],
          correctAnswer: "through",
          type: "multiple_choice"
        }
      ],
      reading: [
        {
          id: 1,
          question: "What is the main idea of the passage?",
          options: ["Technology is harmful", "Education is important", "Travel is fun", "Food is necessary"],
          correctAnswer: "Education is important",
          type: "multiple_choice"
        }
      ],
      writing: [
        {
          id: 1,
          question: "Choose the best way to start a formal email:",
          options: ["Hey!", "Dear Sir/Madam,", "What's up?", "Yo!"],
          correctAnswer: "Dear Sir/Madam,",
          type: "multiple_choice"
        }
      ]
    };

    return baseQuestions[gameType] || baseQuestions.vocabulary;
  }

  function generateOptionsForGameType(gameType: string) {
    const options = {
      vocabulary: ["Option A", "Option B", "Option C", "Option D"],
      grammar: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
      listening: ["Answer A", "Answer B", "Answer C", "Answer D"],
      speaking: ["Response 1", "Response 2", "Response 3", "Response 4"],
      reading: ["Statement A", "Statement B", "Statement C", "Statement D"],
      writing: ["Version A", "Version B", "Version C", "Version D"]
    };
    return options[gameType] || options.vocabulary;
  }

  function generateCorrectAnswer(gameType: string) {
    const answers = {
      vocabulary: "Option B",
      grammar: "Choice 2", 
      listening: "Answer A",
      speaking: "Response 3",
      reading: "Statement B",
      writing: "Version A"
    };
    return answers[gameType] || "Option B";
  }

  function validateAnswer(gameType: string, answer: string) {
    // Simple validation - in real implementation this would check against database
    const correctAnswers = {
      vocabulary: ["Option B", "Complete and thorough", "Plentiful"],
      grammar: ["Choice 2", "goes", "I have gone there"],
      listening: ["Answer A", "It's raining"],
      speaking: ["Response 3", "through"],
      reading: ["Statement B", "Education is important"],
      writing: ["Version A", "Dear Sir/Madam,"]
    };
    
    const validAnswers = correctAnswers[gameType] || correctAnswers.vocabulary;
    return validAnswers.includes(answer);
  }

  // End a game session
  app.put("/api/student/games/sessions/:sessionId/end", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { score, correctAnswers, wrongAnswers, xpEarned, coinsEarned, starsEarned } = req.body;
      
      const endedSession = await storage.endGameSession(sessionId, {
        endedAt: new Date(),
        score,
        correctAnswers,
        wrongAnswers,
        xpEarned,
        coinsEarned,
        starsEarned,
        isCompleted: true
      });

      // Update user stats
      await storage.updateUserStats(req.user.id, {
        totalXp: xpEarned,
        gamesPlayed: 1
      });

      res.json(endedSession);
    } catch (error) {
      console.error('Error ending game session:', error);
      res.status(500).json({ message: "Failed to end game session" });
    }
  });

  // Get game sessions for user
  app.get("/api/student/game-sessions", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const sessions = await storage.getUserGameSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching game sessions:', error);
      res.status(500).json({ message: "Failed to fetch game sessions" });
    }
  });

  // Get game leaderboard
  app.get("/api/student/leaderboard", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const { gameId, type = 'score', period = 'week' } = req.query;
      const leaderboard = await storage.getGameLeaderboard(
        gameId ? parseInt(gameId) : undefined,
        type,
        period
      );
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get user achievements
  app.get("/api/student/achievements", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.user.id);
      res.json(achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Get user stats (with real activity tracking)
  // DUPLICATE ENDPOINT REMOVED - using the one at line 3433
  // app.get("/api/student/stats", authenticateToken, requireRole(['Student']), async (req: any, res) => {
  //   try {
  //     // Import activity tracker
  //     const { activityTracker } = await import('../activity-tracker');
  //     
  //     // Get real weekly progress data
  //     const weeklyData = await activityTracker.getWeeklyProgress(req.user.id);
  //     
  //     // Get user's actual data from database
  //     const user = await storage.getUser(req.user.id);
  //     const userProfile = await storage.getUserProfile(req.user.id);
  //     const userStats = await storage.getUserStats(req.user.id);
  //     
  //     // Get skill progression data
  //     const skillProgression = await activityTracker.getSkillProgression(req.user.id, 1);
  //     const latestSkills = skillProgression[skillProgression.length - 1];
  //     
  //     // Get wallet balance
  //     const walletData = await storage.getUserWalletData(req.user.id);
  //     
  //     // Calculate real statistics based on database
  //     const realStats = {
  //       level: user?.level || 'A1',
  //       totalXp: user?.totalCredits || userStats?.totalXp || 0,
  //       currentStreak: user?.streakDays || userStats?.currentStreak || 0,
  //       completedLessons: user?.totalLessons || userStats?.completedLessons || 0,
  //       completedChallenges: weeklyData.completedLessons,
  //       totalChallenges: 15,
  //       leaderboardRank: userStats?.leaderboardRank || 1,
  //       
  //       // Wallet information
  //       walletBalance: walletData?.walletBalance || 0,
  //       memberTier: walletData?.memberTier || 'Bronze',
  //       
  //       // Real weekly progress from activity tracker
  //       weeklyProgress: weeklyData.progressPercentage,
  //       studyTimeThisWeek: Math.round(weeklyData.studyTimeMinutes / 60), // Convert to hours
  //       weeklyGoalHours: Math.round(weeklyData.goalMinutes / 60),
  //       activeDaysThisWeek: weeklyData.activeDays,
  //       
  //       // Monthly progress
  //       monthlyGoal: userProfile?.weeklyStudyHours ? userProfile.weeklyStudyHours * 4 : 20,
  //       monthlyProgress: Math.round((user?.totalLessons || 0) / 20 * 100),
  //       
  //       // Real skill points from assessments or fallback to existing stats
  //       skillPoints: latestSkills?.skillScores || userStats?.skillPoints || {
  //         listening: 65,
  //         speaking: 72,
  //         reading: 78,
  //         writing: 68,
  //         grammar: 75,
  //         vocabulary: 82
  //       }
  //     };
  //     
  //     res.json(realStats);
  //   } catch (error) {
  //     console.error('Error fetching real student stats:', error);
  //     res.status(500).json({ message: "Failed to fetch student stats" });
  //   }
  // });

  // ===== GAME COURSE CONFIGURATION API =====

  // Configure game as individual course
  app.post("/api/admin/game-courses", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { gameId, title, description, ageGroup, level, price, duration, isActive } = req.body;
      
      const gameCourse = await storage.createGameCourse({
        gameId,
        title,
        description,
        ageGroup,
        level,
        price,
        duration,
        isActive: isActive !== false
      });

      res.status(201).json(gameCourse);
    } catch (error) {
      console.error('Error creating game course:', error);
      res.status(500).json({ message: "Failed to create game course" });
    }
  });

  // Get game courses
  app.get("/api/admin/game-courses", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const gameCourses = await storage.getGameCourses();
      res.json(gameCourses);
    } catch (error) {
      console.error('Error fetching game courses:', error);
      res.status(500).json({ message: "Failed to fetch game courses" });
    }
  });

  // Add game as supplementary to existing course
  app.post("/api/admin/courses/:courseId/supplementary-games", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const { gameIds, isRequired = false } = req.body;

      const supplementaryGames = await storage.addSupplementaryGames({
        courseId,
        gameIds,
        isRequired
      });

      res.status(201).json(supplementaryGames);
    } catch (error) {
      console.error('Error adding supplementary games:', error);
      res.status(500).json({ message: "Failed to add supplementary games" });
    }
  });

  // Get supplementary games for course
  app.get("/api/admin/courses/:courseId/supplementary-games", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const supplementaryGames = await storage.getSupplementaryGames(courseId);
      res.json(supplementaryGames);
    } catch (error) {
      console.error('Error fetching supplementary games:', error);
      res.status(500).json({ message: "Failed to fetch supplementary games" });
    }
  });

  // Purchase Callern package
  app.post("/api/student/callern/purchase", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const { packageId } = req.body;
      const studentId = req.user.id;

      const callernPackage = await storage.getCallernPackage(packageId);
      if (!callernPackage) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Create student package purchase
      const studentPackage = await storage.createStudentCallernPackage({
        studentId,
        packageId,
        totalHours: callernPackage.totalHours,
        usedMinutes: 0,
        remainingMinutes: callernPackage.totalHours * 60,
        price: callernPackage.price,
        status: 'active'
      });

      res.status(201).json({
        message: "Callern package purchased successfully",
        package: studentPackage
      });
    } catch (error) {
      console.error('Error purchasing Callern package:', error);
      res.status(500).json({ message: "Failed to purchase package" });
    }
  });

  // ===== QUALITY ASSURANCE API ENDPOINTS =====

  // Recent Observations
  app.get("/api/supervision/recent-observations", authenticateToken, requireRole(['Supervisor', 'Admin']), async (req: any, res) => {
    try {
      const supervisorId = req.user.role === 'Supervisor' ? req.user.id : undefined;
      const observations = await storage.getRecentSupervisionObservations(supervisorId);
      res.json(observations);
    } catch (error) {
      console.error('Error fetching recent observations:', error);
      res.status(500).json({ message: "Failed to fetch recent observations" });
    }
  });

  // Teacher Performance Data
  app.get("/api/supervision/teacher-performance", authenticateToken, requireRole(['Supervisor', 'Admin']), async (req: any, res) => {
    try {
      const supervisorId = req.user.role === 'Supervisor' ? req.user.id : undefined;
      const performance = await storage.getTeacherPerformanceData(supervisorId);
      res.json(performance);
    } catch (error) {
      console.error('Error fetching teacher performance:', error);
      res.status(500).json({ message: "Failed to fetch teacher performance" });
    }
  });

  // Supervision Statistics
  app.get("/api/supervision/stats", authenticateToken, requireRole(['Supervisor', 'Admin']), async (req: any, res) => {
    try {
      const stats = await storage.getSupervisionStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching supervision stats:', error);
      res.status(500).json({ message: "Failed to fetch supervision stats" });
    }
  });

  // Live Class Sessions
  app.get("/api/supervision/live-sessions", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const status = req.query.status as string;
      const sessions = await storage.getLiveClassSessions(status);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching live sessions:', error);
      res.status(500).json({ message: "Failed to fetch live sessions" });
    }
  });

  app.post("/api/supervision/live-sessions", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const sessionData = req.body;
      const session = await storage.createLiveClassSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error('Error creating live session:', error);
      res.status(400).json({ message: "Failed to create live session" });
    }
  });

  app.put("/api/supervision/live-sessions/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updateData = req.body;
      const session = await storage.updateLiveClassSession(sessionId, updateData);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error('Error updating live session:', error);
      res.status(400).json({ message: "Failed to update live session" });
    }
  });

  // Teacher Retention Analytics
  app.get("/api/supervision/retention", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string) : undefined;
      const retentionData = await storage.getTeacherRetentionData(teacherId);
      res.json(retentionData);
    } catch (error) {
      console.error('Error fetching retention data:', error);
      res.status(500).json({ message: "Failed to fetch retention data" });
    }
  });

  app.post("/api/supervision/retention", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const retentionData = req.body;
      const retention = await storage.createTeacherRetentionData(retentionData);
      res.status(201).json(retention);
    } catch (error) {
      console.error('Error creating retention data:', error);
      res.status(400).json({ message: "Failed to create retention data" });
    }
  });

  app.get("/api/supervision/retention/:teacherId/:termName/rates", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const termName = req.params.termName;
      const rates = await storage.calculateRetentionRates(teacherId, termName);
      res.json(rates);
    } catch (error) {
      console.error('Error calculating retention rates:', error);
      res.status(500).json({ message: "Failed to calculate retention rates" });
    }
  });

  // Student Questionnaires
  app.get("/api/supervision/questionnaires", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const questionnaires = await storage.getStudentQuestionnaires(courseId);
      res.json(questionnaires);
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
      res.status(500).json({ message: "Failed to fetch questionnaires" });
    }
  });

  app.post("/api/supervision/questionnaires", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const questionnaireData = req.body;
      const questionnaire = await storage.createStudentQuestionnaire(questionnaireData);
      res.status(201).json(questionnaire);
    } catch (error) {
      console.error('Error creating questionnaire:', error);
      res.status(400).json({ message: "Failed to create questionnaire" });
    }
  });

  app.put("/api/supervision/questionnaires/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const questionnaireId = parseInt(req.params.id);
      const updateData = req.body;
      const questionnaire = await storage.updateStudentQuestionnaire(questionnaireId, updateData);
      if (!questionnaire) {
        return res.status(404).json({ message: "Questionnaire not found" });
      }
      res.json(questionnaire);
    } catch (error) {
      console.error('Error updating questionnaire:', error);
      res.status(400).json({ message: "Failed to update questionnaire" });
    }
  });

  // Questionnaire Responses
  app.get("/api/supervision/questionnaire-responses", authenticateToken, requireRole(['Admin', 'Supervisor', 'Teacher']), async (req: any, res) => {
    try {
      const questionnaireId = req.query.questionnaireId ? parseInt(req.query.questionnaireId as string) : undefined;
      const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string) : undefined;
      const responses = await storage.getQuestionnaireResponses(questionnaireId, teacherId);
      res.json(responses);
    } catch (error) {
      console.error('Error fetching questionnaire responses:', error);
      res.status(500).json({ message: "Failed to fetch questionnaire responses" });
    }
  });

  app.post("/api/supervision/questionnaire-responses", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const responseData = {
        ...req.body,
        studentId: req.user.id
      };
      const response = await storage.createQuestionnaireResponse(responseData);
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating questionnaire response:', error);
      res.status(400).json({ message: "Failed to create questionnaire response" });
    }
  });

  // Supervision Observations
  app.get("/api/supervision/observations", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string) : undefined;
      const supervisorId = req.query.supervisorId ? parseInt(req.query.supervisorId as string) : undefined;
      const observations = await storage.getSupervisionObservations(teacherId, supervisorId);
      res.json(observations);
    } catch (error) {
      console.error('Error fetching supervision observations:', error);
      res.status(500).json({ message: "Failed to fetch supervision observations" });
    }
  });

  app.post("/api/supervision/observations", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      console.log('POST /api/supervision/observations - User:', req.user);
      console.log('POST /api/supervision/observations - Body:', req.body);
      
      const observationData = {
        ...req.body,
        supervisorId: req.user.id
      };
      console.log('Final observation data:', observationData);
      
      const observation = await storage.createSupervisionObservation(observationData);
      console.log('Created observation:', observation);
      
      // Send SMS notification to teacher
      try {
        const teacher = await storage.getUser(observationData.teacherId);
        if (teacher?.phoneNumber) {
          const { kavenegarService } = await import('../kavenegar-service');
          
          const supervisorName = `${req.user.firstName} ${req.user.lastName}`;
          const overallScore = observationData.overallScore || 0;
          const observationType = observationData.observationType;
          
          const smsMessage = `🎯 Teacher Observation Report

Dear ${teacher.firstName},

You have received a new observation report from ${supervisorName}.

📊 Overall Score: ${overallScore}/5.0
📝 Type: ${observationType}
✅ Strengths noted
📈 Action items provided

Please log in to review your complete evaluation report and feedback.

Best regards,
Meta Lingua Academy`;

          const smsResult = await kavenegarService.sendSimpleSMS(teacher.phoneNumber, smsMessage);
          
          if (smsResult.success) {
            // Update observation with notification status
            await storage.updateSupervisionObservation(observation.id, {
              teacherNotified: true,
              notificationSentAt: new Date()
            });
            console.log(`SMS notification sent to teacher ${teacher.firstName}: ${smsResult.messageId}`);
          } else {
            console.error(`Failed to send SMS to teacher ${teacher.firstName}: ${smsResult.error}`);
          }
        }
      } catch (smsError) {
        console.error('Error sending teacher notification SMS:', smsError);
        // Don't fail the observation creation if SMS fails
      }
      
      res.status(201).json(observation);
    } catch (error) {
      console.error('Error creating supervision observation:', error);
      console.error('Error details:', error.stack);
      res.status(400).json({ 
        message: "Failed to create supervision observation", 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.put("/api/supervision/observations/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const observationId = parseInt(req.params.id);
      const updateData = req.body;
      const observation = await storage.updateSupervisionObservation(observationId, updateData);
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      res.json(observation);
    } catch (error) {
      console.error('Error updating supervision observation:', error);
      res.status(400).json({ message: "Failed to update supervision observation" });
    }
  });

  // Quality Assurance Stats Dashboard
  app.get("/api/supervision/stats", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const stats = await storage.getQualityAssuranceStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching QA stats:', error);
      res.status(500).json({ message: "Failed to fetch quality assurance stats" });
    }
  });

  // ===== SCHEDULED OBSERVATIONS API ENDPOINTS =====

  // Get all scheduled observations (filtered by supervisor)
  app.get("/api/supervision/scheduled-observations", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const supervisorId = req.user.role === 'Supervisor' ? req.user.id : undefined;
      const observations = await storage.getScheduledObservations(supervisorId);
      res.json(observations);
    } catch (error) {
      console.error('Error fetching scheduled observations:', error);
      res.status(500).json({ message: "Failed to fetch scheduled observations" });
    }
  });

  // Create new scheduled observation with SMS notification
  app.post("/api/supervision/scheduled-observations", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const observationData = {
        ...req.body,
        supervisorId: req.user.id
      };
      
      const observation = await storage.createScheduledObservation(observationData);
      
      // Send SMS notification to teacher
      try {
        const teacher = await storage.getUser(observationData.teacherId);
        if (teacher?.phoneNumber) {
          const { kavenegarService } = await import('../kavenegar-service');
          
          const supervisorName = `${req.user.firstName} ${req.user.lastName}`;
          const scheduledDate = new Date(observationData.scheduledDate).toLocaleDateString('fa-IR');
          const scheduledTime = new Date(observationData.scheduledDate).toLocaleTimeString('fa-IR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          const smsMessage = `🎯 Class Observation Scheduled

Dear ${teacher.firstName},

A supervisor has scheduled an observation for your class:

📅 Date: ${scheduledDate}
⏰ Time: ${scheduledTime}
👥 Type: ${observationData.observationType}
📋 Priority: ${observationData.priority}

Please ensure your class is ready for quality assessment.

Supervisor: ${supervisorName}
Meta Lingua Academy`;

          const smsResult = await kavenegarService.sendSimpleSMS(teacher.phoneNumber, smsMessage);
          
          if (smsResult.success) {
            // Update observation with notification status
            await storage.updateScheduledObservation(observation.id, {
              teacherNotified: true,
              notificationSentAt: new Date()
            });
            console.log(`SMS notification sent to teacher ${teacher.firstName}: ${smsResult.messageId}`);
          } else {
            console.error(`Failed to send SMS to teacher ${teacher.firstName}: ${smsResult.error}`);
          }
        }
      } catch (smsError) {
        console.error('Error sending teacher notification SMS:', smsError);
        // Don't fail the observation creation if SMS fails
      }
      
      res.status(201).json(observation);
    } catch (error) {
      console.error('Error creating scheduled observation:', error);
      res.status(400).json({ 
        message: "Failed to create scheduled observation", 
        error: error.message 
      });
    }
  });

  // Update scheduled observation
  app.put("/api/supervision/scheduled-observations/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const observationId = parseInt(req.params.id);
      const updateData = req.body;
      const observation = await storage.updateScheduledObservation(observationId, updateData);
      res.json(observation);
    } catch (error) {
      console.error('Error updating scheduled observation:', error);
      res.status(400).json({ message: "Failed to update scheduled observation" });
    }
  });

  // Delete scheduled observation
  app.delete("/api/supervision/scheduled-observations/:id", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const observationId = parseInt(req.params.id);
      const success = await storage.deleteScheduledObservation(observationId);
      if (success) {
        res.json({ message: "Scheduled observation deleted successfully" });
      } else {
        res.status(404).json({ message: "Scheduled observation not found" });
      }
    } catch (error) {
      console.error('Error deleting scheduled observation:', error);
      res.status(400).json({ message: "Failed to delete scheduled observation" });
    }
  });

  // Get teacher's classes available for observation
  app.get("/api/supervision/teacher-classes/:teacherId", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const classes = await storage.getTeacherClassesForObservation(teacherId);
      res.json(classes);
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      res.status(500).json({ message: "Failed to fetch teacher classes" });
    }
  });

  // Get pending observations for dashboard to-do list
  app.get("/api/supervision/pending-observations", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const supervisorId = req.user.role === 'Supervisor' ? req.user.id : undefined;
      const observations = await storage.getPendingObservations(supervisorId);
      res.json(observations);
    } catch (error) {
      console.error('Error fetching pending observations:', error);
      res.status(500).json({ message: "Failed to fetch pending observations" });
    }
  });

  // Get overdue observations
  app.get("/api/supervision/overdue-observations", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const supervisorId = req.user.role === 'Supervisor' ? req.user.id : undefined;
      const observations = await storage.getOverdueObservations(supervisorId);
      res.json(observations);
    } catch (error) {
      console.error('Error fetching overdue observations:', error);
      res.status(500).json({ message: "Failed to fetch overdue observations" });
    }
  });

  // Approve selected classes for observation
  app.post("/api/supervision/approve-classes", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { teacherId, classIds, approvalNotes } = req.body;
      
      if (!teacherId || !classIds || !Array.isArray(classIds) || classIds.length === 0) {
        return res.status(400).json({ message: "Teacher ID and class IDs are required" });
      }

      // Get teacher info
      const teacher = await storage.getUser(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      // Get the selected classes details
      const selectedClasses = await storage.getTeacherClassesForObservation(teacherId);
      const approvedClasses = selectedClasses.filter(cls => classIds.includes(cls.id));
      
      if (approvedClasses.length === 0) {
        return res.status(404).json({ message: "No valid classes found to approve" });
      }

      // Create scheduled observations for each approved class
      // Handle both individual and group classes with sessionIds array
      const scheduledObservations = [];
      for (const classItem of approvedClasses) {
        // For group classes, create observation for the primary session
        // The sessionIds array contains all related sessions for this consolidated class
        const observationData = {
          teacherId: teacherId,
          supervisorId: req.user.id,
          sessionId: classItem.id, // Primary session ID
          observationType: 'live_' + classItem.deliveryMode,
          priority: classItem.isGroupClass ? 'high' : 'normal', // Group classes get higher priority
          scheduledDate: new Date(classItem.scheduledAt),
          notes: approvalNotes || `${classItem.isGroupClass ? 'Group class' : 'Class'} approved for observation: ${classItem.title} (${classItem.studentName})`,
          teacherNotified: false
        };
        
        const observation = await storage.createScheduledObservation(observationData);
        scheduledObservations.push(observation);
      }

      // Send SMS notification to teacher if they have a phone number
      try {
        if (teacher.phoneNumber) {
          const { kavenegarService } = await import('../kavenegar-service');
          
          const supervisorName = `${req.user.firstName} ${req.user.lastName}`;
          const classNames = approvedClasses.map(cls => cls.title).join(', ');
          
          const smsMessage = `📋 Classes Approved for Observation

Dear ${teacher.firstName},

${approvedClasses.length} of your classes have been approved for observation by supervisor ${supervisorName}:

Classes: ${classNames}

📅 Approval Date: ${new Date().toLocaleDateString('fa-IR')}
📝 Status: Scheduled for observation

Please prepare these classes for quality assessment. You will receive individual notifications before each observation.

Best regards,
Meta Lingua Academy`;

          const smsResult = await kavenegarService.sendSimpleSMS(teacher.phoneNumber, smsMessage);
          
          if (smsResult.success) {
            console.log(`Class approval SMS sent to teacher ${teacher.firstName}: ${smsResult.messageId}`);
          } else {
            console.error(`Failed to send class approval SMS to teacher ${teacher.firstName}: ${smsResult.error}`);
          }
        }
      } catch (smsError) {
        console.error('Error sending class approval SMS:', smsError);
        // Don't fail the approval if SMS fails
      }

      res.status(200).json({ 
        message: "Classes approved for observation successfully",
        approvedClasses: approvedClasses.length,
        scheduledObservations: scheduledObservations,
        classNames: approvedClasses.map(cls => cls.title)
      });
    } catch (error) {
      console.error('Error approving classes for observation:', error);
      res.status(500).json({ 
        message: "Failed to approve classes for observation", 
        error: error.message 
      });
    }
  });

  // ==================== ADMIN BUSINESS INTELLIGENCE ENDPOINTS ====================
}
