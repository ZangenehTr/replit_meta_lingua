import { MoodEntry, MoodRecommendation, MOOD_CATEGORIES, RECOMMENDATION_TYPES } from '../shared/mood-schema';

/**
 * Local Mood Analysis Engine for Iranian Deployment
 * 
 * This system works completely offline with no external dependencies,
 * ensuring full functionality even with internet restrictions.
 * Uses advanced rule-based analysis and local pattern recognition.
 */

export interface PersianLearningContext {
  userId: number;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  targetLanguage: 'persian' | 'farsi';
  nativeLanguage: string;
  learningGoals: string[];
  culturalBackground: string;
  recentPerformance: {
    averageScore: number;
    completedLessons: number;
    strugglingAreas: string[];
    strengths: string[];
  };
  personalityProfile: {
    preferredLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    motivationFactors: string[];
    stressResponse: string;
    culturalPreferences: string[];
  };
  timeContext: {
    timeOfDay: string;
    dayOfWeek: string;
    availableTime: number; // minutes
    localTime: string; // Persian calendar context
  };
}

export interface LocalMoodAnalysis {
  detectedMood: {
    category: string;
    confidence: number;
    emotional_state: string;
    energy_level: number;
    motivation_level: number;
    stress_level: number;
    focus_level: number;
    cultural_factors: string[];
  };
  contextualFactors: {
    learning_challenges: string[];
    time_based_factors: string[];
    cultural_considerations: string[];
    positive_influences: string[];
  };
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    reasoning: string;
    priority: number;
    duration: number;
    difficulty: string;
    cultural_adaptation: string;
  }>;
}

export class LocalMoodAnalyzer {
  
  // Persian/Farsi emotional keywords for cultural context
  private readonly persianEmotionalKeywords = {
    positive: [
      'خوب', 'عالی', 'خوشحال', 'راضی', 'امیدوار', 'انگیزه', 'آماده', 'علاقه',
      'good', 'great', 'happy', 'motivated', 'ready', 'excited', 'confident'
    ],
    negative: [
      'خسته', 'ناراحت', 'استرس', 'نگران', 'سخت', 'مشکل', 'ناامید', 'سردرگم',
      'tired', 'upset', 'stressed', 'worried', 'difficult', 'problem', 'confused', 'frustrated'
    ],
    neutral: [
      'معمولی', 'آرام', 'طبیعی', 'متوسط',
      'normal', 'calm', 'okay', 'average'
    ]
  };

  // Time-based mood patterns for Iranian culture
  private readonly culturalTimePatterns = {
    morning: { energy: 0.8, focus: 0.9, motivation: 0.8 },
    afternoon: { energy: 0.6, focus: 0.7, motivation: 0.6 },
    evening: { energy: 0.4, focus: 0.5, motivation: 0.7 },
    night: { energy: 0.3, focus: 0.4, motivation: 0.5 }
  };

  /**
   * Main mood analysis function - works completely offline
   */
  async analyzeMoodOffline(
    userInput: string,
    inputType: 'text' | 'voice' | 'behavioral',
    context: PersianLearningContext
  ): Promise<LocalMoodAnalysis> {
    
    // Step 1: Text-based emotional analysis
    const textAnalysis = this.analyzeTextualMood(userInput);
    
    // Step 2: Contextual factor analysis
    const contextualFactors = this.analyzeContextualFactors(context);
    
    // Step 3: Cultural adaptation
    const culturalAnalysis = this.applyCulturalContext(textAnalysis, context);
    
    // Step 4: Time-based adjustments
    const timeAdjustedMood = this.applyTimeContext(culturalAnalysis, context.timeContext);
    
    // Step 5: Generate recommendations
    const recommendations = this.generateLocalRecommendations(timeAdjustedMood, context);

    return {
      detectedMood: {
        category: timeAdjustedMood.category,
        confidence: timeAdjustedMood.confidence,
        emotional_state: timeAdjustedMood.emotional_state,
        energy_level: timeAdjustedMood.energy_level,
        motivation_level: timeAdjustedMood.motivation_level,
        stress_level: timeAdjustedMood.stress_level,
        focus_level: timeAdjustedMood.focus_level,
        cultural_factors: culturalAnalysis.cultural_factors
      },
      contextualFactors,
      recommendations
    };
  }

  /**
   * Analyze text input for emotional indicators
   */
  private analyzeTextualMood(input: string): any {
    const inputLower = input.toLowerCase();
    
    // Count emotional indicators
    const positiveCount = this.persianEmotionalKeywords.positive
      .filter(word => inputLower.includes(word)).length;
    const negativeCount = this.persianEmotionalKeywords.negative
      .filter(word => inputLower.includes(word)).length;
    const neutralCount = this.persianEmotionalKeywords.neutral
      .filter(word => inputLower.includes(word)).length;

    // Determine mood category
    let category = 'calm';
    let energy = 5;
    let motivation = 5;
    let stress = 5;
    let focus = 5;
    let confidence = 0.7;

    if (positiveCount > negativeCount) {
      category = 'motivated';
      energy = Math.min(8, 5 + positiveCount);
      motivation = Math.min(9, 5 + positiveCount * 1.5);
      stress = Math.max(2, 5 - positiveCount);
      focus = Math.min(8, 5 + positiveCount);
      confidence = Math.min(0.9, 0.7 + positiveCount * 0.1);
    } else if (negativeCount > positiveCount) {
      category = negativeCount > 2 ? 'stressed' : 'tired';
      energy = Math.max(2, 5 - negativeCount);
      motivation = Math.max(2, 5 - negativeCount * 1.2);
      stress = Math.min(9, 5 + negativeCount * 1.5);
      focus = Math.max(3, 5 - negativeCount);
      confidence = Math.min(0.9, 0.7 + negativeCount * 0.08);
    }

    // Specific mood indicators
    if (inputLower.includes('خسته') || inputLower.includes('tired')) {
      category = 'tired';
      energy = Math.max(2, energy - 2);
    }
    if (inputLower.includes('استرس') || inputLower.includes('stressed')) {
      category = 'stressed';
      stress = Math.min(9, stress + 2);
    }
    if (inputLower.includes('انگیزه') || inputLower.includes('motivated')) {
      category = 'motivated';
      motivation = Math.min(9, motivation + 2);
    }

    return {
      category,
      confidence,
      emotional_state: category,
      energy_level: energy,
      motivation_level: motivation,
      stress_level: stress,
      focus_level: focus
    };
  }

  /**
   * Analyze contextual factors affecting mood
   */
  private analyzeContextualFactors(context: PersianLearningContext): any {
    const factors = {
      learning_challenges: [],
      time_based_factors: [],
      cultural_considerations: [],
      positive_influences: []
    };

    // Learning performance analysis
    if (context.recentPerformance.averageScore < 60) {
      factors.learning_challenges.push('Recent low performance affecting confidence');
    }
    if (context.recentPerformance.strugglingAreas.length > 2) {
      factors.learning_challenges.push('Multiple areas requiring attention');
    }

    // Time-based factors
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      factors.time_based_factors.push('Late/early hour may affect energy');
    }
    if (hour >= 12 && hour <= 15) {
      factors.time_based_factors.push('Post-lunch energy dip period');
    }

    // Cultural considerations for Persian learning
    if (context.targetLanguage === 'persian' || context.targetLanguage === 'farsi') {
      factors.cultural_considerations.push('Persian script and cultural context learning');
      if (context.personalityProfile.culturalPreferences.includes('traditional')) {
        factors.cultural_considerations.push('Traditional learning approach preferred');
      }
    }

    // Positive influences
    if (context.recentPerformance.strengths.length > 0) {
      factors.positive_influences.push(`Strong in: ${context.recentPerformance.strengths.join(', ')}`);
    }
    if (context.personalityProfile.motivationFactors.includes('cultural_connection')) {
      factors.positive_influences.push('Cultural connection as motivation');
    }

    return factors;
  }

  /**
   * Apply Persian/Iranian cultural context to mood analysis
   */
  private applyCulturalContext(moodAnalysis: any, context: PersianLearningContext): any {
    const culturalFactors = [];

    // Persian learning specific considerations
    if (context.targetLanguage === 'persian' || context.targetLanguage === 'farsi') {
      culturalFactors.push('Persian language cultural immersion');
      
      // Adjust mood based on cultural learning challenges
      if (context.recentPerformance.strugglingAreas.includes('script') || 
          context.recentPerformance.strugglingAreas.includes('writing')) {
        moodAnalysis.stress_level = Math.min(8, moodAnalysis.stress_level + 1);
        culturalFactors.push('Persian script learning challenges');
      }

      // Cultural motivation boost
      if (context.personalityProfile.motivationFactors.includes('heritage') ||
          context.personalityProfile.motivationFactors.includes('family')) {
        moodAnalysis.motivation_level = Math.min(9, moodAnalysis.motivation_level + 1);
        culturalFactors.push('Heritage/family motivation');
      }
    }

    // Learning style cultural adaptations
    if (context.personalityProfile.preferredLearningStyle === 'auditory' && 
        context.targetLanguage === 'persian') {
      culturalFactors.push('Persian poetry and music integration beneficial');
    }

    return {
      ...moodAnalysis,
      cultural_factors: culturalFactors
    };
  }

  /**
   * Apply time-based adjustments for Iranian cultural patterns
   */
  private applyTimeContext(moodAnalysis: any, timeContext: any): any {
    const timePattern = this.culturalTimePatterns[timeContext.timeOfDay] || 
                       this.culturalTimePatterns.afternoon;

    // Apply time-based adjustments
    moodAnalysis.energy_level = Math.round(moodAnalysis.energy_level * timePattern.energy);
    moodAnalysis.focus_level = Math.round(moodAnalysis.focus_level * timePattern.focus);
    moodAnalysis.motivation_level = Math.round(moodAnalysis.motivation_level * timePattern.motivation);

    // Ensure values stay within bounds
    moodAnalysis.energy_level = Math.max(1, Math.min(10, moodAnalysis.energy_level));
    moodAnalysis.focus_level = Math.max(1, Math.min(10, moodAnalysis.focus_level));
    moodAnalysis.motivation_level = Math.max(1, Math.min(10, moodAnalysis.motivation_level));

    return moodAnalysis;
  }

  /**
   * Generate personalized recommendations using local rules
   */
  private generateLocalRecommendations(moodState: any, context: PersianLearningContext): any[] {
    const recommendations = [];

    // High stress recommendations
    if (moodState.stress_level > 6) {
      recommendations.push({
        type: 'meditation',
        title: 'Persian Breathing Exercise',
        description: 'Calm your mind with traditional Persian relaxation techniques',
        reasoning: 'High stress detected - relaxation will improve learning capacity',
        priority: 9,
        duration: 5,
        difficulty: 'easy',
        cultural_adaptation: 'Uses Persian mindfulness traditions'
      });
    }

    // Low energy recommendations
    if (moodState.energy_level < 4) {
      recommendations.push({
        type: 'break',
        title: 'Short Cultural Break',
        description: 'Listen to Persian music or view cultural content',
        reasoning: 'Low energy - gentle cultural immersion maintains engagement',
        priority: 8,
        duration: 10,
        difficulty: 'easy',
        cultural_adaptation: 'Persian cultural content for passive learning'
      });
    }

    // High motivation recommendations
    if (moodState.motivation_level > 7) {
      recommendations.push({
        type: 'challenge',
        title: 'Advanced Persian Poetry Reading',
        description: 'Explore classical Persian literature and poetry',
        reasoning: 'High motivation - challenge with culturally enriching content',
        priority: 7,
        duration: 25,
        difficulty: 'hard',
        cultural_adaptation: 'Classical Persian literature for cultural depth'
      });
    }

    // Balanced state recommendations
    if (moodState.energy_level >= 5 && moodState.focus_level >= 5) {
      recommendations.push({
        type: 'content',
        title: 'Interactive Persian Conversation',
        description: 'Practice daily conversations in Persian context',
        reasoning: 'Good energy and focus - ideal for interactive practice',
        priority: 6,
        duration: 20,
        difficulty: 'medium',
        cultural_adaptation: 'Iranian daily life conversation scenarios'
      });
    }

    // Cultural learning based on background
    if (context.personalityProfile.culturalPreferences.includes('history')) {
      recommendations.push({
        type: 'content',
        title: 'Persian Historical Context',
        description: 'Learn language through Persian historical narratives',
        reasoning: 'Cultural interest in history enhances engagement',
        priority: 6,
        duration: 15,
        difficulty: context.currentLevel === 'beginner' ? 'easy' : 'medium',
        cultural_adaptation: 'Persian history integrated language learning'
      });
    }

    // Time-appropriate recommendations
    if (context.timeContext.availableTime < 15) {
      recommendations.push({
        type: 'activity',
        title: 'Quick Persian Word Game',
        description: 'Fast-paced vocabulary building game',
        reasoning: 'Limited time - efficient vocabulary building',
        priority: 5,
        duration: 10,
        difficulty: 'easy',
        cultural_adaptation: 'Persian cultural vocabulary focus'
      });
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Analyze user mood patterns for optimal learning scheduling
   */
  analyzeUserMoodPatterns(
    moodHistory: MoodEntry[],
    sessionOutcomes: any[],
    context: PersianLearningContext
  ): { patterns: any; predictions: any } {
    
    const patterns = {
      bestMoodTimes: [] as string[],
      worstMoodTimes: [] as string[],
      optimalLearningConditions: [] as string[],
      energyPatterns: {} as any,
      motivationTrends: {} as any,
      stressTriggers: [] as string[]
    };

    const predictions = {
      nextOptimalSession: 'morning',
      recommendedDuration: 20,
      suggestedContent: ['review'] as string[],
      culturalOptimization: 'Persian cultural context'
    };

    if (moodHistory.length === 0) {
      return { patterns, predictions };
    }

    // Analyze time-based patterns
    const timePatterns = moodHistory.reduce((acc, mood) => {
      const hour = new Date(mood.createdAt).getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      
      if (!acc[timeOfDay]) {
        acc[timeOfDay] = { total: 0, count: 0, energy: 0, motivation: 0 };
      }
      
      acc[timeOfDay].total += mood.moodScore;
      acc[timeOfDay].energy += mood.energyLevel;
      acc[timeOfDay].motivation += mood.motivationLevel;
      acc[timeOfDay].count++;
      
      return acc;
    }, {} as any);

    // Find best times
    Object.keys(timePatterns).forEach(time => {
      const avg = timePatterns[time].total / timePatterns[time].count;
      if (avg > 6) {
        patterns.bestMoodTimes.push(time);
      } else if (avg < 4) {
        patterns.worstMoodTimes.push(time);
      }
    });

    // Analyze stress triggers
    moodHistory.forEach(mood => {
      if (mood.stressLevel > 7 && mood.context) {
        patterns.stressTriggers.push(mood.context);
      }
    });

    // Generate predictions
    if (patterns.bestMoodTimes.length > 0) {
      predictions.nextOptimalSession = patterns.bestMoodTimes[0];
    }

    // Average motivation patterns
    const avgMotivation = moodHistory.reduce((sum, m) => sum + m.motivationLevel, 0) / moodHistory.length;
    predictions.recommendedDuration = avgMotivation > 6 ? 30 : avgMotivation > 4 ? 20 : 15;

    // Cultural content recommendations
    if (context.targetLanguage === 'persian' || context.targetLanguage === 'farsi') {
      if (avgMotivation > 7) {
        predictions.suggestedContent = ['poetry', 'cultural_immersion', 'advanced_conversation'];
      } else if (avgMotivation > 5) {
        predictions.suggestedContent = ['conversation', 'cultural_context', 'vocabulary'];
      } else {
        predictions.suggestedContent = ['review', 'gentle_practice', 'cultural_relaxation'];
      }
    }

    return { patterns, predictions };
  }

  /**
   * Analyze learning effectiveness based on mood
   */
  analyzeLocalEffectiveness(
    moodEntry: MoodEntry,
    sessionOutcome: {
      completionRate: number;
      accuracyScore: number;
      timeSpent: number;
      userFeedback: string;
    }
  ): { effectivenessScore: number; insights: string[]; adaptations: string[] } {
    
    const insights = [];
    const adaptations = [];
    let effectivenessScore = 5;

    // Analyze mood-performance correlation
    if (moodEntry.energyLevel > 6 && sessionOutcome.accuracyScore > 75) {
      effectivenessScore = 8;
      insights.push('High energy correlates with good performance');
      adaptations.push('Schedule challenging content during high energy periods');
    }

    if (moodEntry.stressLevel > 6 && sessionOutcome.completionRate < 50) {
      effectivenessScore = 3;
      insights.push('High stress significantly impacts completion');
      adaptations.push('Implement stress reduction techniques before learning');
    }

    if (moodEntry.motivationLevel > 7 && sessionOutcome.timeSpent > 20) {
      effectivenessScore = 7;
      insights.push('High motivation supports extended learning sessions');
      adaptations.push('Provide longer, more comprehensive content when motivated');
    }

    // Cultural learning insights
    if (sessionOutcome.userFeedback.includes('cultural') || 
        sessionOutcome.userFeedback.includes('فرهنگی')) {
      insights.push('Cultural content significantly enhances engagement');
      adaptations.push('Increase cultural context in learning materials');
    }

    return { effectivenessScore, insights, adaptations };
  }
}

export const localMoodAnalyzer = new LocalMoodAnalyzer();