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
    nextQuestion: PlacementTestQuestion | null;
  }> {
    const session = await this.storage.getPlacementTestSession(sessionId);
    const question = await this.storage.getPlacementTestQuestion(questionId);
    
    if (!session || !question) {
      throw new Error('Session or question not found');
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

    // Get next question
    const nextQuestion = await this.getNextQuestion(sessionId);

    return {
      evaluation,
      nextQuestion
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
      .flatMap(eval => eval.recommendations);
    
    const strengths = Object.entries(skillEvaluations)
      .filter(([_, eval]) => eval.confidence > 0.7)
      .map(([skill, eval]) => `Strong ${skill} ability at ${eval.level} level`);

    const weaknesses = Object.entries(skillEvaluations)
      .filter(([_, eval]) => eval.confidence < 0.6)
      .map(([skill, eval]) => `${skill} needs improvement`);

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

    const lastResponse = skillState.responses[skillState.responses.length - 1];
    const lastScore = lastResponse.aiScore || 60;

    // Simple adaptive logic - would be more sophisticated in production
    let nextLevel: CEFRLevel;
    let shouldContinue = true;
    let confidence = 0.7;

    if (lastScore >= 80) {
      // Move up a level
      const currentIndex = CEFRLevels.indexOf(skillState.currentLevel);
      nextLevel = CEFRLevels[Math.min(currentIndex + 1, CEFRLevels.length - 1)];
    } else if (lastScore >= 60) {
      // Stay at same level
      nextLevel = skillState.currentLevel;
      if (skillState.questionsAsked >= this.defaultConfig.minQuestionsPerSkill) {
        shouldContinue = false;
        confidence = 0.8;
      }
    } else {
      // Move down a level
      const currentIndex = CEFRLevels.indexOf(skillState.currentLevel);
      nextLevel = CEFRLevels[Math.max(currentIndex - 1, 0)];
    }

    // Stop if we've asked enough questions or confidence is high
    if (skillState.questionsAsked >= this.defaultConfig.maxQuestionsPerSkill) {
      shouldContinue = false;
    }

    return {
      nextQuestionLevel: nextLevel,
      shouldContinueTesting: shouldContinue,
      reasoning: `Based on score of ${lastScore}, ${shouldContinue ? 'continuing' : 'stopping'} at ${nextLevel}`,
      confidence
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

    // Use speaking results to influence other skill starting levels
    const speakingLevel = speakingState.currentLevel;
    const speakingIndex = CEFRLevels.indexOf(speakingLevel);

    // Start other skills slightly lower than speaking level
    const adjustedIndex = Math.max(0, speakingIndex - 1);
    return CEFRLevels[adjustedIndex];
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
   * Get question for specific skill and level
   */
  private async getQuestionForLevel(skill: Skill, level: CEFRLevel): Promise<PlacementTestQuestion | null> {
    // This would query the database for appropriate questions
    // For now, returning a mock question structure
    return {
      id: Math.floor(Math.random() * 1000),
      skill,
      cefrLevel: level,
      questionType: `${skill}_assessment`,
      title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} Assessment - ${level} Level`,
      prompt: `Please complete this ${skill} task at ${level} level.`,
      content: { /* Question-specific content */ },
      responseType: skill === 'speaking' ? 'audio' : 'text',
      expectedDurationSeconds: 120,
      scoringCriteria: { level, skill },
      maxScore: 100,
      difficultyWeight: 0.5,
      prerequisiteSkills: [],
      tags: [skill, level],
      estimatedCompletionMinutes: 2,
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
        return await this.cefrScoring.evaluateReading({
          answers: userResponse.answers || {},
          passage: question.content.passage || '',
          timeSpent: userResponse.timeSpent || 0
        }, level);
        
      case 'listening':
        return await this.cefrScoring.evaluateListening({
          answers: userResponse.answers || {},
          audioUrl: question.content.audioUrl || '',
          timeSpent: userResponse.timeSpent || 0
        }, level);
        
      default:
        throw new Error(`Unknown skill: ${skill}`);
    }
  }

  /**
   * Evaluate skill from all responses
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

    // Average scores and determine final level
    const avgScore = responses.reduce((sum, r) => sum + (r.aiScore || 60), 0) / responses.length;
    
    // Determine level based on average score
    let level: CEFRLevel;
    if (avgScore >= 90) level = 'C2';
    else if (avgScore >= 80) level = 'C1';
    else if (avgScore >= 70) level = 'B2';
    else if (avgScore >= 60) level = 'B1';
    else if (avgScore >= 50) level = 'A2';
    else level = 'A1';

    return {
      level,
      score: avgScore,
      confidence: responses.length >= 2 ? 0.8 : 0.6,
      metCriteria: [`Demonstrates ${level} level ${skill} ability`],
      unmetCriteria: [],
      detailedFeedback: `${skill} assessment shows ${level} proficiency with average score of ${avgScore.toFixed(1)}%`,
      recommendations: [`Continue developing ${skill} skills at ${level} level`]
    };
  }

  /**
   * Calculate overall score from skill evaluations
   */
  private calculateOverallScore(skillEvaluations: Record<Skill, CEFREvaluationResult>): number {
    const scores = Object.values(skillEvaluations).map(eval => eval.score);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
}