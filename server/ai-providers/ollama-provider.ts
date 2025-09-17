// Ollama Provider - Primary AI Provider for Self-Hosting
import { BaseAIProvider, ChatCompletionRequest, ChatCompletionResponse } from './base-provider';

export class OllamaProvider extends BaseAIProvider {
  name = 'Ollama';
  isEnabled = true;
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    super();
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
  }

  async initialize(): Promise<void> {
    try {
      // Test connection to Ollama server
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama server not accessible: ${response.status}`);
      }
      console.log('🎯 Ollama provider initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Ollama provider:', error);
      this.isEnabled = false;
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const model = request.model || this.defaultModel;
      
      // Prepare messages with system prompt if provided
      let messages = [...request.messages];
      
      // If a custom system prompt is provided, prepend it or replace existing system message
      if (request.systemPrompt) {
        // Remove any existing system messages
        messages = messages.filter(msg => msg.role !== 'system');
        // Add the custom system prompt at the beginning
        messages.unshift({
          role: 'system',
          content: request.systemPrompt
        });
      }
      
      // Convert messages to Ollama format
      const ollamaRequest = {
        model,
        messages,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 500,
        }
      };

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ollamaRequest),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.message?.content || data.response || 'No response from Ollama',
        tokensUsed: {
          prompt: data.prompt_eval_count || 0,
          completion: data.eval_count || 0,
          total: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        },
        model: data.model || model,
        finishReason: data.done ? 'stop' : 'unknown'
      };
    } catch (error) {
      console.error('Ollama chat completion error:', error);
      throw new Error(`Ollama provider failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}