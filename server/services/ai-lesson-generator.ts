/**
 * AI-Powered Lesson Generator for LinguaQuest
 * Supports both Ollama (Iranian self-hosting) and OpenAI (international)
 * Generates interactive 3D lessons with game steps, vocabulary, and exercises
 */

import { AIProviderManager } from '../ai-providers/ai-provider-manager';

export interface GeneratedLesson {
  title: string;
  titleFa?: string;
  titleAr?: string;
  description: string;
  descriptionFa?: string;
  descriptionAr?: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lessonType: 'vocabulary' | 'grammar' | 'conversation' | 'listening' | 'pronunciation';
  estimatedDurationMinutes: number;
  xpReward: number;
  cefrLevel: string;
  vocabularyWords: VocabularyWord[];
  grammarTopics: string[];
  exampleSentences: ExampleSentence[];
  gameSteps: GameStep[];
  sceneType: string;
  sceneData: any;
  threeDContent: ThreeDContent;
}

export interface VocabularyWord {
  word: string;
  translation: string;
  translationFa?: string;
  translationAr?: string;
  pronunciation: string;
  audioUrl?: string;
  imageUrl?: string;
  example: string;
  exampleFa?: string;
  exampleAr?: string;
  partOfSpeech: string;
}

export interface ExampleSentence {
  english: string;
  translation: string;
  translationFa?: string;
  translationAr?: string;
  audioUrl?: string;
}

export interface GameStep {
  id: string;
  type: string;
  title: string;
  titleFa?: string;
  titleAr?: string;
  instructions: string;
  instructionsFa?: string;
  instructionsAr?: string;
  content: any;
  requiredScore?: number;
  timeLimit?: number;
}

export interface ThreeDContent {
  environment: string;
  objects: any[];
  interactions: any[];
  animations: any[];
}

export interface LessonGenerationRequest {
  topic: string;
  targetLanguage: string;
  nativeLanguage: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lessonType: 'vocabulary' | 'grammar' | 'conversation' | 'listening' | 'pronunciation';
  duration: number;
  includeArabic?: boolean;
  includePersian?: boolean;
  customVocabulary?: string[];
  focusAreas?: string[];
}

export class AILessonGenerator {
  private aiProvider: AIProviderManager;
  private initialized: boolean = false;

  constructor() {
    this.aiProvider = new AIProviderManager();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.aiProvider.initialize();
    this.initialized = true;
    console.log('✅ AI Lesson Generator initialized with dual-provider support (Ollama/OpenAI)');
  }

  /**
   * Generate a complete interactive lesson for LinguaQuest
   */
  async generateLesson(request: LessonGenerationRequest): Promise<GeneratedLesson> {
    await this.initialize();

    console.log(`🎓 Generating ${request.lessonType} lesson: "${request.topic}" (${request.difficulty})`);

    try {
      // Generate lesson structure
      const lessonStructure = await this.generateLessonStructure(request);
      
      // Generate vocabulary
      const vocabulary = await this.generateVocabulary(request);
      
      // Generate game steps based on lesson type
      const gameSteps = await this.generateGameSteps(request, vocabulary);
      
      // Generate 3D scene configuration
      const threeDContent = this.generate3DContent(request.topic, request.lessonType);

      // Calculate XP reward based on difficulty and duration
      const xpReward = this.calculateXPReward(request.difficulty, request.duration);

      // Determine CEFR level
      const cefrLevel = this.mapDifficultyToCEFR(request.difficulty);

      const lesson: GeneratedLesson = {
        title: lessonStructure.title,
        titleFa: lessonStructure.titleFa,
        titleAr: lessonStructure.titleAr,
        description: lessonStructure.description,
        descriptionFa: lessonStructure.descriptionFa,
        descriptionAr: lessonStructure.descriptionAr,
        language: request.targetLanguage,
        difficulty: request.difficulty,
        lessonType: request.lessonType,
        estimatedDurationMinutes: request.duration,
        xpReward,
        cefrLevel,
        vocabularyWords: vocabulary,
        grammarTopics: lessonStructure.grammarTopics || [],
        exampleSentences: lessonStructure.exampleSentences || [],
        gameSteps,
        sceneType: this.getSceneType(request.topic),
        sceneData: threeDContent.environment,
        threeDContent
      };

      console.log(`✅ Generated lesson with ${vocabulary.length} vocabulary words and ${gameSteps.length} game steps`);
      return lesson;

    } catch (error) {
      console.error('❌ Error generating lesson:', error);
      throw new Error(`Lesson generation failed: ${error.message}`);
    }
  }

  /**
   * Generate lesson structure (title, description, objectives)
   */
  private async generateLessonStructure(request: LessonGenerationRequest): Promise<any> {
    const prompt = `Generate a language learning lesson structure for the following:
Topic: ${request.topic}
Target Language: ${request.targetLanguage}
Native Language: ${request.nativeLanguage}
Difficulty: ${request.difficulty}
Lesson Type: ${request.lessonType}
Duration: ${request.duration} minutes
${request.focusAreas ? `Focus Areas: ${request.focusAreas.join(', ')}` : ''}

Respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "title": "Lesson title in English",
  "titleFa": "Persian translation of title",
  "titleAr": "Arabic translation of title",
  "description": "2-3 sentence description in English",
  "descriptionFa": "Persian translation of description",
  "descriptionAr": "Arabic translation of description",
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "grammarTopics": ["topic1", "topic2"],
  "exampleSentences": [
    {"english": "Example sentence", "translation": "Translation", "translationFa": "Persian", "translationAr": "Arabic"}
  ]
}`;

    try {
      const response = await this.aiProvider.createChatCompletion({
        messages: [
          { role: 'system', content: 'You are a professional language education content creator. Always respond with valid JSON only, no markdown formatting.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 1500
      });

      const content = response.content.trim();
      // Clean up response - remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Error generating lesson structure:', error);
      // Return fallback structure
      return {
        title: `Learn ${request.topic}`,
        titleFa: `یادگیری ${request.topic}`,
        titleAr: `تعلم ${request.topic}`,
        description: `Practice ${request.lessonType} skills with interactive exercises about ${request.topic}.`,
        descriptionFa: `تمرین مهارت‌های ${request.lessonType} با تمرین‌های تعاملی درباره ${request.topic}.`,
        descriptionAr: `تدرب على مهارات ${request.lessonType} مع تمارين تفاعلية حول ${request.topic}.`,
        objectives: ['Learn key vocabulary', 'Practice pronunciation', 'Apply in context'],
        grammarTopics: [],
        exampleSentences: []
      };
    }
  }

  /**
   * Generate vocabulary words with translations
   */
  private async generateVocabulary(request: LessonGenerationRequest): Promise<VocabularyWord[]> {
    const wordCount = request.difficulty === 'beginner' ? 8 : request.difficulty === 'intermediate' ? 12 : 15;

    const prompt = `Generate ${wordCount} vocabulary words for learning ${request.targetLanguage} about "${request.topic}".
Difficulty level: ${request.difficulty}
${request.customVocabulary?.length ? `Include these words: ${request.customVocabulary.join(', ')}` : ''}

Respond with ONLY valid JSON array (no markdown, no code blocks):
[
  {
    "word": "English word",
    "translation": "Target language translation",
    "translationFa": "Persian translation",
    "translationAr": "Arabic translation",
    "pronunciation": "IPA or simplified pronunciation",
    "example": "Example sentence using the word",
    "exampleFa": "Persian example sentence",
    "exampleAr": "Arabic example sentence",
    "partOfSpeech": "noun/verb/adjective/etc"
  }
]`;

    try {
      const response = await this.aiProvider.createChatCompletion({
        messages: [
          { role: 'system', content: 'You are a multilingual vocabulary expert. Create educational vocabulary lists with accurate translations. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        maxTokens: 2000
      });

      const content = response.content.trim();
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const vocabulary = JSON.parse(cleanedContent);
      
      return vocabulary.map((word: any, index: number) => ({
        ...word,
        audioUrl: `/api/tts/word/${encodeURIComponent(word.word)}`,
        imageUrl: null // Will be generated separately if needed
      }));
    } catch (error) {
      console.error('Error generating vocabulary:', error);
      // Return basic fallback vocabulary
      return this.generateFallbackVocabulary(request.topic, wordCount);
    }
  }

  /**
   * Generate interactive game steps for the lesson
   */
  private async generateGameSteps(request: LessonGenerationRequest, vocabulary: VocabularyWord[]): Promise<GameStep[]> {
    const steps: GameStep[] = [];

    // Step 1: Introduction
    steps.push({
      id: 'intro',
      type: 'introduction',
      title: 'Introduction',
      titleFa: 'معرفی',
      titleAr: 'مقدمة',
      instructions: `Welcome! In this lesson, you'll learn about ${request.topic}.`,
      instructionsFa: `خوش آمدید! در این درس درباره ${request.topic} یاد خواهید گرفت.`,
      instructionsAr: `أهلاً! في هذا الدرس ستتعلم عن ${request.topic}.`,
      content: {
        welcomeMessage: `Let's explore ${request.topic} together!`,
        objectives: ['Learn new vocabulary', 'Practice pronunciation', 'Complete interactive exercises']
      }
    });

    // Step 2: Vocabulary Introduction (Flashcards)
    steps.push({
      id: 'vocab_intro',
      type: 'vocabulary_flashcards',
      title: 'Learn New Words',
      titleFa: 'کلمات جدید',
      titleAr: 'كلمات جديدة',
      instructions: 'Tap each card to hear the pronunciation and see the translation.',
      instructionsFa: 'روی هر کارت ضربه بزنید تا تلفظ را بشنوید و ترجمه را ببینید.',
      instructionsAr: 'انقر على كل بطاقة لسماع النطق ورؤية الترجمة.',
      content: {
        words: vocabulary.slice(0, 6).map(word => ({
          word: word.word,
          translation: word.translation,
          translationFa: word.translationFa,
          translationAr: word.translationAr,
          pronunciation: word.pronunciation,
          example: word.example,
          audioUrl: word.audioUrl
        }))
      },
      requiredScore: 80
    });

    // Step 3: Matching Game
    steps.push({
      id: 'matching',
      type: 'matching_game',
      title: 'Match the Words',
      titleFa: 'تطبیق کلمات',
      titleAr: 'طابق الكلمات',
      instructions: 'Match each word with its correct translation.',
      instructionsFa: 'هر کلمه را با ترجمه صحیح آن تطبیق دهید.',
      instructionsAr: 'طابق كل كلمة مع ترجمتها الصحيحة.',
      content: {
        pairs: vocabulary.slice(0, 6).map(word => ({
          word: word.word,
          match: word.translation
        }))
      },
      requiredScore: 70,
      timeLimit: 120
    });

    // Step 4: Listening Comprehension
    if (request.lessonType === 'listening' || request.lessonType === 'vocabulary') {
      steps.push({
        id: 'listening',
        type: 'listening_comprehension',
        title: 'Listen and Choose',
        titleFa: 'گوش دهید و انتخاب کنید',
        titleAr: 'استمع واختر',
        instructions: 'Listen to the audio and select the correct word.',
        instructionsFa: 'به صدا گوش دهید و کلمه صحیح را انتخاب کنید.',
        instructionsAr: 'استمع إلى الصوت واختر الكلمة الصحيحة.',
        content: {
          questions: vocabulary.slice(0, 4).map((word, index) => ({
            id: index + 1,
            audioUrl: word.audioUrl,
            correctAnswer: word.word,
            options: this.shuffleArray([word.word, ...vocabulary.filter(v => v.word !== word.word).slice(0, 3).map(v => v.word)])
          }))
        },
        requiredScore: 75
      });
    }

    // Step 5: Fill in the Blanks
    steps.push({
      id: 'fill_blank',
      type: 'fill_in_blank',
      title: 'Complete the Sentences',
      titleFa: 'جملات را کامل کنید',
      titleAr: 'أكمل الجمل',
      instructions: 'Fill in the blank with the correct word.',
      instructionsFa: 'جای خالی را با کلمه صحیح پر کنید.',
      instructionsAr: 'املأ الفراغ بالكلمة الصحيحة.',
      content: {
        sentences: vocabulary.slice(0, 4).map(word => ({
          sentence: word.example.replace(new RegExp(word.word, 'gi'), '______'),
          correctAnswer: word.word,
          options: this.shuffleArray([word.word, ...vocabulary.filter(v => v.word !== word.word).slice(0, 2).map(v => v.word)])
        }))
      },
      requiredScore: 75
    });

    // Step 6: Pronunciation Challenge (if applicable)
    if (request.lessonType === 'pronunciation' || request.lessonType === 'conversation') {
      steps.push({
        id: 'pronunciation',
        type: 'pronunciation_challenge',
        title: 'Pronunciation Practice',
        titleFa: 'تمرین تلفظ',
        titleAr: 'تدريب النطق',
        instructions: 'Record yourself saying each word and compare with the example.',
        instructionsFa: 'صدای خود را ضبط کنید و با مثال مقایسه کنید.',
        instructionsAr: 'سجل صوتك وقارنه بالمثال.',
        content: {
          words: vocabulary.slice(0, 4).map(word => ({
            word: word.word,
            pronunciation: word.pronunciation,
            audioUrl: word.audioUrl
          }))
        },
        requiredScore: 60
      });
    }

    // Step 7: Quick Quiz
    steps.push({
      id: 'quiz',
      type: 'quick_quiz',
      title: 'Quick Quiz',
      titleFa: 'آزمون سریع',
      titleAr: 'اختبار سريع',
      instructions: 'Test your knowledge with this quick quiz!',
      instructionsFa: 'دانش خود را با این آزمون سریع بسنجید!',
      instructionsAr: 'اختبر معرفتك بهذا الاختبار السريع!',
      content: {
        questions: vocabulary.slice(0, 5).map((word, index) => ({
          id: index + 1,
          question: `What does "${word.word}" mean?`,
          questionFa: `"${word.word}" به چه معناست؟`,
          questionAr: `ماذا تعني "${word.word}"؟`,
          correctAnswer: word.translation,
          options: this.shuffleArray([word.translation, ...vocabulary.filter(v => v.word !== word.word).slice(0, 3).map(v => v.translation)])
        }))
      },
      requiredScore: 80
    });

    return steps;
  }

  /**
   * Generate 3D content configuration for the lesson
   */
  private generate3DContent(topic: string, lessonType: string): ThreeDContent {
    const environments: Record<string, any> = {
      'restaurant': { type: 'indoor', preset: 'restaurant', lighting: 'warm' },
      'travel': { type: 'outdoor', preset: 'airport', lighting: 'daylight' },
      'shopping': { type: 'indoor', preset: 'store', lighting: 'bright' },
      'medical': { type: 'indoor', preset: 'clinic', lighting: 'clinical' },
      'business': { type: 'indoor', preset: 'office', lighting: 'professional' },
      'default': { type: 'neutral', preset: 'classroom', lighting: 'balanced' }
    };

    const topicLower = topic.toLowerCase();
    let selectedEnvironment = environments.default;
    
    for (const [key, value] of Object.entries(environments)) {
      if (topicLower.includes(key)) {
        selectedEnvironment = value;
        break;
      }
    }

    return {
      environment: selectedEnvironment,
      objects: this.get3DObjects(topic),
      interactions: [],
      animations: []
    };
  }

  private get3DObjects(topic: string): any[] {
    // Define 3D objects relevant to different topics
    const objectSets: Record<string, any[]> = {
      restaurant: [
        { type: 'table', position: [0, 0, 0] },
        { type: 'chair', position: [1, 0, 0] },
        { type: 'menu', position: [0, 1, 0] }
      ],
      travel: [
        { type: 'suitcase', position: [0, 0, 0] },
        { type: 'passport', position: [1, 0, 0] },
        { type: 'airplane', position: [0, 2, 5] }
      ],
      default: [
        { type: 'book', position: [0, 0, 0] },
        { type: 'pencil', position: [1, 0, 0] }
      ]
    };

    const topicLower = topic.toLowerCase();
    for (const [key, objects] of Object.entries(objectSets)) {
      if (topicLower.includes(key)) {
        return objects;
      }
    }
    return objectSets.default;
  }

  private getSceneType(topic: string): string {
    const topicLower = topic.toLowerCase();
    if (topicLower.includes('restaurant') || topicLower.includes('food')) return 'restaurant';
    if (topicLower.includes('travel') || topicLower.includes('airport')) return 'travel';
    if (topicLower.includes('shop') || topicLower.includes('store')) return 'shopping';
    if (topicLower.includes('doctor') || topicLower.includes('medical')) return 'medical';
    if (topicLower.includes('office') || topicLower.includes('business')) return 'office';
    return 'classroom';
  }

  private calculateXPReward(difficulty: string, duration: number): number {
    const baseXP = difficulty === 'beginner' ? 50 : difficulty === 'intermediate' ? 100 : 150;
    const durationBonus = Math.floor(duration / 10) * 25;
    return baseXP + durationBonus;
  }

  private mapDifficultyToCEFR(difficulty: string): string {
    const mapping: Record<string, string> = {
      'beginner': 'A1-A2',
      'intermediate': 'B1-B2',
      'advanced': 'C1-C2'
    };
    return mapping[difficulty] || 'B1';
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateFallbackVocabulary(topic: string, count: number): VocabularyWord[] {
    // Basic fallback vocabulary
    const fallbackWords: VocabularyWord[] = [
      {
        word: 'hello',
        translation: 'سلام',
        translationFa: 'سلام',
        translationAr: 'مرحبا',
        pronunciation: '/həˈloʊ/',
        example: 'Hello, how are you today?',
        exampleFa: 'سلام، حالت چطوره؟',
        exampleAr: 'مرحبا، كيف حالك اليوم؟',
        partOfSpeech: 'interjection'
      },
      {
        word: 'goodbye',
        translation: 'خداحافظ',
        translationFa: 'خداحافظ',
        translationAr: 'وداعا',
        pronunciation: '/ɡʊdˈbaɪ/',
        example: 'Goodbye, see you tomorrow!',
        exampleFa: 'خداحافظ، فردا می‌بینمت!',
        exampleAr: 'وداعا، أراك غدا!',
        partOfSpeech: 'interjection'
      },
      {
        word: 'thank you',
        translation: 'متشکرم',
        translationFa: 'متشکرم',
        translationAr: 'شكرا',
        pronunciation: '/θæŋk juː/',
        example: 'Thank you for your help.',
        exampleFa: 'ممنون از کمکت.',
        exampleAr: 'شكرا على مساعدتك.',
        partOfSpeech: 'phrase'
      },
      {
        word: 'please',
        translation: 'لطفاً',
        translationFa: 'لطفاً',
        translationAr: 'من فضلك',
        pronunciation: '/pliːz/',
        example: 'Please help me.',
        exampleFa: 'لطفاً کمکم کن.',
        exampleAr: 'من فضلك ساعدني.',
        partOfSpeech: 'adverb'
      },
      {
        word: 'yes',
        translation: 'بله',
        translationFa: 'بله',
        translationAr: 'نعم',
        pronunciation: '/jes/',
        example: 'Yes, I understand.',
        exampleFa: 'بله، متوجه شدم.',
        exampleAr: 'نعم، أفهم.',
        partOfSpeech: 'adverb'
      },
      {
        word: 'no',
        translation: 'نه',
        translationFa: 'نه',
        translationAr: 'لا',
        pronunciation: '/noʊ/',
        example: 'No, thank you.',
        exampleFa: 'نه، ممنون.',
        exampleAr: 'لا، شكرا.',
        partOfSpeech: 'adverb'
      }
    ];

    return fallbackWords.slice(0, count).map(word => ({
      ...word,
      audioUrl: `/api/tts/word/${encodeURIComponent(word.word)}`
    }));
  }

  /**
   * Batch generate multiple lessons for a course
   */
  async generateLessonBatch(requests: LessonGenerationRequest[]): Promise<GeneratedLesson[]> {
    await this.initialize();
    
    console.log(`🎓 Batch generating ${requests.length} lessons...`);
    
    const lessons: GeneratedLesson[] = [];
    for (const request of requests) {
      try {
        const lesson = await this.generateLesson(request);
        lessons.push(lesson);
      } catch (error) {
        console.error(`Failed to generate lesson for topic "${request.topic}":`, error);
      }
    }
    
    console.log(`✅ Successfully generated ${lessons.length}/${requests.length} lessons`);
    return lessons;
  }

  /**
   * Get AI provider status
   */
  async getProviderStatus(): Promise<{ primary: string | undefined; fallback: string | undefined }> {
    await this.initialize();
    return this.aiProvider.getActiveProviders();
  }
}

// Export singleton instance
export const aiLessonGenerator = new AILessonGenerator();
