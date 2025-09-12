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
    
    if (question.type === 'mcq_single' && typeof userAnswer === 'number') {
      if (userAnswer === question.answerIndex) {
        correctCount++;
      }
    } else if (question.type === 'short_answer' && typeof userAnswer === 'string') {
      // Check if answer matches any correct answer (case-insensitive)
      const normalizedAnswer = userAnswer.toLowerCase().trim();
      const isCorrect = question.correctAnswers.some(correct =>
        correct.toLowerCase().trim() === normalizedAnswer
      );
      if (isCorrect) {
        correctCount++;
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