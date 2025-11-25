/**
 * Telegram Bot Handler for Meta Lingua AI Sales Agent
 * Self-hosted Telegram bot for 24/7 automated sales and support
 * No external dependencies - uses Telegram Bot API directly
 */

import { aiSalesAgent, AgentResponse } from './sales-agent-service';

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  contact?: TelegramContact;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramSendMessageOptions {
  chat_id: number | string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: TelegramReplyMarkup;
}

export interface TelegramReplyMarkup {
  inline_keyboard?: TelegramInlineKeyboardButton[][];
  keyboard?: TelegramKeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  request_contact?: boolean;
}

export interface TelegramInlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface TelegramKeyboardButton {
  text: string;
  request_contact?: boolean;
}

export class TelegramBotService {
  private botToken: string;
  private baseUrl: string;
  private isConfigured: boolean = false;
  private lastUpdateId: number = 0;
  private pollingActive: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.isConfigured = !!this.botToken;

    if (!this.isConfigured) {
      console.warn('⚠️ Telegram Bot Token not configured. Set TELEGRAM_BOT_TOKEN environment variable.');
    } else {
      console.log('✅ Telegram Bot Service initialized');
      // Start polling in background
      this.startPolling();
    }
  }

  /**
   * Start polling for messages
   */
  private async startPolling(): Promise<void> {
    if (this.pollingActive) return;
    
    this.pollingActive = true;
    console.log('🔄 Starting Telegram bot polling mode...');
    
    // Poll immediately first
    await this.pollUpdates();
    
    // Then set interval for continued polling
    this.pollingInterval = setInterval(() => {
      this.pollUpdates().catch(error => {
        console.error('❌ Polling error:', error);
      });
    }, 1000); // Poll every 1 second
  }

  /**
   * Poll for new updates from Telegram
   */
  private async pollUpdates(): Promise<void> {
    if (!this.isConfigured) return;

    try {
      const response = await fetch(`${this.baseUrl}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset: this.lastUpdateId + 1,
          timeout: 0, // Don't long-poll, return immediately
          allowed_updates: ['message', 'callback_query']
        })
      });

      const result = await response.json();
      
      if (result.ok && result.result && result.result.length > 0) {
        console.log(`📨 Received ${result.result.length} Telegram updates`);
        
        for (const update of result.result) {
          // Update the offset
          if (update.update_id > this.lastUpdateId) {
            this.lastUpdateId = update.update_id;
          }
          
          // Process update
          try {
            console.log(`🔄 Processing update ${update.update_id}...`);
            await this.processUpdate(update);
            console.log(`✅ Successfully processed update ${update.update_id}`);
          } catch (error) {
            console.error(`❌ Error processing update ${update.update_id}:`, {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Polling error:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.pollingActive = false;
      console.log('⏹️ Telegram polling stopped');
    }
  }

  /**
   * Check if bot is configured
   */
  isEnabled(): boolean {
    return this.isConfigured;
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(options: TelegramSendMessageOptions): Promise<boolean> {
    if (!this.isConfigured) return false;

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Telegram sendMessage error:', error);
      return false;
    }
  }

  /**
   * Send message with quick reply buttons
   */
  async sendMessageWithButtons(
    chatId: number | string,
    text: string,
    buttons: string[][]
  ): Promise<boolean> {
    const inlineKeyboard = buttons.map(row => 
      row.map(btn => ({ text: btn, callback_data: btn }))
    );

    return this.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  }

  /**
   * Send message with contact request button
   */
  async requestContact(chatId: number | string, text: string): Promise<boolean> {
    return this.sendMessage({
      chat_id: chatId,
      text,
      reply_markup: {
        keyboard: [[{ text: '📱 اشتراک‌گذاری شماره تماس', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  }

  /**
   * Answer callback query
   */
  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string
  ): Promise<boolean> {
    if (!this.isConfigured) return false;

    try {
      const response = await fetch(`${this.baseUrl}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text
        })
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Telegram answerCallbackQuery error:', error);
      return false;
    }
  }

  /**
   * Process incoming webhook update
   */
  async processUpdate(update: TelegramUpdate): Promise<void> {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (error) {
      console.error('Error processing Telegram update:', error);
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id;
    const userId = message.from.id.toString();
    const sessionId = `telegram_${chatId}`;

    // Handle contact sharing
    if (message.contact) {
      await this.handleContactShared(chatId, message.contact, sessionId, userId);
      return;
    }

    // Handle text message
    if (message.text) {
      // Handle /start command
      if (message.text === '/start') {
        await this.handleStartCommand(chatId, message.from, sessionId, userId);
        return;
      }

      // Process regular message through AI agent
      const response = await aiSalesAgent.processMessage(
        sessionId,
        message.text,
        'telegram',
        userId,
        {
          firstName: message.from.first_name,
          lastName: message.from.last_name,
          username: message.from.username,
          languageCode: message.from.language_code
        }
      );

      await this.sendAgentResponse(chatId, response);
    }
  }

  /**
   * Handle /start command
   */
  private async handleStartCommand(
    chatId: number,
    user: TelegramUser,
    sessionId: string,
    userId: string
  ): Promise<void> {
    // Detect user's language preference
    const language = this.detectUserLanguage(user.language_code);
    
    // Get personalized greeting
    const greeting = aiSalesAgent.getGreeting(language);

    // Send welcome message with quick action buttons
    const welcomeMessage = this.getWelcomeMessage(language, user.first_name);
    
    await this.sendMessage({
      chat_id: chatId,
      text: welcomeMessage,
      parse_mode: 'HTML'
    });

    // Send quick action buttons
    await this.sendQuickActionButtons(chatId, language);
  }

  /**
   * Get localized welcome message
   */
  private getWelcomeMessage(language: 'fa' | 'en' | 'ar', firstName: string): string {
    const messages = {
      fa: `سلام ${firstName}! 👋

به <b>آکادمی متا لینگوا</b> خوش آمدید!

من دستیار هوشمند آکادمی هستم و ۲۴ ساعته آماده پاسخگویی به سؤالات شما هستم.

🎯 <b>چطور می‌تونم کمکتون کنم؟</b>

لطفاً یکی از گزینه‌های زیر رو انتخاب کنید یا سؤالتون رو مستقیم بپرسید:`,

      en: `Hello ${firstName}! 👋

Welcome to <b>Meta Lingua Academy</b>!

I'm the academy's AI assistant, available 24/7 to answer your questions.

🎯 <b>How can I help you?</b>

Please choose one of the options below or ask your question directly:`,

      ar: `مرحباً ${firstName}! 👋

أهلاً بك في <b>أكاديمية ميتا لينغوا</b>!

أنا المساعد الذكي للأكاديمية، متاح على مدار الساعة للإجابة على أسئلتك.

🎯 <b>كيف يمكنني مساعدتك؟</b>

يرجى اختيار أحد الخيارات أدناه أو طرح سؤالك مباشرة:`
    };

    return messages[language];
  }

  /**
   * Send quick action buttons based on language
   */
  private async sendQuickActionButtons(
    chatId: number,
    language: 'fa' | 'en' | 'ar'
  ): Promise<void> {
    const buttons = {
      fa: [
        ['📚 اطلاعات دوره‌ها', '💰 قیمت‌ها'],
        ['⏰ ساعات کلاس‌ها', '👨‍🏫 معرفی اساتید'],
        ['🎁 جلسه آزمایشی رایگان', '📱 تماس با ما']
      ],
      en: [
        ['📚 Course Info', '💰 Prices'],
        ['⏰ Class Schedule', '👨‍🏫 Our Teachers'],
        ['🎁 Free Trial Session', '📱 Contact Us']
      ],
      ar: [
        ['📚 معلومات الدورات', '💰 الأسعار'],
        ['⏰ جدول الفصول', '👨‍🏫 معلمونا'],
        ['🎁 جلسة تجريبية مجانية', '📱 اتصل بنا']
      ]
    };

    await this.sendMessageWithButtons(chatId, '👇', buttons[language]);
  }

  /**
   * Handle callback query (button press)
   */
  private async handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
    const chatId = query.message?.chat.id;
    const userId = query.from.id.toString();
    const sessionId = `telegram_${chatId}`;
    const data = query.data || '';

    // Answer the callback to remove loading state
    await this.answerCallbackQuery(query.id);

    if (!chatId) return;

    // Process button press as a regular message
    const response = await aiSalesAgent.processMessage(
      sessionId,
      data,
      'telegram',
      userId,
      {
        firstName: query.from.first_name,
        lastName: query.from.last_name,
        username: query.from.username
      }
    );

    await this.sendAgentResponse(chatId, response);
  }

  /**
   * Handle contact shared
   */
  private async handleContactShared(
    chatId: number,
    contact: TelegramContact,
    sessionId: string,
    userId: string
  ): Promise<void> {
    // Process contact as a message
    const message = `شماره تماس من: ${contact.phone_number}`;
    
    const response = await aiSalesAgent.processMessage(
      sessionId,
      message,
      'telegram',
      userId,
      {
        phone: contact.phone_number,
        firstName: contact.first_name,
        lastName: contact.last_name
      }
    );

    // Send confirmation and next steps
    const confirmationMessage = {
      fa: `✅ ممنون ${contact.first_name}! شماره تماس شما ذخیره شد.\n\nهمکاران ما به زودی با شما تماس خواهند گرفت.`,
      en: `✅ Thank you ${contact.first_name}! Your contact number has been saved.\n\nOur team will reach out to you soon.`,
      ar: `✅ شكراً ${contact.first_name}! تم حفظ رقم هاتفك.\n\nسيتواصل فريقنا معك قريباً.`
    };

    await this.sendMessage({
      chat_id: chatId,
      text: confirmationMessage.fa, // Default to Persian
      parse_mode: 'HTML'
    });
  }

  /**
   * Send agent response to user
   */
  private async sendAgentResponse(
    chatId: number,
    response: AgentResponse
  ): Promise<void> {
    // Send main message
    await this.sendMessage({
      chat_id: chatId,
      text: response.message,
      parse_mode: 'HTML'
    });

    // If should escalate, notify about human handoff
    if (response.shouldEscalate) {
      await this.sendMessage({
        chat_id: chatId,
        text: '🧑‍💼 یکی از همکاران ما به زودی با شما تماس خواهد گرفت.',
        parse_mode: 'HTML'
      });
    }

    // If suggested actions, send as buttons
    if (response.suggestedActions && response.suggestedActions.length > 0) {
      const buttons = [response.suggestedActions];
      await this.sendMessageWithButtons(chatId, '👇 گزینه‌های پیشنهادی:', buttons);
    }

    // If courses recommended, send course cards
    if (response.courses && response.courses.length > 0) {
      for (const course of response.courses.slice(0, 3)) {
        await this.sendCourseCard(chatId, course);
      }
    }
  }

  /**
   * Send course information card
   */
  private async sendCourseCard(chatId: number, course: any): Promise<void> {
    const message = `
📘 <b>${course.title}</b>

📝 ${course.description}
⏱ مدت: ${course.duration}
💰 قیمت: ${course.price}

🎯 سطح: ${course.level}
    `.trim();

    await this.sendMessage({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '📋 اطلاعات بیشتر', callback_data: `course_info_${course.id}` },
          { text: '✅ ثبت‌نام', callback_data: `enroll_${course.id}` }
        ]]
      }
    });
  }

  /**
   * Detect user language from Telegram language code
   */
  private detectUserLanguage(languageCode?: string): 'fa' | 'en' | 'ar' {
    if (!languageCode) return 'fa'; // Default to Persian
    
    if (languageCode.startsWith('fa') || languageCode === 'ir') return 'fa';
    if (languageCode.startsWith('ar')) return 'ar';
    return 'en';
  }

  /**
   * Set webhook for the bot
   */
  async setWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.isConfigured) return false;

    try {
      const response = await fetch(`${this.baseUrl}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query']
        })
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log(`✅ Telegram webhook set to: ${webhookUrl}`);
      } else {
        console.error('❌ Failed to set Telegram webhook:', result);
      }

      return result.ok;
    } catch (error) {
      console.error('Error setting Telegram webhook:', error);
      return false;
    }
  }

  /**
   * Get bot info
   */
  async getBotInfo(): Promise<any> {
    if (!this.isConfigured) return null;

    try {
      const response = await fetch(`${this.baseUrl}/getMe`);
      const result = await response.json();
      return result.ok ? result.result : null;
    } catch (error) {
      console.error('Error getting bot info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const telegramBot = new TelegramBotService();
