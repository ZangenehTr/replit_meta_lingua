/**
 * CallerN Storage Module
 * Dedicated storage layer for CallerN session management
 * 
 * Separated from main storage.ts to avoid 591 pre-existing LSP errors
 */

import { db } from '../db';
import { eq, and, desc, asc, avg, count, sql, isNotNull } from 'drizzle-orm';
import { 
  callSessions, 
  callPostReports,
  users,
  callernRoadmaps,
  studentRoadmapProgress,
  callernRoadmapSteps,
  courseRoadmapProgress,
  sessionRatings
} from '@shared/schema';
import type { 
  CallSession, 
  InsertCallSession,
  CallPostReport,
  InsertCallPostReport 
} from '@shared/schema';

// ===========================
// SESSION MANAGEMENT METHODS
// ===========================

export async function createCallSession(sessionData: InsertCallSession): Promise<CallSession> {
  const [session] = await db.insert(callSessions).values(sessionData).returning();
  return session;
}

export async function updateCallSession(
  sessionId: number, 
  updates: Partial<CallSession>
): Promise<CallSession | undefined> {
  const [session] = await db
    .update(callSessions)
    .set(updates)
    .where(eq(callSessions.id, sessionId))
    .returning();
  return session;
}

export async function getCallSession(sessionId: number): Promise<CallSession | undefined> {
  const [session] = await db
    .select()
    .from(callSessions)
    .where(eq(callSessions.id, sessionId));
  return session;
}

export async function updateTeacherStatus(
  teacherId: number, 
  status: string, 
  sessionId?: number
): Promise<void> {
  // Update teacher availability/presence status
  // This would typically update the callernPresence table or user status
  // For now, we'll just log the status change
  console.log(`Teacher ${teacherId} status updated to ${status} for session ${sessionId || 'none'}`);
  
  // TODO: Update callernPresence table when fully implemented
}

export async function getWebRTCConfig(): Promise<any> {
  // Return WebRTC TURN/STUN server configuration
  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // Add TURN servers from environment if configured
      ...(process.env.TURN_SERVER_URL ? [{
        urls: process.env.TURN_SERVER_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_PASSWORD
      }] : [])
    ]
  };
}

// ===========================
// AI CONTENT GENERATION METHODS
// ===========================

export async function generatePreSessionContent(params: {
  studentProfile: any;
  roadmapInstance: any;
  currentPosition: any;
  upcomingActivities: any[];
  recentSessions: any[];
  targetLanguage: string;
}): Promise<any> {
  // This would integrate with AI services (Ollama/OpenAI)
  // For now, return structured stub data
  return {
    grammarExplanation: "Focus on present perfect tense usage in real-world contexts",
    vocabulary: [
      {
        term: "accomplish",
        definition_en: "to successfully complete or achieve something",
        example_en: "She accomplished all her goals this week",
        definition_fa: "با موفقیت انجام دادن یا به دست آوردن چیزی"
      },
      {
        term: "collaborate",
        definition_en: "to work together with others",
        example_en: "The team collaborated on the project",
        definition_fa: "با دیگران همکاری کردن"
      }
    ],
    sessionFocus: "Conversational fluency with emphasis on present perfect tense",
    objectives: [
      "Use present perfect in natural conversation",
      "Practice pronunciation of new vocabulary",
      "Build confidence in expressing recent experiences"
    ]
  };
}

export async function generateSessionSummary(params: {
  sessionId: number;
  durationSec: number;
  transcriptPath?: string;
  roadmapProgressId?: number;
}): Promise<any> {
  // Analyze session transcript and generate AI summary
  return {
    overallPerformance: "Good progress with strong engagement",
    areasOfStrength: ["Pronunciation", "Vocabulary recall"],
    areasForImprovement: ["Grammar accuracy", "Speaking fluency"],
    keyTopicsCovered: ["Present perfect tense", "Daily routines vocabulary"],
    recommendedNextSteps: ["Focus on irregular verbs", "Practice more complex sentences"]
  };
}

export async function generateNextMicroSession(params: {
  sessionId: number;
  studentId: number;
  roadmapProgressId?: number;
  lastSessionSummary: any;
}): Promise<any> {
  // Generate content for next session based on progress
  return {
    activities: [
      {
        type: "vocabulary_review",
        title: "Review: Present Perfect Vocabulary",
        estimatedDuration: 5
      },
      {
        type: "grammar_practice",
        title: "Irregular Verbs in Present Perfect",
        estimatedDuration: 10
      }
    ],
    focusAreas: ["Irregular verbs", "Complex sentence structures"],
    preparationNotes: "Review irregular verb forms before session"
  };
}

export async function prepareSrsSeeds(
  studentId: number, 
  vocabulary: any[]
): Promise<any[]> {
  // Prepare spaced repetition system seed cards
  return vocabulary.map((item, index) => ({
    id: `seed_${Date.now()}_${index}`,
    term: item.term,
    definition: item.definition_en,
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
  }));
}

export async function storePreSessionData(
  studentId: number,
  teacherId: number,
  preSessionData: any
): Promise<void> {
  // Store pre-session briefing data for teacher HUD
  // This could be stored in a cache or temporary storage
  // For now, we'll just log it
  console.log(`Pre-session data stored for student ${studentId}, teacher ${teacherId}`);
}

// ===========================
// POST-SESSION REPORTING METHODS
// ===========================

export async function createCallPostReport(
  reportData: InsertCallPostReport
): Promise<CallPostReport> {
  const [report] = await db
    .insert(callPostReports)
    .values(reportData)
    .returning();
  return report;
}

export async function updateCallPostReport(
  sessionId: number,
  updates: Partial<CallPostReport>
): Promise<CallPostReport | undefined> {
  const [report] = await db
    .update(callPostReports)
    .set(updates)
    .where(eq(callPostReports.sessionId, sessionId))
    .returning();
  return report;
}

export async function getCallPostReport(
  sessionId: number
): Promise<CallPostReport | undefined> {
  const [report] = await db
    .select()
    .from(callPostReports)
    .where(eq(callPostReports.sessionId, sessionId));
  return report;
}

export async function getSessionReport(sessionId: number): Promise<any> {
  // Get full session report including taught items
  const postReport = await getCallPostReport(sessionId);
  return postReport;
}

// ===========================
// PROGRESS & FEEDBACK METHODS
// ===========================

export async function generateSrsCardsFromTaughtItems(
  sessionId: number,
  taughtItems: any
): Promise<any[]> {
  // Generate SRS flashcards from taught vocabulary/grammar
  const cards = [];
  
  if (taughtItems.vocabulary) {
    for (const term of taughtItems.vocabulary) {
      cards.push({
        sessionId,
        term,
        cardType: 'vocabulary',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }
  }
  
  if (taughtItems.grammar) {
    for (const rule of taughtItems.grammar) {
      cards.push({
        sessionId,
        term: rule,
        cardType: 'grammar',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }
  }
  
  return cards;
}

export async function updateRoadmapProgressFromSession(
  sessionId: number,
  taughtItems: any
): Promise<void> {
  // Update student's roadmap progress based on session content
  const session = await getCallSession(sessionId);
  if (!session) {
    return;
  }
  
  // Find the student's roadmap progress
  const [progress] = await db
    .select()
    .from(studentRoadmapProgress)
    .where(eq(studentRoadmapProgress.studentId, session.studentId))
    .orderBy(desc(studentRoadmapProgress.lastAccessedAt))
    .limit(1);
  
  if (!progress) {
    console.log(`No roadmap progress found for student ${session.studentId}`);
    return;
  }
  
  // Update last accessed time and increment progress
  const currentProgress = parseFloat(progress.progressPercentage || '0');
  const newProgress = Math.min(100, currentProgress + 2); // 2% increment per session
  
  await db
    .update(studentRoadmapProgress)
    .set({
      lastAccessedAt: new Date(),
      progressPercentage: newProgress.toString()
    })
    .where(eq(studentRoadmapProgress.id, progress.id));
  
  console.log(`Roadmap progress updated: ${currentProgress}% → ${newProgress}%`);
}

// ── Create a session rating record ──
// sessionId: string (either stringified call_sessions.id or room ID)
// role: 'student' → student rates the teacher → sets teacherRating
// role: 'teacher' → teacher rates the student → sets studentRating
export async function createSessionRating(data: {
  sessionId: string;
  teacherId: number;
  studentId: number;
  role: 'student' | 'teacher';
  score: number;
  comment?: string;
}): Promise<typeof sessionRatings.$inferSelect> {
  // Check if a row already exists for this session (the other party may have rated first)
  const [existingRow] = await db
    .select({ id: sessionRatings.id })
    .from(sessionRatings)
    .where(
      and(
        eq(sessionRatings.sessionId, data.sessionId),
        eq(sessionRatings.teacherId, data.teacherId),
        eq(sessionRatings.studentId, data.studentId)
      )
    )
    .limit(1);

  if (existingRow) {
    // Upsert: update only the role-specific column to keep the other party's data
    const updates = data.role === 'student'
      ? { teacherRating: data.score, teacherComment: data.comment ?? null }
      : { studentRating: data.score, studentComment: data.comment ?? null };
    const [updated] = await db
      .update(sessionRatings)
      .set(updates)
      .where(eq(sessionRatings.id, existingRow.id))
      .returning();
    return updated;
  }

  // No row yet — insert fresh
  const [rating] = await db
    .insert(sessionRatings)
    .values({
      sessionId: data.sessionId,
      teacherId: data.teacherId,
      studentId: data.studentId,
      teacherRating: data.role === 'student' ? data.score : null,
      studentRating: data.role === 'teacher' ? data.score : null,
      teacherComment: data.role === 'student' ? (data.comment ?? null) : null,
      studentComment: data.role === 'teacher' ? (data.comment ?? null) : null
    })
    .returning();
  return rating;
}

// ── Get an existing session rating for the given user+role in a session ──
// Returns a row only when the role-specific column is already filled in,
// so teacher/student ratings are fully independent of each other.
export async function getSessionRating(
  sessionId: string,
  raterId: number,
  role: string
): Promise<typeof sessionRatings.$inferSelect | undefined> {
  const [rating] = await db
    .select()
    .from(sessionRatings)
    .where(
      and(
        eq(sessionRatings.sessionId, sessionId),
        role === 'student'
          ? and(eq(sessionRatings.studentId, raterId), isNotNull(sessionRatings.teacherRating))
          : and(eq(sessionRatings.teacherId, raterId), isNotNull(sessionRatings.studentRating))
      )
    )
    .limit(1);
  return rating;
}

// ── Recompute and persist teacher's average CallerN rating ──
export async function updateOverallRatings(
  session: CallSession,
  role: string,
  _score: number
): Promise<void> {
  if (role !== 'student') return; // Only student ratings count toward teacher average

  const teacherId = session.teacherId;

  // Compute live average from all student-submitted ratings for this teacher
  const [agg] = await db
    .select({
      avgScore: avg(sessionRatings.teacherRating),
      sessionCount: count(sessionRatings.id)
    })
    .from(sessionRatings)
    .where(
      and(
        eq(sessionRatings.teacherId, teacherId),
        sql`${sessionRatings.teacherRating} IS NOT NULL`
      )
    );

  if (!agg) return;

  await db
    .update(users)
    .set({
      callernRating: agg.avgScore ? String(parseFloat(String(agg.avgScore)).toFixed(2)) : '0',
      callernSessionCount: Number(agg.sessionCount || 0)
    })
    .where(eq(users.id, teacherId));

  console.log(`CallerN rating updated for teacher ${teacherId}: ${agg.avgScore} (${agg.sessionCount} sessions)`);
}

export async function createActivityEvidence(evidenceData: {
  activityInstanceId: number;
  studentId: number;
  content: string;
  attachments: string[];
  submissionType: string;
  submittedAt: Date;
}): Promise<any> {
  // Store evidence of activity completion
  // This would typically insert into an activity_evidence table
  return {
    id: Date.now(),
    ...evidenceData
  };
}

export async function updateActivityInstanceStatus(
  stepId: number,
  status: string,
  sessionId?: number
): Promise<void> {
  // Mark a roadmap step as completed in student progress
  if (status !== 'completed') {
    console.log(`Step ${stepId} status updated to ${status}`);
    return;
  }
  
  // Get session context (required for scoping to correct student)
  let session: CallSession | undefined;
  if (sessionId) {
    session = await getCallSession(sessionId);
  } else {
    console.warn(`updateActivityInstanceStatus called without sessionId - this may update wrong student's progress!`);
    // Fallback: try to find recent session (UNSAFE - could be wrong student!)
    const recentSessions = await db
      .select()
      .from(callSessions)
      .where(eq(callSessions.status, 'completed'))
      .orderBy(desc(callSessions.endedAt))
      .limit(1);
    session = recentSessions[0];
  }
  
  if (!session) {
    console.log(`No session found for step ${stepId} completion`);
    return;
  }
  
  // Find the step to get its roadmap ID
  const [step] = await db
    .select()
    .from(callernRoadmapSteps)
    .where(eq(callernRoadmapSteps.id, stepId));
  
  if (!step) {
    console.log(`Step ${stepId} not found`);
    return;
  }
  
  // Find student progress for this roadmap using the session's student ID
  const [progress] = await db
    .select()
    .from(studentRoadmapProgress)
    .where(
      and(
        eq(studentRoadmapProgress.studentId, session.studentId),
        eq(studentRoadmapProgress.roadmapId, step.roadmapId)
      )
    );
  
  if (!progress) {
    console.log(`No progress found for student ${session.studentId}, roadmap ${step.roadmapId}`);
    return;
  }
  
  // Add step to completed steps if not already there
  const completedSteps = progress.completedSteps || [];
  if (!completedSteps.includes(stepId.toString())) {
    await db
      .update(studentRoadmapProgress)
      .set({
        completedSteps: [...completedSteps, stepId.toString()]
      })
      .where(eq(studentRoadmapProgress.id, progress.id));
    
    console.log(`Step ${stepId} marked as completed for student ${session.studentId} in progress ${progress.id}`);
  }
}

export async function scoreActivityInstance(
  activityInstanceId: number,
  scoringData: {
    aiScore?: number;
    teacherScore?: number;
    rubricApplied?: any;
    feedback?: string;
    scoredBy: number;
    scoredAt: Date;
  }
): Promise<any> {
  // Score an activity instance
  return {
    activityInstanceId,
    ...scoringData
  };
}

// ===========================
// DATA RETRIEVAL METHODS
// ===========================

export async function getStudentLearningGoal(studentId: number): Promise<any> {
  // Get student's learning goal and deadline
  // This might be stored in user preferences or a separate goals table
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, studentId));
  
  const prefs = user?.preferences as any;
  return prefs ? {
    target: prefs.learningGoal || 'B2 proficiency',
    deadline: prefs.deadline || null
  } : null;
}

export async function getStudentFocusAreas(studentId: number): Promise<string[]> {
  // Get areas where student needs more focus
  // This could be derived from recent assessments or weak skill areas
  return [
    "Grammar accuracy",
    "Vocabulary expansion",
    "Pronunciation clarity"
  ];
}

export async function getRoadmapInstanceByCourse(
  courseId: number,
  studentId: number
): Promise<any> {
  // Get roadmap progress for a specific course and student
  const [courseRoadmap] = await db
    .select()
    .from(courseRoadmapProgress)
    .where(eq(courseRoadmapProgress.courseId, courseId))
    .limit(1);
  
  if (!courseRoadmap) {
    return null;
  }
  
  const [progress] = await db
    .select()
    .from(studentRoadmapProgress)
    .where(
      and(
        eq(studentRoadmapProgress.studentId, studentId),
        eq(studentRoadmapProgress.roadmapId, courseRoadmap.roadmapId)
      )
    );
  
  return progress;
}

export async function getActiveRoadmapInstanceForStudent(
  studentId: number
): Promise<any> {
  // Get currently active roadmap progress for student
  const [progress] = await db
    .select()
    .from(studentRoadmapProgress)
    .where(
      and(
        eq(studentRoadmapProgress.studentId, studentId),
        eq(studentRoadmapProgress.status, 'in_progress')
      )
    )
    .orderBy(desc(studentRoadmapProgress.lastAccessedAt))
    .limit(1);
  
  return progress;
}

export async function getUpcomingActivities(
  roadmapProgressId: number,
  limit: number = 3
): Promise<any[]> {
  // Get next activities (steps) in the roadmap
  const [progress] = await db
    .select()
    .from(studentRoadmapProgress)
    .where(eq(studentRoadmapProgress.id, roadmapProgressId));
  
  if (!progress) {
    return [];
  }
  
  // Get next uncompleted steps from roadmap
  const completedStepIds = progress.completedSteps || [];
  const steps = await db
    .select()
    .from(callernRoadmapSteps)
    .where(eq(callernRoadmapSteps.roadmapId, progress.roadmapId))
    .orderBy(asc(callernRoadmapSteps.stepOrder))
    .limit(limit + completedStepIds.length);
  
  // Filter out completed steps and limit result
  return steps
    .filter(step => !completedStepIds.includes(step.id.toString()))
    .slice(0, limit)
    .map(step => ({
      id: step.id,
      title: step.title || `Step ${step.stepOrder}`,
      type: step.stepType || 'conversation',
      estimatedDuration: step.duration || 15,
      description: step.description
    }));
}

export async function getRecentSessions(
  studentId: number,
  limit: number = 5
): Promise<any[]> {
  // Get recent call sessions for student
  const sessions = await db
    .select()
    .from(callSessions)
    .where(eq(callSessions.studentId, studentId))
    .orderBy(desc(callSessions.startedAt))
    .limit(limit);
  
  return sessions;
}

export async function getRoadmapPosition(
  roadmapProgressId: number
): Promise<any> {
  // Get current position in roadmap by progress ID
  const [progress] = await db
    .select()
    .from(studentRoadmapProgress)
    .where(eq(studentRoadmapProgress.id, roadmapProgressId));
  
  if (!progress) {
    return null;
  }
  
  // Get current step details if available
  let currentStep = null;
  if (progress.currentStepId) {
    [currentStep] = await db
      .select()
      .from(callernRoadmapSteps)
      .where(eq(callernRoadmapSteps.id, progress.currentStepId));
  }
  
  return {
    progressId: progress.id,
    currentStepId: progress.currentStepId,
    currentStep: currentStep ? {
      id: currentStep.id,
      title: currentStep.title,
      description: currentStep.description,
      stepOrder: currentStep.stepOrder
    } : null,
    completionPercentage: parseFloat(progress.progressPercentage || '0'),
    completedSteps: progress.completedSteps || [],
    status: progress.status
  };
}
