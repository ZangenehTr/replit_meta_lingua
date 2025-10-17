/**
 * Content Bank Service
 * Retrieves and manages LinguaQuest educational content
 */

import { db } from "../db";
import { linguaquestContentBank, type LinguaquestContentBank } from "../../shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

export class ContentBankService {
  /**
   * Get content by CEFR level and game type
   */
  async getContentForGame(
    cefrLevel: string,
    gameType: string,
    limit: number = 10
  ): Promise<LinguaquestContentBank[]> {
    try {
      const content = await db
        .select()
        .from(linguaquestContentBank)
        .where(
          and(
            eq(linguaquestContentBank.cefrLevel, cefrLevel),
            sql`${gameType} = ANY(${linguaquestContentBank.gameTypes})`,
            eq(linguaquestContentBank.isActive, true)
          )
        )
        .orderBy(sql`RANDOM()`) // Random selection for variety
        .limit(limit);

      return content;
    } catch (error) {
      console.error('Error fetching content for game:', error);
      return [];
    }
  }

  /**
   * Get vocabulary items for matching games
   */
  async getVocabularyMatching(cefrLevel: string, count: number = 10) {
    return this.getContentForGame(cefrLevel, 'vocabulary_matching', count);
  }

  /**
   * Get sentences for scramble games
   */
  async getSentenceScramble(cefrLevel: string, count: number = 5) {
    return this.getContentForGame(cefrLevel, 'sentence_scramble', count);
  }

  /**
   * Get questions for multiple choice
   */
  async getMultipleChoice(cefrLevel: string, count: number = 10) {
    return this.getContentForGame(cefrLevel, 'multiple_choice', count);
  }

  /**
   * Get grammar content
   */
  async getGrammarContent(cefrLevel: string, count: number = 5) {
    return this.getContentForGame(cefrLevel, 'grammar_battles', count);
  }

  /**
   * Get content by topic category
   */
  async getContentByTopic(
    cefrLevel: string,
    topicCategory: string,
    limit: number = 10
  ): Promise<LinguaquestContentBank[]> {
    try {
      const content = await db
        .select()
        .from(linguaquestContentBank)
        .where(
          and(
            eq(linguaquestContentBank.cefrLevel, cefrLevel),
            eq(linguaquestContentBank.topicCategory, topicCategory),
            eq(linguaquestContentBank.isActive, true)
          )
        )
        .limit(limit);

      return content;
    } catch (error) {
      console.error('Error fetching content by topic:', error);
      return [];
    }
  }

  /**
   * Get content with audio available
   */
  async getContentWithAudio(
    cefrLevel: string,
    gameType: string,
    limit: number = 10
  ): Promise<LinguaquestContentBank[]> {
    try {
      const content = await db
        .select()
        .from(linguaquestContentBank)
        .where(
          and(
            eq(linguaquestContentBank.cefrLevel, cefrLevel),
            sql`${gameType} = ANY(${linguaquestContentBank.gameTypes})`,
            eq(linguaquestContentBank.hasAudio, true),
            eq(linguaquestContentBank.isActive, true)
          )
        )
        .orderBy(sql`RANDOM()`)
        .limit(limit);

      return content;
    } catch (error) {
      console.error('Error fetching audio content:', error);
      return [];
    }
  }

  /**
   * Get content statistics
   */
  async getContentStats() {
    try {
      const stats = await db
        .select({
          cefrLevel: linguaquestContentBank.cefrLevel,
          contentType: linguaquestContentBank.contentType,
          count: sql<number>`count(*)`
        })
        .from(linguaquestContentBank)
        .where(eq(linguaquestContentBank.isActive, true))
        .groupBy(linguaquestContentBank.cefrLevel, linguaquestContentBank.contentType);

      return stats;
    } catch (error) {
      console.error('Error fetching content stats:', error);
      return [];
    }
  }

  /**
   * Update content usage statistics
   */
  async incrementUsageCount(contentId: number, wasCorrect: boolean) {
    try {
      const content = await db
        .select()
        .from(linguaquestContentBank)
        .where(eq(linguaquestContentBank.id, contentId))
        .limit(1);

      if (content.length === 0) return;

      const currentUsage = content[0].usageCount || 0;
      const currentSuccessRate = content[0].successRate ? parseFloat(content[0].successRate.toString()) : 0;
      
      // Calculate new success rate
      const newSuccessRate = wasCorrect
        ? ((currentSuccessRate * currentUsage) + 100) / (currentUsage + 1)
        : ((currentSuccessRate * currentUsage) + 0) / (currentUsage + 1);

      await db
        .update(linguaquestContentBank)
        .set({
          usageCount: currentUsage + 1,
          successRate: newSuccessRate.toFixed(2),
          updatedAt: new Date()
        })
        .where(eq(linguaquestContentBank.id, contentId));
    } catch (error) {
      console.error('Error updating usage stats:', error);
    }
  }

  /**
   * Get content by IDs (for specific game sessions)
   */
  async getContentByIds(ids: number[]): Promise<LinguaquestContentBank[]> {
    try {
      if (ids.length === 0) return [];

      const content = await db
        .select()
        .from(linguaquestContentBank)
        .where(inArray(linguaquestContentBank.id, ids));

      return content;
    } catch (error) {
      console.error('Error fetching content by IDs:', error);
      return [];
    }
  }

  /**
   * Search content by text (for admin)
   */
  async searchContent(searchTerm: string, limit: number = 20) {
    try {
      const content = await db
        .select()
        .from(linguaquestContentBank)
        .where(
          and(
            sql`${linguaquestContentBank.primaryText} ILIKE ${`%${searchTerm}%`}`,
            eq(linguaquestContentBank.isActive, true)
          )
        )
        .limit(limit);

      return content;
    } catch (error) {
      console.error('Error searching content:', error);
      return [];
    }
  }
}

export const contentBankService = new ContentBankService();
