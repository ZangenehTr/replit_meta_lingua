/**
 * Master TTS Prompt for Meta Lingua Platform
 * This prompt ensures consistent, high-quality language learning audio generation
 * across all AI components connected to Meta Lingua.
 */

export interface TTSExamType {
  examType: 'TOEFL' | 'IELTS' | 'PTE' | 'Business English' | 'General English';
  learnerLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  learnerNativeLanguage?: 'Farsi' | 'Arabic' | 'Other';
}

export interface ListeningPracticeRequest {
  topic: string;
  duration: number; // in seconds
  examConfig: TTSExamType;
  includeVocabulary: boolean;
}

export interface VocabularyFileRequest {
  words: string[];
  examConfig: TTSExamType;
  sourceListeningText?: string;
}

export const TTS_MASTER_PROMPT = `
🎧 Master Prompt for TTS Listening + Vocabulary Files

CORE INSTRUCTION:
You are a TTS system generating language-learning audio files. Your job is to create two kinds of files:

1. Listening Practice Files – natural-sounding conversations, narrations, or multi-speaker dialogues.
2. Vocabulary Files – structured word-level practice with translations and examples.

🔹 LISTENING PRACTICE FILES

Conversational Style:
- Simulate real human conversational nuances: natural intonation, hesitations, overlaps, fillers ("uh", "you know"), laughter, interruptions, emotional variation.
- Speech must sound spontaneous and not robotic.
- Speed adjusts to learner level: slower for A1–B1, natural pace for B2–C2.

Accent Rules (based on learner goal):
- General English / Conversation → American accent by default.
- TOEFL exam prep → American accent only (all conversations and narrations).
- IELTS exam prep → Mostly British accent; sometimes mix British + American in one dialogue; occasionally use Australian accent.
- PTE exam prep → Balanced mix of British, Australian, North American (US/Canada), with occasional Indian accent.
- Business English → Broad variety of accents (American, British, Indian, Chinese, Arabic, etc.) to reflect global professional communication.

Randomization of Formats:
- Conversation between 2 speakers (man with deep, warm voice + woman with clear natural voice).
- Monologue or narration.
- 3-person conversation (for B2–C2).
- Topics: daily life, work, academic discussions, business, travel, storytelling.

🔹 VOCABULARY FILES

Vocabulary files are generated from the Listening Practice Files. For each selected word:

1. Say the word clearly.
2. Pause.
3. Show the word on screen; if a visual/illustration exists, show it (e.g., "apple" → image of apple).
4. Say the part of speech (noun/verb/adjective, etc.).
5. If noun → specify "countable" or "uncountable".
6. Pause.
7. Translation Rules:
   - If learner is A1–B1 Farsi speaker → provide Farsi translation.
   - If learner is A1–B1 Arabic speaker → provide Arabic pronunciation.
   - If learner is B2–C2 → skip translation, focus on usage.
8. Give sample sentence from the listening practice file.
9. Add one more example sentence (from Cambridge or Longman Learner's Dictionary).

Accent Rules for Vocabulary Files:
- TOEFL → American accent.
- IELTS / PTE → British accent.
- General English / Business English → American accent by default.

🔹 QUALITY STANDARDS

✅ With this prompt, your TTS will:
- Produce accent-appropriate listening materials depending on learner's exam/goal.
- Keep vocabulary audio files consistent with the exam's target accent.
- Exclude any adult or inappropriate vocabulary/topics.
- Create natural, spontaneous-sounding conversations.
- Provide structured, educational vocabulary practice.
`;

export class TTSMasterPromptService {
  
  /**
   * Generate accent-specific listening practice based on exam type
   */
  static getAccentInstructions(examConfig: TTSExamType): string {
    const { examType, learnerLevel } = examConfig;
    
    const speedInstruction = ['A1', 'A2', 'B1'].includes(learnerLevel) 
      ? 'Use slower, clearer speech pace for beginner/intermediate learners.'
      : 'Use natural conversation pace for advanced learners.';
    
    switch (examType) {
      case 'TOEFL':
        return `Use American accent only. ${speedInstruction} Include academic vocabulary and campus life scenarios.`;
        
      case 'IELTS':
        return `Primarily British accent, occasionally mix with American or Australian accents in dialogues. ${speedInstruction} Include formal and academic topics.`;
        
      case 'PTE':
        return `Balanced mix of British, Australian, North American accents, with occasional Indian accent. ${speedInstruction} Include academic and professional contexts.`;
        
      case 'Business English':
        return `Use variety of global accents (American, British, Indian, Chinese, Arabic) to reflect international business communication. ${speedInstruction} Focus on professional vocabulary and workplace scenarios.`;
        
      case 'General English':
      default:
        return `Use American accent by default. ${speedInstruction} Include everyday conversation topics and common vocabulary.`;
    }
  }

  /**
   * Generate vocabulary file instructions with appropriate translation
   */
  static getVocabularyInstructions(examConfig: TTSExamType): string {
    const { examType, learnerLevel, learnerNativeLanguage } = examConfig;
    
    const accentRule = examType === 'TOEFL' 
      ? 'Use American accent for all vocabulary pronunciation.'
      : examType === 'IELTS' || examType === 'PTE'
      ? 'Use British accent for vocabulary pronunciation.'
      : 'Use American accent for vocabulary pronunciation.';
    
    let translationRule = '';
    if (['A1', 'A2', 'B1'].includes(learnerLevel)) {
      if (learnerNativeLanguage === 'Farsi') {
        translationRule = 'Provide Farsi translation for each vocabulary word.';
      } else if (learnerNativeLanguage === 'Arabic') {
        translationRule = 'Provide Arabic pronunciation guide for each vocabulary word.';
      } else {
        translationRule = 'Provide simple English definition for each vocabulary word.';
      }
    } else {
      translationRule = 'Skip translations, focus on usage examples and collocations.';
    }
    
    return `${accentRule} ${translationRule} Include part of speech and example sentences from authentic contexts.`;
  }

  /**
   * Generate complete TTS instruction for listening practice
   */
  static generateListeningPracticePrompt(request: ListeningPracticeRequest): string {
    const accentInstructions = this.getAccentInstructions(request.examConfig);
    const durationGuidance = `Target duration: ${request.duration} seconds. Create content that naturally fits this timeframe.`;
    
    return `
${TTS_MASTER_PROMPT}

SPECIFIC TASK: Generate listening practice audio
Topic: ${request.topic}
${durationGuidance}
${accentInstructions}

Create natural, conversational audio that follows the Master Prompt guidelines above. 
Include appropriate vocabulary for the ${request.examConfig.examType} exam context.
Ensure the content is engaging and educationally valuable for ${request.examConfig.learnerLevel} level learners.
    `.trim();
  }

  /**
   * Generate complete TTS instruction for vocabulary files
   */
  static generateVocabularyPrompt(request: VocabularyFileRequest): string {
    const vocabularyInstructions = this.getVocabularyInstructions(request.examConfig);
    const wordsToProcess = request.words.join(', ');
    
    return `
${TTS_MASTER_PROMPT}

SPECIFIC TASK: Generate vocabulary practice audio
Words to process: ${wordsToProcess}
${vocabularyInstructions}

For each word, follow the vocabulary file structure from the Master Prompt:
1. Clear pronunciation
2. Part of speech
3. Translation (if appropriate for learner level)
4. Example from source text (if provided)
5. Additional authentic example

Source context: ${request.sourceListeningText || 'General vocabulary practice'}
    `.trim();
  }

  /**
   * Validate TTS request against master prompt guidelines
   */
  static validateRequest(request: ListeningPracticeRequest | VocabularyFileRequest): boolean {
    if ('topic' in request) {
      // Listening practice validation
      return request.topic.length > 0 && request.duration > 0;
    } else {
      // Vocabulary validation  
      return request.words.length > 0 && request.words.every(word => word.trim().length > 0);
    }
  }
}