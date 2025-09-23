import { z } from "zod";

// Guest progress data structures
export interface GuestProgressData {
  sessionToken: string;
  currentLevel: number;
  totalXp: number;
  currentStreak: number;
  completedLessons: number[];
  strongSkills: string[];
  weakSkills: string[];
  preferredDifficulty: string;
  totalStudyTimeMinutes: number;
  achievements: GuestAchievement[];
  lastActiveAt: string;
  fingerprintHash?: string;
}

export interface GuestAchievement {
  id: number;
  achievementType: string;
  achievementTitle: string;
  achievementDescription: string;
  iconUrl?: string;
  badgeColor: string;
  progress: number;
  targetValue: number;
  isUnlocked: boolean;
  xpReward: number;
  category: string;
  difficulty: string;
  unlockedAt?: string;
}

export interface LessonProgress {
  lessonId: number;
  completedAt: string;
  score?: number;
  timeSpentMinutes: number;
  attempts: number;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  timezone: string;
  isMobile: boolean;
  isTablet: boolean;
}

/**
 * LinguaQuest Guest Progress Tracking
 * Manages anonymous user progress with localStorage + cloud sync
 */
export class GuestProgressManager {
  private static instance: GuestProgressManager;
  private sessionToken: string | null = null;
  private progress: GuestProgressData | null = null;
  private syncEnabled: boolean = true;
  private fingerprintHash: string | null = null;

  // Local storage keys
  private static readonly STORAGE_KEY = 'linguaquest_guest_progress';
  private static readonly SESSION_TOKEN_KEY = 'linguaquest_session_token';
  private static readonly FINGERPRINT_KEY = 'linguaquest_fingerprint';

  private constructor() {
    this.loadFromLocalStorage();
    this.generateDeviceFingerprint();
  }

  public static getInstance(): GuestProgressManager {
    if (!GuestProgressManager.instance) {
      GuestProgressManager.instance = new GuestProgressManager();
    }
    return GuestProgressManager.instance;
  }

  // ====================================================================
  // SESSION MANAGEMENT
  // ====================================================================

  /**
   * Initialize guest session - creates new or loads existing
   */
  async initializeSession(): Promise<string> {
    try {
      // Check if we have existing session token
      if (this.sessionToken && this.progress) {
        return this.sessionToken;
      }

      // Generate device info for fingerprinting
      const deviceInfo = this.getDeviceInfo();

      // Create new guest session via API
      const response = await fetch('/api/linguaquest/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceInfo,
          fingerprintHash: this.fingerprintHash
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create guest session');
      }

      this.sessionToken = result.sessionToken;
      localStorage.setItem(GuestProgressManager.SESSION_TOKEN_KEY, this.sessionToken);

      // Load session data from server
      await this.syncFromServer();

      return this.sessionToken;
    } catch (error) {
      console.error('Error initializing guest session:', error);
      
      // Fallback to local-only mode
      this.sessionToken = this.generateFallbackSessionToken();
      this.progress = this.createEmptyProgress();
      this.syncEnabled = false;
      
      this.saveToLocalStorage();
      return this.sessionToken;
    }
  }

  /**
   * Get current session token
   */
  getSessionToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Get current progress data
   */
  getProgress(): GuestProgressData | null {
    return this.progress;
  }

  // ====================================================================
  // PROGRESS TRACKING
  // ====================================================================

  /**
   * Complete a lesson and update progress
   */
  async completeLesson(
    lessonId: number, 
    timeSpentMinutes: number = 10, 
    xpEarned: number = 50
  ): Promise<{
    success: boolean;
    levelUp: boolean;
    newAchievements: GuestAchievement[];
    shouldShowUpgradePrompt: boolean;
  }> {
    try {
      if (!this.sessionToken) {
        await this.initializeSession();
      }

      if (!this.progress) {
        throw new Error('No progress data available');
      }

      // Update local progress immediately for responsiveness
      this.updateLocalProgress(lessonId, xpEarned, timeSpentMinutes);

      // Sync with server if enabled
      if (this.syncEnabled && this.sessionToken) {
        const response = await fetch(`/api/linguaquest/lessons/${lessonId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionToken: this.sessionToken,
            timeSpentMinutes,
            xpEarned
          })
        });

        const result = await response.json();

        if (result.success) {
          // Update with server response
          return {
            success: true,
            levelUp: result.result.levelUp,
            newAchievements: result.result.newAchievements || [],
            shouldShowUpgradePrompt: result.result.shouldShowUpgradePrompt
          };
        }
      }

      // Return local result if server sync fails
      return {
        success: true,
        levelUp: false,
        newAchievements: [],
        shouldShowUpgradePrompt: this.shouldShowUpgradePrompt()
      };
    } catch (error) {
      console.error('Error completing lesson:', error);
      return {
        success: false,
        levelUp: false,
        newAchievements: [],
        shouldShowUpgradePrompt: false
      };
    }
  }

  /**
   * Update local progress data
   */
  private updateLocalProgress(lessonId: number, xpEarned: number, timeSpentMinutes: number): void {
    if (!this.progress) return;

    // Avoid duplicate completions
    if (!this.progress.completedLessons.includes(lessonId)) {
      this.progress.completedLessons.push(lessonId);
    }

    this.progress.totalXp += xpEarned;
    this.progress.totalStudyTimeMinutes += timeSpentMinutes;
    this.progress.currentStreak += 1;
    this.progress.currentLevel = Math.floor(this.progress.totalXp / 100) + 1;
    this.progress.lastActiveAt = new Date().toISOString();

    this.saveToLocalStorage();
  }

  /**
   * Get lesson recommendations based on progress
   */
  async getRecommendedLessons(): Promise<any[]> {
    try {
      if (!this.sessionToken) {
        await this.initializeSession();
      }

      const response = await fetch(`/api/linguaquest/recommendations/${this.sessionToken}`);
      const result = await response.json();

      if (result.success) {
        return result.lessons;
      }

      // Fallback to basic lessons
      return this.getFallbackLessons();
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getFallbackLessons();
    }
  }

  // ====================================================================
  // ACHIEVEMENTS
  // ====================================================================

  /**
   * Get user achievements
   */
  async getAchievements(): Promise<GuestAchievement[]> {
    try {
      if (!this.sessionToken) {
        await this.initializeSession();
      }

      if (this.syncEnabled && this.sessionToken) {
        const response = await fetch(`/api/linguaquest/achievements/${this.sessionToken}`);
        const result = await response.json();

        if (result.success) {
          return result.achievements;
        }
      }

      // Return local achievements
      return this.progress?.achievements || [];
    } catch (error) {
      console.error('Error getting achievements:', error);
      return this.progress?.achievements || [];
    }
  }

  // ====================================================================
  // CONVERSION TRACKING
  // ====================================================================

  /**
   * Track conversion event
   */
  async trackEvent(funnelStage: string, conversionEvent: string, eventData?: any): Promise<void> {
    try {
      if (!this.sessionToken || !this.syncEnabled) return;

      await fetch('/api/linguaquest/track-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: this.sessionToken,
          funnelStage,
          conversionEvent,
          eventData
        })
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Record upgrade prompt shown
   */
  async recordUpgradePrompt(promptType: string, promptPosition: string): Promise<void> {
    try {
      if (!this.sessionToken || !this.syncEnabled) return;

      await fetch('/api/linguaquest/upgrade-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: this.sessionToken,
          promptType,
          promptPosition
        })
      });
    } catch (error) {
      console.error('Error recording upgrade prompt:', error);
    }
  }

  /**
   * Check if should show upgrade prompt
   */
  private shouldShowUpgradePrompt(): boolean {
    if (!this.progress) return false;
    
    const completedLessons = this.progress.completedLessons.length;
    const promptTriggers = [3, 7, 15];
    
    return promptTriggers.includes(completedLessons);
  }

  // ====================================================================
  // LOCAL STORAGE & PERSISTENCE
  // ====================================================================

  /**
   * Load progress from local storage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(GuestProgressManager.STORAGE_KEY);
      const sessionToken = localStorage.getItem(GuestProgressManager.SESSION_TOKEN_KEY);
      const fingerprint = localStorage.getItem(GuestProgressManager.FINGERPRINT_KEY);

      if (stored) {
        this.progress = JSON.parse(stored);
      }

      if (sessionToken) {
        this.sessionToken = sessionToken;
      }

      if (fingerprint) {
        this.fingerprintHash = fingerprint;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  /**
   * Save progress to local storage
   */
  private saveToLocalStorage(): void {
    try {
      if (this.progress) {
        localStorage.setItem(GuestProgressManager.STORAGE_KEY, JSON.stringify(this.progress));
      }

      if (this.sessionToken) {
        localStorage.setItem(GuestProgressManager.SESSION_TOKEN_KEY, this.sessionToken);
      }

      if (this.fingerprintHash) {
        localStorage.setItem(GuestProgressManager.FINGERPRINT_KEY, this.fingerprintHash);
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Sync progress from server
   */
  private async syncFromServer(): Promise<void> {
    try {
      if (!this.sessionToken) return;

      const response = await fetch(`/api/linguaquest/session/${this.sessionToken}`);
      const result = await response.json();

      if (result.success && result.session) {
        this.progress = {
          sessionToken: this.sessionToken,
          currentLevel: result.session.progress.currentLevel,
          totalXp: result.session.progress.totalXp,
          currentStreak: result.session.progress.currentStreak,
          completedLessons: result.session.progress.completedLessons || [],
          strongSkills: result.session.progress.strongSkills || [],
          weakSkills: result.session.progress.weakSkills || [],
          preferredDifficulty: result.session.progress.preferredDifficulty,
          totalStudyTimeMinutes: result.session.progress.totalStudyTimeMinutes,
          achievements: result.session.achievements || [],
          lastActiveAt: result.session.progress.lastActiveAt,
          fingerprintHash: this.fingerprintHash
        };

        this.saveToLocalStorage();
      }
    } catch (error) {
      console.error('Error syncing from server:', error);
      this.syncEnabled = false;
    }
  }

  // ====================================================================
  // HELPER METHODS
  // ====================================================================

  /**
   * Generate device fingerprint for user correlation
   */
  private generateDeviceFingerprint(): void {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('LinguaQuest fingerprint', 2, 2);
      }

      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas.toDataURL()
      ].join('|');

      this.fingerprintHash = btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      localStorage.setItem(GuestProgressManager.FINGERPRINT_KEY, this.fingerprintHash);
    } catch (error) {
      console.error('Error generating fingerprint:', error);
      this.fingerprintHash = 'fallback_' + Date.now().toString(36);
    }
  }

  /**
   * Get device information for session creation
   */
  private getDeviceInfo(): DeviceInfo {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android.*Tablet/i.test(navigator.userAgent);

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: screen.width,
      screenHeight: screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isMobile,
      isTablet
    };
  }

  /**
   * Generate fallback session token for offline mode
   */
  private generateFallbackSessionToken(): string {
    return 'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2);
  }

  /**
   * Create empty progress structure
   */
  private createEmptyProgress(): GuestProgressData {
    return {
      sessionToken: this.sessionToken || '',
      currentLevel: 1,
      totalXp: 0,
      currentStreak: 0,
      completedLessons: [],
      strongSkills: [],
      weakSkills: [],
      preferredDifficulty: 'beginner',
      totalStudyTimeMinutes: 0,
      achievements: [],
      lastActiveAt: new Date().toISOString(),
      fingerprintHash: this.fingerprintHash
    };
  }

  /**
   * Get fallback lessons for offline mode
   */
  private getFallbackLessons(): any[] {
    return [
      {
        id: 1,
        title: 'Basic Greetings',
        description: 'Learn essential greeting phrases',
        difficulty: 'beginner',
        lessonType: 'vocabulary',
        estimatedDurationMinutes: 10,
        xpReward: 50
      },
      {
        id: 2,
        title: 'Numbers 1-20',
        description: 'Practice counting and numbers',
        difficulty: 'beginner',
        lessonType: 'vocabulary',
        estimatedDurationMinutes: 15,
        xpReward: 75
      }
    ];
  }

  /**
   * Clear all guest data (for testing or reset)
   */
  clearAllData(): void {
    this.sessionToken = null;
    this.progress = null;
    this.fingerprintHash = null;
    
    localStorage.removeItem(GuestProgressManager.STORAGE_KEY);
    localStorage.removeItem(GuestProgressManager.SESSION_TOKEN_KEY);
    localStorage.removeItem(GuestProgressManager.FINGERPRINT_KEY);
  }
}

// Export singleton instance
export const guestProgress = GuestProgressManager.getInstance();