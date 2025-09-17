// OpenAI Provider - Optional Fallback Provider (Disabled by Default)
import OpenAI from 'openai';
import { BaseAIProvider, ChatCompletionRequest, ChatCompletionResponse } from './base-provider';

export class OpenAIProvider extends BaseAIProvider {
  name = 'OpenAI';
  isEnabled: boolean;
  private client?: OpenAI;

  constructor() {
    super();
    // DISABLED BY DEFAULT for Iranian self-hosting requirements
    this.isEnabled = process.env.ENABLE_OPENAI_FALLBACK === 'true';
    
    if (this.isEnabled && process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  async initialize(): Promise<void> {
    if (!this.isEnabled) {
      console.log('🔒 OpenAI provider disabled (fallback mode off)');
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OpenAI API key not found - disabling OpenAI fallback');
      this.isEnabled = false;
      return;
    }

    try {
      // Test OpenAI API connection
      if (this.client) {
        await this.client.models.list();
        console.log('🔄 OpenAI fallback provider initialized (use only when Ollama fails)');
      }
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI provider:', error);
      this.isEnabled = false;
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.isEnabled || !this.client) {
      throw new Error('OpenAI provider is disabled or not initialized');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: request.model || 'gpt-4o-mini',
        messages: request.messages,
        max_tokens: request.maxTokens || 500,
        temperature: request.temperature || 0.7,
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No valid response from OpenAI');
      }

      return {
        content: choice.message.content,
        tokensUsed: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0
        },
        model: completion.model,
        finishReason: choice.finish_reason || 'unknown'
      };
    } catch (error) {
      console.error('OpenAI chat completion error:', error);
      throw new Error(`OpenAI provider failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}