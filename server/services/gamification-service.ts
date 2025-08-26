/**
 * Gamification Service
 * Handles age-based game mechanics, daily challenges, achievements, and leaderboards
 */

import type { DatabaseStorage } from '../database-storage';
import { 
  achievements, 
  userAchievements, 
  userStats,
  games,
  gameLeaderboards,
  userGameProgress,
  gameSessions 
} from '../../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export interface DailyChallenge {
  id: number;
  title: string;
  description: string;
  targetType: 'xp' | 'games' | 'accuracy' | 'streak' | 'time';
  targetValue: number;
  xpReward: number;
  coinsReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ageGroup: string;
  expiresAt: Date;
}

export interface GameRecommendation {
  gameId: number;
  gameName: string;
  reason: string;
  difficulty: string;
  estimatedXP: number;
  ageAppropriate: boolean;
}

export interface AchievementProgress {
  achievementId: number;
  title: string;
  description: string;
  progress: number;
  target: number;
  percentComplete: number;
  xpReward: number;
  isUnlocked: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  score: number;
  level: number;
  xp: number;
  achievements: number;
  avatar?: string;
}

export class GamificationService {
  constructor(private storage: DatabaseStorage) {}

  /**
   * Generate daily challenges based on user age and level
   */
  async generateDailyChallenges(userId: number): Promise<DailyChallenge[]> {
    try {
      // Get user data including age group and level
      const user = await this.storage.getUser(userId);
      if (!user) throw new Error('User not found');

      const userAge = this.calculateAge(user.dateOfBirth);
      const ageGroup = this.getAgeGroup(userAge);
      const stats = await this.getUserStats(userId);

      // Generate challenges appropriate for age and skill level
      const challenges: DailyChallenge[] = [];
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 24);

      // Easy challenge - always achievable
      challenges.push({
        id: Date.now() + 1,
        title: this.getAgeChallengeTitle(ageGroup, 'easy'),
        description: this.getAgeChallengeDescription(ageGroup, 'easy'),
        targetType: 'xp',
        targetValue: Math.max(100, stats.currentLevel * 50),
        xpReward: 50,
        coinsReward: 10,
        difficulty: 'easy',
        ageGroup,
        expiresAt: tomorrow
      });

      // Medium challenge - moderate difficulty
      challenges.push({
        id: Date.now() + 2,
        title: this.getAgeChallengeTitle(ageGroup, 'medium'),
        description: this.getAgeChallengeDescription(ageGroup, 'medium'),
        targetType: 'games',
        targetValue: userAge < 12 ? 2 : 3,
        xpReward: 100,
        coinsReward: 25,
        difficulty: 'medium',
        ageGroup,
        expiresAt: tomorrow
      });

      // Hard challenge - for dedicated learners
      if (stats.currentLevel >= 5 || userAge >= 14) {
        challenges.push({
          id: Date.now() + 3,
          title: this.getAgeChallengeTitle(ageGroup, 'hard'),
          description: this.getAgeChallengeDescription(ageGroup, 'hard'),
          targetType: 'accuracy',
          targetValue: 85,
          xpReward: 200,
          coinsReward: 50,
          difficulty: 'hard',
          ageGroup,
          expiresAt: tomorrow
        });
      }

      // Special streak challenge
      if (stats.streakDays > 0) {
        challenges.push({
          id: Date.now() + 4,
          title: 'Keep the Fire Burning! 🔥',
          description: `Maintain your ${stats.streakDays + 1} day streak`,
          targetType: 'streak',
          targetValue: stats.streakDays + 1,
          xpReward: stats.streakDays * 20,
          coinsReward: stats.streakDays * 5,
          difficulty: 'medium',
          ageGroup,
          expiresAt: tomorrow
        });
      }

      return challenges;
    } catch (error) {
      console.error('Error generating daily challenges:', error);
      return [];
    }
  }

  /**
   * Get age-appropriate games for user
   */
  async getAgeAppropriateGames(userId: number): Promise<GameRecommendation[]> {
    try {
      const user = await this.storage.getUser(userId);
      if (!user) return [];

      const userAge = this.calculateAge(user.dateOfBirth);
      const ageGroup = this.getAgeGroup(userAge);
      const stats = await this.getUserStats(userId);
      const userLevel = this.mapXPToLanguageLevel(stats.totalXp);

      // Get games matching age group and level
      const appropriateGames = await this.storage.db
        .select()
        .from(games)
        .where(
          and(
            eq(games.ageGroup, ageGroup),
            lte(games.minLevel, userLevel),
            gte(games.maxLevel, userLevel),
            eq(games.isActive, true)
          )
        );

      // Get user's game progress
      const userProgress = await this.storage.db
        .select()
        .from(userGameProgress)
        .where(eq(userGameProgress.userId, userId));

      const progressMap = new Map(
        userProgress.map(p => [p.gameId, p])
      );

      // Generate recommendations
      const recommendations: GameRecommendation[] = appropriateGames.map(game => {
        const progress = progressMap.get(game.id);
        const playCount = progress?.gamesPlayed || 0;
        
        let reason = '';
        if (playCount === 0) {
          reason = '✨ New game perfect for your age group!';
        } else if (playCount < 3) {
          reason = '🎯 You\'re getting the hang of this!';
        } else if (progress && progress.totalScore > 0) {
          const avgScore = progress.totalScore / progress.gamesPlayed;
          if (avgScore > 80) {
            reason = '⭐ You excel at this game!';
          } else {
            reason = '💪 Room for improvement - practice makes perfect!';
          }
        }

        // Age-specific motivation
        if (userAge < 10) {
          reason += ' Fun and colorful!';
        } else if (userAge < 15) {
          reason += ' Challenge your friends!';
        } else {
          reason += ' Master new skills!';
        }

        return {
          gameId: game.id,
          gameName: game.gameName,
          reason,
          difficulty: this.calculateGameDifficulty(game, stats),
          estimatedXP: game.xpReward || 50,
          ageAppropriate: true
        };
      });

      // Sort by recommendation priority
      recommendations.sort((a, b) => {
        // Prioritize new games
        const aProgress = progressMap.get(a.gameId);
        const bProgress = progressMap.get(b.gameId);
        
        if (!aProgress && bProgress) return -1;
        if (aProgress && !bProgress) return 1;
        
        // Then by difficulty matching user level
        return Math.abs(a.difficulty === 'medium' ? 0 : 1) - 
               Math.abs(b.difficulty === 'medium' ? 0 : 1);
      });

      return recommendations.slice(0, 6); // Return top 6 recommendations
    } catch (error) {
      console.error('Error getting age-appropriate games:', error);
      return [];
    }
  }

  /**
   * Check and unlock achievements based on user progress
   */
  async checkAndUnlockAchievements(userId: number): Promise<AchievementProgress[]> {
    try {
      const stats = await this.getUserStats(userId);
      const allAchievements = await this.storage.db
        .select()
        .from(achievements)
        .where(eq(achievements.isActive, true));

      const unlockedAchievements = await this.storage.db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));

      const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId));
      const progressList: AchievementProgress[] = [];
      const newUnlocks: number[] = [];

      for (const achievement of allAchievements) {
        const isUnlocked = unlockedIds.has(achievement.id);
        const progress = await this.calculateAchievementProgress(
          userId,
          achievement,
          stats
        );

        progressList.push({
          achievementId: achievement.id,
          title: achievement.title,
          description: achievement.description,
          progress: progress.current,
          target: progress.target,
          percentComplete: Math.min(100, (progress.current / progress.target) * 100),
          xpReward: achievement.xpReward || 0,
          isUnlocked
        });

        // Check if achievement should be unlocked
        if (!isUnlocked && progress.current >= progress.target) {
          newUnlocks.push(achievement.id);
        }
      }

      // Unlock new achievements
      for (const achievementId of newUnlocks) {
        await this.unlockAchievement(userId, achievementId);
      }

      return progressList;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Get leaderboard with multiple views
   */
  async getLeaderboard(
    type: 'daily' | 'weekly' | 'monthly' | 'all_time',
    ageGroup?: string,
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    try {
      const period = this.getPeriodString(type);
      
      // Build query based on type
      let query = this.storage.db
        .select({
          userId: userStats.userId,
          totalXp: userStats.totalXp,
          currentLevel: userStats.currentLevel,
          achievementCount: sql<number>`COUNT(DISTINCT ${userAchievements.achievementId})`,
        })
        .from(userStats)
        .leftJoin(userAchievements, eq(userStats.userId, userAchievements.userId))
        .groupBy(userStats.userId, userStats.totalXp, userStats.currentLevel);

      // Filter by period for non-all-time leaderboards
      if (type !== 'all_time' && period) {
        const dateFilter = this.getDateFilter(type);
        query = query.where(gte(userStats.lastActivityAt, dateFilter));
      }

      const entries = await query
        .orderBy(desc(userStats.totalXp))
        .limit(limit);

      // Get user details and calculate ranks
      const leaderboard: LeaderboardEntry[] = [];
      let rank = 1;

      for (const entry of entries) {
        const user = await this.storage.getUser(entry.userId);
        if (!user) continue;

        // Check age group filter
        if (ageGroup) {
          const userAge = this.calculateAge(user.dateOfBirth);
          const userAgeGroup = this.getAgeGroup(userAge);
          if (userAgeGroup !== ageGroup) continue;
        }

        leaderboard.push({
          rank: rank++,
          userId: entry.userId,
          userName: `${user.firstName} ${user.lastName}`,
          score: entry.totalXp,
          level: entry.currentLevel,
          xp: entry.totalXp,
          achievements: entry.achievementCount,
          avatar: user.profileImage
        });
      }

      return leaderboard;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Update user XP and level
   */
  async awardXP(userId: number, xpAmount: number, reason: string): Promise<void> {
    try {
      const stats = await this.getUserStats(userId);
      const newTotalXP = stats.totalXp + xpAmount;
      const newLevel = this.calculateLevel(newTotalXP);

      await this.storage.db
        .update(userStats)
        .set({
          totalXp: newTotalXP,
          currentLevel: newLevel,
          lastActivityAt: new Date()
        })
        .where(eq(userStats.userId, userId));

      // Check for level-up achievements
      if (newLevel > stats.currentLevel) {
        await this.checkAndUnlockAchievements(userId);
      }

      // Log XP transaction
      console.log(`Awarded ${xpAmount} XP to user ${userId} for: ${reason}`);
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }

  // Helper methods
  private async getUserStats(userId: number) {
    let stats = await this.storage.db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .then(rows => rows[0]);

    if (!stats) {
      // Create initial stats
      await this.storage.db.insert(userStats).values({
        userId,
        totalXp: 0,
        currentLevel: 1,
        streakDays: 0,
        lastActivityAt: new Date()
      });

      stats = await this.storage.db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .then(rows => rows[0]);
    }

    return stats;
  }

  private calculateAge(dateOfBirth?: string | Date | null): number {
    if (!dateOfBirth) return 18; // Default age
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private getAgeGroup(age: number): string {
    if (age < 10) return '5-10';
    if (age < 15) return '11-14';
    if (age < 21) return '15-20';
    return '21+';
  }

  private mapXPToLanguageLevel(xp: number): string {
    if (xp < 1000) return 'A1';
    if (xp < 3000) return 'A2';
    if (xp < 7000) return 'B1';
    if (xp < 15000) return 'B2';
    if (xp < 30000) return 'C1';
    return 'C2';
  }

  private calculateLevel(xp: number): number {
    // Level formula: level = floor(sqrt(xp / 100))
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  private calculateGameDifficulty(game: any, stats: any): string {
    const userLevel = this.mapXPToLanguageLevel(stats.totalXp);
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const userLevelIndex = levelOrder.indexOf(userLevel);
    const gameLevelIndex = levelOrder.indexOf(game.minLevel);
    
    if (gameLevelIndex > userLevelIndex + 1) return 'hard';
    if (gameLevelIndex < userLevelIndex - 1) return 'easy';
    return 'medium';
  }

  private async calculateAchievementProgress(
    userId: number,
    achievement: any,
    stats: any
  ): Promise<{ current: number; target: number }> {
    const requirements = achievement.requirements as any;
    
    switch (achievement.type) {
      case 'streak':
        return {
          current: stats.streakDays,
          target: requirements.days || 7
        };
      
      case 'milestone':
        return {
          current: stats.totalXp,
          target: requirements.xp || 1000
        };
      
      case 'skill':
        // Check game performance
        const gameProgress = await this.storage.db
          .select()
          .from(userGameProgress)
          .where(eq(userGameProgress.userId, userId));
        
        const totalGames = gameProgress.reduce((sum, p) => sum + p.gamesPlayed, 0);
        return {
          current: totalGames,
          target: requirements.games || 10
        };
      
      case 'social':
        // Check social interactions
        return {
          current: 0,
          target: requirements.interactions || 5
        };
      
      default:
        return { current: 0, target: 1 };
    }
  }

  private async unlockAchievement(userId: number, achievementId: number): Promise<void> {
    await this.storage.db.insert(userAchievements).values({
      userId,
      achievementId,
      unlockedAt: new Date(),
      isNotified: false
    });

    // Award XP for achievement
    const achievement = await this.storage.db
      .select()
      .from(achievements)
      .where(eq(achievements.id, achievementId))
      .then(rows => rows[0]);

    if (achievement && achievement.xpReward) {
      await this.awardXP(userId, achievement.xpReward, `Achievement: ${achievement.title}`);
    }
  }

  private getPeriodString(type: 'daily' | 'weekly' | 'monthly' | 'all_time'): string {
    const now = new Date();
    switch (type) {
      case 'daily':
        return now.toISOString().split('T')[0];
      case 'weekly':
        const week = Math.ceil(now.getDate() / 7);
        return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
      case 'monthly':
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      default:
        return '';
    }
  }

  private getDateFilter(type: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    switch (type) {
      case 'daily':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'weekly':
        return new Date(now.setDate(now.getDate() - 7));
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() - 1));
      default:
        return now;
    }
  }

  private getAgeChallengeTitle(ageGroup: string, difficulty: string): string {
    const titles: Record<string, Record<string, string>> = {
      '5-10': {
        easy: '🌟 Star Collector',
        medium: '🚀 Space Explorer',
        hard: '🏆 Champion Quest'
      },
      '11-14': {
        easy: '⚡ Quick Learner',
        medium: '🎯 Skill Master',
        hard: '💎 Diamond Hunter'
      },
      '15-20': {
        easy: '📚 Knowledge Seeker',
        medium: '🔥 Streak Builder',
        hard: '🎓 Scholar Challenge'
      },
      '21+': {
        easy: '🎯 Daily Goal',
        medium: '💪 Power Hour',
        hard: '🏅 Expert Mode'
      }
    };
    
    return titles[ageGroup]?.[difficulty] || 'Daily Challenge';
  }

  private getAgeChallengeDescription(ageGroup: string, difficulty: string): string {
    const descriptions: Record<string, Record<string, string>> = {
      '5-10': {
        easy: 'Collect stars by completing fun activities!',
        medium: 'Explore new games and earn rewards!',
        hard: 'Become today\'s champion!'
      },
      '11-14': {
        easy: 'Show your learning speed!',
        medium: 'Master new skills and level up!',
        hard: 'Rare diamonds await the brave!'
      },
      '15-20': {
        easy: 'Expand your knowledge today!',
        medium: 'Keep your learning streak alive!',
        hard: 'Prove your expertise!'
      },
      '21+': {
        easy: 'Achieve your daily learning goal',
        medium: 'Intensive practice session',
        hard: 'Expert-level challenge'
      }
    };
    
    return descriptions[ageGroup]?.[difficulty] || 'Complete today\'s challenge!';
  }
}