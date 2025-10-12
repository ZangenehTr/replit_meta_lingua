import { aiAdapter } from './services/ai-adapter';

export interface LearningProfile {
  userId: number;
  nativeLanguage: string;
  targetLanguage: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
  culturalBackground: string;
  preferredLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  weaknesses: string[];
  strengths: string[];
  progressHistory: any[];
}

export interface PersonalizedRecommendation {
  type: 'course' | 'lesson' | 'practice' | 'cultural_insight';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  difficulty: string;
  culturalContext?: string;
}

export class AIPersonalizationService {
  
  /**
   * Generate personalized learning recommendations based on user profile and progress
   */
  async generatePersonalizedRecommendations(
    profile: LearningProfile,
    recentActivity: any[]
  ): Promise<PersonalizedRecommendation[]> {
    try {
      console.log('Generating personalized recommendations using AI Adapter (Ollama)');
      return await aiAdapter.generateRecommendations(profile, recentActivity);
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      return this.getFallbackRecommendations(profile);
    }
  }

  /**
   * Analyze student progress and provide adaptive feedback
   */
  async analyzeProgressAndProvideFeedback(
    profile: LearningProfile,
    completedLessons: any[],
    quizResults: any[]
  ): Promise<{
    progressAnalysis: string;
    strengths: string[];
    areasForImprovement: string[];
    nextSteps: string[];
    culturalInsights: string[];
  }> {
    try {
      console.log('Analyzing progress using AI Adapter (Ollama)');
      return await aiAdapter.analyzeProgress(profile, completedLessons, quizResults);
    } catch (error) {
      console.error('Error analyzing progress:', error);
      return this.getFallbackProgressAnalysis();
    }
  }

  /**
   * Generate culturally-appropriate conversation scenarios
   */
  async generateConversationScenarios(
    profile: LearningProfile,
    topic: string,
    difficulty: string
  ): Promise<{
    scenario: string;
    culturalContext: string;
    keyPhrases: Array<{ persian: string; english: string; cultural_note: string }>;
    practiceQuestions: string[];
  }> {
    try {
      const prompt = `Create a Persian conversation practice scenario for a ${profile.proficiencyLevel} learner.

Student Background:
- Native Language: ${profile.nativeLanguage}
- Cultural Background: ${profile.culturalBackground}

Topic: ${topic}
Difficulty: ${difficulty}

Generate a realistic, culturally-appropriate scenario that includes:
1. A practical conversation situation common in Persian-speaking cultures
2. Cultural context and etiquette
3. Key phrases with cultural explanations
4. Practice questions`;

      const response = await aiAdapter.chat({
        messages: [
          { role: 'system', content: 'You are a Persian language and culture expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 1800,
        responseFormat: 'json',
      });

      const parsed = JSON.parse(response.content);
      return {
        scenario: parsed.scenario || '',
        culturalContext: parsed.culturalContext || '',
        keyPhrases: parsed.keyPhrases || [],
        practiceQuestions: parsed.practiceQuestions || []
      };
    } catch (error) {
      console.error('Error generating conversation scenario:', error);
      return this.getFallbackConversationScenario();
    }
  }

  /**
   * Provide AI-powered conversation practice with adaptive responses
   */
  async generateConversationResponse(
    userMessage: string,
    conversationContext: any,
    proficiencyLevel: string,
    culturalBackground: string
  ): Promise<{
    response: string;
    feedback: string;
    corrections: Array<{ original: string; corrected: string; explanation: string }>;
    encouragement: string;
  }> {
    try {
      const prompt = `You are a friendly Persian language tutor conducting a conversation practice session.

Student Level: ${proficiencyLevel}
Cultural Background: ${culturalBackground}
Conversation Context: ${JSON.stringify(conversationContext)}

Student's Message: "${userMessage}"

Respond as a supportive tutor would:
1. Reply naturally in Persian to continue the conversation
2. Provide gentle corrections if needed
3. Offer cultural insights
4. Give encouraging feedback`;

      const aiResponse = await aiAdapter.chat({
        messages: [
          { role: 'system', content: 'You are a Persian language tutor. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 1200,
        responseFormat: 'json',
      });

      const parsed = JSON.parse(aiResponse.content);
      return {
        response: parsed.response || '',
        feedback: parsed.feedback || '',
        corrections: parsed.corrections || [],
        encouragement: parsed.encouragement || ''
      };
    } catch (error) {
      console.error('Error generating conversation response:', error);
      return this.getFallbackConversationResponse();
    }
  }

  /**
   * Generate adaptive quiz questions based on learning gaps
   */
  async generateAdaptiveQuiz(
    profile: LearningProfile,
    topic: string,
    weakAreas: string[]
  ): Promise<{
    questions: Array<{
      id: number;
      type: 'multiple_choice' | 'fill_blank' | 'translation' | 'cultural_context';
      question: string;
      options?: string[];
      correctAnswer: string;
      explanation: string;
      culturalNote?: string;
      difficulty: string;
    }>;
    adaptationReason: string;
  }> {
    try {
      const prompt = `Create an adaptive quiz for a Persian language learner.

Student Profile:
- Level: ${profile.proficiencyLevel}
- Weak Areas: ${weakAreas.join(', ')}
- Cultural Background: ${profile.culturalBackground}

Topic: ${topic}

Generate 5 questions that:
1. Target the student's weak areas
2. Include cultural context questions
3. Vary in difficulty appropriately
4. Include explanations`;

      const response = await aiAdapter.chat({
        messages: [
          { role: 'system', content: 'You are a Persian language assessment expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 2000,
        responseFormat: 'json',
      });

      const parsed = JSON.parse(response.content);
      return {
        questions: parsed.questions || [],
        adaptationReason: parsed.adaptationReason || ''
      };
    } catch (error) {
      console.error('Error generating adaptive quiz:', error);
      return this.getFallbackQuiz();
    }
  }

  // Fallback methods for when AI service is unavailable
  private getFallbackRecommendations(profile: LearningProfile): PersonalizedRecommendation[] {
    return [
      {
        type: 'lesson',
        title: 'Persian Grammar Fundamentals',
        description: 'Review basic grammar structures',
        reason: 'Based on your proficiency level',
        priority: 'high',
        estimatedTime: 30,
        difficulty: profile.proficiencyLevel
      }
    ];
  }

  private getFallbackProgressAnalysis() {
    return {
      progressAnalysis: 'Continue practicing regularly to improve your Persian skills.',
      strengths: ['Consistent practice'],
      areasForImprovement: ['Vocabulary expansion'],
      nextSteps: ['Focus on conversation practice'],
      culturalInsights: ['Learn about Persian cultural customs']
    };
  }

  private getFallbackConversationScenario() {
    return {
      scenario: 'Ordering food at a Persian restaurant',
      culturalContext: 'Persian hospitality and dining customs',
      keyPhrases: [
        {
          persian: 'چه توصیه می‌کنید؟',
          english: 'What do you recommend?',
          cultural_note: 'Polite way to ask for recommendations'
        }
      ],
      practiceQuestions: ['How would you order rice in Persian?']
    };
  }

  private getFallbackConversationResponse() {
    return {
      response: 'خیلی خوب! / Very good!',
      feedback: 'Great effort with your Persian!',
      corrections: [],
      encouragement: 'Keep practicing!'
    };
  }

  private getFallbackQuiz() {
    return {
      questions: [
        {
          id: 1,
          type: 'multiple_choice' as const,
          question: 'How do you say "hello" in Persian?',
          options: ['سلام', 'خداحافظ', 'ممنون', 'بله'],
          correctAnswer: 'سلام',
          explanation: 'سلام (salam) is the common greeting in Persian',
          difficulty: 'beginner'
        }
      ],
      adaptationReason: 'Basic vocabulary practice'
    };
  }
}

export const aiPersonalizationService = new AIPersonalizationService();
