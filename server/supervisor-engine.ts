import { EventEmitter } from 'events';
import { Server } from 'socket.io';
import { OllamaService } from './ollama-service';
import { AudioProcessor } from './audio-processor';

interface Event {
  timestamp: string;
  speaker: 'teacher' | 'student';
  type: string;
  target?: string;
  utterance?: string;
}

interface Tip {
  role: 'teacher' | 'student';
  text: string;
  priority: 'high' | 'medium' | 'low';
  context?: string;
}

interface SessionState {
  sessionId: string;
  lessonTitle: string;
  objectives: string[];
  events: Event[];
  metrics: {
    ttt: number; // Teacher talk time percentage
    stt: number; // Student talk time percentage
    turns: number;
    waitTime: number[];
    silencePeriods: number[];
  };
  feedbackStack: any[];
  lastTeacherTip: number;
  lastStudentTip: number;
  currentTopic: string;
  studentLevel: string;
}

export class SupervisorEngine extends EventEmitter {
  private sessions: Map<string, SessionState> = new Map();
  private io: Server;
  private ollama: OllamaService;
  private audioProcessor: AudioProcessor;
  
  // Rate limiting
  private readonly TIP_COOLDOWN_MS = 20000; // 20 seconds between tips per role
  private readonly EVENT_WINDOW_MS = 10000; // Analyze last 10 seconds
  
  // Event types for classification
  private readonly EVENT_TYPES = [
    'ICQ', 'CCQ', 'prompt', 'student_attempt', 'idea_request', 'hesitation',
    'scaffold_request', 'error_form', 'error_lex', 'error_pron',
    'feedback_recast', 'feedback_explicit', 'feedback_elicitation',
    'praise', 'instruction', 'task_transition', 'check_understanding'
  ];

  constructor(io: Server, audioProcessor: AudioProcessor) {
    super();
    this.io = io;
    this.ollama = new OllamaService();
    this.audioProcessor = audioProcessor;
    
    // Listen to transcripts from audio processor
    this.audioProcessor.on('transcript-ready', this.handleTranscript.bind(this));
  }

  /**
   * Initialize a new session
   */
  initSession(data: {
    sessionId: string;
    lessonTitle: string;
    objectives: string[];
    studentLevel: string;
  }): void {
    this.sessions.set(data.sessionId, {
      sessionId: data.sessionId,
      lessonTitle: data.lessonTitle,
      objectives: data.objectives || [],
      events: [],
      metrics: {
        ttt: 50,
        stt: 50,
        turns: 0,
        waitTime: [],
        silencePeriods: []
      },
      feedbackStack: [],
      lastTeacherTip: 0,
      lastStudentTip: 0,
      currentTopic: '',
      studentLevel: data.studentLevel || 'B1'
    });
    
    // Start periodic analysis
    this.startAnalysisLoop(data.sessionId);
  }

  /**
   * Handle new transcript segment
   */
  private async handleTranscript(data: {
    sessionId: string;
    segment: any;
    context: string;
  }): Promise<void> {
    const session = this.sessions.get(data.sessionId);
    if (!session) return;
    
    // Extract events from transcript
    const events = await this.extractEvents(
      data.segment,
      data.context,
      session.lessonTitle,
      session.objectives
    );
    
    // Add events to session
    session.events.push(...events);
    
    // Update metrics
    this.updateMetrics(session, data.segment);
    
    // Generate tips if cooldown has passed
    await this.generateTips(session);
  }

  /**
   * Extract pedagogical events from transcript using LLM
   */
  private async extractEvents(
    segment: any,
    context: string,
    lessonTitle: string,
    objectives: string[]
  ): Promise<Event[]> {
    try {
      const systemPrompt = `You are an ELT classroom event tagger. Output STRICT JSON array of events.
Allowed event types: ${this.EVENT_TYPES.join(', ')}
Each event must have: timestamp, speaker, type, and optionally target and utterance.
Only tag events that actually occur in the transcript. No hallucination.`;

      const userPrompt = `Lesson: ${lessonTitle}
Objectives: ${objectives.join(', ')}

Recent context:
${context}

New utterance:
${segment.speaker}: ${segment.text}

Tag pedagogical events in this utterance. Output JSON array only.`;

      const response = await this.ollama.generateCompletion(userPrompt, systemPrompt, {
        temperature: 0.2,
        model: 'llama3.2:3b'
      });
      
      try {
        // Parse JSON response
        // Try to parse as JSON, fallback if not valid JSON
        let parsed;
        try {
          parsed = JSON.parse(response);
        } catch (parseError) {
          console.log('Event extraction response not JSON, skipping');
          return [];
        }
        const events = Array.isArray(parsed) ? parsed : parsed.events || [];
        
        // Validate and clean events
        return events
          .filter(e => e.type && this.EVENT_TYPES.includes(e.type))
          .map(e => ({
            timestamp: new Date().toISOString(),
            speaker: segment.speaker,
            type: e.type,
            target: e.target,
            utterance: segment.text
          }));
      } catch (parseError) {
        console.log('Event extraction parse error, using fallback');
        return this.getFallbackEvents(segment);
      }
    } catch (error) {
      console.error('Event extraction error:', error);
      return this.getFallbackEvents(segment);
    }
  }

  /**
   * Fallback event detection without LLM
   */
  private getFallbackEvents(segment: any): Event[] {
    const events: Event[] = [];
    const text = segment.text.toLowerCase();
    const timestamp = new Date().toISOString();
    
    // Simple pattern-based event detection
    if (text.includes('?')) {
      if (segment.speaker === 'teacher') {
        if (text.includes('do you understand') || text.includes('clear')) {
          events.push({ timestamp, speaker: 'teacher', type: 'CCQ' });
        } else {
          events.push({ timestamp, speaker: 'teacher', type: 'prompt' });
        }
      } else {
        events.push({ timestamp, speaker: 'student', type: 'idea_request' });
      }
    }
    
    if (text.includes('good') || text.includes('excellent') || text.includes('well done')) {
      events.push({ timestamp, speaker: segment.speaker, type: 'praise' });
    }
    
    if (text.includes('um') || text.includes('uh') || text.includes('...')) {
      events.push({ timestamp, speaker: segment.speaker, type: 'hesitation' });
    }
    
    if (segment.speaker === 'student' && text.length > 10) {
      events.push({ timestamp, speaker: 'student', type: 'student_attempt' });
    }
    
    return events;
  }

  /**
   * Update session metrics
   */
  private updateMetrics(session: SessionState, segment: any): void {
    // Update turn count
    session.metrics.turns++;
    
    // Update TTT/STT based on audio processor stats
    const stats = this.audioProcessor.getSpeakingStats(session.sessionId);
    const total = stats.teacher + stats.student || 1;
    
    session.metrics.ttt = Math.round((stats.teacher / total) * 100);
    session.metrics.stt = Math.round((stats.student / total) * 100);
    
    // Track wait time for questions
    const lastTeacherQuestion = session.events
      .filter(e => e.speaker === 'teacher' && e.type === 'prompt')
      .pop();
    
    if (lastTeacherQuestion && segment.speaker === 'student') {
      const waitTime = Date.now() - new Date(lastTeacherQuestion.timestamp).getTime();
      session.metrics.waitTime.push(waitTime);
    }
  }

  /**
   * Generate contextual tips for teacher and student
   */
  private async generateTips(session: SessionState): Promise<void> {
    const now = Date.now();
    
    // Check cooldowns
    const canSendTeacherTip = now - session.lastTeacherTip > this.TIP_COOLDOWN_MS;
    const canSendStudentTip = now - session.lastStudentTip > this.TIP_COOLDOWN_MS;
    
    if (!canSendTeacherTip && !canSendStudentTip) return;
    
    // Get recent events for context
    const recentEvents = session.events.slice(-10);
    
    try {
      const systemPrompt = `You output at most ONE short actionable tip per role per request.
Focus on the NEXT move, not critique.
Teacher tips: pedagogy, staging, ICQ/CCQ, corrective feedback choices.
Student tips: openers, gap fillers, collocations, sentence starters, idea seeds.
If hesitation detected, offer 1-2 helper words only.
Return JSON: {"teacher_tip":"...", "student_tip":"..."} with each tip ≤ 18 words.`;

      const userPrompt = `Lesson: ${session.lessonTitle}
Student Level: ${session.studentLevel}
TTT: ${session.metrics.ttt}%, STT: ${session.metrics.stt}%
Recent events: ${JSON.stringify(recentEvents.map(e => e.type))}

Current situation:
- Turns: ${session.metrics.turns}
- Average wait time: ${session.metrics.waitTime.length > 0 ? 
    Math.round(session.metrics.waitTime.reduce((a,b) => a+b, 0) / session.metrics.waitTime.length / 1000) : 0}s

Generate ONE contextual tip for ${canSendTeacherTip ? 'teacher' : ''} ${canSendStudentTip ? 'student' : ''}.`;

      const response = await this.ollama.generateCompletion(userPrompt, systemPrompt, {
        temperature: 0.3,
        model: 'llama3.2:3b'
      });
      
      try {
        // Try to parse as JSON, fallback if not valid JSON
        let tips;
        try {
          tips = JSON.parse(response);
        } catch (parseError) {
          console.log('Tips response not JSON, using fallback');
          return this.getFallbackTips(forRole);
        }
        
        // Send teacher tip
        if (canSendTeacherTip && tips.teacher_tip) {
          this.io.to(session.sessionId).emit('teacher-tip', {
            text: tips.teacher_tip,
            priority: this.getTipPriority(session, 'teacher')
          });
          session.lastTeacherTip = now;
        }
        
        // Send student tip
        if (canSendStudentTip && tips.student_tip) {
          this.io.to(session.sessionId).emit('student-tip', {
            text: tips.student_tip,
            priority: this.getTipPriority(session, 'student')
          });
          session.lastStudentTip = now;
        }
      } catch (parseError) {
        console.log('Tip generation parse error, using fallback');
        this.sendFallbackTips(session, canSendTeacherTip, canSendStudentTip);
      }
    } catch (error) {
      console.error('Tip generation error:', error);
      this.sendFallbackTips(session, canSendTeacherTip, canSendStudentTip);
    }
  }

  /**
   * Send fallback tips when LLM fails
   */
  private sendFallbackTips(
    session: SessionState, 
    canSendTeacherTip: boolean, 
    canSendStudentTip: boolean
  ): void {
    const now = Date.now();
    
    if (canSendTeacherTip) {
      let tip = '';
      
      if (session.metrics.ttt > 60) {
        tip = 'Reduce talk time, encourage student';
      } else if (session.metrics.stt < 30) {
        tip = 'Ask open-ended questions';
      } else if (session.metrics.waitTime.length > 0 && 
                 session.metrics.waitTime[session.metrics.waitTime.length - 1] < 2000) {
        tip = 'Wait 3-5 seconds after questions';
      } else {
        tip = 'Check student understanding with CCQs';
      }
      
      this.io.to(session.sessionId).emit('teacher-tip', {
        text: tip,
        priority: 'medium'
      });
      session.lastTeacherTip = now;
    }
    
    if (canSendStudentTip) {
      let tip = '';
      const hasHesitation = session.events.slice(-3).some(e => e.type === 'hesitation');
      
      if (hasHesitation) {
        tip = 'Try: "Can you explain..." or "I think..."';
      } else if (session.metrics.stt < 40) {
        tip = 'Express your ideas freely';
      } else {
        tip = 'Great participation! Keep going';
      }
      
      this.io.to(session.sessionId).emit('student-tip', {
        text: tip,
        priority: 'low'
      });
      session.lastStudentTip = now;
    }
  }

  /**
   * Determine tip priority based on session state
   */
  private getTipPriority(session: SessionState, role: 'teacher' | 'student'): 'high' | 'medium' | 'low' {
    if (role === 'teacher') {
      if (session.metrics.ttt > 70) return 'high';
      if (session.metrics.ttt > 60) return 'medium';
      return 'low';
    } else {
      const hasHesitation = session.events.slice(-3).some(e => e.type === 'hesitation');
      if (hasHesitation) return 'high';
      if (session.metrics.stt < 30) return 'medium';
      return 'low';
    }
  }

  /**
   * Add item to delayed feedback stack
   */
  addToFeedbackStack(sessionId: string, item: any): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.feedbackStack.push({
        ...item,
        timestamp: Date.now()
      });
      
      // Emit update to teacher
      this.io.to(sessionId).emit('feedback-stack-update', session.feedbackStack);
    }
  }

  /**
   * Get delayed feedback stack
   */
  getFeedbackStack(sessionId: string): any[] {
    const session = this.sessions.get(sessionId);
    return session ? session.feedbackStack : [];
  }

  /**
   * Start periodic analysis loop
   */
  private startAnalysisLoop(sessionId: string): void {
    const intervalId = setInterval(async () => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        clearInterval(intervalId);
        return;
      }
      
      // Emit real-time metrics
      this.io.to(sessionId).emit('metrics-update', {
        ttt: session.metrics.ttt,
        stt: session.metrics.stt,
        turns: session.metrics.turns,
        avgWaitTime: session.metrics.waitTime.length > 0 ?
          Math.round(session.metrics.waitTime.reduce((a,b) => a+b, 0) / session.metrics.waitTime.length / 1000) : 0
      });
      
      // Check for TTT imbalance
      if (session.metrics.ttt > 60) {
        this.io.to(sessionId).emit('ai-warning', {
          type: 'ttt-imbalance',
          message: 'Teacher dominating - encourage student',
          severity: 'medium'
        });
      }
      
    }, 5000); // Every 5 seconds
  }

  /**
   * End session and cleanup
   */
  endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.audioProcessor.clearSession(sessionId);
  }

  /**
   * Generate session report
   */
  async generateReport(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    try {
      const systemPrompt = `Write a concise session report aligned to the lesson objectives.
Ground ONLY in provided events + metrics. Output JSON:
{"session_title":"", "what_student_learned":["..."],
"evidence":[{"event_ref":0,"note":"..."}],
"scores":{"accuracy":1-5,"fluency":1-5,"task_completion":1-5},
"next_steps":["..."]}`;

      const userPrompt = `Lesson: ${session.lessonTitle}
Objectives: ${session.objectives.join(', ')}
Student Level: ${session.studentLevel}

Metrics:
- TTT: ${session.metrics.ttt}%, STT: ${session.metrics.stt}%
- Total turns: ${session.metrics.turns}
- Events: ${JSON.stringify(session.events.map(e => ({ type: e.type, speaker: e.speaker })))}

Generate session report.`;

      const response = await this.ollama.generateCompletion(userPrompt, systemPrompt, {
        temperature: 0.3,
        model: 'llama3.2:3b'
      });
      
      // Try to parse as JSON, fallback if not valid JSON
      try {
        return JSON.parse(response);
      } catch (parseError) {
        // If response is not JSON, use fallback
        console.log('Response not JSON, using fallback report');
        return this.getFallbackReport(session);
      }
    } catch (error) {
      console.error('Report generation error:', error);
      return this.getFallbackReport(session);
    }
  }

  /**
   * Fallback report when LLM fails
   */
  private getFallbackReport(session: SessionState): any {
    return {
      session_title: session.lessonTitle,
      what_student_learned: [
        'Practiced conversation skills',
        'Engaged in interactive dialogue',
        'Applied lesson vocabulary'
      ],
      evidence: session.events.slice(0, 3).map((e, i) => ({
        event_ref: i,
        note: `${e.speaker} ${e.type}`
      })),
      scores: {
        accuracy: session.metrics.stt > 40 ? 4 : 3,
        fluency: session.metrics.turns > 20 ? 4 : 3,
        task_completion: 3
      },
      next_steps: [
        session.metrics.stt < 40 ? 'Increase speaking time' : 'Maintain good participation',
        'Review vocabulary from today',
        'Practice pronunciation'
      ]
    };
  }
}