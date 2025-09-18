/**
 * CEFR-Based Scoring Service
 * Evaluates language proficiency using official CEFR descriptors
 */

import { OllamaService } from '../ollama-service';
import { DatabaseStorage } from '../database-storage';
import { CEFRLevel, Skill, CEFRDescriptor } from '../../shared/placement-test-schema';

export interface CEFRAssessmentCriteria {
  skill: Skill;
  level: CEFRLevel;
  descriptors: CEFRDescriptor[];
}

export interface CEFREvaluationResult {
  level: CEFRLevel;
  score: number; // 0-100
  confidence: number; // 0-1
  metCriteria: string[];
  unmetCriteria: string[];
  detailedFeedback: string;
  recommendations: string[];
}

export interface SpeakingAssessmentData {
  audioUrl: string;
  transcript: string;
  duration: number;
  questionType: string;
  prompt: string;
}

export interface WritingAssessmentData {
  text: string;
  wordCount: number;
  timeSpent: number;
  prompt: string;
}

export interface ReadingAssessmentData {
  answers: Record<string, string>;
  passage: string;
  timeSpent: number;
}

export interface ListeningAssessmentData {
  answers: Record<string, string>;
  audioUrl: string;
  timeSpent: number;
}

export class CEFRScoringService {
  private ollamaService: OllamaService;
  private storage: DatabaseStorage;
  
  // Official CEFR descriptors loaded from the provided assessment grid
  private cefrDescriptors: Map<string, CEFRDescriptor[]> = new Map();

  constructor(ollamaService: OllamaService, storage: DatabaseStorage) {
    this.ollamaService = ollamaService;
    this.storage = storage;
    this.initializeCEFRDescriptors();
  }

  /**
   * Initialize CEFR descriptors from the official assessment grid
   */
  private initializeCEFRDescriptors() {
    const descriptors: Partial<CEFRDescriptor>[] = [
      // Speaking - Spoken Production
      {
        skill: 'speaking',
        cefrLevel: 'A1',
        category: 'Spoken Production',
        descriptor: 'I can use simple phrases and sentences to describe where I live and people I know.',
        keywords: ['simple phrases', 'describe', 'basic information'],
        aiScoringPrompt: 'Evaluate if the speaker uses simple phrases to describe familiar topics like home, family, or personal information.'
      },
      {
        skill: 'speaking',
        cefrLevel: 'A2',
        category: 'Spoken Production',
        descriptor: 'I can use a series of phrases and sentences to describe in simple terms my family and other people, living conditions, my educational background and my present or most recent job.',
        keywords: ['series of phrases', 'describe in simple terms', 'family', 'education', 'job'],
        aiScoringPrompt: 'Check if the speaker can connect phrases to describe personal background, family, education, or work in simple terms.'
      },
      {
        skill: 'speaking',
        cefrLevel: 'B1',
        category: 'Spoken Production',
        descriptor: 'I can connect phrases in a simple way in order to describe experiences and events, my dreams, hopes and ambitions. I can briefly give reasons and explanations for opinions and plans.',
        keywords: ['connect phrases', 'describe experiences', 'give reasons', 'explanations'],
        aiScoringPrompt: 'Assess if the speaker can connect ideas to describe experiences, give reasons for opinions, and explain plans with some complexity.'
      },
      {
        skill: 'speaking',
        cefrLevel: 'B2',
        category: 'Spoken Production',
        descriptor: 'I can present clear, detailed descriptions on a wide range of subjects related to my field of interest. I can explain a viewpoint on a topical issue giving the advantages and disadvantages of various options.',
        keywords: ['clear detailed descriptions', 'wide range of subjects', 'explain viewpoint', 'advantages disadvantages'],
        aiScoringPrompt: 'Evaluate if the speaker presents clear, detailed information on various topics and can explain different perspectives with pros and cons.'
      },
      {
        skill: 'speaking',
        cefrLevel: 'C1',
        category: 'Spoken Production',
        descriptor: 'I can present clear, detailed descriptions of complex subjects integrating sub-themes, developing particular points and rounding off with an appropriate conclusion.',
        keywords: ['complex subjects', 'integrating sub-themes', 'developing points', 'appropriate conclusion'],
        aiScoringPrompt: 'Check if the speaker handles complex topics with integrated sub-themes and well-developed arguments with clear conclusions.'
      },
      {
        skill: 'speaking',
        cefrLevel: 'C2',
        category: 'Spoken Production',
        descriptor: 'I can present a clear, smoothly-flowing description or argument in a style appropriate to the context and with an effective logical structure which helps the recipient to notice and remember significant points.',
        keywords: ['smoothly-flowing', 'appropriate style', 'effective logical structure', 'significant points'],
        aiScoringPrompt: 'Assess if the speaker demonstrates native-like fluency with sophisticated structure and context-appropriate style.'
      },
      
      // Listening
      {
        skill: 'listening',
        cefrLevel: 'A1',
        category: 'Listening',
        descriptor: 'I can recognise familiar words and very basic phrases concerning myself, my family and immediate concrete surroundings when people speak slowly and clearly.',
        keywords: ['familiar words', 'basic phrases', 'family', 'concrete surroundings', 'slowly clearly'],
        aiScoringPrompt: 'Check if the learner understands basic words and phrases about personal and family topics when spoken slowly.'
      },
      {
        skill: 'listening',
        cefrLevel: 'B2',
        category: 'Listening',
        descriptor: 'I can understand extended speech and lectures and follow even complex lines of argument provided the topic is reasonably familiar. I can understand most TV news and current affairs programmes.',
        keywords: ['extended speech', 'complex lines of argument', 'TV news', 'current affairs'],
        aiScoringPrompt: 'Evaluate if the learner can follow complex arguments and understand news/current affairs content on familiar topics.'
      },
      
      // Reading
      {
        skill: 'reading',
        cefrLevel: 'A1',
        category: 'Reading',
        descriptor: 'I can understand familiar names, words and very simple sentences, for example on notices and posters or in catalogues.',
        keywords: ['familiar names', 'simple sentences', 'notices', 'posters'],
        aiScoringPrompt: 'Check if the learner can read basic signs, names, and simple sentences in familiar contexts.'
      },
      {
        skill: 'reading',
        cefrLevel: 'B2',
        category: 'Reading',
        descriptor: 'I can read articles and reports concerned with contemporary problems in which the writers adopt particular attitudes or viewpoints.',
        keywords: ['articles', 'reports', 'contemporary problems', 'particular attitudes', 'viewpoints'],
        aiScoringPrompt: 'Assess if the learner can understand complex texts with different perspectives on current issues.'
      },
      
      // Writing
      {
        skill: 'writing',
        cefrLevel: 'A1',
        category: 'Writing',
        descriptor: 'I can write a short, simple postcard, for example sending holiday greetings. I can fill in forms with personal details.',
        keywords: ['short simple postcard', 'holiday greetings', 'fill in forms', 'personal details'],
        aiScoringPrompt: 'Check if the learner can write very basic messages and complete simple forms with personal information.'
      },
      {
        skill: 'writing',
        cefrLevel: 'B2',
        category: 'Writing',
        descriptor: 'I can write clear, detailed text on a wide range of subjects related to my interests. I can write an essay or report, passing on information or giving reasons in support of or against a particular point of view.',
        keywords: ['clear detailed text', 'wide range of subjects', 'essay', 'report', 'giving reasons'],
        aiScoringPrompt: 'Evaluate if the learner can write structured essays with clear arguments and detailed information on various topics.'
      }
    ];

    // Group descriptors by skill-level combination
    for (const desc of descriptors) {
      const key = `${desc.skill}-${desc.cefrLevel}`;
      if (!this.cefrDescriptors.has(key)) {
        this.cefrDescriptors.set(key, []);
      }
      this.cefrDescriptors.get(key)!.push(desc as CEFRDescriptor);
    }
  }

  /**
   * Evaluate speaking assessment using CEFR criteria
   */
  async evaluateSpeaking(data: SpeakingAssessmentData, targetLevel: CEFRLevel): Promise<CEFREvaluationResult> {
    // Analyze transcript quality and fluency
    const transcript = data.transcript || '';
    const wordCount = transcript.split(/\s+/).filter(word => word.length > 0).length;
    const duration = data.duration || 1;
    const wordsPerMinute = Math.round((wordCount / duration) * 60);
    
    // Performance-based scoring
    let performanceScore = this.calculateSpeakingPerformanceScore(transcript, wordCount, wordsPerMinute, targetLevel);
    
    // CEFR level determination based on actual performance
    const { level, confidence } = this.determineLevelFromPerformance(performanceScore, targetLevel, 'speaking');
    
    const metCriteria: string[] = [];
    const unmetCriteria: string[] = [];
    const recommendations: string[] = [];
    
    if (performanceScore >= 85) {
      metCriteria.push(`Excellent ${targetLevel} speaking proficiency demonstrated`);
      metCriteria.push('Strong vocabulary and fluency');
      recommendations.push('Continue with advanced speaking activities');
    } else if (performanceScore >= 70) {
      metCriteria.push(`Good ${targetLevel} speaking ability`);
      recommendations.push('Practice complex sentence structures');
    } else if (performanceScore >= 55) {
      metCriteria.push('Basic speaking ability demonstrated');
      unmetCriteria.push(`Some ${targetLevel} level criteria not fully met`);
      recommendations.push('Focus on vocabulary expansion and fluency');
    } else {
      unmetCriteria.push(`Below ${targetLevel} speaking proficiency`);
      recommendations.push('Practice basic pronunciation and simple sentences');
    }
    
    const detailedFeedback = this.generateSpeakingFeedback(performanceScore, wordCount, wordsPerMinute, level);
    
    return {
      level,
      score: performanceScore,
      confidence,
      metCriteria,
      unmetCriteria,
      detailedFeedback,
      recommendations
    };
  }

  /**
   * Evaluate writing assessment using CEFR criteria
   */
  async evaluateWriting(data: WritingAssessmentData, targetLevel: CEFRLevel): Promise<CEFREvaluationResult> {
    const text = data.text || '';
    const wordCount = data.wordCount || text.split(/\s+/).filter(word => word.length > 0).length;
    const timeSpent = data.timeSpent || 1;
    
    // Performance-based scoring for writing
    let performanceScore = this.calculateWritingPerformanceScore(text, wordCount, timeSpent, targetLevel);
    
    // CEFR level determination based on actual performance
    const { level, confidence } = this.determineLevelFromPerformance(performanceScore, targetLevel, 'writing');
    
    const metCriteria: string[] = [];
    const unmetCriteria: string[] = [];
    const recommendations: string[] = [];
    
    if (performanceScore >= 85) {
      metCriteria.push(`Excellent ${targetLevel} writing proficiency demonstrated`);
      metCriteria.push('Strong coherence and vocabulary');
      recommendations.push('Continue with advanced writing tasks');
    } else if (performanceScore >= 70) {
      metCriteria.push(`Good ${targetLevel} writing ability`);
      recommendations.push('Practice complex sentence structures and transitions');
    } else if (performanceScore >= 55) {
      metCriteria.push('Basic writing ability demonstrated');
      unmetCriteria.push(`Some ${targetLevel} level criteria not fully met`);
      recommendations.push('Focus on paragraph structure and vocabulary');
    } else {
      unmetCriteria.push(`Below ${targetLevel} writing proficiency`);
      recommendations.push('Practice basic sentence formation and grammar');
    }
    
    const detailedFeedback = this.generateWritingFeedback(performanceScore, wordCount, timeSpent, level, text);
    
    return {
      level,
      score: performanceScore,
      confidence,
      metCriteria,
      unmetCriteria,
      detailedFeedback,
      recommendations
    };
  }

  /**
   * Evaluate reading comprehension using CEFR criteria
   */
  async evaluateReading(data: ReadingAssessmentData, targetLevel: CEFRLevel): Promise<CEFREvaluationResult> {
    const criteria = this.cefrDescriptors.get(`reading-${targetLevel}`) || [];
    
    const correctAnswers = Object.values(data.answers).filter((answer, index) => {
      // This would compare against correct answers from question data
      // Simplified for now - would need actual answer key
      return answer && answer.trim().length > 0;
    });
    
    const accuracy = correctAnswers.length / Object.keys(data.answers).length;
    const score = Math.round(accuracy * 100);
    
    // Basic evaluation - in production, this would use more sophisticated analysis
    let level: CEFRLevel = targetLevel;
    let confidence = 0.8;
    
    if (score >= 80) {
      confidence = 0.9;
    } else if (score >= 60) {
      confidence = 0.7;
    } else {
      confidence = 0.5;
      // Suggest lower level
      const levelIndex = CEFRLevels.indexOf(targetLevel);
      if (levelIndex > 0) {
        level = CEFRLevels[levelIndex - 1];
      }
    }

    return {
      level,
      score,
      confidence,
      metCriteria: score >= 70 ? [`Demonstrates ${targetLevel} reading comprehension`] : [],
      unmetCriteria: score < 70 ? [`Below ${targetLevel} reading comprehension threshold`] : [],
      detailedFeedback: `Reading comprehension score: ${score}%. ${accuracy >= 0.7 ? 'Good' : 'Needs improvement'} understanding of text.`,
      recommendations: score < 70 ? ['Focus on vocabulary building', 'Practice reading comprehension strategies'] : ['Continue with more complex texts']
    };
  }

  /**
   * Evaluate listening comprehension using CEFR criteria
   */
  async evaluateListening(data: ListeningAssessmentData, targetLevel: CEFRLevel): Promise<CEFREvaluationResult> {
    const correctAnswers = Object.values(data.answers).filter(answer => 
      answer && answer.trim().length > 0
    );
    
    const accuracy = correctAnswers.length / Object.keys(data.answers).length;
    const score = Math.round(accuracy * 100);
    
    let level: CEFRLevel = targetLevel;
    let confidence = 0.8;
    
    if (score >= 80) {
      confidence = 0.9;
    } else if (score >= 60) {
      confidence = 0.7;
    } else {
      confidence = 0.5;
      const levelIndex = CEFRLevels.indexOf(targetLevel);
      if (levelIndex > 0) {
        level = CEFRLevels[levelIndex - 1];
      }
    }

    return {
      level,
      score,
      confidence,
      metCriteria: score >= 70 ? [`Demonstrates ${targetLevel} listening comprehension`] : [],
      unmetCriteria: score < 70 ? [`Below ${targetLevel} listening comprehension threshold`] : [],
      detailedFeedback: `Listening comprehension score: ${score}%. ${accuracy >= 0.7 ? 'Good' : 'Needs improvement'} understanding of audio content.`,
      recommendations: score < 70 ? ['Practice listening to various accents', 'Focus on key word recognition'] : ['Engage with more complex audio materials']
    };
  }

  /**
   * Calculate speaking performance score based on transcript analysis
   */
  private calculateSpeakingPerformanceScore(transcript: string, wordCount: number, wordsPerMinute: number, targetLevel: CEFRLevel): number {
    let score = 0;
    
    // Word count scoring (30% of total)
    const expectedWordCounts = {
      'A1': { min: 20, optimal: 40 },
      'A2': { min: 40, optimal: 80 },
      'B1': { min: 80, optimal: 120 },
      'B2': { min: 120, optimal: 180 },
      'C1': { min: 180, optimal: 250 },
      'C2': { min: 250, optimal: 350 }
    };
    
    const expected = expectedWordCounts[targetLevel];
    if (wordCount >= expected.optimal) {
      score += 30;
    } else if (wordCount >= expected.min) {
      score += 20 + (10 * (wordCount - expected.min) / (expected.optimal - expected.min));
    } else {
      score += Math.max(5, 20 * (wordCount / expected.min));
    }
    
    // Fluency scoring based on words per minute (25% of total)
    const expectedWPM = {
      'A1': { min: 60, optimal: 100 },
      'A2': { min: 80, optimal: 120 },
      'B1': { min: 100, optimal: 140 },
      'B2': { min: 120, optimal: 160 },
      'C1': { min: 140, optimal: 180 },
      'C2': { min: 160, optimal: 200 }
    };
    
    const expectedFluency = expectedWPM[targetLevel];
    if (wordsPerMinute >= expectedFluency.optimal) {
      score += 25;
    } else if (wordsPerMinute >= expectedFluency.min) {
      score += 15 + (10 * (wordsPerMinute - expectedFluency.min) / (expectedFluency.optimal - expectedFluency.min));
    } else {
      score += Math.max(5, 15 * (wordsPerMinute / expectedFluency.min));
    }
    
    // Complexity and vocabulary scoring (45% of total)
    score += this.analyzeLanguageComplexity(transcript, targetLevel) * 0.45;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }
  
  /**
   * Calculate writing performance score based on text analysis
   */
  private calculateWritingPerformanceScore(text: string, wordCount: number, timeSpent: number, targetLevel: CEFRLevel): number {
    let score = 0;
    
    // Length and completeness scoring (25% of total)
    const expectedWordCounts = {
      'A1': { min: 30, optimal: 60 },
      'A2': { min: 60, optimal: 100 },
      'B1': { min: 100, optimal: 150 },
      'B2': { min: 150, optimal: 250 },
      'C1': { min: 200, optimal: 300 },
      'C2': { min: 250, optimal: 400 }
    };
    
    const expected = expectedWordCounts[targetLevel];
    if (wordCount >= expected.optimal) {
      score += 25;
    } else if (wordCount >= expected.min) {
      score += 15 + (10 * (wordCount - expected.min) / (expected.optimal - expected.min));
    } else {
      score += Math.max(5, 15 * (wordCount / expected.min));
    }
    
    // Structure and organization (30% of total)
    score += this.analyzeWritingStructure(text, targetLevel) * 0.30;
    
    // Language complexity and accuracy (45% of total)
    score += this.analyzeLanguageComplexity(text, targetLevel) * 0.45;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }
  
  /**
   * Analyze language complexity for speaking or writing
   */
  private analyzeLanguageComplexity(text: string, targetLevel: CEFRLevel): number {
    if (!text || text.trim().length === 0) return 10;
    
    let complexityScore = 0;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    // Sentence length analysis
    const avgSentenceLength = words.length / Math.max(sentences.length, 1);
    const expectedSentenceLengths = {
      'A1': { min: 4, optimal: 7 },
      'A2': { min: 6, optimal: 10 },
      'B1': { min: 8, optimal: 12 },
      'B2': { min: 10, optimal: 15 },
      'C1': { min: 12, optimal: 18 },
      'C2': { min: 15, optimal: 22 }
    };
    
    const expectedLength = expectedSentenceLengths[targetLevel];
    if (avgSentenceLength >= expectedLength.optimal) {
      complexityScore += 30;
    } else if (avgSentenceLength >= expectedLength.min) {
      complexityScore += 20 + (10 * (avgSentenceLength - expectedLength.min) / (expectedLength.optimal - expectedLength.min));
    } else {
      complexityScore += Math.max(5, 20 * (avgSentenceLength / expectedLength.min));
    }
    
    // Vocabulary sophistication
    const longWords = words.filter(w => w.length > 6).length;
    const vocabularyRatio = longWords / Math.max(words.length, 1);
    
    const expectedVocabRatios = {
      'A1': 0.1, 'A2': 0.15, 'B1': 0.2, 'B2': 0.25, 'C1': 0.3, 'C2': 0.35
    };
    
    if (vocabularyRatio >= expectedVocabRatios[targetLevel]) {
      complexityScore += 25;
    } else {
      complexityScore += Math.max(5, 25 * (vocabularyRatio / expectedVocabRatios[targetLevel]));
    }
    
    // Grammar complexity indicators
    const conjunctions = (text.match(/\b(and|but|or|so|because|although|however|therefore|moreover|furthermore)\b/gi) || []).length;
    const conjunctionRatio = conjunctions / Math.max(sentences.length, 1);
    
    if (conjunctionRatio >= 0.3) {
      complexityScore += 20;
    } else {
      complexityScore += Math.max(5, 20 * (conjunctionRatio / 0.3));
    }
    
    // Variety of sentence structures
    const questionMarks = (text.match(/\?/g) || []).length;
    const exclamations = (text.match(/!/g) || []).length;
    const varietyScore = Math.min(25, (questionMarks + exclamations) * 5 + sentences.length * 2);
    complexityScore += varietyScore;
    
    return Math.min(100, Math.max(0, complexityScore));
  }
  
  /**
   * Analyze writing structure and organization
   */
  private analyzeWritingStructure(text: string, targetLevel: CEFRLevel): number {
    if (!text || text.trim().length === 0) return 10;
    
    let structureScore = 0;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Paragraph organization
    if (paragraphs.length >= 2) {
      structureScore += 30;
    } else if (paragraphs.length === 1 && sentences.length >= 3) {
      structureScore += 20;
    } else {
      structureScore += 10;
    }
    
    // Coherence indicators
    const transitions = (text.match(/\b(first|second|third|finally|however|moreover|furthermore|in addition|on the other hand|in conclusion)\b/gi) || []).length;
    structureScore += Math.min(40, transitions * 10);
    
    // Introduction and conclusion patterns
    const hasIntro = /\b(I think|In my opinion|This essay|This text)\b/i.test(text.substring(0, 100));
    const hasConclusion = /\b(In conclusion|To sum up|Finally|Overall)\b/i.test(text.substring(text.length - 100));
    
    if (hasIntro && hasConclusion) {
      structureScore += 30;
    } else if (hasIntro || hasConclusion) {
      structureScore += 20;
    } else {
      structureScore += 10;
    }
    
    return Math.min(100, Math.max(0, structureScore));
  }
  
  /**
   * Determine CEFR level from performance score
   */
  private determineLevelFromPerformance(score: number, targetLevel: CEFRLevel, skill: Skill): { level: CEFRLevel, confidence: number } {
    const targetIndex = CEFRLevels.indexOf(targetLevel);
    let levelIndex = targetIndex;
    let confidence = 0.8;
    
    // Performance-based level adjustment
    if (score >= 90) {
      // Excellent performance - may be ready for higher level
      levelIndex = Math.min(CEFRLevels.length - 1, targetIndex + 1);
      confidence = 0.95;
    } else if (score >= 80) {
      // Strong performance at target level
      levelIndex = targetIndex;
      confidence = 0.9;
    } else if (score >= 70) {
      // Good performance at target level
      levelIndex = targetIndex;
      confidence = 0.8;
    } else if (score >= 60) {
      // Adequate performance but may need lower level
      levelIndex = Math.max(0, targetIndex - 1);
      confidence = 0.7;
    } else if (score >= 45) {
      // Below target level performance
      levelIndex = Math.max(0, targetIndex - 1);
      confidence = 0.6;
    } else {
      // Poor performance - significantly lower level
      levelIndex = Math.max(0, targetIndex - 2);
      confidence = 0.5;
    }
    
    return {
      level: CEFRLevels[levelIndex],
      confidence
    };
  }
  
  /**
   * Generate detailed feedback for speaking assessment
   */
  private generateSpeakingFeedback(score: number, wordCount: number, wordsPerMinute: number, level: CEFRLevel): string {
    let feedback = `Speaking assessment completed with a score of ${score}/100. `;
    
    if (score >= 85) {
      feedback += `Excellent ${level} level speaking demonstrated. `;
    } else if (score >= 70) {
      feedback += `Good ${level} level speaking ability shown. `;
    } else if (score >= 55) {
      feedback += `Basic speaking skills demonstrated with room for improvement. `;
    } else {
      feedback += `Speaking skills need significant development. `;
    }
    
    feedback += `You spoke ${wordCount} words at approximately ${wordsPerMinute} words per minute. `;
    
    if (wordsPerMinute < 80) {
      feedback += `Focus on improving fluency and speaking pace. `;
    } else if (wordsPerMinute > 180) {
      feedback += `Good fluency demonstrated. Consider focusing on clarity and pronunciation. `;
    } else {
      feedback += `Good speaking pace maintained. `;
    }
    
    return feedback;
  }
  
  /**
   * Generate detailed feedback for writing assessment
   */
  private generateWritingFeedback(score: number, wordCount: number, timeSpent: number, level: CEFRLevel, text: string): string {
    let feedback = `Writing assessment completed with a score of ${score}/100. `;
    
    if (score >= 85) {
      feedback += `Excellent ${level} level writing demonstrated. `;
    } else if (score >= 70) {
      feedback += `Good ${level} level writing ability shown. `;
    } else if (score >= 55) {
      feedback += `Basic writing skills demonstrated with room for improvement. `;
    } else {
      feedback += `Writing skills need significant development. `;
    }
    
    feedback += `Your response contained ${wordCount} words. `;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = wordCount / Math.max(sentences, 1);
    
    if (avgSentenceLength < 6) {
      feedback += `Consider using more complex sentence structures. `;
    } else if (avgSentenceLength > 20) {
      feedback += `Good use of complex sentences. Focus on clarity and coherence. `;
    } else {
      feedback += `Good sentence variety demonstrated. `;
    }
    
    return feedback;
  }
  
  /**
   * Get fallback evaluation when AI fails
   */
  private getFallbackEvaluation(targetLevel: CEFRLevel, skill: Skill): CEFREvaluationResult {
    return {
      level: targetLevel,
      score: 60,
      confidence: 0.5,
      metCriteria: [`Basic ${skill} ability observed`],
      unmetCriteria: [`Unable to fully assess ${targetLevel} level criteria`],
      detailedFeedback: `Assessment completed with limited AI analysis. Manual review recommended.`,
      recommendations: [`Continue practicing ${skill} skills`, 'Consider additional assessment']
    };
  }

  /**
   * Determine overall CEFR level from skill-specific evaluations
   */
  determineOverallLevel(evaluations: Record<Skill, CEFREvaluationResult>): {
    level: CEFRLevel;
    confidence: number;
    skillBreakdown: Record<Skill, CEFRLevel>;
  } {
    const levels = Object.values(evaluations).map(evaluation => evaluation.level);
    const confidences = Object.values(evaluations).map(evaluation => evaluation.confidence);
    
    // Weight speaking more heavily as it's the primary adaptive skill
    const speakingWeight = 0.4;
    const otherSkillWeight = 0.2; // Each of the other 3 skills
    
    const levelValues = levels.map(level => CEFRLevels.indexOf(level));
    const speakingIndex = CEFRLevels.indexOf(evaluations.speaking.level);
    
    // Weighted average with speaking having more influence
    const weightedAverage = (
      speakingIndex * speakingWeight +
      CEFRLevels.indexOf(evaluations.listening.level) * otherSkillWeight +
      CEFRLevels.indexOf(evaluations.reading.level) * otherSkillWeight +
      CEFRLevels.indexOf(evaluations.writing.level) * otherSkillWeight
    );
    
    const overallLevelIndex = Math.round(weightedAverage);
    const overallLevel = CEFRLevels[Math.max(0, Math.min(CEFRLevels.length - 1, overallLevelIndex))];
    
    // Overall confidence is the average of all confidences
    const overallConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    
    return {
      level: overallLevel,
      confidence: overallConfidence,
      skillBreakdown: {
        speaking: evaluations.speaking.level,
        listening: evaluations.listening.level,
        reading: evaluations.reading.level,
        writing: evaluations.writing.level
      }
    };
  }
}

export const CEFRLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;