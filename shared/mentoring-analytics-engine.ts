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
  // HELPER METHODS
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