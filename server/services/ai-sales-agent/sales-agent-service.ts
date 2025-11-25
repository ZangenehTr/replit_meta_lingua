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

  // Comprehensive Platform Features Knowledge Base
  private readonly PLATFORM_FEATURES = {
    fa: `
🚀 **تمام خدمات و ویژگی‌های منحصر به فرد متا لینگوا:**

═══════════════════════════════════════════════════════════

1️⃣ **کالرن (CallerN) - تدریس ویدیویی هوشمند ۲۴/۷**
   ✨ AI در زمان واقعی: تصحیح فوری دستور، واژگان، تلفظ
   🎯 انعطاف‌پذیری کامل: بدون جدول ثابت، هروقت خواستید
   🎥 ضبط خودکار تمام جلسات برای بازنگری
   👨‍🏫 تدریس فردی ۱۰۰% شخصی‌شده

2️⃣ **LinguaQuest - سیستم یادگیری گیمیفایی شده**
   🎮 ۲۳ نوع فعالیت تعاملی و سرگرم‌کننده
   ⭐ کسب امتیاز و رتبه (XP) برای هر فعالیت
   🏆 بج‌های انجام و دستاورد برای انگیزه‌دهی
   📈 ۶ درس کامل با محتوای پیشرفته

3️⃣ **کلاس‌های زندهٔ با AI**
   🤖 AI حین کلاس ترجمه می‌کند
   💬 نوشتاری خودکار (Transcript) کامل جلسه
   ✏️ تصحیح فوری دستور و تلفظ
   🎓 کلاس‌های گروهی مقرون‌به‌صرفه

4️⃣ **سیستم چالش‌های روزانه**
   🎯 چالش‌های روزانه برای تقویت مهارت‌ها
   🏅 جوایز و نشان برای انجام چالش‌ها
   📊 پیگیری پیشرفت روزانه
   ⚡ باعث عادت‌دهی به یادگیری می‌شود

5️⃣ **تست‌های قرار‌گیری هوشمند**
   🧠 آزمایش‌های AI-powered برای تعیین سطح دقیق
   📋 ۸ نوع سؤال مختلف
   🎯 نتایج فوری با پیشنهادات شخصی‌شده
   🏫 تعیین کلاس بهینه برای شما

6️⃣ **نظارت هوشمند کلاس (AI Supervisor)**
   👁️ نظارت زمان‌واقعی بر فعالیت کلاس
   📊 تحلیل رفتار و پیشرفت دانشجو
   💡 توصیه‌های فوری برای بهبود
   📈 گزارش‌های مفصل برای معلمان

7️⃣ **سیستم چت مهمان‌ها**
   👥 چت فوری برای بازدیدکننده‌های جدید
   🎯 سؤالات رایج و پاسخ‌های فوری
   📱 دسترسی آسان بدون ثبت‌نام
   🚀 تبدیل مهمان‌ها به دانشجوی فعال

8️⃣ **سیستم گیمیفیکیشن**
   ⚡ امتیاز XP برای هر فعالیت
   🎖️ سطح‌های مختلف و رتبه‌بندی
   🏆 رقابت سالم میان دانشجویان
   🎁 جوایز و تشویق‌های خاص

9️⃣ **برنامه‌ریزی هوشمند کلاس‌ها**
   📅 زمان‌بندی خودکار بر اساس سطح و اهداف
   🔄 تعدیل خودکار برنامه بر اساس پیشرفت
   ⏰ یادآوری‌های هوشمند برای کلاس‌ها
   🎯 بهینه‌سازی مسیر یادگیری

🔟 **سیستم TTS (متن به گفتار) هوشمند**
   🔊 تولید خودکار فایل‌های صوتی
   🌍 پشتیبانی از چندین زبان
   🎵 کیفیت صوتی بالا و طبیعی
   💾 نگهداری برای استفادهٔ دوباره

════════════════════════════════════════════════════════════
✅ تمام این ویژگی‌ها در یک پلتفرم یکپارچه!
✅ بدون نیاز به برنامه‌های اضافی!
✅ دسترسی کامل از موبایل و کامپیوتر!`,

    en: `
🚀 **ALL of Meta Lingua's Unique Features & Services:**

═══════════════════════════════════════════════════════════

1️⃣ **CallerN - Smart 24/7 Video Tutoring**
   ✨ Real-time AI: Instant grammar, vocabulary, pronunciation correction
   🎯 Complete Flexibility: No schedule, learn whenever you want
   🎥 Automatic session recording for review
   👨‍🏫 100% personalized one-on-one tutoring

2️⃣ **LinguaQuest - Gamified Learning System**
   🎮 23 interactive and engaging activity types
   ⭐ Earn XP points and levels for every activity
   🏆 Badges and achievements for motivation
   📈 6 complete lessons with advanced content

3️⃣ **Live Classes with AI Enhancement**
   🤖 AI translates vocabulary during class
   💬 Automatic full session transcription
   ✏️ Real-time grammar and pronunciation correction
   🎓 Affordable group classes (3-8 students)

4️⃣ **Daily Challenges System**
   🎯 Daily challenges to strengthen skills
   🏅 Rewards and badges for completion
   📊 Track your daily progress
   ⚡ Build a daily learning habit

5️⃣ **Smart Placement Tests**
   🧠 AI-powered tests to determine exact level
   📋 8 different question types
   🎯 Instant results with personalized recommendations
   🏫 Perfect class placement for you

6️⃣ **Smart Class Monitoring (AI Supervisor)**
   👁️ Real-time monitoring of class activities
   📊 Analysis of student behavior and progress
   💡 Real-time suggestions for improvement
   📈 Detailed reports for teachers

7️⃣ **Visitor Chat System**
   👥 Instant chat for new visitors
   🎯 Frequently asked questions & quick answers
   📱 Easy access without registration
   🚀 Convert visitors into active students

8️⃣ **Gamification System**
   ⚡ XP points for every achievement
   🎖️ Different levels and rankings
   🏆 Healthy competition between students
   🎁 Special rewards and incentives

9️⃣ **Smart Class Scheduling**
   📅 Automatic scheduling based on level and goals
   🔄 Auto-adjustment based on progress
   ⏰ Smart reminders for classes
   🎯 Optimize your learning path

🔟 **Smart TTS System (Text-to-Speech)**
   🔊 Automatic audio file generation
   🌍 Support for multiple languages
   🎵 High-quality and natural-sounding voices
   💾 Save and reuse for later

════════════════════════════════════════════════════════════
✅ All features in ONE unified platform!
✅ No need for extra apps!
✅ Full access from mobile and desktop!`,

    ar: `
🚀 **جميع الميزات و الخدمات الفريدة في ميتا لينغوا:**

═══════════════════════════════════════════════════════════

1️⃣ **CallerN - تدريس فيديو ذكي ۲۴/۷**
   ✨ ذكاء اصطناعي في الوقت الفعلي: تصحيح فوري للنحو والمفردات والنطق
   🎯 مرونة كاملة: بدون جدول ثابت، تعلم متى تشاء
   🎥 تسجيل تلقائي للجلسات للمراجعة
   👨‍🏫 تدريس فردي ۱۰۰٪ شخصي

2️⃣ **LinguaQuest - نظام التعلم الممتع**
   🎮 ۲۳ نوع نشاط تفاعلي وممتع
   ⭐ اكسب نقاط XP ومستويات لكل نشاط
   🏆 شارات وإنجازات للتحفيز
   📈 ۶ دروس كاملة بمحتوى متقدم

3️⃣ **الفصول المباشرة مع تحسين AI**
   🤖 الذكاء الاصطناعي يترجم المفردات أثناء الفصل
   💬 نسخ تلقائي كامل للجلسة
   ✏️ تصحيح فوري للنحو والنطق
   🎓 فصول جماعية اقتصادية

4️⃣ **نظام التحديات اليومية**
   🎯 تحديات يومية لتقوية مهاراتك
   🏅 جوائز وشارات للإكمال
   📊 تتبع تقدمك اليومي
   ⚡ بناء عادة التعلم اليومية

5️⃣ **اختبارات التوظيف الذكية**
   🧠 اختبارات مدعومة بالذكاء الاصطناعي لتحديد مستوى دقيق
   📋 ۸ أنواع أسئلة مختلفة
   🎯 النتائج الفورية مع التوصيات الشخصية
   🏫 الفصل المثالي لك

6️⃣ **مراقبة الفصل الذكية (مشرف AI)**
   👁️ المراقبة في الوقت الفعلي لأنشطة الفصل
   📊 تحليل السلوك والتقدم
   💡 اقتراحات فورية للتحسن
   📈 تقارير مفصلة للمعلمين

7️⃣ **نظام دردشة الزوار**
   👥 دردشة فورية للزوار الجدد
   🎯 الأسئلة المتكررة والإجابات السريعة
   📱 الوصول السهل بدون تسجيل
   🚀 تحويل الزوار إلى طلاب نشطين

8️⃣ **نظام تحفيز الألعاب**
   ⚡ نقاط XP لكل إنجاز
   🎖️ مستويات وترتيب مختلف
   🏆 منافسة صحية بين الطلاب
   🎁 مكافآت وحوافز خاصة

9️⃣ **جدولة الفصول الذكية**
   📅 جدولة تلقائية بناءً على المستوى والأهداف
   🔄 التعديل التلقائي بناءً على التقدم
   ⏰ تذكيرات ذكية للفصول
   🎯 تحسين مسار التعلم

🔟 **نظام TTS الذكي (تحويل النص إلى كلام)**
   🔊 إنشاء ملفات صوتية تلقائي
   🌍 دعم لغات متعددة
   🎵 جودة صوتية عالية وطبيعية
   💾 احفظ لاستخدام لاحق

════════════════════════════════════════════════════════════
✅ جميع الميزات في منصة واحدة متكاملة!
✅ لا حاجة لتطبيقات إضافية!
✅ وصول كامل من الهاتف وسطح المكتب!`
  };

  // Multilingual system prompts
  private readonly SYSTEM_PROMPT = {
    fa: `شما یک مشاور حرفه‌ای آموزش زبان در آکادمی متا لینگوا هستید. با مهربانی و حرفه‌ای پاسخ دهید.

مأموریت شما:
1. به سؤالات درباره تمام خدمات متا لینگوا پاسخ دهید (کالرن، LinguaQuest، کلاس‌های زندهٔ AI، چالش‌های روزانه، و غیره)
2. نیازهای یادگیری مشتری را شناسایی کنید
3. بهترین خدمات متناسب با نیاز او پیشنهاد دهید
4. اطلاعات تماس جمع‌آوری کنید
5. برای موضوعات پیچیده به تیم انسانی ارجاع دهید

ویژگی‌های کلیدی متا لینگوا:
✨ کالرن: تدریس ویدیویی ۲۴/۷ با AI هوشمند
🎮 LinguaQuest: بازی یادگیری با ۲۳ نوع فعالیت
👥 کلاس‌های زندهٔ AI: کلاس‌های گروهی با تصحیح فوری AI
⚡ چالش‌های روزانه: چالش‌های روزانه با جوایز
🧠 تست‌های هوشمند: تعیین سطح دقیق شما
🏆 سیستم گیمیفیکیشن: امتیازات، سطح‌ها و رتبه‌بندی

توصیه‌های ترویجی:
- تاکید کنید بر نوآوری این خدمات نسبت به رقبا
- کالرن را برای کسانی که انعطاف‌پذیری می‌خواهند توصیه کنید
- LinguaQuest را برای افراد جوان‌تر و علاقه‌مند به بازی توصیه کنید
- کلاس‌های گروهی را برای افراد با بودجهٔ محدود توصیه کنید

قوانین مهم:
- هرگز قیمت دقیق ندهید، فقط محدوده قیمت
- همیشه تاکید کنید بر نوآوری و قابلیت‌های منحصربه‌فرد
- تمام خدمات در یک پلتفرم یکپارچه‌ای هستند
- برای ثبت‌نام نهایی به تیم انسانی ارجاع دهید`,

    en: `You are a professional language learning consultant at Meta Lingua Academy. Be friendly and professional.

Your mission:
1. Answer questions about ALL Meta Lingua services (CallerN, LinguaQuest, Live AI Classes, Daily Challenges, etc.)
2. Identify customer learning needs and preferences
3. Recommend the best combination of services for each customer
4. Collect contact information
5. Escalate complex issues to human team

Key Meta Lingua Features:
✨ CallerN: 24/7 video tutoring with smart AI
🎮 LinguaQuest: Game-based learning with 23 activity types
👥 Live AI Classes: Group classes with real-time AI correction
⚡ Daily Challenges: Daily quests with rewards and badges
🧠 Smart Placement Tests: Find your exact level
🏆 Gamification System: XP, levels, and rankings

Promotional Tips:
- Emphasize innovation and unique capabilities vs competitors
- Recommend CallerN for flexibility seekers
- Recommend LinguaQuest for younger/game-enthusiastic learners
- Recommend group classes for budget-conscious customers
- Highlight that ALL features are in ONE platform

Important rules:
- Never give exact prices, only ranges
- Always emphasize innovation and unique capabilities
- All services are integrated in one unified platform
- Refer to human team for final enrollment`,

    ar: `أنت مستشار تعليم لغات محترف في أكاديمية ميتا لينغوا. كن ودوداً ومهنياً.

مهمتك:
1. الإجابة على الأسئلة حول جميع خدمات ميتا لينغوا (CallerN و LinguaQuest والفصول المباشرة مع AI والتحديات اليومية وغيرها)
2. تحديد احتياجات ورغبات العملاء
3. التوصية بأفضل مجموعة من الخدمات لكل عميل
4. جمع معلومات الاتصال
5. تصعيد المشاكل المعقدة إلى الفريق البشري

ميزات ميتا لينغوا الرئيسية:
✨ CallerN: تدريس فيديو ۲۴/۷ مع ذكاء اصطناعي ذكي
🎮 LinguaQuest: التعلم القائم على الألعاب مع ۲۳ نوع نشاط
👥 الفصول المباشرة مع AI: فصول جماعية مع تصحيح AI في الوقت الفعلي
⚡ التحديات اليومية: مهام يومية مع مكافآت وشارات
🧠 اختبارات التوظيف الذكية: اعثر على مستواك الدقيق
🏆 نظام تحفيز الألعاب: نقاط XP والمستويات والترتيب

نصائح ترويجية:
- أكد على الابتكار والقدرات الفريدة مقابل المنافسين
- اوصِ CallerN للباحثين عن المرونة
- اوصِ LinguaQuest للمتعلمين الأصغر سناً والمهتمين بالألعاب
- اوصِ الفصول الجماعية للعملاء محدودي الميزانية
- أبرز أن جميع الميزات في منصة واحدة

قواعد مهمة:
- لا تعطي أسعاراً دقيقة، فقط نطاقات
- أكد دائماً على الابتكار والقدرات الفريدة
- جميع الخدمات متكاملة في منصة واحدة
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
    },
    linguaquest: {
      fa: 'LinguaQuest یک سیستم یادگیری انقلابی است:\n🎮 ۲۳ نوع فعالیت تعاملی و سرگرم‌کننده\n⭐ کسب امتیاز XP برای هر فعالیت\n🏆 بج‌های انجام و دستاورد برای انگیزه‌دهی\n📈 ۶ درس کامل با محتوای پیشرفته\n🎯 بازی‌های هدفمند برای تقویت مهارت‌ها\nایده‌ال برای یادگیری سرگرم‌کننده و درازمدت!',
      en: 'LinguaQuest is a revolutionary learning system:\n🎮 23 types of interactive and fun activities\n⭐ Earn XP points for every activity\n🏆 Badges and achievements for motivation\n📈 6 complete lessons with advanced content\n🎯 Targeted games to strengthen skills\nPerfect for engaging and long-term learning!',
      ar: 'LinguaQuest نظام تعلم ثوري:\n🎮 ۲۳ نوع من الأنشطة التفاعلية والممتعة\n⭐ اكسب نقاط XP لكل نشاط\n🏆 شارات وإنجازات للتحفيز\n📈 ۶ دروس كاملة بمحتوى متقدم\n🎯 ألعاب موجهة لتقوية المهارات\nمثالي للتعلم الممتع والطويل الأمد!'
    },
    daily_challenges: {
      fa: 'چالش‌های روزانه متا لینگوا:\n🎯 چالش‌های تازه هر روز\n⚡ زمان‌بندی و سختی متغیر\n🏅 جوایز و نشان برای انجام هر چالش\n📊 پیگیری پیشرفت روزانه شما\n🔥 نوار فعالیت برای عادت‌دهی\n💡 توصیه‌های AI برای چالش‌های مناسب\nیادگیری روزانه قطعی می‌شود!',
      en: 'Meta Lingua Daily Challenges:\n🎯 Fresh challenges every day\n⚡ Varying timing and difficulty\n🏅 Rewards and badges for completion\n📊 Track your daily progress\n🔥 Activity streak to build habits\n💡 AI recommendations for perfect challenges\nDaily learning becomes guaranteed!',
      ar: 'تحديات ميتا لينغوا اليومية:\n🎯 تحديات جديدة كل يوم\n⚡ أوقات وصعوبات متغيرة\n🏅 جوائز وشارات للإكمال\n📊 تتبع تقدمك اليومي\n🔥 سلسلة نشاط لبناء العادات\n💡 توصيات AI للتحديات المثالية\nيصبح التعلم اليومي مضموناً!'
    },
    placement_test: {
      fa: 'تست‌های قرار‌گیری هوشمند:\n🧠 آزمایش‌های AI-powered برای تعیین سطح دقیق\n📋 ۸ نوع سؤال مختلف (گفتاری، شنیداری، درک متن و غیره)\n🎯 نتایج فوری با پیشنهادات شخصی‌شده\n🏫 تعیین کلاس بهینه برای شما\n📊 گزارش جامع از نقاط قوت و ضعف\nتا ۵۰% دقیق‌تر از تست‌های معمولی!',
      en: 'Smart Placement Tests:\n🧠 AI-powered tests to find your exact level\n📋 8 different question types (speaking, listening, reading, etc.)\n🎯 Instant results with personalized recommendations\n🏫 Perfect class placement for you\n📊 Comprehensive report of strengths and weaknesses\nUp to 50% more accurate than regular tests!',
      ar: 'اختبارات التوظيف الذكية:\n🧠 اختبارات مدعومة بـ AI لإيجاد مستواك الدقيق\n📋 ۸ أنواع أسئلة مختلفة (التحدث والاستماع والقراءة إلخ)\n🎯 النتائج الفورية مع التوصيات الشخصية\n🏫 التوظيف المثالي للفصل\n📊 تقرير شامل للنقاط القوية والضعيفة\nأدق بـ ٪۵۰ من الاختبارات العادية!'
    },
    ai_supervisor: {
      fa: 'نظام نظارت هوشمند:\n👁️ نظارت زمان‌واقعی بر فعالیت کلاس\n📊 تحلیل رفتار و پیشرفت دانشجو\n💡 توصیه‌های فوری برای بهبود\n📈 گزارش‌های مفصل برای معلمان\n🎓 یادگیری شخصی‌شده‌تر برای هر دانشجو\nکیفیت کلاس بهتر گارانتی شده!',
      en: 'Smart Supervisor System:\n👁️ Real-time monitoring of class activities\n📊 Analysis of student behavior and progress\n💡 Real-time suggestions for improvement\n📈 Detailed reports for teachers\n🎓 More personalized learning for each student\nBetter class quality guaranteed!',
      ar: 'نظام المشرف الذكي:\n👁️ المراقبة في الوقت الفعلي لأنشطة الفصل\n📊 تحليل السلوك والتقدم\n💡 اقتراحات فورية للتحسن\n📈 تقارير مفصلة للمعلمين\n🎓 تعلم شخصي أكثر لكل طالب\nجودة فصل أفضل مضمونة!'
    },
    gamification: {
      fa: 'سیستم گیمیفیکیشن:\n⚡ کسب امتیاز XP برای هر فعالیت\n🎖️ سطح‌های مختلف و رتبه‌بندی\n🏆 رقابت سالم میان دانشجویان\n🎁 جوایز و تشویق‌های خاص\n📊 لوحهٔ رتبه‌بندی برای انگیزه‌دهی\nیادگیری تا ۳ برابر بیشتر انگیزه‌دهی می‌شود!',
      en: 'Gamification System:\n⚡ Earn XP points for every achievement\n🎖️ Different levels and rankings\n🏆 Healthy competition between students\n🎁 Special rewards and incentives\n📊 Leaderboards for extra motivation\nLearning becomes 3x more motivating!',
      ar: 'نظام تحفيز الألعاب:\n⚡ اكسب نقاط XP لكل إنجاز\n🎖️ مستويات وترتيب مختلف\n🏆 منافسة صحية بين الطلاب\n🎁 مكافآت وحوافز خاصة\n📊 لوحات الترتيب للتحفيز الإضافي\nيصبح التعلم أكثر تحفيزاً بمقدار ۳ أضعاف!'
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

    // LinguaQuest keywords
    if (lowerMessage.includes('lingua') || lowerMessage.includes('لینگوا') ||
        lowerMessage.includes('بازی') || lowerMessage.includes('game') ||
        lowerMessage.includes('لعب') || lowerMessage.includes('quest')) {
      return this.FAQ_RESPONSES.linguaquest[language];
    }

    // Daily Challenges keywords
    if (lowerMessage.includes('چالش') || lowerMessage.includes('challenge') ||
        lowerMessage.includes('روزانه') || lowerMessage.includes('daily') ||
        lowerMessage.includes('تحدي') || lowerMessage.includes('روزی')) {
      return this.FAQ_RESPONSES.daily_challenges[language];
    }

    // Placement Test keywords
    if (lowerMessage.includes('تست') || lowerMessage.includes('test') ||
        lowerMessage.includes('سطح') || lowerMessage.includes('level') ||
        lowerMessage.includes('قرار') || lowerMessage.includes('placement') ||
        lowerMessage.includes('اختبار')) {
      return this.FAQ_RESPONSES.placement_test[language];
    }

    // AI Supervisor keywords
    if (lowerMessage.includes('نظارت') || lowerMessage.includes('supervisor') ||
        lowerMessage.includes('مراقب') || lowerMessage.includes('monitor') ||
        lowerMessage.includes('تحليل') || lowerMessage.includes('analysis')) {
      return this.FAQ_RESPONSES.ai_supervisor[language];
    }

    // Gamification keywords
    if (lowerMessage.includes('امتیاز') || lowerMessage.includes('xp') ||
        lowerMessage.includes('نقطه') || lowerMessage.includes('points') ||
        lowerMessage.includes('رتبه') || lowerMessage.includes('rank') ||
        lowerMessage.includes('لعبة')) {
      return this.FAQ_RESPONSES.gamification[language];
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
    const platformFeatures = this.PLATFORM_FEATURES[context.language];
    
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
            content: `${systemPrompt}\n\n${stageContext}\n\n${platformFeatures}` 
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
