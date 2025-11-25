/**
 * AI Sales Agent API Routes
 * Handles Telegram/WhatsApp webhook endpoints and management APIs
 */

import type { Express, Request, Response } from 'express';
import { aiSalesAgent } from '../services/ai-sales-agent/sales-agent-service';
import { telegramBot } from '../services/ai-sales-agent/telegram-bot';

export function registerAISalesAgentRoutes(app: Express) {
  console.log('✅ Registering AI Sales Agent routes...');

  // ====================================================================
  // TELEGRAM BOT ENDPOINTS
  // ====================================================================

  /**
   * Telegram Webhook Endpoint
   * POST /api/sales-agent/telegram/webhook
   */
  app.post('/api/sales-agent/telegram/webhook', async (req: Request, res: Response) => {
    try {
      const update = req.body;
      
      console.log('📨 Telegram webhook received:', {
        updateId: update?.update_id,
        hasMessage: !!update?.message,
        hasCallback: !!update?.callback_query
      });

      if (!update || !update.update_id) {
        console.warn('⚠️ Invalid Telegram update received');
        return res.status(200).json({ success: false, error: 'Invalid update' });
      }

      // Always respond immediately to Telegram (within 30 seconds)
      res.status(200).json({ success: true });

      // Process update asynchronously in background
      setImmediate(async () => {
        try {
          console.log('🔄 Processing Telegram update:', update.update_id);
          await telegramBot.processUpdate(update);
          console.log('✅ Telegram update processed successfully:', update.update_id);
        } catch (error) {
          console.error('❌ Telegram webhook processing error:', {
            updateId: update.update_id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      });
    } catch (error) {
      console.error('❌ Telegram webhook handler error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Return 200 OK to prevent Telegram from retrying
      res.status(200).json({ success: false });
    }
  });

  /**
   * Set Telegram Webhook URL
   * POST /api/sales-agent/telegram/set-webhook
   */
  app.post('/api/sales-agent/telegram/set-webhook', async (req: Request, res: Response) => {
    try {
      const { webhookUrl } = req.body;

      if (!webhookUrl) {
        return res.status(400).json({ success: false, error: 'Webhook URL is required' });
      }

      const result = await telegramBot.setWebhook(webhookUrl);

      res.json({
        success: result,
        message: result ? 'Webhook set successfully' : 'Failed to set webhook'
      });
    } catch (error) {
      console.error('Error setting Telegram webhook:', error);
      res.status(500).json({ success: false, error: 'Failed to set webhook' });
    }
  });

  /**
   * Get Telegram Bot Info
   * GET /api/sales-agent/telegram/bot-info
   */
  app.get('/api/sales-agent/telegram/bot-info', async (req: Request, res: Response) => {
    try {
      const botInfo = await telegramBot.getBotInfo();

      res.json({
        success: !!botInfo,
        bot: botInfo,
        isConfigured: telegramBot.isEnabled()
      });
    } catch (error) {
      console.error('Error getting bot info:', error);
      res.status(500).json({ success: false, error: 'Failed to get bot info' });
    }
  });

  // ====================================================================
  // WHATSAPP ENDPOINTS
  // ====================================================================

  /**
   * WhatsApp Webhook Verification (for Meta/Facebook WhatsApp Business API)
   * GET /api/sales-agent/whatsapp/webhook
   */
  app.get('/api/sales-agent/whatsapp/webhook', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'meta_lingua_verify';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  /**
   * WhatsApp Webhook Endpoint
   * POST /api/sales-agent/whatsapp/webhook
   */
  app.post('/api/sales-agent/whatsapp/webhook', async (req: Request, res: Response) => {
    try {
      const body = req.body;

      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === 'messages') {
              const value = change.value;
              
              if (value.messages && value.messages.length > 0) {
                for (const message of value.messages) {
                  await processWhatsAppMessage(message, value.metadata);
                }
              }
            }
          }
        }
      }

      // Always respond with 200 to WhatsApp
      res.sendStatus(200);
    } catch (error) {
      console.error('WhatsApp webhook error:', error);
      res.sendStatus(200); // Still respond 200 to prevent retries
    }
  });

  // ====================================================================
  // WEB CHAT ENDPOINTS
  // ====================================================================

  /**
   * Process Web Chat Message
   * POST /api/sales-agent/chat
   */
  app.post('/api/sales-agent/chat', async (req: Request, res: Response) => {
    try {
      const { sessionId, message, language } = req.body;

      if (!sessionId || !message) {
        return res.status(400).json({
          success: false,
          error: 'Session ID and message are required'
        });
      }

      const response = await aiSalesAgent.processMessage(
        sessionId,
        message,
        'web',
        sessionId, // Use session as user ID for web
        { language, source: 'website' }
      );

      res.json({
        success: true,
        response: {
          message: response.message,
          messageFa: response.messageFa,
          messageAr: response.messageAr,
          suggestedActions: response.suggestedActions,
          courses: response.courses,
          shouldEscalate: response.shouldEscalate
        }
      });
    } catch (error) {
      console.error('Web chat error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message'
      });
    }
  });

  /**
   * Get Chat Greeting
   * GET /api/sales-agent/greeting
   */
  app.get('/api/sales-agent/greeting', (req: Request, res: Response) => {
    const language = (req.query.language as 'fa' | 'en' | 'ar') || 'fa';
    const greeting = aiSalesAgent.getGreeting(language);

    res.json({
      success: true,
      greeting,
      language
    });
  });

  // ====================================================================
  // ADMIN/ANALYTICS ENDPOINTS
  // ====================================================================

  /**
   * Get Sales Agent Statistics
   * GET /api/sales-agent/stats
   */
  app.get('/api/sales-agent/stats', async (req: Request, res: Response) => {
    try {
      const stats = aiSalesAgent.getStats();
      const providerStatus = await aiSalesAgent.getProviderStatus();

      res.json({
        success: true,
        stats,
        aiProvider: providerStatus
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
  });

  /**
   * Cleanup Old Conversations
   * POST /api/sales-agent/cleanup
   */
  app.post('/api/sales-agent/cleanup', (req: Request, res: Response) => {
    try {
      const { maxAgeHours } = req.body;
      const cleaned = aiSalesAgent.cleanupOldConversations(maxAgeHours || 72);

      res.json({
        success: true,
        cleaned,
        message: `Cleaned up ${cleaned} old conversations`
      });
    } catch (error) {
      console.error('Error cleaning up:', error);
      res.status(500).json({ success: false, error: 'Cleanup failed' });
    }
  });

  /**
   * Health Check
   * GET /api/sales-agent/health
   */
  app.get('/api/sales-agent/health', async (req: Request, res: Response) => {
    const providerStatus = await aiSalesAgent.getProviderStatus();

    res.json({
      success: true,
      service: 'AI Sales Agent',
      version: '1.0.0',
      status: 'healthy',
      aiProvider: providerStatus,
      telegram: {
        configured: telegramBot.isEnabled()
      },
      whatsapp: {
        configured: !!process.env.WHATSAPP_ACCESS_TOKEN
      },
      features: [
        '24/7 Automated Response',
        'Multilingual Support (FA/EN/AR)',
        'Lead Capture & Scoring',
        'FAQ Handling',
        'Human Escalation',
        'Telegram Bot',
        'WhatsApp Business API',
        'Web Chat Widget'
      ]
    });
  });

  console.log('✅ AI Sales Agent routes registered successfully');
}

/**
 * Process WhatsApp message
 */
async function processWhatsAppMessage(message: any, metadata: any): Promise<void> {
  try {
    const phoneNumber = message.from;
    const sessionId = `whatsapp_${phoneNumber}`;
    const messageText = message.text?.body || '';

    if (!messageText) return;

    // Process through AI agent
    const response = await aiSalesAgent.processMessage(
      sessionId,
      messageText,
      'whatsapp',
      phoneNumber,
      { phoneNumber, messageId: message.id }
    );

    // Send response via WhatsApp API
    await sendWhatsAppMessage(phoneNumber, response.message, metadata);

  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
  }
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(
  to: string,
  text: string,
  metadata: any
): Promise<boolean> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn('⚠️ WhatsApp not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text }
        })
      }
    );

    const result = await response.json();
    return !!result.messages;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}
