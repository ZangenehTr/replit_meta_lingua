// ============================================================================
// UNIFIED TESTING SYSTEM STORAGE INTERFACE
// ============================================================================
// Storage methods for the new unified testing system

import { 
  UnifiedQuestion, 
  InsertUnifiedQuestion,
  UnifiedTestTemplate, 
  InsertUnifiedTestTemplate,
  UnifiedTestSession, 
  InsertUnifiedTestSession,
  UnifiedResponse, 
  InsertUnifiedResponse,
  EvaluationRule, 
  InsertEvaluationRule,
  AiGenerationTemplate, 
  InsertAiGenerationTemplate,
  QuestionType,
  Skill,
  CEFRLevel,
  TestType
} from "@shared/unified-testing-schema";

export interface IUnifiedTestingStorage {
  // ============================================================================
  // UNIFIED QUESTIONS MANAGEMENT
  // ============================================================================
  
  // Create and manage questions
  createQuestion(question: InsertUnifiedQuestion): Promise<UnifiedQuestion>;
  getQuestion(id: number): Promise<UnifiedQuestion | undefined>;
  updateQuestion(id: number, updates: Partial<UnifiedQuestion>): Promise<UnifiedQuestion | undefined>;
  deleteQuestion(id: number): Promise<void>;
  
  // Query questions by criteria
  getQuestionsByType(questionType: QuestionType): Promise<UnifiedQuestion[]>;
  getQuestionsBySkill(skill: Skill): Promise<UnifiedQuestion[]>;
  getQuestionsByCEFRLevel(level: CEFRLevel): Promise<UnifiedQuestion[]>;
  getQuestionsBySkillAndLevel(skill: Skill, level: CEFRLevel): Promise<UnifiedQuestion[]>;
  
  // Advanced question querying
  searchQuestions(criteria: {
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
  }): Promise<{
    questions: UnifiedQuestion[];
    total: number;
  }>;
  
  // Question quality and analytics
  updateQuestionUsageStats(id: number, wasCorrect: boolean, responseTime: number): Promise<void>;
  getQuestionAnalytics(id: number): Promise<{
    usageCount: number;
    correctAnswerRate: number;
    averageResponseTime: number;
    difficultyRating: number;
  }>;
  
  // Bulk operations
  createMultipleQuestions(questions: InsertUnifiedQuestion[]): Promise<UnifiedQuestion[]>;
  duplicateQuestion(id: number, variations?: number): Promise<UnifiedQuestion[]>;
  
  // ============================================================================
  // TEST TEMPLATES MANAGEMENT
  // ============================================================================
  
  // Create and manage templates
  createTestTemplate(template: InsertUnifiedTestTemplate): Promise<UnifiedTestTemplate>;
  getTestTemplate(id: number): Promise<UnifiedTestTemplate | undefined>;
  updateTestTemplate(id: number, updates: Partial<UnifiedTestTemplate>): Promise<UnifiedTestTemplate | undefined>;
  deleteTestTemplate(id: number): Promise<void>;
  
  // Query templates
  getTestTemplatesByType(testType: TestType): Promise<UnifiedTestTemplate[]>;
  getPublicTestTemplates(): Promise<UnifiedTestTemplate[]>;
  getUserTestTemplates(userId: number): Promise<UnifiedTestTemplate[]>;
  
  // Template analytics
  getTemplateUsageStats(id: number): Promise<{
    usageCount: number;
    averageScore: number;
    averageCompletionTime: number;
    userRating: number;
  }>;
  
  // ============================================================================
  // TEST SESSIONS MANAGEMENT
  // ============================================================================
  
  // Create and manage sessions
  createTestSession(session: InsertUnifiedTestSession): Promise<UnifiedTestSession>;
  getTestSession(id: number): Promise<UnifiedTestSession | undefined>;
  updateTestSession(id: number, updates: Partial<UnifiedTestSession>): Promise<UnifiedTestSession | undefined>;
  
  // Session queries
  getUserTestSessions(userId: number, status?: string): Promise<UnifiedTestSession[]>;
  getActiveTestSessions(userId: number): Promise<UnifiedTestSession[]>;
  getCompletedTestSessions(userId: number): Promise<UnifiedTestSession[]>;
  
  // Session analytics
  getUserTestHistory(userId: number, limit?: number): Promise<UnifiedTestSession[]>;
  getSessionsByTemplate(templateId: number): Promise<UnifiedTestSession[]>;
  
  // ============================================================================
  // RESPONSES MANAGEMENT
  // ============================================================================
  
  // Create and manage responses
  createResponse(response: InsertUnifiedResponse): Promise<UnifiedResponse>;
  getResponse(id: number): Promise<UnifiedResponse | undefined>;
  updateResponse(id: number, updates: Partial<UnifiedResponse>): Promise<UnifiedResponse | undefined>;
  
  // Response queries
  getSessionResponses(sessionId: number): Promise<UnifiedResponse[]>;
  getQuestionResponses(questionId: number): Promise<UnifiedResponse[]>;
  getResponsesNeedingReview(): Promise<UnifiedResponse[]>;
  
  // Response analytics
  getResponseAnalytics(sessionId: number): Promise<{
    totalResponses: number;
    correctResponses: number;
    averageScore: number;
    totalTimeSpent: number;
  }>;
  
  // ============================================================================
  // EVALUATION RULES MANAGEMENT
  // ============================================================================
  
  // Create and manage evaluation rules
  createEvaluationRule(rule: InsertEvaluationRule): Promise<EvaluationRule>;
  getEvaluationRule(id: number): Promise<EvaluationRule | undefined>;
  updateEvaluationRule(id: number, updates: Partial<EvaluationRule>): Promise<EvaluationRule | undefined>;
  deleteEvaluationRule(id: number): Promise<void>;
  
  // Query evaluation rules
  getEvaluationRulesByType(questionTypes: QuestionType[]): Promise<EvaluationRule[]>;
  getActiveEvaluationRules(): Promise<EvaluationRule[]>;
  
  // ============================================================================
  // AI GENERATION TEMPLATES MANAGEMENT
  // ============================================================================
  
  // Create and manage AI templates
  createAiGenerationTemplate(template: InsertAiGenerationTemplate): Promise<AiGenerationTemplate>;
  getAiGenerationTemplate(id: number): Promise<AiGenerationTemplate | undefined>;
  updateAiGenerationTemplate(id: number, updates: Partial<AiGenerationTemplate>): Promise<AiGenerationTemplate | undefined>;
  deleteAiGenerationTemplate(id: number): Promise<void>;
  
  // Query AI templates
  getAiGenerationTemplatesByType(questionType: QuestionType): Promise<AiGenerationTemplate[]>;
  getActiveAiGenerationTemplates(): Promise<AiGenerationTemplate[]>;
  
  // AI template analytics
  updateAiTemplateUsageStats(id: number, success: boolean, quality: number, generationTime: number): Promise<void>;
  
  // ============================================================================
  // MIGRATION AND CONSOLIDATION
  // ============================================================================
  
  // Migration from existing systems
  migrateFromPlacementTestSystem(): Promise<{
    migratedQuestions: number;
    migratedSessions: number;
    migratedResponses: number;
  }>;
  
  migrateFromTestSystem(): Promise<{
    migratedQuestions: number;
    migratedTests: number;
    migratedAttempts: number;
  }>;
  
  migrateFromGameSystem(): Promise<{
    migratedQuestions: number;
    migratedGames: number;
    migratedSessions: number;
  }>;
  
  migrateFromLevelAssessmentSystem(): Promise<{
    migratedQuestions: number;
    migratedResults: number;
  }>;
  
  // Migration utilities
  getMigrationStatus(): Promise<{
    placementTestMigrated: boolean;
    testSystemMigrated: boolean;
    gameSystemMigrated: boolean;
    levelAssessmentMigrated: boolean;
    totalQuestionsInOldSystems: number;
    totalQuestionsInUnifiedSystem: number;
  }>;
  
  // ============================================================================
  // REPORTING AND ANALYTICS
  // ============================================================================
  
  // System-wide analytics
  getSystemAnalytics(): Promise<{
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
  }>;
  
  // Performance metrics
  getPerformanceMetrics(timeframe?: 'day' | 'week' | 'month'): Promise<{
    averageSessionDuration: number;
    averageScore: number;
    completionRate: number;
    questionAccuracy: { [type: string]: number };
    responseTimeMetrics: { [type: string]: number };
  }>;
  
  // User performance analytics
  getUserPerformanceAnalytics(userId: number): Promise<{
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
  }>;
  
  // Question bank health
  getQuestionBankHealth(): Promise<{
    totalQuestions: number;
    questionsByLevel: { [level in CEFRLevel]: number };
    questionsBySkill: { [skill in Skill]: number };
    questionsByType: { [type: string]: number };
    qualityDistribution: {
      excellent: number; // 4.5-5.0
      good: number; // 3.5-4.4
      fair: number; // 2.5-3.4
      poor: number; // 1.0-2.4
    };
    usageDistribution: {
      highUsage: number; // >100 uses
      mediumUsage: number; // 10-100 uses
      lowUsage: number; // 1-9 uses
      unused: number; // 0 uses
    };
    flaggedQuestions: UnifiedQuestion[]; // Low quality or problematic questions
  }>;
  
  // ============================================================================
  // BULK OPERATIONS AND UTILITIES
  // ============================================================================
  
  // Bulk data operations
  bulkImportQuestions(questions: any[], sourceFormat: 'json' | 'csv' | 'xlsx'): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }>;
  
  bulkExportQuestions(criteria: any, format: 'json' | 'csv' | 'xlsx'): Promise<string>;
  
  // Data cleanup and maintenance
  cleanupExpiredSessions(): Promise<number>;
  archiveOldResponses(olderThanDays: number): Promise<number>;
  updateQuestionQualityScores(): Promise<number>;
  
  // Backup and restore
  createBackup(): Promise<string>; // Returns backup file path/ID
  restoreFromBackup(backupId: string): Promise<void>;
  
  // ============================================================================
  // SEARCH AND RECOMMENDATIONS
  // ============================================================================
  
  // Advanced search
  searchQuestionsFullText(query: string, filters?: any): Promise<UnifiedQuestion[]>;
  
  // Question recommendations
  getRecommendedQuestions(userId: number, skill?: Skill, count?: number): Promise<UnifiedQuestion[]>;
  getSimilarQuestions(questionId: number, count?: number): Promise<UnifiedQuestion[]>;
  
  // Template recommendations
  getRecommendedTemplates(userId: number, testType?: TestType): Promise<UnifiedTestTemplate[]>;
  
  // Adaptive testing support
  getNextAdaptiveQuestion(sessionId: number, currentLevel: CEFRLevel, skill: Skill): Promise<UnifiedQuestion | null>;
  
  // ============================================================================
  // INTEGRATION HOOKS
  // ============================================================================
  
  // External system integration
  syncWithExternalSystem(systemId: string, data: any): Promise<void>;
  getExternalSystemMappings(systemId: string): Promise<any[]>;
  
  // Webhook support
  registerWebhook(event: string, url: string): Promise<void>;
  triggerWebhook(event: string, data: any): Promise<void>;
  
  // API rate limiting and quota management
  checkApiQuota(userId: number, operation: string): Promise<boolean>;
  updateApiUsage(userId: number, operation: string): Promise<void>;
}

// ============================================================================
// STORAGE IMPLEMENTATION
// ============================================================================

export class UnifiedTestingStorage implements IUnifiedTestingStorage {
  constructor(private db: any) {}
  
  // Implement all the interface methods
  // For brevity, I'll implement a few key methods as examples:
  
  async createQuestion(question: InsertUnifiedQuestion): Promise<UnifiedQuestion> {
    const [created] = await this.db.insert(unifiedQuestions).values(question).returning();
    return created;
  }
  
  async getQuestion(id: number): Promise<UnifiedQuestion | undefined> {
    const [question] = await this.db.select().from(unifiedQuestions).where(eq(unifiedQuestions.id, id));
    return question;
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
    
    let query = this.db.select().from(unifiedQuestions);
    let conditions = [];
    
    if (criteria.questionTypes?.length) {
      conditions.push(inArray(unifiedQuestions.questionType, criteria.questionTypes));
    }
    
    if (criteria.skills?.length) {
      conditions.push(inArray(unifiedQuestions.skill, criteria.skills));
    }
    
    if (criteria.cefrLevels?.length) {
      conditions.push(inArray(unifiedQuestions.cefrLevel, criteria.cefrLevels));
    }
    
    if (criteria.languages?.length) {
      conditions.push(inArray(unifiedQuestions.language, criteria.languages));
    }
    
    if (criteria.isActive !== undefined) {
      conditions.push(eq(unifiedQuestions.isActive, criteria.isActive));
    }
    
    if (criteria.createdBy) {
      conditions.push(eq(unifiedQuestions.createdBy, criteria.createdBy));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    if (criteria.limit) {
      query = query.limit(criteria.limit);
    }
    
    if (criteria.offset) {
      query = query.offset(criteria.offset);
    }
    
    const questions = await query;
    
    // Get total count for pagination
    const [{ count }] = await this.db
      .select({ count: sql`count(*)` })
      .from(unifiedQuestions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    return { questions, total: Number(count) };
  }
  
  async getUserPerformanceAnalytics(userId: number): Promise<any> {
    // Complex analytics query - implementation would involve multiple queries
    // and data processing to generate comprehensive user analytics
    
    // Get user's test sessions
    const sessions = await this.db
      .select()
      .from(unifiedTestSessions)
      .where(eq(unifiedTestSessions.userId, userId));
    
    // Get user's responses
    const responses = await this.db
      .select()
      .from(unifiedResponses)
      .innerJoin(unifiedTestSessions, eq(unifiedResponses.sessionId, unifiedTestSessions.id))
      .where(eq(unifiedTestSessions.userId, userId));
    
    // Process data to generate analytics
    // This would involve complex calculations for progress tracking,
    // skill analysis, improvement metrics, etc.
    
    return {
      overallProgress: {
        averageScore: 0,
        improvement: 0,
        strengthAreas: [],
        weaknessAreas: []
      },
      skillProgress: {},
      recentActivity: {
        sessionsCompleted: sessions.length,
        averageScore: 0,
        totalTimeSpent: 0,
        streak: 0
      }
    };
  }
  
  // Additional implementation methods would follow...
  // For brevity, not implementing all methods here but the interface
  // provides the complete contract for the unified testing system
}

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

export class TestingSystemMigrator {
  constructor(private storage: IUnifiedTestingStorage, private db: any) {}
  
  async migrateAllSystems(): Promise<void> {
    console.log('Starting migration of all testing systems...');
    
    // Migrate placement test system
    const placementResults = await this.storage.migrateFromPlacementTestSystem();
    console.log('Placement test migration:', placementResults);
    
    // Migrate general test system
    const testResults = await this.storage.migrateFromTestSystem();
    console.log('Test system migration:', testResults);
    
    // Migrate game system
    const gameResults = await this.storage.migrateFromGameSystem();
    console.log('Game system migration:', gameResults);
    
    // Migrate level assessment system
    const levelResults = await this.storage.migrateFromLevelAssessmentSystem();
    console.log('Level assessment migration:', levelResults);
    
    console.log('Migration completed successfully!');
  }
  
  async validateMigration(): Promise<boolean> {
    const status = await this.storage.getMigrationStatus();
    
    return status.placementTestMigrated &&
           status.testSystemMigrated &&
           status.gameSystemMigrated &&
           status.levelAssessmentMigrated;
  }
}

// Import the tables from unified testing schema
import { 
  unifiedQuestions, 
  unifiedTestTemplates, 
  unifiedTestSessions, 
  unifiedResponses,
  evaluationRules,
  aiGenerationTemplates 
} from '@shared/unified-testing-schema';

import { eq, and, inArray, sql } from 'drizzle-orm';

// ============================================================================
// TRUE IN-MEMORY STORAGE IMPLEMENTATION
// ============================================================================
// Map-based storage for environments without database or as fallback

export class UnifiedTestingMemStorage implements IUnifiedTestingStorage {
  private questions = new Map<number, UnifiedQuestion>();
  private templates = new Map<number, UnifiedTestTemplate>();
  private sessions = new Map<number, UnifiedTestSession>();
  private responses = new Map<number, UnifiedResponse>();
  private evaluationRules = new Map<number, EvaluationRule>();
  private aiTemplates = new Map<number, AiGenerationTemplate>();
  
  private nextId = 1;
  
  private getNextId(): number {
    return this.nextId++;
  }

  // ============================================================================
  // QUESTIONS MANAGEMENT
  // ============================================================================
  
  async createQuestion(question: InsertUnifiedQuestion): Promise<UnifiedQuestion> {
    const id = this.getNextId();
    const newQuestion: UnifiedQuestion = {
      id,
      ...question,
      usageCount: 0,
      correctAnswerRate: null,
      averageResponseTime: null,
      difficultyRating: null,
      antiPlagiarismVariations: [],
      isActive: true,
      version: 1,
      parentQuestionId: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
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
  
  async searchQuestions(criteria: any): Promise<{ questions: UnifiedQuestion[]; total: number }> {
    let questions = Array.from(this.questions.values());
    
    if (criteria.questionTypes?.length) {
      questions = questions.filter(q => criteria.questionTypes.includes(q.questionType));
    }
    
    if (criteria.skills?.length) {
      questions = questions.filter(q => criteria.skills.includes(q.skill));
    }
    
    if (criteria.cefrLevels?.length) {
      questions = questions.filter(q => criteria.cefrLevels.includes(q.cefrLevel));
    }
    
    if (criteria.languages?.length) {
      questions = questions.filter(q => criteria.languages.includes(q.language));
    }
    
    if (criteria.isActive !== undefined) {
      questions = questions.filter(q => q.isActive === criteria.isActive);
    }
    
    if (criteria.createdBy) {
      questions = questions.filter(q => q.createdBy === criteria.createdBy);
    }
    
    const total = questions.length;
    
    if (criteria.offset) {
      questions = questions.slice(criteria.offset);
    }
    
    if (criteria.limit) {
      questions = questions.slice(0, criteria.limit);
    }
    
    return { questions, total };
  }
  
  async createMultipleQuestions(questions: InsertUnifiedQuestion[]): Promise<UnifiedQuestion[]> {
    const created: UnifiedQuestion[] = [];
    for (const question of questions) {
      const newQuestion = await this.createQuestion(question);
      created.push(newQuestion);
    }
    return created;
  }
  
  async updateQuestionUsageStats(id: number, wasCorrect: boolean, responseTime: number): Promise<void> {
    const question = this.questions.get(id);
    if (question) {
      question.usageCount = (question.usageCount || 0) + 1;
      question.averageResponseTime = responseTime;
      question.updatedAt = new Date();
    }
  }
  
  // ============================================================================
  // TEMPLATES MANAGEMENT  
  // ============================================================================
  
  async createTestTemplate(template: InsertUnifiedTestTemplate): Promise<UnifiedTestTemplate> {
    const id = this.getNextId();
    const newTemplate: UnifiedTestTemplate = {
      id,
      ...template,
      isPublic: false,
      isActive: true,
      version: 1,
      parentTemplateId: null,
      createdAt: new Date(),
      updatedAt: new Date()
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
  
  // ============================================================================
  // SESSIONS MANAGEMENT
  // ============================================================================
  
  async createTestSession(session: InsertUnifiedTestSession): Promise<UnifiedTestSession> {
    const id = this.getNextId();
    const newSession: UnifiedTestSession = {
      id,
      ...session,
      status: 'not_started',
      startTime: null,
      endTime: null,
      currentQuestionIndex: 0,
      timeRemainingSeconds: null,
      results: null,
      createdAt: new Date(),
      updatedAt: new Date()
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
  
  // ============================================================================
  // RESPONSES MANAGEMENT
  // ============================================================================
  
  async createResponse(response: InsertUnifiedResponse): Promise<UnifiedResponse> {
    const id = this.getNextId();
    const newResponse: UnifiedResponse = {
      id,
      ...response,
      isCorrect: null,
      score: null,
      maxPossibleScore: null,
      aiEvaluation: null,
      feedback: null,
      flaggedForReview: false,
      createdAt: new Date()
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
    return Array.from(this.responses.values()).filter(r => r.flaggedForReview);
  }
  
  // ============================================================================
  // PLACEHOLDER IMPLEMENTATIONS FOR REMAINING INTERFACE METHODS
  // ============================================================================
  // Basic implementations that return empty/default data for in-memory fallback
  
  async duplicateQuestion(id: number, variations?: number): Promise<UnifiedQuestion[]> { return []; }
  async getQuestionAnalytics(id: number): Promise<any> { return { usageCount: 0, correctAnswerRate: 0, averageResponseTime: 0, difficultyRating: 0 }; }
  async getTemplateUsageStats(id: number): Promise<any> { return { usageCount: 0, averageScore: 0, averageCompletionTime: 0, userRating: 0 }; }
  async getUserTestHistory(userId: number, limit?: number): Promise<UnifiedTestSession[]> { return []; }
  async getSessionsByTemplate(templateId: number): Promise<UnifiedTestSession[]> { return []; }
  async getResponseAnalytics(sessionId: number): Promise<any> { return { totalResponses: 0, correctResponses: 0, averageScore: 0, totalTimeSpent: 0 }; }
  async createEvaluationRule(rule: InsertEvaluationRule): Promise<EvaluationRule> { throw new Error('Not implemented in MemStorage'); }
  async getEvaluationRule(id: number): Promise<EvaluationRule | undefined> { return undefined; }
  async updateEvaluationRule(id: number, updates: Partial<EvaluationRule>): Promise<EvaluationRule | undefined> { return undefined; }
  async deleteEvaluationRule(id: number): Promise<void> {}
  async getEvaluationRulesByType(questionTypes: QuestionType[]): Promise<EvaluationRule[]> { return []; }
  async getActiveEvaluationRules(): Promise<EvaluationRule[]> { return []; }
  async createAiGenerationTemplate(template: InsertAiGenerationTemplate): Promise<AiGenerationTemplate> { throw new Error('Not implemented in MemStorage'); }
  async getAiGenerationTemplate(id: number): Promise<AiGenerationTemplate | undefined> { return undefined; }
  async updateAiGenerationTemplate(id: number, updates: Partial<AiGenerationTemplate>): Promise<AiGenerationTemplate | undefined> { return undefined; }
  async deleteAiGenerationTemplate(id: number): Promise<void> {}
  async getAiGenerationTemplatesByType(questionType: QuestionType): Promise<AiGenerationTemplate[]> { return []; }
  async getActiveAiGenerationTemplates(): Promise<AiGenerationTemplate[]> { return []; }
  async updateAiTemplateUsageStats(id: number, success: boolean, quality: number, generationTime: number): Promise<void> {}
  async migrateFromPlacementTestSystem(): Promise<any> { return { migratedQuestions: 0, migratedSessions: 0, migratedResponses: 0 }; }
  async migrateFromTestSystem(): Promise<any> { return { migratedQuestions: 0, migratedTests: 0, migratedAttempts: 0 }; }
  async migrateFromGameSystem(): Promise<any> { return { migratedQuestions: 0, migratedGames: 0, migratedSessions: 0 }; }
  async migrateFromLevelAssessmentSystem(): Promise<any> { return { migratedQuestions: 0, migratedResults: 0 }; }
  async getMigrationStatus(): Promise<any> { return { placementTestMigrated: false, testSystemMigrated: false, gameSystemMigrated: false, levelAssessmentMigrated: false, totalQuestionsInOldSystems: 0, totalQuestionsInUnifiedSystem: 0 }; }
  async getSystemAnalytics(): Promise<any> { return { totalQuestions: this.questions.size, totalTemplates: this.templates.size, totalSessions: this.sessions.size, totalResponses: this.responses.size, questionsByType: {}, sessionsByType: {}, averageQuality: 0, systemUsage: { daily: 0, weekly: 0, monthly: 0 } }; }
  async getPerformanceMetrics(timeframe?: 'day' | 'week' | 'month'): Promise<any> { return { averageSessionDuration: 0, averageScore: 0, completionRate: 0, questionAccuracy: {}, responseTimeMetrics: {} }; }
  async getUserPerformanceAnalytics(userId: number): Promise<any> { return { overallProgress: { averageScore: 0, improvement: 0, strengthAreas: [], weaknessAreas: [] }, skillProgress: {}, recentActivity: { sessionsCompleted: 0, averageScore: 0, totalTimeSpent: 0, streak: 0 } }; }
  async getQuestionBankHealth(): Promise<any> { return { totalQuestions: this.questions.size, questionsByLevel: {}, questionsBySkill: {}, questionsByType: {}, qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 }, usageDistribution: { highUsage: 0, mediumUsage: 0, lowUsage: 0, unused: this.questions.size }, flaggedQuestions: [] }; }
}