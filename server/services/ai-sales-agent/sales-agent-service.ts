/**
 * Meta Lingua AI Sales Agent Service
 * Professional 24/7 automated sales and support chatbot
 * Supports Telegram and WhatsApp with multilingual capabilities (FA/EN/AR)
 * Uses AIProviderManager for Ollama/OpenAI dual support
 */

import { AIProviderManager } from '../../ai-providers/ai-provider-manager';
import { DatabaseStorage } from '../../database-storage';
import { db } from '../../db';
import { guestLeads, users, courses, instituteEvents } from '@shared/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  language?: 'fa' | 'en' | 'ar';
}

export interface ConversationContext {
  sessionId: string;
  platform: 'telegram' | 'whatsapp' | 'web';
  userId: string;
  language: 'fa' | 'en' | 'ar';
  messages: ConversationMessage[];
  leadData: LeadData;
  stage: ConversationStage;
  lastActive: Date;
  metadata: Record<string, any>;
}

export interface LeadData {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  currentLevel?: string;
  targetLanguage?: string;
  interests?: string[];
  budget?: string;
  preferredSchedule?: string;
  source: string;
  score: number;
}

export type ConversationStage = 
  | 'greeting'
  | 'qualification'
  | 'needs_assessment'
  | 'course_recommendation'
  | 'pricing_discussion'
  | 'objection_handling'
  | 'closing'
  | 'follow_up'
  | 'escalation'
  | 'completed';

export interface AgentResponse {
  message: string;
  messageFa?: string;
  messageAr?: string;
  suggestedActions?: string[];
  courses?: any[];
  shouldEscalate: boolean;
  escalationReason?: string;
  leadScore: number;
  nextStage?: ConversationStage;
}

export class AISalesAgentService {
  private aiProvider: AIProviderManager;
  private conversations: Map<string, ConversationContext> = new Map();
  private initialized: boolean = false;

  // Multilingual system prompts
  private readonly SYSTEM_PROMPT = {
    fa: `شما یک مشاور حرفه‌ای آموزش زبان در آکادمی متا لینگوا هستید. با مهربانی و حرفه‌ای پاسخ دهید.
مأموریت شما:
1. به سؤالات درباره دوره‌های زبان پاسخ دهید
2. نیازهای یادگیری مشتری را شناسایی کنید
3. دوره‌های مناسب پیشنهاد دهید
4. اطلاعات تماس جمع‌آوری کنید
5. برای موضوعات پیچیده به تیم انسانی ارجاع دهید

قوانین مهم:
- همیشه مودب و صبور باشید
- از اصطلاحات ساده استفاده کنید
- سؤالات باز بپرسید
- هرگز قیمت دقیق ندهید، فقط محدوده قیمت
- برای ثبت‌نام نهایی به تیم انسانی ارجاع دهید`,

    en: `You are a professional language learning consultant at Meta Lingua Academy. Be friendly and professional.
Your mission:
1. Answer questions about language courses
2. Identify customer learning needs
3. Recommend suitable courses
4. Collect contact information
5. Escalate complex issues to human team

Important rules:
- Always be polite and patient
- Use simple language
- Ask open-ended questions
- Never give exact prices, only ranges
- Refer to human team for final enrollment`,

    ar: `أنت مستشار تعليم لغات محترف في أكاديمية ميتا لينغوا. كن ودوداً ومهنياً.
مهمتك:
1. الإجابة على الأسئلة حول دورات اللغة
2. تحديد احتياجات تعلم العملاء
3. التوصية بالدورات المناسبة
4. جمع معلومات الاتصال
5. تصعيد المشكلات المعقدة إلى الفريق البشري

قواعد مهمة:
- كن دائماً مهذباً وصبوراً
- استخدم لغة بسيطة
- اطرح أسئلة مفتوحة
- لا تعطي أسعاراً دقيقة، فقط نطاقات
- أحل إلى الفريق البشري للتسجيل النهائي`
  };

  // Greeting templates
  private readonly GREETINGS = {
    fa: [
      'سلام! 👋 به آکادمی متا لینگوا خوش آمدید. چطور می‌تونم کمکتون کنم؟',
      'سلام! خوشحالم که با ما تماس گرفتید. آیا علاقه‌مند به یادگیری زبان هستید؟',
      'درود! من دستیار هوشمند متا لینگوا هستم. درباره چه زبانی می‌خواهید بیشتر بدانید؟'
    ],
    en: [
      'Hello! 👋 Welcome to Meta Lingua Academy. How can I help you today?',
      'Hi there! Glad you reached out. Are you interested in learning a new language?',
      'Greetings! I\'m the Meta Lingua AI assistant. What language would you like to learn about?'
    ],
    ar: [
      'مرحباً! 👋 أهلاً بك في أكاديمية ميتا لينغوا. كيف يمكنني مساعدتك؟',
      'أهلاً! سعيد بتواصلك معنا. هل أنت مهتم بتعلم لغة جديدة؟',
      'تحياتي! أنا المساعد الذكي لميتا لينغوا. ما اللغة التي تريد معرفة المزيد عنها؟'
    ]
  };

  // FAQ responses
  private readonly FAQ_RESPONSES = {
    prices: {
      fa: 'قیمت دوره‌ها بسته به سطح و مدت زمان متفاوت است. دوره‌های مبتدی از ۵۰۰ هزار تومان شروع می‌شود. برای اطلاعات دقیق‌تر، لطفاً شماره تماس خود را بگذارید تا همکاران ما با شما تماس بگیرند.',
      en: 'Course prices vary based on level and duration. Beginner courses start from 500,000 Tomans. For more detailed information, please leave your contact number and our team will reach out.',
      ar: 'تختلف أسعار الدورات حسب المستوى والمدة. تبدأ دورات المبتدئين من 500,000 تومان. لمزيد من المعلومات، يرجى ترك رقم هاتفك وسيتواصل فريقنا معك.'
    },
    schedule: {
      fa: 'کلاس‌ها در شیفت‌های صبح، عصر و شب برگزار می‌شود. همچنین کلاس‌های آخر هفته هم داریم. چه زمانی برای شما مناسب‌تر است؟',
      en: 'Classes are held in morning, afternoon, and evening shifts. We also have weekend classes. What time works best for you?',
      ar: 'تُعقد الفصول في فترات الصباح والظهر والمساء. لدينا أيضاً فصول نهاية الأسبوع. ما الوقت الأنسب لك؟'
    },
    trial: {
      fa: 'بله، ما جلسه آزمایشی رایگان داریم! می‌توانید یک جلسه را تجربه کنید و ببینید روش تدریس ما چگونه است. آیا علاقه‌مند هستید؟',
      en: 'Yes, we offer a free trial session! You can experience one class to see our teaching method. Would you be interested?',
      ar: 'نعم، نقدم جلسة تجريبية مجانية! يمكنك تجربة فصل واحد لترى طريقة تدريسنا. هل أنت مهتم؟'
    },
    teachers: {
      fa: 'اساتید ما همه دارای مدرک بین‌المللی هستند و حداقل ۵ سال تجربه تدریس دارند. بسیاری از آنها سابقه تحصیل یا زندگی در کشورهای انگلیسی‌زبان را دارند.',
      en: 'Our teachers all have international certifications and at least 5 years of teaching experience. Many have studied or lived in English-speaking countries.',
      ar: 'جميع معلمينا حاصلون على شهادات دولية ولديهم خبرة تدريس لا تقل عن 5 سنوات. كثير منهم درسوا أو عاشوا في دول ناطقة بالإنجليزية.'
    },
    online: {
      fa: 'بله، هم کلاس حضوری داریم و هم آنلاین. کلاس‌های آنلاین از طریق پلتفرم ویدیویی اختصاصی ما برگزار می‌شود که شامل تخته سفید تعاملی و امکانات ضبط جلسه است.',
      en: 'Yes, we have both in-person and online classes. Online classes are conducted through our dedicated video platform with interactive whiteboard and session recording features.',
      ar: 'نعم، لدينا فصول حضورية وعبر الإنترنت. تُعقد الفصول عبر الإنترنت من خلال منصتنا المخصصة للفيديو مع سبورة تفاعلية وميزات تسجيل الجلسة.'
    }
  };

  constructor() {
    this.aiProvider = new AIProviderManager();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.aiProvider.initialize();
    this.initialized = true;
    console.log('✅ AI Sales Agent Service initialized with Ollama/OpenAI dual support');
  }

  /**
   * Process an incoming message and generate a response
   */
  async processMessage(
    sessionId: string,
    message: string,
    platform: 'telegram' | 'whatsapp' | 'web',
    userId: string,
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    await this.initialize();

    // Get or create conversation context
    let context = this.conversations.get(sessionId);
    if (!context) {
      context = this.createNewConversation(sessionId, platform, userId, metadata);
    }

    // Detect language from message
    const detectedLanguage = this.detectLanguage(message);
    context.language = detectedLanguage;

    // Add user message to history
    context.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      language: detectedLanguage
    });

    // Update last active
    context.lastActive = new Date();

    // Process message based on current stage
    let response: AgentResponse;

    try {
      // Check for FAQ patterns first
      const faqResponse = this.checkFAQ(message, detectedLanguage);
      if (faqResponse) {
        response = {
          message: faqResponse,
          shouldEscalate: false,
          leadScore: context.leadData.score
        };
      } else {
        // Use AI for complex queries
        response = await this.generateAIResponse(context, message);
      }

      // Extract lead information from message
      this.extractLeadInfo(context, message);

      // Update lead score
      context.leadData.score = this.calculateLeadScore(context);

      // Add assistant response to history
      context.messages.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        language: detectedLanguage
      });

      // Update conversation in memory
      this.conversations.set(sessionId, context);

      // Save lead data to database
      await this.saveLeadData(context);

      return response;

    } catch (error) {
      console.error('Error processing message:', error);
      return this.getErrorResponse(detectedLanguage);
    }
  }

  /**
   * Create a new conversation context
   */
  private createNewConversation(
    sessionId: string,
    platform: 'telegram' | 'whatsapp' | 'web',
    userId: string,
    metadata?: Record<string, any>
  ): ConversationContext {
    const context: ConversationContext = {
      sessionId,
      platform,
      userId,
      language: 'fa', // Default to Persian
      messages: [],
      leadData: {
        source: platform,
        score: 0
      },
      stage: 'greeting',
      lastActive: new Date(),
      metadata: metadata || {}
    };

    this.conversations.set(sessionId, context);
    return context;
  }

  /**
   * Detect message language
   */
  private detectLanguage(text: string): 'fa' | 'en' | 'ar' {
    const persianPattern = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const arabicPattern = /[\u0621-\u063A\u0641-\u064A]/;
    
    const hasPersian = persianPattern.test(text);
    const hasArabic = arabicPattern.test(text);
    
    // Check for Persian-specific characters (پ، چ، ژ، گ، ی)
    const persianSpecific = /[پچژگی]/;
    if (persianSpecific.test(text)) {
      return 'fa';
    }
    
    if (hasArabic && !hasPersian) {
      return 'ar';
    }
    
    if (hasPersian) {
      return 'fa';
    }
    
    return 'en';
  }

  /**
   * Check for FAQ patterns
   */
  private checkFAQ(message: string, language: 'fa' | 'en' | 'ar'): string | null {
    const lowerMessage = message.toLowerCase();
    
    // Price keywords
    if (lowerMessage.includes('قیمت') || lowerMessage.includes('هزینه') || 
        lowerMessage.includes('price') || lowerMessage.includes('cost') ||
        lowerMessage.includes('سعر') || lowerMessage.includes('تكلفة')) {
      return this.FAQ_RESPONSES.prices[language];
    }

    // Schedule keywords
    if (lowerMessage.includes('زمان') || lowerMessage.includes('ساعت') ||
        lowerMessage.includes('schedule') || lowerMessage.includes('time') ||
        lowerMessage.includes('موعد') || lowerMessage.includes('وقت')) {
      return this.FAQ_RESPONSES.schedule[language];
    }

    // Trial keywords
    if (lowerMessage.includes('آزمایشی') || lowerMessage.includes('رایگان') ||
        lowerMessage.includes('trial') || lowerMessage.includes('free') ||
        lowerMessage.includes('تجريبي') || lowerMessage.includes('مجاني')) {
      return this.FAQ_RESPONSES.trial[language];
    }

    // Teacher keywords
    if (lowerMessage.includes('استاد') || lowerMessage.includes('معلم') ||
        lowerMessage.includes('teacher') || lowerMessage.includes('instructor') ||
        lowerMessage.includes('مدرس')) {
      return this.FAQ_RESPONSES.teachers[language];
    }

    // Online keywords
    if (lowerMessage.includes('آنلاین') || lowerMessage.includes('غیرحضوری') ||
        lowerMessage.includes('online') || lowerMessage.includes('virtual') ||
        lowerMessage.includes('عبر الإنترنت')) {
      return this.FAQ_RESPONSES.online[language];
    }

    return null;
  }

  /**
   * Generate AI response for complex queries
   */
  private async generateAIResponse(
    context: ConversationContext,
    userMessage: string
  ): Promise<AgentResponse> {
    const systemPrompt = this.SYSTEM_PROMPT[context.language];
    
    // Build conversation history for context
    const conversationHistory = context.messages.slice(-10).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Add current stage context
    const stageContext = this.getStageContext(context.stage, context.language);

    try {
      const response = await this.aiProvider.createChatCompletion({
        messages: [
          { role: 'system', content: systemPrompt + '\n\n' + stageContext },
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        maxTokens: 500
      });

      // Check for escalation triggers
      const shouldEscalate = this.checkEscalationTriggers(userMessage, response.content);

      return {
        message: response.content,
        shouldEscalate,
        escalationReason: shouldEscalate ? 'Complex query requires human assistance' : undefined,
        leadScore: context.leadData.score,
        nextStage: this.determineNextStage(context, userMessage)
      };

    } catch (error) {
      console.error('AI response generation failed:', error);
      return this.getFallbackResponse(context.language, context.stage);
    }
  }

  /**
   * Get stage-specific context for AI
   */
  private getStageContext(stage: ConversationStage, language: 'fa' | 'en' | 'ar'): string {
    const stageContexts: Record<ConversationStage, Record<string, string>> = {
      greeting: {
        fa: 'در مرحله خوش‌آمدگویی هستید. از مشتری بپرسید چه کمکی نیاز دارد.',
        en: 'You are in the greeting stage. Ask the customer how you can help.',
        ar: 'أنت في مرحلة الترحيب. اسأل العميل كيف يمكنك المساعدة.'
      },
      qualification: {
        fa: 'در حال ارزیابی مشتری هستید. سؤالاتی درباره سطح زبان و اهداف بپرسید.',
        en: 'You are qualifying the lead. Ask about their language level and goals.',
        ar: 'أنت تقيم العميل. اسأل عن مستوى لغته وأهدافه.'
      },
      needs_assessment: {
        fa: 'نیازهای مشتری را بررسی کنید. درباره زمان، بودجه و ترجیحات بپرسید.',
        en: 'Assess customer needs. Ask about schedule, budget, and preferences.',
        ar: 'قيم احتياجات العميل. اسأل عن الجدول والميزانية والتفضيلات.'
      },
      course_recommendation: {
        fa: 'بر اساس نیازها، دوره مناسب پیشنهاد دهید.',
        en: 'Based on their needs, recommend a suitable course.',
        ar: 'بناءً على احتياجاتهم، اقترح دورة مناسبة.'
      },
      pricing_discussion: {
        fa: 'درباره قیمت و ارزش دوره صحبت کنید. تخفیفات را اعلام کنید.',
        en: 'Discuss pricing and course value. Mention any discounts.',
        ar: 'ناقش الأسعار وقيمة الدورة. اذكر أي خصومات.'
      },
      objection_handling: {
        fa: 'به اعتراضات مشتری پاسخ دهید. مزایای دوره را تأکید کنید.',
        en: 'Address customer objections. Emphasize course benefits.',
        ar: 'تعامل مع اعتراضات العميل. أكد على فوائد الدورة.'
      },
      closing: {
        fa: 'مشتری را به ثبت‌نام ترغیب کنید. اطلاعات تماس بگیرید.',
        en: 'Encourage enrollment. Get contact information.',
        ar: 'شجع على التسجيل. احصل على معلومات الاتصال.'
      },
      follow_up: {
        fa: 'پیگیری کنید و به سؤالات نهایی پاسخ دهید.',
        en: 'Follow up and answer final questions.',
        ar: 'تابع وأجب على الأسئلة النهائية.'
      },
      escalation: {
        fa: 'به تیم انسانی ارجاع دهید.',
        en: 'Escalate to human team.',
        ar: 'صعد إلى الفريق البشري.'
      },
      completed: {
        fa: 'مکالمه تکمیل شده است.',
        en: 'Conversation completed.',
        ar: 'اكتملت المحادثة.'
      }
    };

    return stageContexts[stage][language] || stageContexts.greeting[language];
  }

  /**
   * Check for escalation triggers
   */
  private checkEscalationTriggers(userMessage: string, aiResponse: string): boolean {
    const escalationKeywords = [
      'مدیر', 'شکایت', 'مشکل جدی', 'استرداد',
      'manager', 'complaint', 'serious issue', 'refund',
      'مدير', 'شكوى', 'مشكلة خطيرة', 'استرداد'
    ];

    const lowerMessage = userMessage.toLowerCase();
    return escalationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Determine next conversation stage
   */
  private determineNextStage(
    context: ConversationContext,
    userMessage: string
  ): ConversationStage {
    const { stage, leadData } = context;

    // Check if we have enough lead info to progress
    if (stage === 'greeting' && context.messages.length > 2) {
      return 'qualification';
    }

    if (stage === 'qualification' && leadData.targetLanguage) {
      return 'needs_assessment';
    }

    if (stage === 'needs_assessment' && leadData.preferredSchedule) {
      return 'course_recommendation';
    }

    if (stage === 'course_recommendation' && context.messages.length > 6) {
      return 'pricing_discussion';
    }

    // Check for phone number or email to move to closing
    const hasContact = leadData.phone || leadData.email;
    if (hasContact && stage !== 'closing') {
      return 'closing';
    }

    return stage;
  }

  /**
   * Extract lead information from message
   */
  private extractLeadInfo(context: ConversationContext, message: string): void {
    // Extract phone number
    const phonePattern = /(?:0?9[0-9]{9})|(?:\+98[0-9]{10})/;
    const phoneMatch = message.match(phonePattern);
    if (phoneMatch) {
      context.leadData.phone = phoneMatch[0];
    }

    // Extract email
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = message.match(emailPattern);
    if (emailMatch) {
      context.leadData.email = emailMatch[0];
    }

    // Extract target language mentions
    const languageKeywords = {
      english: ['انگلیسی', 'english', 'إنجليزي'],
      arabic: ['عربی', 'arabic', 'عربي'],
      french: ['فرانسوی', 'french', 'فرنسي'],
      german: ['آلمانی', 'german', 'ألماني'],
      spanish: ['اسپانیایی', 'spanish', 'إسباني']
    };

    const lowerMessage = message.toLowerCase();
    for (const [lang, keywords] of Object.entries(languageKeywords)) {
      if (keywords.some(k => lowerMessage.includes(k))) {
        context.leadData.targetLanguage = lang;
        break;
      }
    }

    // Extract level mentions
    const levelKeywords = {
      beginner: ['مبتدی', 'beginner', 'مبتدئ', 'صفر'],
      intermediate: ['متوسط', 'intermediate', 'متوسط'],
      advanced: ['پیشرفته', 'advanced', 'متقدم']
    };

    for (const [level, keywords] of Object.entries(levelKeywords)) {
      if (keywords.some(k => lowerMessage.includes(k))) {
        context.leadData.currentLevel = level;
        break;
      }
    }
  }

  /**
   * Calculate lead score
   */
  private calculateLeadScore(context: ConversationContext): number {
    let score = 0;
    const { leadData, messages } = context;

    // Base engagement score
    score += Math.min(messages.length * 5, 30);

    // Contact info score
    if (leadData.phone) score += 25;
    if (leadData.email) score += 20;
    if (leadData.name) score += 10;

    // Intent signals
    if (leadData.targetLanguage) score += 15;
    if (leadData.currentLevel) score += 10;
    if (leadData.preferredSchedule) score += 10;
    if (leadData.budget) score += 15;

    // Source bonus
    if (leadData.source === 'whatsapp') score += 5;

    return Math.min(score, 100);
  }

  /**
   * Save lead data to database
   */
  private async saveLeadData(context: ConversationContext): Promise<void> {
    try {
      const { leadData, platform, language } = context;

      // Only save if we have a name and email
      if (!leadData.name || !leadData.email) {
        return;
      }

      // Check if lead already exists by email
      const existingLead = await db.select()
        .from(guestLeads)
        .where(eq(guestLeads.email, leadData.email))
        .limit(1);

      // Build notes with additional context
      const notes = JSON.stringify({
        language,
        stage: context.stage,
        score: leadData.score,
        targetLanguage: leadData.targetLanguage,
        currentLevel: leadData.currentLevel,
        preferredSchedule: leadData.preferredSchedule,
        budget: leadData.budget,
        interests: leadData.interests,
        lastMessage: context.messages[context.messages.length - 1]?.content || ''
      });

      if (existingLead.length > 0) {
        // Update existing lead
        await db.update(guestLeads)
          .set({
            phone: leadData.phone || existingLead[0].phone,
            status: 'contacted',
            notes,
            updatedAt: new Date()
          })
          .where(eq(guestLeads.id, existingLead[0].id));
      } else {
        // Create new lead
        await db.insert(guestLeads).values({
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          source: platform === 'telegram' ? 'telegram' : platform === 'whatsapp' ? 'whatsapp' : 'web',
          status: 'new',
          notes
        });
      }
    } catch (error) {
      console.error('Error saving lead data:', error);
    }
  }

  /**
   * Get greeting message
   */
  getGreeting(language: 'fa' | 'en' | 'ar' = 'fa'): string {
    const greetings = this.GREETINGS[language];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Get fallback response when AI fails
   */
  private getFallbackResponse(
    language: 'fa' | 'en' | 'ar',
    stage: ConversationStage
  ): AgentResponse {
    const fallbackMessages: Record<string, Record<string, string>> = {
      fa: {
        greeting: 'سلام! چطور می‌تونم کمکتون کنم؟',
        default: 'متوجه شدم. لطفاً می‌تونید بیشتر توضیح بدید؟ یا اگر مایل هستید، شماره تماس بگذارید تا همکارانم با شما تماس بگیرند.'
      },
      en: {
        greeting: 'Hello! How can I help you?',
        default: 'I understand. Could you please elaborate? Or if you prefer, leave your contact number and my colleagues will reach out.'
      },
      ar: {
        greeting: 'مرحباً! كيف يمكنني مساعدتك؟',
        default: 'فهمت. هل يمكنك التوضيح أكثر؟ أو إذا كنت تفضل، اترك رقم هاتفك وسيتواصل زملائي معك.'
      }
    };

    const message = stage === 'greeting' 
      ? fallbackMessages[language].greeting 
      : fallbackMessages[language].default;

    return {
      message,
      shouldEscalate: false,
      leadScore: 0
    };
  }

  /**
   * Get error response
   */
  private getErrorResponse(language: 'fa' | 'en' | 'ar'): AgentResponse {
    const errorMessages: Record<string, string> = {
      fa: 'متأسفانه مشکلی پیش آمد. لطفاً دوباره تلاش کنید یا با شماره ۰۲۱-۱۲۳۴۵۶۷ تماس بگیرید.',
      en: 'Sorry, something went wrong. Please try again or call us at 021-1234567.',
      ar: 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى أو الاتصال بنا على 021-1234567.'
    };

    return {
      message: errorMessages[language],
      shouldEscalate: true,
      escalationReason: 'System error occurred',
      leadScore: 0
    };
  }

  /**
   * Get conversation statistics
   */
  getStats(): {
    activeConversations: number;
    averageLeadScore: number;
    platformBreakdown: Record<string, number>;
  } {
    const conversations = Array.from(this.conversations.values());
    const activeConversations = conversations.filter(
      c => Date.now() - c.lastActive.getTime() < 24 * 60 * 60 * 1000
    );

    const totalScore = activeConversations.reduce((sum, c) => sum + c.leadData.score, 0);
    const averageLeadScore = activeConversations.length > 0 
      ? totalScore / activeConversations.length 
      : 0;

    const platformBreakdown: Record<string, number> = {};
    activeConversations.forEach(c => {
      platformBreakdown[c.platform] = (platformBreakdown[c.platform] || 0) + 1;
    });

    return {
      activeConversations: activeConversations.length,
      averageLeadScore: Math.round(averageLeadScore),
      platformBreakdown
    };
  }

  /**
   * Get AI provider status
   */
  async getProviderStatus(): Promise<{ primary: string | undefined; fallback: string | undefined }> {
    await this.initialize();
    return this.aiProvider.getActiveProviders();
  }

  /**
   * Clean up old conversations (for memory management)
   */
  cleanupOldConversations(maxAgeHours: number = 72): number {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [sessionId, context] of this.conversations.entries()) {
      if (context.lastActive.getTime() < cutoffTime) {
        this.conversations.delete(sessionId);
        cleaned++;
      }
    }

    console.log(`🧹 Cleaned up ${cleaned} old conversations`);
    return cleaned;
  }
}

// Export singleton instance
export const aiSalesAgent = new AISalesAgentService();
