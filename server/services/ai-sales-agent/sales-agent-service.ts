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

  // CallerN Platform Knowledge Base
  private readonly CALLERN_KNOWLEDGE = {
    fa: `
کالرن (CallerN) یک پلتفرم تدریس ویدیویی هوشمند و انقلابی است که تفاوت‌های زیر را دارد:

🎯 مزایای انحصاری کالرن:
1. ✨ فناوری هوشمند AI در حین کلاس:
   - ترجمه فوری واژگان جدید در حین صحبت
   - تصحیح دستور زبان خودکار و real-time
   - نوشتاری خودکار (transcript) کامل جلسه
   - پیشنهادات بهبود تلفظ فوری

2. 🔄 انعطاف‌پذیری بالا:
   - ۲۴/۷ در دسترس - هروقت که نیاز دارید
   - بدون جدول ثابت - خود شما برنامه‌ریزی کنید
   - کوتاه مدت - اگر ۱۵ دقیقه وقت داشتید شروع کنید

3. 🎥 امکانات ویدیویی پیشرفته:
   - اشتراک‌گذاری صفحه و تخته تعاملی
   - ضبط خودکار تمام جلسات
   - امکان بازنگری و یادگیری بیشتر

4. 👨‍🏫 تدریس فردی مختص:
   - توجه ۱۰۰% برای شما
   - سرعت یادگیری شخصی‌شده
   - بازخورد فوری و دقیق

کالرن برای کسانی ایده‌ال است که می‌خواهند سریع یاد بگیرند و نیاز به انعطاف‌پذیری دارند!`,

    en: `
CallerN is a revolutionary AI-powered video tutoring platform with exclusive advantages:

🎯 CallerN's Unique Benefits:
1. ✨ Smart AI Technology During Classes:
   - Real-time vocabulary translation as you speak
   - Instant grammar correction and feedback
   - Automatic transcription of entire session
   - Live pronunciation improvement suggestions

2. 🔄 Maximum Flexibility:
   - Available 24/7 - learn whenever you want
   - No fixed schedule - YOU decide the timing
   - Short sessions - start anytime (even 15 minutes)

3. 🎥 Advanced Video Features:
   - Screen sharing and interactive whiteboard
   - Automatic session recording
   - Review and learn from past sessions

4. 👨‍🏫 Personalized One-on-One Tutoring:
   - 100% personalized attention for YOU
   - Customized learning pace
   - Immediate and precise feedback

CallerN is perfect for learners who want faster results and complete schedule flexibility!`,

    ar: `
CallerN منصة تدريس فيديو ذكية مدعومة بالذكاء الاصطناعي مع مزايا حصرية:

🎯 مميزات CallerN الفريدة:
1. ✨ تقنية ذكية AI أثناء الدروس:
   - ترجمة فوري للمفردات أثناء التحدث
   - تصحيح النحو فوري والتعليقات
   - نسخ تلقائي لكل جلسة
   - اقتراحات تحسين النطق الحي

2. 🔄 مرونة القصوى:
   - متاح ۲۴/۷ - تعلم متى تشاء
   - لا جدول ثابت - أنت تقرر التوقيت
   - جلسات قصيرة - ابدأ في أي وقت

3. 🎥 ميزات الفيديو المتقدمة:
   - مشاركة الشاشة والسبورة التفاعلية
   - تسجيل تلقائي للجلسات
   - مراجعة الجلسات السابقة

4. 👨‍🏫 تدريس فردي مخصص:
   - اهتمام شخصي ۱۰۰٪
   - سرعة تعلم مخصصة
   - تعليقات فورية ودقيقة

CallerN مثالي للمتعلمين الذين يريدون نتائج أسرع ومرونة كاملة!`
  };

  // Multilingual system prompts
  private readonly SYSTEM_PROMPT = {
    fa: `شما یک مشاور حرفه‌ای آموزش زبان در آکادمی متا لینگوا هستید. با مهربانی و حرفه‌ای پاسخ دهید.

مأموریت شما:
1. به سؤالات درباره دوره‌های زبان و کالرن (CallerN) پاسخ دهید
2. نیازهای یادگیری مشتری را شناسایی کنید
3. دوره‌های مناسب و کالرن پیشنهاد دهید
4. اطلاعات تماس جمع‌آوری کنید
5. برای موضوعات پیچیده به تیم انسانی ارجاع دهید

دانش کلیدی درباره کالرن:
- کالرن یک پلتفرم تدریس ویدیویی هوشمند ۲۴/۷ است
- AI در حین کلاس واژگان، دستور زبان و تلفظ را تصحیح می‌کند
- بسیار متفاوت از کلاس‌های سنتی - انعطاف‌پذیر و فوری است
- ایده‌ال برای کسانی که نیاز به یادگیری سریع دارند

قوانین مهم:
- هرگز قیمت دقیق ندهید، فقط محدوده قیمت
- کالرن را توصیه کنید اگر مشتری نیاز به انعطاف‌پذیری داشته باشد
- کالرن و کلاس‌های منظم را به عنوان گزینه‌های مختلف معرفی کنید
- برای ثبت‌نام نهایی به تیم انسانی ارجاع دهید`,

    en: `You are a professional language learning consultant at Meta Lingua Academy. Be friendly and professional.

Your mission:
1. Answer questions about language courses and CallerN
2. Identify customer learning needs
3. Recommend suitable courses and CallerN
4. Collect contact information
5. Escalate complex issues to human team

Key knowledge about CallerN:
- CallerN is a smart 24/7 video tutoring platform
- AI corrects vocabulary, grammar and pronunciation during the lesson
- Very different from traditional classes - flexible and instant
- Perfect for learners who need fast results

Important rules:
- Never give exact prices, only ranges
- Recommend CallerN if customer needs flexibility
- Present CallerN and traditional classes as different options
- Refer to human team for final enrollment`,

    ar: `أنت مستشار تعليم لغات محترف في أكاديمية ميتا لينغوا. كن ودوداً ومهنياً.

مهمتك:
1. الإجابة على الأسئلة حول دورات اللغة و CallerN
2. تحديد احتياجات تعلم العملاء
3. التوصية بالدورات المناسبة و CallerN
4. جمع معلومات الاتصال
5. تصعيد المشكلات المعقدة إلى الفريق البشري

معرفة أساسية عن CallerN:
- CallerN هي منصة تدريس فيديو ذكية ۲۴/۷
- الذكاء الاصطناعي يصحح المفردات والنحو والنطق أثناء الدرس
- مختلفة جداً عن الفصول التقليدية - مرنة وفورية
- مثالية للمتعلمين الذين يريدون نتائج سريعة

قواعد مهمة:
- لا تعطي أسعاراً دقيقة، فقط نطاقات
- ابدأ بـ CallerN إذا احتاج العميل للمرونة
- قدم CallerN والفصول التقليدية كخيارات مختلفة
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
      fa: 'قیمت بسته به نوع خدمه متفاوت است:\n- کلاس‌های منظم: ۵۰۰ تا ۱۰۰۰ هزار تومان در ماه\n- کالرن (CallerN): قیمت‌های رقابتی برای جلسات ۱:۱\nبرای اطلاعات دقیق، لطفاً شماره تماس خود را بگذارید.',
      en: 'Pricing depends on the service:\n- Regular classes: 500,000 to 1,000,000 Tomans per month\n- CallerN (on-demand tutoring): Competitive rates for 1-on-1 sessions\nFor detailed pricing, please leave your contact number.',
      ar: 'الأسعار تختلف حسب الخدمة:\n- الفصول العادية: ۵۰۰,۰۰۰ إلى ۱,۰۰۰,۰۰۰ تومان شهرياً\n- CallerN (التدريس الفردي): أسعار تنافسية للجلسات الفردية\nللأسعار المفصلة، يرجى ترك رقم هاتفك.'
    },
    callern: {
      fa: 'کالرن (CallerN) پلتفرم تدریس ویدیویی هوشمندی است که:\n✨ فناوری AI: تصحیح فوری دستور، واژگان و تلفظ\n🔄 انعطاف‌پذیری کامل: ۲۴/۷ در دسترس، بدون جدول ثابت\n🎥 امکانات پیشرفته: ضبط جلسه، اشتراک‌گذاری صفحه، تخته تعاملی\n👨‍🏫 یک به یک شخصی‌شده\nایده‌ال برای کسانی که نیاز به یادگیری سریع و انعطاف‌پذیر دارند!',
      en: 'CallerN is an AI-powered video tutoring platform:\n✨ AI Technology: Real-time grammar, vocabulary, and pronunciation correction\n🔄 Complete Flexibility: Available 24/7, no fixed schedule\n🎥 Advanced Features: Session recording, screen sharing, interactive whiteboard\n👨‍🏫 Personalized one-on-one tutoring\nPerfect for those who need fast, flexible learning!',
      ar: 'CallerN منصة تدريس فيديو ذكية:\n✨ تقنية AI: تصحيح فوري للنحو والمفردات والنطق\n🔄 مرونة كاملة: متاح ۲۴/۷، بدون جدول ثابت\n🎥 ميزات متقدمة: تسجيل الجلسة، مشاركة الشاشة، السبورة التفاعلية\n👨‍🏫 تدريس فردي مخصص\nمثالي للمتعلمين الذين يريدون نتائج سريعة ومرنة!'
    },
    schedule: {
      fa: 'کلاس‌های منظم: صبح، عصر، شب\nکالرن: هروقت که نیاز دارید! ۲۴/۷ در دسترس\nچه زمانی برای شما بهتر است؟',
      en: 'Regular classes: Morning, afternoon, evening\nCallerN: Whenever you need! Available 24/7\nWhat time works best for you?',
      ar: 'الفصول العادية: الصباح والظهيرة والمساء\nCallerN: في أي وقت تريده! متاح ۲۴/۷\nما الوقت الأنسب لك؟'
    },
    trial: {
      fa: 'بله! می‌توانید:\n- جلسه آزمایشی رایگان در کلاس‌های منظم\n- یا یک جلسه آزمایشی کالرن\nکدام علاقه‌مندتان است؟',
      en: 'Yes! You can try:\n- Free trial session in regular classes\n- Or a trial CallerN session\nWhich interests you?',
      ar: 'نعم! يمكنك التجربة:\n- جلسة تجريبية مجانية في الفصول العادية\n- أو جلسة تجريبية CallerN\nأيهما يهمك؟'
    },
    teachers: {
      fa: 'اساتید ما:\n- مدرک بین‌المللی (TEFL/CELTA)\n- حداقل ۵ سال تجربه\n- متخصص در یادگیری بزرگسالان\nدر کالرن: مربیان ویژه‌ای برای یک به یک',
      en: 'Our teachers have:\n- International certifications (TEFL/CELTA)\n- At least 5 years experience\n- Specialized in adult learning\nIn CallerN: Specialized trainers for one-on-one sessions',
      ar: 'معلمونا لديهم:\n- شهادات دولية (TEFL/CELTA)\n- خبرة لا تقل عن 5 سنوات\n- متخصصون في تعليم الكبار\nفي CallerN: مدربون متخصصون للجلسات الفردية'
    },
    difference: {
      fa: 'تفاوت کلاس‌های منظم و کالرن:\n\nکلاس‌های منظم:\n- گروهی (۳-۸ نفر)\n- جدول ثابت\n- کمک‌هزینه\n\nکالرن:\n- یک به یک\n- ۲۴/۷ انعطاف‌پذیر\n- AI کمک‌کننده فوری\n- ضبط و بازنگری\n\nهر دو موثر! بسته به نیاز شما.',
      en: 'Difference between regular classes and CallerN:\n\nRegular Classes:\n- Group (3-8 people)\n- Fixed schedule\n- More affordable\n\nCallerN:\n- One-on-one\n- 24/7 flexible\n- AI instant assistance\n- Recording & review\n\nBoth effective! Depends on your needs.',
      ar: 'الفرق بين الفصول العادية و CallerN:\n\nالفصول العادية:\n- مجموعة (۳-۸ أشخاص)\n- جدول ثابت\n- أكثر اقتصاداً\n\nCallerN:\n- واحد على واحد\n- مرن ۲۴/۷\n- مساعدة AI فورية\n- تسجيل ومراجعة\n\nكلاهما فعال! يعتمد على احتياجاتك.'
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
    
    // CallerN keywords - check first since it's most important
    if (lowerMessage.includes('کالرن') || lowerMessage.includes('callern') || 
        lowerMessage.includes('ویدیویی') || lowerMessage.includes('video tutoring') ||
        lowerMessage.includes('ai') && lowerMessage.includes('تصحیح') ||
        lowerMessage.includes('on-demand')) {
      return this.FAQ_RESPONSES.callern[language];
    }

    // Difference between services
    if (lowerMessage.includes('تفاوت') || lowerMessage.includes('difference') ||
        lowerMessage.includes('vs') || lowerMessage.includes('بهتر')) {
      return this.FAQ_RESPONSES.difference[language];
    }

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
    const callernKnowledge = this.CALLERN_KNOWLEDGE[context.language];
    
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
          { 
            role: 'system', 
            content: `${systemPrompt}\n\n${stageContext}\n\n📚 PLATFORM KNOWLEDGE:\n${callernKnowledge}` 
          },
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
