import fetch from 'node-fetch';

export interface PiperConfig {
  host: string;
  port: number;
  defaultVoice: string;
}

export class PiperTTSService {
  private config: PiperConfig;

  constructor(config?: Partial<PiperConfig>) {
    this.config = {
      host: process.env.PIPER_HOST || 'localhost',
      port: parseInt(process.env.PIPER_PORT || '5005'),
      defaultVoice: process.env.PIPER_DEFAULT_VOICE || 'fa_IR-amir-medium',
      ...config,
    };
  }

  private get baseUrl(): string {
    return `http://${this.config.host}:${this.config.port}`;
  }

  async synthesize(params: {
    text: string;
    voice?: string;
    speed?: number;
  }): Promise<Buffer> {
    const url = `${this.baseUrl}/synthesize`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: params.text,
          voice: params.voice || this.config.defaultVoice,
          speed: params.speed || 1.0,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`TTS synthesis failed: ${error}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Piper TTS error:', error);
      throw error;
    }
  }

  async getVoices(): Promise<any[]> {
    const url = `${this.baseUrl}/voices`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to get voices');
      }
      
      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to get voices:', error);
      return [];
    }
  }

  async checkHealth(): Promise<boolean> {
    const url = `${this.baseUrl}/health`;
    
    try {
      const response = await fetch(url, { timeout: 5000 });
      return response.ok;
    } catch (error) {
      console.error('Piper health check failed:', error);
      return false;
    }
  }
}