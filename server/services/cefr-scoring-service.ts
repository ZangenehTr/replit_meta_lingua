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
  private async initializeCEFRDescriptors() {
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
    const criteria = this.cefrDescriptors.get(`speaking-${targetLevel}`) || [];
    
    const prompt = `
You are a language assessment expert trained in CEFR evaluation. Evaluate this speaking sample against ${targetLevel} level criteria:

SPEAKING SAMPLE:
- Transcript: "${data.transcript}"
- Duration: ${data.duration} seconds
- Question: "${data.prompt}"

CEFR ${targetLevel} CRITERIA FOR SPEAKING:
${criteria.map(c => `- ${c.descriptor}`).join('\n')}

EVALUATION INSTRUCTIONS:
1. Analyze vocabulary range and accuracy
2. Assess grammatical structures used
3. Evaluate fluency and coherence
4. Check pronunciation and clarity
5. Determine if response meets ${targetLevel} descriptors

Respond in JSON format:
{
  "level": "${targetLevel}",
  "score": 0-100,
  "confidence": 0.0-1.0,
  "metCriteria": ["list of met criteria"],
  "unmetCriteria": ["list of unmet criteria"],
  "detailedFeedback": "specific feedback on performance",
  "recommendations": ["specific areas for improvement"]
}
`;

    try {
      const response = await this.ollamaService.generateResponse(
        prompt,
        { temperature: 0.3, max_tokens: 1000 }
      );
      
      return JSON.parse(response);
    } catch (error) {
      console.error('Error in CEFR speaking evaluation:', error);
      return this.getFallbackEvaluation(targetLevel, 'speaking');
    }
  }

  /**
   * Evaluate writing assessment using CEFR criteria
   */
  async evaluateWriting(data: WritingAssessmentData, targetLevel: CEFRLevel): Promise<CEFREvaluationResult> {
    const criteria = this.cefrDescriptors.get(`writing-${targetLevel}`) || [];
    
    const prompt = `
Evaluate this writing sample against CEFR ${targetLevel} level criteria:

WRITING SAMPLE:
- Text: "${data.text}"
- Word count: ${data.wordCount}
- Time spent: ${data.timeSpent} seconds
- Prompt: "${data.prompt}"

CEFR ${targetLevel} CRITERIA FOR WRITING:
${criteria.map(c => `- ${c.descriptor}`).join('\n')}

EVALUATION FOCUS:
1. Task fulfillment and content organization
2. Vocabulary range and precision
3. Grammatical accuracy and complexity
4. Coherence and cohesion
5. Register and style appropriateness

Provide detailed assessment in JSON format with the same structure as speaking evaluation.
`;

    try {
      const response = await this.ollamaService.generateResponse(
        prompt,
        { temperature: 0.3, max_tokens: 1000 }
      );
      
      return JSON.parse(response);
    } catch (error) {
      console.error('Error in CEFR writing evaluation:', error);
      return this.getFallbackEvaluation(targetLevel, 'writing');
    }
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