import { db } from '../db';
import { eq, and, desc, asc, sql, gte, lte, or } from 'drizzle-orm';
import {
  type UnifiedQuestion, type InsertUnifiedQuestion,
  type UnifiedTestTemplate, type InsertUnifiedTestTemplate,
  type UnifiedTestSession, type InsertUnifiedTestSession,
  type UnifiedResponse, type InsertUnifiedResponse,
  type EvaluationRule, type InsertEvaluationRule,
  type AiGenerationTemplate, type InsertAiGenerationTemplate,
  type QuestionType, type Skill, type CEFRLevel, type TestType
} from '@shared/unified-testing-schema';
import {
  unifiedQuestions, unifiedTestTemplates, unifiedTestSessions, 
  unifiedResponses, evaluationRules, aiGenerationTemplates
} from '@shared/unified-testing-schema';
import { IUnifiedTestingStorage } from '../unified-testing-storage';

export class UnifiedTestingMemStorage implements IUnifiedTestingStorage {
  private db = db;

  constructor() {
    // Database storage using PostgreSQL via Drizzle ORM
  }

  // ============================================================================
  // UNIFIED QUESTIONS MANAGEMENT
  // ============================================================================
  
  async createQuestion(question: InsertUnifiedQuestion): Promise<UnifiedQuestion> {
    const result = await this.db.insert(unifiedQuestions).values(question).returning();
    return result[0];
  }

  async getQuestion(id: number): Promise<UnifiedQuestion | undefined> {
    const result = await this.db.select().from(unifiedQuestions).where(eq(unifiedQuestions.id, id));
    return result[0];
  }

  async updateQuestion(id: number, updates: Partial<UnifiedQuestion>): Promise<UnifiedQuestion | undefined> {
    const result = await this.db.update(unifiedQuestions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(unifiedQuestions.id, id))
      .returning();
    return result[0];
  }

  async deleteQuestion(id: number): Promise<void> {
    await this.db.delete(unifiedQuestions).where(eq(unifiedQuestions.id, id));
  }

  async getQuestionsByType(questionType: QuestionType): Promise<UnifiedQuestion[]> {
    return await this.db.select().from(unifiedQuestions)
      .where(and(eq(unifiedQuestions.questionType, questionType), eq(unifiedQuestions.isActive, true)));
  }

  async getQuestionsBySkill(skill: Skill): Promise<UnifiedQuestion[]> {
    return await this.db.select().from(unifiedQuestions)
      .where(and(eq(unifiedQuestions.skill, skill), eq(unifiedQuestions.isActive, true)));
  }

  async getQuestionsByCEFRLevel(level: CEFRLevel): Promise<UnifiedQuestion[]> {
    return await this.db.select().from(unifiedQuestions)
      .where(and(eq(unifiedQuestions.cefrLevel, level), eq(unifiedQuestions.isActive, true)));
  }

  async getQuestionsBySkillAndLevel(skill: Skill, level: CEFRLevel): Promise<UnifiedQuestion[]> {
    return await this.db.select().from(unifiedQuestions)
      .where(and(
        eq(unifiedQuestions.skill, skill),
        eq(unifiedQuestions.cefrLevel, level),
        eq(unifiedQuestions.isActive, true)
      ));
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
  }): Promise<{ questions: UnifiedQuestion[]; total: number; }> {
    let query = this.db.select().from(unifiedQuestions);
    let conditions = [];

    if (criteria.questionTypes && criteria.questionTypes.length > 0) {
      conditions.push(sql`${unifiedQuestions.questionType} = ANY(${criteria.questionTypes})`);
    }
    if (criteria.skills && criteria.skills.length > 0) {
      conditions.push(sql`${unifiedQuestions.skill} = ANY(${criteria.skills})`);
    }
    if (criteria.cefrLevels && criteria.cefrLevels.length > 0) {
      conditions.push(sql`${unifiedQuestions.cefrLevel} = ANY(${criteria.cefrLevels})`);
    }
    if (criteria.languages && criteria.languages.length > 0) {
      conditions.push(sql`${unifiedQuestions.language} = ANY(${criteria.languages})`);
    }
    if (criteria.createdBy) {
      conditions.push(eq(unifiedQuestions.createdBy, criteria.createdBy));
    }
    if (criteria.isActive !== undefined) {
      conditions.push(eq(unifiedQuestions.isActive, criteria.isActive));
    }
    if (criteria.minQuality !== undefined) {
      conditions.push(gte(unifiedQuestions.difficultyRating, criteria.minQuality.toString()));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalResult = await this.db.select({ count: sql<number>`count(*)` }).from(unifiedQuestions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = totalResult[0]?.count || 0;

    // Apply pagination
    if (criteria.offset) {
      query = query.offset(criteria.offset);
    }
    if (criteria.limit) {
      query = query.limit(criteria.limit);
    }

    const questions = await query;
    return { questions, total };
  }

  async updateQuestionUsageStats(id: number, wasCorrect: boolean, responseTime: number): Promise<void> {
    await this.db.update(unifiedQuestions)
      .set({
        usageCount: sql`${unifiedQuestions.usageCount} + 1`,
        averageResponseTime: sql`CASE WHEN ${unifiedQuestions.averageResponseTime} IS NULL THEN ${responseTime} ELSE (${unifiedQuestions.averageResponseTime} * ${unifiedQuestions.usageCount} + ${responseTime}) / (${unifiedQuestions.usageCount} + 1) END`,
        updatedAt: new Date()
      })
      .where(eq(unifiedQuestions.id, id));
  }

  async getQuestionAnalytics(id: number): Promise<{
    usageCount: number;
    correctAnswerRate: number;
    averageResponseTime: number;
    difficultyRating: number;
  }> {
    const result = await this.db.select({
      usageCount: unifiedQuestions.usageCount,
      correctAnswerRate: unifiedQuestions.correctAnswerRate,
      averageResponseTime: unifiedQuestions.averageResponseTime,
      difficultyRating: unifiedQuestions.difficultyRating
    }).from(unifiedQuestions).where(eq(unifiedQuestions.id, id));

    return {
      usageCount: result[0]?.usageCount || 0,
      correctAnswerRate: parseFloat(result[0]?.correctAnswerRate || '0'),
      averageResponseTime: parseFloat(result[0]?.averageResponseTime || '0'),
      difficultyRating: parseFloat(result[0]?.difficultyRating || '0')
    };
  }

  async createMultipleQuestions(questions: InsertUnifiedQuestion[]): Promise<UnifiedQuestion[]> {
    const result = await this.db.insert(unifiedQuestions).values(questions).returning();
    return result;
  }

  async duplicateQuestion(id: number, variations?: number): Promise<UnifiedQuestion[]> {
    const original = await this.getQuestion(id);
    if (!original) throw new Error('Question not found');

    const variationCount = variations || 1;
    const duplicates: InsertUnifiedQuestion[] = [];

    for (let i = 0; i < variationCount; i++) {
      duplicates.push({
        ...original,
        title: `${original.title} (Copy ${i + 1})`,
        parentQuestionId: original.id,
        version: 1,
        isActive: false // Require manual review before activation
      });
    }

    return await this.createMultipleQuestions(duplicates);
  }

  // ============================================================================
  // TEST TEMPLATES MANAGEMENT
  // ============================================================================

  async createTestTemplate(template: InsertUnifiedTestTemplate): Promise<UnifiedTestTemplate> {
    const result = await this.db.insert(unifiedTestTemplates).values(template).returning();
    return result[0];
  }

  async getTestTemplate(id: number): Promise<UnifiedTestTemplate | undefined> {
    const result = await this.db.select().from(unifiedTestTemplates).where(eq(unifiedTestTemplates.id, id));
    return result[0];
  }

  async updateTestTemplate(id: number, updates: Partial<UnifiedTestTemplate>): Promise<UnifiedTestTemplate | undefined> {
    const result = await this.db.update(unifiedTestTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(unifiedTestTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteTestTemplate(id: number): Promise<void> {
    await this.db.delete(unifiedTestTemplates).where(eq(unifiedTestTemplates.id, id));
  }

  async getTestTemplatesByType(testType: TestType): Promise<UnifiedTestTemplate[]> {
    return await this.db.select().from(unifiedTestTemplates)
      .where(and(eq(unifiedTestTemplates.testType, testType), eq(unifiedTestTemplates.isActive, true)));
  }

  async getPublicTestTemplates(): Promise<UnifiedTestTemplate[]> {
    return await this.db.select().from(unifiedTestTemplates)
      .where(and(eq(unifiedTestTemplates.isPublic, true), eq(unifiedTestTemplates.isActive, true)));
  }

  async getUserTestTemplates(userId: number): Promise<UnifiedTestTemplate[]> {
    return await this.db.select().from(unifiedTestTemplates)
      .where(and(eq(unifiedTestTemplates.createdBy, userId), eq(unifiedTestTemplates.isActive, true)));
  }

  async getTemplateUsageStats(id: number): Promise<{
    usageCount: number;
    averageScore: number;
    averageCompletionTime: number;
    userRating: number;
  }> {
    const result = await this.db.select({
      usageCount: unifiedTestTemplates.usageCount,
      averageScore: unifiedTestTemplates.averageScore,
      averageCompletionTime: unifiedTestTemplates.averageCompletionTime,
      userRating: unifiedTestTemplates.userRating
    }).from(unifiedTestTemplates).where(eq(unifiedTestTemplates.id, id));

    return {
      usageCount: result[0]?.usageCount || 0,
      averageScore: parseFloat(result[0]?.averageScore || '0'),
      averageCompletionTime: parseFloat(result[0]?.averageCompletionTime || '0'),
      userRating: parseFloat(result[0]?.userRating || '0')
    };
  }

  // ============================================================================
  // TEST SESSIONS MANAGEMENT
  // ============================================================================

  async createTestSession(session: InsertUnifiedTestSession): Promise<UnifiedTestSession> {
    const result = await this.db.insert(unifiedTestSessions).values(session).returning();
    return result[0];
  }

  async getTestSession(id: number): Promise<UnifiedTestSession | undefined> {
    const result = await this.db.select().from(unifiedTestSessions).where(eq(unifiedTestSessions.id, id));
    return result[0];
  }

  async updateTestSession(id: number, updates: Partial<UnifiedTestSession>): Promise<UnifiedTestSession | undefined> {
    const result = await this.db.update(unifiedTestSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(unifiedTestSessions.id, id))
      .returning();
    return result[0];
  }

  async getUserTestSessions(userId: number, status?: string): Promise<UnifiedTestSession[]> {
    let query = this.db.select().from(unifiedTestSessions).where(eq(unifiedTestSessions.userId, userId));
    
    if (status) {
      query = query.where(and(eq(unifiedTestSessions.userId, userId), eq(unifiedTestSessions.status, status)));
    }

    return await query.orderBy(desc(unifiedTestSessions.createdAt));
  }

  async getActiveTestSessions(userId: number): Promise<UnifiedTestSession[]> {
    return await this.getUserTestSessions(userId, 'in_progress');
  }

  async getCompletedTestSessions(userId: number): Promise<UnifiedTestSession[]> {
    return await this.getUserTestSessions(userId, 'completed');
  }

  async getUserTestHistory(userId: number, limit?: number): Promise<UnifiedTestSession[]> {
    let query = this.db.select().from(unifiedTestSessions)
      .where(eq(unifiedTestSessions.userId, userId))
      .orderBy(desc(unifiedTestSessions.createdAt));

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }

  async getSessionsByTemplate(templateId: number): Promise<UnifiedTestSession[]> {
    return await this.db.select().from(unifiedTestSessions)
      .where(eq(unifiedTestSessions.templateId, templateId))
      .orderBy(desc(unifiedTestSessions.createdAt));
  }

  // ============================================================================
  // RESPONSES MANAGEMENT
  // ============================================================================

  async createResponse(response: InsertUnifiedResponse): Promise<UnifiedResponse> {
    const result = await this.db.insert(unifiedResponses).values(response).returning();
    return result[0];
  }

  async getResponse(id: number): Promise<UnifiedResponse | undefined> {
    const result = await this.db.select().from(unifiedResponses).where(eq(unifiedResponses.id, id));
    return result[0];
  }

  async updateResponse(id: number, updates: Partial<UnifiedResponse>): Promise<UnifiedResponse | undefined> {
    const result = await this.db.update(unifiedResponses)
      .set(updates)
      .where(eq(unifiedResponses.id, id))
      .returning();
    return result[0];
  }

  async getSessionResponses(sessionId: number): Promise<UnifiedResponse[]> {
    return await this.db.select().from(unifiedResponses)
      .where(eq(unifiedResponses.sessionId, sessionId))
      .orderBy(asc(unifiedResponses.questionOrder));
  }

  async getQuestionResponses(questionId: number): Promise<UnifiedResponse[]> {
    return await this.db.select().from(unifiedResponses)
      .where(eq(unifiedResponses.questionId, questionId))
      .orderBy(desc(unifiedResponses.submittedAt));
  }

  async getResponsesNeedingReview(): Promise<UnifiedResponse[]> {
    return await this.db.select().from(unifiedResponses)
      .where(eq(unifiedResponses.reviewStatus, 'pending_review'))
      .orderBy(asc(unifiedResponses.submittedAt));
  }

  async getResponseAnalytics(sessionId: number): Promise<{
    totalResponses: number;
    correctResponses: number;
    averageScore: number;
    totalTimeSpent: number;
  }> {
    const result = await this.db.select({
      totalResponses: sql<number>`count(*)`,
      correctResponses: sql<number>`count(case when ${unifiedResponses.isCorrect} = true then 1 end)`,
      averageScore: sql<number>`avg(${unifiedResponses.finalScore})`,
      totalTimeSpent: sql<number>`sum(${unifiedResponses.timeSpent})`
    }).from(unifiedResponses).where(eq(unifiedResponses.sessionId, sessionId));

    return {
      totalResponses: result[0]?.totalResponses || 0,
      correctResponses: result[0]?.correctResponses || 0,
      averageScore: result[0]?.averageScore || 0,
      totalTimeSpent: result[0]?.totalTimeSpent || 0
    };
  }

  // ============================================================================
  // EVALUATION RULES MANAGEMENT
  // ============================================================================

  async createEvaluationRule(rule: InsertEvaluationRule): Promise<EvaluationRule> {
    const result = await this.db.insert(evaluationRules).values(rule).returning();
    return result[0];
  }

  async getEvaluationRule(id: number): Promise<EvaluationRule | undefined> {
    const result = await this.db.select().from(evaluationRules).where(eq(evaluationRules.id, id));
    return result[0];
  }

  async updateEvaluationRule(id: number, updates: Partial<EvaluationRule>): Promise<EvaluationRule | undefined> {
    const result = await this.db.update(evaluationRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(evaluationRules.id, id))
      .returning();
    return result[0];
  }

  async deleteEvaluationRule(id: number): Promise<void> {
    await this.db.delete(evaluationRules).where(eq(evaluationRules.id, id));
  }

  async getEvaluationRulesByType(questionTypes: QuestionType[]): Promise<EvaluationRule[]> {
    return await this.db.select().from(evaluationRules)
      .where(and(
        sql`${evaluationRules.questionTypes} && ${questionTypes}`,
        eq(evaluationRules.isActive, true)
      ));
  }

  async getActiveEvaluationRules(): Promise<EvaluationRule[]> {
    return await this.db.select().from(evaluationRules)
      .where(eq(evaluationRules.isActive, true));
  }

  // ============================================================================
  // AI GENERATION TEMPLATES MANAGEMENT
  // ============================================================================

  async createAiGenerationTemplate(template: InsertAiGenerationTemplate): Promise<AiGenerationTemplate> {
    const result = await this.db.insert(aiGenerationTemplates).values(template).returning();
    return result[0];
  }

  async getAiGenerationTemplate(id: number): Promise<AiGenerationTemplate | undefined> {
    const result = await this.db.select().from(aiGenerationTemplates).where(eq(aiGenerationTemplates.id, id));
    return result[0];
  }

  async updateAiGenerationTemplate(id: number, updates: Partial<AiGenerationTemplate>): Promise<AiGenerationTemplate | undefined> {
    const result = await this.db.update(aiGenerationTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiGenerationTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteAiGenerationTemplate(id: number): Promise<void> {
    await this.db.delete(aiGenerationTemplates).where(eq(aiGenerationTemplates.id, id));
  }

  async getAiGenerationTemplatesByType(questionType: QuestionType): Promise<AiGenerationTemplate[]> {
    return await this.db.select().from(aiGenerationTemplates)
      .where(and(eq(aiGenerationTemplates.questionType, questionType), eq(aiGenerationTemplates.isActive, true)));
  }

  async getActiveAiGenerationTemplates(): Promise<AiGenerationTemplate[]> {
    return await this.db.select().from(aiGenerationTemplates)
      .where(eq(aiGenerationTemplates.isActive, true));
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkCreateQuestions(questions: InsertUnifiedQuestion[]): Promise<UnifiedQuestion[]> {
    return await this.createMultipleQuestions(questions);
  }

  async bulkUpdateQuestionUsage(usageData: Array<{ id: number; wasCorrect: boolean; responseTime: number }>): Promise<void> {
    for (const usage of usageData) {
      await this.updateQuestionUsageStats(usage.id, usage.wasCorrect, usage.responseTime);
    }
  }

  async bulkCreateResponses(responses: InsertUnifiedResponse[]): Promise<UnifiedResponse[]> {
    const result = await this.db.insert(unifiedResponses).values(responses).returning();
    return result;
  }

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  async getSystemAnalytics(): Promise<{
    totalQuestions: number;
    totalTemplates: number;
    totalSessions: number;
    totalResponses: number;
    averageSessionScore: number;
    mostUsedQuestionTypes: Array<{ type: QuestionType; count: number }>;
    popularSkills: Array<{ skill: Skill; count: number }>;
  }> {
    const [questionsCount, templatesCount, sessionsCount, responsesCount] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(unifiedQuestions),
      this.db.select({ count: sql<number>`count(*)` }).from(unifiedTestTemplates),
      this.db.select({ count: sql<number>`count(*)` }).from(unifiedTestSessions),
      this.db.select({ count: sql<number>`count(*)` }).from(unifiedResponses)
    ]);

    const avgScore = await this.db.select({
      avg: sql<number>`avg(case when results->>'overallScore' is not null then (results->>'overallScore')::numeric else null end)`
    }).from(unifiedTestSessions).where(eq(unifiedTestSessions.status, 'completed'));

    // For now, return basic analytics - can be enhanced later
    return {
      totalQuestions: questionsCount[0]?.count || 0,
      totalTemplates: templatesCount[0]?.count || 0,
      totalSessions: sessionsCount[0]?.count || 0,
      totalResponses: responsesCount[0]?.count || 0,
      averageSessionScore: avgScore[0]?.avg || 0,
      mostUsedQuestionTypes: [], // TODO: Implement detailed analytics
      popularSkills: [] // TODO: Implement detailed analytics
    };
  }

  async exportQuestionBank(criteria?: { skills?: Skill[]; cefrLevels?: CEFRLevel[]; questionTypes?: QuestionType[] }): Promise<UnifiedQuestion[]> {
    if (!criteria) {
      return await this.db.select().from(unifiedQuestions).where(eq(unifiedQuestions.isActive, true));
    }

    const { questions } = await this.searchQuestions({
      skills: criteria.skills,
      cefrLevels: criteria.cefrLevels,
      questionTypes: criteria.questionTypes,
      isActive: true
    });

    return questions;
  }

  async getQuestionVersionHistory(parentQuestionId: number): Promise<UnifiedQuestion[]> {
    return await this.db.select().from(unifiedQuestions)
      .where(eq(unifiedQuestions.parentQuestionId, parentQuestionId))
      .orderBy(desc(unifiedQuestions.version));
  }

  async archiveOldSessions(cutoffDate: Date): Promise<number> {
    const result = await this.db.update(unifiedTestSessions)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(and(
        eq(unifiedTestSessions.status, 'completed'),
        lte(unifiedTestSessions.completedAt, cutoffDate)
      ))
      .returning({ id: unifiedTestSessions.id });

    return result.length;
  }
}