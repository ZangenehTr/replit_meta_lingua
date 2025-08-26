/**
 * Persian NLP Service - Advanced Persian language processing
 * Includes sentiment analysis, entity extraction, and text classification
 * optimized for Persian (Farsi) language with English as secondary
 */

import { ollamaService } from './ollama-service';

export interface PersianTextAnalysis {
  language: 'fa' | 'en' | 'mixed';
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  entities: {
    names: string[];
    phoneNumbers: string[];
    emails: string[];
    dates: string[];
    locations: string[];
    languages: string[];
    courses: string[];
    levels: string[];
  };
  keywords: string[];
  intent: string;
  summary: string;
}

export interface LeadScoringFactors {
  engagementLevel: number; // 0-100
  purchaseIntent: number; // 0-100
  urgency: number; // 0-100
  budget: number; // 0-100
  fitScore: number; // 0-100
  overallScore: number; // 0-100
  recommendation: 'hot' | 'warm' | 'cold' | 'nurture';
  reasoning: string;
}

export class PersianNLPService {
  private readonly persianStopWords = new Set([
    'و', 'در', 'به', 'از', 'که', 'این', 'را', 'با', 'است', 'برای',
    'آن', 'یک', 'خود', 'تا', 'کرد', 'بر', 'هم', 'نیز', 'گفت', 'می‌شود',
    'وی', 'شد', 'دارد', 'ما', 'اما', 'یا', 'شده', 'باید', 'هر', 'آنها',
    'بود', 'او', 'دیگر', 'دو', 'مورد', 'می', 'کند', 'شود', 'کرده', 'بودند'
  ]);
  
  private readonly languageLevelKeywords = {
    fa: {
      beginner: ['مبتدی', 'شروع', 'آغاز', 'پایه', 'اول', 'ابتدایی'],
      elementary: ['ابتدایی', 'سطح پایین', 'مقدماتی'],
      intermediate: ['متوسط', 'میانی', 'سطح متوسط'],
      upperIntermediate: ['متوسط بالا', 'پیشرفته متوسط'],
      advanced: ['پیشرفته', 'حرفه‌ای', 'سطح بالا'],
      native: ['بومی', 'مادری', 'کامل']
    },
    en: {
      beginner: ['beginner', 'starter', 'basic', 'A1', 'A2'],
      elementary: ['elementary', 'A2'],
      intermediate: ['intermediate', 'B1'],
      upperIntermediate: ['upper-intermediate', 'B2'],
      advanced: ['advanced', 'C1', 'C2', 'fluent'],
      native: ['native', 'bilingual']
    }
  };
  
  private readonly intentKeywords = {
    enrollment: {
      fa: ['ثبت نام', 'ثبت‌نام', 'نام‌نویسی', 'عضویت', 'شرکت در', 'می‌خواهم', 'میخواهم'],
      en: ['enroll', 'register', 'join', 'sign up', 'signup', 'want to']
    },
    information: {
      fa: ['اطلاعات', 'جزئیات', 'توضیح', 'سوال', 'قیمت', 'هزینه', 'زمان', 'مدت'],
      en: ['information', 'details', 'explain', 'question', 'price', 'cost', 'duration', 'time']
    },
    support: {
      fa: ['کمک', 'مشکل', 'پشتیبانی', 'راهنمایی', 'نمی‌توانم', 'نمیتوانم'],
      en: ['help', 'problem', 'support', 'assist', 'cannot', 'issue', 'trouble']
    },
    payment: {
      fa: ['پرداخت', 'هزینه', 'قیمت', 'تخفیف', 'قسط', 'کارت', 'انتقال'],
      en: ['payment', 'pay', 'price', 'cost', 'discount', 'installment', 'card', 'transfer']
    },
    schedule: {
      fa: ['زمان', 'برنامه', 'کلاس', 'جلسه', 'ساعت', 'روز', 'هفته'],
      en: ['time', 'schedule', 'class', 'session', 'hour', 'day', 'week']
    }
  };
  
  constructor() {}
  
  /**
   * Detect language of text
   */
  detectLanguage(text: string): 'fa' | 'en' | 'mixed' {
    const persianPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    const englishPattern = /[a-zA-Z]/g;
    
    const persianMatches = (text.match(persianPattern) || []).length;
    const englishMatches = (text.match(englishPattern) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    
    const persianRatio = persianMatches / totalChars;
    const englishRatio = englishMatches / totalChars;
    
    if (persianRatio > 0.7) return 'fa';
    if (englishRatio > 0.7) return 'en';
    return 'mixed';
  }
  
  /**
   * Extract entities from text
   */
  extractEntities(text: string): PersianTextAnalysis['entities'] {
    const entities: PersianTextAnalysis['entities'] = {
      names: [],
      phoneNumbers: [],
      emails: [],
      dates: [],
      locations: [],
      languages: [],
      courses: [],
      levels: []
    };
    
    // Extract phone numbers (Iranian format)
    const phoneRegex = /(?:\+98|0098|98|0)?9\d{9}/g;
    entities.phoneNumbers = (text.match(phoneRegex) || []).map(p => p.trim());
    
    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    entities.emails = (text.match(emailRegex) || []).map(e => e.toLowerCase());
    
    // Extract Persian dates
    const persianDateRegex = /\d{1,2}\s*(فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)\s*\d{2,4}/g;
    const gregorianDateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
    entities.dates = [
      ...(text.match(persianDateRegex) || []),
      ...(text.match(gregorianDateRegex) || [])
    ];
    
    // Extract language mentions
    const languageKeywords = {
      fa: ['انگلیسی', 'فارسی', 'عربی', 'آلمانی', 'فرانسه', 'اسپانیایی', 'چینی', 'ژاپنی', 'ترکی'],
      en: ['English', 'Persian', 'Farsi', 'Arabic', 'German', 'French', 'Spanish', 'Chinese', 'Japanese', 'Turkish']
    };
    
    const lang = this.detectLanguage(text);
    const keywords = lang === 'en' ? languageKeywords.en : languageKeywords.fa;
    keywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        entities.languages.push(keyword);
      }
    });
    
    // Extract course types
    const courseKeywords = {
      fa: ['مکالمه', 'گرامر', 'آیلتس', 'تافل', 'عمومی', 'تجاری', 'کودکان', 'نوجوانان'],
      en: ['conversation', 'grammar', 'IELTS', 'TOEFL', 'general', 'business', 'kids', 'teenagers']
    };
    
    const courseKeys = lang === 'en' ? courseKeywords.en : courseKeywords.fa;
    courseKeys.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        entities.courses.push(keyword);
      }
    });
    
    // Extract level mentions
    Object.entries(this.languageLevelKeywords[lang === 'en' ? 'en' : 'fa']).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          entities.levels.push(level);
        }
      });
    });
    
    return entities;
  }
  
  /**
   * Analyze text sentiment
   */
  async analyzeSentiment(text: string): Promise<{ sentiment: string; confidence: number }> {
    const isAvailable = await ollamaService.isServiceAvailable();
    
    if (!isAvailable) {
      // Fallback sentiment analysis based on keywords
      return this.fallbackSentimentAnalysis(text);
    }
    
    const prompt = `تحلیل احساسات متن زیر را انجام دهید و نتیجه را فقط به صورت JSON با فرمت زیر برگردانید:
    {"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0}
    
    متن: ${text}`;
    
    try {
      const response = await ollamaService.chat(prompt, 'system');
      const result = JSON.parse(response);
      return {
        sentiment: result.sentiment,
        confidence: result.confidence
      };
    } catch (error) {
      return this.fallbackSentimentAnalysis(text);
    }
  }
  
  /**
   * Fallback sentiment analysis using keyword matching
   */
  private fallbackSentimentAnalysis(text: string): { sentiment: string; confidence: number } {
    const positiveKeywords = {
      fa: ['عالی', 'خوب', 'موافق', 'بله', 'حتما', 'ممنون', 'متشکر', 'لطفا', 'می‌خواهم', 'علاقه', 'دوست'],
      en: ['great', 'good', 'yes', 'agree', 'sure', 'thanks', 'please', 'want', 'interested', 'like', 'love']
    };
    
    const negativeKeywords = {
      fa: ['نه', 'خیر', 'نمی‌خواهم', 'بد', 'مشکل', 'نمی‌توانم', 'گران', 'سخت', 'دشوار'],
      en: ['no', 'not', 'bad', 'problem', 'cannot', 'expensive', 'difficult', 'hard', 'issue']
    };
    
    const lang = this.detectLanguage(text);
    const positive = lang === 'en' ? positiveKeywords.en : positiveKeywords.fa;
    const negative = lang === 'en' ? negativeKeywords.en : negativeKeywords.fa;
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positive.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) positiveScore++;
    });
    
    negative.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) {
      return { sentiment: 'positive', confidence: Math.min(0.7 + (positiveScore * 0.05), 0.95) };
    } else if (negativeScore > positiveScore) {
      return { sentiment: 'negative', confidence: Math.min(0.7 + (negativeScore * 0.05), 0.95) };
    } else {
      return { sentiment: 'neutral', confidence: 0.6 };
    }
  }
  
  /**
   * Detect user intent
   */
  detectIntent(text: string): string {
    const lang = this.detectLanguage(text);
    let maxScore = 0;
    let detectedIntent = 'general';
    
    Object.entries(this.intentKeywords).forEach(([intent, keywords]) => {
      const intentKeywords = lang === 'en' ? keywords.en : keywords.fa;
      let score = 0;
      
      intentKeywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          score++;
        }
      });
      
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent;
      }
    });
    
    return detectedIntent;
  }
  
  /**
   * Analyze Persian text comprehensively
   */
  async analyzeText(text: string): Promise<PersianTextAnalysis> {
    const language = this.detectLanguage(text);
    const entities = this.extractEntities(text);
    const { sentiment, confidence } = await this.analyzeSentiment(text);
    const intent = this.detectIntent(text);
    
    // Extract keywords (removing stop words)
    const words = text.split(/\s+/);
    const keywords = words.filter(word => 
      word.length > 2 && 
      !this.persianStopWords.has(word) &&
      !/^\d+$/.test(word)
    ).slice(0, 10);
    
    // Generate summary
    const summary = await this.generateSummary(text);
    
    return {
      language,
      sentiment: sentiment as 'positive' | 'negative' | 'neutral',
      confidence,
      entities,
      keywords,
      intent,
      summary
    };
  }
  
  /**
   * Generate text summary
   */
  async generateSummary(text: string): Promise<string> {
    const isAvailable = await ollamaService.isServiceAvailable();
    
    if (!isAvailable) {
      // Return first 100 characters as fallback
      return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }
    
    const lang = this.detectLanguage(text);
    const prompt = lang === 'fa' 
      ? `متن زیر را در یک جمله خلاصه کنید: ${text}`
      : `Summarize the following text in one sentence: ${text}`;
    
    try {
      return await ollamaService.chat(prompt, 'system');
    } catch (error) {
      return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }
  }
  
  /**
   * Score lead based on conversation analysis
   */
  async scoreLead(
    conversationText: string,
    additionalContext?: {
      callDuration?: number;
      previousInteractions?: number;
      responseTime?: number;
    }
  ): Promise<LeadScoringFactors> {
    const analysis = await this.analyzeText(conversationText);
    const intent = this.detectIntent(conversationText);
    
    // Calculate engagement level
    const engagementLevel = this.calculateEngagement(conversationText, additionalContext?.callDuration);
    
    // Calculate purchase intent
    const purchaseIntent = this.calculatePurchaseIntent(analysis, intent);
    
    // Calculate urgency
    const urgency = this.calculateUrgency(analysis, conversationText);
    
    // Calculate budget fitness
    const budget = this.calculateBudgetFit(conversationText);
    
    // Calculate fit score
    const fitScore = this.calculateFitScore(analysis);
    
    // Calculate overall score
    const weights = {
      engagement: 0.2,
      intent: 0.3,
      urgency: 0.2,
      budget: 0.15,
      fit: 0.15
    };
    
    const overallScore = Math.round(
      engagementLevel * weights.engagement +
      purchaseIntent * weights.intent +
      urgency * weights.urgency +
      budget * weights.budget +
      fitScore * weights.fit
    );
    
    // Determine recommendation
    let recommendation: 'hot' | 'warm' | 'cold' | 'nurture';
    if (overallScore >= 80) {
      recommendation = 'hot';
    } else if (overallScore >= 60) {
      recommendation = 'warm';
    } else if (overallScore >= 40) {
      recommendation = 'nurture';
    } else {
      recommendation = 'cold';
    }
    
    // Generate reasoning
    const reasoning = this.generateScoringReasoning(
      { engagementLevel, purchaseIntent, urgency, budget, fitScore, overallScore },
      analysis.language
    );
    
    return {
      engagementLevel,
      purchaseIntent,
      urgency,
      budget,
      fitScore,
      overallScore,
      recommendation,
      reasoning
    };
  }
  
  private calculateEngagement(text: string, duration?: number): number {
    let score = 50; // Base score
    
    // Adjust based on text length
    if (text.length > 500) score += 20;
    else if (text.length > 200) score += 10;
    
    // Adjust based on call duration
    if (duration) {
      if (duration > 300) score += 20; // More than 5 minutes
      else if (duration > 180) score += 10; // More than 3 minutes
    }
    
    // Check for questions
    const questionMarks = (text.match(/\?|؟/g) || []).length;
    score += Math.min(questionMarks * 5, 20);
    
    return Math.min(score, 100);
  }
  
  private calculatePurchaseIntent(analysis: PersianTextAnalysis, intent: string): number {
    let score = 30; // Base score
    
    // Check intent
    if (intent === 'enrollment') score += 30;
    else if (intent === 'payment') score += 25;
    else if (intent === 'information') score += 15;
    else if (intent === 'schedule') score += 20;
    
    // Check sentiment
    if (analysis.sentiment === 'positive') score += 20;
    else if (analysis.sentiment === 'negative') score -= 10;
    
    // Check for specific buying signals
    const buyingSignals = {
      fa: ['ثبت نام', 'شروع', 'کی', 'چقدر', 'هزینه', 'قیمت'],
      en: ['register', 'start', 'when', 'how much', 'cost', 'price']
    };
    
    const signals = analysis.language === 'en' ? buyingSignals.en : buyingSignals.fa;
    signals.forEach(signal => {
      if (analysis.keywords.some(k => k.includes(signal))) {
        score += 5;
      }
    });
    
    return Math.min(Math.max(score, 0), 100);
  }
  
  private calculateUrgency(analysis: PersianTextAnalysis, text: string): number {
    let score = 30; // Base score
    
    // Check for time-related keywords
    const urgencyKeywords = {
      fa: ['فوری', 'سریع', 'امروز', 'فردا', 'این هفته', 'هرچه زودتر'],
      en: ['urgent', 'quick', 'today', 'tomorrow', 'this week', 'asap', 'soon']
    };
    
    const keywords = analysis.language === 'en' ? urgencyKeywords.en : urgencyKeywords.fa;
    keywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        score += 15;
      }
    });
    
    // Check for dates mentioned
    if (analysis.entities.dates.length > 0) score += 20;
    
    return Math.min(score, 100);
  }
  
  private calculateBudgetFit(text: string): number {
    let score = 50; // Default middle score
    
    // Check for budget concerns
    const budgetConcerns = {
      fa: ['گران', 'قیمت', 'تخفیف', 'قسط', 'ارزان'],
      en: ['expensive', 'price', 'discount', 'installment', 'cheap', 'budget']
    };
    
    const lang = this.detectLanguage(text);
    const concerns = lang === 'en' ? budgetConcerns.en : budgetConcerns.fa;
    
    let hasConcerns = false;
    concerns.forEach(concern => {
      if (text.toLowerCase().includes(concern)) {
        hasConcerns = true;
      }
    });
    
    if (!hasConcerns) score = 70; // No budget concerns mentioned
    else score = 40; // Has budget concerns
    
    return score;
  }
  
  private calculateFitScore(analysis: PersianTextAnalysis): number {
    let score = 40; // Base score
    
    // Check if they mentioned specific languages we teach
    if (analysis.entities.languages.length > 0) score += 20;
    
    // Check if they mentioned specific course types
    if (analysis.entities.courses.length > 0) score += 20;
    
    // Check if they mentioned their level
    if (analysis.entities.levels.length > 0) score += 20;
    
    return Math.min(score, 100);
  }
  
  private generateScoringReasoning(
    scores: {
      engagementLevel: number;
      purchaseIntent: number;
      urgency: number;
      budget: number;
      fitScore: number;
      overallScore: number;
    },
    language: 'fa' | 'en' | 'mixed'
  ): string {
    if (language === 'fa' || language === 'mixed') {
      let reasoning = `امتیاز کلی: ${scores.overallScore}/100\n`;
      reasoning += `سطح تعامل: ${scores.engagementLevel}% - `;
      reasoning += scores.engagementLevel > 70 ? 'بسیار درگیر' : scores.engagementLevel > 40 ? 'متوسط' : 'کم';
      reasoning += `\nقصد خرید: ${scores.purchaseIntent}% - `;
      reasoning += scores.purchaseIntent > 70 ? 'آماده ثبت‌نام' : scores.purchaseIntent > 40 ? 'علاقه‌مند' : 'در حال بررسی';
      reasoning += `\nفوریت: ${scores.urgency}% - `;
      reasoning += scores.urgency > 70 ? 'نیاز فوری' : scores.urgency > 40 ? 'برنامه‌ریزی کوتاه‌مدت' : 'بدون عجله';
      return reasoning;
    } else {
      let reasoning = `Overall Score: ${scores.overallScore}/100\n`;
      reasoning += `Engagement: ${scores.engagementLevel}% - `;
      reasoning += scores.engagementLevel > 70 ? 'Highly engaged' : scores.engagementLevel > 40 ? 'Moderate' : 'Low';
      reasoning += `\nPurchase Intent: ${scores.purchaseIntent}% - `;
      reasoning += scores.purchaseIntent > 70 ? 'Ready to enroll' : scores.purchaseIntent > 40 ? 'Interested' : 'Exploring';
      reasoning += `\nUrgency: ${scores.urgency}% - `;
      reasoning += scores.urgency > 70 ? 'Urgent need' : scores.urgency > 40 ? 'Short-term plan' : 'No rush';
      return reasoning;
    }
  }
}

export const persianNLPService = new PersianNLPService();