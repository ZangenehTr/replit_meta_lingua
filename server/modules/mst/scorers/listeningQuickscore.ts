/**
 * Listening Quickscore Engine
 * Fast heuristic scoring for listening comprehension
 */

import { ListeningResponse, QuickscoreResult } from '../schemas/resultSchema';
import { ListeningItem } from '../schemas/itemSchema';

/**
 * Score listening response quickly using MCQ accuracy and latency
 */
export function scoreListening(
  item: ListeningItem,
  response: any
): QuickscoreResult {
  const startTime = Date.now();
  
  let correctCount = 0;
  let totalQuestions = item.questions.length;
  
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
    console.error('Invalid response format for listening:', response);
    return { p: 0, route: 'down', confidence: 0.1 };
  }
  
  // Score each question
  for (let i = 0; i < item.questions.length; i++) {
    const question = item.questions[i];
    const userAnswer = answers[i];
    
    if (question.type === 'mcq_single') {
      // Handle both string and number answers from frontend
      const answerIndex = typeof userAnswer === 'string' ? parseInt(userAnswer, 10) : userAnswer;
      if (typeof answerIndex === 'number' && !isNaN(answerIndex) && answerIndex === question.answerIndex) {
        correctCount++;
      }
    } else if (question.type === 'short_answer' && typeof userAnswer === 'string') {
      // Check if answer matches any correct answer (case-insensitive)
      const normalizedAnswer = userAnswer.toLowerCase().trim();
      const isCorrect = (question.correctAnswers ?? []).some((correct: string) =>
        correct.toLowerCase().trim() === normalizedAnswer
      );
      if (isCorrect) {
        correctCount++;
      }
    } else if (question.type === 'mcq_multi' && Array.isArray(userAnswer)) {
      // Partial credit for multi-select
      const correctIndices: number[] = question.answerIndices ?? [];
      const userIndices = userAnswer as number[];
      const correctSelected = userIndices.filter((idx: number) => correctIndices.includes(idx)).length;
      const incorrectSelected = userIndices.filter((idx: number) => !correctIndices.includes(idx)).length;
      const opts = question.options?.length ?? 4;
      const partialScore = Math.max(0,
        (correctSelected / Math.max(correctIndices.length, 1)) -
        (incorrectSelected / opts) * 0.5
      );
      correctCount += partialScore;
    } else if (question.type === 'ordering' && Array.isArray(userAnswer)) {
      // Score by proportion of adjacent pairs in correct order
      const correctOrder: number[] = question.correctOrder ?? [];
      if (correctOrder.length > 1 && userAnswer.length === correctOrder.length) {
        let correctPairs = 0;
        for (let k = 0; k < correctOrder.length - 1; k++) {
          const expectedA = correctOrder[k];
          const expectedB = correctOrder[k + 1];
          const userA = userAnswer[k];
          const userB = userAnswer[k + 1];
          if (userA === expectedA && userB === expectedB) correctPairs++;
        }
        correctCount += correctPairs / (correctOrder.length - 1);
      }
    }
  }
  
  // Base score from accuracy
  let p = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  
  // Penalize extremely slow responses (if latency data available)
  const responseLatency = (response && typeof response === 'object' && response.latencyMs) || 0;
  const avgLatency = responseLatency / Math.max(totalQuestions, 1);
  const expectedLatency = item.timing.maxAnswerSec * 1000 * 0.6; // 60% of max time
  
  if (avgLatency > expectedLatency * 1.5) {
    p = Math.max(0, p - 0.1); // Penalize slow responses
  }
  
  // Very fast responses might indicate guessing
  if (avgLatency < expectedLatency * 0.2) {
    p = Math.max(0, p - 0.05);
  }
  
  const computeTime = Date.now() - startTime;
  
  const features = {
    accuracy: correctCount / totalQuestions,
    avgLatencyMs: avgLatency,
    speedPenalty: avgLatency > expectedLatency * 1.5 ? 0.1 : 0,
    guessingPenalty: avgLatency < expectedLatency * 0.2 ? 0.05 : 0,
  };
  
  return {
    p: Math.max(0, Math.min(1, p)),
    route: routeFromScore(p),
    features,
    computeTimeMs: computeTime,
  };
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
 * Validate listening response format
 */
export function validateListeningResponse(
  item: ListeningItem,
  response: ListeningResponse
): boolean {
  if (!response.answers || response.answers.length !== item.questions.length) {
    return false;
  }
  
  if (typeof response.latencyMs !== 'number' || response.latencyMs < 0) {
    return false;
  }
  
  return true;
}