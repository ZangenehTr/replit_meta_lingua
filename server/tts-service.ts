import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import gtts from 'node-gtts';
import OpenAI from 'openai';

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