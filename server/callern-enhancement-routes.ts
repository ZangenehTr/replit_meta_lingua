import type { Express } from "express";
import { db } from "./db";
import { 
  callernCallHistory, 
  suggestedTerms, 
  rewriteSuggestions,
  glossaryItems,
  quizResults,
  emailLogs,
  auditLogs,
  studentPreferences,
  users
} from "@shared/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { authenticateToken, requireRole } from "./auth-middleware";
import { z } from "zod";
import { transcriptParser } from "./services/transcript-parser";
import { suggestionEngine } from "./services/suggestion-engine";
import { rewriteEngine } from "./services/rewrite-engine";
import { emailService } from "./services/email-service";
import { srsService } from "./services/srs-service";

// Validation schemas
const recordingConsentSchema = z.object({
  consent: z.boolean()
});

const transcriptUploadSchema = z.object({
  transcriptUrl: z.string(),
  language: z.string().length(2).optional()
});

const suggestedTermSchema = z.object({
  term: z.string(),
  partOfSpeech: z.string().optional(),
  cefrLevel: z.string().optional(),
  definition: z.string().optional(),
  example: z.string().optional(),
  timestamp: z.number().optional()
});

const bulkGlossarySchema = z.object({
  items: z.array(z.object({
    term: z.string(),
    definition: z.string(),
    partOfSpeech: z.string().optional(),
    cefrLevel: z.string().optional(),
    example: z.string().optional(),
    sourceCallId: z.number().optional()
  }))
});

const emailRequestSchema = z.object({
  templateType: z.enum(['CALL_SUMMARY', 'WEEKLY_RECAP']),
  data: z.record(z.any()).optional()
});

// Helper function to log audit trail
async function logAudit(userId: number, userRole: string, action: string, resourceType: string, resourceId?: number, details?: any, req?: any) {
  await db.insert(auditLogs).values({
    userId,
    userRole,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('user-agent')
  });
}

// Helper function to check call access permissions
async function checkCallAccess(callId: number, userId: number, userRole: string): Promise<boolean> {
  const call = await db.select().from(callernCallHistory).where(eq(callernCallHistory.id, callId)).limit(1);
  
  if (!call[0]) return false;
  
  // Admin and Supervisor can access all calls
  if (userRole === 'Admin' || userRole === 'Supervisor') return true;
  
  // Teacher can access their own calls
  if (userRole === 'Teacher' && call[0].teacherId === userId) return true;
  
  // Student can access their own calls
  if (userRole === 'Student' && call[0].studentId === userId) return true;
  
  // Mentor can access calls of students they mentor
  if (userRole === 'Mentor') {
    // Check if this mentor is assigned to this student
    // This would require additional logic to check mentor assignments
    // For now, returning false for security
    return false;
  }
  
  return false;
}

export function setupCallernEnhancementRoutes(app: Express) {
  
  // ===== RECORDING ENDPOINTS =====
  
  // Start recording (requires consent from both parties)
  app.post("/api/callern/:id/record/start", authenticateToken, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;
      const { consent } = recordingConsentSchema.parse(req.body);
      
      // Check access permissions
      if (!await checkCallAccess(callId, userId, userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get the call
      const call = await db.select().from(callernCallHistory).where(eq(callernCallHistory.id, callId)).limit(1);
      if (!call[0]) {
        return res.status(404).json({ error: "Call not found" });
      }
      
      // Update consent based on role
      const updateData: any = {};
      if ((userRole === 'Student' && userId === call[0].studentId) || userRole === 'Admin') {
        updateData.studentConsentRecording = consent;
      }
      if ((userRole === 'Teacher' && userId === call[0].teacherId) || userRole === 'Admin') {
        updateData.teacherConsentRecording = consent;
      }
      
      if (consent) {
        updateData.consentRecordingAt = new Date();
      }
      
      await db.update(callernCallHistory)
        .set(updateData)
        .where(eq(callernCallHistory.id, callId));
      
      // Log audit
      await logAudit(userId, userRole, 'RECORDING_CONSENT', 'callern_call', callId, { consent }, req);
      
      // Check if both parties have consented
      const updatedCall = await db.select().from(callernCallHistory).where(eq(callernCallHistory.id, callId)).limit(1);
      const canRecord = updatedCall[0].studentConsentRecording && updatedCall[0].teacherConsentRecording;
      
      res.json({ 
        success: true, 
        canRecord,
        message: canRecord ? "Recording can start" : "Waiting for other party's consent"
      });
    } catch (error: any) {
      console.error("Error starting recording:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // End recording
  app.post("/api/callern/:id/record/end", authenticateToken, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Check access permissions
      if (!await checkCallAccess(callId, userId, userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Here you would stop the actual recording process
      // For now, we'll just update the status
      
      await logAudit(userId, userRole, 'RECORDING_ENDED', 'callern_call', callId, {}, req);
      
      res.json({ success: true, message: "Recording ended" });
    } catch (error: any) {
      console.error("Error ending recording:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // ===== TRANSCRIPT ENDPOINTS =====
  
  // Upload/attach transcript
  app.post("/api/callern/:id/transcript", authenticateToken, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;
      const { transcriptUrl, language } = transcriptUploadSchema.parse(req.body);
      
      // Admin and Teacher can attach transcript, Student only if it's their call
      const call = await db.select().from(callernCallHistory).where(eq(callernCallHistory.id, callId)).limit(1);
      if (!call[0]) {
        return res.status(404).json({ error: "Call not found" });
      }
      
      const canAttach = userRole === 'Admin' || 
                       userRole === 'Teacher' ||
                       (userRole === 'Student' && call[0].studentId === userId);
      
      if (!canAttach) {
        return res.status(403).json({ error: "Permission denied" });
      }
      
      // Update call with transcript
      await db.update(callernCallHistory)
        .set({
          transcriptUrl,
          transcriptLang: language || 'en'
        })
        .where(eq(callernCallHistory.id, callId));
      
      // Parse transcript for utterances
      const parsedTranscript = await transcriptParser.parse(transcriptUrl);
      
      await logAudit(userId, userRole, 'TRANSCRIPT_UPLOADED', 'callern_call', callId, { language }, req);
      
      res.json({ 
        success: true, 
        utterances: parsedTranscript.utterances,
        errors: parsedTranscript.commonErrors 
      });
    } catch (error: any) {
      console.error("Error uploading transcript:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // ===== AI SUMMARY ENDPOINT =====
  
  // Generate AI summary
  app.post("/api/callern/:id/summary", authenticateToken, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Check access permissions
      if (!await checkCallAccess(callId, userId, userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get call with transcript
      const call = await db.select().from(callernCallHistory).where(eq(callernCallHistory.id, callId)).limit(1);
      if (!call[0] || !call[0].transcriptUrl) {
        return res.status(400).json({ error: "No transcript available for this call" });
      }
      
      // Generate AI summary (mock for now, would integrate with actual AI service)
      const aiSummary = {
        mainTopics: ["Grammar practice", "Vocabulary building"],
        keyPoints: ["Practiced past tense", "Learned 10 new words"],
        areasOfImprovement: ["Pronunciation of 'th' sound", "Use of articles"],
        recommendations: ["Practice tongue placement for 'th'", "Review article rules"],
        overallScore: 7.5
      };
      
      // Store summary
      await db.update(callernCallHistory)
        .set({
          aiSummaryJson: aiSummary
        })
        .where(eq(callernCallHistory.id, callId));
      
      await logAudit(userId, userRole, 'AI_SUMMARY_GENERATED', 'callern_call', callId, {}, req);
      
      res.json({ success: true, summary: aiSummary });
    } catch (error: any) {
      console.error("Error generating summary:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // ===== SUGGESTIONS ENDPOINTS =====
  
  // Post live suggestions (teacher or AI)
  app.post("/api/callern/:id/suggestions/live", authenticateToken, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;
      const suggestion = suggestedTermSchema.parse(req.body);
      
      // Only teachers can post suggestions (AI would use system account)
      if (userRole !== 'Teacher' && userRole !== 'Admin') {
        return res.status(403).json({ error: "Only teachers can post suggestions" });
      }
      
      // Check if teacher is in this call
      const call = await db.select().from(callernCallHistory).where(eq(callernCallHistory.id, callId)).limit(1);
      if (!call[0] || (userRole === 'Teacher' && call[0].teacherId !== userId)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Insert suggestion
      const newSuggestion = await db.insert(suggestedTerms)
        .values({
          callId,
          term: suggestion.term,
          partOfSpeech: suggestion.partOfSpeech,
          cefrLevel: suggestion.cefrLevel,
          definition: suggestion.definition,
          example: suggestion.example,
          suggestedBy: userRole === 'Teacher' ? 'teacher' : 'ai',
          timestamp: suggestion.timestamp
        })
        .returning();
      
      await logAudit(userId, userRole, 'SUGGESTION_POSTED', 'suggested_term', newSuggestion[0].id, suggestion, req);
      
      res.json({ success: true, suggestion: newSuggestion[0] });
    } catch (error: any) {
      console.error("Error posting suggestion:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Get suggestions for a call
  app.get("/api/callern/:id/suggestions", authenticateToken, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Check access permissions
      if (!await checkCallAccess(callId, userId, userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get all suggestions for this call
      const suggestions = await db.select()
        .from(suggestedTerms)
        .where(eq(suggestedTerms.callId, callId))
        .orderBy(suggestedTerms.timestamp);
      
      res.json(suggestions);
    } catch (error: any) {
      console.error("Error fetching suggestions:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // ===== REWRITE ENDPOINTS =====
  
  // Generate rewrites
  app.post("/api/callern/:id/rewrites/generate", authenticateToken, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Check access permissions
      if (!await checkCallAccess(callId, userId, userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get transcript
      const call = await db.select().from(callernCallHistory).where(eq(callernCallHistory.id, callId)).limit(1);
      if (!call[0] || !call[0].transcriptUrl) {
        return res.status(400).json({ error: "No transcript available" });
      }
      
      // Parse transcript and generate rewrites
      const transcript = await transcriptParser.parse(call[0].transcriptUrl);
      const rewrites = await rewriteEngine.generateRewrites(transcript.utterances);
      
      // Store rewrites
      for (const rewrite of rewrites) {
        await db.insert(rewriteSuggestions).values({
          callId,
          originalUtterance: rewrite.original,
          improvedVersion: rewrite.improved,
          cefrLevel: rewrite.cefrLevel,
          timestamp: rewrite.timestamp,
          notes: rewrite.notes
        });
      }
      
      await logAudit(userId, userRole, 'REWRITES_GENERATED', 'callern_call', callId, { count: rewrites.length }, req);
      
      res.json({ success: true, rewrites });
    } catch (error: any) {
      console.error("Error generating rewrites:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Get rewrites for a call
  app.get("/api/callern/:id/rewrites", authenticateToken, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Check access permissions
      if (!await checkCallAccess(callId, userId, userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const rewrites = await db.select()
        .from(rewriteSuggestions)
        .where(eq(rewriteSuggestions.callId, callId))
        .orderBy(rewriteSuggestions.timestamp);
      
      res.json(rewrites);
    } catch (error: any) {
      console.error("Error fetching rewrites:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // ===== GLOSSARY ENDPOINTS =====
  
  // Get student's glossary
  app.get("/api/glossary", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Students can only see their own glossary
      if (userRole !== 'Student') {
        return res.status(403).json({ error: "Only students can access glossary" });
      }
      
      const glossary = await db.select()
        .from(glossaryItems)
        .where(eq(glossaryItems.studentId, userId))
        .orderBy(desc(glossaryItems.createdAt));
      
      res.json(glossary);
    } catch (error: any) {
      console.error("Error fetching glossary:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Get due items for SRS review
  app.get("/api/glossary/due", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      if (userRole !== 'Student') {
        return res.status(403).json({ error: "Only students can access glossary" });
      }
      
      const now = new Date();
      const dueItems = await db.select()
        .from(glossaryItems)
        .where(
          and(
            eq(glossaryItems.studentId, userId),
            gte(now, glossaryItems.srsDueAt)
          )
        )
        .orderBy(glossaryItems.srsDueAt);
      
      res.json(dueItems);
    } catch (error: any) {
      console.error("Error fetching due items:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Bulk add to glossary
  app.post("/api/glossary/bulk", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { items } = bulkGlossarySchema.parse(req.body);
      
      if (userRole !== 'Student') {
        return res.status(403).json({ error: "Only students can add to glossary" });
      }
      
      // Add items to glossary with initial SRS settings
      const newItems = [];
      for (const item of items) {
        const srsDue = srsService.calculateInitialDue();
        const inserted = await db.insert(glossaryItems)
          .values({
            studentId: userId,
            term: item.term,
            definition: item.definition,
            partOfSpeech: item.partOfSpeech,
            cefrLevel: item.cefrLevel,
            example: item.example,
            sourceCallId: item.sourceCallId,
            srsStrength: 0,
            srsDueAt: srsDue,
            srsReviewCount: 0
          })
          .returning();
        newItems.push(inserted[0]);
      }
      
      await logAudit(userId, userRole, 'GLOSSARY_BULK_ADD', 'glossary', null, { count: items.length }, req);
      
      res.json({ success: true, items: newItems });
    } catch (error: any) {
      console.error("Error adding to glossary:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Submit quiz result and update SRS
  app.post("/api/glossary/:itemId/quiz", authenticateToken, async (req: any, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const userId = req.user.id;
      const userRole = req.user.role;
      const { questionType, wasCorrect, responseTime } = req.body;
      
      if (userRole !== 'Student') {
        return res.status(403).json({ error: "Only students can submit quiz results" });
      }
      
      // Verify item belongs to student
      const item = await db.select()
        .from(glossaryItems)
        .where(
          and(
            eq(glossaryItems.id, itemId),
            eq(glossaryItems.studentId, userId)
          )
        )
        .limit(1);
      
      if (!item[0]) {
        return res.status(404).json({ error: "Glossary item not found" });
      }
      
      // Record quiz result
      await db.insert(quizResults).values({
        studentId: userId,
        glossaryItemId: itemId,
        questionType,
        wasCorrect,
        responseTime
      });
      
      // Update SRS based on result
      const { newStrength, nextDue } = srsService.updateStrength(
        item[0].srsStrength || 0,
        wasCorrect
      );
      
      await db.update(glossaryItems)
        .set({
          srsStrength: newStrength,
          srsDueAt: nextDue,
          srsLastReviewedAt: new Date(),
          srsReviewCount: (item[0].srsReviewCount || 0) + 1
        })
        .where(eq(glossaryItems.id, itemId));
      
      res.json({ 
        success: true, 
        newStrength,
        nextDue,
        message: wasCorrect ? "Correct! Item strength increased." : "Keep practicing!"
      });
    } catch (error: any) {
      console.error("Error submitting quiz result:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // ===== EMAIL ENDPOINTS =====
  
  // Send email
  app.post("/api/email/send", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { templateType, data } = emailRequestSchema.parse(req.body);
      
      // Get user email and preferences
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user[0]) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check preferences
      const prefs = await db.select()
        .from(studentPreferences)
        .where(eq(studentPreferences.studentId, userId))
        .limit(1);
      
      if (prefs[0]) {
        if (templateType === 'CALL_SUMMARY' && !prefs[0].emailCallSummaries) {
          return res.status(400).json({ error: "Call summaries disabled in preferences" });
        }
        if (templateType === 'WEEKLY_RECAP' && !prefs[0].emailWeeklyRecap) {
          return res.status(400).json({ error: "Weekly recap disabled in preferences" });
        }
      }
      
      // Prepare email
      const emailData = await emailService.prepareEmail(templateType, userId, data);
      
      // Log email
      const emailLog = await db.insert(emailLogs)
        .values({
          recipientId: userId,
          recipientEmail: user[0].email,
          templateType,
          subject: emailData.subject,
          contentJson: emailData.content,
          status: 'pending'
        })
        .returning();
      
      // Send email (mock for now)
      const sent = await emailService.send(user[0].email, emailData);
      
      // Update status
      await db.update(emailLogs)
        .set({
          status: sent ? 'sent' : 'failed',
          sentAt: sent ? new Date() : null,
          errorMessage: sent ? null : 'Failed to send'
        })
        .where(eq(emailLogs.id, emailLog[0].id));
      
      await logAudit(userId, userRole, 'EMAIL_SENT', 'email', emailLog[0].id, { templateType }, req);
      
      res.json({ success: sent, emailId: emailLog[0].id });
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // ===== STUDENT PREFERENCES =====
  
  // Get preferences
  app.get("/api/student/preferences", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const prefs = await db.select()
        .from(studentPreferences)
        .where(eq(studentPreferences.studentId, userId))
        .limit(1);
      
      if (!prefs[0]) {
        // Create default preferences
        const newPrefs = await db.insert(studentPreferences)
          .values({
            studentId: userId,
            showLiveSuggestions: true,
            emailCallSummaries: true,
            emailWeeklyRecap: true,
            preferredLanguage: 'en'
          })
          .returning();
        return res.json(newPrefs[0]);
      }
      
      res.json(prefs[0]);
    } catch (error: any) {
      console.error("Error fetching preferences:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Update preferences
  app.put("/api/student/preferences", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      
      const updated = await db.update(studentPreferences)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(studentPreferences.studentId, userId))
        .returning();
      
      if (!updated[0]) {
        // Create if doesn't exist
        const created = await db.insert(studentPreferences)
          .values({
            studentId: userId,
            ...updates
          })
          .returning();
        return res.json(created[0]);
      }
      
      res.json(updated[0]);
    } catch (error: any) {
      console.error("Error updating preferences:", error);
      res.status(400).json({ error: error.message });
    }
  });
}