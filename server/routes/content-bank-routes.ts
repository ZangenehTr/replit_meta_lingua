/**
 * Content Bank API Routes
 * Endpoints for managing and retrieving LinguaQuest educational content
 */

import type { Express } from "express";
import { contentBankService } from "../services/content-bank-service";
import { seedContentBank } from "../content/seed-content-bank";

export function setupContentBankRoutes(app: Express) {
  
  /**
   * Seed content bank with educational content
   * POST /api/content-bank/seed
   */
  app.post('/api/content-bank/seed', async (req, res) => {
    try {
      const result = await seedContentBank();
      res.json(result);
    } catch (error) {
      console.error('Error seeding content bank:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to seed content bank'
      });
    }
  });

  /**
   * Get content for specific game type and CEFR level
   * GET /api/content-bank/game/:cefrLevel/:gameType
   */
  app.get('/api/content-bank/game/:cefrLevel/:gameType', async (req, res) => {
    try {
      const { cefrLevel, gameType } = req.params;
      const { limit = '10' } = req.query;
      
      const content = await contentBankService.getContentForGame(
        cefrLevel,
        gameType,
        parseInt(limit as string)
      );
      
      res.json({
        success: true,
        content,
        count: content.length,
        cefrLevel,
        gameType
      });
    } catch (error) {
      console.error('Error fetching game content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game content'
      });
    }
  });

  /**
   * Get vocabulary matching content
   * GET /api/content-bank/vocabulary-matching/:cefrLevel
   */
  app.get('/api/content-bank/vocabulary-matching/:cefrLevel', async (req, res) => {
    try {
      const { cefrLevel } = req.params;
      const { count = '10' } = req.query;
      
      const content = await contentBankService.getVocabularyMatching(
        cefrLevel,
        parseInt(count as string)
      );
      
      res.json({
        success: true,
        content,
        count: content.length
      });
    } catch (error) {
      console.error('Error fetching vocabulary content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vocabulary content'
      });
    }
  });

  /**
   * Get sentence scramble content
   * GET /api/content-bank/sentence-scramble/:cefrLevel
   */
  app.get('/api/content-bank/sentence-scramble/:cefrLevel', async (req, res) => {
    try {
      const { cefrLevel } = req.params;
      const { count = '5' } = req.query;
      
      const content = await contentBankService.getSentenceScramble(
        cefrLevel,
        parseInt(count as string)
      );
      
      res.json({
        success: true,
        content,
        count: content.length
      });
    } catch (error) {
      console.error('Error fetching sentence content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sentence content'
      });
    }
  });

  /**
   * Get multiple choice questions
   * GET /api/content-bank/multiple-choice/:cefrLevel
   */
  app.get('/api/content-bank/multiple-choice/:cefrLevel', async (req, res) => {
    try {
      const { cefrLevel } = req.params;
      const { count = '10' } = req.query;
      
      const content = await contentBankService.getMultipleChoice(
        cefrLevel,
        parseInt(count as string)
      );
      
      res.json({
        success: true,
        content,
        count: content.length
      });
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch questions'
      });
    }
  });

  /**
   * Get grammar content
   * GET /api/content-bank/grammar/:cefrLevel
   */
  app.get('/api/content-bank/grammar/:cefrLevel', async (req, res) => {
    try {
      const { cefrLevel } = req.params;
      const { count = '5' } = req.query;
      
      const content = await contentBankService.getGrammarContent(
        cefrLevel,
        parseInt(count as string)
      );
      
      res.json({
        success: true,
        content,
        count: content.length
      });
    } catch (error) {
      console.error('Error fetching grammar content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch grammar content'
      });
    }
  });

  /**
   * Get content by topic
   * GET /api/content-bank/topic/:cefrLevel/:topic
   */
  app.get('/api/content-bank/topic/:cefrLevel/:topic', async (req, res) => {
    try {
      const { cefrLevel, topic } = req.params;
      const { limit = '10' } = req.query;
      
      const content = await contentBankService.getContentByTopic(
        cefrLevel,
        topic,
        parseInt(limit as string)
      );
      
      res.json({
        success: true,
        content,
        count: content.length
      });
    } catch (error) {
      console.error('Error fetching topic content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch topic content'
      });
    }
  });

  /**
   * Get content statistics
   * GET /api/content-bank/stats
   */
  app.get('/api/content-bank/stats', async (req, res) => {
    try {
      const stats = await contentBankService.getContentStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error fetching content stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch content statistics'
      });
    }
  });

  /**
   * Update content usage (track performance)
   * POST /api/content-bank/usage
   */
  app.post('/api/content-bank/usage', async (req, res) => {
    try {
      const { contentId, wasCorrect } = req.body;
      
      if (!contentId || typeof wasCorrect !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'contentId and wasCorrect (boolean) are required'
        });
      }
      
      await contentBankService.incrementUsageCount(contentId, wasCorrect);
      
      res.json({
        success: true,
        message: 'Usage statistics updated'
      });
    } catch (error) {
      console.error('Error updating usage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update usage statistics'
      });
    }
  });

  /**
   * Search content (admin)
   * GET /api/content-bank/search
   */
  app.get('/api/content-bank/search', async (req, res) => {
    try {
      const { q, limit = '20' } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search query (q) is required'
        });
      }
      
      const content = await contentBankService.searchContent(q, parseInt(limit as string));
      
      res.json({
        success: true,
        content,
        count: content.length,
        query: q
      });
    } catch (error) {
      console.error('Error searching content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search content'
      });
    }
  });
}
