// AI Provider Manager - Ollama-only for Iranian self-hosting
// OpenAI is blocked in Iran, so we use Ollama exclusively
import { BaseAIProvider, ChatCompletionRequest, ChatCompletionResponse } from './base-provider';
import { OllamaProvider } from './ollama-provider';

export class AIProviderManager {
  private providers: BaseAIProvider[] = [];
  private primaryProvider: BaseAIProvider;

  constructor() {
    // Primary and ONLY provider: Ollama (for Iranian self-hosting)
    this.primaryProvider = new OllamaProvider();
    this.providers.push(this.primaryProvider);

    // OpenAI removed: Not available in Iran
    // All AI features use Ollama exclusively
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing AI Provider Manager (Ollama-only mode)...');
    
    // Initialize Ollama provider (gracefully handle failure during build)
    try {
      await this.primaryProvider.initialize();
      console.log(`✅ Ollama provider (${this.primaryProvider.name}) ready`);
    } catch (error) {
      console.error(`❌ Ollama provider (${this.primaryProvider.name}) failed:`, error);
      console.warn('⚠️  Ollama unavailable during initialization (expected during build)');
      console.warn('⚠️  App will attempt to connect to Ollama when running on production server');
      // DO NOT throw error - allow app to start even if Ollama is unreachable
      // This is expected during Replit build; Ollama will be available on self-hosted server
    }

    // Health status report
    await this.getHealthStatus();
  }

  async getHealthStatus(): Promise<{ primary: boolean; fallback: boolean; hasHealthyProvider: boolean }> {
    const primaryHealthy = await this.primaryProvider.isHealthy();

    const status = {
      primary: primaryHealthy,
      fallback: false, // No fallback in Ollama-only mode
      hasHealthyProvider: primaryHealthy
    };

    console.log('🏥 AI Provider Health Status:', {
      [`${this.primaryProvider.name} (Ollama-Only)`]: primaryHealthy ? '✅ Healthy' : '❌ Unhealthy',
      'OpenAI Fallback': '🚫 Disabled (not available in Iran)'
    });

    return status;
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Use Ollama exclusively (no fallback)
    if (!this.primaryProvider.isEnabled) {
      throw new Error('Ollama provider is disabled. AI service unavailable.');
    }

    try {
      console.log(`🎯 Using Ollama provider: ${this.primaryProvider.name}`);
      return await this.primaryProvider.createChatCompletion(request);
    } catch (error) {
      console.error(`❌ Ollama provider (${this.primaryProvider.name}) failed:`, error);
      throw new Error(`AI service unavailable: ${error.message}`);
    }
  }

  getActiveProviders(): { primary: string | undefined; fallback: string | undefined } {
    return {
      primary: this.primaryProvider.isEnabled ? this.primaryProvider.name : undefined,
      fallback: undefined // No fallback in Ollama-only mode
    };
  }
}
