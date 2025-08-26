/**
 * Gamification Routes
 * API endpoints for gamification features including daily challenges, leaderboards, and achievements
 */

import { Router } from 'express';
import type { DatabaseStorage } from '../database-storage';
import { GamificationService } from '../services/gamification-service';

export function createGamificationRouter(storage: DatabaseStorage): Router {
  const router = Router();
  const gamificationService = new GamificationService(storage);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.user && !req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // =============== Daily Challenges ===============
  
  /**
   * Get daily challenges for current user
   * GET /api/gamification/daily-challenges
   */
  router.get('/daily-challenges', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || 1; // Default for testing
      const challenges = await gamificationService.generateDailyChallenges(userId);
      
      res.json({
        success: true,
        challenges,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error getting daily challenges:', error);
      res.status(500).json({ 
        error: 'Failed to get daily challenges',
        message: error.message 
      });
    }
  });

  /**
   * Complete a daily challenge
   * POST /api/gamification/daily-challenges/:challengeId/complete
   */
  router.post('/daily-challenges/:challengeId/complete', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || 1;
      const { challengeId } = req.params;
      const { progressData } = req.body;

      // Award XP for completing challenge
      await gamificationService.awardXP(
        userId,
        progressData.xpEarned || 50,
        `Daily Challenge Completed: ${challengeId}`
      );

      res.json({
        success: true,
        message: 'Challenge completed successfully',
        xpAwarded: progressData.xpEarned || 50
      });
    } catch (error: any) {
      console.error('Error completing challenge:', error);
      res.status(500).json({ 
        error: 'Failed to complete challenge',
        message: error.message 
      });
    }
  });

  // =============== Age-Appropriate Games ===============
  
  /**
   * Get recommended games based on age and skill level
   * GET /api/gamification/recommended-games
   */
  router.get('/recommended-games', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || 1;
      const recommendations = await gamificationService.getAgeAppropriateGames(userId);
      
      res.json({
        success: true,
        recommendations,
        totalGames: recommendations.length
      });
    } catch (error: any) {
      console.error('Error getting game recommendations:', error);
      res.status(500).json({ 
        error: 'Failed to get game recommendations',
        message: error.message 
      });
    }
  });

  // =============== Achievements ===============
  
  /**
   * Get achievement progress for user
   * GET /api/gamification/achievements
   */
  router.get('/achievements', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || 1;
      const achievements = await gamificationService.checkAndUnlockAchievements(userId);
      
      const unlocked = achievements.filter(a => a.isUnlocked);
      const inProgress = achievements.filter(a => !a.isUnlocked && a.percentComplete > 0);
      const locked = achievements.filter(a => !a.isUnlocked && a.percentComplete === 0);

      res.json({
        success: true,
        summary: {
          total: achievements.length,
          unlocked: unlocked.length,
          inProgress: inProgress.length,
          locked: locked.length,
          totalXP: unlocked.reduce((sum, a) => sum + a.xpReward, 0)
        },
        achievements: {
          unlocked,
          inProgress,
          locked
        }
      });
    } catch (error: any) {
      console.error('Error getting achievements:', error);
      res.status(500).json({ 
        error: 'Failed to get achievements',
        message: error.message 
      });
    }
  });

  /**
   * Manually check and unlock achievements
   * POST /api/gamification/achievements/check
   */
  router.post('/achievements/check', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || 1;
      const progress = await gamificationService.checkAndUnlockAchievements(userId);
      
      const newUnlocks = progress.filter(a => a.isUnlocked && a.percentComplete === 100);
      
      res.json({
        success: true,
        newUnlocks: newUnlocks.length,
        achievements: newUnlocks
      });
    } catch (error: any) {
      console.error('Error checking achievements:', error);
      res.status(500).json({ 
        error: 'Failed to check achievements',
        message: error.message 
      });
    }
  });

  // =============== Leaderboards ===============
  
  /**
   * Get leaderboard
   * GET /api/gamification/leaderboard
   */
  router.get('/leaderboard', requireAuth, async (req: any, res) => {
    try {
      const { type = 'weekly', ageGroup, limit = 100 } = req.query;
      
      const leaderboard = await gamificationService.getLeaderboard(
        type as 'daily' | 'weekly' | 'monthly' | 'all_time',
        ageGroup as string | undefined,
        Number(limit)
      );

      // Get current user's position
      const userId = req.user?.id || 1;
      const userPosition = leaderboard.findIndex(entry => entry.userId === userId) + 1;

      res.json({
        success: true,
        type,
        ageGroup: ageGroup || 'all',
        leaderboard,
        userPosition: userPosition > 0 ? userPosition : null,
        totalEntries: leaderboard.length
      });
    } catch (error: any) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({ 
        error: 'Failed to get leaderboard',
        message: error.message 
      });
    }
  });

  /**
   * Get user's leaderboard stats across different periods
   * GET /api/gamification/leaderboard/me
   */
  router.get('/leaderboard/me', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || 1;
      
      const periods: ('daily' | 'weekly' | 'monthly' | 'all_time')[] = [
        'daily', 'weekly', 'monthly', 'all_time'
      ];
      
      const stats: any = {};
      
      for (const period of periods) {
        const leaderboard = await gamificationService.getLeaderboard(period, undefined, 1000);
        const position = leaderboard.findIndex(entry => entry.userId === userId) + 1;
        const entry = leaderboard.find(entry => entry.userId === userId);
        
        stats[period] = {
          rank: position || null,
          score: entry?.score || 0,
          xp: entry?.xp || 0,
          level: entry?.level || 1,
          achievements: entry?.achievements || 0,
          totalPlayers: leaderboard.length
        };
      }

      res.json({
        success: true,
        userId,
        stats
      });
    } catch (error: any) {
      console.error('Error getting user leaderboard stats:', error);
      res.status(500).json({ 
        error: 'Failed to get user leaderboard stats',
        message: error.message 
      });
    }
  });

  // =============== XP and Leveling ===============
  
  /**
   * Award XP to user
   * POST /api/gamification/xp/award
   */
  router.post('/xp/award', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || 1;
      const { amount, reason } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid XP amount' });
      }

      await gamificationService.awardXP(userId, amount, reason || 'Manual XP Award');

      res.json({
        success: true,
        xpAwarded: amount,
        reason: reason || 'Manual XP Award'
      });
    } catch (error: any) {
      console.error('Error awarding XP:', error);
      res.status(500).json({ 
        error: 'Failed to award XP',
        message: error.message 
      });
    }
  });

  /**
   * Get user's gamification stats
   * GET /api/gamification/stats
   */
  router.get('/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || 1;
      
      // Get achievements
      const achievements = await gamificationService.checkAndUnlockAchievements(userId);
      
      // Get daily challenges
      const challenges = await gamificationService.generateDailyChallenges(userId);
      
      // Get leaderboard position
      const weeklyLeaderboard = await gamificationService.getLeaderboard('weekly');
      const position = weeklyLeaderboard.findIndex(entry => entry.userId === userId) + 1;
      
      const userEntry = weeklyLeaderboard.find(entry => entry.userId === userId);

      res.json({
        success: true,
        stats: {
          level: userEntry?.level || 1,
          totalXp: userEntry?.xp || 0,
          weeklyRank: position || null,
          achievements: {
            total: achievements.length,
            unlocked: achievements.filter(a => a.isUnlocked).length
          },
          dailyChallenges: {
            total: challenges.length,
            active: challenges.filter(c => c.expiresAt > new Date()).length
          }
        }
      });
    } catch (error: any) {
      console.error('Error getting gamification stats:', error);
      res.status(500).json({ 
        error: 'Failed to get gamification stats',
        message: error.message 
      });
    }
  });

  return router;
}