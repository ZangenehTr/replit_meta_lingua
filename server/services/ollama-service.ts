import fetch from 'node-fetch';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface OllamaGenerateOptions {
  model?: string;
  prompt: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
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
  audioUrl?: string;
}

export class OllamaService {
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    // Use environment variable or default to localhost
    const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
    // Ensure the host has proper protocol
    this.baseUrl = host.startsWith('http://') || host.startsWith('https://') 
      ? host 
      : `http://${host}`;
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama2';
    console.log(`Ollama service initialized with host: ${this.baseUrl}, model: ${this.defaultModel}`);
  }

  private async generate(options: OllamaGenerateOptions): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          prompt: options.prompt,
          system: options.system,
          temperature: options.temperature || 0.7,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OllamaResponse;
      return data.response;
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw new Error(`Failed to generate with Ollama: ${error.message}`);
    }
  }

  // Replace OpenAI word suggestions
  async generateWordSuggestions(
    context: string, 
    language: string,
    level: string = 'intermediate'
  ): Promise<WordSuggestion[]> {
    const prompt = `You are a language learning assistant. Based on this conversation context, suggest 5 useful words or phrases in ${language} that would be helpful for a ${level} learner.

Context: "${context}"

Provide exactly 5 suggestions in JSON format:
[
  {
    "word": "word or phrase in ${language}",
    "translation": "English translation",
    "usage": "Example sentence using the word",
    "difficulty": "beginner/intermediate/advanced"
  }
]

Return ONLY the JSON array, no additional text.`;

    try {
      const response = await this.generate({
        prompt,
        system: 'You are a helpful language learning assistant that provides accurate translations and examples.',
        temperature: 0.7,
      });

      // Parse the JSON response
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const suggestions = JSON.parse(cleanedResponse);
      
      // Validate and return suggestions
      return suggestions.slice(0, 5).map((s: any) => ({
        word: s.word || '',
        translation: s.translation || '',
        usage: s.usage || '',
        difficulty: s.difficulty || level,
      }));
    } catch (error) {
      console.error('Error generating word suggestions:', error);
      // Return fallback suggestions
      return [
        {
          word: 'سلام',
          translation: 'Hello',
          usage: 'سلام، چطور هستید؟',
          difficulty: 'beginner',
        },
        {
          word: 'متشکرم',
          translation: 'Thank you',
          usage: 'از کمک شما متشکرم',
          difficulty: 'beginner',
        },
      ];
    }
  }

  // Replace OpenAI instant translation
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'auto'
  ): Promise<TranslationResult> {
    const prompt = `Translate the following text to ${targetLanguage}. 
${sourceLanguage !== 'auto' ? `The source language is ${sourceLanguage}.` : 'Detect the source language automatically.'}

Text to translate: "${text}"

Provide the translation in JSON format:
{
  "translatedText": "the translation",
  "sourceLanguage": "detected or specified source language",
  "confidence": 0.95
}

Return ONLY the JSON object.`;

    try {
      const response = await this.generate({
        prompt,
        system: 'You are a professional translator with expertise in multiple languages.',
        temperature: 0.3, // Lower temperature for more accurate translations
      });

      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedResponse);
      
      return {
        translatedText: result.translatedText || text,
        sourceLanguage: result.sourceLanguage || 'unknown',
        confidence: result.confidence || 0.8,
      };
    } catch (error) {
      console.error('Error translating text:', error);
      return {
        translatedText: text,
        sourceLanguage: 'unknown',
        confidence: 0,
      };
    }
  }

  // Replace OpenAI grammar correction
  async correctGrammar(text: string, language: string): Promise<GrammarCorrection> {
    const prompt = `Analyze and correct the grammar in the following ${language} text. Provide detailed corrections and explanations.

Text: "${text}"

Provide the analysis in JSON format:
{
  "original": "the original text",
  "corrected": "the grammatically correct version",
  "explanation": "brief explanation of main corrections",
  "corrections": [
    {
      "type": "grammar/spelling/punctuation",
      "position": 0,
      "original": "incorrect part",
      "suggestion": "correct part"
    }
  ]
}

Return ONLY the JSON object.`;

    try {
      const response = await this.generate({
        prompt,
        system: `You are a professional ${language} language teacher specializing in grammar correction.`,
        temperature: 0.3,
      });

      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedResponse);
      
      return {
        original: text,
        corrected: result.corrected || text,
        explanation: result.explanation || 'No corrections needed.',
        corrections: result.corrections || [],
      };
    } catch (error) {
      console.error('Error correcting grammar:', error);
      return {
        original: text,
        corrected: text,
        explanation: 'Grammar check unavailable',
        corrections: [],
      };
    }
  }

  // Replace OpenAI pronunciation guide
  async generatePronunciationGuide(
    word: string,
    language: string
  ): Promise<PronunciationGuide> {
    const prompt = `Provide a pronunciation guide for the ${language} word "${word}".

Include:
1. Phonetic transcription
2. Syllable breakdown
3. Pronunciation tips for English speakers

Format the response as JSON:
{
  "word": "${word}",
  "phonetic": "phonetic transcription",
  "syllables": ["syl", "la", "bles"],
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Return ONLY the JSON object.`;

    try {
      const response = await this.generate({
        prompt,
        system: `You are a ${language} pronunciation expert helping English speakers.`,
        temperature: 0.5,
      });

      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedResponse);
      
      return {
        word: word,
        phonetic: result.phonetic || '',
        syllables: result.syllables || [word],
        tips: result.tips || ['Practice slowly', 'Focus on each syllable'],
      };
    } catch (error) {
      console.error('Error generating pronunciation guide:', error);
      return {
        word: word,
        phonetic: word,
        syllables: [word],
        tips: ['Practice this word slowly'],
      };
    }
  }

  // Generate questions for games and assessments
  async generateQuestions(
    topic: string,
    level: string,
    language: string,
    count: number = 10
  ): Promise<any[]> {
    const prompt = `Generate ${count} ${level} level questions about "${topic}" for ${language} learners.

Create varied question types including:
- Multiple choice
- Fill in the blank
- True/false
- Translation

Format as JSON array:
[
  {
    "question": "question text",
    "type": "multiple_choice/fill_blank/true_false/translation",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": "answer",
    "explanation": "why this is correct",
    "difficulty": "${level}"
  }
]

Return ONLY the JSON array.`;

    try {
      const response = await this.generate({
        prompt,
        system: 'You are an experienced language teacher creating educational content.',
        temperature: 0.8,
      });

      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const questions = JSON.parse(cleanedResponse);
      
      return questions.slice(0, count);
    } catch (error) {
      console.error('Error generating questions:', error);
      return [];
    }
  }

  // Generate roadmap content
  async generateRoadmap(
    studentLevel: string,
    targetLanguage: string,
    goals: string[]
  ): Promise<any> {
    const prompt = `Create a personalized learning roadmap for a ${studentLevel} student learning ${targetLanguage}.

Student goals: ${goals.join(', ')}

Create a structured roadmap with:
1. Weekly milestones
2. Specific topics to cover
3. Practice exercises
4. Assessment points

Format as JSON:
{
  "title": "roadmap title",
  "duration": "estimated weeks",
  "milestones": [
    {
      "week": 1,
      "topic": "topic name",
      "objectives": ["obj1", "obj2"],
      "exercises": ["exercise1", "exercise2"],
      "assessment": "assessment type"
    }
  ],
  "finalGoal": "what student will achieve"
}

Return ONLY the JSON object.`;

    try {
      const response = await this.generate({
        prompt,
        system: 'You are an expert language curriculum designer.',
        temperature: 0.7,
      });

      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating roadmap:', error);
      return {
        title: `${targetLanguage} Learning Roadmap`,
        duration: '12 weeks',
        milestones: [],
        finalGoal: `Achieve ${studentLevel} proficiency in ${targetLanguage}`,
      };
    }
  }

  // Check if Ollama service is available
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  // List available models
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        return [this.defaultModel];
      }

      const data = await response.json() as any;
      return data.models?.map((m: any) => m.name) || [this.defaultModel];
    } catch (error) {
      console.error('Error listing Ollama models:', error);
      return [this.defaultModel];
    }
  }
}

// Export singleton instance
export const ollamaService = new OllamaService();