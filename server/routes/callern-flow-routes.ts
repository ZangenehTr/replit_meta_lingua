import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { authenticate, type AuthenticatedRequest } from '../auth';

// Use centralized authentication middleware
const requireAuth = authenticate;

const router = Router();

// Schemas
const prepSessionSchema = z.object({
  studentId: z.number(),
  teacherId: z.number(),
  courseId: z.number().optional()
});

const startSessionSchema = z.object({
  studentId: z.number(),
  teacherId: z.number(),
  roadmapInstanceId: z.number().optional(),
  activityInstanceId: z.number().optional()
});

const endSessionSchema = z.object({
  sessionId: z.number(),
  durationSec: z.number(),
  recordingPath: z.string().optional(),
  transcriptPath: z.string().optional()
});

const postReportSchema = z.object({
  sessionId: z.number(),
  taughtItems: z.object({
    grammar: z.array(z.string()).default([]),
    vocabulary: z.array(z.string()).default([]),
    pronunciation: z.array(z.string()).default([]),
    structures: z.array(z.string()).default([]),
    idioms: z.array(z.string()).default([]),
    other: z.array(z.string()).default([])
  }),
  teacherEdits: z.any().optional(),
  teacherNotes: z.string().optional()
});

const rateSessionSchema = z.object({
  sessionId: z.number(),
  role: z.enum(['student', 'teacher']),
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
  aspectRatings: z.any().optional()
});

// ===========================
// PRE-SESSION 3-MINUTE REVIEW
// ===========================

router.post('/callern/prep', requireAuth, async (req, res) => {
  try {
    const { studentId, teacherId, courseId } = prepSessionSchema.parse(req.body);
    
    // Get student's roadmap instance and current position
    const studentProfile = await storage.getUser(studentId);
    if (!studentProfile) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get active roadmap instance for this student
    const roadmapInstance = courseId 
      ? await storage.getRoadmapInstanceByCourse(courseId, studentId)
      : await storage.getActiveRoadmapInstanceForStudent(studentId);

    if (!roadmapInstance) {
      return res.status(404).json({ message: 'No active roadmap found for student' });
    }

    // Get current position and next activities
    const currentPosition = await storage.getRoadmapPosition(roadmapInstance.id);
    const upcomingActivities = await storage.getUpcomingActivities(roadmapInstance.id, 3);

    // Get last 3 sessions for context
    const recentSessions = await storage.getRecentSessions(studentId, 3);

    // Generate AI-powered pre-session content
    const aiContent = await storage.generatePreSessionContent({
      studentProfile,
      roadmapInstance,
      currentPosition,
      upcomingActivities,
      recentSessions,
      targetLanguage: roadmapInstance.template?.targetLanguage || 'en'
    });

    // Prepare SRS seeds for session
    const srsSeedCards = await storage.prepareSrsSeeds(studentId, aiContent.vocabulary);

    // Rule: If target_language != 'fa' → grammar explained in Farsi
    const grammarExplanationLang = roadmapInstance.template?.targetLanguage !== 'fa' ? 'fa' : 'en';

    const response = {
      countdown_sec: 180,
      grammar_explained_fa: grammarExplanationLang === 'fa' ? aiContent.grammarExplanation : null,
      grammar_explained_en: grammarExplanationLang === 'en' ? aiContent.grammarExplanation : null,
      vocab: aiContent.vocabulary.map(item => ({
        term: item.term,
        definition_en: item.definition_en,
        example_en: item.example_en,
        definition_fa: item.definition_fa || null
      })),
      srs_seed: srsSeedCards,
      session_focus: aiContent.sessionFocus,
      learning_objectives: aiContent.objectives,
      next_button_label_after_countdown: "Let's Go!",
      roadmap_context: {
        template_title: roadmapInstance.template?.title,
        current_unit: currentPosition.unit?.title,
        current_lesson: currentPosition.lesson?.title,
        progress_percentage: roadmapInstance.currentProgress || 0
      }
    };

    // Store pre-session data for teacher briefing
    await storage.storePreSessionData(studentId, teacherId, response);

    res.json(response);
  } catch (error) {
    console.error('Error generating pre-session review:', error);
    res.status(500).json({ message: 'Failed to generate pre-session review' });
  }
});

// ===========================
// TEACHER HUD PRE-BRIEF
// ===========================

router.get('/callern/teacher-brief', requireAuth, async (req, res) => {
  try {
    const { studentId } = req.query;
    
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID required' });
    }

    const student = await storage.getUser(parseInt(studentId as string));
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student's learning data
    const recentSessions = await storage.getRecentSessions(parseInt(studentId as string), 5);
    const roadmapInstance = await storage.getActiveRoadmapInstanceForStudent(parseInt(studentId as string));
    const currentPosition = roadmapInstance ? await storage.getRoadmapPosition(roadmapInstance.id) : null;

    // Calculate session statistics
    const totalMinutes = recentSessions.reduce((sum, session) => sum + (session.durationSec || 0), 0) / 60;
    const totalHours = Math.floor(totalMinutes / 60);

    // Get last session learned items
    const lastSessionReport = recentSessions[0] ? await storage.getSessionReport(recentSessions[0].id) : null;

    // Get student's learning goal and deadline
    const learningGoal = await storage.getStudentLearningGoal(parseInt(studentId as string));

    const briefData = {
      student_name: `${student.firstName} ${student.lastName}`,
      history_brief: `Last ${recentSessions.length} sessions completed. ${totalHours}h ${Math.round(totalMinutes % 60)}m total study time.`,
      goal: learningGoal?.target || `${roadmapInstance?.template?.targetLevel || 'B1'} proficiency`,
      deadline: learningGoal?.deadline || null,
      minutes_completed: Math.round(totalMinutes),
      hours_completed: totalHours,
      last_session_learned: lastSessionReport ? {
        grammar: lastSessionReport.taughtItemsJson?.grammar || [],
        vocab: lastSessionReport.taughtItemsJson?.vocabulary || [],
        pronunciation: lastSessionReport.taughtItemsJson?.pronunciation || []
      } : null,
      roadmap_position: currentPosition ? {
        template_title: roadmapInstance?.template?.title,
        unit: currentPosition.unit?.title,
        lesson: currentPosition.lesson?.title,
        activity: currentPosition.activity?.title,
        progress_percentage: roadmapInstance?.currentProgress || 0
      } : null,
      micro_sessions_per_week: 4, // TODO: Get from student preferences
      student_level: roadmapInstance?.template?.targetLevel || 'A2',
      learning_style: student.preferences?.learningStyle || 'visual',
      areas_to_focus: await storage.getStudentFocusAreas(parseInt(studentId as string))
    };

    res.json(briefData);
  } catch (error) {
    console.error('Error generating teacher brief:', error);
    res.status(500).json({ message: 'Failed to generate teacher brief' });
  }
});

// ===========================
// SESSION MANAGEMENT
// ===========================

router.post('/callern/start', requireAuth, async (req, res) => {
  try {
    const { studentId, teacherId, roadmapInstanceId, activityInstanceId } = startSessionSchema.parse(req.body);

    // Create new call session
    const session = await storage.createCallSession({
      studentId,
      teacherId,
      roadmapInstanceId,
      activityInstanceId,
      startedAt: new Date(),
      status: 'active',
      sessionType: 'callern'
    });

    // Mark teacher as online and in session
    await storage.updateTeacherStatus(teacherId, 'in_session', session.id);

    res.status(201).json({
      message: 'Session started successfully',
      session_id: session.id,
      started_at: session.startedAt,
      webrtc_config: await storage.getWebRTCConfig(), // TURN servers, etc.
      ai_supervisor_enabled: true
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Failed to start session' });
  }
});

router.post('/callern/end', requireAuth, async (req, res) => {
  try {
    const { sessionId, durationSec, recordingPath, transcriptPath } = endSessionSchema.parse(req.body);

    // Update session with end data
    const session = await storage.updateCallSession(sessionId, {
      endedAt: new Date(),
      durationSec,
      recordingPath,
      transcriptPath,
      status: 'completed'
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Mark teacher as available
    await storage.updateTeacherStatus(session.teacherId, 'available');

    // Generate AI summary and next session material
    const aiSummary = await storage.generateSessionSummary({
      sessionId,
      durationSec,
      transcriptPath,
      roadmapInstanceId: session.roadmapInstanceId
    });

    // Create next micro-session content immediately
    const nextSessionPrep = await storage.generateNextMicroSession({
      sessionId,
      studentId: session.studentId,
      roadmapInstanceId: session.roadmapInstanceId,
      lastSessionSummary: aiSummary
    });

    // Store AI-generated post-report
    await storage.createCallPostReport({
      sessionId,
      aiSummaryJson: aiSummary,
      nextSessionPrep,
      teacherConfirmed: false
    });

    res.json({
      message: 'Session ended successfully',
      session_id: sessionId,
      ai_summary: aiSummary,
      next_session_preview: {
        estimated_content: nextSessionPrep.activities?.slice(0, 2) || [],
        focus_areas: nextSessionPrep.focusAreas || [],
        preparation_time: '3 minutes'
      },
      requires_teacher_confirmation: true
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ message: 'Failed to end session' });
  }
});

// ===========================
// POST-SESSION TEACHER CONFIRMATION
// ===========================

router.post('/callern/post-report', requireAuth, async (req, res) => {
  try {
    const { sessionId, taughtItems, teacherEdits, teacherNotes } = postReportSchema.parse(req.body);

    // Get existing post-report
    const existingReport = await storage.getCallPostReport(sessionId);
    if (!existingReport) {
      return res.status(404).json({ message: 'Session report not found' });
    }

    // Update with teacher confirmation
    const updatedReport = await storage.updateCallPostReport(sessionId, {
      taughtItemsJson: taughtItems,
      teacherEditsJson: teacherEdits,
      teacherNotes,
      teacherConfirmed: true
    });

    // Generate SRS cards from confirmed taught items
    const srsCards = await storage.generateSrsCardsFromTaughtItems(sessionId, taughtItems);

    // Update student's roadmap progress based on taught items
    await storage.updateRoadmapProgressFromSession(sessionId, taughtItems);

    res.json({
      message: 'Post-session report confirmed successfully',
      srs_cards_created: srsCards.length,
      roadmap_progress_updated: true,
      report: updatedReport
    });
  } catch (error) {
    console.error('Error confirming post-session report:', error);
    res.status(500).json({ message: 'Failed to confirm post-session report' });
  }
});

// ===========================
// SESSION RATINGS
// ===========================

router.post('/callern/rate', requireAuth, async (req, res) => {
  try {
    const { sessionId, role, score, comment, aspectRatings } = rateSessionSchema.parse(req.body);
    const raterId = req.user.id;

    // Verify session exists and user has permission to rate
    const session = await storage.getCallSession(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is part of the session
    if (role === 'student' && session.studentId !== raterId) {
      return res.status(403).json({ message: 'Only the student can rate as student' });
    }
    if (role === 'teacher' && session.teacherId !== raterId) {
      return res.status(403).json({ message: 'Only the teacher can rate as teacher' });
    }

    // Check if rating already exists
    const existingRating = await storage.getSessionRating(sessionId, raterId, role);
    if (existingRating) {
      return res.status(409).json({ message: 'Rating already exists for this session' });
    }

    // Create rating
    const rating = await storage.createSessionRating({
      sessionId,
      raterRole: role,
      raterId,
      score,
      comment,
      aspectRatings
    });

    // Update overall ratings for teacher/student
    await storage.updateOverallRatings(session, role, score);

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

// ===========================
// ACTIVITY EVIDENCE & SCORING
// ===========================

router.post('/activities/:activityInstanceId/evidence', requireAuth, async (req, res) => {
  try {
    const activityInstanceId = parseInt(req.params.activityInstanceId);
    const { content, attachments, submissionType } = z.object({
      content: z.string().min(1),
      attachments: z.array(z.string()).optional(),
      submissionType: z.enum(['text', 'audio', 'video', 'file']).default('text')
    }).parse(req.body);

    // Create evidence record
    const evidence = await storage.createActivityEvidence({
      activityInstanceId,
      studentId: req.user.id,
      content,
      attachments: attachments || [],
      submissionType,
      submittedAt: new Date()
    });

    // Update activity instance status
    await storage.updateActivityInstanceStatus(activityInstanceId, 'completed');

    res.status(201).json({
      message: 'Evidence submitted successfully',
      evidence
    });
  } catch (error) {
    console.error('Error submitting evidence:', error);
    res.status(500).json({ message: 'Failed to submit evidence' });
  }
});

router.post('/activities/:activityInstanceId/score', requireAuth, async (req, res) => {
  try {
    const activityInstanceId = parseInt(req.params.activityInstanceId);
    const { aiScore, teacherScore, rubricApplied, feedback } = z.object({
      aiScore: z.number().min(0).max(100).optional(),
      teacherScore: z.number().min(0).max(100).optional(),
      rubricApplied: z.any().optional(),
      feedback: z.string().optional()
    }).parse(req.body);

    const userRole = req.user.role;

    // Check permissions - only teachers can override AI scores
    if (teacherScore && !['Admin', 'Teacher'].includes(userRole)) {
      return res.status(403).json({ message: 'Only teachers can provide manual scores' });
    }

    // Update activity instance with scoring
    const scoring = await storage.scoreActivityInstance(activityInstanceId, {
      aiScore,
      teacherScore,
      rubricApplied,
      feedback,
      scoredBy: req.user.id,
      scoredAt: new Date()
    });

    res.json({
      message: 'Activity scored successfully',
      scoring
    });
  } catch (error) {
    console.error('Error scoring activity:', error);
    res.status(500).json({ message: 'Failed to score activity' });
  }
});

export { router as callernFlowRoutes };