import fetch from 'node-fetch';
import FormData from 'form-data';
import { Readable } from 'stream';

export interface WhisperConfig {
  host: string;
  port: number;
  model: string;
}

export class WhisperASRService {
  private config: WhisperConfig;

  constructor(config?: Partial<WhisperConfig>) {
    this.config = {
      host: process.env.WHISPER_HOST || 'localhost',
      port: parseInt(process.env.WHISPER_PORT || '9000'),
      model: process.env.WHISPER_MODEL || 'base',
      ...config,
    };
  }

  private get baseUrl(): string {
    return `http://${this.config.host}:${this.config.port}`;
  }

  async transcribe(params: {
    audio: Buffer | Readable;
    language?: string;
    task?: 'transcribe' | 'translate';
  }): Promise<{
    text: string;
    segments?: any[];
    language?: string;
  }> {
    const url = `${this.baseUrl}/asr`;
    
    try {
      const formData = new FormData();
      
      // Add audio file
      if (Buffer.isBuffer(params.audio)) {
        formData.append('audio_file', params.audio, {
          filename: 'audio.wav',
          contentType: 'audio/wav',
        });
      } else {
        formData.append('audio_file', params.audio, {
          filename: 'audio.wav',
          contentType: 'audio/wav',
        });
      }

      // Add parameters
      if (params.language) {
        formData.append('language', params.language);
      }
      if (params.task) {
        formData.append('task', params.task);
      }
      formData.append('output', 'json');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ASR transcription failed: ${error}`);
      }

      const result = await response.json() as any;
      return {
        text: result.text || '',
        segments: result.segments || [],
        language: result.language,
      };
    } catch (error) {
      console.error('Whisper ASR error:', error);
      throw error;
    }
  }

  async detectLanguage(audio: Buffer | Readable): Promise<string> {
    const result = await this.transcribe({
      audio,
      task: 'transcribe',
    });
    return result.language || 'unknown';
  }

  async translate(params: {
    audio: Buffer | Readable;
    sourceLanguage?: string;
  }): Promise<string> {
    const result = await this.transcribe({
      audio: params.audio,
      language: params.sourceLanguage,
      task: 'translate',
    });
    return result.text;
  }

  async checkHealth(): Promise<boolean> {
    const url = `${this.baseUrl}/health`;
    
    try {
      const response = await fetch(url, { timeout: 5000 });
      return response.ok;
    } catch (error) {
      console.error('Whisper health check failed:', error);
      return false;
    }
  }
}