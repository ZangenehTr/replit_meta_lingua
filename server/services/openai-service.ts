import OpenAI from 'openai';

interface TranslationResult {
  translatedText: string;
  sourceLanguage?: string;
  confidence?: number;
}

interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
  corrections: Array<{
    type: string;
    position: number;
    original: string;
    suggestion: string;
  }>;
}

interface WordSuggestion {
  word: string;
  translation: string;
  usage: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface PronunciationGuide {
  word: string;
  phonetic: string;
  syllables: string[];
  tips: string[];
  audioUrl?: string;
}

export class OpenAIService {
  private openai: OpenAI | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.isConfigured = true;
      console.log('OpenAI service initialized successfully');
    } else {
      console.log('OpenAI API key not found, service not initialized');
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConfigured || !this.openai) {
      return false;
    }

    try {
      // Test with a simple completion
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Use the latest model as per blueprint
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });
      return !!response;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<TranslationResult> {
    if (!this.isConfigured || !this.openai) {
      throw new Error('OpenAI service not configured');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text to ${targetLanguage}. 
                     Respond in JSON format: { "translatedText": "...", "sourceLanguage": "...", "confidence": 0.95 }`
          },
          {
            role: 'user',
            content: text
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        translatedText: result.translatedText || text,
        sourceLanguage: result.sourceLanguage || 'auto',
        confidence: result.confidence || 0.9,
      };
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  async generateWordSuggestions(
    context: string,
    language: string,
    level: string = 'intermediate'
  ): Promise<WordSuggestion[]> {
    if (!this.isConfigured || !this.openai) {
      throw new Error('OpenAI service not configured');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a language learning assistant. Suggest 5 useful words or phrases in ${language} for a ${level} learner.
                     Return a JSON array with format: [{"word": "...", "translation": "...", "usage": "...", "difficulty": "beginner/intermediate/advanced"}]`
          },
          {
            role: 'user',
            content: `Context: "${context}"`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      const suggestions = result.suggestions || result || [];
      
      // Ensure we return an array of WordSuggestion objects
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (error) {
      console.error('OpenAI word suggestion error:', error);
      // Return fallback suggestions
      return [
        { word: 'Hello', translation: 'سلام', usage: 'Hello, how are you?', difficulty: 'beginner' },
        { word: 'Thank you', translation: 'متشکرم', usage: 'Thank you for your help.', difficulty: 'beginner' },
        { word: 'Please', translation: 'لطفا', usage: 'Please help me.', difficulty: 'beginner' },
        { word: 'Excuse me', translation: 'ببخشید', usage: 'Excuse me, where is the library?', difficulty: 'intermediate' },
        { word: 'Goodbye', translation: 'خداحافظ', usage: 'Goodbye, see you tomorrow.', difficulty: 'beginner' }
      ];
    }
  }

  async correctGrammar(text: string, language: string): Promise<GrammarCorrection> {
    if (!this.isConfigured || !this.openai) {
      throw new Error('OpenAI service not configured');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a grammar correction assistant for ${language}. Correct the grammar and explain the corrections.
                     Return JSON: { "original": "...", "corrected": "...", "explanation": "...", "corrections": [...] }`
          },
          {
            role: 'user',
            content: text
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        original: text,
        corrected: result.corrected || text,
        explanation: result.explanation || 'No corrections needed',
        corrections: result.corrections || [],
      };
    } catch (error) {
      console.error('OpenAI grammar correction error:', error);
      throw new Error(`Grammar correction failed: ${error.message}`);
    }
  }

  async generatePronunciationGuide(word: string, language: string): Promise<PronunciationGuide> {
    if (!this.isConfigured || !this.openai) {
      throw new Error('OpenAI service not configured');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a pronunciation guide for ${language}. Provide phonetic transcription and tips.
                     Return JSON: { "word": "...", "phonetic": "...", "syllables": [...], "tips": [...] }`
          },
          {
            role: 'user',
            content: word
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        word,
        phonetic: result.phonetic || word,
        syllables: result.syllables || [word],
        tips: result.tips || ['Practice slowly', 'Focus on each syllable'],
      };
    } catch (error) {
      console.error('OpenAI pronunciation guide error:', error);
      throw new Error(`Pronunciation guide failed: ${error.message}`);
    }
  }

  async listModels(): Promise<string[]> {
    if (!this.isConfigured || !this.openai) {
      return [];
    }

    try {
      const models = await this.openai.models.list();
      return models.data.map(m => m.id);
    } catch (error) {
      console.error('OpenAI list models error:', error);
      return ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'];
    }
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();