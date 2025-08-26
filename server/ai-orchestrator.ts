/**
 * AI Orchestrator - Coordinates AI pipeline for CRM integration
 * Handles call events, transcription, summarization, and lead management
 * Completely self-hosted with Persian language support
 */

import { EventEmitter } from 'events';
import { ollamaService } from './ollama-service';
import { whisperService } from './whisper-service';
import { db } from './db';
import { aiCallInsights, leads, communicationLogs } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface CallEndedEvent {
  callId: string;
  leadId: number;
  agentId: number;
  direction: 'inbound' | 'outbound';
  startedAt: Date;
  endedAt: Date;
  recordingUrl?: string;
  transcriptUrl?: string;
}

export interface AIProcessingResult {
  success: boolean;
  callId: string;
  leadId: number;
  transcript?: string;
  summary?: any;
  entities?: any;
  sentiment?: any;
  nextActions?: any[];
  confidence?: number;
  error?: string;
}

export class AIOrchestrator extends EventEmitter {
  private processingQueue: Map<string, boolean> = new Map();
  private retryAttempts = 3;
  private retryDelay = 5000; // 5 seconds

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize AI services
   */
  private async initialize() {
    console.log('Initializing AI Orchestrator...');
    
    // Check service availability
    const ollamaStatus = {
      success: await ollamaService.isServiceAvailable(),
      message: 'Ollama service check'
    };
    const whisperStatus = await whisperService.testConnection();
    
    console.log('AI Services Status:');
    console.log(`- Ollama: ${ollamaStatus.success ? '✓' : '✗'} ${ollamaStatus.message}`);
    console.log(`- Whisper: ${whisperStatus.success ? '✓' : '✗'} ${whisperStatus.message}`);
    
    this.emit('initialized', {
      ollama: ollamaStatus,
      whisper: whisperStatus
    });
  }

  /**
   * Process call-ended event
   */
  async processCallEnded(event: CallEndedEvent): Promise<AIProcessingResult> {
    const callId = event.callId;
    
    // Check if already processing
    if (this.processingQueue.has(callId)) {
      console.log(`Call ${callId} already being processed`);
      return {
        success: false,
        callId,
        leadId: event.leadId,
        error: 'Already processing'
      };
    }

    this.processingQueue.set(callId, true);
    
    try {
      console.log(`Processing call ${callId} for lead ${event.leadId}`);
      
      // Step 1: Get transcript
      let transcript = '';
      if (event.transcriptUrl) {
        // Use existing transcript if available
        transcript = await this.fetchTranscript(event.transcriptUrl);
      } else if (event.recordingUrl) {
        // Transcribe audio recording
        transcript = await this.transcribeRecording(event.recordingUrl);
      } else {
        throw new Error('No recording or transcript available');
      }
      
      if (!transcript) {
        throw new Error('Failed to get transcript');
      }
      
      // Step 2: Generate AI insights
      const [summary, entities, sentiment] = await Promise.all([
        ollamaService.summarizeCallTranscript(transcript),
        ollamaService.extractEntities(transcript),
        ollamaService.analyzeSentiment(transcript)
      ]);
      
      // Step 3: Generate follow-up suggestions
      const followUpSuggestions = await ollamaService.generateFollowUpSuggestions({
        transcript: summary.summary_bullets.join(' '),
        sentiment: sentiment.sentiment,
        intent: summary.intent
      });
      
      // Step 4: Store AI insights in database
      await this.storeAIInsights({
        callId,
        leadId: event.leadId,
        agentId: event.agentId,
        transcript,
        intent: summary.intent,
        sentiment: sentiment.sentiment,
        summary: summary.summary_bullets.join('\n'),
        entities,
        nextActions: summary.next_actions,
        confidence: summary.confidence
      });
      
      // Step 5: Update lead with AI suggestions
      await this.updateLeadWithAI({
        leadId: event.leadId,
        stage: summary.lead_stage_suggestion,
        priority: this.calculatePriority(sentiment.sentiment, summary.confidence),
        entities
      });
      
      // Step 6: Create communication log
      await this.createCommunicationLog({
        leadId: event.leadId,
        type: 'call_summary',
        source: 'ai',
        content: summary.summary_bullets.join('\n'),
        metadata: {
          callId,
          intent: summary.intent,
          sentiment: sentiment.sentiment,
          entities,
          nextActions: summary.next_actions,
          confidence: summary.confidence
        }
      });
      
      // Step 7: Store follow-up actions in communication log
      // Tasks are stored as metadata in the communication log since we don't have a separate tasks table
      
      this.processingQueue.delete(callId);
      
      // Emit success event
      this.emit('callProcessed', {
        callId,
        leadId: event.leadId,
        summary,
        entities,
        sentiment,
        followUpSuggestions
      });
      
      return {
        success: true,
        callId,
        leadId: event.leadId,
        transcript,
        summary,
        entities,
        sentiment,
        nextActions: summary.next_actions,
        confidence: summary.confidence
      };
      
    } catch (error) {
      console.error(`Error processing call ${callId}:`, error);
      this.processingQueue.delete(callId);
      
      // Emit error event
      this.emit('processingError', {
        callId,
        leadId: event.leadId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        success: false,
        callId,
        leadId: event.leadId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch transcript from URL
   */
  private async fetchTranscript(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch transcript');
      return await response.text();
    } catch (error) {
      console.error('Error fetching transcript:', error);
      return '';
    }
  }

  /**
   * Transcribe audio recording
   */
  private async transcribeRecording(recordingUrl: string): Promise<string> {
    try {
      const result = await whisperService.transcribeUrl(recordingUrl, {
        language: 'fa', // Persian
        task: 'transcribe'
      });
      return result.text;
    } catch (error) {
      console.error('Error transcribing recording:', error);
      // Retry with fallback
      await this.delay(this.retryDelay);
      try {
        const retryResult = await whisperService.transcribeUrl(recordingUrl);
        return retryResult.text;
      } catch (retryError) {
        console.error('Transcription retry failed:', retryError);
        return '';
      }
    }
  }

  /**
   * Store AI insights in database
   */
  private async storeAIInsights(data: {
    callId: string;
    leadId: number;
    agentId: number;
    transcript: string;
    intent: string;
    sentiment: string;
    summary: string;
    entities: any;
    nextActions: any[];
    confidence: number;
  }) {
    try {
      await db.insert(aiCallInsights).values({
        callId: data.callId,
        leadId: data.leadId,
        agentId: data.agentId,
        transcript: data.transcript,
        intent: data.intent,
        sentiment: data.sentiment,
        summary: data.summary,
        entities: data.entities,
        nextActions: data.nextActions,
        confidence: data.confidence
      });
      console.log(`AI insights stored for call ${data.callId}`);
    } catch (error) {
      console.error('Error storing AI insights:', error);
    }
  }

  /**
   * Update lead with AI suggestions
   */
  private async updateLeadWithAI(data: {
    leadId: number;
    stage?: string;
    priority?: string;
    entities?: any;
  }) {
    try {
      const updates: any = {};
      
      // Update stage if suggested
      if (data.stage) {
        updates.status = data.stage;
      }
      
      // Update priority if calculated
      if (data.priority) {
        updates.priority = data.priority;
      }
      
      // Update contact info from entities if found
      if (data.entities) {
        if (data.entities.name) updates.name = data.entities.name;
        if (data.entities.phone) updates.phone = data.entities.phone;
        if (data.entities.email) updates.email = data.entities.email;
      }
      
      if (Object.keys(updates).length > 0) {
        await db.update(leads)
          .set(updates)
          .where(eq(leads.id, data.leadId));
        console.log(`Lead ${data.leadId} updated with AI suggestions`);
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  }

  /**
   * Create communication log
   */
  private async createCommunicationLog(data: {
    leadId: number;
    type: string;
    source: string;
    content: string;
    metadata: any;
  }) {
    try {
      await db.insert(leadCommunication).values({
        leadId: data.leadId,
        type: data.type,
        channel: 'call',
        direction: 'internal',
        content: data.content,
        metadata: data.metadata,
        status: 'completed'
      });
      console.log(`Communication log created for lead ${data.leadId}`);
    } catch (error) {
      console.error('Error creating communication log:', error);
    }
  }


  /**
   * Calculate priority based on sentiment and confidence
   */
  private calculatePriority(sentiment: string, confidence: number): string {
    if (sentiment === 'negative' && confidence > 0.7) {
      return 'high';
    }
    if (sentiment === 'positive' && confidence > 0.7) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Calculate due date from text
   */
  private calculateDueDate(whenText?: string): Date {
    const now = new Date();
    
    if (!whenText) return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    const lowerText = whenText.toLowerCase();
    
    if (lowerText.includes('tomorrow')) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    if (lowerText.includes('today')) {
      return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
    }
    if (lowerText.includes('week')) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    if (lowerText.includes('hour')) {
      const hours = parseInt(lowerText) || 1;
      return new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
    
    // Default to 24 hours
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process batch of calls
   */
  async processBatch(events: CallEndedEvent[]): Promise<AIProcessingResult[]> {
    console.log(`Processing batch of ${events.length} calls`);
    
    // Process in parallel with concurrency limit
    const concurrencyLimit = 3;
    const results: AIProcessingResult[] = [];
    
    for (let i = 0; i < events.length; i += concurrencyLimit) {
      const batch = events.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(event => this.processCallEnded(event))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Get processing status
   */
  getProcessingStatus(): { queue: number; processing: string[] } {
    return {
      queue: this.processingQueue.size,
      processing: Array.from(this.processingQueue.keys())
    };
  }

  /**
   * Clear processing queue
   */
  clearQueue() {
    this.processingQueue.clear();
    console.log('Processing queue cleared');
  }
}

// Singleton instance
export const aiOrchestrator = new AIOrchestrator();