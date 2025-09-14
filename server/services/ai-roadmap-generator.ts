/**
 * AI Roadmap Generator Service
 * Creates instant personalized learning roadmaps based on placement test results
 */

import { OllamaService } from '../ollama-service';
import { DatabaseStorage } from '../database-storage';
import { 
  CEFRLevel, 
  PlacementTestSession,
  AIRoadmapTemplate 
} from '../../shared/placement-test-schema';
import { 
  LearningRoadmap, 
  RoadmapMilestone, 
  RoadmapStep,
  InsertLearningRoadmap,
  InsertRoadmapMilestone,
  InsertRoadmapStep
} from '../../shared/roadmap-schema';

export interface PersonalizedRoadmapRequest {
  placementTestSession: PlacementTestSession;
  learningGoals: string[];
  timeAvailability: number; // hours per week
  preferredPace: 'slow' | 'normal' | 'fast';
  focusAreas?: string[]; // specific skills to emphasize
}

export interface GeneratedRoadmap {
  roadmap: LearningRoadmap;
  milestones: RoadmapMilestone[];
  steps: RoadmapStep[];
  estimatedCompletion: Date;
  personalizedRecommendations: string[];
}

export interface SkillGapAnalysis {
  strengths: Array<{
    skill: string;
    level: CEFRLevel;
    confidence: number;
  }>;
  weaknesses: Array<{
    skill: string;
    currentLevel: CEFRLevel;
    targetLevel: CEFRLevel;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}

export class AIRoadmapGenerator {
  private ollamaService: OllamaService;
  private storage: DatabaseStorage;

  constructor(ollamaService: OllamaService, storage: DatabaseStorage) {
    this.ollamaService = ollamaService;
    this.storage = storage;
  }

  /**
   * Generate personalized roadmap instantly from placement test results
   */
  async generatePersonalizedRoadmap(request: PersonalizedRoadmapRequest): Promise<GeneratedRoadmap> {
    const session = request.placementTestSession;
    
    // 1. Analyze skill gaps and learning needs
    const skillGapAnalysis = this.analyzeSkillGaps(session);
    
    // 2. Select appropriate roadmap template
    const template = await this.selectRoadmapTemplate(session);
    
    // 3. Generate roadmap structure using AI
    const roadmapStructure = await this.generateRoadmapStructure(
      session, 
      skillGapAnalysis, 
      request, 
      template
    );
    
    // 4. Create roadmap in database
    const roadmap = await this.createRoadmapInDatabase(roadmapStructure, session.userId);
    
    // 5. Generate milestones and steps
    const milestonesAndSteps = await this.generateMilestonesAndSteps(
      roadmap, 
      roadmapStructure, 
      skillGapAnalysis
    );

    // 6. Calculate estimated completion date
    const estimatedCompletion = this.calculateEstimatedCompletion(
      request.timeAvailability,
      roadmapStructure.totalWeeks
    );

    return {
      roadmap,
      milestones: milestonesAndSteps.milestones,
      steps: milestonesAndSteps.steps,
      estimatedCompletion,
      personalizedRecommendations: skillGapAnalysis.recommendations
    };
  }

  /**
   * Analyze skill gaps from placement test results
   */
  private analyzeSkillGaps(session: PlacementTestSession): SkillGapAnalysis {
    const skills = ['speaking', 'listening', 'reading', 'writing'];
    const strengths: SkillGapAnalysis['strengths'] = [];
    const weaknesses: SkillGapAnalysis['weaknesses'] = [];
    
    // Analyze each skill
    for (const skill of skills) {
      const currentLevel = this.getSkillLevel(session, skill);
      const score = this.getSkillScore(session, skill);
      const confidence = score >= 70 ? 0.8 : score >= 60 ? 0.6 : 0.4;
      
      if (score >= 70) {
        strengths.push({
          skill,
          level: currentLevel,
          confidence
        });
      } else {
        // Determine target level (usually one level up from current)
        const currentIndex = this.getCEFRIndex(currentLevel);
        const targetLevel = this.getCEFRLevel(Math.min(currentIndex + 1, 5)); // Max C2
        
        weaknesses.push({
          skill,
          currentLevel,
          targetLevel,
          priority: score < 50 ? 'high' : score < 60 ? 'medium' : 'low'
        });
      }
    }

    // Generate recommendations based on analysis
    const recommendations = this.generateLearningRecommendations(strengths, weaknesses, session);

    return {
      strengths,
      weaknesses,
      recommendations
    };
  }

  /**
   * Select appropriate roadmap template based on goals and level
   */
  private async selectRoadmapTemplate(session: PlacementTestSession): Promise<AIRoadmapTemplate | null> {
    const learningGoal = session.learningGoal || 'general';
    const overallLevel = session.overallCEFRLevel || 'B1';
    
    // In production, this would query the database for matching templates
    // For now, return a default template structure
    return {
      id: 1,
      name: `${learningGoal.toUpperCase()} - ${overallLevel} to Advanced`,
      targetLanguage: session.targetLanguage,
      learningGoal: session.learningGoal || 'general',
      minCEFRLevel: overallLevel,
      maxCEFRLevel: 'C2',
      milestoneTemplate: {
        count: 6,
        structure: 'skill-based',
        progressionType: 'adaptive'
      },
      stepTemplate: {
        stepsPerMilestone: 4,
        averageDurationMinutes: 45,
        practiceRatio: 0.4
      },
      adaptationRules: {
        weaknessMultiplier: 1.5,
        strengthMaintenance: 0.3
      },
      aiGenerationPrompt: this.getGenerationPrompt(learningGoal, overallLevel),
      customizationPrompt: 'Customize based on placement test results and individual learning preferences',
      estimatedWeeks: 24,
      weeklyHours: 6,
      tags: [learningGoal, overallLevel],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as AIRoadmapTemplate;
  }

  /**
   * Generate roadmap structure using AI
   */
  private async generateRoadmapStructure(
    session: PlacementTestSession,
    skillGaps: SkillGapAnalysis,
    request: PersonalizedRoadmapRequest,
    template: AIRoadmapTemplate | null
  ) {
    const prompt = `
Create a personalized language learning roadmap based on the following placement test results:

PLACEMENT TEST RESULTS:
- Overall Level: ${session.overallCEFRLevel}
- Speaking: ${session.speakingLevel} (Score: ${session.speakingScore})
- Listening: ${session.listeningLevel} (Score: ${session.listeningScore})
- Reading: ${session.readingLevel} (Score: ${session.readingScore})
- Writing: ${session.writingLevel} (Score: ${session.writingScore})

SKILL GAPS ANALYSIS:
Strengths: ${skillGaps.strengths.map(s => `${s.skill} (${s.level})`).join(', ')}
Weaknesses: ${skillGaps.weaknesses.map(w => `${w.skill}: ${w.currentLevel} → ${w.targetLevel} (${w.priority} priority)`).join(', ')}

LEARNER PREFERENCES:
- Learning Goals: ${request.learningGoals.join(', ')}
- Time Availability: ${request.timeAvailability} hours/week
- Preferred Pace: ${request.preferredPace}
- Focus Areas: ${request.focusAreas?.join(', ') || 'balanced'}

REQUIREMENTS:
1. Create 6 progressive milestones over 6 months
2. Each milestone should have 4-5 learning steps
3. Prioritize weak skills while maintaining strong ones
4. Include practical activities and real-world applications
5. Adapt content based on ${session.learningGoal} goals

Generate a structured learning roadmap in JSON format:
{
  "title": "Personalized roadmap title",
  "description": "Brief description",
  "totalWeeks": 24,
  "weeklyHours": ${request.timeAvailability},
  "milestones": [
    {
      "title": "Milestone title",
      "description": "What learner will achieve",
      "weekNumber": 4,
      "primarySkill": "main skill focus",
      "secondarySkills": ["supporting skills"],
      "assessmentType": "how progress is measured"
    }
  ],
  "adaptationStrategy": "How to adjust based on progress"
}
`;

    try {
      const response = await this.ollamaService.generateCompletion(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 2000
      });
      
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating roadmap structure:', error);
      return this.getFallbackRoadmapStructure(session, request);
    }
  }

  /**
   * Create roadmap in database
   */
  private async createRoadmapInDatabase(
    structure: any, 
    userId: number
  ): Promise<LearningRoadmap> {
    const roadmapData: InsertLearningRoadmap = {
      title: structure.title || 'Personalized Learning Roadmap',
      description: structure.description || 'AI-generated roadmap based on placement test results',
      targetLanguage: 'english', // Would be dynamic based on session
      targetLevel: 'C2', // Ultimate target
      estimatedWeeks: structure.totalWeeks || 24,
      weeklyHours: structure.weeklyHours || 6,
      difficulty: 'adaptive',
      prerequisites: [],
      thumbnailUrl: null,
      iconName: 'brain',
      accentColor: '#4F46E5',
      createdBy: userId,
      isPublic: false,
      isActive: true,
      tags: ['ai-generated', 'personalized', 'placement-based']
    };

    return await this.storage.createLearningRoadmap(roadmapData);
  }

  /**
   * Generate detailed milestones and steps
   */
  private async generateMilestonesAndSteps(
    roadmap: LearningRoadmap,
    structure: any,
    skillGaps: SkillGapAnalysis
  ) {
    const milestones: RoadmapMilestone[] = [];
    const steps: RoadmapStep[] = [];

    // Generate milestones from structure
    for (let i = 0; i < (structure.milestones?.length || 6); i++) {
      const milestoneData = structure.milestones?.[i] || this.getDefaultMilestone(i);
      
      const milestone = await this.storage.createRoadmapMilestone({
        roadmapId: roadmap.id,
        title: milestoneData.title || `Milestone ${i + 1}`,
        description: milestoneData.description || 'Learning milestone',
        orderIndex: i,
        weekNumber: milestoneData.weekNumber || (i + 1) * 4,
        primarySkill: milestoneData.primarySkill || this.getPrimarySkillForMilestone(i, skillGaps),
        secondarySkills: milestoneData.secondarySkills || [],
        assessmentType: milestoneData.assessmentType || 'progress_check',
        passingScore: 70,
        iconName: 'target',
        badgeImageUrl: null
      });

      milestones.push(milestone);

      // Generate steps for this milestone
      const milestoneSteps = await this.generateStepsForMilestone(milestone, skillGaps);
      steps.push(...milestoneSteps);
    }

    return { milestones, steps };
  }

  /**
   * Generate steps for a specific milestone
   */
  private async generateStepsForMilestone(
    milestone: RoadmapMilestone,
    skillGaps: SkillGapAnalysis
  ): Promise<RoadmapStep[]> {
    const steps: RoadmapStep[] = [];
    const stepCount = 4; // 4 steps per milestone

    for (let i = 0; i < stepCount; i++) {
      const step = await this.storage.createRoadmapStep({
        milestoneId: milestone.id,
        title: this.generateStepTitle(milestone.primarySkill, i),
        description: this.generateStepDescription(milestone.primarySkill, i),
        orderIndex: i,
        estimatedMinutes: 45,
        contentType: this.getContentTypeForStep(i),
        courseId: null, // Would link to actual courses
        contentUrl: null,
        isRequired: i < 3, // First 3 steps required, last is optional
        objectives: this.generateStepObjectives(milestone.primarySkill)
      });

      steps.push(step);
    }

    return steps;
  }

  /**
   * Helper methods for content generation
   */
  private getSkillLevel(session: PlacementTestSession, skill: string): CEFRLevel {
    switch (skill) {
      case 'speaking': return session.speakingLevel as CEFRLevel || 'B1';
      case 'listening': return session.listeningLevel as CEFRLevel || 'B1';
      case 'reading': return session.readingLevel as CEFRLevel || 'B1';
      case 'writing': return session.writingLevel as CEFRLevel || 'B1';
      default: return 'B1';
    }
  }

  private getSkillScore(session: PlacementTestSession, skill: string): number {
    switch (skill) {
      case 'speaking': return Number(session.speakingScore) || 60;
      case 'listening': return Number(session.listeningScore) || 60;
      case 'reading': return Number(session.readingScore) || 60;
      case 'writing': return Number(session.writingScore) || 60;
      default: return 60;
    }
  }

  private getCEFRIndex(level: CEFRLevel): number {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return levels.indexOf(level);
  }

  private getCEFRLevel(index: number): CEFRLevel {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return levels[Math.max(0, Math.min(index, levels.length - 1))];
  }

  private generateLearningRecommendations(
    strengths: SkillGapAnalysis['strengths'],
    weaknesses: SkillGapAnalysis['weaknesses'],
    session: PlacementTestSession
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations for weaknesses
    const highPriorityWeaknesses = weaknesses.filter(w => w.priority === 'high');
    if (highPriorityWeaknesses.length > 0) {
      recommendations.push(`Focus intensively on ${highPriorityWeaknesses.map(w => w.skill).join(' and ')} skills`);
    }

    // Recommendations for maintaining strengths
    if (strengths.length > 0) {
      recommendations.push(`Continue practicing ${strengths.map(s => s.skill).join(' and ')} to maintain proficiency`);
    }

    // Goal-specific recommendations
    if (session.learningGoal === 'ielts') {
      recommendations.push('Include IELTS-specific practice materials and test strategies');
    } else if (session.learningGoal === 'business') {
      recommendations.push('Focus on business vocabulary and professional communication scenarios');
    }

    return recommendations;
  }

  private getGenerationPrompt(learningGoal: string, level: string): string {
    return `Generate a comprehensive ${learningGoal} language learning roadmap for ${level} level students focusing on practical skill development and real-world application.`;
  }

  private getPrimarySkillForMilestone(milestoneIndex: number, skillGaps: SkillGapAnalysis): string {
    // Rotate through skills, prioritizing weaknesses
    const weakSkills = skillGaps.weaknesses.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    if (weakSkills.length > 0) {
      return weakSkills[milestoneIndex % weakSkills.length].skill;
    }

    const allSkills = ['speaking', 'listening', 'reading', 'writing'];
    return allSkills[milestoneIndex % allSkills.length];
  }

  private generateStepTitle(primarySkill: string, stepIndex: number): string {
    const stepTypes = ['Introduction', 'Practice', 'Application', 'Assessment'];
    return `${primarySkill.charAt(0).toUpperCase() + primarySkill.slice(1)} ${stepTypes[stepIndex]}`;
  }

  private generateStepDescription(primarySkill: string, stepIndex: number): string {
    const descriptions = [
      `Learn fundamental ${primarySkill} concepts and techniques`,
      `Practice ${primarySkill} skills through guided exercises`,
      `Apply ${primarySkill} skills in real-world scenarios`,
      `Assess your ${primarySkill} progress and identify areas for improvement`
    ];
    return descriptions[stepIndex] || `Develop ${primarySkill} skills`;
  }

  private getContentTypeForStep(stepIndex: number): string {
    const types = ['lesson', 'exercise', 'project', 'reading'];
    return types[stepIndex] || 'lesson';
  }

  private generateStepObjectives(primarySkill: string): string[] {
    return [
      `Improve ${primarySkill} accuracy by 10%`,
      `Master key ${primarySkill} techniques`,
      `Apply skills in practical contexts`
    ];
  }

  private calculateEstimatedCompletion(weeklyHours: number, totalWeeks: number): Date {
    const now = new Date();
    const weeksToComplete = Math.ceil(totalWeeks * (6 / weeklyHours)); // Adjust based on time availability
    const completionDate = new Date(now);
    completionDate.setDate(completionDate.getDate() + (weeksToComplete * 7));
    return completionDate;
  }

  private getDefaultMilestone(index: number) {
    const defaultMilestones = [
      { title: 'Foundation Building', primarySkill: 'speaking', weekNumber: 4 },
      { title: 'Communication Skills', primarySkill: 'listening', weekNumber: 8 },
      { title: 'Reading Comprehension', primarySkill: 'reading', weekNumber: 12 },
      { title: 'Written Expression', primarySkill: 'writing', weekNumber: 16 },
      { title: 'Advanced Integration', primarySkill: 'speaking', weekNumber: 20 },
      { title: 'Mastery Assessment', primarySkill: 'reading', weekNumber: 24 }
    ];
    return defaultMilestones[index] || defaultMilestones[0];
  }

  private getFallbackRoadmapStructure(session: PlacementTestSession, request: PersonalizedRoadmapRequest) {
    return {
      title: 'Personalized Learning Journey',
      description: 'AI-generated roadmap tailored to your placement test results',
      totalWeeks: 24,
      weeklyHours: request.timeAvailability,
      milestones: [
        {
          title: 'Foundation Strengthening',
          description: 'Build strong fundamentals in weak areas',
          weekNumber: 4,
          primarySkill: 'speaking',
          secondarySkills: ['listening'],
          assessmentType: 'speaking_assessment'
        },
        {
          title: 'Communication Development',
          description: 'Develop practical communication skills',
          weekNumber: 8,
          primarySkill: 'listening',
          secondarySkills: ['speaking'],
          assessmentType: 'conversation_test'
        },
        {
          title: 'Comprehension Enhancement',
          description: 'Improve reading and listening comprehension',
          weekNumber: 12,
          primarySkill: 'reading',
          secondarySkills: ['listening'],
          assessmentType: 'comprehension_test'
        },
        {
          title: 'Expression Mastery',
          description: 'Master written and spoken expression',
          weekNumber: 16,
          primarySkill: 'writing',
          secondarySkills: ['speaking'],
          assessmentType: 'essay_and_presentation'
        },
        {
          title: 'Integration Practice',
          description: 'Integrate all skills in real scenarios',
          weekNumber: 20,
          primarySkill: 'speaking',
          secondarySkills: ['writing', 'reading', 'listening'],
          assessmentType: 'integrated_assessment'
        },
        {
          title: 'Advanced Proficiency',
          description: 'Achieve advanced level proficiency',
          weekNumber: 24,
          primarySkill: 'reading',
          secondarySkills: ['speaking', 'writing', 'listening'],
          assessmentType: 'comprehensive_evaluation'
        }
      ],
      adaptationStrategy: 'Continuous adjustment based on weekly progress assessments'
    };
  }
}