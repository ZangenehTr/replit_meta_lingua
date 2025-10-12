/**
 * Exam-Focused Roadmap Generator Service
 * Generates AI-powered personalized learning plans based on MST results for specific exams
 */

import { aiAdapter } from './ai-adapter';
import { storage } from '../storage';
import { 
  examScoreToCEFR, 
  calculateRequiredHours,
  ExamType,
  type CEFRLevelValues,
  type ExamTypeValues,
  type RoadmapPlan,
  type RoadmapSession,
  type RoadmapPlanInsert,
  type RoadmapSessionInsert
} from '@shared/schema';
import { MstSession, MstResult, SkillResult } from '../modules/mst/schemas/resultSchema';

export interface CalculatePlanRequest {
  sessionId: string;
  exam: ExamTypeValues;
  targetScore: number;
  examDate?: string;
  weeklyHours: number;
  focusAreas?: string[];
  preferredPace: 'slow' | 'normal' | 'fast';
}

export interface StudyPlan {
  weeklyBreakdown: {
    week: number;
    theme: string;
    skills: string[];
    testingFocus: string;
  }[];
  skillProgression: {
    skill: string;
    currentLevel: string;
    targetLevel: string;
    improvementNeeded: string;
  }[];
  milestones: {
    week: number;
    title: string;
    description: string;
    targetScore: number;
  }[];
}

export interface CalculatePlanResponse {
  planId: number;
  currentLevel: Record<string, CEFRLevelValues>;
  targetLevel: CEFRLevelValues;
  requiredHours: number;
  weeksToExam: number;
  sessionsPerWeek: number;
  totalSessions: number;
  studyPlan: StudyPlan;
}

export interface GenerateSessionsRequest {
  planId: number;
  userId: number;
  sessionId: string;
  exam: ExamTypeValues;
  currentLevel: Record<string, CEFRLevelValues>;
  targetLevel: CEFRLevelValues;
  focusAreas?: string[];
  totalSessions: number;
}

export interface ExamSkillGap {
  skill: string;
  currentLevel: CEFRLevelValues;
  targetLevel: CEFRLevelValues;
  scoreGap: number;
  priority: 'high' | 'medium' | 'low';
  examSpecificWeaknesses: string[];
}

export interface SessionPlan {
  sessionIndex: number;
  weekNumber: number;
  title: string;
  sessionType: string;
  durationMinutes: number;
  learningGoals: string[];
  grammarTopics: string[];
  vocabularyThemes: string[];
  keyPhrases: string[];
  flashcardSets: string[];
  homeworkTasks: string[];
  practiceExercises: string[];
}

export class ExamRoadmapGenerator {
  constructor() {
    // Using AI adapter for all AI operations
  }

  /**
   * Calculate comprehensive study plan based on MST results
   */
  async calculatePlan(request: CalculatePlanRequest): Promise<CalculatePlanResponse> {
    console.log(`📊 Calculating roadmap plan for exam: ${request.exam}, target score: ${request.targetScore}`);

    // 1. Get MST session and results
    const mstSession = await this.getMSTSessionById(request.sessionId);
    if (!mstSession) {
      throw new Error(`MST session not found: ${request.sessionId}`);
    }

    const mstResults = await this.getMSTResults(request.sessionId);
    if (!mstResults || !mstResults.skills || mstResults.skills.length === 0) {
      throw new Error(`MST results not found for session: ${request.sessionId}`);
    }

    // 2. Analyze current CEFR levels per skill from MST results
    const currentLevel = this.extractCurrentLevels(mstResults);
    
    // 3. Determine target CEFR level from exam score
    const targetLevel = examScoreToCEFR(request.exam, request.targetScore);
    
    // 4. Calculate required study hours
    const overallCurrentLevel = this.calculateOverallLevel(currentLevel);
    const requiredHours = calculateRequiredHours(overallCurrentLevel, targetLevel);
    
    // 5. Calculate timeline and session structure
    const weeksToExam = request.examDate ? 
      Math.ceil((new Date(request.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)) : 
      Math.ceil(requiredHours / request.weeklyHours);
    
    const sessionsPerWeek = this.calculateSessionsPerWeek(request.weeklyHours, request.preferredPace);
    const totalSessions = weeksToExam * sessionsPerWeek;

    // 6. Generate study plan structure
    const studyPlan = await this.generateStudyPlan(request, currentLevel, targetLevel, weeksToExam, mstResults);

    // 7. Create and save roadmap plan in database
    const planData: RoadmapPlanInsert = {
      userId: mstSession.userId,
      configId: 1, // Default config, could be made dynamic
      exam: request.exam,
      currentLevel: JSON.stringify(currentLevel),
      targetScore: request.targetScore,
      cefrTarget: targetLevel,
      requiredHours,
      weeksToExam,
      sessionsPerWeek,
      totalSessions,
      completedSessions: 0,
      currentWeek: 1,
      lastUpdated: new Date(),
    };

    const savedPlan = await storage.createRoadmapPlan(planData);

    return {
      planId: savedPlan.id,
      currentLevel,
      targetLevel,
      requiredHours,
      weeksToExam,
      sessionsPerWeek,
      totalSessions,
      studyPlan
    };
  }

  /**
   * Generate detailed AI-powered session plans
   */
  async generateSessions(request: GenerateSessionsRequest): Promise<SessionPlan[]> {
    console.log(`🤖 Generating ${request.totalSessions} AI-powered sessions for ${request.exam}`);

    // 1. Get MST results to analyze skill gaps
    const mstResults = await this.getMSTResults(request.sessionId);
    if (!mstResults) {
      throw new Error(`MST results not found for session: ${request.sessionId}`);
    }

    // 2. Analyze skill gaps specific to exam requirements
    const skillGaps = this.analyzeExamSkillGaps(request, mstResults);
    
    // 3. Generate session plans using OpenAI with exam-specific prompts
    const sessions = await this.generateAISessionPlans(request, skillGaps);
    
    // 4. Save sessions to database
    const savedSessions = await this.saveSessions(request.planId, sessions);
    
    return savedSessions;
  }

  /**
   * Extract current CEFR levels from MST results
   */
  private extractCurrentLevels(mstResults: MstResult): Record<string, CEFRLevelValues> {
    const levels: Record<string, CEFRLevelValues> = {};
    
    for (const skill of mstResults.skills) {
      // Convert MST band (e.g., "B1+", "B2-") to standard CEFR level
      let level = skill.band.replace(/[+-]$/, '') as CEFRLevelValues;
      
      // Validate CEFR level
      if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
        level = 'B1'; // Default fallback
      }
      
      levels[skill.skill] = level;
    }
    
    return levels;
  }

  /**
   * Calculate overall CEFR level from individual skills
   */
  private calculateOverallLevel(skillLevels: Record<string, CEFRLevelValues>): CEFRLevelValues {
    const levelValues = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
    const reverseMapping = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' };
    
    const levels = Object.values(skillLevels).map(level => levelValues[level]);
    const averageLevel = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
    
    return reverseMapping[averageLevel] as CEFRLevelValues;
  }

  /**
   * Calculate optimal sessions per week based on available time and pace
   */
  private calculateSessionsPerWeek(weeklyHours: number, pace: string): number {
    const sessionDuration = 1.5; // 90 minutes per session
    const baseSessions = Math.floor(weeklyHours / sessionDuration);
    
    switch (pace) {
      case 'slow': return Math.max(1, Math.floor(baseSessions * 0.8));
      case 'fast': return Math.min(7, Math.ceil(baseSessions * 1.2));
      default: return Math.max(1, baseSessions);
    }
  }

  /**
   * Generate study plan structure with weekly breakdown
   */
  private async generateStudyPlan(
    request: CalculatePlanRequest,
    currentLevel: Record<string, CEFRLevelValues>,
    targetLevel: CEFRLevelValues,
    weeksToExam: number,
    mstResults: MstResult
  ): Promise<StudyPlan> {
    // Analyze skill priorities based on MST performance
    const skillPriorities = this.analyzeSkillPriorities(mstResults, request.focusAreas);
    
    // Generate weekly themes based on exam type and skill progression
    const weeklyBreakdown = this.generateWeeklyBreakdown(request.exam, weeksToExam, skillPriorities);
    
    // Create skill progression plan
    const skillProgression = Object.entries(currentLevel).map(([skill, current]) => ({
      skill,
      currentLevel: current,
      targetLevel,
      improvementNeeded: this.calculateSkillImprovement(current, targetLevel, skill, request.exam)
    }));
    
    // Generate milestone schedule
    const milestones = this.generateMilestones(weeksToExam, request.targetScore, request.exam);
    
    return {
      weeklyBreakdown,
      skillProgression,
      milestones
    };
  }

  /**
   * Analyze skill gaps specific to exam requirements
   */
  private analyzeExamSkillGaps(request: GenerateSessionsRequest, mstResults: MstResult): ExamSkillGap[] {
    const gaps: ExamSkillGap[] = [];
    
    for (const skill of mstResults.skills) {
      const currentLevel = request.currentLevel[skill.skill] || 'B1' as CEFRLevelValues;
      const targetLevel = request.targetLevel;
      
      const gap: ExamSkillGap = {
        skill: skill.skill,
        currentLevel,
        targetLevel,
        scoreGap: this.calculateScoreGap(skill.stage1Score, skill.stage2Score || 0),
        priority: this.determineSkillPriority(skill, request.focusAreas),
        examSpecificWeaknesses: this.identifyExamWeaknesses(skill, request.exam)
      };
      
      gaps.push(gap);
    }
    
    return gaps.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generate AI-powered session plans using OpenAI
   */
  private async generateAISessionPlans(
    request: GenerateSessionsRequest,
    skillGaps: ExamSkillGap[]
  ): Promise<SessionPlan[]> {
    const sessions: SessionPlan[] = [];
    const sessionsPerWeek = Math.ceil(request.totalSessions / (request.totalSessions / 3)); // Rough calculation
    
    // Generate sessions in batches of weeks for better coherence
    const weeksCount = Math.ceil(request.totalSessions / sessionsPerWeek);
    
    for (let week = 1; week <= weeksCount; week++) {
      const weekSessions = await this.generateWeeklySessionsWithAI(
        request,
        skillGaps,
        week,
        sessionsPerWeek
      );
      
      sessions.push(...weekSessions);
      
      if (sessions.length >= request.totalSessions) {
        break;
      }
    }
    
    return sessions.slice(0, request.totalSessions);
  }

  /**
   * Generate weekly sessions using OpenAI with sophisticated prompts
   */
  private async generateWeeklySessionsWithAI(
    request: GenerateSessionsRequest,
    skillGaps: ExamSkillGap[],
    weekNumber: number,
    sessionsPerWeek: number
  ): Promise<SessionPlan[]> {
    const examDetails = this.getExamSpecificDetails(request.exam);
    const weeklyFocus = this.getWeeklyFocus(weekNumber, skillGaps, request.exam);
    
    const prompt = `
You are an expert language teacher creating a weekly study plan for ${request.exam} exam preparation.

STUDENT PROFILE:
- Current Levels: ${JSON.stringify(request.currentLevel)}
- Target Level: ${request.targetLevel}
- Focus Areas: ${request.focusAreas?.join(', ') || 'balanced'}
- Week: ${weekNumber}

SKILL GAP ANALYSIS:
${skillGaps.map(gap => `
- ${gap.skill}: ${gap.currentLevel} → ${gap.targetLevel} (Priority: ${gap.priority})
  Specific weaknesses: ${gap.examSpecificWeaknesses.join(', ')}
`).join('')}

EXAM REQUIREMENTS (${request.exam}):
${examDetails.requirements}

WEEKLY FOCUS: ${weeklyFocus.theme}
Priority Skills: ${weeklyFocus.skills.join(', ')}

Create ${sessionsPerWeek} progressive study sessions for this week. Each session should be 90 minutes and build upon previous sessions.

IMPORTANT REQUIREMENTS:
1. Include ${request.exam}-specific task practice (${examDetails.taskTypes.join(', ')})
2. Target the highest priority skill gaps first
3. Use authentic ${request.exam} materials and question types
4. Include exam strategies and time management
5. Progress from foundation to test practice within the week

Return JSON array:
[
  {
    "sessionIndex": 1,
    "weekNumber": ${weekNumber},
    "title": "Specific session title with skill + task focus",
    "sessionType": "skill_building|test_practice|integrated_skills|strategy_focus",
    "durationMinutes": 90,
    "learningGoals": ["Specific measurable goals for this session"],
    "grammarTopics": ["Targeted grammar points for ${request.exam}"],
    "vocabularyThemes": ["Academic/test-specific vocabulary areas"],
    "keyPhrases": ["Essential expressions for ${request.exam} tasks"],
    "flashcardSets": ["Vocabulary sets to create for memorization"],
    "homeworkTasks": ["Specific practice assignments"],
    "practiceExercises": ["In-session activities with ${request.exam} format"]
  }
]
`;

    try {
      // Use AI adapter (Ollama) for Iranian self-hosting
      const systemPrompt = 'You are an expert language teacher specializing in exam preparation. Create detailed, practical session plans that directly address identified skill gaps and include authentic exam practice.';
      const response = await aiAdapter.chat(systemPrompt, prompt);

      const result = JSON.parse(response);
      const sessions = result.sessions || result || [];
      
      // Ensure we return properly structured sessions
      return Array.isArray(sessions) ? sessions.map((session, index) => ({
        sessionIndex: (weekNumber - 1) * sessionsPerWeek + index + 1,
        weekNumber,
        title: session.title || `Week ${weekNumber}, Session ${index + 1}`,
        sessionType: session.sessionType || 'skill_building',
        durationMinutes: 90,
        learningGoals: Array.isArray(session.learningGoals) ? session.learningGoals : [`Improve ${weeklyFocus.skills[0]} skills`],
        grammarTopics: Array.isArray(session.grammarTopics) ? session.grammarTopics : [],
        vocabularyThemes: Array.isArray(session.vocabularyThemes) ? session.vocabularyThemes : [],
        keyPhrases: Array.isArray(session.keyPhrases) ? session.keyPhrases : [],
        flashcardSets: Array.isArray(session.flashcardSets) ? session.flashcardSets : [],
        homeworkTasks: Array.isArray(session.homeworkTasks) ? session.homeworkTasks : [],
        practiceExercises: Array.isArray(session.practiceExercises) ? session.practiceExercises : []
      })) : [];

    } catch (error) {
      console.error('AI session generation error:', error);
      // Return fallback sessions if AI fails
      return this.getFallbackSessions(weekNumber, sessionsPerWeek, skillGaps, request.exam);
    }
  }

  /**
   * Save generated sessions to database
   */
  private async saveSessions(planId: number, sessions: SessionPlan[]): Promise<SessionPlan[]> {
    const savedSessions: SessionPlan[] = [];
    
    for (const session of sessions) {
      const sessionData: RoadmapSessionInsert = {
        planId,
        sessionIndex: session.sessionIndex,
        weekNumber: session.weekNumber,
        title: session.title,
        sessionType: session.sessionType,
        durationMinutes: session.durationMinutes,
        learningGoals: session.learningGoals,
        grammarTopics: session.grammarTopics,
        vocabularyThemes: session.vocabularyThemes,
        keyPhrases: session.keyPhrases,
        flashcardSets: session.flashcardSets,
        homeworkTasks: session.homeworkTasks,
        practiceExercises: session.practiceExercises,
      };
      
      const saved = await storage.createRoadmapSession(sessionData);
      savedSessions.push({
        sessionIndex: saved.sessionIndex,
        weekNumber: saved.weekNumber,
        title: saved.title,
        sessionType: saved.sessionType,
        durationMinutes: saved.durationMinutes,
        learningGoals: saved.learningGoals || [],
        grammarTopics: saved.grammarTopics || [],
        vocabularyThemes: saved.vocabularyThemes || [],
        keyPhrases: saved.keyPhrases || [],
        flashcardSets: saved.flashcardSets || [],
        homeworkTasks: saved.homeworkTasks || [],
        practiceExercises: saved.practiceExercises || []
      });
    }
    
    return savedSessions;
  }

  // Helper methods for exam-specific content generation

  private getExamSpecificDetails(exam: ExamTypeValues) {
    switch (exam) {
      case ExamType.IELTS_ACADEMIC:
        return {
          requirements: 'Academic writing (Task 1: graph/chart description, Task 2: essay), Academic reading, Listening with academic contexts, Speaking with formal register',
          taskTypes: ['Task 1 Academic Writing', 'Task 2 Essay Writing', 'Academic Reading', 'Academic Listening', 'Formal Speaking']
        };
      case ExamType.IELTS_GENERAL:
        return {
          requirements: 'General writing (Task 1: letter writing, Task 2: opinion essay), General reading, Listening, Speaking',
          taskTypes: ['Letter Writing', 'Opinion Essays', 'General Reading', 'General Listening', 'Conversational Speaking']
        };
      case ExamType.TOEFL_IBT:
        return {
          requirements: 'Integrated tasks combining reading+listening+writing/speaking, Independent tasks, Academic context',
          taskTypes: ['Integrated Writing', 'Independent Writing', 'Integrated Speaking', 'Independent Speaking', 'Academic Reading', 'Academic Listening']
        };
      case ExamType.PTE_ACADEMIC:
        return {
          requirements: 'Computer-based tasks, Integrated skills, Academic content, Automated scoring',
          taskTypes: ['Summarize Written Text', 'Essay Writing', 'Re-tell Lecture', 'Answer Short Questions', 'Fill in the Blanks']
        };
      default:
        return {
          requirements: 'General English proficiency with focus on all four skills',
          taskTypes: ['Reading Comprehension', 'Listening Tasks', 'Writing Practice', 'Speaking Activities']
        };
    }
  }

  private getWeeklyFocus(weekNumber: number, skillGaps: ExamSkillGap[], exam: ExamTypeValues) {
    // Rotate focus based on skill priorities and exam progression
    const highPrioritySkills = skillGaps.filter(gap => gap.priority === 'high').map(gap => gap.skill);
    const allSkills = skillGaps.map(gap => gap.skill);
    
    const themes = [
      { theme: 'Foundation Building', skills: highPrioritySkills.length > 0 ? highPrioritySkills : ['reading', 'listening'] },
      { theme: 'Test Format Familiarization', skills: ['writing', 'speaking'] },
      { theme: 'Skill Integration', skills: allSkills },
      { theme: 'Test Strategies', skills: highPrioritySkills.length > 0 ? highPrioritySkills : ['writing', 'reading'] }
    ];
    
    return themes[(weekNumber - 1) % themes.length];
  }

  private analyzeSkillPriorities(mstResults: MstResult, focusAreas?: string[]) {
    const priorities: Record<string, number> = {};
    
    // Base priorities on MST performance
    for (const skill of mstResults.skills) {
      const score = (skill.stage1Score + (skill.stage2Score || 0)) / 2;
      priorities[skill.skill] = score < 60 ? 3 : score < 75 ? 2 : 1; // 3 = high priority
    }
    
    // Boost priority for focus areas
    if (focusAreas) {
      for (const area of focusAreas) {
        if (priorities[area]) {
          priorities[area] = Math.min(priorities[area] + 1, 3);
        }
      }
    }
    
    return priorities;
  }

  private generateWeeklyBreakdown(exam: ExamTypeValues, weeks: number, skillPriorities: Record<string, number>) {
    const breakdown = [];
    const themes = this.getProgressionThemes(exam);
    
    for (let week = 1; week <= weeks; week++) {
      const themeIndex = Math.floor((week - 1) / (weeks / themes.length));
      const theme = themes[Math.min(themeIndex, themes.length - 1)];
      
      breakdown.push({
        week,
        theme: theme.name,
        skills: theme.skills,
        testingFocus: theme.focus
      });
    }
    
    return breakdown;
  }

  private getProgressionThemes(exam: ExamTypeValues) {
    switch (exam) {
      case ExamType.IELTS_ACADEMIC:
        return [
          { name: 'Academic Foundation', skills: ['reading', 'listening'], focus: 'Comprehension strategies' },
          { name: 'Writing Development', skills: ['writing'], focus: 'Task 1 & 2 structure' },
          { name: 'Speaking Fluency', skills: ['speaking'], focus: 'Formal discussion skills' },
          { name: 'Test Integration', skills: ['reading', 'writing', 'listening', 'speaking'], focus: 'Full test practice' }
        ];
      default:
        return [
          { name: 'Foundation Skills', skills: ['reading', 'listening'], focus: 'Core comprehension' },
          { name: 'Production Skills', skills: ['writing', 'speaking'], focus: 'Expression and fluency' },
          { name: 'Integration Practice', skills: ['reading', 'writing', 'listening', 'speaking'], focus: 'Combined skills' },
          { name: 'Test Mastery', skills: ['reading', 'writing', 'listening', 'speaking'], focus: 'Test strategies' }
        ];
    }
  }

  private generateMilestones(weeks: number, targetScore: number, exam: ExamTypeValues) {
    const milestones = [];
    const milestoneWeeks = [Math.floor(weeks * 0.25), Math.floor(weeks * 0.5), Math.floor(weeks * 0.75), weeks];
    const scoreProgression = [
      targetScore * 0.6,
      targetScore * 0.75,
      targetScore * 0.9,
      targetScore
    ];
    
    const titles = [
      'Foundation Assessment',
      'Midpoint Evaluation',
      'Pre-Test Preparation',
      'Target Achievement'
    ];
    
    for (let i = 0; i < milestoneWeeks.length; i++) {
      milestones.push({
        week: milestoneWeeks[i],
        title: titles[i],
        description: `Achieve ${Math.round(scoreProgression[i])} score in practice ${exam} test`,
        targetScore: Math.round(scoreProgression[i])
      });
    }
    
    return milestones;
  }

  private calculateSkillImprovement(current: CEFRLevelValues, target: CEFRLevelValues, skill: string, exam: ExamTypeValues): string {
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levelOrder.indexOf(current);
    const targetIndex = levelOrder.indexOf(target);
    
    if (targetIndex <= currentIndex) {
      return 'Maintain current proficiency with exam-specific practice';
    }
    
    const levelGap = targetIndex - currentIndex;
    const examFocus = this.getExamSpecificFocus(skill, exam);
    
    return `Improve ${levelGap} CEFR level(s) focusing on ${examFocus}`;
  }

  private getExamSpecificFocus(skill: string, exam: ExamTypeValues): string {
    const focuses: Record<string, Record<string, string>> = {
      [ExamType.IELTS_ACADEMIC]: {
        writing: 'Task 1 data description and Task 2 argumentative essays',
        reading: 'academic texts and complex question types',
        listening: 'academic lectures and discussions',
        speaking: 'formal register and extended responses'
      },
      [ExamType.TOEFL_IBT]: {
        writing: 'integrated and independent tasks',
        reading: 'academic passages with inference questions',
        listening: 'lectures and conversations with note-taking',
        speaking: 'integrated responses and personal opinions'
      }
    };
    
    return focuses[exam]?.[skill] || `${skill} proficiency`;
  }

  private calculateScoreGap(stage1Score: number, stage2Score: number): number {
    return Math.max(0, 100 - Math.max(stage1Score, stage2Score));
  }

  private determineSkillPriority(skill: SkillResult, focusAreas?: string[]): 'high' | 'medium' | 'low' {
    const avgScore = (skill.stage1Score + (skill.stage2Score || 0)) / 2;
    
    // High priority if low score or in focus areas
    if (avgScore < 50 || focusAreas?.includes(skill.skill)) {
      return 'high';
    }
    
    // Medium priority if moderate score
    if (avgScore < 70) {
      return 'medium';
    }
    
    return 'low';
  }

  private identifyExamWeaknesses(skill: SkillResult, exam: ExamTypeValues): string[] {
    const weaknesses: Record<string, Record<string, string[]>> = {
      [ExamType.IELTS_ACADEMIC]: {
        writing: ['Task 1 trend language', 'Task 2 argument structure', 'formal register'],
        reading: ['academic vocabulary', 'inference questions', 'time management'],
        listening: ['academic contexts', 'note-taking skills', 'speaker identification'],
        speaking: ['formal discourse markers', 'extended responses', 'topic development']
      }
    };
    
    const examWeaknesses = weaknesses[exam]?.[skill.skill] || [];
    const scoreBasedWeaknesses = skill.stage1Score < 60 ? ['foundation level gaps'] : skill.stage1Score < 75 ? ['intermediate challenges'] : ['advanced refinement'];
    
    return [...examWeaknesses, ...scoreBasedWeaknesses];
  }

  private getFallbackSessions(weekNumber: number, sessionsPerWeek: number, skillGaps: ExamSkillGap[], exam: ExamTypeValues): SessionPlan[] {
    const sessions: SessionPlan[] = [];
    const skills = skillGaps.map(gap => gap.skill);
    
    for (let i = 0; i < sessionsPerWeek; i++) {
      const skill = skills[i % skills.length];
      const sessionIndex = (weekNumber - 1) * sessionsPerWeek + i + 1;
      
      sessions.push({
        sessionIndex,
        weekNumber,
        title: `Week ${weekNumber}: ${skill.charAt(0).toUpperCase() + skill.slice(1)} Focus`,
        sessionType: 'skill_building',
        durationMinutes: 90,
        learningGoals: [`Improve ${skill} skills for ${exam}`],
        grammarTopics: [],
        vocabularyThemes: [`${skill} vocabulary`],
        keyPhrases: [],
        flashcardSets: [],
        homeworkTasks: [`Practice ${skill} exercises`],
        practiceExercises: [`${exam} ${skill} tasks`]
      });
    }
    
    return sessions;
  }

  // Mock methods for MST data retrieval (to be replaced with actual storage calls)
  private async getMSTSessionById(sessionId: string): Promise<any> {
    // TODO: Implement actual MST session retrieval
    return { userId: 1, sessionId };
  }

  private async getMSTResults(sessionId: string): Promise<MstResult | null> {
    // TODO: Implement actual MST results retrieval from database
    // For now, return mock data structure
    return {
      sessionId,
      overallBand: 'B2',
      overallConfidence: 0.85,
      skills: [
        { skill: 'reading', band: 'B2', confidence: 0.9, stage1Score: 75, stage2Score: 80, route: 'stay', timeSpentSec: 300 },
        { skill: 'writing', band: 'B1', confidence: 0.7, stage1Score: 65, stage2Score: 70, route: 'up', timeSpentSec: 400 },
        { skill: 'listening', band: 'B2', confidence: 0.85, stage1Score: 78, stage2Score: 82, route: 'stay', timeSpentSec: 280 },
        { skill: 'speaking', band: 'B1', confidence: 0.6, stage1Score: 60, stage2Score: 65, route: 'up', timeSpentSec: 350 }
      ],
      totalTimeMin: 22,
      completedAt: new Date(),
      recommendations: ['Focus on writing structure', 'Improve speaking fluency']
    };
  }
}