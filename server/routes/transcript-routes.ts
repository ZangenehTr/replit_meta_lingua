/**
 * Transcript Routes - Where users can view real transcriptions
 * NO MOCK DATA - Serves actual conversation transcripts from video calls
 */

import express from 'express';
import { authenticateToken, requireRole } from '../auth';
import { DatabaseStorage } from '../database-storage';
import { TranscriptParser } from '../services/transcript-parser';
import { PostSessionGenerator } from '../services/post-session-generator';
import { MaterialAdaptationService } from '../services/material-adaptation-service';
import { OllamaService } from '../services/ollama-service';

const router = express.Router();
const storage = new DatabaseStorage();
const transcriptParser = new TranscriptParser();
const ollamaService = new OllamaService();
const postSessionGenerator = new PostSessionGenerator(ollamaService, null as any);
const materialAdapter = new MaterialAdaptationService(storage, ollamaService);

/**
 * GET /api/transcripts/sessions/:sessionId
 * View transcript for a specific session
 */
router.get('/sessions/:sessionId', authenticateToken, async (req: any, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const userId = req.user.id;
    
    // Verify user has access to this session transcript
    const session = await storage.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Check if user is student, teacher, or admin for this session
    const hasAccess = 
      session.studentId === userId ||
      session.teacherId === userId ||
      req.user.role === 'Admin' ||
      req.user.role === 'Supervisor';
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this transcript' });
    }
    
    // Get real transcript from session recording
    const recording = await storage.getSessionRecording(sessionId);
    if (!recording) {
      return res.status(404).json({ 
        message: 'No recording found for this session',
        availableTranscripts: false
      });
    }
    
    // Parse real transcript data
    let transcript;
    if (recording.transcriptUrl) {
      transcript = await transcriptParser.parse(recording.transcriptUrl);
    } else if (recording.transcriptText) {
      transcript = await transcriptParser.parse(recording.transcriptText);
    } else {
      return res.status(404).json({ 
        message: 'No transcript data available for this session',
        recordingExists: true,
        transcriptProcessed: false
      });
    }
    
    console.log(`✓ Serving real transcript for session ${sessionId} with ${transcript.utterances.length} utterances`);
    
    res.json({
      sessionId,
      transcript,
      metadata: {
        duration: transcript.duration,
        utteranceCount: transcript.utterances.length,
        studentUtterances: transcript.utterances.filter(u => u.speaker === 'student').length,
        teacherUtterances: transcript.utterances.filter(u => u.speaker === 'teacher').length,
        commonErrors: transcript.commonErrors,
        recordedAt: recording.createdAt,
        processingComplete: true
      }
    });
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve transcript',
      error: error.message 
    });
  }
});

/**
 * GET /api/transcripts/student/:studentId
 * View all transcripts for a student
 */
router.get('/student/:studentId', authenticateToken, async (req: any, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const userId = req.user.id;
    
    // Check access rights
    const hasAccess = 
      studentId === userId ||
      req.user.role === 'Admin' ||
      req.user.role === 'Teacher' ||
      req.user.role === 'Supervisor';
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get student's session recordings
    const recordings = await storage.getStudentRecordings(studentId);
    
    const transcriptSummaries = [];
    
    for (const recording of recordings) {
      if (recording.transcriptUrl || recording.transcriptText) {
        try {
          const transcript = recording.transcriptUrl 
            ? await transcriptParser.parse(recording.transcriptUrl)
            : await transcriptParser.parse(recording.transcriptText);
          
          transcriptSummaries.push({
            sessionId: recording.sessionId,
            recordingId: recording.id,
            date: recording.createdAt,
            duration: transcript.duration,
            utteranceCount: transcript.utterances.length,
            topicsDiscussed: extractTopics(transcript.utterances),
            errorCount: transcript.commonErrors.length,
            hasFullTranscript: true
          });
        } catch (parseError) {
          console.error(`Error parsing transcript for recording ${recording.id}:`, parseError);
          transcriptSummaries.push({
            sessionId: recording.sessionId,
            recordingId: recording.id,
            date: recording.createdAt,
            duration: 0,
            hasFullTranscript: false,
            error: 'Failed to parse transcript'
          });
        }
      }
    }
    
    console.log(`✓ Serving ${transcriptSummaries.length} transcript summaries for student ${studentId}`);
    
    res.json({
      studentId,
      transcripts: transcriptSummaries,
      totalSessions: transcriptSummaries.length,
      availableTranscripts: transcriptSummaries.filter(t => t.hasFullTranscript).length
    });
    
  } catch (error) {
    console.error('Error fetching student transcripts:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve transcripts',
      error: error.message 
    });
  }
});

/**
 * POST /api/transcripts/sessions/:sessionId/generate-practice
 * Generate post-session practice from real transcript
 */
router.post('/sessions/:sessionId/generate-practice', authenticateToken, async (req: any, res) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;
    
    // Get session and verify access
    const session = await storage.getSessionById(parseInt(sessionId));
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    const hasAccess = 
      session.studentId === userId ||
      session.teacherId === userId ||
      req.user.role === 'Admin';
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get real transcript
    const recording = await storage.getSessionRecording(parseInt(sessionId));
    if (!recording || (!recording.transcriptUrl && !recording.transcriptText)) {
      return res.status(404).json({ 
        message: 'No transcript available for practice generation' 
      });
    }
    
    const transcript = recording.transcriptUrl 
      ? await transcriptParser.parse(recording.transcriptUrl)
      : await transcriptParser.parse(recording.transcriptText);
    
    // Generate real post-session practice materials
    const practice = await postSessionGenerator.generatePostSessionPractice(
      sessionId,
      session.studentId,
      session.teacherId,
      transcript,
      req.body.studentLevel || 'B1'
    );
    
    // Save to database
    await storage.savePostSessionPractice(practice);
    
    console.log(`✓ Generated ${practice.flashcards.length} flashcards and ${practice.grammarExercises.length} exercises from real transcript`);
    
    res.json({
      success: true,
      practice,
      generated: {
        flashcards: practice.flashcards.length,
        grammarExercises: practice.grammarExercises.length,
        vocabularyDrills: practice.vocabularyDrills.length,
        listeningPractice: practice.listeningPractice.length,
        basedOnRealData: true
      }
    });
    
  } catch (error) {
    console.error('Error generating practice materials:', error);
    res.status(500).json({ 
      message: 'Failed to generate practice materials',
      error: error.message 
    });
  }
});

/**
 * GET /api/transcripts/student/:studentId/adapt-materials
 * Get adapted materials for upcoming sessions
 */
router.get('/student/:studentId/adapt-materials', authenticateToken, async (req: any, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const userId = req.user.id;
    
    // Check access
    const hasAccess = 
      studentId === userId ||
      req.user.role === 'Admin' ||
      req.user.role === 'Teacher';
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Generate adapted materials based on real performance
    const adaptedMaterials = await materialAdapter.adaptMaterialsForStudent(studentId);
    
    console.log(`✓ Generated adapted materials for student ${studentId} at ${adaptedMaterials.recommendedLevel} level`);
    
    res.json({
      success: true,
      studentId,
      adaptedMaterials,
      adaptation: {
        currentLevel: adaptedMaterials.recommendedLevel,
        focusAreas: adaptedMaterials.focusAreas,
        difficultyAdjustment: adaptedMaterials.difficultyAdjustment,
        confidenceBoost: adaptedMaterials.confidenceBoost,
        basedOnRealPerformance: true,
        sessionsAnalyzed: adaptedMaterials.performanceTrends.length
      }
    });
    
  } catch (error) {
    console.error('Error adapting materials:', error);
    res.status(500).json({ 
      message: 'Failed to adapt materials',
      error: error.message 
    });
  }
});

/**
 * GET /api/transcripts/search
 * Search transcripts by content, topics, or errors
 */
router.get('/search', authenticateToken, async (req: any, res) => {
  try {
    const { query, studentId, dateFrom, dateTo, errorType } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Build search parameters
    const searchParams: any = {};
    
    if (query) searchParams.textQuery = query;
    if (studentId) searchParams.studentId = parseInt(studentId);
    if (dateFrom) searchParams.dateFrom = new Date(dateFrom);
    if (dateTo) searchParams.dateTo = new Date(dateTo);
    if (errorType) searchParams.errorType = errorType;
    
    // Apply access controls
    if (userRole === 'Student') {
      searchParams.studentId = userId;
    } else if (userRole === 'Teacher') {
      searchParams.teacherId = userId;
    }
    
    // Search transcripts
    const searchResults = await storage.searchTranscripts(searchParams);
    
    console.log(`✓ Transcript search returned ${searchResults.length} results`);
    
    res.json({
      query: searchParams,
      results: searchResults,
      count: searchResults.length,
      searchType: 'real_transcripts'
    });
    
  } catch (error) {
    console.error('Error searching transcripts:', error);
    res.status(500).json({ 
      message: 'Failed to search transcripts',
      error: error.message 
    });
  }
});

// Helper functions
function extractTopics(utterances: any[]): string[] {
  const text = utterances.map(u => u.text).join(' ').toLowerCase();
  const topics = [];
  
  if (text.includes('travel') || text.includes('trip') || text.includes('vacation')) {
    topics.push('travel');
  }
  if (text.includes('work') || text.includes('job') || text.includes('career')) {
    topics.push('work');
  }
  if (text.includes('food') || text.includes('eat') || text.includes('restaurant')) {
    topics.push('food');
  }
  if (text.includes('family') || text.includes('mother') || text.includes('father')) {
    topics.push('family');
  }
  
  return topics.length > 0 ? topics : ['general conversation'];
}

export default router;