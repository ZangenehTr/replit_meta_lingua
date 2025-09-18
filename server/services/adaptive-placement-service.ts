/**
 * Adaptive Placement Test Service
 * Implements skill-adaptive testing algorithm starting with speaking
 */

import { OllamaService } from '../ollama-service';
import { DatabaseStorage } from '../database-storage';
import { CEFRScoringService, CEFREvaluationResult } from './cefr-scoring-service';
import { 
  CEFRLevel, 
  Skill, 
  PlacementTestSession, 
  PlacementTestQuestion,
  PlacementTestResponse,
  CEFRLevels 
} from '../../shared/placement-test-schema';

export interface AdaptiveTestConfiguration {
  maxTotalMinutes: number;
  maxQuestionsPerSkill: number;
  minQuestionsPerSkill: number;
  confidenceThreshold: number;
  speakingInfluenceWeight: number; // How much speaking results influence other skill starting levels
}

export interface SkillTestState {
  skill: Skill;
  currentLevel: CEFRLevel;
  questionsAsked: number;
  responses: PlacementTestResponse[];
  confidence: number;
  finalEvaluation?: CEFREvaluationResult;
  completed: boolean;
}

export interface AdaptiveDecision {
  nextQuestionLevel: CEFRLevel | null;
  shouldContinueTesting: boolean;
  reasoning: string;
  confidence: number;
}

export class AdaptivePlacementService {
  private ollamaService: OllamaService;
  private storage: DatabaseStorage;
  private cefrScoring: CEFRScoringService;
  
  private defaultConfig: AdaptiveTestConfiguration = {
    maxTotalMinutes: 10,
    maxQuestionsPerSkill: 3,
    minQuestionsPerSkill: 2,
    confidenceThreshold: 0.8,
    speakingInfluenceWeight: 0.7
  };

  constructor(ollamaService: OllamaService, storage: DatabaseStorage) {
    this.ollamaService = ollamaService;
    this.storage = storage;
    this.cefrScoring = new CEFRScoringService(ollamaService, storage);
  }

  /**
   * Start a new adaptive placement test session
   */
  async startPlacementTest(
    userId: number, 
    targetLanguage: string, 
    learningGoal?: string
  ): Promise<PlacementTestSession> {
    const session = await this.storage.createPlacementTestSession({
      userId,
      targetLanguage,
      learningGoal: learningGoal || 'general',
      status: 'in_progress',
      currentSkill: 'speaking',
      currentQuestionIndex: 0
    });

    return session;
  }

  /**
   * Get next question for adaptive testing
   */
  async getNextQuestion(sessionId: number): Promise<PlacementTestQuestion | null> {
    const session = await this.storage.getPlacementTestSession(sessionId);
    if (!session) {
      throw new Error('Placement test session not found');
    }

    // Check if test should be terminated due to time limit
    const elapsedMinutes = this.getElapsedMinutes(session);
    if (elapsedMinutes >= this.defaultConfig.maxTotalMinutes) {
      await this.completeTest(sessionId);
      return null;
    }

    const testState = await this.getTestState(sessionId);
    
    // Start with speaking if no questions answered yet
    if (session.currentQuestionIndex === 0) {
      return await this.getQuestionForLevel('speaking', 'B1'); // Start at B1 level
    }

    // Continue with adaptive logic
    const currentSkillState = testState.get(session.currentSkill as Skill);
    if (!currentSkillState) {
      throw new Error(`Invalid skill state for ${session.currentSkill}`);
    }

    // Check if we should move to next skill
    if (currentSkillState.completed || 
        currentSkillState.questionsAsked >= this.defaultConfig.maxQuestionsPerSkill) {
      const nextSkill = await this.getNextSkill(sessionId, testState);
      if (!nextSkill) {
        await this.completeTest(sessionId);
        return null;
      }
      
      // Update session to next skill
      await this.storage.updatePlacementTestSession(sessionId, {
        currentSkill: nextSkill
      });
      
      // Determine starting level for next skill based on speaking results
      const nextLevel = this.determineSkillStartingLevel(nextSkill, testState);
      return await this.getQuestionForLevel(nextSkill, nextLevel);
    }

    // Continue with current skill - make adaptive decision
    const adaptiveDecision = await this.makeAdaptiveDecision(currentSkillState);
    if (!adaptiveDecision.shouldContinueTesting || !adaptiveDecision.nextQuestionLevel) {
      // Mark current skill as completed and move to next
      currentSkillState.completed = true;
      return await this.getNextQuestion(sessionId);
    }

    return await this.getQuestionForLevel(session.currentSkill as Skill, adaptiveDecision.nextQuestionLevel);
  }

  /**
   * Submit response and get evaluation
   */
  async submitResponse(
    sessionId: number,
    questionId: number,
    userResponse: any
  ): Promise<{
    evaluation: CEFREvaluationResult;
  }> {
    
    const session = await this.storage.getPlacementTestSession(sessionId);
    const question = await this.storage.getPlacementTestQuestion(questionId);
    
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (!question) {
      throw new Error('Question not found');
    }

    // Create response record
    const response = await this.storage.createPlacementTestResponse({
      sessionId,
      questionId,
      userResponse,
      responseStartTime: new Date(),
      responseEndTime: new Date()
    });

    // Evaluate response using CEFR criteria
    const evaluation = await this.evaluateResponse(question, userResponse);
    
    // Update response with AI scoring
    await this.storage.updatePlacementTestResponse(response.id, {
      aiScore: evaluation.score,
      cefrIndicators: evaluation.metCriteria,
      detailedFeedback: {
        feedback: evaluation.detailedFeedback,
        recommendations: evaluation.recommendations
      }
    });

    // Update session question index
    await this.storage.updatePlacementTestSession(sessionId, {
      currentQuestionIndex: session.currentQuestionIndex + 1
    });

    // Don't call getNextQuestion here to avoid recursion - let client fetch it separately
    
    return {
      evaluation
    };
  }

  /**
   * Complete placement test and generate results
   */
  async completeTest(sessionId: number): Promise<PlacementTestSession> {
    const testState = await this.getTestState(sessionId);
    
    // Evaluate each skill
    const skillEvaluations: Record<Skill, CEFREvaluationResult> = {} as any;
    
    for (const [skill, state] of testState) {
      if (state.responses.length > 0) {
        skillEvaluations[skill] = await this.evaluateSkillFromResponses(skill, state.responses);
      } else {
        // Provide default evaluation for untested skills
        skillEvaluations[skill] = {
          level: 'B1',
          score: 60,
          confidence: 0.3,
          metCriteria: [],
          unmetCriteria: ['Insufficient data'],
          detailedFeedback: `${skill} skill not assessed due to time constraints`,
          recommendations: [`Complete additional ${skill} assessment`]
        };
      }
    }

    // Determine overall level
    const overallResult = this.cefrScoring.determineOverallLevel(skillEvaluations);
    
    // Extract strengths and recommendations
    const allRecommendations = Object.values(skillEvaluations)
      .flatMap(evaluation => evaluation.recommendations);
    
    const strengths = Object.entries(skillEvaluations)
      .filter(([_, evaluation]) => evaluation.confidence > 0.7)
      .map(([skill, evaluation]) => `Strong ${skill} ability at ${evaluation.level} level`);

    const weaknesses = Object.entries(skillEvaluations)
      .filter(([_, evaluation]) => evaluation.confidence < 0.6)
      .map(([skill, evaluation]) => `${skill} needs improvement`);

    // Update session with final results
    const updatedSession = await this.storage.updatePlacementTestSession(sessionId, {
      status: 'completed',
      completedAt: new Date(),
      overallCEFRLevel: overallResult.level,
      speakingLevel: skillEvaluations.speaking?.level,
      listeningLevel: skillEvaluations.listening?.level,
      readingLevel: skillEvaluations.reading?.level,
      writingLevel: skillEvaluations.writing?.level,
      overallScore: this.calculateOverallScore(skillEvaluations),
      speakingScore: skillEvaluations.speaking?.score,
      listeningScore: skillEvaluations.listening?.score,
      readingScore: skillEvaluations.reading?.score,
      writingScore: skillEvaluations.writing?.score,
      strengths,
      weaknesses,
      recommendations: allRecommendations,
      confidenceScore: overallResult.confidence * 100
    });

    return updatedSession;
  }

  /**
   * Get test state for all skills
   */
  private async getTestState(sessionId: number): Promise<Map<Skill, SkillTestState>> {
    const responses = await this.storage.getPlacementTestResponses(sessionId);
    const testState = new Map<Skill, SkillTestState>();

    // Initialize test state for all skills
    const skills: Skill[] = ['speaking', 'listening', 'reading', 'writing'];
    for (const skill of skills) {
      testState.set(skill, {
        skill,
        currentLevel: 'B1',
        questionsAsked: 0,
        responses: [],
        confidence: 0,
        completed: false
      });
    }

    // Update state based on responses
    for (const response of responses) {
      const question = await this.storage.getPlacementTestQuestion(response.questionId);
      if (question) {
        const skillState = testState.get(question.skill as Skill);
        if (skillState) {
          skillState.responses.push(response);
          skillState.questionsAsked++;
          skillState.currentLevel = question.cefrLevel as CEFRLevel;
        }
      }
    }

    return testState;
  }

  /**
   * Make adaptive decision for next question
   */
  private async makeAdaptiveDecision(skillState: SkillTestState): Promise<AdaptiveDecision> {
    if (skillState.responses.length === 0) {
      return {
        nextQuestionLevel: 'B1',
        shouldContinueTesting: true,
        reasoning: 'Starting assessment',
        confidence: 0.5
      };
    }

    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(skillState);
    const adaptiveStrategy = this.determineAdaptiveStrategy(skillState, performanceMetrics);

    return adaptiveStrategy;
  }

  /**
   * Calculate sophisticated performance metrics
   */
  private calculatePerformanceMetrics(skillState: SkillTestState): {
    averageScore: number;
    scoreConsistency: number;
    improvementTrend: number;
    levelStability: number;
    confidence: number;
  } {
    const scores = skillState.responses.map(r => {
      const score = r.aiScore;
      return typeof score === 'string' ? parseFloat(score) : (score || 60);
    });
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calculate score consistency (lower variance = higher consistency)  
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
    const scoreConsistency = Math.max(0, 1 - (variance / 1000)); // Normalize to 0-1

    // Calculate improvement trend
    let improvementTrend = 0;
    if (scores.length >= 2) {
      const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
      improvementTrend = (secondAvg - firstAvg) / 100; // Normalized improvement
    }

    // Level stability - how consistent performance is at current level
    const currentLevelPerformance = scores.filter((_, index) => {
      const response = skillState.responses[index];
      return response && response.nextQuestionLevel === skillState.currentLevel;
    });
    
    const levelStability = currentLevelPerformance.length > 0 ? 
      (currentLevelPerformance.reduce((sum, score) => sum + (score >= 70 ? 1 : 0), 0) / currentLevelPerformance.length) : 0;

    // Overall confidence based on multiple factors
    const confidence = Math.min(1, (
      scoreConsistency * 0.3 + 
      levelStability * 0.4 + 
      (skillState.questionsAsked >= 2 ? 0.3 : 0.1)
    ));

    return {
      averageScore,
      scoreConsistency,
      improvementTrend,
      levelStability,
      confidence
    };
  }

  /**
   * Determine adaptive strategy based on performance metrics
   */
  private determineAdaptiveStrategy(skillState: SkillTestState, metrics: {
    averageScore: number;
    scoreConsistency: number;
    improvementTrend: number;
    levelStability: number;
    confidence: number;
  }): AdaptiveDecision {
    const currentIndex = CEFRLevels.indexOf(skillState.currentLevel);
    let nextLevel: CEFRLevel = skillState.currentLevel;
    let shouldContinue = true;
    let reasoning = '';

    // Sophisticated level adjustment logic - aligned with CEFR scoring thresholds
    if (metrics.averageScore >= 90) {
      // Excellent performance - move up
      nextLevel = CEFRLevels[Math.min(currentIndex + 1, CEFRLevels.length - 1)];
      reasoning = `Excellent performance (avg: ${metrics.averageScore.toFixed(1)}) - moving to ${nextLevel}`;
    } else if (metrics.averageScore >= 80) {
      // Strong performance - stay at level but may complete
      nextLevel = skillState.currentLevel;
      if (skillState.questionsAsked >= this.defaultConfig.minQuestionsPerSkill && metrics.confidence >= 0.8) {
        shouldContinue = false;
        reasoning = `Strong performance at ${nextLevel} level - assessment complete`;
      } else {
        reasoning = `Strong performance at ${nextLevel} - confirming level`;
      }
    } else if (metrics.averageScore >= 70) {
      // Good performance - stay at current level
      nextLevel = skillState.currentLevel;
      reasoning = `Good performance (avg: ${metrics.averageScore.toFixed(1)}) - staying at ${nextLevel} to confirm level`;
    } else if (metrics.averageScore >= 60) {
      // Adequate performance but may need lower level - move down one level
      nextLevel = CEFRLevels[Math.max(currentIndex - 1, 0)];
      reasoning = `Adequate performance (avg: ${metrics.averageScore.toFixed(1)}) - adjusting to ${nextLevel}`;
    } else if (metrics.averageScore >= 45) {
      // Below target performance - move down one level
      nextLevel = CEFRLevels[Math.max(currentIndex - 1, 0)];
      reasoning = `Below target performance (avg: ${metrics.averageScore.toFixed(1)}) - adjusting to ${nextLevel}`;
    } else {
      // Poor performance - move down significantly (2 levels if possible)
      const newIndex = Math.max(currentIndex - 2, 0);
      nextLevel = CEFRLevels[newIndex];
      if (newIndex === 0 && skillState.questionsAsked >= 2) {
        shouldContinue = false;
        reasoning = `Very poor performance at A1 level - placement at ${skillState.currentLevel}`;
      } else {
        reasoning = `Poor performance (avg: ${metrics.averageScore.toFixed(1)}) - significant adjustment to ${nextLevel}`;
      }
    }

    // Stopping criteria
    if (skillState.questionsAsked >= this.defaultConfig.maxQuestionsPerSkill) {
      shouldContinue = false;
      reasoning += ' - maximum questions reached';
    }

    // High confidence early termination
    if (metrics.confidence >= 0.9 && skillState.questionsAsked >= this.defaultConfig.minQuestionsPerSkill) {
      shouldContinue = false;
      reasoning += ' - high confidence achieved';
    }

    return {
      nextQuestionLevel: shouldContinue ? nextLevel : null,
      shouldContinueTesting: shouldContinue,
      reasoning,
      confidence: metrics.confidence
    };
  }

  /**
   * Determine starting level for skill based on speaking results
   */
  private determineSkillStartingLevel(skill: Skill, testState: Map<Skill, SkillTestState>): CEFRLevel {
    const speakingState = testState.get('speaking');
    if (!speakingState || speakingState.responses.length === 0) {
      return 'B1'; // Default starting level
    }

    // Calculate speaking performance metrics for more accurate influence
    const speakingMetrics = this.calculatePerformanceMetrics(speakingState);
    const speakingLevel = speakingState.currentLevel;
    const speakingIndex = CEFRLevels.indexOf(speakingLevel);

    // Skill-specific adjustments based on speaking performance
    let adjustment = 0;
    
    switch (skill) {
      case 'listening':
        // Listening closely correlates with speaking - minimal adjustment
        if (speakingMetrics.confidence >= 0.8) {
          adjustment = 0; // Same level if high confidence
        } else {
          adjustment = -1; // One level down if lower confidence
        }
        break;
        
      case 'reading':
        // Reading often higher than speaking for many learners
        if (speakingMetrics.averageScore >= 80) {
          adjustment = 0; // Same level for strong speakers
        } else if (speakingMetrics.averageScore >= 60) {
          adjustment = 0; // Same level for moderate speakers
        } else {
          adjustment = -1; // Lower level for weak speakers
        }
        break;
        
      case 'writing':
        // Writing assessment should be based on actual performance, not assumptions
        // Start at appropriate level based on speaking performance with minimal bias
        if (speakingMetrics.averageScore >= 85 && speakingMetrics.confidence >= 0.8) {
          adjustment = 0; // Same level for strong speakers - let actual performance determine level
        } else if (speakingMetrics.averageScore >= 70) {
          adjustment = 0; // Same level for good speakers
        } else if (speakingMetrics.averageScore >= 60) {
          adjustment = -1; // One level down for moderate speakers
        } else {
          adjustment = -1; // One level down for weaker speakers only
        }
        break;
        
      default:
        adjustment = -1;
    }

    // Apply confidence-based fine-tuning
    if (speakingMetrics.confidence < 0.6) {
      adjustment -= 1; // Be more conservative if speaking assessment wasn't confident
    } else if (speakingMetrics.confidence >= 0.9 && speakingMetrics.averageScore >= 80) {
      adjustment += 1; // Be more aggressive if very confident in speaking level
    }

    // Calculate final level with bounds checking
    const finalIndex = Math.max(0, Math.min(CEFRLevels.length - 1, speakingIndex + adjustment));
    
    
    return CEFRLevels[finalIndex];
  }

  /**
   * Get next skill to test
   */
  private async getNextSkill(sessionId: number, testState: Map<Skill, SkillTestState>): Promise<Skill | null> {
    const skillOrder: Skill[] = ['speaking', 'listening', 'reading', 'writing'];
    
    for (const skill of skillOrder) {
      const state = testState.get(skill);
      if (state && !state.completed) {
        return skill;
      }
    }
    
    return null; // All skills completed
  }

  /**
   * Get elapsed minutes since test start
   */
  private getElapsedMinutes(session: PlacementTestSession): number {
    const now = new Date();
    const start = new Date(session.startedAt);
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * Generate specific question content based on skill and CEFR level
   */
  private generateQuestionContent(skill: Skill, level: CEFRLevel): {
    type: string;
    title: string;
    prompt: string;
    content: any;
    expectedDurationSeconds: number;
  } {
    if (skill === 'speaking') {
      return this.generateSpeakingQuestionContent(level);
    } else if (skill === 'writing') {
      return this.generateWritingQuestionContent(level);
    } else if (skill === 'reading') {
      return this.generateReadingQuestionContent(level);
    } else if (skill === 'listening') {
      return this.generateListeningQuestionContent(level);
    }
    
    // Fallback - ensure skill is treated as string
    const skillName = String(skill);
    return {
      type: `${skillName}_assessment`,
      title: `${skillName.charAt(0).toUpperCase() + skillName.slice(1)} Assessment - ${level} Level`,
      prompt: `Please complete this ${skillName} task at ${level} level.`,
      content: {},
      expectedDurationSeconds: 120
    };
  }

  /**
   * Generate speaking question content for specific CEFR level
   */
  private generateSpeakingQuestionContent(level: CEFRLevel): {
    type: string;
    title: string;
    prompt: string;
    content: any;
    expectedDurationSeconds: number;
  } {
    const speakingQuestions = {
      'A1': {
        type: 'personal_introduction',
        title: 'Personal Introduction',
        prompt: 'Please introduce yourself. Tell us your name, where you are from, and what you like to do in your free time. Speak for about 1 minute.',
        content: {
          instructions: 'Speak clearly and try to use simple sentences. You can talk about your hobbies, family, or work.',
          keywords: ['name', 'country', 'hobby', 'family', 'work']
        },
        expectedDurationSeconds: 60
      },
      'A2': {
        type: 'daily_routine',
        title: 'Describe Your Daily Routine',
        prompt: 'Describe what you do on a typical day. Talk about your morning routine, work or studies, and evening activities. Try to speak for about 1-2 minutes.',
        content: {
          instructions: 'Use simple past and present tenses. Mention specific times if you can.',
          keywords: ['morning', 'work', 'study', 'evening', 'activities', 'time']
        },
        expectedDurationSeconds: 90
      },
      'B1': {
        type: 'opinion_expression',
        title: 'Express Your Opinion',
        prompt: 'What do you think about learning languages online? Give your opinion and explain why you think this way. Include both advantages and disadvantages. Speak for about 2 minutes.',
        content: {
          instructions: 'Express your opinion clearly and give reasons. Use connecting words like "because", "however", "also".',
          keywords: ['opinion', 'advantages', 'disadvantages', 'online learning', 'reasons']
        },
        expectedDurationSeconds: 120
      },
      'B2': {
        type: 'problem_solving',
        title: 'Problem Solving Discussion',
        prompt: 'Imagine you are planning to study abroad but you have limited budget. Discuss the challenges you might face and suggest some solutions. Speak for about 2-3 minutes.',
        content: {
          instructions: 'Identify problems clearly and propose practical solutions. Use conditional language like "if", "would", "could".',
          keywords: ['challenges', 'solutions', 'budget', 'study abroad', 'planning']
        },
        expectedDurationSeconds: 150
      },
      'C1': {
        type: 'abstract_discussion',
        title: 'Abstract Topic Discussion',
        prompt: 'Discuss the impact of artificial intelligence on education. Consider both current applications and future possibilities. Analyze the benefits and potential concerns. Speak for about 3 minutes.',
        content: {
          instructions: 'Analyze the topic from multiple perspectives. Use complex sentence structures and advanced vocabulary.',
          keywords: ['artificial intelligence', 'education', 'impact', 'benefits', 'concerns', 'future']
        },
        expectedDurationSeconds: 180
      },
      'C2': {
        type: 'critical_analysis',
        title: 'Critical Analysis',
        prompt: 'Critically analyze the statement: "Traditional education methods are becoming obsolete in the digital age." Present arguments for and against this view, and conclude with your own position. Speak for about 3-4 minutes.',
        content: {
          instructions: 'Demonstrate sophisticated argumentation skills. Use nuanced language and complex grammatical structures.',
          keywords: ['critical analysis', 'traditional education', 'digital age', 'arguments', 'position']
        },
        expectedDurationSeconds: 210
      }
    };

    return speakingQuestions[level] || speakingQuestions['B1'];
  }

  /**
   * Generate writing question content for specific CEFR level
   */
  private generateWritingQuestionContent(level: CEFRLevel): {
    type: string;
    title: string;
    prompt: string;
    content: any;
    expectedDurationSeconds: number;
  } {
    const writingQuestions = {
      'A1': {
        type: 'simple_description',
        title: 'Write About Yourself',
        prompt: 'Write a short paragraph about yourself. Include your name, age, country, and what you like to do.',
        content: {
          instructions: 'Use simple sentences. Write 3-4 sentences.',
          minWords: 30,
          maxWords: 60
        },
        expectedDurationSeconds: 300
      },
      'A2': {
        type: 'email_writing',
        title: 'Write an Email',
        prompt: 'Write an email to a friend about your weekend plans. Tell them what you are going to do and invite them to join you.',
        content: {
          instructions: 'Use appropriate email format. Write 60-80 words.',
          minWords: 60,
          maxWords: 80
        },
        expectedDurationSeconds: 400
      },
      'B1': {
        type: 'opinion_essay',
        title: 'Opinion Essay',
        prompt: 'Write your opinion about learning English online. Give reasons for your opinion with examples.',
        content: {
          instructions: 'Organize your ideas clearly. Write 100-150 words.',
          minWords: 100,
          maxWords: 150
        },
        expectedDurationSeconds: 600
      },
      'B2': {
        type: 'formal_letter',
        title: 'Formal Letter',
        prompt: 'Write a formal letter to your local government suggesting improvements to public transportation in your area.',
        content: {
          instructions: 'Use formal language and proper letter structure. Write 150-200 words.',
          minWords: 150,
          maxWords: 200
        },
        expectedDurationSeconds: 800
      },
      'C1': {
        type: 'report_writing',
        title: 'Report Writing',
        prompt: 'Write a report analyzing the effects of remote work on productivity and work-life balance.',
        content: {
          instructions: 'Use report format with clear sections. Write 200-250 words.',
          minWords: 200,
          maxWords: 250
        },
        expectedDurationSeconds: 1000
      },
      'C2': {
        type: 'argumentative_essay',
        title: 'Argumentative Essay',
        prompt: 'Write an argumentative essay discussing whether universities should make attendance mandatory or optional.',
        content: {
          instructions: 'Present both sides and take a clear position. Write 250-300 words.',
          minWords: 250,
          maxWords: 300
        },
        expectedDurationSeconds: 1200
      }
    };

    return writingQuestions[level] || writingQuestions['B1'];
  }

  /**
   * Generate reading question content for specific CEFR level
   */
  private generateReadingQuestionContent(level: CEFRLevel): {
    type: string;
    title: string;
    prompt: string;
    content: any;
    expectedDurationSeconds: number;
  } {
    return {
      type: 'reading_comprehension',
      title: `Reading Comprehension - ${level} Level`,
      prompt: 'Read the passage below and answer the questions that follow.',
      content: {
        passage: 'Reading passage would be inserted here based on CEFR level...',
        questions: [
          'Sample question 1',
          'Sample question 2',
          'Sample question 3'
        ]
      },
      expectedDurationSeconds: 300
    };
  }

  /**
   * Generate listening question content for specific CEFR level  
   */
  private generateListeningQuestionContent(level: CEFRLevel): {
    type: string;
    title: string;
    prompt: string;
    content: any;
    expectedDurationSeconds: number;
  } {
    return {
      type: 'listening_comprehension',
      title: `Listening Comprehension - ${level} Level`,
      prompt: 'Listen to the audio and answer the questions that follow.',
      content: {
        audioUrl: '/audio/sample-listening.mp3',
        questions: [
          'Sample listening question 1',
          'Sample listening question 2',
          'Sample listening question 3'
        ]
      },
      expectedDurationSeconds: 240
    };
  }

  /**
   * Get question for specific skill and level
   */
  private async getQuestionForLevel(skill: Skill, level: CEFRLevel): Promise<PlacementTestQuestion | null> {
    // Generate specific content based on skill and level
    const questionContent = this.generateQuestionContent(skill, level);
    
    // Create and store question in database
    const questionData = {
      skill,
      level,
      type: questionContent.type,
      title: questionContent.title,
      prompt: questionContent.prompt,
      content: questionContent.content,
      responseType: skill === 'speaking' ? 'audio' : 'text',
      expectedDurationSeconds: questionContent.expectedDurationSeconds,
      estimatedMinutes: Math.ceil(questionContent.expectedDurationSeconds / 60)
    };

    // Store the question in the database
    const createdQuestion = await this.storage.createPlacementTestQuestion(questionData);
    
    return {
      id: createdQuestion.id,
      skill,
      cefrLevel: level,
      questionType: questionContent.type,
      title: questionContent.title,
      prompt: questionContent.prompt,
      content: questionContent.content,
      responseType: skill === 'speaking' ? 'audio' : 'text',
      expectedDurationSeconds: questionContent.expectedDurationSeconds,
      scoringCriteria: { level, skill },
      maxScore: 100,
      difficultyWeight: '0.50',
      prerequisiteSkills: [],
      tags: [skill, level],
      estimatedCompletionMinutes: Math.ceil(questionContent.expectedDurationSeconds / 60),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as PlacementTestQuestion;
  }

  /**
   * Evaluate a single response
   */
  private async evaluateResponse(question: PlacementTestQuestion, userResponse: any): Promise<CEFREvaluationResult> {
    const skill = question.skill as Skill;
    const level = question.cefrLevel as CEFRLevel;

    switch (skill) {
      case 'speaking':
        return await this.cefrScoring.evaluateSpeaking({
          audioUrl: userResponse.audioUrl,
          transcript: userResponse.transcript || '',
          duration: userResponse.duration || 0,
          questionType: question.questionType,
          prompt: question.prompt
        }, level);
        
      case 'writing':
        return await this.cefrScoring.evaluateWriting({
          text: userResponse.text || '',
          wordCount: (userResponse.text || '').split(/\s+/).length,
          timeSpent: userResponse.timeSpent || 0,
          prompt: question.prompt
        }, level);
        
      case 'reading':
        // Type guard for reading content
        const readingContent = question.content as { passage?: string } || {};
        return await this.cefrScoring.evaluateReading({
          answers: userResponse.answers || {},
          passage: readingContent.passage || '',
          timeSpent: userResponse.timeSpent || 0
        }, level);
        
      case 'listening':
        // Type guard for listening content
        const listeningContent = question.content as { audioUrl?: string } || {};
        return await this.cefrScoring.evaluateListening({
          answers: userResponse.answers || {},
          audioUrl: listeningContent.audioUrl || '',
          timeSpent: userResponse.timeSpent || 0
        }, level);
        
      default:
        throw new Error(`Unknown skill: ${skill}`);
    }
  }

  /**
   * Evaluate skill from all responses using actual performance data
   */
  private async evaluateSkillFromResponses(skill: Skill, responses: PlacementTestResponse[]): Promise<CEFREvaluationResult> {
    if (responses.length === 0) {
      return {
        level: 'B1',
        score: 60,
        confidence: 0.3,
        metCriteria: [],
        unmetCriteria: ['No responses available'],
        detailedFeedback: `No ${skill} responses to evaluate`,
        recommendations: [`Complete ${skill} assessment`]
      };
    }

    
    // Calculate performance metrics from all responses
    const scores = responses.map(r => {
      const score = r.aiScore;
      return typeof score === 'string' ? parseFloat(score) : (score || 60);
    });
    
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calculate performance consistency
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const consistency = Math.max(0, 1 - (variance / 1000)); // Normalize to 0-1
    
    // Get the levels tested during the assessment
    const levelsAttempted = await Promise.all(
      responses.map(async r => {
        const question = await this.storage.getPlacementTestQuestion(r.questionId);
        return question ? question.cefrLevel as CEFRLevel : 'B1';
      })
    );
    
    // Find the highest level where performance was strong
    let determinedLevel: CEFRLevel = 'A1';
    let confidence = 0.5;
    
    // Group responses by level tested
    const performanceByLevel = new Map<CEFRLevel, number[]>();
    for (let i = 0; i < responses.length; i++) {
      const level = levelsAttempted[i];
      if (!performanceByLevel.has(level)) {
        performanceByLevel.set(level, []);
      }
      performanceByLevel.get(level)!.push(scores[i]);
    }
    
    // Determine level based on actual performance at each CEFR level
    const levelIndices = CEFRLevels.map(level => CEFRLevels.indexOf(level));
    let highestValidLevel = 0; // A1 index
    
    for (const [level, levelScores] of performanceByLevel) {
      const levelIndex = CEFRLevels.indexOf(level);
      const levelAvg = levelScores.reduce((sum, score) => sum + score, 0) / levelScores.length;
      
      
      // Strong performance threshold for confirming a level
      if (levelAvg >= 75 && levelScores.length >= 1) {
        highestValidLevel = Math.max(highestValidLevel, levelIndex);
        confidence = Math.max(confidence, 0.8);
      } else if (levelAvg >= 65 && levelScores.length >= 2) {
        // Good performance with multiple responses
        highestValidLevel = Math.max(highestValidLevel, levelIndex);
        confidence = Math.max(confidence, 0.7);
      } else if (levelAvg >= 55) {
        // Moderate performance - can confirm this level with lower confidence
        highestValidLevel = Math.max(highestValidLevel, levelIndex);
        confidence = Math.max(confidence, 0.6);
      }
    }
    
    determinedLevel = CEFRLevels[highestValidLevel];
    
    
    // Generate appropriate feedback
    const metCriteria: string[] = [];
    const unmetCriteria: string[] = [];
    const recommendations: string[] = [];
    
    if (confidence >= 0.8) {
      metCriteria.push(`Strong ${determinedLevel} level ${skill} performance demonstrated`);
      if (highestValidLevel < CEFRLevels.length - 1) {
        recommendations.push(`Ready to practice ${CEFRLevels[highestValidLevel + 1]} level ${skill} activities`);
      }
    } else if (confidence >= 0.6) {
      metCriteria.push(`${determinedLevel} level ${skill} ability shown`);
      recommendations.push(`Continue practicing ${determinedLevel} level activities to build confidence`);
    } else {
      metCriteria.push(`Basic ${skill} ability observed`);
      unmetCriteria.push(`Inconsistent performance at ${determinedLevel} level`);
      recommendations.push(`Focus on foundational ${skill} skills`);
      recommendations.push(`Practice regularly to improve consistency`);
    }
    
    const detailedFeedback = `${skill.charAt(0).toUpperCase() + skill.slice(1)} assessment completed with ${responses.length} responses. ` +
                           `Average performance: ${avgScore.toFixed(1)}/100. ` +
                           `Performance consistency: ${(consistency * 100).toFixed(1)}%. ` +
                           `Determined ${skill} level: ${determinedLevel}.`;

    return {
      level: determinedLevel,
      score: avgScore,
      confidence,
      metCriteria,
      unmetCriteria,
      detailedFeedback,
      recommendations
    };
  }

  /**
   * Calculate overall score from skill evaluations
   */
  private calculateOverallScore(skillEvaluations: Record<Skill, CEFREvaluationResult>): number {
    const scores = Object.values(skillEvaluations).map(evaluation => evaluation.score);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
}