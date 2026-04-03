import { BaseAIProvider, ChatCompletionRequest, ChatCompletionResponse } from './base-provider';
import { OllamaProvider } from './ollama-provider';
import { OpenAIProvider } from './openai-provider';
import { ArvanCloudProvider } from './arvancloud-provider';

export class AIProviderManager {
  private providers: BaseAIProvider[] = [];
  private primaryProvider: BaseAIProvider;
  private fallbackProviders: BaseAIProvider[] = [];

  constructor() {
    const arvanCloud = new ArvanCloudProvider();
    const openAI = new OpenAIProvider();
    const ollama = new OllamaProvider();

    if (arvanCloud.isEnabled) {
      this.primaryProvider = arvanCloud;
      this.fallbackProviders = [openAI, ollama];
      console.log('☁️  AI Primary Provider: ArvanCloud (priority chain: ArvanCloud → OpenAI → Ollama)');
    } else if (openAI.isEnabled) {
      this.primaryProvider = openAI;
      this.fallbackProviders = [ollama];
      console.log('🌍 AI Primary Provider: OpenAI (priority chain: OpenAI → Ollama)');
    } else {
      this.primaryProvider = ollama;
      this.fallbackProviders = [];
      console.log('🇮🇷 AI Primary Provider: Ollama (Iranian self-hosting mode)');
    }

    this.providers = [this.primaryProvider, ...this.fallbackProviders];
  }

  async initialize(): Promise<void> {
    console.log(`🚀 Initializing AI Provider Manager with primary: ${this.primaryProvider.name}`);

    try {
      await this.primaryProvider.initialize();
      console.log(`✅ Primary AI provider (${this.primaryProvider.name}) ready`);
    } catch (error) {
      console.error(`❌ Primary AI provider (${this.primaryProvider.name}) failed:`, error);

      if (this.primaryProvider.name === 'Ollama') {
        console.warn('⚠️  Ollama unavailable during initialization (expected in Replit dev environment)');
        console.warn('⚠️  App will connect to Ollama when running on production server');
      } else {
        console.warn(`⚠️  ${this.primaryProvider.name} unavailable - check API key and connectivity`);
      }
    }

    for (const provider of this.fallbackProviders) {
      try {
        await provider.initialize();
        console.log(`✅ Fallback AI provider (${provider.name}) ready`);
      } catch (error) {
        console.error(`❌ Fallback AI provider (${provider.name}) failed:`, error);
        console.warn(`⚠️  Fallback provider ${provider.name} unavailable`);
      }
    }

    await this.getHealthStatus();
  }

  async getHealthStatus(): Promise<{ primary: boolean; fallback: boolean; hasHealthyProvider: boolean }> {
    const primaryHealthy = await this.primaryProvider.isHealthy();
    const fallbackHealthy = this.fallbackProviders.length > 0
      ? (await Promise.all(this.fallbackProviders.map(p => p.isHealthy()))).some(Boolean)
      : false;

    const status = {
      primary: primaryHealthy,
      fallback: fallbackHealthy,
      hasHealthyProvider: primaryHealthy || fallbackHealthy
    };

    const healthReport: Record<string, string> = {
      [`${this.primaryProvider.name} (Primary)`]: primaryHealthy ? '✅ Healthy' : '❌ Unhealthy'
    };

    for (const provider of this.fallbackProviders) {
      const healthy = await provider.isHealthy();
      healthReport[`${provider.name} (Fallback)`] = healthy ? '✅ Healthy' : '❌ Unhealthy';
    }

    console.log('🏥 AI Provider Health Status:', healthReport);

    return status;
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const allProviders = [this.primaryProvider, ...this.fallbackProviders];

    for (const provider of allProviders) {
      if (!provider.isEnabled) continue;

      try {
        console.log(`🎯 Using AI provider: ${provider.name}`);
        return await provider.createChatCompletion(request);
      } catch (error) {
        console.error(`❌ AI provider (${provider.name}) failed:`, error);
        const nextProvider = allProviders[allProviders.indexOf(provider) + 1];
        if (nextProvider) {
          console.log(`🔄 Attempting fallback to ${nextProvider.name}...`);
        }
      }
    }

    throw new Error('AI service unavailable: all providers failed');
  }

  getPrimaryProvider(): BaseAIProvider {
    return this.primaryProvider;
  }

  getActiveProviders(): { primary: string | undefined; fallback: string | undefined } {
    return {
      primary: this.primaryProvider.isEnabled ? this.primaryProvider.name : undefined,
      fallback: this.fallbackProviders.find(p => p.isEnabled)?.name
    };
  }

  isUsingOpenAICompatibleProvider(): boolean {
    return this.primaryProvider.name === 'ArvanCloud' || this.primaryProvider.name === 'OpenAI';
  }

  getOpenAICompatibleProvider(): (ArvanCloudProvider | OpenAIProvider) | null {
    for (const provider of [this.primaryProvider, ...this.fallbackProviders]) {
      if ((provider.name === 'ArvanCloud' || provider.name === 'OpenAI') && provider.isEnabled) {
        return provider as ArvanCloudProvider | OpenAIProvider;
      }
    }
    return null;
  }

  getAllOpenAICompatibleProviders(): (ArvanCloudProvider | OpenAIProvider)[] {
    return [this.primaryProvider, ...this.fallbackProviders].filter(
      p => (p.name === 'ArvanCloud' || p.name === 'OpenAI') && p.isEnabled
    ) as (ArvanCloudProvider | OpenAIProvider)[];
  }
}
