// ============================================================================
// AI INSIGHT SCHEMA
// ============================================================================
// Comprehensive TypeScript types for AI-generated insights, recommendations,
// and analytics summaries with multilingual and cultural context support

import type { RiskLevel, InterventionPriority, InterventionType } from './enhanced-mentoring-schema';

// ============================================================================
// CORE INSIGHT INTERFACES
// ============================================================================

// Actionable recommendations with priority and outcome expectations
export interface ActionableRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action: string;
  rationale: string;
  expectedOutcome: string;
  timeframe: string;
  implementationSteps: string[];
  requiredResources?: string[];
  estimatedEffort: 'minimal' | 'moderate' | 'significant' | 'extensive';
  successMetrics: string[];
  potentialChallenges?: string[];
}

// Progress insights for individual students
export interface ProgressInsights {
  studentId: number;
  language: 'fa' | 'en' | 'ar';
  generatedAt: Date;
  confidenceScore: number; // 0-100
  
  // Core analysis
  summary: string;
  overallProgressAssessment: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'critical';
  trendAnalysis: {
    direction: 'improving' | 'stable' | 'declining';
    velocity: 'accelerating' | 'steady' | 'decelerating';
    consistency: number; // 0-100
  };
  
  // Strengths and challenges
  strengths: {
    primary: string[];
    secondary: string[];
    evidencePoints: string[];
  };
  
  improvementAreas: {
    critical: string[];
    moderate: string[];
    developmental: string[];
    specificSkills: string[];
  };
  
  // Personalized guidance
  recommendations: ActionableRecommendation[];
  motivationalMessage: string;
  nextSteps: string[];
  culturallyAdaptedGuidance: string;
  
  // Predictive elements
  projectedOutcomes: {
    shortTerm: string; // 1-2 weeks
    mediumTerm: string; // 1-3 months
    longTerm: string; // 3-12 months
  };
  
  // Metadata
  aiModelUsed: string;
  processingTime: number; // milliseconds
  dataQualityAssessment: number; // 0-100
}

// Risk assessment insights with intervention recommendations
export interface RiskInsights {
  studentId: number;
  language: 'fa' | 'en' | 'ar';
  assessmentDate: Date;
  
  // Risk analysis
  overallRiskLevel: RiskLevel;
  riskScore: number; // 0-100
  confidenceLevel: number; // 0-100
  
  // Risk factors breakdown
  riskFactors: {
    academic: {
      level: RiskLevel;
      factors: string[];
      weight: number;
    };
    behavioral: {
      level: RiskLevel;
      factors: string[];
      weight: number;
    };
    motivational: {
      level: RiskLevel;
      factors: string[];
      weight: number;
    };
    social: {
      level: RiskLevel;
      factors: string[];
      weight: number;
    };
  };
  
  // Explanatory insights
  riskExplanation: string;
  triggerEvents: string[];
  warningSignsIdentified: string[];
  protectiveFactors: string[];
  
  // Intervention guidance
  immediateActions: ActionableRecommendation[];
  preventativeStrategies: ActionableRecommendation[];
  monitoringPlan: {
    frequency: string;
    keyMetrics: string[];
    alertThresholds: Record<string, number>;
  };
  
  // Timeline and escalation
  reassessmentDate: Date;
  escalationTriggers: string[];
  emergencyContacts?: {
    role: string;
    contactInfo: string;
    triggerConditions: string[];
  }[];
}

// Cohort-level insights for mentors
export interface CohortInsights {
  mentorId: number;
  language: 'fa' | 'en' | 'ar';
  analysisDate: Date;
  cohortSize: number;
  
  // Overall cohort performance
  cohortSummary: string;
  performanceDistribution: {
    excellent: number;
    good: number;
    satisfactory: number;
    needsImprovement: number;
    critical: number;
  };
  
  // Comparative analysis
  cohortVsSystemAverage: {
    progressRate: number; // percentage difference
    engagementLevel: number;
    completionRate: number;
    riskLevel: number;
  };
  
  // Student groupings
  topPerformers: {
    count: number;
    commonTraits: string[];
    successFactors: string[];
  };
  
  studentsAtRisk: {
    count: number;
    riskDistribution: Record<RiskLevel, number>;
    commonChallenges: string[];
    recommendedInterventions: string[];
  };
  
  studentsNeedingAttention: {
    count: number;
    priorityList: Array<{
      studentId: number;
      urgencyLevel: InterventionPriority;
      primaryConcerns: string[];
      suggestedActions: string[];
    }>;
  };
  
  // Mentorship effectiveness
  mentoringEffectiveness: {
    overallRating: number; // 0-10
    strengthAreas: string[];
    improvementAreas: string[];
    studentFeedbackSummary: string;
    impactMetrics: {
      averageProgressImprovement: number;
      riskReductionRate: number;
      studentSatisfactionScore: number;
    };
  };
  
  // Recommendations for mentor
  mentorRecommendations: ActionableRecommendation[];
  professionalDevelopmentSuggestions: string[];
  resourceRecommendations: string[];
}

// Predictive insights for future outcomes
export interface PredictiveInsights {
  studentId: number;
  language: 'fa' | 'en' | 'ar';
  predictionDate: Date;
  predictionHorizon: '1_week' | '1_month' | '3_months' | '6_months' | '1_year';
  
  // Prediction summary
  predictionSummary: string;
  confidenceLevel: number; // 0-100
  
  // Predicted outcomes
  academicOutcomes: {
    likelyProgressRate: number;
    skillDevelopmentProjections: Record<string, number>;
    completionProbability: number;
    expectedGrade: string;
    timeToGoalAchievement: string;
  };
  
  riskProjections: {
    futureRiskLevel: RiskLevel;
    riskFactorEvolution: Record<string, 'increasing' | 'stable' | 'decreasing'>;
    interventionNeeds: InterventionType[];
    preventativeActions: string[];
  };
  
  engagementProjections: {
    expectedEngagementLevel: number;
    motivationTrends: 'increasing' | 'stable' | 'declining';
    participationLikelihood: number;
    retentionProbability: number;
  };
  
  // Scenario analysis
  scenarioAnalysis: {
    bestCase: {
      outcome: string;
      probability: number;
      requiredConditions: string[];
    };
    mostLikely: {
      outcome: string;
      probability: number;
      assumptions: string[];
    };
    worstCase: {
      outcome: string;
      probability: number;
      riskFactors: string[];
    };
  };
  
  // Actionable insights
  proactiveRecommendations: ActionableRecommendation[];
  criticalDecisionPoints: Array<{
    timeframe: string;
    decision: string;
    potentialImpact: string;
    recommendedChoice: string;
  }>;
  
  // Model metadata
  modelUsed: string;
  dataQuality: number;
  historicalAccuracy: number; // based on past predictions
}

// Intervention effectiveness analysis
export interface EffectivenessAnalysis {
  interventionId: number;
  language: 'fa' | 'en' | 'ar';
  analysisDate: Date;
  
  // Analysis summary
  effectivenessSummary: string;
  overallEffectiveness: 'highly_effective' | 'effective' | 'partially_effective' | 'ineffective' | 'counterproductive';
  effectivenessScore: number; // 0-100
  
  // Impact analysis
  impactMetrics: {
    academicImprovement: number;
    behaviorChange: number;
    engagementIncrease: number;
    riskReduction: number;
    goalAchievement: number;
  };
  
  // Before and after comparison
  comparison: {
    baseline: Record<string, number>;
    current: Record<string, number>;
    percentageChange: Record<string, number>;
    statisticalSignificance: Record<string, boolean>;
  };
  
  // Success factors and challenges
  successFactors: string[];
  challengesEncountered: string[];
  unexpectedOutcomes: string[];
  
  // Lessons learned
  keyLearnings: string[];
  bestPractices: string[];
  adaptationsNeeded: string[];
  
  // Future recommendations
  continuationRecommendations: ActionableRecommendation[];
  scalingOpportunities: string[];
  improvementSuggestions: string[];
  
  // Student and mentor feedback
  stakeholderFeedback: {
    studentSatisfaction: number; // 0-10
    studentComments: string;
    mentorAssessment: string;
    parentGuardianInput?: string;
  };
}

// Intervention recommendations
export interface InterventionRecommendations {
  studentId: number;
  language: 'fa' | 'en' | 'ar';
  generatedAt: Date;
  
  // Analysis summary
  situationAnalysis: string;
  urgencyLevel: InterventionPriority;
  
  // Recommended interventions
  primaryInterventions: Array<{
    type: InterventionType;
    title: string;
    description: string;
    rationale: string;
    implementation: ActionableRecommendation;
    expectedOutcome: string;
    timeframe: string;
    resources: string[];
    successMetrics: string[];
  }>;
  
  // Alternative approaches
  alternativeStrategies: Array<{
    strategy: string;
    conditions: string[];
    pros: string[];
    cons: string[];
  }>;
  
  // Implementation guidance
  implementationPlan: {
    phases: Array<{
      phase: number;
      title: string;
      duration: string;
      activities: string[];
      milestones: string[];
    }>;
    timeline: string;
    dependencies: string[];
    prerequisites: string[];
  };
  
  // Monitoring and evaluation
  monitoringFramework: {
    keyIndicators: string[];
    measurementFrequency: string;
    progressMilestones: Array<{
      milestone: string;
      expectedDate: string;
      successCriteria: string[];
    }>;
    adjustmentTriggers: string[];
  };
  
  // Risk mitigation
  riskAssessment: {
    implementationRisks: string[];
    mitigationStrategies: string[];
    contingencyPlans: string[];
  };
}

// ============================================================================
// REQUEST/RESPONSE INTERFACES
// ============================================================================

// Insight generation request
export interface InsightGenerationRequest {
  studentId?: number;
  mentorId?: number;
  language: 'fa' | 'en' | 'ar';
  insightType: 'progress' | 'risk' | 'cohort' | 'predictive' | 'intervention' | 'effectiveness';
  includeRecommendations: boolean;
  culturalContext?: 'iranian' | 'arab' | 'western' | 'general';
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  timeframe?: {
    from: Date;
    to: Date;
  };
  additionalContext?: {
    recentEvents?: string[];
    specificConcerns?: string[];
    parentRequests?: string[];
    previousInterventions?: number[];
  };
}

// Unified insight response
export interface InsightResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    generatedAt: Date;
    processingTime: number;
    modelUsed: string;
    confidenceScore: number;
    dataQuality: number;
    language: 'fa' | 'en' | 'ar';
    cached: boolean;
    version: string;
  };
}

// Batch insight request for multiple students
export interface BatchInsightRequest {
  studentIds: number[];
  language: 'fa' | 'en' | 'ar';
  insightTypes: ('progress' | 'risk' | 'predictive')[];
  includeRecommendations: boolean;
  culturalContext?: 'iranian' | 'arab' | 'western' | 'general';
  priority: 'low' | 'normal' | 'high';
}

// ============================================================================
// CULTURAL CONTEXT INTERFACES
// ============================================================================

// Cultural adaptation context
export interface CulturalContext {
  language: 'fa' | 'en' | 'ar';
  region: string;
  culturalValues: {
    familyOrientation: 'high' | 'medium' | 'low';
    authorityRespect: 'high' | 'medium' | 'low';
    collectivismVsIndividualism: 'collectivist' | 'mixed' | 'individualist';
    communicationStyle: 'direct' | 'indirect' | 'mixed';
    timeOrientation: 'monochronic' | 'polychronic' | 'flexible';
  };
  educationalPreferences: {
    instructorRole: 'authoritative' | 'facilitating' | 'collaborative';
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    feedbackPreference: 'direct' | 'constructive' | 'encouraging';
    motivationFactors: string[];
  };
  communicationAdaptations: {
    toneAdjustments: string[];
    respectPhrases: string[];
    encouragementPhrases: string[];
    cautionPhrases: string[];
  };
}

// ============================================================================
// CACHE AND PERFORMANCE INTERFACES
// ============================================================================

// Cache configuration for insights
export interface InsightCacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize: number;
  keyPrefix: string;
  invalidationRules: {
    onProgressUpdate: boolean;
    onInterventionChange: boolean;
    onRiskLevelChange: boolean;
    onManualInvalidation: boolean;
  };
}

// Performance metrics for insight generation
export interface InsightPerformanceMetrics {
  generationTime: number;
  cacheHitRate: number;
  averageConfidenceScore: number;
  errorRate: number;
  throughput: number; // insights per minute
  userSatisfactionScore: number;
}

// ============================================================================
// EXPORT TYPES FOR EASIER IMPORTING
// ============================================================================

export type {
  ActionableRecommendation,
  ProgressInsights,
  RiskInsights,
  CohortInsights,
  PredictiveInsights,
  EffectivenessAnalysis,
  InterventionRecommendations,
  InsightGenerationRequest,
  InsightResponse,
  BatchInsightRequest,
  CulturalContext,
  InsightCacheConfig,
  InsightPerformanceMetrics
};

// Utility type for all insight types
export type AllInsightTypes = 
  | ProgressInsights 
  | RiskInsights 
  | CohortInsights 
  | PredictiveInsights 
  | EffectivenessAnalysis 
  | InterventionRecommendations;

// Insight type discriminator
export type InsightTypeMap = {
  progress: ProgressInsights;
  risk: RiskInsights;
  cohort: CohortInsights;
  predictive: PredictiveInsights;
  effectiveness: EffectivenessAnalysis;
  intervention: InterventionRecommendations;
};