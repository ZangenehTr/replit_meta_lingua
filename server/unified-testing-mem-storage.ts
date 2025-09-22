// ============================================================================
// TRUE IN-MEMORY STORAGE IMPLEMENTATION
// ============================================================================
// Pure Map-based storage with NO database dependencies

import { IUnifiedTestingStorage } from './unified-testing-storage';
import {
  type UnifiedQuestion, type InsertUnifiedQuestion,
  type UnifiedTestTemplate, type InsertUnifiedTestTemplate,
  type UnifiedTestSession, type InsertUnifiedTestSession,
  type UnifiedResponse, type InsertUnifiedResponse,
  type EvaluationRule, type InsertEvaluationRule,
  type AiGenerationTemplate, type InsertAiGenerationTemplate,
  type QuestionType, type Skill, type CEFRLevel, type TestType
} from "@shared/unified-testing-schema";

/**
 * Pure JavaScript Map-based storage implementation
 * NO database dependencies - uses only in-memory Maps
 * Implements complete IUnifiedTestingStorage interface
 */
export class TrueMapBasedUnifiedStorage implements IUnifiedTestingStorage {
  // ============================================================================
  // PURE MAP STORAGE - NO DATABASE DEPENDENCIES
  // ============================================================================
  private questions = new Map<number, UnifiedQuestion>();
  private templates = new Map<number, UnifiedTestTemplate>();
  private sessions = new Map<number, UnifiedTestSession>();
  private responses = new Map<number, UnifiedResponse>();
  private evaluationRulesMap = new Map<number, EvaluationRule>();
  private aiTemplates = new Map<number, AiGenerationTemplate>();
  
  // Auto-incrementing ID counter
  private nextId = 1;
  
  private getNextId(): number {
    return this.nextId++;
  }

  // ============================================================================
  // QUESTIONS MANAGEMENT
  // ============================================================================
  
  async createQuestion(question: InsertUnifiedQuestion): Promise<UnifiedQuestion> {
    const id = this.getNextId();
    const now = new Date();
    const newQuestion: UnifiedQuestion = {
      id,
      ...question,
      // Default values for required fields
      usageCount: 0,
      correctAnswerRate: null,
      averageResponseTime: null,
      difficultyRating: null,
      aiGenerated: false,
      antiPlagiarismVariations: [],
      isActive: true,
      version: 1,
      parentQuestionId: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
      updatedAt: now
    };
    
    this.questions.set(id, newQuestion);
    return newQuestion;
  }
  
  async getQuestion(id: number): Promise<UnifiedQuestion | undefined> {
    return this.questions.get(id);
  }
  
  async updateQuestion(id: number, updates: Partial<UnifiedQuestion>): Promise<UnifiedQuestion | undefined> {
    const existing = this.questions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.questions.set(id, updated);
    return updated;
  }
  
  async deleteQuestion(id: number): Promise<void> {
    this.questions.delete(id);
  }
  
  async getQuestionsByType(questionType: QuestionType): Promise<UnifiedQuestion[]> {
    return Array.from(this.questions.values()).filter(q => q.questionType === questionType);
  }
  
  async getQuestionsBySkill(skill: Skill): Promise<UnifiedQuestion[]> {
    return Array.from(this.questions.values()).filter(q => q.skill === skill);
  }
  
  async getQuestionsByCEFRLevel(level: CEFRLevel): Promise<UnifiedQuestion[]> {
    return Array.from(this.questions.values()).filter(q => q.cefrLevel === level);
  }
  
  async getQuestionsBySkillAndLevel(skill: Skill, level: CEFRLevel): Promise<UnifiedQuestion[]> {
    return Array.from(this.questions.values()).filter(q => q.skill === skill && q.cefrLevel === level);
  }
  
  async searchQuestions(criteria: {
    questionTypes?: QuestionType[];
    skills?: Skill[];
    cefrLevels?: CEFRLevel[];
    languages?: string[];
    tags?: string[];
    minQuality?: number;
    createdBy?: number;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ questions: UnifiedQuestion[]; total: number }> {
    let questions = Array.from(this.questions.values());
    
    // Apply filters
    if (criteria.questionTypes?.length) {
      questions = questions.filter(q => criteria.questionTypes!.includes(q.questionType));
    }
    
    if (criteria.skills?.length) {
      questions = questions.filter(q => criteria.skills!.includes(q.skill));
    }
    
    if (criteria.cefrLevels?.length) {
      questions = questions.filter(q => criteria.cefrLevels!.includes(q.cefrLevel));
    }
    
    if (criteria.languages?.length) {
      questions = questions.filter(q => criteria.languages!.includes(q.language));
    }
    
    if (criteria.isActive !== undefined) {
      questions = questions.filter(q => q.isActive === criteria.isActive);
    }
    
    if (criteria.createdBy) {
      questions = questions.filter(q => q.createdBy === criteria.createdBy);
    }
    
    if (criteria.minQuality) {
      questions = questions.filter(q => (q.difficultyRating || 0) >= criteria.minQuality!);
    }
    
    if (criteria.tags?.length) {
      questions = questions.filter(q => {
        const questionTags = q.content?.tags || [];
        return criteria.tags!.some(tag => questionTags.includes(tag));
      });
    }
    
    const total = questions.length;
    
    // Apply pagination
    if (criteria.offset) {
      questions = questions.slice(criteria.offset);
    }
    
    if (criteria.limit) {
      questions = questions.slice(0, criteria.limit);
    }
    
    return { questions, total };
  }
  
  async updateQuestionUsageStats(id: number, wasCorrect: boolean, responseTime: number): Promise<void> {
    const question = this.questions.get(id);
    if (question) {
      const currentUsage = question.usageCount || 0;
      const currentCorrectRate = question.correctAnswerRate || 0;
      const currentResponseTime = question.averageResponseTime || 0;
      
      // Update usage count
      question.usageCount = currentUsage + 1;
      
      // Calculate new correct answer rate
      const newCorrectRate = (currentCorrectRate * currentUsage + (wasCorrect ? 1 : 0)) / question.usageCount;
      question.correctAnswerRate = newCorrectRate;
      
      // Calculate new average response time
      const newResponseTime = (currentResponseTime * currentUsage + responseTime) / question.usageCount;
      question.averageResponseTime = newResponseTime;
      
      question.updatedAt = new Date();
    }
  }
  
  async getQuestionAnalytics(id: number): Promise<{
    usageCount: number;
    correctAnswerRate: number;
    averageResponseTime: number;
    difficultyRating: number;
  }> {
    const question = this.questions.get(id);
    return {
      usageCount: question?.usageCount || 0,
      correctAnswerRate: question?.correctAnswerRate || 0,
      averageResponseTime: question?.averageResponseTime || 0,
      difficultyRating: question?.difficultyRating || 0,
    };
  }
  
  async createMultipleQuestions(questions: InsertUnifiedQuestion[]): Promise<UnifiedQuestion[]> {
    const created: UnifiedQuestion[] = [];
    for (const question of questions) {
      const newQuestion = await this.createQuestion(question);
      created.push(newQuestion);
    }
    return created;
  }
  
  async duplicateQuestion(id: number, variations?: number): Promise<UnifiedQuestion[]> {
    const original = this.questions.get(id);
    if (!original) return [];
    
    const duplicates: UnifiedQuestion[] = [];
    const count = variations || 1;
    
    for (let i = 0; i < count; i++) {
      const duplicate = await this.createQuestion({
        ...original,
        title: `${original.title} (Copy ${i + 1})`,
        parentQuestionId: id,
        version: 1
      });
      duplicates.push(duplicate);
    }
    
    return duplicates;
  }

  // ============================================================================
  // TEST TEMPLATES MANAGEMENT
  // ============================================================================
  
  async createTestTemplate(template: InsertUnifiedTestTemplate): Promise<UnifiedTestTemplate> {
    const id = this.getNextId();
    const now = new Date();
    const newTemplate: UnifiedTestTemplate = {
      id,
      ...template,
      // Default values
      usageCount: 0,
      averageScore: null,
      averageCompletionTime: null,
      userRating: null,
      isActive: true,
      version: 1,
      createdAt: now,
      updatedAt: now
    };
    
    this.templates.set(id, newTemplate);
    return newTemplate;
  }
  
  async getTestTemplate(id: number): Promise<UnifiedTestTemplate | undefined> {
    return this.templates.get(id);
  }
  
  async updateTestTemplate(id: number, updates: Partial<UnifiedTestTemplate>): Promise<UnifiedTestTemplate | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.templates.set(id, updated);
    return updated;
  }
  
  async deleteTestTemplate(id: number): Promise<void> {
    this.templates.delete(id);
  }
  
  async getTestTemplatesByType(testType: TestType): Promise<UnifiedTestTemplate[]> {
    return Array.from(this.templates.values()).filter(t => t.testType === testType);
  }
  
  async getPublicTestTemplates(): Promise<UnifiedTestTemplate[]> {
    return Array.from(this.templates.values()).filter(t => t.isPublic);
  }
  
  async getUserTestTemplates(userId: number): Promise<UnifiedTestTemplate[]> {
    return Array.from(this.templates.values()).filter(t => t.createdBy === userId);
  }
  
  async getTemplateUsageStats(id: number): Promise<{
    usageCount: number;
    averageScore: number;
    averageCompletionTime: number;
    userRating: number;
  }> {
    const template = this.templates.get(id);
    return {
      usageCount: template?.usageCount || 0,
      averageScore: template?.averageScore || 0,
      averageCompletionTime: template?.averageCompletionTime || 0,
      userRating: template?.userRating || 0,
    };
  }

  // ============================================================================
  // TEST SESSIONS MANAGEMENT
  // ============================================================================
  
  async createTestSession(session: InsertUnifiedTestSession): Promise<UnifiedTestSession> {
    const id = this.getNextId();
    const now = new Date();
    const newSession: UnifiedTestSession = {
      id,
      ...session,
      // Default values
      status: 'in_progress',
      currentSectionId: null,
      currentQuestionIndex: 0,
      startedAt: now,
      pausedAt: null,
      resumedAt: null,
      completedAt: null,
      expiresAt: null,
      totalTimeSpent: 0,
      questionsAttempted: 0,
      questionsCompleted: 0,
      sectionsCompleted: 0,
      adaptiveState: null,
      results: null,
      aiAnalysis: null,
      ipAddress: null,
      userAgent: null,
      deviceInfo: null,
      createdAt: now,
      updatedAt: now
    };
    
    this.sessions.set(id, newSession);
    return newSession;
  }
  
  async getTestSession(id: number): Promise<UnifiedTestSession | undefined> {
    return this.sessions.get(id);
  }
  
  async updateTestSession(id: number, updates: Partial<UnifiedTestSession>): Promise<UnifiedTestSession | undefined> {
    const existing = this.sessions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.sessions.set(id, updated);
    return updated;
  }
  
  async getUserTestSessions(userId: number, status?: string): Promise<UnifiedTestSession[]> {
    let sessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
    if (status) {
      sessions = sessions.filter(s => s.status === status);
    }
    return sessions;
  }
  
  async getActiveTestSessions(userId: number): Promise<UnifiedTestSession[]> {
    return Array.from(this.sessions.values()).filter(s => 
      s.userId === userId && ['in_progress', 'paused'].includes(s.status || '')
    );
  }
  
  async getCompletedTestSessions(userId: number): Promise<UnifiedTestSession[]> {
    return Array.from(this.sessions.values()).filter(s => 
      s.userId === userId && s.status === 'completed'
    );
  }
  
  async getUserTestHistory(userId: number, limit?: number): Promise<UnifiedTestSession[]> {
    let sessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (limit) {
      sessions = sessions.slice(0, limit);
    }
    
    return sessions;
  }
  
  async getSessionsByTemplate(templateId: number): Promise<UnifiedTestSession[]> {
    return Array.from(this.sessions.values()).filter(s => s.templateId === templateId);
  }

  // ============================================================================
  // RESPONSES MANAGEMENT
  // ============================================================================
  
  async createResponse(response: InsertUnifiedResponse): Promise<UnifiedResponse> {
    const id = this.getNextId();
    const now = new Date();
    const newResponse: UnifiedResponse = {
      id,
      ...response,
      // Default values
      autoScore: null,
      manualScore: null,
      finalScore: null,
      maxPossibleScore: 100,
      isCorrect: null,
      evaluationDetails: null,
      aiEvaluation: null,
      reviewStatus: 'auto_scored',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      responseTime: null,
      wasGuessed: false,
      difficultyPerceived: null,
      createdAt: now
    };
    
    this.responses.set(id, newResponse);
    return newResponse;
  }
  
  async getResponse(id: number): Promise<UnifiedResponse | undefined> {
    return this.responses.get(id);
  }
  
  async updateResponse(id: number, updates: Partial<UnifiedResponse>): Promise<UnifiedResponse | undefined> {
    const existing = this.responses.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.responses.set(id, updated);
    return updated;
  }
  
  async getSessionResponses(sessionId: number): Promise<UnifiedResponse[]> {
    return Array.from(this.responses.values()).filter(r => r.sessionId === sessionId);
  }
  
  async getQuestionResponses(questionId: number): Promise<UnifiedResponse[]> {
    return Array.from(this.responses.values()).filter(r => r.questionId === questionId);
  }
  
  async getResponsesNeedingReview(): Promise<UnifiedResponse[]> {
    return Array.from(this.responses.values()).filter(r => r.reviewStatus === 'pending_review');
  }
  
  async getResponseAnalytics(sessionId: number): Promise<{
    totalResponses: number;
    correctResponses: number;
    averageScore: number;
    totalTimeSpent: number;
  }> {
    const responses = this.responses.values();
    const sessionResponses = Array.from(responses).filter(r => r.sessionId === sessionId);
    
    const totalResponses = sessionResponses.length;
    const correctResponses = sessionResponses.filter(r => r.isCorrect).length;
    const scores = sessionResponses.map(r => r.finalScore || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const totalTimeSpent = sessionResponses.reduce((total, r) => total + (r.timeSpent || 0), 0);
    
    return {
      totalResponses,
      correctResponses,
      averageScore,
      totalTimeSpent
    };
  }

  // ============================================================================
  // EVALUATION RULES MANAGEMENT
  // ============================================================================
  
  async createEvaluationRule(rule: InsertEvaluationRule): Promise<EvaluationRule> {
    const id = this.getNextId();
    const now = new Date();
    const newRule: EvaluationRule = {
      id,
      ...rule,
      // Default values
      usageCount: 0,
      accuracyRate: null,
      averageProcessingTime: null,
      isActive: true,
      version: 1,
      createdAt: now,
      updatedAt: now
    };
    
    this.evaluationRulesMap.set(id, newRule);
    return newRule;
  }
  
  async getEvaluationRule(id: number): Promise<EvaluationRule | undefined> {
    return this.evaluationRulesMap.get(id);
  }
  
  async updateEvaluationRule(id: number, updates: Partial<EvaluationRule>): Promise<EvaluationRule | undefined> {
    const existing = this.evaluationRulesMap.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.evaluationRulesMap.set(id, updated);
    return updated;
  }
  
  async deleteEvaluationRule(id: number): Promise<void> {
    this.evaluationRulesMap.delete(id);
  }
  
  async getEvaluationRulesByType(questionTypes: QuestionType[]): Promise<EvaluationRule[]> {
    return Array.from(this.evaluationRulesMap.values()).filter(rule => 
      rule.questionTypes.some(type => questionTypes.includes(type))
    );
  }
  
  async getActiveEvaluationRules(): Promise<EvaluationRule[]> {
    return Array.from(this.evaluationRulesMap.values()).filter(rule => rule.isActive);
  }

  // ============================================================================
  // AI GENERATION TEMPLATES MANAGEMENT
  // ============================================================================
  
  async createAiGenerationTemplate(template: InsertAiGenerationTemplate): Promise<AiGenerationTemplate> {
    const id = this.getNextId();
    const now = new Date();
    const newTemplate: AiGenerationTemplate = {
      id,
      ...template,
      // Default values
      usageCount: 0,
      successRate: null,
      averageQuality: null,
      averageGenerationTime: null,
      isActive: true,
      version: 1,
      createdAt: now,
      updatedAt: now
    };
    
    this.aiTemplates.set(id, newTemplate);
    return newTemplate;
  }
  
  async getAiGenerationTemplate(id: number): Promise<AiGenerationTemplate | undefined> {
    return this.aiTemplates.get(id);
  }
  
  async updateAiGenerationTemplate(id: number, updates: Partial<AiGenerationTemplate>): Promise<AiGenerationTemplate | undefined> {
    const existing = this.aiTemplates.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.aiTemplates.set(id, updated);
    return updated;
  }
  
  async deleteAiGenerationTemplate(id: number): Promise<void> {
    this.aiTemplates.delete(id);
  }
  
  async getAiGenerationTemplatesByType(questionType: QuestionType): Promise<AiGenerationTemplate[]> {
    return Array.from(this.aiTemplates.values()).filter(t => t.questionType === questionType);
  }
  
  async getActiveAiGenerationTemplates(): Promise<AiGenerationTemplate[]> {
    return Array.from(this.aiTemplates.values()).filter(t => t.isActive);
  }
  
  async updateAiTemplateUsageStats(id: number, success: boolean, quality: number, generationTime: number): Promise<void> {
    const template = this.aiTemplates.get(id);
    if (template) {
      const currentUsage = template.usageCount || 0;
      const currentSuccessRate = template.successRate || 0;
      const currentQuality = template.averageQuality || 0;
      const currentGenTime = template.averageGenerationTime || 0;
      
      template.usageCount = currentUsage + 1;
      template.successRate = (currentSuccessRate * currentUsage + (success ? 1 : 0)) / template.usageCount;
      template.averageQuality = (currentQuality * currentUsage + quality) / template.usageCount;
      template.averageGenerationTime = (currentGenTime * currentUsage + generationTime) / template.usageCount;
      template.updatedAt = new Date();
    }
  }

  // ============================================================================
  // MIGRATION AND CONSOLIDATION (NO-OP IMPLEMENTATIONS)
  // ============================================================================
  
  async migrateFromPlacementTestSystem(): Promise<{
    migratedQuestions: number;
    migratedSessions: number;
    migratedResponses: number;
  }> {
    // No-op for in-memory storage
    return { migratedQuestions: 0, migratedSessions: 0, migratedResponses: 0 };
  }
  
  async migrateFromTestSystem(): Promise<{
    migratedQuestions: number;
    migratedTests: number;
    migratedAttempts: number;
  }> {
    return { migratedQuestions: 0, migratedTests: 0, migratedAttempts: 0 };
  }
  
  async migrateFromGameSystem(): Promise<{
    migratedQuestions: number;
    migratedGames: number;
    migratedSessions: number;
  }> {
    return { migratedQuestions: 0, migratedGames: 0, migratedSessions: 0 };
  }
  
  async migrateFromLevelAssessmentSystem(): Promise<{
    migratedQuestions: number;
    migratedResults: number;
  }> {
    return { migratedQuestions: 0, migratedResults: 0 };
  }
  
  async getMigrationStatus(): Promise<{
    placementTestMigrated: boolean;
    testSystemMigrated: boolean;
    gameSystemMigrated: boolean;
    levelAssessmentMigrated: boolean;
    totalQuestionsInOldSystems: number;
    totalQuestionsInUnifiedSystem: number;
  }> {
    return {
      placementTestMigrated: false,
      testSystemMigrated: false,
      gameSystemMigrated: false,
      levelAssessmentMigrated: false,
      totalQuestionsInOldSystems: 0,
      totalQuestionsInUnifiedSystem: this.questions.size
    };
  }

  // ============================================================================
  // REPORTING AND ANALYTICS
  // ============================================================================
  
  async getSystemAnalytics(): Promise<{
    totalQuestions: number;
    totalTemplates: number;
    totalSessions: number;
    totalResponses: number;
    questionsByType: { [type: string]: number };
    sessionsByType: { [type: string]: number };
    averageQuality: number;
    systemUsage: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  }> {
    const questionsByType: { [type: string]: number } = {};
    const sessionsByType: { [type: string]: number } = {};
    
    // Calculate questions by type
    for (const question of this.questions.values()) {
      questionsByType[question.questionType] = (questionsByType[question.questionType] || 0) + 1;
    }
    
    // Calculate sessions by type
    for (const session of this.sessions.values()) {
      sessionsByType[session.sessionType] = (sessionsByType[session.sessionType] || 0) + 1;
    }
    
    return {
      totalQuestions: this.questions.size,
      totalTemplates: this.templates.size,
      totalSessions: this.sessions.size,
      totalResponses: this.responses.size,
      questionsByType,
      sessionsByType,
      averageQuality: 0, // Would require more complex calculation
      systemUsage: { daily: 0, weekly: 0, monthly: 0 } // Would require time-based tracking
    };
  }
  
  async getPerformanceMetrics(timeframe?: 'day' | 'week' | 'month'): Promise<{
    averageSessionDuration: number;
    averageScore: number;
    completionRate: number;
    questionAccuracy: { [type: string]: number };
    responseTimeMetrics: { [type: string]: number };
  }> {
    const sessions = Array.from(this.sessions.values());
    const responses = Array.from(this.responses.values());
    
    // Calculate average session duration
    const completedSessions = sessions.filter(s => s.completedAt);
    const averageSessionDuration = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0) / completedSessions.length
      : 0;
    
    // Calculate average score
    const scores = responses.map(r => r.finalScore || 0).filter(s => s > 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    // Calculate completion rate
    const completionRate = sessions.length > 0 
      ? completedSessions.length / sessions.length * 100 
      : 0;
    
    return {
      averageSessionDuration,
      averageScore,
      completionRate,
      questionAccuracy: {}, // Would require more complex calculation
      responseTimeMetrics: {} // Would require more complex calculation
    };
  }
  
  async getUserPerformanceAnalytics(userId: number): Promise<{
    overallProgress: {
      averageScore: number;
      improvement: number;
      strengthAreas: Skill[];
      weaknessAreas: Skill[];
    };
    skillProgress: { [skill in Skill]: {
      currentLevel: CEFRLevel;
      averageScore: number;
      questionsAttempted: number;
      improvement: number;
    }};
    recentActivity: {
      sessionsCompleted: number;
      averageScore: number;
      totalTimeSpent: number;
      streak: number;
    };
  }> {
    const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
    const userResponses = Array.from(this.responses.values()).filter(r => {
      const session = this.sessions.get(r.sessionId);
      return session?.userId === userId;
    });
    
    const scores = userResponses.map(r => r.finalScore || 0).filter(s => s > 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    return {
      overallProgress: {
        averageScore,
        improvement: 0, // Would require time-based calculation
        strengthAreas: [],
        weaknessAreas: []
      },
      skillProgress: {} as any, // Would require skill-based analysis
      recentActivity: {
        sessionsCompleted: userSessions.filter(s => s.status === 'completed').length,
        averageScore,
        totalTimeSpent: userSessions.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0),
        streak: 0 // Would require streak calculation
      }
    };
  }
  
  async getQuestionBankHealth(): Promise<{
    totalQuestions: number;
    questionsByLevel: { [level in CEFRLevel]: number };
    questionsBySkill: { [skill in Skill]: number };
    questionsByType: { [type: string]: number };
    qualityDistribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    usageDistribution: {
      highUsage: number;
      mediumUsage: number;
      lowUsage: number;
      unused: number;
    };
    flaggedQuestions: UnifiedQuestion[];
  }> {
    const questions = Array.from(this.questions.values());
    
    const questionsByLevel = {} as { [level in CEFRLevel]: number };
    const questionsBySkill = {} as { [skill in Skill]: number };
    const questionsByType: { [type: string]: number } = {};
    
    questions.forEach(q => {
      questionsByLevel[q.cefrLevel] = (questionsByLevel[q.cefrLevel] || 0) + 1;
      questionsBySkill[q.skill] = (questionsBySkill[q.skill] || 0) + 1;
      questionsByType[q.questionType] = (questionsByType[q.questionType] || 0) + 1;
    });
    
    const usageDistribution = {
      highUsage: questions.filter(q => (q.usageCount || 0) > 100).length,
      mediumUsage: questions.filter(q => {
        const usage = q.usageCount || 0;
        return usage >= 10 && usage <= 100;
      }).length,
      lowUsage: questions.filter(q => {
        const usage = q.usageCount || 0;
        return usage >= 1 && usage < 10;
      }).length,
      unused: questions.filter(q => (q.usageCount || 0) === 0).length
    };
    
    return {
      totalQuestions: questions.length,
      questionsByLevel,
      questionsBySkill,
      questionsByType,
      qualityDistribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0
      },
      usageDistribution,
      flaggedQuestions: []
    };
  }

  // ============================================================================
  // BULK OPERATIONS AND UTILITIES
  // ============================================================================
  
  async bulkImportQuestions(questions: any[], sourceFormat: 'json' | 'csv' | 'xlsx'): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    // Simplified implementation for in-memory storage
    return { imported: 0, failed: 0, errors: [] };
  }
  
  async bulkExportQuestions(criteria: any, format: 'json' | 'csv' | 'xlsx'): Promise<string> {
    // Simplified implementation - return JSON string
    const { questions } = await this.searchQuestions(criteria);
    return JSON.stringify(questions);
  }
  
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [id, session] of this.sessions) {
      if (session.expiresAt && new Date(session.expiresAt) < now) {
        this.sessions.delete(id);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
  
  async archiveOldResponses(olderThanDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    let archivedCount = 0;
    
    for (const [id, response] of this.responses) {
      if (new Date(response.createdAt) < cutoff) {
        this.responses.delete(id);
        archivedCount++;
      }
    }
    
    return archivedCount;
  }
  
  async updateQuestionQualityScores(): Promise<number> {
    let updatedCount = 0;
    
    for (const question of this.questions.values()) {
      if (question.usageCount && question.usageCount > 0) {
        // Simple quality score based on correct answer rate and usage
        const qualityScore = (question.correctAnswerRate || 0) * 
          Math.min(1, (question.usageCount || 0) / 10);
        question.difficultyRating = qualityScore;
        updatedCount++;
      }
    }
    
    return updatedCount;
  }
  
  async createBackup(): Promise<string> {
    const backup = {
      questions: Array.from(this.questions.entries()),
      templates: Array.from(this.templates.entries()),
      sessions: Array.from(this.sessions.entries()),
      responses: Array.from(this.responses.entries()),
      evaluationRules: Array.from(this.evaluationRulesMap.entries()),
      aiTemplates: Array.from(this.aiTemplates.entries()),
      nextId: this.nextId
    };
    
    return JSON.stringify(backup);
  }
  
  async restoreFromBackup(backupId: string): Promise<void> {
    const backup = JSON.parse(backupId);
    
    this.questions = new Map(backup.questions);
    this.templates = new Map(backup.templates);
    this.sessions = new Map(backup.sessions);
    this.responses = new Map(backup.responses);
    this.evaluationRulesMap = new Map(backup.evaluationRules);
    this.aiTemplates = new Map(backup.aiTemplates);
    this.nextId = backup.nextId || 1;
  }

  // ============================================================================
  // SEARCH AND RECOMMENDATIONS (SIMPLIFIED IMPLEMENTATIONS)
  // ============================================================================
  
  async searchQuestionsFullText(query: string, filters?: any): Promise<UnifiedQuestion[]> {
    const questions = Array.from(this.questions.values());
    const lowercaseQuery = query.toLowerCase();
    
    return questions.filter(q => 
      q.title.toLowerCase().includes(lowercaseQuery) ||
      q.instructions.toLowerCase().includes(lowercaseQuery)
    );
  }
  
  async getRecommendedQuestions(userId: number, skill?: Skill, count?: number): Promise<UnifiedQuestion[]> {
    let questions = Array.from(this.questions.values()).filter(q => q.isActive);
    
    if (skill) {
      questions = questions.filter(q => q.skill === skill);
    }
    
    // Simple recommendation: return random questions
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count || 10);
  }
  
  async getSimilarQuestions(questionId: number, count?: number): Promise<UnifiedQuestion[]> {
    const targetQuestion = this.questions.get(questionId);
    if (!targetQuestion) return [];
    
    const similar = Array.from(this.questions.values()).filter(q => 
      q.id !== questionId &&
      q.skill === targetQuestion.skill &&
      q.cefrLevel === targetQuestion.cefrLevel &&
      q.questionType === targetQuestion.questionType
    );
    
    return similar.slice(0, count || 5);
  }
  
  async getRecommendedTemplates(userId: number, testType?: TestType): Promise<UnifiedTestTemplate[]> {
    let templates = Array.from(this.templates.values()).filter(t => t.isActive);
    
    if (testType) {
      templates = templates.filter(t => t.testType === testType);
    }
    
    return templates.slice(0, 10);
  }
  
  async getNextAdaptiveQuestion(sessionId: number, currentLevel: CEFRLevel, skill: Skill): Promise<UnifiedQuestion | null> {
    const questions = Array.from(this.questions.values()).filter(q => 
      q.skill === skill && 
      q.cefrLevel === currentLevel && 
      q.isActive
    );
    
    if (questions.length === 0) return null;
    
    // Return random question at the current level
    return questions[Math.floor(Math.random() * questions.length)];
  }

  // ============================================================================
  // INTEGRATION HOOKS (NO-OP IMPLEMENTATIONS)
  // ============================================================================
  
  async syncWithExternalSystem(systemId: string, data: any): Promise<void> {
    // No-op for in-memory storage
  }
  
  async getExternalSystemMappings(systemId: string): Promise<any[]> {
    return [];
  }
  
  async registerWebhook(event: string, url: string): Promise<void> {
    // No-op for in-memory storage
  }
  
  async triggerWebhook(event: string, data: any): Promise<void> {
    // No-op for in-memory storage
  }
  
  async checkApiQuota(userId: number, operation: string): Promise<boolean> {
    return true; // Always allow in in-memory storage
  }
  
  async updateApiUsage(userId: number, operation: string): Promise<void> {
    // No-op for in-memory storage
  }
}