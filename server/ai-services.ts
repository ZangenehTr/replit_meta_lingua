import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      const prompt = `You are an expert Persian language learning advisor with deep knowledge of cross-cultural education.

Student Profile:
- Native Language: ${profile.nativeLanguage}
- Target Language: ${profile.targetLanguage}
- Proficiency Level: ${profile.proficiencyLevel}
- Learning Goals: ${profile.learningGoals.join(', ')}
- Cultural Background: ${profile.culturalBackground}
- Learning Style: ${profile.preferredLearningStyle}
- Strengths: ${profile.strengths.join(', ')}
- Weaknesses: ${profile.weaknesses.join(', ')}

Recent Learning Activity: ${JSON.stringify(recentActivity)}

Based on this profile, generate 5 personalized learning recommendations. Focus on:
1. Addressing specific weaknesses while building on strengths
2. Cultural bridge-building between native and target language cultures
3. Appropriate difficulty progression
4. Learning style preferences

Return a JSON array with this exact structure:
{
  "recommendations": [
    {
      "type": "course|lesson|practice|cultural_insight",
      "title": "recommendation title",
      "description": "detailed description",
      "reason": "why this is recommended for this specific student",
      "priority": "high|medium|low",
      "estimatedTime": number_in_minutes,
      "difficulty": "beginner|intermediate|advanced",
      "culturalContext": "cultural insights if applicable"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
      return result.recommendations || [];
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
      const prompt = `You are an expert Persian language instructor analyzing a student's progress.

Student Profile:
- Native Language: ${profile.nativeLanguage}
- Proficiency Level: ${profile.proficiencyLevel}
- Cultural Background: ${profile.culturalBackground}

Completed Lessons: ${JSON.stringify(completedLessons)}
Quiz Results: ${JSON.stringify(quizResults)}

Provide a comprehensive analysis in JSON format:
{
  "progressAnalysis": "overall progress summary",
  "strengths": ["list of specific strengths demonstrated"],
  "areasForImprovement": ["specific areas needing work"],
  "nextSteps": ["actionable next learning steps"],
  "culturalInsights": ["cultural learning opportunities and connections"]
}

Focus on Persian language learning nuances and cross-cultural connections.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
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
4. Practice questions

Return JSON format:
{
  "scenario": "detailed scenario description",
  "culturalContext": "cultural background and etiquette tips",
  "keyPhrases": [
    {
      "persian": "Persian phrase",
      "english": "English translation",
      "cultural_note": "cultural significance or usage note"
    }
  ],
  "practiceQuestions": ["list of practice questions"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1800,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
      throw new Error('Invalid response format');
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
4. Give encouraging feedback

Return JSON format:
{
  "response": "Your Persian response to continue conversation",
  "feedback": "Constructive feedback on their Persian",
  "corrections": [
    {
      "original": "student's phrase that needs correction",
      "corrected": "correct version",
      "explanation": "why this is better"
    }
  ],
  "encouragement": "Positive, motivating comment"
}`;

      const message = await anthropic.messages.create({
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-3-7-sonnet-20250219',
      });

      const response = message.content[0];
      if (response.type === 'text') {
        return JSON.parse(response.text);
      }
      throw new Error('Invalid response format');
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
4. Include explanations

Return JSON format:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice|fill_blank|translation|cultural_context",
      "question": "question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "correct answer",
      "explanation": "why this is correct",
      "culturalNote": "cultural context if applicable",
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "adaptationReason": "why these questions were chosen for this student"
}`;

      const message = await anthropic.messages.create({
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-3-7-sonnet-20250219',
      });

      const response = message.content[0];
      if (response.type === 'text') {
        return JSON.parse(response.text);
      }
      throw new Error('Invalid response format');
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