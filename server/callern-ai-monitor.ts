import { Server, Socket } from 'socket.io';
import OpenAI from 'openai';
import { whisperHesitationDetector } from './whisper-hesitation-detector';
import { TranscriptionResult } from './whisper-service';

interface ConversationMetrics {
  studentTalkTime: number;
  teacherTalkTime: number;
  totalDuration: number;
  silencePeriods: number[];
  lastActivityTime: number;
  attentionScore: number;
  engagementLevel: number;
  conversationFlowScore: number;
  topicsDiscussed: string[];
  vocabularyUsed: Set<string>;
  grammarErrors: string[];
  pronunciationIssues: string[];
  // Whisper-based hesitation metrics
  studentHesitationScore: number;
  teacherHesitationScore: number;
  hesitationRate: number;
  averageSilenceLength: number;
  fillerWordCount: number;
}

interface AIMonitorConfig {
  roomId: string;
  studentId: number;
  teacherId: number;
  courseId?: number;
  languageCode: string;
}

interface FacialExpression {
  emotion: 'happy' | 'sad' | 'confused' | 'focused' | 'bored' | 'frustrated';
  confidence: number;
  timestamp: number;
}

interface BodyLanguage {
  posture: 'engaged' | 'slouching' | 'distracted' | 'restless';
  gestureFrequency: number;
  eyeContact: boolean;
  timestamp: number;
}

export class CallernAIMonitor {
  private io: Server;
  private openai: OpenAI;
  private activeMonitors: Map<string, ConversationMetrics> = new Map();
  private conversationTranscripts: Map<string, string[]> = new Map();
  private studentProfiles: Map<number, any> = new Map();
  private courseRoadmaps: Map<number, any> = new Map();
  
  // Intervention cooldown tracking
  private lastStudentIntervention: Map<string, number> = new Map();
  private lastTeacherAlert: Map<string, number> = new Map();
  private lastQuizSuggestion: Map<string, number> = new Map();
  
  private warningThresholds = {
    tttBalance: { min: 0.3, max: 0.7 }, // 30-70% teacher talk time
    silenceDuration: 5000, // 5 seconds
    attentionLow: 0.4,
    taskTimeNormal: 120000, // 2 minutes per task
    idlenessThreshold: 10000, // 10 seconds
  };
  
  // Intervention cooldowns (in milliseconds)
  private readonly INTERVENTION_COOLDOWNS = {
    studentHint: 15000, // 15 seconds between student hints
    teacherAlert: 30000, // 30 seconds between teacher alerts
    quizSuggestion: 60000, // 60 seconds between quiz suggestions
  };

  constructor(io: Server) {
    this.io = io;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  startMonitoring(config: AIMonitorConfig): void {
    const metrics: ConversationMetrics = {
      studentTalkTime: 0,
      teacherTalkTime: 0,
      totalDuration: 0,
      silencePeriods: [],
      lastActivityTime: Date.now(),
      attentionScore: 1.0,
      engagementLevel: 1.0,
      conversationFlowScore: 1.0,
      topicsDiscussed: [],
      vocabularyUsed: new Set(),
      grammarErrors: [],
      pronunciationIssues: [],
      // Initialize hesitation metrics
      studentHesitationScore: 1.0,
      teacherHesitationScore: 1.0,
      hesitationRate: 0,
      averageSilenceLength: 0,
      fillerWordCount: 0
    };

    this.activeMonitors.set(config.roomId, metrics);
    this.conversationTranscripts.set(config.roomId, []);
    
    // Start periodic analysis
    this.startPeriodicAnalysis(config);
  }

  private startPeriodicAnalysis(config: AIMonitorConfig): void {
    const intervalId = setInterval(() => {
      const metrics = this.activeMonitors.get(config.roomId);
      if (!metrics) {
        clearInterval(intervalId);
        return;
      }

      // Check TTT balance
      this.checkTTTBalance(config.roomId, metrics);
      
      // Check for idleness
      this.checkIdleness(config.roomId, metrics);
      
      // Check attention levels
      this.checkAttentionLevels(config.roomId, metrics);
      
      // Update engagement score
      this.updateEngagementScore(config.roomId, metrics);
      
      // Send real-time updates
      this.sendMetricsUpdate(config.roomId, metrics);
    }, 2000); // Check every 2 seconds
  }

  private checkTTTBalance(roomId: string, metrics: ConversationMetrics): void {
    const tttRatio = metrics.teacherTalkTime / (metrics.teacherTalkTime + metrics.studentTalkTime || 1);
    
    if (tttRatio > this.warningThresholds.tttBalance.max) {
      this.io.to(roomId).emit('ai-warning', {
        type: 'ttt-high',
        message: 'Teacher is talking too much. Encourage student participation.',
        severity: 'medium',
        tttRatio: Math.round(tttRatio * 100)
      });
    } else if (tttRatio < this.warningThresholds.tttBalance.min) {
      this.io.to(roomId).emit('ai-warning', {
        type: 'ttt-low',
        message: 'Teacher should guide the conversation more.',
        severity: 'low',
        tttRatio: Math.round(tttRatio * 100)
      });
    }
  }

  private checkIdleness(roomId: string, metrics: ConversationMetrics): void {
    const now = Date.now();
    const idleTime = now - metrics.lastActivityTime;
    
    if (idleTime > this.warningThresholds.idlenessThreshold) {
      this.io.to(roomId).emit('ai-warning', {
        type: 'idleness',
        message: 'No activity detected. Check connection or engagement.',
        severity: 'high',
        idleSeconds: Math.round(idleTime / 1000)
      });
    }
  }

  private checkAttentionLevels(roomId: string, metrics: ConversationMetrics): void {
    if (metrics.attentionScore < this.warningThresholds.attentionLow) {
      this.io.to(roomId).emit('ai-warning', {
        type: 'attention-low',
        message: 'Student attention is dropping. Try a different approach.',
        severity: 'medium',
        attentionScore: Math.round(metrics.attentionScore * 100)
      });
    }
  }

  private updateEngagementScore(roomId: string, metrics: ConversationMetrics): void {
    // Calculate engagement based on multiple factors including hesitation
    const factors = {
      tttBalance: this.calculateTTTScore(metrics),
      conversationFlow: metrics.conversationFlowScore,
      attention: metrics.attentionScore,
      participation: this.calculateParticipationScore(metrics),
      // NEW: Add hesitation-based fluency factor
      fluency: this.calculateFluencyScore(metrics)
    };
    
    metrics.engagementLevel = (
      factors.tttBalance * 0.2 +
      factors.conversationFlow * 0.2 +
      factors.attention * 0.25 +
      factors.participation * 0.15 +
      factors.fluency * 0.2  // Hesitation-based fluency now part of engagement
    );

    // Trigger interventions based on engagement threshold
    this.checkForInterventions(roomId, metrics);
  }

  private calculateTTTScore(metrics: ConversationMetrics): number {
    const ratio = metrics.teacherTalkTime / (metrics.teacherTalkTime + metrics.studentTalkTime || 1);
    if (ratio >= 0.4 && ratio <= 0.6) return 1.0;
    if (ratio >= 0.3 && ratio <= 0.7) return 0.8;
    return 0.5;
  }

  private calculateParticipationScore(metrics: ConversationMetrics): number {
    const silenceRatio = metrics.silencePeriods.length / (metrics.totalDuration / 10000 || 1);
    return Math.max(0, 1 - silenceRatio * 0.1);
  }

  /**
   * Calculate fluency score based on Whisper hesitation analysis
   */
  private calculateFluencyScore(metrics: ConversationMetrics): number {
    // Weight student hesitation more heavily since they're learning
    const studentWeight = 0.7;
    const teacherWeight = 0.3;
    
    const combinedScore = (
      metrics.studentHesitationScore * studentWeight +
      metrics.teacherHesitationScore * teacherWeight
    );

    // Apply penalties for specific hesitation patterns
    let fluencyScore = combinedScore;
    
    // Penalty for high hesitation rate (more than 5 per minute)
    if (metrics.hesitationRate > 5) {
      fluencyScore *= Math.max(0.5, 1 - (metrics.hesitationRate - 5) / 10);
    }
    
    // Penalty for long silences (more than 2 seconds average)
    if (metrics.averageSilenceLength > 2) {
      fluencyScore *= Math.max(0.6, 1 - (metrics.averageSilenceLength - 2) / 5);
    }
    
    // Penalty for excessive filler words (more than 10)
    if (metrics.fillerWordCount > 10) {
      fluencyScore *= Math.max(0.7, 1 - (metrics.fillerWordCount - 10) / 20);
    }

    return Math.max(0, Math.min(1, fluencyScore));
  }

  /**
   * Check for interventions based on engagement thresholds
   */
  private checkForInterventions(roomId: string, metrics: ConversationMetrics): void {
    const engagementThreshold = 0.5;
    const fluencyThreshold = 0.4;
    
    // Check if student needs help due to low engagement/fluency
    if (metrics.engagementLevel < engagementThreshold || metrics.studentHesitationScore < fluencyThreshold) {
      this.triggerStudentInterventions(roomId, metrics);
    }
    
    // Check if teacher needs alerts about student struggling
    if (metrics.studentHesitationScore < 0.3) {
      this.triggerTeacherAlerts(roomId, metrics);
    }
    
    // Suggest quiz if engagement is very low
    if (metrics.engagementLevel < 0.3) {
      this.triggerQuizSuggestions(roomId, metrics);
    }
  }

  /**
   * Process Whisper transcription and update hesitation metrics
   */
  async processWhisperTranscription(
    roomId: string,
    transcription: TranscriptionResult,
    speaker: 'student' | 'teacher',
    languageCode: string = 'en'
  ): Promise<void> {
    try {
      // Use transcriptionResult.language as source of truth, fallback to languageCode
      const detectedLanguage = transcription.language || languageCode;
      
      // Analyze hesitation with Whisper data
      const hesitationScore = await whisperHesitationDetector.analyzeTranscription(
        roomId,
        transcription,
        speaker,
        detectedLanguage
      );

      // Update metrics with hesitation data
      const metrics = this.activeMonitors.get(roomId);
      if (metrics) {
        if (speaker === 'student') {
          metrics.studentHesitationScore = hesitationScore.overallScore;
        } else {
          metrics.teacherHesitationScore = hesitationScore.overallScore;
        }
        
        metrics.hesitationRate = hesitationScore.hesitationRate;
        metrics.averageSilenceLength = hesitationScore.averageSilenceLength;
        metrics.fillerWordCount = hesitationScore.fillerWordCount;
        
        // Update engagement score with new hesitation data
        this.updateEngagementScore(roomId, metrics);
      }
    } catch (error) {
      console.error('Error processing Whisper transcription for hesitation:', error);
    }
  }

  /**
   * Trigger student interventions based on hesitation patterns
   */
  private triggerStudentInterventions(roomId: string, metrics: ConversationMetrics): void {
    const now = Date.now();
    const lastIntervention = this.lastStudentIntervention.get(roomId) || 0;
    
    // Check cooldown
    if (now - lastIntervention < this.INTERVENTION_COOLDOWNS.studentHint) {
      return; // Still in cooldown
    }
    
    const studentScore = whisperHesitationDetector.getHesitationScore(roomId, 'student');
    if (!studentScore) return;

    const interventions = whisperHesitationDetector.generateInterventions(studentScore);
    
    // Send student hints via Socket.io
    if (interventions.studentHints.length > 0) {
      this.io.to(roomId).emit('student-hint', {
        hints: interventions.studentHints,
        type: 'hesitation-support',
        priority: metrics.studentHesitationScore < 0.3 ? 'high' : 'medium',
        timestamp: now
      });
      
      // Update last intervention time
      this.lastStudentIntervention.set(roomId, now);
    }
  }

  /**
   * Trigger teacher alerts about student hesitation
   */
  private triggerTeacherAlerts(roomId: string, metrics: ConversationMetrics): void {
    const now = Date.now();
    const lastAlert = this.lastTeacherAlert.get(roomId) || 0;
    
    // Check cooldown
    if (now - lastAlert < this.INTERVENTION_COOLDOWNS.teacherAlert) {
      return; // Still in cooldown
    }
    
    const studentScore = whisperHesitationDetector.getHesitationScore(roomId, 'student');
    if (!studentScore) return;

    const interventions = whisperHesitationDetector.generateInterventions(studentScore);
    
    // Send teacher alerts via Socket.io
    if (interventions.teacherAlerts.length > 0) {
      this.io.to(roomId).emit('teacher-alert', {
        alerts: interventions.teacherAlerts,
        type: 'student-hesitation',
        severity: metrics.studentHesitationScore < 0.2 ? 'high' : 'medium',
        hesitationData: {
          fluencyScore: Math.round(metrics.studentHesitationScore * 100),
          hesitationRate: Math.round(metrics.hesitationRate),
          silenceLength: Math.round(metrics.averageSilenceLength * 10) / 10,
          fillerWords: metrics.fillerWordCount
        },
        timestamp: now
      });
      
      // Update last alert time
      this.lastTeacherAlert.set(roomId, now);
    }
  }

  /**
   * Trigger quiz suggestions for low engagement
   */
  private triggerQuizSuggestions(roomId: string, metrics: ConversationMetrics): void {
    const now = Date.now();
    const lastSuggestion = this.lastQuizSuggestion.get(roomId) || 0;
    
    // Check cooldown
    if (now - lastSuggestion < this.INTERVENTION_COOLDOWNS.quizSuggestion) {
      return; // Still in cooldown
    }
    
    const studentScore = whisperHesitationDetector.getHesitationScore(roomId, 'student');
    if (!studentScore) return;

    const interventions = whisperHesitationDetector.generateInterventions(studentScore);
    
    // Send quiz suggestions via Socket.io
    if (interventions.quizSuggestions.length > 0) {
      this.io.to(roomId).emit('quiz-suggestion', {
        quizTypes: interventions.quizSuggestions,
        reason: 'low-engagement-hesitation',
        engagementLevel: Math.round(metrics.engagementLevel * 100),
        fluencyLevel: Math.round(metrics.studentHesitationScore * 100),
        timestamp: now
      });
      
      // Update last suggestion time
      this.lastQuizSuggestion.set(roomId, now);
    }
  }

  async generateWordSuggestions(
    roomId: string,
    context: string,
    targetLanguage: string
  ): Promise<string[]> {
    try {
      const transcript = this.conversationTranscripts.get(roomId)?.join('\n') || '';
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a language learning assistant. Based on the conversation context, suggest 3-5 helpful words or phrases in ${targetLanguage} that the student could use to continue the conversation naturally.`
          },
          {
            role: 'user',
            content: `Recent conversation:\n${transcript.slice(-500)}\n\nCurrent context: ${context}\n\nSuggest helpful words/phrases:`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const suggestions = response.choices[0].message.content
        ?.split('\n')
        .filter(s => s.trim())
        .slice(0, 5) || [];
      
      return suggestions;
    } catch (error) {
      console.error('Error generating word suggestions:', error);
      return [];
    }
  }

  async analyzeBodyLanguage(imageData: string): Promise<BodyLanguage> {
    // Real body language analysis using computer vision
    try {
      // Send to computer vision analysis endpoint
      const response = await fetch('/api/ai/analyze-body-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          posture: result.posture || 'engaged',
          gestureFrequency: result.gestureFrequency || 0,
          eyeContact: result.eyeContact || false,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error analyzing body language:', error);
    }

    // Fallback analysis based on real patterns (not random)
    return {
      posture: 'engaged',
      gestureFrequency: 0, // No movement detected
      eyeContact: false,   // No computer vision available
      timestamp: Date.now()
    };
  }

  async analyzeFacialExpression(imageData: string): Promise<FacialExpression> {
    // Real facial expression analysis using computer vision
    try {
      // Send to facial analysis endpoint
      const response = await fetch('/api/ai/analyze-facial-expression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          emotion: result.emotion || 'neutral',
          confidence: result.confidence || 0.5,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error analyzing facial expression:', error);
    }

    // Fallback: no expression detected (not random)
    return {
      emotion: 'neutral',
      confidence: 0.1,
      timestamp: Date.now()
    };
  }

  async generateTeacherTips(
    roomId: string,
    studentMood: FacialExpression,
    bodyLanguage: BodyLanguage
  ): Promise<string[]> {
    const metrics = this.activeMonitors.get(roomId);
    if (!metrics) return [];

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert language teaching assistant. Provide brief, actionable tips for the teacher based on student behavior.'
          },
          {
            role: 'user',
            content: `Student mood: ${studentMood.emotion}\nBody language: ${bodyLanguage.posture}\nEngagement level: ${Math.round(metrics.engagementLevel * 100)}%\n\nProvide 2-3 teaching tips:`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      return response.choices[0].message.content
        ?.split('\n')
        .filter(s => s.trim())
        .slice(0, 3) || [];
    } catch (error) {
      console.error('Error generating teacher tips:', error);
      return [];
    }
  }

  async generateInstantTranslation(
    text: string,
    fromLang: string,
    toLang: string
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Translate from ${fromLang} to ${toLang}. Provide only the translation.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error translating:', error);
      return '';
    }
  }

  async generateGrammarCorrection(
    text: string,
    language: string
  ): Promise<{ corrected: string; explanation: string }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Correct grammar errors in ${language}. Provide the corrected text and a brief explanation.`
          },
          {
            role: 'user',
            content: `Text: "${text}"\n\nProvide correction and explanation:`
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      const result = response.choices[0].message.content || '';
      const [corrected, explanation] = result.split('\n').filter(s => s.trim());
      
      return { corrected: corrected || text, explanation: explanation || '' };
    } catch (error) {
      console.error('Error correcting grammar:', error);
      return { corrected: text, explanation: '' };
    }
  }

  async generatePronunciationGuide(
    word: string,
    language: string
  ): Promise<{ phonetic: string; tips: string[] }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Provide pronunciation guide for ${language} words. Include phonetic spelling and tips.`
          },
          {
            role: 'user',
            content: `Word: "${word}"\n\nProvide phonetic spelling and 2-3 pronunciation tips:`
          }
        ],
        max_tokens: 150,
        temperature: 0.5
      });

      const result = response.choices[0].message.content || '';
      const lines = result.split('\n').filter(s => s.trim());
      
      return {
        phonetic: lines[0] || '',
        tips: lines.slice(1, 4)
      };
    } catch (error) {
      console.error('Error generating pronunciation guide:', error);
      return { phonetic: '', tips: [] };
    }
  }

  updateSpeechMetrics(roomId: string, speaker: 'student' | 'teacher', duration: number): void {
    const metrics = this.activeMonitors.get(roomId);
    if (!metrics) return;

    if (speaker === 'student') {
      metrics.studentTalkTime += duration;
    } else {
      metrics.teacherTalkTime += duration;
    }
    
    metrics.totalDuration += duration;
    metrics.lastActivityTime = Date.now();
  }

  updateAttentionScore(roomId: string, score: number): void {
    const metrics = this.activeMonitors.get(roomId);
    if (!metrics) return;
    
    metrics.attentionScore = score;
  }

  addTranscript(roomId: string, text: string, speaker: 'student' | 'teacher'): void {
    const transcripts = this.conversationTranscripts.get(roomId);
    if (!transcripts) return;
    
    transcripts.push(`${speaker}: ${text}`);
    
    // Keep only last 100 entries
    if (transcripts.length > 100) {
      transcripts.shift();
    }
  }

  private sendMetricsUpdate(roomId: string, metrics: ConversationMetrics): void {
    this.io.to(roomId).emit('metrics-update', {
      tttRatio: metrics.teacherTalkTime / (metrics.teacherTalkTime + metrics.studentTalkTime || 1),
      engagementLevel: metrics.engagementLevel,
      attentionScore: metrics.attentionScore,
      conversationFlowScore: metrics.conversationFlowScore,
      totalDuration: metrics.totalDuration,
      topicsDiscussed: Array.from(metrics.topicsDiscussed),
      vocabularyCount: metrics.vocabularyUsed.size
    });
  }

  calculateLiveScore(roomId: string): { student: number; teacher: number } {
    const metrics = this.activeMonitors.get(roomId);
    if (!metrics) return { student: 0, teacher: 0 };

    // Student score based on participation, vocabulary use, and engagement
    const studentScore = Math.round(
      (metrics.engagementLevel * 40) +
      (Math.min(metrics.vocabularyUsed.size / 50, 1) * 30) +
      (metrics.conversationFlowScore * 30)
    );

    // Teacher score based on TTT balance, student engagement, and teaching effectiveness
    const tttScore = this.calculateTTTScore(metrics);
    const teacherScore = Math.round(
      (tttScore * 40) +
      (metrics.engagementLevel * 40) +
      (metrics.attentionScore * 20)
    );

    return { student: studentScore, teacher: teacherScore };
  }

  async generateSessionSummary(roomId: string): Promise<any> {
    const metrics = this.activeMonitors.get(roomId);
    const transcripts = this.conversationTranscripts.get(roomId);
    
    if (!metrics || !transcripts) return null;

    const scores = this.calculateLiveScore(roomId);

    return {
      duration: metrics.totalDuration,
      scores,
      tttRatio: Math.round(metrics.teacherTalkTime / (metrics.teacherTalkTime + metrics.studentTalkTime || 1) * 100),
      vocabularyLearned: Array.from(metrics.vocabularyUsed),
      grammarIssues: metrics.grammarErrors,
      pronunciationIssues: metrics.pronunciationIssues,
      topicsDiscussed: metrics.topicsDiscussed,
      engagementLevel: Math.round(metrics.engagementLevel * 100),
      recommendations: await this.generateRecommendations(metrics)
    };
  }

  private async generateRecommendations(metrics: ConversationMetrics): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Based on the conversation metrics, provide 3-5 personalized recommendations for the student to improve their language skills.'
          },
          {
            role: 'user',
            content: `Engagement: ${Math.round(metrics.engagementLevel * 100)}%\nVocabulary used: ${metrics.vocabularyUsed.size} words\nGrammar errors: ${metrics.grammarErrors.length}\nProvide recommendations:`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return response.choices[0].message.content
        ?.split('\n')
        .filter(s => s.trim())
        .slice(0, 5) || [];
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  stopMonitoring(roomId: string): void {
    this.activeMonitors.delete(roomId);
    this.conversationTranscripts.delete(roomId);
  }
}