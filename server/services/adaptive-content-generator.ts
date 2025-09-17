import { OllamaService } from '../ollama-service.js';

interface StudentProfile {
  id: number;
  currentLevel: string; // CEFR level (A1-C2)
  irtAbility: number; // -3 to +3
  strengths: string[];
  weaknesses: string[];
  recentErrors: ErrorPattern[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  interests: string[];
  nativeLanguage: string;
}

interface ErrorPattern {
  type: 'grammar' | 'vocabulary' | 'pronunciation' | 'fluency';
  category: string;
  frequency: number;
  lastOccurrence: Date;
  examples: string[];
}

interface SessionContext {
  sessionId: string;
  studentId: number;
  teacherId: number;
  currentTopic: string;
  sessionDuration: number;
  performanceMetrics: {
    correctAnswers: number;
    totalQuestions: number;
    responseTime: number[];
    engagementLevel: number;
    confidenceScore: number;
  };
  conversationHistory: ConversationTurn[];
}

interface ConversationTurn {
  speaker: 'student' | 'teacher';
  text: string;
  timestamp: Date;
  errors?: string[];
  corrections?: string[];
}

interface AdaptiveContent {
  type: 'exercise' | 'question' | 'explanation' | 'example' | 'challenge';
  difficulty: number; // -3 to +3 matching IRT scale
  content: {
    text: string;
    options?: string[];
    correctAnswer?: string;
    hints?: string[];
    explanation?: string;
    visualAid?: string;
  };
  targetSkill: string;
  estimatedTime: number; // seconds
  adaptationReason: string;
}

export class AdaptiveContentGenerator {
  private ollamaService: OllamaService;
  private difficultyAdjustmentRate = 0.3; // How quickly to adjust difficulty
  private confidenceThreshold = 0.7; // When to increase difficulty
  private struggleThreshold = 0.4; // When to decrease difficulty

  constructor() {
    this.ollamaService = new OllamaService();
  }

  /**
   * Generate adaptive content based on real-time session data
   */
  async generateAdaptiveContent(
    student: StudentProfile,
    context: SessionContext,
    contentType: 'exercise' | 'question' | 'explanation' | 'challenge' = 'exercise'
  ): Promise<AdaptiveContent> {
    // Calculate optimal difficulty based on performance
    const optimalDifficulty = this.calculateOptimalDifficulty(
      student.irtAbility,
      context.performanceMetrics
    );

    // Identify focus area based on recent errors and weaknesses
    const focusArea = this.identifyFocusArea(student, context);

    // Generate content using AI
    const prompt = this.buildAdaptivePrompt(
      student,
      context,
      contentType,
      optimalDifficulty,
      focusArea
    );

    try {
      const response = await this.ollamaService.generateCompletion(prompt);
      const content = this.parseAIResponse(response, contentType);
      
      return {
        type: contentType,
        difficulty: optimalDifficulty,
        content,
        targetSkill: focusArea,
        estimatedTime: this.estimateCompletionTime(contentType, optimalDifficulty),
        adaptationReason: this.getAdaptationReason(student, context, optimalDifficulty)
      };
    } catch (error) {
      console.error('Error generating adaptive content:', error);
      return this.getFallbackContent(contentType, optimalDifficulty, focusArea);
    }
  }

  /**
   * Generate vocabulary exercises adapted to student's level
   */
  async generateVocabularyExercise(
    student: StudentProfile,
    context: SessionContext,
    targetWords?: string[]
  ): Promise<AdaptiveContent> {
    const difficulty = this.calculateOptimalDifficulty(
      student.irtAbility,
      context.performanceMetrics
    );

    const exerciseTypes = this.getVocabularyExerciseTypes(difficulty);
    const selectedType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];

    const prompt = `Generate a ${selectedType} vocabulary exercise for a ${student.currentLevel} student.
    Target difficulty: ${this.difficultyToLevel(difficulty)}
    Recent conversation topic: ${context.currentTopic}
    Student's native language: ${student.nativeLanguage}
    ${targetWords ? `Focus words: ${targetWords.join(', ')}` : ''}
    
    Format the response as JSON with:
    - question: The exercise prompt
    - options: Array of choices (if multiple choice)
    - correctAnswer: The correct answer
    - explanation: Brief explanation of why
    - hint: A helpful hint`;

    try {
      const response = await this.ollamaService.generateCompletion(prompt);
      return this.parseVocabularyExercise(response, difficulty);
    } catch (error) {
      console.error('Error generating vocabulary exercise:', error);
      return this.getDefaultVocabularyExercise(difficulty);
    }
  }

  /**
   * Generate grammar exercises based on detected errors
   */
  async generateGrammarExercise(
    student: StudentProfile,
    context: SessionContext,
    targetGrammar?: string
  ): Promise<AdaptiveContent> {
    const difficulty = this.calculateOptimalDifficulty(
      student.irtAbility,
      context.performanceMetrics
    );

    // Identify grammar patterns from errors
    const grammarPatterns = this.identifyGrammarPatterns(student.recentErrors);
    const focusGrammar = targetGrammar || grammarPatterns[0] || 'general';

    const prompt = `Create a grammar exercise for a ${student.currentLevel} student.
    Focus area: ${focusGrammar}
    Difficulty level: ${this.difficultyToLevel(difficulty)}
    Context: ${context.currentTopic}
    
    Generate an exercise that:
    1. Tests understanding of ${focusGrammar}
    2. Uses vocabulary appropriate for ${student.currentLevel}
    3. Relates to the conversation topic when possible
    4. Includes clear instructions
    
    Format as JSON with: question, options (if applicable), correctAnswer, explanation`;

    try {
      const response = await this.ollamaService.generateCompletion(prompt);
      return this.parseGrammarExercise(response, difficulty, focusGrammar);
    } catch (error) {
      console.error('Error generating grammar exercise:', error);
      return this.getDefaultGrammarExercise(difficulty, focusGrammar);
    }
  }

  /**
   * Generate conversation prompts adapted to student's level
   */
  async generateConversationPrompt(
    student: StudentProfile,
    context: SessionContext
  ): Promise<AdaptiveContent> {
    const difficulty = this.calculateOptimalDifficulty(
      student.irtAbility,
      context.performanceMetrics
    );

    const promptTypes = this.getConversationPromptTypes(student.currentLevel);
    const interests = student.interests.length > 0 
      ? student.interests 
      : ['daily life', 'hobbies', 'travel', 'food'];

    const prompt = `Generate a conversation prompt for a ${student.currentLevel} language student.
    Difficulty: ${this.difficultyToLevel(difficulty)}
    Student interests: ${interests.join(', ')}
    Current topic: ${context.currentTopic}
    Session duration so far: ${context.sessionDuration} minutes
    
    Create a prompt that:
    1. Encourages ${difficulty > 0 ? 'extended' : 'simple'} responses
    2. Practices ${student.weaknesses.length > 0 ? student.weaknesses[0] : 'general conversation'}
    3. Is engaging and relevant to the student
    4. Includes follow-up questions
    
    Format as JSON with: mainPrompt, followUpQuestions (array), vocabularySupport (helpful words)`;

    try {
      const response = await this.ollamaService.generateCompletion(prompt);
      return this.parseConversationPrompt(response, difficulty);
    } catch (error) {
      console.error('Error generating conversation prompt:', error);
      return this.getDefaultConversationPrompt(difficulty, interests[0]);
    }
  }

  /**
   * Calculate optimal difficulty based on IRT ability and recent performance
   */
  private calculateOptimalDifficulty(
    baseAbility: number,
    metrics: SessionContext['performanceMetrics']
  ): number {
    const successRate = metrics.totalQuestions > 0 
      ? metrics.correctAnswers / metrics.totalQuestions 
      : 0.5;
    
    const avgResponseTime = metrics.responseTime.length > 0
      ? metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length
      : 30;

    // Adjust difficulty based on performance
    let adjustment = 0;
    
    // If doing well, increase difficulty
    if (successRate > this.confidenceThreshold) {
      adjustment = this.difficultyAdjustmentRate;
    }
    // If struggling, decrease difficulty
    else if (successRate < this.struggleThreshold) {
      adjustment = -this.difficultyAdjustmentRate;
    }
    
    // Consider response time (faster = maybe too easy)
    if (avgResponseTime < 10 && successRate > 0.8) {
      adjustment += 0.1;
    } else if (avgResponseTime > 60 && successRate < 0.5) {
      adjustment -= 0.1;
    }

    // Consider engagement level
    if (metrics.engagementLevel < 30) {
      adjustment -= 0.2; // Make it easier if disengaged
    }

    const newDifficulty = baseAbility + adjustment;
    
    // Constrain to IRT scale bounds
    return Math.max(-3, Math.min(3, newDifficulty));
  }

  /**
   * Identify which skill area needs focus
   */
  private identifyFocusArea(
    student: StudentProfile,
    context: SessionContext
  ): string {
    // Priority 1: Recent errors
    if (student.recentErrors.length > 0) {
      const mostFrequent = student.recentErrors.reduce((prev, current) => 
        prev.frequency > current.frequency ? prev : current
      );
      return `${mostFrequent.type}-${mostFrequent.category}`;
    }

    // Priority 2: Known weaknesses
    if (student.weaknesses.length > 0) {
      return student.weaknesses[0];
    }

    // Priority 3: Balance across skills
    const skills = ['grammar', 'vocabulary', 'fluency', 'pronunciation'];
    return skills[Math.floor(Math.random() * skills.length)];
  }

  /**
   * Build adaptive prompt for AI content generation
   */
  private buildAdaptivePrompt(
    student: StudentProfile,
    context: SessionContext,
    contentType: string,
    difficulty: number,
    focusArea: string
  ): string {
    return `Generate a ${contentType} for language learning.
    
    Student Profile:
    - Level: ${student.currentLevel} (IRT ability: ${student.irtAbility.toFixed(2)})
    - Native Language: ${student.nativeLanguage}
    - Learning Style: ${student.learningStyle}
    - Current Weaknesses: ${student.weaknesses.join(', ')}
    
    Session Context:
    - Topic: ${context.currentTopic}
    - Performance: ${context.performanceMetrics.correctAnswers}/${context.performanceMetrics.totalQuestions} correct
    - Engagement: ${context.performanceMetrics.engagementLevel}%
    
    Requirements:
    - Target Difficulty: ${this.difficultyToLevel(difficulty)}
    - Focus Area: ${focusArea}
    - Time Estimate: ${this.estimateCompletionTime(contentType, difficulty)} seconds
    - Make it engaging and contextually relevant
    
    Format the response as structured JSON.`;
  }

  /**
   * Convert IRT difficulty to CEFR level
   */
  private difficultyToLevel(difficulty: number): string {
    if (difficulty < -2) return 'A1 (Beginner)';
    if (difficulty < -1) return 'A2 (Elementary)';
    if (difficulty < 0) return 'B1 (Pre-Intermediate)';
    if (difficulty < 1) return 'B2 (Intermediate)';
    if (difficulty < 2) return 'C1 (Upper-Intermediate)';
    return 'C2 (Advanced)';
  }

  /**
   * Get vocabulary exercise types based on difficulty
   */
  private getVocabularyExerciseTypes(difficulty: number): string[] {
    if (difficulty < -1) {
      return ['match-definition', 'picture-word', 'fill-blank-simple'];
    } else if (difficulty < 1) {
      return ['context-guess', 'synonym-antonym', 'word-formation'];
    } else {
      return ['collocation', 'idiom-usage', 'register-appropriate'];
    }
  }

  /**
   * Get conversation prompt types based on level
   */
  private getConversationPromptTypes(level: string): string[] {
    const promptsByLevel: Record<string, string[]> = {
      'A1': ['describe-picture', 'simple-question', 'daily-routine'],
      'A2': ['past-experience', 'future-plans', 'comparison'],
      'B1': ['opinion-reason', 'hypothetical-simple', 'narrative'],
      'B2': ['debate-topic', 'problem-solution', 'analysis'],
      'C1': ['abstract-concept', 'critical-evaluation', 'synthesis'],
      'C2': ['philosophical', 'nuanced-argument', 'cultural-analysis']
    };
    return promptsByLevel[level] || promptsByLevel['B1'];
  }

  /**
   * Identify grammar patterns from error history
   */
  private identifyGrammarPatterns(errors: ErrorPattern[]): string[] {
    return errors
      .filter(e => e.type === 'grammar')
      .sort((a, b) => b.frequency - a.frequency)
      .map(e => e.category);
  }

  /**
   * Estimate completion time based on content type and difficulty
   */
  private estimateCompletionTime(contentType: string, difficulty: number): number {
    const baseTimes: Record<string, number> = {
      exercise: 60,
      question: 30,
      explanation: 45,
      example: 20,
      challenge: 120
    };
    
    const baseTime = baseTimes[contentType] || 60;
    const difficultyMultiplier = 1 + (difficulty + 3) * 0.1; // 0.7x to 1.3x
    
    return Math.round(baseTime * difficultyMultiplier);
  }

  /**
   * Get adaptation reason for transparency
   */
  private getAdaptationReason(
    student: StudentProfile,
    context: SessionContext,
    difficulty: number
  ): string {
    const successRate = context.performanceMetrics.totalQuestions > 0 
      ? context.performanceMetrics.correctAnswers / context.performanceMetrics.totalQuestions 
      : 0.5;

    if (successRate > this.confidenceThreshold) {
      return `Increasing challenge - student showing ${Math.round(successRate * 100)}% accuracy`;
    } else if (successRate < this.struggleThreshold) {
      return `Adjusting to easier content - providing more support at ${Math.round(successRate * 100)}% accuracy`;
    } else if (student.recentErrors.length > 0) {
      return `Targeting recent error patterns in ${student.recentErrors[0].category}`;
    } else {
      return `Maintaining optimal challenge level for ${student.currentLevel}`;
    }
  }

  /**
   * Parse AI response into structured content
   */
  private parseAIResponse(response: string, contentType: string): any {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      // Fallback to text parsing
      return {
        text: response,
        options: [],
        correctAnswer: '',
        hints: [],
        explanation: ''
      };
    }
  }

  /**
   * Parse vocabulary exercise from AI response
   */
  private parseVocabularyExercise(response: string, difficulty: number): AdaptiveContent {
    try {
      const parsed = JSON.parse(response);
      return {
        type: 'exercise',
        difficulty,
        content: {
          text: parsed.question || 'Complete the vocabulary exercise',
          options: parsed.options || [],
          correctAnswer: parsed.correctAnswer || '',
          hints: [parsed.hint] || [],
          explanation: parsed.explanation || ''
        },
        targetSkill: 'vocabulary',
        estimatedTime: 45,
        adaptationReason: 'Vocabulary practice based on current level'
      };
    } catch {
      return this.getDefaultVocabularyExercise(difficulty);
    }
  }

  /**
   * Parse grammar exercise from AI response
   */
  private parseGrammarExercise(response: string, difficulty: number, grammar: string): AdaptiveContent {
    try {
      const parsed = JSON.parse(response);
      return {
        type: 'exercise',
        difficulty,
        content: {
          text: parsed.question || 'Complete the grammar exercise',
          options: parsed.options || [],
          correctAnswer: parsed.correctAnswer || '',
          explanation: parsed.explanation || ''
        },
        targetSkill: `grammar-${grammar}`,
        estimatedTime: 60,
        adaptationReason: `Focusing on ${grammar} based on error patterns`
      };
    } catch {
      return this.getDefaultGrammarExercise(difficulty, grammar);
    }
  }

  /**
   * Parse conversation prompt from AI response
   */
  private parseConversationPrompt(response: string, difficulty: number): AdaptiveContent {
    try {
      const parsed = JSON.parse(response);
      return {
        type: 'question',
        difficulty,
        content: {
          text: parsed.mainPrompt || 'Let\'s have a conversation',
          hints: parsed.followUpQuestions || [],
          explanation: `Vocabulary support: ${parsed.vocabularySupport?.join(', ') || 'none'}`
        },
        targetSkill: 'conversation',
        estimatedTime: 120,
        adaptationReason: 'Conversation practice at appropriate level'
      };
    } catch {
      return this.getDefaultConversationPrompt(difficulty, 'general');
    }
  }

  /**
   * Fallback content when generation fails
   */
  private getFallbackContent(
    contentType: string,
    difficulty: number,
    focusArea: string
  ): AdaptiveContent {
    const fallbacks: Record<string, AdaptiveContent> = {
      exercise: this.getDefaultVocabularyExercise(difficulty),
      question: this.getDefaultConversationPrompt(difficulty, 'general'),
      explanation: {
        type: 'explanation',
        difficulty,
        content: {
          text: 'Let me explain this concept in a different way...',
          explanation: 'Breaking down the concept step by step'
        },
        targetSkill: focusArea,
        estimatedTime: 45,
        adaptationReason: 'Providing additional explanation'
      },
      challenge: {
        type: 'challenge',
        difficulty,
        content: {
          text: 'Here\'s a challenge for you to try...',
          hints: ['Think about the context', 'Consider the grammar rules']
        },
        targetSkill: focusArea,
        estimatedTime: 120,
        adaptationReason: 'Challenging exercise to test understanding'
      }
    };
    
    return fallbacks[contentType] || fallbacks.exercise;
  }

  /**
   * Default vocabulary exercise
   */
  private getDefaultVocabularyExercise(difficulty: number): AdaptiveContent {
    const exercises = {
      easy: {
        text: 'Match the word with its meaning: "Happy"',
        options: ['Sad', 'Joyful', 'Angry', 'Tired'],
        correctAnswer: 'Joyful',
        hints: ['Think about feelings when something good happens'],
        explanation: 'Happy means feeling joyful or pleased'
      },
      medium: {
        text: 'Choose the correct word: "The weather is _____ today."',
        options: ['beauty', 'beautiful', 'beautify', 'beautifully'],
        correctAnswer: 'beautiful',
        hints: ['We need an adjective here'],
        explanation: 'We use adjectives to describe nouns (weather)'
      },
      hard: {
        text: 'Select the most appropriate collocation: "_____ a decision"',
        options: ['do', 'make', 'take', 'give'],
        correctAnswer: 'make',
        hints: ['This is a common collocation in English'],
        explanation: 'We "make" decisions, not "do" them'
      }
    };

    const level = difficulty < -1 ? 'easy' : difficulty < 1 ? 'medium' : 'hard';
    
    return {
      type: 'exercise',
      difficulty,
      content: exercises[level],
      targetSkill: 'vocabulary',
      estimatedTime: 45,
      adaptationReason: 'Standard vocabulary exercise'
    };
  }

  /**
   * Default grammar exercise
   */
  private getDefaultGrammarExercise(difficulty: number, grammar: string): AdaptiveContent {
    const exercises = {
      easy: {
        text: 'Choose the correct form: "She _____ to school every day."',
        options: ['go', 'goes', 'going', 'went'],
        correctAnswer: 'goes',
        explanation: 'Third person singular present simple requires -s/-es'
      },
      medium: {
        text: 'Complete: "If I _____ rich, I would travel the world."',
        options: ['am', 'was', 'were', 'will be'],
        correctAnswer: 'were',
        explanation: 'Second conditional uses "were" for all subjects'
      },
      hard: {
        text: 'Choose: "By next year, I _____ here for 10 years."',
        options: ['will work', 'will have worked', 'will be working', 'work'],
        correctAnswer: 'will have worked',
        explanation: 'Future perfect for completed action by future time'
      }
    };

    const level = difficulty < -1 ? 'easy' : difficulty < 1 ? 'medium' : 'hard';
    
    return {
      type: 'exercise',
      difficulty,
      content: exercises[level],
      targetSkill: `grammar-${grammar}`,
      estimatedTime: 60,
      adaptationReason: `Grammar practice: ${grammar}`
    };
  }

  /**
   * Default conversation prompt
   */
  private getDefaultConversationPrompt(difficulty: number, topic: string): AdaptiveContent {
    const prompts = {
      easy: {
        text: 'Tell me about your daily routine. What do you do in the morning?',
        hints: ['Start with: I wake up at...', 'Then I...', 'After that...']
      },
      medium: {
        text: 'What are the advantages and disadvantages of working from home?',
        hints: ['Consider flexibility', 'Think about isolation', 'Productivity factors']
      },
      hard: {
        text: 'How has technology changed the way we communicate? Is this change positive or negative?',
        hints: ['Consider multiple perspectives', 'Give specific examples', 'Analyze long-term impacts']
      }
    };

    const level = difficulty < -1 ? 'easy' : difficulty < 1 ? 'medium' : 'hard';
    
    return {
      type: 'question',
      difficulty,
      content: prompts[level],
      targetSkill: 'conversation',
      estimatedTime: 120,
      adaptationReason: `Conversation practice: ${topic}`
    };
  }

  /**
   * Track student response and update adaptation
   */
  async processStudentResponse(
    sessionId: string,
    response: string,
    isCorrect: boolean,
    responseTime: number
  ): Promise<void> {
    // This would update the session context and influence future content generation
    console.log(`Processing response for session ${sessionId}: ${isCorrect ? 'Correct' : 'Incorrect'} in ${responseTime}s`);
    // In production, update database with response data
  }
}