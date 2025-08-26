/**
 * CEFR Tagging Service
 * Provides comprehensive Common European Framework tagging and level assessment
 */

import { DatabaseStorage } from '../database-storage';

export interface CEFRTag {
  level: CEFRLevel;
  skill: LanguageSkill;
  descriptor: string;
  canDoStatements: string[];
  grammarPoints: string[];
  vocabularyThemes: string[];
  functionalLanguage: string[];
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type LanguageSkill = 'speaking' | 'listening' | 'reading' | 'writing' | 'grammar' | 'vocabulary';

export interface CEFRAssessment {
  overallLevel: CEFRLevel;
  skillLevels: Record<LanguageSkill, CEFRLevel>;
  strengths: string[];
  areasForImprovement: string[];
  recommendedContent: CEFRContent[];
}

export interface CEFRContent {
  id: string;
  level: CEFRLevel;
  skills: LanguageSkill[];
  title: string;
  description: string;
  estimatedMinutes: number;
  prerequisites: string[];
}

export class CEFRTaggingService {
  private storage: DatabaseStorage;
  
  // CEFR descriptors based on official framework
  private readonly descriptors: Record<CEFRLevel, Record<LanguageSkill, string[]>> = {
    'A1': {
      'speaking': [
        'Can interact in a simple way',
        'Can ask and answer simple questions',
        'Can use simple phrases and sentences'
      ],
      'listening': [
        'Can understand familiar words and basic phrases',
        'Can understand slow and carefully articulated speech'
      ],
      'reading': [
        'Can understand familiar names, words and simple sentences',
        'Can understand short, simple texts'
      ],
      'writing': [
        'Can write simple isolated phrases and sentences',
        'Can write a short, simple postcard'
      ],
      'grammar': [
        'Present simple tense',
        'Basic question formation',
        'Singular/plural nouns'
      ],
      'vocabulary': [
        'Numbers, colors, family',
        'Basic everyday objects',
        'Simple adjectives'
      ]
    },
    'A2': {
      'speaking': [
        'Can communicate in simple routine tasks',
        'Can describe in simple terms aspects of background',
        'Can handle short social exchanges'
      ],
      'listening': [
        'Can understand phrases and high frequency vocabulary',
        'Can catch the main point in short, clear messages'
      ],
      'reading': [
        'Can read short, simple texts',
        'Can find specific information in simple materials'
      ],
      'writing': [
        'Can write short, simple notes and messages',
        'Can write a simple personal letter'
      ],
      'grammar': [
        'Past simple tense',
        'Future with going to',
        'Comparative adjectives'
      ],
      'vocabulary': [
        'Shopping and local geography',
        'Employment and education',
        'Simple descriptions'
      ]
    },
    'B1': {
      'speaking': [
        'Can deal with most situations while travelling',
        'Can describe experiences, events, dreams and ambitions',
        'Can give brief reasons and explanations'
      ],
      'listening': [
        'Can understand main points of clear standard speech',
        'Can understand radio or TV programmes on familiar topics'
      ],
      'reading': [
        'Can understand texts with everyday language',
        'Can understand descriptions of events and feelings'
      ],
      'writing': [
        'Can write simple connected text on familiar topics',
        'Can write personal letters describing experiences'
      ],
      'grammar': [
        'Present perfect tense',
        'Conditionals (first and second)',
        'Passive voice (simple)'
      ],
      'vocabulary': [
        'Travel and tourism',
        'Health and medicine',
        'Entertainment and media'
      ]
    },
    'B2': {
      'speaking': [
        'Can interact with native speakers fluently',
        'Can explain viewpoints giving advantages and disadvantages',
        'Can produce clear, detailed descriptions'
      ],
      'listening': [
        'Can understand extended speech and lectures',
        'Can understand most TV news and current affairs'
      ],
      'reading': [
        'Can read articles and reports on contemporary problems',
        'Can understand contemporary literary prose'
      ],
      'writing': [
        'Can write clear, detailed text on wide range of subjects',
        'Can write essays or reports presenting arguments'
      ],
      'grammar': [
        'All major tenses',
        'Reported speech',
        'Complex sentence structures'
      ],
      'vocabulary': [
        'Abstract concepts',
        'Professional terminology',
        'Idiomatic expressions'
      ]
    },
    'C1': {
      'speaking': [
        'Can express ideas fluently and spontaneously',
        'Can use language flexibly for social and professional purposes',
        'Can produce clear, well-structured descriptions'
      ],
      'listening': [
        'Can understand extended speech even when not clearly structured',
        'Can understand television programmes and films without difficulty'
      ],
      'reading': [
        'Can understand long complex texts and appreciate style',
        'Can understand specialised articles and technical instructions'
      ],
      'writing': [
        'Can express in clear, well-structured text',
        'Can write about complex subjects in letters and reports'
      ],
      'grammar': [
        'Advanced grammatical structures',
        'Subtle differences in meaning',
        'Stylistic variations'
      ],
      'vocabulary': [
        'Wide range of idiomatic expressions',
        'Academic and professional vocabulary',
        'Nuanced expressions'
      ]
    },
    'C2': {
      'speaking': [
        'Can express spontaneously, fluently and precisely',
        'Can present complex subjects coherently',
        'Can use language for any purpose effectively'
      ],
      'listening': [
        'Can understand any kind of spoken language',
        'Can understand native speakers at natural speed'
      ],
      'reading': [
        'Can read all forms of written language easily',
        'Can understand abstract, complex texts'
      ],
      'writing': [
        'Can write clear, smoothly flowing complex texts',
        'Can write summaries and reviews of professional works'
      ],
      'grammar': [
        'Complete mastery of grammar',
        'Native-like usage patterns',
        'Sophisticated structures'
      ],
      'vocabulary': [
        'Native-like vocabulary range',
        'Specialized terminology',
        'Cultural references and nuances'
      ]
    }
  };

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  /**
   * Tag content with CEFR level and skills
   */
  async tagContent(
    contentId: string,
    contentType: string,
    contentAnalysis: {
      text?: string;
      difficulty?: number;
      grammarPoints?: string[];
      vocabulary?: string[];
    }
  ): Promise<CEFRTag> {
    // Analyze content to determine CEFR level
    const level = this.analyzeContentLevel(contentAnalysis);
    const skills = this.identifyTargetSkills(contentType, contentAnalysis);
    
    const tag: CEFRTag = {
      level,
      skill: skills[0], // Primary skill
      descriptor: this.getDescriptor(level, skills[0]),
      canDoStatements: this.getCanDoStatements(level, skills),
      grammarPoints: contentAnalysis.grammarPoints || this.getGrammarPoints(level),
      vocabularyThemes: this.getVocabularyThemes(level),
      functionalLanguage: this.getFunctionalLanguage(level)
    };

    // Store tag in database
    await this.storage.query(`
      INSERT INTO content_cefr_tags (content_id, content_type, level, skills, tag_data)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (content_id) DO UPDATE
      SET level = $3, skills = $4, tag_data = $5, updated_at = NOW()
    `, [contentId, contentType, level, skills, JSON.stringify(tag)]);

    return tag;
  }

  /**
   * Assess student's CEFR level based on performance
   */
  async assessStudentLevel(
    studentId: number,
    assessmentData: {
      testScores?: Record<LanguageSkill, number>;
      completedContent?: string[];
      interactionData?: any;
    }
  ): Promise<CEFRAssessment> {
    // Calculate level for each skill
    const skillLevels = await this.calculateSkillLevels(studentId, assessmentData);
    
    // Determine overall level (weighted average)
    const overallLevel = this.calculateOverallLevel(skillLevels);
    
    // Identify strengths and weaknesses
    const { strengths, weaknesses } = this.analyzeStrengthsWeaknesses(skillLevels);
    
    // Get recommended content based on assessment
    const recommendedContent = await this.getRecommendedContent(
      overallLevel,
      weaknesses
    );

    const assessment: CEFRAssessment = {
      overallLevel,
      skillLevels,
      strengths,
      areasForImprovement: weaknesses,
      recommendedContent
    };

    // Store assessment
    await this.storage.query(`
      INSERT INTO student_cefr_assessments 
      (student_id, overall_level, skill_levels, assessment_data, assessed_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [studentId, overallLevel, skillLevels, JSON.stringify(assessment)]);

    return assessment;
  }

  /**
   * Generate adaptive roadmap based on CEFR progression
   */
  async generateAdaptiveRoadmap(
    studentId: number,
    targetLevel: CEFRLevel,
    currentAssessment: CEFRAssessment
  ): Promise<any> {
    const currentLevel = currentAssessment.overallLevel;
    const levelProgression = this.getLevelProgression(currentLevel, targetLevel);
    
    const roadmap = {
      studentId,
      currentLevel,
      targetLevel,
      estimatedWeeks: this.estimateProgressionTime(currentLevel, targetLevel),
      milestones: [],
      adaptivePath: []
    };

    // Create milestones for each level transition
    for (const level of levelProgression) {
      const milestone = {
        level,
        title: `Achieve ${level} Proficiency`,
        requiredSkills: this.descriptors[level],
        assessmentCriteria: this.getAssessmentCriteria(level),
        estimatedHours: this.getEstimatedHours(level),
        content: await this.getContentForLevel(level)
      };
      roadmap.milestones.push(milestone);
    }

    // Generate adaptive learning path
    roadmap.adaptivePath = await this.generateAdaptivePath(
      currentAssessment,
      targetLevel
    );

    return roadmap;
  }

  /**
   * Update roadmap based on student progress
   */
  async updateRoadmapProgress(
    studentId: number,
    roadmapId: number,
    progressData: {
      completedContentIds: string[];
      assessmentScores: Record<string, number>;
      timeSpent: number;
    }
  ): Promise<any> {
    // Reassess current level based on new data
    const newAssessment = await this.assessStudentLevel(studentId, {
      completedContent: progressData.completedContentIds
    });

    // Check if level has changed
    const previousAssessment = await this.storage.query(
      'SELECT * FROM student_cefr_assessments WHERE student_id = $1 ORDER BY assessed_at DESC LIMIT 2',
      [studentId]
    );

    if (previousAssessment[1] && 
        previousAssessment[1].overall_level !== newAssessment.overallLevel) {
      // Level changed - adapt roadmap
      await this.adaptRoadmap(roadmapId, newAssessment);
    }

    // Update progress metrics
    await this.storage.query(`
      UPDATE user_roadmap_enrollments
      SET current_cefr_level = $1,
          skill_levels = $2,
          last_assessment = $3,
          updated_at = NOW()
      WHERE user_id = $4 AND roadmap_id = $5
    `, [
      newAssessment.overallLevel,
      newAssessment.skillLevels,
      JSON.stringify(newAssessment),
      studentId,
      roadmapId
    ]);

    return {
      levelProgress: newAssessment,
      roadmapUpdated: true,
      nextRecommendations: newAssessment.recommendedContent
    };
  }

  // Helper methods
  private analyzeContentLevel(analysis: any): CEFRLevel {
    // Simplified level detection based on complexity metrics
    const difficulty = analysis.difficulty || 0.5;
    if (difficulty < 0.2) return 'A1';
    if (difficulty < 0.35) return 'A2';
    if (difficulty < 0.5) return 'B1';
    if (difficulty < 0.65) return 'B2';
    if (difficulty < 0.8) return 'C1';
    return 'C2';
  }

  private identifyTargetSkills(contentType: string, analysis: any): LanguageSkill[] {
    const skillMap: Record<string, LanguageSkill[]> = {
      'video': ['listening', 'speaking'],
      'text': ['reading', 'vocabulary'],
      'exercise': ['grammar', 'writing'],
      'conversation': ['speaking', 'listening']
    };
    return skillMap[contentType] || ['vocabulary'];
  }

  private getDescriptor(level: CEFRLevel, skill: LanguageSkill): string {
    return this.descriptors[level][skill][0] || '';
  }

  private getCanDoStatements(level: CEFRLevel, skills: LanguageSkill[]): string[] {
    const statements: string[] = [];
    for (const skill of skills) {
      statements.push(...(this.descriptors[level][skill] || []));
    }
    return statements;
  }

  private getGrammarPoints(level: CEFRLevel): string[] {
    return this.descriptors[level]['grammar'] || [];
  }

  private getVocabularyThemes(level: CEFRLevel): string[] {
    return this.descriptors[level]['vocabulary'] || [];
  }

  private getFunctionalLanguage(level: CEFRLevel): string[] {
    const functional: Record<CEFRLevel, string[]> = {
      'A1': ['Greetings', 'Introductions', 'Simple requests'],
      'A2': ['Making arrangements', 'Describing routines', 'Shopping'],
      'B1': ['Giving opinions', 'Making suggestions', 'Describing experiences'],
      'B2': ['Debating', 'Hypothesizing', 'Negotiating'],
      'C1': ['Persuading', 'Analyzing', 'Synthesizing'],
      'C2': ['Subtle argumentation', 'Implied meaning', 'Cultural nuances']
    };
    return functional[level] || [];
  }

  private async calculateSkillLevels(
    studentId: number,
    data: any
  ): Promise<Record<LanguageSkill, CEFRLevel>> {
    // Implementation would analyze test scores and performance data
    // Simplified for now
    return {
      'speaking': 'B1',
      'listening': 'B1',
      'reading': 'B2',
      'writing': 'A2',
      'grammar': 'B1',
      'vocabulary': 'B1'
    };
  }

  private calculateOverallLevel(skillLevels: Record<LanguageSkill, CEFRLevel>): CEFRLevel {
    // Calculate weighted average of skill levels
    const levelValues: Record<CEFRLevel, number> = {
      'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };
    
    const values = Object.values(skillLevels).map(level => levelValues[level]);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    
    if (average <= 1.5) return 'A1';
    if (average <= 2.5) return 'A2';
    if (average <= 3.5) return 'B1';
    if (average <= 4.5) return 'B2';
    if (average <= 5.5) return 'C1';
    return 'C2';
  }

  private analyzeStrengthsWeaknesses(
    skillLevels: Record<LanguageSkill, CEFRLevel>
  ): { strengths: string[], weaknesses: string[] } {
    const levelValues: Record<CEFRLevel, number> = {
      'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };
    
    const average = this.calculateOverallLevel(skillLevels);
    const avgValue = levelValues[average];
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    for (const [skill, level] of Object.entries(skillLevels)) {
      if (levelValues[level] > avgValue) {
        strengths.push(`Strong ${skill} skills at ${level} level`);
      } else if (levelValues[level] < avgValue) {
        weaknesses.push(`${skill} needs improvement (currently ${level})`);
      }
    }
    
    return { strengths, weaknesses };
  }

  private async getRecommendedContent(
    level: CEFRLevel,
    weaknesses: string[]
  ): Promise<CEFRContent[]> {
    // Generate recommendations based on level and weak areas
    const recommendations: CEFRContent[] = [];
    
    // Add content for weak skills
    for (const weakness of weaknesses) {
      const skill = weakness.match(/(speaking|listening|reading|writing|grammar|vocabulary)/)?.[0];
      if (skill) {
        recommendations.push({
          id: `rec_${Date.now()}_${skill}`,
          level,
          skills: [skill as LanguageSkill],
          title: `Improve your ${skill} skills`,
          description: `Targeted practice for ${level} level ${skill}`,
          estimatedMinutes: 30,
          prerequisites: []
        });
      }
    }
    
    return recommendations;
  }

  private getLevelProgression(current: CEFRLevel, target: CEFRLevel): CEFRLevel[] {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(current);
    const targetIndex = levels.indexOf(target);
    
    return levels.slice(currentIndex + 1, targetIndex + 1);
  }

  private estimateProgressionTime(current: CEFRLevel, target: CEFRLevel): number {
    // Estimated weeks for each level transition
    const transitionWeeks: Record<string, number> = {
      'A1-A2': 12,
      'A2-B1': 20,
      'B1-B2': 30,
      'B2-C1': 40,
      'C1-C2': 50
    };
    
    const progression = this.getLevelProgression(current, target);
    let totalWeeks = 0;
    
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    let currentLevel = current;
    
    for (const nextLevel of progression) {
      const key = `${currentLevel}-${nextLevel}`;
      totalWeeks += transitionWeeks[key] || 20;
      currentLevel = nextLevel;
    }
    
    return totalWeeks;
  }

  private getAssessmentCriteria(level: CEFRLevel): any {
    return {
      speaking: this.descriptors[level]['speaking'],
      listening: this.descriptors[level]['listening'],
      reading: this.descriptors[level]['reading'],
      writing: this.descriptors[level]['writing']
    };
  }

  private getEstimatedHours(level: CEFRLevel): number {
    const hoursMap: Record<CEFRLevel, number> = {
      'A1': 80,
      'A2': 150,
      'B1': 300,
      'B2': 500,
      'C1': 700,
      'C2': 1000
    };
    return hoursMap[level];
  }

  private async getContentForLevel(level: CEFRLevel): Promise<any[]> {
    // Query database for content tagged with this level
    const content = await this.storage.query(
      'SELECT * FROM content_cefr_tags WHERE level = $1',
      [level]
    );
    return content;
  }

  private async generateAdaptivePath(
    assessment: CEFRAssessment,
    targetLevel: CEFRLevel
  ): Promise<any[]> {
    // Generate personalized learning path
    const path = [];
    
    // Focus on weak areas first
    for (const weakness of assessment.areasForImprovement) {
      path.push({
        type: 'remedial',
        focus: weakness,
        content: assessment.recommendedContent
      });
    }
    
    // Add progression content
    const progression = this.getLevelProgression(assessment.overallLevel, targetLevel);
    for (const level of progression) {
      path.push({
        type: 'progression',
        targetLevel: level,
        content: await this.getContentForLevel(level)
      });
    }
    
    return path;
  }

  private async adaptRoadmap(roadmapId: number, assessment: CEFRAssessment): Promise<void> {
    // Update roadmap based on new assessment
    await this.storage.query(`
      UPDATE learning_roadmaps 
      SET adaptive_data = $1, updated_at = NOW()
      WHERE id = $2
    `, [JSON.stringify(assessment), roadmapId]);
  }
}