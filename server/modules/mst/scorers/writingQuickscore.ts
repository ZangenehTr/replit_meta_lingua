/**
 * Writing Quickscore Engine
 * Fast heuristic scoring for writing assessment
 */

import { WritingResponse, QuickscoreResult } from '../schemas/resultSchema';
import { WritingItem } from '../schemas/itemSchema';

// Common words for lexical analysis
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

// Discourse markers for coherence analysis
const DISCOURSE_MARKERS = [
  'however', 'therefore', 'moreover', 'furthermore', 'nevertheless', 'consequently',
  'in addition', 'on the other hand', 'in contrast', 'similarly', 'meanwhile',
  'first', 'second', 'third', 'finally', 'in conclusion', 'to summarize',
  'for example', 'for instance', 'such as', 'in particular', 'namely',
  'because', 'since', 'as a result', 'due to', 'owing to', 'so that',
  'although', 'even though', 'despite', 'in spite of', 'whereas', 'while'
];

/**
 * Score writing response using text analysis
 */
export function scoreWriting(
  item: WritingItem,
  response: WritingResponse | string
): QuickscoreResult {
  const startTime = Date.now();
  
  // Handle both object format {text: string} and plain string format
  let text: string;
  if (typeof response === 'string') {
    text = response.trim();
  } else if (response && typeof response.text === 'string') {
    text = response.text.trim();
  } else {
    // Invalid response format
    return {
      p: 0,
      route: 'down',
      features: { invalidResponse: 1 },
      computeTimeMs: Date.now() - startTime,
    };
  }
  
  if (text.length < 20) {
    return {
      p: 0,
      route: 'down',
      features: { tooShort: 1, textLength: text.length },
      computeTimeMs: Date.now() - startTime,
    };
  }
  
  const words = text.split(/\s+/).filter(word => word.length > 0);
  
  // Check minimum word requirement
  if (words.length < item.assets.minWords * 0.7) {
    return {
      p: 0.2,
      route: 'down',
      features: { 
        underLength: 1, 
        wordCount: words.length,
        required: item.assets.minWords 
      },
      computeTimeMs: Date.now() - startTime,
    };
  }
  
  // Feature calculations
  const taskScore = calculateTaskCompletion(text, item);
  const coherenceScore = calculateCoherence(text, words);
  const grammarScore = calculateGrammarWriting(text);
  const lexicalScore = calculateLexicalWriting(words);
  
  // Weighted combination (as per spec)
  const p = taskScore * 0.25 + 
            coherenceScore * 0.25 + 
            grammarScore * 0.25 + 
            lexicalScore * 0.25;
  
  const computeTime = Date.now() - startTime;
  
  const features = {
    task: taskScore,
    coherence: coherenceScore,
    grammar: grammarScore,
    lexical: lexicalScore,
    wordCount: words.length,
    sentenceCount: countSentences(text),
  };
  
  return {
    p: Math.max(0, Math.min(1, p)),
    route: routeFromScore(p),
    features,
    computeTimeMs: computeTime,
  };
}

/**
 * Calculate task completion score (0.25 weight)
 */
function calculateTaskCompletion(text: string, item: WritingItem): number {
  const lowerText = text.toLowerCase();
  
  // Check for stance/opinion markers
  const stanceMarkers = [
    'i think', 'i believe', 'in my opinion', 'personally', 'i agree', 'i disagree',
    'it is clear that', 'obviously', 'certainly', 'definitely', 'arguably'
  ];
  
  const hasStance = stanceMarkers.some(marker => lowerText.includes(marker));
  
  // Check for reasons/examples
  const reasonMarkers = [
    'because', 'since', 'for example', 'for instance', 'such as', 'like',
    'first', 'second', 'another reason', 'furthermore', 'moreover', 'also'
  ];
  
  const reasonCount = reasonMarkers.filter(marker => lowerText.includes(marker)).length;
  
  // Task-specific scoring
  let taskScore = 0;
  
  if (item.assets.taskType === 'opinion' || item.assets.taskType === 'argument') {
    taskScore = (hasStance ? 0.4 : 0) + Math.min(0.6, reasonCount * 0.3);
  } else if (item.assets.taskType === 'description') {
    const descriptiveWords = ['describe', 'look', 'appear', 'seem', 'color', 'size', 'shape'];
    const descCount = descriptiveWords.filter(word => lowerText.includes(word)).length;
    taskScore = Math.min(1.0, descCount * 0.2);
  } else if (item.assets.taskType === 'comparison') {
    const compMarkers = ['compared to', 'similar', 'different', 'unlike', 'whereas', 'while'];
    const compCount = compMarkers.filter(marker => lowerText.includes(marker)).length;
    taskScore = Math.min(1.0, compCount * 0.25);
  } else {
    taskScore = 0.5; // Default for unknown task types
  }
  
  return taskScore;
}

/**
 * Calculate coherence score (0.25 weight)
 */
function calculateCoherence(text: string, words: string[]): number {
  const lowerText = text.toLowerCase();
  
  // Count discourse markers
  const markerCount = DISCOURSE_MARKERS.filter(marker => 
    lowerText.includes(marker)
  ).length;
  
  // Normalize by text length
  const markerDensity = markerCount / (words.length / 100); // per 100 words
  
  let coherenceScore = 0;
  if (markerDensity >= 3) coherenceScore = 1.0;
  else if (markerDensity >= 2) coherenceScore = 0.8;
  else if (markerDensity >= 1) coherenceScore = 0.6;
  else if (markerDensity >= 0.5) coherenceScore = 0.4;
  else coherenceScore = 0.2;
  
  return coherenceScore;
}

/**
 * Calculate grammar score (0.25 weight)
 */
function calculateGrammarWriting(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return 0.1;
  
  let errorCount = 0;
  const lowerText = text.toLowerCase();
  
  // Grammar error patterns
  const errors = [
    /\bis\s+are\b/g,              // Verb confusion
    /\bare\s+is\b/g,
    /\ba\s+(?:information|advice|news|furniture)\b/g, // Uncountable nouns
    /\ban\s+(?:information|advice|news|furniture)\b/g,
    /\bmuch\s+(?:people|students|books)\b/g, // Much vs many
    /\bmany\s+(?:information|advice|money)\b/g,
    /\bmore\s+better\b/g,         // Double comparatives
    /\bmore\s+easier\b/g,
    /\bmore\s+faster\b/g,
    /\bdon't\s+have\s+no\b/g,     // Double negatives
    /\bcan't\s+not\b/g,
    /\bi\s+am\s+agree\b/g,        // Verb patterns
    /\bhe\s+don't\b/g,            // Subject-verb agreement
    /\bshe\s+don't\b/g,
    /\bit\s+don't\b/g,
  ];
  
  // Count spelling errors (simple approach)
  const possibleSpellingErrors = text.match(/\b[a-z]*[0-9]+[a-z]*\b/g) || [];
  errorCount += possibleSpellingErrors.length;
  
  errors.forEach(pattern => {
    const matches = text.match(pattern);
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
 * Calculate lexical score (0.25 weight)
 */
function calculateLexicalWriting(words: string[]): number {
  const cleanWords = words.map(w => w.replace(/[^\w]/g, '').toLowerCase());
  const uniqueWords = new Set(cleanWords.filter(w => w.length > 0));
  
  // Type-token ratio
  const typeTokenRatio = uniqueWords.size / cleanWords.length;
  
  let ttrScore = 0;
  if (typeTokenRatio >= 0.6) ttrScore = 1.0;
  else if (typeTokenRatio >= 0.5) ttrScore = 0.8;
  else if (typeTokenRatio >= 0.4) ttrScore = 0.6;
  else if (typeTokenRatio >= 0.3) ttrScore = 0.4;
  else ttrScore = 0.2;
  
  // Advanced vocabulary ratio
  const advancedWords = Array.from(uniqueWords).filter(word => 
    word.length > 3 && !COMMON_WORDS.has(word)
  );
  const advancedRatio = advancedWords.length / uniqueWords.size;
  
  let vocabScore = 0;
  if (advancedRatio >= 0.4) vocabScore = 1.0;
  else if (advancedRatio >= 0.3) vocabScore = 0.8;
  else if (advancedRatio >= 0.2) vocabScore = 0.6;
  else if (advancedRatio >= 0.1) vocabScore = 0.4;
  else vocabScore = 0.2;
  
  return (ttrScore + vocabScore) / 2;
}

/**
 * Count sentences in text
 */
function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
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
 * Map writing score directly to CEFR level (for single question approach)
 */
export function mapScoreToLevel(p: number): string {
  if (p >= 0.90) return 'C1'; // Exceptional performance
  if (p >= 0.75) return 'B2'; // Good performance with sophisticated language
  if (p >= 0.60) return 'B1'; // Adequate performance meeting B1 criteria
  if (p >= 0.45) return 'A2'; // Basic performance with simple structures
  return 'A1'; // Needs significant work on fundamental skills
}

/**
 * Get detailed level justification for feedback
 */
export function getLevelJustification(p: number, features: any): string {
  const level = mapScoreToLevel(p);
  const task = Math.round(features.task * 100);
  const coherence = Math.round(features.coherence * 100);
  const grammar = Math.round(features.grammar * 100);
  const lexical = Math.round(features.lexical * 100);
  
  switch (level) {
    case 'C1':
      return `Exceptional ${level} level writing. Task completion: ${task}%, Coherence: ${coherence}%, Grammar: ${grammar}%, Vocabulary: ${lexical}%. Shows sophisticated language control and complex ideas.`;
    case 'B2':
      return `Strong ${level} level writing. Task completion: ${task}%, Coherence: ${coherence}%, Grammar: ${grammar}%, Vocabulary: ${lexical}%. Good range of language with clear argumentation.`;
    case 'B1':
      return `Solid ${level} level writing. Task completion: ${task}%, Coherence: ${coherence}%, Grammar: ${grammar}%, Vocabulary: ${lexical}%. Meets intermediate criteria with adequate language control.`;
    case 'A2':
      return `Basic ${level} level writing. Task completion: ${task}%, Coherence: ${coherence}%, Grammar: ${grammar}%, Vocabulary: ${lexical}%. Simple but communicative with room for improvement.`;
    case 'A1':
      return `Elementary ${level} level writing. Task completion: ${task}%, Coherence: ${coherence}%, Grammar: ${grammar}%, Vocabulary: ${lexical}%. Focus needed on fundamental language skills.`;
    default:
      return `${level} level writing with ${Math.round(p * 100)}% overall score.`;
  }
}

/**
 * Validate writing response format
 */
export function validateWritingResponse(
  item: WritingItem,
  response: WritingResponse | string
): boolean {
  if (typeof response === 'string') {
    return response.trim().length > 0;
  } else if (response && typeof response.text === 'string') {
    return response.text.trim().length > 0;
  }
  return false;
}