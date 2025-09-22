// ============================================================================
// AI MENTORING SERVICE
// ============================================================================
// Comprehensive AI integration for the enhanced mentoring system
// Provides Ollama-first AI processing with OpenAI fallback
// Generates personalized guidance, recommendations, and automated reports

import { EventEmitter } from 'events';
import { LRUCache } from 'lru-cache';
import pTimeout from 'p-timeout';
import { OllamaService } from './ollama-service';
import { openaiService } from './openai-service';
import type { 
  EnhancedStudentProgress, 
  MentoringIntervention, 
  AdaptiveLearningPath,
  AiMentoringRecommendation,
  InterventionType,
  InterventionPriority,
  RiskLevel
} from '@shared/enhanced-mentoring-schema';
import type { 
  StudentProgressMetrics,
  LearningVelocityAnalysis,
  PerformanceTrendAnalysis,
  RiskAssessmentResult,
  InterventionEffectivenessAnalysis,
  PredictiveAnalysisResult
} from '@shared/mentoring-analytics-engine';
import type { UnifiedTestSession, UnifiedResponse } from '@shared/unified-testing-schema';

// ============================================================================
// AI SERVICE CONFIGURATION
// ============================================================================

export const AI_MENTORING_CONFIG = {
  // Model Preferences (Ollama first, OpenAI fallback)
  OLLAMA_PRIMARY_MODEL: process.env.OLLAMA_MENTORING_MODEL || 'llama3.2:3b',
  OLLAMA_ANALYSIS_MODEL: process.env.OLLAMA_ANALYSIS_MODEL || 'llama3.1:8b',
  OPENAI_FALLBACK_MODEL: 'gpt-4o-mini',
  OPENAI_ANALYSIS_MODEL: 'gpt-4o',
  
  // Request Timeouts
  OLLAMA_TIMEOUT_MS: 30000,
  OPENAI_TIMEOUT_MS: 25000,
  
  // Response Processing
  MAX_RECOMMENDATION_LENGTH: 1000,
  CONFIDENCE_THRESHOLD: 0.7,
  
  // Iran Localization
  DEFAULT_LANGUAGE: 'persian',
  SUPPORTED_LANGUAGES: ['persian', 'english', 'arabic'],
  RTL_LANGUAGES: ['persian', 'arabic']
};

// ============================================================================
// DATA INTERFACES
// ============================================================================

export interface MentoringPromptContext {
  studentId: number;
  studentProfile?: any;
  progressData?: EnhancedStudentProgress;
  performanceMetrics?: StudentProgressMetrics;
  learningPath?: AdaptiveLearningPath;
  testResults?: UnifiedTestSession[];
  culturalBackground?: string;
  nativeLanguage?: string;
  targetLanguage?: string;
  riskAssessment?: RiskAssessmentResult;
  interventionHistory?: MentoringIntervention[];
}

export interface AiGuidanceRequest {
  type: 'progress_report' | 'learning_recommendation' | 'intervention_suggestion' | 'study_plan' | 'motivation_boost' | 'skill_analysis';
  context: MentoringPromptContext;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  language?: string;
  customPrompt?: string;
}

export interface AiGuidanceResponse {
  success: boolean;
  content: string;
  recommendations: Array<{
    type: string;
    priority: InterventionPriority;
    description: string;
    actionSteps: string[];
    expectedImpact: number;
  }>;
  insights: {
    strengthsIdentified: string[];
    challengesIdentified: string[];
    improvementAreas: string[];
    personalizedTips: string[];
  };
  confidence: number;
  modelUsed: string;
  processingTime: number;
  language: string;
}

export interface AiProgressReport {
  studentId: number;
  reportType: 'weekly' | 'monthly' | 'milestone' | 'intervention_followup';
  generatedAt: Date;
  summary: {
    overallProgress: string;
    keyAchievements: string[];
    challengesEncountered: string[];
    recommendedActions: string[];
  };
  skillAnalysis: {
    [skill: string]: {
      currentLevel: string;
      progressDirection: 'improving' | 'stable' | 'declining';
      specificInsights: string[];
      recommendedFocus: string[];
    };
  };
  learningPathAnalysis: {
    currentPathAssessment: string;
    adaptationRecommendations: string[];
    paceAdjustmentSuggestions: string[];
    alternativePathSuggestions: string[];
  };
  motivationalMessage: string;
  nextStepGuidance: string[];
  parentGuardianNotes?: string; // For younger students
  confidence: number;
  generatedBy: string;
}

// ============================================================================
// AI MENTORING SERVICE CLASS
// ============================================================================

export class AiMentoringService extends EventEmitter {
  private ollamaService: OllamaService;
  private isOllamaAvailable: boolean = false;
  private requestCount: number = 0;
  private averageResponseTime: number = 0;
  
  // Circuit breaker state
  private ollamaFailureCount: number = 0;
  private openaiFailureCount: number = 0;
  private lastOllamaFailure: number = 0;
  private lastOpenaiFailure: number = 0;
  private readonly maxFailures: number = 5;
  private readonly failureResetTime: number = 300000; // 5 minutes
  
  // LRU Caches for performance
  private guidanceCache: LRUCache<string, AiGuidanceResponse>;
  private progressReportCache: LRUCache<string, AiProgressReport>;
  private analyticsCache: LRUCache<string, any>;
  
  constructor() {
    super();
    this.ollamaService = new OllamaService();
    
    // Initialize caches
    this.guidanceCache = new LRUCache<string, AiGuidanceResponse>({
      max: 500, // Cache up to 500 guidance responses
      ttl: 1800000, // 30 minutes TTL
    });
    
    this.progressReportCache = new LRUCache<string, AiProgressReport>({
      max: 200, // Cache up to 200 progress reports
      ttl: 3600000, // 1 hour TTL
    });
    
    this.analyticsCache = new LRUCache<string, any>({
      max: 100, // Cache up to 100 analytics results
      ttl: 900000, // 15 minutes TTL  
    });
    
    this.initializeServices();
  }
  
  private async initializeServices(): Promise<void> {
    try {
      // Check Ollama availability
      this.isOllamaAvailable = await this.testOllamaConnection();
      console.log(`AI Mentoring Service initialized - Ollama: ${this.isOllamaAvailable ? 'Available' : 'Unavailable'}`);
      
      this.emit('initialized', { 
        ollamaAvailable: this.isOllamaAvailable,
        fallbackMode: !this.isOllamaAvailable
      });
    } catch (error) {
      console.error('Failed to initialize AI Mentoring Service:', error);
      this.emit('error', { type: 'initialization', error });
    }
  }
  
  private async testOllamaConnection(): Promise<boolean> {
    try {
      const response = await this.ollamaService.generateCompletion(
        'Test connection',
        undefined,
        {
          model: AI_MENTORING_CONFIG.OLLAMA_PRIMARY_MODEL,
          temperature: 0.1,
          maxTokens: 10
        }
      );
      return !!response; // Return true if response exists
    } catch (error) {
      console.warn('Ollama connection test failed:', error);
      return false;
    }
  }
  
  // ========================================================================
  // MAIN AI GUIDANCE METHODS
  // ========================================================================
  
  /**
   * Generate personalized guidance based on context and request type
   */
  async generatePersonalizedGuidance(request: AiGuidanceRequest): Promise<AiGuidanceResponse> {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey('guidance', request);
      
      // Check cache first
      const cachedResponse = this.guidanceCache.get(cacheKey);
      if (cachedResponse) {
        console.log(`Cache hit for guidance request: ${cacheKey}`);
        return {
          ...cachedResponse,
          processingTime: Date.now() - startTime, // Update processing time
        };
      }
      
      const prompt = this.buildContextualPrompt(request);
      const language = request.language || AI_MENTORING_CONFIG.DEFAULT_LANGUAGE;
      
      let response: any;
      let modelUsed: string;
      
      // Try Ollama first if available and not circuit-broken
      if (this.isOllamaAvailable && !this.isOllamaCircuitBroken()) {
        try {
          response = await this.generateWithOllamaWithTimeout(prompt, request.type, language);
          modelUsed = `ollama:${AI_MENTORING_CONFIG.OLLAMA_PRIMARY_MODEL}`;
          this.resetOllamaFailures(); // Reset failure count on success
        } catch (ollamaError) {
          console.warn('Ollama request failed, falling back to OpenAI:', ollamaError);
          this.recordOllamaFailure();
          
          if (!this.isOpenaiCircuitBroken()) {
            response = await this.generateWithOpenaiWithTimeout(prompt, request.type, language);
            modelUsed = `openai:${AI_MENTORING_CONFIG.OPENAI_FALLBACK_MODEL}`;
            this.resetOpenaiFailures(); // Reset failure count on success
          } else {
            throw new Error('Both Ollama and OpenAI services are circuit-broken');
          }
        }
      } else if (!this.isOpenaiCircuitBroken()) {
        // Use OpenAI directly if Ollama is circuit-broken or unavailable
        try {
          response = await this.generateWithOpenaiWithTimeout(prompt, request.type, language);
          modelUsed = `openai:${AI_MENTORING_CONFIG.OPENAI_FALLBACK_MODEL}`;
          this.resetOpenaiFailures(); // Reset failure count on success
        } catch (openaiError) {
          this.recordOpenaiFailure();
          throw openaiError;
        }
      } else {
        throw new Error('All AI services are currently unavailable due to circuit breaker');
      }
      
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);
      
      const result: AiGuidanceResponse = {
        success: true,
        content: response.content,
        recommendations: response.recommendations || [],
        insights: response.insights || {
          strengthsIdentified: [],
          challengesIdentified: [],
          improvementAreas: [],
          personalizedTips: []
        },
        confidence: response.confidence || 0.8,
        modelUsed,
        processingTime,
        language
      };
      
      // Cache the response for future requests
      this.guidanceCache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error('AI guidance generation failed:', error);
      
      // Return fallback response
      return {
        success: false,
        content: this.getFallbackGuidance(request.type, request.context),
        recommendations: [],
        insights: {
          strengthsIdentified: [],
          challengesIdentified: [],
          improvementAreas: [],
          personalizedTips: []
        },
        confidence: 0.5,
        modelUsed: 'fallback',
        processingTime: Date.now() - startTime,
        language: request.language || AI_MENTORING_CONFIG.DEFAULT_LANGUAGE
      };
    }
  }
  
  /**
   * Generate automated progress reports
   */
  async generateProgressReport(
    context: MentoringPromptContext,
    reportType: 'weekly' | 'monthly' | 'milestone' | 'intervention_followup' = 'weekly'
  ): Promise<AiProgressReport> {
    
    const language = context.targetLanguage || AI_MENTORING_CONFIG.DEFAULT_LANGUAGE;
    const prompt = this.buildProgressReportPrompt(context, reportType);
    
    let response: any;
    let generatedBy: string;
    
    try {
      // Use more advanced model for detailed reports
      if (this.isOllamaAvailable) {
        response = await this.generateWithOllama(prompt, 'progress_report', language, AI_MENTORING_CONFIG.OLLAMA_ANALYSIS_MODEL);
        generatedBy = `ollama:${AI_MENTORING_CONFIG.OLLAMA_ANALYSIS_MODEL}`;
      } else {
        response = await this.generateWithOpenAI(prompt, 'progress_report', language, AI_MENTORING_CONFIG.OPENAI_ANALYSIS_MODEL);
        generatedBy = `openai:${AI_MENTORING_CONFIG.OPENAI_ANALYSIS_MODEL}`;
      }
      
      return this.parseProgressReportResponse(response, context.studentId, reportType, generatedBy);
      
    } catch (error) {
      console.error('Progress report generation failed:', error);
      return this.generateFallbackProgressReport(context.studentId, reportType);
    }
  }
  
  /**
   * Generate learning path recommendations with adaptation suggestions
   */
  async generateLearningPathRecommendations(
    context: MentoringPromptContext,
    currentPath?: AdaptiveLearningPath
  ): Promise<{
    pathRecommendations: string[];
    adaptationSuggestions: string[];
    paceAdjustments: string[];
    contentModifications: string[];
    confidence: number;
  }> {
    
    const prompt = this.buildLearningPathPrompt(context, currentPath);
    
    try {
      let response: any;
      
      if (this.isOllamaAvailable) {
        response = await this.generateWithOllama(prompt, 'learning_path', context.targetLanguage || 'english');
      } else {
        response = await this.generateWithOpenAI(prompt, 'learning_path', context.targetLanguage || 'english');
      }
      
      return this.parseLearningPathResponse(response);
      
    } catch (error) {
      console.error('Learning path recommendations failed:', error);
      return {
        pathRecommendations: ['Focus on identified weak areas', 'Maintain consistent practice schedule'],
        adaptationSuggestions: ['Consider adjusting difficulty level based on performance'],
        paceAdjustments: ['Monitor progress and adjust as needed'],
        contentModifications: ['Add more practice exercises for challenging topics'],
        confidence: 0.5
      };
    }
  }
  
  /**
   * Analyze test results and generate insights
   */
  async analyzeTestResults(
    testSession: UnifiedTestSession,
    responses: UnifiedResponse[],
    context: MentoringPromptContext
  ): Promise<{
    performance: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextSteps: string[];
    confidence: number;
  }> {
    
    const prompt = this.buildTestAnalysisPrompt(testSession, responses, context);
    
    try {
      let response: any;
      
      if (this.isOllamaAvailable) {
        response = await this.generateWithOllama(prompt, 'test_analysis', context.targetLanguage || 'english');
      } else {
        response = await this.generateWithOpenAI(prompt, 'test_analysis', context.targetLanguage || 'english');
      }
      
      return this.parseTestAnalysisResponse(response);
      
    } catch (error) {
      console.error('Test analysis failed:', error);
      return {
        performance: 'Test completed with mixed results',
        strengths: ['Showed effort in completing the assessment'],
        weaknesses: ['Some areas need additional focus'],
        recommendations: ['Review challenging topics', 'Practice regularly'],
        nextSteps: ['Continue with current learning path'],
        confidence: 0.5
      };
    }
  }
  
  // ========================================================================
  // PRIVATE METHODS - PROMPT BUILDING
  // ========================================================================
  
  private buildContextualPrompt(request: AiGuidanceRequest): string {
    const { context, type } = request;
    const language = request.language || AI_MENTORING_CONFIG.DEFAULT_LANGUAGE;
    const isRTL = AI_MENTORING_CONFIG.RTL_LANGUAGES.includes(language);
    
    let basePrompt = '';
    
    // Language and cultural context
    if (language === 'persian') {
      basePrompt += 'پاسخ را به زبان فارسی و با در نظر گیری فرهنگ ایرانی ارائه دهید.\n';
    } else if (language === 'arabic') {
      basePrompt += 'قدم الإجابة باللغة العربية مع مراعاة السياق الثقافي العربي.\n';
    } else {
      basePrompt += 'Provide response in English with cultural sensitivity.\n';
    }
    
    basePrompt += `
You are an expert AI mentor specializing in language learning and student guidance.
You have access to comprehensive student data and should provide personalized, culturally-sensitive advice.

STUDENT CONTEXT:
- Student ID: ${context.studentId}
- Cultural Background: ${context.culturalBackground || 'Not specified'}
- Native Language: ${context.nativeLanguage || 'Not specified'}  
- Target Language: ${context.targetLanguage || 'Not specified'}
- Current Progress Level: ${context.progressData?.overallProgressPercentage || 'Unknown'}
`;

    // Add specific context based on request type
    switch (type) {
      case 'progress_report':
        basePrompt += this.addProgressReportContext(context);
        break;
      case 'learning_recommendation':
        basePrompt += this.addLearningRecommendationContext(context);
        break;
      case 'intervention_suggestion':
        basePrompt += this.addInterventionContext(context);
        break;
      case 'study_plan':
        basePrompt += this.addStudyPlanContext(context);
        break;
      case 'motivation_boost':
        basePrompt += this.addMotivationContext(context);
        break;
      case 'skill_analysis':
        basePrompt += this.addSkillAnalysisContext(context);
        break;
    }
    
    // Add task-specific instructions
    basePrompt += this.getTaskInstructions(type, language);
    
    if (request.customPrompt) {
      basePrompt += `\n\nADDITIONAL CONTEXT: ${request.customPrompt}`;
    }
    
    return basePrompt;
  }
  
  private addProgressReportContext(context: MentoringPromptContext): string {
    return `
PROGRESS DATA:
- Overall Progress: ${context.progressData?.overallProgressPercentage || 0}%
- Learning Velocity: ${(context.progressData as any)?.learningVelocity || 'Unknown'}
- Engagement Level: ${context.progressData?.engagementLevel || 'Unknown'}
- Study Consistency: ${context.progressData?.consistencyScore || 'Unknown'}
- Recent Performance Trend: ${context.progressData?.performanceTrendDirection || 'Unknown'}

SKILLS BREAKDOWN:
${JSON.stringify(context.progressData?.skillProgressScores || {}, null, 2)}

CHALLENGES & STRENGTHS:
- Primary Challenges: ${context.progressData?.primaryChallenges?.join(', ') || 'None identified'}
- Identified Strengths: ${context.progressData?.identifiedStrengths?.join(', ') || 'None identified'}
`;
  }
  
  private addLearningRecommendationContext(context: MentoringPromptContext): string {
    return `
LEARNING PATH DATA:
- Current Path: ${context.learningPath?.pathName || 'No active path'}
- Completion: ${context.learningPath?.completionPercentage || 0}%
- Current Step: ${context.learningPath?.currentStepIndex || 0}/${context.learningPath?.totalSteps || 0}
- Target Skills: ${context.learningPath?.targetSkills?.join(', ') || 'Not specified'}

PERFORMANCE METRICS:
- Recent Session Completion Rate: ${(context.progressData as any)?.sessionCompletionRate || 'Unknown'}
- Average Study Time: ${(context.progressData as any)?.studyTimeMinutesDaily || 0} minutes/day
- Consecutive Active Days: ${(context.progressData as any)?.consecutiveDaysActive || 0}
`;
  }
  
  private addInterventionContext(context: MentoringPromptContext): string {
    const riskLevel = context.riskAssessment?.riskLevel || 'unknown';
    const riskFactors = context.riskAssessment?.riskFactors?.map(f => f.factor).join(', ') || 'None identified';
    
    return `
RISK ASSESSMENT:
- Risk Level: ${riskLevel}
- Risk Score: ${context.riskAssessment?.riskScore || 0}/100
- Risk Factors: ${riskFactors}

INTERVENTION HISTORY:
- Previous Interventions: ${context.interventionHistory?.length || 0}
- Recent Intervention Types: ${context.interventionHistory?.slice(-3).map(i => i.interventionType).join(', ') || 'None'}

This student requires immediate attention and personalized intervention strategies.
`;
  }
  
  private addStudyPlanContext(context: MentoringPromptContext): string {
    return `
STUDY PLANNING CONTEXT:
- Weekly Study Goal: ${(context.progressData as any)?.weeklyStudyHours || 5} hours
- Preferred Study Time: ${(context.studentProfile as any)?.preferredStudyTime || 'Not specified'}
- Learning Style: ${(context.studentProfile as any)?.learningStyle || 'Not specified'}
- Available Time: ${(context.progressData as any)?.studyTimeMinutesDaily || 30} minutes/day average

CURRENT CHALLENGES:
${context.progressData?.primaryChallenges?.map(c => `- ${c}`).join('\n') || '- No specific challenges identified'}
`;
  }
  
  private addMotivationContext(context: MentoringPromptContext): string {
    return `
MOTIVATION CONTEXT:
- Motivation Index: ${context.progressData?.motirfationIndex || 'Unknown'}/100
- Learning Goals: ${(context.studentProfile as any)?.learningGoals?.join(', ') || 'Not specified'}
- Motivation Factors: ${(context.studentProfile as any)?.motivationFactors?.join(', ') || 'Not specified'}
- Recent Engagement: ${context.progressData?.engagementLevel || 'Unknown'}/100

The student may be experiencing motivational challenges and needs encouragement.
Focus on positive reinforcement and achievable goals.
`;
  }
  
  private addSkillAnalysisContext(context: MentoringPromptContext): string {
    const skillScores = context.progressData?.skillProgressScores || {};
    
    return `
DETAILED SKILL ANALYSIS:
${Object.entries(skillScores).map(([skill, score]) => `- ${skill}: ${score}/100`).join('\n') || 'No skill data available'}

TEST PERFORMANCE:
- Recent Test Results: ${context.testResults?.length || 0} tests completed
- Average Performance: ${context.testResults?.reduce((sum, test) => sum + (test.finalScore || 0), 0) / (context.testResults?.length || 1) || 'N/A'}

Focus on identifying specific skill gaps and providing targeted recommendations.
`;
  }
  
  private getTaskInstructions(type: string, language: string): string {
    const instructions = {
      progress_report: `
TASK: Generate a comprehensive progress report.
REQUIRED OUTPUT FORMAT:
1. Overall Progress Summary (2-3 sentences)
2. Key Achievements (3-5 bullet points)
3. Areas for Improvement (3-5 bullet points)
4. Specific Recommendations (5-7 actionable items)
5. Motivational Message (encouraging, personal)

Ensure cultural sensitivity and use encouraging language appropriate for the student's background.`,

      learning_recommendation: `
TASK: Provide personalized learning recommendations.
REQUIRED OUTPUT FORMAT:
1. Learning Path Assessment
2. Specific Content Recommendations
3. Study Method Suggestions
4. Pace Adjustments
5. Resource Recommendations

Focus on actionable, specific guidance that considers the student's cultural background and learning style.`,

      intervention_suggestion: `
TASK: Suggest immediate intervention strategies.
REQUIRED OUTPUT FORMAT:
1. Urgency Assessment
2. Primary Intervention Strategy
3. Specific Action Steps
4. Timeline for Implementation
5. Success Metrics

Be direct but supportive. Prioritize student well-being and learning success.`,

      study_plan: `
TASK: Create a personalized study plan.
REQUIRED OUTPUT FORMAT:
1. Weekly Schedule Recommendation
2. Daily Study Routine
3. Priority Skills Focus
4. Break and Rest Periods
5. Progress Check Points

Consider the student's available time and energy levels.`,

      motivation_boost: `
TASK: Provide motivational guidance and encouragement.
REQUIRED OUTPUT FORMAT:
1. Acknowledgment of Current Efforts
2. Celebration of Progress Made
3. Reframing of Challenges
4. Specific Motivation Strategies
5. Inspirational Message

Use positive psychology principles and culturally appropriate motivation techniques.`,

      skill_analysis: `
TASK: Analyze specific skill strengths and weaknesses.
REQUIRED OUTPUT FORMAT:
1. Skill-by-Skill Assessment
2. Strength Areas to Leverage
3. Priority Improvement Areas
4. Skill Development Roadmap
5. Practice Recommendations

Provide specific, actionable feedback for each skill area.`
    };
    
    return instructions[type as keyof typeof instructions] || '';
  }
  
  private buildProgressReportPrompt(context: MentoringPromptContext, reportType: string): string {
    const language = context.targetLanguage || AI_MENTORING_CONFIG.DEFAULT_LANGUAGE;
    
    return `
${this.buildContextualPrompt({ 
  type: 'progress_report', 
  context, 
  priority: 'medium',
  language 
})}

REPORT TYPE: ${reportType.toUpperCase()}
REPORT DATE: ${new Date().toLocaleDateString()}

Generate a comprehensive ${reportType} progress report with detailed analysis and actionable recommendations.
Include skill-specific insights and learning path assessments.

REQUIRED SECTIONS:
1. Executive Summary
2. Skill-by-Skill Analysis
3. Learning Path Progress
4. Behavioral Insights
5. Recommendations & Next Steps
6. Motivational Message

Format the response as a structured report with clear sections and bullet points.
`;
  }
  
  private buildLearningPathPrompt(context: MentoringPromptContext, currentPath?: AdaptiveLearningPath): string {
    return `
${this.buildContextualPrompt({ 
  type: 'learning_recommendation', 
  context, 
  priority: 'medium' 
})}

CURRENT LEARNING PATH ANALYSIS:
${currentPath ? `
- Path Name: ${currentPath.pathName}
- Description: ${currentPath.pathDescription}
- Progress: ${currentPath.completionPercentage}%
- Target Skills: ${currentPath.targetSkills?.join(', ')}
- Current Step: ${currentPath.currentStepIndex}/${currentPath.totalSteps}
- Adaptations Applied: ${currentPath.adaptationsApplied}
- Steps Completed: ${currentPath.stepsCompleted}
` : 'No current learning path assigned'}

TASK: Analyze the current learning path and provide comprehensive recommendations for optimization.

REQUIRED OUTPUT:
1. Path Assessment (current path effectiveness)
2. Adaptation Recommendations (specific modifications needed)
3. Pace Adjustments (accelerate, maintain, or slow down)
4. Content Modifications (additions, replacements, supplements)
5. Alternative Path Suggestions (if current path isn't optimal)

Focus on data-driven recommendations based on the student's performance metrics and learning patterns.
`;
  }
  
  private buildTestAnalysisPrompt(testSession: UnifiedTestSession, responses: UnifiedResponse[], context: MentoringPromptContext): string {
    return `
${this.buildContextualPrompt({ 
  type: 'skill_analysis', 
  context, 
  priority: 'medium' 
})}

TEST SESSION ANALYSIS:
- Test Type: ${testSession.testType}
- Target Language: ${testSession.targetLanguage}
- Session Duration: ${testSession.actualDurationMinutes || 0} minutes
- Final Score: ${testSession.finalScore || 0}%
- Skills Tested: ${testSession.skillsAssessed?.join(', ') || 'Multiple skills'}
- Completion Status: ${testSession.status}

RESPONSE ANALYSIS:
- Total Responses: ${responses.length}
- Correct Responses: ${responses.filter(r => r.isCorrect).length}
- Accuracy Rate: ${((responses.filter(r => r.isCorrect).length / responses.length) * 100).toFixed(1)}%

DETAILED RESPONSE PATTERNS:
${responses.slice(0, 10).map((r, i) => `
Question ${i + 1}: ${r.isCorrect ? 'Correct' : 'Incorrect'}
Response Time: ${r.responseTimeMs || 0}ms
Question Type: ${(r as any).questionType || 'Unknown'}
`).join('')}

TASK: Provide comprehensive test result analysis with specific insights and recommendations.

REQUIRED OUTPUT:
1. Performance Summary
2. Strength Areas (specific skills demonstrated well)
3. Weakness Areas (skills needing improvement)  
4. Pattern Analysis (response time, question type performance)
5. Specific Recommendations (targeted practice areas)
6. Next Steps (immediate actions for improvement)

Be specific and actionable in your recommendations.
`;
  }
  
  // ========================================================================
  // PRIVATE METHODS - AI PROVIDERS
  // ========================================================================
  
  // ========================================================================
  // TIMEOUT-ENFORCED AI GENERATION METHODS
  // ========================================================================
  
  private async generateWithOllamaWithTimeout(prompt: string, type: string, language: string, model?: string): Promise<any> {
    const modelToUse = model || AI_MENTORING_CONFIG.OLLAMA_PRIMARY_MODEL;
    
    const generatePromise = this.ollamaService.generateResponse({
      model: modelToUse,
      prompt,
      temperature: 0.7,
      max_tokens: 2000,
      system: this.getSystemPrompt(type, language)
    });
    
    const response = await pTimeout(generatePromise, {
      milliseconds: AI_MENTORING_CONFIG.OLLAMA_TIMEOUT_MS,
      message: `Ollama request timed out after ${AI_MENTORING_CONFIG.OLLAMA_TIMEOUT_MS}ms`
    });
    
    if (!response.success) {
      throw new Error(`Ollama generation failed: ${response.error}`);
    }
    
    return this.parseAiResponse(response.response, type);
  }
  
  private async generateWithOpenaiWithTimeout(prompt: string, type: string, language: string, model?: string): Promise<any> {
    const modelToUse = model || AI_MENTORING_CONFIG.OPENAI_FALLBACK_MODEL;
    
    const generatePromise = openaiService.generateResponse({
      model: modelToUse,
      prompt,
      systemPrompt: this.getSystemPrompt(type, language),
      temperature: 0.7,
      maxTokens: 2000
    });
    
    const response = await pTimeout(generatePromise, {
      milliseconds: AI_MENTORING_CONFIG.OPENAI_TIMEOUT_MS,
      message: `OpenAI request timed out after ${AI_MENTORING_CONFIG.OPENAI_TIMEOUT_MS}ms`
    });
    
    if (!response.success) {
      throw new Error(`OpenAI generation failed: ${response.error}`);
    }
    
    return this.parseAiResponse(response.content, type);
  }
  
  // Legacy methods without timeout (kept for backward compatibility)
  private async generateWithOllama(prompt: string, type: string, language: string, model?: string): Promise<any> {
    return this.generateWithOllamaWithTimeout(prompt, type, language, model);
  }
  
  private async generateWithOpenAI(prompt: string, type: string, language: string, model?: string): Promise<any> {
    return this.generateWithOpenaiWithTimeout(prompt, type, language, model);
  }
  
  // ========================================================================
  // CIRCUIT BREAKER METHODS
  // ========================================================================
  
  private isOllamaCircuitBroken(): boolean {
    if (this.ollamaFailureCount < this.maxFailures) {
      return false;
    }
    
    // Check if enough time has passed to reset the circuit breaker
    const timeSinceLastFailure = Date.now() - this.lastOllamaFailure;
    if (timeSinceLastFailure > this.failureResetTime) {
      this.resetOllamaFailures();
      return false;
    }
    
    return true;
  }
  
  private isOpenaiCircuitBroken(): boolean {
    if (this.openaiFailureCount < this.maxFailures) {
      return false;
    }
    
    // Check if enough time has passed to reset the circuit breaker
    const timeSinceLastFailure = Date.now() - this.lastOpenaiFailure;
    if (timeSinceLastFailure > this.failureResetTime) {
      this.resetOpenaiFailures();
      return false;
    }
    
    return true;
  }
  
  private recordOllamaFailure(): void {
    this.ollamaFailureCount++;
    this.lastOllamaFailure = Date.now();
    console.warn(`Ollama failure recorded. Count: ${this.ollamaFailureCount}/${this.maxFailures}`);
    
    if (this.ollamaFailureCount >= this.maxFailures) {
      console.error('Ollama circuit breaker activated - too many failures');
      this.emit('circuit-breaker', { service: 'ollama', status: 'open' });
    }
  }
  
  private recordOpenaiFailure(): void {
    this.openaiFailureCount++;
    this.lastOpenaiFailure = Date.now();
    console.warn(`OpenAI failure recorded. Count: ${this.openaiFailureCount}/${this.maxFailures}`);
    
    if (this.openaiFailureCount >= this.maxFailures) {
      console.error('OpenAI circuit breaker activated - too many failures');
      this.emit('circuit-breaker', { service: 'openai', status: 'open' });
    }
  }
  
  private resetOllamaFailures(): void {
    if (this.ollamaFailureCount > 0) {
      console.log('Ollama circuit breaker reset - service recovered');
      this.emit('circuit-breaker', { service: 'ollama', status: 'closed' });
    }
    this.ollamaFailureCount = 0;
    this.lastOllamaFailure = 0;
  }
  
  private resetOpenaiFailures(): void {
    if (this.openaiFailureCount > 0) {
      console.log('OpenAI circuit breaker reset - service recovered');
      this.emit('circuit-breaker', { service: 'openai', status: 'closed' });
    }
    this.openaiFailureCount = 0;
    this.lastOpenaiFailure = 0;
  }
  
  // ========================================================================
  // CACHE KEY GENERATION
  // ========================================================================
  
  private generateCacheKey(type: string, data: any): string {
    // Create a deterministic cache key based on request type and data
    const keyData = {
      type,
      studentId: data.context?.studentId || data.studentId,
      requestType: data.type,
      priority: data.priority,
      language: data.language || AI_MENTORING_CONFIG.DEFAULT_LANGUAGE,
      // Include only stable context data for caching
      targetLanguage: data.context?.targetLanguage,
      nativeLanguage: data.context?.nativeLanguage,
      culturalBackground: data.context?.culturalBackground
    };
    
    // Convert to string and create hash-like key
    const keyString = JSON.stringify(keyData);
    const keyHash = keyString.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return `${type}_${Math.abs(keyHash)}`;
  }
  
  // ========================================================================
  // HEALTH CHECK METHODS
  // ========================================================================
  
  /**
   * Get comprehensive health status of the AI mentoring service
   */
  async getHealthStatus(): Promise<any> {
    const startTime = Date.now();
    
    const health = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        ollama: await this.checkOllamaHealth(),
        openai: await this.checkOpenaiHealth()
      },
      circuitBreaker: {
        ollama: {
          failures: this.ollamaFailureCount,
          isOpen: this.isOllamaCircuitBroken(),
          lastFailure: this.lastOllamaFailure || null
        },
        openai: {
          failures: this.openaiFailureCount,
          isOpen: this.isOpenaiCircuitBroken(), 
          lastFailure: this.lastOpenaiFailure || null
        }
      },
      caching: {
        guidance: {
          size: this.guidanceCache.size,
          max: this.guidanceCache.max,
          ttl: 1800000
        },
        progressReports: {
          size: this.progressReportCache.size,
          max: this.progressReportCache.max,
          ttl: 3600000
        },
        analytics: {
          size: this.analyticsCache.size,
          max: this.analyticsCache.max,
          ttl: 900000
        }
      },
      metrics: {
        requestCount: this.requestCount,
        averageResponseTime: this.averageResponseTime,
        uptime: Date.now() - startTime
      },
      config: {
        ollamaTimeout: AI_MENTORING_CONFIG.OLLAMA_TIMEOUT_MS,
        openaiTimeout: AI_MENTORING_CONFIG.OPENAI_TIMEOUT_MS,
        defaultLanguage: AI_MENTORING_CONFIG.DEFAULT_LANGUAGE,
        maxFailures: this.maxFailures,
        failureResetTime: this.failureResetTime
      }
    };
    
    // Determine overall health
    const ollamaAvailable = health.services.ollama.available;
    const openaiAvailable = health.services.openai.available;
    
    if (!ollamaAvailable && !openaiAvailable) {
      health.overall = 'critical';
    } else if (!ollamaAvailable || !openaiAvailable) {
      health.overall = 'degraded';
    } else if (health.circuitBreaker.ollama.isOpen || health.circuitBreaker.openai.isOpen) {
      health.overall = 'warning';
    }
    
    return health;
  }
  
  /**
   * Check Ollama service health
   */
  async checkOllamaHealth(): Promise<{ available: boolean; responseTime?: number; error?: string; model?: string }> {
    const startTime = Date.now();
    
    try {
      if (!this.isOllamaAvailable) {
        return {
          available: false,
          error: 'Service marked as unavailable during initialization'
        };
      }
      
      if (this.isOllamaCircuitBroken()) {
        return {
          available: false,
          error: 'Circuit breaker is open due to repeated failures'
        };
      }
      
      const response = await pTimeout(
        this.ollamaService.generateResponse({
          model: AI_MENTORING_CONFIG.OLLAMA_PRIMARY_MODEL,
          prompt: 'health check',
          temperature: 0.1,
          max_tokens: 5
        }),
        {
          milliseconds: 5000,
          message: 'Health check timeout'
        }
      );
      
      const responseTime = Date.now() - startTime;
      
      return {
        available: response.success,
        responseTime,
        model: AI_MENTORING_CONFIG.OLLAMA_PRIMARY_MODEL,
        error: response.success ? undefined : response.error
      };
      
    } catch (error: any) {
      return {
        available: false,
        responseTime: Date.now() - startTime,
        error: error.message || 'Unknown error'
      };
    }
  }
  
  /**
   * Check OpenAI service health
   */
  async checkOpenaiHealth(): Promise<{ available: boolean; responseTime?: number; error?: string; model?: string }> {
    const startTime = Date.now();
    
    try {
      if (this.isOpenaiCircuitBroken()) {
        return {
          available: false,
          error: 'Circuit breaker is open due to repeated failures'
        };
      }
      
      const response = await pTimeout(
        openaiService.generateResponse({
          model: AI_MENTORING_CONFIG.OPENAI_FALLBACK_MODEL,
          prompt: 'health check',
          temperature: 0.1,
          maxTokens: 5
        }),
        {
          milliseconds: 5000,
          message: 'Health check timeout'
        }
      );
      
      const responseTime = Date.now() - startTime;
      
      return {
        available: response.success,
        responseTime,
        model: AI_MENTORING_CONFIG.OPENAI_FALLBACK_MODEL,
        error: response.success ? undefined : response.error
      };
      
    } catch (error: any) {
      return {
        available: false,
        responseTime: Date.now() - startTime,
        error: error.message || 'Unknown error'
      };
    }
  }
  
  /**
   * Get basic service status (for backward compatibility)
   */
  getServiceStatus(): any {
    return {
      isOllamaAvailable: this.isOllamaAvailable && !this.isOllamaCircuitBroken(),
      isOpenaiAvailable: !this.isOpenaiCircuitBroken(),
      requestCount: this.requestCount,
      averageResponseTime: this.averageResponseTime,
      cacheStats: {
        guidance: this.guidanceCache.size,
        progressReports: this.progressReportCache.size,
        analytics: this.analyticsCache.size
      }
    };
  }
  
  private getSystemPrompt(type: string, language: string): string {
    const languageInstruction = language === 'persian' 
      ? 'پاسخ کامل را به زبان فارسی ارائه دهید.'
      : language === 'arabic'
      ? 'قدم الإجابة الكاملة باللغة العربية.'
      : 'Provide the complete response in English.';
    
    return `You are an expert AI mentor specializing in personalized language learning guidance.
You provide culturally-sensitive, actionable advice based on comprehensive student data.
You excel at identifying learning patterns, predicting outcomes, and suggesting effective interventions.

${languageInstruction}

Always provide:
- Specific, actionable recommendations
- Cultural sensitivity appropriate to the student's background
- Evidence-based suggestions from learning analytics
- Encouraging and supportive tone
- Structured, clear responses

Focus on: ${type.replace('_', ' ')} guidance with practical, implementable advice.`;
  }
  
  private parseAiResponse(response: string, type: string): any {
    // Parse and structure the AI response based on type
    // This is a simplified version - in production, you'd want more sophisticated parsing
    
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      content: response,
      confidence: 0.85, // Default confidence
      recommendations: this.extractRecommendations(lines),
      insights: this.extractInsights(lines)
    };
  }
  
  private extractRecommendations(lines: string[]): Array<any> {
    const recommendations: Array<any> = [];
    
    // Look for numbered recommendations or bullet points
    for (const line of lines) {
      if (line.match(/^\d+\.|^-|^•/) && line.length > 20) {
        recommendations.push({
          type: 'general',
          priority: 'medium' as InterventionPriority,
          description: line.replace(/^\d+\.|^-|^•/, '').trim(),
          actionSteps: [line.replace(/^\d+\.|^-|^•/, '').trim()],
          expectedImpact: 70
        });
      }
    }
    
    return recommendations.slice(0, 7); // Limit to top 7 recommendations
  }
  
  private extractInsights(lines: string[]): any {
    return {
      strengthsIdentified: lines.filter(l => l.toLowerCase().includes('strength')).slice(0, 3),
      challengesIdentified: lines.filter(l => l.toLowerCase().includes('challenge') || l.toLowerCase().includes('weakness')).slice(0, 3),
      improvementAreas: lines.filter(l => l.toLowerCase().includes('improve') || l.toLowerCase().includes('focus')).slice(0, 3),
      personalizedTips: lines.filter(l => l.toLowerCase().includes('tip') || l.toLowerCase().includes('suggest')).slice(0, 3)
    };
  }
  
  // ========================================================================
  // RESPONSE PARSING METHODS
  // ========================================================================
  
  private parseProgressReportResponse(response: any, studentId: number, reportType: string, generatedBy: string): AiProgressReport {
    const content = response.content || '';
    const lines = content.split('\n').filter(line => line.trim());
    
    return {
      studentId,
      reportType: reportType as any,
      generatedAt: new Date(),
      summary: {
        overallProgress: this.extractSection(lines, 'summary') || 'Progress continues with mixed results',
        keyAchievements: this.extractBulletPoints(lines, 'achievement') || ['Consistent participation'],
        challengesEncountered: this.extractBulletPoints(lines, 'challenge') || ['Some areas need focus'],
        recommendedActions: this.extractBulletPoints(lines, 'recommendation') || ['Continue current path']
      },
      skillAnalysis: this.extractSkillAnalysis(lines),
      learningPathAnalysis: {
        currentPathAssessment: this.extractSection(lines, 'path') || 'Current path is appropriate',
        adaptationRecommendations: this.extractBulletPoints(lines, 'adaptation') || [],
        paceAdjustmentSuggestions: this.extractBulletPoints(lines, 'pace') || [],
        alternativePathSuggestions: this.extractBulletPoints(lines, 'alternative') || []
      },
      motivationalMessage: this.extractSection(lines, 'motivation') || 'Keep up the great work!',
      nextStepGuidance: this.extractBulletPoints(lines, 'next') || ['Continue with current study plan'],
      confidence: response.confidence || 0.8,
      generatedBy
    };
  }
  
  private parseLearningPathResponse(response: any): any {
    const lines = response.content?.split('\n').filter((line: string) => line.trim()) || [];
    
    return {
      pathRecommendations: this.extractBulletPoints(lines, 'recommendation') || ['Continue current approach'],
      adaptationSuggestions: this.extractBulletPoints(lines, 'adaptation') || ['Monitor progress closely'],
      paceAdjustments: this.extractBulletPoints(lines, 'pace') || ['Maintain current pace'],
      contentModifications: this.extractBulletPoints(lines, 'content') || ['Review challenging topics'],
      confidence: response.confidence || 0.75
    };
  }
  
  private parseTestAnalysisResponse(response: any): any {
    const lines = response.content?.split('\n').filter((line: string) => line.trim()) || [];
    
    return {
      performance: this.extractSection(lines, 'performance') || 'Test completed with mixed results',
      strengths: this.extractBulletPoints(lines, 'strength') || ['Demonstrated effort'],
      weaknesses: this.extractBulletPoints(lines, 'weakness') || ['Some areas need attention'],
      recommendations: this.extractBulletPoints(lines, 'recommendation') || ['Continue practicing'],
      nextSteps: this.extractBulletPoints(lines, 'next') || ['Follow up with mentor'],
      confidence: response.confidence || 0.7
    };
  }
  
  // ========================================================================
  // UTILITY METHODS
  // ========================================================================
  
  private extractSection(lines: string[], keyword: string): string | null {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(keyword)) {
        // Return the next few lines as a section
        return lines.slice(i, i + 3).join(' ').replace(/^\d+\.|^-|^•/, '').trim();
      }
    }
    return null;
  }
  
  private extractBulletPoints(lines: string[], keyword: string): string[] {
    const points: string[] = [];
    let inSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes(keyword)) {
        inSection = true;
      }
      
      if (inSection && (line.match(/^\d+\.|^-|^•/) || line.includes(':'))) {
        const point = line.replace(/^\d+\.|^-|^•/, '').trim();
        if (point.length > 10) { // Filter out very short items
          points.push(point);
        }
        
        if (points.length >= 5) break; // Limit number of points
      }
    }
    
    return points;
  }
  
  private extractSkillAnalysis(lines: string[]): any {
    const skills = ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary'];
    const analysis: any = {};
    
    for (const skill of skills) {
      const skillLines = lines.filter(line => 
        line.toLowerCase().includes(skill) || 
        line.toLowerCase().includes(skill.substring(0, 4))
      );
      
      if (skillLines.length > 0) {
        analysis[skill] = {
          currentLevel: 'intermediate', // Default
          progressDirection: 'stable',
          specificInsights: skillLines.slice(0, 2),
          recommendedFocus: [skillines[0]?.replace(/^\d+\.|^-|^•/, '').trim() || 'Continue practicing']
        };
      }
    }
    
    return analysis;
  }
  
  private getFallbackGuidance(type: string, context: MentoringPromptContext): string {
    const fallbackMessages = {
      progress_report: `Based on your recent activity, you're making steady progress. Continue with your current study routine and focus on consistency.`,
      learning_recommendation: `I recommend continuing with your current learning path while focusing on areas that challenge you most. Regular practice is key.`,
      intervention_suggestion: `Consider reaching out to your mentor for additional support. Consistent practice and staying engaged with your studies will help.`,
      study_plan: `Create a regular study schedule with 30-45 minutes daily. Focus on your weaker skills while maintaining strengths.`,
      motivation_boost: `Remember that language learning is a journey. Every small step forward is progress worth celebrating. You've got this!`,
      skill_analysis: `Your skills are developing well. Focus on consistent practice across all areas, giving extra attention to challenging topics.`
    };
    
    return fallbackMessages[type as keyof typeof fallbackMessages] || 'Continue with your current learning approach and stay consistent.';
  }
  
  private generateFallbackProgressReport(studentId: number, reportType: string): AiProgressReport {
    return {
      studentId,
      reportType: reportType as any,
      generatedAt: new Date(),
      summary: {
        overallProgress: 'You are making steady progress in your language learning journey.',
        keyAchievements: ['Consistent participation', 'Regular study habits', 'Engagement with learning materials'],
        challengesEncountered: ['Some topics require additional focus', 'Consistency can be improved'],
        recommendedActions: ['Continue current study plan', 'Focus on challenging areas', 'Maintain regular practice']
      },
      skillAnalysis: {
        speaking: {
          currentLevel: 'intermediate',
          progressDirection: 'stable',
          specificInsights: ['Regular practice recommended'],
          recommendedFocus: ['Pronunciation practice']
        },
        listening: {
          currentLevel: 'intermediate', 
          progressDirection: 'stable',
          specificInsights: ['Continue with audio materials'],
          recommendedFocus: ['Varied listening content']
        }
      },
      learningPathAnalysis: {
        currentPathAssessment: 'Current learning path is appropriate for your level',
        adaptationRecommendations: ['Monitor progress regularly'],
        paceAdjustmentSuggestions: ['Maintain current pace'],
        alternativePathSuggestions: []
      },
      motivationalMessage: 'Keep up the excellent work! Consistency is key to language learning success.',
      nextStepGuidance: ['Continue with current study plan', 'Focus on identified weak areas', 'Regular mentor check-ins'],
      confidence: 0.6,
      generatedBy: 'fallback_system'
    };
  }
  
  private updateMetrics(responseTime: number): void {
    this.requestCount++;
    this.averageResponseTime = ((this.averageResponseTime * (this.requestCount - 1)) + responseTime) / this.requestCount;
  }
  
  // ========================================================================
  // PUBLIC STATUS AND UTILITY METHODS
  // ========================================================================
  
  public getServiceStatus(): {
    isOllamaAvailable: boolean;
    requestCount: number;
    averageResponseTime: number;
    uptime: number;
  } {
    return {
      isOllamaAvailable: this.isOllamaAvailable,
      requestCount: this.requestCount,
      averageResponseTime: this.averageResponseTime,
      uptime: process.uptime()
    };
  }
  
  public async refreshOllamaConnection(): Promise<boolean> {
    this.isOllamaAvailable = await this.testOllamaConnection();
    this.emit('connection_updated', { ollamaAvailable: this.isOllamaAvailable });
    return this.isOllamaAvailable;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const aiMentoringService = new AiMentoringService();