import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import gtts from 'node-gtts';
import OpenAI from 'openai';
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
  private openai?: OpenAI;

  constructor() {
    // Create output directory for audio files
    this.outputDir = path.join(__dirname, '../uploads/tts');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Initialize OpenAI TTS as premium fallback
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log('✓ OpenAI TTS fallback initialized');
    }
  }

  /**
   * Convert text to speech using Google TTS (works offline after initial download)
   */
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      const { text, language, speed = 1.0 } = request;
      
      // Validate language
      const langCode = LANGUAGE_CODES[language.toLowerCase()] || language.toLowerCase();
      if (!SUPPORTED_LANGUAGES.includes(langCode)) {
        return {
          success: false,
          error: `Language '${language}' is not supported. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`
        };
      }

      // Validate text
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'Text cannot be empty'
        };
      }

      // Generate filename
      const timestamp = Date.now();
      const filename = `tts_${langCode}_${timestamp}.mp3`;
      const filePath = path.join(this.outputDir, filename);

      // Create TTS instance
      const speech = gtts(langCode);
      
      // Generate speech and save to file
      await new Promise<void>((resolve, reject) => {
        speech.save(filePath, text, (err) => {
          if (err) {
            reject(new Error(`TTS generation failed: ${err.message}`));
          } else {
            resolve();
          }
        });
      });

      // Verify file was created
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'Failed to generate audio file'
        };
      }

      // Get file stats for duration estimation
      const stats = fs.statSync(filePath);
      const estimatedDuration = Math.ceil(text.length / 10); // Rough estimation

      return {
        success: true,
        audioFile: filename,
        audioUrl: `/uploads/tts/${filename}`,
        duration: estimatedDuration
      };

    } catch (error) {
      console.error('TTS Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown TTS error'
      };
    }
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

      // Generate prompt following master guidelines
      const masterPrompt = TTSMasterPromptService.generateListeningPracticePrompt(request);
      
      // Use OpenAI for high-quality conversational audio if available
      if (this.openai) {
        const language = this.getLanguageForExam(request.examConfig.examType);
        return await this.generateWithOpenAI({
          text: masterPrompt,
          language,
          examConfig: request.examConfig,
          audioType: 'listening'
        });
      }

      // Fallback to basic TTS with appropriate language
      const language = this.getLanguageForExam(request.examConfig.examType);
      const speed = this.getSpeedForLevel(request.examConfig.learnerLevel);
      
      return this.generateSpeech({
        text: `Listening Practice: ${request.topic}. ${this.createBasicListeningContent(request)}`,
        language,
        speed
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
        const vocabularyPrompt = TTSMasterPromptService.generateVocabularyPrompt({
          ...request,
          words: [word]
        });

        let result: TTSResponse;
        
        if (this.openai) {
          const language = this.getLanguageForExam(request.examConfig.examType);
          result = await this.generateWithOpenAI({
            text: vocabularyPrompt,
            language,
            examConfig: request.examConfig,
            audioType: 'vocabulary'
          });
        } else {
          // Create structured vocabulary content
          const vocabContent = this.createVocabularyContent(word, request.examConfig);
          const language = this.getLanguageForExam(request.examConfig.examType);
          
          result = await this.generateSpeech({
            text: vocabContent,
            language,
            speed: 0.8 // Slightly slower for vocabulary
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
   * Generate high-quality audio using OpenAI TTS with master prompt
   */
  private async generateWithOpenAI(request: EnhancedTTSRequest): Promise<TTSResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not available');
    }

    try {
      // Choose voice based on exam type and accent requirements
      const voice = this.selectOpenAIVoice(request.examConfig);
      
      const response = await this.openai.audio.speech.create({
        model: 'tts-1-hd',
        voice: voice,
        input: request.text,
        speed: request.speed || 1.0
      });

      // Save to file
      const timestamp = Date.now();
      const audioType = request.audioType || 'speech';
      const filename = `${audioType}_${request.examConfig?.examType || 'general'}_${timestamp}.mp3`;
      const filePath = path.join(this.outputDir, filename);

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      return {
        success: true,
        audioFile: filename,
        audioUrl: `/uploads/tts/${filename}`,
        duration: Math.ceil(request.text.length / 10)
      };

    } catch (error) {
      console.error('OpenAI TTS error:', error);
      throw error;
    }
  }

  /**
   * Select appropriate OpenAI voice based on exam type
   */
  private selectOpenAIVoice(examConfig?: TTSExamType): 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' {
    if (!examConfig) return 'alloy';

    switch (examConfig.examType) {
      case 'TOEFL':
        return 'alloy'; // American accent
      case 'IELTS':
        return 'echo'; // British-like accent
      case 'PTE':
        return 'nova'; // Clear, neutral accent
      case 'Business English':
        return 'onyx'; // Professional tone
      default:
        return 'alloy';
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