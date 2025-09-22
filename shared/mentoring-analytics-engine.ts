// ============================================================================
// MENTORING ANALYTICS ENGINE
// ============================================================================
// Advanced analytics engine for student progress tracking, predictive modeling,
// and intervention effectiveness analysis in the enhanced mentoring system

import type { 
  EnhancedStudentProgress, 
  MentoringIntervention, 
  AdaptiveLearningPath,
  RiskLevel,
  InterventionPriority
} from './enhanced-mentoring-schema';

// ============================================================================
// ANALYTICS CONFIGURATION
// ============================================================================

export const ANALYTICS_CONFIG = {
  // Progress Analysis
  PROGRESS_SMOOTHING_FACTOR: 0.7, // Exponential smoothing
  VELOCITY_CALCULATION_WINDOW: 14, // Days
  TREND_ANALYSIS_MIN_POINTS: 5,
  
  // Risk Assessment
  RISK_ASSESSMENT_FACTORS: {
    PERFORMANCE_DROP_WEIGHT: 0.25,
    ENGAGEMENT_DROP_WEIGHT: 0.20,
    CONSISTENCY_WEIGHT: 0.15,
    MOTIVATION_WEIGHT: 0.15,
    TIME_SINCE_ACTIVITY_WEIGHT: 0.15,
    INTERVENTION_HISTORY_WEIGHT: 0.10
  },
  
  // Predictive Modeling
  PREDICTION_CONFIDENCE_THRESHOLD: 0.65,
  LEARNING_CURVE_MODELS: ['linear', 'exponential', 'logarithmic', 'polynomial'],
  
  // Intervention Analysis
  INTERVENTION_EFFECTIVENESS_BASELINE_PERIOD: 7, // Days before intervention
  INTERVENTION_EFFECTIVENESS_EVALUATION_PERIOD: 21, // Days after intervention
  
  // Performance Thresholds
  PERFORMANCE_THRESHOLDS: {
    EXCELLENT: 85,
    GOOD: 75,
    SATISFACTORY: 65,
    NEEDS_IMPROVEMENT: 50,
    CRITICAL: 35
  }
};

// ============================================================================
// DATA TYPES FOR ANALYTICS
// ============================================================================

// Time series data point for statistical analysis
export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

// Predictive model interface for multiple model types
export interface PredictiveModel {
  modelType: 'linear' | 'exponential' | 'logarithmic' | 'polynomial';
  coefficients: number[];
  rSquared: number;
  standardError: number;
  predictions: Array<{
    timestamp: number;
    value: number;
    confidenceInterval: [number, number];
  }>;
  fitQuality: number; // 0-100, higher is better
  dataPoints: number;
  validationScore?: number;
}

// Risk factors interface for comprehensive risk assessment  
export interface RiskFactors {
  engagementLevel: number; // 0-100
  consistencyScore: number; // 0-100
  motivationIndex: number; // 0-100
  inactivityPeriods: number; // days since last activity
  interventionHistory: {
    totalInterventions: number;
    successfulInterventions: number;
    recentInterventionFailures: number;
    averageTimeToResponse: number; // days
  };
  performanceTrend: 'improving' | 'stable' | 'declining';
  velocityTrend: 'accelerating' | 'steady' | 'decelerating';
  socialFactors?: {
    peerComparison: number; // percentile
    supportSystemStrength: number; // 0-100
  };
}

// Risk profile with comprehensive analysis
export interface RiskProfile {
  overallScore: number; // 0-100
  riskLevel: RiskLevel;
  primaryFactors: Array<{
    factor: string;
    weight: number;
    score: number;
    description: string;
    recommendedActions: string[];
  }>;
  recommendations: Array<{
    type: InterventionType;
    priority: InterventionPriority;
    description: string;
    expectedEffectiveness: number; // 0-100
    timeframe: string;
    resources: string[];
  }>;
  confidenceLevel: number; // 0-100
  reassessmentDate: Date;
}

// Seasonal pattern detection results
export interface SeasonalPattern {
  patternType: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  strength: number; // 0-1, how strong the pattern is
  confidence: number; // 0-1, statistical confidence
  peakPeriods: Array<{
    period: string; // e.g., "Monday", "Morning", "Week 2"
    averageValue: number;
    frequency: number;
  }>;
  lowPeriods: Array<{
    period: string;
    averageValue: number;
    frequency: number;
  }>;
  cyclicityIndex: number; // 0-1, how cyclic the pattern is
}

// Change point detection results
export interface ChangePoint {
  timestamp: number;
  changeType: 'improvement' | 'decline' | 'plateau' | 'volatility_increase' | 'volatility_decrease';
  magnitude: number; // size of the change
  confidence: number; // 0-1, statistical confidence
  duration: number; // how long the change persisted (days)
  context: {
    beforeValue: number;
    afterValue: number;
    gradualChange: boolean; // true if gradual, false if sudden
    potentialCauses?: string[];
  };
}

// Enhanced intervention effectiveness with statistical analysis
export interface InterventionEffectiveness {
  interventionId: number;
  effectSize: number; // Cohen's d or similar
  statisticalSignificance: number; // p-value
  confidenceInterval: [number, number]; // 95% CI for effect size
  improvementMetrics: {
    performance: { before: number; after: number; change: number; };
    engagement: { before: number; after: number; change: number; };
    motivation: { before: number; after: number; change: number; };
    consistency: { before: number; after: number; change: number; };
  };
  timeToImpact: number; // days until improvement was observed
  sustainabilityScore: number; // 0-100, how well improvements were maintained
  benchmarkComparison: {
    betterThanAverage: boolean;
    percentileRank: number; // vs other similar interventions
  };
}

export interface StudentProgressMetrics {
  studentId: number;
  timePoints: Date[];
  progressScores: number[];
  skillBreakdown: {
    speaking?: number[];
    listening?: number[];
    reading?: number[];
    writing?: number[];
    grammar?: number[];
    vocabulary?: number[];
  };
  engagementLevels: number[];
  studyTimeMinutes: number[];
  sessionCompletionRates: number[];
}

export interface LearningVelocityAnalysis {
  overallVelocity: number; // Progress units per day
  skillVelocities: {
    speaking?: number;
    listening?: number;
    reading?: number;
    writing?: number;
    grammar?: number;
    vocabulary?: number;
  };
  velocityTrend: 'accelerating' | 'steady' | 'decelerating';
  velocityConfidence: number; // 0-1
  projectedTimeToGoal: number; // Days
}

export interface PerformanceTrendAnalysis {
  trendDirection: 'improving' | 'stable' | 'declining';
  trendStrength: number; // 0-1
  trendConfidence: number; // 0-1
  seasonalPatterns: {
    dayOfWeek?: { [key: string]: number };
    timeOfDay?: { [key: string]: number };
    monthly?: { [key: string]: number };
  };
  changePoints: Array<{
    date: Date;
    type: 'improvement' | 'decline' | 'plateau';
    significance: number;
  }>;
}

export interface RiskAssessmentResult {
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  riskFactors: Array<{
    factor: string;
    severity: number;
    contribution: number; // % contribution to overall risk
    description: string;
  }>;
  interventionRecommendations: Array<{
    type: string;
    priority: InterventionPriority;
    description: string;
    expectedImpact: number;
  }>;
  confidenceLevel: number;
}

export interface InterventionEffectivenessAnalysis {
  interventionId: number;
  effectivenessScore: number; // 0-100
  impactMetrics: {
    performanceImprovement: number;
    engagementChange: number;
    motivationChange: number;
    behaviorChange: number;
  };
  timeToImpact: number; // Days
  sustainabilityScore: number; // 0-100
  comparisonToBaseline: number; // % improvement
  confidenceLevel: number;
}

export interface PredictiveAnalysisResult {
  studentId: number;
  predictions: {
    shortTerm: { // 1-2 weeks
      expectedProgress: number;
      confidenceInterval: [number, number];
      riskOfDisengagement: number;
    };
    mediumTerm: { // 1-3 months  
      expectedProgress: number;
      confidenceInterval: [number, number];
      goalAchievementProbability: number;
    };
    longTerm: { // 3-12 months
      expectedOutcome: string;
      competencyLevel: string;
      retentionProbability: number;
    };
  };
  modelUsed: string;
  modelAccuracy: number;
  lastUpdated: Date;
}

// ============================================================================
// CORE ANALYTICS ENGINE CLASS
// ============================================================================

export class MentoringAnalyticsEngine {
  
  // ========================================================================
  // CORE STATISTICAL ANALYSIS FUNCTIONS
  // ========================================================================
  
  /**
   * Enhanced linear regression with comprehensive statistics
   * @param data Array of {x, y} data points
   * @returns Regression analysis with slope, R², intercept, and confidence metrics
   */
  static linearRegression(data: {x: number, y: number}[]): {
    slope: number;
    intercept: number;
    rSquared: number;
    correlation: number;
    standardError: number;
    confidence: number;
    predictions: (x: number) => number;
  } {
    if (data.length < 2) {
      return {
        slope: 0,
        intercept: 0,
        rSquared: 0,
        correlation: 0,
        standardError: 0,
        confidence: 0,
        predictions: () => 0
      };
    }

    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);
    const sumYY = data.reduce((sum, point) => sum + point.y * point.y, 0);

    const meanX = sumX / n;
    const meanY = sumY / n;

    const numerator = sumXY - n * meanX * meanY;
    const denominatorX = sumXX - n * meanX * meanX;
    const denominatorY = sumYY - n * meanY * meanY;

    const slope = denominatorX !== 0 ? numerator / denominatorX : 0;
    const intercept = meanY - slope * meanX;

    // Calculate R² and correlation
    const correlation = denominatorX !== 0 && denominatorY !== 0 ? 
      numerator / Math.sqrt(denominatorX * denominatorY) : 0;
    const rSquared = correlation * correlation;

    // Calculate standard error
    const residuals = data.map(point => point.y - (slope * point.x + intercept));
    const mse = residuals.reduce((sum, residual) => sum + residual * residual, 0) / Math.max(1, n - 2);
    const standardError = Math.sqrt(mse);

    // Calculate confidence based on sample size, R², and distribution of X values
    const xVariance = denominatorX / n;
    let confidence = Math.min(1, Math.max(0, rSquared));
    confidence *= Math.min(1, n / 10); // Sample size factor
    confidence *= Math.min(1, xVariance / 100); // X distribution factor

    return {
      slope,
      intercept,
      rSquared,
      correlation,
      standardError,
      confidence,
      predictions: (x: number) => slope * x + intercept
    };
  }

  /**
   * Advanced velocity trend determination with statistical significance
   * @param velocities Array of velocity measurements over time
   * @returns Trend classification with confidence
   */
  static determineVelocityTrend(velocities: number[]): {
    trend: 'improving' | 'declining' | 'stable';
    confidence: number;
    trendStrength: number;
    changeRate: number;
  } {
    if (velocities.length < 3) {
      return { trend: 'stable', confidence: 0, trendStrength: 0, changeRate: 0 };
    }

    // Use linear regression on velocity vs time
    const data = velocities.map((v, i) => ({ x: i, y: v }));
    const regression = this.linearRegression(data);

    const changeRate = regression.slope;
    const trendStrength = Math.abs(regression.correlation);
    
    // Determine trend based on slope and significance
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    const significanceThreshold = 0.1 * this.calculateStandardDeviation(velocities);

    if (Math.abs(changeRate) > significanceThreshold) {
      trend = changeRate > 0 ? 'improving' : 'declining';
    }

    // Calculate confidence based on regression quality and sample size
    let confidence = regression.confidence;
    confidence *= Math.min(1, velocities.length / 7); // More confidence with more data points

    return { trend, confidence, trendStrength, changeRate };
  }

  /**
   * Calculate statistical confidence in velocity measurements
   * @param velocities Array of velocity measurements
   * @returns Confidence score (0-1)
   */
  static calculateVelocityConfidence(velocities: number[]): number {
    if (velocities.length === 0) return 0;
    if (velocities.length === 1) return 0.1;

    const mean = this.calculateAverage(velocities);
    const stdDev = this.calculateStandardDeviation(velocities);
    const coefficientOfVariation = mean !== 0 ? stdDev / Math.abs(mean) : 1;

    // Base confidence on sample size
    let confidence = Math.min(1, velocities.length / 10);

    // Reduce confidence for high variability
    confidence *= Math.max(0.1, 1 - coefficientOfVariation);

    // Bonus for consistent positive velocities
    const positiveRatio = velocities.filter(v => v > 0).length / velocities.length;
    confidence *= (0.7 + 0.3 * positiveRatio);

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate confidence level for trend predictions
   * @param trendData Array of trend data points
   * @returns Confidence score (0-1)
   */
  static calculateTrendConfidence(trendData: number[]): number {
    if (trendData.length < 3) return 0;

    // Use multiple methods to assess trend confidence
    const regression = this.linearRegression(trendData.map((y, x) => ({ x, y })));
    const autocorrelation = this.calculateAutocorrelation(trendData, 1);
    const variance = this.calculateVariance(trendData);
    const mean = this.calculateAverage(trendData);

    // Base confidence on regression quality
    let confidence = regression.rSquared;

    // Adjust for autocorrelation (trending data should have positive autocorrelation)
    confidence *= Math.max(0.3, 0.5 + 0.5 * autocorrelation);

    // Adjust for data stability (lower variance relative to mean indicates more confidence)
    const stabilityFactor = mean !== 0 ? Math.max(0.1, 1 - Math.sqrt(variance) / Math.abs(mean)) : 0.5;
    confidence *= stabilityFactor;

    // Sample size adjustment
    confidence *= Math.min(1, trendData.length / 8);

    return Math.max(0, Math.min(1, confidence));
  }

  // ========================================================================
  // PATTERN DETECTION FUNCTIONS
  // ========================================================================

  /**
   * Comprehensive seasonal pattern detection
   * @param timeSeries Array of {timestamp, value} data points
   * @returns Detected seasonal patterns with statistical significance
   */
  static detectSeasonalPatterns(timeSeries: TimeSeriesPoint[]): SeasonalPattern[] {
    if (timeSeries.length < 14) return []; // Need at least 2 weeks of data

    const patterns: SeasonalPattern[] = [];

    // Sort by timestamp
    const sortedData = [...timeSeries].sort((a, b) => a.timestamp - b.timestamp);

    // Detect weekly patterns
    const weeklyPattern = this.analyzeWeeklyPattern(sortedData);
    if (weeklyPattern.confidence > 0.3) {
      patterns.push(weeklyPattern);
    }

    // Detect daily patterns (if we have hourly data)
    const dailyPattern = this.analyzeDailyPattern(sortedData);
    if (dailyPattern.confidence > 0.3) {
      patterns.push(dailyPattern);
    }

    // Detect monthly patterns (if we have enough data)
    if (sortedData.length > 60) { // Need at least 2 months
      const monthlyPattern = this.analyzeMonthlyPattern(sortedData);
      if (monthlyPattern.confidence > 0.3) {
        patterns.push(monthlyPattern);
      }
    }

    return patterns;
  }

  /**
   * Detect significant change points in time series data
   * @param timeSeries Array of {timestamp, value} data points
   * @returns Array of detected change points
   */
  static detectChangePoints(timeSeries: TimeSeriesPoint[]): ChangePoint[] {
    if (timeSeries.length < 6) return [];

    const sortedData = [...timeSeries].sort((a, b) => a.timestamp - b.timestamp);
    const changePoints: ChangePoint[] = [];
    const windowSize = Math.max(3, Math.floor(sortedData.length / 8));

    for (let i = windowSize; i < sortedData.length - windowSize; i++) {
      const beforeWindow = sortedData.slice(i - windowSize, i);
      const afterWindow = sortedData.slice(i, i + windowSize);

      const beforeMean = this.calculateAverage(beforeWindow.map(p => p.value));
      const afterMean = this.calculateAverage(afterWindow.map(p => p.value));
      const beforeStd = this.calculateStandardDeviation(beforeWindow.map(p => p.value));
      const afterStd = this.calculateStandardDeviation(afterWindow.map(p => p.value));

      const meanChange = afterMean - beforeMean;
      const stdChange = afterStd - beforeStd;
      
      // Calculate statistical significance using t-test approximation
      const pooledStd = Math.sqrt((beforeStd ** 2 + afterStd ** 2) / 2);
      const tStatistic = pooledStd > 0 ? Math.abs(meanChange) / (pooledStd * Math.sqrt(2 / windowSize)) : 0;
      const confidence = Math.min(0.99, Math.max(0, (tStatistic - 1) / 3)); // Approximate confidence

      if (confidence > 0.3) { // Significant change detected
        const magnitude = Math.abs(meanChange);
        const changeType = this.classifyChangeType(meanChange, stdChange, beforeMean, afterMean);
        
        changePoints.push({
          timestamp: sortedData[i].timestamp,
          changeType,
          magnitude,
          confidence,
          duration: this.calculateChangeDuration(sortedData, i, changeType),
          context: {
            beforeValue: beforeMean,
            afterValue: afterMean,
            gradualChange: this.isGradualChange(sortedData, i - windowSize, i + windowSize),
            potentialCauses: this.inferPotentialCauses(changeType, magnitude, sortedData[i].timestamp)
          }
        });
      }
    }

    // Merge nearby change points
    return this.mergeNearbyChangePoints(changePoints);
  }

  // ========================================================================
  // ENHANCED RISK ASSESSMENT FUNCTIONS
  // ========================================================================

  /**
   * Comprehensive risk factor analysis for student data
   * @param studentData Student progress metrics
   * @returns Detailed risk factors assessment
   */
  static assessRiskFactors(studentData: StudentProgressMetrics): RiskFactors {
    const { engagementLevels, sessionCompletionRates, studyTimeMinutes, timePoints } = studentData;

    // Calculate engagement level (recent 7-day average)
    const recentEngagement = engagementLevels.slice(-7);
    const engagementLevel = recentEngagement.length > 0 ? 
      this.calculateAverage(recentEngagement) : 50;

    // Calculate consistency score based on completion rates and study time variance
    const completionConsistency = this.calculateConsistencyScore(sessionCompletionRates);
    const timeConsistency = this.calculateConsistencyScore(studyTimeMinutes);
    const consistencyScore = (completionConsistency + timeConsistency) / 2;

    // Estimate motivation index from engagement trends and session patterns
    const motivationIndex = this.estimateMotivationIndex(studentData);

    // Calculate inactivity periods
    const lastActivity = timePoints[timePoints.length - 1];
    const now = new Date();
    const inactivityPeriods = Math.floor(
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Mock intervention history (would normally come from database)
    const interventionHistory = {
      totalInterventions: 0,
      successfulInterventions: 0,
      recentInterventionFailures: 0,
      averageTimeToResponse: 0
    };

    // Determine performance and velocity trends
    const performanceTrend = this.determinePerformanceTrend(studentData.progressScores);
    const velocityAnalysis = this.calculateLearningVelocity(studentData);

    return {
      engagementLevel,
      consistencyScore,
      motivationIndex,
      inactivityPeriods,
      interventionHistory,
      performanceTrend,
      velocityTrend: velocityAnalysis.velocityTrend,
      socialFactors: {
        peerComparison: 50, // Would be calculated from peer data
        supportSystemStrength: 70 // Would be assessed from interaction data
      }
    };
  }

  /**
   * Calculate weighted risk score from risk factors
   * @param factors Comprehensive risk factors
   * @returns Weighted risk score (0-100)
   */
  static calculateRiskScore(factors: RiskFactors): number {
    const weights = ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS;
    
    let totalScore = 0;

    // Engagement risk (inverted - low engagement = high risk)
    totalScore += (100 - factors.engagementLevel) * weights.ENGAGEMENT_DROP_WEIGHT;

    // Consistency risk (inverted)
    totalScore += (100 - factors.consistencyScore) * weights.CONSISTENCY_WEIGHT;

    // Motivation risk (inverted)
    totalScore += (100 - factors.motivationIndex) * weights.MOTIVATION_WEIGHT;

    // Inactivity risk
    const inactivityRisk = Math.min(100, factors.inactivityPeriods * 10); // 10 points per day
    totalScore += inactivityRisk * weights.TIME_SINCE_ACTIVITY_WEIGHT;

    // Performance trend risk
    const performanceRisk = factors.performanceTrend === 'declining' ? 80 : 
                           factors.performanceTrend === 'stable' ? 30 : 10;
    totalScore += performanceRisk * weights.PERFORMANCE_DROP_WEIGHT;

    // Intervention history risk
    const interventionSuccessRate = factors.interventionHistory.totalInterventions > 0 ?
      factors.interventionHistory.successfulInterventions / factors.interventionHistory.totalInterventions : 1;
    const interventionRisk = (1 - interventionSuccessRate) * 100;
    totalScore += interventionRisk * weights.INTERVENTION_HISTORY_WEIGHT;

    return Math.min(100, Math.max(0, totalScore));
  }

  /**
   * Map numerical risk score to categorical risk level
   * @param score Risk score (0-100)
   * @returns Risk level category
   */
  static mapRiskToLevel(score: number): RiskLevel {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'low';
    return 'minimal';
  }

  // ========================================================================
  // INTERVENTION ANALYSIS FUNCTIONS
  // ========================================================================

  /**
   * Generate AI-informed intervention recommendations
   * @param riskProfile Complete risk profile
   * @returns Array of intervention recommendations
   */
  static generateInterventionRecommendations(riskProfile: RiskProfile): Array<{
    type: InterventionType;
    priority: InterventionPriority;
    description: string;
    expectedEffectiveness: number;
    timeframe: string;
    resources: string[];
  }> {
    const recommendations = [];
    const { riskLevel, primaryFactors } = riskProfile;

    // Priority mapping based on risk level
    const priorityMap = {
      'critical': 'critical' as InterventionPriority,
      'high': 'urgent' as InterventionPriority,
      'moderate': 'high' as InterventionPriority,
      'low': 'medium' as InterventionPriority,
      'minimal': 'low' as InterventionPriority
    };

    const basePriority = priorityMap[riskLevel];

    // Analyze primary risk factors and generate specific recommendations
    for (const factor of primaryFactors) {
      if (factor.factor.includes('engagement') && factor.score > 60) {
        recommendations.push({
          type: 'motivational',
          priority: basePriority,
          description: 'Implement gamification elements and personalized learning incentives to boost engagement',
          expectedEffectiveness: 75,
          timeframe: '2-3 weeks',
          resources: ['motivation_toolkit', 'gamification_system', 'peer_support']
        });
      }

      if (factor.factor.includes('consistency') && factor.score > 50) {
        recommendations.push({
          type: 'behavioral',
          priority: basePriority,
          description: 'Establish structured study schedule with regular check-ins and progress tracking',
          expectedEffectiveness: 80,
          timeframe: '1-2 weeks',
          resources: ['schedule_template', 'reminder_system', 'progress_tracker']
        });
      }

      if (factor.factor.includes('performance') && factor.score > 70) {
        recommendations.push({
          type: 'academic_support',
          priority: basePriority,
          description: 'Provide targeted academic support focusing on identified weak areas',
          expectedEffectiveness: 85,
          timeframe: '2-4 weeks',
          resources: ['tutoring_sessions', 'practice_materials', 'concept_review']
        });
      }

      if (factor.factor.includes('inactivity') && factor.score > 40) {
        recommendations.push({
          type: 'emotional',
          priority: basePriority,
          description: 'Conduct wellness check and provide emotional support to re-engage student',
          expectedEffectiveness: 70,
          timeframe: '1 week',
          resources: ['counseling_session', 'mentor_meeting', 'family_contact']
        });
      }
    }

    // Add general recommendations based on risk level
    if (riskLevel === 'critical') {
      recommendations.push({
        type: 'schedule_adjustment',
        priority: 'critical',
        description: 'Immediate intervention required - schedule emergency mentor meeting',
        expectedEffectiveness: 60,
        timeframe: '24-48 hours',
        resources: ['emergency_protocol', 'mentor_escalation', 'family_notification']
      });
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Calculate intervention effectiveness using pre/post analysis with effect size
   * @param before Progress data before intervention
   * @param after Progress data after intervention
   * @returns Statistical analysis of intervention effectiveness
   */
  static calculateInterventionEffectiveness(
    before: StudentProgressMetrics,
    after: StudentProgressMetrics
  ): InterventionEffectiveness {
    // Calculate means for before and after periods
    const beforePerf = this.calculateAverage(before.progressScores);
    const afterPerf = this.calculateAverage(after.progressScores);
    const beforeEng = this.calculateAverage(before.engagementLevels);
    const afterEng = this.calculateAverage(after.engagementLevels);
    
    // Calculate standard deviations
    const beforePerfStd = this.calculateStandardDeviation(before.progressScores);
    const afterPerfStd = this.calculateStandardDeviation(after.progressScores);

    // Calculate effect size (Cohen's d)
    const pooledStd = Math.sqrt((beforePerfStd ** 2 + afterPerfStd ** 2) / 2);
    const effectSize = pooledStd > 0 ? (afterPerf - beforePerf) / pooledStd : 0;

    // Calculate statistical significance (approximate t-test)
    const n1 = before.progressScores.length;
    const n2 = after.progressScores.length;
    const standardError = pooledStd * Math.sqrt((1/n1) + (1/n2));
    const tStatistic = standardError > 0 ? Math.abs(afterPerf - beforePerf) / standardError : 0;
    const degreesOfFreedom = n1 + n2 - 2;
    const statisticalSignificance = this.tTestPValue(tStatistic, degreesOfFreedom);

    // Calculate confidence interval for effect size
    const marginOfError = 1.96 * Math.sqrt(((n1 + n2) / (n1 * n2)) + (effectSize ** 2) / (2 * (n1 + n2)));
    const confidenceInterval: [number, number] = [
      effectSize - marginOfError,
      effectSize + marginOfError
    ];

    // Calculate improvement metrics
    const performanceChange = afterPerf - beforePerf;
    const engagementChange = afterEng - beforeEng;

    // Time to impact (simplified - would need more sophisticated analysis)
    const timeToImpact = this.calculateTimeToImpact(before, after);

    // Sustainability score based on trend in post-intervention period
    const sustainabilityScore = this.calculateSustainabilityScore(after);

    return {
      interventionId: 0, // Would be provided by caller
      effectSize,
      statisticalSignificance,
      confidenceInterval,
      improvementMetrics: {
        performance: { before: beforePerf, after: afterPerf, change: performanceChange },
        engagement: { before: beforeEng, after: afterEng, change: engagementChange },
        motivation: { before: 50, after: 55, change: 5 }, // Would calculate from actual data
        consistency: { before: 60, after: 70, change: 10 } // Would calculate from actual data
      },
      timeToImpact,
      sustainabilityScore,
      benchmarkComparison: {
        betterThanAverage: effectSize > 0.5, // Medium effect size
        percentileRank: Math.min(100, Math.max(0, 50 + (effectSize * 30)))
      }
    };
  }

  // ========================================================================
  // PREDICTIVE MODELING FUNCTIONS
  // ========================================================================

  /**
   * Fit multiple predictive models to time series data
   * @param data Time series data points
   * @returns Array of fitted models
   */
  static fitPredictiveModel(data: TimeSeriesPoint[]): PredictiveModel[] {
    if (data.length < 3) return [];

    const models: PredictiveModel[] = [];
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

    // Normalize timestamps to start from 0
    const startTime = sortedData[0].timestamp;
    const normalizedData = sortedData.map((point, index) => ({
      x: index,
      y: point.value
    }));

    // Fit linear model
    const linearModel = this.fitLinearModel(normalizedData, sortedData);
    models.push(linearModel);

    // Fit exponential model (if data supports it)
    if (this.isExponentialData(sortedData)) {
      const exponentialModel = this.fitExponentialModel(normalizedData, sortedData);
      models.push(exponentialModel);
    }

    // Fit logarithmic model (if data supports it)
    if (this.isLogarithmicData(sortedData)) {
      const logarithmicModel = this.fitLogarithmicModel(normalizedData, sortedData);
      models.push(logarithmicModel);
    }

    // Fit polynomial model (degree 2)
    if (data.length >= 6) {
      const polynomialModel = this.fitPolynomialModel(normalizedData, sortedData, 2);
      models.push(polynomialModel);
    }

    return models.filter(model => model.rSquared > 0.1); // Filter out poor fits
  }

  /**
   * Select the best model from multiple fitted models
   * @param models Array of fitted models
   * @returns Best performing model
   */
  static selectBestModel(models: PredictiveModel[]): PredictiveModel | null {
    if (models.length === 0) return null;

    // Score models based on R², fit quality, and complexity penalty
    const scoredModels = models.map(model => {
      let score = model.rSquared * 0.6; // Base score from R²
      score += (model.fitQuality / 100) * 0.3; // Fit quality contribution
      score += (model.validationScore || 0) * 0.1; // Validation score if available

      // Complexity penalty (prefer simpler models if performance is similar)
      const complexityPenalty = {
        'linear': 0,
        'logarithmic': 0.05,
        'exponential': 0.05,
        'polynomial': 0.10
      }[model.modelType] || 0;

      score -= complexityPenalty;

      return { model, score };
    });

    // Return model with highest score
    return scoredModels.reduce((best, current) => 
      current.score > best.score ? current : best
    ).model;
  }

  /**
   * Generate predictions with confidence intervals
   * @param model Fitted predictive model
   * @param futurePoints Number of future time points to predict
   * @returns Predictions with confidence intervals
   */
  static generatePredictions(
    model: PredictiveModel, 
    futurePoints: number
  ): Array<{
    timestamp: number;
    value: number;
    confidenceInterval: [number, number];
  }> {
    const predictions = [];
    const lastTimestamp = model.predictions[model.predictions.length - 1]?.timestamp || Date.now();
    const timeInterval = model.predictions.length > 1 ?
      model.predictions[1].timestamp - model.predictions[0].timestamp :
      24 * 60 * 60 * 1000; // 1 day default

    for (let i = 1; i <= futurePoints; i++) {
      const timestamp = lastTimestamp + (i * timeInterval);
      const baseValue = this.evaluateModel(model, model.dataPoints + i);
      
      // Calculate prediction uncertainty (increases with distance from training data)
      const uncertainty = model.standardError * Math.sqrt(1 + (i / model.dataPoints));
      const confidenceMargin = 1.96 * uncertainty; // 95% confidence interval

      predictions.push({
        timestamp,
        value: baseValue,
        confidenceInterval: [
          baseValue - confidenceMargin,
          baseValue + confidenceMargin
        ]
      });
    }

    return predictions;
  }

  // ========================================================================
  // STUDENT PROGRESS ANALYSIS
  // ========================================================================
  
  /**
   * Calculate learning velocity from progress data
   */
  static calculateLearningVelocity(metrics: StudentProgressMetrics): LearningVelocityAnalysis {
    const { timePoints, progressScores, skillBreakdown } = metrics;
    
    if (timePoints.length < 2 || progressScores.length < 2) {
      return {
        overallVelocity: 0,
        skillVelocities: {},
        velocityTrend: 'steady',
        velocityConfidence: 0,
        projectedTimeToGoal: Infinity
      };
    }
    
    // Calculate overall velocity using linear regression
    const overallVelocity = this.calculateVelocityFromTimeSeries(timePoints, progressScores);
    
    // Calculate skill-specific velocities
    const skillVelocities: any = {};
    for (const [skill, scores] of Object.entries(skillBreakdown)) {
      if (scores && scores.length > 1) {
        skillVelocities[skill] = this.calculateVelocityFromTimeSeries(timePoints, scores);
      }
    }
    
    // Determine velocity trend by comparing recent vs historical velocity
    const velocityTrend = this.determineVelocityTrend(timePoints, progressScores);
    
    // Calculate confidence based on data consistency and sample size
    const velocityConfidence = this.calculateVelocityConfidence(timePoints, progressScores);
    
    // Project time to reach goal (assuming 100% completion)
    const currentProgress = progressScores[progressScores.length - 1];
    const remainingProgress = 100 - currentProgress;
    const projectedTimeToGoal = overallVelocity > 0 ? remainingProgress / overallVelocity : Infinity;
    
    return {
      overallVelocity,
      skillVelocities,
      velocityTrend,
      velocityConfidence,
      projectedTimeToGoal
    };
  }
  
  /**
   * Analyze performance trends and patterns
   */
  static analyzePerformanceTrends(metrics: StudentProgressMetrics): PerformanceTrendAnalysis {
    const { timePoints, progressScores } = metrics;
    
    // Calculate trend direction and strength using linear regression
    const { slope, correlation } = this.linearRegression(
      timePoints.map((_, i) => i), 
      progressScores
    );
    
    let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
    if (slope > 0.5) trendDirection = 'improving';
    else if (slope < -0.5) trendDirection = 'declining';
    
    const trendStrength = Math.abs(correlation);
    const trendConfidence = this.calculateTrendConfidence(progressScores);
    
    // Detect seasonal patterns
    const seasonalPatterns = this.detectSeasonalPatterns(timePoints, progressScores);
    
    // Identify significant change points
    const changePoints = this.detectChangePoints(timePoints, progressScores);
    
    return {
      trendDirection,
      trendStrength,
      trendConfidence,
      seasonalPatterns,
      changePoints
    };
  }
  
  /**
   * Assess student risk levels and factors
   */
  static assessStudentRisk(
    metrics: StudentProgressMetrics, 
    interventionHistory: MentoringIntervention[],
    learningPath?: AdaptiveLearningPath
  ): RiskAssessmentResult {
    
    const riskFactors: Array<{
      factor: string;
      severity: number;
      contribution: number;
      description: string;
    }> = [];
    
    let totalRiskScore = 0;
    
    // Factor 1: Performance Drop
    const performanceDropRisk = this.assessPerformanceDropRisk(metrics);
    riskFactors.push(performanceDropRisk);
    totalRiskScore += performanceDropRisk.severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.PERFORMANCE_DROP_WEIGHT;
    
    // Factor 2: Engagement Drop
    const engagementDropRisk = this.assessEngagementRisk(metrics);
    riskFactors.push(engagementDropRisk);
    totalRiskScore += engagementDropRisk.severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.ENGAGEMENT_DROP_WEIGHT;
    
    // Factor 3: Consistency Issues
    const consistencyRisk = this.assessConsistencyRisk(metrics);
    riskFactors.push(consistencyRisk);
    totalRiskScore += consistencyRisk.severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.CONSISTENCY_WEIGHT;
    
    // Factor 4: Motivation Indicators
    const motivationRisk = this.assessMotivationRisk(metrics);
    riskFactors.push(motivationRisk);
    totalRiskScore += motivationRisk.severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.MOTIVATION_WEIGHT;
    
    // Factor 5: Time Since Last Activity
    const activityRisk = this.assessActivityRisk(metrics);
    riskFactors.push(activityRisk);
    totalRiskScore += activityRisk.severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.TIME_SINCE_ACTIVITY_WEIGHT;
    
    // Factor 6: Intervention History
    const interventionRisk = this.assessInterventionHistoryRisk(interventionHistory);
    riskFactors.push(interventionRisk);
    totalRiskScore += interventionRisk.severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.INTERVENTION_HISTORY_WEIGHT;
    
    // Normalize score to 0-100
    totalRiskScore = Math.min(100, Math.max(0, totalRiskScore * 100));
    
    // Determine risk level
    let riskLevel: RiskLevel = 'minimal';
    if (totalRiskScore >= 80) riskLevel = 'critical';
    else if (totalRiskScore >= 60) riskLevel = 'high';
    else if (totalRiskScore >= 40) riskLevel = 'moderate';
    else if (totalRiskScore >= 20) riskLevel = 'low';
    
    // Generate intervention recommendations
    const interventionRecommendations = this.generateInterventionRecommendations(riskFactors, riskLevel);
    
    const confidenceLevel = this.calculateRiskConfidence(metrics, riskFactors);
    
    return {
      riskLevel,
      riskScore: totalRiskScore,
      riskFactors,
      interventionRecommendations,
      confidenceLevel
    };
  }
  
  /**
   * Analyze intervention effectiveness
   */
  static analyzeInterventionEffectiveness(
    intervention: MentoringIntervention,
    preMetrics: StudentProgressMetrics,
    postMetrics: StudentProgressMetrics
  ): InterventionEffectivenessAnalysis {
    
    // Calculate baseline and post-intervention averages
    const baselinePerformance = this.calculateAverage(preMetrics.progressScores);
    const postPerformance = this.calculateAverage(postMetrics.progressScores);
    
    const baselineEngagement = this.calculateAverage(preMetrics.engagementLevels);
    const postEngagement = this.calculateAverage(postMetrics.engagementLevels);
    
    // Calculate improvements
    const performanceImprovement = ((postPerformance - baselinePerformance) / baselinePerformance) * 100;
    const engagementChange = ((postEngagement - baselineEngagement) / baselineEngagement) * 100;
    
    // Calculate effectiveness score (weighted combination)
    const effectivenessScore = this.calculateEffectivenessScore({
      performanceImprovement,
      engagementChange,
      motivationChange: 0, // TODO: Add motivation metrics
      behaviorChange: 0 // TODO: Add behavior metrics
    });
    
    // Time to impact (when improvement started showing)
    const timeToImpact = this.calculateTimeToImpact(preMetrics, postMetrics);
    
    // Sustainability score (how well improvements are maintained)
    const sustainabilityScore = this.calculateSustainabilityScore(postMetrics);
    
    const comparisonToBaseline = performanceImprovement;
    const confidenceLevel = this.calculateInterventionConfidence(preMetrics, postMetrics);
    
    return {
      interventionId: intervention.id!,
      effectivenessScore,
      impactMetrics: {
        performanceImprovement,
        engagementChange,
        motivationChange: 0,
        behaviorChange: 0
      },
      timeToImpact,
      sustainabilityScore,
      comparisonToBaseline,
      confidenceLevel
    };
  }
  
  /**
   * Generate predictive analytics
   */
  static generatePredictiveAnalysis(
    metrics: StudentProgressMetrics,
    learningPath?: AdaptiveLearningPath,
    interventionHistory?: MentoringIntervention[]
  ): PredictiveAnalysisResult {
    
    const velocity = this.calculateLearningVelocity(metrics);
    const trends = this.analyzePerformanceTrends(metrics);
    
    // Short-term predictions (1-2 weeks)
    const currentProgress = metrics.progressScores[metrics.progressScores.length - 1];
    const shortTermProgress = currentProgress + (velocity.overallVelocity * 14);
    const shortTermConfidence = [
      shortTermProgress - (shortTermProgress * 0.1),
      shortTermProgress + (shortTermProgress * 0.1)
    ] as [number, number];
    
    // Medium-term predictions (1-3 months)
    const mediumTermProgress = currentProgress + (velocity.overallVelocity * 60);
    const mediumTermConfidence = [
      mediumTermProgress - (mediumTermProgress * 0.2),
      mediumTermProgress + (mediumTermProgress * 0.2)
    ] as [number, number];
    
    // Risk of disengagement based on trends
    const riskOfDisengagement = this.calculateDisengagementRisk(metrics, trends);
    
    // Goal achievement probability
    const goalAchievementProbability = this.calculateGoalAchievementProbability(
      velocity, trends, learningPath
    );
    
    // Long-term outcome prediction
    const { expectedOutcome, competencyLevel, retentionProbability } = this.predictLongTermOutcomes(
      velocity, trends, metrics
    );
    
    return {
      studentId: metrics.studentId,
      predictions: {
        shortTerm: {
          expectedProgress: shortTermProgress,
          confidenceInterval: shortTermConfidence,
          riskOfDisengagement
        },
        mediumTerm: {
          expectedProgress: mediumTermProgress,
          confidenceInterval: mediumTermConfidence,
          goalAchievementProbability
        },
        longTerm: {
          expectedOutcome,
          competencyLevel,
          retentionProbability
        }
      },
      modelUsed: 'linear_regression_with_trend_analysis',
      modelAccuracy: velocity.velocityConfidence,
      lastUpdated: new Date()
    };
  }
  
  // ========================================================================
  // COMPREHENSIVE HELPER METHODS
  // ========================================================================

  /**
   * Calculate standard deviation of an array of numbers
   */
  private static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return 0;

    const mean = this.calculateAverage(values);
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, sq) => sum + sq, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Calculate autocorrelation at a specific lag
   */
  private static calculateAutocorrelation(values: number[], lag: number): number {
    if (values.length <= lag || lag < 1) return 0;

    const n = values.length - lag;
    const mean = this.calculateAverage(values);
    
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    return denominator !== 0 ? numerator / denominator : 0;
  }

  /**
   * Calculate variance of values
   */
  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateAverage(values);
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    return squaredDifferences.reduce((sum, sq) => sum + sq, 0) / values.length;
  }

  /**
   * Calculate average of values
   */
  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  // ========================================================================
  // PATTERN ANALYSIS HELPERS
  // ========================================================================

  /**
   * Analyze weekly patterns in time series data
   */
  private static analyzeWeeklyPattern(data: TimeSeriesPoint[]): SeasonalPattern {
    const dayBuckets: { [key: string]: number[] } = {
      'Sunday': [], 'Monday': [], 'Tuesday': [], 'Wednesday': [],
      'Thursday': [], 'Friday': [], 'Saturday': []
    };

    // Group data by day of week
    for (const point of data) {
      const date = new Date(point.timestamp);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      dayBuckets[dayName].push(point.value);
    }

    // Calculate averages for each day
    const dayAverages: { [key: string]: number } = {};
    for (const [day, values] of Object.entries(dayBuckets)) {
      dayAverages[day] = values.length > 0 ? this.calculateAverage(values) : 0;
    }

    // Find peaks and lows
    const sortedDays = Object.entries(dayAverages).sort(([,a], [,b]) => b - a);
    const peakPeriods = sortedDays.slice(0, 2).map(([day, avg]) => ({
      period: day,
      averageValue: avg,
      frequency: dayBuckets[day].length
    }));

    const lowPeriods = sortedDays.slice(-2).map(([day, avg]) => ({
      period: day,
      averageValue: avg,
      frequency: dayBuckets[day].length
    }));

    // Calculate pattern strength and confidence
    const values = Object.values(dayAverages);
    const meanValue = this.calculateAverage(values);
    const stdValue = this.calculateStandardDeviation(values);
    const strength = meanValue > 0 ? Math.min(1, stdValue / meanValue) : 0;
    const confidence = Math.min(1, data.length / 14) * strength; // Need at least 2 weeks

    return {
      patternType: 'weekly',
      strength,
      confidence,
      peakPeriods,
      lowPeriods,
      cyclicityIndex: this.calculateCyclicityIndex(values)
    };
  }

  /**
   * Analyze daily patterns (hourly if available)
   */
  private static analyzeDailyPattern(data: TimeSeriesPoint[]): SeasonalPattern {
    const timeBuckets: { [key: string]: number[] } = {
      'Morning': [], 'Afternoon': [], 'Evening': [], 'Night': []
    };

    // Group data by time of day
    for (const point of data) {
      const date = new Date(point.timestamp);
      const hour = date.getHours();
      
      let timeOfDay = 'Morning';
      if (hour >= 6 && hour < 12) timeOfDay = 'Morning';
      else if (hour >= 12 && hour < 18) timeOfDay = 'Afternoon';
      else if (hour >= 18 && hour < 22) timeOfDay = 'Evening';
      else timeOfDay = 'Night';

      timeBuckets[timeOfDay].push(point.value);
    }

    // Calculate averages
    const timeAverages: { [key: string]: number } = {};
    for (const [time, values] of Object.entries(timeBuckets)) {
      timeAverages[time] = values.length > 0 ? this.calculateAverage(values) : 0;
    }

    const sortedTimes = Object.entries(timeAverages).sort(([,a], [,b]) => b - a);
    const peakPeriods = sortedTimes.slice(0, 1).map(([time, avg]) => ({
      period: time,
      averageValue: avg,
      frequency: timeBuckets[time].length
    }));

    const lowPeriods = sortedTimes.slice(-1).map(([time, avg]) => ({
      period: time,
      averageValue: avg,
      frequency: timeBuckets[time].length
    }));

    const values = Object.values(timeAverages);
    const meanValue = this.calculateAverage(values);
    const stdValue = this.calculateStandardDeviation(values);
    const strength = meanValue > 0 ? Math.min(1, stdValue / meanValue) : 0;
    const confidence = Math.min(1, data.length / 24) * strength;

    return {
      patternType: 'daily',
      strength,
      confidence,
      peakPeriods,
      lowPeriods,
      cyclicityIndex: this.calculateCyclicityIndex(values)
    };
  }

  /**
   * Analyze monthly patterns
   */
  private static analyzeMonthlyPattern(data: TimeSeriesPoint[]): SeasonalPattern {
    const monthBuckets: { [key: string]: number[] } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize buckets
    monthNames.forEach(month => monthBuckets[month] = []);

    // Group data by month
    for (const point of data) {
      const date = new Date(point.timestamp);
      const month = monthNames[date.getMonth()];
      monthBuckets[month].push(point.value);
    }

    // Calculate averages
    const monthAverages: { [key: string]: number } = {};
    for (const [month, values] of Object.entries(monthBuckets)) {
      monthAverages[month] = values.length > 0 ? this.calculateAverage(values) : 0;
    }

    const sortedMonths = Object.entries(monthAverages).sort(([,a], [,b]) => b - a);
    const peakPeriods = sortedMonths.slice(0, 2).map(([month, avg]) => ({
      period: month,
      averageValue: avg,
      frequency: monthBuckets[month].length
    }));

    const lowPeriods = sortedMonths.slice(-2).map(([month, avg]) => ({
      period: month,
      averageValue: avg,
      frequency: monthBuckets[month].length
    }));

    const values = Object.values(monthAverages);
    const meanValue = this.calculateAverage(values);
    const stdValue = this.calculateStandardDeviation(values);
    const strength = meanValue > 0 ? Math.min(1, stdValue / meanValue) : 0;
    const confidence = Math.min(1, data.length / 365) * strength;

    return {
      patternType: 'monthly',
      strength,
      confidence,
      peakPeriods,
      lowPeriods,
      cyclicityIndex: this.calculateCyclicityIndex(values)
    };
  }

  /**
   * Calculate cyclicity index for pattern strength
   */
  private static calculateCyclicityIndex(values: number[]): number {
    if (values.length < 3) return 0;
    
    const mean = this.calculateAverage(values);
    const deviations = values.map(v => Math.abs(v - mean));
    const avgDeviation = this.calculateAverage(deviations);
    
    return mean > 0 ? Math.min(1, avgDeviation / mean) : 0;
  }

  // ========================================================================
  // CHANGE POINT ANALYSIS HELPERS
  // ========================================================================

  /**
   * Classify the type of change detected
   */
  private static classifyChangeType(
    meanChange: number, 
    stdChange: number,
    beforeMean: number,
    afterMean: number
  ): ChangePoint['changeType'] {
    const relativeMeanChange = Math.abs(meanChange / Math.max(beforeMean, 1));
    const relativeStdChange = Math.abs(stdChange / Math.max(beforeMean, 1));

    if (relativeMeanChange > 0.5) {
      return meanChange > 0 ? 'improvement' : 'decline';
    } else if (relativeMeanChange < 0.1) {
      if (relativeStdChange > 0.3) {
        return stdChange > 0 ? 'volatility_increase' : 'volatility_decrease';
      } else {
        return 'plateau';
      }
    } else {
      return meanChange > 0 ? 'improvement' : 'decline';
    }
  }

  /**
   * Calculate duration of detected change
   */
  private static calculateChangeDuration(
    data: TimeSeriesPoint[],
    changeIndex: number,
    changeType: ChangePoint['changeType']
  ): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const changePoint = data[changeIndex];
    
    // Look ahead to see how long the change persists
    let endIndex = changeIndex;
    for (let i = changeIndex + 1; i < Math.min(data.length, changeIndex + 10); i++) {
      const currentTrend = data[i].value > data[i-1].value ? 'improvement' : 'decline';
      if ((changeType === 'improvement' && currentTrend === 'improvement') ||
          (changeType === 'decline' && currentTrend === 'decline')) {
        endIndex = i;
      } else {
        break;
      }
    }

    return Math.max(1, (data[endIndex].timestamp - changePoint.timestamp) / msPerDay);
  }

  /**
   * Determine if change was gradual or sudden
   */
  private static isGradualChange(
    data: TimeSeriesPoint[],
    startIndex: number,
    endIndex: number
  ): boolean {
    if (endIndex - startIndex < 3) return false;

    const segment = data.slice(startIndex, endIndex);
    const regression = this.linearRegression(
      segment.map((point, index) => ({ x: index, y: point.value }))
    );

    // If regression explains > 70% of variance, it's gradual
    return regression.rSquared > 0.7;
  }

  /**
   * Infer potential causes based on timing and patterns
   */
  private static inferPotentialCauses(
    changeType: ChangePoint['changeType'],
    magnitude: number,
    timestamp: number
  ): string[] {
    const causes: string[] = [];
    const date = new Date(timestamp);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();

    // Timing-based inferences
    if (dayOfWeek === 1) causes.push('Monday effect - weekly cycle restart');
    if (dayOfWeek === 0 || dayOfWeek === 6) causes.push('Weekend pattern');
    if (hour < 6 || hour > 22) causes.push('Off-hours activity');

    // Magnitude-based inferences
    if (magnitude > 50) {
      causes.push('Major event or intervention');
      if (changeType === 'decline') causes.push('Possible system issue or external factor');
    } else if (magnitude > 20) {
      causes.push('Moderate intervention effect');
    } else {
      causes.push('Natural variation or minor adjustment');
    }

    return causes;
  }

  /**
   * Merge nearby change points to avoid over-detection
   */
  private static mergeNearbyChangePoints(changePoints: ChangePoint[]): ChangePoint[] {
    if (changePoints.length <= 1) return changePoints;

    const merged: ChangePoint[] = [];
    const sortedPoints = [...changePoints].sort((a, b) => a.timestamp - b.timestamp);
    const mergeThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    let currentPoint = sortedPoints[0];

    for (let i = 1; i < sortedPoints.length; i++) {
      const nextPoint = sortedPoints[i];
      
      if (nextPoint.timestamp - currentPoint.timestamp <= mergeThreshold &&
          nextPoint.changeType === currentPoint.changeType) {
        // Merge points - use the one with higher confidence
        currentPoint = nextPoint.confidence > currentPoint.confidence ? nextPoint : currentPoint;
      } else {
        merged.push(currentPoint);
        currentPoint = nextPoint;
      }
    }
    
    merged.push(currentPoint);
    return merged;
  }

  // ========================================================================
  // RISK ASSESSMENT HELPERS
  // ========================================================================

  /**
   * Calculate consistency score from completion rates or study times
   */
  private static calculateConsistencyScore(values: number[]): number {
    if (values.length === 0) return 50; // Default neutral score
    if (values.length === 1) return 80; // Single data point assumed consistent

    const mean = this.calculateAverage(values);
    const stdDev = this.calculateStandardDeviation(values);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;

    // Lower coefficient of variation = higher consistency
    // Scale to 0-100 where 100 is perfect consistency
    const consistencyScore = Math.max(0, Math.min(100, 100 * (1 - coefficientOfVariation)));
    return consistencyScore;
  }

  /**
   * Estimate motivation index from engagement patterns and trends
   */
  private static estimateMotivationIndex(data: StudentProgressMetrics): number {
    const { engagementLevels, progressScores, studyTimeMinutes } = data;
    
    let motivationScore = 50; // Start with neutral

    // Factor 1: Recent engagement trend
    if (engagementLevels.length >= 3) {
      const recentEngagement = engagementLevels.slice(-3);
      const engagementTrend = this.determineVelocityTrend(recentEngagement);
      if (engagementTrend.trend === 'improving') motivationScore += 20;
      else if (engagementTrend.trend === 'declining') motivationScore -= 20;
    }

    // Factor 2: Progress satisfaction
    if (progressScores.length > 0) {
      const avgProgress = this.calculateAverage(progressScores);
      if (avgProgress > 80) motivationScore += 15;
      else if (avgProgress < 50) motivationScore -= 15;
    }

    // Factor 3: Study time consistency
    if (studyTimeMinutes.length > 0) {
      const timeConsistency = this.calculateConsistencyScore(studyTimeMinutes);
      motivationScore += (timeConsistency - 50) * 0.3; // Scale consistency impact
    }

    // Factor 4: Recent activity level
    const recentStudyTime = studyTimeMinutes.slice(-7); // Last week
    const avgRecentTime = recentStudyTime.length > 0 ? this.calculateAverage(recentStudyTime) : 0;
    if (avgRecentTime > 60) motivationScore += 10; // 1+ hour per day
    else if (avgRecentTime < 20) motivationScore -= 15; // Less than 20 min

    return Math.max(0, Math.min(100, motivationScore));
  }

  /**
   * Determine performance trend from progress scores
   */
  private static determinePerformanceTrend(progressScores: number[]): 'improving' | 'stable' | 'declining' {
    if (progressScores.length < 3) return 'stable';

    const velocityTrend = this.determineVelocityTrend(progressScores);
    return velocityTrend.trend;
  }

  // ========================================================================
  // STATISTICAL TEST HELPERS
  // ========================================================================

  /**
   * Approximate t-test p-value calculation
   */
  private static tTestPValue(tStatistic: number, degreesOfFreedom: number): number {
    // Simplified p-value approximation for t-test
    // This is a rough approximation - in production, use a proper statistical library
    const absTStat = Math.abs(tStatistic);
    
    if (degreesOfFreedom < 1) return 1;
    if (absTStat < 0.5) return 0.6;
    if (absTStat < 1.0) return 0.3;
    if (absTStat < 1.5) return 0.15;
    if (absTStat < 2.0) return 0.05;
    if (absTStat < 2.5) return 0.02;
    if (absTStat < 3.0) return 0.01;
    return 0.001;
  }

  // ========================================================================
  // INTERVENTION ANALYSIS HELPERS
  // ========================================================================

  /**
   * Calculate time until intervention impact is observed
   */
  private static calculateTimeToImpact(
    before: StudentProgressMetrics,
    after: StudentProgressMetrics
  ): number {
    // Simplified approach - find when post-intervention performance exceeds baseline
    const baselineAvg = this.calculateAverage(before.progressScores);
    const afterScores = after.progressScores;
    
    for (let i = 0; i < afterScores.length; i++) {
      if (afterScores[i] > baselineAvg * 1.1) { // 10% improvement threshold
        return i + 1; // Return days to impact
      }
    }
    
    return afterScores.length; // Impact not clearly detected within observation period
  }

  /**
   * Calculate sustainability score for post-intervention improvements
   */
  private static calculateSustainabilityScore(after: StudentProgressMetrics): number {
    const { progressScores } = after;
    if (progressScores.length < 3) return 50;

    // Check if improvements are maintained over time
    const firstHalf = progressScores.slice(0, Math.floor(progressScores.length / 2));
    const secondHalf = progressScores.slice(Math.floor(progressScores.length / 2));

    if (firstHalf.length === 0 || secondHalf.length === 0) return 50;

    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);

    // If second half maintains or improves upon first half, high sustainability
    const sustainabilityRatio = firstAvg > 0 ? secondAvg / firstAvg : 1;
    
    let score = 50; // Base score
    if (sustainabilityRatio >= 1.0) score = 80; // Maintained or improved
    else if (sustainabilityRatio >= 0.9) score = 70; // Slight decline
    else if (sustainabilityRatio >= 0.8) score = 60; // Moderate decline
    else score = 40; // Significant decline

    // Adjust for trend stability
    const trend = this.determineVelocityTrend(progressScores);
    if (trend.trend === 'improving') score += 10;
    else if (trend.trend === 'declining') score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  // ========================================================================
  // PREDICTIVE MODEL HELPERS
  // ========================================================================

  /**
   * Check if data exhibits exponential growth pattern
   */
  private static isExponentialData(data: TimeSeriesPoint[]): boolean {
    if (data.length < 5) return false;
    
    // Check if logarithmic transformation improves linearity
    const logData = data
      .filter(point => point.value > 0) // Can only log positive values
      .map((point, index) => ({ x: index, y: Math.log(point.value) }));
    
    if (logData.length < 5) return false;
    
    const logRegression = this.linearRegression(logData);
    const linearRegression = this.linearRegression(
      data.map((point, index) => ({ x: index, y: point.value }))
    );
    
    // If log transform significantly improves R², it's likely exponential
    return logRegression.rSquared > linearRegression.rSquared + 0.1;
  }

  /**
   * Check if data exhibits logarithmic growth pattern
   */
  private static isLogarithmicData(data: TimeSeriesPoint[]): boolean {
    if (data.length < 5) return false;
    
    // Check if log(x) vs y improves linearity
    const logXData = data.map((point, index) => ({ 
      x: Math.log(index + 1), // +1 to avoid log(0)
      y: point.value 
    }));
    
    const logXRegression = this.linearRegression(logXData);
    const linearRegression = this.linearRegression(
      data.map((point, index) => ({ x: index, y: point.value }))
    );
    
    return logXRegression.rSquared > linearRegression.rSquared + 0.1;
  }

  /**
   * Fit linear predictive model
   */
  private static fitLinearModel(
    normalizedData: {x: number, y: number}[], 
    originalData: TimeSeriesPoint[]
  ): PredictiveModel {
    const regression = this.linearRegression(normalizedData);
    
    const predictions = originalData.map((point, index) => {
      const predictedValue = regression.predictions(index);
      const error = regression.standardError * 1.96; // 95% confidence
      
      return {
        timestamp: point.timestamp,
        value: predictedValue,
        confidenceInterval: [predictedValue - error, predictedValue + error] as [number, number]
      };
    });

    return {
      modelType: 'linear',
      coefficients: [regression.intercept, regression.slope],
      rSquared: regression.rSquared,
      standardError: regression.standardError,
      predictions,
      fitQuality: regression.rSquared * 100,
      dataPoints: normalizedData.length
    };
  }

  /**
   * Fit exponential predictive model
   */
  private static fitExponentialModel(
    normalizedData: {x: number, y: number}[], 
    originalData: TimeSeriesPoint[]
  ): PredictiveModel {
    // Transform y values to log scale for exponential fitting
    const logData = normalizedData
      .filter(point => point.y > 0)
      .map(point => ({ x: point.x, y: Math.log(point.y) }));
    
    if (logData.length < 3) {
      return this.fitLinearModel(normalizedData, originalData); // Fallback to linear
    }

    const logRegression = this.linearRegression(logData);
    
    // Convert back to exponential form: y = a * exp(b * x)
    const a = Math.exp(logRegression.intercept);
    const b = logRegression.slope;

    const predictions = originalData.map((point, index) => {
      const predictedValue = a * Math.exp(b * index);
      const error = predictedValue * 0.2; // 20% error margin for exponential
      
      return {
        timestamp: point.timestamp,
        value: predictedValue,
        confidenceInterval: [
          Math.max(0, predictedValue - error), 
          predictedValue + error
        ] as [number, number]
      };
    });

    return {
      modelType: 'exponential',
      coefficients: [a, b],
      rSquared: logRegression.rSquared,
      standardError: logRegression.standardError,
      predictions,
      fitQuality: logRegression.rSquared * 100,
      dataPoints: normalizedData.length
    };
  }

  /**
   * Fit logarithmic predictive model
   */
  private static fitLogarithmicModel(
    normalizedData: {x: number, y: number}[], 
    originalData: TimeSeriesPoint[]
  ): PredictiveModel {
    const logXData = normalizedData.map(point => ({ 
      x: Math.log(Math.max(1, point.x + 1)), // +1 to avoid log(0)
      y: point.y 
    }));

    const logRegression = this.linearRegression(logXData);
    
    const predictions = originalData.map((point, index) => {
      const logX = Math.log(Math.max(1, index + 1));
      const predictedValue = logRegression.intercept + logRegression.slope * logX;
      const error = logRegression.standardError * 1.96;
      
      return {
        timestamp: point.timestamp,
        value: predictedValue,
        confidenceInterval: [predictedValue - error, predictedValue + error] as [number, number]
      };
    });

    return {
      modelType: 'logarithmic',
      coefficients: [logRegression.intercept, logRegression.slope],
      rSquared: logRegression.rSquared,
      standardError: logRegression.standardError,
      predictions,
      fitQuality: logRegression.rSquared * 100,
      dataPoints: normalizedData.length
    };
  }

  /**
   * Fit polynomial predictive model (quadratic)
   */
  private static fitPolynomialModel(
    normalizedData: {x: number, y: number}[], 
    originalData: TimeSeriesPoint[],
    degree: number = 2
  ): PredictiveModel {
    if (degree !== 2) {
      return this.fitLinearModel(normalizedData, originalData); // Only quadratic supported
    }

    // For quadratic: y = ax² + bx + c
    // We'll use a simplified approach with matrix operations approximation
    const n = normalizedData.length;
    if (n < 3) return this.fitLinearModel(normalizedData, originalData);

    // Create normal equations for polynomial fitting
    let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
    let sumY = 0, sumXY = 0, sumX2Y = 0;

    for (const point of normalizedData) {
      const x = point.x;
      const y = point.y;
      const x2 = x * x;
      const x3 = x2 * x;
      const x4 = x2 * x2;

      sumX += x;
      sumX2 += x2;
      sumX3 += x3;
      sumX4 += x4;
      sumY += y;
      sumXY += x * y;
      sumX2Y += x2 * y;
    }

    // Solve normal equations (simplified approach)
    // This is a basic implementation - in production, use proper matrix operations
    const a = ((sumX2Y * sumX2 - sumXY * sumX3) * n - (sumY * sumX2 - sumXY * sumX) * sumX2) / 
              ((sumX4 * sumX2 - sumX3 * sumX3) * n - (sumX2 * sumX2 - sumX3 * sumX) * sumX2) || 0;
    const b = (sumXY - a * sumX3 - (sumY - a * sumX2) * sumX / n) / (sumX2 - sumX * sumX / n) || 0;
    const c = (sumY - a * sumX2 - b * sumX) / n || 0;

    // Calculate R²
    let ssRes = 0, ssTot = 0;
    const yMean = sumY / n;
    
    for (const point of normalizedData) {
      const predicted = a * point.x * point.x + b * point.x + c;
      ssRes += (point.y - predicted) ** 2;
      ssTot += (point.y - yMean) ** 2;
    }

    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    const standardError = Math.sqrt(ssRes / Math.max(1, n - 3));

    const predictions = originalData.map((point, index) => {
      const predictedValue = a * index * index + b * index + c;
      const error = standardError * 2; // Approximate confidence interval
      
      return {
        timestamp: point.timestamp,
        value: predictedValue,
        confidenceInterval: [predictedValue - error, predictedValue + error] as [number, number]
      };
    });

    return {
      modelType: 'polynomial',
      coefficients: [c, b, a], // Constant, linear, quadratic coefficients
      rSquared: Math.max(0, rSquared),
      standardError,
      predictions,
      fitQuality: Math.max(0, rSquared) * 100,
      dataPoints: normalizedData.length
    };
  }

  /**
   * Evaluate model at a given x value
   */
  private static evaluateModel(model: PredictiveModel, x: number): number {
    const [c0, c1, c2] = model.coefficients;
    
    switch (model.modelType) {
      case 'linear':
        return c0 + c1 * x;
      case 'exponential':
        return c0 * Math.exp(c1 * x);
      case 'logarithmic':
        return c0 + c1 * Math.log(Math.max(1, x + 1));
      case 'polynomial':
        return c0 + c1 * x + (c2 || 0) * x * x;
      default:
        return c0 + c1 * x;
    }
  }

  // ========================================================================
  // LEGACY HELPER METHODS (UPDATED)
  // ========================================================================
  
  private static calculateVelocityFromTimeSeries(timePoints: Date[], values: number[]): number {
    if (timePoints.length < 2) return 0;
    
    const timeDeltas = timePoints.slice(1).map((time, i) => 
      (time.getTime() - timePoints[i].getTime()) / (1000 * 60 * 60 * 24) // Convert to days
    );
    
    const valueDeltas = values.slice(1).map((value, i) => value - values[i]);
    
    const totalTimeDelta = timeDeltas.reduce((sum, delta) => sum + delta, 0);
    const totalValueDelta = valueDeltas.reduce((sum, delta) => sum + delta, 0);
    
    return totalTimeDelta > 0 ? totalValueDelta / totalTimeDelta : 0;
  }
  
  private static determineVelocityTrend(timePoints: Date[], progressScores: number[]): 'accelerating' | 'steady' | 'decelerating' {
    if (progressScores.length < 4) return 'steady';
    
    const midPoint = Math.floor(progressScores.length / 2);
    const firstHalf = progressScores.slice(0, midPoint);
    const secondHalf = progressScores.slice(midPoint);
    const firstHalfTimes = timePoints.slice(0, midPoint);
    const secondHalfTimes = timePoints.slice(midPoint);
    
    const firstHalfVelocity = this.calculateVelocityFromTimeSeries(firstHalfTimes, firstHalf);
    const secondHalfVelocity = this.calculateVelocityFromTimeSeries(secondHalfTimes, secondHalf);
    
    const velocityChange = secondHalfVelocity - firstHalfVelocity;
    
    if (velocityChange > 0.1) return 'accelerating';
    if (velocityChange < -0.1) return 'decelerating';
    return 'steady';
  }
  
  private static calculateVelocityConfidence(timePoints: Date[], progressScores: number[]): number {
    const sampleSize = progressScores.length;
    const dataSpan = timePoints.length > 1 ? 
      (timePoints[timePoints.length - 1].getTime() - timePoints[0].getTime()) / (1000 * 60 * 60 * 24) : 0;
    
    // Base confidence on sample size and data span
    let confidence = Math.min(1, (sampleSize - 2) / 10); // Max confidence at 12+ points
    confidence *= Math.min(1, dataSpan / 30); // Max confidence with 30+ days of data
    
    // Reduce confidence for high variability
    const variance = this.calculateVariance(progressScores);
    confidence *= Math.max(0.1, 1 - (variance / 1000)); // Adjust for variance
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  private static linearRegression(x: number[], y: number[]): { slope: number; correlation: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const correlation = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return { slope, correlation: isNaN(correlation) ? 0 : correlation };
  }
  
  private static calculateTrendConfidence(progressScores: number[]): number {
    const sampleSize = progressScores.length;
    const variance = this.calculateVariance(progressScores);
    
    let confidence = Math.min(1, sampleSize / 10);
    confidence *= Math.max(0.1, 1 - (variance / 500));
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  private static detectSeasonalPatterns(timePoints: Date[], values: number[]): any {
    // Simple seasonal pattern detection
    const dayOfWeekPattern: { [key: string]: number } = {};
    const timeOfDayPattern: { [key: string]: number } = {};
    
    timePoints.forEach((time, i) => {
      const dayOfWeek = time.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = time.getHours();
      const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      
      dayOfWeekPattern[dayOfWeek] = (dayOfWeekPattern[dayOfWeek] || 0) + values[i];
      timeOfDayPattern[timeOfDay] = (timeOfDayPattern[timeOfDay] || 0) + values[i];
    });
    
    return { dayOfWeek: dayOfWeekPattern, timeOfDay: timeOfDayPattern };
  }
  
  private static detectChangePoints(timePoints: Date[], values: number[]): Array<any> {
    // Simple change point detection using moving averages
    const changePoints: Array<any> = [];
    const windowSize = Math.max(3, Math.floor(values.length / 5));
    
    for (let i = windowSize; i < values.length - windowSize; i++) {
      const beforeWindow = values.slice(i - windowSize, i);
      const afterWindow = values.slice(i, i + windowSize);
      
      const beforeMean = this.calculateAverage(beforeWindow);
      const afterMean = this.calculateAverage(afterWindow);
      
      const change = afterMean - beforeMean;
      const significance = Math.abs(change) / Math.max(beforeMean, 1);
      
      if (significance > 0.2) { // 20% change threshold
        changePoints.push({
          date: timePoints[i],
          type: change > 0 ? 'improvement' : 'decline',
          significance
        });
      }
    }
    
    return changePoints;
  }
  
  private static assessPerformanceDropRisk(metrics: StudentProgressMetrics): any {
    const recentScores = metrics.progressScores.slice(-5);
    const earlierScores = metrics.progressScores.slice(0, -5);
    
    if (recentScores.length === 0 || earlierScores.length === 0) {
      return { factor: 'Performance Drop', severity: 0, contribution: 0, description: 'Insufficient data' };
    }
    
    const recentAvg = this.calculateAverage(recentScores);
    const earlierAvg = this.calculateAverage(earlierScores);
    const dropPercentage = ((earlierAvg - recentAvg) / earlierAvg) * 100;
    
    let severity = 0;
    let description = 'Performance is stable';
    
    if (dropPercentage > 30) {
      severity = 90;
      description = 'Severe performance decline detected';
    } else if (dropPercentage > 20) {
      severity = 70;
      description = 'Significant performance decline';
    } else if (dropPercentage > 10) {
      severity = 40;
      description = 'Moderate performance decline';
    } else if (dropPercentage > 5) {
      severity = 20;
      description = 'Minor performance decline';
    }
    
    return {
      factor: 'Performance Drop',
      severity,
      contribution: severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.PERFORMANCE_DROP_WEIGHT,
      description
    };
  }
  
  private static assessEngagementRisk(metrics: StudentProgressMetrics): any {
    const recentEngagement = metrics.engagementLevels.slice(-5);
    const avgEngagement = recentEngagement.length > 0 ? this.calculateAverage(recentEngagement) : 50;
    
    let severity = 0;
    let description = 'Engagement levels are healthy';
    
    if (avgEngagement < 30) {
      severity = 80;
      description = 'Very low engagement levels';
    } else if (avgEngagement < 50) {
      severity = 60;
      description = 'Below average engagement';
    } else if (avgEngagement < 70) {
      severity = 30;
      description = 'Moderate engagement levels';
    }
    
    return {
      factor: 'Engagement Level',
      severity,
      contribution: severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.ENGAGEMENT_DROP_WEIGHT,
      description
    };
  }
  
  private static assessConsistencyRisk(metrics: StudentProgressMetrics): any {
    const completionRates = metrics.sessionCompletionRates;
    const variance = completionRates.length > 0 ? this.calculateVariance(completionRates) : 0;
    const avgCompletion = completionRates.length > 0 ? this.calculateAverage(completionRates) : 100;
    
    let severity = 0;
    let description = 'Consistent study patterns';
    
    if (variance > 2000 || avgCompletion < 50) {
      severity = 70;
      description = 'Highly inconsistent study patterns';
    } else if (variance > 1000 || avgCompletion < 70) {
      severity = 40;
      description = 'Moderate inconsistency in studies';
    } else if (variance > 500 || avgCompletion < 85) {
      severity = 20;
      description = 'Minor inconsistencies detected';
    }
    
    return {
      factor: 'Study Consistency',
      severity,
      contribution: severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.CONSISTENCY_WEIGHT,
      description
    };
  }
  
  private static assessMotivationRisk(metrics: StudentProgressMetrics): any {
    // Use study time as a proxy for motivation
    const recentStudyTime = metrics.studyTimeMinutes.slice(-7);
    const avgStudyTime = recentStudyTime.length > 0 ? this.calculateAverage(recentStudyTime) : 30;
    
    let severity = 0;
    let description = 'Motivation levels appear healthy';
    
    if (avgStudyTime < 10) {
      severity = 80;
      description = 'Very low study time indicates motivation issues';
    } else if (avgStudyTime < 20) {
      severity = 60;
      description = 'Below recommended study time';
    } else if (avgStudyTime < 30) {
      severity = 30;
      description = 'Moderate study time levels';
    }
    
    return {
      factor: 'Motivation Indicators',
      severity,
      contribution: severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.MOTIVATION_WEIGHT,
      description
    };
  }
  
  private static assessActivityRisk(metrics: StudentProgressMetrics): any {
    const lastActivityDate = metrics.timePoints[metrics.timePoints.length - 1];
    const daysSinceActivity = (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
    
    let severity = 0;
    let description = 'Recent activity detected';
    
    if (daysSinceActivity > 14) {
      severity = 90;
      description = 'No activity for over 2 weeks';
    } else if (daysSinceActivity > 7) {
      severity = 60;
      description = 'No activity for over 1 week';
    } else if (daysSinceActivity > 3) {
      severity = 30;
      description = 'No activity for several days';
    }
    
    return {
      factor: 'Activity Recency',
      severity,
      contribution: severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.TIME_SINCE_ACTIVITY_WEIGHT,
      description
    };
  }
  
  private static assessInterventionHistoryRisk(interventions: MentoringIntervention[]): any {
    const recentInterventions = interventions.filter(i => {
      const interventionDate = new Date(i.createdAt);
      const daysSince = (Date.now() - interventionDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 90; // Last 90 days
    });
    
    const failedInterventions = recentInterventions.filter(i => i.effectiveness === 'ineffective');
    
    let severity = 0;
    let description = 'No concerning intervention history';
    
    if (failedInterventions.length >= 3) {
      severity = 80;
      description = 'Multiple recent intervention failures';
    } else if (failedInterventions.length >= 2) {
      severity = 60;
      description = 'Recent intervention challenges';
    } else if (recentInterventions.length >= 5) {
      severity = 40;
      description = 'Frequent interventions required';
    }
    
    return {
      factor: 'Intervention History',
      severity,
      contribution: severity * ANALYTICS_CONFIG.RISK_ASSESSMENT_FACTORS.INTERVENTION_HISTORY_WEIGHT,
      description
    };
  }
  
  private static generateInterventionRecommendations(riskFactors: any[], riskLevel: RiskLevel): any[] {
    const recommendations: any[] = [];
    
    riskFactors.forEach(factor => {
      if (factor.severity > 50) {
        switch (factor.factor) {
          case 'Performance Drop':
            recommendations.push({
              type: 'academic_support',
              priority: 'high' as InterventionPriority,
              description: 'Provide additional tutoring and review sessions',
              expectedImpact: 75
            });
            break;
          case 'Engagement Level':
            recommendations.push({
              type: 'motivational',
              priority: 'medium' as InterventionPriority,
              description: 'Implement gamification and interactive content',
              expectedImpact: 65
            });
            break;
          case 'Study Consistency':
            recommendations.push({
              type: 'schedule_adjustment',
              priority: 'medium' as InterventionPriority,
              description: 'Create structured study schedule with reminders',
              expectedImpact: 60
            });
            break;
          case 'Activity Recency':
            recommendations.push({
              type: 'behavioral',
              priority: 'urgent' as InterventionPriority,
              description: 'Immediate outreach and re-engagement strategy',
              expectedImpact: 80
            });
            break;
        }
      }
    });
    
    return recommendations;
  }
  
  private static calculateRiskConfidence(metrics: StudentProgressMetrics, riskFactors: any[]): number {
    const dataQuality = metrics.progressScores.length >= 5 ? 0.8 : metrics.progressScores.length / 5 * 0.8;
    const factorConsistency = riskFactors.filter(f => f.severity > 30).length / riskFactors.length;
    
    return Math.min(1, dataQuality + factorConsistency * 0.2);
  }
  
  private static calculateEffectivenessScore(impactMetrics: any): number {
    const { performanceImprovement, engagementChange } = impactMetrics;
    
    // Weighted score based on improvements
    let score = 0;
    score += Math.max(0, Math.min(40, performanceImprovement)); // Max 40 points for performance
    score += Math.max(0, Math.min(30, engagementChange)); // Max 30 points for engagement
    score += 30; // Base score for intervention completion
    
    return Math.max(0, Math.min(100, score));
  }
  
  private static calculateTimeToImpact(preMetrics: StudentProgressMetrics, postMetrics: StudentProgressMetrics): number {
    // Simplified: return middle of post-intervention period
    return ANALYTICS_CONFIG.INTERVENTION_EFFECTIVENESS_EVALUATION_PERIOD / 2;
  }
  
  private static calculateSustainabilityScore(postMetrics: StudentProgressMetrics): number {
    if (postMetrics.progressScores.length < 3) return 50; // Default for insufficient data
    
    const trend = this.analyzePerformanceTrends(postMetrics);
    
    if (trend.trendDirection === 'improving') return 85;
    if (trend.trendDirection === 'stable') return 70;
    return 40; // declining
  }
  
  private static calculateInterventionConfidence(preMetrics: StudentProgressMetrics, postMetrics: StudentProgressMetrics): number {
    const preSampleSize = preMetrics.progressScores.length;
    const postSampleSize = postMetrics.progressScores.length;
    
    let confidence = Math.min(1, (preSampleSize + postSampleSize) / 14); // 7 days pre + 7 days post for full confidence
    
    // Reduce confidence if variance is too high
    const preVariance = this.calculateVariance(preMetrics.progressScores);
    const postVariance = this.calculateVariance(postMetrics.progressScores);
    const avgVariance = (preVariance + postVariance) / 2;
    
    confidence *= Math.max(0.2, 1 - (avgVariance / 1000));
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  private static calculateDisengagementRisk(metrics: StudentProgressMetrics, trends: PerformanceTrendAnalysis): number {
    let riskScore = 0;
    
    // Factor in trend direction
    if (trends.trendDirection === 'declining') riskScore += 40;
    else if (trends.trendDirection === 'stable') riskScore += 20;
    
    // Factor in engagement levels
    const avgEngagement = this.calculateAverage(metrics.engagementLevels);
    if (avgEngagement < 40) riskScore += 30;
    else if (avgEngagement < 60) riskScore += 15;
    
    // Factor in consistency
    const completionVariance = this.calculateVariance(metrics.sessionCompletionRates);
    if (completionVariance > 1500) riskScore += 20;
    else if (completionVariance > 1000) riskScore += 10;
    
    return Math.min(100, riskScore) / 100;
  }
  
  private static calculateGoalAchievementProbability(
    velocity: LearningVelocityAnalysis,
    trends: PerformanceTrendAnalysis,
    learningPath?: AdaptiveLearningPath
  ): number {
    let probability = 0.5; // Base probability
    
    // Factor in velocity
    if (velocity.overallVelocity > 1) probability += 0.2;
    else if (velocity.overallVelocity > 0.5) probability += 0.1;
    else if (velocity.overallVelocity < 0) probability -= 0.3;
    
    // Factor in trends
    if (trends.trendDirection === 'improving') probability += 0.15;
    else if (trends.trendDirection === 'declining') probability -= 0.15;
    
    // Factor in velocity confidence
    probability += (velocity.velocityConfidence - 0.5) * 0.2;
    
    return Math.max(0, Math.min(1, probability));
  }
  
  private static predictLongTermOutcomes(
    velocity: LearningVelocityAnalysis,
    trends: PerformanceTrendAnalysis,
    metrics: StudentProgressMetrics
  ): { expectedOutcome: string; competencyLevel: string; retentionProbability: number } {
    const currentProgress = metrics.progressScores[metrics.progressScores.length - 1];
    const projectedProgress = currentProgress + (velocity.overallVelocity * 365); // 1 year projection
    
    let expectedOutcome = 'steady_progress';
    let competencyLevel = 'intermediate';
    let retentionProbability = 0.7;
    
    if (projectedProgress > 90 && trends.trendDirection === 'improving') {
      expectedOutcome = 'excellence';
      competencyLevel = 'advanced';
      retentionProbability = 0.9;
    } else if (projectedProgress > 75) {
      expectedOutcome = 'goal_achievement';
      competencyLevel = 'upper_intermediate';
      retentionProbability = 0.8;
    } else if (projectedProgress < 40 || trends.trendDirection === 'declining') {
      expectedOutcome = 'at_risk';
      competencyLevel = 'beginner';
      retentionProbability = 0.4;
    }
    
    return { expectedOutcome, competencyLevel, retentionProbability };
  }
  
  private static calculateAverage(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }
  
  private static calculateVariance(numbers: number[]): number {
    const avg = this.calculateAverage(numbers);
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
    return this.calculateAverage(squareDiffs);
  }
}

// ============================================================================
// ANALYTICS UTILITIES
// ============================================================================

/**
 * Utility functions for data processing and analysis
 */
export class AnalyticsUtils {
  
  /**
   * Smooth data using exponential smoothing
   */
  static exponentialSmoothing(data: number[], alpha: number = ANALYTICS_CONFIG.PROGRESS_SMOOTHING_FACTOR): number[] {
    if (data.length === 0) return [];
    
    const smoothed = [data[0]];
    for (let i = 1; i < data.length; i++) {
      smoothed[i] = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
    }
    return smoothed;
  }
  
  /**
   * Calculate percentile values
   */
  static calculatePercentile(data: number[], percentile: number): number {
    const sorted = [...data].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) return sorted[lower];
    
    return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
  }
  
  /**
   * Normalize data to 0-100 scale
   */
  static normalizeData(data: number[]): number[] {
    if (data.length === 0) return [];
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    if (range === 0) return data.map(() => 50); // All values same, return middle
    
    return data.map(value => ((value - min) / range) * 100);
  }
  
  /**
   * Detect anomalies using z-score
   */
  static detectAnomalies(data: number[], threshold: number = 2.5): boolean[] {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    return data.map(value => Math.abs((value - mean) / stdDev) > threshold);
  }
}