/**
 * Mood Intelligence Service
 * Analyzes and responds to student emotional states for optimized learning
 */

import { DatabaseStorage } from '../database-storage';
import { OllamaService } from '../ollama-service';
import { 
  MoodEntry, 
  InsertMoodEntry,
  MoodRecommendation,
  InsertMoodRecommendation,
  LearningAdaptation,
  MoodCategory,
  MOOD_CATEGORIES 
} from '../../shared/mood-schema';

export interface MoodAnalysis {
  primaryMood: MoodCategory;
  secondaryMoods: MoodCategory[];
  emotionalState: 'positive' | 'neutral' | 'negative' | 'mixed';
  confidence: number;
  triggers: string[];
  recommendations: MoodBasedRecommendation[];
}

export interface MoodBasedRecommendation {
  type: 'content' | 'activity' | 'break' | 'social' | 'mindfulness';
  urgency: 'immediate' | 'soon' | 'later';
  title: string;
  description: string;
  expectedImpact: string;
  duration: number;
}

export interface EmotionalPattern {
  pattern: string;
  frequency: number;
  triggers: string[];
  effectiveInterventions: string[];
  timeOfDay?: string;
  contextualFactors?: string[];
}

export interface MoodTrend {
  period: 'daily' | 'weekly' | 'monthly';
  trend: 'improving' | 'stable' | 'declining' | 'variable';
  averageMood: number;
  volatility: number;
  insights: string[];
}

export class MoodIntelligenceService {
  private storage: DatabaseStorage;
  private ollamaService: OllamaService;
  private moodCache: Map<number, MoodEntry[]>;
  private patternAnalysis: Map<number, EmotionalPattern[]>;

  constructor(storage: DatabaseStorage, ollamaService: OllamaService) {
    this.storage = storage;
    this.ollamaService = ollamaService;
    this.moodCache = new Map();
    this.patternAnalysis = new Map();
  }

  /**
   * Detect mood from various inputs
   */
  async detectMood(
    userId: number,
    input: {
      text?: string;
      voiceAnalysis?: any;
      behavioralData?: any;
      facialExpression?: any;
    }
  ): Promise<MoodAnalysis> {
    const analysis: MoodAnalysis = {
      primaryMood: 'neutral' as MoodCategory,
      secondaryMoods: [],
      emotionalState: 'neutral',
      confidence: 0,
      triggers: [],
      recommendations: []
    };

    // Text-based mood detection
    if (input.text) {
      const textMood = await this.analyzeTextMood(input.text);
      analysis.primaryMood = textMood.mood;
      analysis.confidence = textMood.confidence;
      analysis.triggers.push(...textMood.triggers);
    }

    // Voice-based mood detection
    if (input.voiceAnalysis) {
      const voiceMood = this.analyzeVoiceMood(input.voiceAnalysis);
      analysis.secondaryMoods.push(voiceMood.mood);
      analysis.confidence = Math.max(analysis.confidence, voiceMood.confidence);
    }

    // Behavioral pattern analysis
    if (input.behavioralData) {
      const behaviorMood = this.analyzeBehavioralMood(input.behavioralData);
      if (behaviorMood.mood !== analysis.primaryMood) {
        analysis.secondaryMoods.push(behaviorMood.mood);
      }
      analysis.triggers.push(...behaviorMood.triggers);
    }

    // Determine overall emotional state
    analysis.emotionalState = this.categorizeEmotionalState(analysis.primaryMood);
    
    // Generate recommendations based on mood
    analysis.recommendations = await this.generateMoodRecommendations(
      userId,
      analysis
    );

    // Store mood entry
    await this.storeMoodEntry(userId, analysis);

    return analysis;
  }

  /**
   * Track mood over time and identify patterns
   */
  async trackMoodPatterns(userId: number): Promise<EmotionalPattern[]> {
    // Get historical mood data
    const moodHistory = await this.getMoodHistory(userId, 30); // Last 30 days
    
    // Identify patterns
    const patterns: EmotionalPattern[] = [];
    
    // Time-based patterns
    const timePatterns = this.analyzeTimePatterns(moodHistory);
    patterns.push(...timePatterns);
    
    // Trigger-based patterns
    const triggerPatterns = this.analyzeTriggerPatterns(moodHistory);
    patterns.push(...triggerPatterns);
    
    // Context-based patterns
    const contextPatterns = this.analyzeContextPatterns(moodHistory);
    patterns.push(...contextPatterns);
    
    // Store patterns for future reference
    this.patternAnalysis.set(userId, patterns);
    
    // Update learning adaptations based on patterns
    await this.updateLearningAdaptations(userId, patterns);
    
    return patterns;
  }

  /**
   * Generate personalized recommendations based on mood
   */
  async generateMoodRecommendations(
    userId: number,
    moodAnalysis: MoodAnalysis
  ): Promise<MoodBasedRecommendation[]> {
    const recommendations: MoodBasedRecommendation[] = [];
    
    // Get user's mood patterns and preferences
    const patterns = this.patternAnalysis.get(userId) || [];
    const preferences = await this.getUserPreferences(userId);
    
    // Immediate interventions for negative states
    if (moodAnalysis.emotionalState === 'negative') {
      recommendations.push(...this.getImmediateInterventions(moodAnalysis));
    }
    
    // Content recommendations based on mood
    const contentRecs = await this.getContentRecommendations(
      moodAnalysis,
      preferences
    );
    recommendations.push(...contentRecs);
    
    // Activity recommendations
    const activityRecs = this.getActivityRecommendations(
      moodAnalysis,
      patterns
    );
    recommendations.push(...activityRecs);
    
    // Store recommendations
    for (const rec of recommendations) {
      await this.storeRecommendation(userId, moodAnalysis, rec);
    }
    
    return recommendations;
  }

  /**
   * Analyze mood trends over time
   */
  async analyzeMoodTrends(
    userId: number,
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<MoodTrend> {
    const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    const moodHistory = await this.getMoodHistory(userId, days);
    
    if (moodHistory.length === 0) {
      return {
        period,
        trend: 'stable',
        averageMood: 5,
        volatility: 0,
        insights: ['Not enough data for trend analysis']
      };
    }
    
    // Calculate average mood
    const avgMood = moodHistory.reduce((sum, entry) => sum + entry.moodScore, 0) / moodHistory.length;
    
    // Calculate volatility (standard deviation)
    const variance = moodHistory.reduce((sum, entry) => 
      sum + Math.pow(entry.moodScore - avgMood, 2), 0) / moodHistory.length;
    const volatility = Math.sqrt(variance);
    
    // Determine trend
    const trend = this.calculateTrend(moodHistory);
    
    // Generate insights
    const insights = await this.generateMoodInsights(
      moodHistory,
      avgMood,
      volatility,
      trend
    );
    
    return {
      period,
      trend,
      averageMood: avgMood,
      volatility,
      insights
    };
  }

  /**
   * Adapt learning based on mood
   */
  async adaptLearningToMood(
    userId: number,
    sessionId: number,
    currentMood: MoodAnalysis
  ): Promise<{
    adaptations: string[];
    contentAdjustments: any;
    paceAdjustments: any;
  }> {
    const adaptations: string[] = [];
    const contentAdjustments: any = {};
    const paceAdjustments: any = {};
    
    // Adjust based on emotional state
    switch (currentMood.emotionalState) {
      case 'positive':
        adaptations.push('Increase challenge level');
        contentAdjustments.difficulty = 1.2;
        contentAdjustments.variety = 'high';
        paceAdjustments.speed = 1.1;
        break;
        
      case 'negative':
        adaptations.push('Provide more support and encouragement');
        contentAdjustments.difficulty = 0.8;
        contentAdjustments.supportLevel = 'high';
        paceAdjustments.speed = 0.9;
        paceAdjustments.breaks = 'frequent';
        break;
        
      case 'neutral':
        adaptations.push('Maintain current approach');
        contentAdjustments.difficulty = 1.0;
        paceAdjustments.speed = 1.0;
        break;
        
      case 'mixed':
        adaptations.push('Monitor closely and adjust dynamically');
        contentAdjustments.flexible = true;
        paceAdjustments.adaptive = true;
        break;
    }
    
    // Specific mood adaptations
    if (currentMood.primaryMood === 'tired') {
      adaptations.push('Shorten session duration');
      adaptations.push('Include energizing activities');
      paceAdjustments.sessionLength = 0.75;
    }
    
    if (currentMood.primaryMood === 'anxious' || currentMood.primaryMood === 'stressed') {
      adaptations.push('Include relaxation exercises');
      adaptations.push('Reduce time pressure');
      contentAdjustments.timedActivities = false;
      contentAdjustments.relaxation = true;
    }
    
    if (currentMood.primaryMood === 'excited' || currentMood.primaryMood === 'motivated') {
      adaptations.push('Capitalize on high energy');
      adaptations.push('Introduce new concepts');
      contentAdjustments.newMaterial = true;
      paceAdjustments.intensity = 'high';
    }
    
    // Store adaptation decision
    await this.storage.query(
      `INSERT INTO learning_adaptations 
       (user_id, mood_pattern, adaptation_strategy, preferred_content_types, optimal_duration, last_updated)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, mood_pattern) DO UPDATE
       SET adaptation_strategy = $3, last_updated = NOW()`,
      [
        userId,
        currentMood.primaryMood,
        JSON.stringify(adaptations),
        JSON.stringify(contentAdjustments),
        paceAdjustments.sessionLength || 1
      ]
    );
    
    return { adaptations, contentAdjustments, paceAdjustments };
  }

  // Helper methods
  private async analyzeTextMood(text: string): Promise<{
    mood: MoodCategory;
    confidence: number;
    triggers: string[];
  }> {
    const prompt = `
      Analyze the emotional tone of this text:
      "${text}"
      
      Identify:
      1. Primary mood from: ${MOOD_CATEGORIES.join(', ')}
      2. Confidence level (0-1)
      3. Potential triggers or causes
      
      Format as JSON with mood, confidence, and triggers.
    `;

    const response = await this.ollamaService.generateResponse(prompt, 'mood_analyzer');
    
    try {
      const analysis = JSON.parse(response);
      return {
        mood: analysis.mood as MoodCategory,
        confidence: analysis.confidence,
        triggers: analysis.triggers || []
      };
    } catch {
      // Fallback to keyword-based analysis
      return this.keywordBasedMoodAnalysis(text);
    }
  }

  private keywordBasedMoodAnalysis(text: string): {
    mood: MoodCategory;
    confidence: number;
    triggers: string[];
  } {
    const lowerText = text.toLowerCase();
    const moodKeywords: Record<MoodCategory, string[]> = {
      'happy': ['happy', 'great', 'wonderful', 'excellent'],
      'excited': ['excited', 'amazing', 'can\'t wait', 'awesome'],
      'motivated': ['ready', 'determined', 'focused', 'goal'],
      'calm': ['peaceful', 'relaxed', 'comfortable', 'steady'],
      'focused': ['concentrated', 'attentive', 'clear', 'sharp'],
      'confident': ['sure', 'capable', 'strong', 'ready'],
      'curious': ['interesting', 'wonder', 'question', 'learn'],
      'sad': ['sad', 'unhappy', 'down', 'blue'],
      'frustrated': ['frustrated', 'annoying', 'difficult', 'stuck'],
      'anxious': ['worried', 'nervous', 'uncertain', 'tense'],
      'stressed': ['stressed', 'pressure', 'overwhelmed', 'too much'],
      'tired': ['tired', 'exhausted', 'sleepy', 'drained'],
      'bored': ['bored', 'dull', 'monotonous', 'uninteresting'],
      'overwhelmed': ['overwhelmed', 'too much', 'can\'t handle', 'swamped'],
      'confused': ['confused', 'don\'t understand', 'unclear', 'lost'],
      'discouraged': ['discouraged', 'giving up', 'hopeless', 'defeated']
    };
    
    let detectedMood: MoodCategory = 'calm';
    let maxScore = 0;
    
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      const score = keywords.filter(kw => lowerText.includes(kw)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedMood = mood as MoodCategory;
      }
    }
    
    return {
      mood: detectedMood,
      confidence: maxScore > 0 ? Math.min(maxScore * 0.3, 1) : 0.5,
      triggers: []
    };
  }

  private analyzeVoiceMood(voiceData: any): {
    mood: MoodCategory;
    confidence: number;
  } {
    // Analyze voice characteristics (pitch, speed, volume)
    const pitch = voiceData.pitch || 0.5;
    const speed = voiceData.speed || 0.5;
    const volume = voiceData.volume || 0.5;
    
    let mood: MoodCategory = 'calm';
    let confidence = 0.6;
    
    if (pitch > 0.7 && speed > 0.6) {
      mood = 'excited';
      confidence = 0.7;
    } else if (pitch < 0.3 && speed < 0.4) {
      mood = 'tired';
      confidence = 0.7;
    } else if (volume < 0.3) {
      mood = 'sad';
      confidence = 0.6;
    } else if (speed > 0.7) {
      mood = 'anxious';
      confidence = 0.6;
    }
    
    return { mood, confidence };
  }

  private analyzeBehavioralMood(behaviorData: any): {
    mood: MoodCategory;
    triggers: string[];
  } {
    const responseTime = behaviorData.responseTime || 5;
    const errorRate = behaviorData.errorRate || 0.1;
    const engagement = behaviorData.engagement || 0.7;
    
    let mood: MoodCategory = 'focused';
    const triggers: string[] = [];
    
    if (responseTime > 10) {
      mood = 'confused';
      triggers.push('Slow response times indicate confusion');
    } else if (errorRate > 0.3) {
      mood = 'frustrated';
      triggers.push('High error rate suggests frustration');
    } else if (engagement < 0.3) {
      mood = 'bored';
      triggers.push('Low engagement indicates boredom');
    } else if (engagement > 0.8 && errorRate < 0.1) {
      mood = 'motivated';
      triggers.push('High engagement and accuracy');
    }
    
    return { mood, triggers };
  }

  private categorizeEmotionalState(mood: MoodCategory): 'positive' | 'neutral' | 'negative' | 'mixed' {
    const positive: MoodCategory[] = ['happy', 'excited', 'motivated', 'confident', 'curious'];
    const negative: MoodCategory[] = ['sad', 'frustrated', 'anxious', 'stressed', 'tired', 
                                       'bored', 'overwhelmed', 'confused', 'discouraged'];
    const neutral: MoodCategory[] = ['calm', 'focused'];
    
    if (positive.includes(mood)) return 'positive';
    if (negative.includes(mood)) return 'negative';
    if (neutral.includes(mood)) return 'neutral';
    return 'mixed';
  }

  private getImmediateInterventions(moodAnalysis: MoodAnalysis): MoodBasedRecommendation[] {
    const interventions: MoodBasedRecommendation[] = [];
    
    if (moodAnalysis.primaryMood === 'stressed' || moodAnalysis.primaryMood === 'overwhelmed') {
      interventions.push({
        type: 'mindfulness',
        urgency: 'immediate',
        title: 'Quick Breathing Exercise',
        description: 'Take 2 minutes for deep breathing to reduce stress',
        expectedImpact: 'Immediate stress relief',
        duration: 2
      });
    }
    
    if (moodAnalysis.primaryMood === 'frustrated') {
      interventions.push({
        type: 'break',
        urgency: 'immediate',
        title: 'Short Break',
        description: 'Step away for 5 minutes to reset',
        expectedImpact: 'Clear mind and reduce frustration',
        duration: 5
      });
    }
    
    if (moodAnalysis.primaryMood === 'tired') {
      interventions.push({
        type: 'activity',
        urgency: 'immediate',
        title: 'Energy Booster',
        description: 'Quick physical movement or stretching',
        expectedImpact: 'Increase alertness',
        duration: 3
      });
    }
    
    return interventions;
  }

  private async getContentRecommendations(
    moodAnalysis: MoodAnalysis,
    preferences: any
  ): Promise<MoodBasedRecommendation[]> {
    const recommendations: MoodBasedRecommendation[] = [];
    
    if (moodAnalysis.emotionalState === 'positive') {
      recommendations.push({
        type: 'content',
        urgency: 'soon',
        title: 'Challenge Content',
        description: 'Tackle more advanced material while motivation is high',
        expectedImpact: 'Maximize learning during peak mood',
        duration: 20
      });
    } else if (moodAnalysis.emotionalState === 'negative') {
      recommendations.push({
        type: 'content',
        urgency: 'soon',
        title: 'Review Session',
        description: 'Review familiar material to build confidence',
        expectedImpact: 'Boost confidence through mastery',
        duration: 15
      });
    }
    
    return recommendations;
  }

  private getActivityRecommendations(
    moodAnalysis: MoodAnalysis,
    patterns: EmotionalPattern[]
  ): MoodBasedRecommendation[] {
    const recommendations: MoodBasedRecommendation[] = [];
    
    // Find effective interventions from patterns
    const effectiveForMood = patterns
      .filter(p => p.pattern.includes(moodAnalysis.primaryMood))
      .flatMap(p => p.effectiveInterventions);
    
    if (effectiveForMood.length > 0) {
      recommendations.push({
        type: 'activity',
        urgency: 'soon',
        title: 'Personalized Activity',
        description: effectiveForMood[0],
        expectedImpact: 'Based on your successful patterns',
        duration: 10
      });
    }
    
    return recommendations;
  }

  private async getMoodHistory(userId: number, days: number): Promise<MoodEntry[]> {
    const cached = this.moodCache.get(userId);
    if (cached && cached.length > 0) {
      return cached;
    }
    
    const history = await this.storage.query(
      `SELECT * FROM mood_entries 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [userId]
    );
    
    this.moodCache.set(userId, history);
    return history;
  }

  private analyzeTimePatterns(moodHistory: MoodEntry[]): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = [];
    
    // Group by time of day
    const timeGroups = {
      morning: [] as MoodEntry[],
      afternoon: [] as MoodEntry[],
      evening: [] as MoodEntry[]
    };
    
    moodHistory.forEach(entry => {
      const hour = new Date(entry.createdAt).getHours();
      if (hour < 12) timeGroups.morning.push(entry);
      else if (hour < 18) timeGroups.afternoon.push(entry);
      else timeGroups.evening.push(entry);
    });
    
    // Analyze each time period
    for (const [time, entries] of Object.entries(timeGroups)) {
      if (entries.length > 3) {
        const avgMood = entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length;
        const commonMood = this.getMostCommonMood(entries);
        
        patterns.push({
          pattern: `${time}_${commonMood}`,
          frequency: entries.length,
          triggers: [],
          effectiveInterventions: [],
          timeOfDay: time
        });
      }
    }
    
    return patterns;
  }

  private analyzeTriggerPatterns(moodHistory: MoodEntry[]): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = [];
    const triggerGroups = new Map<string, MoodEntry[]>();
    
    // Group by context/trigger
    moodHistory.forEach(entry => {
      if (entry.context) {
        const existing = triggerGroups.get(entry.context) || [];
        existing.push(entry);
        triggerGroups.set(entry.context, existing);
      }
    });
    
    // Analyze trigger patterns
    triggerGroups.forEach((entries, trigger) => {
      if (entries.length > 2) {
        const avgMood = entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length;
        const commonMood = this.getMostCommonMood(entries);
        
        patterns.push({
          pattern: `trigger_${commonMood}`,
          frequency: entries.length,
          triggers: [trigger],
          effectiveInterventions: [],
          contextualFactors: [trigger]
        });
      }
    });
    
    return patterns;
  }

  private analyzeContextPatterns(moodHistory: MoodEntry[]): EmotionalPattern[] {
    // Analyze patterns based on multiple contextual factors
    const patterns: EmotionalPattern[] = [];
    
    // Example: Look for patterns in metadata
    const metadataPatterns = new Map<string, MoodEntry[]>();
    
    moodHistory.forEach(entry => {
      if (entry.metadata) {
        const key = JSON.stringify(entry.metadata);
        const existing = metadataPatterns.get(key) || [];
        existing.push(entry);
        metadataPatterns.set(key, existing);
      }
    });
    
    return patterns;
  }

  private getMostCommonMood(entries: MoodEntry[]): string {
    const moodCounts = new Map<string, number>();
    
    entries.forEach(entry => {
      const count = moodCounts.get(entry.moodCategory) || 0;
      moodCounts.set(entry.moodCategory, count + 1);
    });
    
    let maxCount = 0;
    let mostCommon = 'neutral';
    
    moodCounts.forEach((count, mood) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = mood;
      }
    });
    
    return mostCommon;
  }

  private async updateLearningAdaptations(
    userId: number,
    patterns: EmotionalPattern[]
  ): Promise<void> {
    for (const pattern of patterns) {
      await this.storage.query(
        `INSERT INTO learning_adaptations 
         (user_id, mood_pattern, adaptation_strategy, preferred_content_types, optimal_duration, success_rate, last_updated)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (user_id, mood_pattern) DO UPDATE
         SET last_updated = NOW(), success_rate = $6`,
        [
          userId,
          pattern.pattern,
          JSON.stringify(pattern.effectiveInterventions),
          JSON.stringify([]),
          30, // default duration
          Math.round(pattern.frequency * 10) // simplified success rate
        ]
      );
    }
  }

  private async getUserPreferences(userId: number): Promise<any> {
    const user = await this.storage.getStudent(userId);
    return {
      learningStyle: user?.learningStyle || 'visual',
      preferredActivities: [],
      interests: user?.interests || []
    };
  }

  private calculateTrend(moodHistory: MoodEntry[]): 'improving' | 'stable' | 'declining' | 'variable' {
    if (moodHistory.length < 3) return 'stable';
    
    // Simple linear regression
    const n = moodHistory.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = moodHistory.map(e => e.moodScore);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Calculate variance
    const mean = sumY / n;
    const variance = y.reduce((sum, yi) => sum + Math.pow(yi - mean, 2), 0) / n;
    
    if (variance > 4) return 'variable';
    if (slope > 0.1) return 'improving';
    if (slope < -0.1) return 'declining';
    return 'stable';
  }

  private async generateMoodInsights(
    history: MoodEntry[],
    avgMood: number,
    volatility: number,
    trend: string
  ): Promise<string[]> {
    const insights: string[] = [];
    
    if (trend === 'improving') {
      insights.push('Your mood has been improving recently');
    } else if (trend === 'declining') {
      insights.push('Your mood has been declining - consider taking breaks');
    }
    
    if (volatility > 2) {
      insights.push('Your mood has been variable - try to maintain consistency');
    }
    
    if (avgMood > 7) {
      insights.push('You\'re maintaining a positive mood - great job!');
    } else if (avgMood < 4) {
      insights.push('Consider activities that boost your mood');
    }
    
    // Time-based insights
    const morningMoods = history.filter(e => new Date(e.createdAt).getHours() < 12);
    const eveningMoods = history.filter(e => new Date(e.createdAt).getHours() >= 18);
    
    if (morningMoods.length > 0 && eveningMoods.length > 0) {
      const avgMorning = morningMoods.reduce((sum, e) => sum + e.moodScore, 0) / morningMoods.length;
      const avgEvening = eveningMoods.reduce((sum, e) => sum + e.moodScore, 0) / eveningMoods.length;
      
      if (avgMorning > avgEvening + 2) {
        insights.push('You tend to feel better in the morning');
      } else if (avgEvening > avgMorning + 2) {
        insights.push('Your mood improves throughout the day');
      }
    }
    
    return insights;
  }

  private async storeMoodEntry(userId: number, analysis: MoodAnalysis): Promise<void> {
    const entry: InsertMoodEntry = {
      userId,
      moodScore: this.moodToScore(analysis.primaryMood),
      moodCategory: analysis.primaryMood,
      energyLevel: 5, // Default, would be calculated from analysis
      motivationLevel: 5,
      stressLevel: analysis.primaryMood === 'stressed' ? 8 : 3,
      focusLevel: analysis.primaryMood === 'focused' ? 8 : 5,
      context: analysis.triggers.join(', '),
      detectedFrom: 'automatic',
      metadata: analysis
    };
    
    await this.storage.query(
      `INSERT INTO mood_entries 
       (user_id, mood_score, mood_category, energy_level, motivation_level, stress_level, focus_level, context, detected_from, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      Object.values(entry)
    );
  }

  private async storeRecommendation(
    userId: number,
    moodAnalysis: MoodAnalysis,
    rec: MoodBasedRecommendation
  ): Promise<void> {
    await this.storage.query(
      `INSERT INTO mood_recommendations 
       (user_id, mood_entry_id, recommendation_type, content_type, difficulty, duration, title, description, reasoning, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        0, // Would get actual mood_entry_id
        rec.type,
        rec.type,
        'medium',
        rec.duration,
        rec.title,
        rec.description,
        rec.expectedImpact,
        rec.urgency === 'immediate' ? 10 : rec.urgency === 'soon' ? 5 : 1
      ]
    );
  }

  private moodToScore(mood: MoodCategory): number {
    const scores: Record<MoodCategory, number> = {
      'happy': 8, 'excited': 9, 'motivated': 8, 'calm': 6, 'focused': 7,
      'confident': 8, 'curious': 7, 'sad': 3, 'frustrated': 3, 'anxious': 4,
      'stressed': 3, 'tired': 4, 'bored': 4, 'overwhelmed': 2, 'confused': 4,
      'discouraged': 3
    };
    return scores[mood] || 5;
  }
}