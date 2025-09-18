/**
 * Client-Side Speaking Quickscore Engine
 * Fast heuristic scoring for speaking assessment using Whisper transcript
 * Adapted from server/modules/mst/scorers/speakingQuickscore.ts
 */

import { SpeakingResponse, SpeakingItem, QuickscoreResult } from './types';

// Simple frequency list for lexical analysis (top 3000 words)
const COMMON_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'out', 'off',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now',
  'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old', 'right',
  'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few',
  'public', 'bad', 'same', 'able', 'time', 'person', 'year', 'way', 'day', 'thing', 'man',
  'world', 'life', 'hand', 'part', 'child', 'eye', 'woman', 'place', 'work', 'week', 'case',
  'point', 'government', 'company', 'number', 'group', 'problem', 'fact', 'be', 'have', 'do',
  'say', 'get', 'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want', 'give',
  'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call', 'keep', 'let',
  'begin', 'help', 'talk', 'turn', 'start', 'show', 'hear', 'play', 'run', 'move', 'like',
  'live', 'believe', 'hold', 'bring', 'happen', 'write', 'sit', 'stand', 'lose', 'pay', 'meet',
  'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow',
  'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win',
  'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send',
  'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain'
]);

/**
 * Score speaking response using transcript analysis
 */
export function scoreSpeaking(
  item: SpeakingItem,
  response: SpeakingResponse
): QuickscoreResult {
  const startTime = performance.now();
  
  if (!response.asr?.text) {
    return {
      p: 0,
      route: 'down',
      features: { transcriptMissing: 1 },
      computeTimeMs: performance.now() - startTime,
    };
  }
  
  const transcript = response.asr.text.toLowerCase().trim();
  const words = transcript.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length < 10) {
    return {
      p: 0.1,
      route: 'down', 
      features: { tooShort: 1, wordCount: words.length },
      computeTimeMs: performance.now() - startTime,
    };
  }
  
  // Feature calculations
  const fluencyScore = calculateFluency(transcript, item.timing.recordSec);
  const lexicalScore = calculateLexical(words);
  const grammarScore = calculateGrammar(transcript);
  const taskingScore = calculateTasking(transcript, item.assets.prompt);
  
  // Weighted combination (as per spec)
  const p = fluencyScore * 0.30 + 
            lexicalScore * 0.25 + 
            grammarScore * 0.25 + 
            taskingScore * 0.20;
  
  const computeTime = performance.now() - startTime;
  
  const features = {
    fluency: fluencyScore,
    lexical: lexicalScore,
    grammar: grammarScore,
    tasking: taskingScore,
    wordCount: words.length,
    asrConfidence: response.asr.confidence || 0,
  };
  
  return {
    p: Math.max(0, Math.min(1, p)),
    route: routeFromScore(p),
    features,
    computeTimeMs: computeTime,
  };
}

/**
 * Calculate fluency score (0.30 weight)
 * Based on WPM, silence ratio, and filled pauses
 */
function calculateFluency(transcript: string, durationSec: number): number {
  const words = transcript.split(/\s+/).filter(word => word.length > 0);
  const wordsPerMinute = (words.length / durationSec) * 60;
  
  // Optimal WPM range: 110-170
  let wpmScore = 0;
  if (wordsPerMinute >= 110 && wordsPerMinute <= 170) {
    wpmScore = 1.0;
  } else if (wordsPerMinute >= 80 && wordsPerMinute <= 200) {
    wpmScore = 0.7;
  } else if (wordsPerMinute >= 60 && wordsPerMinute <= 220) {
    wpmScore = 0.4;
  } else {
    wpmScore = 0.1;
  }
  
  // Detect filled pauses (um, uh, er, ah)
  const filledPauses = (transcript.match(/\b(um|uh|er|ah|like|you know)\b/g) || []).length;
  const filledPauseRatio = filledPauses / words.length;
  
  let pauseScore = 1.0;
  if (filledPauseRatio > 0.1) pauseScore = 0.6;
  if (filledPauseRatio > 0.2) pauseScore = 0.3;
  
  return (wpmScore + pauseScore) / 2;
}

/**
 * Calculate lexical score (0.25 weight)
 * Based on type-token ratio and sophisticated vocabulary
 */
function calculateLexical(words: string[]): number {
  const uniqueWords = new Set(words.map(w => w.replace(/[^\w]/g, '')));
  const typeTokenRatio = uniqueWords.size / words.length;
  
  // TTR scoring
  let ttrScore = 0;
  if (typeTokenRatio >= 0.6) ttrScore = 1.0;
  else if (typeTokenRatio >= 0.5) ttrScore = 0.8;
  else if (typeTokenRatio >= 0.4) ttrScore = 0.6;
  else if (typeTokenRatio >= 0.3) ttrScore = 0.4;
  else ttrScore = 0.2;
  
  // Advanced vocabulary ratio
  const advancedWords = Array.from(uniqueWords).filter(word => 
    word.length > 2 && !COMMON_WORDS.has(word.toLowerCase())
  );
  const advancedRatio = advancedWords.length / uniqueWords.size;
  
  let vocabScore = 0;
  if (advancedRatio >= 0.3) vocabScore = 1.0;
  else if (advancedRatio >= 0.2) vocabScore = 0.7;
  else if (advancedRatio >= 0.1) vocabScore = 0.5;
  else vocabScore = 0.3;
  
  return (ttrScore + vocabScore) / 2;
}

/**
 * Calculate grammar score (0.25 weight)
 * Basic error detection using regex patterns
 */
function calculateGrammar(transcript: string): number {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return 0.1;
  
  let errorCount = 0;
  
  // Basic grammar error patterns
  const errors = [
    /\bi am not agree\b/g,        // Subject-verb agreement
    /\bhe don't\b/g,              // He don't vs doesn't
    /\bshe don't\b/g,
    /\bmuch people\b/g,           // Many vs much
    /\bless people\b/g,
    /\ba information\b/g,         // Uncountable nouns
    /\ban information\b/g,
    /\bmore better\b/g,           // Double comparatives
    /\bmore good\b/g,
    /\bi can to\b/g,              // Modal + infinitive
    /\bhe can to\b/g,
    /\bfor to\b/g,                // Preposition errors
  ];
  
  errors.forEach(pattern => {
    const matches = transcript.match(pattern);
    if (matches) errorCount += matches.length;
  });
  
  const errorDensity = errorCount / sentences.length;
  
  if (errorDensity === 0) return 1.0;
  if (errorDensity <= 0.1) return 0.8;
  if (errorDensity <= 0.2) return 0.6;
  if (errorDensity <= 0.3) return 0.4;
  return 0.2;
}

/**
 * Calculate task completion score (0.20 weight)
 * Check for structure markers and task-relevant content
 */
function calculateTasking(transcript: string, prompt: string): number {
  const lowerTranscript = transcript.toLowerCase();
  
  // Structure markers
  const structureMarkers = [
    'first', 'firstly', 'second', 'secondly', 'third', 'finally',
    'because', 'for example', 'such as', 'in conclusion',
    'on the other hand', 'however', 'therefore', 'moreover',
    'i think', 'in my opinion', 'personally', 'i believe'
  ];
  
  const markerCount = structureMarkers.filter(marker => 
    lowerTranscript.includes(marker)
  ).length;
  
  let structureScore = Math.min(1.0, markerCount / 3); // Up to 3 markers for full score
  
  // Task relevance (simple keyword matching)
  const promptKeywords = prompt.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !COMMON_WORDS.has(word));
  
  const relevantKeywords = promptKeywords.filter(keyword => 
    lowerTranscript.includes(keyword)
  );
  
  const relevanceScore = promptKeywords.length > 0 ? 
    relevantKeywords.length / promptKeywords.length : 0.5;
  
  return (structureScore + relevanceScore) / 2;
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
 * Validate speaking response format
 */
export function validateSpeakingResponse(
  item: SpeakingItem,
  response: SpeakingResponse
): boolean {
  return Boolean(response.asr?.text && response.asr.text.length > 0);
}