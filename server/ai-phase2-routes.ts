/**
 * Phase 2 AI Routes - Persian Language & Real-time Processing
 */

import type { Express } from 'express';
import { persianNLPService } from './persian-nlp-service';
import { realtimeCallProcessor } from './realtime-call-processor';
import { knowledgeBaseService } from './knowledge-base-service';
import { db } from './db';
import { leads, communicationLogs } from '../shared/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// JWT middleware
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';

const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export function registerPhase2AIRoutes(app: Express) {
  
  // ============ Persian NLP Routes ============
  
  /**
   * Analyze Persian or English text
   */
  app.post('/api/ai/analyze-text', authenticateToken, async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      const analysis = await persianNLPService.analyzeText(text);
      
      res.json({
        success: true,
        analysis
      });
    } catch (error) {
      console.error('Text analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze text' });
    }
  });
  
  /**
   * Score lead based on conversation
   */
  app.post('/api/ai/score-lead', authenticateToken, async (req, res) => {
    try {
      const { conversationText, leadId, callDuration } = req.body;
      
      if (!conversationText || !leadId) {
        return res.status(400).json({ 
          error: 'conversationText and leadId are required' 
        });
      }
      
      // Get previous interactions count
      const previousInteractions = await db.select()
        .from(communicationLogs)
        .where(eq(communicationLogs.toParentId, leadId))
        .then(logs => logs.length);
      
      const scoring = await persianNLPService.scoreLead(conversationText, {
        callDuration,
        previousInteractions
      });
      
      // Update lead priority based on score
      const priority = scoring.overallScore >= 80 ? 'high' :
                       scoring.overallScore >= 60 ? 'medium' : 'low';
      
      await db.update(leads)
        .set({ 
          priority,
          updatedAt: new Date()
        })
        .where(eq(leads.id, leadId));
      
      res.json({
        success: true,
        scoring,
        leadUpdated: true
      });
    } catch (error) {
      console.error('Lead scoring error:', error);
      res.status(500).json({ error: 'Failed to score lead' });
    }
  });
  
  /**
   * Detect language of text
   */
  app.post('/api/ai/detect-language', async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      const language = persianNLPService.detectLanguage(text);
      
      res.json({
        success: true,
        language,
        confidence: language === 'mixed' ? 0.6 : 0.9
      });
    } catch (error) {
      console.error('Language detection error:', error);
      res.status(500).json({ error: 'Failed to detect language' });
    }
  });
  
  // ============ Real-time Call Processing Routes ============
  
  /**
   * Start real-time call session
   */
  app.post('/api/ai/realtime/start-session', authenticateToken, async (req, res) => {
    try {
      const { sessionId, callId, leadId } = req.body;
      const agentId = req.user?.id;
      
      if (!sessionId || !callId || !leadId) {
        return res.status(400).json({ 
          error: 'sessionId, callId, and leadId are required' 
        });
      }
      
      const session = await realtimeCallProcessor.startSession({
        sessionId,
        callId,
        leadId,
        agentId: agentId || 1
      });
      
      res.json({
        success: true,
        session: {
          sessionId: session.sessionId,
          status: session.status,
          language: session.language,
          startTime: session.startTime
        }
      });
    } catch (error) {
      console.error('Session start error:', error);
      res.status(500).json({ error: 'Failed to start session' });
    }
  });
  
  /**
   * Process audio chunk for real-time session
   */
  app.post('/api/ai/realtime/process-audio', authenticateToken, async (req, res) => {
    try {
      const { sessionId, audioData, speaker, timestamp } = req.body;
      
      if (!sessionId || !audioData) {
        return res.status(400).json({ 
          error: 'sessionId and audioData are required' 
        });
      }
      
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      
      await realtimeCallProcessor.processAudioChunk({
        sessionId,
        data: audioBuffer,
        timestamp: timestamp || Date.now(),
        speaker: speaker || 'agent'
      });
      
      res.json({
        success: true,
        message: 'Audio chunk processed'
      });
    } catch (error) {
      console.error('Audio processing error:', error);
      res.status(500).json({ error: 'Failed to process audio' });
    }
  });
  
  /**
   * End real-time call session
   */
  app.post('/api/ai/realtime/end-session', authenticateToken, async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }
      
      await realtimeCallProcessor.endSession(sessionId);
      
      res.json({
        success: true,
        message: 'Session ended successfully'
      });
    } catch (error) {
      console.error('Session end error:', error);
      res.status(500).json({ error: 'Failed to end session' });
    }
  });
  
  /**
   * Get session status and insights
   */
  app.get('/api/ai/realtime/session/:sessionId', authenticateToken, async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = realtimeCallProcessor.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json({
        success: true,
        session: {
          sessionId: session.sessionId,
          status: session.status,
          language: session.language,
          startTime: session.startTime,
          transcriptCount: session.transcripts.length,
          insights: session.insights
        }
      });
    } catch (error) {
      console.error('Session status error:', error);
      res.status(500).json({ error: 'Failed to get session status' });
    }
  });
  
  /**
   * Get active sessions
   */
  app.get('/api/ai/realtime/active-sessions', authenticateToken, async (req, res) => {
    try {
      const sessions = realtimeCallProcessor.getActiveSessions();
      
      res.json({
        success: true,
        count: sessions.length,
        sessions: sessions.map(s => ({
          sessionId: s.sessionId,
          callId: s.callId,
          leadId: s.leadId,
          agentId: s.agentId,
          status: s.status,
          startTime: s.startTime,
          language: s.language
        }))
      });
    } catch (error) {
      console.error('Active sessions error:', error);
      res.status(500).json({ error: 'Failed to get active sessions' });
    }
  });
  
  // ============ Knowledge Base RAG Routes ============
  
  /**
   * Search knowledge base
   */
  app.post('/api/ai/knowledge/search', async (req, res) => {
    try {
      const { query, language, category, limit } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const results = await knowledgeBaseService.searchDocuments(query, {
        language,
        category,
        limit: limit || 5
      });
      
      res.json({
        success: true,
        results: results.map(r => ({
          id: r.document.id,
          title: r.document.title,
          category: r.document.category,
          language: r.document.language,
          score: r.score,
          snippet: r.snippet,
          highlights: r.highlights
        }))
      });
    } catch (error) {
      console.error('Knowledge search error:', error);
      res.status(500).json({ error: 'Failed to search knowledge base' });
    }
  });
  
  /**
   * Get RAG-powered answer
   */
  app.post('/api/ai/knowledge/ask', async (req, res) => {
    try {
      const { question, preferredLanguage } = req.body;
      const userId = req.user?.id;
      
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }
      
      const response = await knowledgeBaseService.generateRAGResponse(question, {
        userId,
        preferredLanguage
      });
      
      res.json({
        success: true,
        answer: response.answer,
        confidence: response.confidence,
        language: response.language,
        sources: response.sources.map(s => ({
          id: s.document.id,
          title: s.document.title,
          snippet: s.snippet,
          score: s.score
        }))
      });
    } catch (error) {
      console.error('RAG response error:', error);
      res.status(500).json({ error: 'Failed to generate answer' });
    }
  });
  
  /**
   * Get document by ID
   */
  app.get('/api/ai/knowledge/document/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const document = knowledgeBaseService.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.json({
        success: true,
        document: {
          id: document.id,
          title: document.title,
          content: document.content,
          language: document.language,
          category: document.category,
          tags: document.tags,
          metadata: document.metadata
        }
      });
    } catch (error) {
      console.error('Document fetch error:', error);
      res.status(500).json({ error: 'Failed to get document' });
    }
  });
  
  /**
   * Get documents by category
   */
  app.get('/api/ai/knowledge/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      
      const documents = knowledgeBaseService.getDocumentsByCategory(category);
      
      res.json({
        success: true,
        category,
        count: documents.length,
        documents: documents.map(d => ({
          id: d.id,
          title: d.title,
          language: d.language,
          tags: d.tags
        }))
      });
    } catch (error) {
      console.error('Category fetch error:', error);
      res.status(500).json({ error: 'Failed to get category documents' });
    }
  });
  
  /**
   * Add new document to knowledge base
   */
  app.post('/api/ai/knowledge/document', authenticateToken, async (req, res) => {
    try {
      const { title, content, language, category, tags } = req.body;
      
      if (!title || !content || !language || !category) {
        return res.status(400).json({ 
          error: 'title, content, language, and category are required' 
        });
      }
      
      const docId = `doc-${Date.now()}`;
      
      await knowledgeBaseService.addDocument({
        id: docId,
        title,
        content,
        language,
        category,
        tags: tags || [],
        metadata: {
          source: 'user',
          author: req.user?.email || 'unknown',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      res.json({
        success: true,
        documentId: docId,
        message: 'Document added successfully'
      });
    } catch (error) {
      console.error('Document add error:', error);
      res.status(500).json({ error: 'Failed to add document' });
    }
  });
  
  /**
   * Update document
   */
  app.put('/api/ai/knowledge/document/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      await knowledgeBaseService.updateDocument(id, updates);
      
      res.json({
        success: true,
        message: 'Document updated successfully'
      });
    } catch (error) {
      console.error('Document update error:', error);
      res.status(500).json({ error: 'Failed to update document' });
    }
  });
  
  /**
   * Delete document
   */
  app.delete('/api/ai/knowledge/document/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = knowledgeBaseService.deleteDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Document delete error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });
  
  console.log('✅ Phase 2 AI routes registered (Persian NLP, Real-time Processing, Knowledge RAG)');
}