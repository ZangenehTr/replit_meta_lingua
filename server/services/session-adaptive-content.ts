/**
 * Session-Adaptive Content Generation Service
 * Dynamically generates and adapts content based on student performance
 */

import { OllamaService } from '../ollama-service';
import { DatabaseStorage } from '../database-storage';
import { CEFRLevel } from './cefr-tagging-service';

export interface StudentPerformanceMetrics {
  studentId: number;
  sessionId: number;
  accuracy: number;
  responseTime: number;
  engagementLevel: number;
  vocabularyRetention: number;
  grammarAccuracy: number;
  speakingFluency: number;
  comprehension: number;
  moodState?: string;
  energyLevel?: number;
}

export interface AdaptiveContent {
  id: string;
  sessionId: number;
  contentType: 'warmup' | 'main' | 'practice' | 'review' | 'challenge';
  difficulty: number; // 0-1 scale
  estimatedMinutes: number;
  title: string;
  description: string;
  content: any; // Flexible content structure
  adaptationReason: string;
  targetSkills: string[];
  cefrLevel: CEFRLevel;
}

export interface ContentAdaptationStrategy {
  strategy: 'accelerate' | 'maintain' | 'remediate' | 'review';
  reason: string;
  adjustments: {
    difficulty: number;
    pacing: number;
    supportLevel: number;
    challengeLevel: number;
  };
}

export class SessionAdaptiveContentService {
  private ollamaService: OllamaService;
  private storage: DatabaseStorage;
  private sessionMetrics: Map<number, StudentPerformanceMetrics>;
  private adaptationHistory: Map<number, ContentAdaptationStrategy[]>;

  constructor(ollamaService: OllamaService, storage: DatabaseStorage) {
    this.ollamaService = ollamaService;
    this.storage = storage;
    this.sessionMetrics = new Map();
    this.adaptationHistory = new Map();
  }

  /**
   * Generate adaptive content for a session
   */
  async generateAdaptiveContent(
    sessionId: number,
    studentId: number,
    sessionType: string,
    targetSkills: string[]
  ): Promise<AdaptiveContent[]> {
    // Get student profile and history
    const studentProfile = await this.getStudentProfile(studentId);
    const performanceHistory = await this.getPerformanceHistory(studentId);
    const currentMood = await this.getCurrentMood(studentId);
    
    // Determine adaptation strategy
    const strategy = this.determineAdaptationStrategy(
      performanceHistory,
      currentMood
    );
    
    // Generate content based on strategy
    const contents: AdaptiveContent[] = [];
    
    // 1. Warmup content
    contents.push(await this.generateWarmupContent(
      sessionId,
      studentProfile,
      strategy
    ));
    
    // 2. Main learning content
    contents.push(await this.generateMainContent(
      sessionId,
      studentProfile,
      targetSkills,
      strategy
    ));
    
    // 3. Practice activities
    contents.push(await this.generatePracticeContent(
      sessionId,
      studentProfile,
      targetSkills,
      strategy
    ));
    
    // 4. Adaptive challenge or review
    if (strategy.strategy === 'accelerate') {
      contents.push(await this.generateChallengeContent(
        sessionId,
        studentProfile,
        targetSkills
      ));
    } else if (strategy.strategy === 'remediate') {
      contents.push(await this.generateReviewContent(
        sessionId,
        studentProfile,
        targetSkills
      ));
    }
    
    // Store generated content
    await this.storeGeneratedContent(sessionId, contents);
    
    return contents;
  }

  /**
   * Update content based on real-time performance
   */
  async adaptContentInRealtime(
    sessionId: number,
    currentMetrics: StudentPerformanceMetrics
  ): Promise<AdaptiveContent | null> {
    // Store current metrics
    this.sessionMetrics.set(sessionId, currentMetrics);
    
    // Analyze if adaptation is needed
    const needsAdaptation = this.checkAdaptationTriggers(currentMetrics);
    
    if (!needsAdaptation) return null;
    
    // Generate adaptive intervention
    const intervention = await this.generateIntervention(
      sessionId,
      currentMetrics
    );
    
    return intervention;
  }

  /**
   * Generate warmup content
   */
  private async generateWarmupContent(
    sessionId: number,
    profile: any,
    strategy: ContentAdaptationStrategy
  ): Promise<AdaptiveContent> {
    const difficulty = this.adjustDifficulty(profile.currentLevel, strategy);
    
    const prompt = `
      Generate a 5-minute warmup activity for a ${profile.currentLevel} level student.
      Focus on: confidence building and engagement
      Energy level: ${profile.energyLevel || 'moderate'}
      Previous topics: ${profile.recentTopics?.join(', ')}
      
      Provide:
      1. Activity description
      2. Questions or prompts
      3. Expected outcomes
      
      Format as JSON.
    `;

    const response = await this.ollamaService.generateResponse(prompt, 'content_generator');
    
    let content;
    try {
      content = JSON.parse(response);
    } catch {
      content = this.getDefaultWarmupContent(profile.currentLevel);
    }

    return {
      id: `warmup_${sessionId}_${Date.now()}`,
      sessionId,
      contentType: 'warmup',
      difficulty,
      estimatedMinutes: 5,
      title: 'Session Warmup',
      description: 'Engaging warmup to start the session',
      content,
      adaptationReason: strategy.reason,
      targetSkills: ['speaking', 'listening'],
      cefrLevel: profile.currentLevel
    };
  }

  /**
   * Generate main learning content
   */
  private async generateMainContent(
    sessionId: number,
    profile: any,
    targetSkills: string[],
    strategy: ContentAdaptationStrategy
  ): Promise<AdaptiveContent> {
    const difficulty = this.adjustDifficulty(profile.currentLevel, strategy);
    
    const prompt = `
      Generate main learning content for a ${profile.currentLevel} student.
      Target skills: ${targetSkills.join(', ')}
      Learning style: ${profile.learningStyle}
      Interests: ${profile.interests?.join(', ')}
      Difficulty adjustment: ${strategy.adjustments.difficulty}
      
      Create content that includes:
      1. Clear learning objectives
      2. Explanation or presentation
      3. Examples
      4. Guided practice
      
      Format as structured JSON.
    `;

    const response = await this.ollamaService.generateResponse(prompt, 'content_generator');
    
    let content;
    try {
      content = JSON.parse(response);
    } catch {
      content = this.generateStructuredContent(targetSkills, profile.currentLevel);
    }

    return {
      id: `main_${sessionId}_${Date.now()}`,
      sessionId,
      contentType: 'main',
      difficulty,
      estimatedMinutes: 20,
      title: `${targetSkills[0]} Focus`,
      description: 'Core learning content',
      content,
      adaptationReason: strategy.reason,
      targetSkills,
      cefrLevel: profile.currentLevel
    };
  }

  /**
   * Generate practice content
   */
  private async generatePracticeContent(
    sessionId: number,
    profile: any,
    targetSkills: string[],
    strategy: ContentAdaptationStrategy
  ): Promise<AdaptiveContent> {
    const difficulty = this.adjustDifficulty(profile.currentLevel, strategy);
    
    // Generate practice based on weak areas
    const weakAreas = await this.identifyWeakAreas(profile.studentId);
    
    const content = {
      exercises: [],
      feedback: [],
      hints: []
    };

    // Create targeted exercises
    for (const skill of targetSkills) {
      const exercise = await this.createAdaptiveExercise(
        skill,
        difficulty,
        profile.currentLevel,
        weakAreas.includes(skill)
      );
      content.exercises.push(exercise);
    }

    return {
      id: `practice_${sessionId}_${Date.now()}`,
      sessionId,
      contentType: 'practice',
      difficulty,
      estimatedMinutes: 15,
      title: 'Adaptive Practice',
      description: 'Personalized practice activities',
      content,
      adaptationReason: `Targeting ${weakAreas.join(', ')}`,
      targetSkills,
      cefrLevel: profile.currentLevel
    };
  }

  /**
   * Generate challenge content for advanced students
   */
  private async generateChallengeContent(
    sessionId: number,
    profile: any,
    targetSkills: string[]
  ): Promise<AdaptiveContent> {
    const prompt = `
      Generate a challenging activity for an advanced ${profile.currentLevel} student.
      Skills: ${targetSkills.join(', ')}
      Type: Real-world application or creative task
      
      Include:
      1. Complex scenario
      2. Multiple skill integration
      3. Open-ended elements
      4. Success criteria
      
      Format as JSON.
    `;

    const response = await this.ollamaService.generateResponse(prompt, 'content_generator');
    
    let content;
    try {
      content = JSON.parse(response);
    } catch {
      content = {
        scenario: 'Business presentation roleplay',
        tasks: ['Present a product', 'Handle Q&A', 'Negotiate terms'],
        criteria: ['Fluency', 'Professional vocabulary', 'Persuasiveness']
      };
    }

    return {
      id: `challenge_${sessionId}_${Date.now()}`,
      sessionId,
      contentType: 'challenge',
      difficulty: 0.8,
      estimatedMinutes: 10,
      title: 'Challenge Activity',
      description: 'Advanced application of skills',
      content,
      adaptationReason: 'Student showing mastery - providing challenge',
      targetSkills,
      cefrLevel: this.getNextLevel(profile.currentLevel)
    };
  }

  /**
   * Generate review content for struggling students
   */
  private async generateReviewContent(
    sessionId: number,
    profile: any,
    targetSkills: string[]
  ): Promise<AdaptiveContent> {
    // Get areas needing review
    const reviewAreas = await this.getReviewAreas(profile.studentId);
    
    const content = {
      reviewPoints: [],
      examples: [],
      miniExercises: []
    };

    for (const area of reviewAreas) {
      content.reviewPoints.push({
        topic: area,
        explanation: await this.generateSimpleExplanation(area, profile.currentLevel),
        example: this.getReviewExample(area)
      });
      
      content.miniExercises.push({
        type: 'recognition',
        question: `Identify the correct usage of ${area}`,
        options: this.generateMultipleChoice(area),
        feedback: 'Immediate feedback provided'
      });
    }

    return {
      id: `review_${sessionId}_${Date.now()}`,
      sessionId,
      contentType: 'review',
      difficulty: 0.3,
      estimatedMinutes: 10,
      title: 'Reinforcement Review',
      description: 'Review of key concepts',
      content,
      adaptationReason: 'Reinforcing fundamental concepts',
      targetSkills,
      cefrLevel: profile.currentLevel
    };
  }

  /**
   * Generate intervention content
   */
  private async generateIntervention(
    sessionId: number,
    metrics: StudentPerformanceMetrics
  ): Promise<AdaptiveContent> {
    let interventionType: 'break' | 'easier' | 'hint' | 'encouragement';
    let content: any;

    if (metrics.energyLevel && metrics.energyLevel < 3) {
      interventionType = 'break';
      content = {
        type: 'energizer',
        activity: 'Quick stretch or breathing exercise',
        duration: 2,
        message: 'Let\'s take a quick break to recharge!'
      };
    } else if (metrics.accuracy < 0.5) {
      interventionType = 'easier';
      content = {
        type: 'simplified',
        adjustment: 'Reducing difficulty temporarily',
        supportElements: ['Visual aids', 'Slower pace', 'More examples']
      };
    } else if (metrics.responseTime > 30) {
      interventionType = 'hint';
      content = {
        type: 'scaffold',
        hints: ['Think about...', 'Remember when we...', 'Try breaking it down...']
      };
    } else {
      interventionType = 'encouragement';
      content = {
        type: 'motivation',
        message: 'You\'re doing great! Keep it up!',
        achievement: 'Consistency streak: 5 correct answers'
      };
    }

    return {
      id: `intervention_${sessionId}_${Date.now()}`,
      sessionId,
      contentType: 'practice',
      difficulty: 0.5,
      estimatedMinutes: 2,
      title: 'Adaptive Support',
      description: `${interventionType} intervention`,
      content,
      adaptationReason: `Triggered by ${this.getMetricTrigger(metrics)}`,
      targetSkills: [],
      cefrLevel: 'B1' // Default
    };
  }

  // Helper methods
  private async getStudentProfile(studentId: number): Promise<any> {
    const student = await this.storage.getStudent(studentId);
    const sessions = await this.storage.getUserSessions(studentId);
    
    return {
      studentId,
      currentLevel: student?.currentLevel || 'B1',
      learningStyle: student?.learningStyle || 'visual',
      interests: student?.interests || [],
      recentTopics: sessions.slice(0, 5).map(s => s.title),
      energyLevel: 5 // Default
    };
  }

  private async getPerformanceHistory(studentId: number): Promise<any> {
    const results = await this.storage.query(
      'SELECT * FROM student_performance WHERE student_id = $1 ORDER BY created_at DESC LIMIT 10',
      [studentId]
    );
    return results;
  }

  private async getCurrentMood(studentId: number): Promise<any> {
    const mood = await this.storage.query(
      'SELECT * FROM mood_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [studentId]
    );
    return mood[0] || { moodScore: 5, energyLevel: 5 };
  }

  private determineAdaptationStrategy(
    history: any,
    mood: any
  ): ContentAdaptationStrategy {
    // Analyze performance trends
    const recentAccuracy = history.slice(0, 3)
      .reduce((acc: number, h: any) => acc + (h.accuracy || 0.7), 0) / 3;
    
    let strategy: ContentAdaptationStrategy['strategy'];
    let reason: string;
    
    if (recentAccuracy > 0.85 && mood.energyLevel > 6) {
      strategy = 'accelerate';
      reason = 'High performance and energy - increasing challenge';
    } else if (recentAccuracy > 0.7) {
      strategy = 'maintain';
      reason = 'Steady progress - maintaining current level';
    } else if (recentAccuracy < 0.5 || mood.energyLevel < 4) {
      strategy = 'remediate';
      reason = 'Performance below threshold - providing support';
    } else {
      strategy = 'review';
      reason = 'Consolidating recent learning';
    }

    return {
      strategy,
      reason,
      adjustments: {
        difficulty: strategy === 'accelerate' ? 0.2 : strategy === 'remediate' ? -0.2 : 0,
        pacing: strategy === 'remediate' ? 0.8 : 1,
        supportLevel: strategy === 'remediate' ? 1.5 : 1,
        challengeLevel: strategy === 'accelerate' ? 1.5 : 1
      }
    };
  }

  private adjustDifficulty(
    currentLevel: CEFRLevel,
    strategy: ContentAdaptationStrategy
  ): number {
    const baseDifficulty: Record<CEFRLevel, number> = {
      'A1': 0.2, 'A2': 0.35, 'B1': 0.5,
      'B2': 0.65, 'C1': 0.8, 'C2': 0.95
    };
    
    const base = baseDifficulty[currentLevel] || 0.5;
    return Math.max(0.1, Math.min(1, base + strategy.adjustments.difficulty));
  }

  private checkAdaptationTriggers(metrics: StudentPerformanceMetrics): boolean {
    return (
      metrics.accuracy < 0.4 ||
      metrics.accuracy > 0.95 ||
      metrics.engagementLevel < 3 ||
      metrics.responseTime > 60 ||
      (metrics.energyLevel && metrics.energyLevel < 3)
    );
  }

  private async identifyWeakAreas(studentId: number): Promise<string[]> {
    // Query performance data to find weak areas
    const weakAreas = await this.storage.query(
      `SELECT skill, AVG(score) as avg_score 
       FROM skill_assessments 
       WHERE student_id = $1 
       GROUP BY skill 
       HAVING AVG(score) < 0.6`,
      [studentId]
    );
    
    return weakAreas.map((area: any) => area.skill) || ['grammar', 'vocabulary'];
  }

  private async createAdaptiveExercise(
    skill: string,
    difficulty: number,
    level: CEFRLevel,
    isWeakArea: boolean
  ): Promise<any> {
    const exerciseTypes = {
      'speaking': ['describe image', 'role play', 'opinion'],
      'listening': ['comprehension', 'dictation', 'summary'],
      'reading': ['multiple choice', 'true/false', 'matching'],
      'writing': ['gap fill', 'sentence transformation', 'paragraph'],
      'grammar': ['correction', 'choice', 'transformation'],
      'vocabulary': ['matching', 'context', 'word formation']
    };

    const type = exerciseTypes[skill as keyof typeof exerciseTypes]?.[
      Math.floor(Math.random() * 3)
    ] || 'practice';

    return {
      skill,
      type,
      difficulty: isWeakArea ? difficulty * 0.8 : difficulty,
      supportProvided: isWeakArea,
      content: `${skill} exercise at ${level} level`
    };
  }

  private getDefaultWarmupContent(level: CEFRLevel): any {
    return {
      activity: 'Quick conversation starter',
      prompts: [
        'How was your day?',
        'What did you do yesterday?',
        'What are your plans for tomorrow?'
      ],
      expectedDuration: 5
    };
  }

  private generateStructuredContent(skills: string[], level: CEFRLevel): any {
    return {
      objectives: skills.map(s => `Improve ${s} at ${level} level`),
      presentation: `Content for ${skills.join(', ')}`,
      examples: ['Example 1', 'Example 2'],
      practice: 'Guided practice activity'
    };
  }

  private getNextLevel(current: CEFRLevel): CEFRLevel {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const index = levels.indexOf(current);
    return levels[Math.min(index + 1, levels.length - 1)];
  }

  private async getReviewAreas(studentId: number): Promise<string[]> {
    // Get topics that need review based on performance
    const areas = await this.storage.query(
      `SELECT DISTINCT topic FROM learning_activities 
       WHERE student_id = $1 AND score < 0.6 
       ORDER BY attempt_date DESC LIMIT 3`,
      [studentId]
    );
    
    return areas.map((a: any) => a.topic) || ['basic grammar', 'common vocabulary'];
  }

  private async generateSimpleExplanation(topic: string, level: CEFRLevel): Promise<string> {
    return `Clear explanation of ${topic} suitable for ${level} level`;
  }

  private getReviewExample(area: string): string {
    return `Example demonstrating ${area}`;
  }

  private generateMultipleChoice(area: string): string[] {
    return [
      `Correct usage of ${area}`,
      `Common mistake with ${area}`,
      `Alternative form of ${area}`,
      `Unrelated option`
    ];
  }

  private getMetricTrigger(metrics: StudentPerformanceMetrics): string {
    if (metrics.accuracy < 0.5) return 'low accuracy';
    if (metrics.responseTime > 30) return 'slow response time';
    if (metrics.engagementLevel < 3) return 'low engagement';
    if (metrics.energyLevel && metrics.energyLevel < 3) return 'low energy';
    return 'performance metrics';
  }

  private async storeGeneratedContent(
    sessionId: number,
    contents: AdaptiveContent[]
  ): Promise<void> {
    for (const content of contents) {
      await this.storage.query(
        `INSERT INTO adaptive_session_content 
         (session_id, content_type, content_data, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [sessionId, content.contentType, JSON.stringify(content)]
      );
    }
  }
}