/**
 * Reading Quickscore Engine
 * Fast heuristic scoring for reading comprehension
 */

import { ReadingResponse, QuickscoreResult } from '../schemas/resultSchema';
import { ReadingItem } from '../schemas/itemSchema';

/**
 * Score reading response using MCQ accuracy and latency analysis
 */
export function scoreReading(
  item: ReadingItem,
  response: ReadingResponse
): QuickscoreResult {
  const startTime = Date.now();
  
  let correctCount = 0;
  let totalQuestions = item.questions.length;
  let partialPoints = 0;
  
  // Handle different response formats - could be array directly or wrapped object
  let answers: any[];
  if (Array.isArray(response)) {
    answers = response;
  } else if (response && Array.isArray(response.answers)) {
    answers = response.answers;
  } else if (response && typeof response === 'object') {
    // Convert object keys to array
    answers = Object.values(response);
  } else {
    console.error('Invalid response format for reading:', response);
    return { p: 0, route: 'down', confidence: 0.1 };
  }

  // Score each question
  for (let i = 0; i < item.questions.length; i++) {
    const question = item.questions[i];
    const userAnswer = answers[i];
    
    if (question.type === 'mcq_single' && typeof userAnswer === 'number') {
      if (userAnswer === question.answerIndex) {
        correctCount++;
      }
    } else if (question.type === 'mcq_multi' && Array.isArray(userAnswer)) {
      // Partial credit for multi-select
      const correctIndices = question.answerIndices;
      const userIndices = userAnswer as number[];
      
      const correctSelected = userIndices.filter(idx => correctIndices.includes(idx)).length;
      const incorrectSelected = userIndices.filter(idx => !correctIndices.includes(idx)).length;
      
      // Partial credit formula: max(0, (correct/total) - (wrong/options)*0.5)
      const partialScore = Math.max(0, 
        (correctSelected / correctIndices.length) - 
        (incorrectSelected / question.options.length) * 0.5
      );
      partialPoints += partialScore;
    } else if (question.type === 'short_answer' && typeof userAnswer === 'string') {
      const normalizedAnswer = userAnswer.toLowerCase().trim();
      const isCorrect = question.correctAnswers.some(correct =>
        correct.toLowerCase().trim() === normalizedAnswer ||
        normalizedAnswer.includes(correct.toLowerCase().trim())
      );
      if (isCorrect) {
        correctCount++;
      }
    }
  }
  
  // Base score combining full and partial credit
  let p = totalQuestions > 0 ? (correctCount + partialPoints) / totalQuestions : 0;
  
  // Reading speed analysis (if latency data available)
  const passageWordCount = estimateWordCount(item.assets.passage);
  const responseLatency = (response && typeof response === 'object' && response.latencyMs) || 0;
  const readingTimeMs = responseLatency;
  const readingSpeedWPM = readingTimeMs > 0 ? (passageWordCount / (readingTimeMs / 60000)) : 200;
  
  // Penalize extreme speeds (too fast = skimming, too slow = struggling)
  const optimalSpeedRange = { min: 150, max: 300 }; // WPM
  
  if (readingSpeedWPM < optimalSpeedRange.min / 2) {
    p = Math.max(0, p - 0.15); // Very slow reading penalty
  } else if (readingSpeedWPM > optimalSpeedRange.max * 1.5) {
    p = Math.max(0, p - 0.1); // Too fast reading penalty
  }
  
  const computeTime = Date.now() - startTime;
  
  const features = {
    accuracy: (correctCount + partialPoints) / totalQuestions,
    readingSpeedWPM,
    passageWords: passageWordCount,
    speedPenalty: readingSpeedWPM < 75 ? 0.15 : (readingSpeedWPM > 450 ? 0.1 : 0),
  };
  
  return {
    p: Math.max(0, Math.min(1, p)),
    route: routeFromScore(p),
    features,
    computeTimeMs: computeTime,
  };
}

/**
 * Estimate word count in passage
 */
function estimateWordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Determine routing based on score
 */
function routeFromScore(p: number): 'up' | 'down' | 'stay' {
  if (p >= 0.75) return 'up';
  if (p < 0.45) return 'down';
  return 'stay';
}

/**
 * Validate reading response format
 */
export function validateReadingResponse(
  item: ReadingItem,
  response: ReadingResponse
): boolean {
  if (!response.answers || response.answers.length !== item.questions.length) {
    return false;
  }
  
  if (typeof response.latencyMs !== 'number' || response.latencyMs < 0) {
    return false;
  }
  
  return true;
}