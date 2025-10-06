import { ollamaService } from '../ollama-service';
import { z } from 'zod';

export const LeadInquirySchema = z.object({
  source: z.enum(['Telegram', 'Email', 'Instagram', 'WhatsApp', 'SMS', 'Website']),
  senderName: z.string().optional(),
  senderContact: z.string(),
  message: z.string().min(1),
  language: z.enum(['fa', 'en', 'ar']).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'agent']),
    content: z.string(),
    timestamp: z.string(),
  })).optional(),
  metadata: z.record(z.any()).optional(),
});

export type LeadInquiry = z.infer<typeof LeadInquirySchema>;

export interface LeadResponse {
  message: string;
  language: 'fa' | 'en' | 'ar';
  leadScore: number;
  qualification: 'hot' | 'warm' | 'cold' | 'unqualified';
  suggestedAction: 'immediate_followup' | 'schedule_call' | 'send_materials' | 'nurture' | 'disqualify';
  detectedIntent: string[];
  requiresHumanEscalation: boolean;
  suggestedFollowUpTime?: string;
  extractedInfo: {
    name?: string;
    phone?: string;
    email?: string;
    courseInterest?: string[];
    proficiencyLevel?: string;
    budget?: string;
    urgency?: 'high' | 'medium' | 'low';
    preferredSchedule?: string;
  };
}

const INQUIRY_TYPES = {
  pricing: ['قیمت', 'هزینه', 'تعرفه', 'price', 'cost', 'fee', 'tuition'],
  schedule: ['زمان', 'ساعت', 'روز', 'برنامه', 'schedule', 'time', 'when', 'timing'],
  courses: ['دوره', 'کلاس', 'آموزش', 'course', 'class', 'program', 'training'],
  ielts: ['آیلتس', 'IELTS', 'ielts', 'آیلس'],
  toefl: ['تافل', 'TOEFL', 'toefl'],
  general: ['عمومی', 'general', 'conversation', 'مکالمه'],
  business: ['تجاری', 'business', 'کسب', 'کار'],
  kids: ['کودک', 'بچه', 'kids', 'children', 'young'],
  online: ['آنلاین', 'online', 'distance', 'virtual', 'مجازی'],
  inperson: ['حضوری', 'in-person', 'physical', 'face-to-face'],
  location: ['آدرس', 'موقعیت', 'location', 'address', 'where'],
  registration: ['ثبت نام', 'register', 'enroll', 'sign up', 'registration'],
};

export class AISalesAgent {
  private detectLanguage(message: string): 'fa' | 'en' | 'ar' {
    const persianExclusiveChars = /[\u06A9\u06AF\u06CC\u06BE]/;
    
    const arabicExclusiveChars = /[\u0623\u0625\u0622\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\u0670]/;
    
    const arabicExclusiveWords = ['هو', 'هي', 'كان', 'هذا', 'أن', 'التي', 'الذي', 'لقد', 'أريد', 'أحتاج', 'هل', 'ماذا', 'أين', 'الدورة', 'التعليم', 'اللغة'];
    const persianExclusiveWords = ['است', 'می\u200Cخواهم', 'می\u200Cخوام', 'شما', 'خواهد', 'بود', 'خوبی', 'چطور', 'کجا', 'چند', 'این', 'برای', 'دوره', 'آموزش', 'زبان'];
    
    const persianCommonWords = ['در', 'به', 'از', 'که', 'با', 'را', 'می'];
    const arabicCommonWords = ['على', 'إلى'];
    
    if (persianExclusiveChars.test(message)) {
      return 'fa';
    }
    
    if (arabicExclusiveChars.test(message)) {
      return 'ar';
    }
    
    const hasArabicExclusiveWord = arabicExclusiveWords.some(word => message.includes(word));
    if (hasArabicExclusiveWord) {
      return 'ar';
    }
    
    const hasPersianExclusiveWord = persianExclusiveWords.some(word => message.includes(word));
    if (hasPersianExclusiveWord) {
      return 'fa';
    }
    
    const words = message.split(/\s+/);
    
    const persianScore = persianCommonWords.filter(word => words.includes(word)).length;
    const arabicScore = arabicCommonWords.filter(word => words.includes(word)).length;
    
    if (arabicScore > persianScore && arabicScore > 0) {
      return 'ar';
    }
    
    if (persianScore > 0) {
      return 'fa';
    }
    
    const hasRTL = /[\u0600-\u06FF]/.test(message);
    if (hasRTL) {
      return 'fa';
    }
    
    return 'en';
  }

  private detectIntent(message: string): string[] {
    const detectedIntents: string[] = [];
    const lowerMessage = message.toLowerCase();

    for (const [intent, keywords] of Object.entries(INQUIRY_TYPES)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
        detectedIntents.push(intent);
      }
    }

    return detectedIntents.length > 0 ? detectedIntents : ['general_inquiry'];
  }

  private extractContactInfo(message: string): { phone?: string; email?: string } {
    const phonePattern = /(\+98|0)?9\d{9}|(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g;
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const phones = message.match(phonePattern);
    const emails = message.match(emailPattern);

    return {
      phone: phones ? phones[0] : undefined,
      email: emails ? emails[0] : undefined,
    };
  }

  private calculateLeadScore(inquiry: LeadInquiry, detectedIntents: string[]): number {
    let score = 50;

    if (detectedIntents.includes('pricing')) score += 15;
    if (detectedIntents.includes('registration')) score += 20;
    if (detectedIntents.includes('schedule')) score += 10;
    if (detectedIntents.includes('ielts') || detectedIntents.includes('toefl')) score += 15;
    
    if (inquiry.senderName) score += 5;
    
    const contactInfo = this.extractContactInfo(inquiry.message);
    if (contactInfo.phone) score += 10;
    if (contactInfo.email) score += 10;

    if (inquiry.message.length > 100) score += 5;
    if (inquiry.message.length > 200) score += 5;

    const urgencyKeywords = ['فوری', 'urgent', 'asap', 'سریع', 'زود', 'quick'];
    if (urgencyKeywords.some(kw => inquiry.message.toLowerCase().includes(kw))) {
      score += 15;
    }

    return Math.min(100, score);
  }

  private qualifyLead(score: number): 'hot' | 'warm' | 'cold' | 'unqualified' {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'warm';
    if (score >= 40) return 'cold';
    return 'unqualified';
  }

  private suggestAction(qualification: string, detectedIntents: string[]): LeadResponse['suggestedAction'] {
    if (qualification === 'hot') return 'immediate_followup';
    if (qualification === 'warm' && detectedIntents.includes('registration')) return 'schedule_call';
    if (qualification === 'warm') return 'send_materials';
    if (qualification === 'cold') return 'nurture';
    return 'disqualify';
  }

  private buildPrompt(inquiry: LeadInquiry, detectedIntents: string[], language: 'fa' | 'en' | 'ar'): string {
    const instituteInfo = {
      fa: {
        name: 'آکادمی متالینگوا',
        description: 'موسسه زبان پیشرو در ایران با بیش از 10 سال تجربه',
        specialties: 'آموزش IELTS، TOEFL، مکالمه عمومی و تجاری',
        contactInfo: 'تلفن: 021-12345678',
      },
      en: {
        name: 'Meta Lingua Academy',
        description: 'Leading language institute in Iran with over 10 years of experience',
        specialties: 'IELTS, TOEFL, General & Business English training',
        contactInfo: 'Phone: 021-12345678',
      },
      ar: {
        name: 'أكاديمية ميتا لينجوا',
        description: 'معهد اللغة الرائد في إيران مع أكثر من 10 سنوات من الخبرة',
        specialties: 'تدريب IELTS و TOEFL والإنجليزية العامة والتجارية',
        contactInfo: 'الهاتف: 021-12345678',
      },
    };

    const info = instituteInfo[language];
    const conversationContext = inquiry.conversationHistory && inquiry.conversationHistory.length > 0
      ? '\n\nPrevious conversation:\n' + inquiry.conversationHistory.map(msg => 
          `${msg.role === 'user' ? 'Customer' : 'Agent'}: ${msg.content}`
        ).join('\n')
      : '';

    const detectedIntentsText = detectedIntents.length > 0 
      ? `Detected customer interests: ${detectedIntents.join(', ')}`
      : '';

    const languageInstructions = {
      fa: `You are a professional sales representative for ${info.name}. Respond in Persian (فارسی) with proper grammar and a warm, professional tone.`,
      en: `You are a professional sales representative for ${info.name}. Respond in English with a warm, professional tone.`,
      ar: `You are a professional sales representative for ${info.name}. Respond in Arabic (العربية) with a warm, professional tone.`,
    };

    return `${languageInstructions[language]}

Institute Information:
- Name: ${info.name}
- About: ${info.description}
- Specialties: ${info.specialties}
- Contact: ${info.contactInfo}

${detectedIntentsText}

Customer inquiry received via ${inquiry.source}:
"${inquiry.message}"
${conversationContext}

IMPORTANT GUIDELINES:
1. Address the customer's specific questions directly and concisely
2. Highlight relevant courses based on their interests (${detectedIntents.join(', ')})
3. If they ask about pricing, mention that we have flexible payment plans and invite them to discuss details
4. If they ask about schedule, mention we offer flexible timing including weekdays, weekends, and online options
5. Always include a clear call-to-action (e.g., "Would you like to schedule a free consultation?")
6. Keep the response under 300 words
7. Be warm but professional - avoid being overly salesy
8. If the inquiry is unclear, politely ask clarifying questions
9. Use ${language} language exclusively in your response
10. If they provide contact information, acknowledge it and confirm follow-up

Generate your response now (${language} language only):`;
  }

  async handleInquiry(inquiry: LeadInquiry): Promise<LeadResponse> {
    try {
      const validatedInquiry = LeadInquirySchema.parse(inquiry);
      
      const language = validatedInquiry.language || this.detectLanguage(validatedInquiry.message);
      const detectedIntents = this.detectIntent(validatedInquiry.message);
      const leadScore = this.calculateLeadScore(validatedInquiry, detectedIntents);
      const qualification = this.qualifyLead(leadScore);
      const suggestedAction = this.suggestAction(qualification, detectedIntents);
      const contactInfo = this.extractContactInfo(validatedInquiry.message);

      const prompt = this.buildPrompt(validatedInquiry, detectedIntents, language);
      
      const aiResponse = await ollamaService.generateText(prompt, {
        temperature: 0.7,
        max_tokens: 500,
      });

      const requiresHumanEscalation = 
        qualification === 'hot' || 
        detectedIntents.includes('registration') ||
        validatedInquiry.message.toLowerCase().includes('مدیر') ||
        validatedInquiry.message.toLowerCase().includes('manager') ||
        validatedInquiry.message.toLowerCase().includes('شکایت') ||
        validatedInquiry.message.toLowerCase().includes('complaint');

      return {
        message: aiResponse.trim(),
        language,
        leadScore,
        qualification,
        suggestedAction,
        detectedIntent: detectedIntents,
        requiresHumanEscalation,
        suggestedFollowUpTime: this.calculateFollowUpTime(qualification),
        extractedInfo: {
          name: validatedInquiry.senderName,
          phone: contactInfo.phone,
          email: contactInfo.email,
          courseInterest: detectedIntents.filter(i => 
            ['ielts', 'toefl', 'general', 'business', 'kids'].includes(i)
          ),
          urgency: this.detectUrgency(validatedInquiry.message),
        },
      };
    } catch (error) {
      console.error('AI sales agent error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid inquiry: ${error.errors.map(e => e.message).join(', ')}`);
      }
      return this.getFallbackResponse(inquiry);
    }
  }

  async generateFollowUp(
    inquiry: LeadInquiry,
    previousResponse: string,
    context: string
  ): Promise<string> {
    try {
      const language = inquiry.language || this.detectLanguage(inquiry.message);
      
      const prompt = `You are following up with a potential customer for Meta Lingua Academy.

Previous inquiry: "${inquiry.message}"
Your previous response: "${previousResponse}"
Context: ${context}

Generate a ${language === 'fa' ? 'Persian' : language === 'ar' ? 'Arabic' : 'English'} follow-up message that:
1. References the previous conversation
2. Adds value (new information, special offer, or helpful tip)
3. Includes a clear call-to-action
4. Keeps it under 150 words
5. Sounds natural and not automated

Generate the follow-up message now:`;

      const followUp = await ollamaService.generateText(prompt, {
        temperature: 0.8,
        max_tokens: 300,
      });

      return followUp.trim();
    } catch (error) {
      console.error('Follow-up generation error:', error);
      const fallback = {
        fa: 'سلام! امیدوارم حالتان خوب باشد. آیا فرصتی برای بررسی اطلاعاتی که ارسال کردیم داشتید؟ اگر سوالی دارید، خوشحال می‌شوم پاسخ دهم.',
        en: 'Hello! I hope you are well. Have you had a chance to review the information we sent? If you have any questions, I would be happy to help.',
        ar: 'مرحبا! آمل أن تكون بخير. هل أتيحت لك الفرصة لمراجعة المعلومات التي أرسلناها؟ إذا كان لديك أي أسئلة، يسعدني المساعدة.',
      };
      const language = inquiry.language || this.detectLanguage(inquiry.message);
      return fallback[language];
    }
  }

  private detectUrgency(message: string): 'high' | 'medium' | 'low' {
    const highUrgency = ['فوری', 'urgent', 'asap', 'امروز', 'today', 'الآن', 'now'];
    const mediumUrgency = ['این هفته', 'this week', 'زود', 'soon', 'قریب'];
    
    const lowerMessage = message.toLowerCase();
    
    if (highUrgency.some(kw => lowerMessage.includes(kw))) return 'high';
    if (mediumUrgency.some(kw => lowerMessage.includes(kw))) return 'medium';
    return 'low';
  }

  private calculateFollowUpTime(qualification: string): string {
    const now = new Date();
    const followUpMap = {
      hot: 4,
      warm: 24,
      cold: 72,
      unqualified: 168,
    };
    
    const hours = followUpMap[qualification as keyof typeof followUpMap] || 24;
    now.setHours(now.getHours() + hours);
    
    return now.toISOString();
  }

  private getFallbackResponse(inquiry: LeadInquiry): LeadResponse {
    const language = inquiry.language || this.detectLanguage(inquiry.message);
    
    const fallbackMessages = {
      fa: 'با سلام! ممنون که با ما تماس گرفتید. یکی از همکاران ما به زودی با شما تماس خواهد گرفت. برای اطلاعات بیشتر می‌توانید با شماره 021-12345678 تماس بگیرید.',
      en: 'Hello! Thank you for contacting us. One of our colleagues will contact you soon. For more information, you can call 021-12345678.',
      ar: 'مرحبا! شكرا لاتصالك بنا. سيتصل بك أحد زملائنا قريبا. لمزيد من المعلومات، يمكنك الاتصال على 021-12345678.',
    };

    return {
      message: fallbackMessages[language],
      language,
      leadScore: 50,
      qualification: 'warm',
      suggestedAction: 'send_materials',
      detectedIntent: ['general_inquiry'],
      requiresHumanEscalation: true,
      suggestedFollowUpTime: this.calculateFollowUpTime('warm'),
      extractedInfo: {
        name: inquiry.senderName,
      },
    };
  }
}

export const aiSalesAgent = new AISalesAgent();
