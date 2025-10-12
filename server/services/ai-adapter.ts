/**
 * AI Adapter Layer - Unified interface for all AI operations
 * Uses Ollama exclusively for Iranian self-hosting (OpenAI is blocked)
 * 
 * This adapter provides:
 * - Chat completions
 * - Translation
 * - Grammar correction
 * - Word suggestions
 * - Pronunciation guides
 * - Roadmap generation
 * - All other AI features
 */

import { OllamaService } from './ollama-service';

const ollamaService = new OllamaService();

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

interface ChatCompletionResponse {
  content: string;
  model: string;
  finishReason?: string;
}

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
}

interface PersonalizedRecommendation {
  type: 'course' | 'lesson' | 'practice' | 'cultural_insight';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  difficulty: string;
  culturalContext?: string;
}

/**
 * AI Adapter - Unified interface using Ollama exclusively
 */
export class AIAdapter {
  
  /**
   * Generic chat completion (replaces all OpenAI chat completions)
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
      const userMessages = request.messages.filter(m => m.role !== 'system')
        .map(m => m.content)
        .join('\n\n');

      const prompt = userMessages;
      const system = systemMessage;

      const response = await ollamaService['generate']({
        prompt,
        system,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2000,
      });

      // Strip markdown code fences if present
      let content = response.trim();
      if (content.startsWith('```json') || content.startsWith('```')) {
        content = content.replace(/^```(?:json)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
      }

      return {
        content,
        model: 'ollama',
        finishReason: 'stop',
      };
    } catch (error) {
      console.error('AI Adapter chat error:', error);
      throw new Error(`AI chat failed: ${error.message}`);
    }
  }

  /**
   * Translation service
   */
  async translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResult> {
    try {
      const prompt = `Translate the following text to ${targetLanguage}${sourceLanguage ? ` from ${sourceLanguage}` : ''}:

"${text}"

Return ONLY the JSON object with this exact structure (no markdown, no code blocks):
{
  "translatedText": "translated text here",
  "sourceLanguage": "${sourceLanguage || 'auto-detected'}",
  "confidence": 0.95
}`;

      const response = await this.chat({
        messages: [
          { role: 'system', content: 'You are a professional translator. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        responseFormat: 'json',
      });

      const parsed = this.parseJSON<TranslationResult>(response.content);
      
      return {
        translatedText: parsed.translatedText || text,
        sourceLanguage: parsed.sourceLanguage || sourceLanguage,
        confidence: parsed.confidence || 0.8,
      };
    } catch (error) {
      console.error('Translation error:', error);
      return {
        translatedText: text,
        sourceLanguage: sourceLanguage,
        confidence: 0.5,
      };
    }
  }

  /**
   * Grammar correction service
   */
  async correctGrammar(text: string, language: string): Promise<GrammarCorrection> {
    try {
      const prompt = `Analyze and correct grammar in this ${language} text:

"${text}"

Return ONLY the JSON object with this exact structure (no markdown, no code blocks):
{
  "original": "${text}",
  "corrected": "corrected text here",
  "explanation": "brief explanation of changes",
  "corrections": [
    {
      "type": "grammar|spelling|punctuation",
      "position": 0,
      "original": "wrong part",
      "suggestion": "corrected part"
    }
  ]
}`;

      const response = await this.chat({
        messages: [
          { role: 'system', content: 'You are a grammar expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        responseFormat: 'json',
      });

      const parsed = this.parseJSON<GrammarCorrection>(response.content);
      
      return {
        original: text,
        corrected: parsed.corrected || text,
        explanation: parsed.explanation || 'No corrections needed',
        corrections: parsed.corrections || [],
      };
    } catch (error) {
      console.error('Grammar correction error:', error);
      return {
        original: text,
        corrected: text,
        explanation: 'Grammar check unavailable',
        corrections: [],
      };
    }
  }

  /**
   * Word suggestions service
   */
  async generateWordSuggestions(context: string, language: string, level: string = 'intermediate'): Promise<WordSuggestion[]> {
    try {
      const prompt = `Based on this conversation context, suggest 5 useful words or phrases in ${language} for a ${level} learner:

Context: "${context}"

Return ONLY the JSON array with this exact structure (no markdown, no code blocks):
[
  {
    "word": "word in ${language}",
    "translation": "English translation",
    "usage": "example sentence",
    "difficulty": "beginner|intermediate|advanced"
  }
]`;

      const response = await this.chat({
        messages: [
          { role: 'system', content: 'You are a language learning assistant. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        responseFormat: 'json',
      });

      const parsed = this.parseJSON<WordSuggestion[]>(response.content);
      
      return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    } catch (error) {
      console.error('Word suggestions error:', error);
      return [];
    }
  }

  /**
   * Pronunciation guide service
   */
  async generatePronunciationGuide(word: string, language: string): Promise<PronunciationGuide> {
    try {
      const prompt = `Provide pronunciation guide for the ${language} word: "${word}"

Return ONLY the JSON object with this exact structure (no markdown, no code blocks):
{
  "word": "${word}",
  "phonetic": "phonetic transcription (IPA)",
  "syllables": ["syl", "la", "bles"],
  "tips": ["pronunciation tip 1", "tip 2"]
}`;

      const response = await this.chat({
        messages: [
          { role: 'system', content: 'You are a pronunciation expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        responseFormat: 'json',
      });

      const parsed = this.parseJSON<PronunciationGuide>(response.content);
      
      return {
        word: parsed.word || word,
        phonetic: parsed.phonetic || '',
        syllables: parsed.syllables || [word],
        tips: parsed.tips || [],
      };
    } catch (error) {
      console.error('Pronunciation guide error:', error);
      return {
        word,
        phonetic: '',
        syllables: [word],
        tips: [],
      };
    }
  }

  /**
   * Personalized recommendations
   */
  async generateRecommendations(profile: any, recentActivity: any[]): Promise<PersonalizedRecommendation[]> {
    try {
      const prompt = `Generate 5 personalized learning recommendations for this student profile:

Profile: ${JSON.stringify(profile)}
Recent Activity: ${JSON.stringify(recentActivity)}

Return ONLY the JSON array with this exact structure (no markdown, no code blocks):
[
  {
    "type": "course|lesson|practice|cultural_insight",
    "title": "recommendation title",
    "description": "detailed description",
    "reason": "why recommended",
    "priority": "high|medium|low",
    "estimatedTime": 30,
    "difficulty": "beginner|intermediate|advanced",
    "culturalContext": "cultural insights if applicable"
  }
]`;

      const response = await this.chat({
        messages: [
          { role: 'system', content: 'You are an expert language learning advisor. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 2000,
        responseFormat: 'json',
      });

      const parsed = this.parseJSON<PersonalizedRecommendation[]>(response.content);
      
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Recommendations error:', error);
      return [];
    }
  }

  /**
   * Progress analysis
   */
  async analyzeProgress(profile: any, completedLessons: any[], quizResults: any[]): Promise<any> {
    try {
      const prompt = `Analyze student progress and provide feedback:

Profile: ${JSON.stringify(profile)}
Completed Lessons: ${JSON.stringify(completedLessons)}
Quiz Results: ${JSON.stringify(quizResults)}

Return ONLY the JSON object with this exact structure (no markdown, no code blocks):
{
  "progressAnalysis": "detailed analysis",
  "strengths": ["strength 1", "strength 2"],
  "areasForImprovement": ["area 1", "area 2"],
  "nextSteps": ["step 1", "step 2"],
  "culturalInsights": ["insight 1", "insight 2"]
}`;

      const response = await this.chat({
        messages: [
          { role: 'system', content: 'You are an expert education analyst. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        maxTokens: 2000,
        responseFormat: 'json',
      });

      return this.parseJSON(response.content);
    } catch (error) {
      console.error('Progress analysis error:', error);
      return {
        progressAnalysis: 'Analysis unavailable',
        strengths: [],
        areasForImprovement: [],
        nextSteps: [],
        culturalInsights: [],
      };
    }
  }

  /**
   * Conversation quality analysis (for CallerN monitoring)
   */
  async analyzeConversationQuality(transcript: string[], metrics: any): Promise<any> {
    try {
      const prompt = `Analyze this conversation quality:

Transcript: ${transcript.join('\n')}
Metrics: ${JSON.stringify(metrics)}

Return ONLY the JSON object with this exact structure (no markdown, no code blocks):
{
  "overallQuality": 0.85,
  "teacherPerformance": "assessment",
  "studentEngagement": "assessment",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "strengths": ["strength 1", "strength 2"],
  "areasForImprovement": ["area 1", "area 2"]
}`;

      const response = await this.chat({
        messages: [
          { role: 'system', content: 'You are an expert conversation analyst. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        responseFormat: 'json',
      });

      return this.parseJSON(response.content);
    } catch (error) {
      console.error('Conversation analysis error:', error);
      return {
        overallQuality: 0.7,
        teacherPerformance: 'Analysis unavailable',
        studentEngagement: 'Analysis unavailable',
        suggestions: [],
        strengths: [],
        areasForImprovement: [],
      };
    }
  }

  /**
   * Roadmap generation
   */
  async generateRoadmap(studentProfile: any, targetLevel: string): Promise<any> {
    try {
      const prompt = `Generate a learning roadmap:

Student Profile: ${JSON.stringify(studentProfile)}
Target Level: ${targetLevel}

Return ONLY the JSON object with this exact structure (no markdown, no code blocks):
{
  "title": "roadmap title",
  "description": "roadmap description",
  "totalSessions": 20,
  "estimatedWeeks": 10,
  "sessions": [
    {
      "sessionNumber": 1,
      "title": "session title",
      "objectives": ["objective 1", "objective 2"],
      "activities": ["activity 1", "activity 2"],
      "homework": "homework description"
    }
  ]
}`;

      const response = await this.chat({
        messages: [
          { role: 'system', content: 'You are an expert curriculum designer. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 3000,
        responseFormat: 'json',
      });

      return this.parseJSON(response.content);
    } catch (error) {
      console.error('Roadmap generation error:', error);
      return null;
    }
  }

  /**
   * Robust JSON parsing with fallback
   */
  private parseJSON<T = any>(content: string): T {
    try {
      // Strip markdown code fences
      let cleaned = content.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
      }

      // Try to parse
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('JSON parse error:', error);
      console.error('Content was:', content);
      
      // Try to extract JSON from text
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Failed to parse even extracted JSON
        }
      }
      
      // Return empty object or array as fallback
      return (content.trim().startsWith('[') ? [] : {}) as T;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.chat({
        messages: [{ role: 'user', content: 'Reply with "OK"' }],
        temperature: 0,
      });
      return response.content.toLowerCase().includes('ok');
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const aiAdapter = new AIAdapter();
