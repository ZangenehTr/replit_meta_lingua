import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface WordSuggestionRequest {
  context: string;
  targetLanguage: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface WordSuggestion {
  word: string;
  translation: string;
  pronunciation?: string;
  usage?: string;
  category?: string;
}

/**
 * Get AI-powered word suggestions based on conversation context
 */
export async function getWordSuggestions(
  request: WordSuggestionRequest
): Promise<WordSuggestion[]> {
  try {
    const { context, targetLanguage, difficulty = 'intermediate' } = request;
    
    const prompt = `You are a language learning assistant helping during a live video tutoring session.
    
Based on this conversation context: "${context}"
Target language: ${targetLanguage}
Student level: ${difficulty}

Provide 5 relevant vocabulary words that would be helpful for the student to learn in this context.

Return the response as a JSON array with this format:
[
  {
    "word": "the word in the target language",
    "translation": "English translation",
    "pronunciation": "phonetic pronunciation if non-Latin script",
    "usage": "example sentence using the word",
    "category": "category like noun, verb, adjective, etc."
  }
]

Focus on practical, commonly used words relevant to the conversation topic.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful language learning assistant. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    return result.suggestions || [];
    
  } catch (error) {
    console.error('OpenAI word suggestion error:', error);
    throw new Error('Failed to generate word suggestions');
  }
}

/**
 * Generate instant translation for a word or phrase
 */
export async function getInstantTranslation(
  text: string,
  fromLang: string,
  toLang: string
): Promise<{ translation: string; alternatives?: string[] }> {
  try {
    const prompt = `Translate this ${fromLang} text to ${toLang}: "${text}"
    
Provide the translation and up to 3 alternative translations if applicable.
Return as JSON: { "translation": "main translation", "alternatives": ["alt1", "alt2"] }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 200
    });

    return JSON.parse(response.choices[0].message.content || '{"translation": ""}');
    
  } catch (error) {
    console.error('OpenAI translation error:', error);
    throw new Error('Failed to translate text');
  }
}

/**
 * Generate grammar correction suggestions
 */
export async function getGrammarCorrection(
  text: string,
  language: string
): Promise<{ corrected: string; explanation?: string }> {
  try {
    const prompt = `Correct any grammar mistakes in this ${language} text: "${text}"
    
Return JSON with the corrected version and a brief explanation of changes:
{ "corrected": "corrected text", "explanation": "what was fixed" }

If there are no errors, return the original text with explanation "No corrections needed".`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 300
    });

    return JSON.parse(response.choices[0].message.content || '{"corrected": ""}');
    
  } catch (error) {
    console.error('OpenAI grammar correction error:', error);
    throw new Error('Failed to check grammar');
  }
}

/**
 * Generate pronunciation guide
 */
export async function getPronunciationGuide(
  word: string,
  language: string
): Promise<{ ipa: string; simplified: string; tips?: string }> {
  try {
    const prompt = `Provide pronunciation guide for the ${language} word: "${word}"
    
Return JSON with:
{ 
  "ipa": "IPA transcription",
  "simplified": "easy-to-read pronunciation for English speakers",
  "tips": "any helpful pronunciation tips"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 200
    });

    return JSON.parse(response.choices[0].message.content || '{"ipa": "", "simplified": ""}');
    
  } catch (error) {
    console.error('OpenAI pronunciation error:', error);
    throw new Error('Failed to generate pronunciation guide');
  }
}