// ============================================================================
// TEST ASSEMBLY ENGINE
// ============================================================================
// Module for assembling questions into tests based on templates and rules

import { 
  UnifiedQuestion, 
  UnifiedTestTemplate, 
  UnifiedTestSession,
  QuestionType, 
  Skill, 
  CEFRLevel,
  TestType,
  CEFR_LEVELS,
  SKILLS
} from './unified-testing-schema';

// Assembly configuration interface
export interface AssemblyConfig {
  templateId: number;
  userId: number;
  sessionType: TestType;
  randomSeed?: number;
  overrides?: {
    timeLimit?: number;
    questionCount?: number;
    skillWeights?: { [key in Skill]?: number };
    difficultyTarget?: CEFRLevel;
  };
}

// Assembled test structure
export interface AssembledTest {
  sessionId: string;
  template: UnifiedTestTemplate;
  sections: AssembledSection[];
  totalQuestions: number;
  estimatedDuration: number;
  adaptiveConfig?: AdaptiveConfig;
  metadata: {
    assembledAt: Date;
    assemblyRules: any;
    randomSeed?: number;
  };
}

// Assembled section structure
export interface AssembledSection {
  id: string;
  name: string;
  description?: string;
  skill: Skill;
  questions: UnifiedQuestion[];
  timeLimit?: number;
  passingScore?: number;
  weight?: number;
  instructions?: string;
  questionOrder: number[];
}

// Adaptive configuration
export interface AdaptiveConfig {
  enabled: boolean;
  initialDifficulty: CEFRLevel;
  confidenceThreshold: number;
  maxQuestions: number;
  minQuestions: number;
  skillInteractionRules: { [key in Skill]?: any };
}

// Question selection criteria
export interface SelectionCriteria {
  skill: Skill;
  questionTypes?: QuestionType[];
  cefrLevels?: CEFRLevel[];
  count: number;
  difficultyDistribution?: { [level in CEFRLevel]?: number };
  excludeUsed?: boolean;
  qualityThreshold?: number;
}

// ============================================================================
// MAIN ASSEMBLY FUNCTION
// ============================================================================

export async function assembleTest(
  config: AssemblyConfig,
  template: UnifiedTestTemplate,
  availableQuestions: UnifiedQuestion[]
): Promise<AssembledTest> {
  
  // Initialize random seed for reproducible assembly
  if (config.randomSeed) {
    // Set up deterministic randomization
    seedRandom(config.randomSeed);
  }
  
  // Assemble sections based on template
  const assembledSections: AssembledSection[] = [];
  
  for (const sectionTemplate of template.sections) {
    const assembledSection = await assembleSection(
      sectionTemplate,
      availableQuestions,
      template.assemblyRules || {},
      config.overrides
    );
    assembledSections.push(assembledSection);
  }
  
  // Calculate total duration
  const totalDuration = assembledSections.reduce((total, section) => {
    return total + (section.timeLimit || 0);
  }, 0);
  
  // Set up adaptive configuration if enabled
  let adaptiveConfig: AdaptiveConfig | undefined;
  if (template.assemblyRules?.adaptiveDifficulty) {
    adaptiveConfig = {
      enabled: true,
      initialDifficulty: 'B1', // Default starting level
      confidenceThreshold: template.assemblyRules.terminationCriteria?.confidenceThreshold || 0.8,
      maxQuestions: template.assemblyRules.terminationCriteria?.maxQuestions || 50,
      minQuestions: 10,
      skillInteractionRules: template.assemblyRules.skillProgressionRules || {}
    };
  }
  
  return {
    sessionId: generateSessionId(),
    template,
    sections: assembledSections,
    totalQuestions: assembledSections.reduce((total, section) => total + section.questions.length, 0),
    estimatedDuration: totalDuration,
    adaptiveConfig,
    metadata: {
      assembledAt: new Date(),
      assemblyRules: template.assemblyRules,
      randomSeed: config.randomSeed
    }
  };
}

// ============================================================================
// SECTION ASSEMBLY
// ============================================================================

async function assembleSection(
  sectionTemplate: any,
  availableQuestions: UnifiedQuestion[],
  assemblyRules: any,
  overrides?: any
): Promise<AssembledSection> {
  
  // Filter questions for this section
  const sectionQuestions = availableQuestions.filter(question => 
    question.skill === sectionTemplate.skill &&
    (!sectionTemplate.questionTypes || sectionTemplate.questionTypes.includes(question.questionType)) &&
    question.isActive
  );
  
  // Apply difficulty distribution if specified
  let selectedQuestions: UnifiedQuestion[] = [];
  
  if (sectionTemplate.questionSelection === 'adaptive') {
    selectedQuestions = selectAdaptiveQuestions(sectionQuestions, sectionTemplate);
  } else if (sectionTemplate.difficultyDistribution) {
    selectedQuestions = selectByDifficultyDistribution(
      sectionQuestions, 
      sectionTemplate.questionCount,
      sectionTemplate.difficultyDistribution
    );
  } else if (sectionTemplate.questionSelection === 'random') {
    selectedQuestions = selectRandomQuestions(sectionQuestions, sectionTemplate.questionCount);
  } else {
    // Sequential selection
    selectedQuestions = selectSequentialQuestions(sectionQuestions, sectionTemplate.questionCount);
  }
  
  // Apply randomization if specified
  let questionOrder: number[] = [];
  if (assemblyRules.randomizeQuestions) {
    questionOrder = shuffleArray([...Array(selectedQuestions.length).keys()]);
  } else {
    questionOrder = [...Array(selectedQuestions.length).keys()];
  }
  
  return {
    id: sectionTemplate.id,
    name: sectionTemplate.name,
    description: sectionTemplate.description,
    skill: sectionTemplate.skill,
    questions: selectedQuestions,
    timeLimit: overrides?.timeLimit || sectionTemplate.timeLimit,
    passingScore: sectionTemplate.passingScore,
    weight: sectionTemplate.weight,
    questionOrder
  };
}

// ============================================================================
// QUESTION SELECTION STRATEGIES
// ============================================================================

function selectByDifficultyDistribution(
  questions: UnifiedQuestion[],
  totalCount: number,
  distribution: { [level in CEFRLevel]?: number }
): UnifiedQuestion[] {
  const selected: UnifiedQuestion[] = [];
  
  for (const [level, percentage] of Object.entries(distribution)) {
    const count = Math.round((percentage / 100) * totalCount);
    const levelQuestions = questions.filter(q => q.cefrLevel === level);
    
    const selectedFromLevel = selectRandomQuestions(levelQuestions, count);
    selected.push(...selectedFromLevel);
  }
  
  // If we don't have enough questions, fill with random selection
  const remaining = totalCount - selected.length;
  if (remaining > 0) {
    const unusedQuestions = questions.filter(q => !selected.includes(q));
    const additionalQuestions = selectRandomQuestions(unusedQuestions, remaining);
    selected.push(...additionalQuestions);
  }
  
  return selected.slice(0, totalCount);
}

function selectRandomQuestions(
  questions: UnifiedQuestion[],
  count: number
): UnifiedQuestion[] {
  const shuffled = shuffleArray([...questions]);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function selectSequentialQuestions(
  questions: UnifiedQuestion[],
  count: number
): UnifiedQuestion[] {
  // Sort by difficulty level first, then by creation date
  const sorted = questions.sort((a, b) => {
    const levelOrder = CEFR_LEVELS.indexOf(a.cefrLevel) - CEFR_LEVELS.indexOf(b.cefrLevel);
    if (levelOrder !== 0) return levelOrder;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  
  return sorted.slice(0, Math.min(count, sorted.length));
}

function selectAdaptiveQuestions(
  questions: UnifiedQuestion[],
  sectionTemplate: any
): UnifiedQuestion[] {
  // For adaptive selection, start with initial difficulty and build question pool
  const initialLevel = 'B1'; // Default starting level
  const questionPool: UnifiedQuestion[] = [];
  
  // Create pools for each difficulty level
  const levelPools: { [key in CEFRLevel]: UnifiedQuestion[] } = {
    A1: questions.filter(q => q.cefrLevel === 'A1'),
    A2: questions.filter(q => q.cefrLevel === 'A2'),
    B1: questions.filter(q => q.cefrLevel === 'B1'),
    B2: questions.filter(q => q.cefrLevel === 'B2'),
    C1: questions.filter(q => q.cefrLevel === 'C1'),
    C2: questions.filter(q => q.cefrLevel === 'C2')
  };
  
  // Select questions from each level for adaptive testing
  for (const level of CEFR_LEVELS) {
    const levelQuestions = selectRandomQuestions(levelPools[level], 10); // 10 questions per level
    questionPool.push(...levelQuestions);
  }
  
  return questionPool;
}

// ============================================================================
// ADAPTIVE TEST MANAGEMENT
// ============================================================================

export class AdaptiveTestManager {
  private currentLevel: CEFRLevel = 'B1';
  private confidenceScore: number = 0;
  private questionsAsked: number = 0;
  private correctAnswers: number = 0;
  private config: AdaptiveConfig;
  
  constructor(config: AdaptiveConfig) {
    this.config = config;
    this.currentLevel = config.initialDifficulty;
  }
  
  getNextQuestion(availableQuestions: UnifiedQuestion[]): UnifiedQuestion | null {
    if (this.shouldTerminate()) {
      return null;
    }
    
    // Filter questions by current difficulty level
    const levelQuestions = availableQuestions.filter(q => 
      q.cefrLevel === this.currentLevel && q.isActive
    );
    
    if (levelQuestions.length === 0) {
      // No questions at current level, try adjacent levels
      const adjacentQuestions = this.getAdjacentLevelQuestions(availableQuestions);
      if (adjacentQuestions.length === 0) {
        return null;
      }
      return adjacentQuestions[Math.floor(Math.random() * adjacentQuestions.length)];
    }
    
    // Select random question from current level
    return levelQuestions[Math.floor(Math.random() * levelQuestions.length)];
  }
  
  processResponse(isCorrect: boolean, responseTime: number): void {
    this.questionsAsked++;
    if (isCorrect) {
      this.correctAnswers++;
    }
    
    // Update difficulty level based on performance
    const accuracy = this.correctAnswers / this.questionsAsked;
    
    if (isCorrect && accuracy > 0.8) {
      // Move to higher difficulty
      this.moveToNextLevel('up');
    } else if (!isCorrect && accuracy < 0.4) {
      // Move to lower difficulty
      this.moveToNextLevel('down');
    }
    
    // Update confidence score
    this.updateConfidenceScore(isCorrect, responseTime);
  }
  
  private shouldTerminate(): boolean {
    return this.questionsAsked >= this.config.maxQuestions ||
           this.confidenceScore >= this.config.confidenceThreshold ||
           this.questionsAsked >= this.config.minQuestions && this.confidenceScore > 0.6;
  }
  
  private moveToNextLevel(direction: 'up' | 'down'): void {
    const currentIndex = CEFR_LEVELS.indexOf(this.currentLevel);
    
    if (direction === 'up' && currentIndex < CEFR_LEVELS.length - 1) {
      this.currentLevel = CEFR_LEVELS[currentIndex + 1];
    } else if (direction === 'down' && currentIndex > 0) {
      this.currentLevel = CEFR_LEVELS[currentIndex - 1];
    }
  }
  
  private updateConfidenceScore(isCorrect: boolean, responseTime: number): void {
    // Simple confidence calculation - could be enhanced with more sophisticated algorithms
    const baseConfidence = isCorrect ? 0.1 : -0.05;
    const timeBonus = responseTime < 30000 ? 0.02 : 0; // Bonus for quick correct answers
    
    this.confidenceScore = Math.max(0, Math.min(1, 
      this.confidenceScore + baseConfidence + timeBonus
    ));
  }
  
  private getAdjacentLevelQuestions(availableQuestions: UnifiedQuestion[]): UnifiedQuestion[] {
    const currentIndex = CEFR_LEVELS.indexOf(this.currentLevel);
    const adjacentLevels: CEFRLevel[] = [];
    
    if (currentIndex > 0) {
      adjacentLevels.push(CEFR_LEVELS[currentIndex - 1]);
    }
    if (currentIndex < CEFR_LEVELS.length - 1) {
      adjacentLevels.push(CEFR_LEVELS[currentIndex + 1]);
    }
    
    return availableQuestions.filter(q => 
      adjacentLevels.includes(q.cefrLevel) && q.isActive
    );
  }
  
  getFinalResults(): {
    level: CEFRLevel;
    confidence: number;
    questionsAsked: number;
    accuracy: number;
  } {
    return {
      level: this.currentLevel,
      confidence: this.confidenceScore,
      questionsAsked: this.questionsAsked,
      accuracy: this.correctAnswers / Math.max(1, this.questionsAsked)
    };
  }
}

// ============================================================================
// TEST VALIDATION
// ============================================================================

export function validateAssembledTest(assembledTest: AssembledTest): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if test has sections
  if (assembledTest.sections.length === 0) {
    errors.push('Test must have at least one section');
  }
  
  // Check if sections have questions
  for (const section of assembledTest.sections) {
    if (section.questions.length === 0) {
      errors.push(`Section '${section.name}' has no questions`);
    }
    
    // Check question quality
    const lowQualityQuestions = section.questions.filter(q => 
      (q.correctAnswerRate || 0) < 0.3
    );
    
    if (lowQualityQuestions.length > 0) {
      warnings.push(`Section '${section.name}' has ${lowQualityQuestions.length} low-quality questions`);
    }
  }
  
  // Check total duration
  if (assembledTest.estimatedDuration > 240) { // 4 hours
    warnings.push('Test duration exceeds 4 hours, consider splitting into multiple sessions');
  }
  
  // Check question distribution
  const skillCounts: { [key in Skill]?: number } = {};
  for (const section of assembledTest.sections) {
    skillCounts[section.skill] = (skillCounts[section.skill] || 0) + section.questions.length;
  }
  
  const totalQuestions = Object.values(skillCounts).reduce((sum, count) => sum + count, 0);
  for (const [skill, count] of Object.entries(skillCounts)) {
    const percentage = (count / totalQuestions) * 100;
    if (percentage > 60) {
      warnings.push(`Skill '${skill}' represents ${percentage.toFixed(1)}% of questions - consider balancing`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

let seedValue = 1;
function seedRandom(seed: number): void {
  seedValue = seed;
  // Override Math.random for deterministic results
  Math.random = function() {
    const x = Math.sin(seedValue++) * 10000;
    return x - Math.floor(x);
  };
}

// ============================================================================
// PRESET TEMPLATES
// ============================================================================

export const PRESET_TEMPLATES = {
  IELTS_ACADEMIC: {
    name: 'IELTS Academic Test',
    sections: [
      {
        id: 'listening',
        name: 'Listening',
        skill: 'listening' as Skill,
        timeLimit: 40,
        questionCount: 40,
        questionTypes: ['multiple_choice', 'fill_blank', 'matching'],
        weight: 0.25
      },
      {
        id: 'reading',
        name: 'Reading',
        skill: 'reading' as Skill,
        timeLimit: 60,
        questionCount: 40,
        questionTypes: ['multiple_choice', 'true_false', 'matching'],
        weight: 0.25
      },
      {
        id: 'writing',
        name: 'Writing',
        skill: 'writing' as Skill,
        timeLimit: 60,
        questionCount: 2,
        questionTypes: ['essay'],
        weight: 0.25
      },
      {
        id: 'speaking',
        name: 'Speaking',
        skill: 'speaking' as Skill,
        timeLimit: 15,
        questionCount: 3,
        questionTypes: ['speaking'],
        weight: 0.25
      }
    ]
  },
  
  GRE_VERBAL: {
    name: 'GRE Verbal Reasoning',
    sections: [
      {
        id: 'text_completion',
        name: 'Text Completion',
        skill: 'reading' as Skill,
        timeLimit: 30,
        questionCount: 6,
        questionTypes: ['text_completion_multiple_blanks'],
        weight: 0.5
      },
      {
        id: 'sentence_equivalence',
        name: 'Sentence Equivalence',
        skill: 'vocabulary' as Skill,
        timeLimit: 30,
        questionCount: 4,
        questionTypes: ['sentence_equivalence'],
        weight: 0.25
      },
      {
        id: 'reading_comprehension',
        name: 'Reading Comprehension',
        skill: 'reading' as Skill,
        timeLimit: 30,
        questionCount: 10,
        questionTypes: ['multiple_choice', 'multiple_choice_multiple_answers'],
        weight: 0.25
      }
    ]
  },
  
  TOEFL_IBT: {
    name: 'TOEFL iBT',
    sections: [
      {
        id: 'reading',
        name: 'Reading',
        skill: 'reading' as Skill,
        timeLimit: 54,
        questionCount: 30,
        questionTypes: ['multiple_choice', 'coherence_insertion'],
        weight: 0.25
      },
      {
        id: 'listening',
        name: 'Listening',
        skill: 'listening' as Skill,
        timeLimit: 41,
        questionCount: 28,
        questionTypes: ['multiple_choice'],
        weight: 0.25
      },
      {
        id: 'speaking',
        name: 'Speaking',
        skill: 'speaking' as Skill,
        timeLimit: 17,
        questionCount: 4,
        questionTypes: ['speaking'],
        weight: 0.25
      },
      {
        id: 'writing',
        name: 'Writing',
        skill: 'writing' as Skill,
        timeLimit: 50,
        questionCount: 2,
        questionTypes: ['essay'],
        weight: 0.25
      }
    ]
  }
};