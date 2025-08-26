/**
 * Real-time Call Processing Service
 * Handles live call transcription, analysis, and real-time insights
 * with Persian language priority
 */

import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { whisperService } from './whisper-service';
import { persianNLPService } from './persian-nlp-service';
import { ollamaService } from './ollama-service';
import { db } from './db';
import { aiCallInsights, leads, communicationLogs } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

export interface CallSession {
  sessionId: string;
  callId: string;
  leadId: number;
  agentId: number;
  startTime: Date;
  language: 'fa' | 'en' | 'mixed';
  audioBuffer: Buffer[];
  transcripts: TranscriptSegment[];
  insights: RealTimeInsights;
  status: 'active' | 'processing' | 'completed' | 'failed';
}

export interface TranscriptSegment {
  id: string;
  speaker: 'agent' | 'lead';
  text: string;
  language: 'fa' | 'en' | 'mixed';
  timestamp: Date;
  confidence: number;
  sentiment?: string;
}

export interface RealTimeInsights {
  currentSentiment: 'positive' | 'negative' | 'neutral';
  engagementLevel: number;
  keyTopics: string[];
  suggestedResponses: string[];
  warnings: string[];
  opportunities: string[];
  nextBestAction: string;
  leadScore: number;
}

export interface AudioChunk {
  sessionId: string;
  data: Buffer;
  timestamp: number;
  speaker: 'agent' | 'lead';
}

class RealtimeCallProcessor extends EventEmitter {
  private activeSessions: Map<string, CallSession>;
  private processingQueue: Map<string, AudioChunk[]>;
  private transcriptionBuffer: Map<string, string>;
  private insightsUpdateInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    super();
    this.activeSessions = new Map();
    this.processingQueue = new Map();
    this.transcriptionBuffer = new Map();
    
    // Start insights update loop
    this.startInsightsUpdateLoop();
  }
  
  /**
   * Start a new call session
   */
  async startSession(params: {
    sessionId: string;
    callId: string;
    leadId: number;
    agentId: number;
  }): Promise<CallSession> {
    // Get lead information
    const lead = await db.select()
      .from(leads)
      .where(eq(leads.id, params.leadId))
      .limit(1)
      .then(rows => rows[0]);
    
    if (!lead) {
      throw new Error(`Lead ${params.leadId} not found`);
    }
    
    const session: CallSession = {
      sessionId: params.sessionId,
      callId: params.callId,
      leadId: params.leadId,
      agentId: params.agentId,
      startTime: new Date(),
      language: 'fa', // Default to Persian
      audioBuffer: [],
      transcripts: [],
      insights: {
        currentSentiment: 'neutral',
        engagementLevel: 50,
        keyTopics: [],
        suggestedResponses: [],
        warnings: [],
        opportunities: [],
        nextBestAction: 'Continue conversation',
        leadScore: 50
      },
      status: 'active'
    };
    
    this.activeSessions.set(params.sessionId, session);
    this.processingQueue.set(params.sessionId, []);
    this.transcriptionBuffer.set(params.sessionId, '');
    
    // Log session start
    await this.logCommunication({
      fromUserId: params.agentId,
      leadId: params.leadId,
      type: 'call',
      content: `مکالمه شروع شد - Session: ${params.sessionId}`,
      metadata: { sessionId: params.sessionId, callId: params.callId }
    });
    
    this.emit('session-started', session);
    console.log(`Call session started: ${params.sessionId}`);
    
    return session;
  }
  
  /**
   * Process incoming audio chunk
   */
  async processAudioChunk(chunk: AudioChunk): Promise<void> {
    const session = this.activeSessions.get(chunk.sessionId);
    if (!session || session.status !== 'active') {
      console.warn(`No active session found for ${chunk.sessionId}`);
      return;
    }
    
    // Add to processing queue
    const queue = this.processingQueue.get(chunk.sessionId) || [];
    queue.push(chunk);
    this.processingQueue.set(chunk.sessionId, queue);
    
    // Process queue if it has enough data (e.g., 1 second of audio)
    if (queue.length >= 10) { // Assuming 100ms chunks
      await this.processAudioQueue(chunk.sessionId);
    }
  }
  
  /**
   * Process accumulated audio chunks
   */
  private async processAudioQueue(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    const queue = this.processingQueue.get(sessionId);
    
    if (!session || !queue || queue.length === 0) return;
    
    // Combine audio chunks
    const audioData = Buffer.concat(queue.map(chunk => chunk.data));
    const speaker = queue[0].speaker; // Assume all chunks in batch are from same speaker
    
    // Clear the queue
    this.processingQueue.set(sessionId, []);
    
    // Transcribe audio
    try {
      const transcript = await this.transcribeAudio(audioData, session.language);
      
      if (transcript.text.trim()) {
        const segment: TranscriptSegment = {
          id: `${sessionId}-${Date.now()}`,
          speaker,
          text: transcript.text,
          language: transcript.language as 'fa' | 'en' | 'mixed',
          timestamp: new Date(),
          confidence: transcript.confidence,
          sentiment: undefined
        };
        
        // Analyze sentiment
        const sentimentResult = await persianNLPService.analyzeSentiment(transcript.text);
        segment.sentiment = sentimentResult.sentiment;
        
        // Add to session transcripts
        session.transcripts.push(segment);
        
        // Update transcription buffer
        const buffer = this.transcriptionBuffer.get(sessionId) || '';
        this.transcriptionBuffer.set(sessionId, buffer + ' ' + transcript.text);
        
        // Emit transcript event for real-time UI updates
        this.emit('transcript', {
          sessionId,
          segment
        });
        
        // Update insights if significant text accumulated
        if (session.transcripts.length % 5 === 0) { // Every 5 segments
          await this.updateSessionInsights(sessionId);
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      this.emit('transcription-error', { sessionId, error });
    }
  }
  
  /**
   * Transcribe audio with language detection
   */
  private async transcribeAudio(
    audioBuffer: Buffer,
    preferredLanguage: 'fa' | 'en' | 'mixed'
  ): Promise<{ text: string; language: string; confidence: number }> {
    // Check if Whisper service is available
    const whisperStatus = await whisperService.testConnection();
    
    if (whisperStatus.success) {
      // Use Whisper for transcription
      const result = await whisperService.transcribe(audioBuffer);
      return {
        text: result.text,
        language: result.language || preferredLanguage,
        confidence: result.confidence || 0.8
      };
    } else {
      // Fallback response when Whisper is not available
      console.log('Whisper service unavailable, using fallback');
      return {
        text: '',
        language: preferredLanguage,
        confidence: 0
      };
    }
  }
  
  /**
   * Update session insights based on accumulated transcripts
   */
  private async updateSessionInsights(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const fullTranscript = this.transcriptionBuffer.get(sessionId) || '';
    if (!fullTranscript.trim()) return;
    
    try {
      // Analyze the full conversation
      const analysis = await persianNLPService.analyzeText(fullTranscript);
      
      // Calculate lead score
      const leadScoring = await persianNLPService.scoreLead(fullTranscript, {
        callDuration: Math.floor((Date.now() - session.startTime.getTime()) / 1000),
        previousInteractions: await this.getPreviousInteractionCount(session.leadId)
      });
      
      // Generate AI suggestions
      const suggestions = await this.generateAISuggestions(fullTranscript, analysis, session.language);
      
      // Update insights
      session.insights = {
        currentSentiment: analysis.sentiment,
        engagementLevel: leadScoring.engagementLevel,
        keyTopics: analysis.keywords.slice(0, 5),
        suggestedResponses: suggestions.responses,
        warnings: suggestions.warnings,
        opportunities: suggestions.opportunities,
        nextBestAction: suggestions.nextAction,
        leadScore: leadScoring.overallScore
      };
      
      // Emit insights update
      this.emit('insights-updated', {
        sessionId,
        insights: session.insights
      });
      
      // Store insights in database
      await this.storeSessionInsights(session, analysis, leadScoring);
      
    } catch (error) {
      console.error('Error updating insights:', error);
    }
  }
  
  /**
   * Generate AI-powered suggestions for the agent
   */
  private async generateAISuggestions(
    transcript: string,
    analysis: any,
    language: 'fa' | 'en' | 'mixed'
  ): Promise<{
    responses: string[];
    warnings: string[];
    opportunities: string[];
    nextAction: string;
  }> {
    const isAvailable = await ollamaService.isServiceAvailable();
    
    if (!isAvailable) {
      // Return fallback suggestions
      return this.getFallbackSuggestions(analysis, language);
    }
    
    const prompt = language === 'fa' || language === 'mixed'
      ? `بر اساس مکالمه زیر، پیشنهادات زیر را ارائه دهید:
      1. سه پاسخ پیشنهادی برای ادامه مکالمه
      2. هشدارهای مهم (اگر وجود دارد)
      3. فرصت‌های فروش
      4. بهترین اقدام بعدی
      
      مکالمه: ${transcript}
      
      پاسخ را به صورت JSON با فرمت زیر بدهید:
      {
        "responses": ["پاسخ۱", "پاسخ۲", "پاسخ۳"],
        "warnings": ["هشدار۱"],
        "opportunities": ["فرصت۱"],
        "nextAction": "اقدام پیشنهادی"
      }`
      : `Based on the following conversation, provide:
      1. Three suggested responses to continue
      2. Important warnings (if any)
      3. Sales opportunities
      4. Next best action
      
      Conversation: ${transcript}
      
      Return JSON format:
      {
        "responses": ["response1", "response2", "response3"],
        "warnings": ["warning1"],
        "opportunities": ["opportunity1"],
        "nextAction": "suggested action"
      }`;
    
    try {
      const response = await ollamaService.chat(prompt, 'assistant');
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackSuggestions(analysis, language);
    }
  }
  
  /**
   * Get fallback suggestions when AI is not available
   */
  private getFallbackSuggestions(analysis: any, language: 'fa' | 'en' | 'mixed') {
    if (language === 'fa' || language === 'mixed') {
      return {
        responses: [
          'آیا می‌توانم اطلاعات بیشتری در مورد دوره‌ها ارائه دهم؟',
          'برای شروع، سطح فعلی زبان شما چیست؟',
          'چه زمانی می‌خواهید کلاس‌ها را شروع کنید؟'
        ],
        warnings: analysis.sentiment === 'negative' ? ['مشتری ممکن است ناراضی باشد'] : [],
        opportunities: analysis.intent === 'enrollment' ? ['مشتری آماده ثبت‌نام است'] : [],
        nextAction: 'ادامه مکالمه و جمع‌آوری اطلاعات بیشتر'
      };
    } else {
      return {
        responses: [
          'Can I provide more information about our courses?',
          'What is your current language level?',
          'When would you like to start classes?'
        ],
        warnings: analysis.sentiment === 'negative' ? ['Customer may be dissatisfied'] : [],
        opportunities: analysis.intent === 'enrollment' ? ['Customer ready to enroll'] : [],
        nextAction: 'Continue conversation and gather more information'
      };
    }
  }
  
  /**
   * End call session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found`);
      return;
    }
    
    session.status = 'processing';
    
    // Process any remaining audio
    await this.processAudioQueue(sessionId);
    
    // Final insights update
    await this.updateSessionInsights(sessionId);
    
    // Calculate call duration
    const duration = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
    
    // Store final call summary
    const fullTranscript = this.transcriptionBuffer.get(sessionId) || '';
    const finalAnalysis = await persianNLPService.analyzeText(fullTranscript);
    const finalScoring = await persianNLPService.scoreLead(fullTranscript, {
      callDuration: duration
    });
    
    // Update AI call insights
    await db.insert(aiCallInsights).values({
      callId: session.callId,
      leadId: session.leadId,
      agentId: session.agentId,
      duration,
      sentiment: finalAnalysis.sentiment,
      summary: finalAnalysis.summary,
      entities: finalAnalysis.entities,
      nextActions: this.generateNextActions(finalAnalysis, finalScoring),
      confidence: finalAnalysis.confidence.toString(),
      processedAt: new Date()
    }).onConflictDoUpdate({
      target: aiCallInsights.callId,
      set: {
        duration,
        sentiment: finalAnalysis.sentiment,
        summary: finalAnalysis.summary,
        entities: finalAnalysis.entities,
        nextActions: this.generateNextActions(finalAnalysis, finalScoring),
        confidence: finalAnalysis.confidence.toString(),
        processedAt: new Date()
      }
    });
    
    // Update lead priority based on score
    const newPriority = finalScoring.overallScore >= 80 ? 'high' : 
                       finalScoring.overallScore >= 60 ? 'medium' : 'low';
    
    await db.update(leads)
      .set({ 
        priority: newPriority,
        updatedAt: new Date()
      })
      .where(eq(leads.id, session.leadId));
    
    // Log session end
    await this.logCommunication({
      fromUserId: session.agentId,
      leadId: session.leadId,
      type: 'call',
      content: `مکالمه پایان یافت - مدت: ${duration} ثانیه - امتیاز: ${finalScoring.overallScore}`,
      metadata: {
        sessionId,
        callId: session.callId,
        duration,
        score: finalScoring.overallScore,
        sentiment: finalAnalysis.sentiment
      }
    });
    
    session.status = 'completed';
    
    // Emit session ended event
    this.emit('session-ended', {
      sessionId,
      duration,
      finalScore: finalScoring.overallScore,
      recommendation: finalScoring.recommendation
    });
    
    // Clean up
    this.activeSessions.delete(sessionId);
    this.processingQueue.delete(sessionId);
    this.transcriptionBuffer.delete(sessionId);
    
    console.log(`Call session ended: ${sessionId}, Score: ${finalScoring.overallScore}`);
  }
  
  /**
   * Generate next actions based on analysis
   */
  private generateNextActions(analysis: any, scoring: any): any[] {
    const actions = [];
    
    if (scoring.recommendation === 'hot') {
      actions.push({
        type: 'follow_up',
        priority: 'high',
        action: analysis.language === 'fa' ? 'تماس پیگیری فوری' : 'Immediate follow-up call',
        when: '24 hours'
      });
    }
    
    if (analysis.intent === 'enrollment') {
      actions.push({
        type: 'send_info',
        priority: 'high',
        action: analysis.language === 'fa' ? 'ارسال اطلاعات ثبت‌نام' : 'Send enrollment information',
        when: 'immediately'
      });
    }
    
    if (analysis.entities.courses.length > 0) {
      actions.push({
        type: 'schedule',
        priority: 'medium',
        action: analysis.language === 'fa' ? 'هماهنگی جلسه مشاوره' : 'Schedule consultation',
        when: 'this week'
      });
    }
    
    return actions;
  }
  
  /**
   * Store session insights periodically
   */
  private async storeSessionInsights(
    session: CallSession,
    analysis: any,
    scoring: any
  ): Promise<void> {
    try {
      // Update or insert AI call insights
      await db.insert(aiCallInsights).values({
        callId: session.callId,
        leadId: session.leadId,
        agentId: session.agentId,
        duration: Math.floor((Date.now() - session.startTime.getTime()) / 1000),
        sentiment: analysis.sentiment,
        summary: analysis.summary,
        entities: analysis.entities,
        nextActions: [],
        confidence: analysis.confidence.toString()
      }).onConflictDoUpdate({
        target: aiCallInsights.callId,
        set: {
          duration: Math.floor((Date.now() - session.startTime.getTime()) / 1000),
          sentiment: analysis.sentiment,
          summary: analysis.summary,
          entities: analysis.entities,
          confidence: analysis.confidence.toString(),
          processedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error storing session insights:', error);
    }
  }
  
  /**
   * Get previous interaction count for a lead
   */
  private async getPreviousInteractionCount(leadId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(communicationLogs)
      .where(eq(communicationLogs.toParentId, leadId));
    
    return result[0]?.count || 0;
  }
  
  /**
   * Log communication
   */
  private async logCommunication(data: {
    fromUserId: number;
    leadId: number;
    type: string;
    content: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await db.insert(communicationLogs).values({
        fromUserId: data.fromUserId,
        toUserId: null,
        toParentId: data.leadId,
        type: data.type,
        subject: null,
        content: data.content,
        status: 'completed',
        scheduledFor: null,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: data.metadata || {},
        studentId: null
      });
    } catch (error) {
      console.error('Error logging communication:', error);
    }
  }
  
  /**
   * Start periodic insights update loop
   */
  private startInsightsUpdateLoop(): void {
    this.insightsUpdateInterval = setInterval(async () => {
      for (const [sessionId, session] of this.activeSessions) {
        if (session.status === 'active') {
          await this.updateSessionInsights(sessionId);
        }
      }
    }, 30000); // Update every 30 seconds
  }
  
  /**
   * Get active session
   */
  getSession(sessionId: string): CallSession | undefined {
    return this.activeSessions.get(sessionId);
  }
  
  /**
   * Get all active sessions
   */
  getActiveSessions(): CallSession[] {
    return Array.from(this.activeSessions.values());
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.insightsUpdateInterval) {
      clearInterval(this.insightsUpdateInterval);
    }
    
    // End all active sessions
    for (const sessionId of this.activeSessions.keys()) {
      this.endSession(sessionId).catch(console.error);
    }
  }
}

export const realtimeCallProcessor = new RealtimeCallProcessor();