// ============================================================================
// AI GENERATION ENGINE
// ============================================================================
// Automated question creation with anti-plagiarism and variation generation

import { 
  UnifiedQuestion, 
  AiGenerationTemplate,
  QuestionType, 
  Skill, 
  CEFRLevel,
  QUESTION_TYPES,
  SKILLS,
  CEFR_LEVELS 
} from './unified-testing-schema';

// Generation request interface
export interface GenerationRequest {
  templateId?: number;
  questionType: QuestionType;
  skill: Skill;
  cefrLevel: CEFRLevel;
  language: string;
  count?: number;
  difficulty?: number; // 1-5 scale within CEFR level
  sourceContent?: string; // Source material to base questions on
  variationCount?: number; // Number of anti-plagiarism variations
  requirements?: {
    topics?: string[];
    vocabulary?: string[];
    grammarPoints?: string[];
    contextualThemes?: string[];
  };
  customPrompt?: string;
}

// Generation result interface
export interface GenerationResult {
  questions: GeneratedQuestion[];
  metadata: {
    generatedAt: Date;
    templateUsed?: string;
    aiModel: string;
    processingTime: number;
    qualityScore: number;
    variationsCreated: number;
  };
  errors?: string[];
  warnings?: string[];
}

// Generated question interface (before database insertion)
export interface GeneratedQuestion {
  questionType: QuestionType;
  skill: Skill;
  cefrLevel: CEFRLevel;
  language: string;
  title: string;
  instructions: string;
  content: any; // Question-specific content
  responseType: string;
  expectedDurationSeconds: number;
  scoringMethod: string;
  maxScore: number;
  evaluationRules: any;
  variations?: GeneratedQuestion[]; // Anti-plagiarism variations
  qualityMetrics: {
    contentQuality: number; // 1-5
    difficultyAlignment: number; // 1-5
    languageAccuracy: number; // 1-5
    pedagogicalValue: number; // 1-5
    overall: number; // 1-5
  };
  aiMetadata: {
    model: string;
    prompt: string;
    temperature: number;
    generationAttempts: number;
    reviewRequired: boolean;
  };
}

// ============================================================================
// MAIN GENERATION FUNCTIONS
// ============================================================================

export async function generateQuestions(
  request: GenerationRequest,
  templates: AiGenerationTemplate[] = []
): Promise<GenerationResult> {
  const startTime = Date.now();
  
  try {
    // Find or create appropriate template
    const template = findBestTemplate(request, templates) || 
                    await createDefaultTemplate(request);
    
    // Generate base questions
    const baseQuestions = await generateBaseQuestions(request, template);
    
    // Create variations for anti-plagiarism
    const questionsWithVariations = await createVariations(
      baseQuestions, 
      request.variationCount || 2
    );
    
    // Validate and score quality
    const validatedQuestions = await validateGeneratedQuestions(questionsWithVariations);
    
    const processingTime = Date.now() - startTime;
    
    return {
      questions: validatedQuestions,
      metadata: {
        generatedAt: new Date(),
        templateUsed: template.name,
        aiModel: template.parameters?.model || 'gpt-4',
        processingTime,
        qualityScore: calculateAverageQuality(validatedQuestions),
        variationsCreated: validatedQuestions.reduce((sum, q) => sum + (q.variations?.length || 0), 0)
      },
      errors: [],
      warnings: []
    };
  } catch (error) {
    console.error('Question generation failed:', error);
    
    return {
      questions: [],
      metadata: {
        generatedAt: new Date(),
        aiModel: 'unknown',
        processingTime: Date.now() - startTime,
        qualityScore: 0,
        variationsCreated: 0
      },
      errors: [error.message || 'Unknown generation error']
    };
  }
}

// ============================================================================
// QUESTION TYPE GENERATORS
// ============================================================================

async function generateBaseQuestions(
  request: GenerationRequest,
  template: AiGenerationTemplate
): Promise<GeneratedQuestion[]> {
  const questions: GeneratedQuestion[] = [];
  const count = request.count || 1;
  
  for (let i = 0; i < count; i++) {
    let question: GeneratedQuestion;
    
    switch (request.questionType) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        question = await generateMultipleChoiceQuestion(request, template);
        break;
      
      case QUESTION_TYPES.MULTIPLE_CHOICE_MULTIPLE_ANSWERS:
        question = await generateMultipleChoiceMultipleAnswersQuestion(request, template);
        break;
      
      case QUESTION_TYPES.MAP_DIAGRAM_LABELING:
        question = await generateMapDiagramLabelingQuestion(request, template);
        break;
      
      case QUESTION_TYPES.TEXT_COMPLETION_MULTIPLE_BLANKS:
        question = await generateTextCompletionQuestion(request, template);
        break;
      
      case QUESTION_TYPES.SENTENCE_EQUIVALENCE:
        question = await generateSentenceEquivalenceQuestion(request, template);
        break;
      
      case QUESTION_TYPES.COHERENCE_INSERTION:
        question = await generateCoherenceInsertionQuestion(request, template);
        break;
      
      case QUESTION_TYPES.FILL_BLANKS_DRAG_DROP:
        question = await generateFillBlanksDragDropQuestion(request, template);
        break;
      
      case QUESTION_TYPES.DATA_SUFFICIENCY:
        question = await generateDataSufficiencyQuestion(request, template);
        break;
      
      case QUESTION_TYPES.SENTENCE_CORRECTION:
        question = await generateSentenceCorrectionQuestion(request, template);
        break;
      
      case QUESTION_TYPES.TWO_PART_ANALYSIS:
        question = await generateTwoPartAnalysisQuestion(request, template);
        break;
      
      case QUESTION_TYPES.READ_ALOUD:
      case QUESTION_TYPES.REPEAT_SENTENCE:
        question = await generateReadAloudQuestion(request, template);
        break;
      
      case QUESTION_TYPES.DESCRIBE_IMAGE:
        question = await generateDescribeImageQuestion(request, template);
        break;
      
      default:
        throw new Error(`Unsupported question type for AI generation: ${request.questionType}`);
    }
    
    questions.push(question);
  }
  
  return questions;
}

// ============================================================================
// SPECIFIC QUESTION GENERATORS
// ============================================================================

async function generateMultipleChoiceQuestion(
  request: GenerationRequest,
  template: AiGenerationTemplate
): Promise<GeneratedQuestion> {
  const prompt = buildPrompt(request, template, `
    Create a multiple choice question for ${request.skill} at ${request.cefrLevel} level.
    The question should test understanding of the given content.
    
    Provide:
    1. A clear question stem
    2. 4 options (A, B, C, D) with only one correct answer
    3. The correct answer
    4. Brief explanation
    
    Format as JSON with fields: question, options, correctAnswer, explanation
  `);
  
  const aiResponse = await callAIService(prompt, template.parameters);
  const parsed = parseAIResponse(aiResponse);
  
  return {
    questionType: request.questionType,
    skill: request.skill,
    cefrLevel: request.cefrLevel,
    language: request.language,
    title: `Multiple Choice - ${request.skill}`,
    instructions: "Choose the best answer.",
    content: {
      text: parsed.question,
      options: parsed.options.map((option: string, index: number) => ({
        id: String.fromCharCode(65 + index), // A, B, C, D
        text: option
      })),
      correctAnswers: [parsed.correctAnswer],
      explanation: parsed.explanation
    },
    responseType: "multiple_choice",
    expectedDurationSeconds: 60,
    scoringMethod: "exact_match",
    maxScore: 100,
    evaluationRules: {
      ignoreCasing: false,
      strictMatch: true
    },
    qualityMetrics: assessQuestionQuality(parsed, request),
    aiMetadata: {
      model: template.parameters?.model || 'gpt-4',
      prompt,
      temperature: template.parameters?.temperature || 0.7,
      generationAttempts: 1,
      reviewRequired: false
    }
  };
}

async function generateTextCompletionQuestion(
  request: GenerationRequest,
  template: AiGenerationTemplate
): Promise<GeneratedQuestion> {
  const prompt = buildPrompt(request, template, `
    Create a text completion question with multiple blanks for ${request.skill} at ${request.cefrLevel} level.
    
    Provide:
    1. A passage with 2-3 blanks marked as [blank1], [blank2], etc.
    2. For each blank, provide 3-5 options with one correct answer
    3. Brief explanation for each correct answer
    
    Format as JSON with fields: passage, blanks (array with blankId, options, correctOption, explanation)
  `);
  
  const aiResponse = await callAIService(prompt, template.parameters);
  const parsed = parseAIResponse(aiResponse);
  
  return {
    questionType: request.questionType,
    skill: request.skill,
    cefrLevel: request.cefrLevel,
    language: request.language,
    title: `Text Completion - ${request.skill}`,
    instructions: "Choose the best word or phrase to complete each blank.",
    content: {
      passage: parsed.passage,
      blankOptions: parsed.blanks.map((blank: any) => ({
        blankId: blank.blankId,
        options: blank.options,
        correctOption: blank.correctOption,
        explanation: blank.explanation
      }))
    },
    responseType: "multiple_choice",
    expectedDurationSeconds: 120,
    scoringMethod: "partial_credit",
    maxScore: 100,
    evaluationRules: {
      partialCreditEnabled: true
    },
    qualityMetrics: assessQuestionQuality(parsed, request),
    aiMetadata: {
      model: template.parameters?.model || 'gpt-4',
      prompt,
      temperature: template.parameters?.temperature || 0.7,
      generationAttempts: 1,
      reviewRequired: false
    }
  };
}

async function generateMapDiagramLabelingQuestion(
  request: GenerationRequest,
  template: AiGenerationTemplate
): Promise<GeneratedQuestion> {
  const prompt = buildPrompt(request, template, `
    Create a map/diagram labeling question for ${request.skill} at ${request.cefrLevel} level.
    
    Provide:
    1. Description of the image/map to be used
    2. 5-8 interactive areas that need to be labeled
    3. Correct answers for each area
    4. Alternative acceptable answers
    
    Format as JSON with fields: imageDescription, areas (array with id, description, correctAnswer, acceptableAnswers, coordinates)
  `);
  
  const aiResponse = await callAIService(prompt, template.parameters);
  const parsed = parseAIResponse(aiResponse);
  
  return {
    questionType: request.questionType,
    skill: request.skill,
    cefrLevel: request.cefrLevel,
    language: request.language,
    title: `Map/Diagram Labeling - ${request.skill}`,
    instructions: "Click on the highlighted areas and type the correct labels.",
    content: {
      imageDescription: parsed.imageDescription,
      interactiveAreas: parsed.areas.map((area: any, index: number) => ({
        id: `area_${index + 1}`,
        x: area.coordinates?.x || 100 + (index * 50), // Default coordinates if not provided
        y: area.coordinates?.y || 100 + (index * 30),
        width: 80,
        height: 25,
        correctAnswer: area.correctAnswer,
        acceptableAnswers: area.acceptableAnswers || []
      })),
      requireImageUpload: true
    },
    responseType: "coordinates",
    expectedDurationSeconds: 180,
    scoringMethod: "per_item",
    maxScore: 100,
    evaluationRules: {
      ignoreCasing: true,
      ignorePunctuation: true,
      acceptableVariations: []
    },
    qualityMetrics: assessQuestionQuality(parsed, request),
    aiMetadata: {
      model: template.parameters?.model || 'gpt-4',
      prompt,
      temperature: template.parameters?.temperature || 0.7,
      generationAttempts: 1,
      reviewRequired: true // Requires image upload
    }
  };
}

async function generateDescribeImageQuestion(
  request: GenerationRequest,
  template: AiGenerationTemplate
): Promise<GeneratedQuestion> {
  const prompt = buildPrompt(request, template, `
    Create a describe image question for ${request.skill} at ${request.cefrLevel} level.
    
    Provide:
    1. Description of the image to be used
    2. Key features that should be mentioned in the description
    3. Evaluation criteria for content, fluency, and pronunciation
    4. Sample good response
    
    Format as JSON with fields: imageDescription, keyFeatures, evaluationCriteria, sampleResponse
  `);
  
  const aiResponse = await callAIService(prompt, template.parameters);
  const parsed = parseAIResponse(aiResponse);
  
  return {
    questionType: request.questionType,
    skill: request.skill,
    cefrLevel: request.cefrLevel,
    language: request.language,
    title: `Describe Image - ${request.skill}`,
    instructions: "Look at the image and describe what you see. You have 25 seconds to prepare and 30 seconds to record.",
    content: {
      imageDescription: parsed.imageDescription,
      keyFeatures: parsed.keyFeatures,
      evaluationCriteria: {
        content: 40, // 40% weight for content accuracy
        fluency: 35, // 35% weight for fluency
        pronunciation: 25 // 25% weight for pronunciation
      },
      preparationTime: 25, // seconds
      recordingTime: 30, // seconds
      sampleResponse: parsed.sampleResponse,
      requireImageUpload: true
    },
    responseType: "audio",
    expectedDurationSeconds: 55, // prep + recording time
    scoringMethod: "ai_evaluation",
    maxScore: 100,
    evaluationRules: {
      aiEvaluationPrompt: `Evaluate this image description based on:
1. Content accuracy (40%): Does it correctly identify key features?
2. Fluency (35%): Is it naturally flowing speech?
3. Pronunciation (25%): Are words clearly pronounced?`
    },
    qualityMetrics: assessQuestionQuality(parsed, request),
    aiMetadata: {
      model: template.parameters?.model || 'gpt-4',
      prompt,
      temperature: template.parameters?.temperature || 0.7,
      generationAttempts: 1,
      reviewRequired: true // Requires image upload and AI speech evaluation
    }
  };
}

async function generateDataSufficiencyQuestion(
  request: GenerationRequest,
  template: AiGenerationTemplate
): Promise<GeneratedQuestion> {
  const prompt = buildPrompt(request, template, `
    Create a GMAT-style data sufficiency question for ${request.skill} at ${request.cefrLevel} level.
    
    Provide:
    1. A question asking about a specific value or relationship
    2. Statement 1 providing some information
    3. Statement 2 providing additional information
    4. The correct answer choice (A, B, C, D, or E) according to GMAT standards
    5. Explanation of why this is the correct answer
    
    GMAT Data Sufficiency options:
    A) Statement 1 alone is sufficient
    B) Statement 2 alone is sufficient  
    C) Both statements together are sufficient, but neither alone
    D) Each statement alone is sufficient
    E) Statements together are not sufficient
    
    Format as JSON with fields: question, statement1, statement2, correctAnswer, explanation
  `);
  
  const aiResponse = await callAIService(prompt, template.parameters);
  const parsed = parseAIResponse(aiResponse);
  
  return {
    questionType: request.questionType,
    skill: request.skill,
    cefrLevel: request.cefrLevel,
    language: request.language,
    title: `Data Sufficiency - ${request.skill}`,
    instructions: "Determine whether the statements provide sufficient information to answer the question.",
    content: {
      question: parsed.question,
      statement1: parsed.statement1,
      statement2: parsed.statement2,
      dataOptions: [
        "Statement 1 alone is sufficient, but statement 2 alone is not sufficient",
        "Statement 2 alone is sufficient, but statement 1 alone is not sufficient", 
        "Both statements together are sufficient, but neither statement alone is sufficient",
        "Each statement alone is sufficient",
        "Statements 1 and 2 together are not sufficient"
      ],
      correctAnswer: parsed.correctAnswer,
      explanation: parsed.explanation
    },
    responseType: "multiple_choice",
    expectedDurationSeconds: 120,
    scoringMethod: "exact_match",
    maxScore: 100,
    evaluationRules: {
      strictMatch: true
    },
    qualityMetrics: assessQuestionQuality(parsed, request),
    aiMetadata: {
      model: template.parameters?.model || 'gpt-4',
      prompt,
      temperature: template.parameters?.temperature || 0.3, // Lower temperature for logical consistency
      generationAttempts: 1,
      reviewRequired: false
    }
  };
}

// Add other specific generators for remaining question types...

// ============================================================================
// VARIATION GENERATION (ANTI-PLAGIARISM)
// ============================================================================

async function createVariations(
  baseQuestions: GeneratedQuestion[],
  variationCount: number
): Promise<GeneratedQuestion[]> {
  const questionsWithVariations: GeneratedQuestion[] = [];
  
  for (const baseQuestion of baseQuestions) {
    const variations: GeneratedQuestion[] = [];
    
    for (let i = 0; i < variationCount; i++) {
      const variation = await generateVariation(baseQuestion, i + 1);
      variations.push(variation);
    }
    
    baseQuestion.variations = variations;
    questionsWithVariations.push(baseQuestion);
  }
  
  return questionsWithVariations;
}

async function generateVariation(
  baseQuestion: GeneratedQuestion,
  variationNumber: number
): Promise<GeneratedQuestion> {
  const variationPrompt = `
    Create a variation of this question that tests the same concept but uses different:
    - Wording and phrasing
    - Examples or context
    - Option arrangements (if applicable)
    - Vocabulary choices
    
    Maintain the same difficulty level and learning objective.
    
    Original question: ${JSON.stringify(baseQuestion.content, null, 2)}
    
    Provide the variation in the same JSON format.
  `;
  
  const aiResponse = await callAIService(variationPrompt, {
    model: 'gpt-4',
    temperature: 0.8, // Higher temperature for more variation
    maxTokens: 1000
  });
  
  const parsedVariation = parseAIResponse(aiResponse);
  
  return {
    ...baseQuestion,
    title: `${baseQuestion.title} (Variation ${variationNumber})`,
    content: parsedVariation,
    aiMetadata: {
      ...baseQuestion.aiMetadata,
      prompt: variationPrompt,
      generationAttempts: 1,
      reviewRequired: false
    }
  };
}

// ============================================================================
// QUALITY VALIDATION
// ============================================================================

async function validateGeneratedQuestions(
  questions: GeneratedQuestion[]
): Promise<GeneratedQuestion[]> {
  const validatedQuestions: GeneratedQuestion[] = [];
  
  for (const question of questions) {
    // Basic validation
    if (isValidQuestion(question)) {
      // Assess quality metrics
      question.qualityMetrics = await assessDetailedQuality(question);
      
      // Only include high-quality questions
      if (question.qualityMetrics.overall >= 3.0) {
        validatedQuestions.push(question);
      }
    }
  }
  
  return validatedQuestions;
}

function isValidQuestion(question: GeneratedQuestion): boolean {
  // Check required fields
  if (!question.instructions || !question.content) {
    return false;
  }
  
  // Type-specific validation
  switch (question.questionType) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      return question.content.options && 
             question.content.options.length >= 3 &&
             question.content.correctAnswers &&
             question.content.correctAnswers.length > 0;
    
    case QUESTION_TYPES.TEXT_COMPLETION_MULTIPLE_BLANKS:
      return question.content.passage &&
             question.content.blankOptions &&
             question.content.blankOptions.length > 0;
    
    // Add other type-specific validations...
    
    default:
      return true;
  }
}

async function assessDetailedQuality(question: GeneratedQuestion): Promise<any> {
  // This would integrate with AI quality assessment or use rule-based scoring
  // For now, return default quality metrics
  return {
    contentQuality: 4.0,
    difficultyAlignment: 4.0, 
    languageAccuracy: 4.0,
    pedagogicalValue: 4.0,
    overall: 4.0
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function findBestTemplate(
  request: GenerationRequest,
  templates: AiGenerationTemplate[]
): AiGenerationTemplate | null {
  return templates.find(template => 
    template.questionType === request.questionType &&
    template.isActive
  ) || null;
}

async function createDefaultTemplate(request: GenerationRequest): Promise<AiGenerationTemplate> {
  // Create a default template for the request
  return {
    id: 0, // Temporary ID
    name: `Default ${request.questionType} Template`,
    description: `Auto-generated template for ${request.questionType}`,
    questionType: request.questionType,
    generationPrompt: getDefaultPrompt(request.questionType),
    systemPrompt: "You are an expert language teacher creating assessment questions.",
    parameters: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      skill: request.skill,
      cefrLevel: request.cefrLevel,
      language: request.language
    },
    examples: [],
    validationRules: {},
    usageCount: 0,
    isActive: true,
    version: 1,
    createdBy: 1, // System user
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any;
}

function getDefaultPrompt(questionType: QuestionType): string {
  const prompts: { [key: string]: string } = {
    [QUESTION_TYPES.MULTIPLE_CHOICE]: "Create a multiple choice question with 4 options and 1 correct answer.",
    [QUESTION_TYPES.TEXT_COMPLETION_MULTIPLE_BLANKS]: "Create a passage with 2-3 blanks and multiple choice options for each blank.",
    [QUESTION_TYPES.MAP_DIAGRAM_LABELING]: "Create a map or diagram labeling exercise with interactive areas.",
    // Add more default prompts...
  };
  
  return prompts[questionType] || "Create an appropriate question for the specified type.";
}

function buildPrompt(
  request: GenerationRequest,
  template: AiGenerationTemplate,
  specificInstructions: string
): string {
  const basePrompt = template.systemPrompt || "You are an expert language teacher.";
  const templatePrompt = template.generationPrompt;
  
  return `${basePrompt}

${templatePrompt}

Specific requirements:
- Question type: ${request.questionType}
- Skill: ${request.skill}
- CEFR Level: ${request.cefrLevel}
- Language: ${request.language}
- Difficulty (1-5): ${request.difficulty || 3}

${request.sourceContent ? `Source content to base question on: ${request.sourceContent}` : ''}

${specificInstructions}

Respond with valid JSON only.`;
}

async function callAIService(prompt: string, parameters: any): Promise<string> {
  // This would integrate with your AI service (OpenAI, etc.)
  // For now, return a mock response
  console.log('AI Service called with prompt:', prompt.substring(0, 100) + '...');
  
  // Mock response - in real implementation, this would call the actual AI service
  return JSON.stringify({
    question: "Sample generated question",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: "A",
    explanation: "This is the correct answer because..."
  });
}

function parseAIResponse(response: string): any {
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    // Return a default structure
    return {
      error: "Failed to parse AI response",
      response: response
    };
  }
}

function assessQuestionQuality(parsed: any, request: GenerationRequest): any {
  // Basic quality assessment
  return {
    contentQuality: 4.0,
    difficultyAlignment: 4.0,
    languageAccuracy: 4.0,
    pedagogicalValue: 4.0,
    overall: 4.0
  };
}

function calculateAverageQuality(questions: GeneratedQuestion[]): number {
  if (questions.length === 0) return 0;
  
  const totalQuality = questions.reduce((sum, q) => sum + q.qualityMetrics.overall, 0);
  return totalQuality / questions.length;
}

// ============================================================================
// BATCH GENERATION UTILITIES
// ============================================================================

export async function generateQuestionBank(
  skill: Skill,
  cefrLevel: CEFRLevel,
  language: string,
  questionCounts: { [type in QuestionType]?: number }
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  
  for (const [questionType, count] of Object.entries(questionCounts)) {
    if (count > 0) {
      const request: GenerationRequest = {
        questionType: questionType as QuestionType,
        skill,
        cefrLevel,
        language,
        count,
        variationCount: 2
      };
      
      const result = await generateQuestions(request);
      results.push(result);
    }
  }
  
  return results;
}

export function exportGeneratedQuestions(
  results: GenerationResult[],
  format: 'json' | 'csv' | 'xlsx' = 'json'
): string {
  const allQuestions = results.flatMap(result => result.questions);
  
  switch (format) {
    case 'json':
      return JSON.stringify(allQuestions, null, 2);
    
    case 'csv':
      // Convert to CSV format
      const headers = ['Title', 'Type', 'Skill', 'Level', 'Instructions', 'Quality'];
      const rows = allQuestions.map(q => [
        q.title,
        q.questionType,
        q.skill,
        q.cefrLevel,
        q.instructions,
        q.qualityMetrics.overall
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    
    default:
      return JSON.stringify(allQuestions, null, 2);
  }
}