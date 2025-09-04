import { OllamaService } from './ollama-service';

interface ActivityGenerationParams {
  studentLevel: string; // A1, A2, B1, B2, C1, C2
  targetLanguage: string; // en, fa, ar, etc.
  sessionFocus: string;
  previousSessionContent?: any;
  learningObjectives: string[];
  scaffoldingStage: 'controlled' | 'semi_controlled' | 'free';
  sessionDurationMin: number;
}

interface VocabularyItem {
  term: string;
  definition_en: string;
  definition_fa?: string;
  example_en: string;
  context?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GeneratedActivity {
  activity_id: string;
  type: 'quiz' | 'matching' | 'fill_in_blank' | 'poll' | 'vocab_game' | 'dialogue_roleplay';
  title: string;
  prompt: string;
  payload: any;
  duration_min: number;
  pedagogy: {
    i_plus_1: boolean;
    scaffolding_stage: 'controlled' | 'semi_controlled' | 'free';
  };
  suggested_for: number; // seconds into session
  explain_fa: string;
}

interface PreSessionContent {
  grammar_explained_fa?: string;
  grammar_explained_en?: string;
  vocab: VocabularyItem[];
  srs_seed: VocabularyItem[];
  session_focus: string;
  learning_objectives: string[];
}

export class AIContentGenerator {
  private ollamaService: OllamaService;

  constructor() {
    this.ollamaService = new OllamaService();
  }

  /**
   * Generate pre-session 3-minute review content
   */
  async generatePreSessionContent(params: {
    studentProfile: any;
    roadmapInstance: any;
    currentPosition: any;
    upcomingActivities: any[];
    recentSessions: any[];
    targetLanguage: string;
  }): Promise<PreSessionContent> {
    try {
      const level = params.roadmapInstance?.template?.targetLevel || 'A2';
      const targetLang = params.targetLanguage;
      
      // Generate grammar explanation based on upcoming activities
      const grammarPrompt = this.buildGrammarPrompt(params, level, targetLang);
      const grammarExplanation = await this.ollamaService.generateText(grammarPrompt);

      // Generate vocabulary based on current lesson
      const vocabPrompt = this.buildVocabularyPrompt(params, level, targetLang);
      const vocabResponse = await this.ollamaService.generateText(vocabPrompt);
      const vocabulary = this.parseVocabularyResponse(vocabResponse, targetLang);

      // Generate session focus
      const focusPrompt = this.buildSessionFocusPrompt(params, level);
      const sessionFocus = await this.ollamaService.generateText(focusPrompt);

      // Generate learning objectives
      const objectivesPrompt = this.buildObjectivesPrompt(params, level);
      const objectivesResponse = await this.ollamaService.generateText(objectivesPrompt);
      const objectives = this.parseObjectivesResponse(objectivesResponse);

      // Create SRS seeds from vocabulary
      const srsSeed = vocabulary.map(v => ({
        ...v,
        languageCode: targetLang,
        difficulty: this.calculateDifficulty(v.term, level)
      }));

      return {
        grammar_explained_fa: targetLang !== 'fa' ? grammarExplanation : undefined,
        grammar_explained_en: targetLang === 'fa' ? grammarExplanation : undefined,
        vocab: vocabulary,
        srs_seed: srsSeed,
        session_focus: sessionFocus.trim(),
        learning_objectives: objectives
      };

    } catch (error) {
      console.error('Error generating pre-session content:', error);
      // Fallback to basic content
      return this.getFallbackPreSessionContent(params.targetLanguage);
    }
  }

  /**
   * Generate in-session activity suggestions
   */
  async generateActivitySuggestions(params: ActivityGenerationParams): Promise<GeneratedActivity[]> {
    try {
      const activities: GeneratedActivity[] = [];
      
      // Generate 3 different types of activities
      const activityTypes = this.selectActivityTypes(params.scaffoldingStage, params.sessionDurationMin);
      
      for (let i = 0; i < activityTypes.length; i++) {
        const activityType = activityTypes[i];
        const suggestedFor = Math.floor((i + 1) * (params.sessionDurationMin * 60 / 4)); // Distribute throughout session
        
        const activity = await this.generateSingleActivity({
          ...params,
          activityType,
          suggestedFor
        });
        
        if (activity) {
          activities.push(activity);
        }
      }

      return activities;

    } catch (error) {
      console.error('Error generating activity suggestions:', error);
      return this.getFallbackActivities(params);
    }
  }

  /**
   * Generate post-session summary and next session prep
   */
  async generateSessionSummary(params: {
    sessionId: number;
    durationSec: number;
    transcriptPath?: string;
    roadmapInstanceId?: number;
  }): Promise<any> {
    try {
      let transcript = '';
      if (params.transcriptPath) {
        // TODO: Read transcript file
        transcript = 'Session transcript would be read here';
      }

      const summaryPrompt = `
Analyze this language learning session and provide a concise summary:

Duration: ${Math.floor(params.durationSec / 60)} minutes
Transcript: ${transcript || 'No transcript available'}

Please provide:
1. Key topics covered
2. Student engagement level (high/medium/low)
3. Areas where student struggled
4. Vocabulary introduced
5. Grammar points practiced
6. Recommendations for next session

Format as JSON with these fields: topics, engagement, struggles, vocabulary, grammar, recommendations
`;

      const summaryResponse = await this.ollamaService.generateText(summaryPrompt);
      
      try {
        return JSON.parse(summaryResponse);
      } catch {
        // Fallback if JSON parsing fails
        return {
          topics: ['Speaking practice', 'Vocabulary building'],
          engagement: 'medium',
          struggles: ['Pronunciation'],
          vocabulary: ['example', 'practice'],
          grammar: ['Present tense'],
          recommendations: ['Focus on pronunciation in next session']
        };
      }

    } catch (error) {
      console.error('Error generating session summary:', error);
      return this.getFallbackSummary();
    }
  }

  /**
   * Generate next micro-session content
   */
  async generateNextMicroSession(params: {
    sessionId: number;
    studentId: number;
    roadmapInstanceId?: number;
    lastSessionSummary: any;
  }): Promise<any> {
    try {
      const nextSessionPrompt = `
Based on the last session summary, generate content for the next 15-20 minute micro-session:

Last session summary: ${JSON.stringify(params.lastSessionSummary)}

Generate:
1. 3-5 activities building on last session
2. Focus areas to address struggles
3. New vocabulary (5-7 words)
4. Grammar reinforcement exercises

Format as JSON with: activities, focusAreas, vocabulary, grammar
`;

      const response = await this.ollamaService.generateText(nextSessionPrompt);
      
      try {
        return JSON.parse(response);
      } catch {
        return this.getFallbackNextSession();
      }

    } catch (error) {
      console.error('Error generating next micro-session:', error);
      return this.getFallbackNextSession();
    }
  }

  // ===========================
  // PRIVATE HELPER METHODS
  // ===========================

  private buildGrammarPrompt(params: any, level: string, targetLang: string): string {
    const explanationLang = targetLang !== 'fa' ? 'Persian (Farsi)' : 'English';
    
    return `
You are a language teacher preparing a 3-minute grammar review for a ${level} level student learning ${targetLang}.

Student context:
- Current lesson: ${params.currentPosition?.lesson?.title || 'Basic conversation'}
- Recent progress: ${params.recentSessions?.length || 0} completed sessions
- Upcoming activities: ${params.upcomingActivities?.map(a => a.title).join(', ') || 'Speaking practice'}

Create a clear, concise grammar explanation in ${explanationLang} that:
1. Reviews 1-2 key grammar points for today's lesson
2. Uses simple examples
3. Takes exactly 60-90 seconds to read aloud
4. Connects to the student's current level

Focus on practical usage, not complex rules. Make it encouraging and clear.
`;
  }

  private buildVocabularyPrompt(params: any, level: string, targetLang: string): string {
    return `
Generate 5-7 vocabulary words for a ${level} level student learning ${targetLang}.

Context:
- Current lesson: ${params.currentPosition?.lesson?.title || 'Basic conversation'}
- Student level: ${level}
- Target language: ${targetLang}

For each word, provide:
1. The word/phrase
2. Definition in English
3. Definition in Persian/Farsi (if available)
4. Example sentence in English
5. Context of usage

Format as JSON array: [{"term": "word", "definition_en": "...", "definition_fa": "...", "example_en": "...", "context": "..."}]

Choose words that are:
- Appropriate for ${level} level
- Useful in conversation
- Related to the current lesson topic
- Not too difficult or too basic
`;
  }

  private buildSessionFocusPrompt(params: any, level: string): string {
    return `
Create a one-sentence session focus statement for a ${level} language learning session.

Context:
- Current lesson: ${params.currentPosition?.lesson?.title || 'Speaking practice'}
- Recent sessions: ${params.recentSessions?.length || 0}

The focus should be:
- Specific and actionable
- Motivating for the student
- Related to today's lesson
- Achievable in a 15-20 minute session

Example: "Today we'll practice using past tense verbs to tell stories about your weekend"

Provide just the focus statement, no extra text.
`;
  }

  private buildObjectivesPrompt(params: any, level: string): string {
    return `
Generate 2-3 specific learning objectives for a ${level} language learning session.

Context:
- Current lesson: ${params.currentPosition?.lesson?.title || 'Speaking practice'}
- Student level: ${level}

Each objective should:
- Start with an action verb (practice, learn, improve, use)
- Be specific and measurable
- Be achievable in 15-20 minutes
- Build on previous learning

Format as a simple list, one objective per line, no numbering.

Example:
Practice using present continuous tense in conversation
Learn 5 new vocabulary words about daily routines
Improve pronunciation of 'th' sounds
`;
  }

  private parseVocabularyResponse(response: string, targetLang: string): VocabularyItem[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Fallback parsing if JSON fails
      return this.getFallbackVocabulary(targetLang);
    }
  }

  private parseObjectivesResponse(response: string): string[] {
    return response
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.trim().replace(/^[-•*]\s*/, ''))
      .slice(0, 3);
  }

  private calculateDifficulty(term: string, level: string): 'easy' | 'medium' | 'hard' {
    const levelMap = { 'A1': 'easy', 'A2': 'easy', 'B1': 'medium', 'B2': 'medium', 'C1': 'hard', 'C2': 'hard' };
    return levelMap[level as keyof typeof levelMap] || 'medium';
  }

  private selectActivityTypes(scaffoldingStage: string, durationMin: number): string[] {
    const allTypes = ['quiz', 'matching', 'fill_in_blank', 'poll', 'vocab_game', 'dialogue_roleplay'];
    
    if (scaffoldingStage === 'controlled') {
      return ['quiz', 'matching', 'fill_in_blank'];
    } else if (scaffoldingStage === 'semi_controlled') {
      return ['poll', 'vocab_game', 'quiz'];
    } else {
      return ['dialogue_roleplay', 'poll', 'vocab_game'];
    }
  }

  private async generateSingleActivity(params: any): Promise<GeneratedActivity | null> {
    try {
      const prompt = `
Generate a ${params.activityType} activity for a ${params.studentLevel} language learner.

Activity requirements:
- Type: ${params.activityType}
- Duration: 3-5 minutes
- Level: ${params.studentLevel}
- Scaffolding: ${params.scaffoldingStage}
- Focus: ${params.sessionFocus}

Provide:
1. Activity title
2. Clear instructions/prompt
3. Activity content (questions, options, etc.)
4. Explanation in Persian for why this activity helps

Format as JSON: {"title": "...", "prompt": "...", "payload": {...}, "explain_fa": "..."}
`;

      const response = await this.ollamaService.generateText(prompt);
      const parsed = JSON.parse(response);
      
      return {
        activity_id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: params.activityType,
        title: parsed.title || 'Practice Activity',
        prompt: parsed.prompt || 'Complete this activity',
        payload: parsed.payload || {},
        duration_min: 4,
        pedagogy: {
          i_plus_1: true,
          scaffolding_stage: params.scaffoldingStage
        },
        suggested_for: params.suggestedFor,
        explain_fa: parsed.explain_fa || 'این تمرین به تقویت مهارت‌های زبانی شما کمک می‌کند'
      };

    } catch (error) {
      console.error('Error generating single activity:', error);
      return null;
    }
  }

  // ===========================
  // FALLBACK METHODS
  // ===========================

  private getFallbackPreSessionContent(targetLanguage: string): PreSessionContent {
    return {
      grammar_explained_en: "Today we'll practice using present tense verbs in conversation. Focus on subject-verb agreement and common irregular verbs.",
      vocab: [
        {
          term: "practice",
          definition_en: "To do something repeatedly to improve",
          definition_fa: "تمرین کردن",
          example_en: "I practice English every day",
          difficulty: 'easy'
        },
        {
          term: "improve",
          definition_en: "To make or become better",
          definition_fa: "بهبود دادن",
          example_en: "Reading helps improve your vocabulary",
          difficulty: 'medium'
        }
      ],
      srs_seed: [],
      session_focus: "Practice speaking with confidence using new vocabulary",
      learning_objectives: [
        "Use present tense verbs correctly in conversation",
        "Learn 5 new everyday vocabulary words",
        "Improve pronunciation and fluency"
      ]
    };
  }

  private getFallbackActivities(params: ActivityGenerationParams): GeneratedActivity[] {
    return [
      {
        activity_id: 'fallback_quiz_1',
        type: 'quiz',
        title: 'Quick Grammar Check',
        prompt: 'Choose the correct verb form',
        payload: {
          question: 'I ___ to school every day.',
          options: ['go', 'goes', 'going', 'went']
        },
        duration_min: 3,
        pedagogy: { i_plus_1: true, scaffolding_stage: 'controlled' },
        suggested_for: 300,
        explain_fa: 'این تمرین به تقویت گرامر شما کمک می‌کند'
      }
    ];
  }

  private getFallbackSummary(): any {
    return {
      topics: ['Speaking practice', 'Vocabulary building'],
      engagement: 'medium',
      struggles: ['Pronunciation'],
      vocabulary: ['practice', 'improve'],
      grammar: ['Present tense'],
      recommendations: ['Focus on pronunciation in next session']
    };
  }

  private getFallbackNextSession(): any {
    return {
      activities: [
        { type: 'vocab_game', title: 'Vocabulary Review' },
        { type: 'quiz', title: 'Grammar Practice' }
      ],
      focusAreas: ['Pronunciation', 'Fluency'],
      vocabulary: ['confident', 'fluent', 'practice'],
      grammar: 'Present continuous tense'
    };
  }

  private getFallbackVocabulary(targetLang: string): VocabularyItem[] {
    return [
      {
        term: 'example',
        definition_en: 'An instance that clarifies',
        definition_fa: 'مثال',
        example_en: 'For example, this is a sample sentence',
        difficulty: 'easy'
      }
    ];
  }
}

export const aiContentGenerator = new AIContentGenerator();