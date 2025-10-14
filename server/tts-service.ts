import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import crypto from 'crypto';
import { 
  TTSMasterPromptService, 
  ListeningPracticeRequest, 
  VocabularyFileRequest,
  TTSExamType 
} from './services/tts-master-prompt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Language mapping for Meta Lingua platform
const LANGUAGE_CODES = {
  'persian': 'fa',
  'farsi': 'fa', 
  'fa': 'fa',
  'english': 'en',
  'en': 'en',
  'arabic': 'ar',
  'ar': 'ar'
};

// Supported languages for offline TTS
const SUPPORTED_LANGUAGES = ['fa', 'en', 'ar'];

export interface TTSRequest {
  text: string;
  language: string;
  speed?: number;
  voice?: string;
}

export interface EnhancedTTSRequest extends TTSRequest {
  examConfig?: TTSExamType;
  audioType?: 'listening' | 'vocabulary';
  topic?: string;
  words?: string[];
}

export interface TTSResponse {
  success: boolean;
  audioFile?: string;
  audioUrl?: string;
  duration?: number;
  error?: string;
}

export class MetaLinguaTTSService {
  private outputDir: string;

  constructor() {
    // Create output directory for audio files
    this.outputDir = path.join(__dirname, '../uploads/tts');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // TTS uses Edge TTS exclusively for Iranian self-hosting
    console.log('✓ TTS Service initialized with Edge TTS (self-hosted)');
  }

  /**
   * Convert text to speech using Edge TTS (Iranian self-hosting compatible)
   * This method now uses Edge TTS exclusively - no Google services
   */
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    // All TTS now uses Edge TTS for Iranian self-hosting (Google services blocked)
    return this.generateSpeechWithEdgeTTS(request);
  }

  /**
   * Generate a deterministic hash for caching audio files
   */
  private generateCacheKey(text: string, language: string, speed: number, voice: string): string {
    const content = `${text.toLowerCase().trim()}_${language}_${speed}_${voice}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Check if cached audio exists and return it
   */
  private checkCachedAudio(cacheKey: string): TTSResponse | null {
    const filename = `edge_tts_${cacheKey}.mp3`;
    const filePath = path.join(this.outputDir, filename);
    
    if (fs.existsSync(filePath)) {
      // Get file stats for duration estimation
      const stats = fs.statSync(filePath);
      const duration = Math.ceil(stats.size / 4000); // Rough estimate: 4KB per second
      
      console.log(`✓ TTS Cache Hit: ${cacheKey} (${filename})`);
      
      return {
        success: true,
        audioFile: filename,
        audioUrl: `/uploads/tts/${filename}`,
        duration
      };
    }
    
    return null;
  }

  /**
   * Get default voice for a language
   */
  private getDefaultVoice(language: string): string {
    const voiceMap: Record<string, string> = {
      'en': 'en-US-AriaNeural',       // American English - natural, clear
      'english': 'en-US-AriaNeural',
      'fa': 'fa-IR-DilaraNeural',     // Persian female voice
      'farsi': 'fa-IR-DilaraNeural',
      'persian': 'fa-IR-DilaraNeural',
      'ar': 'ar-SA-HamedNeural',      // Arabic
      'arabic': 'ar-SA-HamedNeural'
    };
    return voiceMap[language.toLowerCase()] || 'en-US-AriaNeural';
  }

  /**
   * Generate speech using Microsoft Edge TTS (Professional Quality)
   */
  async generateSpeechWithEdgeTTS(request: TTSRequest): Promise<TTSResponse> {
    try {
      const { text, language, speed = 1.0, voice: requestedVoice } = request;
      
      // Validate text
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'Text cannot be empty'
        };
      }

      // Use requested voice if provided, otherwise use language-based defaults
      let voice = requestedVoice || this.getDefaultVoice(language);

      // Generate cache key
      const cacheKey = this.generateCacheKey(text, language, speed, voice);
      
      // Check if cached audio exists
      const cachedResult = this.checkCachedAudio(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Generate filename with cache key
      const filename = `edge_tts_${cacheKey}.mp3`;
      const filePath = path.join(this.outputDir, filename);

      console.log(`⊙ TTS Cache Miss: Generating audio for "${text.substring(0, 30)}..." (${cacheKey})`);

      // Generate TTS using Python edge-tts command
      const success = await this.generateWithEdgeTTSCommand(text, filePath, voice, speed);
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to generate audio with Microsoft Edge TTS'
        };
      }

      // Verify file was created
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'Audio file was not created'
        };
      }

      // Get file stats for duration estimation
      const stats = fs.statSync(filePath);
      const estimatedDuration = Math.ceil(text.length / 12); // More accurate for Edge TTS

      return {
        success: true,
        audioFile: filename,
        audioUrl: `/uploads/tts/${filename}`,
        duration: estimatedDuration
      };

    } catch (error) {
      console.error('Edge TTS Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Edge TTS error'
      };
    }
  }

  /**
   * Generate audio file using edge-tts Python command with retry logic
   */
  private async generateWithEdgeTTSCommand(text: string, outputPath: string, voice: string, speed: number = 1.0): Promise<boolean> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second base delay
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const success = await this.attemptEdgeTTSGeneration(text, outputPath, voice, speed, attempt);
      
      if (success) {
        return true;
      }
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`🔄 Edge TTS retry ${attempt + 1}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log(`❌ Edge TTS failed after ${maxRetries} attempts`);
    return false;
  }

  /**
   * Single attempt at Edge TTS generation
   */
  private async attemptEdgeTTSGeneration(text: string, outputPath: string, voice: string, speed: number, attempt: number): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Calculate rate parameter for edge-tts (speed adjustment)
        const ratePercent = Math.round((speed - 1.0) * 50); // Convert to percentage
        const rateParam = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

        // Use edge-tts Python module with rate adjustment (more reliable than hardcoded path)
        const process = spawn('python3', [
          '-m', 'edge_tts',
          '--voice', voice,
          '--rate', rateParam,
          '--text', text,
          '--write-media', outputPath
        ]);

        // Set timeout for edge-tts process (prevent hanging)
        const timeout = setTimeout(() => {
          console.log(`❌ Edge TTS timeout for ${outputPath}`);
          process.kill('SIGTERM');
          resolve(false);
        }, 30000); // 30 second timeout

        process.on('close', (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            console.log(`✅ Edge TTS generated: ${outputPath} (attempt ${attempt + 1})`);
            resolve(true);
          } else {
            console.log(`❌ Edge TTS failed: ${outputPath} (exit code: ${code}, attempt ${attempt + 1})`);
            resolve(false);
          }
        });

        process.on('error', (error) => {
          clearTimeout(timeout);
          console.error(`❌ Edge TTS error for ${outputPath} (attempt ${attempt + 1}):`, error.message);
          resolve(false);
        });

      } catch (error) {
        console.error(`❌ Edge TTS exception for ${outputPath} (attempt ${attempt + 1}):`, error);
        resolve(false);
      }
    });
  }

  /**
   * Generate pronunciation practice audio for language learning
   */
  async generatePronunciationAudio(text: string, language: string, level: 'slow' | 'normal' | 'fast' = 'normal'): Promise<TTSResponse> {
    const speedMap = {
      'slow': 0.7,
      'normal': 1.0,
      'fast': 1.3
    };

    return this.generateSpeech({
      text,
      language,
      speed: speedMap[level]
    });
  }

  /**
   * Generate listening practice audio following Master TTS Prompt guidelines
   */
  async generateListeningPractice(request: ListeningPracticeRequest): Promise<TTSResponse> {
    try {
      // Validate request
      if (!TTSMasterPromptService.validateRequest(request)) {
        return {
          success: false,
          error: 'Invalid listening practice request'
        };
      }

      // Use OpenAI for high-quality conversational audio if available
      if (this.openai) {
        const language = this.getLanguageForExam(request.examConfig.examType);
        return await this.generateWithOpenAI({
          text: request.topic, // Pass just the topic, not the full prompt
          language,
          examConfig: request.examConfig,
          audioType: 'listening'
        });
      }

      // Fallback to basic TTS with natural content
      const language = this.getLanguageForExam(request.examConfig.examType);
      const naturalContent = this.createNaturalListeningContent(request.topic, request.examConfig);
      const naturalizedContent = this.addNaturalSpeechPatterns(naturalContent, request.examConfig);
      
      return this.generateSpeech({
        text: naturalizedContent,
        language,
        speed: this.calculateNaturalSpeed(request.examConfig)
      });

    } catch (error) {
      console.error('Listening practice generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate listening practice'
      };
    }
  }

  /**
   * Generate vocabulary practice audio following Master TTS Prompt guidelines
   */
  async generateVocabularyPractice(request: VocabularyFileRequest): Promise<TTSResponse[]> {
    try {
      // Validate request
      if (!TTSMasterPromptService.validateRequest(request)) {
        return [{
          success: false,
          error: 'Invalid vocabulary practice request'
        }];
      }

      const results: TTSResponse[] = [];
      
      // Generate audio for each vocabulary word
      for (const word of request.words) {
        let result: TTSResponse;
        
        if (this.openai) {
          const language = this.getLanguageForExam(request.examConfig.examType);
          result = await this.generateWithOpenAI({
            text: word, // Pass just the word, not the full prompt
            language,
            examConfig: request.examConfig,
            audioType: 'vocabulary'
          });
        } else {
          // Create natural vocabulary content
          const naturalContent = this.createNaturalVocabularyContent(word, request.examConfig);
          const naturalizedContent = this.addNaturalSpeechPatterns(naturalContent, request.examConfig);
          const language = this.getLanguageForExam(request.examConfig.examType);
          
          result = await this.generateSpeech({
            text: naturalizedContent,
            language,
            speed: this.calculateNaturalSpeed(request.examConfig)
          });
        }
        
        results.push(result);
      }

      return results;

    } catch (error) {
      console.error('Vocabulary practice generation error:', error);
      return [{
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate vocabulary practice'
      }];
    }
  }

  /**
   * REMOVED: OpenAI TTS not available for Iranian self-hosting
   * Use Edge TTS or local TTS alternatives instead
   */
  private async generateWithOpenAI(request: EnhancedTTSRequest): Promise<TTSResponse> {
    throw new Error('OpenAI TTS not available - use Edge TTS for Iranian self-hosting');
  }

  /**
   * REMOVED: OpenAI voices not available for Iranian self-hosting
   */
  private selectOpenAIVoice(examConfig?: TTSExamType): 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' {
    return 'alloy'; // Stub - not used
  }

  /**
   * Extract actual content from master prompt instructions
   */
  private extractContentFromPrompt(text: string, request: EnhancedTTSRequest): string {
    // If text contains master prompt instructions, extract just the content
    if (text.includes('SPECIFIC TASK:') || text.includes('Master Prompt')) {
      const lines = text.split('\n');
      let contentStart = -1;
      let actualContent = '';

      // Look for content indicators
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('Topic:') || line.startsWith('Words to process:')) {
          contentStart = i;
          break;
        }
      }

      // Generate natural content based on the extracted topic/words
      if (contentStart >= 0) {
        const topic = lines.find(l => l.startsWith('Topic:'))?.replace('Topic:', '').trim();
        if (topic) {
          return this.generateNaturalContent(topic, request);
        }
      }

      // Fallback: try to extract any meaningful content
      const contentSections = text.split(/SPECIFIC TASK:|Topic:|Words to process:/);
      if (contentSections.length > 1) {
        const rawContent = contentSections[1].split(/\n/)[0].trim();
        if (rawContent) {
          return this.generateNaturalContent(rawContent, request);
        }
      }
    }

    // If it's already clean content, use it directly
    return text;
  }

  /**
   * Generate natural conversational content based on topic and exam type
   */
  private generateNaturalContent(topic: string, request: EnhancedTTSRequest): string {
    const { examConfig } = request;
    if (!examConfig) return topic;

    const level = examConfig.learnerLevel;
    const examType = examConfig.examType;

    // Generate natural conversation based on exam type and level
    switch (request.audioType) {
      case 'listening':
        return this.createNaturalListeningContent(topic, examConfig);
      case 'vocabulary':
        return this.createNaturalVocabularyContent(topic, examConfig);
      default:
        return this.createNaturalGeneralContent(topic, examConfig);
    }
  }

  /**
   * Create natural listening content without robotic instructions
   */
  private createNaturalListeningContent(topic: string, examConfig: TTSExamType): string {
    const isAdvanced = ['B2', 'C1', 'C2'].includes(examConfig.learnerLevel);
    
    // Generate actual IELTS-style conversations based on topic
    if (topic.toLowerCase().includes('ielts') || topic.toLowerCase().includes('booking') || 
        topic.toLowerCase().includes('art class') || topic.toLowerCase().includes('conversation')) {
      return this.createIeltsSection1Dialogue(examConfig, isAdvanced);
    }
    
    // Create conversational, natural content for other topics
    const templates = {
      'shopping': isAdvanced 
        ? "Hey Sarah, I went to that new grocery store downtown yesterday. The produce section was amazing - they had these organic vegetables that looked so fresh. The only downside was how crowded it got around lunch time. I had to wait in a long queue at the cashier, but at least they were offering a twenty percent discount on everything."
        : "I went shopping yesterday. The store was very crowded. There were many people in the queue. The cashier was friendly. I got a good discount on vegetables.",
      
      'work': isAdvanced
        ? "So I had this important meeting with my colleague yesterday about the project deadline. We realized we need to finish the presentation by Friday, which means working late this week. The good news is that if we do well, there might be a promotion opportunity. My schedule is pretty packed, but the extra salary would definitely be worth it."
        : "I had a meeting with my colleague. We talked about the deadline. We need to finish our presentation. Our schedule is very busy. We hope to get a promotion.",

      'travel': isAdvanced  
        ? "Our journey to Paris was incredible, but getting to our destination took longer than expected. The airport was chaotic - people everywhere with their luggage, long lines for passport control. Our departure was delayed by two hours, but the arrival made it all worthwhile. The city was absolutely beautiful."
        : "We went to Paris. The journey was long. There were many people at the airport. Everyone had big luggage. Our departure was late. But the arrival was good."
    };

    // Find the most appropriate template
    const lowerTopic = topic.toLowerCase();
    for (const [key, content] of Object.entries(templates)) {
      if (lowerTopic.includes(key)) {
        return content;
      }
    }

    // Default natural content
    return isAdvanced 
      ? `Let me tell you something interesting about ${topic}. It's fascinating how different people approach this topic. Some find it challenging, while others think it's quite straightforward. What's your experience with ${topic}?`
      : `Today we will talk about ${topic}. This topic is important. Many people like to learn about ${topic}. It is interesting and useful.`;
  }

  /**
   * Create authentic IELTS Section 1 dialogue with actual conversation
   */
  private createIeltsSection1Dialogue(examConfig: TTSExamType, isAdvanced: boolean): string {
    // Create actual dialogue with realistic conversation flow
    const dialogue = `Good morning, City Sports Centre, this is Emma speaking. How can I help you today?

Hi Emma, I'm calling about your swimming lessons. I saw your advertisement and I'd like to book some classes.

Certainly! Are you looking for adult beginner classes or do you have some swimming experience?

I'm a complete beginner actually. I'm twenty-eight years old and I've never learned to swim properly.

Perfect! We have adult beginner classes on Tuesday evenings and Saturday mornings. Which would work better for you?

Saturday mornings would be ideal. I work during the week. What time do they start?

The Saturday class starts at ten o'clock and finishes at eleven thirty. That's an hour and a half session.

That sounds perfect. How much does it cost?

It's eighteen pounds per lesson, or you can book a course of six lessons for ninety pounds. That saves you eighteen pounds.

I'd like the six-lesson course please. When can I start?

The next course begins this Saturday, September twenty-third. Shall I book you in?

Yes please. What details do you need?

I'll need your full name first.

It's Michael Brown. That's M-I-C-H-A-E-L, and Brown is B-R-O-W-N.

Thank you Michael. And your address please?

It's fifteen Park Avenue, that's P-A-R-K Avenue, Newtown, postcode N-T-four, two-B-H.

Great. And can I have your phone number?

Yes, it's oh-one-nine-four-seven, three-six-eight, nine-seven-five.

Perfect. Do you have an email address?

It's m-dot-brown-at-email-dot-co-dot-uk. That's the letter M, dot, brown, at email dot co dot uk.

Excellent. Is there anything else you'd like to know about the classes?

Yes, do I need to bring anything special?

Just bring swimming shorts, a towel, and goggles if you have them. We provide all the training equipment.

What about parking? Is there a car park?

Yes, we have free parking for students. Just show your booking confirmation at reception.

Brilliant. So I'm confirmed for this Saturday at ten AM?

That's correct, Michael. Please arrive at nine forty-five for registration. We'll see you this Saturday, September twenty-third.

Wonderful. Thank you so much for your help, Emma.

You're very welcome, Michael. Have a lovely day and see you Saturday!

Thank you, goodbye!`;

    return dialogue;
  }

  /**
   * Create natural vocabulary content
   */
  private createNaturalVocabularyContent(word: string, examConfig: TTSExamType): string {
    const isAdvanced = ['B2', 'C1', 'C2'].includes(examConfig.learnerLevel);
    const needsTranslation = ['A1', 'A2', 'B1'].includes(examConfig.learnerLevel) && 
                           examConfig.learnerNativeLanguage === 'Farsi';

    let content = `${word}... The word is "${word}".`;
    
    if (isAdvanced) {
      content += ` This is commonly used in both formal and informal contexts. For example: "The ${word} was evident in their discussion." You'll often hear this in academic and professional settings.`;
    } else {
      content += ` For example: "I can see the ${word} clearly." This word is very useful in everyday conversation.`;
      
      if (needsTranslation) {
        content += ` در فارسی، این مفهوم قابل درک است.`; // "In Persian, this concept is understandable."
      }
    }

    return content;
  }

  /**
   * Create natural general content
   */
  private createNaturalGeneralContent(topic: string, examConfig: TTSExamType): string {
    const isAdvanced = ['B2', 'C1', 'C2'].includes(examConfig.learnerLevel);
    
    return isAdvanced
      ? `Speaking of ${topic}, this is definitely something worth discussing. It's interesting how perspectives vary from person to person. What are your thoughts on this?`
      : `Let's talk about ${topic}. This is a good topic. Many people have different ideas about ${topic}.`;
  }

  /**
   * Add natural speech patterns to reduce robotic sound
   */
  private addNaturalSpeechPatterns(content: string, examConfig?: TTSExamType): string {
    // Remove unnecessary pauses after common words
    let natural = content
      .replace(/\bof\s*,\s*/g, 'of ') // Remove pauses after "of"
      .replace(/\band\s*,\s*/g, 'and ') // Remove pauses after "and"  
      .replace(/\bbut\s*,\s*/g, 'but ') // Remove pauses after "but"
      .replace(/\bthe\s*,\s*/g, 'the ') // Remove pauses after "the"
      .replace(/\bin\s*,\s*/g, 'in ') // Remove pauses after "in"
      .replace(/\bto\s*,\s*/g, 'to ') // Remove pauses after "to"
      .replace(/\bfor\s*,\s*/g, 'for ') // Remove pauses after "for"

    // Add natural pauses in appropriate places
    natural = natural
      .replace(/\.\s+/g, '... ') // Longer pause after sentences
      .replace(/,\s+/g, ', ') // Short pause after commas
      .replace(/:\s+/g, ': ') // Appropriate pause after colons
      .replace(/;\s+/g, '; ') // Medium pause after semicolons

    // Add conversational elements for advanced levels
    if (examConfig && ['B2', 'C1', 'C2'].includes(examConfig.learnerLevel)) {
      // Occasionally add natural fillers (but not too many)
      if (Math.random() < 0.3) {
        natural = natural.replace(/\bWell,\s*/g, 'Well, uh, ');
      }
    }

    return natural;
  }

  /**
   * Calculate natural speaking speed based on exam config
   */
  private calculateNaturalSpeed(examConfig?: TTSExamType): number {
    if (!examConfig) return 1.0;

    const baseSpeed = this.getSpeedForLevel(examConfig.learnerLevel);
    
    // Adjust for exam type - business English slightly faster, academic slightly slower
    switch (examConfig.examType) {
      case 'Business English':
        return Math.min(baseSpeed + 0.1, 1.2); // Slightly faster but not too fast
      case 'TOEFL':
      case 'IELTS':
        return Math.max(baseSpeed - 0.05, 0.6); // Slightly slower for clarity
      default:
        return baseSpeed;
    }
  }

  /**
   * Get language code based on exam type
   */
  private getLanguageForExam(examType: string): string {
    // All exam types use English, but we maintain this for flexibility
    return 'en';
  }

  /**
   * Get speech speed based on learner level
   */
  private getSpeedForLevel(level: string): number {
    switch (level) {
      case 'A1':
      case 'A2':
        return 0.7;
      case 'B1':
        return 0.8;
      case 'B2':
        return 0.9;
      case 'C1':
      case 'C2':
        return 1.0;
      default:
        return 0.8;
    }
  }

  /**
   * Create basic listening content structure
   */
  private createBasicListeningContent(request: ListeningPracticeRequest): string {
    const { topic, examConfig } = request;
    
    // Basic template following master prompt principles
    return `Welcome to today's listening practice on ${topic}. Let me tell you about an interesting situation. ` +
           `This story will help you practice vocabulary and listening skills for the ${examConfig.examType} exam. ` +
           `Listen carefully and pay attention to key vocabulary words.`;
  }

  /**
   * Create structured vocabulary content
   */
  private createVocabularyContent(word: string, examConfig: TTSExamType): string {
    const needsTranslation = ['A1', 'A2', 'B1'].includes(examConfig.learnerLevel);
    
    let content = `${word}. `;
    content += `The word is ${word}. `;
    
    // Add example sentence
    content += `For example: I use ${word} in my daily conversation. `;
    
    // Add translation if needed
    if (needsTranslation && examConfig.learnerNativeLanguage === 'Farsi') {
      content += `In Persian, this concept is similar to the word you might know. `;
    }
    
    return content;
  }

  /**
   * Clean up old TTS files (called periodically)
   */
  async cleanupOldFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = fs.readdirSync(this.outputDir);
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
      const now = Date.now();

      for (const file of files) {
        if (file.startsWith('tts_') && file.endsWith('.mp3')) {
          const filePath = path.join(this.outputDir, file);
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old TTS file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('TTS cleanup error:', error);
    }
  }

  /**
   * Get available languages
   */
  getSupportedLanguages(): string[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Get language name in Persian for UI
   */
  getLanguageName(langCode: string): string {
    const names = {
      'fa': 'فارسی',
      'en': 'انگلیسی', 
      'ar': 'عربی'
    };
    return names[langCode] || langCode;
  }
}

// Export singleton instance
export const ttsService = new MetaLinguaTTSService();

// Clean up old files every hour
setInterval(() => {
  ttsService.cleanupOldFiles(24);
}, 60 * 60 * 1000);