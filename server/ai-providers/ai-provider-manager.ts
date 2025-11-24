// AI Provider Manager - Configurable AI Provider (Ollama or OpenAI)
// Supports both Ollama (for Iranian self-hosting) and OpenAI (for international deployments)
import { BaseAIProvider, ChatCompletionRequest, ChatCompletionResponse } from './base-provider';
import { OllamaProvider } from './ollama-provider';
import { OpenAIProvider } from './openai-provider';

export class AIProviderManager {
  private providers: BaseAIProvider[] = [];
  private primaryProvider: BaseAIProvider;
  private fallbackProvider?: BaseAIProvider;

  constructor() {
    // Read AI_PROVIDER environment variable ('ollama' | 'openai')
    // Default to 'ollama' for backward compatibility (Iranian self-hosting)
    const aiProvider = (process.env.AI_PROVIDER || 'ollama').toLowerCase();
    const fallbackProviderType = process.env.AI_FALLBACK_PROVIDER?.toLowerCase();

    // Initialize primary provider
    if (aiProvider === 'openai') {
      // Use OpenAI as primary provider (for international deployments)
      this.primaryProvider = new OpenAIProvider();
      console.log('🌍 AI Primary Provider: OpenAI (international mode)');
    } else {
      // Use Ollama as primary provider (for Iranian self-hosting)
      this.primaryProvider = new OllamaProvider();
      console.log('🇮🇷 AI Primary Provider: Ollama (Iranian self-hosting mode)');
    }

    this.providers.push(this.primaryProvider);

    // Initialize optional fallback provider
    if (fallbackProviderType && fallbackProviderType !== aiProvider) {
      if (fallbackProviderType === 'openai') {
        this.fallbackProvider = new OpenAIProvider();
        console.log('🔄 AI Fallback Provider: OpenAI enabled');
      } else if (fallbackProviderType === 'ollama') {
        this.fallbackProvider = new OllamaProvider();
        console.log('🔄 AI Fallback Provider: Ollama enabled');
      }

      if (this.fallbackProvider) {
        this.providers.push(this.fallbackProvider);
      }
    }
  }

  async initialize(): Promise<void> {
    console.log(`🚀 Initializing AI Provider Manager with primary: ${this.primaryProvider.name}`);
    if (this.fallbackProvider) {
      console.log(`   Fallback provider: ${this.fallbackProvider.name}`);
    }
    
    // Initialize primary provider (gracefully handle failure during build)
    try {
      await this.primaryProvider.initialize();
      console.log(`✅ Primary AI provider (${this.primaryProvider.name}) ready`);
    } catch (error) {
      console.error(`❌ Primary AI provider (${this.primaryProvider.name}) failed:`, error);
      
      // Graceful degradation messaging based on provider type
      if (this.primaryProvider.name === 'Ollama') {
        console.warn('⚠️  Ollama unavailable during initialization (expected in Replit dev environment)');
        console.warn('⚠️  App will connect to Ollama when running on production server');
      } else {
        console.warn(`⚠️  ${this.primaryProvider.name} unavailable - check API key and connectivity`);
      }
      
      // DO NOT throw error - allow app to start even if AI provider is unreachable
      // This is expected during development; provider will be available in production
    }

    // Initialize fallback provider if configured
    if (this.fallbackProvider) {
      try {
        await this.fallbackProvider.initialize();
        console.log(`✅ Fallback AI provider (${this.fallbackProvider.name}) ready`);
      } catch (error) {
        console.error(`❌ Fallback AI provider (${this.fallbackProvider.name}) failed:`, error);
        console.warn(`⚠️  Fallback provider unavailable - primary provider will be used exclusively`);
      }
    }

    // Health status report
    await this.getHealthStatus();
  }

  async getHealthStatus(): Promise<{ primary: boolean; fallback: boolean; hasHealthyProvider: boolean }> {
    const primaryHealthy = await this.primaryProvider.isHealthy();
    const fallbackHealthy = this.fallbackProvider ? await this.fallbackProvider.isHealthy() : false;

    const status = {
      primary: primaryHealthy,
      fallback: fallbackHealthy,
      hasHealthyProvider: primaryHealthy || fallbackHealthy
    };

    const healthReport: Record<string, string> = {
      [`${this.primaryProvider.name} (Primary)`]: primaryHealthy ? '✅ Healthy' : '❌ Unhealthy'
    };

    if (this.fallbackProvider) {
      healthReport[`${this.fallbackProvider.name} (Fallback)`] = fallbackHealthy ? '✅ Healthy' : '❌ Unhealthy';
    }

    console.log('🏥 AI Provider Health Status:', healthReport);

    return status;
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Try primary provider first
    if (this.primaryProvider.isEnabled) {
      try {
        console.log(`🎯 Using primary AI provider: ${this.primaryProvider.name}`);
        return await this.primaryProvider.createChatCompletion(request);
      } catch (error) {
        console.error(`❌ Primary AI provider (${this.primaryProvider.name}) failed:`, error);
        
        // Try fallback if configured
        if (this.fallbackProvider?.isEnabled) {
          console.log(`🔄 Attempting fallback to ${this.fallbackProvider.name}...`);
          try {
            const response = await this.fallbackProvider.createChatCompletion(request);
            console.log(`✅ Fallback successful using ${this.fallbackProvider.name}`);
            return response;
          } catch (fallbackError) {
            console.error(`❌ Fallback provider (${this.fallbackProvider.name}) also failed:`, fallbackError);
            throw new Error(`AI service unavailable: both primary and fallback providers failed`);
          }
        }
        
        // No fallback available
        throw new Error(`AI service unavailable: ${error.message}`);
      }
    }

    // Primary disabled, try fallback if available
    if (this.fallbackProvider?.isEnabled) {
      console.log(`⚠️  Primary provider disabled, using fallback: ${this.fallbackProvider.name}`);
      try {
        return await this.fallbackProvider.createChatCompletion(request);
      } catch (error) {
        console.error(`❌ Fallback provider (${this.fallbackProvider.name}) failed:`, error);
        throw new Error(`AI service unavailable: ${error.message}`);
      }
    }

    // No providers available
    throw new Error('AI service unavailable: no providers enabled');
  }

  getActiveProviders(): { primary: string | undefined; fallback: string | undefined } {
    return {
      primary: this.primaryProvider.isEnabled ? this.primaryProvider.name : undefined,
      fallback: this.fallbackProvider?.isEnabled ? this.fallbackProvider.name : undefined
    };
  }
}
