// AI Provider Manager - Handles provider selection and fallback logic
import { BaseAIProvider, ChatCompletionRequest, ChatCompletionResponse } from './base-provider';
import { OllamaProvider } from './ollama-provider';
import { OpenAIProvider } from './openai-provider';

export class AIProviderManager {
  private providers: BaseAIProvider[] = [];
  private primaryProvider?: BaseAIProvider;
  private fallbackProvider?: BaseAIProvider;

  constructor() {
    // Primary provider: Ollama (for Iranian self-hosting)
    this.primaryProvider = new OllamaProvider();
    this.providers.push(this.primaryProvider);

    // Optional fallback: OpenAI (disabled by default)
    this.fallbackProvider = new OpenAIProvider();
    this.providers.push(this.fallbackProvider);
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing AI Provider Manager...');
    
    // Initialize primary provider first
    try {
      await this.primaryProvider?.initialize();
      console.log(`✅ Primary provider (${this.primaryProvider?.name}) ready`);
    } catch (error) {
      console.error(`❌ Primary provider (${this.primaryProvider?.name}) failed:`, error);
    }

    // Initialize fallback provider (only if enabled)
    if (this.fallbackProvider?.isEnabled) {
      try {
        await this.fallbackProvider.initialize();
        console.log(`✅ Fallback provider (${this.fallbackProvider?.name}) ready`);
      } catch (error) {
        console.warn(`⚠️  Fallback provider (${this.fallbackProvider?.name}) unavailable:`, error);
      }
    }

    // Health status report
    await this.getHealthStatus();
  }

  async getHealthStatus(): Promise<{ primary: boolean; fallback: boolean; hasHealthyProvider: boolean }> {
    const primaryHealthy = this.primaryProvider ? await this.primaryProvider.isHealthy() : false;
    const fallbackHealthy = this.fallbackProvider?.isEnabled ? await this.fallbackProvider.isHealthy() : false;

    const status = {
      primary: primaryHealthy,
      fallback: fallbackHealthy,
      hasHealthyProvider: primaryHealthy || fallbackHealthy
    };

    console.log('🏥 AI Provider Health Status:', {
      [`${this.primaryProvider?.name} (Primary)`]: primaryHealthy ? '✅ Healthy' : '❌ Unhealthy',
      [`${this.fallbackProvider?.name} (Fallback)`]: this.fallbackProvider?.isEnabled 
        ? (fallbackHealthy ? '✅ Healthy' : '❌ Unhealthy')
        : '🔒 Disabled'
    });

    return status;
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Try primary provider first (Ollama)
    if (this.primaryProvider?.isEnabled) {
      try {
        console.log(`🎯 Using primary provider: ${this.primaryProvider.name}`);
        return await this.primaryProvider.createChatCompletion(request);
      } catch (error) {
        console.error(`❌ Primary provider (${this.primaryProvider.name}) failed:`, error);
      }
    }

    // Fall back to secondary provider (OpenAI) only if enabled
    if (this.fallbackProvider?.isEnabled) {
      try {
        console.log(`🔄 Falling back to: ${this.fallbackProvider.name}`);
        return await this.fallbackProvider.createChatCompletion(request);
      } catch (error) {
        console.error(`❌ Fallback provider (${this.fallbackProvider.name}) failed:`, error);
      }
    }

    // All providers failed
    throw new Error('All AI providers are unavailable. Please check Ollama server or enable OpenAI fallback.');
  }

  getActiveProviders(): { primary: string | undefined; fallback: string | undefined } {
    return {
      primary: this.primaryProvider?.isEnabled ? this.primaryProvider.name : undefined,
      fallback: this.fallbackProvider?.isEnabled ? this.fallbackProvider.name : undefined
    };
  }
}