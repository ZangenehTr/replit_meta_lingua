// Base AI Provider Interface
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
  systemPrompt?: string; // Custom system prompt that overrides default behavior
}

export interface ChatCompletionResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  finishReason: string;
}

export abstract class BaseAIProvider {
  abstract name: string;
  abstract isEnabled: boolean;
  
  abstract initialize(): Promise<void>;
  abstract isHealthy(): Promise<boolean>;
  abstract createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}