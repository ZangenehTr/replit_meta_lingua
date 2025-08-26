/**
 * Knowledge Base RAG (Retrieval-Augmented Generation) Service
 * Handles Persian and English content for language learning context
 */

import { db } from './db';
import { ollamaService } from './ollama-service';
import { persianNLPService } from './persian-nlp-service';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  language: 'fa' | 'en';
  category: string;
  tags: string[];
  metadata: {
    source?: string;
    author?: string;
    createdAt: Date;
    updatedAt: Date;
    relevanceScore?: number;
  };
  embedding?: number[];
}

export interface SearchResult {
  document: KnowledgeDocument;
  score: number;
  snippet: string;
  highlights: string[];
}

export interface RAGResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
  language: 'fa' | 'en' | 'mixed';
}

export class KnowledgeBaseService {
  private knowledgeBase: Map<string, KnowledgeDocument>;
  private embeddings: Map<string, number[]>;
  private readonly categories = {
    courses: 'دوره‌ها',
    pricing: 'قیمت‌گذاری',
    schedule: 'برنامه‌ریزی',
    methods: 'روش‌های آموزش',
    levels: 'سطوح',
    teachers: 'مدرسین',
    faq: 'سوالات متداول',
    policies: 'قوانین و مقررات',
    enrollment: 'ثبت‌نام',
    assessment: 'ارزیابی'
  };
  
  constructor() {
    this.knowledgeBase = new Map();
    this.embeddings = new Map();
    this.initializeKnowledgeBase();
  }
  
  /**
   * Initialize knowledge base with core documents
   */
  private async initializeKnowledgeBase(): Promise<void> {
    // Core knowledge documents in Persian
    const coreDocuments: Omit<KnowledgeDocument, 'embedding'>[] = [
      {
        id: 'courses-general',
        title: 'دوره‌های آموزش زبان',
        content: `موسسه زبان متالینگوا دوره‌های متنوعی برای یادگیری زبان‌های مختلف ارائه می‌دهد:
        
        دوره‌های زبان انگلیسی:
        - عمومی (General English): مناسب برای تمام سطوح از مبتدی تا پیشرفته
        - مکالمه (Conversation): تمرکز بر مهارت‌های گفتاری و شنیداری
        - آیلتس (IELTS): آمادگی برای آزمون بین‌المللی آیلتس
        - تافل (TOEFL): آمادگی برای آزمون تافل
        - انگلیسی تجاری (Business English): برای محیط‌های کاری و تجاری
        - انگلیسی کودکان: برای گروه سنی 4 تا 12 سال
        - انگلیسی نوجوانان: برای گروه سنی 13 تا 17 سال
        
        هر دوره شامل:
        - آموزش چهار مهارت اصلی (Speaking, Listening, Reading, Writing)
        - منابع آموزشی دیجیتال
        - تکالیف و تمرین‌های تعاملی
        - ارزیابی مستمر پیشرفت
        - گواهینامه پایان دوره`,
        language: 'fa',
        category: 'courses',
        tags: ['دوره', 'انگلیسی', 'آیلتس', 'تافل', 'مکالمه', 'کودکان'],
        metadata: {
          source: 'internal',
          author: 'Meta Lingua Academy',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'pricing-structure',
        title: 'ساختار قیمت‌گذاری',
        content: `قیمت دوره‌های موسسه متالینگوا بر اساس عوامل زیر تعیین می‌شود:
        
        انواع کلاس‌ها و قیمت‌ها:
        - کلاس خصوصی: 500,000 تا 800,000 تومان هر جلسه
        - کلاس نیمه‌خصوصی (2-3 نفر): 350,000 تا 500,000 تومان هر نفر
        - کلاس گروهی (4-8 نفر): 200,000 تا 350,000 تومان هر نفر
        - کلاس آنلاین: 20% تخفیف نسبت به کلاس حضوری
        
        پکیج‌های ویژه:
        - پکیج 3 ماهه: 10% تخفیف
        - پکیج 6 ماهه: 15% تخفیف
        - پکیج سالانه: 20% تخفیف
        
        تخفیفات:
        - دانشجویان: 15% تخفیف
        - ثبت‌نام گروهی (3 نفر به بالا): 10% تخفیف
        - دانش‌آموزان ممتاز: تا 25% تخفیف
        
        شرایط پرداخت:
        - پرداخت نقدی
        - پرداخت اقساطی (2 تا 6 قسط)
        - پرداخت آنلاین از طریق درگاه بانکی`,
        language: 'fa',
        category: 'pricing',
        tags: ['قیمت', 'تخفیف', 'پرداخت', 'اقساط', 'پکیج'],
        metadata: {
          source: 'internal',
          author: 'Meta Lingua Academy',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'levels-cefr',
        title: 'سطوح آموزشی بر اساس CEFR',
        content: `سطح‌بندی دوره‌ها بر اساس چارچوب مرجع اروپایی (CEFR):
        
        A1 - مبتدی (Beginner):
        - درک عبارات ساده روزمره
        - معرفی خود و دیگران
        - 60-80 ساعت آموزش
        
        A2 - پایه (Elementary):
        - توانایی برقراری ارتباط در موقعیت‌های ساده
        - توصیف محیط اطراف
        - 80-100 ساعت آموزش
        
        B1 - متوسط (Intermediate):
        - درک نکات اصلی متون استاندارد
        - توانایی سفر به کشورهای انگلیسی‌زبان
        - 100-120 ساعت آموزش
        
        B2 - متوسط بالا (Upper-Intermediate):
        - درک متون پیچیده
        - صحبت روان و طبیعی
        - 120-150 ساعت آموزش
        
        C1 - پیشرفته (Advanced):
        - درک متون طولانی و ضمنی
        - استفاده انعطاف‌پذیر از زبان
        - 150-180 ساعت آموزش
        
        C2 - تسلط کامل (Mastery):
        - درک کامل همه چیز
        - بیان دقیق و ظریف معانی
        - 180+ ساعت آموزش`,
        language: 'fa',
        category: 'levels',
        tags: ['CEFR', 'سطح', 'مبتدی', 'متوسط', 'پیشرفته'],
        metadata: {
          source: 'internal',
          author: 'Meta Lingua Academy',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'callern-service',
        title: 'سرویس Callern - آموزش ویدیویی 24/7',
        content: `Callern سرویس منحصر به فرد آموزش زبان به صورت تماس ویدیویی:
        
        ویژگی‌های Callern:
        - دسترسی 24 ساعته و 7 روز هفته
        - مدرسین بومی و حرفه‌ای
        - جلسات 15، 30، 45 و 60 دقیقه‌ای
        - بدون نیاز به رزرو قبلی
        - قابلیت ضبط جلسات برای مرور
        
        نحوه استفاده:
        1. ورود به پنل کاربری
        2. انتخاب زبان و موضوع مورد نظر
        3. اتصال به مدرس در کمتر از 30 ثانیه
        4. شروع جلسه آموزشی تعاملی
        
        امکانات هوش مصنوعی:
        - پیشنهاد واژگان در حین مکالمه
        - تصحیح گرامری لحظه‌ای
        - ترجمه همزمان
        - ایجاد واژه‌نامه شخصی
        - تولید کوییز بر اساس محتوای جلسه
        
        قیمت:
        - پکیج پایه: 200,000 تومان برای 60 دقیقه
        - پکیج حرفه‌ای: 500,000 تومان برای 180 دقیقه
        - پکیج نامحدود ماهانه: 2,000,000 تومان`,
        language: 'fa',
        category: 'courses',
        tags: ['Callern', 'ویدیو', 'آنلاین', 'هوش مصنوعی', '24/7'],
        metadata: {
          source: 'internal',
          author: 'Meta Lingua Academy',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'enrollment-process',
        title: 'فرآیند ثبت‌نام',
        content: `مراحل ثبت‌نام در موسسه متالینگوا:
        
        1. مشاوره رایگان:
        - تماس یا مراجعه حضوری
        - تعیین نیازها و اهداف آموزشی
        - معرفی دوره‌های مناسب
        
        2. آزمون تعیین سطح:
        - آزمون آنلاین یا حضوری
        - مدت زمان: 45-60 دقیقه
        - ارزیابی چهار مهارت
        - دریافت نتیجه فوری
        
        3. انتخاب دوره:
        - بررسی برنامه کلاس‌ها
        - انتخاب روز و ساعت مناسب
        - انتخاب مدرس (در صورت امکان)
        
        4. ثبت‌نام و پرداخت:
        - تکمیل فرم ثبت‌نام
        - ارائه مدارک (کپی شناسنامه/کارت ملی)
        - پرداخت شهریه
        - دریافت رسید و کارت دانشجویی
        
        5. شروع کلاس:
        - دریافت منابع آموزشی
        - دسترسی به پنل آنلاین
        - حضور در جلسه اول
        
        مدارک مورد نیاز:
        - کپی کارت ملی
        - یک قطعه عکس 3×4
        - فیش واریزی (در صورت پرداخت بانکی)`,
        language: 'fa',
        category: 'enrollment',
        tags: ['ثبت‌نام', 'مشاوره', 'آزمون', 'مدارک'],
        metadata: {
          source: 'internal',
          author: 'Meta Lingua Academy',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'teaching-methods',
        title: 'روش‌های آموزشی',
        content: `روش‌های نوین آموزش زبان در متالینگوا:
        
        روش ارتباطی (Communicative Approach):
        - تمرکز بر مکالمه و ارتباط واقعی
        - استفاده از موقعیت‌های روزمره
        - یادگیری از طریق تعامل
        
        روش Task-Based:
        - یادگیری از طریق انجام تکالیف عملی
        - حل مسائل واقعی
        - کار گروهی و پروژه‌محور
        
        روش Blended Learning:
        - ترکیب آموزش حضوری و آنلاین
        - استفاده از تکنولوژی
        - محتوای چندرسانه‌ای
        
        روش Total Physical Response:
        - یادگیری از طریق حرکت (برای کودکان)
        - بازی‌های آموزشی
        - فعالیت‌های تعاملی
        
        تکنیک‌های تکمیلی:
        - Flipped Classroom
        - Gamification
        - Storytelling
        - Role-playing
        - Mind mapping`,
        language: 'fa',
        category: 'methods',
        tags: ['روش', 'آموزش', 'ارتباطی', 'تکنولوژی'],
        metadata: {
          source: 'internal',
          author: 'Meta Lingua Academy',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'faq-common',
        title: 'سوالات متداول',
        content: `پاسخ به سوالات رایج:
        
        س: حداقل سن برای ثبت‌نام چقدر است؟
        ج: از 4 سال برای دوره‌های کودکان و بدون محدودیت برای بزرگسالان
        
        س: آیا امکان تغییر کلاس وجود دارد؟
        ج: بله، در صورت وجود ظرفیت و با هماهنگی قبلی
        
        س: در صورت غیبت، آیا کلاس جبرانی دارم؟
        ج: تا 2 جلسه در هر ترم با اطلاع قبلی قابل جبران است
        
        س: منابع آموزشی شامل هزینه دوره هستند؟
        ج: منابع دیجیتال رایگان و کتاب‌های فیزیکی با هزینه جداگانه
        
        س: آیا گواهینامه معتبر است؟
        ج: بله، گواهینامه‌ها دارای اعتبار داخلی و قابل ترجمه رسمی هستند
        
        س: امکان پرداخت اقساطی وجود دارد؟
        ج: بله، تا 6 قسط بدون بهره
        
        س: آیا می‌توانم مدرس خود را انتخاب کنم؟
        ج: در کلاس‌های خصوصی امکان انتخاب مدرس وجود دارد
        
        س: کلاس‌های آنلاین چگونه برگزار می‌شوند؟
        ج: از طریق پلتفرم اختصاصی موسسه با امکانات کامل`,
        language: 'fa',
        category: 'faq',
        tags: ['سوال', 'پاسخ', 'راهنما'],
        metadata: {
          source: 'internal',
          author: 'Meta Lingua Academy',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];
    
    // English versions of key documents
    const englishDocuments: Omit<KnowledgeDocument, 'embedding'>[] = [
      {
        id: 'courses-general-en',
        title: 'Language Courses',
        content: `Meta Lingua Academy offers diverse language learning courses:
        
        English Courses:
        - General English: Suitable for all levels from beginner to advanced
        - Conversation: Focus on speaking and listening skills
        - IELTS Preparation: Comprehensive IELTS exam preparation
        - TOEFL Preparation: Complete TOEFL exam training
        - Business English: For professional and business environments
        - Kids English: For ages 4-12
        - Teenagers English: For ages 13-17
        
        Each course includes:
        - Four main skills training (Speaking, Listening, Reading, Writing)
        - Digital learning resources
        - Interactive assignments and exercises
        - Continuous progress assessment
        - Course completion certificate`,
        language: 'en',
        category: 'courses',
        tags: ['course', 'english', 'ielts', 'toefl', 'conversation', 'kids'],
        metadata: {
          source: 'internal',
          author: 'Meta Lingua Academy',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'callern-service-en',
        title: 'Callern Service - 24/7 Video Tutoring',
        content: `Callern is our unique on-demand video tutoring service:
        
        Features:
        - 24/7 availability
        - Native and professional teachers
        - 15, 30, 45, and 60-minute sessions
        - No advance booking required
        - Session recording for review
        
        How to use:
        1. Log into your dashboard
        2. Select language and topic
        3. Connect with a teacher in under 30 seconds
        4. Start your interactive session
        
        AI Features:
        - Real-time vocabulary suggestions
        - Instant grammar corrections
        - Live translation
        - Personal glossary building
        - Quiz generation from session content
        
        Pricing:
        - Basic Package: 200,000 Tomans for 60 minutes
        - Professional: 500,000 Tomans for 180 minutes
        - Unlimited Monthly: 2,000,000 Tomans`,
        language: 'en',
        category: 'courses',
        tags: ['callern', 'video', 'online', 'ai', '24/7'],
        metadata: {
          source: 'internal',
          author: 'Meta Lingua Academy',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];
    
    // Add all documents to knowledge base
    for (const doc of [...coreDocuments, ...englishDocuments]) {
      await this.addDocument(doc);
    }
    
    console.log(`Knowledge base initialized with ${this.knowledgeBase.size} documents`);
  }
  
  /**
   * Add document to knowledge base
   */
  async addDocument(doc: Omit<KnowledgeDocument, 'embedding'>): Promise<void> {
    // Generate embedding if Ollama is available
    const embedding = await this.generateEmbedding(doc.content);
    
    const fullDoc: KnowledgeDocument = {
      ...doc,
      embedding
    };
    
    this.knowledgeBase.set(doc.id, fullDoc);
    if (embedding) {
      this.embeddings.set(doc.id, embedding);
    }
  }
  
  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[] | undefined> {
    const isAvailable = await ollamaService.isServiceAvailable();
    
    if (!isAvailable) {
      return undefined; // Fall back to keyword search
    }
    
    try {
      const embedding = await ollamaService.generateEmbedding(text);
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return undefined;
    }
  }
  
  /**
   * Search documents using semantic search or keyword matching
   */
  async searchDocuments(
    query: string,
    options: {
      language?: 'fa' | 'en';
      category?: string;
      limit?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const { language, category, limit = 5 } = options;
    
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);
    
    const results: SearchResult[] = [];
    
    for (const [docId, doc] of this.knowledgeBase) {
      // Filter by language if specified
      if (language && doc.language !== language) continue;
      
      // Filter by category if specified
      if (category && doc.category !== category) continue;
      
      let score = 0;
      
      if (queryEmbedding && doc.embedding) {
        // Semantic search using cosine similarity
        score = this.cosineSimilarity(queryEmbedding, doc.embedding);
      } else {
        // Fallback to keyword matching
        score = this.keywordMatch(query, doc);
      }
      
      if (score > 0.3) { // Threshold for relevance
        const snippet = this.extractSnippet(doc.content, query);
        const highlights = this.extractHighlights(doc.content, query);
        
        results.push({
          document: doc,
          score,
          snippet,
          highlights
        });
      }
    }
    
    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  /**
   * Keyword matching score
   */
  private keywordMatch(query: string, doc: KnowledgeDocument): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const docText = (doc.title + ' ' + doc.content + ' ' + doc.tags.join(' ')).toLowerCase();
    
    let matchCount = 0;
    for (const word of queryWords) {
      if (docText.includes(word)) {
        matchCount++;
      }
    }
    
    return matchCount / queryWords.length;
  }
  
  /**
   * Extract relevant snippet from document
   */
  private extractSnippet(content: string, query: string, maxLength: number = 200): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?؟]\s+/);
    
    // Find most relevant sentence
    let bestSentence = '';
    let bestScore = 0;
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      let score = 0;
      
      for (const word of queryWords) {
        if (lowerSentence.includes(word)) {
          score++;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence;
      }
    }
    
    if (bestSentence.length > maxLength) {
      return bestSentence.substring(0, maxLength) + '...';
    }
    
    return bestSentence || content.substring(0, maxLength) + '...';
  }
  
  /**
   * Extract highlighted portions
   */
  private extractHighlights(content: string, query: string): string[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const highlights: string[] = [];
    const sentences = content.split(/[.!?؟]\s+/);
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      for (const word of queryWords) {
        if (lowerSentence.includes(word)) {
          highlights.push(sentence.trim());
          break;
        }
      }
      
      if (highlights.length >= 3) break; // Limit highlights
    }
    
    return highlights;
  }
  
  /**
   * Generate RAG response using retrieved documents
   */
  async generateRAGResponse(
    query: string,
    context?: {
      userId?: number;
      conversationHistory?: string;
      preferredLanguage?: 'fa' | 'en';
    }
  ): Promise<RAGResponse> {
    // Detect query language
    const queryLanguage = persianNLPService.detectLanguage(query);
    const searchLanguage = context?.preferredLanguage || queryLanguage;
    
    // Search for relevant documents
    const searchResults = await this.searchDocuments(query, {
      language: searchLanguage === 'mixed' ? undefined : searchLanguage,
      limit: 3
    });
    
    if (searchResults.length === 0) {
      // No relevant documents found
      return {
        answer: searchLanguage === 'fa' 
          ? 'متأسفانه اطلاعاتی در این مورد یافت نشد. لطفاً با پشتیبانی تماس بگیرید.'
          : 'Sorry, no information found on this topic. Please contact support.',
        sources: [],
        confidence: 0.1,
        language: searchLanguage
      };
    }
    
    // Check if Ollama is available for generation
    const isAvailable = await ollamaService.isServiceAvailable();
    
    if (!isAvailable) {
      // Return best matching snippet as fallback
      return {
        answer: searchResults[0].snippet,
        sources: searchResults,
        confidence: searchResults[0].score,
        language: searchLanguage
      };
    }
    
    // Prepare context from search results
    const contextText = searchResults
      .map(r => `${r.document.title}:\n${r.snippet}`)
      .join('\n\n');
    
    // Generate answer using LLM
    const prompt = searchLanguage === 'fa'
      ? `بر اساس اطلاعات زیر، به سوال کاربر پاسخ دهید:
      
      اطلاعات مرجع:
      ${contextText}
      
      سوال کاربر: ${query}
      
      پاسخ مختصر و دقیق بدهید:`
      : `Based on the following information, answer the user's question:
      
      Reference Information:
      ${contextText}
      
      User Question: ${query}
      
      Provide a concise and accurate answer:`;
    
    try {
      const answer = await ollamaService.chat(prompt, 'assistant');
      
      return {
        answer,
        sources: searchResults,
        confidence: Math.max(...searchResults.map(r => r.score)),
        language: searchLanguage
      };
    } catch (error) {
      console.error('Error generating RAG response:', error);
      
      // Fallback to best snippet
      return {
        answer: searchResults[0].snippet,
        sources: searchResults,
        confidence: searchResults[0].score,
        language: searchLanguage
      };
    }
  }
  
  /**
   * Get document by ID
   */
  getDocument(id: string): KnowledgeDocument | undefined {
    return this.knowledgeBase.get(id);
  }
  
  /**
   * Get all documents in a category
   */
  getDocumentsByCategory(category: string): KnowledgeDocument[] {
    return Array.from(this.knowledgeBase.values())
      .filter(doc => doc.category === category);
  }
  
  /**
   * Update document
   */
  async updateDocument(
    id: string,
    updates: Partial<Omit<KnowledgeDocument, 'id' | 'embedding'>>
  ): Promise<void> {
    const existing = this.knowledgeBase.get(id);
    if (!existing) {
      throw new Error(`Document ${id} not found`);
    }
    
    const updated = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    };
    
    // Regenerate embedding if content changed
    if (updates.content && updates.content !== existing.content) {
      updated.embedding = await this.generateEmbedding(updates.content);
    }
    
    this.knowledgeBase.set(id, updated);
  }
  
  /**
   * Delete document
   */
  deleteDocument(id: string): boolean {
    this.embeddings.delete(id);
    return this.knowledgeBase.delete(id);
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();