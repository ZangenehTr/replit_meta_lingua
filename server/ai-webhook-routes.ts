/**
 * AI Webhook Routes - Handle external events for AI processing
 * Processes call events, transcriptions, and AI pipeline triggers
 */

import { Router } from 'express';
import { aiOrchestrator, type CallEndedEvent } from './ai-orchestrator';
import { ollamaService } from './ollama-service';
import { whisperService } from './whisper-service';
import { db } from './db';
import { aiCallInsights, leads } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Webhook authentication middleware (simple token-based)
const authenticateWebhook = (req: any, res: any, next: any) => {
  const token = req.headers['x-webhook-token'] || req.query.token;
  const expectedToken = process.env.WEBHOOK_TOKEN || 'meta-lingua-webhook-2025';
  
  if (token !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Call ended webhook - triggered when a call ends
const callEndedSchema = z.object({
  callId: z.string(),
  leadId: z.number(),
  agentId: z.number(),
  direction: z.enum(['inbound', 'outbound']),
  startedAt: z.string().transform((val) => new Date(val)),
  endedAt: z.string().transform((val) => new Date(val)),
  recordingUrl: z.string().optional(),
  transcriptUrl: z.string().optional()
});

router.post('/webhook/call-ended', authenticateWebhook, async (req, res) => {
  try {
    console.log('Received call-ended webhook:', req.body);
    
    // Validate request body
    const validatedData = callEndedSchema.parse(req.body) as CallEndedEvent;
    
    // Process asynchronously
    aiOrchestrator.processCallEnded(validatedData)
      .then(result => {
        console.log('Call processing completed:', result.success ? 'Success' : 'Failed');
      })
      .catch(error => {
        console.error('Call processing error:', error);
      });
    
    // Return immediate response
    res.json({ 
      success: true, 
      message: 'Call processing initiated',
      callId: validatedData.callId 
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? 'Invalid request data' 
        : 'Failed to process webhook' 
    });
  }
});

// Transcription ready webhook - triggered when transcription is ready
router.post('/webhook/transcription-ready', authenticateWebhook, async (req, res) => {
  try {
    const { callId, transcriptUrl } = req.body;
    
    if (!callId || !transcriptUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Update AI insights with transcript
    const response = await fetch(transcriptUrl);
    const transcript = await response.text();
    
    // Check if call insight exists
    const existing = await db.select()
      .from(aiCallInsights)
      .where(eq(aiCallInsights.callId, callId))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing insight
      await db.update(aiCallInsights)
        .set({ transcript })
        .where(eq(aiCallInsights.callId, callId));
    }
    
    res.json({ success: true, message: 'Transcript updated' });
    
  } catch (error) {
    console.error('Transcription webhook error:', error);
    res.status(500).json({ error: 'Failed to process transcription' });
  }
});

// Lead score update webhook - triggered when lead scoring is needed
router.post('/webhook/lead-score', authenticateWebhook, async (req, res) => {
  try {
    const { leadId } = req.body;
    
    if (!leadId) {
      return res.status(400).json({ error: 'Missing leadId' });
    }
    
    // Get all AI insights for this lead
    const insights = await db.select()
      .from(aiCallInsights)
      .where(eq(aiCallInsights.leadId, leadId))
      .orderBy(aiCallInsights.processedAt);
    
    if (insights.length === 0) {
      return res.json({ 
        success: true, 
        score: 50, 
        message: 'No AI insights available' 
      });
    }
    
    // Calculate lead score based on AI insights
    let totalScore = 50; // Base score
    let sentimentScore = 0;
    let engagementScore = 0;
    
    insights.forEach((insight) => {
      // Sentiment scoring
      if (insight.sentiment === 'positive') sentimentScore += 10;
      if (insight.sentiment === 'negative') sentimentScore -= 10;
      
      // Confidence-weighted scoring
      const confidenceWeight = insight.confidence || 0.5;
      engagementScore += confidenceWeight * 20;
    });
    
    // Average the scores
    sentimentScore = sentimentScore / insights.length;
    engagementScore = engagementScore / insights.length;
    
    totalScore = Math.min(100, Math.max(0, totalScore + sentimentScore + engagementScore));
    
    // Update lead priority based on score
    const priority = totalScore > 70 ? 'high' : totalScore > 40 ? 'medium' : 'low';
    await db.update(leads)
      .set({ priority })
      .where(eq(leads.id, leadId));
    
    res.json({ 
      success: true, 
      score: Math.round(totalScore),
      factors: {
        sentiment: sentimentScore,
        engagement: engagementScore,
        callCount: insights.length
      }
    });
    
  } catch (error) {
    console.error('Lead score webhook error:', error);
    res.status(500).json({ error: 'Failed to calculate lead score' });
  }
});

// AI service status endpoint
router.get('/ai/status', async (req, res) => {
  try {
    const [ollamaStatus, whisperStatus] = await Promise.all([
      ollamaService.testConnection(),
      whisperService.testConnection()
    ]);
    
    const processingStatus = aiOrchestrator.getProcessingStatus();
    
    res.json({
      status: 'operational',
      services: {
        ollama: ollamaStatus,
        whisper: whisperStatus
      },
      processing: processingStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Test AI summarization endpoint
router.post('/ai/test/summarize', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Missing transcript' });
    }
    
    const result = await ollamaService.summarizeCallTranscript(transcript);
    res.json(result);
    
  } catch (error) {
    console.error('Test summarize error:', error);
    res.status(500).json({ error: 'Failed to summarize' });
  }
});

// Test transcription endpoint
router.post('/ai/test/transcribe', async (req, res) => {
  try {
    const { audioUrl } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'Missing audioUrl' });
    }
    
    const result = await whisperService.transcribeUrl(audioUrl);
    res.json(result);
    
  } catch (error) {
    console.error('Test transcribe error:', error);
    res.status(500).json({ error: 'Failed to transcribe' });
  }
});

// Get AI insights for a lead
router.get('/ai/insights/lead/:leadId', async (req, res) => {
  try {
    const leadId = parseInt(req.params.leadId);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ error: 'Invalid leadId' });
    }
    
    const insights = await db.select()
      .from(aiCallInsights)
      .where(eq(aiCallInsights.leadId, leadId))
      .orderBy(aiCallInsights.processedAt);
    
    res.json({ 
      success: true, 
      leadId,
      insights,
      count: insights.length 
    });
    
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

// Get AI insights for a specific call
router.get('/ai/insights/call/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    
    const insight = await db.select()
      .from(aiCallInsights)
      .where(eq(aiCallInsights.callId, callId))
      .limit(1);
    
    if (insight.length === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    
    res.json({ 
      success: true, 
      insight: insight[0]
    });
    
  } catch (error) {
    console.error('Get call insight error:', error);
    res.status(500).json({ error: 'Failed to get insight' });
  }
});

// Process batch of historical calls
router.post('/ai/batch-process', authenticateWebhook, async (req, res) => {
  try {
    const { calls } = req.body;
    
    if (!Array.isArray(calls) || calls.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty calls array' });
    }
    
    // Validate all calls
    const validatedCalls = calls.map(call => callEndedSchema.parse(call) as CallEndedEvent);
    
    // Process batch asynchronously
    aiOrchestrator.processBatch(validatedCalls)
      .then(results => {
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        console.log(`Batch processing completed: ${successful} successful, ${failed} failed`);
      })
      .catch(error => {
        console.error('Batch processing error:', error);
      });
    
    res.json({ 
      success: true, 
      message: 'Batch processing initiated',
      count: validatedCalls.length
    });
    
  } catch (error) {
    console.error('Batch process error:', error);
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? 'Invalid batch data' 
        : 'Failed to process batch' 
    });
  }
});

// Clear processing queue (admin only)
router.post('/ai/admin/clear-queue', authenticateWebhook, async (req, res) => {
  try {
    aiOrchestrator.clearQueue();
    res.json({ 
      success: true, 
      message: 'Processing queue cleared' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear queue' });
  }
});

export default router;