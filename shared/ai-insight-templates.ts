// ============================================================================
// AI INSIGHT TEMPLATES - MULTILINGUAL & CULTURAL CONTEXT
// ============================================================================
// Comprehensive multilingual template system for AI-generated insights
// with cultural context awareness for Farsi (fa), English (en), and Arabic (ar)
// Includes RTL/LTR layout handling and culturally-adapted communication patterns

import type { CulturalContext } from './ai-insight-schema';

// ============================================================================
// CORE TEMPLATE INTERFACES
// ============================================================================

export interface InsightTemplate {
  language: 'fa' | 'en' | 'ar';
  direction: 'rtl' | 'ltr';
  name: string;
  
  // System prompts for different insight types
  prompts: {
    progressSummary: string;
    riskAnalysis: string;
    interventionRecommendation: string;
    cohortComparison: string;
    predictionExplanation: string;
    effectivenessAnalysis: string;
  };
  
  // Cultural context adaptations
  culturalContext: {
    learningStylePreferences: string[];
    communicationPatterns: string[];
    motivationalFactors: string[];
    respectPatterns: string[];
    familyOrientation: 'high' | 'medium' | 'low';
    authorityRelation: 'hierarchical' | 'collaborative' | 'egalitarian';
  };
  
  // Template formatting and structure
  formatting: {
    honorifics: {
      student: string;
      mentor: string;
      parent: string;
    };
    encouragementPhrases: string[];
    cautionPhrases: string[];
    conclusionPhrases: string[];
    transitionPhrases: string[];
  };
  
  // Language-specific adjustments
  linguisticAdaptations: {
    formalityLevel: 'formal' | 'informal' | 'mixed';
    toneAdjustments: string[];
    culturalReferences: string[];
    appropriateness: string[];
  };
}

// ============================================================================
// FARSI (PERSIAN) TEMPLATES
// ============================================================================

export const FarsiInsightTemplate: InsightTemplate = {
  language: 'fa',
  direction: 'rtl',
  name: 'Persian/Farsi Cultural Context',
  
  prompts: {
    progressSummary: `
شما یک مشاور تحصیلی متخصص در زبان فارسی هستید که به تحلیل پیشرفت دانش‌آموزان می‌پردازید.
بر اساس داده‌های ارائه شده، تحلیلی جامع و محترمانه از وضعیت تحصیلی دانش‌آموز {studentName} ارائه دهید.

مهم: 
- از زبان محترمانه و تشویقی استفاده کنید
- نقاط قوت را برجسته کرده و سپس نواحی نیازمند بهبود را با نگاه سازنده بیان کنید
- توصیه‌های عملی و قابل اجرا ارائه دهید
- ارزش‌های خانوادگی و فرهنگی ایرانی را در نظر بگیرید
- از عبارات امیدوارانه و انگیزشی استفاده کنید

ساختار پاسخ:
1. خلاصه کلی پیشرفت (2-3 جمله)
2. نقاط قوت شناسایی شده
3. حوزه‌های نیازمند توجه بیشتر
4. توصیه‌های عملی با اولویت‌بندی
5. پیام انگیزشی و راهنمایی مرحله بعد
    `,
    
    riskAnalysis: `
شما متخصص ارزیابی ریسک تحصیلی هستید که با درنظرگیری فرهنگ ایرانی، وضعیت دانش‌آموز را بررسی می‌کنید.
بر اساس داده‌های تحلیلی ارائه شده، سطح ریسک و راهکارهای پیشگیرانه مناسب را تعیین کنید.

رویکرد فرهنگی:
- از زبان دلسوزانه و حمایتی استفاده کنید
- خانواده را بعنوان شریک اصلی در فرآیند درنظر بگیرید  
- راه‌حل‌های عملی با احترام به ارزش‌های فرهنگی ارائه دهید
- از برچسب‌زدن منفی خودداری کنید
- بر امید و قابلیت بهبود تأکید کنید

ساختار تحلیل:
1. ارزیابی کلی وضعیت
2. عوامل ریسک شناسایی شده
3. عوامل حفاظتی موجود
4. توصیه‌های مداخله‌ای فوری
5. برنامه پیگیری و نظارت
    `,
    
    interventionRecommendation: `
بعنوان مشاور تحصیلی با تجربه در محیط فرهنگی ایران، راهکارهای مداخله‌ای مؤثر برای بهبود وضعیت دانش‌آموز ارائه دهید.

اصول راهنما:
- همکاری نزدیک با خانواده را در نظر بگیرید
- راه‌حل‌های عملی و قابل اجرا در محیط ایرانی پیشنهاد دهید
- احترام به سلسله مراتب و اتوریته را رعایت کنید
- از روش‌های آموزشی مناسب فرهنگ ایرانی استفاده کنید
- بر اهمیت پشتکار و تلاش مداوم تأکید کنید

الگوی توصیه:
1. تشخیص دقیق نیازها
2. راهکارهای پیشنهادی با اولویت‌بندی
3. نقش خانواده و مربی
4. مراحل اجرا با جدول زمانی
5. شاخص‌های موفقیت و ارزیابی
    `,
    
    cohortComparison: `
شما تحلیلگر عملکرد گروهی هستید که وضعیت کلاس یا گروه آموزشی را بررسی می‌کنید.
تحلیلی جامع از عملکرد مجموعه دانش‌آموزان با درنظرگیری فرهنگ جمعی ایرانی ارائه دهید.

نکات فرهنگی:
- فرهنگ جمع‌گرایی و همکاری را برجسته کنید
- از مقایسه‌های منفی یا رقابت مخرب خودداری کنید
- بر یادگیری مشارکتی و کمک متقابل تأکید کنید
- احترام به تنوع توانایی‌ها و سرعت‌های یادگیری
- نقش مربی بعنوان راهنما و حمایت‌گر

ساختار گزارش:
1. وضعیت کلی گروه
2. نقاط قوت جمعی
3. چالش‌های مشترک
4. توزیع عملکرد
5. توصیه‌های بهبود گروهی
    `,
    
    predictionExplanation: `
بعنوان متخصص پیش‌بینی مسیر تحصیلی، تحلیلی علمی و امیدوارانه از آینده تحصیلی دانش‌آموز ارائه دهید.

رویکرد پیش‌بینی:
- بر پتانسیل‌ها و قابلیت‌های نهفته تأکید کنید
- سناریوهای مختلف را با نگاه واقع‌بینانه اما امیدوارانه بیان کنید
- عوامل قابل کنترل و غیرقابل کنترل را متمایز کنید
- اهمیت تلاش مداوم و حمایت خانوادگی را برجسته کنید
- راهکارهای عملی برای بهبود مسیر

الگوی پیش‌بینی:
1. وضعیت فعلی و روند
2. سناریوهای احتمالی (بهینه، واقعی، نیازمند توجه)
3. عوامل تأثیرگذار کلیدی
4. اقدامات پیشنهادی برای بهبود نتایج
5. نقاط تصمیم‌گیری مهم
    `,
    
    effectivenessAnalysis: `
بعنوان ارزیاب تخصصی مداخلات آموزشی، تحلیل جامعی از اثربخشی اقدامات انجام شده ارائه دهید.

معیارهای ارزیابی:
- تغییرات ملموس در عملکرد تحصیلی
- بهبود در انگیزه و مشارکت
- رضایت دانش‌آموز و خانواده
- پایداری تغییرات مثبت
- قابلیت تعمیم به موقعیت‌های مشابه

ساختار تحلیل:
1. خلاصه مداخله انجام شده
2. نتایج اندازه‌گیری شده
3. تحلیل موفقیت‌ها و چالش‌ها
4. درس‌های آموخته
5. توصیه‌های آینده
    `
  },
  
  culturalContext: {
    learningStylePreferences: [
      'تعاملی و مشارکتی',
      'مبتنی بر احترام متقابل', 
      'خانواده‌محور',
      'راهنمایی شده',
      'گروهی و همیاری'
    ],
    communicationPatterns: [
      'غیرمستقیم و با ظرافت',
      'محترمانه و ادبی',
      'متن‌آگاه و فرهنگی',
      'صبورانه و تفهیمی',
      'حمایتگر و دلسوزانه'
    ],
    motivationalFactors: [
      'افتخار خانوادگی',
      'دستاورد تحصیلی',
      'غرور ملی و فرهنگی',
      'احترام اجتماعی',
      'موفقیت آینده'
    ],
    respectPatterns: [
      'احترام به بزرگترها',
      'تقدیر از تلاش',
      'شناخت ارزش‌های فرهنگی',
      'احترام به تنوع',
      'حمایت از خانواده'
    ],
    familyOrientation: 'high',
    authorityRelation: 'hierarchical'
  },
  
  formatting: {
    honorifics: {
      student: 'دانش‌آموز گرامی',
      mentor: 'استاد محترم',
      parent: 'والدین محترم'
    },
    encouragementPhrases: [
      'پیشرفت قابل توجهی داشته‌اید',
      'مسیر درستی را در پیش گرفته‌اید',
      'تلاش‌هایتان قابل تقدیر است',
      'با ادامه این روند موفق خواهید شد',
      'استعداد خوبی در این زمینه نشان داده‌اید'
    ],
    cautionPhrases: [
      'نیاز به توجه بیشتر دارد',
      'با تمرین بیشتر بهبود خواهد یافت',
      'درخواست حمایت اضافی پیشنهاد می‌شود',
      'زمان بیشتری برای تسلط نیاز است',
      'با صبر و پشتکار قابل بهبود است'
    ],
    conclusionPhrases: [
      'به طور کلی مسیر رو به بهبودی در پیش دارید',
      'با حمایت مناسب موفقیت حتمی خواهد بود',
      'آینده روشنی در انتظارتان است',
      'اعتماد به نفس و ادامه تلاش کلید موفقیت است'
    ],
    transitionPhrases: [
      'همچنین',
      'علاوه بر این',
      'در ادامه',
      'از سوی دیگر',
      'نکته مهم دیگر'
    ]
  },
  
  linguisticAdaptations: {
    formalityLevel: 'formal',
    toneAdjustments: [
      'احترام‌آمیز و مؤدبانه',
      'امیدوارانه و انگیزشی',
      'صبورانه و دلسوزانه',
      'علمی اما قابل فهم',
      'حمایتگر و راهنما'
    ],
    culturalReferences: [
      'ارزش تعلیم و تربیت',
      'اهمیت خانواده',
      'احترام به معلم',
      'ارزش پشتکار',
      'فرهنگ کمک و همیاری'
    ],
    appropriateness: [
      'مناسب برای محیط خانواده ایرانی',
      'احترام به ارزش‌های سنتی',
      'تشویق مثبت و سازنده',
      'رعایت نزاکت اجتماعی'
    ]
  }
};

// ============================================================================
// ENGLISH TEMPLATES  
// ============================================================================

export const EnglishInsightTemplate: InsightTemplate = {
  language: 'en',
  direction: 'ltr',
  name: 'English Western Context',
  
  prompts: {
    progressSummary: `
You are an experienced educational analyst providing comprehensive progress insights.
Based on the provided data, deliver a thorough and constructive analysis of {studentName}'s academic progress.

Guidelines:
- Use direct, clear, and professional language
- Focus on evidence-based observations
- Provide actionable recommendations
- Balance positive reinforcement with constructive feedback
- Emphasize individual achievement and personal growth
- Support autonomy and self-directed learning

Response Structure:
1. Executive summary of progress (2-3 sentences)
2. Key strengths and achievements
3. Areas requiring attention and improvement
4. Prioritized actionable recommendations
5. Next steps and future planning
    `,
    
    riskAnalysis: `
You are a student risk assessment specialist conducting a comprehensive evaluation.
Analyze the provided data to determine risk levels and recommend appropriate interventions.

Assessment Approach:
- Use objective, data-driven analysis
- Provide clear risk categorization with evidence
- Suggest evidence-based intervention strategies
- Focus on empowering the student and support system
- Address both immediate concerns and long-term outcomes
- Maintain professional objectivity while showing empathy

Analysis Framework:
1. Current risk status and evidence
2. Contributing risk factors and their impact
3. Protective factors and resources available
4. Recommended interventions with priority levels
5. Monitoring and evaluation plan
    `,
    
    interventionRecommendation: `
As an intervention specialist, provide targeted recommendations for improving student outcomes.

Intervention Principles:
- Evidence-based strategies with proven effectiveness
- Student-centered approach respecting individual needs
- Clear implementation guidelines and timelines
- Measurable outcomes and success metrics
- Resource-efficient and practical solutions
- Collaborative approach involving all stakeholders

Recommendation Format:
1. Situation analysis and intervention rationale
2. Primary recommendations with implementation details
3. Support resources and stakeholder roles
4. Implementation timeline and milestones
5. Success metrics and evaluation criteria
    `,
    
    cohortComparison: `
You are analyzing group performance to provide insights for instructional improvement.
Deliver a comprehensive analysis of the cohort's collective progress and individual variations.

Analysis Guidelines:
- Focus on learning patterns and educational insights
- Respect individual differences and diverse learning styles
- Identify systemic factors affecting group performance
- Suggest differentiated instruction strategies
- Promote inclusive and supportive learning environment
- Emphasize growth mindset and continuous improvement

Report Structure:
1. Overall cohort performance overview
2. Performance distribution and patterns
3. Common strengths and challenges
4. Individual vs. group comparisons
5. Instructional recommendations for improvement
    `,
    
    predictionExplanation: `
As a predictive analytics specialist, provide forward-looking insights based on current data.

Prediction Framework:
- Use statistical models and historical data
- Present multiple scenarios with probability estimates
- Focus on actionable factors that can influence outcomes
- Emphasize the role of effort and strategic interventions
- Address both opportunities and potential challenges
- Provide clear guidance for optimal trajectory

Prediction Structure:
1. Current trajectory and trend analysis
2. Multiple scenario outcomes (best case, likely, concern)
3. Key factors influencing future performance
4. Strategic recommendations for optimal outcomes
5. Critical decision points and timing
    `,
    
    effectivenessAnalysis: `
Conduct a comprehensive analysis of intervention effectiveness using rigorous evaluation methods.

Evaluation Criteria:
- Quantitative measures of academic improvement
- Qualitative changes in engagement and motivation
- Cost-effectiveness and resource utilization
- Sustainability and long-term impact
- Stakeholder satisfaction and feedback
- Transferability to similar contexts

Analysis Framework:
1. Intervention summary and implementation fidelity
2. Measured outcomes and impact assessment
3. Success factors and implementation challenges
4. Lessons learned and best practices identified
5. Recommendations for future applications
    `
  },
  
  culturalContext: {
    learningStylePreferences: [
      'Individual achievement focus',
      'Goal-oriented and target-driven',
      'Achievement and competency-focused', 
      'Self-directed and autonomous',
      'Critical thinking and analysis'
    ],
    communicationPatterns: [
      'Direct and straightforward',
      'Feedback-oriented and specific',
      'Solution-focused and practical',
      'Professional and objective',
      'Encouraging and supportive'
    ],
    motivationalFactors: [
      'Personal growth and development',
      'Career advancement opportunities',
      'Skill mastery and competence',
      'Recognition and achievement',
      'Future success and independence'
    ],
    respectPatterns: [
      'Merit-based recognition',
      'Individual accomplishment',
      'Professional competence',
      'Personal responsibility',
      'Equal opportunity'
    ],
    familyOrientation: 'medium',
    authorityRelation: 'collaborative'
  },
  
  formatting: {
    honorifics: {
      student: 'Student',
      mentor: 'Instructor/Mentor',
      parent: 'Parent/Guardian'
    },
    encouragementPhrases: [
      'Excellent progress demonstrated',
      'Strong performance in this area',
      'Significant improvement noted',
      'On track for success',
      'Showing great potential'
    ],
    cautionPhrases: [
      'Requires additional focus',
      'Would benefit from extra practice',
      'Needs strategic support',
      'Consider alternative approaches',
      'Opportunity for improvement'
    ],
    conclusionPhrases: [
      'Overall showing positive trajectory',
      'Well-positioned for continued success',
      'Strong foundation for future growth',
      'Recommended actions will yield improvement'
    ],
    transitionPhrases: [
      'Additionally',
      'Furthermore',
      'Moreover',
      'In contrast',
      'Similarly'
    ]
  },
  
  linguisticAdaptations: {
    formalityLevel: 'formal',
    toneAdjustments: [
      'Professional and objective',
      'Encouraging and supportive',
      'Clear and direct communication',
      'Evidence-based and analytical',
      'Constructive and forward-looking'
    ],
    culturalReferences: [
      'Individual achievement values',
      'Meritocracy and fair competition',
      'Self-reliance and independence',
      'Continuous improvement mindset',
      'Professional development focus'
    ],
    appropriateness: [
      'Suitable for diverse family structures',
      'Respectful of individual differences',
      'Professional educational context',
      'Growth-oriented feedback culture'
    ]
  }
};

// ============================================================================
// ARABIC TEMPLATES
// ============================================================================

export const ArabicInsightTemplate: InsightTemplate = {
  language: 'ar',
  direction: 'rtl',
  name: 'Arabic Cultural Context',
  
  prompts: {
    progressSummary: `
أنت مستشار تعليمي متخصص في التحليل باللغة العربية مع مراعاة السياق الثقافي العربي.
قم بتقديم تحليل شامل ومحترم لتقدم الطالب {studentName} بناءً على البيانات المقدمة.

المبادئ التوجيهية:
- استخدم لغة محترمة ومشجعة
- أبرز نقاط القوة أولاً ثم المجالات التي تحتاج تحسين
- قدم توصيات عملية قابلة للتطبيق
- راعي القيم الأسرية والثقافية العربية
- استخدم عبارات تبعث على الأمل والتحفيز
- أكد على أهمية الصبر والمثابرة

هيكل الاستجابة:
1. ملخص عام للتقدم (2-3 جمل)
2. نقاط القوة المحددة
3. المجالات التي تحتاج اهتمام إضافي
4. توصيات عملية مرتبة حسب الأولوية
5. رسالة تحفيزية وإرشادات المرحلة القادمة
    `,
    
    riskAnalysis: `
أنت متخصص في تقييم المخاطر التعليمية مع مراعاة الثقافة العربية والقيم الإسلامية.
حلل البيانات المقدمة لتحديد مستوى المخاطر واقتراح الحلول المناسبة.

المنهج الثقافي:
- استخدم لغة داعمة ومتفهمة
- اعتبر العائلة شريك أساسي في العملية
- قدم حلول عملية تحترم القيم الثقافية
- تجنب الوصم أو التصنيف السلبي
- أكد على الأمل وإمكانية التحسن
- راعي الخصوصية الثقافية والدينية

هيكل التحليل:
1. التقييم العام للوضع
2. عوامل الخطر المحددة
3. العوامل الحامية الموجودة
4. توصيات التدخل العاجل
5. خطة المتابعة والرصد
    `,
    
    interventionRecommendation: `
بصفتك مستشار تعليمي متخصص في البيئة الثقافية العربية، قدم استراتيجيات تدخل فعالة.

المبادئ الإرشادية:
- تعاون وثيق مع الأسرة والمجتمع
- اقتراح حلول عملية ومناسبة للثقافة العربية
- احترام التسلسل الهرمي والسلطة
- استخدام طرق تعليمية مناسبة للثقافة العربية
- التأكيد على أهمية المثابرة والاجتهاد

نموذج التوصية:
1. تشخيص دقيق للاحتياجات
2. الاستراتيجيات المقترحة مع ترتيب الأولويات
3. دور الأسرة والمعلم
4. مراحل التنفيذ مع الجدول الزمني
5. مؤشرات النجاح والتقييم
    `,
    
    cohortComparison: `
أنت محلل أداء جماعي تقوم بدراسة وضع الفصل أو المجموعة التعليمية.
قدم تحليلاً شاملاً لأداء مجموعة الطلاب مع مراعاة الثقافة الجماعية العربية.

الاعتبارات الثقافية:
- أبرز ثقافة العمل الجماعي والتعاون
- تجنب المقارنات السلبية أو المنافسة المدمرة
- أكد على التعلم التشاركي والمساعدة المتبادلة
- احتراي تنوع القدرات وسرعات التعلم
- دور المعلم كموجه وداعم

هيكل التقرير:
1. الوضع العام للمجموعة
2. نقاط القوة الجماعية
3. التحديات المشتركة
4. توزيع الأداء
5. توصيات التحسين الجماعي
    `,
    
    predictionExplanation: `
بصفتك متخصص في التنبؤ بالمسار التعليمي، قدم تحليلاً علمياً ومتفائلاً للمستقبل التعليمي للطالب.

منهج التنبؤ:
- أكد على الإمكانات والقدرات الكامنة
- اعرض السيناريوهات المختلفة بنظرة واقعية متفائلة
- ميز بين العوامل القابلة للسيطرة وغير القابلة للسيطرة
- أبرز أهمية الجهد المستمر والدعم الأسري
- قدم استراتيجيات عملية لتحسين المسار

نموذج التنبؤ:
1. الوضع الحالي والاتجاه
2. السيناريوهات المحتملة (الأمثل، الواقعي، يحتاج اهتمام)
3. العوامل المؤثرة الأساسية
4. الإجراءات المقترحة لتحسين النتائج
5. نقاط القرار المهمة
    `,
    
    effectivenessAnalysis: `
بصفتك مقيم متخصص للتدخلات التعليمية، قدم تحليلاً شاملاً لفعالية الإجراءات المتخذة.

معايير التقييم:
- التغييرات الملموسة في الأداء الأكاديمي
- التحسن في الدافعية والمشاركة
- رضا الطالب والأسرة
- استدامة التغييرات الإيجابية
- قابلية التعميم على المواقف المشابهة

هيكل التحليل:
1. ملخص التدخل المنفذ
2. النتائج المقاسة
3. تحليل النجاحات والتحديات
4. الدروس المستفادة
5. توصيات المستقبل
    `
  },
  
  culturalContext: {
    learningStylePreferences: [
      'مبني على المجتمع والجماعة',
      'محترم للتقاليد والقيم',
      'موجه من قبل المرشد',
      'تعاوني وتشاركي',
      'يراعي الحكمة والخبرة'
    ],
    communicationPatterns: [
      'محترم ومؤدب',
      'هرمي ومنظم',
      'باحث عن الحكمة',
      'صبور ومتفهم',
      'داعم ومشجع'
    ],
    motivationalFactors: [
      'خدمة المجتمع',
      'طلب العلم والمعرفة',
      'النمو الروحي',
      'تحقيق الذات',
      'الفخر العائلي والاجتماعي'
    ],
    respectPatterns: [
      'احترام الكبار والحكماء',
      'تقدير الجهد والمثابرة',
      'احترام القيم الثقافية',
      'اعتراف بالتنوع',
      'دعم الأسرة والمجتمع'
    ],
    familyOrientation: 'high',
    authorityRelation: 'hierarchical'
  },
  
  formatting: {
    honorifics: {
      student: 'الطالب الكريم',
      mentor: 'الأستاذ المحترم',
      parent: 'الوالدين الكريمين'
    },
    encouragementPhrases: [
      'تقدم ملحوظ وجيد',
      'تسير على الطريق الصحيح',
      'جهودك مقدرة ومحترمة',
      'بإذن الله ستحقق النجاح',
      'أظهرت موهبة جيدة في هذا المجال'
    ],
    cautionPhrases: [
      'يحتاج مزيد من الاهتمام',
      'سيتحسن بالممارسة أكثر',
      'يُنصح بطلب الدعم الإضافي',
      'يحتاج وقت أكثر للإتقان',
      'قابل للتحسن بالصبر والمثابرة'
    ],
    conclusionPhrases: [
      'بشكل عام لديك مسار إيجابي للتحسن',
      'بالدعم المناسب سيكون النجاح مؤكد',
      'مستقبل مشرق بإذن الله ينتظرك',
      'الثقة بالنفس ومواصلة الجهد مفتاح النجاح'
    ],
    transitionPhrases: [
      'كذلك',
      'بالإضافة إلى ذلك',
      'في المقابل',
      'من ناحية أخرى',
      'النقطة المهمة الأخرى'
    ]
  },
  
  linguisticAdaptations: {
    formalityLevel: 'formal',
    toneAdjustments: [
      'محترم ومؤدب',
      'متفائل ومحفز',
      'صبور ومتفهم',
      'علمي لكن مفهوم',
      'داعم وموجه'
    ],
    culturalReferences: [
      'قيمة العلم والتعلم',
      'أهمية الأسرة',
      'احترام المعلم',
      'قيمة المثابرة',
      'ثقافة المساعدة والتعاون'
    ],
    appropriateness: [
      'مناسب للبيئة الأسرية العربية',
      'احترام للقيم التقليدية',
      'تشجيع إيجابي وبناء',
      'مراعاة الآداب الاجتماعية'
    ]
  }
};

// ============================================================================
// TEMPLATE MANAGER AND UTILITIES
// ============================================================================

export const INSIGHT_TEMPLATES = {
  fa: FarsiInsightTemplate,
  en: EnglishInsightTemplate,  
  ar: ArabicInsightTemplate
} as const;

export class TemplateManager {
  static getTemplate(language: 'fa' | 'en' | 'ar'): InsightTemplate {
    return INSIGHT_TEMPLATES[language];
  }
  
  static getSupportedLanguages(): ('fa' | 'en' | 'ar')[] {
    return Object.keys(INSIGHT_TEMPLATES) as ('fa' | 'en' | 'ar')[];
  }
  
  static getCulturalContext(language: 'fa' | 'en' | 'ar'): CulturalContext {
    const template = this.getTemplate(language);
    
    return {
      language,
      region: language === 'fa' ? 'Iran' : language === 'ar' ? 'Arab World' : 'International',
      culturalValues: {
        familyOrientation: template.culturalContext.familyOrientation,
        authorityRespect: template.culturalContext.authorityRelation === 'hierarchical' ? 'high' : 
                         template.culturalContext.authorityRelation === 'collaborative' ? 'medium' : 'low',
        collectivismVsIndividualism: language === 'fa' || language === 'ar' ? 'collectivist' : 
                                   language === 'en' ? 'mixed' : 'individualist',
        communicationStyle: template.culturalContext.communicationPatterns.includes('غیرمستقیم و با ظرافت') || 
                          template.culturalContext.communicationPatterns.includes('محترم ومؤدب') ? 'indirect' : 'direct',
        timeOrientation: language === 'fa' || language === 'ar' ? 'polychronic' : 'flexible'
      },
      educationalPreferences: {
        instructorRole: template.culturalContext.authorityRelation === 'hierarchical' ? 'authoritative' :
                       template.culturalContext.authorityRelation === 'collaborative' ? 'facilitating' : 'collaborative',
        learningStyle: 'mixed', // All cultures support mixed learning styles
        feedbackPreference: language === 'en' ? 'direct' : 'constructive',
        motivationFactors: template.culturalContext.motivationalFactors
      },
      communicationAdaptations: {
        toneAdjustments: template.linguisticAdaptations.toneAdjustments,
        respectPhrases: template.formatting.encouragementPhrases.slice(0, 3),
        encouragementPhrases: template.formatting.encouragementPhrases,
        cautionPhrases: template.formatting.cautionPhrases
      }
    };
  }
  
  static formatInsightContent(
    template: InsightTemplate,
    content: string,
    studentName?: string,
    additionalData?: Record<string, any>
  ): string {
    let formatted = content;
    
    // Replace student name placeholder
    if (studentName) {
      formatted = formatted.replace(/{studentName}/g, studentName);
    }
    
    // Apply additional data replacements
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), String(value));
      });
    }
    
    return formatted;
  }
  
  static getPromptByType(
    language: 'fa' | 'en' | 'ar',
    promptType: keyof InsightTemplate['prompts']
  ): string {
    const template = this.getTemplate(language);
    return template.prompts[promptType];
  }
}

// Template instances and manager are already exported when defined

// Export types for TypeScript compliance
export type {
  InsightTemplate
};