/**
 * Whisper Service - Persian-optimized speech recognition
 * Integrates with faster-whisper for efficient ASR processing
 * Supports Persian (Farsi) language with fallback mechanisms
 */

import { EventEmitter } from 'events';
import FormData from 'form-data';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

export interface WhisperConfig {
  baseUrl: string;
  model: string;
  language?: string;
  task?: 'transcribe' | 'translate';
}

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  confidence?: number;
}

export class WhisperService extends EventEmitter {
  private config: WhisperConfig;
  private isAvailable: boolean = false;
  private openai?: OpenAI;
  private whisperProvider: 'faster-whisper' | 'openai';

  constructor(config?: Partial<WhisperConfig>) {
    super();
    this.config = {
      baseUrl: config?.baseUrl || process.env.WHISPER_URL || 'http://localhost:8000',
      model: config?.model || 'Systran/faster-distil-whisper-large-v3',
      language: config?.language || 'fa', // Persian/Farsi
      task: config?.task || 'transcribe'
    };
    
    // Determine provider from environment variable
    this.whisperProvider = (process.env.WHISPER_PROVIDER as 'faster-whisper' | 'openai') || 'faster-whisper';
    
    // Initialize OpenAI if configured as provider or fallback
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      if (this.whisperProvider === 'openai') {
        console.log('✓ OpenAI Whisper configured as primary provider');
      } else {
        console.log('✓ OpenAI Whisper available as fallback provider');
      }
    }
    
    this.checkAvailability();
  }

  /**
   * Check if Whisper service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/health`, {
        timeout: 3000
      });
      
      if (response.status === 200) {
        console.log(`✓ Whisper service available at ${this.config.baseUrl}`);
        this.isAvailable = true;
        this.emit('connected');
        return true;
      }
    } catch (error) {
      // Try alternative endpoint
      try {
        const altResponse = await axios.get(`${this.config.baseUrl}/`, {
          timeout: 3000
        });
        
        if (altResponse.status === 200) {
          console.log(`✓ Whisper service available at ${this.config.baseUrl}`);
          this.isAvailable = true;
          this.emit('connected');
          return true;
        }
      } catch (altError) {
        console.log(`✗ Whisper service not available at ${this.config.baseUrl}`);
        this.isAvailable = false;
        this.emit('connectionFailed', error);
      }
    }
    return false;
  }

  /**
   * Transcribe audio file to text
   */
  async transcribeFile(filePath: string, options?: {
    language?: string;
    task?: 'transcribe' | 'translate';
  }): Promise<TranscriptionResult> {
    if (!this.isAvailable) {
      await this.checkAvailability();
      if (!this.isAvailable) {
        // Fallback response when service unavailable
        return this.generateFallbackTranscription(filePath);
      }
    }

    try {
      const formData = new FormData();
      const audioStream = fs.createReadStream(filePath);
      formData.append('file', audioStream, path.basename(filePath));
      formData.append('model', this.config.model);
      formData.append('language', options?.language || this.config.language || 'fa');
      formData.append('task', options?.task || this.config.task || 'transcribe');
      formData.append('response_format', 'verbose_json');

      const response = await axios.post(
        `${this.config.baseUrl}/v1/audio/transcriptions`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 120000, // 2 minute timeout for transcription
        }
      );

      return this.parseTranscriptionResponse(response.data);
    } catch (error) {
      console.error('Whisper transcription error:', error);
      return this.generateFallbackTranscription(filePath);
    }
  }

  /**
   * Transcribe audio buffer to text with OpenAI fallback
   */
  async transcribeBuffer(buffer: Buffer, fileName: string = 'audio.webm', options?: {
    language?: string;
    task?: 'transcribe' | 'translate';
  }): Promise<TranscriptionResult> {
    // If OpenAI is the primary provider, use it first
    if (this.whisperProvider === 'openai' && this.openai) {
      try {
        console.log('Using OpenAI Whisper (primary provider)');
        return await this.transcribeWithOpenAI(buffer, fileName, options);
      } catch (error) {
        console.error('OpenAI Whisper (primary) failed, trying faster-whisper fallback:', error);
      }
    }

    // Try self-hosted Whisper (faster-whisper)
    if (this.isAvailable || this.whisperProvider === 'faster-whisper') {
      try {
        const formData = new FormData();
        formData.append('file', buffer, fileName);
        formData.append('model', this.config.model);
        formData.append('language', options?.language || this.config.language || 'fa');
        formData.append('task', options?.task || this.config.task || 'transcribe');
        formData.append('response_format', 'verbose_json');

        const response = await axios.post(
          `${this.config.baseUrl}/v1/audio/transcriptions`,
          formData,
          {
            headers: formData.getHeaders(),
            timeout: 120000,
          }
        );

        return this.parseTranscriptionResponse(response.data);
      } catch (error) {
        console.log('Faster-Whisper failed, trying OpenAI fallback:', error.message);
      }
    }

    // Try OpenAI as fallback (if not already primary)
    if (this.openai && this.whisperProvider !== 'openai') {
      try {
        console.log('Using OpenAI Whisper as fallback');
        return await this.transcribeWithOpenAI(buffer, fileName, options);
      } catch (error) {
        console.error('OpenAI Whisper fallback error:', error);
      }
    }

    // Final fallback - throw error instead of returning mock data
    throw new Error('No Whisper transcription service available. Please configure either faster-whisper or OpenAI Whisper in admin settings.');
  }

  /**
   * Transcribe using OpenAI Whisper API
   */
  private async transcribeWithOpenAI(buffer: Buffer, fileName: string, options?: {
    language?: string;
    task?: 'transcribe' | 'translate';
  }): Promise<TranscriptionResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    // Create a temporary file for OpenAI API (it requires a file, not buffer)
    const tempFile = path.join('/tmp', `whisper_${Date.now()}_${fileName}`);
    fs.writeFileSync(tempFile, buffer);

    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFile) as any,
        model: 'whisper-1',
        language: options?.language || (this.config.language === 'fa' ? 'fa' : 'en'),
        response_format: 'verbose_json'
      });

      // Clean up temp file
      fs.unlinkSync(tempFile);

      return {
        text: transcription.text,
        language: options?.language || this.config.language || 'fa',
        duration: (transcription as any).duration || 0,
        segments: (transcription as any).segments || [],
        confidence: 0.95 // OpenAI generally has high confidence
      };
    } catch (error) {
      // Clean up temp file in case of error
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      throw error;
    }
  }

  /**
   * Transcribe audio from URL
   */
  async transcribeUrl(audioUrl: string, options?: {
    language?: string;
    task?: 'transcribe' | 'translate';
  }): Promise<TranscriptionResult> {
    try {
      // Download audio file
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      const buffer = Buffer.from(response.data);
      const fileName = audioUrl.split('/').pop() || 'audio.webm';
      
      return this.transcribeBuffer(buffer, fileName, options);
    } catch (error) {
      console.error('Error downloading audio from URL:', error);
      return this.generateFallbackTranscription();
    }
  }

  /**
   * Parse transcription response
   */
  private parseTranscriptionResponse(data: any): TranscriptionResult {
    if (typeof data === 'string') {
      // Simple text response
      return {
        text: data,
        language: this.config.language || 'fa',
        duration: 0,
        confidence: 0.8
      };
    }

    // Verbose JSON response
    return {
      text: data.text || '',
      language: data.language || this.config.language || 'fa',
      duration: data.duration || 0,
      segments: data.segments || [],
      confidence: this.calculateConfidence(data)
    };
  }

  /**
   * Calculate confidence score from response data
   */
  private calculateConfidence(data: any): number {
    if (data.confidence) return data.confidence;
    
    // Calculate average confidence from segments if available
    if (data.segments && data.segments.length > 0) {
      const totalConfidence = data.segments.reduce((sum: number, seg: any) => {
        return sum + (seg.confidence || seg.avg_logprob || 0.8);
      }, 0);
      return totalConfidence / data.segments.length;
    }
    
    return 0.8; // Default confidence
  }

  /**
   * Generate fallback transcription when service unavailable
   */
  private generateFallbackTranscription(filePath?: string): TranscriptionResult {
    console.log('Using fallback transcription (Whisper service unavailable)');
    
    // For MST English tests, return a neutral English fallback indicating service error
    const fallbackText = "[Transcription service temporarily unavailable - audio was recorded but could not be processed]";
    
    return {
      text: fallbackText,
      language: 'en',
      duration: 30,
      segments: [{
        start: 0,
        end: 30,
        text: fallbackText
      }],
      confidence: 0.1 // Very low confidence to indicate this is not real transcription
    };
  }

  /**
   * Detect language from audio
   */
  async detectLanguage(audioPath: string): Promise<string> {
    try {
      const result = await this.transcribeFile(audioPath, { 
        language: undefined // Let Whisper detect
      });
      return result.language;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'fa'; // Default to Persian
    }
  }

  /**
   * Test Whisper connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const isAvailable = await this.checkAvailability();
      
      if (!isAvailable) {
        return {
          success: false,
          message: `Whisper service not available at ${this.config.baseUrl}`,
          details: {
            service: 'Whisper ASR',
            url: this.config.baseUrl,
            model: this.config.model,
            language: this.config.language,
            status: 'offline'
          }
        };
      }

      // Test with a simple audio sample if available
      return {
        success: true,
        message: 'Whisper service connected and ready',
        details: {
          service: 'Whisper ASR',
          url: this.config.baseUrl,
          model: this.config.model,
          language: this.config.language,
          status: 'online'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Whisper service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          service: 'Whisper ASR',
          url: this.config.baseUrl,
          model: this.config.model,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'fa', // Persian/Farsi
      'en', // English  
      'ar', // Arabic
      'de', // German
      'fr', // French
      'es', // Spanish
      'tr', // Turkish
      'ur', // Urdu
      'hi', // Hindi
      'zh', // Chinese
    ];
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language: string): boolean {
    return this.getSupportedLanguages().includes(language);
  }
}

// Singleton instance
export const whisperService = new WhisperService();