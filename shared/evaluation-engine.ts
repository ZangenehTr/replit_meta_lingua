// ============================================================================
// GLOBAL ANSWER EVALUATION ENGINE
// ============================================================================
// Centralized evaluation engine for all question types in the unified testing system

import { 
  UnifiedQuestion, 
  UnifiedResponse, 
  QuestionType, 
  ScoringMethod, 
  QUESTION_TYPES,
  SCORING_METHODS 
} from './unified-testing-schema';

// Evaluation result interface
export interface EvaluationResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback: string;
  correctParts?: string[];
  incorrectParts?: string[];
  pointsBreakdown?: { [criterion: string]: number };
  requiresManualReview?: boolean;
  aiConfidence?: number;
}

// Evaluation context interface
export interface EvaluationContext {
  question: UnifiedQuestion;
  userResponse: any;
  evaluationRules?: any;
  aiEnabled?: boolean;
}

// ============================================================================
// MAIN EVALUATION FUNCTION
// ============================================================================

export async function evaluateAnswer(context: EvaluationContext): Promise<EvaluationResult> {
  const { question, userResponse, evaluationRules = {} } = context;
  
  try {
    // Determine the appropriate evaluation strategy
    switch (question.questionType) {
      // Multiple Choice Types
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return evaluateMultipleChoice(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.MULTIPLE_CHOICE_MULTIPLE_ANSWERS:
        return evaluateMultipleChoiceMultipleAnswers(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.TRUE_FALSE:
        return evaluateTrueFalse(question, userResponse, evaluationRules);
      
      // Text-based Types
      case QUESTION_TYPES.FILL_BLANK:
      case QUESTION_TYPES.FILL_BLANKS_DRAG_DROP:
        return evaluateFillInBlanks(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.SHORT_ANSWER:
        return evaluateShortAnswer(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.TEXT_COMPLETION_MULTIPLE_BLANKS:
        return evaluateTextCompletionMultipleBlanks(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.SENTENCE_EQUIVALENCE:
        return evaluateSentenceEquivalence(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.COHERENCE_INSERTION:
        return evaluateCoherenceInsertion(question, userResponse, evaluationRules);
      
      // Interactive Types
      case QUESTION_TYPES.MAP_DIAGRAM_LABELING:
        return evaluateMapDiagramLabeling(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.MATCHING:
        return evaluateMatching(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.ORDERING:
        return evaluateOrdering(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.TWO_PART_ANALYSIS:
        return evaluateTwoPartAnalysis(question, userResponse, evaluationRules);
      
      // Audio Types (require AI evaluation)
      case QUESTION_TYPES.SPEAKING:
      case QUESTION_TYPES.READ_ALOUD:
      case QUESTION_TYPES.REPEAT_SENTENCE:
      case QUESTION_TYPES.DESCRIBE_IMAGE:
        return evaluateAudioResponse(question, userResponse, evaluationRules, context.aiEnabled);
      
      // Specialized Types
      case QUESTION_TYPES.DATA_SUFFICIENCY:
        return evaluateDataSufficiency(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.SENTENCE_CORRECTION:
        return evaluateSentenceCorrection(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.TRANSLATION:
        return evaluateTranslation(question, userResponse, evaluationRules);
      
      case QUESTION_TYPES.ESSAY:
        return evaluateEssay(question, userResponse, evaluationRules, context.aiEnabled);
      
      default:
        throw new Error(`Unsupported question type: ${question.questionType}`);
    }
  } catch (error) {
    console.error('Evaluation error:', error);
    return {
      score: 0,
      maxScore: question.maxScore,
      isCorrect: false,
      feedback: 'Error occurred during evaluation',
      requiresManualReview: true
    };
  }
}

// ============================================================================
// MULTIPLE CHOICE EVALUATIONS
// ============================================================================

function evaluateMultipleChoice(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { selectedOptions } = userResponse;
  const correctAnswers = question.content.correctAnswers || [];
  
  if (!selectedOptions || selectedOptions.length === 0) {
    return {
      score: 0,
      maxScore: question.maxScore,
      isCorrect: false,
      feedback: 'No answer provided'
    };
  }
  
  // Single correct answer expected
  const isCorrect = selectedOptions.length === 1 && 
                   correctAnswers.includes(selectedOptions[0]);
  
  return {
    score: isCorrect ? question.maxScore : 0,
    maxScore: question.maxScore,
    isCorrect,
    feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswers[0]}`
  };
}

function evaluateMultipleChoiceMultipleAnswers(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { selectedOptions = [] } = userResponse;
  const correctAnswers = question.content.correctAnswers || [];
  
  if (question.scoringMethod === SCORING_METHODS.ALL_OR_NOTHING) {
    // Must select exactly the correct answers, no more, no less
    const isCorrect = arraysEqual(selectedOptions.sort(), correctAnswers.sort());
    return {
      score: isCorrect ? question.maxScore : 0,
      maxScore: question.maxScore,
      isCorrect,
      feedback: isCorrect ? 'Correct!' : 'You must select all correct answers and no incorrect ones'
    };
  } else {
    // Partial credit scoring (per item)
    const correctSelected = selectedOptions.filter((opt: string) => correctAnswers.includes(opt));
    const incorrectSelected = selectedOptions.filter((opt: string) => !correctAnswers.includes(opt));
    const notSelected = correctAnswers.filter(ans => !selectedOptions.includes(ans));
    
    const pointsPerCorrect = question.maxScore / correctAnswers.length;
    const score = Math.max(0, correctSelected.length * pointsPerCorrect - incorrectSelected.length * pointsPerCorrect);
    
    return {
      score: Math.round(score),
      maxScore: question.maxScore,
      isCorrect: score === question.maxScore,
      feedback: `Selected ${correctSelected.length}/${correctAnswers.length} correct answers`,
      correctParts: correctSelected,
      incorrectParts: incorrectSelected,
      pointsBreakdown: {
        'Correct selections': correctSelected.length * pointsPerCorrect,
        'Incorrect penalties': -incorrectSelected.length * pointsPerCorrect
      }
    };
  }
}

function evaluateTrueFalse(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { booleanAnswer } = userResponse;
  const correctAnswer = question.content.correctAnswer;
  
  if (booleanAnswer === undefined || booleanAnswer === null) {
    return {
      score: 0,
      maxScore: question.maxScore,
      isCorrect: false,
      feedback: 'No answer provided'
    };
  }
  
  const isCorrect = booleanAnswer === correctAnswer;
  
  return {
    score: isCorrect ? question.maxScore : 0,
    maxScore: question.maxScore,
    isCorrect,
    feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}`
  };
}

// ============================================================================
// TEXT-BASED EVALUATIONS
// ============================================================================

function evaluateFillInBlanks(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { blankAnswers = {}, dragDropMapping = {} } = userResponse;
  const answers = { ...blankAnswers, ...dragDropMapping };
  const blanks = question.content.blanks || [];
  
  if (blanks.length === 0) {
    return {
      score: 0,
      maxScore: question.maxScore,
      isCorrect: false,
      feedback: 'No blanks defined in question'
    };
  }
  
  const results = blanks.map(blank => {
    const userAnswer = answers[blank.id];
    if (!userAnswer) {
      return { blank: blank.id, correct: false, feedback: 'No answer provided' };
    }
    
    const isCorrect = evaluateTextMatch(
      userAnswer, 
      blank.correctAnswers, 
      blank.acceptableVariations || [], 
      rules
    );
    
    return {
      blank: blank.id,
      correct: isCorrect,
      userAnswer,
      correctAnswers: blank.correctAnswers,
      feedback: isCorrect ? 'Correct' : `Expected: ${blank.correctAnswers.join(' or ')}`
    };
  });
  
  if (question.scoringMethod === SCORING_METHODS.ALL_OR_NOTHING) {
    const allCorrect = results.every(r => r.correct);
    return {
      score: allCorrect ? question.maxScore : 0,
      maxScore: question.maxScore,
      isCorrect: allCorrect,
      feedback: allCorrect ? 'All answers correct!' : 'Some answers are incorrect',
      correctParts: results.filter(r => r.correct).map(r => r.blank),
      incorrectParts: results.filter(r => !r.correct).map(r => r.blank)
    };
  } else {
    // Per item scoring
    const correctCount = results.filter(r => r.correct).length;
    const score = Math.round((correctCount / blanks.length) * question.maxScore);
    
    return {
      score,
      maxScore: question.maxScore,
      isCorrect: score === question.maxScore,
      feedback: `${correctCount}/${blanks.length} blanks correct`,
      correctParts: results.filter(r => r.correct).map(r => r.blank),
      incorrectParts: results.filter(r => !r.correct).map(r => r.blank),
      pointsBreakdown: {
        'Correct blanks': correctCount * (question.maxScore / blanks.length)
      }
    };
  }
}

function evaluateShortAnswer(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { textAnswer } = userResponse;
  const correctAnswers = question.content.correctAnswers || [];
  const acceptableVariations = question.content.acceptableVariations || [];
  
  if (!textAnswer || textAnswer.trim() === '') {
    return {
      score: 0,
      maxScore: question.maxScore,
      isCorrect: false,
      feedback: 'No answer provided'
    };
  }
  
  const isCorrect = evaluateTextMatch(textAnswer, correctAnswers, acceptableVariations, rules);
  
  return {
    score: isCorrect ? question.maxScore : 0,
    maxScore: question.maxScore,
    isCorrect,
    feedback: isCorrect ? 'Correct!' : `Expected: ${correctAnswers.join(' or ')}`
  };
}

function evaluateTextCompletionMultipleBlanks(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { blankAnswers = {} } = userResponse;
  const blankOptions = question.content.blankOptions || [];
  
  const results = blankOptions.map(blankOption => {
    const userAnswer = blankAnswers[blankOption.blankId];
    const isCorrect = userAnswer === blankOption.correctOption;
    
    return {
      blankId: blankOption.blankId,
      correct: isCorrect,
      userAnswer,
      correctAnswer: blankOption.correctOption
    };
  });
  
  if (question.scoringMethod === SCORING_METHODS.PARTIAL_CREDIT) {
    const correctCount = results.filter(r => r.correct).length;
    const score = Math.round((correctCount / blankOptions.length) * question.maxScore);
    
    return {
      score,
      maxScore: question.maxScore,
      isCorrect: score === question.maxScore,
      feedback: `${correctCount}/${blankOptions.length} blanks correct`,
      correctParts: results.filter(r => r.correct).map(r => r.blankId),
      incorrectParts: results.filter(r => !r.correct).map(r => r.blankId)
    };
  } else {
    // All or nothing
    const allCorrect = results.every(r => r.correct);
    return {
      score: allCorrect ? question.maxScore : 0,
      maxScore: question.maxScore,
      isCorrect: allCorrect,
      feedback: allCorrect ? 'All answers correct!' : 'Some answers are incorrect'
    };
  }
}

function evaluateSentenceEquivalence(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { selectedOptions = [] } = userResponse;
  const equivalentChoices = question.content.equivalentChoices || [];
  
  // Must select exactly the two equivalent choices
  const isCorrect = selectedOptions.length === 2 && 
                   arraysEqual(selectedOptions.sort(), equivalentChoices.sort());
  
  return {
    score: isCorrect ? question.maxScore : 0,
    maxScore: question.maxScore,
    isCorrect,
    feedback: isCorrect ? 'Correct!' : 'You must select the two choices that are most similar in meaning'
  };
}

function evaluateCoherenceInsertion(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { textAnswer } = userResponse;
  const correctAnswer = question.content.correctAnswer;
  
  // Exact match required for coherence insertion
  const isCorrect = textAnswer && textAnswer.trim() === correctAnswer;
  
  return {
    score: isCorrect ? question.maxScore : 0,
    maxScore: question.maxScore,
    isCorrect,
    feedback: isCorrect ? 'Correct!' : `The sentence should be inserted: ${correctAnswer}`
  };
}

// ============================================================================
// INTERACTIVE EVALUATIONS
// ============================================================================

function evaluateMapDiagramLabeling(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { coordinates = [] } = userResponse;
  const interactiveAreas = question.content.interactiveAreas || [];
  
  const results = interactiveAreas.map(area => {
    // Find user response for this area (within coordinates)
    const userInput = coordinates.find((coord: any) => 
      coord.x >= area.x && coord.x <= area.x + area.width &&
      coord.y >= area.y && coord.y <= area.y + area.height
    );
    
    if (!userInput) {
      return { areaId: area.id, correct: false, feedback: 'No answer provided' };
    }
    
    const isCorrect = evaluateTextMatch(
      userInput.text, 
      [area.correctAnswer], 
      area.acceptableAnswers || [], 
      rules
    );
    
    return {
      areaId: area.id,
      correct: isCorrect,
      userAnswer: userInput.text,
      correctAnswer: area.correctAnswer
    };
  });
  
  const correctCount = results.filter(r => r.correct).length;
  const score = Math.round((correctCount / interactiveAreas.length) * question.maxScore);
  
  return {
    score,
    maxScore: question.maxScore,
    isCorrect: score === question.maxScore,
    feedback: `${correctCount}/${interactiveAreas.length} labels correct`,
    correctParts: results.filter(r => r.correct).map(r => r.areaId),
    incorrectParts: results.filter(r => !r.correct).map(r => r.areaId)
  };
}

function evaluateMatching(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { matchingAnswer = {} } = userResponse;
  const correctPairs = question.content.matchingPairs || [];
  
  const results = correctPairs.map(pair => {
    const userMatch = matchingAnswer[pair.left];
    const isCorrect = userMatch === pair.right;
    
    return {
      left: pair.left,
      correct: isCorrect,
      userMatch,
      correctMatch: pair.right
    };
  });
  
  const correctCount = results.filter(r => r.correct).length;
  const score = Math.round((correctCount / correctPairs.length) * question.maxScore);
  
  return {
    score,
    maxScore: question.maxScore,
    isCorrect: score === question.maxScore,
    feedback: `${correctCount}/${correctPairs.length} pairs matched correctly`,
    correctParts: results.filter(r => r.correct).map(r => r.left),
    incorrectParts: results.filter(r => !r.correct).map(r => r.left)
  };
}

function evaluateOrdering(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { orderingAnswer = [] } = userResponse;
  const correctOrder = question.content.orderingItems || [];
  
  if (question.scoringMethod === SCORING_METHODS.ALL_OR_NOTHING) {
    const isCorrect = arraysEqual(orderingAnswer, correctOrder);
    return {
      score: isCorrect ? question.maxScore : 0,
      maxScore: question.maxScore,
      isCorrect,
      feedback: isCorrect ? 'Correct order!' : 'The order is not correct'
    };
  } else {
    // Partial credit based on correct positions
    let correctPositions = 0;
    for (let i = 0; i < Math.min(orderingAnswer.length, correctOrder.length); i++) {
      if (orderingAnswer[i] === correctOrder[i]) {
        correctPositions++;
      }
    }
    
    const score = Math.round((correctPositions / correctOrder.length) * question.maxScore);
    
    return {
      score,
      maxScore: question.maxScore,
      isCorrect: score === question.maxScore,
      feedback: `${correctPositions}/${correctOrder.length} items in correct position`
    };
  }
}

function evaluateTwoPartAnalysis(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { tableSelections = {} } = userResponse;
  const table = question.content.table;
  
  if (!table) {
    return {
      score: 0,
      maxScore: question.maxScore,
      isCorrect: false,
      feedback: 'Invalid question format'
    };
  }
  
  const results = table.rows.map((row: any) => {
    const userSelections = tableSelections[row.id] || [];
    const correctSelections = row.correctSelections || [];
    const isCorrect = arraysEqual(userSelections.sort(), correctSelections.sort());
    
    return {
      rowId: row.id,
      correct: isCorrect,
      userSelections,
      correctSelections
    };
  });
  
  // All or nothing scoring for two-part analysis
  const allCorrect = results.every(r => r.correct);
  
  return {
    score: allCorrect ? question.maxScore : 0,
    maxScore: question.maxScore,
    isCorrect: allCorrect,
    feedback: allCorrect ? 'Correct!' : 'Both parts must be correct',
    correctParts: results.filter(r => r.correct).map(r => r.rowId),
    incorrectParts: results.filter(r => !r.correct).map(r => r.rowId)
  };
}

// ============================================================================
// SPECIALIZED EVALUATIONS
// ============================================================================

function evaluateDataSufficiency(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { selectedOptions } = userResponse;
  const correctAnswer = question.content.correctAnswer;
  
  // Data sufficiency has standard GMAT options, exact match required
  const isCorrect = selectedOptions && selectedOptions.length === 1 && 
                   selectedOptions[0] === correctAnswer;
  
  return {
    score: isCorrect ? question.maxScore : 0,
    maxScore: question.maxScore,
    isCorrect,
    feedback: isCorrect ? 'Correct!' : 'Incorrect data sufficiency analysis'
  };
}

function evaluateSentenceCorrection(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { selectedOptions } = userResponse;
  const correctAnswer = question.content.correctAnswer;
  
  // Exact match required for sentence correction
  const isCorrect = selectedOptions && selectedOptions.length === 1 && 
                   selectedOptions[0] === correctAnswer;
  
  return {
    score: isCorrect ? question.maxScore : 0,
    maxScore: question.maxScore,
    isCorrect,
    feedback: isCorrect ? 'Correct!' : 'Incorrect grammatical choice'
  };
}

function evaluateTranslation(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any
): EvaluationResult {
  const { textAnswer } = userResponse;
  const correctAnswers = question.content.correctAnswers || [];
  const acceptableVariations = question.content.acceptableVariations || [];
  
  if (!textAnswer) {
    return {
      score: 0,
      maxScore: question.maxScore,
      isCorrect: false,
      feedback: 'No translation provided'
    };
  }
  
  // For translation, we're more lenient with matching
  const enhancedRules = {
    ...rules,
    ignoreCasing: true,
    ignorePunctuation: true,
    allowSynonyms: true
  };
  
  const isCorrect = evaluateTextMatch(textAnswer, correctAnswers, acceptableVariations, enhancedRules);
  
  return {
    score: isCorrect ? question.maxScore : 0,
    maxScore: question.maxScore,
    isCorrect,
    feedback: isCorrect ? 'Good translation!' : 'Translation needs improvement',
    requiresManualReview: !isCorrect // Translation often needs human review
  };
}

// ============================================================================
// AI-BASED EVALUATIONS
// ============================================================================

async function evaluateAudioResponse(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any,
  aiEnabled?: boolean
): Promise<EvaluationResult> {
  const { audioUrl, audioTranscript } = userResponse;
  
  if (!audioUrl) {
    return {
      score: 0,
      maxScore: question.maxScore,
      isCorrect: false,
      feedback: 'No audio response provided'
    };
  }
  
  if (!aiEnabled) {
    return {
      score: 0,
      maxScore: question.maxScore,
      isCorrect: false,
      feedback: 'Audio evaluation requires AI analysis',
      requiresManualReview: true
    };
  }
  
  // This would integrate with AI speech analysis service
  // For now, return a placeholder that requires manual review
  return {
    score: 0,
    maxScore: question.maxScore,
    isCorrect: false,
    feedback: 'Audio response recorded - AI evaluation pending',
    requiresManualReview: true,
    aiConfidence: 0
  };
}

async function evaluateEssay(
  question: UnifiedQuestion, 
  userResponse: any, 
  rules: any,
  aiEnabled?: boolean
): Promise<EvaluationResult> {
  const { textAnswer } = userResponse;
  
  if (!textAnswer || textAnswer.trim().length === 0) {
    return {
      score: 0,
      maxScore: question.maxScore,
      isCorrect: false,
      feedback: 'No essay provided'
    };
  }
  
  if (!aiEnabled) {
    return {
      score: 0,
      maxScore: question.maxScore,
      isCorrect: false,
      feedback: 'Essay evaluation requires AI analysis or manual review',
      requiresManualReview: true
    };
  }
  
  // This would integrate with AI essay evaluation service
  // For now, return a placeholder that requires manual review
  return {
    score: 0,
    maxScore: question.maxScore,
    isCorrect: false,
    feedback: 'Essay submitted - AI evaluation pending',
    requiresManualReview: true,
    aiConfidence: 0
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function evaluateTextMatch(
  userAnswer: string, 
  correctAnswers: string[], 
  acceptableVariations: string[], 
  rules: any
): boolean {
  if (!userAnswer) return false;
  
  let processedAnswer = userAnswer.trim();
  const allAcceptableAnswers = [...correctAnswers, ...acceptableVariations];
  
  // Apply evaluation rules
  if (rules.ignoreCasing) {
    processedAnswer = processedAnswer.toLowerCase();
  }
  
  if (rules.ignorePunctuation) {
    processedAnswer = processedAnswer.replace(/[.,!?;:]/g, '');
  }
  
  // Check for direct matches
  for (let acceptable of allAcceptableAnswers) {
    let processedAcceptable = acceptable;
    
    if (rules.ignoreCasing) {
      processedAcceptable = processedAcceptable.toLowerCase();
    }
    
    if (rules.ignorePunctuation) {
      processedAcceptable = processedAcceptable.replace(/[.,!?;:]/g, '');
    }
    
    if (processedAnswer === processedAcceptable) {
      return true;
    }
    
    // Check numeric equivalence
    if (rules.allowNumericEquivalence) {
      if (isNumericEquivalent(processedAnswer, processedAcceptable)) {
        return true;
      }
    }
  }
  
  return false;
}

function isNumericEquivalent(answer1: string, answer2: string): boolean {
  const numberWords: { [key: string]: string } = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
    'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
    'eighteen': '18', 'nineteen': '19', 'twenty': '20'
  };
  
  const convertToNumber = (text: string): string => {
    const lower = text.toLowerCase();
    return numberWords[lower] || text;
  };
  
  return convertToNumber(answer1) === convertToNumber(answer2);
}

function arraysEqual(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val === arr2[index]);
}

// ============================================================================
// BATCH EVALUATION UTILITIES
// ============================================================================

export async function evaluateMultipleAnswers(
  contexts: EvaluationContext[]
): Promise<EvaluationResult[]> {
  const results = await Promise.all(
    contexts.map(context => evaluateAnswer(context))
  );
  return results;
}

export function calculateOverallScore(
  results: EvaluationResult[], 
  weights?: number[]
): { score: number; maxScore: number; percentage: number } {
  const totalScore = results.reduce((sum, result, index) => {
    const weight = weights?.[index] || 1;
    return sum + (result.score * weight);
  }, 0);
  
  const totalMaxScore = results.reduce((sum, result, index) => {
    const weight = weights?.[index] || 1;
    return sum + (result.maxScore * weight);
  }, 0);
  
  const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
  
  return {
    score: Math.round(totalScore),
    maxScore: Math.round(totalMaxScore),
    percentage: Math.round(percentage * 100) / 100
  };
}