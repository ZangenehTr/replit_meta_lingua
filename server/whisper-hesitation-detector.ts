/**
 * Whisper-based Hesitation Detection Engine
 * Analyzes real-time Whisper transcription segments with timestamps
 * to detect speech hesitations and calculate engagement scores
 */

import { EventEmitter } from 'events';
import { TranscriptionResult } from './whisper-service';

interface HesitationSegment {
  start: number;
  end: number;
  text: string;
  speaker: 'student' | 'teacher';
  hesitationType?: 'silence' | 'filler_word' | 'repetition' | 'false_start';
  severity: number; // 0-1 scale
  confidence: number;
}

interface HesitationScore {
  sessionId: string;
  speaker: 'student' | 'teacher';
  overallScore: number; // 0-1, lower = more hesitation
  hesitationRate: number; // hesitations per minute
  averageSilenceLength: number; // in seconds
  fillerWordCount: number;
  recentHesitations: HesitationSegment[];
  timestamp: number;
}

interface HesitationPattern {
  type: 'silence' | 'filler_word' | 'repetition' | 'false_start';
  pattern: RegExp | number; // RegExp for text patterns, number for timing thresholds
  severity: number;
  languages: string[]; // Supported languages for this pattern
}

export class WhisperHesitationDetector extends EventEmitter {
  private sessionHesitations: Map<string, HesitationScore> = new Map();
  private hesitationPatterns: HesitationPattern[] = [];
  private readonly SILENCE_THRESHOLD = 0.8; // seconds
  private readonly ANALYSIS_WINDOW = 60000; // 1 minute rolling window
  
  constructor() {
    super();
    this.initializePatterns();
  }

  /**
   * Initialize hesitation patterns for multiple languages
   */
  private initializePatterns(): void {
    this.hesitationPatterns = [
      // English filler words
      {
        type: 'filler_word',
        pattern: /\b(um|uh|er|ah|like|you know|i mean|basically|actually|sort of|kind of)\b/gi,
        severity: 0.3,
        languages: ['en']
      },
      // Persian/Farsi filler words  
      {
        type: 'filler_word',
        pattern: /\b(اَم|اُه|یعنی|خب|راستش|ببین|چیزی|اون|این|یه جورایی)\b/gu,
        severity: 0.3,
        languages: ['fa']
      },
      // Arabic filler words
      {
        type: 'filler_word', 
        pattern: /\b(اممم|اه|يعني|طيب|بصراحة|شوف|حاجة|اللي|ده|كده)\b/gu,
        severity: 0.3,
        languages: ['ar']
      },
      // Repetition patterns (multi-language)
      {
        type: 'repetition',
        pattern: /\b(\p{L}+)\s+\1\b/gu,
        severity: 0.4,
        languages: ['en', 'fa', 'ar']
      },
      // False starts (incomplete words/sentences)
      {
        type: 'false_start',
        pattern: /\b\p{L}{1,2}\s+\p{L}+/gu,
        severity: 0.5,
        languages: ['en', 'fa', 'ar']
      }
    ];
  }

  /**
   * Analyze Whisper transcription result for hesitations
   */
  async analyzeTranscription(
    sessionId: string,
    transcription: TranscriptionResult,
    speaker: 'student' | 'teacher',
    language: string = 'en'
  ): Promise<HesitationScore> {
    const hesitations: HesitationSegment[] = [];
    
    // Analyze segments if available (preferred for timing analysis)
    if (transcription.segments && transcription.segments.length > 0) {
      hesitations.push(...this.analyzeSegments(transcription.segments, speaker, language));
    } else {
      // Fallback to text-only analysis
      hesitations.push(...this.analyzeText(transcription.text, speaker, language, transcription.duration));
    }

    // Calculate hesitation score
    const score = this.calculateHesitationScore(sessionId, speaker, hesitations);
    
    // Store and emit updates
    this.sessionHesitations.set(`${sessionId}_${speaker}`, score);
    this.emit('hesitation-detected', score);
    
    return score;
  }

  /**
   * Analyze Whisper segments for timing-based hesitations
   */
  private analyzeSegments(
    segments: Array<{ start: number; end: number; text: string }>,
    speaker: 'student' | 'teacher',
    language: string
  ): HesitationSegment[] {
    const hesitations: HesitationSegment[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const nextSegment = segments[i + 1];

      // Check for long silences between segments
      if (nextSegment) {
        const silenceLength = nextSegment.start - segment.end;
        if (silenceLength > this.SILENCE_THRESHOLD) {
          hesitations.push({
            start: segment.end,
            end: nextSegment.start,
            text: `[silence: ${silenceLength.toFixed(1)}s]`,
            speaker,
            hesitationType: 'silence',
            severity: Math.min(silenceLength / 3.0, 1.0), // Scale up to 3 seconds
            confidence: 0.9 // High confidence for silence detection
          });
        }
      }

      // Analyze text patterns within segment
      const textHesitations = this.analyzeSegmentText(segment, speaker, language);
      hesitations.push(...textHesitations);
    }

    return hesitations;
  }

  /**
   * Analyze text within a single segment for hesitation patterns
   */
  private analyzeSegmentText(
    segment: { start: number; end: number; text: string },
    speaker: 'student' | 'teacher',
    language: string
  ): HesitationSegment[] {
    const hesitations: HesitationSegment[] = [];
    const text = segment.text.toLowerCase();

    // Check each hesitation pattern
    for (const pattern of this.hesitationPatterns) {
      if (!pattern.languages.includes(language)) continue;
      
      if (pattern.pattern instanceof RegExp) {
        const matches = [...text.matchAll(pattern.pattern)];
        
        for (const match of matches) {
          if (match.index !== undefined) {
            // Estimate timing within segment based on text position
            const segmentDuration = segment.end - segment.start;
            const textPosition = match.index / text.length;
            const hesitationTime = segment.start + (textPosition * segmentDuration);
            
            hesitations.push({
              start: hesitationTime,
              end: hesitationTime + 0.5, // Assume 0.5s duration for filler words
              text: match[0],
              speaker,
              hesitationType: pattern.type as any,
              severity: pattern.severity,
              confidence: 0.7 // Medium confidence for text pattern detection
            });
          }
        }
      }
    }

    return hesitations;
  }

  /**
   * Fallback text-only analysis when segments aren't available
   */
  private analyzeText(
    text: string,
    speaker: 'student' | 'teacher',
    language: string,
    duration: number
  ): HesitationSegment[] {
    const hesitations: HesitationSegment[] = [];
    const lowerText = text.toLowerCase();

    // Use patterns but without precise timing
    for (const pattern of this.hesitationPatterns) {
      if (!pattern.languages.includes(language)) continue;
      
      if (pattern.pattern instanceof RegExp) {
        const matches = [...lowerText.matchAll(pattern.pattern)];
        
        for (const match of matches) {
          hesitations.push({
            start: 0,
            end: duration,
            text: match[0],
            speaker,
            hesitationType: pattern.type as any,
            severity: pattern.severity,
            confidence: 0.5 // Lower confidence without timing data
          });
        }
      }
    }

    return hesitations;
  }

  /**
   * Calculate overall hesitation score for a speaker in a session
   */
  private calculateHesitationScore(
    sessionId: string,
    speaker: 'student' | 'teacher',
    newHesitations: HesitationSegment[]
  ): HesitationScore {
    const key = `${sessionId}_${speaker}`;
    const existing = this.sessionHesitations.get(key);
    const now = Date.now();

    // Combine with existing hesitations within analysis window
    let allHesitations = newHesitations;
    if (existing) {
      const windowStart = now - this.ANALYSIS_WINDOW;
      const recentExisting = existing.recentHesitations.filter(h => 
        (h.start * 1000) > windowStart
      );
      allHesitations = [...recentExisting, ...newHesitations];
    }

    // Calculate metrics
    const windowDurationMinutes = this.ANALYSIS_WINDOW / 60000;
    const hesitationRate = allHesitations.length / windowDurationMinutes;
    
    const silences = allHesitations.filter(h => h.hesitationType === 'silence');
    const averageSilenceLength = silences.length > 0 
      ? silences.reduce((sum, h) => sum + (h.end - h.start), 0) / silences.length
      : 0;
    
    const fillerWordCount = allHesitations.filter(h => h.hesitationType === 'filler_word').length;
    
    // Calculate overall score (0-1, where 1 = no hesitation)
    const hesitationDensity = Math.min(hesitationRate / 10, 1); // Normalize to 10 hesitations/minute max
    const silencePenalty = Math.min(averageSilenceLength / 5, 1); // Normalize to 5 seconds max
    const fillerPenalty = Math.min(fillerWordCount / 20, 1); // Normalize to 20 fillers max
    
    const overallScore = Math.max(0, 1 - (
      hesitationDensity * 0.4 + 
      silencePenalty * 0.4 + 
      fillerPenalty * 0.2
    ));

    return {
      sessionId,
      speaker,
      overallScore,
      hesitationRate,
      averageSilenceLength,
      fillerWordCount,
      recentHesitations: allHesitations.slice(-50), // Keep last 50 hesitations
      timestamp: now
    };
  }

  /**
   * Get current hesitation score for a session/speaker
   */
  getHesitationScore(sessionId: string, speaker: 'student' | 'teacher'): HesitationScore | null {
    return this.sessionHesitations.get(`${sessionId}_${speaker}`) || null;
  }

  /**
   * Generate real-time intervention suggestions based on hesitation patterns
   */
  generateInterventions(hesitationScore: HesitationScore): {
    studentHints: string[];
    teacherAlerts: string[];
    quizSuggestions: string[];
  } {
    const interventions = {
      studentHints: [] as string[],
      teacherAlerts: [] as string[], 
      quizSuggestions: [] as string[]
    };

    const score = hesitationScore.overallScore;
    const recentHesitations = hesitationScore.recentHesitations.slice(-5);

    // Student-specific interventions
    if (hesitationScore.speaker === 'student') {
      if (score < 0.3) {
        // High hesitation - provide sentence starters
        interventions.studentHints.push(
          "Try: 'What I mean is...'",
          "Try: 'Let me think about this...'",
          "Try: 'In my opinion...'"
        );
      } else if (score < 0.6) {
        // Medium hesitation - provide vocabulary support
        interventions.studentHints.push(
          "Take your time",
          "Use simple words if needed"
        );
      }

      // Specific pattern-based hints
      if (hesitationScore.fillerWordCount > 5) {
        interventions.studentHints.push("Try pausing instead of using filler words");
      }
      
      if (hesitationScore.averageSilenceLength > 2) {
        interventions.studentHints.push("It's okay to think - try saying 'Let me consider...'");
      }
    }

    // Teacher alerts
    if (score < 0.4) {
      interventions.teacherAlerts.push(
        `${hesitationScore.speaker} showing high hesitation (${Math.round(score * 100)}% fluency)`,
        "Consider switching to easier topic or providing support"
      );
    }

    // Quiz suggestions for low engagement
    if (score < 0.5 && hesitationScore.speaker === 'student') {
      interventions.quizSuggestions.push(
        "Vocabulary review quiz",
        "Sentence completion exercise",
        "Topic-specific practice questions"
      );
    }

    return interventions;
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: string): void {
    const keys = Array.from(this.sessionHesitations.keys()).filter(key => 
      key.startsWith(sessionId)
    );
    keys.forEach(key => this.sessionHesitations.delete(key));
  }

  /**
   * Get session summary for reporting
   */
  getSessionSummary(sessionId: string): {
    studentScore: HesitationScore | null;
    teacherScore: HesitationScore | null;
    overallFluency: number;
    recommendations: string[];
  } {
    const studentScore = this.getHesitationScore(sessionId, 'student');
    const teacherScore = this.getHesitationScore(sessionId, 'teacher');
    
    const overallFluency = studentScore && teacherScore 
      ? (studentScore.overallScore + teacherScore.overallScore) / 2
      : (studentScore?.overallScore || teacherScore?.overallScore || 0);

    const recommendations: string[] = [];
    
    if (studentScore) {
      if (studentScore.fillerWordCount > 10) {
        recommendations.push("Practice speaking without filler words");
      }
      if (studentScore.averageSilenceLength > 3) {
        recommendations.push("Work on speaking confidence and fluency");
      }
      if (studentScore.hesitationRate > 8) {
        recommendations.push("Practice vocabulary to reduce hesitations");
      }
    }

    return {
      studentScore,
      teacherScore,
      overallFluency,
      recommendations
    };
  }
}

// Export singleton instance
export const whisperHesitationDetector = new WhisperHesitationDetector();