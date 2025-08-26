/**
 * Advanced Features API Routes
 * Handles CEFR, IRT, AI Supervision, Mood Intelligence, and Adaptive Content
 */

import { Router } from 'express';
import { DatabaseStorage } from '../database-storage';
import { CEFRTaggingService } from '../services/cefr-tagging-service';
import { IRTService } from '../services/irt-service';
import { AISupervisorService } from '../services/ai-supervisor-service';
import { SessionAdaptiveContentService } from '../services/session-adaptive-content';
import { MoodIntelligenceService } from '../services/mood-intelligence-service';
import { RecordingService } from '../services/recording-service';
import { OllamaService } from '../ollama-service';
// We'll use simple middleware for now

export function createAdvancedFeaturesRouter(storage: DatabaseStorage): Router {
  const router = Router();
  const ollamaService = new OllamaService();
  
  // Initialize services
  const cefrService = new CEFRTaggingService(storage);
  const irtService = new IRTService(storage);
  const aiSupervisor = new AISupervisorService(ollamaService, storage);
  const adaptiveContent = new SessionAdaptiveContentService(ollamaService, storage);
  const moodService = new MoodIntelligenceService(storage, ollamaService);
  const recordingService = new RecordingService(storage);

  // Simple auth middleware for testing (in production, use proper authentication)
  const requireAuth = (req: any, res: any, next: any) => {
    // For now, just check if there's a user in the request
    if (!req.user && !req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };
  
  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    // For now, just pass through
    next();
  };

  // =============== CEFR Tagging Routes ===============
  
  /**
   * Tag content with CEFR levels
   */
  router.post('/cefr/tag-content', requireAuth, requireRole(['Admin', 'Teacher']), async (req, res) => {
    try {
      const { contentId, contentType, contentAnalysis } = req.body;
      
      const tag = await cefrService.tagContent(
        contentId,
        contentType,
        contentAnalysis
      );
      
      res.json({ success: true, tag });
    } catch (error) {
      console.error('CEFR tagging error:', error);
      res.status(500).json({ error: 'Failed to tag content' });
    }
  });

  /**
   * Assess student CEFR level
   */
  router.post('/cefr/assess-student', requireAuth, async (req: any, res) => {
    try {
      const { studentId, assessmentData } = req.body;
      
      const assessment = await cefrService.assessStudentLevel(
        studentId || req.user?.id,
        assessmentData
      );
      
      res.json({ success: true, assessment });
    } catch (error) {
      console.error('CEFR assessment error:', error);
      res.status(500).json({ error: 'Failed to assess student level' });
    }
  });

  /**
   * Generate adaptive CEFR roadmap
   */
  router.post('/cefr/generate-roadmap', requireAuth, async (req: any, res) => {
    try {
      const { studentId, targetLevel, currentAssessment } = req.body;
      
      const roadmap = await cefrService.generateAdaptiveRoadmap(
        studentId || req.user?.id,
        targetLevel,
        currentAssessment
      );
      
      res.json({ success: true, roadmap });
    } catch (error) {
      console.error('CEFR roadmap error:', error);
      res.status(500).json({ error: 'Failed to generate roadmap' });
    }
  });

  /**
   * Update roadmap progress with CEFR tracking
   */
  router.put('/cefr/update-progress', requireAuth, async (req: any, res) => {
    try {
      const { studentId, roadmapId, progressData } = req.body;
      
      const update = await cefrService.updateRoadmapProgress(
        studentId || req.user?.id,
        roadmapId,
        progressData
      );
      
      res.json({ success: true, update });
    } catch (error) {
      console.error('CEFR progress update error:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  });

  // =============== IRT Adaptive Assessment Routes ===============
  
  /**
   * Start adaptive IRT assessment
   */
  router.post('/irt/start-assessment', requireAuth, async (req: any, res) => {
    try {
      const { maxItems, targetSE, timeLimit } = req.body;
      const studentId = req.user?.id;
      
      const assessment = await irtService.runAdaptiveAssessment({
        studentId,
        maxItems,
        targetSE,
        timeLimit
      });
      
      res.json({ success: true, assessment });
    } catch (error) {
      console.error('IRT assessment error:', error);
      res.status(500).json({ error: 'Failed to run assessment' });
    }
  });

  /**
   * Update ability estimate
   */
  router.post('/irt/update-ability', requireAuth, async (req: any, res) => {
    try {
      const { currentTheta, currentSE, responses } = req.body;
      
      const ability = await irtService.updateAbility({
        currentTheta,
        currentSE,
        responses
      });
      
      res.json({ success: true, ability });
    } catch (error) {
      console.error('IRT ability update error:', error);
      res.status(500).json({ error: 'Failed to update ability' });
    }
  });

  /**
   * Get next adaptive item
   */
  router.post('/irt/next-item', requireAuth, async (req: any, res) => {
    try {
      const { theta, excludeItems } = req.body;
      
      const item = await irtService.selectNextItem(theta, excludeItems || []);
      
      res.json({ success: true, item });
    } catch (error) {
      console.error('IRT next item error:', error);
      res.status(500).json({ error: 'Failed to select next item' });
    }
  });

  /**
   * Generate IRT performance report
   */
  router.post('/irt/performance-report', requireAuth, async (req: any, res) => {
    try {
      const { assessmentData } = req.body;
      
      const report = await irtService.generatePerformanceReport(assessmentData);
      
      res.json({ success: true, report });
    } catch (error) {
      console.error('IRT report error:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });

  // =============== AI Supervisor Routes ===============
  
  /**
   * Initialize AI supervisor for session
   */
  router.post('/ai-supervisor/initialize', requireAuth, async (req: any, res) => {
    try {
      const { sessionId, studentId, teacherId, targetLanguage } = req.body;
      
      await aiSupervisor.initializeSession(
        sessionId,
        studentId,
        teacherId,
        targetLanguage
      );
      
      res.json({ success: true, message: 'AI supervisor initialized' });
    } catch (error) {
      console.error('AI supervisor init error:', error);
      res.status(500).json({ error: 'Failed to initialize supervisor' });
    }
  });

  /**
   * Process audio stream for vocabulary suggestions
   */
  router.post('/ai-supervisor/process-audio', requireAuth, async (req: any, res) => {
    try {
      const { sessionId, audioData, speaker } = req.body;
      
      const audioBuffer = Buffer.from(audioData, 'base64');
      const suggestions = await aiSupervisor.processAudioStream(
        sessionId,
        audioBuffer,
        speaker
      );
      
      res.json({ success: true, suggestions });
    } catch (error) {
      console.error('AI audio processing error:', error);
      res.status(500).json({ error: 'Failed to process audio' });
    }
  });

  /**
   * Analyze grammar in real-time
   */
  router.post('/ai-supervisor/analyze-grammar', requireAuth, async (req: any, res) => {
    try {
      const { sessionId, text } = req.body;
      
      const corrections = await aiSupervisor.analyzeGrammar(sessionId, text);
      
      res.json({ success: true, corrections });
    } catch (error) {
      console.error('Grammar analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze grammar' });
    }
  });

  /**
   * Get pronunciation feedback
   */
  router.post('/ai-supervisor/pronunciation', requireAuth, async (req: any, res) => {
    try {
      const { sessionId, audioData, targetWord } = req.body;
      
      const audioBuffer = Buffer.from(audioData, 'base64');
      const feedback = await aiSupervisor.analyzePronunciation(
        sessionId,
        audioBuffer,
        targetWord
      );
      
      res.json({ success: true, feedback });
    } catch (error) {
      console.error('Pronunciation analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze pronunciation' });
    }
  });

  /**
   * Get TTT metrics
   */
  router.get('/ai-supervisor/ttt-metrics/:sessionId', requireAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      
      const metrics = await aiSupervisor.updateTTTRatio(sessionId);
      
      res.json({ success: true, metrics });
    } catch (error) {
      console.error('TTT metrics error:', error);
      res.status(500).json({ error: 'Failed to get TTT metrics' });
    }
  });

  /**
   * Get real-time suggestions
   */
  router.post('/ai-supervisor/realtime-suggestions', requireAuth, async (req: any, res) => {
    try {
      const { sessionId, context } = req.body;
      
      const suggestions = await aiSupervisor.getRealtimeSuggestions(
        sessionId,
        context
      );
      
      res.json({ success: true, suggestions });
    } catch (error) {
      console.error('Realtime suggestions error:', error);
      res.status(500).json({ error: 'Failed to get suggestions' });
    }
  });

  /**
   * Generate session summary
   */
  router.post('/ai-supervisor/session-summary', requireAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.body;
      
      const summary = await aiSupervisor.generateSessionSummary(sessionId);
      
      res.json({ success: true, summary });
    } catch (error) {
      console.error('Session summary error:', error);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  });

  // =============== Session Adaptive Content Routes ===============
  
  /**
   * Generate adaptive content for session
   */
  router.post('/adaptive-content/generate', requireAuth, async (req: any, res) => {
    try {
      const { sessionId, sessionType, targetSkills } = req.body;
      const studentId = req.user?.id;
      
      const contents = await adaptiveContent.generateAdaptiveContent(
        sessionId,
        studentId,
        sessionType,
        targetSkills
      );
      
      res.json({ success: true, contents });
    } catch (error) {
      console.error('Adaptive content error:', error);
      res.status(500).json({ error: 'Failed to generate content' });
    }
  });

  /**
   * Adapt content in real-time
   */
  router.post('/adaptive-content/realtime-adapt', requireAuth, async (req: any, res) => {
    try {
      const { sessionId, currentMetrics } = req.body;
      
      const adaptation = await adaptiveContent.adaptContentInRealtime(
        sessionId,
        currentMetrics
      );
      
      res.json({ success: true, adaptation });
    } catch (error) {
      console.error('Realtime adaptation error:', error);
      res.status(500).json({ error: 'Failed to adapt content' });
    }
  });

  // =============== Mood Intelligence Routes ===============
  
  /**
   * Detect mood from input
   */
  router.post('/mood/detect', requireAuth, async (req: any, res) => {
    try {
      const { text, voiceAnalysis, behavioralData } = req.body;
      const userId = req.user?.id;
      
      const mood = await moodService.detectMood(userId, {
        text,
        voiceAnalysis,
        behavioralData
      });
      
      res.json({ success: true, mood });
    } catch (error) {
      console.error('Mood detection error:', error);
      res.status(500).json({ error: 'Failed to detect mood' });
    }
  });

  /**
   * Track mood patterns
   */
  router.get('/mood/patterns', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      const patterns = await moodService.trackMoodPatterns(userId);
      
      res.json({ success: true, patterns });
    } catch (error) {
      console.error('Mood patterns error:', error);
      res.status(500).json({ error: 'Failed to track patterns' });
    }
  });

  /**
   * Analyze mood trends
   */
  router.get('/mood/trends/:period', requireAuth, async (req: any, res) => {
    try {
      const { period } = req.params as { period: 'daily' | 'weekly' | 'monthly' };
      const userId = req.user?.id;
      
      const trends = await moodService.analyzeMoodTrends(userId, period);
      
      res.json({ success: true, trends });
    } catch (error) {
      console.error('Mood trends error:', error);
      res.status(500).json({ error: 'Failed to analyze trends' });
    }
  });

  /**
   * Adapt learning to mood
   */
  router.post('/mood/adapt-learning', requireAuth, async (req: any, res) => {
    try {
      const { sessionId, currentMood } = req.body;
      const userId = req.user?.id;
      
      const adaptations = await moodService.adaptLearningToMood(
        userId,
        sessionId,
        currentMood
      );
      
      res.json({ success: true, adaptations });
    } catch (error) {
      console.error('Mood adaptation error:', error);
      res.status(500).json({ error: 'Failed to adapt to mood' });
    }
  });

  // =============== Recording Routes ===============
  
  /**
   * Save call recording
   */
  router.post('/recording/save', requireAuth, async (req: any, res) => {
    try {
      const { sessionId, studentId, teacherId, recordingData, language } = req.body;
      
      const recordingBuffer = Buffer.from(recordingData, 'base64');
      const metadata = await recordingService.saveRecording(
        sessionId,
        studentId,
        teacherId,
        recordingBuffer,
        language
      );
      
      res.json({ success: true, metadata });
    } catch (error) {
      console.error('Recording save error:', error);
      res.status(500).json({ error: 'Failed to save recording' });
    }
  });

  /**
   * Generate transcript
   */
  router.post('/recording/generate-transcript', requireAuth, async (req: any, res) => {
    try {
      const { recordingId, language } = req.body;
      
      const transcript = await recordingService.generateTranscript(
        recordingId,
        language
      );
      
      res.json({ success: true, transcript });
    } catch (error) {
      console.error('Transcript generation error:', error);
      res.status(500).json({ error: 'Failed to generate transcript' });
    }
  });

  /**
   * Search recordings
   */
  router.post('/recording/search', requireAuth, async (req: any, res) => {
    try {
      const searchQuery = req.body;
      
      const results = await recordingService.searchRecordings(searchQuery);
      
      res.json({ success: true, results });
    } catch (error) {
      console.error('Recording search error:', error);
      res.status(500).json({ error: 'Failed to search recordings' });
    }
  });

  /**
   * Create highlight reel
   */
  router.post('/recording/create-highlights', requireAuth, async (req: any, res) => {
    try {
      const { recordingId, segments } = req.body;
      
      const highlights = await recordingService.createHighlightReel(
        recordingId,
        segments
      );
      
      res.json({ success: true, highlights });
    } catch (error) {
      console.error('Highlight creation error:', error);
      res.status(500).json({ error: 'Failed to create highlights' });
    }
  });

  /**
   * Get recording analytics
   */
  router.get('/recording/analytics/:recordingId', requireAuth, async (req: any, res) => {
    try {
      const { recordingId } = req.params;
      
      const analytics = await recordingService.getRecordingAnalytics(recordingId);
      
      res.json({ success: true, analytics });
    } catch (error) {
      console.error('Recording analytics error:', error);
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  });

  return router;
}